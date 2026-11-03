import { beforeEach, describe, expect, test } from 'vitest';
import { MaieuticSessionEngine } from '../src/domain/MaieuticSessionEngine';
import { mountWorkspaceUI } from '../src/ui/WorkspaceUI';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

describe('WorkspaceUI ActivityContext and AntiSolutionGuardrail (Seam 3)', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById('app')!;
  });

  test('mostra il selettore dei 6 preset curricolari e aggiorna lo snapshot al cambio', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await mountWorkspaceUI(root, engine);

    const presetSelect = root.querySelector<HTMLSelectElement>('[data-testid="curricular-preset-select"]')!;
    expect(presetSelect).not.toBeNull();
    expect(presetSelect.options).toHaveLength(6);

    const optionValues = Array.from(presetSelect.options).map((o) => o.value);
    expect(optionValues).toEqual(['pseudocode', 'c_cpp', 'python', 'java', 'sql', 'web']);

    // Seleziona Python
    presetSelect.value = 'python';
    presetSelect.dispatchEvent(new Event('change'));

    expect(engine.getSnapshot().activityContext.curricularPreset).toBe('python');
  });

  test('mostra il badge e i controlli dei livelli didattici AUP (1, 2, 3) e sincronizza la selezione', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await mountWorkspaceUI(root, engine);

    const badge = root.querySelector<HTMLElement>('[data-testid="aup-level-badge"]')!;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Livello didattico AUP 2');

    const btnL1 = root.querySelector<HTMLButtonElement>('[data-testid="aup-level-btn-1"]')!;
    expect(btnL1).not.toBeNull();
    btnL1.click();

    expect(engine.getSnapshot().activityContext.aupLevel).toBe(1);
    expect(badge.textContent).toContain('Livello didattico AUP 1');
    expect(btnL1.classList.contains('tm-aup-btn-active')).toBe(true);

    const btnL3 = root.querySelector<HTMLButtonElement>('[data-testid="aup-level-btn-3"]')!;
    btnL3.click();

    expect(engine.getSnapshot().activityContext.aupLevel).toBe(3);
    expect(badge.textContent).toContain('Livello didattico AUP 3');
    expect(btnL3.classList.contains('tm-aup-btn-active')).toBe(true);
  });

  test('permette l\'inserimento di traccia e vincoli aggiornando il contesto dell\'attività', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    await mountWorkspaceUI(root, engine);

    const promptInput = root.querySelector<HTMLTextAreaElement>('[data-testid="exercise-prompt-input"]')!;
    const constraintsInput = root.querySelector<HTMLTextAreaElement>('[data-testid="didactic-constraints-input"]')!;
    expect(promptInput).not.toBeNull();
    expect(constraintsInput).not.toBeNull();

    promptInput.value = 'Calcolare il massimo comune divisore con algoritmo di Euclide.';
    promptInput.dispatchEvent(new Event('input'));

    constraintsInput.value = 'Non usare librerie matematiche esterne.';
    constraintsInput.dispatchEvent(new Event('input'));

    expect(engine.getSnapshot().activityContext.exercisePrompt).toBe(
      'Calcolare il massimo comune divisore con algoritmo di Euclide.'
    );
    expect(engine.getSnapshot().activityContext.didacticConstraints).toBe(
      'Non usare librerie matematiche esterne.'
    );
  });

  test('mostra l\'avviso educativo nel dialogo ed evidenzia l\'intervento del guardrail anti-soluzione nelle statistiche', async () => {
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    // Imposta Livello 1
    engine.updateActivityContext({ curricularPreset: 'python', aupLevel: 1 });

    // Canned reply che viola Livello 1 (fornisce codice)
    inference.cannedReply = `
\`\`\`python
risultato = a + b
print(risultato)
\`\`\`
    `;

    await mountWorkspaceUI(root, engine);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    preCommitmentInput.value = 'Vorrei capire come calcolare la somma di due numeri inseriti.';
    preCommitmentInput.dispatchEvent(new Event('input'));

    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Attendi completamento dell'intervento
    await new Promise((r) => setTimeout(r, 20));

    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
    expect(dialogueList.textContent).toContain('Richiamo educativo al livello didattico AUP 1');
    expect(dialogueList.textContent).not.toContain('print(risultato)');

    // Contatore interventi anti-soluzione nelle statistiche
    const statAntiSolution = root.querySelector<HTMLElement>('[data-testid="stat-anti-solution-interventions"]')!;
    expect(statAntiSolution).not.toBeNull();
    expect(statAntiSolution.textContent).toBe('1');
  });
});
