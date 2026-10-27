# Tutor Maieutico

Applicazione didattica locale (regime zero-data) di supporto socratico allo studio dell'informatica e della programmazione per i laboratori dell'I.I.S.S. "Marconi-Hack", conforme a AUP-IA, PUIA (casi d'uso `CU-09`, `CU-11`, `CU-12`, esclusione `CU-16..19`) e art. 25 L. 132/2025.

## Linguaggio ubiquo (pedagogia e dominio scolastico)

**Tutor maieutico**:
L'agente conversazionale socratico che guida lo studente verso la comprensione autonoma di problemi algoritmici e di programmazione senza mai sostituirsi al suo percorso cognitivo.
_Avoid_: Coding assistant risolutivo, generatore di codice, correttore automatico, chatbot generico, valutatore

**Intervento maieutico**:
La singola risposta prodotta dal tutor maieutico a fronte di un quesito o di un frammento di codice dello studente, strutturata per stimolare il ragionamento tramite domande guida, indizi graduali o analogie astratte.
_Avoid_: Soluzione, correzione, risposta pronta, completamento di codice

**Invariante di non-sostituzione**:
La regola fondamentale del dominio secondo cui il tutor maieutico non produce mai codice risolutivo applicato all'esercizio dello studente, ma al più micro-esempi sintattici astratti (massimo 3 righe su domini fittizi nei livelli 2 e 3, zero codice sintattico nel livello 1) accompagnati da domande socratiche.
_Avoid_: Filtro anti-copia, blocco risposta

**Guardrail anti-soluzione**:
Il controllo post-inferenza eseguito sul client che ispeziona la risposta del motore di inferenza e blocca o oscura qualsiasi blocco di codice che violi l'invariante di non-sostituzione (qualsiasi codice sintattico in livello 1; blocchi > 3 righe o funzioni/programmi completi in livelli 2 e 3).
_Avoid_: Moderatore cloud, censura generica

**Pre-impegno cognitivo**:
Il requisito pedagogico che richiede allo studente di esplicitare la propria ipotesi iniziale, il tentativo effettuato o il punto esatto di blocco prima di poter richiedere un intervento maieutico sul proprio codice o sulla traccia.
_Avoid_: Prompt libero, richiesta diretta di soluzione

**Progressione maieutica**:
La sequenza strutturata in 4 stadi con cui il tutor maieutico risponde alle difficoltà persistenti dello studente senza mai cedere la soluzione: `Stadio 1` (domanda esplorativa), `Stadio 2` (scomposizione e trace a mano), `Stadio 3` (analogia o micro-sintassi astratta), `Stadio 4` (sintesi del blocco concettuale ed escalation al docente in laboratorio).
_Avoid_: Loop di domande infinite, suggerimento progressivo fino alla soluzione completa

**Escalation al docente**:
L'esito conclusivo dello `Stadio 4` della progressione maieutica in cui il tutor maieutico interrompe la generazione di ulteriori indizi automatici, sintetizza in due punti l'ostacolo concettuale residuo e invita esplicitamente lo studente ad alzare la mano per richiedere l'intervento umano del docente in laboratorio (*Human-in-the-Loop*).
_Avoid_: Cessione della soluzione per sfinimento, segnalazione disciplinare, alert automatico al registro del docente

**Pacchetto attività**:
Il file di configurazione didattica (`.maieutica.json`) predisposto dal docente che definisce contesto dell'attività, livello didattico AUP, vincoli algoritmici ed eventuale blocco PIN di sessione.
_Avoid_: Compito automatico, test bloccato, configurazione server

**Modalità Rubber Duck**:
La modalità statica di auto-diagnosi guidata che funge da alternativa equivalente (PUIA §6.3) quando il motore di inferenza non è attivo o raggiungibile sulla postazione, accompagnando lo studente attraverso il pre-impegno cognitivo e una checklist maieutica strutturata senza l'uso del modello linguistico.
_Avoid_: Pagina di errore, blocco applicativo, modalità degradata inutilizzabile

**Scaffolding cognitivo**:
L'insieme di adattamenti universali della comunicazione (complessità linguistica biennio/triennio, scomposizione in micro-passaggi, alta leggibilità) selezionabili nella sessione secondo i principi dell'*Universal Design for Learning* (`UDL`) per supportare anche misure compensative PDP/PEI (`CU-12`) senza mai trattare dati sanitari o diagnosi.
_Avoid_: Modalità BES, profilo DSA, profilo disabilità, etichetta clinica

**Livello didattico AUP**:
Il grado di supporto autorizzato dal docente per l'attività corrente secondo la scala AUP-IA §4.3: `Livello 1` (supporto preliminare e chiarimenti concettuali), `Livello 2` (revisione assistita di codice già scritto dallo studente) o `Livello 3` (co-progettazione socratica e debugging guidato).
_Avoid_: Modalità libera, livello di difficoltà, grado di autonomia generico

**Contesto dell'attività**:
La configurazione didattica definita dal docente per una lezione di laboratorio (linguaggio di programmazione target, traccia dell'esercizio, vincoli algoritmici, livello didattico AUP).
_Avoid_: Compito in classe, test di verifica, assignment valutativo

## Privacy, governance e ciclo di vita della sessione

**Sessione maieutica**:
L'interazione dialogica temporanea tra lo studente e il tutor maieutico, mantenuta esclusivamente nella memoria volatile (RAM) della postazione client e distrutta alla chiusura o al reset.
_Avoid_: Account utente, storico conversazioni persistente, profilo di apprendimento

**Regime zero-data**:
La condizione operativa (PUIA §4) in cui l'applicazione opera senza database, senza autenticazione nominativa e senza trattamento o persistenza di dati personali o particolari, restando fuori dall'ambito applicativo del GDPR.
_Avoid_: Anonimizzazione post-hoc, pseudonimizzazione, profilazione anonima

**Guardrail zero-data**:
Il controllo preventivo eseguito localmente sul client prima dell'invio al motore di inferenza, che rileva e blocca pattern riconducibili a dati personali (es. nomi, email, codici fiscali), credenziali/chiavi API o riferimenti a diagnosi/PDP/PEI.
_Avoid_: Moderazione cloud, filtro server-side, DLP esterno

**Sanitizzazione assistita**:
L'azione educativa locale proposta allo studente quando il guardrail zero-data intercetta una violazione, che sostituisce automaticamente nel testo i pattern sensibili rilevati con il segnaposto `[DATO RIMOSSO]` e, in presenza di riferimenti a difficoltà di apprendimento (`CU-12`), orienta lo studente verso i controlli universali di scaffolding cognitivo senza trasmettere alcun dato particolare al motore di inferenza.
_Avoid_: Cancellazione silenziosa, invio offuscato a server esterni, blocco punitivo senza spiegazione

**Dichiarazione d'uso IA**:
Il documento esportabile localmente a fine attività (conforme ad AUP-IA §4.4) che attesta i parametri tecnici della sessione maieutica (strumento, modello linguistico, livello didattico AUP, data) e allega il diario del dialogo per la consegna trasparente al docente.
_Avoid_: Report di valutazione, pagella, registro di monitoraggio, log di sorveglianza

## Architettura di inferenza

**Motore di inferenza**:
Il servizio compatibile con lo standard OpenAI API (es. LM Studio) che esegue il modello linguistico locale in modalità puramente stateless.
_Avoid_: Cloud AI provider, backend applicativo, server di profilazione

**Modalità Standalone Loopback**:
La configurazione predefinita in cui interfaccia utente e motore di inferenza risiedono sulla medesima postazione di laboratorio e comunicano esclusivamente sull'interfaccia di loopback (`127.0.0.1`).
_Avoid_: Modalità offline con sincronizzazione, client con cache su disco

**Modalità endpoint LAN**:
La configurazione opzionale di laboratorio in cui le postazioni client inviano richieste di inferenza stateless a un motore di inferenza dedicato sulla rete locale d'Istituto, mantenendo comunque l'intera sessione maieutica esclusivamente nella RAM del singolo client e senza alcun log dei prompt sul nodo LAN.
_Avoid_: Architettura client-server con database centrale, piattaforma cloud d'istituto
