export {
  LmStudioHttpAdapter,
  DEFAULT_LOOPBACK_ENDPOINT,
  type FetchLike,
} from './adapters/LmStudioHttpAdapter';
export { BrowserEnvironmentAdapter } from './adapters/BrowserEnvironmentAdapter';
export {
  MaieuticSessionEngine,
  DEFAULT_UDL_CONFIG,
  type ConnectionStatus,
  type DialogueTurn,
  type InterventionResult,
  type MaieuticSessionSnapshot,
  type MaieuticStage,
  type RequestInterventionOptions,
  type StudentDraft,
  type StudentDraftInput,
  type UdlScaffoldingConfig,
} from './domain/MaieuticSessionEngine';
export type {
  ChatCompletionOptions,
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
} from './domain/ports';
export { mountWorkspaceUI } from './ui/WorkspaceUI';
