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
];

const ALLOWED_MARKDOWN_ATTRIBUTES = ['class'];

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTextSegment(rawSegment: string): string {
  let text = escapeHtml(rawSegment);

  // Grassetto + corsivo (***testo***)
  text = text.replace(/\*\*\*(?!\s)(.+?)(?<!\s)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Grassetto (**testo** o __testo__)
  text = text.replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '<strong>$1</strong>');
  text = text.replace(
    /(?<![\p{L}\p{N}_])__(?!\s)(.+?)(?<!\s)__(?![\p{L}\p{N}_])/gu,
    '<strong>$1</strong>'
  );

  // Corsivo (*testo* o _testo_ fuori da identificatori snake_case)
  text = text.replace(/(?<!\*)\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(
    /(?<![\p{L}\p{N}_])_(?!\s|_)([^_]+?)(?<!\s|_)_(?![\p{L}\p{N}_])/gu,
    '<em>$1</em>'
  );

  return text;
}

export function formatInlineMarkdown(line: string): string {
  const parts: string[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineCodeRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatTextSegment(line.slice(lastIndex, match.index)));
    }
    parts.push(`<code class="tm-md-inline-code">${escapeHtml(match[1])}</code>`);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(formatTextSegment(line.slice(lastIndex)));
  }

  return parts.join('');
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

    // 2. Righe vuote
    if (line.trim().length === 0) {
      i++;
      continue;
    }

    // 3. Separatore orizzontale (---, ***, ___)
    if (/^\s*(?:[-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(line)) {
      blocks.push('<hr />');
      i++;
      continue;
    }

    // 4. Intestazioni (# .. ######)
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // 5. Citazioni (>)
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

    // 6. Elenchi puntati (- o *)
    if (/^\s*[-*]\s+.+$/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+.+$/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
        items.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
        i++;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // 7. Elenchi numerati (1. o 1))
    if (/^\s*\d+[.)]\s+.+$/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+.+$/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+[.)]\s+/, '');
        items.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
        i++;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // 8. Paragrafo ordinario (raggruppa righe consecutive non speciali)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !/^\s*```/.test(lines[i]) &&
      !/^\s*(?:[-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(lines[i]) &&
      !/^\s*#{1,6}\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+.+$/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+.+$/.test(lines[i])
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
  } else {
    element.innerHTML = html;
  }
}
