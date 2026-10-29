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
    expect(banner?.querySelector('.tm-disclosure-icon')).toBeNull();
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

    // Tentativo senza pre-impegno cognitivo: risposta immediata direttamente in chat dal tutor, nessun avviso banner
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const dialogueList = root.querySelector('[data-testid="dialogue-turns-list"]')!;
    expect(dialogueList.textContent).toMatch(/pre-impegno cognitivo obbligatorio/i);
    const alertBox = root.querySelector('[data-testid="pedagogical-feedback"]');
    expect(alertBox?.textContent ?? '').toBe('');
    expect(document.activeElement).toBe(preCommitmentInput);

    // Compilazione pre-impegno cognitivo e invio
    preCommitmentInput.value =
      'Ho provato a calcolare il rapporto tra due interi, ma il divisore diventa zero e il programma termina.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verifica feedback immediato di invio (Optimistic UI) e animazione di elaborazione stile Gemini
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

    // Tentativo di invio dal composer mentre la sidebar è chiusa e il pre-impegno cognitivo è insufficiente (< 15 caratteri / < 3 parole)
    const followUpInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followUpForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;
    followUpInput.value = 'non va';
    followUpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(sidebarBtn.getAttribute('aria-expanded')).toBe('true');
    expect(leftSidebar.hidden).toBe(false);
    expect(document.activeElement).toBe(preCommitmentInput);
    expect(preCommitmentInput.value).toBe('non va');
    expect(followUpInput.value).toBe('');

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
    const tutorTurnElBefore = dialogueList.querySelector<HTMLElement>('[data-pending-tutor="true"]')!;
    expect(studentTurnElBefore).not.toBeNull();
    expect(tutorTurnElBefore).not.toBeNull();

    // Arrivo del primo token di ragionamento in modalità standard: riquadro compatto a 3 righe con scorrimento
    streamCallbacks.onReasoningToken?.('Controllo i limiti dell\'array...');
    const ephemeralBox = tutorTurnElBefore.querySelector<HTMLElement>(
      '[data-testid="tutor-reasoning-ephemeral"]'
    )!;
    expect(ephemeralBox).not.toBeNull();
    expect(ephemeralBox.hidden).toBe(false);
    const scrollBox = tutorTurnElBefore.querySelector<HTMLElement>(
      '[data-testid="tutor-reasoning-scroll-box"]'
    )!;
    expect(scrollBox.textContent).toContain("Controllo i limiti dell'array...");

    // Arrivo dei token della risposta maieutica: il riquadro di ragionamento viene nascosto e i nodi DOM NON vengono ricreati
    streamCallbacks.onToken?.('Qual è ');
    expect(ephemeralBox.hidden).toBe(true);
    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    const tutorTurns1 = dialogueList.querySelectorAll('.tm-turn-tutor');
    expect(tutorTurns1[tutorTurns1.length - 1]).toBe(tutorTurnElBefore);

    streamCallbacks.onToken?.("l'ultimo indice valido?");
    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    const tutorTurns2 = dialogueList.querySelectorAll('.tm-turn-tutor');
    expect(tutorTurns2[tutorTurns2.length - 1]).toBe(tutorTurnElBefore);
    expect(tutorTurnElBefore.querySelector('.tm-stream-cursor')).toBeNull();

    // Fine stream: il riquadro di ragionamento viene rimosso dal DOM (studente protetto da spoiler), nessun fade-in ripetuto
    resolveChat("Qual è l'ultimo indice valido?");
    await new Promise((r) => setTimeout(r, 10));

    expect(dialogueList.querySelector('.tm-turn-student')).toBe(studentTurnElBefore);
    const tutorTurns3 = dialogueList.querySelectorAll('.tm-turn-tutor');
    expect(tutorTurns3[tutorTurns3.length - 1]).toBe(tutorTurnElBefore);
    expect(tutorTurnElBefore.textContent).toContain("Qual è l'ultimo indice valido?");
    expect(tutorTurnElBefore.querySelector('[data-testid="tutor-reasoning-ephemeral"]')).toBeNull();
    expect(tutorTurnElBefore.querySelector('[data-testid="tutor-reasoning-details"]')).toBeNull();
    expect(studentTurnElBefore.querySelector('.tm-turn-author')).toBeNull();
    expect(tutorTurnElBefore.querySelector('[data-testid="copy-turn-btn"]')).not.toBeNull();
  });

  test('razionalizza la UI con StudIA come titolo, Impara ragionando! come sottotitolo sulla stessa riga, tutte le 5 icone a destra e pannello di connessione verticale', async () => {
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
    expect(subtitleEl.textContent).toContain('Impara ragionando!');

    const footnoteEl = root.querySelector<HTMLElement>('.tm-composer-footnote')!;
    expect(footnoteEl.textContent).toContain(
      "StudIA è un'IA e può fare errori. Verifica sempre nel tuo IDE e con il docente · IISS Marconi-Hack"
    );

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
    expect(connectionBtn.getAttribute('data-tooltip')).toBe('Mostra o nascondi le impostazioni');
    expect(connectionBtn.getAttribute('aria-label')).toBe('Mostra o nascondi le impostazioni');

    // Verifica intestazione pannello impostazioni, casella rettangolare e pallino LED esterno a destra
    expect(connectionPanel.querySelector('#settings-panel-heading')?.textContent?.trim()).toBe('Impostazioni');
    const statusRow = connectionPanel.querySelector('.tm-status-row');
    expect(statusRow).not.toBeNull();
    const statusBox = statusRow?.querySelector('.tm-status-box[data-testid="connection-status-badge"]');
    expect(statusBox).not.toBeNull();
    expect(statusRow?.querySelector('.tm-led')).not.toBeNull();
    expect(statusBox?.querySelector('.tm-led')).toBeNull(); // Il pallino LED è all'esterno della casella

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

    const preCommitment = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const studentCode = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    expect(preCommitment.rows).toBe(7);
    expect(studentCode.rows).toBe(7);
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

    // Dopo l'interruzione: i pulsanti tornano allo stato idle con etichetta dinamica per tentativo aggiornato
    expect(requestBtn.dataset.busy).toBe('false');
    expect(requestBtn.textContent).toContain('Invia tentativo aggiornato');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Invia il codice o il tentativo aggiornato al tutor maieutico');
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

  test('abilita la modalità sviluppatore dal pannello impostazioni per visualizzare e preservare il ragionamento completo', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();

    let streamCallbacks: {
      onToken?: (chunk: string) => void;
      onReasoningToken?: (chunk: string) => void;
    } = {};
    let resolveChat!: (value: string) => void;

    inference.completeChat = vi.fn().mockImplementation((_messages, opts) => {
      streamCallbacks = opts ?? {};
      return new Promise<string>((resolve) => {
        resolveChat = resolve;
      });
    });

    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const devModeToggle = root.querySelector<HTMLInputElement>('[data-testid="dev-mode-toggle"]')!;
    expect(devModeToggle).not.toBeNull();
    expect(devModeToggle.checked).toBe(false);
    expect(devModeToggle.getAttribute('role')).toBe('switch');

    const switchLabel = root.querySelector('.tm-switch-label')!;
    expect(switchLabel).not.toBeNull();
    expect(switchLabel.getAttribute('data-tooltip')).toContain('ragionamento completo del modello');
    expect(root.querySelector('.tm-dev-mode-group .tm-field-hint')).toBeNull();

    // Abilita modalità sviluppatore
    devModeToggle.checked = true;
    devModeToggle.dispatchEvent(new Event('change', { bubbles: true }));
    expect(devModeToggle.checked).toBe(true);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    preCommitmentInput.value = 'Ho ipotizzato che il passo del ciclo debba essere 1 anziché 2.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
    const tutorTurn = dialogueList.querySelector('.tm-turn-tutor')!;

    // In modalità sviluppatore il blocco reasoning è il details espandibile
    streamCallbacks.onReasoningToken?.('Analisi del contatore...');
    const reasoningDetails = tutorTurn.querySelector<HTMLDetailsElement>('[data-testid="tutor-reasoning-details"]')!;
    expect(reasoningDetails).not.toBeNull();
    expect(reasoningDetails.open).toBe(true);
    expect(reasoningDetails.textContent).toContain('Analisi del contatore...');

    // Arrivo token risposta: details si collassa
    streamCallbacks.onToken?.('Perché pensi che il passo sia 2?');
    expect(reasoningDetails.open).toBe(false);

    // Fine inferenza: in dev mode il blocco reasoning RESTA nel DOM consultabile
    resolveChat('Perché pensi che il passo sia 2?');
    await new Promise((r) => setTimeout(r, 10));

    const finalReasoningDetails = tutorTurn.querySelector<HTMLDetailsElement>('[data-testid="tutor-reasoning-details"]')!;
    expect(finalReasoningDetails).not.toBeNull();
    expect(finalReasoningDetails.textContent).toContain('Analisi del contatore...');
  });

  test('avvia la sessione maieutica direttamente dalla chat se il prompt contiene un pre-impegno valido, oppure trasferisce il testo e richiede completamento se insufficiente', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    let resolveChat!: (value: string) => void;
    inference.completeChat = vi.fn().mockImplementation(() => {
      return new Promise<string>((resolve) => {
        resolveChat = resolve;
      });
    });

    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const followUpInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followUpForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;

    // 1. Invio di testo non sufficiente dalla barra di chat in basso
    followUpInput.value = 'non compila';
    followUpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    // Il testo in basso viene ripulito e non ripristinato
    expect(followUpInput.value).toBe('');
    // La chat mostra il turno studente con "non compila" e la risposta del tutor
    const turns = dialogueList.querySelectorAll('.tm-turn');
    expect(turns.length).toBe(2);
    expect(turns[0].textContent).toContain('non compila');
    expect(turns[1].textContent).toMatch(/pre-impegno cognitivo obbligatorio/i);
    // Il testo viene pre-caricato nella casella di pre-impegno laterale
    expect(preCommitmentInput.value).toBe('non compila');
    expect(document.activeElement).toBe(preCommitmentInput);

    // 2. Invio di un pre-impegno significativo direttamente dalla chat in basso
    followUpInput.value = 'Sto cercando di calcolare la media degli elementi di un vettore ma ottengo zero.';
    followUpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // La casella viene subito ripulita
    expect(followUpInput.value).toBe('');
    // Il pre-impegno laterale viene sincronizzato
    expect(preCommitmentInput.value).toContain('media degli elementi');
    // L'inferenza parte direttamente!
    expect(root.querySelector('[data-testid="tutor-thinking-indicator"]')).not.toBeNull();

    resolveChat('Qual è il tipo della variabile in cui accumuli la somma?');
    await new Promise((r) => setTimeout(r, 10));

    expect(dialogueList.textContent).toContain('Qual è il tipo della variabile in cui accumuli la somma?');
  });

  test('aggiorna dinamicamente l\'etichetta e il tooltip del pulsante laterale tra avvio, tentativo aggiornato e nuova sessione', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    inference.cannedReply = 'Cosa succede se stampi il valore intermedio dell\'indice?';

    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const requestBtn = root.querySelector<HTMLButtonElement>('[data-testid="request-intervention-btn"]')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;

    // 1. Stato iniziale a turno zero
    expect(requestBtn.textContent).toContain('Avvia intervento maieutico');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico');

    // 2. Invio con pre-impegno insufficiente: la richiesta viene respinta e il pulsante resta "Avvia intervento maieutico"
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    expect(requestBtn.textContent).toContain('Avvia intervento maieutico');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico');

    // 3. Invio con pre-impegno valido: viene completato il primo intervento maieutico
    preCommitmentInput.value = 'Ho ipotizzato che il ciclo for esegua una iterazione di troppo.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    // A sessione avviata, il pulsante commuta in "Invia tentativo aggiornato"
    expect(requestBtn.textContent).toContain('Invia tentativo aggiornato');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Invia il codice o il tentativo aggiornato al tutor maieutico');

    // 4. Clic su "Nuova sessione": ripristina la sessione e resetta l'etichetta iniziale
    newSessionBtn.click();
    expect(requestBtn.textContent).toContain('Avvia intervento maieutico');
    expect(requestBtn.getAttribute('data-tooltip')).toBe('Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico');
  });

  test('ridimensiona dinamicamente verso l\'alto il compositore maieutico al crescere del testo, limita l\'altezza a 160px con scroll e la ripristina all\'invio e al reset', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const followUpInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followUpForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;

    // 1. Stato iniziale: vuoto, altezza di default
    expect(followUpInput.style.height).toBe('');
    expect(followUpInput.style.overflowY).toBe('hidden');

    // 2. Simuliamo digitazione con scrollHeight espanso (es. 90px per circa 3 righe)
    Object.defineProperty(followUpInput, 'scrollHeight', {
      configurable: true,
      get: () => 90,
    });
    followUpInput.value = 'Prima riga\nSeconda riga\nTerza riga';
    followUpInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(followUpInput.style.height).toBe('90px');
    expect(followUpInput.style.overflowY).toBe('hidden');

    // 3. Simuliamo digitazione con scrollHeight oltre il limite massimo (es. 240px > 160px)
    Object.defineProperty(followUpInput, 'scrollHeight', {
      configurable: true,
      get: () => 240,
    });
    followUpInput.value = 'Testo molto lungo che supera la dimensione massima consentita...';
    followUpInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(followUpInput.style.height).toBe('160px');
    expect(followUpInput.style.overflowY).toBe('auto');

    // 4. All'invio del form, il compositore si azzera e l'altezza viene ripristinata a singola riga
    followUpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(followUpInput.value).toBe('');
    expect(followUpInput.style.height).toBe('');
    expect(followUpInput.style.overflowY).toBe('hidden');

    // 5. Test di ripristino con "Nuova sessione"
    Object.defineProperty(followUpInput, 'scrollHeight', {
      configurable: true,
      get: () => 120,
    });
    followUpInput.value = 'Altro testo digitato dallo studente prima di resettare';
    followUpInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(followUpInput.style.height).toBe('120px');

    newSessionBtn.click();
    expect(followUpInput.value).toBe('');
    expect(followUpInput.style.height).toBe('');
    expect(followUpInput.style.overflowY).toBe('hidden');
  });
});


