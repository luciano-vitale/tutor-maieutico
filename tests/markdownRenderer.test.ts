import { describe, expect, test } from 'vitest';
import { renderMarkdownToSafeHtml, setRenderedMarkdown } from '../src/ui/markdownRenderer';

describe('markdownRenderer - rendering matematico LaTeX in MathML', () => {
  test('renderizza frazioni LaTeX inline chiuse ($...$, \\(...\\)) e tronche prima di parentesi o fine riga (es. $\\frac{28}{2}) senza alterare valute o variabili ($10, $PATH)', () => {
    const container = document.createElement('div');
    const markdown =
      'Calcola $\\frac{28}{2}$ oppure \\(\\frac{n}{2}\\) e nota il caso (es. $\\frac{28}{2}) mentre il costo è $10 su $PATH.';

    setRenderedMarkdown(container, markdown);

    const mathNodes = container.querySelectorAll('math');
    expect(mathNodes).toHaveLength(3);

    const firstFrac = mathNodes[0].querySelector('mfrac');
    expect(firstFrac).not.toBeNull();
    expect(firstFrac?.children[0]?.tagName.toLowerCase()).toBe('mn');
    expect(firstFrac?.children[0]?.textContent).toBe('28');
    expect(firstFrac?.children[1]?.tagName.toLowerCase()).toBe('mn');
    expect(firstFrac?.children[1]?.textContent).toBe('2');

    const secondFrac = mathNodes[1].querySelector('mfrac');
    expect(secondFrac?.children[0]?.textContent).toBe('n');
    expect(secondFrac?.children[1]?.textContent).toBe('2');

    const thirdFrac = mathNodes[2].querySelector('mfrac');
    expect(thirdFrac?.children[0]?.textContent).toBe('28');
    expect(thirdFrac?.children[1]?.textContent).toBe('2');

    // Non deve comparire la sintassi grezza \frac né il $ delle formule matematiche
    expect(container.textContent).not.toContain('\\frac');
    expect(container.textContent).toContain('(es. ');
    expect(container.textContent).toContain(')');
    // Valute e variabili shell restano testo normale
    expect(container.textContent).toContain('$10');
    expect(container.textContent).toContain('$PATH');
    expect(renderMarkdownToSafeHtml(markdown)).toContain('<mfrac>');
  });

  test('renderizza esponenti, pedici, radici, sommatorie, complessità asintotica, simboli logici/relazionali, greco e macro strutturali nude preservando il codice inline e a blocco', () => {
    const container = document.createElement('div');
    const markdown = [
      'Complessità $\\mathcal{O}(n \\log n)$ e anche nuda \\mathcal{O}(n^2) o frazione nuda \\frac{28}{2} e radice nuda \\sqrt{16}.',
      'Sommatoria $\\sum_{i=0}^{n-1} a_i^2 \\le \\sqrt[3]{x_{k+1}} \\cdot \\pi \\pm \\infty$ con $\\lfloor \\frac{n}{2} \\rfloor$ e $\\text{indice} \\neq 0 \\implies x \\in A \\cup B$.',
      'Nel codice inline `$\\frac{28}{2}$` e nel blocco:',
      '```cpp',
      '// Non toccare $\\frac{28}{2}$ né \\sqrt{x}',
      'int m = 28 / 2;',
      '```',
    ].join('\n');

    setRenderedMarkdown(container, markdown);

    // Verifica radice quadrata (<msqrt>) e radice cubica (<mroot>)
    expect(container.querySelector('msqrt')).not.toBeNull();
    const mroot = container.querySelector('mroot');
    expect(mroot).not.toBeNull();
    expect(mroot?.children[1]?.textContent).toBe('3');

    // Verifica apici (<msup>), pedici (<msub>) e combinati (<msubsup> o <munderover>)
    expect(container.querySelector('msup')).not.toBeNull();
    expect(container.querySelector('msub')).not.toBeNull();
    expect(container.querySelector('msubsup')).not.toBeNull();
    expect(container.querySelector('munderover')).not.toBeNull();

    // Verifica simboli matematici convertiti in caratteri tipografici Unicode dentro <mo>/<mi>
    expect(container.textContent).toContain('∑');
    expect(container.textContent).toContain('≤');
    expect(container.textContent).toContain('⋅');
    expect(container.textContent).toContain('π');
    expect(container.textContent).toContain('±');
    expect(container.textContent).toContain('∞');
    expect(container.textContent).toContain('⌊');
    expect(container.textContent).toContain('⌋');
    expect(container.textContent).toContain('≠');
    expect(container.textContent).toContain('⟹');
    expect(container.textContent).toContain('∈');
    expect(container.textContent).toContain('∪');
    expect(container.querySelector('mtext')?.textContent).toBe('indice');

    // Il codice inline e il blocco pre/code conservano la sintassi letterale intatta
    expect(container.querySelector('p code')?.textContent).toBe('$\\frac{28}{2}$');
    expect(container.querySelector('pre code')?.textContent).toContain('// Non toccare $\\frac{28}{2}$ né \\sqrt{x}');
  });

  test('renderizza equazioni a blocco ($$...$$, \\[...\\]) anche multi-riga e ambienti cases/matrix in <mtable>, neutralizzando tentativi XSS dentro le formule', () => {
    const container = document.createElement('div');
    const markdown = [
      'Equazione su singola riga: $$T(n) = 2T\\left(\\frac{n}{2}\\right) + n$$',
      '\\[',
      'f(n) = \\begin{cases} \\frac{n}{2} & \\text{se pari} \\\\ 3n + 1 & \\text{se dispari} \\end{cases}',
      '\\]',
      'Matrice: $\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$ e sicurezza $\\frac{<script>alert(1)</script>}{\\text{<img src=x onerror=alert(1)>}}$',
    ].join('\n');

    setRenderedMarkdown(container, markdown);

    const mathBlocks = container.querySelectorAll('.tm-math-block math[display="block"]');
    expect(mathBlocks).toHaveLength(2);

    const tables = container.querySelectorAll('mtable');
    expect(tables).toHaveLength(2);
    expect(tables[0].querySelectorAll('mtr')).toHaveLength(2);
    expect(tables[0].querySelectorAll('mtd')).toHaveLength(4);
    expect(tables[0].textContent).toContain('se pari');

    expect(tables[1].querySelectorAll('mtr')).toHaveLength(2);
    expect(tables[1].querySelectorAll('mtd')).toHaveLength(4);

    // Nessun elemento malevolo creato nel DOM
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
