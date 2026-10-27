# Architettura client-only in RAM con inferenza stateless (Standalone Loopback per default, endpoint LAN opzionale)

Stato: accepted

L'applicazione mantiene l'intera **sessione maieutica** esclusivamente nella memoria volatile (RAM) del client su ciascuna postazione di laboratorio, senza database, account utente o persistenza su disco. Per l'esecuzione del modello linguistico, il client interroga un **motore di inferenza** (LM Studio / OpenAI API) in modalità puramente *stateless*: per default tramite **modalità Standalone Loopback** (`http://127.0.0.1:1234/v1`) sulla singola macchina, con possibilità di override esplicito verso un **endpoint LAN** dedicato del laboratorio d'Istituto (`http://<IP-LAN>:1234/v1`) configurato senza registrazione dei prompt (*no-log*).

## Opzioni considerate

- **Solo loopback cablato (`127.0.0.1` non configurabile)**: garantisce l'isolamento fisico totale sulla singola macchina ma impedisce l'utilizzo nei laboratori con PC dotati di poca RAM/VRAM in cui un singolo server GPU di laboratorio in LAN deve servire l'inferenza per le postazioni della classe.
- **Applicazione web client-server tradizionale sulla LAN con backend e database**: semplifica la distribuzione centralizzata ma introduce persistenza sul server centrale, gestione di sessioni lato server e transito sistematico di stati applicativi, compromettendo il presupposto "100% zero-data / nessun dato personale" (PUIA §4) e rischiando di scivolare nel monitoraggio centralizzato degli studenti (`CU-18`).
- **Client locale con stato solo in RAM + endpoint di inferenza stateless configurabile (scelta)**: preserva il **regime zero-data** anche quando l'inferenza è delegata a un nodo GPU nella LAN del laboratorio, poiché nessun dato identificativo supera il **guardrail zero-data** lato client e nessuno stato conversazionale viene mai salvato sul server di inferenza.
