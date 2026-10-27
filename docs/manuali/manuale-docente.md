# Manuale per il Docente e l'Assistente Tecnico — Tutor Maieutico

**Guida all'installazione di laboratorio (Loopback & LAN), alla configurazione didattica e alla conduzione delle esercitazioni secondo AUP-IA, PUIA e art. 25 L. 132/2025.**  
*I.I.S.S. "Marconi-Hack" — Bari (Indirizzi ITT Informatica e Liceo Scientifico opzione Scienze Applicate)*

---

## Indice

- **Parte I — Installazione e Configurazione Tecnica di Laboratorio (Assistenti Tecnici e Docenti Referenti)**
  1. [Architettura Operativa e Regime Zero-Data](#1-architettura-operativa-e-regime-zero-data)
  2. [Scelta dei Modelli Linguistici e Profili Hardware delle Postazioni](#2-scelta-dei-modelli-linguistici-e-profili-hardware-delle-postazioni)
  3. [Procedura di Provisioning Offline (Air-Gapped) per i Laboratori](#3-procedura-di-provisioning-offline-air-gapped-per-i-laboratori)
  4. [Configurazione in Modalità Standalone Loopback (`127.0.0.1`)](#4-configurazione-in-modalità-standalone-loopback-127001)
  5. [Configurazione in Modalità Endpoint LAN (`RFC 1918`) e Checklist No-Log](#5-configurazione-in-modalità-endpoint-lan-rfc-1918-e-checklist-no-log)
  6. [Avvio del Bundle Statico Client-Side e Risoluzione Problemi CORS](#6-avvio-del-bundle-statico-client-side-e-risoluzione-problemi-cors)
- **Parte II — Conduzione Didattica per il Docente in Aula**
  7. [Inquadramento Normativo e Ruolo del Docente (AUP-IA, PUIA, L. 132/2025)](#7-inquadramento-normativo-e-ruolo-del-docente-aup-ia-puia-l-1322025)
  8. [Prima della Lezione: Contesto dell'Attività, Livelli Didattici AUP (1–3) e Pacchetto Attività (`.maieutica.json`)](#8-prima-della-lezione-contesto-dellattività-livelli-didattici-aup-13-e-pacchetto-attività-maieuticajson)
  9. [Durante la Lezione: Progressione Maieutica, Escalation al Docente, Inclusione UDL (`CU-12`) e Modalità Rubber Duck](#9-durante-la-lezione-progressione-maieutica-escalation-al-docente-inclusione-udl-cu-12-e-modalità-rubber-duck)
  10. [A Fine Lezione: Ritiro della Dichiarazione d'Uso IA, Verifica SHA-256 e Pulizia RAM](#10-a-fine-lezione-ritiro-della-dichiarazione-duso-ia-verifica-sha-256-e-pulizia-ram)

---

# Parte I — Installazione e Configurazione Tecnica di Laboratorio

## 1. Architettura Operativa e Regime Zero-Data

**Tutor Maieutico** è progettato per operare in totale isolamento dalla rete Internet esterna ([ADR-0001](../adr/0001-stateless-inference-loopback-and-lan.md), [ADR-0004](../adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)):

1. **Client 100% Statico e Volatile**: l'interfaccia web gira interamente nel browser della singola postazione di laboratorio. Tutti i dati della **Sessione Maieutica** (tentativi di codice, errori del compilatore, **Pre-impegno Cognitivo** e cronologia degli **Interventi Maieutici**) risiedono esclusivamente nella memoria volatile (**RAM**) della scheda del browser e non vengono mai scritti in `localStorage`, `sessionStorage`, `IndexedDB` o cookie (**Regime Zero-Data**, PUIA §4).
2. **Motore di Inferenza Stateless**: il client comunica via HTTP/SSE con **LM Studio** (o server compatibile OpenAI API) attraverso due sole topologie ammesse dal codice (`LmStudioHttpAdapter`):
   - **Modalità Standalone Loopback** (`http://127.0.0.1:1234/v1` o `http://localhost:1234/v1`): interfaccia web e **Motore di Inferenza** girano sulla medesima postazione fisica;
   - **Modalità Endpoint LAN** (`http://<IP-LAN>:1234/v1` esclusivamente su subnet private RFC 1918: `10.x.x.x`, `172.16.0.0–172.31.255.255`, `192.168.x.x`): le postazioni degli studenti inviano richieste di inferenza stateless a un server GPU dedicato nella rete locale del laboratorio, mantenendo comunque l'intera **Sessione Maieutica** nella RAM di ciascun client.
   - **Blocco strutturale anti-cloud**: qualsiasi URL che punti a indirizzi IP pubblici o domini Internet viene rifiutato con errore esplicito dal client prima ancora che parta la richiesta di rete.

---

## 2. Scelta dei Modelli Linguistici e Profili Hardware delle Postazioni

In base alla dotazione hardware del singolo laboratorio dell'Istituto, si raccomanda di adottare uno dei tre profili seguenti (formati **GGUF** con quantizzazione `Q4_K_M` o `Q5_K_M`):

| Profilo Laboratorio | Dotazione Hardware Postazione | Modalità Consigliata | Modelli GGUF Consigliati | Note Operative |
| :--- | :--- | :--- | :--- | :--- |
| **Profilo A — Postazione Base** | 8 GB RAM, CPU multi-core senza GPU dedicata (o iGPU integrata) | **Modalità Endpoint LAN** (consigliata) oppure **Modalità Standalone Loopback** con modello 1.5B–3B | `Qwen2.5-Coder-3B-Instruct-GGUF (Q4_K_M)` (~2.0 GB) oppure `Llama-3.2-3B-Instruct-GGUF (Q4_K_M)` | Se usato in Loopback su CPU, abilitare lo streaming SSE per una risposta immediata parola per parola. |
| **Profilo B — Postazione Intermedia / PC Docente** | 16 GB RAM (Apple Silicon M1/M2/M3 o PC con GPU dedic. $\ge 6\text{–}8$ GB VRAM) | **Modalità Standalone Loopback** (`http://127.0.0.1:1234/v1`) | `Qwen2.5-Coder-7B-Instruct-GGUF (Q4_K_M)` (~4.7 GB) | Punto di equilibrio ottimale tra accuratezza pedagogica in italiano e rapidità di generazione. |
| **Profilo C — Nodo GPU Server d'Aula** | Workstation/Server di laboratorio con 32–64 GB RAM e GPU $\ge 12\text{–}24$ GB VRAM | **Modalità Endpoint LAN** (`http://192.168.x.x:1234/v1`) condiviso per le postazioni dell'aula | `Qwen2.5-Coder-14B-Instruct-GGUF (Q4_K_M)` (~9.0 GB) o `Qwen2.5-Coder-32B-Instruct-GGUF` | Serve fino a 15–25 postazioni client contemporaneamente dato che i turni maieutici sono brevi e intervallati dal lavoro degli studenti nell'IDE. |

---

## 3. Procedura di Provisioning Offline (Air-Gapped) per i Laboratori

Per preparare un laboratorio scollegato da Internet:

### Passo 1 — Su una postazione tecnica connessa (una tantum)
1. Scaricare l'installer di **LM Studio** per il sistema operativo del laboratorio (Windows, macOS o Linux).
2. Scaricare il file `.gguf` del modello scelto (es. `qwen2.5-coder-7b-instruct-q4_k_m.gguf`).
3. Compilare il bundle statico di **Tutor Maieutico**:
   ```bash
   git clone <url-repo-istituto>/tutor-maieutico.git
   cd tutor-maieutico
   npm install
   npm run build
   ```
   Al termine, la cartella `dist/` (meno di 30 KB complessivi!) contiene l'intera applicazione pronta all'uso e priva di dipendenze esterne.
4. Copiare su una chiavetta USB di servizio o sulla cartella condivisa del server di laboratorio:
   - l'installer di LM Studio;
   - il file `.gguf` del modello;
   - la cartella compilata `dist/` (rinominata ad es. `tutor-maieutico-web/`).

### Passo 2 — Sulle postazioni del laboratorio (Offline)
1. Installare LM Studio (se si usa la **Modalità Standalone Loopback**) o installarlo solo sul nodo server d'aula (se si usa la **Modalità Endpoint LAN**).
2. Copiare il file `.gguf` nella cartella modelli locale di LM Studio (`~/.lmstudio/models/<publisher>/<model-name>/` su macOS/Linux oppure `C:\Users\<Utente>\.lmstudio\models\<publisher>\<model-name>\` su Windows).
3. Copiare la cartella `dist/` sulle postazioni (oppure esporla sul web server interno della LAN di laboratorio).

---

## 4. Configurazione in Modalità Standalone Loopback (`127.0.0.1`)

Quando ogni postazione esegue localmente sia il browser sia LM Studio:

1. Avviare **LM Studio** sulla postazione e aprire la scheda **Developer** (icona `<>` nella barra laterale sinistra).
2. In alto, selezionare e caricare in memoria il modello didattico (es. `qwen2.5-coder-7b-instruct`).
3. Nel pannello **Local Server** (a sinistra):
   - Verificare che la porta sia impostata a **`1234`** (default);
   - Attivare l'interruttore **Enable CORS** (indispensabile affinché il browser possa interrogare `http://127.0.0.1:1234/v1`);
   - Lasciare **disattivato** *Serve on Local Network* (così il server ascolta esclusivamente sull'interfaccia di loopback `127.0.0.1`).
4. Portare lo switch dello stato server su **Running (Start Server)**.
5. Aprendo **Tutor Maieutico** nel browser, il badge in alto mostrerà automaticamente:
   `Connesso • Modalità Standalone Loopback (http://127.0.0.1:1234/v1) • <nome-modello>`.

---

## 5. Configurazione in Modalità Endpoint LAN (`RFC 1918`) e Checklist No-Log

Quando le postazioni degli studenti hanno poca RAM e interrogano un unico server GPU nella LAN del laboratorio ([ADR-0001](../adr/0001-stateless-inference-loopback-and-lan.md)):

### Sul Server GPU di Laboratorio (es. IP statico `192.168.1.200`)
1. Avviare **LM Studio** → scheda **Developer**.
2. Caricare il modello scelto e aprire le impostazioni del **Local Server**:
   - Porta: **`1234`**;
   - **Serve on Local Network**: **ATTIVO (`ON`)** (consente le connessioni dalle postazioni della subnet LAN del laboratorio);
   - **Enable CORS**: **ATTIVO (`ON`)**.
3. **Checklist Obbligatoria di Conformità Zero-Data / No-Log (ADR-0001, PUIA §4)**:
   - [ ] Disattivare il logging verboso dei payload/prompt nelle impostazioni del server locale di LM Studio (*Verbose Logging* / *Log Requests* = `OFF`);
   - [ ] Verificare che il firewall del server di laboratorio accetti traffico sulla porta `1234/TCP` **esclusivamente** dalla VLAN/subnet del laboratorio (es. `192.168.1.0/24`) e non abbia inoltro (port-forwarding) verso l'esterno;
   - [ ] A fine giornata di laboratorio, chiudere l'istanza server o svuotare i log volatili della console Developer.

### Sulle Postazioni Client degli Studenti
1. Aprire **Tutor Maieutico** nel browser della postazione.
2. Nella barra in alto (**Endpoint Motore di Inferenza**), sostituire `http://127.0.0.1:1234/v1` con l'indirizzo LAN del server di laboratorio, ad esempio:
   ```text
   http://192.168.1.200:1234/v1
   ```
   e premere **Connetti Endpoint** (oppure caricare direttamente il **Pacchetto Attività** `.maieutica.json` predisposto dal docente con l'endpoint LAN già preconfigurato).
3. Il badge passerà a:
   `Connesso • Modalità Endpoint LAN (http://192.168.1.200:1234/v1) • <nome-modello>`.

---

## 6. Avvio del Bundle Statico Client-Side e Risoluzione Problemi CORS

I browser moderni applicano restrizioni di sicurezza (`Origin: null`) quando un file HTML viene aperto direttamente dal filesystem con protocollo `file://`. Per garantire il funzionamento fluido delle chiamate `fetch` e dello streaming SSE verso `127.0.0.1:1234` o `<IP-LAN>:1234`, si raccomanda una delle due modalità seguenti:

### Modalità 1 (Consigliata sulla singola postazione): Micro-server HTTP locale
Dentro la cartella che contiene il bundle compilato `dist/`, eseguire da terminale (o tramite collegamento sul Desktop preparato dall'Assistente Tecnico):

```bash
# Con Python 3 (preinstallato su macOS, Linux e nelle postazioni lab di informatica):
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```
oppure, se sulla macchina è presente Node.js:
```bash
npm run preview -- --host 127.0.0.1 --port 8080
```
Quindi aprire il browser su **`http://127.0.0.1:8080`**.

### Modalità 2 (Centralizzata per il laboratorio): Web Server Statico sulla LAN d'Aula
L'Assistente Tecnico può ospitare la cartella statica `dist/` su un web server interno della LAN del laboratorio (es. Nginx, Apache o `python3 -m http.server 8080 --directory dist` sulla macchina `192.168.1.200`). Gli studenti aprono `http://192.168.1.200:8080` nel proprio browser: l'applicazione viene scaricata nel browser della postazione e mantiene comunque l'intera **Sessione Maieutica** esclusivamente nella RAM locale del singolo studente.

### Risoluzione rapida dei problemi frequenti
- **Il badge resta su `Offline` anche se LM Studio è aperto**:
  1. Controllare che nella scheda **Developer** di LM Studio il server sia su **Running** sulla porta `1234`;
  2. Controllare che **Enable CORS** sia attivo in LM Studio;
  3. Controllare che almeno un modello sia effettivamente caricato nella barra superiore di LM Studio;
  4. Se si usa la **Modalità Endpoint LAN**, verificare che **Serve on Local Network** sia attivo sul server e che l'IP appartenga a una subnet privata RFC 1918 (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`).

---

# Parte II — Conduzione Didattica per il Docente in Aula

## 7. Inquadramento Normativo e Ruolo del Docente (AUP-IA, PUIA, L. 132/2025)

L'impiego di **Tutor Maieutico** in laboratorio attua le disposizioni regolamentari dell'Istituto:

1. **Primato dell'apprendimento e approccio maieutico (AUP-IA §1)**: lo strumento non fornisce mai codice risolutivo pronto all'uso (**Invariante di Non-Sostituzione**), ma stimola lo studente con domande socratiche a partire dal suo **Pre-impegno Cognitivo**.
2. **Prevalenza del lavoro intellettuale umano (art. 25 Legge 23 settembre 2025, n. 132)**: l'elaborato di programmazione resta integralmente opera intellettuale dello studente, che progetta, scrive, compila e verifica il codice nel proprio IDE di laboratorio.
3. **Sospensione prudenziale dei casi d'uso ad alto rischio (`CU-16..19`, PUIA §3.3 e art. 22 GDPR)**:
   - È tassativamente vietato utilizzare i dialoghi o la **Dichiarazione d'Uso IA** come strumento di attribuzione automatica di voti o giudizi sommativi (`CU-16`);
   - La **Dichiarazione d'Uso IA** (AUP-IA §4.4) serve ad attestare la **trasparenza metodologica** del percorso svolto dallo studente e il rispetto dei vincoli fissati dal docente.

---

## 8. Prima della Lezione: Contesto dell'Attività, Livelli Didattici AUP (1–3) e Pacchetto Attività (`.maieutica.json`)

Prima dell'inizio dell'esercitazione (o nei primi minuti in aula), il docente definisce il **Contesto dell'Attività**:

### 8.1 Scelta dell'Ambito Curricolare (6 Preset Nativi)
- `Pseudocodice / Algoritmica` (Biennio — diagrammi logici, cicli, condizioni, vettori base)
- `C / C++` (Biennio/Triennio — gestione cicli, array, puntatori, struct, funzioni)
- `Python` (Biennio/Triennio — strutture dati, funzioni, algoritmi, scripting)
- `Java` (Triennio — programmazione orientata agli oggetti, classi, ereditarietà, collezioni)
- `SQL / Database` (Triennio — modello relazionale, query `SELECT`, `JOIN`, aggregazioni, vincoli)
- `Web (HTML / CSS / JS / PHP)` (Triennio — struttura semantica, DOM, form, interazione client/server)

### 8.2 Scelta del Livello Didattico AUP (AUP-IA §4.3 e ADR-0003)

| Livello Didattico AUP | Quando utilizzarlo | Comportamento del Tutor Maieutico e del Guardrail Anti-Soluzione |
| :--- | :--- | :--- |
| **`Livello 1` — Supporto preliminare e chiarimenti concettuali** | Fase di analisi della traccia, studio teorico iniziale o progettazione dell'algoritmo prima della codifica. | Spiega i concetti teorici, pone domande di comprensione e usa solo pseudocodice discorsivo. Il **Guardrail Anti-Soluzione** blocca **qualsiasi** frammento di codice nella sintassi del linguaggio target. |
| **`Livello 2` — Revisione assistita di codice già scritto** | Lo studente ha già scritto una bozza di codice che non compila o presenta errori logici e deve individuarli autonomamente. | Guida lo studente a leggere l'errore del compilatore e a fare il trace delle variabili. Ammette al massimo micro-esempi sintattici astratti (**max 3 righe** su domini fittizi diversi dall'esercizio). Qualsiasi blocco $> 3$ righe o funzione completa viene oscurato dal **Guardrail Anti-Soluzione**. |
| **`Livello 3` — Co-progettazione socratica e debugging guidato** | Esercitazioni strutturate di laboratorio su problemi complessi (Triennio) in cui si ragiona su casi limite, complessità e refactoring. | Accompagna la scomposizione modulare e il debugging per ipotesi e verifica, mantenendo fermo il limite invalicabile di **massimo 3 righe di micro-sintassi astratta** e il divieto assoluto di scrivere la soluzione dell'esercizio. |

### 8.3 Esportazione del Pacchetto Attività (`.maieutica.json`) e Blocco PIN
Dal pannello di configurazione Docente:
1. Inserire il titolo e la **traccia dell'esercizio**;
2. Specificare eventuali **vincoli algoritmici** (es. *"Vietato usare funzioni di libreria per l'ordinamento; utilizzare solo cicli annidati"*);
3. Selezionare il **Livello Didattico AUP** (`1`, `2` o `3`) e l'eventuale URL in **Modalità Endpoint LAN**;
4. Impostare un **PIN temporaneo di lezione** (il PIN viene convertito in hash SHA-256 in memoria): finché il blocco PIN è attivo, gli studenti non possono innalzare il **Livello Didattico AUP** né rimuovere i vincoli (e qualsiasi sblocco o modifica viene comunque registrata nel log di audit della sessione);
5. Cliccare su **Esporta Pacchetto Attività (`.maieutica.json`)** e condividere il file con la classe (tramite cartella condivisa di laboratorio o Classroom).

---

## 9. Durante la Lezione: Progressione Maieutica, Escalation al Docente, Inclusione UDL (`CU-12`) e Modalità Rubber Duck

### 9.1 Supervisione della Progressione Maieutica e dell'Escalation al Docente (`Stadio 1..4`)
Quando uno studente incontra un ostacolo e non riesce a sbloccarsi al primo indizio, il **Tutor Maieutico** non cede mai la soluzione ma avanza lungo i 4 stadi della **Progressione Maieutica** ([ADR-0003](../adr/0003-dual-barrier-non-substitution-guardrail.md)):
- **`Stadio 1` (Domanda Esplorativa)**: invita lo studente a osservare la riga sospetta o il rapporto tra input e output atteso;
- **`Stadio 2` (Scomposizione e Trace a mano)**: chiede allo studente di simulare a mano su carta o nel box di risposta il valore delle variabili passo dopo passo (*trace table*);
- **`Stadio 3` (Analogia o Micro-sintassi astratta)**: propone un'analogia logica o un micro-esempio sintattico astratto ($\le 3$ righe su un problema diverso);
- **`Stadio 4` (Escalation al Docente)**: se lo studente è ancora bloccato dopo il 3° stadio, il sistema **interrompe gli indizi automatici**, produce una **sintesi strutturata in 2 punti** dell'ostacolo concettuale e mostra un avviso che invita lo studente ad **alzare la mano e chiamare il docente**.
  > **Vantaggio per il docente**: quando ti avvicini alla postazione di uno studente in `Stadio 4`, trovi già sullo schermo i 2 punti chiave che riassumono cosa lo studente ha tentato e quale concetto specifico non è chiaro, riducendo drasticamente i tempi di intervento in un laboratorio affollato.

### 9.2 Inclusione e Misure Compensative PDP/PEI tramite Scaffolding Cognitivo UDL (`CU-12`)
In conformità ad [ADR-0002](../adr/0002-udl-scaffolding-without-health-profiling.md) e al **Regime Zero-Data** (PUIA §4):
- **Regola aurea per il docente**: non chiedere mai agli studenti di dichiarare nello strumento di avere un PDP, un PEI, DSA o BES, e ricordare alla classe che il **Guardrail Zero-Data** blocca qualsiasi termine clinico/diagnostico nei prompt (`CU-12`: *"no diagnosi in prompt"*).
- Invitare invece **tutta la classe** a utilizzare liberamente i controlli universali di **Scaffolding Cognitivo** presenti nell'interfaccia secondo le proprie preferenze di studio:
  - Profilo lessicale **Biennio** (linguaggio essenziale e concreto) vs **Triennio** (lessico tecnico formale);
  - **Risposte brevi ad alta leggibilità**;
  - **Scomposizione in micro-passaggi numerati**;
  - **Schemi logici testuali**;
  - **Tema ad alto contrasto, font ad alta leggibilità e spaziatura aumentata**.
- In questo modo gli studenti con PDP/PEI fruiscono pienamente delle misure compensative (`CU-12`) senza alcuna profilazione sanitaria ex art. 9 GDPR e senza alcuno stigma visivo sullo schermo in aula.

### 9.3 Continuità Didattica con la Modalità Rubber Duck (PUIA §6.3)
Se su una o più postazioni il **Motore di Inferenza** non è raggiungibile, gli studenti non perdono l'ora di laboratorio: l'applicazione attiva la **Modalità Rubber Duck** ([ADR-0004](../adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)), guidando lo studente attraverso il **Pre-impegno Cognitivo** e una checklist socratica interattiva suddivisa per categoria di errore (*Comprensione della traccia*, *Errore di compilazione/sintassi*, *Errore logico/output errato*, *Ciclo infinito*). Tutte le riflessioni inserite confluiscono regolarmente nella **Dichiarazione d'Uso IA** di fine lezione.

---

## 10. A Fine Lezione: Ritiro della Dichiarazione d'Uso IA, Verifica SHA-256 e Pulizia RAM

Negli ultimi 5 minuti dell'esercitazione:

1. **Esportazione o Stampa della Dichiarazione d'Uso IA (AUP-IA §4.4)**:
   - Ogni studente apre il pannello di fine attività, scarica il file Markdown (`.md`) o stampa in PDF (`Stampa / Salva PDF`) la propria **Dichiarazione d'Uso IA** e compila manualmente i campi anagrafici lasciati in bianco (*Nome, Cognome, Classe, Firma*) solo sul documento finale da consegnare al docente (in quanto l'applicazione non raccoglie mai i dati anagrafici dello studente).
2. **Cosa verificare come Docente sulla Dichiarazione d'Uso IA**:
   - **Parametri tecnici**: data/ora, modalità di connessione, ID del modello linguistico utilizzato, **Livello Didattico AUP** impostato;
   - **Registro di Audit della Configurazione**: verifica immediata che il **Livello Didattico AUP** o i vincoli non siano stati sbloccati o alterati durante l'esercitazione;
   - **Contatori di Sessione**: numero di **Interventi Maieutici**, stadio massimo raggiunto nella **Progressione Maieutica** ed eventuali attivazioni del **Guardrail Zero-Data** o del **Guardrail Anti-Soluzione**;
   - **Qualità del Pre-impegno Cognitivo e del Dialogo**: evidenza immediata del ragionamento autonomo dello studente;
   - **Codice di Verifica d'Integrità SHA-256**: garantisce che il contenuto tecnico della trascrizione non sia stato alterato manualmente prima della consegna.
3. **Azzeramento della Postazione per la Classe Successiva**:
   - Prima di alzarsi dalla postazione, ogni studente clicca sul pulsante rosso **"Nuova Sessione (Azzera RAM)"** (o chiude il browser), distruggendo istantaneamente ogni traccia della sessione dalla memoria volatile del PC.
