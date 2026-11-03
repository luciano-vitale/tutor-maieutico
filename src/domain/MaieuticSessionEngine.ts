import type {
  ChatMessage,
  ConnectionMode,
  EnvironmentPort,
  InferencePort,
  InferenceUsageMetrics,
} from './ports';
import {
  inspectZeroData,
  sanitizeZeroData,
  type ZeroDataInspectionResult,
} from './ZeroDataGuardrail';
import {
  inspectAndApplyAntiSolution,
  type AupDidacticLevel,
} from './AntiSolutionGuardrail';

export type CurricularPresetId =
  | 'pseudocode'
  | 'c_cpp'
  | 'python'
  | 'java'
  | 'sql'
  | 'web';

export interface CurricularPreset {
  id: CurricularPresetId;
  name: string;
  targetLanguage: string;
  description: string;
}

export const CURRICULAR_PRESETS: CurricularPreset[] = [
  {
    id: 'pseudocode',
    name: 'Pseudocodice/Algoritmica',
    targetLanguage: 'pseudocode',
    description: 'Algoritmica e logica formale in pseudocodice testuale',
  },
  {
    id: 'c_cpp',
    name: 'C/C++',
    targetLanguage: 'c_cpp',
    description: 'Programmazione strutturata e orientata agli oggetti in C e C++',
  },
  {
    id: 'python',
    name: 'Python',
    targetLanguage: 'python',
    description: 'Programmazione procedurale e orientata agli oggetti in Python',
  },
  {
    id: 'java',
    name: 'Java',
    targetLanguage: 'java',
    description: 'Programmazione orientata agli oggetti in Java',
  },
  {
    id: 'sql',
    name: 'SQL/Database',
    targetLanguage: 'sql',
    description: 'Basi di dati, interrogazioni SQL e modellazione relazionale',
  },
  {
    id: 'web',
    name: 'Web HTML/CSS/JS/PHP',
    targetLanguage: 'web',
    description: 'Sviluppo web front-end e back-end (HTML5, CSS3, JavaScript, PHP)',
  },
];

export interface ActivityContext {
  curricularPreset: CurricularPresetId;
  exercisePrompt: string;
  didacticConstraints: string;
  aupLevel: AupDidacticLevel;
}

export const DEFAULT_ACTIVITY_CONTEXT: ActivityContext = {
  curricularPreset: 'c_cpp',
  exercisePrompt: '',
  didacticConstraints: '',
  aupLevel: 2,
};

export interface DialogueTurn {
  role: 'student' | 'tutor';
  content: string;
  reasoning?: string;
  timestampIso: string;
  antiSolutionIntervened?: boolean;
  stage?: MaieuticStage;
}

export interface StudentDraft {
  studentCode: string;
  compilerError: string;
  cognitivePreCommitment: string;
}

export type StudentDraftInput = Partial<StudentDraft>;

export type ConnectionStatus = 'idle' | 'online' | 'offline';

export type MaieuticStage = 1 | 2 | 3 | 4;

export interface UdlScaffoldingConfig {
  linguisticComplexity: 'biennio' | 'triennio';
  shortHighReadabilityReplies: boolean;
  microStepBreakdown: boolean;
  textLogicalSchemas: boolean;
}

export const DEFAULT_UDL_CONFIG: UdlScaffoldingConfig = {
  linguisticComplexity: 'triennio',
  shortHighReadabilityReplies: false,
  microStepBreakdown: false,
  textLogicalSchemas: false,
};

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
  zeroDataInterventionsCount: number;
  antiSolutionInterventionsCount: number;
  currentStage: MaieuticStage;
  stage4ReachedCount: number;
  udlConfig: UdlScaffoldingConfig;
  activityContext: ActivityContext;
}

export interface InterventionResult {
  status:
    | 'ok'
    | 'rejected_pre_commitment'
    | 'rejected_empty_reply'
    | 'rejected_zero_data'
    | 'inference_error'
    | 'aborted';
  assistantReply?: string;
  pedagogicalMessage?: string;
  zeroDataResult?: ZeroDataInspectionResult;
}

export interface RequestInterventionOptions {
  stream?: boolean;
  onToken?: (chunk: string) => void;
  onReasoningToken?: (chunk: string) => void;
  onStatsUpdate?: (stats: InferenceStatsSnapshot) => void;
}

const MIN_PRE_COMMITMENT_CHARS = 15;
const MIN_PRE_COMMITMENT_WORDS = 3;

const STUCK_PATTERN =
  /\b(non (lo )?so|non ho capito|non capisco|sono bloccat[oa]|non riesco|non so (cosa|come) fare|non saprei|aiuto|nessuna idea|mi sono pers[oa])\b/i;

const EXPLICIT_STUCK_PATTERN =
  /^(sono )?ancora bloccat[oa]|\b(avanza(re)? allo stadio successivo|ancora bloccat[oa] su questo punto)\b/i;

export function isStuckExpression(text: string): boolean {
  return STUCK_PATTERN.test(text) || EXPLICIT_STUCK_PATTERN.test(text);
}

export function isExplicitStuckRequest(text: string): boolean {
  return EXPLICIT_STUCK_PATTERN.test(text);
}

const BASE_MAIEUTIC_SYSTEM_PROMPT = `Sei StudIA Tutor Maieutico dei laboratori di informatica dell'I.I.S.S. "Marconi-Hack".
Opera nel rigoroso rispetto dell'invariante di non-sostituzione (AUP-IA §1, art. 25 L. 132/2025):
- Non fornire mai la soluzione completa o il codice risolutivo pronto all'uso.
- Guida lo studente tramite domande socratiche mirate, indizi graduali e ragionamento sul suo pre-impegno cognitivo.
- Se lo studente formula direttamente un dubbio concettuale o algoritmico nella chat senza aver allegato codice o errori nel pannello laterale, rispondi maieuticamente sul suo modello concettuale e invitalo socraticamente, qualora utile all'indagine, a condividere il frammento di codice o l'errore del compilatore nel pannello di contesto.
- Non esprimere mai voti, giudizi valutativi o profilazioni dello studente (CU-16..19 esclusi).`;

export function buildMaieuticSystemPrompt(
  stage: MaieuticStage,
  udl: UdlScaffoldingConfig,
  activityContext: ActivityContext = DEFAULT_ACTIVITY_CONTEXT
): string {
  const sections: string[] = [BASE_MAIEUTIC_SYSTEM_PROMPT];

  // Ambito curricolare e traccia/vincoli dell'attività
  const preset =
    CURRICULAR_PRESETS.find((p) => p.id === activityContext.curricularPreset) ??
    CURRICULAR_PRESETS[0];

  const contextLines: string[] = [
    `Ambito curricolare attivo: ${preset.name} (${preset.description}).`,
  ];
  if (activityContext.exercisePrompt.trim().length > 0) {
    contextLines.push(
      `Traccia dell'esercizio assegnato:\n${activityContext.exercisePrompt.trim()}`
    );
  }
  if (activityContext.didacticConstraints.trim().length > 0) {
    contextLines.push(
      `Vincoli algoritmici e didattici:\n${activityContext.didacticConstraints.trim()}`
    );
  }
  sections.push(`### Contesto dell'attività e ambito curricolare\n${contextLines.join('\n\n')}`);

  // Regole specifiche per il livello didattico AUP
  sections.push('### Livello didattico AUP e invariante di non-sostituzione');
  switch (activityContext.aupLevel) {
    case 1:
      sections.push(
        'Livello attivo: livello 1 (supporto preliminare e chiarimenti concettuali).\n' +
          'Zero codice nella sintassi target: non fornire assolutamente alcuna riga di codice nel linguaggio di programmazione. ' +
          'Fornisci solo spiegazioni concettuali, domande di autoverifica e al più pseudocodice testuale discorsivo.'
      );
      break;
    case 2:
      sections.push(
        'Livello attivo: livello 2 (revisione assistita del lavoro già scritto dallo studente).\n' +
          'Guida lo studente tramite domande socratiche sul suo codice. Puoi fornire al più micro-esempi sintattici astratti di massimo 3 righe su scenari fittizi e disgiunti dall\'esercizio dello studente.'
      );
      break;
    case 3:
      sections.push(
        'Livello attivo: livello 3 (co-progettazione socratica e debugging guidato).\n' +
          'Analisi logica degli errori e co-progettazione architetturale. Puoi fornire al più micro-esempi sintattici astratti di massimo 3 righe su scenari fittizi e disgiunti dall\'esercizio dello studente.'
      );
      break;
  }

  // Direttiva specifica per lo stadio della progressione maieutica
  sections.push('### Progressione maieutica e obiettivo pedagogico');
  switch (stage) {
    case 1:
      sections.push(
        'Stadio attivo: Stadio 1 (domanda esplorativa).\n' +
          'Il tuo obiettivo è porre domande per far individuare allo studente i dati di input/output, le variabili coinvolte o la riga sospetta nel suo tentativo, stimolando la riflessione iniziale.'
      );
      break;
    case 2:
      sections.push(
        'Stadio attivo: Stadio 2 (scomposizione e trace a mano).\n' +
          'Il tuo obiettivo è spezzare il problema in micro-passi logici e guidare lo studente a simulare l\'esecuzione passo-passo con valori concreti (trace table o evoluzione delle variabili).'
      );
      break;
    case 3:
      sections.push(
        'Stadio attivo: Stadio 3 (analogia o micro-sintassi astratta).\n' +
          'Il tuo obiettivo è proporre un\'analogia concreta esplicativa o un micro-esempio sintattico astratto di massimo 3 righe su un problema fittizio completamente diverso dall\'esercizio dello studente.'
      );
      break;
    case 4:
      sections.push(
        'Stadio attivo: Stadio 4 (sintesi del blocco concettuale ed escalation al docente in laboratorio).\n' +
          'NON cedere assolutamente la soluzione o codice. Riassumi in 2 punti chiari e sintetici il nodo concettuale residuo non risolto e invita esplicitamente lo studente ad alzare la mano e chiamare il docente in laboratorio per un confronto umano diretto (Human-in-the-Loop, AUP-IA §1).'
      );
      break;
  }

  // Adattamenti universali di scaffolding cognitivo UDL (ADR-0002) - nessun termine clinico o diagnostico
  const udlGuidelines: string[] = [];
  if (udl.linguisticComplexity === 'biennio') {
    udlGuidelines.push(
      '- Complessità linguistica: Profilo biennio (classi I–II: lessico essenziale, frasi semplici e concrete, evitando gergo astratto non necessario).'
    );
  } else {
    udlGuidelines.push(
      '- Complessità linguistica: Profilo triennio (classi III–V: lessico tecnico formale e rigoroso).'
    );
  }

  if (udl.shortHighReadabilityReplies) {
    udlGuidelines.push(
      '- Risposte brevi ad alta leggibilità: Frasi corte, periodi semplici ed elenchi puntati essenziali.'
    );
  }

  if (udl.microStepBreakdown) {
    udlGuidelines.push(
      '- Scomposizione guidata in micro-passaggi: Tratta rigorosamente un solo concetto o micro-passo alla volta prima di porre la domanda successiva.'
    );
  }

  if (udl.textLogicalSchemas) {
    udlGuidelines.push(
      '- Schemi logici testuali: Utilizza rappresentazioni visuali o schemi logici testuali passo-passo (es. diagrammi ASCII o tabelle testuali) per chiarire le relazioni.'
    );
  }

  if (udlGuidelines.length > 0) {
    sections.push('### Scaffolding cognitivo universale (UDL)\n' + udlGuidelines.join('\n'));
  }

  return sections.join('\n\n');
}

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
  private zeroDataInterventionsCount = 0;
  private antiSolutionInterventionsCount = 0;
  private currentStage: MaieuticStage = 1;
  private stage4ReachedCount = 0;
  private consecutiveStuckCount = 0;
  private lastInterventionCode: string | null = null;
  private udlConfig: UdlScaffoldingConfig = { ...DEFAULT_UDL_CONFIG };
  private activityContext: ActivityContext = { ...DEFAULT_ACTIVITY_CONTEXT };

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
      zeroDataInterventionsCount: this.zeroDataInterventionsCount,
      antiSolutionInterventionsCount: this.antiSolutionInterventionsCount,
      currentStage: this.currentStage,
      stage4ReachedCount: this.stage4ReachedCount,
      udlConfig: { ...this.udlConfig },
      activityContext: { ...this.activityContext },
    };
  }

  updateActivityContext(input: Partial<ActivityContext>): void {
    this.activityContext = {
      ...this.activityContext,
      ...input,
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

  sanitizeStudentDraft(): void {
    this.draft = {
      studentCode: sanitizeZeroData(this.draft.studentCode),
      compilerError: sanitizeZeroData(this.draft.compilerError),
      cognitivePreCommitment: sanitizeZeroData(this.draft.cognitivePreCommitment),
    };
  }

  sanitizeText(text: string): string {
    return sanitizeZeroData(text);
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

  advanceMaieuticStage(): MaieuticStage {
    if (this.currentStage < 4) {
      this.currentStage = (this.currentStage + 1) as MaieuticStage;
      if (this.currentStage === 4) {
        this.stage4ReachedCount += 1;
      }
    }
    return this.currentStage;
  }

  resetMaieuticStage(): void {
    this.currentStage = 1;
    this.consecutiveStuckCount = 0;
  }

  updateUdlConfig(config: Partial<UdlScaffoldingConfig>): void {
    this.udlConfig = {
      ...this.udlConfig,
      ...config,
    };
  }

  async requestMaieuticIntervention(
    studentFollowUp?: string,
    options?: RequestInterventionOptions
  ): Promise<InterventionResult> {
    const isFollowUpReply = studentFollowUp !== undefined;
    const followUpTrimmed = studentFollowUp?.trim() ?? '';

    // Guardrail zero-data pre-invio: ispeziona localmente tutti i campi prima di qualsiasi trasmissione
    const textToInspect = isFollowUpReply
      ? [
          studentFollowUp,
          this.draft.studentCode,
          this.draft.compilerError,
          this.draft.cognitivePreCommitment,
        ].join('\n')
      : [
          this.draft.studentCode,
          this.draft.compilerError,
          this.draft.cognitivePreCommitment,
        ].join('\n');

    const zeroDataResult = inspectZeroData(textToInspect);
    if (!zeroDataResult.allowed) {
      this.zeroDataInterventionsCount += 1;
      return {
        status: 'rejected_zero_data',
        pedagogicalMessage: zeroDataResult.pedagogicalMessage,
        zeroDataResult,
      };
    }

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
          stage: this.currentStage,
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

    // Se il frammento di codice è stato modificato significativamente rispetto al turno precedente, resetta allo Stadio 1
    const trimmedCode = this.draft.studentCode.trim();
    if (
      this.lastInterventionCode !== null &&
      trimmedCode.length > 0 &&
      trimmedCode !== this.lastInterventionCode
    ) {
      this.resetMaieuticStage();
    }
    if (trimmedCode.length > 0) {
      this.lastInterventionCode = trimmedCode;
    }

    if (isFollowUpReply) {
      if (isExplicitStuckRequest(followUpTrimmed)) {
        this.advanceMaieuticStage();
        this.consecutiveStuckCount = 0;
      } else if (isStuckExpression(followUpTrimmed)) {
        this.consecutiveStuckCount += 1;
        if (this.consecutiveStuckCount >= 2) {
          this.advanceMaieuticStage();
          this.consecutiveStuckCount = 0;
        }
      } else {
        this.consecutiveStuckCount = 0;
      }
    } else {
      this.consecutiveStuckCount = 0;
    }

    const studentMessageContent = isFollowUpReply
      ? followUpTrimmed
      : this.buildDraftPrompt();

    const systemPrompt = buildMaieuticSystemPrompt(
      this.currentStage,
      this.udlConfig,
      this.activityContext
    );

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
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

      const preset = CURRICULAR_PRESETS.find(
        (p) => p.id === this.activityContext.curricularPreset
      );
      const antiSolutionRes = inspectAndApplyAntiSolution(
        effectiveContent,
        this.activityContext.aupLevel,
        preset?.targetLanguage
      );
      if (antiSolutionRes.intercepted) {
        this.antiSolutionInterventionsCount += antiSolutionRes.interventionsCount;
      }
      const safeContent = antiSolutionRes.cleanContent;

      if (abortController.signal.aborted) {
        this.connectionStatus = 'online';
        const hasText = safeContent.trim().length > 0;
        const finalContent = hasText ? safeContent : '[Intervento interrotto dallo studente]';
        if (hasText || accumulatedReasoning.length > 0) {
          finalizeTurnStats(hasText ? safeContent : '');
        }

        this.turns.push({
          role: 'tutor',
          content: finalContent,
          ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
          stage: this.currentStage,
          timestampIso: this.environmentPort.nowIso(),
        });

        return {
          status: 'aborted',
          assistantReply: finalContent,
        };
      }

      finalizeTurnStats(safeContent);

      this.turns.push({
        role: 'tutor',
        content: safeContent,
        ...(antiSolutionRes.intercepted ? { antiSolutionIntervened: true } : {}),
        ...(accumulatedReasoning.length > 0 ? { reasoning: accumulatedReasoning } : {}),
        stage: this.currentStage,
        timestampIso: this.environmentPort.nowIso(),
      });
      this.connectionStatus = 'online';

      return {
        status: 'ok',
        assistantReply: safeContent,
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
          stage: this.currentStage,
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
    this.zeroDataInterventionsCount = 0;
    this.antiSolutionInterventionsCount = 0;
    this.currentStage = 1;
    this.stage4ReachedCount = 0;
    this.consecutiveStuckCount = 0;
    this.lastInterventionCode = null;
    this.udlConfig = { ...DEFAULT_UDL_CONFIG };
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
