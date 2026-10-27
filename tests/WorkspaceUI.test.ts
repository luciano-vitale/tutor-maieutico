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

  test('mostra il banner permanente di disclosure AUP-IA (CU-05, CU-11, CU-15 e divieto CU-16..19), i pulsanti ad icona vettoriale con tooltip e i due pannelli', async () => {
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

    const newSessionBtn = root.querySelector('[data-testid="new-session-btn"]');
    expect(newSessionBtn?.getAttribute('data-tooltip')).toMatch(/Nuova sessione/i);
    expect(newSessionBtn?.querySelector('svg')).not.toBeNull();

    const sendFollowUpBtn = root.querySelector('[data-testid="send-followup-btn"]');
    expect(sendFollowUpBtn?.getAttribute('data-tooltip')).toMatch(/Invia risposta socratica/i);
    expect(sendFollowUpBtn?.querySelector('svg')).not.toBeNull();
  });

  test('blocca l\'invio senza pre-impegno cognitivo, mostra subito il messaggio inviato e l\'animazione stile Gemini durante l\'elaborazione, azzera la RAM con "Nuova sessione" e non scrive mai su Web Storage o cookie', async () => {
    const localSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    inference.cannedReply = "Quale valore assume l'indice alla fine del ciclo?";

    let resolveChat!: (value: string) => void;
    inference.completeChat = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveChat = resolve;
        })
    );

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

    // Tentativo senza pre-impegno cognitivo
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const alertBox = root.querySelector('[data-testid="pedagogical-feedback"]');
    expect(alertBox?.textContent).toMatch(/pre-impegno cognitivo/i);

    // Compilazione pre-impegno cognitivo e invio
    preCommitmentInput.value =
      'Ho provato a calcolare il rapporto tra due interi, ma il divisore diventa zero e il programma termina.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verifica feedback immediato di invio (Optimistic UI) e animazione di elaborazione stile Gemini
    const dialogueList = root.querySelector('[data-testid="dialogue-turns-list"]')!;
    expect(dialogueList.textContent).toContain('int x = 10 / 0;');
    expect(root.querySelector('[data-testid="message-sent-indicator"]')?.textContent).toBe(
      'Inviato'
    );
    expect(root.querySelector('[data-testid="tutor-thinking-indicator"]')).not.toBeNull();

    // Risoluzione della risposta del tutor maieutico
    resolveChat("Quale valore assume l'indice alla fine del ciclo?");
    await new Promise((r) => setTimeout(r, 10));

    expect(root.querySelector('[data-testid="tutor-thinking-indicator"]')).toBeNull();
    expect(dialogueList.textContent).toContain(
      "Quale valore assume l'indice alla fine del ciclo?"
    );

    // Verifica regime zero-data: zero scritture su localStorage / sessionStorage / cookie
    expect(localSetItemSpy).not.toHaveBeenCalled();
    expect(window.localStorage?.length ?? 0).toBe(0);
    expect(window.sessionStorage?.length ?? 0).toBe(0);
    expect(document.cookie).toBe('');

    // Clic su "Nuova sessione" distrugge tutto lo stato in RAM
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
    newSessionBtn.click();

    expect(codeInput.value).toBe('');
    expect(errorInput.value).toBe('');
    expect(preCommitmentInput.value).toBe('');
    expect(dialogueList.textContent).not.toContain(
      "Quale valore assume l'indice alla fine del ciclo?"
    );
  });

  test('consente di configurare un endpoint LAN RFC 1918 valido e mostra un errore se si inserisce un URL pubblico', async () => {
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

  test('gestisce la barra laterale collassabile stile LM Studio (con riapertura automatica se manca il pre-impegno cognitivo), il selettore tema chiaro/scuro in RAM e lo streaming in-place senza blinking', async () => {
    const localSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();

    let streamCallbacks: {
      onToken?: (chunk: string) => void;
      onReasoningToken?: (chunk: string) => void;
    } = {};
    let resolveChat!: (value: string) => void;

    inference.completeChat = vi.fn().mockImplementation((_messages, options) => {
      expect(options?.stream).toBe(true);
      streamCallbacks = {
        onToken: options?.onToken,
        onReasoningToken: options?.onReasoningToken,
      };
      return new Promise<string>((resolve) => {
        resolveChat = resolve;
      });
    });

    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    // 1. Nessuna checkbox toggle SSE ridondante
    expect(root.querySelector('#stream-mode-checkbox')).toBeNull();

    // 2. Sidebar stile LM Studio: aperta all'avvio, chiudibile con l'icona, riaperta se manca il pre-impegno
    const sidebarBtn = root.querySelector<HTMLButtonElement>('[data-testid="sidebar-toggle-btn"]')!;
    const leftSidebar = root.querySelector<HTMLElement>('[data-testid="left-panel-context"]')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    expect(sidebarBtn).not.toBeNull();
    expect(sidebarBtn.querySelector('svg')).not.toBeNull();
    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(leftSidebar.hidden).toBe(false);

    sidebarBtn.click();
    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(leftSidebar.hidden).toBe(true);

    // Tentativo di invio dal composer mentre la sidebar è chiusa e il pre-impegno cognitivo è vuoto
    const followUpInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followUpForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;
    followUpInput.value = 'Non capisco perché non funziona';
    followUpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(leftSidebar.hidden).toBe(false);
    expect(document.activeElement).toBe(preCommitmentInput);

    // 3. Selettore tema chiaro/scuro esclusivamente in RAM
    const themeBtn = root.querySelector<HTMLButtonElement>('[data-testid="theme-toggle-btn"]')!;
    expect(themeBtn).not.toBeNull();
    expect(document.documentElement.dataset.theme).toBe('dark');

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('light');

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localSetItemSpy).not.toHaveBeenCalled();

    // 4. Streaming in-place senza blinking (identità dei nodi DOM preservata e blocco reasoning collassabile)
    preCommitmentInput.value =
      'Ho impostato il ciclo con indice i da 0 a N, ma all\'ultimo giro legge fuori dall\'array.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    const contextForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
    const studentTurnElBefore = dialogueList.querySelector('.tm-turn-student')!;
    const tutorTurnElBefore = dialogueList.querySelector('.tm-turn-tutor')!;
    expect(studentTurnElBefore).not.toBeNull();
    expect(tutorTurnElBefore).not.toBeNull();

    // Arrivo del primo token di ragionamento: blocco <details> aperto
    streamCallbacks.onReasoningToken?.('Controllo i limiti dell\'array...');
    const reasoningDetails = tutorTurnElBefore.querySelector<HTMLDetailsElement>(
      '[data-testid="tutor-reasoning-details"]'
    )!;
    expect(reasoningDetails).not.toBeNull();
    expect(reasoningDetails.open).toBe(true);
    expect(reasoningDetails.textContent).toContain("Controllo i limiti dell'array...");

    // Arrivo dei token della risposta maieutica: il blocco <details> si collassa e i nodi DOM NON vengono ricreati
    streamCallbacks.onToken?.('Qual è ');
    expect(reasoningDetails.open).toBe(false);
    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    expect(dialogueList.querySelector('.tm-turn-tutor')).toBe(tutorTurnElBefore);

    streamCallbacks.onToken?.("l'ultimo indice valido?");
    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    expect(dialogueList.querySelector('.tm-turn-tutor')).toBe(tutorTurnElBefore);
    expect(tutorTurnElBefore.querySelector('.tm-stream-cursor')).toBeNull();

    // Fine stream: il nodo del tutor resta lo stesso identico elemento DOM (zero animazione fade-in ripetuta)
    resolveChat("Qual è l'ultimo indice valido?");
    await new Promise((r) => setTimeout(r, 10));

    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    expect(dialogueList.querySelector('.tm-turn-tutor')).toBe(tutorTurnElBefore);
    expect(tutorTurnElBefore.textContent).toContain("Qual è l'ultimo indice valido?");
  });

  test('mostra il titolo "StudIA Tutor maieutico" e consente di aprire e chiudere la topbar "Disclosure AUP-IA" tramite l\'icona stile LM Studio posizionata di fianco a quella della sidebar', async () => {
    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(
      new FakeInferencePort(),
      new FakeEnvironmentPort()
    );

    await mountWorkspaceUI(root, engine);

    const titleEl = root.querySelector<HTMLElement>('.tm-title')!;
    expect(titleEl.textContent).toBe('StudIA Tutor maieutico');

    const sidebarBtn = root.querySelector<HTMLButtonElement>('[data-testid="sidebar-toggle-btn"]')!;
    const topbarBtn = root.querySelector<HTMLButtonElement>('[data-testid="topbar-toggle-btn"]')!;
    const disclosureBanner = root.querySelector<HTMLElement>('[data-testid="aup-disclosure-banner"]')!;

    expect(topbarBtn).not.toBeNull();
    expect(topbarBtn.querySelector('svg')).not.toBeNull();
    expect(sidebarBtn.nextElementSibling).toBe(topbarBtn);
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(disclosureBanner.hidden).toBe(false);

    topbarBtn.click();
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(disclosureBanner.hidden).toBe(true);

    topbarBtn.click();
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(disclosureBanner.hidden).toBe(false);
  });
});


