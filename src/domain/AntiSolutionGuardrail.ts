export type AupDidacticLevel = 1 | 2 | 3;

export interface AntiSolutionResult {
  cleanContent: string;
  intercepted: boolean;
  interventionsCount: number;
  reasons: string[];
}

export const LEVEL_1_NOTICE = `> [!NOTE] Richiamo educativo al livello didattico AUP 1 (invariante di non-sostituzione)
> Blocco di codice oscurato: nel livello didattico AUP 1 è consentito esclusivamente supporto preliminare concettuale e pseudocodice testuale. Nessun codice sintattico può essere fornito dal tutor maieutico (AUP-IA §1, art. 25 L. 132/2025).`;

export const LEVEL_2_3_NOTICE = `> [!NOTE] Avviso per l'invariante di non-sostituzione (AUP-IA §1 e art. 25 L. 132/2025)
> Blocco di codice oscurato: nel livello didattico AUP attivo sono ammessi esclusivamente micro-esempi astratti di massimo 3 righe. I blocchi estesi o contenenti strutture risolutive complete sono stati oscurati per stimolare la tua elaborazione autonoma (AUP-IA §1 e art. 25 L. 132/2025).`;

/**
 * Conta le righe eseguibili di codice, escludendo righe vuote e commenti puri
 * (//, #, --, /* ... *\/, <!-- ... -->, docstrings multiriga).
 */
export function countExecutableLines(code: string): number {
  // Rimuovi commenti multiriga /* ... */, <!-- ... -->, docstrings """...""" e '''...'''
  let stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/"""[\s\S]*?"""/g, '')
    .replace(/'''[\s\S]*?'''/g, '');

  const lines = stripped.split(/\r?\n/);
  let count = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    // Commenti a riga singola in C/C++/Java/JS, Python, SQL, o residui di commenti
    if (
      line.startsWith('//') ||
      line.startsWith('#') ||
      line.startsWith('--') ||
      line.startsWith('*')
    ) {
      continue;
    }
    count += 1;
  }

  return count;
}

/**
 * Rileva se un frammento contiene strutture risolutive complete:
 * - Programma principale (main, int main, public static void main, ecc.)
 * - Definizioni di funzioni/metodi completi (def ..., function ..., void ..., int ...)
 * - Definizioni di classi o struct
 * - Query SQL complete multi-clausola
 * - Pagine HTML complete (doctype, html, head, body)
 */
export function isCompleteSolutionStructure(code: string): boolean {
  const normalized = code.trim();

  // main in C, C++, Java, Python
  if (
    /\b(?:int|void|public\s+static\s+void)\s+main\b/i.test(normalized) ||
    /\bdef\s+main\s*\(/i.test(normalized) ||
    /if\s+__name__\s*==\s*['"]__main__['"]\s*:/i.test(normalized)
  ) {
    return true;
  }

  // Definizioni di funzioni in Python, JS, C, C++, Java, PHP
  if (
    /\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i.test(normalized) ||
    /\bfunction(?:\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\(/i.test(normalized) ||
    /\b(?:public|private|protected)?\s*(?:static\s+)?(?:void|int|float|double|char|boolean|bool|string|String|auto)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{/i.test(
      normalized
    )
  ) {
    return true;
  }

  // Definizioni di classi
  if (/\b(?:public\s+)?class\s+[a-zA-Z_][a-zA-Z0-9_]*/i.test(normalized)) {
    return true;
  }

  // Query SQL complete multi-clausola o DDL/DML complete
  if (
    /\bSELECT\b[\s\S]+\bFROM\b[\s\S]+(?:\bWHERE\b|\bJOIN\b|\bGROUP\s+BY\b|\bORDER\s+BY\b)/i.test(
      normalized
    ) ||
    /\bINSERT\s+INTO\b[\s\S]+\bVALUES\b/i.test(normalized) ||
    /\bUPDATE\b[\s\S]+\bSET\b[\s\S]+\bWHERE\b/i.test(normalized) ||
    /\bDELETE\s+FROM\b[\s\S]+\bWHERE\b/i.test(normalized) ||
    /\bCREATE\s+TABLE\b/i.test(normalized)
  ) {
    return true;
  }

  // Pagine HTML complete
  if (
    /<!DOCTYPE\s+html/i.test(normalized) ||
    /<html[\s\S]*<\/html>/i.test(normalized) ||
    (/<head[\s\S]*<\/head>/i.test(normalized) && /<body[\s\S]*<\/body>/i.test(normalized))
  ) {
    return true;
  }

  return false;
}

export const PROGRAMMING_LANGUAGES = new Set([
  'c',
  'cpp',
  'c++',
  'python',
  'py',
  'java',
  'sql',
  'html',
  'css',
  'javascript',
  'js',
  'typescript',
  'ts',
  'php',
]);

/**
 * Ispeziona la risposta del modello linguistico e applica il guardrail deterministico anti-soluzione:
 * - Livello 1: qualsiasi blocco di codice sintattico nel linguaggio target o linguaggi di programmazione viene oscurato.
 * - Livelli 2 e 3: i micro-esempi astratti <= 3 righe eseguibili senza strutture risolutive complete sono ammessi;
 *   blocchi > 3 righe o con strutture complete vengono oscurati con richiamo pedagogico.
 */
export function inspectAndApplyAntiSolution(
  reply: string,
  level: AupDidacticLevel,
  targetLanguage?: string
): AntiSolutionResult {
  let intercepted = false;
  let interventionsCount = 0;
  const reasons: string[] = [];

  // Match markdown fenced code blocks: sia completi (chiusi da ```) sia parziali durante lo streaming
  const codeBlockRegex = /```([a-zA-Z0-9_+#.-]*)\r?\n([\s\S]*?)(?:```|$)/g;

  const cleanContent = reply.replace(codeBlockRegex, (match, rawLang, codeBody) => {
    // Se il blocco non è chiuso da ``` e non viola alcuna regola, non alterare lo streaming in corso
    const isClosed = match.endsWith('```');
    const lang = (rawLang || '').trim().toLowerCase();
    const code = codeBody || '';

    if (level === 1) {
      // In Livello 1: se è indicato un linguaggio di programmazione, il targetLanguage o sintassi di programmazione
      const isKnownProgLang =
        PROGRAMMING_LANGUAGES.has(lang) ||
        (targetLanguage !== undefined && lang === targetLanguage.toLowerCase());
      const isPseudocodeOrText =
        lang === 'pseudocode' ||
        lang === 'pseudocodice' ||
        lang === 'text' ||
        lang === 'txt';

      const hasProgrammingKeywords =
        /\b(?:int|float|double|char|void|def|class|function|public|private|static|import|include|printf|console\.log|System\.out)\b/i.test(
          code
        );

      if (
        isKnownProgLang ||
        (!isPseudocodeOrText && lang.length > 0) ||
        (countExecutableLines(code) > 0 && (/[{};]/.test(code) || hasProgrammingKeywords))
      ) {
        intercepted = true;
        interventionsCount += 1;
        reasons.push('Livello 1: blocco di codice sintattico non consentito.');
        return LEVEL_1_NOTICE;
      }
      return match;
    }

    // In Livello 2 e 3: consentiti micro-esempi <= 3 righe eseguibili senza strutture complete
    const execLines = countExecutableLines(code);
    const hasCompleteStructure = isCompleteSolutionStructure(code);

    if (execLines > 3 || hasCompleteStructure) {
      intercepted = true;
      interventionsCount += 1;
      const reason =
        execLines > 3
          ? `Livelli 2–3: blocco di codice esteso (${execLines} righe eseguibili > 3).`
          : 'Livelli 2–3: rilevata struttura risolutiva completa (funzione, classe o programma).';
      reasons.push(reason);
      return LEVEL_2_3_NOTICE;
    }

    // Se non è chiuso durante lo streaming ma non viola le regole, lascia aperto per i token successivi
    if (!isClosed) {
      return match;
    }

    return match;
  });

  return {
    cleanContent,
    intercepted,
    interventionsCount,
    reasons,
  };
}
