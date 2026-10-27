import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MaieuticSessionEngine } from '../src/domain/MaieuticSessionEngine';
import { mountWorkspaceUI } from '../src/ui/WorkspaceUI';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

describe('WorkspaceUI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.localStorage?.clear?.();
    window.sessionStorage?.clear?.();
  });

  test('mostra il Banner permanente di Disclosure AUP-IA (CU-05, CU-11, CU-15 e divieto CU-16..19) e i due pannelli principali', async () => {
    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(
      new FakeInferencePort(),
      new FakeEnvironmentPort()
    );

    await mountWorkspaceUI(root, engine);

    const banner = root.querySelector('[data-testid="aup-disclosure-banner"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toMatch(/AUP-IA/i);
    expect(banner?.textContent).toMatch(/CU-05/);
    expect(banner?.textContent).toMatch(/CU-11/);
    expect(banner?.textContent).toMatch(/CU-15/);
    expect(banner?.textContent).toMatch(/CU-16/);

    expect(root.querySelector('[data-testid="left-panel-context"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="right-panel-dialogue"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="connection-status-badge"]')?.textContent).toMatch(
      /Standalone Loopback|127\.0\.0\.1/i
    );
  });

  test('blocca l\'invio senza Pre-impegno Cognitivo, permette il dialogo socratico quando compilato, azzera la RAM con "Nuova Sessione" e non scrive mai su Web Storage o cookie', async () => {
    const localSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    inference.cannedReply = "Quale valore assume l'indice alla fine del ciclo?";
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());

    await mountWorkspaceUI(root, engine);

    const codeInput = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    const errorInput = root.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>(
      '#pre-commitment-input'
    )!;
    const contextForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;

    codeInput.value = 'int x = 10 / 0;';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    errorInput.value = 'Floating point exception';
    errorInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Tentativo senza Pre-impegno Cognitivo
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const alertBox = root.querySelector('[data-testid="pedagogical-feedback"]');
    expect(alertBox?.textContent).toMatch(/Pre-impegno Cognitivo/i);

    // Compilazione Pre-impegno Cognitivo e invio
    preCommitmentInput.value =
      'Ho provato a calcolare il rapporto tra due interi, ma il divisore diventa zero e il programma termina.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 10));

    const dialogueList = root.querySelector('[data-testid="dialogue-turns-list"]')!;
    expect(dialogueList.textContent).toContain(
      "Quale valore assume l'indice alla fine del ciclo?"
    );

    // Verifica Regime Zero-Data: zero scritture su localStorage / sessionStorage / cookie
    expect(localSetItemSpy).not.toHaveBeenCalled();
    expect(window.localStorage?.length ?? 0).toBe(0);
    expect(window.sessionStorage?.length ?? 0).toBe(0);
    expect(document.cookie).toBe('');

    // Clic su "Nuova Sessione" distrugge tutto lo stato in RAM
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
    newSessionBtn.click();

    expect(codeInput.value).toBe('');
    expect(errorInput.value).toBe('');
    expect(preCommitmentInput.value).toBe('');
    expect(dialogueList.textContent).not.toContain(
      "Quale valore assume l'indice alla fine del ciclo?"
    );
  });

  test('consente di configurare un Endpoint LAN RFC 1918 valido e mostra un errore se si inserisce un URL pubblico', async () => {
    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(
      new FakeInferencePort(),
      new FakeEnvironmentPort()
    );

    await mountWorkspaceUI(root, engine);

    const endpointInput = root.querySelector<HTMLInputElement>('#endpoint-url-input')!;
    const endpointForm = root.querySelector<HTMLFormElement>('#endpoint-config-form')!;

    // URL pubblico rifiutato
    endpointInput.value = 'https://api.openai.com/v1';
    endpointForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const feedback = root.querySelector('[data-testid="pedagogical-feedback"]')!;
    expect(feedback.textContent).toMatch(/rifiutato|isolamento/i);

    // URL LAN RFC 1918 accettato
    endpointInput.value = 'http://192.168.1.200:1234/v1';
    endpointForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 10));

    expect(root.querySelector('[data-testid="connection-status-badge"]')?.textContent).toMatch(
      /Endpoint LAN/i
    );
  });
});
