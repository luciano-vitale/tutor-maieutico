import type { MaieuticSessionEngine, MaieuticSessionSnapshot } from '../domain/MaieuticSessionEngine';

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
    const modelLabel = snapshot.activeModel ?? 'Modello pronto';
    return `Connesso • ${modeLabel} (${snapshot.endpointUrl}) • ${modelLabel}`;
  }

  if (snapshot.connectionStatus === 'offline') {
    return `Offline • ${modeLabel} (${snapshot.endpointUrl})`;
  }

  return `Verifica connessione • ${modeLabel} (${snapshot.endpointUrl})`;
}

export async function mountWorkspaceUI(
  container: HTMLElement,
  engine: MaieuticSessionEngine
): Promise<void> {
  container.innerHTML = `
    <div class="tm-shell">
      <header class="tm-header" role="banner">
        <div class="tm-disclosure-banner" data-testid="aup-disclosure-banner" role="region" aria-label="Informativa AUP-IA e PUIA">
          <div class="tm-disclosure-primary">
            <strong>Disclosure AUP-IA (CU-05, CU-11, CU-15):</strong>
            Stai interagendo con <em>Tutor Maieutico</em>, un sistema di Intelligenza Artificiale generativa locale con funzione esclusivamente socratica.
            L'IA può commettere errori o imprecisioni: verifica sempre ogni ipotesi nel tuo IDE di laboratorio e con il docente.
          </div>
          <div class="tm-disclosure-secondary">
            <span><strong>Primato dell'apprendimento (AUP-IA §1):</strong> il sistema guida il ragionamento e non fornisce soluzioni pronte.</span>
            <span><strong>Regime Zero-Data (PUIA §4):</strong> sessione solo in memoria volatile (RAM), zero salvataggi su disco.</span>
            <span><strong>Esclusione tassativa CU-16..19:</strong> nessun voto, nessuna valutazione, nessuna profilazione o monitoraggio.</span>
          </div>
        </div>

        <div class="tm-toolbar">
          <div class="tm-brand">
            <h1 class="tm-title">Tutor Maieutico</h1>
            <span class="tm-subtitle">I.I.S.S. "Marconi-Hack" • Laboratorio Didattico Zero-Data</span>
          </div>

          <div class="tm-connection-bar">
            <span class="tm-badge" data-testid="connection-status-badge" aria-live="polite"></span>

            <form id="endpoint-config-form" class="tm-endpoint-form" novalidate>
              <label for="endpoint-url-input" class="tm-sr-only">Endpoint Motore di Inferenza (Loopback o LAN RFC 1918)</label>
              <input
                type="url"
                id="endpoint-url-input"
                name="endpointUrl"
                class="tm-input tm-endpoint-input"
                aria-describedby="endpoint-help"
                required
              />
              <span id="endpoint-help" class="tm-sr-only">Accetta solo 127.0.0.1, localhost o IP privati LAN RFC 1918</span>
              <button type="submit" class="tm-btn tm-btn-secondary">Connetti Endpoint</button>
            </form>

            <button
              type="button"
              class="tm-btn tm-btn-danger"
              data-testid="new-session-btn"
              title="Distrugge istantaneamente tutti i dati della Sessione Maieutica nella RAM"
            >
              Nuova Sessione (Azzera RAM)
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
          <h2 id="left-panel-heading" class="tm-panel-title">
            1. Contesto &amp; Tentativo dello Studente
          </h2>

          <form id="student-attempt-form" class="tm-form" novalidate>
            <fieldset class="tm-fieldset">
              <legend class="tm-legend">Elaborazione autonoma e Pre-impegno Cognitivo</legend>

              <div class="tm-form-group">
                <label for="student-code-input" class="tm-label">
                  Tentativo di Codice o Pseudocodice
                </label>
                <textarea
                  id="student-code-input"
                  name="studentCode"
                  class="tm-textarea tm-code-textarea"
                  rows="7"
                  placeholder="Incolla qui il frammento di codice o lo pseudocodice su cui stai lavorando..."
                ></textarea>
              </div>

              <div class="tm-form-group">
                <label for="compiler-error-input" class="tm-label">
                  Messaggio di Errore del Compilatore / Interprete (opzionale)
                </label>
                <textarea
                  id="compiler-error-input"
                  name="compilerError"
                  class="tm-textarea tm-error-textarea"
                  rows="3"
                  placeholder="Incolla eventuale output di errore o comportamento imprevisto..."
                ></textarea>
              </div>

              <div class="tm-form-group">
                <label for="pre-commitment-input" class="tm-label">
                  Pre-impegno Cognitivo <span class="tm-required-marker" aria-hidden="true">* (Obbligatorio)</span>
                </label>
                <p id="pre-commitment-desc" class="tm-field-hint">
                  Cosa ho provato a fare / Qual è la mia ipotesi / Dove mi sono bloccato:
                </p>
                <textarea
                  id="pre-commitment-input"
                  name="cognitivePreCommitment"
                  class="tm-textarea"
                  rows="4"
                  aria-describedby="pre-commitment-desc"
                  placeholder="Es.: Ho impostato un ciclo for da 0 a N per sommare gli elementi, ma ottengo un valore sballato all'ultimo passo..."
                  required
                ></textarea>
              </div>

              <div class="tm-form-actions">
                <label class="tm-checkbox-label">
                  <input type="checkbox" id="stream-mode-checkbox" name="streamMode" />
                  Risposta in streaming (SSE)
                </label>
                <button type="submit" class="tm-btn tm-btn-primary" data-testid="request-intervention-btn">
                  Richiedi Intervento Maieutico
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
          <h2 id="right-panel-heading" class="tm-panel-title">
            2. Dialogo Maieutico
          </h2>

          <div
            class="tm-dialogue-list"
            data-testid="dialogue-turns-list"
            role="log"
            aria-live="polite"
            aria-label="Cronologia degli Interventi Maieutici"
          ></div>

          <form id="socratic-followup-form" class="tm-form tm-followup-form" novalidate>
            <div class="tm-form-group">
              <label for="socratic-reply-input" class="tm-label">
                La tua risposta alle domande socratiche del Tutor Maieutico
              </label>
              <textarea
                id="socratic-reply-input"
                name="socraticReply"
                class="tm-textarea"
                rows="3"
                placeholder="Rispondi alla domanda guida del Tutor o proponi una verifica del tuo ragionamento..."
              ></textarea>
            </div>
            <div class="tm-form-actions">
              <button type="submit" class="tm-btn tm-btn-primary" data-testid="send-followup-btn">
                Invia Risposta Socratica
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  `;

  const badgeEl = container.querySelector<HTMLElement>('[data-testid="connection-status-badge"]')!;
  const endpointForm = container.querySelector<HTMLFormElement>('#endpoint-config-form')!;
  const endpointInput = container.querySelector<HTMLInputElement>('#endpoint-url-input')!;
  const newSessionBtn = container.querySelector<HTMLButtonElement>('[data-testid="new-session-btn"]')!;
  const feedbackBanner = container.querySelector<HTMLElement>('[data-testid="pedagogical-feedback"]')!;

  const attemptForm = container.querySelector<HTMLFormElement>('#student-attempt-form')!;
  const codeInput = container.querySelector<HTMLTextAreaElement>('#student-code-input')!;
  const errorInput = container.querySelector<HTMLTextAreaElement>('#compiler-error-input')!;
  const preCommitmentInput = container.querySelector<HTMLTextAreaElement>('#pre-commitment-input')!;
  const streamCheckbox = container.querySelector<HTMLInputElement>('#stream-mode-checkbox')!;

  const dialogueList = container.querySelector<HTMLElement>('[data-testid="dialogue-turns-list"]')!;
  const followUpForm = container.querySelector<HTMLFormElement>('#socratic-followup-form')!;
  const followUpInput = container.querySelector<HTMLTextAreaElement>('#socratic-reply-input')!;

  function showFeedback(message: string | null): void {
    if (!message) {
      feedbackBanner.hidden = true;
      feedbackBanner.textContent = '';
      return;
    }
    feedbackBanner.hidden = false;
    feedbackBanner.textContent = message;
  }

  function renderSnapshot(snapshot: MaieuticSessionSnapshot, streamingDraft?: string): void {
    badgeEl.textContent = formatConnectionBadgeText(snapshot);
    badgeEl.dataset.status = snapshot.connectionStatus;
    badgeEl.dataset.mode = snapshot.connectionMode;

    if (document.activeElement !== endpointInput) {
      endpointInput.value = snapshot.endpointUrl;
    }

    if (snapshot.turns.length === 0 && !streamingDraft) {
      dialogueList.innerHTML = `
        <p class="tm-empty-dialogue">
          Nessun Intervento Maieutico attivo in RAM. Compila il <strong>Pre-impegno Cognitivo</strong> nel pannello di sinistra per avviare il dialogo socratico.
        </p>
      `;
      return;
    }

    const turnsHtml = snapshot.turns
      .map((turn) => {
        const roleLabel =
          turn.role === 'student' ? 'Studente (Tentativo & Ragionamento)' : 'Tutor Maieutico';
        const roleClass = turn.role === 'student' ? 'tm-turn-student' : 'tm-turn-tutor';
        return `
          <article class="tm-turn ${roleClass}">
            <header class="tm-turn-header">
              <strong>${roleLabel}</strong>
            </header>
            <div class="tm-turn-body">${escapeHtml(turn.content)}</div>
          </article>
        `;
      })
      .join('');

    const streamingHtml = streamingDraft
      ? `
        <article class="tm-turn tm-turn-tutor tm-turn-streaming">
          <header class="tm-turn-header">
            <strong>Tutor Maieutico (in elaborazione...)</strong>
          </header>
          <div class="tm-turn-body">${escapeHtml(streamingDraft)}</div>
        </article>
      `
      : '';

    dialogueList.innerHTML = turnsHtml + streamingHtml;
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
    showFeedback(null);
    let streamAccum = '';
    const result = await engine.requestMaieuticIntervention(studentFollowUp, {
      stream: streamCheckbox.checked,
      onToken: (token) => {
        streamAccum += token;
        renderSnapshot(engine.getSnapshot(), streamAccum);
      },
    });

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

  followUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const ok = await runInterventionRequest(followUpInput.value);
    if (ok) {
      followUpInput.value = '';
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
