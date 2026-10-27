import { describe, expect, test, vi } from 'vitest';
import { LmStudioHttpAdapter } from '../src/adapters/LmStudioHttpAdapter';

describe('LmStudioHttpAdapter', () => {
  test('usa http://127.0.0.1:1234/v1 in Modalità Standalone Loopback di default', () => {
    const adapter = new LmStudioHttpAdapter();
    expect(adapter.getEndpointUrl()).toBe('http://127.0.0.1:1234/v1');
    expect(adapter.getConnectionMode()).toBe('loopback');
  });

  test('accetta URL di loopback (127.0.0.1 e localhost) e subnet private RFC 1918 in Modalità Endpoint LAN', () => {
    const adapter = new LmStudioHttpAdapter();

    adapter.setEndpointUrl('http://localhost:1234/v1');
    expect(adapter.getConnectionMode()).toBe('loopback');

    adapter.setEndpointUrl('http://10.0.0.42:1234/v1');
    expect(adapter.getConnectionMode()).toBe('lan');

    adapter.setEndpointUrl('http://172.16.5.10:1234/v1');
    expect(adapter.getConnectionMode()).toBe('lan');

    adapter.setEndpointUrl('http://172.31.255.1:1234/v1');
    expect(adapter.getConnectionMode()).toBe('lan');

    adapter.setEndpointUrl('http://192.168.1.100:1234/v1/');
    expect(adapter.getEndpointUrl()).toBe('http://192.168.1.100:1234/v1');
    expect(adapter.getConnectionMode()).toBe('lan');
  });

  test('rifiuta con errore esplicito indirizzi IP pubblici, domini esterni o protocolli non HTTP/HTTPS per garantire il Regime Zero-Data', () => {
    const adapter = new LmStudioHttpAdapter();

    expect(() => adapter.setEndpointUrl('https://api.openai.com/v1')).toThrow(/isolamento|loopback|LAN/i);
    expect(() => adapter.setEndpointUrl('http://8.8.8.8:1234/v1')).toThrow(/isolamento|loopback|LAN/i);
    expect(() => adapter.setEndpointUrl('http://172.15.0.1:1234/v1')).toThrow(/isolamento|loopback|LAN/i);
    expect(() => adapter.setEndpointUrl('http://172.32.0.1:1234/v1')).toThrow(/isolamento|loopback|LAN/i);
    expect(() => adapter.setEndpointUrl('ftp://127.0.0.1:1234/v1')).toThrow(/protocollo|non valido/i);
    expect(() => adapter.setEndpointUrl('non-un-url')).toThrow(/URL non valido/i);
  });

  test('interroga GET /v1/models e restituisce la lista dei modelli disponibili', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: 'qwen2.5-coder-7b-instruct' }, { id: 'llama-3.1-8b-instruct' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const adapter = new LmStudioHttpAdapter('http://127.0.0.1:1234/v1', mockFetch);
    const models = await adapter.listModels();

    expect(models).toEqual(['qwen2.5-coder-7b-instruct', 'llama-3.1-8b-instruct']);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:1234/v1/models',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('invia richieste stateless POST /v1/chat/completions in modalità standard (non-streaming)', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { role: 'assistant', content: 'Qual è la condizione di uscita del tuo ciclo?' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const adapter = new LmStudioHttpAdapter('http://192.168.1.50:1234/v1', mockFetch);
    const reply = await adapter.completeChat(
      [
        { role: 'system', content: 'Sei un Tutor Maieutico.' },
        { role: 'user', content: 'Il mio ciclo for non termina.' },
      ],
      { model: 'qwen2.5-coder-7b-instruct', stream: false }
    );

    expect(reply).toBe('Qual è la condizione di uscita del tuo ciclo?');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.50:1234/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  test('gestisce lo streaming SSE su POST /v1/chat/completions ricostruendo i token incrementali', async () => {
    const encoder = new TextEncoder();
    const sseChunks = [
      'data: {"choices":[{"delta":{"content":"Osserva "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"l\'indice i"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" nel ciclo."}}]}',
    ];

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const adapter = new LmStudioHttpAdapter('http://127.0.0.1:1234/v1', mockFetch);
    const receivedTokens: string[] = [];

    const fullText = await adapter.completeChat(
      [{ role: 'user', content: 'Aiutami a capire l\'errore.' }],
      {
        model: 'qwen2.5-coder-7b-instruct',
        stream: true,
        onToken: (token) => receivedTokens.push(token),
      }
    );

    expect(receivedTokens).toEqual(['Osserva ', "l'indice i", ' nel ciclo.']);
    expect(fullText).toBe("Osserva l'indice i nel ciclo.");
  });

  test('emette subito i token di ragionamento (delta.reasoning_content e tag <think>) via onReasoningToken e restituisce solo la risposta maieutica pulita', async () => {
    const encoder = new TextEncoder();
    const sseChunks = [
      'data: {"choices":[{"delta":{"reasoning_content":"Analizzo il ciclo "}}]}\r\n\r\n',
      'data: {"choices":[{"delta":{"reasoning_content":"dello studente."}}]}\r\n\r\n',
      'data: {"choices":[{"delta":{"content":"<think>Verifica indice</think>Quale valore "}}]}\r\n\r\n',
      'data: {"choices":[{"delta":{"content":"assume i al passo finale?"}}]}\r\n\r\n',
      'data: [DONE]\r\n\r\n',
    ];

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const adapter = new LmStudioHttpAdapter('http://127.0.0.1:1234/v1', mockFetch);
    const reasoningTokens: string[] = [];
    const contentTokens: string[] = [];

    const cleanReply = await adapter.completeChat(
      [{ role: 'user', content: 'Aiutami sul ciclo.' }],
      {
        model: 'qwen3-8b',
        stream: true,
        onReasoningToken: (token) => reasoningTokens.push(token),
        onToken: (token) => contentTokens.push(token),
      }
    );

    expect(reasoningTokens).toEqual([
      'Analizzo il ciclo ',
      'dello studente.',
      'Verifica indice',
    ]);
    expect(contentTokens).toEqual(['Quale valore ', 'assume i al passo finale?']);
    expect(cleanReply).toBe('Quale valore assume i al passo finale?');
  });
});


