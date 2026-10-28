import type {
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
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

export interface MaieuticSessionSnapshot extends StudentDraft {
  endpointUrl: string;
  connectionMode: ConnectionMode;
  connectionStatus: ConnectionStatus;
  availableModels: string[];
  activeModel: string | null;
  turns: DialogueTurn[];
}

export interface InterventionResult {
  status: 'ok' | 'rejected_pre_commitment' | 'rejected_empty_reply' | 'inference_error';
  assistantReply?: string;
  pedagogicalMessage?: string;
}

export interface RequestInterventionOptions {
  stream?: boolean;
  onToken?: (chunk: string) => void;
  onReasoningToken?: (chunk: string) => void;
}

const MIN_PRE_COMMITMENT_CHARS = 15;
const MIN_PRE_COMMITMENT_WORDS = 3;

const MAIEUTIC_SYSTEM_PROMPT = `Sei StudIA Tutor Maieutico dei laboratori di informatica dell'I.I.S.S. "Marconi-Hack".
Opera nel rigoroso rispetto dell'invariante di non-sostituzione (AUP-IA §1, art. 25 L. 132/2025):
- Non fornire mai la soluzione completa o il codice risolutivo pronto all'uso.
- Guida lo studente tramite domande socratiche mirate, indizi graduali e ragionamento sul suo pre-impegno cognitivo.
- Non esprimere mai voti, giudizi valutativi o profilazioni dello studente (CU-16..19 esclusi).`;

function isMeaningfulPreCommitment(text: string): boolean {
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

export class MaieuticSessionEngine {
  private readonly inferencePort: InferencePort;
  private readonly environmentPort: EnvironmentPort;

  private connectionStatus: ConnectionStatus = 'idle';
  private availableModels: string[] = [];
  private activeModel: string | null = null;

  private draft: StudentDraft = emptyDraft();
  private turns: DialogueTurn[] = [];

  constructor(inferencePort: InferencePort, environmentPort: EnvironmentPort) {
    this.inferencePort = inferencePort;
    this.environmentPort = environmentPort;
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

  async requestMaieuticIntervention(
    studentFollowUp?: string,
    options?: RequestInterventionOptions
  ): Promise<InterventionResult> {
    if (!isMeaningfulPreCommitment(this.draft.cognitivePreCommitment)) {
      return {
        status: 'rejected_pre_commitment',
        pedagogicalMessage:
          'Pre-impegno cognitivo obbligatorio (AUP-IA §1): prima di richiedere un intervento maieutico, descrivi cosa hai provato a fare, qual è la tua ipotesi e dove ti sei bloccato (almeno una frase completa).',
      };
    }

    const isFollowUpReply = studentFollowUp !== undefined;
    const followUpTrimmed = studentFollowUp?.trim() ?? '';

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

    try {
      let accumulatedReasoning = '';
      const reply = await this.inferencePort.completeChat(messages, {
        model: this.activeModel ?? undefined,
        stream: options?.stream ?? true,
        onToken: options?.onToken,
        onReasoningToken: (chunk) => {
          accumulatedReasoning += chunk;
          options?.onReasoningToken?.(chunk);
        },
      });

      this.turns.push({
        role: 'tutor',
        content: reply,
        ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
        timestampIso: this.environmentPort.nowIso(),
      });
      this.connectionStatus = 'online';

      return {
        status: 'ok',
        assistantReply: reply,
      };
    } catch (err) {
      this.turns.pop();
      this.connectionStatus = 'offline';
      const detail = err instanceof Error ? err.message : 'Errore sconosciuto';
      return {
        status: 'inference_error',
        pedagogicalMessage: `Impossibile raggiungere il motore di inferenza (${detail}). Verifica che LM Studio sia attivo sull'endpoint configurato.`,
      };
    }
  }

  resetSession(): void {
    this.draft = emptyDraft();
    this.turns = [];
  }

  private buildDraftPrompt(): string {
    const sections: string[] = [];
    if (this.draft.studentCode.trim().length > 0) {
      sections.push(
        `### Tentativo di codice o pseudocodice\n\`\`\`\n${this.draft.studentCode.trim()}\n\`\`\``
      );
    }
    if (this.draft.compilerError.trim().length > 0) {
      sections.push(`### Errore del compilatore o interprete\n${this.draft.compilerError.trim()}`);
    }
    sections.push(
      `### Pre-impegno cognitivo dello studente\n${this.draft.cognitivePreCommitment.trim()}`
    );
    return sections.join('\n\n');
  }
}
