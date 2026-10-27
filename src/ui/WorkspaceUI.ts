import type { MaieuticSessionEngine, MaieuticSessionSnapshot } from '../domain/MaieuticSessionEngine';

const ICONS = {
  brandSparkles: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
  shieldInfo: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  plugConnect: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`,
  resetRam: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  codeBlock: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  terminalBug: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  boltStream: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
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
      : 'Modalità Endpoint LAN';

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
  container.innerHTML = `
    <div class="tm-shell">
      <header class="tm-header" role="banner">
        <div
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
            <span class="tm-brand-logo">${ICONS.brandSparkles}</span>
            <div class="tm-brand-titles">
              <h1 class="tm-title">Tutor Maieutico</h1>
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

            <label
              class="tm-icon-toggle"
              data-tooltip="Streaming SSE in tempo reale"
              title="Attiva o disattiva lo streaming SSE in tempo reale"
            >
              <input type="checkbox" id="stream-mode-checkbox" name="streamMode" checked />
              <span class="tm-icon-toggle-surface" aria-hidden="true">${ICONS.boltStream}</span>
              <span class="tm-sr-only">Risposta in streaming (SSE)</span>
            </label>

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

      <main class="tm-workspace" role="main">
        <section
          class="tm-panel tm-panel-left"
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
        </section>

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
  const streamCheckbox = container.querySelector<HTMLInputElement>('#stream-mode-checkbox')!;

  const dialogueList = container.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
  const followUpForm = container.querySelector<HTMLFormElement>('#socratic-followup-form')!;
  const followUpInput = container.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;
  const sendFollowUpBtn = container.querySelector<HTMLButtonElement>('[data-testid="send-followup-btn"]')!;
  const sendFabIcon = sendFollowUpBtn.querySelector<HTMLElement>('.tm-send-fab-icon')!;

  let isGenerating = false;

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
    if (typeof dialogueList.scrollTo === 'function') {
      dialogueList.scrollTo({ top: dialogueList.scrollHeight, behavior: 'smooth' });
    } else {
      dialogueList.scrollTop = dialogueList.scrollHeight;
    }
  }

  function renderSnapshot(
    snapshot: MaieuticSessionSnapshot,
    options: { isWaitingFirstToken?: boolean; streamingDraft?: string } = {}
  ): void {
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

    const { isWaitingFirstToken = false, streamingDraft = '' } = options;

    if (snapshot.turns.length === 0 && !isWaitingFirstToken && !streamingDraft) {
      dialogueList.innerHTML = `
        <div class="tm-empty-state">
          <div class="tm-empty-orb">${ICONS.brandSparkles}</div>
          <p class="tm-empty-title">Pronto per il dialogo socratico</p>
          <p class="tm-empty-dialogue">
            Inserisci il tuo tentativo e compila il <strong>pre-impegno cognitivo</strong> nel pannello di sinistra per iniziare.
          </p>
        </div>
      `;
      return;
    }

    const turnsHtml = snapshot.turns
      .map((turn, idx) => {
        const isStudent = turn.role === 'student';
        const roleLabel = isStudent ? 'Tu (studente)' : 'Tutor maieutico';
        const roleClass = isStudent ? 'tm-turn-student' : 'tm-turn-tutor';
        const avatarSvg = isStudent ? ICONS.studentAvatar : ICONS.brandSparkles;
        const sentBadge =
          isStudent && idx === snapshot.turns.length - 1 && (isWaitingFirstToken || streamingDraft)
            ? `<span class="tm-sent-pill" data-testid="message-sent-indicator">Inviato</span>`
            : '';

        return `
          <article class="tm-turn ${roleClass}">
            <header class="tm-turn-header">
              <span class="tm-avatar">${avatarSvg}</span>
              <strong class="tm-turn-author">${roleLabel}</strong>
              ${sentBadge}
            </header>
            <div class="tm-turn-body">${escapeHtml(turn.content)}</div>
          </article>
        `;
      })
      .join('');

    let pendingHtml = '';
    if (streamingDraft) {
      pendingHtml = `
        <article class="tm-turn tm-turn-tutor tm-turn-streaming" data-testid="tutor-thinking-indicator">
          <header class="tm-turn-header">
            <span class="tm-avatar tm-avatar-pulse">${ICONS.brandSparkles}</span>
            <strong class="tm-turn-author">Tutor maieutico</strong>
            <span class="tm-thinking-badge">Risposta in corso...</span>
          </header>
          <div class="tm-turn-body">${escapeHtml(streamingDraft)}<span class="tm-stream-cursor" aria-hidden="true">▍</span></div>
        </article>
      `;
    } else if (isWaitingFirstToken) {
      pendingHtml = `
        <article class="tm-turn tm-turn-tutor tm-turn-thinking" data-testid="tutor-thinking-indicator">
          <header class="tm-turn-header">
            <span class="tm-avatar tm-avatar-pulse">${ICONS.brandSparkles}</span>
            <strong class="tm-turn-author">Tutor maieutico</strong>
            <span class="tm-thinking-badge">Il tutor sta elaborando la domanda socratica...</span>
          </header>
          <div class="tm-gemini-loader" aria-hidden="true">
            <span class="tm-shimmer-bar tm-shimmer-1"></span>
            <span class="tm-shimmer-bar tm-shimmer-2"></span>
            <span class="tm-shimmer-bar tm-shimmer-3"></span>
          </div>
        </article>
      `;
    }

    dialogueList.innerHTML = turnsHtml + pendingHtml;
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
    renderSnapshot(engine.getSnapshot());
  });

  endpointForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showFeedback(null);
    try {
      const snap = await engine.configureEndpoint(endpointInput.value);
      renderSnapshot(snap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Endpoint non valido';
      showFeedback(msg);
      renderSnapshot(engine.getSnapshot());
    }
  });

  async function runInterventionRequest(studentFollowUp?: string): Promise<boolean> {
    if (isGenerating) return false;
    showFeedback(null);

    let streamAccum = '';
    setGeneratingState(true);

    const requestPromise = engine.requestMaieuticIntervention(studentFollowUp, {
      stream: streamCheckbox.checked,
      onToken: (token) => {
        streamAccum += token;
        renderSnapshot(engine.getSnapshot(), {
          isWaitingFirstToken: false,
          streamingDraft: streamAccum,
        });
      },
    });

    // Render immediato: mostra il messaggio dello studente appena aggiunto e l'animazione stile Gemini
    renderSnapshot(engine.getSnapshot(), {
      isWaitingFirstToken: true,
      streamingDraft: '',
    });

    const result = await requestPromise;
    setGeneratingState(false);

    if (result.status !== 'ok') {
      showFeedback(result.pedagogicalMessage ?? 'Impossibile completare la richiesta.');
    }

    renderSnapshot(engine.getSnapshot());
    return result.status === 'ok';
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
