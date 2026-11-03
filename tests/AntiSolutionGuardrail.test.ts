import { describe, expect, test } from 'vitest';
import {
  inspectAndApplyAntiSolution,
  countExecutableLines,
  isCompleteSolutionStructure,
  type AntiSolutionResult,
} from '../src/domain/AntiSolutionGuardrail';

describe('AntiSolutionGuardrail (Seam 1)', () => {
  describe('countExecutableLines', () => {
    test('esclude righe vuote e commenti a riga singola (//, #, --)', () => {
      const code = `
        // Questo è un commento
        # Altro commento
        -- Commento SQL

        int x = 10;
        int y = 20;
      `;
      expect(countExecutableLines(code)).toBe(2);
    });

    test('esclude commenti multiriga (/* ... */ e <!-- ... -->)', () => {
      const code = `
        /*
         * Commento esteso
         */
        int a = 1;
        <!-- commento HTML -->
        int b = 2;
      `;
      expect(countExecutableLines(code)).toBe(2);
    });
  });

  describe('isCompleteSolutionStructure', () => {
    test('rileva definizioni complete di main o programmi', () => {
      expect(isCompleteSolutionStructure('int main() { return 0; }')).toBe(true);
      expect(isCompleteSolutionStructure('public static void main(String[] args)')).toBe(true);
      expect(isCompleteSolutionStructure('void main()')).toBe(true);
    });

    test('rileva definizioni di funzioni e metodi', () => {
      expect(isCompleteSolutionStructure('def calcola_somma(lista):')).toBe(true);
      expect(isCompleteSolutionStructure('function calcolaTotale(a, b) {')).toBe(true);
      expect(isCompleteSolutionStructure('public int somma(int a, int b) {')).toBe(true);
    });

    test('rileva definizioni di classi', () => {
      expect(isCompleteSolutionStructure('class Studente:')).toBe(true);
      expect(isCompleteSolutionStructure('public class Esercizio {')).toBe(true);
    });

    test('rileva query SQL complete multi-clausola', () => {
      expect(isCompleteSolutionStructure('SELECT nome, voto FROM studenti WHERE voto >= 6;')).toBe(true);
      expect(isCompleteSolutionStructure('INSERT INTO studenti (nome) VALUES (\'Mario\');')).toBe(true);
      expect(isCompleteSolutionStructure('UPDATE studenti SET voto = 8 WHERE id = 1;')).toBe(true);
    });

    test('rileva strutture complete HTML', () => {
      expect(isCompleteSolutionStructure('<!DOCTYPE html><html><head><title>Test</title></head></html>')).toBe(true);
      expect(isCompleteSolutionStructure('<html><body><h1>Benvenuto</h1></body></html>')).toBe(true);
    });

    test('non segnala falsi positivi su micro-istruzioni isolate', () => {
      expect(isCompleteSolutionStructure('x = x + 1')).toBe(false);
      expect(isCompleteSolutionStructure('for i in range(3):')).toBe(false);
      expect(isCompleteSolutionStructure('SELECT *')).toBe(false);
    });
  });

  describe('Livello 1: supporto preliminare e concettuale', () => {
    test('blocca qualsiasi blocco di codice sintattico nel linguaggio target', () => {
      const reply = `
Ecco come puoi iniziare a ragionare:
\`\`\`python
x = 5
y = 10
print(x + y)
\`\`\`
Quale operazione pensi sia necessaria per calcolare la media?
      `;

      const result: AntiSolutionResult = inspectAndApplyAntiSolution(reply, 1, 'python');
      expect(result.intercepted).toBe(true);
      expect(result.interventionsCount).toBe(1);
      expect(result.cleanContent).not.toContain('print(x + y)');
      expect(result.cleanContent).toContain('Richiamo educativo al livello didattico AUP 1');
      expect(result.cleanContent).toContain('Quale operazione pensi sia necessaria');
    });

    test('permette pseudocodice testuale puro senza blocchi di codice sintattico', () => {
      const reply = `
Possiamo riassumere l'algoritmo in pseudocodice testuale:
1. Leggi il valore iniziale N
2. Finché N > 0 ripeti il ciclo
3. Stampa il risultato

Cosa dovrebbe accadere all'interno del ciclo?
      `;

      const result = inspectAndApplyAntiSolution(reply, 1, 'pseudocode');
      expect(result.intercepted).toBe(false);
      expect(result.interventionsCount).toBe(0);
      expect(result.cleanContent).toBe(reply);
    });
  });

  describe('Livelli 2 e 3: revisione assistita e debugging guidato', () => {
    test('consente micro-esempi astratti <= 3 righe eseguibili senza strutture risolutive complete', () => {
      const reply = `
Osserva questo micro-frammento di esempio:
\`\`\`python
# Aggiornamento accumulatore
totale += valore
contatore += 1
\`\`\`
Come puoi adattare questo schema al tuo ciclo?
      `;

      const result = inspectAndApplyAntiSolution(reply, 2, 'python');
      expect(result.intercepted).toBe(false);
      expect(result.interventionsCount).toBe(0);
      expect(result.cleanContent).toContain('totale += valore');
    });

    test('blocca blocchi di codice > 3 righe eseguibili', () => {
      const reply = `
\`\`\`python
# 4 righe eseguibili
a = 1
b = 2
c = 3
d = 4
\`\`\`
      `;

      const result = inspectAndApplyAntiSolution(reply, 2, 'python');
      expect(result.intercepted).toBe(true);
      expect(result.interventionsCount).toBe(1);
      expect(result.cleanContent).not.toContain('d = 4');
      expect(result.cleanContent).toContain('invariante di non-sostituzione');
    });

    test('blocca blocchi anche <= 3 righe se contengono una struttura risolutiva completa (es. def o main)', () => {
      const reply = `
\`\`\`python
def risolvi(n):
    return n * 2
\`\`\`
      `;

      const result = inspectAndApplyAntiSolution(reply, 3, 'python');
      expect(result.intercepted).toBe(true);
      expect(result.interventionsCount).toBe(1);
      expect(result.cleanContent).not.toContain('def risolvi');
      expect(result.cleanContent).toContain('invariante di non-sostituzione');
    });

    test('gestisce risposte con molteplici blocchi di codice conteggiando ogni violazione', () => {
      const reply = `
Primo blocco valido:
\`\`\`python
x = 1
y = 2
\`\`\`

Secondo blocco vietato:
\`\`\`python
def test():
    pass
\`\`\`

Terzo blocco vietato:
\`\`\`python
a = 1
b = 2
c = 3
d = 4
\`\`\`
      `;

      const result = inspectAndApplyAntiSolution(reply, 2, 'python');
      expect(result.intercepted).toBe(true);
      expect(result.interventionsCount).toBe(2);
      expect(result.cleanContent).toContain('x = 1');
      expect(result.cleanContent).not.toContain('def test()');
      expect(result.cleanContent).not.toContain('d = 4');
    });
  });
});
