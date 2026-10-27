import type {
  ChatCompletionOptions,
  ChatMessage,
  ConnectionMode,
  InferencePort,
} from '../domain/ports';

export const DEFAULT_LOOPBACK_ENDPOINT = 'http://127.0.0.1:1234/v1';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function classifyHost(hostname: string): ConnectionMode | null {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '[::1]') {
    return 'loopback';
  }

  const ipv4Parts = lower.split('.');
  if (ipv4Parts.length !== 4) {
    return null;
  }

  const octets = ipv4Parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return NaN;
    return Number(part);
  });

  if (octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }

  const [a, b] = octets;
  if (a === 127) {
    return 'loopback';
  }
  if (a === 10) {
    return 'lan';
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return 'lan';
  }
  if (a === 192 && b === 168) {
    return 'lan';
  }

  return null;
}

export class LmStudioHttpAdapter implements InferencePort {
  private endpointUrl: string = DEFAULT_LOOPBACK_ENDPOINT;
  private connectionMode: ConnectionMode = 'loopback';
  private readonly fetchFn: FetchLike;

  constructor(
    initialEndpointUrl: string = DEFAULT_LOOPBACK_ENDPOINT,
    fetchFn: FetchLike = (input, init) => globalThis.fetch(input, init)
  ) {
    this.fetchFn = fetchFn;
    this.setEndpointUrl(initialEndpointUrl);
  }

  getEndpointUrl(): string {
    return this.endpointUrl;
  }

  getConnectionMode(): ConnectionMode {
    return this.connectionMode;
  }

  setEndpointUrl(rawUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      throw new Error(`URL non valido: "${rawUrl}". Inserire un URL HTTP/HTTPS valido.`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(
        `Protocollo non valido "${parsed.protocol}". Sono ammessi solo http: o https: su loopback/LAN.`
      );
    }

    const mode = classifyHost(parsed.hostname);
    if (!mode) {
      throw new Error(
        `Host "${parsed.hostname}" rifiutato per isolamento regime zero-data (ADR-0001). Sono ammessi esclusivamente indirizzi in modalità Standalone Loopback (127.0.0.1, localhost) o modalità endpoint LAN su subnet private RFC 1918 (10.x.x.x, 172.16-31.x.x, 192.168.x.x).`
      );
    }

    const normalized = parsed.toString().replace(/\/+$/, '');
    this.endpointUrl = normalized;
    this.connectionMode = mode;
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetchFn(`${this.endpointUrl}/models`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status} interrogando GET /v1/models`);
    }

    const payload = (await response.json()) as { data?: Array<{ id?: string }> };
    if (!Array.isArray(payload.data)) {
      return [];
    }

    return payload.data
      .map((item) => (typeof item.id === 'string' ? item.id.trim() : ''))
      .filter((id) => id.length > 0);
  }

  async completeChat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const isStream = Boolean(options.stream);
    const body = {
      ...(options.model ? { model: options.model } : {}),
      messages,
      temperature: options.temperature ?? 0.3,
      stream: isStream,
    };

    const response = await this.fetchFn(`${this.endpointUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status} su POST /v1/chat/completions`);
    }

    if (!isStream) {
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const rawContent = data.choices?.[0]?.message?.content ?? '';
      return rawContent.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
    }

    if (!response.body) {
      return '';
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulated = '';
    let inThinkBlock = false;
    let pendingContent = '';

    const findPartialTagPrefixIndex = (text: string, tag: string): number => {
      const maxLen = Math.min(text.length, tag.length - 1);
      for (let len = maxLen; len >= 1; len--) {
        if (text.endsWith(tag.slice(0, len))) {
          return text.length - len;
        }
      }
      return -1;
    };

    const emitContent = (chunk: string) => {
      if (!chunk) return;
      accumulated += chunk;
      options.onToken?.(chunk);
    };

    const emitReasoning = (chunk: string) => {
      if (!chunk) return;
      options.onReasoningToken?.(chunk);
    };

    const consumeContentChunk = (chunk: string, flushAll = false) => {
      pendingContent += chunk;

      while (pendingContent.length > 0) {
        const activeTag = inThinkBlock ? '</think>' : '<think>';
        const emitCurrent = inThinkBlock ? emitReasoning : emitContent;

        const tagIdx = pendingContent.indexOf(activeTag);
        if (tagIdx >= 0) {
          emitCurrent(pendingContent.slice(0, tagIdx));
          const remainder = pendingContent.slice(tagIdx + activeTag.length);
          pendingContent = inThinkBlock ? remainder.replace(/^\r?\n/, '') : remainder;
          inThinkBlock = !inThinkBlock;
          continue;
        }

        if (!flushAll) {
          const partialIdx = findPartialTagPrefixIndex(pendingContent, activeTag);
          if (partialIdx >= 0) {
            emitCurrent(pendingContent.slice(0, partialIdx));
            pendingContent = pendingContent.slice(partialIdx);
            break;
          }
        }

        emitCurrent(pendingContent);
        pendingContent = '';
        break;
      }
    };

    const processLine = (rawLine: string) => {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) return;
      const dataStr = line.slice(5).trim();
      if (dataStr === '[DONE]' || dataStr.length === 0) return;

      try {
        const parsed = JSON.parse(dataStr) as {
          choices?: Array<{
            delta?: { content?: string; reasoning_content?: string; reasoning?: string };
            message?: { content?: string; reasoning_content?: string };
          }>;
        };
        const choice = parsed.choices?.[0];
        const reasoningToken =
          choice?.delta?.reasoning_content ??
          choice?.delta?.reasoning ??
          choice?.message?.reasoning_content ??
          '';
        if (reasoningToken) {
          emitReasoning(reasoningToken);
        }

        const token = choice?.delta?.content ?? choice?.message?.content ?? '';
        if (token) {
          consumeContentChunk(token, false);
        }
      } catch {
        // Ignora righe SSE malformate non JSON
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        processLine(rawLine);
      }
    }

    if (buffer.trim().length > 0) {
      for (const rawLine of buffer.split(/\r?\n/)) {
        processLine(rawLine);
      }
    }

    if (pendingContent.length > 0) {
      consumeContentChunk('', true);
    }

    return accumulated;
  }
}
