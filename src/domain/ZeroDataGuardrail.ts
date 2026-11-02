export type ZeroDataViolationCategory = 'pii' | 'credentials' | 'clinical_cu12';

export interface ZeroDataViolation {
  category: ZeroDataViolationCategory;
  match: string;
  ruleCitation: string;
  description: string;
}

export interface ZeroDataInspectionResult {
  allowed: boolean;
  violations: ZeroDataViolation[];
  categories: ZeroDataViolationCategory[];
  hasClinicalCu12: boolean;
  udlScaffoldingSuggestion?: string;
  pedagogicalMessage?: string;
}

export const PLACEHOLDER_REMOVED = '[DATO RIMOSSO]';

interface PatternRule {
  category: ZeroDataViolationCategory;
  regex: RegExp;
  ruleCitation: string;
  description: string;
}

const PATTERN_RULES: PatternRule[] = [
  // PII - Codice Fiscale Italiano
  {
    category: 'pii',
    regex: /\b[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]\b/gi,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Codice fiscale italiano rilevato',
  },
  // PII - Email personali e istituzionali
  {
    category: 'pii',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Indirizzo email rilevato',
  },
  // PII - Numeri di telefono italiani (+39, 0039, cellulari o fissi)
  {
    category: 'pii',
    regex: /(?:\+39[\s.-]?|0039[\s.-]?)?(?:3\d{2}[\s.-]?\d{6,7}|0\d{1,3}[\s.-]?\d{5,8})\b/g,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Numero telefonico rilevato',
  },
  // PII - Intestazioni anagrafiche nei commenti o nel codice
  {
    category: 'pii',
    regex: /\b(?:Autore|Alunno|Studente|Nome|Cognome|Classe)\s*:\s*(?!\[DATO RIMOSSO\])[A-Za-z0-9À-ÿ][^\r\n,;*\/]+/gi,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Intestazione anagrafica rilevata',
  },
  // Credenziali - API keys note (OpenAI, GitHub, Google)
  {
    category: 'credentials',
    regex: /\b(?:sk-[a-zA-Z0-9_-]{16,}|ghp_[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})\b/g,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Chiave API o segreto crittografico rilevato',
  },
  // Credenziali - Token Bearer
  {
    category: 'credentials',
    regex: /\bBearer\s+[a-zA-Z0-9_.-]+\b/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Token di autorizzazione Bearer rilevato',
  },
  // Credenziali - Assegnazioni api_key o password
  {
    category: 'credentials',
    regex: /\bapi_key\s*[:=]\s*(?:['"][^'"]*['"]|[a-zA-Z0-9_-]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Assegnazione di chiave API rilevata',
  },
  {
    category: 'credentials',
    regex: /\bpassword\s*[:=]\s*(?:['"][^'"]*['"]|[^\s;,]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Assegnazione di password rilevata',
  },
  // Termini clinici o diagnostici protetti ex art. 9 GDPR e CU-12
  {
    category: 'clinical_cu12',
    regex: /\b(?:DSA|BES|PDP|PEI|dislessia|dislessico|dislessica|disgrafia|disgrafico|disgrafica|disortografia|disortografico|disortografica|discalculia|discalculico|discalculica|ADHD|autismo|autistico|autistica|sostegno|legge\s+104|L\.\s*104|diagnosi)\b/gi,
    ruleCitation: 'CU-12, ADR-0002, art. 9 GDPR, PUIA §4',
    description: 'Termine clinico o riferimento a piano diagnostico protetto (CU-12)',
  },
];

const UDL_SUGGESTION_TEXT =
  'Igiene digitale e privacy (CU-12 / ADR-0002): non inserire mai termini clinici o riferimenti a diagnosi nei prompt. Per adattare il supporto didattico alle tue esigenze in totale anonimato, attiva lo scaffolding cognitivo UDL (risposte ad alta leggibilità, scomposizione in micro-passaggi e profilo biennio/triennio).';

export function inspectZeroData(text: string): ZeroDataInspectionResult {
  if (!text || text.trim().length === 0) {
    return {
      allowed: true,
      violations: [],
      categories: [],
      hasClinicalCu12: false,
    };
  }

  const violations: ZeroDataViolation[] = [];
  const categorySet = new Set<ZeroDataViolationCategory>();

  for (const rule of PATTERN_RULES) {
    // Reset regex index for global regexes
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.regex.exec(text)) !== null) {
      const matchedString = match[0].trim();
      if (matchedString.length > 0 && matchedString !== PLACEHOLDER_REMOVED) {
        violations.push({
          category: rule.category,
          match: matchedString,
          ruleCitation: rule.ruleCitation,
          description: rule.description,
        });
        categorySet.add(rule.category);
      }
      if (!rule.regex.global) break;
    }
  }

  const allowed = violations.length === 0;
  const categories = Array.from(categorySet);
  const hasClinicalCu12 = categories.includes('clinical_cu12');

  let pedagogicalMessage: string | undefined;
  if (!allowed) {
    const parts: string[] = [
      'Invio bloccato dal guardrail zero-data pre-invio:',
    ];

    if (categories.includes('pii')) {
      parts.push('• Dati personali o intestazioni anagrafiche rilevate (AUP-IA §4.1, PUIA §4).');
    }
    if (categories.includes('credentials')) {
      parts.push('• Credenziali, password o chiavi API rilevate (AUP-IA §6.1).');
    }
    if (hasClinicalCu12) {
      parts.push(
        '• Riferimento a diagnosi o piani individualizzati rilevato (CU-12, art. 9 GDPR).'
      );
    }

    pedagogicalMessage = parts.join('\n');
  }

  return {
    allowed,
    violations,
    categories,
    hasClinicalCu12,
    udlScaffoldingSuggestion: hasClinicalCu12 ? UDL_SUGGESTION_TEXT : undefined,
    pedagogicalMessage,
  };
}

export function sanitizeZeroData(text: string): string {
  if (!text) return '';
  let sanitized = text;

  for (const rule of PATTERN_RULES) {
    rule.regex.lastIndex = 0;
    sanitized = sanitized.replace(rule.regex, (matched) => {
      if (matched === PLACEHOLDER_REMOVED) return matched;
      return PLACEHOLDER_REMOVED;
    });
  }

  return sanitized;
}
