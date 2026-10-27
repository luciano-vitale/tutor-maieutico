# Applicazione Web Client-Side 100% Offline Zero-CDN con Alternativa Equivalente ("Modalità Rubber Duck")

Stato: accepted

Per operare sulle postazioni dei laboratori dell'I.I.S.S. "Marconi-Hack" in totale assenza di connessione a Internet e senza richiedere installazioni di database o server applicativi, l'applicazione è sviluppata in TypeScript/Vite e compilata in un bundle statico client-side totalmente autonomo (zero dipendenze da CDN esterne per font, icone o script) che comunica direttamente via HTTP/SSE con l'API OpenAI-compatibile di LM Studio (`127.0.0.1` o endpoint LAN).

In ottemperanza al principio di **Alternativa Equivalente Garantita** (PUIA §6.3), qualora il **Motore di Inferenza** non sia attivo o disponibile su una postazione, l'applicazione non blocca l'attività didattica ma attiva la **Modalità Rubber Duck** (checklist maieutica statica di auto-diagnosi e **Pre-impegno Cognitivo**), consentendo comunque allo studente di svolgere il percorso metodologico ed esportare la scheda di lavoro.
