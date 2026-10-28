# Manuale operativo per lo studente — StudIA Tutor Maieutico

**Guida pratica all'utilizzo socratico in laboratorio e a casa secondo l'AUP-IA e il regime zero-data.**  
*I.I.S.S. "Marconi-Hack" — Bari (indirizzi ITT Informatica e Liceo Scientifico opzione Scienze Applicate)*

---

## Indice

1. [Cosa fa (e cosa non fa) il tutor maieutico: il patto educativo](#1-cosa-fa-e-cosa-non-fa-il-tutor-maieutico-il-patto-educativo)
2. [Come è fatta la schermata: i due pannelli di lavoro](#2-come-è-fatta-la-schermata-i-due-pannelli-di-lavoro)
3. [Il pre-impegno cognitivo: come sbloccare l'intervento maieutico (con esempi pratici)](#3-il-pre-impegno-cognitivo-come-sbloccare-lintervento-maieutico-con-esempi-pratici)
4. [Come dialogare con il tutor: i 4 stadi della progressione maieutica e l'escalation al docente](#4-come-dialogare-con-il-tutor-i-4-stadi-della-progressione-maieutica-e-lescalation-al-docente)
5. [Igiene digitale: il guardrail zero-data e la sanitizzazione assistita](#5-igiene-digitale-il-guardrail-zero-data-e-la-sanitizzazione-assistita)
6. [Personalizzare lo studio: lo scaffolding cognitivo (biennio/triennio e alta leggibilità)](#6-personalizzare-lo-studio-lo-scaffolding-cognitivo-bienniotriennio-e-alta-leggibilità)
7. [E se l'IA è spenta? Usare la modalità Rubber Duck](#7-e-se-lia-è-spenta-usare-la-modalità-rubber-duck)
8. [Fine dell'esercitazione: dichiarazione d'uso IA e "Nuova sessione"](#8-fine-dellesercitazione-dichiarazione-duso-ia-e-nuova-sessione)
9. [Appendice — Come installare e usare StudIA Tutor Maieutico gratuitamente sul tuo PC di casa](#9-appendice--come-installare-e-usare-studia-tutor-maieutico-gratuitamente-sul-tuo-pc-di-casa)

---

## 1. Cosa fa (e cosa non fa) il tutor maieutico: il patto educativo

Quando apri **StudIA Tutor Maieutico** nel browser del laboratorio, in alto vedrai sempre la barra di **disclosure AUP-IA** (`CU-05`, `CU-11`, `CU-15`). Prima di iniziare, ricorda quattro regole fondamentali:

1. **Non ti scrive mai la soluzione pronta (invariante di non-sostituzione, AUP-IA §1 e art. 25 L. 132/2025)**:
   Se chiedi *"Scrivimi il programma in C++ che ordina il vettore"*, il **tutor maieutico** non ti darà il codice da copiare (e se il modello linguistico provasse a generare più di 3 righe di codice o una funzione intera, il **guardrail anti-soluzione** lo oscurerà automaticamente). Il suo compito è farti **domande guida** per farti scoprire da solo dove si trova l'errore o come costruire l'algoritmo.
2. **Non ti dà voti e non ti giudica (`CU-16..19` esclusi)**:
   L'applicazione **non assegna mai voti**, non calcola punteggi, non valuta le tue capacità e non invia segnalazioni automatiche al registro elettronico. Sbagliare un ragionamento o fare domande qui è parte normale dell'apprendimento!
3. **La tua sessione vive solo nella RAM (regime zero-data, PUIA §4)**:
   Tutto ciò che scrivi resta solo nella memoria temporanea (RAM) del computer su cui stai lavorando e scompare appena clicchi sul pulsante icona **"Nuova sessione"** o chiudi la scheda del browser.
4. **L'IA può commettere errori**:
   Anche il miglior modello linguistico locale può sbagliare: verifica sempre ogni tua ipotesi compilando ed eseguendo il codice nel tuo IDE di laboratorio (Dev-C++, VS Code, Thonny, Eclipse, DBMS, ecc.) e confrontati con il docente.

---

## 2. Come è fatta la schermata: i due pannelli di lavoro

Lo spazio di lavoro è ispirato agli ambienti di sviluppo e alle moderne interfacce di intelligenza artificiale (come LM Studio e Google Gemini) ed è diviso in due colonne affiancate:

- **Pannello 1 (a sinistra) — Contesto e tentativo dello studente**:
  - **Contesto dell'attività**: mostra il linguaggio scelto (`Pseudocodice`, `C/C++`, `Python`, `Java`, `SQL`, `Web`), la traccia dell'esercizio, i vincoli fissati dal docente e il **livello didattico AUP** attivo (`Livello 1`, `2` o `3`);
  - **Pre-impegno cognitivo** *(obbligatorio)*: dove spieghi con parole tue cosa hai provato a fare, qual è la tua ipotesi e dove ti sei bloccato (collocato in prima posizione secondo il principio *thinking-first* per invitarti a riflettere prima ancora di incollare codice);
  - **Tentativo di codice o pseudocodice**: l'editor in stile IDE dove incolli l'eventuale bozza di programma o query che hai provato a scrivere;
  - **Messaggio di errore del compilatore o interprete**: dove incolli l'eventuale errore restituito dal tuo IDE (opzionale ma utilissimo se il codice non compila);
  - Pulsante **"Avvia intervento maieutico"**: invia il contesto al tutor; durante l'elaborazione del prompt si trasforma in **"Interrompi elaborazione"** per consentirti di bloccare la generazione in qualunque momento.
- **Pannello 2 (a destra) — Dialogo maieutico**:
  - Mostra la conversazione con il **tutor maieutico** (perfettamente centrata su qualsiasi risoluzione, anche chiudendo i pannelli laterali);
  - Quando invii un messaggio, vedrai comparire **subito** la tua bolla nella chat e un'**animazione grafica luminosa** che ti indica che il tutor sta elaborando la risposta socratica;
  - In basso trovi la barra di inserimento con il **pulsante circolare di invio** (puoi anche premere direttamente **`Invio`** sulla tastiera per spedire il messaggio, o `Shift + Invio` per andare a capo). Durante l'elaborazione del prompt, il pulsante assume l'icona di **stop** (quadratino pieno) per consentirti di arrestare subito la generazione in corso con lo stesso pulsante, preservando il testo maieutico ricevuto fino a quel momento.

---

## 3. Il pre-impegno cognitivo: come sbloccare l'intervento maieutico (con esempi pratici)

Il pulsante di avvio blocca la richiesta se il campo **pre-impegno cognitivo** è vuoto o contiene solo poche parole generiche.  
**Perché?** Perché in programmazione il vero apprendimento inizia nel momento in cui provi a formulare un'ipotesi sul problema prima di chiedere aiuto.

Ecco la differenza tra un **pre-impegno cognitivo** che viene rifiutato e uno efficace che aiuta davvero il **tutor maieutico** a guidarti:

| ❌ Pre-impegno non valido (bloccato) | ✅ Pre-impegno efficace (consigliato) |
| :--- | :--- |
| *"Non so come si fa."* | *"Devo trovare il valore massimo in un array di 10 interi. Ho pensato di usare un ciclo `for`, ma non so con quale valore iniziale inizializzare la variabile `max` se nell'array ci sono anche numeri negativi."* |
| *"Non funziona / mi dà errore."* | *"Ho scritto un ciclo `for (int i = 0; i <= 10; i++)` su un array dichiarato `int v[10]`. Il programma compila ma va in crash all'ultimo giro: penso dipenda dall'indice `i <= 10`."* |
| *"Correggimi la query SQL."* | *"Voglio contare quanti studenti ci sono per ogni classe usando `GROUP BY classe`, ma quando aggiungo la condizione sul numero minimo di studenti con `WHERE COUNT(*) > 20` il database mi restituisce errore di sintassi."* |

> **Suggerimento pratico**: ogni volta che modifichi il tuo codice nell'IDE dopo aver ragionato con il tutor, puoi aggiornare il codice e il **pre-impegno cognitivo** nel pannello di sinistra e cliccare di nuovo sul pulsante di analisi per sottoporre il tuo nuovo tentativo!

---

## 4. Come dialogare con il tutor: i 4 stadi della progressione maieutica e l'escalation al docente

Quando chiedi aiuto su un blocco, il **tutor maieutico** ti accompagna passo dopo passo attraverso 4 stadi:

1. **`Stadio 1` — Domanda esplorativa**: il tutor ti fa notare una riga specifica del tuo codice o ti chiede cosa dovrebbe accadere con un determinato valore di input. Rispondi alla sua domanda nella chat a destra!
2. **`Stadio 2` — Scomposizione e trace a mano**: se il dubbio rimane, il tutor ti guida a simulare a mano (*trace table*) cosa contengono le tue variabili al primo giro, al secondo giro e all'ultimo giro del ciclo.
3. **`Stadio 3` — Analogia o micro-sintassi astratta**: se ti serve ricordare la sintassi di un costrutto (nei **livelli didattici AUP 2 e 3**), il tutor ti mostra una breve analogia o un micro-esempio astratto di **massimo 3 righe** su un caso fittizio diverso dal tuo esercizio.
4. **`Stadio 4` — Sintesi ed escalation al docente**: se anche dopo il 3° stadio (o cliccando su *"Sono ancora bloccato"*) non riesci a procedere, il tutor **si ferma**, prepara sullo schermo una **sintesi chiara in 2 punti** del tuo ostacolo concettuale e ti invita ad **alzare la mano e chiamare il docente in laboratorio**. Quando il docente arriverà alla tua postazione, leggerà i 2 punti e potrà spiegarti dal vivo esattamente ciò che ti mancava!

---

## 5. Igiene digitale: il guardrail zero-data e la sanitizzazione assistita

Per proteggere la tua privacy (**regime zero-data**, AUP-IA §4.1 e §6.1), prima che qualsiasi messaggio parta verso il **motore di inferenza**, il **guardrail zero-data** controlla il tuo codice e il tuo testo.

L'invio viene bloccato con un avviso educativo se hai inserito per sbaglio:
- **Dati personali o nomi nei commenti del codice**: es. `// Autore: Mario Rossi, Classe 3A`, indirizzi email, codici fiscali, numeri di telefono;
- **Password o chiavi segrete**: es. token, `api_key`, password;
- **Informazioni sanitarie o piani didattici personalizzati (`CU-12`)**: termini come `DSA`, `BES`, `PDP`, `PEI`, `dislessia`, `discalculia`, `legge 104`.

### Cosa fare se scatta il guardrail zero-data?
Niente panico! Ti basta cliccare sul pulsante **"Sanitizzazione assistita"**: l'applicazione sostituirà automaticamente i dati personali o sensibili con `[DATO RIMOSSO]` e, se avevi menzionato difficoltà di lettura o di studio, ti aprirà i controlli di **scaffolding cognitivo** per adattare lo stile delle risposte in totale sicurezza e anonimato.

---

## 6. Personalizzare lo studio: lo scaffolding cognitivo (biennio/triennio e alta leggibilità)

Ogni studente impara meglio quando le spiegazioni sono adatte al proprio ritmo. Attraverso i controlli universali di **scaffolding cognitivo** (accessibili a chiunque nella barra superiore, senza alcuna etichetta clinica secondo [ADR-0002](../adr/0002-udl-scaffolding-without-health-profiling.md)), puoi attivare in qualsiasi momento:

- **Profilo biennio (classi I–II)** oppure **profilo triennio (classi III–V)**: adatta il vocabolario tecnico al tuo anno di corso;
- **Risposte brevi ad alta leggibilità**: frasi corte, dirette e prive di periodi complessi;
- **Scomposizione in micro-passaggi numerati**: spezza ogni ragionamento in piccoli passi uno alla volta;
- **Schemi logici testuali**: usa elenchi visivi e frecce (`Input -> Elaborazione -> Output`) per chiarire il flusso;
- **Font ad alta leggibilità, spaziatura aumentata e alto contrasto**: migliora il comfort visivo sullo schermo.

---

## 7. E se l'IA è spenta? Usare la modalità Rubber Duck

Se sulla tua postazione il badge in alto indica **`Offline`** (ad esempio perché LM Studio non è avviato sul computer), non sei affatto bloccato!

Nella tecnica storica dell'ingegneria del software chiamata *Rubber Duck Debugging* ("debugging della paperella di gomma"), spiegare ad alta voce o per iscritto il proprio codice seguendo domande mirate permette spessissimo di trovare il bug da soli.

Con la **modalità Rubber Duck** (PUIA §6.3, [ADR-0004](../adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)):
1. Compili normalmente il tuo codice, l'errore e il **pre-impegno cognitivo**;
2. Scegli il tipo di blocco (*Non mi è chiara la traccia*, *Errore di compilazione/sintassi*, *Il programma dà un risultato sbagliato*, *Il ciclo non termina mai*);
3. Rispondi passo-passo alle domande guida della checklist maieutica interattiva;
4. A fine ora puoi esportare e stampare regolarmente la tua scheda di lavoro nella **dichiarazione d'uso IA**.

---

## 8. Fine dell'esercitazione: dichiarazione d'uso IA e "Nuova sessione"

Quando il docente annuncia la conclusione del laboratorio:

1. **Esporta o stampa la dichiarazione d'uso IA (AUP-IA §4.4)**:
   - Clicca sul comando di esportazione per scaricare il file `.md` (oppure clicca su **Stampa / Salva PDF**);
   - Il documento contiene già la data, il modello usato, il **livello didattico AUP**, i tuoi tentativi con il **pre-impegno cognitivo**, il diario del dialogo maieutico e il codice crittografico di integrità **SHA-256**;
   - Compila **a mano** (su carta o nel file scaricato prima di consegnarlo al docente) il tuo *Nome, Cognome e Classe* negli appositi spazi in bianco.
2. **Azzera la RAM prima di lasciare la postazione**:
   - Clicca sul pulsante icona in alto a destra **"Nuova sessione"** (passando il mouse vedrai il tooltip *"Nuova sessione: azzera i dati in RAM"*);
   - Tutti i tuoi codici e i tuoi messaggi vengono cancellati all'istante dalla memoria volatile del computer, lasciando la postazione pulita per gli studenti dell'ora successiva.

---

## 9. Appendice — Come installare e usare StudIA Tutor Maieutico gratuitamente sul tuo PC di casa

Vuoi allenarti a casa con lo stesso metodo maieutico usato in laboratorio, gratis, senza abbonamenti cloud e anche senza connessione a Internet? Puoi farlo in **modalità Standalone Loopback** sul tuo computer (Windows, macOS o Linux):

### Passo 1 — Installa e avvia LM Studio
1. Scarica e installa gratuitamente **LM Studio** dal sito ufficiale (`https://lmstudio.ai`).
2. Apri LM Studio, vai nella sezione di ricerca modelli (icona della lente d'ingrandimento) e scarica uno di questi modelli gratuiti per la programmazione:
   - Se il tuo PC ha **16 GB di RAM** (o scheda video dedicata): cerca e scarica **`Qwen2.5-Coder-7B-Instruct-GGUF`** (versione `Q4_K_M`, ~4.7 GB);
   - Se il tuo PC ha **8 GB di RAM**: cerca e scarica **`Qwen2.5-Coder-3B-Instruct-GGUF`** (versione `Q4_K_M`, ~2.0 GB).
3. Clicca sull'icona **`<>` (Developer)** nella barra a sinistra di LM Studio:
   - Seleziona in alto il modello appena scaricato per caricarlo in memoria;
   - Nel pannello a sinistra (**Local Server**), verifica che la porta sia `1234` e **attiva la spunta `Enable CORS`**;
   - Clicca su **Start Server (Running)**.

### Passo 2 — Avvia StudIA Tutor Maieutico
1. Scarica o clona la cartella del progetto **StudIA Tutor Maieutico** (o la cartella compilata `dist/` fornita dal docente).
2. Se hai la cartella `dist/` pronta e Python installato sul PC, apri il Terminale (o Prompt dei comandi) dentro la cartella ed esegui:
   ```bash
   python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
   ```
   *(In alternativa, se hai installato Node.js, esegui `npm install` e poi `npm run dev` nella cartella del progetto).*
3. Apri il browser all'indirizzo **`http://127.0.0.1:8080`** (o `http://127.0.0.1:5173` se usi `npm run dev`): il pallino LED in alto diventerà subito **verde** (`Standalone Loopback • 127.0.0.1`) e potrai esercitarti in totale autonomia!
