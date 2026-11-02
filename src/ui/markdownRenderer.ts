const ALLOWED_MARKDOWN_ELEMENTS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'div',
  'span',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'math',
  'mrow',
  'mi',
  'mn',
  'mo',
  'mtext',
  'mspace',
  'mfrac',
  'msqrt',
  'mroot',
  'msup',
  'msub',
  'msubsup',
  'munder',
  'mover',
  'munderover',
  'mtable',
  'mtr',
  'mtd',
];

const ALLOWED_MARKDOWN_ATTRIBUTES = [
  'class',
  'style',
  'align',
  'start',
  'xmlns',
  'display',
  'mathvariant',
  'linethickness',
  'stretchy',
  'columnalign',
];

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const GREEK_AND_SYMBOLS: Record<string, { tag: 'mi' | 'mo'; char: string }> = {
  // Lettere greche minuscole
  alpha: { tag: 'mi', char: 'α' },
  beta: { tag: 'mi', char: 'β' },
  gamma: { tag: 'mi', char: 'γ' },
  delta: { tag: 'mi', char: 'δ' },
  epsilon: { tag: 'mi', char: 'ϵ' },
  varepsilon: { tag: 'mi', char: 'ε' },
  zeta: { tag: 'mi', char: 'ζ' },
  eta: { tag: 'mi', char: 'η' },
  theta: { tag: 'mi', char: 'θ' },
  vartheta: { tag: 'mi', char: 'ϑ' },
  iota: { tag: 'mi', char: 'ι' },
  kappa: { tag: 'mi', char: 'κ' },
  lambda: { tag: 'mi', char: 'λ' },
  mu: { tag: 'mi', char: 'μ' },
  nu: { tag: 'mi', char: 'ν' },
  xi: { tag: 'mi', char: 'ξ' },
  pi: { tag: 'mi', char: 'π' },
  rho: { tag: 'mi', char: 'ρ' },
  sigma: { tag: 'mi', char: 'σ' },
  tau: { tag: 'mi', char: 'τ' },
  upsilon: { tag: 'mi', char: 'υ' },
  phi: { tag: 'mi', char: 'ϕ' },
  varphi: { tag: 'mi', char: 'φ' },
  chi: { tag: 'mi', char: 'χ' },
  psi: { tag: 'mi', char: 'ψ' },
  omega: { tag: 'mi', char: 'ω' },
  // Lettere greche maiuscole
  Gamma: { tag: 'mi', char: 'Γ' },
  Delta: { tag: 'mi', char: 'Δ' },
  Theta: { tag: 'mi', char: 'Θ' },
  Lambda: { tag: 'mi', char: 'Λ' },
  Xi: { tag: 'mi', char: 'Ξ' },
  Pi: { tag: 'mi', char: 'Π' },
  Sigma: { tag: 'mi', char: 'Σ' },
  Upsilon: { tag: 'mi', char: 'Υ' },
  Phi: { tag: 'mi', char: 'Φ' },
  Psi: { tag: 'mi', char: 'Ψ' },
  Omega: { tag: 'mi', char: 'Ω' },
  // Costanti e simboli speciali
  infty: { tag: 'mi', char: '∞' },
  emptyset: { tag: 'mi', char: '∅' },
  varnothing: { tag: 'mi', char: '∅' },
  partial: { tag: 'mi', char: '∂' },
  nabla: { tag: 'mi', char: '∇' },
  forall: { tag: 'mo', char: '∀' },
  exists: { tag: 'mo', char: '∃' },
  nexists: { tag: 'mo', char: '∄' },
  // Operatori aritmetici e relazionali
  le: { tag: 'mo', char: '≤' },
  leq: { tag: 'mo', char: '≤' },
  ge: { tag: 'mo', char: '≥' },
  geq: { tag: 'mo', char: '≥' },
  neq: { tag: 'mo', char: '≠' },
  ne: { tag: 'mo', char: '≠' },
  approx: { tag: 'mo', char: '≈' },
  equiv: { tag: 'mo', char: '≡' },
  sim: { tag: 'mo', char: '∼' },
  simeq: { tag: 'mo', char: '≃' },
  propto: { tag: 'mo', char: '∝' },
  ll: { tag: 'mo', char: '≪' },
  gg: { tag: 'mo', char: '≫' },
  cdot: { tag: 'mo', char: '⋅' },
  times: { tag: 'mo', char: '×' },
  div: { tag: 'mo', char: '÷' },
  pm: { tag: 'mo', char: '±' },
  mp: { tag: 'mo', char: '∓' },
  ast: { tag: 'mo', char: '∗' },
  star: { tag: 'mo', char: '⋆' },
  circ: { tag: 'mo', char: '∘' },
  bullet: { tag: 'mo', char: '∙' },
  oplus: { tag: 'mo', char: '⊕' },
  otimes: { tag: 'mo', char: '⊗' },
  // Insiemistica e logica
  in: { tag: 'mo', char: '∈' },
  notin: { tag: 'mo', char: '∉' },
  ni: { tag: 'mo', char: '∋' },
  subset: { tag: 'mo', char: '⊂' },
  subseteq: { tag: 'mo', char: '⊆' },
  supset: { tag: 'mo', char: '⊃' },
  supseteq: { tag: 'mo', char: '⊇' },
  cup: { tag: 'mo', char: '∪' },
  cap: { tag: 'mo', char: '∩' },
  setminus: { tag: 'mo', char: '∖' },
  land: { tag: 'mo', char: '∧' },
  wedge: { tag: 'mo', char: '∧' },
  lor: { tag: 'mo', char: '∨' },
  vee: { tag: 'mo', char: '∨' },
  neg: { tag: 'mo', char: '¬' },
  lnot: { tag: 'mo', char: '¬' },
  // Frecce
  to: { tag: 'mo', char: '→' },
  rightarrow: { tag: 'mo', char: '→' },
  leftarrow: { tag: 'mo', char: '←' },
  gets: { tag: 'mo', char: '←' },
  leftrightarrow: { tag: 'mo', char: '↔' },
  implies: { tag: 'mo', char: '⟹' },
  Rightarrow: { tag: 'mo', char: '⇒' },
  Leftarrow: { tag: 'mo', char: '⇐' },
  iff: { tag: 'mo', char: '⟺' },
  Leftrightarrow: { tag: 'mo', char: '⇔' },
  mapsto: { tag: 'mo', char: '↦' },
  uparrow: { tag: 'mo', char: '↑' },
  downarrow: { tag: 'mo', char: '↓' },
  // Delimitatori e puntini
  lfloor: { tag: 'mo', char: '⌊' },
  rfloor: { tag: 'mo', char: '⌋' },
  lceil: { tag: 'mo', char: '⌈' },
  rceil: { tag: 'mo', char: '⌉' },
  langle: { tag: 'mo', char: '⟨' },
  rangle: { tag: 'mo', char: '⟩' },
  dots: { tag: 'mo', char: '…' },
  ldots: { tag: 'mo', char: '…' },
  cdots: { tag: 'mo', char: '⋯' },
  vdots: { tag: 'mo', char: '⋮' },
  ddots: { tag: 'mo', char: '⋱' },
  mid: { tag: 'mo', char: '∣' },
  parallel: { tag: 'mo', char: '∥' },
};

const BIG_OPERATORS: Record<string, string> = {
  sum: '∑',
  prod: '∏',
  coprod: '∐',
  int: '∫',
  bigcup: '⋃',
  bigcap: '⋂',
  bigoplus: '⨁',
  bigotimes: '⨂',
  lim: 'lim',
  sup: 'sup',
  inf: 'inf',
};

const NAMED_FUNCTIONS = new Set([
  'log',
  'ln',
  'lg',
  'sin',
  'cos',
  'tan',
  'arcsin',
  'arccos',
  'arctan',
  'min',
  'max',
  'gcd',
  'lcm',
  'det',
  'dim',
  'deg',
  'exp',
  'mod',
  'bmod',
]);

const IGNORED_MODIFIERS = new Set([
  'left',
  'right',
  'big',
  'Big',
  'bigg',
  'Bigg',
  'bigl',
  'bigr',
  'Bigl',
  'Bigr',
  'displaystyle',
  'textstyle',
  'scriptstyle',
  'limits',
  'nolimits',
]);

function readBracedGroup(src: string, startIndex: number): { content: string; nextIndex: number } | null {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) {
    i++;
  }
  if (i >= src.length || src[i] !== '{') {
    return null;
  }
  i++;
  let depth = 1;
  let content = '';
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length) {
      content += ch + src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '{') {
      depth++;
      content += ch;
    } else if (ch === '}') {
      depth--;
      if (depth > 0) {
        content += ch;
      }
    } else {
      content += ch;
    }
    i++;
  }
  return { content, nextIndex: i };
}

function readBracketGroup(src: string, startIndex: number): { content: string; nextIndex: number } | null {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) {
    i++;
  }
  if (i >= src.length || src[i] !== '[') {
    return null;
  }
  i++;
  let depth = 1;
  let content = '';
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '[') {
      depth++;
      content += ch;
    } else if (ch === ']') {
      depth--;
      if (depth > 0) {
        content += ch;
      }
    } else {
      content += ch;
    }
    i++;
  }
  return { content, nextIndex: i };
}

function wrapSingleMathNode(innerMathMl: string): string {
  const topLevelTags = innerMathMl.match(/^<([a-zA-Z0-9]+)(?:\s[^>]*)?>[^<]*<\/\1>$/);
  if (topLevelTags) {
    return innerMathMl;
  }
  return `<mrow>${innerMathMl}</mrow>`;
}

interface ParsedMathAtom {
  mathml: string;
  isBigOperator?: boolean;
  nextIndex: number;
}

function parseSingleMathAtom(latex: string, startIndex: number): ParsedMathAtom | null {
  let i = startIndex;
  while (i < latex.length && /\s/.test(latex[i])) {
    i++;
  }
  if (i >= latex.length) {
    return null;
  }

  const ch = latex[i];

  if (ch === '{') {
    const group = readBracedGroup(latex, i);
    if (group) {
      return {
        mathml: wrapSingleMathNode(convertLatexToMathMLBody(group.content)),
        nextIndex: group.nextIndex,
      };
    }
    return { mathml: '<mrow></mrow>', nextIndex: i + 1 };
  }

  if (ch === '\\') {
    if (i + 1 < latex.length && !/[a-zA-Z]/.test(latex[i + 1])) {
      const esc = latex[i + 1];
      if (esc === '{' || esc === '}' || esc === '%' || esc === '_' || esc === '#' || esc === '&' || esc === '$') {
        return { mathml: `<mo>${escapeHtml(esc)}</mo>`, nextIndex: i + 2 };
      }
      if (esc === '|') {
        return { mathml: '<mo>‖</mo>', nextIndex: i + 2 };
      }
      if (esc === ',' || esc === ';' || esc === ':' || esc === ' ') {
        return { mathml: '<mspace width="0.167em"></mspace>', nextIndex: i + 2 };
      }
      if (esc === '!') {
        return { mathml: '', nextIndex: i + 2 };
      }
      return { mathml: `<mo>${escapeHtml(esc)}</mo>`, nextIndex: i + 2 };
    }

    const cmdMatch = latex.slice(i + 1).match(/^([a-zA-Z]+)/);
    if (cmdMatch) {
      const cmd = cmdMatch[1];
      i += 1 + cmd.length;

      if (IGNORED_MODIFIERS.has(cmd)) {
        // \left. o \right. usano il punto come delimitatore vuoto
        while (i < latex.length && /\s/.test(latex[i])) i++;
        if (latex[i] === '.') {
          return { mathml: '', nextIndex: i + 1 };
        }
        return parseSingleMathAtom(latex, i);
      }

      if (cmd === 'quad' || cmd === 'qquad') {
        return {
          mathml: `<mspace width="${cmd === 'quad' ? '1em' : '2em'}"></mspace>`,
          nextIndex: i,
        };
      }

      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        const numGroup = readBracedGroup(latex, i);
        if (numGroup) {
          i = numGroup.nextIndex;
          const denGroup = readBracedGroup(latex, i);
          if (denGroup) {
            i = denGroup.nextIndex;
            return {
              mathml: `<mfrac>${wrapSingleMathNode(convertLatexToMathMLBody(numGroup.content))}${wrapSingleMathNode(convertLatexToMathMLBody(denGroup.content))}</mfrac>`,
              nextIndex: i,
            };
          }
          return {
            mathml: `<mfrac>${wrapSingleMathNode(convertLatexToMathMLBody(numGroup.content))}<mrow></mrow></mfrac>`,
            nextIndex: i,
          };
        }
      }

      if (cmd === 'sqrt') {
        const optRoot = readBracketGroup(latex, i);
        if (optRoot) {
          i = optRoot.nextIndex;
          const radGroup = readBracedGroup(latex, i);
          if (radGroup) {
            return {
              mathml: `<mroot>${wrapSingleMathNode(convertLatexToMathMLBody(radGroup.content))}${wrapSingleMathNode(convertLatexToMathMLBody(optRoot.content))}</mroot>`,
              nextIndex: radGroup.nextIndex,
            };
          }
          const singleRad = parseSingleMathAtom(latex, i);
          if (singleRad) {
            return {
              mathml: `<mroot>${singleRad.mathml}${wrapSingleMathNode(convertLatexToMathMLBody(optRoot.content))}</mroot>`,
              nextIndex: singleRad.nextIndex,
            };
          }
        }
        const radGroup = readBracedGroup(latex, i);
        if (radGroup) {
          return {
            mathml: `<msqrt>${convertLatexToMathMLBody(radGroup.content)}</msqrt>`,
            nextIndex: radGroup.nextIndex,
          };
        }
        const singleRad = parseSingleMathAtom(latex, i);
        if (singleRad) {
          return {
            mathml: `<msqrt>${singleRad.mathml}</msqrt>`,
            nextIndex: singleRad.nextIndex,
          };
        }
        return { mathml: '<msqrt></msqrt>', nextIndex: i };
      }

      if (cmd === 'text' || cmd === 'textrm' || cmd === 'mbox') {
        const grp = readBracedGroup(latex, i);
        if (grp) {
          return {
            mathml: `<mtext>${escapeHtml(grp.content)}</mtext>`,
            nextIndex: grp.nextIndex,
          };
        }
      }

      if (cmd === 'mathrm' || cmd === 'operatorname') {
        const grp = readBracedGroup(latex, i);
        if (grp) {
          return {
            mathml: `<mi mathvariant="normal">${escapeHtml(grp.content)}</mi>`,
            nextIndex: grp.nextIndex,
          };
        }
      }

      if (cmd === 'mathbf' || cmd === 'boldsymbol') {
        const grp = readBracedGroup(latex, i);
        if (grp) {
          return {
            mathml: `<mi mathvariant="bold">${escapeHtml(grp.content)}</mi>`,
            nextIndex: grp.nextIndex,
          };
        }
      }

      if (cmd === 'mathcal') {
        const grp = readBracedGroup(latex, i);
        if (grp) {
          return {
            mathml: `<mi mathvariant="script">${escapeHtml(grp.content)}</mi>`,
            nextIndex: grp.nextIndex,
          };
        }
      }

      if (cmd === 'mathbb') {
        const grp = readBracedGroup(latex, i);
        if (grp) {
          return {
            mathml: `<mi mathvariant="double-struck">${escapeHtml(grp.content)}</mi>`,
            nextIndex: grp.nextIndex,
          };
        }
      }

      if (cmd === 'begin') {
        const envGrp = readBracedGroup(latex, i);
        if (envGrp) {
          const envName = envGrp.content.trim();
          const endMarker = `\\end{${envName}}`;
          const endPos = latex.indexOf(endMarker, envGrp.nextIndex);
          const bodyEnd = endPos !== -1 ? endPos : latex.length;
          const nextIdx = endPos !== -1 ? endPos + endMarker.length : latex.length;
          const envBody = latex.slice(envGrp.nextIndex, bodyEnd);
          return {
            mathml: renderLatexEnvironmentToMathML(envName, envBody),
            nextIndex: nextIdx,
          };
        }
      }

      if (cmd in BIG_OPERATORS) {
        const opChar = BIG_OPERATORS[cmd];
        const tag = /^[a-zA-Z]+$/.test(opChar) ? 'mi' : 'mo';
        const attr = tag === 'mi' ? ' mathvariant="normal"' : '';
        return {
          mathml: `<${tag}${attr}>${escapeHtml(opChar)}</${tag}>`,
          isBigOperator: true,
          nextIndex: i,
        };
      }

      if (NAMED_FUNCTIONS.has(cmd)) {
        const label = cmd === 'bmod' ? 'mod' : cmd;
        const tag = cmd === 'bmod' || cmd === 'mod' ? 'mo' : 'mi';
        const attr = tag === 'mi' ? ' mathvariant="normal"' : '';
        return {
          mathml: `<${tag}${attr}>${escapeHtml(label)}</${tag}>`,
          nextIndex: i,
        };
      }

      if (cmd in GREEK_AND_SYMBOLS) {
        const sym = GREEK_AND_SYMBOLS[cmd];
        return {
          mathml: `<${sym.tag}>${escapeHtml(sym.char)}</${sym.tag}>`,
          nextIndex: i,
        };
      }

      return { mathml: `<mi>${escapeHtml(cmd)}</mi>`, nextIndex: i };
    }
    return { mathml: '', nextIndex: i + 1 };
  }

  if (/\d/.test(ch)) {
    const numMatch = latex.slice(i).match(/^\d+(?:[.,]\d+)?/);
    const numStr = numMatch ? numMatch[0] : ch;
    return {
      mathml: `<mn>${escapeHtml(numStr)}</mn>`,
      nextIndex: i + numStr.length,
    };
  }

  if (/[a-zA-Z]/.test(ch)) {
    return {
      mathml: `<mi>${escapeHtml(ch)}</mi>`,
      nextIndex: i + 1,
    };
  }

  return {
    mathml: `<mo>${escapeHtml(ch)}</mo>`,
    nextIndex: i + 1,
  };
}

function convertLatexToMathMLBody(latex: string): string {
  const nodes: string[] = [];
  let i = 0;

  while (i < latex.length) {
    while (i < latex.length && /\s/.test(latex[i])) {
      i++;
    }
    if (i >= latex.length) break;

    if (latex[i] === '_' || latex[i] === '^') {
      // Apice o pedice orfano
      i++;
      continue;
    }

    const baseAtom = parseSingleMathAtom(latex, i);
    if (!baseAtom) {
      break;
    }
    i = baseAtom.nextIndex;
    if (!baseAtom.mathml) {
      continue;
    }

    let subMl: string | null = null;
    let supMl: string | null = null;

    while (i < latex.length) {
      while (i < latex.length && /\s/.test(latex[i])) {
        i++;
      }
      if (latex[i] === '_' && subMl === null) {
        i++;
        const subAtom = parseSingleMathAtom(latex, i);
        if (subAtom) {
          subMl = subAtom.mathml || '<mrow></mrow>';
          i = subAtom.nextIndex;
          continue;
        }
      } else if (latex[i] === '^' && supMl === null) {
        i++;
        const supAtom = parseSingleMathAtom(latex, i);
        if (supAtom) {
          supMl = supAtom.mathml || '<mrow></mrow>';
          i = supAtom.nextIndex;
          continue;
        }
      } else if (latex[i] === "'") {
        supMl = '<mo>′</mo>';
        i++;
        continue;
      }
      break;
    }

    const baseWrapped = wrapSingleMathNode(baseAtom.mathml);
    if (subMl !== null && supMl !== null) {
      const tag = baseAtom.isBigOperator ? 'munderover' : 'msubsup';
      nodes.push(`<${tag}>${baseWrapped}${wrapSingleMathNode(subMl)}${wrapSingleMathNode(supMl)}</${tag}>`);
    } else if (subMl !== null) {
      const tag = baseAtom.isBigOperator ? 'munder' : 'msub';
      nodes.push(`<${tag}>${baseWrapped}${wrapSingleMathNode(subMl)}</${tag}>`);
    } else if (supMl !== null) {
      const tag = baseAtom.isBigOperator ? 'mover' : 'msup';
      nodes.push(`<${tag}>${baseWrapped}${wrapSingleMathNode(supMl)}</${tag}>`);
    } else {
      nodes.push(baseAtom.mathml);
    }
  }

  return nodes.join('');
}

function splitLatexTopLevel(src: string, delimiter: '\\\\' | '&'): string[] {
  const parts: string[] = [];
  let current = '';
  let braceDepth = 0;
  let envDepth = 0;
  let i = 0;

  while (i < src.length) {
    if (src.startsWith('\\begin{', i)) {
      envDepth++;
    } else if (src.startsWith('\\end{', i) && envDepth > 0) {
      envDepth--;
    }

    if (src[i] === '{') {
      braceDepth++;
      current += src[i];
      i++;
      continue;
    }
    if (src[i] === '}' && braceDepth > 0) {
      braceDepth--;
      current += src[i];
      i++;
      continue;
    }

    if (braceDepth === 0 && envDepth === 0) {
      if (delimiter === '\\\\' && src.startsWith('\\\\', i)) {
        parts.push(current);
        current = '';
        i += 2;
        continue;
      }
      if (delimiter === '&' && src[i] === '&') {
        parts.push(current);
        current = '';
        i++;
        continue;
      }
    }

    current += src[i];
    i++;
  }

  parts.push(current);
  return parts;
}

function renderLatexEnvironmentToMathML(envName: string, envBody: string): string {
  const rawRows = splitLatexTopLevel(envBody.trim(), '\\\\').filter(
    (row, idx, arr) => idx < arr.length - 1 || row.trim().length > 0
  );
  const trNodes = rawRows.map((row) => {
    const cells = splitLatexTopLevel(row, '&');
    const tdNodes = cells.map((cell) => `<mtd>${convertLatexToMathMLBody(cell.trim())}</mtd>`);
    return `<mtr>${tdNodes.join('')}</mtr>`;
  });

  const alignAttr = envName === 'cases' || envName === 'aligned' ? ' columnalign="left"' : '';
  const mtable = `<mtable${alignAttr}>${trNodes.join('')}</mtable>`;

  if (envName === 'pmatrix') {
    return `<mrow><mo>(</mo>${mtable}<mo>)</mo></mrow>`;
  }
  if (envName === 'bmatrix') {
    return `<mrow><mo>[</mo>${mtable}<mo>]</mo></mrow>`;
  }
  if (envName === 'Bmatrix') {
    return `<mrow><mo>{</mo>${mtable}<mo>}</mo></mrow>`;
  }
  if (envName === 'vmatrix') {
    return `<mrow><mo>|</mo>${mtable}<mo>|</mo></mrow>`;
  }
  if (envName === 'Vmatrix') {
    return `<mrow><mo>‖</mo>${mtable}<mo>‖</mo></mrow>`;
  }
  if (envName === 'cases') {
    return `<mrow><mo>{</mo>${mtable}</mrow>`;
  }
  return mtable;
}

function renderMathElement(latex: string, displayMode: 'inline' | 'block'): string {
  const body = convertLatexToMathMLBody(latex.trim());
  const mathTag = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${displayMode}">${body}</math>`;
  if (displayMode === 'block') {
    return `<div class="tm-math-block">${mathTag}</div>`;
  }
  return mathTag;
}

function isLikelyInlineMathContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  // Evita valori puramente numerici/valutari ($10, $10.50) o variabili shell tutte maiuscole ($PATH)
  if (/^\d+(?:[.,]\d+)?$/.test(trimmed)) return false;
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed) && trimmed.length > 1) return false;
  return true;
}

function consumeUnclosedDollarMath(src: string, dollarIndex: number): { latex: string; nextIndex: number } | null {
  const afterDollar = src.slice(dollarIndex + 1);
  // Una formula con $ non chiuso inizia con un comando LaTeX (es. $\frac{28}{2})
  if (!/^\\[a-zA-Z]+/.test(afterDollar)) {
    return null;
  }

  let i = dollarIndex + 1;
  let braceDepth = 0;
  let parenDepth = 0;

  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length && /[a-zA-Z]/.test(src[i + 1])) {
      i += 2;
      while (i < src.length && /[a-zA-Z]/.test(src[i])) {
        i++;
      }
      continue;
    }
    if (ch === '{') {
      braceDepth++;
      i++;
      continue;
    }
    if (ch === '}') {
      if (braceDepth > 0) {
        braceDepth--;
        i++;
        continue;
      }
      break;
    }
    if (ch === '(') {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === ')') {
      if (parenDepth > 0) {
        parenDepth--;
        i++;
        continue;
      }
      // Parentesi chiusa esterna alla formula (es. "(es. $\frac{28}{2})")
      break;
    }
    if (braceDepth === 0 && parenDepth === 0) {
      if (/\s/.test(ch) || /[,.;:!?]/.test(ch)) {
        break;
      }
    }
    i++;
  }

  const latex = src.slice(dollarIndex + 1, i);
  if (latex.trim().length === 0) {
    return null;
  }
  return { latex, nextIndex: i };
}

function consumeBareStructuralMacro(
  src: string,
  backslashIndex: number
): { latex: string; nextIndex: number } | null {
  const afterSlash = src.slice(backslashIndex + 1);
  const cmdMatch = afterSlash.match(/^(frac|dfrac|tfrac|sqrt|mathcal|begin)\b/);
  if (!cmdMatch) {
    return null;
  }

  const cmd = cmdMatch[1];
  let cursor = backslashIndex + 1 + cmd.length;

  if (cmd === 'begin') {
    const envGrp = readBracedGroup(src, cursor);
    if (!envGrp) return null;
    const envName = envGrp.content.trim();
    const endMarker = `\\end{${envName}}`;
    const endPos = src.indexOf(endMarker, envGrp.nextIndex);
    if (endPos === -1) return null;
    const endIdx = endPos + endMarker.length;
    return { latex: src.slice(backslashIndex, endIdx), nextIndex: endIdx };
  }

  if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
    const g1 = readBracedGroup(src, cursor);
    if (!g1) return null;
    const g2 = readBracedGroup(src, g1.nextIndex);
    if (!g2) return null;
    return { latex: src.slice(backslashIndex, g2.nextIndex), nextIndex: g2.nextIndex };
  }

  if (cmd === 'sqrt') {
    const opt = readBracketGroup(src, cursor);
    if (opt) {
      cursor = opt.nextIndex;
    }
    const g1 = readBracedGroup(src, cursor);
    if (!g1) return null;
    return { latex: src.slice(backslashIndex, g1.nextIndex), nextIndex: g1.nextIndex };
  }

  if (cmd === 'mathcal') {
    const g1 = readBracedGroup(src, cursor);
    if (!g1) return null;
    let end = g1.nextIndex;
    // Se seguito da ( ... ), include l'argomento di complessità es. \mathcal{O}(n^2)
    if (src[end] === '(') {
      let depth = 1;
      let j = end + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        end = j;
      }
    }
    return { latex: src.slice(backslashIndex, end), nextIndex: end };
  }

  return null;
}

function splitTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) {
    trimmed = trimmed.slice(0, -1);
  }
  const cells: string[] = [];
  let cur = '';
  for (let j = 0; j < trimmed.length; j++) {
    if (trimmed[j] === '\\' && j + 1 < trimmed.length && trimmed[j + 1] === '|') {
      cur += '|';
      j++;
    } else if (trimmed[j] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += trimmed[j];
    }
  }
  cells.push(cur.trim());
  return cells;
}

function isTableDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-') || !trimmed.includes('|')) {
    return false;
  }
  const cells = splitTableCells(trimmed);
  if (cells.length === 0) {
    return false;
  }
  return cells.every((cell) => /^\s*:?-{1,}:?\s*$/.test(cell));
}

function parseTableAlignments(delimiterLine: string): ('left' | 'center' | 'right' | null)[] {
  const cells = splitTableCells(delimiterLine);
  return cells.map((cell) => {
    const trimmed = cell.trim();
    const starts = trimmed.startsWith(':');
    const ends = trimmed.endsWith(':');
    if (starts && ends) return 'center';
    if (ends) return 'right';
    if (starts) return 'left';
    return null;
  });
}

export function formatInlineMarkdown(line: string): string {
  if (!line) {
    return '';
  }

  const tokens: { placeholder: string; html: string }[] = [];

  // 1. Estrai codice inline `...` (conservando sintassi letterale interna)
  const withCodeTokens = line.replace(/`([^`]+)`/g, (_match, codeContent) => {
    const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
    tokens.push({
      placeholder,
      html: `<code class="tm-md-inline-code">${escapeHtml(codeContent)}</code>`,
    });
    return placeholder;
  });

  // 2. Estrai formule matematiche inline o a blocco su riga singola
  let withMathTokens = '';
  let i = 0;

  while (i < withCodeTokens.length) {
    // Se incontriamo un segnaposto già inserito per il codice, saltalo intatto
    if (withCodeTokens.startsWith('\uE000TM_TK_', i)) {
      const endPlaceholder = withCodeTokens.indexOf('\uE000', i + 1);
      if (endPlaceholder !== -1) {
        withMathTokens += withCodeTokens.slice(i, endPlaceholder + 1);
        i = endPlaceholder + 1;
        continue;
      }
    }

    // 2a. Delimitatore a blocco su riga singola \[ ... \]
    if (withCodeTokens.startsWith('\\[', i)) {
      const closeIdx = withCodeTokens.indexOf('\\]', i + 2);
      const latex = closeIdx !== -1 ? withCodeTokens.slice(i + 2, closeIdx) : withCodeTokens.slice(i + 2);
      const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
      tokens.push({ placeholder, html: renderMathElement(latex, 'block') });
      withMathTokens += placeholder;
      i = closeIdx !== -1 ? closeIdx + 2 : withCodeTokens.length;
      continue;
    }

    // 2b. Delimitatore a blocco su riga singola $$ ... $$
    if (withCodeTokens.startsWith('$$', i)) {
      const closeIdx = withCodeTokens.indexOf('$$', i + 2);
      const latex = closeIdx !== -1 ? withCodeTokens.slice(i + 2, closeIdx) : withCodeTokens.slice(i + 2);
      if (latex.trim().length > 0) {
        const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
        tokens.push({ placeholder, html: renderMathElement(latex, 'block') });
        withMathTokens += placeholder;
        i = closeIdx !== -1 ? closeIdx + 2 : withCodeTokens.length;
        continue;
      }
    }

    // 2c. Delimitatore inline \( ... \)
    if (withCodeTokens.startsWith('\\(', i)) {
      const closeIdx = withCodeTokens.indexOf('\\)', i + 2);
      if (closeIdx !== -1) {
        const latex = withCodeTokens.slice(i + 2, closeIdx);
        const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
        tokens.push({ placeholder, html: renderMathElement(latex, 'inline') });
        withMathTokens += placeholder;
        i = closeIdx + 2;
        continue;
      }
    }

    // 2d. Delimitatore inline $ ... $ (non $$)
    if (withCodeTokens[i] === '$' && withCodeTokens[i + 1] !== '$') {
      let closeIdx = -1;
      let searchFrom = i + 1;
      while (searchFrom < withCodeTokens.length) {
        const candidate = withCodeTokens.indexOf('$', searchFrom);
        if (candidate === -1) break;
        if (withCodeTokens[candidate - 1] !== '\\') {
          closeIdx = candidate;
          break;
        }
        searchFrom = candidate + 1;
      }

      if (closeIdx !== -1) {
        const candidateLatex = withCodeTokens.slice(i + 1, closeIdx);
        if (
          !candidateLatex.includes('\uE000') &&
          !/^\s|\s$/.test(candidateLatex) &&
          isLikelyInlineMathContent(candidateLatex)
        ) {
          const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
          tokens.push({ placeholder, html: renderMathElement(candidateLatex, 'inline') });
          withMathTokens += placeholder;
          i = closeIdx + 1;
          continue;
        }
      }

      const unclosed = consumeUnclosedDollarMath(withCodeTokens, i);
      if (unclosed && !unclosed.latex.includes('\uE000')) {
        const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
        tokens.push({ placeholder, html: renderMathElement(unclosed.latex, 'inline') });
        withMathTokens += placeholder;
        i = unclosed.nextIndex;
        continue;
      }
    }

    // 2e. Macro strutturale nuda senza $ (es. \frac{28}{2}, \sqrt{16}, \mathcal{O}(n^2))
    if (withCodeTokens[i] === '\\') {
      const bare = consumeBareStructuralMacro(withCodeTokens, i);
      if (bare && !bare.latex.includes('\uE000')) {
        const placeholder = `\uE000TM_TK_${tokens.length}\uE000`;
        tokens.push({ placeholder, html: renderMathElement(bare.latex, 'inline') });
        withMathTokens += placeholder;
        i = bare.nextIndex;
        continue;
      }
    }

    withMathTokens += withCodeTokens[i];
    i++;
  }

  // 3. Esegui escape HTML sul testo (i token protetti \uE000TM_TK_n\uE000 non contengono caratteri da escapare)
  let formatted = escapeHtml(withMathTokens);

  // 4. Formattazione grassetto e corsivo
  // Grassetto + corsivo (***testo***)
  formatted = formatted.replace(/\*\*\*(?!\s)(.+?)(?<!\s)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Grassetto (**testo** o __testo__)
  formatted = formatted.replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(
    /(?<![\p{L}\p{N}_])__(?!\s)(.+?)(?<!\s)__(?![\p{L}\p{N}_])/gu,
    '<strong>$1</strong>'
  );

  // Corsivo (*testo* o _testo_ fuori da identificatori snake_case)
  formatted = formatted.replace(/(?<!\*)\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(
    /(?<![\p{L}\p{N}_])_(?!\s|_)([^_]+?)(?<!\s|_)_(?![\p{L}\p{N}_])/gu,
    '<em>$1</em>'
  );

  // 5. Ripristina tutti i token protetti
  for (const token of tokens) {
    formatted = formatted.replaceAll(token.placeholder, token.html);
  }

  return formatted;
}

export function renderMarkdownToSafeHtml(markdown: string): string {
  if (!markdown) {
    return '';
  }

  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const blocks: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Blocchi di codice racchiusi tra ``` (anche se ancora aperti durante lo streaming)
    const fenceMatch = line.match(/^\s*```([a-zA-Z0-9_+-]*)\s*$/);
    if (fenceMatch) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      // Consuma la riga di chiusura ``` se presente
      if (i < lines.length && /^\s*```\s*$/.test(lines[i])) {
        i++;
      }
      blocks.push(
        `<pre class="tm-md-pre"><code class="tm-md-code">${escapeHtml(codeLines.join('\n'))}</code></pre>`
      );
      continue;
    }

    // 2. Blocchi matematici multi-riga racchiusi tra $$ ... $$ o \[ ... \]
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('$$') || trimmedLine.startsWith('\\[')) {
      const openDelim = trimmedLine.startsWith('$$') ? '$$' : '\\[';
      const closeDelim = openDelim === '$$' ? '$$' : '\\]';
      const afterOpen = trimmedLine.slice(2);
      const sameLineClose = afterOpen.indexOf(closeDelim);

      if (sameLineClose !== -1 && afterOpen.slice(sameLineClose + 2).trim().length === 0) {
        blocks.push(renderMathElement(afterOpen.slice(0, sameLineClose), 'block'));
        i++;
        continue;
      }

      if (sameLineClose === -1) {
        const mathLines: string[] = [];
        if (afterOpen.trim().length > 0) {
          mathLines.push(afterOpen);
        }
        i++;
        while (i < lines.length) {
          const curLine = lines[i];
          const closeIdx = curLine.indexOf(closeDelim);
          if (closeIdx !== -1) {
            const beforeClose = curLine.slice(0, closeIdx);
            if (beforeClose.trim().length > 0) {
              mathLines.push(beforeClose);
            }
            i++;
            break;
          }
          mathLines.push(curLine);
          i++;
        }
        blocks.push(renderMathElement(mathLines.join('\n'), 'block'));
        continue;
      }
    }

    // 3. Righe vuote
    if (line.trim().length === 0) {
      i++;
      continue;
    }

    // 4. Separatore orizzontale (---, ***, ___)
    if (/^\s*(?:[-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(line)) {
      blocks.push('<hr />');
      i++;
      continue;
    }

    // 5. Intestazioni (# .. ######)
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // 6. Tabelle GFM (| col | col | seguito da riga separatore |---|---|)
    if (line.includes('|') && i + 1 < lines.length && isTableDelimiterRow(lines[i + 1])) {
      const headerLine = line;
      const delimiterLine = lines[i + 1];
      const alignments = parseTableAlignments(delimiterLine);
      const headerCells = splitTableCells(headerLine);

      const tableRows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().length > 0 && lines[i].includes('|')) {
        tableRows.push(splitTableCells(lines[i]));
        i++;
      }

      const theadHtml = `<thead><tr>${headerCells
        .map((cell, idx) => {
          const align = alignments[idx];
          const style = align ? ` style="text-align: ${align};"` : '';
          return `<th${style}>${formatInlineMarkdown(cell)}</th>`;
        })
        .join('')}</tr></thead>`;

      const tbodyHtml = `<tbody>${tableRows
        .map((row) => {
          const rowHtml = row
            .map((cell, idx) => {
              const align = alignments[idx];
              const style = align ? ` style="text-align: ${align};"` : '';
              return `<td${style}>${formatInlineMarkdown(cell)}</td>`;
            })
            .join('');
          return `<tr>${rowHtml}</tr>`;
        })
        .join('')}</tbody>`;

      blocks.push(
        `<div class="tm-table-wrapper"><table class="tm-md-table">${theadHtml}${tbodyHtml}</table></div>`
      );
      continue;
    }

    // 7. Citazioni (>)
    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push(
        `<blockquote><p>${quoteLines.map((q) => formatInlineMarkdown(q)).join('<br />')}</p></blockquote>`
      );
      continue;
    }

    // 8. Elenchi puntati o numerati (con supporto a voci multi-riga e sequenze con interlinee)
    const orderedMatch = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const unorderedMatch = !orderedMatch ? line.match(/^\s*([-*+])\s+(.*)$/) : null;

    if (orderedMatch || unorderedMatch) {
      const isOrdered = !!orderedMatch;
      const startNum = orderedMatch ? parseInt(orderedMatch[1], 10) : 1;
      const items: string[][] = [];

      items.push([orderedMatch ? orderedMatch[2] : unorderedMatch![2]]);
      i++;

      while (i < lines.length) {
        const curLine = lines[i];

        // Se riga vuota, guarda avanti per verificare se l'elenco prosegue
        if (curLine.trim().length === 0) {
          let nextIdx = i + 1;
          while (nextIdx < lines.length && lines[nextIdx].trim().length === 0) {
            nextIdx++;
          }
          if (nextIdx >= lines.length) {
            i = nextIdx;
            break;
          }

          const nextLine = lines[nextIdx];
          const nextIsItem = isOrdered
            ? /^\s*\d+[.)]\s+/.test(nextLine)
            : /^\s*[-*+]\s+/.test(nextLine);
          const nextIsContinuation = /^\s{2,}\S/.test(nextLine);

          if (nextIsItem || nextIsContinuation) {
            i = nextIdx;
            continue;
          } else {
            break;
          }
        }

        // Verifica se inizia una nuova voce dell'elenco
        const itemMatch = isOrdered
          ? curLine.match(/^\s*\d+[.)]\s+(.*)$/)
          : curLine.match(/^\s*[-*+]\s+(.*)$/);

        if (itemMatch) {
          items.push([itemMatch[1]]);
          i++;
          continue;
        }

        // Verifica se inizia un blocco strutturale che interrompe l'elenco
        if (
          /^\s*```/.test(curLine) ||
          /^\s*(\$\$|\\\[)/.test(curLine) ||
          /^\s*(?:[-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(curLine) ||
          /^\s*#{1,6}\s+/.test(curLine) ||
          /^\s*>\s?/.test(curLine) ||
          (isOrdered && /^\s*[-*+]\s+/.test(curLine)) ||
          (!isOrdered && /^\s*\d+[.)]\s+/.test(curLine)) ||
          (curLine.includes('|') && i + 1 < lines.length && isTableDelimiterRow(lines[i + 1]))
        ) {
          break;
        }

        // Riga di continuazione dell'elemento corrente
        const trimmedContinuation = curLine.replace(/^\s{1,4}/, '');
        items[items.length - 1].push(trimmedContinuation);
        i++;
      }

      const renderedItems = items.map((itemLines) => {
        const itemHtml = itemLines
          .map((l) => formatInlineMarkdown(l.trim()))
          .join('<br />');
        return `<li>${itemHtml}</li>`;
      });

      if (isOrdered) {
        const startAttr = startNum !== 1 ? ` start="${startNum}"` : '';
        blocks.push(`<ol${startAttr}>${renderedItems.join('')}</ol>`);
      } else {
        blocks.push(`<ul>${renderedItems.join('')}</ul>`);
      }
      continue;
    }

    // 9. Paragrafo ordinario (raggruppa righe consecutive non speciali)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !/^\s*```/.test(lines[i]) &&
      !/^\s*(\$\$|\\\[)/.test(lines[i]) &&
      !/^\s*(?:[-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(lines[i]) &&
      !/^\s*#{1,6}\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+.+$/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+.+$/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableDelimiterRow(lines[i + 1]))
    ) {
      paragraphLines.push(formatInlineMarkdown(lines[i]));
      i++;
    }

    blocks.push(`<p>${paragraphLines.join('<br />')}</p>`);
  }

  return blocks.join('');
}

export function setRenderedMarkdown(element: HTMLElement, markdown: string): void {
  const html = renderMarkdownToSafeHtml(markdown);
  const elWithSetHTML = element as HTMLElement & {
    setHTML?: (
      input: string,
      options?: { sanitizer?: { elements?: string[]; attributes?: string[] } }
    ) => void;
  };

  if (
    typeof Element !== 'undefined' &&
    'setHTML' in Element.prototype &&
    typeof elWithSetHTML.setHTML === 'function'
  ) {
    elWithSetHTML.setHTML(html, {
      sanitizer: {
        elements: ALLOWED_MARKDOWN_ELEMENTS,
        attributes: ALLOWED_MARKDOWN_ATTRIBUTES,
      },
    });
    if (html.includes('<math') && !element.querySelector('math')) {
      element.innerHTML = html;
    }
  } else {
    element.innerHTML = html;
  }
}
