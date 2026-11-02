import { describe, expect, test } from 'vitest';
import {
  inspectZeroData,
  sanitizeZeroData,
} from '../src/domain/ZeroDataGuardrail';

describe('ZeroDataGuardrail', () => {
  describe('ispezione dati personali (PII)', () => {
    test('rileva indirizzi email sia personali che istituzionali', () => {
      const text = 'Puoi contattarmi a mario.rossi@marconihack.edu.it oppure su test.dev@gmail.com per il codice.';
      const result = inspectZeroData(text);

      expect(result.allowed).toBe(false);
      expect(result.categories).toContain('pii');
      expect(result.violations.some((v) => v.category === 'pii' && v.match.includes('mario.rossi@marconihack.edu.it'))).toBe(true);
      expect(result.violations.some((v) => v.category === 'pii' && v.match.includes('test.dev@gmail.com'))).toBe(true);
    });

    test('rileva codici fiscali italiani validi nel testo o nei commenti', () => {
      const text = '// Codice fiscale studente: RSSMRA85M01H501Z da inserire nella struct';
      const result = inspectZeroData(text);

      expect(result.allowed).toBe(false);
      expect(result.categories).toContain('pii');
      expect(result.violations.some((v) => v.match === 'RSSMRA85M01H501Z')).toBe(true);
    });

    test('rileva numeri di telefono italiani con o senza prefisso internazionale', () => {
      const samples = [
        'Chiamami al +39 347 1234567 per il debug',
        'Numero fisso: 080 123456',
        'Cellulare: 333-9876543',
      ];

      for (const sample of samples) {
        const result = inspectZeroData(sample);
        expect(result.allowed).toBe(false);
        expect(result.categories).toContain('pii');
      }
    });

    test('rileva intestazioni anagrafiche nei commenti del codice (Autore, Alunno, Studente, Nome, Cognome, Classe)', () => {
      const code = `
        /*
         * Progetto Informatica
         * Autore: Mario Rossi
         * Classe: 3A Informatica
         */
        int main() { return 0; }
      `;
      const result = inspectZeroData(code);

      expect(result.allowed).toBe(false);
      expect(result.categories).toContain('pii');
      expect(result.violations.some((v) => v.match.includes('Autore: Mario Rossi'))).toBe(true);
      expect(result.violations.some((v) => v.match.includes('Classe: 3A Informatica'))).toBe(true);
    });

    test('rileva e sanitizza presentazioni discorsive con nome, cognome e classe nel pre-impegno o nel dialogo', () => {
      const originalScenario =
        'Sono Luciano Vitale della classe 3IC, la mia mail è luciano.vitale@marconihack.edu.it e non capisco come mai se inserisco 3 ottengo 333 invece che 9....';
      const result = inspectZeroData(originalScenario);

      expect(result.allowed).toBe(false);
      expect(result.categories).toContain('pii');

      const sanitized = sanitizeZeroData(originalScenario);
      expect(sanitized).toBe(
        'Sono [DATO RIMOSSO] della classe [DATO RIMOSSO], la mia mail è [DATO RIMOSSO] e non capisco come mai se inserisco 3 ottengo 333 invece che 9....'
      );
      expect(sanitized).not.toContain('Luciano');
      expect(sanitized).not.toContain('Vitale');
      expect(sanitized).not.toContain('3IC');
      expect(inspectZeroData(sanitized).allowed).toBe(true);

      // Ulteriori varianti discorsive di presentazione (nome, cognome, classe)
      const variants = [
        'Mi chiamo Mario Rossi e frequento la classe 4A Informatica.',
        'Il mio nome è Giulia Bianchi, il mio cognome è Bianchi, sono in classe 2B.',
        'Ciao, mi chiamo luca verdi della 3IC',
      ];

      for (const variant of variants) {
        expect(inspectZeroData(variant).allowed).toBe(false);
        const cleaned = sanitizeZeroData(variant);
        expect(inspectZeroData(cleaned).allowed).toBe(true);
      }

      // Verifica assenza di falsi positivi con "Sono ..." su frasi tecniche o comuni
      const technicalPhrases = [
        'Sono bloccato sul ciclo while in Python e non capisco la condizione.',
        'Sono arrivato al punto in cui devo convertire la stringa in intero.',
        'Sono in difficoltà con la ricorsione in Java.',
        'Sono sicuro che la variabile numero contenga una stringa.',
      ];

      for (const phrase of technicalPhrases) {
        expect(inspectZeroData(phrase).allowed).toBe(true);
      }
    });
  });

  describe('ispezione credenziali e segreti', () => {
    test('rileva chiavi API sk-..., ghp_... e AIza...', () => {
      const textWithSk = 'const key = "sk-abcdef1234567890abcdef123456";';
      const textWithGhp = 'const token = "ghp_1234567890abcdefghij1234567890abcdef";';
      const textWithAiza = 'const google = "AIzaSyD-1234567890abcdefghijklmnopqrstuv";';

      expect(inspectZeroData(textWithSk).categories).toContain('credentials');
      expect(inspectZeroData(textWithGhp).categories).toContain('credentials');
      expect(inspectZeroData(textWithAiza).categories).toContain('credentials');
    });

    test('rileva token Bearer, api_key e password in assegnazioni', () => {
      const samples = [
        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz',
        'api_key = "segreto_laboratorio_123"',
        'String password = "MiaPasswordSicura123!";',
        'password = "my secret phrase"',
        'api_key = "test"',
        'password = 123',
      ];

      for (const sample of samples) {
        const result = inspectZeroData(sample);
        expect(result.allowed).toBe(false);
        expect(result.categories).toContain('credentials');
      }
    });

    test('sanitizza completamente assegnazioni di password anche con spazi tra virgolette', () => {
      const text = 'const pass = "password = \\"super secret text\\"";';
      const sanitized = sanitizeZeroData(text);
      expect(sanitized).not.toContain('super secret text');
      expect(sanitized).toContain('[DATO RIMOSSO]');
    });

    test('rileva e sanitizza comunicazioni discorsive di password, PIN e credenziali nel dialogo o nel pre-impegno', () => {
      const screenshotScenario = 'La mia password è ' + 'alksjhdasjkdhgajdksb8989@';
      const result = inspectZeroData(screenshotScenario);

      expect(result.allowed).toBe(false);
      expect(result.categories).toContain('credentials');

      const sanitized = sanitizeZeroData(screenshotScenario);
      expect(sanitized).toBe('La mia password è [DATO RIMOSSO]');
      expect(sanitized).not.toContain('alksjhdasjkdhgajdksb8989@');
      expect(inspectZeroData(sanitized).allowed).toBe(true);

      const discursiveVariants = [
        'la password è Segreto123!',
        'La password del wifi è marconi2026',
        'la password di root è toor1234',
        "la password dell'account è qwerty99",
        'uso come password pippopluto',
        'ho messo come password SuperSecret99!',
        'Il mio PIN è 94821',
        'la mia chiave api è xyz987654321',
        'password Admin1234!',
      ];

      for (const variant of discursiveVariants) {
        const check = inspectZeroData(variant);
        expect(check.allowed).toBe(false);
        expect(check.categories).toContain('credentials');
        const cleaned = sanitizeZeroData(variant);
        expect(inspectZeroData(cleaned).allowed).toBe(true);
      }

      // Verifica assenza di falsi positivi su frasi didattiche che parlano di password come concetto
      const pedagogicalPasswordPhrases = [
        'Devo scrivere un programma che controlla se la password è lunga almeno 8 caratteri.',
        'Come faccio a verificare se la password è corretta o sbagliata in Python?',
        'Se la password è uguale a quella salvata, il ciclo while deve terminare.',
        'La password deve contenere almeno un numero e una lettera maiuscola.',
        'Controllo se la password inserita è vuota prima di procedere.',
      ];

      for (const phrase of pedagogicalPasswordPhrases) {
        expect(inspectZeroData(phrase).allowed).toBe(true);
      }
    });
  });

  describe('ispezione termini clinici e diagnostici protetti (CU-12 e art. 9 GDPR)', () => {
    test('rileva keyword diagnostiche e piani individualizzati (DSA, BES, PDP, PEI, dislessia, legge 104, ecc.)', () => {
      const samples = [
        'Ho il DSA e fatico a capire questo ciclo while',
        'Sono seguito con un PDP per dislessia',
        'Seguo il PEI e la legge 104',
        'Ho una diagnosi di ADHD e discalculia',
      ];

      for (const sample of samples) {
        const result = inspectZeroData(sample);
        expect(result.allowed).toBe(false);
        expect(result.categories).toContain('clinical_cu12');
        expect(result.hasClinicalCu12).toBe(true);
      }
    });

    test('restituisce la raccomandazione educativa esplicita per lo scaffolding UDL quando rileva CU-12', () => {
      const result = inspectZeroData('Ho la dislessia, puoi spiegarmelo con parole semplici?');
      expect(result.hasClinicalCu12).toBe(true);
      expect(result.udlScaffoldingSuggestion).toBeDefined();
      expect(result.udlScaffoldingSuggestion).toContain('scaffolding cognitivo UDL');
    });

    test('non genera falsi positivi su parole del linguaggio comune o informatico', () => {
      // es. "array", "debug", "pesante", "passo", "pdp" come sottostringa non isolata
      const innocentText = 'Sto usando un array di interi per calcolare il peso medio degli elementi con un ciclo for.';
      const result = inspectZeroData(innocentText);
      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('sanitizzazione assistita educativa', () => {
    test('sostituisce i match sensibili con [DATO RIMOSSO] preservando la struttura del codice', () => {
      const rawInput = [
        '// Autore: Mario Rossi',
        '// Email: mario.rossi@marconihack.edu.it',
        'const apiKey = "sk-1234567890abcdef12345678";',
        'int somma(int a, int b) { return a + b; }',
      ].join('\n');

      const sanitized = sanitizeZeroData(rawInput);

      expect(sanitized).not.toContain('Mario Rossi');
      expect(sanitized).not.toContain('mario.rossi@marconihack.edu.it');
      expect(sanitized).not.toContain('sk-1234567890abcdef12345678');
      expect(sanitized).toContain('[DATO RIMOSSO]');
      expect(sanitized).toContain('int somma(int a, int b) { return a + b; }');

      // Dopo la sanitizzazione assistita, il testo deve superare l'ispezione del guardrail
      const reInspection = inspectZeroData(sanitized);
      expect(reInspection.allowed).toBe(true);
    });

    test('sanitizza termini diagnostici CU-12 consentendo di ripulire il pre-impegno', () => {
      const text = 'Ho la dislessia e non capisco perché il ciclo while non incrementa i.';
      const sanitized = sanitizeZeroData(text);

      expect(sanitized).toContain('[DATO RIMOSSO]');
      expect(sanitized).not.toMatch(/dislessia/i);
      expect(inspectZeroData(sanitized).allowed).toBe(true);
    });
  });

  describe('regressioni piano di test esecutivo (TC-PII, TC-SEC, TC-CU12, TC-NEG)', () => {
    test('TC-PII-01 — Intestazioni anagrafiche multiple sulla stessa riga ed email nei commenti del codice', () => {
      const inputPayload = [
        '# Autore: Marco Rossi',
        '# Studente: Marco Rossi',
        '# Alunno: Marco Rossi',
        '# Nome: Marco - Cognome: Rossi - Classe: 4B INF',
        '# Contatto: marco.rossi@studenti.scuola.edu.it',
        '',
        'def calcola_media(voti):',
        '    return sum(voti) / len(voti)',
      ].join('\n');

      const expectedSanitized = [
        '# [DATO RIMOSSO]',
        '# [DATO RIMOSSO]',
        '# [DATO RIMOSSO]',
        '# [DATO RIMOSSO] - [DATO RIMOSSO] - [DATO RIMOSSO]',
        '# Contatto: [DATO RIMOSSO]',
        '',
        'def calcola_media(voti):',
        '    return sum(voti) / len(voti)',
      ].join('\n');

      const inspection = inspectZeroData(inputPayload);
      expect(inspection.allowed).toBe(false);
      expect(inspection.categories).toEqual(['pii']);
      expect(sanitizeZeroData(inputPayload)).toBe(expectedSanitized);
      expect(inspectZeroData(expectedSanitized).allowed).toBe(true);
    });

    test('TC-PII-02 & TC-PII-03 — Codici fiscali, telefoni e intestazione seguita da parentesi in errore compilatore', () => {
      const tcPii02 =
        'Sto provando il validatore con il mio codice fiscale RSSMRA07A01H501U e con quello di test BNCGLI08M41F205Z. Se serve potete chiamarmi al +39 347 1234567 oppure 02-9876543 o scrivermi a mario.rossi99@gmail.com.';
      expect(sanitizeZeroData(tcPii02)).toBe(
        'Sto provando il validatore con il mio codice fiscale [DATO RIMOSSO] e con quello di test [DATO RIMOSSO]. Se serve potete chiamarmi al [DATO RIMOSSO] oppure [DATO RIMOSSO] o scrivermi a [DATO RIMOSSO].'
      );

      const tcPii03 =
        'Exception in thread "main" java.lang.IllegalArgumentException: Input non valido per Studente: Giulia Verdi (CF: VRDGLI07C50L219K, email: g.verdi@istituto.it) at Main.java:22';
      expect(sanitizeZeroData(tcPii03)).toBe(
        'Exception in thread "main" java.lang.IllegalArgumentException: Input non valido per [DATO RIMOSSO] (CF: [DATO RIMOSSO], email: [DATO RIMOSSO]) at Main.java:22'
      );
    });

    test('TC-SEC-01 & TC-SEC-02 — Token API con cifre finali senza doppia sostituzione telefonica e assegnazioni credenziali', () => {
      const tcSec01 = [
        'const openai = "' + 'sk-proj-1234567890abcdefghijklmnopqrstuv' + '";',
        'const github = "' + 'ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789' + '";',
        'const google = "' + 'AIzaSyB1234567890abcdefghijklmnopqrstuvw' + '";',
        'const authHeader = "' + 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig' + '";',
      ].join('\n');

      const inspection = inspectZeroData(tcSec01);
      expect(inspection.allowed).toBe(false);
      expect(inspection.categories).toEqual(['credentials']);
      expect(sanitizeZeroData(tcSec01)).toBe(
        [
          'const openai = "[DATO RIMOSSO]";',
          'const github = "[DATO RIMOSSO]";',
          'const google = "[DATO RIMOSSO]";',
          'const authHeader = "[DATO RIMOSSO]";',
        ].join('\n')
      );

      const tcSec02 =
        'Nel file di configurazione ho scritto ' +
        'password = "SuperSecretPassword123!"' +
        ' e sotto ho impostato ' +
        'api_key = "my_secret_key_999"' +
        ', ma il server rifiuta comunque la connessione.';
      expect(sanitizeZeroData(tcSec02)).toBe(
        'Nel file di configurazione ho scritto [DATO RIMOSSO] e sotto ho impostato [DATO RIMOSSO], ma il server rifiuta comunque la connessione.'
      );
    });

    test('TC-CU12-01 & TC-CU12-02 — Sanitizzazione completa di keyword cliniche e diagnostiche protette', () => {
      const tcCu12_01 =
        'Ho una diagnosi di dislessia, disgrafia, disortografia e discalculia. Essendo dislessico con DSA e avendo un PDP attivo, mi spieghi il codice passo passo?';
      expect(sanitizeZeroData(tcCu12_01)).toBe(
        'Ho una [DATO RIMOSSO] di [DATO RIMOSSO], [DATO RIMOSSO], [DATO RIMOSSO] e [DATO RIMOSSO]. Essendo [DATO RIMOSSO] con [DATO RIMOSSO] e avendo un [DATO RIMOSSO] attivo, mi spieghi il codice passo passo?'
      );

      const tcCu12_02 =
        'Rientro nei BES e ho il PEI con il docente di sostegno (legge 104 / L. 104 per ADHD e autismo). Come posso semplificare questa funzione?';
      expect(sanitizeZeroData(tcCu12_02)).toBe(
        'Rientro nei [DATO RIMOSSO] e ho il [DATO RIMOSSO] con il docente di [DATO RIMOSSO] ([DATO RIMOSSO] / [DATO RIMOSSO] per [DATO RIMOSSO] e [DATO RIMOSSO]). Come posso semplificare questa funzione?'
      );
    });

    test('TC-NEG-01..04 — Nessun falso positivo su codice valido, parziali sovrapposizioni lessicali, timestamp o domande didattiche', () => {
      const negativeSamples = [
        'class Studente { String nome; String cognome; String classe; }',
        "Io sostengo che l'autonomia del ciclo dipenda dalla variabile task_id.",
        'long timestamp = 1714651234567L; String hash = "ABCDEF1234567890";',
        'Come posso validare una password in generale senza salvarla in chiaro?',
      ];

      for (const sample of negativeSamples) {
        const res = inspectZeroData(sample);
        expect(res.allowed).toBe(true);
        expect(res.violations).toHaveLength(0);
        expect(sanitizeZeroData(sample)).toBe(sample);
      }
    });
  });
});
