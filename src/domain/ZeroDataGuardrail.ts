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
  sanitizeReplacement?: (...args: string[]) => string;
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
    regex: /(?<![A-Za-z0-9_])(?:\+39[\s.-]?|0039[\s.-]?)?(?:3\d{2}[\s.-]?\d{6,7}|0\d{1,3}[\s.-]?\d{5,8})\b/g,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Numero telefonico rilevato',
  },
  // PII - Intestazioni anagrafiche nei commenti o nel codice
  {
    category: 'pii',
    regex: /\b(?:Autore|Alunno|Alunna|Studente|Studentessa|Nome\s+e\s+cognome|Nome|Cognome|Classe)\s*:\s*(?!\[DATO RIMOSSO\])[A-Za-z0-9À-ÿ](?:[^\r\n,.;*\/()\-]*[A-Za-z0-9À-ÿ])?/gi,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Intestazione anagrafica rilevata',
  },
  // PII - Presentazioni anagrafiche discorsive nel testo (es. "Sono Luciano Vitale", "Mi chiamo Mario Rossi", "il mio nome è ...", "il mio cognome è ...")
  {
    category: 'pii',
    regex: /(\b(?:(?:[Ii]o\s+)?[Ss]ono(?:\s+(?:lo\s+|la\s+|un(?:o|a)?\s+)?(?:studente|studentessa|alunno|alunna|ragazzo|ragazza))?|[Mm]i\s+chiamo|[Ii]l\s+mio\s+nome\s+è|[Ii]l\s+mio\s+cognome\s+è)\s+)(?!\[DATO RIMOSSO\])(?!in\b|un\b|una\b|uno\b|il\b|lo\b|la\b|del\b|della\b|dello\b|bloccato\b|bloccata\b|fermo\b|ferma\b|arrivato\b|arrivata\b|riuscito\b|riuscita\b|sicuro\b|sicura\b|convinto\b|convinta\b|qui\b|alle\b|al\b|su\b|con\b|per\b|tra\b|fra\b|Python\b|Java\b|C\b|C\+\+|JavaScript\b|TypeScript\b|HTML\b|CSS\b|SQL\b|PHP\b|Linux\b|Windows\b|Mac\b|Arduino\b)([A-ZÀ-Ý][a-zà-ÿ']+(?:\s+(?!(?:e|ed|ma|o|oppure|perché|poiché|quando|dove|come|se|che|non|della|nella|alla|in|del|nel|al|con|per|su|tra|fra|da|di|a|ho|ha|sono|è|frequento|studio)\b)(?:(?:[Dd][aei]|L[ao]|[Dd]'|[Dd]el|[Dd]ella|[Dd]i)\s+)?[A-ZÀ-Ý][a-zà-ÿ']+){0,2})\b/g,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Nominativo personale rilevato',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
  },
  {
    category: 'pii',
    regex: /(\b(?:[Mm]i\s+chiamo|[Ii]l\s+mio\s+nome\s+è|[Ii]l\s+mio\s+cognome\s+è)\s+)(?!\[DATO RIMOSSO\])([A-Za-zÀ-ÿ']+(?:\s+(?!(?:e|ed|ma|o|oppure|perché|poiché|quando|dove|come|se|che|non|della|nella|alla|in|del|nel|al|con|per|su|tra|fra|da|di|a|ho|ha|sono|è|frequento|studio|la|il|lo|un|una|mi)\b)[A-Za-zÀ-ÿ']+){0,2})\b/gi,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Nominativo personale rilevato',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
  },
  // PII - Indicazione discorsiva della classe scolastica (es. "della classe 3IC", "classe 4A Informatica", "della 3IC", "in 3IC")
  {
    category: 'pii',
    regex: /(\b(?:(?:della|nella|alla|in|frequento\s+la)\s+classe\s+|classe\s+|(?:della|nella|in)\s+))(?!\[DATO RIMOSSO\])([1-5]\s*[A-Za-z]{1,4}(?:\s+(?:Informatica|Telecomunicazioni|Elettronica|Automazione|Liceo|Scientifico|Scienze\s+Applicate|Biennio|Triennio))?)\b/gi,
    ruleCitation: 'AUP-IA §4.1, PUIA §4',
    description: 'Riferimento alla classe scolastica rilevato',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
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
  // Credenziali - Comunicazioni discorsive con possessivo, specificazione o introduzione esplicita (es. "La mia password è ...", "la password del wifi è ...", "uso come password ...")
  {
    category: 'credentials',
    regex: /(\b(?:(?:(?:la\s+)?(?:mia|nostra|sua|tua)|(?:il\s+)?(?:mio|nostro|suo|tuo))\s+(?:password|passwd|pwd|pass|pin|codice\s+pin|chiave\s+api|api\s*key|token)(?:\s+(?:personale|segreta|segreto|(?:(?:del|della|dello|dei|degli|delle|di)\s+|dell'\s*)[^\s,;:]+))?\s*(?:è|[:=])\s*|(?:(?:la|il)\s+)?(?:password|passwd|pwd|pass|pin|codice\s+pin|chiave\s+api|api\s*key|token)\s+(?:(?:del|della|dello|dei|degli|delle|di)\s+|dell'\s*)[^\s,;:]+\s*(?:è|[:=])\s*|(?:uso|usando|inserisco|inserendo|metto|messo|scelgo|scelto|imposto|impostato)\s+come\s+(?:password|passwd|pwd|pass|pin)\s+))(?!\[DATO RIMOSSO\])(?:['"][^'"]+['"]|[^\s,;]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Credenziale o password comunicata nel testo rilevata',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
  },
  // Credenziali - Comunicazioni discorsive dirette ("la password è ...", "password è ...", "il pin è ..."), escludendo predicati didattici
  {
    category: 'credentials',
    regex: /(\b(?:(?:la|il)\s+)?(?:password|passwd|pwd|pin|codice\s+pin|chiave\s+api|api\s*key)\s+è\s+)(?!\[DATO RIMOSSO\])(?!(?:corretta|corretto|esatta|esatto|giusta|giusto|sbagliata|sbagliato|errata|errato|valida|valido|invalida|invalido|vuota|vuoto|lunga|lungo|corta|corto|breve|uguale|diversa|diverso|forte|debole|sicura|sicuro|insicura|insicuro|composta|composto|formata|formato|inserita|inserito|digitata|digitato|letta|letto|salvata|salvato|memorizzata|memorizzato|cifrata|cifrato|criptata|criptato|hashata|hashato|richiesta|richiesto|accettata|accettato|rifiutata|rifiutato|scaduta|scaduto|bloccata|bloccato|un|una|uno|il|lo|la|i|gli|le|di|da|in|con|su|per|tra|fra|più|meno|troppo|molto|poco|almeno|sempre|mai|ancora|già|non|vero|vera|falso|falsa|true|false|null|none|undefined)\b)(?:['"][^'"]+['"]|[^\s,;]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Password o segreto comunicato nel testo rilevato',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
  },
  // Credenziali - Token complessi con cifre/simboli subito dopo "password" (es. "password Admin1234!")
  {
    category: 'credentials',
    regex: /(\b(?:password|passwd|pwd)\s+)(?!\[DATO RIMOSSO\])(?![:=]\s*)(?=[^\s,;]*[\d@!#$%^&*])([^\s,;]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Password rilevata nel testo',
    sanitizeReplacement: (_full, prefix) => `${prefix}${PLACEHOLDER_REMOVED}`,
  },
  // Credenziali - Assegnazioni api_key o password
  {
    category: 'credentials',
    regex: /\b(?:api_key|apiKey)\s*[:=]\s*(?!\[DATO RIMOSSO\])(?:['"][^'"]*['"]|[a-zA-Z0-9_-]+)/gi,
    ruleCitation: 'AUP-IA §6.1',
    description: 'Assegnazione di chiave API rilevata',
  },
  {
    category: 'credentials',
    regex: /\b(?:password|passwd|pwd)\s*[:=]\s*(?!\[DATO RIMOSSO\])(?:['"][^'"]*['"]|[^\s;,]+)/gi,
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
    sanitized = sanitized.replace(rule.regex, (...args) => {
      const matched = args[0] as string;
      if (matched === PLACEHOLDER_REMOVED) return matched;
      if (rule.sanitizeReplacement) {
        return rule.sanitizeReplacement(...(args as string[]));
      }
      return PLACEHOLDER_REMOVED;
    });
  }

  return sanitized;
}
