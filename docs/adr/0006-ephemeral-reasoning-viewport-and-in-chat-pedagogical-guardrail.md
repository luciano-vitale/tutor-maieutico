# Vista effimera del ragionamento e feedback pedagogico sul pre-impegno cognitivo in chat

Stato: accepted

## Contesto e motivazioni didattiche

In conformità ai principi di **invariante di non-sostituzione** e **pre-impegno cognitivo** (AUP-IA §1 e art. 25 L. 132/2025), l'esperienza d'uso didattica deve prevenire due forme di disimpegno cognitivo:
1. **Elusione del pre-impegno cognitivo**: quando lo studente tenta di avviare l'intervento senza aver esplicitato la propria ipotesi o il punto di blocco, la notifica tramite banner esterno di avviso (in testata o in modale) frammenta l'attenzione e non si inserisce nella relazione socratica. Il richiamo pedagogico deve invece manifestarsi come intervento dialogico immediato del tutor maieutico direttamente nella conversazione, focalizzando subito l'interazione sul campo di compilazione del pre-impegno.
2. **Esposizione prematura del ragionamento (catena di pensiero)**: i modelli linguistici con capacità di reasoning (es. DeepSeek-R1, Qwen-2.5-Coder-Thinking) generano sequenze analitiche interne che possono contenere la soluzione completa prima della formulazione socratica finale. Mantenere l'intero ragionamento visibile o espandibile per impostazione predefinita consente allo studente di sbirciare la soluzione, vanificando la progressione maieutica.

## Decisioni architetturali e di design

1. **Avvio unificato da barra chat o pannello laterale e richiamo pedagogico a turni alternati**:
   Lo studente può avviare la sessione sia dal pulsante del pannello laterale sia direttamente digitando nella barra chat in basso:
   - Se il testo digitato nella chat è **insufficiente come pre-impegno cognitivo** (< 15 caratteri o < 3 parole): la casella di digitazione in basso viene ripulita, il tentativo dello studente viene mostrato come turno `student` e seguito dal turno `tutor` con il richiamo obbligatorio (AUP-IA §1). Questa sequenza a coppia preserva rigorosamente l'invariante di alternanza `user` -> `assistant` richiesta dai chat template dei modelli LLM locali. Contestualmente, la frase digitata viene copiata nel campo del pre-impegno del pannello laterale con apertura automatica della barra e focus per l'espansione.
   - Se il testo digitato nella chat è **sufficiente come pre-impegno cognitivo**: viene accettato direttamente, sincronizzato nel draft, registrato come turno dello studente e l'intervento maieutico parte all'istante con il motore di inferenza locale, invitando socraticamente lo studente ad approfondire o condividere il codice a supporto.
   - I campi del modulo nel pannello laterale rimangono persistenti in memoria e non vengono mai resettati automaticamente, garantendo che lo studente non perda il lavoro svolto salvo clic esplicito su *"Nuova sessione"*.

2. **Rimozione della ridondanza visiva in generazione**:
   È stata eliminata la dicitura *"Elaborazione in corso..."* in testata di messaggio, lasciando come unico indicatore temporale la fase attiva di ragionamento.

3. **Vista effimera a 3 righe per il ragionamento dello studente**:
   Durante lo streaming dei token `<think>`, il ragionamento del modello è racchiuso in un riquadro compatto ad altezza vincolata a 3 righe (`max-height: calc(3 * 1.45em)`), con scorrimento automatico verso l'alto.
   Non appena la fase di pensiero termina (arrivo dei token di risposta maieutica o conclusione dell'inferenza), il riquadro scompare completamente dal DOM dello studente.

4. **Modalità sviluppatore opzionale nel pannello impostazioni**:
   All'interno del pannello impostazioni laterale è presente il selettore *"Modalità sviluppatore (ispezione ragionamento)"*. Quando abilitata, il ragionamento completo viene mantenuto consultabile all'interno del componente collassabile (`<details>Ragionamento del modello</details>`). Lo stato della preferenza è conservato esclusivamente in memoria volatile (RAM) in rispetto del regime zero-data.

5. **Feedback visivo e ritmico differenziato sui pulsanti di azione**:
   I pulsanti di avvio intervento (`.tm-btn-cta`) e di inoltro prompt in chat (`.tm-send-fab`) adottano un duplice stato cromatico e ritmico:
   - **Stato ordinario di disponibilità (invito maieutico)**: quando l'applicazione è in attesa dell'input dello studente ed abilitata (`:not([data-busy="true"]):not(:disabled)`), i controlli emettono una pulsazione lenta e distesa a bassa frequenza (periodo 3.2s, frequenza ~0.31 Hz) con alone sfumato nel blu istituzionale `--tm-brand-blue` (`#267eaa`) e micro-respirazione dell'icona a 2.4s.
   - **Stato di elaborazione attiva (interruzione d'emergenza)**: durante l'elaborazione dell'intervento maieutico, i pulsanti assumono lo stato `data-busy="true"` ed eseguono un'animazione a impulsi ritmici rossi a frequenza più elevata (periodo 1.8s, frequenza ~0.56 Hz) per segnalare chiaramente allo studente l'inferenza in corso e la possibilità di interromperla istantaneamente.
   - Entrambe le animazioni sono automaticamente inibite tramite `@media (prefers-reduced-motion: reduce)` in ossequio ai requisiti di accessibilità didattica.

6. **Ciclo di vita ed etichetta dinamica del pulsante di richiesta intervento nel pannello laterale**:
   Per prevenire confusione concettuale con il *contesto dell'attività* (riservato nel [GLOSSARY.md](../../GLOSSARY.md) alla configurazione predisposta dal docente) ed evitare la falsa percezione di un'operazione passiva di salvataggio (es. *"Aggiorna contesto"*), il pulsante della barra laterale mantiene il proprio ruolo attivo di richiesta inferenza al tutor maieutico adottando un'etichetta contestuale dinamica:
   - **A inizio sessione (turno zero o reset)**: etichetta *"Avvia intervento maieutico"* con tooltip *"Invia il tuo codice e il pre-impegno cognitivo al tutor maieutico"*.
   - **A sessione avviata (dopo almeno un intervento maieutico)**: etichetta *"Invia tentativo aggiornato"* con tooltip *"Invia il codice o il tentativo aggiornato al tutor maieutico"*.
   - **Durante l'elaborazione attiva**: commuta in *"Interrompi elaborazione"*.
   - Il **pre-impegno cognitivo** inserito nel pannello laterale resta persistente in memoria e valido per i turni successivi di invio codice, senza obbligare lo studente a riscriverlo da zero a ogni iterazione sintattica.
