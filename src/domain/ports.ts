export type ConnectionMode = 'loopback' | 'lan';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InferenceUsageMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSecond?: number;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
  signal?: AbortSignal;
  onToken?: (chunk: string) => void;
  onReasoningToken?: (chunk: string) => void;
  onUsage?: (usage: InferenceUsageMetrics) => void;
}

export interface InferencePort {
  getEndpointUrl(): string;
  setEndpointUrl(url: string): void;
  getConnectionMode(): ConnectionMode;
  listModels(): Promise<string[]>;
  getModelContextLength?(modelId: string): number | null;
  completeChat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
}

export interface EnvironmentPort {
  nowIso(): string;
  nowMs?(): number;
}
