# Architettura Client-Only in RAM con Inferenza Stateless (Loopback per Default, Endpoint LAN Opzionale)

Stato: accepted

L'applicazione mantiene l'intera **Sessione Maieutica** esclusivamente nella memoria volatile (RAM) del client su ciascuna postazione di laboratorio, senza database, account utente o persistenza su disco. Per l'esecuzione del modello linguistico, il client interroga un **Motore di Inferenza** (LM Studio / API compatibile OpenAI) in modalità puramente *stateless*: per default tramite **Modalità Standalone Loopback** (`http://127.0.0.1:1234/v1`) sulla singola macchina, con possibilità di override esplicito verso un **Endpoint LAN** dedicato del laboratorio d'Istituto (`http://<IP-LAN>:1234/v1`) configurato senza registrazione dei prompt (*no-log*).

## Opzioni Considerate

- **Solo Loopback cablato (`127.0.0.1` non configurabile)**: garantisce l'isolamento fisico totale sulla singola macchina ma impedisce l'utilizzo nei laboratori con PC dotati di poca RAM/VRAM in cui un singolo server GPU di laboratorio in LAN deve servire l'inferenza per le postazioni della classe.
- **Applicazione Web Client-Server tradizionale sulla LAN con backend e database**: semplifica la distribuzione centralizzata ma introduce persistenza sul server centrale, gestione di sessioni lato server e transito sistematico di stati applicativi, compromettendo il presupposto "100% Zero-Data / Nessun dato personale" (PUIA §4) e rischiando di scivolare nel monitoraggio centralizzato degli studenti (`CU-18`).
- **Client locale con stato solo in RAM + Endpoint di inferenza Stateless configurabile (Scelta)**: preserva il **Regime Zero-Data** anche quando l'inferenza è delegata a un nodo GPU nella LAN del laboratorio, poiché nessun dato identificativo supera il **Guardrail Zero-Data** lato client e nessuno stato conversazionale viene mai salvato sul server di inferenza.
