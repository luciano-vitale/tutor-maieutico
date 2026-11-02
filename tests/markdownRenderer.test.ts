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

  test('renderizza tabelle Markdown GFM con intestazione, separatore e stili di allineamento senza degradare il DOM', () => {
    const container = document.createElement('div');
    const markdown = [
      'Devi riempire solo i **5 spazi vuoti**. Sono tutti concetti che già conosci:',
      '',
      '| Spazio | Domanda guida |',
      '|:---|:---:|',
      '| 1° (inizio ciclo) | Da quale valore si parte a cercare divisori? |',
      '| 2° (fine ciclo, `<`) | Fino a dove vai? Ricorda: **escluso** `n` stesso. |',
      '| 3° (condizione `if`) | Come dici in Java che `d` divide `n` senza resto? |',
      '| 4° (`sum += ___`) | Cosa aggiungi alla somma quando la condizione è vera? |',
      '| 5° (`return ___`) | Quando il numero è perfetto, cosa confronti con `n`? |',
      '',
      'Riempi quei 5 spazi e incollali qui.',
    ].join('\n');

    setRenderedMarkdown(container, markdown);

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    const ths = container.querySelectorAll('th');
    expect(ths).toHaveLength(2);
    expect(ths[0].textContent?.trim()).toBe('Spazio');
    expect(ths[1].textContent?.trim()).toBe('Domanda guida');

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(5);

    // Verifica formattazione inline nelle celle (grassetto, codice inline, entità HTML)
    const secondRowTds = rows[1].querySelectorAll('td');
    expect(secondRowTds[0].textContent).toContain('<');
    expect(secondRowTds[1].querySelector('strong')?.textContent).toBe('escluso');
    expect(secondRowTds[1].querySelector('code')?.textContent).toBe('n');

    // Verifica che l'HTML sicuro conservi il wrapper e non ricada in <p> con pipe
    const rawHtml = renderMarkdownToSafeHtml(markdown);
    expect(rawHtml).toContain('<table');
    expect(rawHtml).toContain('<tbody>');
  });

  test('renderizza elenchi numerati con spiegazioni multi-riga e interlinee mantenendo un unico tag ol e numerazione coerente', () => {
    const container = document.createElement('div');
    const markdown = [
      'Prima di scrivere il codice, prova a rispondere a queste domande:',
      '',
      '1. **Come deve comportarsi il programma con l’input?**  ',
      '   Deve leggere un numero alla volta e continuare finché non ne ha trovati 3 perfetti?',
      '',
      '2. **Come puoi verificare se un numero `n` è perfetto?**  ',
      '   Per ogni possibile divisore `d`, come riconosci che `d` divide `n`?  ',
      '   E come accumuli la somma dei divisori propri di `n`?',
      '',
      '3. **Quali divisori devi considerare?**  ',
      '   Devi includere `1`?  ',
      '   Devi includere `n` stesso?  ',
      '   Fino a quale valore conviene cercare i divisori?',
      '',
      '4. **Come sai quando hai trovato 3 numeri perfetti?**  ',
      '   Quale variabile ti serve per contare quanti perfetti hai già incontrato?',
      '',
      '5. **Cosa succede se l’input contiene numeri non adatti, ad esempio `0`, numeri negativi o `1`?**  ',
      '   Il problema parla di interi positivi: come vuoi gestire questi casi?',
      '',
      '6. **Quando visualizzi i numeri perfetti?**  ',
      '   Appena li trovi, oppure li conservi e li stampi alla fine?',
      '',
      'Un indizio utile: per verificare `n`, puoi sommare tutti i `d` tali che `d < n`.',
    ].join('\n');

    setRenderedMarkdown(container, markdown);

    const olElements = container.querySelectorAll('ol');
    expect(olElements).toHaveLength(1);

    const liElements = olElements[0].querySelectorAll('li');
    expect(liElements).toHaveLength(6);

    // La spiegazione della prima domanda deve essere contenuta nel primo li, non in un paragrafo separato esterno
    expect(liElements[0].textContent).toContain('Come deve comportarsi il programma con l’input?');
    expect(liElements[0].textContent).toContain('Deve leggere un numero alla volta');

    // Il paragrafo successivo alla lista non deve far parte dell'elenco
    expect(container.querySelector('p:last-of-type')?.textContent).toContain('Un indizio utile');
  });

  test('renderizza il grassetto contenente codice inline o formule matematiche senza spezzare i delimitatori asterisco', () => {
    const container = document.createElement('div');
    const markdown = [
      '2. **Come puoi verificare se un numero `n` è perfetto?**',
      '5. **Cosa succede se l’input contiene numeri non adatti, ad esempio `0`, numeri negativi o `1`?**',
      'Formula: **Calcola $x^2 + 1$ adesso** con attenzione.',
    ].join('\n');

    setRenderedMarkdown(container, markdown);

    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBeGreaterThanOrEqual(3);

    // Il tag strong deve contenere il codice inline
    expect(strongs[0].querySelector('code')?.textContent).toBe('n');
    expect(strongs[0].textContent).toContain('Come puoi verificare se un numero');
    expect(strongs[0].textContent).toContain('è perfetto?');

    // Il tag strong della voce 5 deve racchiudere i codici `0` e `1`
    const codeInStrong1 = strongs[1].querySelectorAll('code');
    expect(codeInStrong1).toHaveLength(2);
    expect(codeInStrong1[0].textContent).toBe('0');
    expect(codeInStrong1[1].textContent).toBe('1');

    // Nessun asterisco grezzo residuo
    expect(container.textContent).not.toContain('**');

    // Verifica formula matematica dentro strong
    expect(strongs[2].querySelector('math')).not.toBeNull();
    expect(strongs[2].textContent).toContain('Calcola');
    expect(strongs[2].textContent).toContain('adesso');
  });
});
