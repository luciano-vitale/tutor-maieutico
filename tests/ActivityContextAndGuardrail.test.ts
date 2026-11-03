import { describe, expect, test } from 'vitest';
import {
  MaieuticSessionEngine,
  CURRICULAR_PRESETS,
  type ActivityContext,
  buildMaieuticSystemPrompt,
  DEFAULT_UDL_CONFIG,
} from '../src/domain/MaieuticSessionEngine';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

describe('ActivityContext and AntiSolutionGuardrail in MaieuticSessionEngine (Seam 2)', () => {
  test('supporta i 6 preset curricolari dell\'I.I.S.S. Marconi-Hack con metadati definiti', () => {
    const expectedPresetIds = ['pseudocode', 'c_cpp', 'python', 'java', 'sql', 'web'];
    const actualIds = CURRICULAR_PRESETS.map((p) => p.id);
    expect(actualIds).toEqual(expectedPresetIds);

    const actualNames = CURRICULAR_PRESETS.map((p) => p.name);
    expect(actualNames).toEqual([
      'Pseudocodice/Algoritmica',
      'C/C++',
      'Python',
      'Java',
      'SQL/Database',
      'Web HTML/CSS/JS/PHP',
    ]);
  });

  test('aggiorna il contesto dell\'attività (preset, traccia, vincoli, livello AUP) nello snapshot', () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    const initialSnapshot = engine.getSnapshot();
    expect(initialSnapshot.activityContext.curricularPreset).toBe('c_cpp');
    expect(initialSnapshot.activityContext.aupLevel).toBe(2);
    expect(initialSnapshot.antiSolutionInterventionsCount).toBe(0);

    engine.updateActivityContext({
      curricularPreset: 'python',
      exercisePrompt: 'Scrivere una funzione che calcoli la media di una lista di numeri.',
      didacticConstraints: 'Non utilizzare sum() o len() di libreria.',
      aupLevel: 2,
    });

    const updated = engine.getSnapshot();
    expect(updated.activityContext).toEqual({
      curricularPreset: 'python',
      exercisePrompt: 'Scrivere una funzione che calcoli la media di una lista di numeri.',
      didacticConstraints: 'Non utilizzare sum() o len() di libreria.',
      aupLevel: 2,
    });
  });

  test('genera il System Prompt includendo preset curricolare, traccia, vincoli e livello AUP 1', () => {
    const context: ActivityContext = {
      curricularPreset: 'c_cpp',
      exercisePrompt: 'Invertire un array in-place.',
      didacticConstraints: 'Non usare vettori ausiliari o std::reverse.',
      aupLevel: 1,
    };

    const prompt = buildMaieuticSystemPrompt(1, DEFAULT_UDL_CONFIG, context);

    expect(prompt).toContain('C/C++');
    expect(prompt).toContain('Invertire un array in-place.');
    expect(prompt).toContain('Non usare vettori ausiliari o std::reverse.');
    expect(prompt).toMatch(/livello 1/i);
    expect(prompt).toMatch(/supporto preliminare e chiarimenti concettuali/i);
    expect(prompt).toMatch(/zero codice nella sintassi target/i);
  });

  test('genera il System Prompt con regole per livello AUP 2 e livello AUP 3', () => {
    const contextL2: ActivityContext = {
      curricularPreset: 'python',
      exercisePrompt: 'Ricerca binaria',
      didacticConstraints: 'Nessuna libreria esterna',
      aupLevel: 2,
    };
    const promptL2 = buildMaieuticSystemPrompt(2, DEFAULT_UDL_CONFIG, contextL2);
    expect(promptL2).toMatch(/livello 2/i);
    expect(promptL2).toMatch(/revisione assistita/i);
    expect(promptL2).toMatch(/massimo 3 righe/i);

    const contextL3: ActivityContext = {
      ...contextL2,
      aupLevel: 3,
    };
    const promptL3 = buildMaieuticSystemPrompt(3, DEFAULT_UDL_CONFIG, contextL3);
    expect(promptL3).toMatch(/livello 3/i);
    expect(promptL3).toMatch(/co-progettazione socratica e debugging/i);
    expect(promptL3).toMatch(/massimo 3 righe/i);
  });

  test('in Livello 1: il guardrail intercetta e oscura qualsiasi codice restituito dall\'LLM, incrementando il contatore', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateActivityContext({
      curricularPreset: 'python',
      aupLevel: 1,
    });

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Vorrei capire come calcolare il fattoriale di un numero senza ricorsione.',
    });

    // Simuliamo un LLM che tenta di dare codice in Livello 1 (violazione invariante di non-sostituzione)
    inference.cannedReply = `
Ecco un esempio di codice:
\`\`\`python
fattoriale = 1
for i in range(1, n + 1):
    fattoriale *= i
\`\`\`
Ti è chiaro questo passaggio?
    `;

    const result = await engine.requestMaieuticIntervention();
    expect(result.status).toBe('ok');
    expect(result.assistantReply).not.toContain('fattoriale *= i');
    expect(result.assistantReply).toContain('Richiamo educativo al livello didattico AUP 1');

    const snapshot = engine.getSnapshot();
    expect(snapshot.antiSolutionInterventionsCount).toBe(1);
    expect(snapshot.turns[snapshot.turns.length - 1].content).toContain(
      'Richiamo educativo al livello didattico AUP 1'
    );
  });

  test('in Livelli 2 e 3: ammette micro-esempi <= 3 righe ma blocca blocchi > 3 righe o soluzioni complete', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateActivityContext({
      curricularPreset: 'c_cpp',
      aupLevel: 2,
    });

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Ho scritto il ciclo per scambiare gli estremi ma perdo l\'elemento originale.',
    });

    // Micro-esempio consentito (2 righe eseguibili astratte)
    inference.cannedReply = `
In C puoi scambiare due valori usando una variabile temporanea:
\`\`\`c
int temp = a;
a = b;
b = temp;
\`\`\`
Come puoi applicarlo al tuo vettore?
    `;

    const res1 = await engine.requestMaieuticIntervention();
    expect(res1.status).toBe('ok');
    expect(res1.assistantReply).toContain('int temp = a;');
    expect(engine.getSnapshot().antiSolutionInterventionsCount).toBe(0);

    // Risposta con funzione completa vietata (jailbreak o allucinazione)
    inference.cannedReply = `
Ecco la funzione completa risolta:
\`\`\`c
void inverti(int *v, int n) {
    for (int i = 0; i < n/2; i++) {
        int t = v[i];
        v[i] = v[n - 1 - i];
        v[n - 1 - i] = t;
    }
}
\`\`\`
    `;

    const res2 = await engine.requestMaieuticIntervention('Ho provato ma non sono sicuro della funzione.');
    expect(res2.status).toBe('ok');
    expect(res2.assistantReply).not.toContain('void inverti');
    expect(res2.assistantReply).toContain('invariante di non-sostituzione');
    expect(engine.getSnapshot().antiSolutionInterventionsCount).toBe(1);
  });

  test('resetSession azzera il contatore degli interventi del guardrail anti-soluzione', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    engine.updateActivityContext({
      curricularPreset: 'java',
      aupLevel: 1,
    });

    engine.updateStudentDraft({
      cognitivePreCommitment: 'Come funziona la classe Scanner in Java per leggere da tastiera?',
    });

    inference.cannedReply = `
\`\`\`java
Scanner sc = new Scanner(System.in);
int x = sc.nextInt();
\`\`\`
    `;

    await engine.requestMaieuticIntervention();
    expect(engine.getSnapshot().antiSolutionInterventionsCount).toBe(1);

    engine.resetSession();
    expect(engine.getSnapshot().antiSolutionInterventionsCount).toBe(0);
  });
});
