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
    expect(newSessionBtn?.getAttribute('data-tooltip')).toBe('Nuova sessione');
    expect(newSessionBtn?.textContent?.trim()).toBe('');
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

    // Clic su "Nuova sessione" distrugge tutto lo stato in RAM e riposiziona il focus sul pre-impegno
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
    newSessionBtn.click();

    expect(codeInput.value).toBe('');
    expect(errorInput.value).toBe('');
    expect(preCommitmentInput.value).toBe('');
    expect(document.activeElement).toBe(preCommitmentInput);
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

    // 3. Selettore tema chiaro/scuro esclusivamente in RAM (tema chiaro predefinito all'avvio)
    const themeBtn = root.querySelector<HTMLButtonElement>('[data-testid="theme-toggle-btn"]')!;
    expect(themeBtn).not.toBeNull();
    expect(document.documentElement.dataset.theme).toBe('light');

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('dark');

    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('light');
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
    expect(studentTurnElBefore.querySelector('.tm-turn-author')).toBeNull();
    expect(tutorTurnElBefore.querySelector('[data-testid="copy-turn-btn"]')).not.toBeNull();
  });

  test('razionalizza la UI con StudIA come titolo, Tutor Maieutico come sottotitolo sulla stessa riga, tutte le 5 icone a destra e pannello di connessione verticale', async () => {
    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(
      new FakeInferencePort(),
      new FakeEnvironmentPort()
    );

    await mountWorkspaceUI(root, engine);

    const titleEl = root.querySelector<HTMLElement>('.tm-title')!;
    expect(titleEl.textContent).toBe('StudIA');
    expect(titleEl.querySelector('.tm-brand-i')?.textContent).toBe('I');
    expect(titleEl.querySelector('.tm-brand-a')?.textContent).toBe('A');

    const subtitleEl = root.querySelector<HTMLElement>('.tm-subtitle')!;
    expect(subtitleEl.textContent).toContain('Tutor Maieutico');
    expect(subtitleEl.textContent).toContain('Marconi-Hack');

    const toolbar = root.querySelector<HTMLElement>('.tm-toolbar')!;
    const sidebarBtn = root.querySelector<HTMLButtonElement>('[data-testid="sidebar-toggle-btn"]')!;
    const topbarBtn = root.querySelector<HTMLButtonElement>('[data-testid="topbar-toggle-btn"]')!;
    const themeBtn = root.querySelector<HTMLButtonElement>('[data-testid="theme-toggle-btn"]')!;
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
    const connectionBtn = root.querySelector<HTMLButtonElement>('[data-testid="connection-toggle-btn"]')!;

    const disclosureBanner = root.querySelector<HTMLElement>('[data-testid="aup-disclosure-banner"]')!;
    const connectionPanel = root.querySelector<HTMLElement>('[data-testid="connection-settings-panel"]')!;
    const leftSidebar = root.querySelector<HTMLElement>('[data-testid="left-panel-context"]')!;

    // Verifica sequenza delle 5 icone raggruppate nella toolbar di destra
    expect(Array.from(toolbar.children)).toEqual([
      sidebarBtn,
      topbarBtn,
      themeBtn,
      newSessionBtn,
      connectionBtn,
    ]);
    expect(connectionBtn.querySelector('svg')).not.toBeNull();

    // Topbar Disclosure AUP-IA parte chiusa all'avvio e si apre/chiude al clic
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(disclosureBanner.hidden).toBe(true);

    topbarBtn.click();
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(disclosureBanner.hidden).toBe(false);

    topbarBtn.click();
    expect(topbarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(disclosureBanner.hidden).toBe(true);

    // Pannello connessione verticale parte chiuso all'avvio nel workspace e si apre/chiude al clic sull'ingranaggio
    expect(connectionPanel.classList.contains('tm-panel-settings')).toBe(true);
    expect(connectionBtn.getAttribute('aria-expanded')).toBe('false');
    expect(connectionPanel.hidden).toBe(true);

    connectionBtn.click();
    expect(connectionBtn.getAttribute('aria-expanded')).toBe('true');
    expect(connectionPanel.hidden).toBe(false);

    connectionBtn.click();
    expect(connectionBtn.getAttribute('aria-expanded')).toBe('false');
    expect(connectionPanel.hidden).toBe(true);

    // Su viewport intermedi (< 1100px), l'apertura del pannello di connessione alterna la chiusura della sidebar sinistra
    window.innerWidth = 800;
    sidebarBtn.click();
    expect(leftSidebar.hidden).toBe(false);
    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('true');

    connectionBtn.click();
    expect(connectionPanel.hidden).toBe(false);
    expect(leftSidebar.hidden).toBe(true);
    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('false');
  });

  test('adotta il layout thinking-first posizionando il pre-impegno cognitivo prima di codice ed errore nel form', async () => {
    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(
      new FakeInferencePort(),
      new FakeEnvironmentPort()
    );

    await mountWorkspaceUI(root, engine);

    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const textareas = Array.from(form.querySelectorAll<HTMLTextAreaElement>('textarea'));
    expect(textareas.map((t) => t.id)).toEqual([
      'pre-commitment-input',
      'student-code-input',
      'compiler-error-input',
    ]);

    const firstFormGroup = form.querySelector('.tm-form-group');
    expect(firstFormGroup?.classList.contains('tm-precommitment-card')).toBe(true);
    expect(firstFormGroup?.querySelector('#pre-commitment-input')).not.toBeNull();
  });

  test('trasforma il pulsante di invio in pulsante di stop cliccabile durante l\'elaborazione e interrompe l\'intervento al click', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const env = new FakeEnvironmentPort();
    const engine = new MaieuticSessionEngine(inference, env);

    inference.streamDelayMs = 40;
    inference.cannedReply = 'Indizio maieutico importante';

    await mountWorkspaceUI(root, engine);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    preCommitmentInput.value = 'Ho ipotizzato che il ciclo si arresti a 10 ma va in crash.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    const requestBtn = root.querySelector<HTMLButtonElement>('[data-testid="request-intervention-btn"]')!;
    const sendFollowUpBtn = root.querySelector<HTMLButtonElement>('[data-testid="send-followup-btn"]')!;
    const followUpInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;

    // Prima dell'invio: stato idle
    expect(requestBtn.dataset.busy).toBeUndefined();
    expect(sendFollowUpBtn.dataset.busy).toBeUndefined();
    expect(sendFollowUpBtn.getAttribute('aria-label')).toBe('Invia risposta socratica');

    // Invia dal form laterale
    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Durante l'elaborazione: entrambi i pulsanti sono abilitati, con data-busy="true" e icona/etichetta di stop
    expect(requestBtn.disabled).toBe(false);
    expect(requestBtn.dataset.busy).toBe('true');
    expect(requestBtn.textContent).toContain('Interrompi elaborazione');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Interrompi elaborazione');

    expect(sendFollowUpBtn.disabled).toBe(false);
    expect(sendFollowUpBtn.dataset.busy).toBe('true');
    expect(sendFollowUpBtn.getAttribute('aria-label')).toBe('Interrompi elaborazione');
    expect(sendFollowUpBtn.getAttribute('data-tooltip')).toBe('Interrompi elaborazione');

    // Il tasto Invio nella textarea non fa nulla durante l'elaborazione
    followUpInput.value = 'Altro testo';
    const enterEvt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    followUpInput.dispatchEvent(enterEvt);
    expect(enterEvt.defaultPrevented).toBe(true);

    // Clicca sul pulsante di stop FAB per interrompere
    sendFollowUpBtn.click();
    await new Promise((r) => setTimeout(r, 60));

    // Dopo l'interruzione: i pulsanti tornano allo stato idle
    expect(requestBtn.dataset.busy).toBe('false');
    expect(requestBtn.textContent).toContain('Avvia intervento maieutico');
    expect(sendFollowUpBtn.dataset.busy).toBe('false');
    expect(sendFollowUpBtn.getAttribute('aria-label')).toBe('Invia risposta socratica');

    // Il dialogo contiene il turno studente e il turno interrotto
    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
    const turns = dialogueList.querySelectorAll('.tm-turn');
    expect(turns.length).toBe(2);

    const tutorTurn = dialogueList.querySelector('.tm-turn-tutor')!;
    expect(tutorTurn.textContent).toMatch(/Indizio maieutico|\[Intervento interrotto dallo studente\]/);

    // Lo stato di connessione resta online (nessun falso allarme offline)
    const badge = root.querySelector<HTMLElement>('[data-testid="connection-status-badge"]')!;
    expect(badge.dataset.status).toBe('online');
  });
});


