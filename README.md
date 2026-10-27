# Tutor Maieutico — I.I.S.S. "Marconi-Hack" (Bari)

**Applicazione web didattica client-side 100% offline e Zero-Data per l'affiancamento socratico allo studio dell'informatica e della programmazione nei laboratori scolastici.**

[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](./LICENSE)

> **Nota sull'isolamento offline**: i badge e i link di documentazione sono puramente descrittivi nel repository Git; il bundle applicativo compilato (`dist/`) non carica alcun asset, font, icona o script da CDN o dalla rete Internet (ADR-0004).

---

## 1. Finalità Pedagogica e Quadro Normativo

**Tutor Maieutico** nasce per rispondere a un'esigenza concreta dei laboratori di informatica della scuola secondaria di secondo grado (indirizzi **ITT Informatica e Telecomunicazioni** e **Liceo Scientifico opzione Scienze Applicate**): offrire agli studenti un supporto intelligente durante le esercitazioni di codifica **senza mai sostituirsi al loro ragionamento autonomo**.

A differenza dei comuni assistenti di codifica o chatbot generalisti in cloud che generano codice risolutivo pronto per il copia-incolla, **Tutor Maieutico** attua tecnicamente e didatticamente:

- **Primato dell'apprendimento e Invariante di Non-Sostituzione (AUP-IA §1, §5.2 e art. 25 Legge 23 settembre 2025, n. 132)**: l'applicazione impone allo studente di esplicitare il proprio **Pre-impegno Cognitivo** prima di qualsiasi richiesta e applica una doppia barriera (**System Prompt** + **Guardrail Anti-Soluzione** deterministico lato client, [ADR-0003](./docs/adr/0003-dual-barrier-non-substitution-guardrail.md)) che impedisce la fornitura di soluzioni pronte, guidando invece lo studente attraverso i 4 stadi della **Progressione Maieutica** fino all'**Escalation al Docente** in laboratorio (*Human-in-the-Loop*).
- **Inquadramento nel Piano d'Uso dell'IA (PUIA)**:
  - `CU-05`, `CU-11`, `CU-15`: **Banner permanente di Disclosure AUP-IA** sempre visibile che attesta l'interazione con un sistema di IA generativa soggetto a possibili imprecisioni.
  - `CU-09` (*Coding assistant supervisionato*) e `CU-11` (*Chatbot/tutor didattico*): supporto socratico governato dal **Livello Didattico AUP** (`Livello 1`, `Livello 2`, `Livello 3`, AUP-IA §4.3) e dal **Pacchetto Attività** (`.maieutica.json`) predisposto dal docente.
  - `CU-12` (*Strumento compensativo o di accessibilità*): controlli universali di **Scaffolding Cognitivo** secondo i principi dell'*Universal Design for Learning* (UDL) per supportare anche studenti con PDP/PEI senza alcuna etichetta clinica o trattamento di dati sanitari ex art. 9 GDPR ([ADR-0002](./docs/adr/0002-udl-scaffolding-without-health-profiling.md)).
  - **Esclusione tassativa per costruzione di `CU-16`, `CU-17`, `CU-18`, `CU-19` (PUIA §3.3 e art. 22 GDPR)**: nessun voto, nessuna valutazione sommativa o formativa automatizzata, nessuna profilazione individuale e nessun monitoraggio comportamentale.
- **Regime Zero-Data ("Nessun dato personale / Fuori ambito GDPR", PUIA §4 e Allegato B)**:
  - Nessun database, nessun account utente, nessuna persistenza su disco (`localStorage`, `sessionStorage`, `IndexedDB` e cookie non vengono mai utilizzati per i dati della **Sessione Maieutica**).
  - L'intera **Sessione Maieutica** vive esclusivamente nella memoria volatile (**RAM**) della singola postazione e viene distrutta istantaneamente al clic su **"Nuova Sessione (Azzera RAM)"** o alla chiusura della scheda ([ADR-0001](./docs/adr/0001-stateless-inference-loopback-and-lan.md)).
  - **Guardrail Zero-Data** preventivo con **Sanitizzazione Assistita** che blocca l'invio accidentale di dati personali (nomi, email, codici fiscali, telefoni), credenziali/chiavi API o termini diagnostici (`DSA`, `BES`, `PDP`, `PEI`, `Legge 104`).
- **Alternativa Equivalente Garantita (PUIA §6.3, [ADR-0004](./docs/adr/0004-offline-static-bundle-and-rubber-duck-fallback.md))**:
  - Qualora il **Motore di Inferenza** non sia attivo sulla postazione, l'applicazione mette a disposizione la **Modalità Rubber Duck** (percorso statico di auto-diagnosi maieutica per tutti i 6 ambiti curricolari), garantendo la piena continuità didattica anche su macchine prive di accelerazione hardware.

---

## 2. Architettura del Sistema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Postazione di Laboratorio (Browser Client)               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ WorkspaceUI (2 Pannelli + Banner Disclosure AUP-IA + Controlli UDL) │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                      │
│  ┌──────────────────────────────────▼───────────────────────────────────┐  │
│  │            MaieuticSessionEngine (Stato 100% in RAM)                 │  │
│  │  • Validazione Pre-impegno Cognitivo                                 │  │
│  │  • Guardrail Zero-Data & Sanitizzazione Assistita                    │  │
│  │  • System Prompt Maieutico (Livelli AUP 1-3, 6 Preset, UDL)          │  │
│  │  • Progressione Maieutica (Stadi 1..4 + Escalation al Docente)       │  │
│  │  • Guardrail Anti-Soluzione Post-Inferenza                           │  │
│  │  • Modalità Rubber Duck (Alternativa Equivalente Offline PUIA §6.3)  │  │
│  │  • Pacchetto Attività (.maieutica.json), PIN & Dichiarazione SHA-256 │  │
│  └───────────────┬──────────────────────────────────────┬───────────────┘  │
│                  │ InferencePort                        │ EnvironmentPort  │
│  ┌───────────────▼──────────────────┐   ┌───────────────▼───────────────┐  │
│  │       LmStudioHttpAdapter        │   │   BrowserEnvironmentAdapter   │  │
│  │ (Solo Loopback o LAN RFC 1918)   │   │     (Timestamp / WebCrypto)   │  │
│  └───────────────┬──────────────────┘   └───────────────────────────────┘  │
└──────────────────┼─────────────────────────────────────────────────────────┘
                   │ HTTP / SSE Stateless (GET /v1/models, POST /v1/chat/completions)
                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Motore di Inferenza Locale (LM Studio / OpenAI API)            │
│  • Default: Modalità Standalone Loopback (http://127.0.0.1:1234/v1)        │
│  • Opzione Lab: Modalità Endpoint LAN (http://<IP-LAN-RFC1918>:1234/v1)    │
│  • Rifiuto strutturale di qualsiasi IP/dominio pubblico su Internet        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Struttura del Repository

- [`GLOSSARY.md`](./GLOSSARY.md): glossario canonico del linguaggio ubiquo di dominio (pedagogia, governance AUP-IA/PUIA e architettura).
- [`docs/adr/`](./docs/adr/): Architecture Decision Records (`0001`..`0004`).
- [`docs/manuali/manuale-docente.md`](./docs/manuali/manuale-docente.md): **Manuale per il Docente e l'Assistente Tecnico** (installazione di laboratorio Loopback/LAN, provisioning air-gapped, configurazione didattica, gestione della lezione e verifica della **Dichiarazione d'Uso IA**).
- [`docs/manuali/manuale-studente.md`](./docs/manuali/manuale-studente.md): **Manuale Operativo per lo Studente** (patto educativo AUP-IA, guida al **Pre-impegno Cognitivo**, uso dei due pannelli, **Scaffolding Cognitivo**, **Modalità Rubber Duck**, consegna finale e appendice per l'uso domestico).
- [`src/domain/`](./src/domain/): cuore applicativo (`MaieuticSessionEngine` e interfacce `InferencePort` / `EnvironmentPort`).
- [`src/adapters/`](./src/adapters/): adattatore HTTP/SSE stateless `LmStudioHttpAdapter` (con validazione rigorosa Loopback e subnet private RFC 1918) e `BrowserEnvironmentAdapter`.
- [`src/ui/`](./src/ui/) e [`src/styles/`](./src/styles/): interfaccia utente a due pannelli `WorkspaceUI` e fogli di stile locali zero-CDN.
- [`tests/`](./tests/): suite di test automatizzati Vitest sui seams pubblici.

---

## 3. Avvio Rapido (Sviluppo, Build e Laboratorio)

### Prerequisiti
- **Node.js** `>= 20` e `npm` (solo per compilare il progetto o eseguire i test; per servire il bundle statico compilato `dist/` sulle postazioni di laboratorio è sufficiente qualsiasi micro-server HTTP locale come `python3 -m http.server`).
- **LM Studio** (o altro **Motore di Inferenza** locale compatibile con le API OpenAI `/v1/models` e `/v1/chat/completions`) con un modello istruito per il coding caricato (es. `Qwen2.5-Coder-7B-Instruct` o `Qwen2.5-Coder-3B-Instruct`).

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

## 4. Documentazione e Manuali d'Uso

Per le istruzioni dettagliate di installazione nei laboratori scolastici, configurazione di LM Studio in **Modalità Standalone Loopback** e **Modalità Endpoint LAN** e conduzione delle lezioni:

1. 📘 [**Manuale per il Docente e l'Assistente Tecnico** (`docs/manuali/manuale-docente.md`)](./docs/manuali/manuale-docente.md)
2. 📗 [**Manuale Operativo per lo Studente** (`docs/manuali/manuale-studente.md`)](./docs/manuali/manuale-studente.md)
3. 📙 [**Glossario del Dominio** (`GLOSSARY.md`)](./GLOSSARY.md)
4. 🏛️ **Architecture Decision Records (`docs/adr/`)**:
   - [ADR-0001: Architettura Client-Only in RAM con Inferenza Stateless (Loopback per Default, Endpoint LAN Opzionale)](./docs/adr/0001-stateless-inference-loopback-and-lan.md)
   - [ADR-0002: Supporto Compensativo PDP/PEI (`CU-12`) tramite Universal Design for Learning senza Profilazione Sanitaria](./docs/adr/0002-udl-scaffolding-without-health-profiling.md)
   - [ADR-0003: Doppia Barriera per l'Invariante di Non-Sostituzione (System Prompt + Guardrail Anti-Soluzione Client-Side)](./docs/adr/0003-dual-barrier-non-substitution-guardrail.md)
   - [ADR-0004: Applicazione Web Client-Side 100% Offline Zero-CDN con Alternativa Equivalente ("Modalità Rubber Duck")](./docs/adr/0004-offline-static-bundle-and-rubber-duck-fallback.md)

---

## 5. Stato di Avanzamento dei Moduli (Roadmap Specifica #1)

| Modulo / Funzionalità | Riferimento | Stato |
| :--- | :--- | :--- |
| **Sessione Maieutica** in RAM, **Pre-impegno Cognitivo** obbligatorio, `LmStudioHttpAdapter` (Loopback & LAN RFC 1918, HTTP + SSE) e Workspace a 2 pannelli con Banner Disclosure AUP-IA | Ticket #2 | ✅ Completato |
| **Guardrail Zero-Data** pre-invio (PII, credenziali, keyword sanitarie `CU-12`) e **Sanitizzazione Assistita** | Ticket #3 | 📋 Pianificato |
| **Contesto dell'Attività**, 6 Preset Curricolari, **Livelli Didattici AUP** (`1–3`) e **Guardrail Anti-Soluzione** post-inferenza | Ticket #4 | 📋 Pianificato |
| **Progressione Maieutica** a 4 stadi (con **Escalation al Docente**) e **Scaffolding Cognitivo** UDL (`CU-12`) | Ticket #5 | 📋 Pianificato |
| **Modalità Rubber Duck** (Alternativa Equivalente Offline ex PUIA §6.3) | Ticket #6 | 📋 Pianificato |
| **Pacchetto Attività** (`.maieutica.json`), blocco PIN Docente e **Dichiarazione d'Uso IA** (AUP-IA §4.4) con hash SHA-256 | Ticket #7 | 📋 Pianificato |

---

## 6. Licenza

Questo progetto è rilasciato sotto licenza open source **MIT License** — `Copyright (c) 2026 I.I.S.S. "Marconi-Hack" - Bari`. Consultare il file [LICENSE](./LICENSE) per il testo integrale.
