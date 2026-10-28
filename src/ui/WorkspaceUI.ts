import type { MaieuticSessionEngine, MaieuticSessionSnapshot } from '../domain/MaieuticSessionEngine';

const ICONS = {
  brandSparkles: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>`,
  sidebarLeft: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="3"/><path d="M9 3v18"/></svg>`,
  bottombarInfo: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="3"/><path d="M3 15h18"/><path d="M12 6.5v.01"/><path d="M12 9.5v3"/></svg>`,
  sunLight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  moonDark: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  shieldInfo: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  plugConnect: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`,
  settingsGear: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  newSessionCompose: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,
  codeBlock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  terminalBug: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  sendArrow: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
  copyTurn: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  checkCopied: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  spinner: `<svg class="tm-spin" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  stopSquare: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="2"/></svg>`,
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatConnectionBadgeText(snapshot: MaieuticSessionSnapshot): string {
  const modeLabel =
    snapshot.connectionMode === 'loopback'
      ? 'Modalità Standalone Loopback'
      : 'Modalità endpoint LAN';

  if (snapshot.connectionStatus === 'online') {
    const modelLabel = snapshot.activeModel ?? 'Modello attivo';
    return `${modeLabel} (${snapshot.endpointUrl}) • ${modelLabel}`;
  }

  if (snapshot.connectionStatus === 'offline') {
    return `Offline • ${modeLabel} (${snapshot.endpointUrl})`;
  }

  return `Verifica in corso • ${modeLabel} (${snapshot.endpointUrl})`;
}

export async function mountWorkspaceUI(
  container: HTMLElement,
  engine: MaieuticSessionEngine
): Promise<void> {
  let currentTheme: 'dark' | 'light' = 'light';
  let isSidebarOpen = true;
  let isTopbarOpen = false;
  let isConnectionPanelOpen = false;
  document.documentElement.dataset.theme = currentTheme;

  container.innerHTML = `
    <div class="tm-shell">
      <header class="tm-header" role="banner">
        <div class="tm-navbar">
          <div class="tm-brand">
            <h1 class="tm-title">Stud<span class="tm-brand-i">I</span><span class="tm-brand-a">A</span></h1>
            <span class="tm-subtitle">
              <span class="tm-subtitle-separator">· </span>
              <span class="tm-subtitle-motto">Impara ragionando!</span>
            </span>
          </div>

          <div class="tm-toolbar">
            <button
              type="button"
              class="tm-icon-btn tm-sidebar-toggle-btn"
              data-testid="sidebar-toggle-btn"
              data-tooltip="Mostra o nascondi la barra laterale del contesto"
              aria-label="Mostra o nascondi la barra laterale del contesto e tentativo dello studente"
              aria-controls="left-sidebar-panel"
              aria-expanded="true"
            >
              ${ICONS.sidebarLeft}
            </button>
            <button
              type="button"
              class="tm-icon-btn tm-topbar-toggle-btn tm-bottombar-toggle-btn"
              data-testid="topbar-toggle-btn"
              data-tooltip="Mostra o nascondi l'informativa AUP-IA"
              aria-label="Mostra o nascondi l'informativa AUP-IA"
              aria-controls="aup-disclosure-bottombar"
              aria-expanded="false"
            >
              ${ICONS.bottombarInfo}
            </button>
            <button
              type="button"
              class="tm-icon-btn"
              data-testid="theme-toggle-btn"
              data-tooltip="Passa al tema scuro"
              aria-label="Cambia tema tra chiaro e scuro"
            >
              <span class="tm-theme-icon">${ICONS.moonDark}</span>
            </button>
            <button
              type="button"
              class="tm-icon-btn"
              data-testid="new-session-btn"
              data-tooltip="Nuova sessione"
              aria-label="Nuova sessione"
            >
              ${ICONS.newSessionCompose}
            </button>
            <button
              type="button"
              class="tm-icon-btn tm-connection-toggle-btn"
              data-testid="connection-toggle-btn"
              data-tooltip="Mostra o nascondi le impostazioni di connessione"
              aria-label="Mostra o nascondi le impostazioni di connessione"
              aria-controls="connection-settings-panel"
              aria-expanded="false"
            >
              ${ICONS.settingsGear}
            </button>
          </div>
        </div>
      </header>

      <div
        class="tm-feedback-banner"
        data-testid="pedagogical-feedback"
        role="status"
        aria-live="assertive"
        hidden
      ></div>

      <main class="tm-workspace" data-sidebar-open="true" data-settings-open="false" role="main">
        <aside
          id="left-sidebar-panel"
          class="tm-panel tm-panel-left tm-sidebar"
          data-testid="left-panel-context"
          aria-labelledby="left-panel-heading"
        >
          <div class="tm-panel-header">
            <h2 id="left-panel-heading" class="tm-panel-title">
              Contesto e tentativo dello studente
            </h2>
          </div>

          <form id="student-attempt-form" class="tm-form" novalidate>
            <fieldset class="tm-fieldset">
              <legend class="tm-sr-only">Elaborazione autonoma e pre-impegno cognitivo</legend>

              <div class="tm-form-group tm-precommitment-card">
                <label for="pre-commitment-input" class="tm-label">
                  ${ICONS.lightbulb}
                  <span>Pre-impegno cognitivo <span class="tm-required-marker" aria-hidden="true">*</span></span>
                </label>
                <p id="pre-commitment-desc" class="tm-field-hint">
                  Cosa ho provato a fare, qual è la mia ipotesi e dove mi sono bloccato:
                </p>
                <textarea
                  id="pre-commitment-input"
                  name="cognitivePreCommitment"
                  class="tm-textarea"
                  rows="7"
                  aria-describedby="pre-commitment-desc"
                  placeholder="Es.: Ho impostato un ciclo for da 0 a N per sommare gli elementi, ma ottengo un valore errato all'ultimo passo..."
                  required
                ></textarea>
              </div>

              <div class="tm-form-group">
                <label for="student-code-input" class="tm-label">
                  ${ICONS.codeBlock}
                  <span>Tentativo di codice o pseudocodice</span>
                </label>
                <textarea
                  id="student-code-input"
                  name="studentCode"
                  class="tm-textarea tm-code-textarea"
                  rows="7"
                  spellcheck="false"
                  placeholder="// Incolla qui il frammento di codice o lo pseudocodice su cui stai lavorando..."
                ></textarea>
              </div>

              <div class="tm-form-group">
                <label for="compiler-error-input" class="tm-label">
                  ${ICONS.terminalBug}
                  <span>Errore del compilatore o interprete <span class="tm-optional-tag">(opzionale)</span></span>
                </label>
                <textarea
                  id="compiler-error-input"
                  name="compilerError"
                  class="tm-textarea tm-error-textarea"
                  rows="2"
                  spellcheck="false"
                  placeholder="Incolla eventuale output di errore o valore inatteso..."
                ></textarea>
              </div>

              <div class="tm-form-actions">
                <button
                  type="submit"
                  class="tm-btn-cta"
                  data-testid="request-intervention-btn"
                  data-tooltip="Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico"
                >
                  <span class="tm-btn-cta-icon">${ICONS.brandSparkles}</span>
                  <span class="tm-btn-cta-label">Avvia intervento maieutico</span>
                </button>
              </div>
            </fieldset>
          </form>
        </aside>

        <section
          class="tm-panel tm-panel-right"
          data-testid="right-panel-dialogue"
          aria-labelledby="right-panel-heading"
        >
          <h2 id="right-panel-heading" class="tm-sr-only">
            Dialogo maieutico
          </h2>

          <div
            class="tm-dialogue-list"
            data-testid="dialogue-turns-list"
            role="log"
            aria-live="polite"
            aria-label="Cronologia degli interventi maieutici"
          ></div>

          <div class="tm-composer-dock">
            <form id="socratic-followup-form" class="tm-composer" novalidate>
              <label for="socratic-reply-input" class="tm-sr-only">
                Chiedi a StudIA o rispondi alla domanda socratica
              </label>
              <textarea
                id="socratic-reply-input"
                name="socraticReply"
                class="tm-composer-input"
                rows="1"
                placeholder="Chiedi a StudIA..."
              ></textarea>
              <button
                type="submit"
                class="tm-send-fab"
                data-testid="send-followup-btn"
                data-tooltip="Invia risposta socratica (Invio)"
                aria-label="Invia risposta socratica"
              >
                <span class="tm-send-fab-icon">${ICONS.sendArrow}</span>
              </button>
            </form>
            <p class="tm-composer-footnote">
              <strong>StudIA</strong> è un'IA e può fare errori. Verifica sempre nel tuo IDE e con il docente · IISS Marconi-Hack
            </p>
          </div>
        </section>

        <aside
          id="connection-settings-panel"
          class="tm-panel tm-panel-settings tm-sidebar"
          data-testid="connection-settings-panel"
          role="region"
          aria-labelledby="settings-panel-heading"
          hidden
        >
          <div class="tm-panel-header">
            <h2 id="settings-panel-heading" class="tm-panel-title">
              Impostazioni di connessione
            </h2>
          </div>

          <div class="tm-settings-content">
            <div class="tm-status-pill" data-testid="connection-status-badge" aria-live="polite">
              <span class="tm-led" aria-hidden="true"></span>
              <span class="tm-status-text"></span>
            </div>

            <div class="tm-form-group">
              <label for="model-select" class="tm-label">
                Modello linguistico attivo
              </label>
              <select
                id="model-select"
                name="activeModel"
                class="tm-input tm-model-select"
                data-testid="model-select"
                aria-label="Modello linguistico attivo"
                title="Seleziona il modello linguistico caricato in LM Studio"
              ></select>
            </div>

            <form id="endpoint-config-form" class="tm-endpoint-form" novalidate>
              <div class="tm-form-group">
                <label for="endpoint-url-input" class="tm-label">
                  Endpoint motore di inferenza
                </label>
                <p id="endpoint-help" class="tm-field-hint">
                  Accetta loopback (127.0.0.1) o IP privati LAN RFC 1918
                </p>
                <div class="tm-endpoint-input-wrap">
                  <input
                    type="url"
                    id="endpoint-url-input"
                    name="endpointUrl"
                    class="tm-input tm-endpoint-input"
                    aria-describedby="endpoint-help"
                    placeholder="http://127.0.0.1:1234/v1"
                    required
                  />
                  <button
                    type="submit"
                    class="tm-icon-btn"
                    data-tooltip="Connetti o verifica l'endpoint LM Studio"
                    aria-label="Connetti o verifica l'endpoint LM Studio"
                  >
                    ${ICONS.plugConnect}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </aside>
      </main>

      <footer class="tm-footer">
        <div
          id="aup-disclosure-bottombar"
          class="tm-disclosure-banner tm-disclosure-bottombar"
          data-testid="aup-disclosure-banner"
          role="region"
          aria-label="Informativa AUP-IA e PUIA"
          hidden
        >
          <div class="tm-disclosure-text">
            <strong>Disclosure AUP-IA (CU-05, CU-11, CU-15):</strong>
            sistema di IA generativa socratica locale (può commettere errori: verifica sempre nel tuo IDE e con il docente).
            <span class="tm-disclosure-pills">
              <span class="tm-pill">AUP-IA §1: primato dell'apprendimento</span>
              <span class="tm-pill">PUIA §4: regime zero-data (solo RAM)</span>
              <span class="tm-pill">Esclusione tassativa CU-16..19: zero voti o profilazione</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  `;

  const workspaceEl = container.querySelector<HTMLElement>('.tm-workspace')!;
  const sidebarToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="sidebar-toggle-btn"]'
  )!;
  const topbarToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="topbar-toggle-btn"]'
  )!;
  const connectionToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="connection-toggle-btn"]'
  )!;
  const disclosureBanner = container.querySelector<HTMLElement>(
    '[data-testid="aup-disclosure-banner"]'
  )!;
  const connectionPanel = container.querySelector<HTMLElement>(
    '[data-testid="connection-settings-panel"]'
  )!;
  const leftSidebar = container.querySelector<HTMLElement>('[data-testid="left-panel-context"]')!;
  const themeToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="theme-toggle-btn"]'
  )!;
  const themeIconEl = themeToggleBtn.querySelector<HTMLElement>('.tm-theme-icon')!;

  const badgeEl = container.querySelector<HTMLElement>('[data-testid="connection-status-badge"]')!;
  const badgeTextEl = badgeEl.querySelector<HTMLElement>('.tm-status-text')!;
  const modelSelect = container.querySelector<HTMLSelectElement>('#model-select')!;
  const endpointForm = container.querySelector<HTMLFormElement>('#endpoint-config-form')!;
  const endpointInput = container.querySelector<HTMLInputElement>('#endpoint-url-input')!;
  const newSessionBtn = container.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
  const feedbackBanner = container.querySelector<HTMLElement>('[data-testid="pedagogical-feedback"]')!;

  const attemptForm = container.querySelector<HTMLFormElement>('#student-attempt-form')!;
  const requestBtn = container.querySelector<HTMLButtonElement>('[data-testid="request-intervention-btn"]')!;
  const codeInput = container.querySelector<HTMLTextAreaElement>('#student-code-input')!;
  const errorInput = container.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
  const preCommitmentInput = container.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;

  const dialogueList = container.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
  const followUpForm = container.querySelector<HTMLFormElement>('#socratic-followup-form')!;
  const followUpInput = container.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
  const sendFollowUpBtn = container.querySelector<HTMLButtonElement>('[data-testid="send-followup-btn"]')!;
  const sendFabIcon = sendFollowUpBtn.querySelector<HTMLElement>('.tm-send-fab-icon')!;

  let isGenerating = false;

  function setSidebarOpen(open: boolean): void {
    isSidebarOpen = open;
    sidebarToggleBtn.setAttribute('aria-expanded', String(open));
    leftSidebar.hidden = !open;
    workspaceEl.dataset.sidebarOpen = String(open);
    if (open && typeof window !== 'undefined' && window.innerWidth < 1100 && isConnectionPanelOpen) {
      setConnectionPanelOpen(false);
    }
  }

  sidebarToggleBtn.addEventListener('click', () => {
    setSidebarOpen(!isSidebarOpen);
  });

  function setTopbarOpen(open: boolean): void {
    isTopbarOpen = open;
    topbarToggleBtn.setAttribute('aria-expanded', String(open));
    disclosureBanner.hidden = !open;
  }

  topbarToggleBtn.addEventListener('click', () => {
    setTopbarOpen(!isTopbarOpen);
  });

  function setConnectionPanelOpen(open: boolean): void {
    isConnectionPanelOpen = open;
    connectionToggleBtn.setAttribute('aria-expanded', String(open));
    connectionPanel.hidden = !open;
    workspaceEl.dataset.settingsOpen = String(open);
    if (open && typeof window !== 'undefined' && window.innerWidth < 1100 && isSidebarOpen) {
      setSidebarOpen(false);
    }
  }

  connectionToggleBtn.addEventListener('click', () => {
    setConnectionPanelOpen(!isConnectionPanelOpen);
  });

  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = currentTheme;
    themeIconEl.innerHTML = currentTheme === 'dark' ? ICONS.sunLight : ICONS.moonDark;
    themeToggleBtn.setAttribute(
      'data-tooltip',
      currentTheme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'
    );
  });

  function showFeedback(message: string | null): void {
    if (!message) {
      feedbackBanner.hidden = true;
      feedbackBanner.textContent = '';
      return;
    }
    feedbackBanner.hidden = false;
    feedbackBanner.textContent = message;
  }

  function setGeneratingState(busy: boolean): void {
    isGenerating = busy;
    requestBtn.disabled = false;
    requestBtn.dataset.busy = busy ? 'true' : 'false';
    const requestBtnIcon = requestBtn.querySelector<HTMLElement>('.tm-btn-cta-icon');
    const requestBtnLabel = requestBtn.querySelector<HTMLElement>('.tm-btn-cta-label');

    if (requestBtnIcon && requestBtnLabel) {
      if (busy) {
        requestBtnIcon.innerHTML = ICONS.stopSquare;
        requestBtnLabel.textContent = 'Interrompi elaborazione';
        requestBtn.setAttribute('data-tooltip', 'Interrompi elaborazione');
        requestBtn.setAttribute('aria-label', 'Interrompi elaborazione');
      } else {
        requestBtnIcon.innerHTML = ICONS.brandSparkles;
        requestBtnLabel.textContent = 'Avvia intervento maieutico';
        requestBtn.setAttribute(
          'data-tooltip',
          'Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico'
        );
        requestBtn.removeAttribute('aria-label');
      }
    }

    sendFollowUpBtn.disabled = false;
    sendFollowUpBtn.dataset.busy = busy ? 'true' : 'false';
    if (busy) {
      sendFabIcon.innerHTML = ICONS.stopSquare;
      sendFollowUpBtn.setAttribute('data-tooltip', 'Interrompi elaborazione');
      sendFollowUpBtn.setAttribute('aria-label', 'Interrompi elaborazione');
    } else {
      sendFabIcon.innerHTML = ICONS.sendArrow;
      sendFollowUpBtn.setAttribute('data-tooltip', 'Invia risposta socratica (Invio)');
      sendFollowUpBtn.setAttribute('aria-label', 'Invia risposta socratica');
    }
  }

  function scrollToLatest(): void {
    dialogueList.scrollTop = dialogueList.scrollHeight;
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        dialogueList.scrollTop = dialogueList.scrollHeight;
      });
    }
  }

  function renderHeaderState(snapshot: MaieuticSessionSnapshot): void {
    badgeTextEl.textContent = formatConnectionBadgeText(snapshot);
    badgeEl.dataset.status = snapshot.connectionStatus;
    badgeEl.dataset.mode = snapshot.connectionMode;

    if (snapshot.availableModels.length > 0) {
      modelSelect.hidden = false;
      modelSelect.innerHTML = snapshot.availableModels
        .map(
          (m) =>
            `<option value="${escapeHtml(m)}"${m === snapshot.activeModel ? ' selected' : ''}>${escapeHtml(m)}</option>`
        )
        .join('');
    } else {
      modelSelect.hidden = true;
      modelSelect.innerHTML = '';
    }

    if (document.activeElement !== endpointInput) {
      endpointInput.value = snapshot.endpointUrl;
    }
  }

  function bindCopyTurnButton(btn: HTMLButtonElement, getText: () => string): void {
    btn.addEventListener('click', () => {
      const text = getText();
      void navigator.clipboard?.writeText?.(text);
      btn.innerHTML = ICONS.checkCopied;
      btn.setAttribute('data-tooltip', 'Copiato');
      setTimeout(() => {
        btn.innerHTML = ICONS.copyTurn;
        btn.setAttribute('data-tooltip', 'Copia intervento');
      }, 1500);
    });
  }

  function createTurnElement(
    turn: MaieuticSessionSnapshot['turns'][number],
    idx: number,
    isPendingStudentTurn: boolean
  ): HTMLElement {
    const isStudent = turn.role === 'student';
    const roleClass = isStudent ? 'tm-turn-student' : 'tm-turn-tutor';

    const article = document.createElement('article');
    article.className = `tm-turn ${roleClass}`;
    article.dataset.turnIndex = String(idx);

    if (isStudent) {
      const sentBadge = isPendingStudentTurn
        ? `<span class="tm-sent-pill" data-testid="message-sent-indicator">Inviato</span>`
        : '';
      article.innerHTML = `
        ${sentBadge}
        <div class="tm-turn-body">${escapeHtml(turn.content)}</div>
      `;
      return article;
    }

    const reasoningBlock = turn.reasoning
      ? `<details class="tm-reasoning-block" data-testid="tutor-reasoning-details">
           <summary class="tm-reasoning-summary">Ragionamento del modello</summary>
           <div class="tm-reasoning-body">${escapeHtml(turn.reasoning)}</div>
         </details>`
      : '';

    article.innerHTML = `
      ${reasoningBlock}
      <div class="tm-turn-body">${escapeHtml(turn.content)}</div>
      <footer class="tm-turn-actions">
        <button
          type="button"
          class="tm-turn-action-btn"
          data-testid="copy-turn-btn"
          data-tooltip="Copia intervento"
          aria-label="Copia intervento maieutico"
        >
          ${ICONS.copyTurn}
        </button>
      </footer>
    `;

    const copyBtn = article.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    bindCopyTurnButton(copyBtn, () => turn.content);

    return article;
  }

  function createPendingTutorElement(): {
    article: HTMLElement;
    badgeEl: HTMLElement;
    reasoningDetailsEl: HTMLDetailsElement;
    reasoningSummaryEl: HTMLElement;
    reasoningBodyEl: HTMLElement;
    loaderEl: HTMLElement;
    bodyEl: HTMLElement;
    actionsEl: HTMLElement;
    copyBtnEl: HTMLButtonElement;
  } {
    const article = document.createElement('article');
    article.className = 'tm-turn tm-turn-tutor tm-turn-thinking';
    article.dataset.pendingTutor = 'true';
    article.dataset.testid = 'tutor-thinking-indicator';
    article.innerHTML = `
      <header class="tm-turn-header">
        <span class="tm-thinking-badge">Elaborazione in corso...</span>
      </header>
      <details class="tm-reasoning-block" data-testid="tutor-reasoning-details" hidden>
        <summary class="tm-reasoning-summary">Ragionamento in corso...</summary>
        <div class="tm-reasoning-body"></div>
      </details>
      <div class="tm-gemini-loader" aria-hidden="true">
        <span class="tm-shimmer-bar tm-shimmer-1"></span>
        <span class="tm-shimmer-bar tm-shimmer-2"></span>
        <span class="tm-shimmer-3 tm-shimmer-bar"></span>
      </div>
      <div class="tm-turn-body" hidden></div>
      <footer class="tm-turn-actions" hidden>
        <button
          type="button"
          class="tm-turn-action-btn"
          data-testid="copy-turn-btn"
          data-tooltip="Copia intervento"
          aria-label="Copia intervento maieutico"
        >
          ${ICONS.copyTurn}
        </button>
      </footer>
    `;

    const bodyEl = article.querySelector<HTMLElement>('.tm-turn-body')!;
    const actionsEl = article.querySelector<HTMLElement>('.tm-turn-actions')!;
    const copyBtnEl = article.querySelector<HTMLButtonElement>('[data-testid="copy-turn-btn"]')!;
    bindCopyTurnButton(copyBtnEl, () => bodyEl.textContent ?? '');

    return {
      article,
      badgeEl: article.querySelector<HTMLElement>('.tm-thinking-badge')!,
      reasoningDetailsEl: article.querySelector<HTMLDetailsElement>('[data-testid="tutor-reasoning-details"]')!,
      reasoningSummaryEl: article.querySelector<HTMLElement>('.tm-reasoning-summary')!,
      reasoningBodyEl: article.querySelector<HTMLElement>('.tm-reasoning-body')!,
      loaderEl: article.querySelector<HTMLElement>('.tm-gemini-loader')!,
      bodyEl,
      actionsEl,
      copyBtnEl,
    };
  }

  function clearEmptyState(): void {
    dialogueList.querySelector('.tm-empty-state')?.remove();
  }

  function collapseReasoningBlock(tutorEl: ReturnType<typeof createPendingTutorElement>): void {
    tutorEl.reasoningDetailsEl.open = false;
    tutorEl.reasoningSummaryEl.textContent = 'Ragionamento del modello';
  }

  function renderSnapshot(snapshot: MaieuticSessionSnapshot): void {
    renderHeaderState(snapshot);

    if (snapshot.turns.length === 0) {
      dialogueList.innerHTML = `
        <div class="tm-empty-state">
          <p class="tm-empty-title">Come posso aiutarti a ragionare oggi?</p>
          <p class="tm-empty-dialogue">
            Inserisci il tuo tentativo e compila il <strong>pre-impegno cognitivo</strong> nella barra laterale per iniziare.
          </p>
        </div>
      `;
      return;
    }

    clearEmptyState();

    snapshot.turns.forEach((turn, idx) => {
      const existing = dialogueList.querySelector<HTMLElement>(`[data-turn-index="${idx}"]`);
      if (!existing) {
        dialogueList.appendChild(createTurnElement(turn, idx, false));
      }
    });

    scrollToLatest();
  }

  codeInput.addEventListener('input', () => {
    engine.updateStudentDraft({ studentCode: codeInput.value });
  });

  errorInput.addEventListener('input', () => {
    engine.updateStudentDraft({ compilerError: errorInput.value });
  });

  preCommitmentInput.addEventListener('input', () => {
    engine.updateStudentDraft({ cognitivePreCommitment: preCommitmentInput.value });
  });

  modelSelect.addEventListener('change', () => {
    engine.setActiveModel(modelSelect.value);
    renderHeaderState(engine.getSnapshot());
  });

  endpointForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showFeedback(null);
    try {
      const snap = await engine.configureEndpoint(endpointInput.value);
      renderHeaderState(snap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Endpoint non valido';
      showFeedback(msg);
      renderHeaderState(engine.getSnapshot());
    }
  });

  async function runInterventionRequest(studentFollowUp?: string): Promise<boolean> {
    if (isGenerating) return false;
    showFeedback(null);

    let streamAccum = '';
    let reasoningAccum = '';
    type PendingTutorElements = ReturnType<typeof createPendingTutorElement>;
    let pendingTutor: PendingTutorElements | null = null;

    setGeneratingState(true);

    const ensureInitialPendingDOM = (): PendingTutorElements | null => {
      const snap = engine.getSnapshot();
      if (snap.turns.length === 0) return null;

      clearEmptyState();

      const lastIdx = snap.turns.length - 1;
      const lastTurn = snap.turns[lastIdx];
      let studentTurnEl = dialogueList.querySelector<HTMLElement>(`[data-turn-index="${lastIdx}"]`);
      if (!studentTurnEl && lastTurn.role === 'student') {
        studentTurnEl = createTurnElement(lastTurn, lastIdx, true);
        dialogueList.appendChild(studentTurnEl);
      }

      if (!pendingTutor) {
        pendingTutor = createPendingTutorElement();
        dialogueList.appendChild(pendingTutor.article);
      }
      return pendingTutor;
    };

    const requestPromise = engine.requestMaieuticIntervention(studentFollowUp, {
      stream: true,
      onReasoningToken: (chunk) => {
        const tutorEl = ensureInitialPendingDOM();
        if (!tutorEl) return;
        const wasHidden = tutorEl.reasoningDetailsEl.hidden;
        reasoningAccum += chunk;
        tutorEl.loaderEl.hidden = true;
        tutorEl.reasoningDetailsEl.hidden = false;
        if (wasHidden && streamAccum.length === 0) {
          tutorEl.reasoningDetailsEl.open = true;
          tutorEl.reasoningSummaryEl.textContent = 'Ragionamento in corso...';
        }
        tutorEl.reasoningBodyEl.textContent = reasoningAccum;
        scrollToLatest();
      },
      onToken: (token) => {
        const tutorEl = ensureInitialPendingDOM();
        if (!tutorEl) return;
        streamAccum += token;
        tutorEl.loaderEl.hidden = true;
        tutorEl.article.classList.remove('tm-turn-thinking');
        tutorEl.article.classList.add('tm-turn-streaming');
        tutorEl.badgeEl.textContent = 'Risposta in corso...';
        if (!tutorEl.reasoningDetailsEl.hidden) {
          collapseReasoningBlock(tutorEl);
        }
        tutorEl.bodyEl.hidden = false;
        tutorEl.bodyEl.textContent = streamAccum;
        scrollToLatest();
      },
    });

    // Se il pre-impegno cognitivo è valido, il turno studente è già stato aggiunto sincronamente in RAM
    const activePendingTutor = ensureInitialPendingDOM();
    scrollToLatest();

    const result = await requestPromise;
    setGeneratingState(false);

    const finalSnap = engine.getSnapshot();
    renderHeaderState(finalSnap);

    // Rimuove l'indicatore temporaneo "Inviato" in-place senza ricreare il nodo dello studente
    const sentIndicator = dialogueList.querySelector('[data-testid="message-sent-indicator"]');
    if (sentIndicator) {
      sentIndicator.remove();
    }

    const resolvedPendingTutor = pendingTutor ?? activePendingTutor;

    if (result.status !== 'ok' && result.status !== 'aborted') {
      if (resolvedPendingTutor) {
        resolvedPendingTutor.article.remove();
      }
      // Se lo studente è stato respinto per errore sul turno, rimuove eventuale nodo studente annullato
      const orphanTurns = dialogueList.querySelectorAll<HTMLElement>('[data-turn-index]');
      orphanTurns.forEach((el) => {
        const idx = Number(el.dataset.turnIndex);
        if (idx >= finalSnap.turns.length) {
          el.remove();
        }
      });
      if (finalSnap.turns.length === 0) {
        renderSnapshot(finalSnap);
      }

      if (result.status === 'rejected_pre_commitment') {
        if (!isSidebarOpen) {
          setSidebarOpen(true);
        }
        preCommitmentInput.focus();
      }

      showFeedback(result.pedagogicalMessage ?? 'Impossibile completare la richiesta.');
      return false;
    }

    // Promuove in-place lo stesso identico elemento DOM del tutor (zero blinking / zero fade-in ripetuto)
    const tutorTurnIndex = finalSnap.turns.length - 1;
    const finalTutorTurn = finalSnap.turns[tutorTurnIndex];
    if (resolvedPendingTutor && finalTutorTurn) {
      resolvedPendingTutor.article.classList.remove('tm-turn-thinking', 'tm-turn-streaming');
      delete resolvedPendingTutor.article.dataset.pendingTutor;
      resolvedPendingTutor.article.removeAttribute('data-testid');
      resolvedPendingTutor.article.dataset.turnIndex = String(tutorTurnIndex);
      resolvedPendingTutor.badgeEl.closest('.tm-turn-header')?.remove();
      resolvedPendingTutor.loaderEl.remove();

      if (finalTutorTurn.reasoning) {
        resolvedPendingTutor.reasoningDetailsEl.hidden = false;
        collapseReasoningBlock(resolvedPendingTutor);
        resolvedPendingTutor.reasoningBodyEl.textContent = finalTutorTurn.reasoning;
      } else {
        resolvedPendingTutor.reasoningDetailsEl.remove();
      }

      resolvedPendingTutor.bodyEl.hidden = false;
      resolvedPendingTutor.bodyEl.textContent = finalTutorTurn.content;
      resolvedPendingTutor.actionsEl.hidden = false;
    } else {
      renderSnapshot(finalSnap);
    }

    scrollToLatest();
    return true;
  }

  attemptForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isGenerating) {
      engine.abortCurrentIntervention();
      return;
    }
    engine.updateStudentDraft({
      studentCode: codeInput.value,
      compilerError: errorInput.value,
      cognitivePreCommitment: preCommitmentInput.value,
    });
    await runInterventionRequest(undefined);
  });

  requestBtn.addEventListener('click', (event) => {
    if (isGenerating) {
      event.preventDefault();
      engine.abortCurrentIntervention();
    }
  });

  followUpInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isGenerating) {
        followUpForm.requestSubmit();
      }
    }
  });

  followUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isGenerating) {
      engine.abortCurrentIntervention();
      return;
    }
    const replyText = followUpInput.value;
    if (replyText.trim().length > 0) {
      followUpInput.value = '';
    }
    const ok = await runInterventionRequest(replyText);
    if (!ok && replyText.trim().length > 0) {
      followUpInput.value = replyText;
    }
  });

  sendFollowUpBtn.addEventListener('click', (event) => {
    if (isGenerating) {
      event.preventDefault();
      engine.abortCurrentIntervention();
    }
  });

  newSessionBtn.addEventListener('click', () => {
    engine.resetSession();
    codeInput.value = '';
    errorInput.value = '';
    preCommitmentInput.value = '';
    followUpInput.value = '';
    showFeedback(null);
    renderSnapshot(engine.getSnapshot());
    preCommitmentInput.focus();
  });

  const initialSnapshot = await engine.checkInferenceConnection();
  endpointInput.value = initialSnapshot.endpointUrl;
  renderSnapshot(initialSnapshot);
}
