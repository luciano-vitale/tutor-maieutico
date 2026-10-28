# StudIA Tutor Maieutico — I.I.S.S. "Marconi-Hack" (Bari)

**Applicazione web didattica client-side 100% offline e zero-data per l'affiancamento socratico allo studio dell'informatica e della programmazione nei laboratori scolastici.**

[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](./LICENSE)

> **Nota sull'isolamento offline**: i badge e i link di documentazione sono puramente descrittivi nel repository Git; il bundle applicativo compilato (`dist/`) non carica alcun asset, font, icona o script da CDN o dalla rete Internet (ADR-0004).

---

## 1. Finalità pedagogica e quadro normativo

**Tutor Maieutico** nasce per rispondere a un'esigenza concreta dei laboratori di informatica della scuola secondaria di secondo grado (indirizzi **ITT Informatica e Telecomunicazioni** e **Liceo Scientifico opzione Scienze Applicate**): offrire agli studenti un supporto intelligente durante le esercitazioni di codifica **senza mai sostituirsi al loro ragionamento autonomo**.

A differenza dei comuni assistenti di codifica o chatbot generalisti in cloud che generano codice risolutivo pronto per il copia-incolla, **Tutor Maieutico** attua tecnicamente e didatticamente:

- **Primato dell'apprendimento e invariante di non-sostituzione (AUP-IA §1, §5.2 e art. 25 Legge 23 settembre 2025, n. 132)**: l'applicazione impone allo studente di esplicitare il proprio **pre-impegno cognitivo** prima di qualsiasi richiesta e applica una doppia barriera (**System Prompt** + **guardrail anti-soluzione** deterministico lato client, [ADR-0003](./docs/adr/0003-dual-barrier-non-substitution-guardrail.md)) che impedisce la fornitura di soluzioni pronte, guidando invece lo studente attraverso i 4 stadi della **progressione maieutica** fino all'**escalation al docente** in laboratorio (*Human-in-the-Loop*).
- **Inquadramento nel Piano d'uso dell'IA (PUIA)**:
  - `CU-05`, `CU-11`, `CU-15`: **banner permanente di disclosure AUP-IA** sempre visibile che attesta l'interazione con un sistema di IA generativa soggetto a possibili imprecisioni.
  - `CU-09` (*Coding assistant supervisionato*) e `CU-11` (*Chatbot/tutor didattico*): supporto socratico governato dal **livello didattico AUP** (`Livello 1`, `Livello 2`, `Livello 3`, AUP-IA §4.3) e dal **pacchetto attività** (`.maieutica.json`) predisposto dal docente.
  - `CU-12` (*Strumento compensativo o di accessibilità*): controlli universali di **scaffolding cognitivo** secondo i principi dell'*Universal Design for Learning* (`UDL`) per supportare anche studenti con PDP/PEI senza alcuna etichetta clinica o trattamento di dati sanitari ex art. 9 GDPR ([ADR-0002](./docs/adr/0002-udl-scaffolding-without-health-profiling.md)).
  - **Esclusione tassativa per costruzione di `CU-16`, `CU-17`, `CU-18`, `CU-19` (PUIA §3.3 e art. 22 GDPR)**: nessun voto, nessuna valutazione sommativa o formativa automatizzata, nessuna profilazione individuale e nessun monitoraggio comportamentale.
- **Regime zero-data ("Nessun dato personale / Fuori ambito GDPR", PUIA §4 e Allegato B)**:
  - Nessun database, nessun account utente, nessuna persistenza su disco (`localStorage`, `sessionStorage`, `IndexedDB` e cookie non vengono mai utilizzati per i dati della **sessione maieutica**).
  - L'intera **sessione maieutica** vive esclusivamente nella memoria volatile (**RAM**) della singola postazione e viene distrutta istantaneamente al clic sul pulsante di reset **"Nuova sessione"** o alla chiusura della scheda ([ADR-0001](./docs/adr/0001-stateless-inference-loopback-and-lan.md)).
  - **Guardrail zero-data** preventivo con **sanitizzazione assistita** che blocca l'invio accidentale di dati personali (nomi, email, codici fiscali, telefoni), credenziali/chiavi API o termini diagnostici (`DSA`, `BES`, `PDP`, `PEI`, `Legge 104`).
- **Alternativa equivalente garantita (PUIA §6.3, [ADR-0004](./docs/adr/0004-offline-static-bundle-and-rubber-duck-fallback.md))**:
  - Qualora il **motore di inferenza** non sia attivo sulla postazione, l'applicazione mette a disposizione la **modalità Rubber Duck** (percorso statico di auto-diagnosi maieutica per tutti i 6 ambiti curricolari), garantendo la piena continuità didattica anche su macchine prive di accelerazione hardware.

---

## 2. Architettura del sistema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Postazione di laboratorio (browser client)               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ WorkspaceUI (2 pannelli + banner disclosure AUP-IA + controlli UDL) │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                      │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │            MaieuticSessionEngine (stato 100% in RAM)                 │  │
│  │  • Validazione pre-impegno cognitivo                                 │  │
│  │  • Guardrail zero-data & sanitizzazione assistita                    │  │
│  │  • System Prompt maieutico (livelli AUP 1-3, 6 preset, UDL)          │  │
│  │  • Progressione maieutica (stadi 1..4 + escalation al docente)       │  │
│  │  • Guardrail anti-soluzione post-inferenza                           │  │
│  │  • Modalità Rubber Duck (alternativa equivalente offline PUIA §6.3)  │  │
│  │  • Pacchetto attività (.maieutica.json), PIN & dichiarazione SHA-256 │  │
│  └───────────────┬──────────────────────────────────────┬───────────────┘  │
│                  │ InferencePort                        │ EnvironmentPort  │
│  ┌───────────────▼──────────────────┐   ┌───────────────▼───────────────┐  │
│  │       LmStudioHttpAdapter        │   │   BrowserEnvironmentAdapter   │  │
│  │ (solo loopback o LAN RFC 1918)   │   │     (timestamp / WebCrypto)   │  │
│  └───────────────┬──────────────────┘   └───────────────────────────────┘  │
└──────────────────┼─────────────────────────────────────────────────────────┘
                   │ HTTP / SSE stateless (GET /v1/models, POST /v1/chat/completions)
                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Motore di inferenza locale (LM Studio / OpenAI API)            │
│  • Default: modalità Standalone Loopback (http://127.0.0.1:1234/v1)        │
│  • Opzione lab: modalità endpoint LAN (http://<IP-LAN-RFC1918>:1234/v1)    │
│  • Rifiuto strutturale di qualsiasi IP/dominio pubblico su Internet        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Struttura del repository

- [`GLOSSARY.md`](./GLOSSARY.md): glossario canonico del linguaggio ubiquo di dominio (pedagogia, governance AUP-IA/PUIA e architettura).
- [`docs/adr/`](./docs/adr/): Architecture Decision Records (`0001`..`0004`).
- [`docs/manuali/manuale-docente.md`](./docs/manuali/manuale-docente.md): **Manuale per il docente e l'assistente tecnico** (installazione di laboratorio loopback/LAN, provisioning air-gapped, configurazione didattica, gestione della lezione e verifica della **dichiarazione d'uso IA**).
- [`docs/manuali/manuale-studente.md`](./docs/manuali/manuale-studente.md): **Manuale operativo per lo studente** (patto educativo AUP-IA, guida al **pre-impegno cognitivo**, uso dei due pannelli, **scaffolding cognitivo**, **modalità Rubber Duck**, consegna finale e appendice per l'uso domestico).
- [`src/domain/`](./src/domain/): cuore applicativo (`MaieuticSessionEngine` e interfacce `InferencePort` / `EnvironmentPort`).
- [`src/adapters/`](./src/adapters/): adattatore HTTP/SSE stateless `LmStudioHttpAdapter` (con validazione rigorosa loopback e subnet private RFC 1918) e `BrowserEnvironmentAdapter`.
- [`src/ui/`](./src/ui/) e [`src/styles/`](./src/styles/): interfaccia utente a due pannelli `WorkspaceUI` (ispirata a LM Studio e Google Gemini, con icone vettoriali SVG, tooltip e animazioni di stato) e fogli di stile locali zero-CDN.
- [`tests/`](./tests/): suite di test automatizzati Vitest sui seams pubblici.

---

## 3. Avvio rapido (sviluppo, build e laboratorio)

### Prerequisiti
- **Node.js** `>= 20` e `npm` (solo per compilare il progetto o eseguire i test; per servire il bundle statico compilato `dist/` sulle postazioni di laboratorio è sufficiente qualsiasi micro-server HTTP locale come `python3 -m http.server`).
- **LM Studio** (o altro **motore di inferenza** locale compatibile con le OpenAI API `/v1/models` e `/v1/chat/completions`) con un modello istruito caricato.

### Comandi principali

```bash
# 1. Installazione delle dipendenze (una tantum sulla macchina di build)
npm install

# 2. Avvio del server di sviluppo locale
npm run dev

# 3. Controllo dei tipi TypeScript
npm run typecheck

# 4. Esecuzione della suite di test automatizzati (Vitest)
npm test

# 5. Compilazione del bundle statico 100% offline in dist/
npm run build

# 6. Anteprima del bundle statico compilato
npm run preview
# oppure senza Node.js sulle postazioni di laboratorio:
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

---

## 4. Documentazione e manuali d'uso

Per le istruzioni dettagliate di installazione nei laboratori scolastici, configurazione di LM Studio in **modalità Standalone Loopback** e **modalità endpoint LAN** e conduzione delle lezioni:

1. 📘 [**Manuale per il docente e l'assistente tecnico** (`docs/manuali/manuale-docente.md`)](./docs/manuali/manuale-docente.md)
2. 📗 [**Manuale operativo per lo studente** (`docs/manuali/manuale-studente.md`)](./docs/manuali/manuale-studente.md)
3. 📙 [**Glossario del dominio** (`GLOSSARY.md`)](./GLOSSARY.md)
4. 🏛️ **Architecture Decision Records (`docs/adr/`)**:
   - [ADR-0001: Architettura client-only in RAM con inferenza stateless (Standalone Loopback per default, endpoint LAN opzionale)](./docs/adr/0001-stateless-inference-loopback-and-lan.md)
   - [ADR-0002: Supporto compensativo PDP/PEI (`CU-12`) tramite Universal Design for Learning senza profilazione sanitaria](./docs/adr/0002-udl-scaffolding-without-health-profiling.md)
   - [ADR-0003: Doppia barriera per l'invariante di non-sostituzione (System Prompt + guardrail anti-soluzione client-side)](./docs/adr/0003-dual-barrier-non-substitution-guardrail.md)
   - [ADR-0004: Applicazione web client-side 100% offline zero-CDN con alternativa equivalente (modalità Rubber Duck)](./docs/adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)

---

## 5. Stato di avanzamento dei moduli (roadmap specifica #1)

| Modulo / funzionalità | Riferimento | Stato |
| :--- | :--- | :--- |
| **Sessione maieutica** in RAM, **pre-impegno cognitivo** obbligatorio, `LmStudioHttpAdapter` (loopback & LAN RFC 1918, HTTP + SSE) e workspace a 2 pannelli con banner disclosure AUP-IA | Ticket #2 | ✅ Completato |
| **Guardrail zero-data** pre-invio (PII, credenziali, keyword sanitarie `CU-12`) e **sanitizzazione assistita** | Ticket #3 | 📋 Pianificato |
| **Contesto dell'attività**, 6 preset curricolari, **livelli didattici AUP** (`1–3`) e **guardrail anti-soluzione** post-inferenza | Ticket #4 | 📋 Pianificato |
| **Progressione maieutica** a 4 stadi (con **escalation al docente**) e **scaffolding cognitivo** UDL (`CU-12`) | Ticket #5 | 📋 Pianificato |
| **Modalità Rubber Duck** (alternativa equivalente offline ex PUIA §6.3) | Ticket #6 | 📋 Pianificato |
| **Pacchetto attività** (`.maieutica.json`), blocco PIN docente e **dichiarazione d'uso IA** (AUP-IA §4.4) con hash SHA-256 | Ticket #7 | 📋 Pianificato |

---

## 6. Licenza

Questo progetto è rilasciato sotto licenza open source **MIT License** — `Copyright (c) 2026 I.I.S.S. "Marconi-Hack" - Bari`. Consultare il file [LICENSE](./LICENSE) per il testo integrale.
