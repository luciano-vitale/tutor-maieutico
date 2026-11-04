import { describe, expect, test } from 'vitest';
import {
  MaieuticSessionEngine,
  isDirectSolutionRequest,
  isMeaningfulPreCommitment,
} from '../src/domain/MaieuticSessionEngine';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

describe('MaieuticSessionEngine', () => {
  test('blocca la richiesta di intervento maieutico se il pre-impegno cognitivo è assente o non significativo', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateStudentDraft({
      studentCode: 'for (int i = 0; i <= 10; i++) { v[i] = 0; }',
      compilerError: 'IndexOutOfBounds / Segmentation fault',
      cognitivePreCommitment: '   ',
    });

    const emptyAttempt = await engine.requestMaieuticIntervention();
    expect(emptyAttempt.status).toBe('rejected_pre_commitment');
    expect(emptyAttempt.pedagogicalMessage).toMatch(/pre-impegno cognitivo/i);
    expect(engine.getSnapshot().turns).toHaveLength(2);
    expect(engine.getSnapshot().turns[0].role).toBe('student');
    expect(engine.getSnapshot().turns[1].role).toBe('tutor');
    expect(engine.getSnapshot().turns[1].content).toBe(emptyAttempt.pedagogicalMessage);

    engine.updateStudentDraft({
      cognitivePreCommitment: 'non so',
    });

    const tooShortAttempt = await engine.requestMaieuticIntervention();
    expect(tooShortAttempt.status).toBe('rejected_pre_commitment');
    expect(engine.getSnapshot().turns).toHaveLength(4);

    // Un ulteriore invio identico senza modifiche non duplica i turni
    const duplicateAttempt = await engine.requestMaieuticIntervention();
    expect(duplicateAttempt.status).toBe('rejected_pre_commitment');
    expect(engine.getSnapshot().turns).toHaveLength(4);
  });

  test('consente l\'intervento maieutico sul tentativo, permette follow-up socratici e consente di inviare un tentativo di codice aggiornato nei turni successivi', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();
    expect(engine.getSnapshot().connectionStatus).toBe('online');
    expect(engine.getSnapshot().activeModel).toBe('qwen2.5-coder-7b-instruct');

    engine.updateStudentDraft({
      studentCode: 'int v[10];\nfor (int i = 0; i <= 10; i++) {\n  v[i] = i;\n}',
      compilerError: 'Segmentation fault (core dumped)',
      cognitivePreCommitment:
        'Ho dichiarato un array di 10 elementi e penso che il ciclo debba arrivare a 10, ma va in crash all\'ultima iterazione.',
    });

    const firstIntervention = await engine.requestMaieuticIntervention();
    expect(firstIntervention.status).toBe('ok');
    expect(firstIntervention.assistantReply).toBe(
      'Quale variabile controlla la terminazione del ciclo?'
    );
    expect(engine.getSnapshot().turns).toHaveLength(2);
    expect(engine.getSnapshot().turns[0].role).toBe('student');
    expect(engine.getSnapshot().turns[1].role).toBe('tutor');

    inference.cannedReply = 'Esatto! Se gli elementi sono 10 e parti da 0, qual è l\'ultimo indice valido?';
    const followUp = await engine.requestMaieuticIntervention('L\'indice i parte da 0 e arriva fino a 10.');
    expect(followUp.status).toBe('ok');
    expect(engine.getSnapshot().turns).toHaveLength(4);

    // Invio di un nuovo tentativo aggiornato dal pannello sinistro (studentFollowUp === undefined)
    engine.updateStudentDraft({
      studentCode: 'int v[10];\nfor (int i = 0; i < 10; i++) {\n  v[i] = i;\n}',
      compilerError: '',
      cognitivePreCommitment:
        'Ho sostituito <= 10 con < 10 perché gli indici validi vanno da 0 a 9.',
    });
    inference.cannedReply = 'Ottima osservazione: ora quale condizione verifica l\'uscita dal ciclo?';
    const updatedDraftTurn = await engine.requestMaieuticIntervention();
    expect(updatedDraftTurn.status).toBe('ok');
    expect(engine.getSnapshot().turns).toHaveLength(6);
    expect(engine.getSnapshot().turns[4].content).toContain('i < 10');
  });

  test('azzera istantaneamente tutti i dati della sessione maieutica in RAM con resetSession ("Nuova sessione")', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateStudentDraft({
      studentCode: 'print(1/0)',
      compilerError: 'ZeroDivisionError',
      cognitivePreCommitment: 'Ho provato a dividere per una variabile che vale zero nel caso base.',
    });
    await engine.requestMaieuticIntervention();
    expect(engine.getSnapshot().turns.length).toBeGreaterThan(0);

    engine.resetSession();

    const snapshot = engine.getSnapshot();
    expect(snapshot.studentCode).toBe('');
    expect(snapshot.compilerError).toBe('');
    expect(snapshot.cognitivePreCommitment).toBe('');
    expect(snapshot.turns).toEqual([]);
    expect(snapshot.zeroDataInterventionsCount).toBe(0);
  });

  test('blocca la richiesta verso InferencePort se codice, errore, pre-impegno o risposta contengono violazioni zero-data', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();
    inference.lastMessages = [];

    // 1. Violazione PII nel codice dello studente
    engine.updateStudentDraft({
      studentCode: '/* Autore: Mario Rossi, Classe: 3A */\nint main() { return 0; }',
      compilerError: '',
      cognitivePreCommitment: 'Ho provato a impostare la funzione main e il valore di ritorno.',
    });

    const piiAttempt = await engine.requestMaieuticIntervention();
    expect(piiAttempt.status).toBe('rejected_zero_data');
    expect(piiAttempt.zeroDataResult?.categories).toContain('pii');
    expect(inference.lastMessages).toHaveLength(0); // Nessun byte inviato all'InferencePort
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(1);
    // Nessun PII salvato nei turni di conversazione
    expect(engine.getSnapshot().turns).toHaveLength(0);

    // 2. Violazione credenziali nel codice
    engine.updateStudentDraft({
      studentCode: 'const apiKey = "sk-1234567890abcdef12345678";',
      cognitivePreCommitment: 'Sto provando a chiamare un endpoint con la chiave API.',
    });

    const credAttempt = await engine.requestMaieuticIntervention();
    expect(credAttempt.status).toBe('rejected_zero_data');
    expect(credAttempt.zeroDataResult?.categories).toContain('credentials');
    expect(inference.lastMessages).toHaveLength(0);
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(2);

    // 3. Violazione clinica CU-12 nel pre-impegno
    engine.updateStudentDraft({
      studentCode: 'int x = 10;',
      cognitivePreCommitment: 'Ho la dislessia e DSA, non riesco a capire questo costrutto.',
    });

    const cu12Attempt = await engine.requestMaieuticIntervention();
    expect(cu12Attempt.status).toBe('rejected_zero_data');
    expect(cu12Attempt.zeroDataResult?.hasClinicalCu12).toBe(true);
    expect(cu12Attempt.zeroDataResult?.udlScaffoldingSuggestion).toContain('scaffolding cognitivo UDL');
    expect(inference.lastMessages).toHaveLength(0);
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(3);

    // 4. Violazione nella risposta socratica della chat (follow-up)
    // Prima impostiamo un draft pulito valido
    engine.updateStudentDraft({
      studentCode: 'int x = 10;',
      compilerError: '',
      cognitivePreCommitment: 'Ho provato ad assegnare 10 a x e vorrei capire il tipo.',
    });
    const validTurn = await engine.requestMaieuticIntervention();
    expect(validTurn.status).toBe('ok');
    expect(inference.lastMessages.length).toBeGreaterThan(0);

    inference.lastMessages = [];
    const followUpViolation = await engine.requestMaieuticIntervention('La mia email è mario.rossi@scuola.it');
    expect(followUpViolation.status).toBe('rejected_zero_data');
    expect(followUpViolation.zeroDataResult?.categories).toContain('pii');
    expect(inference.lastMessages).toHaveLength(0);
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(4);
  });

  test('espone la funzione di sanitizzazione assistita che rimpiazza i match con [DATO RIMOSSO] e sblocca l\'invio', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();

    engine.updateStudentDraft({
      studentCode: '/* Autore: Mario Rossi, Classe: 3A */\nconst key = "sk-1234567890abcdef12345678";\nint x = 0;',
      compilerError: 'error: mario.rossi@scuola.it undefined',
      cognitivePreCommitment: 'Ho la dislessia e non capisco perché il compilatore dà errore.',
    });

    const blocked = await engine.requestMaieuticIntervention();
    expect(blocked.status).toBe('rejected_zero_data');

    // Esegue la sanitizzazione assistita
    engine.sanitizeStudentDraft();

    const snapshot = engine.getSnapshot();
    expect(snapshot.studentCode).not.toContain('Mario Rossi');
    expect(snapshot.studentCode).not.toContain('sk-1234567890abcdef12345678');
    expect(snapshot.studentCode).toContain('[DATO RIMOSSO]');
    expect(snapshot.compilerError).not.toContain('mario.rossi@scuola.it');
    expect(snapshot.compilerError).toContain('[DATO RIMOSSO]');
    expect(snapshot.cognitivePreCommitment).not.toContain('dislessia');
    expect(snapshot.cognitivePreCommitment).toContain('[DATO RIMOSSO]');

    // Ora l'invio deve avere successo
    const resubmission = await engine.requestMaieuticIntervention();
    expect(resubmission.status).toBe('ok');
    expect(resubmission.assistantReply).toBeDefined();
  });

  test('attiva lo streaming di default, propaga onReasoningToken e onToken, conserva il ragionamento nel turno UI ma lo esclude dal payload messages dei turni successivi', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    inference.cannedReasoning = 'Lo studente confonde indice e lunghezza.';
    inference.cannedReply = 'Qual è l\'indice del primo elemento?';

    engine.updateStudentDraft({
      studentCode: 'a[10] = 5;',
      compilerError: 'Out of bounds',
      cognitivePreCommitment: 'Ho provato ad assegnare il decimo elemento usando l\'indice 10.',
    });

    const reasoningChunks: string[] = [];
    const contentChunks: string[] = [];

    const first = await engine.requestMaieuticIntervention(undefined, {
      onReasoningToken: (chunk) => reasoningChunks.push(chunk),
      onToken: (chunk) => contentChunks.push(chunk),
    });

    expect(first.status).toBe('ok');
    expect(reasoningChunks.join('')).toBe('Lo studente confonde indice e lunghezza.');
    expect(contentChunks.join('').trim()).toBe("Qual è l'indice del primo elemento?");

    const turnsAfterFirst = engine.getSnapshot().turns;
    expect(turnsAfterFirst[1].content).toBe("Qual è l'indice del primo elemento?");
    expect(turnsAfterFirst[1].reasoning).toBe('Lo studente confonde indice e lunghezza.');

    inference.cannedReasoning = '';
    inference.cannedReply = 'Bene, quindi quale sarà l\'ultimo indice?';
    await engine.requestMaieuticIntervention('L\'indice del primo elemento è 0.');

    const assistantMsgInHistory = inference.lastMessages.find((m) => m.role === 'assistant');
    expect(assistantMsgInHistory?.content).toBe("Qual è l'indice del primo elemento?");
    expect(assistantMsgInHistory?.content).not.toContain('confonde indice');
  });

  test('interrompe l\'intervento in streaming con abortCurrentIntervention preservando i token parziali e mantenendo lo stato online', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();
    expect(engine.getSnapshot().connectionStatus).toBe('online');

    inference.streamDelayMs = 15;
    inference.cannedReply = 'Prima parola seconda parola terza parola';

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Ho provato ad eseguire il programma ma il ciclo non termina mai.',
    });

    const requestPromise = engine.requestMaieuticIntervention();
    // Aspetta che parta il primo token
    await new Promise((r) => setTimeout(r, 20));

    const aborted = engine.abortCurrentIntervention();
    expect(aborted).toBe(true);

    const result = await requestPromise;
    expect(result.status).toBe('aborted');

    const snap = engine.getSnapshot();
    expect(snap.connectionStatus).toBe('online');
    expect(snap.turns).toHaveLength(2);
    expect(snap.turns[0].role).toBe('student');
    expect(snap.turns[1].role).toBe('tutor');
    expect(snap.turns[1].content).toContain('Prima');
    expect(snap.turns[1].content).not.toContain('terza parola');
  });

  test('interrompe l\'intervento prima della ricezione di token inserendo l\'avviso [Intervento interrotto dallo studente] e mantenendo lo stato online', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();
    expect(engine.getSnapshot().connectionStatus).toBe('online');

    inference.streamDelayMs = 50;

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Ho provato ad eseguire il programma ma il ciclo non termina mai.',
    });

    const requestPromise = engine.requestMaieuticIntervention();
    // Interrompe immediatamente prima del delay iniziale
    engine.abortCurrentIntervention();

    const result = await requestPromise;
    expect(result.status).toBe('aborted');
    expect(result.assistantReply).toBe('[Intervento interrotto dallo studente]');

    const snap = engine.getSnapshot();
    expect(snap.connectionStatus).toBe('online');
    expect(snap.turns).toHaveLength(2);
    expect(snap.turns[1].role).toBe('tutor');
    expect(snap.turns[1].content).toBe('[Intervento interrotto dallo studente]');
  });

  test('traccia le statistiche di inferenza (finestra di contesto e velocità tok/s), aggiorna la capienza al cambio modello e le azzera con resetSession', async () => {
    const inference = new FakeInferencePort();
    inference.models = ['qwen2.5-coder-7b-instruct', 'llama-3.1-8b-instruct'];
    inference.modelContextLengths = {
      'qwen2.5-coder-7b-instruct': 32768,
      'llama-3.1-8b-instruct': 8192,
    };
    inference.cannedUsage = {
      promptTokens: 1100,
      completionTokens: 140,
      totalTokens: 1240,
      tokensPerSecond: 38.4,
    };

    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await engine.checkInferenceConnection();
    expect(engine.getSnapshot().inferenceStats).toEqual({
      contextUsedTokens: 0,
      contextMaxTokens: 32768,
      tokensPerSecond: null,
    });

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Ho provato a calcolare il fattoriale ma per n=0 restituisce zero.',
    });

    const liveUpdates: Array<{ contextUsedTokens: number; tokensPerSecond: number | null }> = [];
    await engine.requestMaieuticIntervention(undefined, {
      onStatsUpdate: (stats) => {
        liveUpdates.push({
          contextUsedTokens: stats.contextUsedTokens,
          tokensPerSecond: stats.tokensPerSecond,
        });
      },
    });

    expect(liveUpdates.length).toBeGreaterThan(0);
    expect(engine.getSnapshot().inferenceStats).toEqual({
      contextUsedTokens: 1240,
      contextMaxTokens: 32768,
      tokensPerSecond: 38.4,
    });

    // Cambio modello linguistico attivo: aggiorna immediatamente contextMaxTokens
    engine.setActiveModel('llama-3.1-8b-instruct');
    expect(engine.getSnapshot().inferenceStats).toEqual({
      contextUsedTokens: 1240,
      contextMaxTokens: 8192,
      tokensPerSecond: 38.4,
    });

    // Reset sessione: azzera i token occupati e la velocità, mantenendo la capienza del modello
    engine.resetSession();
    expect(engine.getSnapshot().inferenceStats).toEqual({
      contextUsedTokens: 0,
      contextMaxTokens: 8192,
      tokensPerSecond: null,
    });
  });

  test('gestisce la progressione maieutica a 4 stadi, l\'avanzamento manuale, il limite a stadio 4 e il reset', () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    const initial = engine.getSnapshot();
    expect(initial.currentStage).toBe(1);
    expect(initial.stage4ReachedCount).toBe(0);

    expect(engine.advanceMaieuticStage()).toBe(2);
    expect(engine.getSnapshot().currentStage).toBe(2);

    expect(engine.advanceMaieuticStage()).toBe(3);
    expect(engine.getSnapshot().currentStage).toBe(3);

    expect(engine.advanceMaieuticStage()).toBe(4);
    expect(engine.getSnapshot().currentStage).toBe(4);
    expect(engine.getSnapshot().stage4ReachedCount).toBe(1);

    // Un ulteriore avanzamento non supera lo Stadio 4
    expect(engine.advanceMaieuticStage()).toBe(4);
    expect(engine.getSnapshot().currentStage).toBe(4);
    expect(engine.getSnapshot().stage4ReachedCount).toBe(1);

    // Reset esplicito dello stadio
    engine.resetMaieuticStage();
    expect(engine.getSnapshot().currentStage).toBe(1);
  });

  test('avanza automaticamente lo stadio maieutico su turni consecutivi di blocco e lo resetta con nuovo codice', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateStudentDraft({
      studentCode: 'int sum = 0;\nfor (int i = 0; i <= n; i++) sum += v[i];',
      cognitivePreCommitment: 'Ho scritto la somma cumulativa ma ottengo un valore non corretto.',
    });

    // Inizio sessione: Stadio 1
    const res1 = await engine.requestMaieuticIntervention();
    expect(res1.status).toBe('ok');
    expect(engine.getSnapshot().currentStage).toBe(1);

    // Primo turno di blocco: non avanza ancora (richiede turni consecutivi)
    inference.cannedReply = 'Quali sono i valori dell\'indice?';
    await engine.requestMaieuticIntervention('Non lo so sinceramente.');
    expect(engine.getSnapshot().currentStage).toBe(1);

    // Secondo turno consecutivo di blocco: avanza automaticamente a Stadio 2
    inference.cannedReply = 'Proviamo a simulare il primo passo: se n vale 2, quanto vale i all\'inizio?';
    await engine.requestMaieuticIntervention('Non ho capito come fare il trace.');
    expect(engine.getSnapshot().currentStage).toBe(2);

    // Terzo turno consecutivo di blocco: avanza automaticamente a Stadio 3
    inference.cannedReply = 'Immagina una fila di scatole numerate...';
    await engine.requestMaieuticIntervention('Sono ancora bloccato, non so cosa fare.');
    expect(engine.getSnapshot().currentStage).toBe(3);

    // Risposta propositiva: azzera il conteggio di blocco consecutivo ma mantiene lo stadio corrente
    inference.cannedReply = 'Esatto, la prima scatola ha indice 0.';
    await engine.requestMaieuticIntervention('Forse la prima scatola è 0?');
    expect(engine.getSnapshot().currentStage).toBe(3);

    // Un singolo turno di blocco successivo non avanza subito a Stadio 4
    await engine.requestMaieuticIntervention('Non saprei come continuare.');
    expect(engine.getSnapshot().currentStage).toBe(3);

    // Secondo blocco consecutivo: avanza a Stadio 4
    await engine.requestMaieuticIntervention('Non ci riesco proprio, sono bloccato.');
    expect(engine.getSnapshot().currentStage).toBe(4);
    expect(engine.getSnapshot().stage4ReachedCount).toBe(1);

    // Modifica del codice e invio di un nuovo tentativo: resetta la progressione allo Stadio 1
    engine.updateStudentDraft({
      studentCode: 'int sum = 0;\nfor (int i = 0; i < n; i++) sum += v[i]; // corretto estremo',
      cognitivePreCommitment: 'Ho cambiato la condizione in i < n per non superare la dimensione.',
    });
    await engine.requestMaieuticIntervention();
    expect(engine.getSnapshot().currentStage).toBe(1);
  });

  test('configura lo scaffolding cognitivo UDL e adatta il System Prompt per stadio maieutico senza mai usare termini clinici', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Non capisco dove sbaglio nel calcolo della media degli interi.',
    });

    // Default: Stadio 1, UDL standard (triennio, no short, no micro-steps, no schemas)
    await engine.requestMaieuticIntervention();
    const initialSystemPrompt = inference.lastMessages[0].content;
    expect(initialSystemPrompt).toContain('Stadio 1');
    expect(initialSystemPrompt).toMatch(/domanda esplorativa/i);

    // Avanza a Stadio 4 e attiva le opzioni UDL
    engine.advanceMaieuticStage(); // 2
    engine.advanceMaieuticStage(); // 3
    engine.advanceMaieuticStage(); // 4
    expect(engine.getSnapshot().currentStage).toBe(4);

    engine.updateUdlConfig({
      linguisticComplexity: 'biennio',
      shortHighReadabilityReplies: true,
      microStepBreakdown: true,
      textLogicalSchemas: true,
    });

    const snapshot = engine.getSnapshot();
    expect(snapshot.udlConfig).toEqual({
      linguisticComplexity: 'biennio',
      shortHighReadabilityReplies: true,
      microStepBreakdown: true,
      textLogicalSchemas: true,
    });

    await engine.requestMaieuticIntervention('Ho provato ancora ma non arrivo al risultato.');
    const stage4SystemPrompt = inference.lastMessages[0].content;

    // Linee guida Stadio 4: sintesi in 2 punti ed escalation al docente in laboratorio (Human-in-the-Loop)
    expect(stage4SystemPrompt).toContain('Stadio 4');
    expect(stage4SystemPrompt).toMatch(/sintesi.*(blocco|nodo concettuale)/i);
    expect(stage4SystemPrompt).toMatch(/docente in laboratorio/i);
    expect(stage4SystemPrompt).toMatch(/alzare la mano/i);

    // Linee guida Scaffolding UDL
    expect(stage4SystemPrompt).toMatch(/biennio/i);
    expect(stage4SystemPrompt).toMatch(/risposte brevi/i);
    expect(stage4SystemPrompt).toMatch(/micro-passagg/i);
    expect(stage4SystemPrompt).toMatch(/schem/i);

    // ADR-0002: Divieto assoluto di etichette o termini clinico-sanitari nel System Prompt
    expect(stage4SystemPrompt).not.toMatch(/\b(DSA|BES|PDP|PEI|disabilit|diagnos)\b/i);
  });

  test('riconosce le richieste dirette di soluzione, le respinge come pre-impegno cognitivo puro ma accetta i casi misti con ipotesi reale', async () => {
    expect(isDirectSolutionRequest('Dammi la soluzione!')).toBe(true);
    expect(isDirectSolutionRequest('Mi dai subito la soluzione completa per favore?')).toBe(true);
    expect(isDirectSolutionRequest('Scrivimi il codice corretto in Python')).toBe(true);
    expect(isDirectSolutionRequest('Correggimi tu il codice')).toBe(true);
    expect(isDirectSolutionRequest('Dimmi cosa devo scrivere nella condizione')).toBe(true);
    expect(isDirectSolutionRequest('Ho usato un ciclo while ma non incrementa il contatore')).toBe(
      false
    );

    // Pura richiesta di soluzione (anche > 15 caratteri e >= 3 parole) -> respinta come pre-impegno
    expect(isMeaningfulPreCommitment('Dammi la soluzione!')).toBe(false);
    expect(isMeaningfulPreCommitment('Mi dai subito la soluzione completa per favore?')).toBe(
      false
    );
    expect(isMeaningfulPreCommitment('Scrivimi il codice completo dell\'esercizio')).toBe(false);

    // Caso misto (ipotesi reale + richiesta di soluzione) -> accettato come pre-impegno
    expect(
      isMeaningfulPreCommitment(
        'Ho provato a convertire l\'input con int ma ottengo ValueError, mi dai la soluzione?'
      )
    ).toBe(true);

    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    // Avvio da chat con pura richiesta diretta di soluzione: viene respinto dal controllo sul pre-impegno
    const rejected = await engine.requestMaieuticIntervention(
      'Dammi subito la soluzione completa!'
    );
    expect(rejected.status).toBe('rejected_pre_commitment');
    expect(engine.getSnapshot().cognitivePreCommitment).toBe('');
  });

  test('a sessione avviata tratta le richieste dirette di soluzione come blocco cognitivo e vincola il modello allo stadio attivo senza sporcare la UI', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateStudentDraft({
      studentCode: 'n = input("Numero: ")\nprint(n * 2)',
      cognitivePreCommitment:
        'Vorrei raddoppiare il numero inserito ma stampa due volte la cifra.',
    });

    // Turno 1: avvio sessione (Stadio 1), con codice allegato -> non deve invitare ridondantemente a usare il pannello di contesto
    await engine.requestMaieuticIntervention();
    expect(engine.getSnapshot().currentStage).toBe(1);
    expect(inference.lastMessages[0].content).not.toContain(
      'non ha ancora allegato codice o messaggi di errore'
    );

    // Avanziamo a Stadio 3 (analogia o micro-sintassi astratta)
    engine.advanceMaieuticStage(); // 2
    engine.advanceMaieuticStage(); // 3
    expect(engine.getSnapshot().currentStage).toBe(3);

    // 1ª richiesta diretta di soluzione nello Stadio 3: mantiene lo Stadio 3 e inietta il vincolo di Stadio 3 nel messaggio al modello
    inference.cannedReply =
      'Non posso darti la soluzione pronta, ma immagina un modulo cartaceo: ```python\neta_testo = "18"\neta_num = int(eta_testo)\n``` Come applichi questa conversione alla tua variabile `n`?';
    const solReq1 = await engine.requestMaieuticIntervention('Dammi la soluzione!');
    expect(solReq1.status).toBe('ok');
    expect(engine.getSnapshot().currentStage).toBe(3);

    // Il testo visibile nella bolla dello studente in UI resta pulito ("Dammi la soluzione!")
    const studentTurns = engine.getSnapshot().turns.filter((t) => t.role === 'student');
    expect(studentTurns[studentTurns.length - 1].content).toBe('Dammi la soluzione!');

    // Il payload inviato al modello contiene il rinforzo vincolante per lo Stadio 3 (analogia o micro-sintassi astratta, divieto di sole domande da Stadio 1)
    const lastUserMessageToModel =
      inference.lastMessages[inference.lastMessages.length - 1].content;
    expect(lastUserMessageToModel).toContain('Dammi la soluzione!');
    expect(lastUserMessageToModel).toContain('VINCOLO DI STADIO 3');
    expect(lastUserMessageToModel).toContain(
      'NON limitarti a una lista di domande esplorative da Stadio 1'
    );

    // 2ª richiesta consecutiva di soluzione: fa avanzare automaticamente allo Stadio 4 (escalation al docente)
    inference.cannedReply =
      '1. Conversione esplicita da stringa a intero.\n2. Comportamento dell\'operatore * su stringhe.\nAlza la mano per confrontarti con il docente in laboratorio.';
    const solReq2 = await engine.requestMaieuticIntervention('Dimmi cosa devo scrivere!');
    expect(solReq2.status).toBe('ok');
    expect(engine.getSnapshot().currentStage).toBe(4);

    const stage4UserMessageToModel =
      inference.lastMessages[inference.lastMessages.length - 1].content;
    expect(stage4UserMessageToModel).toContain('VINCOLO DI STADIO 4');
    expect(stage4UserMessageToModel).toContain(
      'NON porre assolutamente nuove domande guida tecniche'
    );
  });
});

