export {
  LmStudioHttpAdapter,
  DEFAULT_LOOPBACK_ENDPOINT,
  type FetchLike,
} from './adapters/LmStudioHttpAdapter';
export { BrowserEnvironmentAdapter } from './adapters/BrowserEnvironmentAdapter';
export {
  MaieuticSessionEngine,
  type ConnectionStatus,
  type DialogueTurn,
  type InterventionResult,
  type MaieuticSessionSnapshot,
  type RequestInterventionOptions,
  type StudentDraft,
  type StudentDraftInput,
} from './domain/MaieuticSessionEngine';
export type {
  ChatCompletionOptions,
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
} from './domain/ports';
export { mountWorkspaceUI } from './ui/WorkspaceUI';
