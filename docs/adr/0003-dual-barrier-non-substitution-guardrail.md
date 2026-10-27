# Doppia Barriera per l'Invariante di Non-Sostituzione (System Prompt + Guardrail Anti-Soluzione Client-Side)

Stato: accepted

Per garantire il rispetto dell'**Invariante di Non-Sostituzione** (AUP-IA §1, §5.2 e art. 25 L. 132/2025) anche quando il **Motore di Inferenza** esegue modelli linguistici locali di piccola/media taglia (es. 7B–14B parametri su LM Studio, più suscettibili a *prompt injection* o *jailbreak* pedagogici rispetto ai modelli frontier), l'applicazione non si affida al solo System Prompt ma implementa un **Guardrail Anti-Soluzione** deterministico lato client che ispeziona l'output prima del rendering:
- in **Livello Didattico AUP 1**, qualsiasi blocco di codice nel linguaggio di programmazione target viene intercettato e inibito;
- in **Livello Didattico AUP 2 e 3**, qualsiasi blocco di codice che superi le **3 righe eseguibili** o contenga strutture risolutive complete (es. `main`, intere funzioni/metodi, algoritmi completi) viene automaticamente oscurato e sostituito da un richiamo educativo al metodo maieutico.

In caso di blocco persistente dello studente, il sistema applica la **Progressione Maieutica** a 4 stadi culminando, al 4° stadio, nel rinvio esplicito al docente in laboratorio (*Human-in-the-Loop*) anziché nella generazione della soluzione.
