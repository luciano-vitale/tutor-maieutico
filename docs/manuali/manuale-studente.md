# Manuale Operativo per lo Studente — Tutor Maieutico

**Guida pratica all'utilizzo socratico in laboratorio e a casa secondo l'AUP-IA e il Regime Zero-Data.**  
*I.I.S.S. "Marconi-Hack" — Bari (Indirizzi ITT Informatica e Liceo Scientifico opzione Scienze Applicate)*

---

## Indice

1. [Cosa fa (e cosa NON fa) il Tutor Maieutico: Il Patto Educativo](#1-cosa-fa-e-cosa-non-fa-il-tutor-maieutico-il-patto-educativo)
2. [Come è fatta la schermata: I Due Pannelli di Lavoro](#2-come-è-fatta-la-schermata-i-due-pannelli-di-lavoro)
3. [Il Pre-impegno Cognitivo: Come sbloccare l'Intervento Maieutico (con esempi pratici)](#3-il-pre-impegno-cognitivo-come-sbloccare-lintervento-maieutico-con-esempi-pratici)
4. [Come dialogare con il Tutor: I 4 Stadi della Progressione Maieutica e l'Escalation al Docente](#4-come-dialogare-con-il-tutor-i-4-stadi-della-progressione-maieutica-e-lescalation-al-docente)
5. [Igiene Digitale: Il Guardrail Zero-Data e la Sanitizzazione Assistita](#5-igiene-digitale-il-guardrail-zero-data-e-la-sanitizzazione-assistita)
6. [Personalizzare lo studio: Lo Scaffolding Cognitivo (Biennio/Triennio e Alta Leggibilità)](#6-personalizzare-lo-studio-lo-scaffolding-cognitivo-bienniotriennio-e-alta-leggibilità)
7. [E se l'IA è spenta? Usare la Modalità Rubber Duck](#7-e-se-lia-è-spenta-usare-la-modalità-rubber-duck)
8. [Fine dell'esercitazione: Dichiarazione d'Uso IA e "Nuova Sessione (Azzera RAM)"](#8-fine-dellesercitazione-dichiarazione-duso-ia-e-nuova-sessione-azzera-ram)
9. [Appendice — Come installare e usare Tutor Maieutico gratuitamente sul tuo PC di casa](#9-appendice--come-installare-e-usare-tutor-maieutico-gratuitamente-sul-tuo-pc-di-casa)

---

## 1. Cosa fa (e cosa NON fa) il Tutor Maieutico: Il Patto Educativo

Quando apri **Tutor Maieutico** nel browser del laboratorio, in alto vedrai sempre il **Banner permanente di Disclosure AUP-IA** (`CU-05`, `CU-11`, `CU-15`). Prima di iniziare, ricorda quattro regole fondamentali:

1. **Non ti scrive mai la soluzione pronta (**Invariante di Non-Sostituzione**, AUP-IA §1 e art. 25 L. 132/2025)**:
   Se chiedi *"Scrivimi il programma in C++ che ordina il vettore"*, il **Tutor Maieutico** non ti darà il codice da copiare (e se il modello linguistico provasse a generare più di 3 righe di codice o una funzione intera, il **Guardrail Anti-Soluzione** lo oscurerà automaticamente). Il suo compito è farti **domande guida** per farti scoprire da solo dove si trova l'errore o come costruire l'algoritmo.
2. **Non ti dà voti e non ti giudica (`CU-16..19` esclusi)**:
   L'applicazione **non assegna mai voti**, non calcola punteggi, non valuta le tue capacità e non invia segnalazioni automatiche al registro elettronico. Sbagliare un ragionamento o fare domande qui è parte normale dell'apprendimento!
3. **La tua sessione vive solo nella RAM (**Regime Zero-Data**, PUIA §4)**:
   Tutto ciò che scrivi resta solo nella memoria temporanea (RAM) del computer su cui stai lavorando e scompare appena clicchi su **"Nuova Sessione (Azzera RAM)"** o chiudi la scheda del browser.
4. **L'IA può commettere errori**:
   Anche il miglior modello linguistico locale può sbagliare: verifica sempre ogni tua ipotesi compilando ed eseguendo il codice nel tuo IDE di laboratorio (Dev-C++, VS Code, Thonny, Eclipse, DBMS, ecc.) e confrontati con il docente.

---

## 2. Come è fatta la schermata: I Due Pannelli di Lavoro

Lo spazio di lavoro è diviso in due colonne affiancate:

- **Pannello 1 (a Sinistra) — Contesto & Tentativo dello Studente**:
  - **Contesto dell'Attività**: mostra il linguaggio scelto (`Pseudocodice`, `C/C++`, `Python`, `Java`, `SQL`, `Web`), la traccia dell'esercizio, i vincoli fissati dal docente e il **Livello Didattico AUP** attivo (`Livello 1`, `2` o `3`);
  - **Tentativo di Codice o Pseudocodice**: dove incolli la bozza di programma o query che hai provato a scrivere;
  - **Messaggio di Errore del Compilatore / Interprete**: dove incolli l'eventuale errore restituito dal tuo IDE (opzionale ma utilissimo se il codice non compila);
  - **Pre-impegno Cognitivo** *(Obbligatorio)*: dove spieghi con parole tue cosa hai provato a fare, qual è la tua ipotesi e dove ti sei bloccato;
  - Pulsante **"Richiedi Intervento Maieutico"** (con opzione per ricevere la risposta in tempo reale parola per parola tramite streaming SSE).
- **Pannello 2 (a Destra) — Dialogo Maieutico**:
  - Mostra la cronologia degli **Interventi Maieutici** del Tutor e le tue risposte;
  - Contiene il box **"La tua risposta alle domande socratiche del Tutor Maieutico"**, dove rispondi alle domande guida poste dal Tutor.

---

## 3. Il Pre-impegno Cognitivo: Come sbloccare l'Intervento Maieutico (con esempi pratici)

Il pulsante **"Richiedi Intervento Maieutico"** blocca l'invio se il campo **Pre-impegno Cognitivo** è vuoto o contiene solo poche parole generiche.  
**Perché?** Perché in programmazione il vero apprendimento inizia nel momento in cui provi a formulare un'ipotesi sul problema prima di chiedere aiuto.

Ecco la differenza tra un **Pre-impegno Cognitivo** che viene rifiutato e uno efficace che aiuta davvero il **Tutor Maieutico** a guidarti:

| ❌ Pre-impegno NON valido (Bloccato) | ✅ Pre-impegno Efficace (Consigliato) |
| :--- | :--- |
| *"Non so come si fa."* | *"Devo trovare il valore massimo in un array di 10 interi. Ho pensato di usare un ciclo `for`, ma non so con quale valore iniziale inizializzare la variabile `max` se nell'array ci sono anche numeri negativi."* |
| *"Non funziona / mi dà errore."* | *"Ho scritto un ciclo `for (int i = 0; i <= 10; i++)` su un array dichiarato `int v[10]`. Il programma compila ma va in crash all'ultimo giro: penso dipenda dall'indice `i <= 10`."* |
| *"Correggimi la query SQL."* | *"Voglio contare quanti studenti ci sono per ogni classe usando `GROUP BY classe`, ma quando aggiungo la condizione sul numero minimo di studenti con `WHERE COUNT(*) > 20` il database mi restituisce errore di sintassi."* |

> **Suggerimento pratico**: ogni volta che modifichi il tuo codice nell'IDE dopo aver ragionato con il Tutor, puoi aggiornare il codice e il **Pre-impegno Cognitivo** nel pannello di sinistra e cliccare di nuovo su **"Richiedi Intervento Maieutico"** per sottoporre il tuo nuovo tentativo!

---

## 4. Come dialogare con il Tutor: I 4 Stadi della Progressione Maieutica e l'Escalation al Docente

Quando chiedi aiuto su un blocco, il **Tutor Maieutico** ti accompagna passo dopo passo attraverso 4 stadi:

1. **`Stadio 1` — Domanda Esplorativa**: il Tutor ti fa notare una riga specifica del tuo codice o ti chiede cosa dovrebbe accadere con un determinato valore di input. Rispondi alla sua domanda nel pannello di destra!
2. **`Stadio 2` — Scomposizione e Trace a mano**: se il dubbio rimane, il Tutor ti guida a simulare a mano (*trace table*) cosa contengono le tue variabili al primo giro, al secondo giro e all'ultimo giro del ciclo.
3. **`Stadio 3` — Analogia o Micro-sintassi astratta**: se ti serve ricordare la sintassi di un costrutto (nei **Livelli Didattici AUP 2 e 3**), il Tutor ti mostra una breve analogia o un micro-esempio astratto di **massimo 3 righe** su un caso fittizio diverso dal tuo esercizio.
4. **`Stadio 4` — Sintesi ed Escalation al Docente**: se anche dopo il 3° stadio (o cliccando su *"Sono ancora bloccato"*) non riesci a procedere, il Tutor **si ferma**, prepara sullo schermo una **sintesi chiara in 2 punti** del tuo ostacolo concettuale e ti invita ad **alzare la mano e chiamare il docente in laboratorio**. Quando il docente arriverà alla tua postazione, leggerà i 2 punti e potrà spiegarti dal vivo esattamente ciò che ti mancava!

---

## 5. Igiene Digitale: Il Guardrail Zero-Data e la Sanitizzazione Assistita

Per proteggere la tua privacy (**Regime Zero-Data**, AUP-IA §4.1 e §6.1), prima che qualsiasi messaggio parta verso il **Motore di Inferenza**, il **Guardrail Zero-Data** controlla il tuo codice e il tuo testo.

L'invio viene bloccato con un avviso educativo se hai inserito per sbaglio:
- **Dati personali o nomi nei commenti del codice**: es. `// Autore: Mario Rossi, Classe 3A`, indirizzi email, codici fiscali, numeri di telefono;
- **Password o chiavi segrete**: es. token, `api_key`, password;
- **Informazioni sanitarie o piani didattici personalizzati (`CU-12`)**: termini come `DSA`, `BES`, `PDP`, `PEI`, `dislessia`, `discalculia`, `legge 104`.

### Cosa fare se scatta il Guardrail Zero-Data?
Niente panico! Ti basta cliccare sul pulsante **"Sanitizzazione Assistita"**: l'applicazione sostituirà automaticamente i dati personali o sensibili con `[DATO RIMOSSO]` e, se avevi menzionato difficoltà di lettura o di studio, ti aprirà i controlli di **Scaffolding Cognitivo** per adattare lo stile delle risposte in totale sicurezza e anonimato.

---

## 6. Personalizzare lo studio: Lo Scaffolding Cognitivo (Biennio/Triennio e Alta Leggibilità)

Ogni studente impara meglio quando le spiegazioni sono adatte al proprio ritmo. Attraverso i controlli universali di **Scaffolding Cognitivo** (accessibili a chiunque nella barra superiore, senza alcuna etichetta clinica secondo [ADR-0002](../adr/0002-udl-scaffolding-without-health-profiling.md)), puoi attivare in qualsiasi momento:

- **Profilo Biennio (Classi I–II)** oppure **Profilo Triennio (Classi III–V)**: adatta il vocabolario tecnico al tuo anno di corso;
- **Risposte brevi ad alta leggibilità**: frasi corte, dirette e prive di periodi complessi;
- **Scomposizione in micro-passaggi numerati**: spezza ogni ragionamento in piccoli passi uno alla volta;
- **Schemi logici testuali**: usa elenchi visivi e frecce (`Input -> Elaborazione -> Output`) per chiarire il flusso;
- **Font ad alta leggibilità, spaziatura aumentata e Alto Contrasto**: migliora il comfort visivo sullo schermo.

---

## 7. E se l'IA è spenta? Usare la Modalità Rubber Duck

Se sulla tua postazione il badge in alto indica **`Offline`** (ad esempio perché LM Studio non è avviato sul computer), non sei affatto bloccato!

Nella tecnica storica dell'ingegneria del software chiamata *Rubber Duck Debugging* ("debugging della paperella di gomma"), spiegare ad alta voce o per iscritto il proprio codice seguendo domande mirate permette spessissimo di trovare il bug da soli.

Con la **Modalità Rubber Duck** (PUIA §6.3, [ADR-0004](../adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)):
1. Compili normalmente il tuo codice, l'errore e il **Pre-impegno Cognitivo**;
2. Scegli il tipo di blocco (*Non mi è chiara la traccia*, *Errore di compilazione/sintassi*, *Il programma dà un risultato sbagliato*, *Il ciclo non termina mai*);
3. Rispondi passo-passo alle domande guida della checklist maieutica interattiva;
4. A fine ora puoi esportare e stampare regolarmente la tua scheda di lavoro nella **Dichiarazione d'Uso IA**.

---

## 8. Fine dell'esercitazione: Dichiarazione d'Uso IA e "Nuova Sessione (Azzera RAM)"

Quando il docente annuncia la conclusione del laboratorio:

1. **Esporta o stampa la Dichiarazione d'Uso IA (AUP-IA §4.4)**:
   - Clicca su **Esporta Dichiarazione d'Uso IA** per scaricare il file `.md` (oppure clicca su **Stampa / Salva PDF**);
   - Il documento contiene già la data, il modello usato, il **Livello Didattico AUP**, i tuoi tentativi con il **Pre-impegno Cognitivo**, il diario del dialogo maieutico e il codice crittografico di integrità **SHA-256**;
   - Compila **a mano** (su carta o nel file scaricato prima di consegnarlo al docente) il tuo *Nome, Cognome e Classe* negli appositi spazi in bianco.
2. **Azzera la RAM prima di lasciare la postazione**:
   - Clicca sul pulsante rosso in alto a destra **"Nuova Sessione (Azzera RAM)"**;
   - Tutti i tuoi codici e i tuoi messaggi vengono cancellati all'istante dalla memoria volatile del computer, lasciando la postazione pulita per gli studenti dell'ora successiva.

---

## 9. Appendice — Come installare e usare Tutor Maieutico gratuitamente sul tuo PC di casa

Vuoi allenarti a casa con lo stesso metodo maieutico usato in laboratorio, gratis, senza abbonamenti cloud e anche senza connessione a Internet? Puoi farlo in **Modalità Standalone Loopback** sul tuo computer (Windows, macOS o Linux):

### Passo 1 — Installa e avvia LM Studio
1. Scarica e installa gratuitamente **LM Studio** dal sito ufficiale (`https://lmstudio.ai`).
2. Apri LM Studio, vai nella sezione di ricerca modelli (icona della lente d'ingrandimento) e scarica uno di questi modelli gratuiti per la programmazione:
   - Se il tuo PC ha **16 GB di RAM** (o scheda video dedicata): cerca e scarica **`Qwen2.5-Coder-7B-Instruct-GGUF`** (versione `Q4_K_M`, ~4.7 GB);
   - Se il tuo PC ha **8 GB di RAM**: cerca e scarica **`Qwen2.5-Coder-3B-Instruct-GGUF`** (versione `Q4_K_M`, ~2.0 GB).
3. Clicca sull'icona **`<>` (Developer)** nella barra a sinistra di LM Studio:
   - Seleziona in alto il modello appena scaricato per caricarlo in memoria;
   - Nel pannello a sinistra (**Local Server**), verifica che la porta sia `1234` e **attiva la spunta `Enable CORS`**;
   - Clicca su **Start Server (Running)**.

### Passo 2 — Avvia Tutor Maieutico
1. Scarica o clona la cartella del progetto **Tutor Maieutico** (o la cartella compilata `dist/` fornita dal docente).
2. Se hai la cartella `dist/` pronta e Python installato sul PC, apri il Terminale (o Prompt dei comandi) dentro la cartella ed esegui:
   ```bash
   python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
   ```
   *(In alternativa, se hai installato Node.js, esegui `npm install` e poi `npm run dev` nella cartella del progetto).*
3. Apri il browser all'indirizzo **`http://127.0.0.1:8080`** (o `http://localhost:5173` se usi `npm run dev`): il badge in alto diventerà subito **verde** (`Connesso • Modalità Standalone Loopback (http://127.0.0.1:1234/v1)`) e potrai esercitarti in totale autonomia!
