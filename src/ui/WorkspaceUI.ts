import type { MaieuticSessionEngine, MaieuticSessionSnapshot } from '../domain/MaieuticSessionEngine';

const ICONS = {
  brandSparkles: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
  sidebarLeft: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`,
  topbarPanel: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>`,
  sunLight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  moonDark: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  shieldInfo: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  plugConnect: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`,
  resetRam: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  codeBlock: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  terminalBug: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  sendArrow: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
  studentAvatar: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  spinner: `<svg class="tm-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
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
  let currentTheme: 'dark' | 'light' = 'dark';
  let isSidebarOpen = true;
  let isTopbarOpen = true;
  document.documentElement.dataset.theme = currentTheme;

  container.innerHTML = `
    <div class="tm-shell">
      <header class="tm-header" role="banner">
        <div
          id="aup-disclosure-topbar"
          class="tm-disclosure-banner"
          data-testid="aup-disclosure-banner"
          role="region"
          aria-label="Informativa AUP-IA e PUIA"
        >
          <span class="tm-disclosure-icon">${ICONS.shieldInfo}</span>
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

        <div class="tm-toolbar">
          <div class="tm-brand">
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
              class="tm-icon-btn tm-topbar-toggle-btn"
              data-testid="topbar-toggle-btn"
              data-tooltip="Mostra o nascondi la barra superiore di disclosure AUP-IA"
              aria-label="Mostra o nascondi la barra superiore di disclosure AUP-IA"
              aria-controls="aup-disclosure-topbar"
              aria-expanded="true"
            >
              ${ICONS.topbarPanel}
            </button>
            <span class="tm-brand-logo">${ICONS.brandSparkles}</span>
            <div class="tm-brand-titles">
              <h1 class="tm-title">StudIA Tutor maieutico</h1>
              <span class="tm-subtitle">I.I.S.S. "Marconi-Hack" • Laboratorio zero-data</span>
            </div>
          </div>

          <div class="tm-connection-bar">
            <div class="tm-status-pill" data-testid="connection-status-badge" aria-live="polite">
              <span class="tm-led" aria-hidden="true"></span>
              <span class="tm-status-text"></span>
            </div>

            <label for="model-select" class="tm-sr-only">Modello linguistico attivo</label>
            <select
              id="model-select"
              name="activeModel"
              class="tm-input tm-model-select"
              data-testid="model-select"
              aria-label="Modello linguistico attivo"
              title="Seleziona il modello linguistico caricato in LM Studio"
            ></select>

            <form id="endpoint-config-form" class="tm-endpoint-form" novalidate>
              <label for="endpoint-url-input" class="tm-sr-only">Endpoint del motore di inferenza (loopback o LAN RFC 1918)</label>
              <input
                type="url"
                id="endpoint-url-input"
                name="endpointUrl"
                class="tm-input tm-endpoint-input"
                aria-describedby="endpoint-help"
                placeholder="http://127.0.0.1:1234/v1"
                required
              />
              <span id="endpoint-help" class="tm-sr-only">Accetta solo 127.0.0.1, localhost o IP privati LAN RFC 1918</span>
              <button
                type="submit"
                class="tm-icon-btn"
                data-tooltip="Connetti o verifica l'endpoint LM Studio"
                aria-label="Connetti o verifica l'endpoint LM Studio"
              >
                ${ICONS.plugConnect}
              </button>
            </form>

            <button
              type="button"
              class="tm-icon-btn"
              data-testid="theme-toggle-btn"
              data-tooltip="Passa al tema chiaro"
              aria-label="Cambia tema tra chiaro e scuro"
            >
              <span class="tm-theme-icon">${ICONS.sunLight}</span>
            </button>

            <button
              type="button"
              class="tm-icon-btn tm-icon-btn-danger"
              data-testid="new-session-btn"
              data-tooltip="Nuova sessione: azzera i dati in RAM"
              aria-label="Nuova sessione: azzera i dati in RAM"
            >
              ${ICONS.resetRam}
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

      <main class="tm-workspace" data-sidebar-open="true" role="main">
        <aside
          id="left-sidebar-panel"
          class="tm-panel tm-panel-left tm-sidebar"
          data-testid="left-panel-context"
          aria-labelledby="left-panel-heading"
        >
          <div class="tm-panel-header">
            <span class="tm-panel-icon">${ICONS.codeBlock}</span>
            <h2 id="left-panel-heading" class="tm-panel-title">
              Contesto e tentativo dello studente
            </h2>
          </div>

          <form id="student-attempt-form" class="tm-form" novalidate>
            <fieldset class="tm-fieldset">
              <legend class="tm-sr-only">Elaborazione autonoma e pre-impegno cognitivo</legend>

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
                  rows="3"
                  aria-describedby="pre-commitment-desc"
                  placeholder="Es.: Ho impostato un ciclo for da 0 a N per sommare gli elementi, ma ottengo un valore errato all'ultimo passo..."
                  required
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
          <div class="tm-panel-header">
            <span class="tm-panel-icon">${ICONS.brandSparkles}</span>
            <h2 id="right-panel-heading" class="tm-panel-title">
              Dialogo maieutico
            </h2>
          </div>

          <div
            class="tm-dialogue-list"
            data-testid="dialogue-turns-list"
            role="log"
            aria-live="polite"
            aria-label="Cronologia degli interventi maieutici"
          ></div>

          <form id="socratic-followup-form" class="tm-composer" novalidate>
            <label for="socratic-reply-input" class="tm-sr-only">
              Rispondi alla domanda socratica del tutor maieutico
            </label>
            <textarea
              id="socratic-reply-input"
              name="socraticReply"
              class="tm-composer-input"
              rows="2"
              placeholder="Rispondi alla domanda socratica del tutor... (Invio per inviare, Shift+Invio per andare a capo)"
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
        </section>
      </main>
    </div>
  `;

  const workspaceEl = container.querySelector<HTMLElement>('.tm-workspace')!;
  const sidebarToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="sidebar-toggle-btn"]'
  )!;
  const topbarToggleBtn = container.querySelector<HTMLButtonElement>(
    '[data-testid="topbar-toggle-btn"]'
  )!;
  const disclosureBanner = container.querySelector<HTMLElement>(
    '[data-testid="aup-disclosure-banner"]'
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
    requestBtn.disabled = busy;
    sendFollowUpBtn.disabled = busy;
    sendFollowUpBtn.dataset.busy = busy ? 'true' : 'false';
    sendFabIcon.innerHTML = busy ? ICONS.spinner : ICONS.sendArrow;
  }

  function scrollToLatest(): void {
    dialogueList.scrollTop = dialogueList.scrollHeight;
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

  function createTurnElement(
    turn: MaieuticSessionSnapshot['turns'][number],
    idx: number,
    isPendingStudentTurn: boolean
  ): HTMLElement {
    const isStudent = turn.role === 'student';
    const roleLabel = isStudent ? 'Tu (studente)' : 'Tutor maieutico';
    const roleClass = isStudent ? 'tm-turn-student' : 'tm-turn-tutor';
    const avatarSvg = isStudent ? ICONS.studentAvatar : ICONS.brandSparkles;

    const article = document.createElement('article');
    article.className = `tm-turn ${roleClass}`;
    article.dataset.turnIndex = String(idx);

    const sentBadge = isPendingStudentTurn
      ? `<span class="tm-sent-pill" data-testid="message-sent-indicator">Inviato</span>`
      : '';

    const reasoningBlock =
      !isStudent && turn.reasoning
        ? `<details class="tm-reasoning-block" data-testid="tutor-reasoning-details">
             <summary class="tm-reasoning-summary">Ragionamento del modello</summary>
             <div class="tm-reasoning-body">${escapeHtml(turn.reasoning)}</div>
           </details>`
        : '';

    article.innerHTML = `
      <header class="tm-turn-header">
        <span class="tm-avatar">${avatarSvg}</span>
        <strong class="tm-turn-author">${roleLabel}</strong>
        ${sentBadge}
      </header>
      ${reasoningBlock}
      <div class="tm-turn-body">${escapeHtml(turn.content)}</div>
    `;
    return article;
  }

  function createPendingTutorElement(): {
    article: HTMLElement;
    avatarEl: HTMLElement;
    badgeEl: HTMLElement;
    reasoningDetailsEl: HTMLDetailsElement;
    reasoningSummaryEl: HTMLElement;
    reasoningBodyEl: HTMLElement;
    loaderEl: HTMLElement;
    bodyEl: HTMLElement;
  } {
    const article = document.createElement('article');
    article.className = 'tm-turn tm-turn-tutor tm-turn-thinking';
    article.dataset.pendingTutor = 'true';
    article.dataset.testid = 'tutor-thinking-indicator';
    article.innerHTML = `
      <header class="tm-turn-header">
        <span class="tm-avatar tm-avatar-pulse">${ICONS.brandSparkles}</span>
        <strong class="tm-turn-author">Tutor maieutico</strong>
        <span class="tm-thinking-badge">Il tutor sta elaborando la domanda socratica...</span>
      </header>
      <details class="tm-reasoning-block" data-testid="tutor-reasoning-details" hidden>
        <summary class="tm-reasoning-summary">Ragionamento in corso...</summary>
        <div class="tm-reasoning-body"></div>
      </details>
      <div class="tm-gemini-loader" aria-hidden="true">
        <span class="tm-shimmer-bar tm-shimmer-1"></span>
        <span class="tm-shimmer-bar tm-shimmer-2"></span>
        <span class="tm-shimmer-bar tm-shimmer-3"></span>
      </div>
      <div class="tm-turn-body" hidden></div>
    `;

    return {
      article,
      avatarEl: article.querySelector<HTMLElement>('.tm-avatar')!,
      badgeEl: article.querySelector<HTMLElement>('.tm-thinking-badge')!,
      reasoningDetailsEl: article.querySelector<HTMLDetailsElement>('[data-testid="tutor-reasoning-details"]')!,
      reasoningSummaryEl: article.querySelector<HTMLElement>('.tm-reasoning-summary')!,
      reasoningBodyEl: article.querySelector<HTMLElement>('.tm-reasoning-body')!,
      loaderEl: article.querySelector<HTMLElement>('.tm-gemini-loader')!,
      bodyEl: article.querySelector<HTMLElement>('.tm-turn-body')!,
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
          <div class="tm-empty-orb">${ICONS.brandSparkles}</div>
          <p class="tm-empty-title">Pronto per il dialogo socratico</p>
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

    if (result.status !== 'ok') {
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
      resolvedPendingTutor.avatarEl.classList.remove('tm-avatar-pulse');
      resolvedPendingTutor.badgeEl.remove();
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
    } else {
      renderSnapshot(finalSnap);
    }

    scrollToLatest();
    return true;
  }

  attemptForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    engine.updateStudentDraft({
      studentCode: codeInput.value,
      compilerError: errorInput.value,
      cognitivePreCommitment: preCommitmentInput.value,
    });
    await runInterventionRequest(undefined);
  });

  followUpInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      followUpForm.requestSubmit();
    }
  });

  followUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const replyText = followUpInput.value;
    if (replyText.trim().length > 0) {
      followUpInput.value = '';
    }
    const ok = await runInterventionRequest(replyText);
    if (!ok && replyText.trim().length > 0) {
      followUpInput.value = replyText;
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
  });

  const initialSnapshot = await engine.checkInferenceConnection();
  endpointInput.value = initialSnapshot.endpointUrl;
  renderSnapshot(initialSnapshot);
}
