import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MaieuticSessionEngine } from '../src/domain/MaieuticSessionEngine';
import { mountWorkspaceUI } from '../src/ui/WorkspaceUI';
import { FakeEnvironmentPort, FakeInferencePort } from './fakes';

const MAIN_CSS = readFileSync(resolve(__dirname, '../src/styles/main.css'), 'utf-8');

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

  test('renderizza l\'anteprima Markdown formattata (senza codice puro) sia nei turni dello studente che negli interventi maieutici del tutor in streaming e a fine turno, proteggendo da XSS e copiando il sorgente Markdown originale', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();

    let streamCallbacks: {
      onToken?: (chunk: string) => void;
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

    const codeInput = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    const errorInput = root.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;

    codeInput.value = 'vector<int> v(10);\nfor (int i = 0; i <= 10; i++) v[i] = i;';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    errorInput.value = 'Error: index 10 out of bounds for type vector<int>';
    errorInput.dispatchEvent(new Event('input', { bubbles: true }));
    preCommitmentInput.value =
      'Ho usato **<= 10** su `indice_corrente` con `<script>alert(1)</script>`, ma va fuori limite.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // 1. Verifica che il turno dello studente sia renderizzato in HTML formattato e non mostri '###' o '```'
    const studentBody = dialogueList.querySelector<HTMLElement>('.tm-turn-student .tm-turn-body')!;
    expect(studentBody).not.toBeNull();
    expect(studentBody.textContent).not.toContain('###');
    expect(studentBody.textContent).not.toContain('```');

    const studentHeadings = Array.from(studentBody.querySelectorAll('h3')).map((h) => h.textContent);
    expect(studentHeadings).toEqual([
      'Tentativo di codice o pseudocodice',
      'Errore del compilatore o interprete',
      'Pre-impegno cognitivo dello studente',
    ]);

    const studentCodeBlocks = Array.from(studentBody.querySelectorAll('pre code'));
    expect(studentCodeBlocks).toHaveLength(2);
    expect(studentCodeBlocks[0].textContent).toContain('vector<int> v(10);');
    expect(studentCodeBlocks[1].textContent).toContain('Error: index 10 out of bounds');

    expect(studentBody.querySelector('strong')?.textContent).toBe('<= 10');
    expect(studentBody.querySelector('p code')?.textContent).toBe('indice_corrente');
    // Protezione XSS: <script> non diventa un elemento DOM eseguibile
    expect(studentBody.querySelector('script')).toBeNull();
    expect(studentBody.textContent).toContain('<script>alert(1)</script>');

    // 2. Streaming del turno del tutor con blocco di codice parziale ancora aperto
    const partialTutorMd =
      '### Analisi del ciclo\nOsserva la variabile `indice_corrente` e questi **due punti**:\n- Primo indice: `0`\n- Ultimo indice: *qual è?*\n```cpp\nint limite = N - 1;';
    streamCallbacks.onToken?.(partialTutorMd);

    const tutorBody = dialogueList.querySelector<HTMLElement>('.tm-turn-tutor .tm-turn-body')!;
    expect(tutorBody.textContent).not.toContain('###');
    expect(tutorBody.textContent).not.toContain('```');
    expect(tutorBody.querySelector('h3')?.textContent).toBe('Analisi del ciclo');
    expect(tutorBody.querySelector('strong')?.textContent).toBe('due punti');
    expect(tutorBody.querySelector('em')?.textContent).toBe('qual è?');
    expect(tutorBody.querySelectorAll('ul li')).toHaveLength(2);
    expect(tutorBody.querySelector('pre code')?.textContent).toBe('int limite = N - 1;');

    // 3. Chiusura dello stream del tutor
    const finalTutorMd = `${partialTutorMd}\n\`\`\``;
    streamCallbacks.onToken?.('\n```');
    resolveChat(finalTutorMd);
    await new Promise((r) => setTimeout(r, 10));

    expect(tutorBody.querySelector('pre code')?.textContent).toBe('int limite = N - 1;');
    expect(tutorBody.textContent).not.toContain('```');

    // 4. Il pulsante "Copia intervento" copia il sorgente Markdown originale negli appunti
    const copyBtn = dialogueList.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    copyBtn.click();
    expect(writeTextMock).toHaveBeenCalledWith(finalTutorMd);
  });

  test('renderizza le formule matematiche LaTeX in MathML sia nei turni del tutor che dello studente e preserva il LaTeX originale nella copia negli appunti', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();

    let streamCallbacks: {
      onToken?: (chunk: string) => void;
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

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const dialogueList = root.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;

    preCommitmentInput.value =
      'Ho ipotizzato che il passo dimezzi lo spazio di ricerca con $T(n) = T(\\frac{n}{2}) + \\mathcal{O}(1)$.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verifica turno studente renderizzato con MathML
    const studentBody = dialogueList.querySelector<HTMLElement>('.tm-turn-student .tm-turn-body')!;
    expect(studentBody.querySelectorAll('math').length).toBeGreaterThan(0);
    expect(studentBody.querySelector('mfrac')).not.toBeNull();
    expect(studentBody.textContent).not.toContain('\\frac');

    // Streaming turno tutor con formula tronca tipica (es. $\frac{28}{2})
    const tutorChunk =
      'Osserva il punto medio: se l\'intervallo ha ampiezza 28, considera (es. $\\frac{28}{2}) e verifica l\'indice.';
    streamCallbacks.onToken?.(tutorChunk);

    const tutorBody = dialogueList.querySelector<HTMLElement>('.tm-turn-tutor .tm-turn-body')!;
    expect(tutorBody.querySelector('math')).not.toBeNull();
    expect(tutorBody.querySelector('mfrac')).not.toBeNull();
    expect(tutorBody.textContent).not.toContain('\\frac');

    // Risoluzione chat
    resolveChat(tutorChunk);
    await new Promise((r) => setTimeout(r, 10));

    const finalTutorBody = dialogueList.querySelector<HTMLElement>('.tm-turn-tutor .tm-turn-body')!;
    expect(finalTutorBody.querySelector('mfrac')?.textContent).toBe('282');

    // Copia turno tutor: verifica che copi il testo LaTeX sorgente e non il DOM MathML
    const copyBtn = dialogueList.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    copyBtn.click();
    expect(writeTextMock).toHaveBeenCalledWith(tutorChunk);
  });

  test('ordina il pannello delle impostazioni nei 5 blocchi richiesti (1. Endpoint, 2. Riquadro modalità/LED, 3. Modello attivo, 4. Statistiche, 5. Modalità sviluppatore) e aggiorna le statistiche di inferenza', async () => {
    const root = document.getElementById('app')!;
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
      tokensPerSecond: 42.5,
    };

    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const settingsContent = root.querySelector<HTMLElement>(
      '[data-testid="connection-settings-panel"] .tm-settings-content'
    )!;
    const directChildren = Array.from(settingsContent.children);
    expect(directChildren).toHaveLength(5);

    // 1. Endpoint motore di inferenza
    expect(directChildren[0].id).toBe('endpoint-config-form');
    // 2. Riquadro "Modalità Standalone Loopback" con LED connessione
    expect(directChildren[1].classList.contains('tm-status-row')).toBe(true);
    // 3. Selettore modello linguistico attivo
    expect(directChildren[2].querySelector('#model-select')).not.toBeNull();
    // 4. Sezione Statistiche (finestra di contesto e tok/s)
    expect(directChildren[3].getAttribute('data-testid')).toBe('inference-stats-section');
    // 5. Modalità sviluppatore
    expect(directChildren[4].classList.contains('tm-dev-mode-group')).toBe(true);

    // Verifica testo sintetico del riquadro di connessione (senza URL o modello duplicati)
    const statusBadge = root.querySelector<HTMLElement>('[data-testid="connection-status-badge"]')!;
    expect(statusBadge.textContent?.trim()).toBe('Connesso • Modalità Standalone Loopback');

    // Verifica stato iniziale delle statistiche
    const statContextEl = root.querySelector<HTMLElement>('[data-testid="stat-context-window"]')!;
    const statSpeedEl = root.querySelector<HTMLElement>('[data-testid="stat-tokens-per-sec"]')!;
    expect(statContextEl.textContent).toMatch(/0\s*\/\s*32[.,]?768\s*token/);
    expect(statSpeedEl.textContent).toBe('—');

    // Esecuzione di un intervento maieutico e verifica aggiornamento statistiche
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const attemptForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    preCommitmentInput.value = 'Ho impostato la ricorsione ma non raggiunge il caso base.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    attemptForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(statContextEl.textContent).toMatch(/1[.,]?240\s*\/\s*32[.,]?768\s*token/);
    expect(statSpeedEl.textContent).toBe('42,5 tok/s');

    // Cambio modello nel selettore: aggiorna il denominatore della finestra di contesto
    const modelSelect = root.querySelector<HTMLSelectElement>('#model-select')!;
    modelSelect.value = 'llama-3.1-8b-instruct';
    modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
    expect(statContextEl.textContent).toMatch(/1[.,]?240\s*\/\s*8[.,]?192\s*token/);

    // Motore offline: il selettore resta visibile ma disabilitato con "Nessun modello rilevato"
    inference.shouldFailConnection = true;
    const endpointForm = root.querySelector<HTMLFormElement>('#endpoint-config-form')!;
    endpointForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(statusBadge.textContent?.trim()).toBe('Offline • Modalità Standalone Loopback');
    expect(modelSelect.hidden).toBe(false);
    expect(modelSelect.disabled).toBe(true);
    expect(modelSelect.textContent).toBe('Nessun modello rilevato');

    // Reset sessione ("Nuova sessione") azzera le statistiche in RAM
    const newSessionBtn = root.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
    newSessionBtn.click();
    expect(statContextEl.textContent).toBe('0 token');
    expect(statSpeedEl.textContent).toBe('—');
  });

  test('permette di scorrere verso l\'alto durante lo streaming senza forzare la vista al fondo, mostra il pulsante freccia e lo nasconde al clic o al raggiungimento del fondo', async () => {
    let streamCallbacks: any = {};
    let resolveChat: any = null;

    const inference = new FakeInferencePort();
    inference.completeChat = vi.fn().mockImplementation((_messages, opts) => {
      streamCallbacks = opts ?? {};
      return new Promise<string>((resolve) => {
        resolveChat = resolve;
      });
    });

    const root = document.getElementById('app')!;
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const scrollToBottomBtn = root.querySelector<HTMLButtonElement>(
      '[data-testid="scroll-to-bottom-btn"]'
    );
    expect(scrollToBottomBtn).not.toBeNull();
    expect(scrollToBottomBtn?.hidden).toBe(true);
    expect(scrollToBottomBtn?.getAttribute('aria-label')).toBe('Scorri verso il basso');

    const dialogueList = root.querySelector<HTMLElement>(
      '[data-testid="dialogue-turns-list"]'
    )!;

    // Configura dimensioni simulate su dialogueList
    let currentScrollTop = 0;
    Object.defineProperty(dialogueList, 'scrollHeight', {
      configurable: true,
      get: () => 1000,
    });
    Object.defineProperty(dialogueList, 'clientHeight', {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(dialogueList, 'scrollTop', {
      configurable: true,
      get: () => currentScrollTop,
      set: (val: number) => {
        currentScrollTop = val;
      },
    });
    dialogueList.scrollTo = vi.fn((opts: any) => {
      currentScrollTop = opts?.top ?? 1000;
    });

    // Avvio intervento maieutico
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const contextForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    preCommitmentInput.value = 'Ho un dubbio sul ciclo while e la condizione di uscita.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Durante il primo token, siamo a fondo corsa (currentScrollTop = 600, scrollHeight - clientHeight = 600)
    currentScrollTop = 600;
    streamCallbacks.onToken?.('Osserva bene ');
    expect(scrollToBottomBtn?.hidden).toBe(true);

    // Lo studente scorre verso l'alto (es. scrollTop = 100, distanceFromBottom = 1000 - 100 - 400 = 500 > 48)
    currentScrollTop = 100;
    dialogueList.dispatchEvent(new Event('scroll'));

    // Il pulsante con freccia verso il basso deve apparire
    expect(scrollToBottomBtn?.hidden).toBe(false);

    // Arrivano ulteriori token dallo stream: scrollTop NON deve essere forzato a fondo corsa
    streamCallbacks.onToken?.('la condizione del ciclo while.');
    expect(currentScrollTop).toBe(100);

    // Clic sul pulsante freccia: scroll verso il fondo e scomparsa del pulsante
    scrollToBottomBtn?.click();
    expect(scrollToBottomBtn?.hidden).toBe(true);
    expect(currentScrollTop).toBe(1000);

    // Ulteriori token ora scrollano normalmente a fondo corsa
    streamCallbacks.onToken?.(' Cosa succede al contatore?');
    expect(currentScrollTop).toBe(1000);

    resolveChat('Osserva bene la condizione del ciclo while. Cosa succede al contatore?');
    await new Promise((r) => setTimeout(r, 20));
  });

  test('mostra avviso educativo del guardrail zero-data con pulsante di sanitizzazione assistita, suggerimento UDL per CU-12 e aggiorna il contatore di sicurezza', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const completeChatSpy = vi.spyOn(inference, 'completeChat');
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());

    await mountWorkspaceUI(root, engine);

    const codeInput = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    const errorInput = root.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const statCounter = root.querySelector<HTMLElement>('[data-testid="stat-zero-data-interventions"]');

    expect(statCounter?.textContent).toBe('0');

    // 1. Inserisce dati contenenti PII e CU-12
    codeInput.value = '/* Autore: Mario Rossi, Classe: 3A */\nconst key = "sk-1234567890abcdef12345678";';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    errorInput.value = 'errore inviato a mario.rossi@marconihack.edu.it';
    errorInput.dispatchEvent(new Event('input', { bubbles: true }));
    preCommitmentInput.value = 'Ho la dislessia e non capisco come mai la struct dia errore.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Tenta l'invio
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    // Verifica che nessuna richiesta di inferenza sia partita in rete
    expect(completeChatSpy).not.toHaveBeenCalled();

    // Verifica contatore di sicurezza aggiornato
    expect(statCounter?.textContent).toBe('1');

    // Verifica presenza banner di allerta educativo zero-data
    const zeroDataAlert = root.querySelector('[data-testid="zero-data-alert"]')!;
    expect(zeroDataAlert).not.toBeNull();
    expect(zeroDataAlert.hasAttribute('hidden')).toBe(false);
    expect(zeroDataAlert.textContent).toMatch(/guardrail zero-data pre-invio/i);
    expect(zeroDataAlert.textContent).toMatch(/AUP-IA §4\.1|PUIA §4/i);
    expect(zeroDataAlert.textContent).toMatch(/CU-12/i);

    // Verifica collegamento / suggerimento UDL
    const udlShortcutBtn = root.querySelector<HTMLButtonElement>('[data-testid="open-udl-scaffolding-btn"]');
    expect(udlShortcutBtn).not.toBeNull();
    udlShortcutBtn?.click();
    const udlPanel = root.querySelector<HTMLElement>('[data-testid="udl-scaffolding-panel"]');
    expect(udlPanel?.hasAttribute('hidden')).toBe(false);

    // Verifica pulsante di sanitizzazione assistita
    const sanitizeBtn = root.querySelector<HTMLButtonElement>('[data-testid="sanitize-assisted-btn"]');
    expect(sanitizeBtn).not.toBeNull();
    expect(sanitizeBtn?.textContent).toMatch(/Sanitizzazione assistita/i);

    // Clicca sul pulsante di sanitizzazione assistita
    sanitizeBtn?.click();

    // I campi di input devono essere ripuliti con [DATO RIMOSSO]
    expect(codeInput.value).toContain('[DATO RIMOSSO]');
    expect(codeInput.value).not.toContain('Mario Rossi');
    expect(codeInput.value).not.toContain('sk-1234567890abcdef12345678');
    expect(errorInput.value).toContain('[DATO RIMOSSO]');
    expect(errorInput.value).not.toContain('mario.rossi@scuola.it');
    expect(preCommitmentInput.value).toContain('[DATO RIMOSSO]');
    expect(preCommitmentInput.value).not.toContain('dislessia');

    // L'avviso viene nascosto dopo la sanitizzazione per consentire la verifica
    expect(zeroDataAlert.hasAttribute('hidden')).toBe(true);

    // Ora l'invio ha successo verso InferencePort
    inference.cannedReply = 'Qual è il tipo del membro dichiarato nella struct?';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(completeChatSpy).toHaveBeenCalledTimes(1);
  });

  test('sanitizzazione assistita ripulisce anche il compositore maieutico se la violazione avviene nella risposta socratica', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const completeChatSpy = vi.spyOn(inference, 'completeChat');
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());

    await mountWorkspaceUI(root, engine);

    const codeInput = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const contextForm = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const followupInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followupForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;

    // Inizializza con un pre-impegno valido
    preCommitmentInput.value = 'Ho impostato una funzione di test e vorrei capire come passare i parametri.';
    codeInput.value = 'int test(int a) { return a * 2; }';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    contextForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(completeChatSpy).toHaveBeenCalledTimes(1);

    // Lo studente scrive nella chat un messaggio contenente email e CF
    followupInput.value = 'Mi chiamo mario e la mia email è mario.rossi@gmail.com con CF RSSMRA85M01H501Z';
    followupInput.dispatchEvent(new Event('input', { bubbles: true }));

    followupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    // Bloccato prima dell'invio in rete
    expect(completeChatSpy).toHaveBeenCalledTimes(1);

    const sanitizeBtn = root.querySelector<HTMLButtonElement>('[data-testid="sanitize-assisted-btn"]');
    expect(sanitizeBtn).not.toBeNull();
    sanitizeBtn?.click();

    expect(followupInput.value).not.toContain('mario.rossi@gmail.com');
    expect(followupInput.value).not.toContain('RSSMRA85M01H501Z');
    expect(followupInput.value).toContain('[DATO RIMOSSO]');
  });

  test('non duplica il testo non sanitizzato nel campo pre-impegno cognitivo se il primo invio dal compositore maieutico viene bloccato dal guardrail zero-data', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const completeChatSpy = vi.spyOn(inference, 'completeChat');
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());

    await mountWorkspaceUI(root, engine);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const followupInput = root.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
    const followupForm = root.querySelector<HTMLFormElement>('#socratic-followup-form')!;

    expect(preCommitmentInput.value).toBe('');

    followupInput.value =
      'Sono Luciano Vitale della classe 3IC, la mia mail è luciano.vitale@marconihack.edu.it e non capisco perché il ciclo non termina.';
    followupInput.dispatchEvent(new Event('input', { bubbles: true }));
    followupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    // L'invio viene bloccato: il testo resta nel compositore maieutico e NON contamina il pre-impegno laterale
    expect(completeChatSpy).not.toHaveBeenCalled();
    expect(preCommitmentInput.value).toBe('');
    expect(followupInput.value).toContain('Luciano Vitale');

    // Lo studente aziona la sanitizzazione assistita e poi invia dal compositore maieutico
    const sanitizeBtn = root.querySelector<HTMLButtonElement>('[data-testid="sanitize-assisted-btn"]')!;
    sanitizeBtn.click();

    expect(followupInput.value).not.toContain('Luciano Vitale');
    expect(followupInput.value).toContain('[DATO RIMOSSO]');
    expect(preCommitmentInput.value).toBe('');

    followupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(completeChatSpy).toHaveBeenCalledTimes(1);
    expect(preCommitmentInput.value).toContain('[DATO RIMOSSO]');
    expect(preCommitmentInput.value).not.toContain('Luciano Vitale');
  });

  test('TC-E2E-01 — Blocco multi-campo, sanitizzazione simultanea senza inglobare frasi adiacenti e re-invio valido', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const completeChatSpy = vi.spyOn(inference, 'completeChat');
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    const codeInput = root.querySelector<HTMLTextAreaElement>('#student-code-input')!;
    const errorInput = root.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    const statCounter = root.querySelector<HTMLElement>('[data-testid="stat-zero-data-interventions"]')!;

    expect(statCounter.textContent).toBe('0');

    preCommitmentInput.value = 'Alunno: Luca Neri. Ho il PDP per dislessia, penso che il ciclo vada in overflow.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    codeInput.value = '// Autore: Luca Neri\nconst ' + 'api_key = "sk-999999999999999999999999"' + ';';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    errorInput.value = 'Fatal error for user luca.neri@scuola.edu.it (tel 3331122334)';
    errorInput.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(completeChatSpy).not.toHaveBeenCalled();
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(1);
    expect(statCounter.textContent).toBe('1');

    const zeroDataAlert = root.querySelector('[data-testid="zero-data-alert"]')!;
    expect(zeroDataAlert.hasAttribute('hidden')).toBe(false);
    expect(zeroDataAlert.textContent).toMatch(/AUP-IA §4\.1|PUIA §4/i);
    expect(zeroDataAlert.textContent).toMatch(/AUP-IA §6\.1/i);
    expect(zeroDataAlert.textContent).toMatch(/Art\. 9 GDPR|CU-12/i);

    const sanitizeBtn = root.querySelector<HTMLButtonElement>('[data-testid="sanitize-assisted-btn"]')!;
    sanitizeBtn.click();

    expect(preCommitmentInput.value).toBe(
      '[DATO RIMOSSO]. Ho il [DATO RIMOSSO] per [DATO RIMOSSO], penso che il ciclo vada in overflow.'
    );
    expect(codeInput.value).toBe('// [DATO RIMOSSO]\nconst [DATO RIMOSSO];');
    expect(errorInput.value).toBe('Fatal error for user [DATO RIMOSSO] (tel [DATO RIMOSSO])');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(completeChatSpy).toHaveBeenCalledTimes(1);
    expect(engine.getSnapshot().zeroDataInterventionsCount).toBe(1);
    expect(statCounter.textContent).toBe('1');
  });

  test('mostra le icone della progressione maieutica sotto la risposta del tutor, avanza con "Sono ancora bloccato" e resetta a Stadio 1', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    // Invia un primo tentativo per ricevere un intervento maieutico
    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    preCommitmentInput.value = 'Ho impostato una ricerca binaria ma entro in un loop infinito.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(engine.getSnapshot().turns.length).toBeGreaterThan(0);
    expect(engine.getSnapshot().currentStage).toBe(1);

    const tutorTurn = root.querySelector<HTMLElement>('.tm-turn-tutor')!;
    expect(tutorTurn).not.toBeNull();

    const stageIndicator = tutorTurn.querySelector<HTMLElement>('[data-testid="maieutic-stage-indicator"]')!;
    expect(stageIndicator).not.toBeNull();
    expect(stageIndicator.getAttribute('data-active-stage')).toBe('1');
    expect(stageIndicator.textContent).toMatch(/Stadio 1/i);
    expect(stageIndicator.textContent).toMatch(/domanda esplorativa/i);

    const stillStuckBtn = tutorTurn.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    expect(stillStuckBtn).not.toBeNull();
    expect(stillStuckBtn.textContent).toMatch(/bloccato/i);
    expect(stillStuckBtn.disabled).toBe(false);

    const copyBtn = tutorTurn.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    expect(copyBtn).not.toBeNull();

    const resetStageBtn = tutorTurn.querySelector<HTMLButtonElement>('[data-testid="reset-stage-btn"]')!;
    expect(resetStageBtn).not.toBeNull();
    // Allo Stadio 1 il pulsante reset è disabilitato
    expect(resetStageBtn.disabled).toBe(true);

    // Tutte e 4 le icone della barra delle azioni dell'intervento devono essere SVG 16x16 stroke-width 1.75 come le icone di sistema
    const turnActionSvgs = [
      stageIndicator.querySelector('svg'),
      stillStuckBtn.querySelector('svg'),
      copyBtn.querySelector('svg'),
      resetStageBtn.querySelector('svg'),
    ];
    for (const svg of turnActionSvgs) {
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('width')).toBe('16');
      expect(svg?.getAttribute('height')).toBe('16');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('stroke-width')).toBe('1.75');
    }

    // Compensazione ottica: i cerchi esterni dell'indicatore dello stadio e del salvagente usano r="10" (20x20 su viewBox 24x24) e il reset usa raggio 10
    expect(stageIndicator.querySelector('svg circle')?.getAttribute('r')).toBe('10');
    expect(stillStuckBtn.querySelector('svg circle')?.getAttribute('r')).toBe('10');
    expect(resetStageBtn.querySelector('svg path')?.getAttribute('d')).toContain('a10 10');

    // Click su "Sono ancora bloccato": avanza a Stadio 2 e genera un nuovo intervento
    const completeSpy = vi.spyOn(inference, 'completeChat');
    stillStuckBtn.click();
    await new Promise((r) => setTimeout(r, 20));

    expect(completeSpy).toHaveBeenCalled();
    expect(engine.getSnapshot().currentStage).toBe(2);

    const tutorTurns = root.querySelectorAll<HTMLElement>('.tm-turn-tutor');
    const latestTutorTurn = tutorTurns[tutorTurns.length - 1];
    const latestStageIndicator = latestTutorTurn.querySelector<HTMLElement>('[data-testid="maieutic-stage-indicator"]')!;
    expect(latestStageIndicator.getAttribute('data-active-stage')).toBe('2');
    expect(latestStageIndicator.textContent).toMatch(/trace|scomposizione/i);

    // Ora che lo stadio è 2, il pulsante reset è abilitato
    const latestResetBtn = latestTutorTurn.querySelector<HTMLButtonElement>('[data-testid="reset-stage-btn"]')!;
    expect(latestResetBtn.disabled).toBe(false);

    // Reset a Stadio 1
    latestResetBtn.click();
    expect(engine.getSnapshot().currentStage).toBe(1);
    const updatedResetBtn = latestTutorTurn.querySelector<HTMLButtonElement>('[data-testid="reset-stage-btn"]')!;
    expect(updatedResetBtn.disabled).toBe(true);
  });

  test('barra delle azioni dell\'intervento maieutico: disabilita il salvagente allo Stadio 4 (escalation al docente) e disattiva i pulsanti sui turni precedenti', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const preCommitmentInput = root.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
    preCommitmentInput.value = 'Non so come iniziare l\'ordinamento.';
    preCommitmentInput.dispatchEvent(new Event('input', { bubbles: true }));
    const form = root.querySelector<HTMLFormElement>('#student-attempt-form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));

    // Stadio 1 -> Avanza a 2
    let turns = root.querySelectorAll<HTMLElement>('.tm-turn-tutor');
    let latestTurn = turns[turns.length - 1];
    let stillStuckBtn = latestTurn.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    stillStuckBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.getSnapshot().currentStage).toBe(2);

    // Stadio 2 -> Avanza a 3
    turns = root.querySelectorAll<HTMLElement>('.tm-turn-tutor');
    latestTurn = turns[turns.length - 1];
    stillStuckBtn = latestTurn.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    stillStuckBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.getSnapshot().currentStage).toBe(3);

    // Stadio 3 -> Avanza a 4 (Escalation al docente)
    turns = root.querySelectorAll<HTMLElement>('.tm-turn-tutor');
    latestTurn = turns[turns.length - 1];
    stillStuckBtn = latestTurn.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    stillStuckBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.getSnapshot().currentStage).toBe(4);
    expect(engine.getSnapshot().stage4ReachedCount).toBe(1);

    // Sullo Stadio 4, l'indicatore mostra escalation docente e il salvagente è disabilitato
    turns = root.querySelectorAll<HTMLElement>('.tm-turn-tutor');
    expect(turns.length).toBe(4);
    latestTurn = turns[turns.length - 1];
    const stageBadge = latestTurn.querySelector<HTMLElement>('[data-testid="maieutic-stage-indicator"]')!;
    expect(stageBadge.getAttribute('data-active-stage')).toBe('4');
    expect(stageBadge.textContent).toMatch(/docente/i);

    stillStuckBtn = latestTurn.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    expect(stillStuckBtn.disabled).toBe(true);
    expect(stillStuckBtn.getAttribute('data-tooltip')).toMatch(/docente/i);

    // I turni precedenti hanno i pulsanti disabilitati
    const turn0 = turns[0];
    const stuckTurn0 = turn0.querySelector<HTMLButtonElement>('[data-testid="still-stuck-btn"]')!;
    expect(stuckTurn0.disabled).toBe(true);

    // Ma il pulsante di copia resta funzionante su tutti i turni
    const copyTurn0 = turn0.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    expect(copyTurn0.disabled).toBe(false);
  });

  test('espone il pannello scaffolding cognitivo UDL con pulsante dedicato, configura i parametri cognitivi e attiva i controlli di accessibilità visiva', async () => {
    const root = document.getElementById('app')!;
    const inference = new FakeInferencePort();
    const engine = new MaieuticSessionEngine(inference, new FakeEnvironmentPort());
    await mountWorkspaceUI(root, engine);

    const toggleUdlBtn = root.querySelector<HTMLButtonElement>('[data-testid="toggle-udl-panel-btn"]')!;
    expect(toggleUdlBtn).not.toBeNull();

    const udlPanel = root.querySelector<HTMLElement>('[data-testid="udl-scaffolding-panel"]')!;
    expect(udlPanel).not.toBeNull();
    expect(udlPanel.hidden).toBe(true);

    // Apertura pannello UDL dalla toolbar
    toggleUdlBtn.click();
    expect(udlPanel.hidden).toBe(false);

    // Verifica divieto assoluto termini clinici/sanitari nei testi del pannello (ADR-0002)
    expect(udlPanel.textContent).not.toMatch(/\b(DSA|BES|PDP|PEI|disabilit|diagnos)\b/i);

    // Controlli cognitivi UDL
    const levelSelect = udlPanel.querySelector<HTMLSelectElement>('[data-testid="udl-level-select"]')!;
    const shortRepliesCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-short-replies"]')!;
    const microStepsCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-micro-steps"]')!;
    const textSchemasCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-text-schemas"]')!;

    expect(levelSelect).not.toBeNull();
    expect(shortRepliesCb).not.toBeNull();
    expect(microStepsCb).not.toBeNull();
    expect(textSchemasCb).not.toBeNull();

    levelSelect.value = 'biennio';
    levelSelect.dispatchEvent(new Event('change', { bubbles: true }));

    shortRepliesCb.checked = true;
    shortRepliesCb.dispatchEvent(new Event('change', { bubbles: true }));

    microStepsCb.checked = true;
    microStepsCb.dispatchEvent(new Event('change', { bubbles: true }));

    textSchemasCb.checked = true;
    textSchemasCb.dispatchEvent(new Event('change', { bubbles: true }));

    expect(engine.getSnapshot().udlConfig).toEqual({
      linguisticComplexity: 'biennio',
      shortHighReadabilityReplies: true,
      microStepBreakdown: true,
      textLogicalSchemas: true,
    });

    // Controlli accessibilità visiva UI
    const fontCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-high-readability-font"]')!;
    const spacingCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-expanded-spacing"]')!;
    const contrastCb = udlPanel.querySelector<HTMLInputElement>('[data-testid="udl-high-contrast"]')!;

    expect(fontCb).not.toBeNull();
    expect(spacingCb).not.toBeNull();
    expect(contrastCb).not.toBeNull();

    // Attivazione font ad alta leggibilità
    fontCb.checked = true;
    fontCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-high-readability-font')).toBe(true);

    // Attivazione spaziatura aumentata
    spacingCb.checked = true;
    spacingCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-expanded-spacing')).toBe(true);

    // Attivazione alto contrasto
    const styleEl = document.createElement('style');
    styleEl.textContent = MAIN_CSS;
    document.head.appendChild(styleEl);

    contrastCb.checked = true;
    contrastCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-high-contrast')).toBe(true);

    // Verifica contrasto del compositore maieutico e autonomia dai token chiari di data-theme="light"
    const rootStyle = window.getComputedStyle(document.documentElement);
    expect(rootStyle.getPropertyValue('--tm-composer-bg').trim()).toBe('#050505');
    expect(rootStyle.getPropertyValue('--tm-surface-hover').trim()).toBe('#1f1f1f');
    expect(rootStyle.getPropertyValue('--tm-pill-bg').trim()).toBe('#121212');
    expect(rootStyle.getPropertyValue('--tm-primary-bg-hover').trim()).toBe('#e5e5e5');
    expect(rootStyle.getPropertyValue('--tm-tooltip-bg').trim()).toBe('#ffffff');
    expect(rootStyle.getPropertyValue('--tm-tooltip-text').trim()).toBe('#000000');

    const composerEl = root.querySelector<HTMLElement>('.tm-composer')!;
    const composerStyle = window.getComputedStyle(composerEl);
    expect(composerStyle.borderWidth).toBe('2px');

    styleEl.remove();

    // Disattivazione
    fontCb.checked = false;
    fontCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-high-readability-font')).toBe(false);

    spacingCb.checked = false;
    spacingCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-expanded-spacing')).toBe(false);

    contrastCb.checked = false;
    contrastCb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.classList.contains('tm-high-contrast')).toBe(false);
  });
});


