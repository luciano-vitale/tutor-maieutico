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
});
