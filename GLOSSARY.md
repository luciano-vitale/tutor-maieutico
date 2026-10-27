# Tutor Maieutico

Applicazione didattica locale (Zero-Data) di supporto socratico allo studio dell'informatica e della programmazione per i laboratori dell'I.I.S.S. "Marconi-Hack", conforme a AUP-IA, PUIA (casi d'uso `CU-09`, `CU-11`, `CU-12`, esclusione `CU-16..19`) e art. 25 L. 132/2025.

## Linguaggio Ubiquo (Pedagogia e Dominio Scolastico)

**Tutor Maieutico**:
L'agente conversazionale socratico che guida lo studente verso la comprensione autonoma di problemi algoritmici e di programmazione senza mai sostituirsi al suo percorso cognitivo.
_Avoid_: Coding assistant risolutivo, generatore di codice, correttore automatico, chatbot generico, valutatore

**Intervento Maieutico**:
La singola risposta prodotta dal Tutor Maieutico a fronte di un quesito o di un frammento di codice dello studente, strutturata per stimolare il ragionamento tramite domande guida, indizi graduali o analogie astratte.
_Avoid_: Soluzione, correzione, risposta pronta, completamento di codice

**Invariante di Non-Sostituzione**:
La regola fondamentale del dominio secondo cui il Tutor Maieutico non produce mai codice risolutivo applicato all'esercizio dello studente, ma al più micro-esempi sintattici astratti (massimo 3 righe su domini fittizi nei Livelli 2 e 3, zero codice sintattico nel Livello 1) accompagnati da domande socratiche.
_Avoid_: Filtro anti-copia, blocco risposta

**Guardrail Anti-Soluzione**:
Il controllo post-inferenza eseguito sul client che ispeziona la risposta del Motore di Inferenza e blocca o oscura qualsiasi blocco di codice che violi l'Invariante di Non-Sostituzione (qualsiasi codice sintattico in Livello 1; blocchi > 3 righe o funzioni/programmi completi in Livelli 2 e 3).
_Avoid_: Moderatore cloud, censura generica

**Pre-impegno Cognitivo**:
Il requisito pedagogico che richiede allo studente di esplicitare la propria ipotesi iniziale, il tentativo effettuato o il punto esatto di blocco prima di poter richiedere un Intervento Maieutico sul proprio codice o sulla traccia.
_Avoid_: Prompt libero, richiesta diretta di soluzione

**Progressione Maieutica**:
La sequenza strutturata in 4 stadi con cui il Tutor Maieutico risponde alle difficoltà persistenti dello studente senza mai cedere la soluzione: `Stadio 1` (Domanda Esplorativa), `Stadio 2` (Scomposizione e Trace a mano), `Stadio 3` (Analogia o Micro-sintassi astratta), `Stadio 4` (Sintesi del blocco concettuale ed Escalation al Docente in laboratorio).
_Avoid_: Loop di domande infinite, suggerimento progressivo fino alla soluzione completa

**Escalation al Docente**:
L'esito conclusivo dello `Stadio 4` della Progressione Maieutica in cui il Tutor Maieutico interrompe la generazione di ulteriori indizi automatici, sintetizza in due punti l'ostacolo concettuale residuo e invita esplicitamente lo studente ad alzare la mano per richiedere l'intervento umano del docente in laboratorio (*Human-in-the-Loop*).
_Avoid_: Cessione della soluzione per sfinimento, segnalazione disciplinare, alert automatico al registro del docente

**Pacchetto Attività**:
Il file di configurazione didattica (`.maieutica.json`) predisposto dal docente che definisce Contesto dell'Attività, Livello Didattico AUP, vincoli algoritmici ed eventuale blocco PIN di sessione.
_Avoid_: Compito automatico, test bloccato, configurazione server

**Modalità Rubber Duck**:
La modalità statica di auto-diagnosi guidata che funge da alternativa equivalente (PUIA §6.3) quando il Motore di Inferenza non è attivo o raggiungibile sulla postazione, accompagnando lo studente attraverso il Pre-impegno Cognitivo e una checklist maieutica strutturata senza l'uso del modello linguistico.
_Avoid_: Pagina di errore, blocco applicativo, modalità degradata inutilizzabile

**Scaffolding Cognitivo**:
L'insieme di adattamenti universali della comunicazione (complessità linguistica Biennio/Triennio, scomposizione in micro-passaggi, alta leggibilità) selezionabili nella sessione secondo i principi dell'Universal Design for Learning per supportare anche misure compensative PDP/PEI (`CU-12`) senza mai trattare dati sanitari o diagnosi.
_Avoid_: Modalità BES, profilo DSA, profilo disabilità, etichetta clinica

**Livello Didattico AUP**:
Il grado di supporto autorizzato dal docente per l'attività corrente secondo la scala AUP-IA §4.3: `Livello 1` (Supporto preliminare e chiarimenti concettuali), `Livello 2` (Revisione assistita di codice già scritto dallo studente) o `Livello 3` (Co-progettazione socratica e debugging guidato).
_Avoid_: Modalità libera, livello di difficoltà, grado di autonomia generico

**Contesto dell'Attività**:
La configurazione didattica definita dal docente per una lezione di laboratorio (linguaggio di programmazione target, traccia dell'esercizio, vincoli algoritmici, Livello Didattico AUP).
_Avoid_: Compito in classe, test di verifica, assignment valutativo

## Privacy, Governance e Ciclo di Vita della Sessione

**Sessione Maieutica**:
L'interazione dialogica temporanea tra lo studente e il Tutor Maieutico, mantenuta esclusivamente nella memoria volatile (RAM) della postazione client e distrutta alla chiusura o al reset.
_Avoid_: Account utente, storico conversazioni persistente, profilo di apprendimento

**Regime Zero-Data**:
La condizione operativa (PUIA §4) in cui l'applicazione opera senza database, senza autenticazione nominativa e senza trattamento o persistenza di dati personali o particolari, restando fuori dall'ambito applicativo del GDPR.
_Avoid_: Anonimizzazione post-hoc, pseudonimizzazione, profilazione anonima

**Guardrail Zero-Data**:
Il controllo preventivo eseguito localmente sul client prima dell'invio al Motore di Inferenza, che rileva e blocca pattern riconducibili a dati personali (es. nomi, email, codici fiscali), credenziali/chiavi API o riferimenti a diagnosi/PDP/PEI.
_Avoid_: Moderazione cloud, filtro server-side, DLP esterno

**Sanitizzazione Assistita**:
L'azione educativa locale proposta allo studente quando il Guardrail Zero-Data intercetta una violazione, che sostituisce automaticamente nel testo i pattern sensibili rilevati con il segnaposto `[DATO RIMOSSO]` e, in presenza di riferimenti a difficoltà di apprendimento (`CU-12`), orienta lo studente verso i controlli universali di Scaffolding Cognitivo senza trasmettere alcun dato particolare al Motore di Inferenza.
_Avoid_: Cancellazione silenziosa, invio offuscato a server esterni, blocco punitivo senza spiegazione

**Dichiarazione d'Uso IA**:
Il documento esportabile localmente a fine attività (conforme ad AUP-IA §4.4) che attesta i parametri tecnici della Sessione Maieutica (strumento, modello linguistico, Livello Didattico AUP, data) e allega il diario del dialogo per la consegna trasparente al docente.
_Avoid_: Report di valutazione, pagella, registro di monitoraggio, log di sorveglianza

## Architettura di Inferenza

**Motore di Inferenza**:
Il servizio compatibile con lo standard OpenAI API (es. LM Studio) che esegue il modello linguistico locale in modalità puramente stateless.
_Avoid_: Cloud AI provider, backend applicativo, server di profilazione

**Modalità Standalone Loopback**:
La configurazione predefinita in cui interfaccia utente e Motore di Inferenza risiedono sulla medesima postazione di laboratorio e comunicano esclusivamente sull'interfaccia di loopback (`127.0.0.1`).
_Avoid_: Modalità offline con sincronizzazione, client con cache su disco

**Modalità Endpoint LAN**:
La configurazione opzionale di laboratorio in cui le postazioni client inviano richieste di inferenza stateless a un Motore di Inferenza dedicato sulla rete locale d'Istituto, mantenendo comunque l'intera Sessione Maieutica esclusivamente nella RAM del singolo client e senza alcun log dei prompt sul nodo LAN.
_Avoid_: Architettura client-server con database centrale, piattaforma cloud d'istituto
