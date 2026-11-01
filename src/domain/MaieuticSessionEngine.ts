import type {
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
  InferenceUsageMetrics,
} from './ports';

export interface DialogueTurn {
  role: 'student' | 'tutor';
  content: string;
  reasoning?: string;
  timestampIso: string;
}

export interface StudentDraft {
  studentCode: string;
  compilerError: string;
  cognitivePreCommitment: string;
}

export type StudentDraftInput = Partial<StudentDraft>;

export type ConnectionStatus = 'idle' | 'online' | 'offline';

export interface InferenceStatsSnapshot {
  contextUsedTokens: number;
  contextMaxTokens: number | null;
  tokensPerSecond: number | null;
}

export interface MaieuticSessionSnapshot extends StudentDraft {
  endpointUrl: string;
  connectionMode: ConnectionMode;
  connectionStatus: ConnectionStatus;
  availableModels: string[];
  activeModel: string | null;
  turns: DialogueTurn[];
  inferenceStats: InferenceStatsSnapshot;
}

export interface InterventionResult {
  status: 'ok' | 'rejected_pre_commitment' | 'rejected_empty_reply' | 'inference_error' | 'aborted';
  assistantReply?: string;
  pedagogicalMessage?: string;
}

export interface RequestInterventionOptions {
  stream?: boolean;
  onToken?: (chunk: string) => void;
  onReasoningToken?: (chunk: string) => void;
  onStatsUpdate?: (stats: InferenceStatsSnapshot) => void;
}

const MIN_PRE_COMMITMENT_CHARS = 15;
const MIN_PRE_COMMITMENT_WORDS = 3;

const MAIEUTIC_SYSTEM_PROMPT = `Sei StudIA Tutor Maieutico dei laboratori di informatica dell'I.I.S.S. "Marconi-Hack".
Opera nel rigoroso rispetto dell'invariante di non-sostituzione (AUP-IA §1, art. 25 L. 132/2025):
- Non fornire mai la soluzione completa o il codice risolutivo pronto all'uso.
- Guida lo studente tramite domande socratiche mirate, indizi graduali e ragionamento sul suo pre-impegno cognitivo.
- Se lo studente formula direttamente un dubbio concettuale o algoritmico nella chat senza aver allegato codice o errori nel pannello laterale, rispondi maieuticamente sul suo modello concettuale e invitalo socraticamente, qualora utile all'indagine, a condividere il frammento di codice o l'errore del compilatore nel pannello di contesto.
- Non esprimere mai voti, giudizi valutativi o profilazioni dello studente (CU-16..19 esclusi).`;

export function isMeaningfulPreCommitment(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_PRE_COMMITMENT_CHARS) {
    return false;
  }
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  return words.length >= MIN_PRE_COMMITMENT_WORDS;
}

function emptyDraft(): StudentDraft {
  return {
    studentCode: '',
    compilerError: '',
    cognitivePreCommitment: '',
  };
}

function estimateTokensFromText(text: string): number {
  const len = text.length;
  if (len === 0) return 0;
  return Math.max(1, Math.ceil(len / 4));
}

function estimatePromptTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokensFromText(msg.content) + 4;
  }
  return total;
}

export class MaieuticSessionEngine {
  private readonly inferencePort: InferencePort;
  private readonly environmentPort: EnvironmentPort;

  private connectionStatus: ConnectionStatus = 'idle';
  private availableModels: string[] = [];
  private activeModel: string | null = null;
  private currentAbortController: AbortController | null = null;

  private draft: StudentDraft = emptyDraft();
  private turns: DialogueTurn[] = [];
  private contextUsedTokens = 0;
  private tokensPerSecond: number | null = null;

  constructor(inferencePort: InferencePort, environmentPort: EnvironmentPort) {
    this.inferencePort = inferencePort;
    this.environmentPort = environmentPort;
  }

  private getCurrentTimeMs(): number {
    if (typeof this.environmentPort.nowMs === 'function') {
      return this.environmentPort.nowMs();
    }
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private getActiveModelContextLength(): number | null {
    if (!this.activeModel || typeof this.inferencePort.getModelContextLength !== 'function') {
      return null;
    }
    return this.inferencePort.getModelContextLength(this.activeModel);
  }

  private buildInferenceStats(): InferenceStatsSnapshot {
    return {
      contextUsedTokens: this.contextUsedTokens,
      contextMaxTokens: this.getActiveModelContextLength(),
      tokensPerSecond: this.tokensPerSecond,
    };
  }

  getSnapshot(): MaieuticSessionSnapshot {
    return {
      endpointUrl: this.inferencePort.getEndpointUrl(),
      connectionMode: this.inferencePort.getConnectionMode(),
      connectionStatus: this.connectionStatus,
      availableModels: [...this.availableModels],
      activeModel: this.activeModel,
      studentCode: this.draft.studentCode,
      compilerError: this.draft.compilerError,
      cognitivePreCommitment: this.draft.cognitivePreCommitment,
      turns: this.turns.map((turn) => ({ ...turn })),
      inferenceStats: this.buildInferenceStats(),
    };
  }

  updateStudentDraft(input: StudentDraftInput): void {
    this.draft = {
      ...this.draft,
      ...(input.studentCode !== undefined ? { studentCode: input.studentCode } : {}),
      ...(input.compilerError !== undefined ? { compilerError: input.compilerError } : {}),
      ...(input.cognitivePreCommitment !== undefined
        ? { cognitivePreCommitment: input.cognitivePreCommitment }
        : {}),
    };
  }

  async checkInferenceConnection(): Promise<MaieuticSessionSnapshot> {
    try {
      const models = await this.inferencePort.listModels();
      this.availableModels = models;
      this.connectionStatus = 'online';
      if (models.length > 0 && (!this.activeModel || !models.includes(this.activeModel))) {
        const preferredChatModel =
          models.find((m) => !/embed|phonon|whisper|tts|rerank/i.test(m)) ?? models[0];
        this.activeModel = preferredChatModel;
      }
    } catch {
      this.availableModels = [];
      this.activeModel = null;
      this.connectionStatus = 'offline';
    }
    return this.getSnapshot();
  }

  setActiveModel(modelId: string): void {
    if (this.availableModels.includes(modelId)) {
      this.activeModel = modelId;
    }
  }

  async configureEndpoint(url: string): Promise<MaieuticSessionSnapshot> {
    this.inferencePort.setEndpointUrl(url);
    return this.checkInferenceConnection();
  }

  abortCurrentIntervention(): boolean {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      return true;
    }
    return false;
  }

  async requestMaieuticIntervention(
    studentFollowUp?: string,
    options?: RequestInterventionOptions
  ): Promise<InterventionResult> {
    const isFollowUpReply = studentFollowUp !== undefined;
    const followUpTrimmed = studentFollowUp?.trim() ?? '';

    // Se l'invio avviene dalla barra di chat e il pre-impegno nel pannello laterale non è ancora valido:
    // valuta se il testo digitato nella chat è sufficiente per fungere da pre-impegno cognitivo
    if (isFollowUpReply && !isMeaningfulPreCommitment(this.draft.cognitivePreCommitment)) {
      if (isMeaningfulPreCommitment(followUpTrimmed)) {
        this.draft.cognitivePreCommitment = followUpTrimmed;
      }
    }

    if (!isMeaningfulPreCommitment(this.draft.cognitivePreCommitment)) {
      const studentTurnContent = isFollowUpReply
        ? (followUpTrimmed.length > 0 ? followUpTrimmed : 'Richiesta di intervento maieutico.')
        : (this.draft.cognitivePreCommitment.trim().length > 0
            ? this.buildDraftPrompt()
            : (this.draft.studentCode.trim().length > 0
                ? this.buildDraftPrompt()
                : 'Richiesta di intervento maieutico.'));

      const pedagogicalMessage =
        'Pre-impegno cognitivo obbligatorio (AUP-IA §1): prima di richiedere un intervento maieutico, descrivi cosa hai provato a fare, qual è la tua ipotesi e dove ti sei bloccato (almeno una frase completa).';

      const lastStudentTurn = this.turns[this.turns.length - 2];
      const lastTutorTurn = this.turns[this.turns.length - 1];
      const isDuplicateAttempt =
        lastTutorTurn &&
        lastTutorTurn.content === pedagogicalMessage &&
        lastStudentTurn &&
        lastStudentTurn.content === studentTurnContent;

      if (!isDuplicateAttempt) {
        this.turns.push({
          role: 'student',
          content: studentTurnContent,
          timestampIso: this.environmentPort.nowIso(),
        });
        this.turns.push({
          role: 'tutor',
          content: pedagogicalMessage,
          timestampIso: this.environmentPort.nowIso(),
        });
      }

      return {
        status: 'rejected_pre_commitment',
        pedagogicalMessage,
        assistantReply: pedagogicalMessage,
      };
    }

    if (isFollowUpReply && followUpTrimmed.length === 0) {
      return {
        status: 'rejected_empty_reply',
        pedagogicalMessage:
          'Inserisci una risposta alla domanda socratica del tutor maieutico prima di inviare.',
      };
    }

    const studentMessageContent = isFollowUpReply
      ? followUpTrimmed
      : this.buildDraftPrompt();

    const messages: ChatMessage[] = [
      { role: 'system', content: MAIEUTIC_SYSTEM_PROMPT },
      ...this.turns.map((t): ChatMessage => ({
        role: t.role === 'student' ? 'user' : 'assistant',
        content: t.content,
      })),
      { role: 'user', content: studentMessageContent },
    ];

    const studentTurn: DialogueTurn = {
      role: 'student',
      content: studentMessageContent,
      timestampIso: this.environmentPort.nowIso(),
    };
    this.turns.push(studentTurn);

    const abortController = new AbortController();
    this.currentAbortController = abortController;

    let accumulatedReasoning = '';
    let accumulatedContent = '';
    let streamedChunkCount = 0;
    const requestStartMs = this.getCurrentTimeMs();
    let firstTokenMs: number | null = null;
    const estimatedPromptToks = estimatePromptTokens(messages);
    let reportedUsage: InferenceUsageMetrics | null = null;

    const updateLiveStats = (): void => {
      const nowMs = this.getCurrentTimeMs();
      if (firstTokenMs === null) {
        firstTokenMs = nowMs;
      }
      const estimatedCompletionToks = Math.max(
        streamedChunkCount,
        estimateTokensFromText(accumulatedReasoning + accumulatedContent)
      );
      const elapsedSec = Math.max(
        0.05,
        (nowMs - (firstTokenMs > requestStartMs ? requestStartMs : firstTokenMs)) / 1000
      );
      this.contextUsedTokens =
        reportedUsage?.totalTokens ?? estimatedPromptToks + estimatedCompletionToks;
      this.tokensPerSecond =
        reportedUsage?.tokensPerSecond ??
        Math.round((estimatedCompletionToks / elapsedSec) * 10) / 10;
      options?.onStatsUpdate?.(this.buildInferenceStats());
    };

    const finalizeTurnStats = (finalReply: string): void => {
      const endMs = this.getCurrentTimeMs();
      const totalElapsedSec = Math.max(0.05, (endMs - requestStartMs) / 1000);
      const estimatedCompletionToks = Math.max(
        streamedChunkCount,
        estimateTokensFromText(accumulatedReasoning + finalReply)
      );
      const completionToks = reportedUsage?.completionTokens ?? estimatedCompletionToks;
      const totalToks =
        reportedUsage?.totalTokens ??
        (reportedUsage?.promptTokens !== undefined
          ? reportedUsage.promptTokens + completionToks
          : estimatedPromptToks + completionToks);

      if (totalToks > 0) {
        this.contextUsedTokens = totalToks;
      }
      if (reportedUsage?.tokensPerSecond !== undefined && reportedUsage.tokensPerSecond > 0) {
        this.tokensPerSecond = Math.round(reportedUsage.tokensPerSecond * 10) / 10;
      } else if (completionToks > 0) {
        const genElapsedSec =
          firstTokenMs !== null && endMs > firstTokenMs
            ? Math.max(0.05, (endMs - firstTokenMs) / 1000)
            : totalElapsedSec;
        this.tokensPerSecond = Math.round((completionToks / genElapsedSec) * 10) / 10;
      }
      options?.onStatsUpdate?.(this.buildInferenceStats());
    };

    try {
      const reply = await this.inferencePort.completeChat(messages, {
        model: this.activeModel ?? undefined,
        stream: options?.stream ?? true,
        signal: abortController.signal,
        onToken: (chunk) => {
          accumulatedContent += chunk;
          streamedChunkCount += 1;
          updateLiveStats();
          options?.onToken?.(chunk);
        },
        onReasoningToken: (chunk) => {
          accumulatedReasoning += chunk;
          streamedChunkCount += 1;
          updateLiveStats();
          options?.onReasoningToken?.(chunk);
        },
        onUsage: (usage) => {
          reportedUsage = {
            ...reportedUsage,
            ...usage,
          };
        },
      });

      const effectiveContent = reply || accumulatedContent;

      if (abortController.signal.aborted) {
        this.connectionStatus = 'online';
        const hasText = effectiveContent.trim().length > 0;
        const finalContent = hasText ? effectiveContent : '[Intervento interrotto dallo studente]';
        if (hasText || accumulatedReasoning.length > 0) {
          finalizeTurnStats(hasText ? effectiveContent : '');
        }

        this.turns.push({
          role: 'tutor',
          content: finalContent,
          ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
          timestampIso: this.environmentPort.nowIso(),
        });

        return {
          status: 'aborted',
          assistantReply: finalContent,
        };
      }

      finalizeTurnStats(effectiveContent);

      this.turns.push({
        role: 'tutor',
        content: effectiveContent,
        ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
        timestampIso: this.environmentPort.nowIso(),
      });
      this.connectionStatus = 'online';

      return {
        status: 'ok',
        assistantReply: effectiveContent,
      };
    } catch (err) {
      const isAborted =
        abortController.signal.aborted ||
        (err instanceof Error && err.name === 'AbortError');

      if (isAborted) {
        this.connectionStatus = 'online';
        const hasText = accumulatedContent.trim().length > 0;
        const finalContent = hasText ? accumulatedContent : '[Intervento interrotto dallo studente]';
        if (hasText || accumulatedReasoning.length > 0) {
          finalizeTurnStats(hasText ? accumulatedContent : '');
        }

        this.turns.push({
          role: 'tutor',
          content: finalContent,
          ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
          timestampIso: this.environmentPort.nowIso(),
        });

        return {
          status: 'aborted',
          assistantReply: finalContent,
        };
      }

      this.turns.pop();
      this.connectionStatus = 'offline';
      const detail = err instanceof Error ? err.message : 'Errore sconosciuto';
      return {
        status: 'inference_error',
        pedagogicalMessage: `Impossibile raggiungere il motore di inferenza (${detail}). Verifica che LM Studio sia attivo sull'endpoint configurato.`,
      };
    } finally {
      if (this.currentAbortController === abortController) {
        this.currentAbortController = null;
      }
    }
  }

  resetSession(): void {
    this.abortCurrentIntervention();
    this.draft = emptyDraft();
    this.turns = [];
    this.contextUsedTokens = 0;
    this.tokensPerSecond = null;
  }

  private buildDraftPrompt(): string {
    const sections: string[] = [];
    if (this.draft.studentCode.trim().length > 0) {
      sections.push(
        `### Tentativo di codice o pseudocodice\n\`\`\`\n${this.draft.studentCode.trim()}\n\`\`\``
      );
    }
    if (this.draft.compilerError.trim().length > 0) {
      sections.push(
        `### Errore del compilatore o interprete\n\`\`\`\n${this.draft.compilerError.trim()}\n\`\`\``
      );
    }
    sections.push(
      `### Pre-impegno cognitivo dello studente\n${this.draft.cognitivePreCommitment.trim()}`
    );
    return sections.join('\n\n');
  }
}
