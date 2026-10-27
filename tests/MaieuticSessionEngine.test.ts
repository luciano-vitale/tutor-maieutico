import { describe, expect, test } from 'vitest';
import { MaieuticSessionEngine } from '../src/domain/MaieuticSessionEngine';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

describe('MaieuticSessionEngine', () => {
  test('blocca la richiesta di Intervento Maieutico se il Pre-impegno Cognitivo è assente o non significativo', async () => {
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
    expect(emptyAttempt.pedagogicalMessage).toMatch(/Pre-impegno Cognitivo/i);
    expect(engine.getSnapshot().turns).toHaveLength(0);

    engine.updateStudentDraft({
      cognitivePreCommitment: 'non so',
    });

    const tooShortAttempt = await engine.requestMaieuticIntervention();
    expect(tooShortAttempt.status).toBe('rejected_pre_commitment');
    expect(engine.getSnapshot().turns).toHaveLength(0);
  });

  test('consente l\'Intervento Maieutico sul tentativo, permette follow-up socratici e consente di inviare un tentativo di codice aggiornato nei turni successivi', async () => {
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

  test('azzera istantaneamente tutti i dati della Sessione Maieutica in RAM con resetSession ("Nuova Sessione")', async () => {
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
  });
});
