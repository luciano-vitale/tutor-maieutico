# Applicazione web client-side 100% offline zero-CDN con alternativa equivalente (modalità Rubber Duck)

Stato: accepted

Per operare sulle postazioni dei laboratori dell'I.I.S.S. "Marconi-Hack" in totale assenza di connessione a Internet e senza richiedere installazioni di database o server applicativi, l'applicazione è sviluppata in TypeScript/Vite e compilata in un bundle statico client-side totalmente autonomo (zero dipendenze da CDN esterne per font, icone o script) che comunica direttamente via HTTP/SSE con l'API OpenAI-compatibile di LM Studio (`127.0.0.1` o endpoint LAN).

In ottemperanza al principio di **alternativa equivalente garantita** (PUIA §6.3), qualora il **motore di inferenza** non sia attivo o disponibile su una postazione, l'applicazione non blocca l'attività didattica ma attiva la **modalità Rubber Duck** (checklist maieutica statica di auto-diagnosi e **pre-impegno cognitivo**), consentendo comunque allo studente di svolgere il percorso metodologico ed esportare la scheda di lavoro.
