import type {
  ChatCompletionOptions,
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
} from '../src/domain/ports';

export class FakeInferencePort implements InferencePort {
  private endpointUrl = 'http://127.0.0.1:1234/v1';
  private mode: ConnectionMode = 'loopback';
  public models: string[] = ['qwen2.5-coder-7b-instruct'];
  public shouldFailConnection = false;
  public cannedReasoning = '';
  public cannedReply = 'Quale variabile controlla la terminazione del ciclo?';
  public lastMessages: ChatMessage[] = [];
  public streamDelayMs = 0;

  getEndpointUrl(): string {
    return this.endpointUrl;
  }

  setEndpointUrl(url: string): void {
    if (
      url.startsWith('http://127.0.0.1') ||
      url.startsWith('http://localhost')
    ) {
      this.mode = 'loopback';
      this.endpointUrl = url;
      return;
    }
    if (
      url.startsWith('http://192.168.') ||
      url.startsWith('http://10.') ||
      url.startsWith('http://172.16.')
    ) {
      this.mode = 'lan';
      this.endpointUrl = url;
      return;
    }
    throw new Error(
      'Host rifiutato per isolamento Regime Zero-Data: ammessi solo Loopback o subnet LAN RFC 1918'
    );
  }

  getConnectionMode(): ConnectionMode {
    return this.mode;
  }

  async listModels(): Promise<string[]> {
    if (this.shouldFailConnection) {
      throw new Error('Connessione rifiutata');
    }
    return this.models;
  }

  async completeChat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string> {
    if (this.shouldFailConnection) {
      throw new Error('Motore di Inferenza non raggiungibile');
    }
    this.lastMessages = messages;
    let accumulated = '';
    if (options?.stream) {
      if (this.streamDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.streamDelayMs));
      }
      if (options.signal?.aborted) {
        return accumulated;
      }
      if (this.cannedReasoning && options.onReasoningToken) {
        options.onReasoningToken(this.cannedReasoning);
      }
      if (options.onToken) {
        for (const word of this.cannedReply.split(' ')) {
          if (options.signal?.aborted) break;
          const chunk = `${word} `;
          accumulated += chunk;
          options.onToken(chunk);
          if (this.streamDelayMs > 0) {
            await new Promise((r) => setTimeout(r, this.streamDelayMs));
          }
        }
      }
      if (options.signal?.aborted) {
        return accumulated;
      }
    }
    return this.cannedReply;
  }
}

export class FakeEnvironmentPort implements EnvironmentPort {
  public currentIso = '2026-10-27T09:15:00.000Z';

  nowIso(): string {
    return this.currentIso;
  }
}
