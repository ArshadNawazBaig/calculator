import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MarkdownManager} from '@tiptap/markdown';
import {getSchema, type JSONContent} from '@tiptap/core';
import {BlogMarkdown, blogContentUrl} from '@/components/blog/blog-markdown';
import {articleEditorUrl, createArticleEditorExtensions, hasArticleFootnotes, sanitizeArticleClipboardHtml, sanitizeArticleDocument, stripArticleHtml} from '@/lib/blog/editor';

function manager() {
  return new MarkdownManager({extensions: createArticleEditorExtensions(), markedOptions: {gfm: true}});
}
function parse(markdown: string) {
  return sanitizeArticleDocument(manager().parse(stripArticleHtml(markdown)));
}
function render(content: string) {
  return renderToStaticMarkup(<BlogMarkdown content={content}/>);
}

describe('article editor destinations share the public renderer boundary', () => {
  it.each([
    '/percent-calculator', '#assumptions', 'https://example.com/source', 'http://example.com/source', 'mailto:author@example.com',
    'javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,attack', 'data:image/svg+xml,attack', 'vbscript:msgbox(1)',
    '//example.com/image.png', '/\\example.com/image.png', 'https://user:password@example.com/source', 'https://example.com/a\nb',
    'https://example.com/a b', 'https://example.com/\u0000a', 'ftp://example.com/source', 'javascript&#58;alert(1)', '',
  ])('keeps link/image URL acceptance consistent for %s', value => {
    expect(articleEditorUrl(value)).toBe(blogContentUrl(value));
    expect(articleEditorUrl(value, true)).toBe(blogContentUrl(value, true));
  });
  it('does not require browser DOM APIs while server rendering', () => {
    expect(sanitizeArticleClipboardHtml('<p>Untrusted</p>')).toBe('');
  });
});

describe('safe Markdown import', () => {
  it('omits raw HTML while preserving fenced and inline code and escaped examples', () => {
    const content = '# Heading\n\nBefore <em>visible text</em> after.\n\n<script>globalThis.attack = true</script>\n\n<iframe src="https://example.com"></iframe>\n\n`<script>literal inline</script>`\n\n```html\n<img src=x onerror=alert(1)>\n```\n\n\\<safe example\\>';
    const stripped = stripArticleHtml(content);
    expect(stripped).toContain('Before visible text after.');
    expect(stripped).not.toContain('globalThis.attack');
    expect(stripped).not.toContain('<iframe');
    expect(stripped).toContain('`<script>literal inline</script>`');
    expect(stripped).toContain('```html\n<img src=x onerror=alert(1)>\n```');
    expect(stripped).toContain('\\<safe example\\>');
  });
  it('preserves useful GFM formatting and destinations through editing serialization', () => {
    const content = '# Imported heading\n\n## Worked example\n\n### Assumptions\n\nUse **bold**, *emphasis*, ~~old figures~~ and `inline code`.\n\n[Calculator](/percent-calculator) and [source](https://example.com/source).\n\n![Useful chart](/og.png "Chart title")\n\n- First assumption\n- Second assumption\n\n1. Enter the inputs\n2. Check the units\n\n> Results are estimates.\n\n| Input | Result |\n| --- | --- |\n| 20% of 50 | 10 |\n\n```js\nconst result = 50 * 0.2;\n```\n\n---';
    const document = parse(content);
    const serialized = manager().serialize(document);
    expect(render(serialized)).toBe(render(content));
    expect(serialized).toContain('# Imported heading');
    expect(serialized).toMatch(/\| Input +\| Result +\|/);
  });
  it('imports unsafe destinations as inert visible text without executing raw HTML', () => {
    const document = parse('Useful [unsafe link](javascript:alert(1)).\n\n![Unsafe image](data:image/svg+xml,attack)\n\n![](https://example.com/no-alt.png)\n\n<script>globalThis.attack = true</script>');
    const serialized = manager().serialize(document);
    const html = render(serialized);
    expect(html).toContain('unsafe link');
    expect(html).not.toMatch(/<script|javascript:|data:image|<img|globalThis\.attack/i);
    expect(JSON.stringify(document)).not.toMatch(/javascript:|data:image|no-alt\.png|globalThis\.attack/i);
  });
  it('preserves checked and unchecked GFM checklist items through an edit', () => {
    const content = '- [x] Check the formula\n- [ ] Check the units\n  - [x] Nested completed item';
    const serialized = manager().serialize(parse(content));
    expect(serialized).toContain('- [x] Check the formula');
    expect(serialized).toContain('- [ ] Check the units');
    expect(serialized).toContain('- [x] Nested completed item');
    expect(render(serialized)).toBe(render(content));
  });
  it.each([
    '![Helpful chart](/og.png "A labelled chart")',
    'Before ![Helpful chart](/og.png) after the illustration.',
    '| Aspect | Example |\n| --- | --- |\n| Result | ![Helpful chart](/og.png) |',
  ])('preserves standalone, inline and table images in a valid editable document', content => {
    const document = parse(content);
    const schema = getSchema(createArticleEditorExtensions());
    expect(() => schema.nodeFromJSON(document).check()).not.toThrow();
    expect(render(manager().serialize(document))).toBe(render(content));
  });
  it('preserves imported heading levels, table alignment and explicit line breaks', () => {
    const content = '#### Deeper explanation\n\nline one  \nline two\n\n| Input | Result |\n| :--- | ---: |\n| twenty | ten |';
    const serialized = manager().serialize(parse(content));
    expect(render(serialized)).toBe(render(content));
    expect(serialized).toContain('#### Deeper explanation');
  });
  it('supports attribute-free table cell breaks without enabling executable HTML or changing code examples', () => {
    const content = '| Input | Explanation |\n| --- | --- |\n| 50 | First line<br>Second line |\n\n`<br>`\n\n```html\n<br onclick="attack()">\n```';
    const stripped = stripArticleHtml(content + '\n\n<br onclick="attack()">\n\n<br style="color:red">');
    expect(stripped).toContain('First line<br>Second line');
    expect(stripped).toContain('`<br>`');
    expect(stripped).toContain('```html\n<br onclick="attack()">\n```');
    expect(stripped).not.toContain('\n\n<br onclick="attack()">');
    expect(stripped).not.toContain('<br style=');
    const html = render(content);
    expect(html).toMatch(/First line<br\/>\s*Second line/);
    expect(html).toContain('<code>&lt;br&gt;</code>');
    expect(html).not.toContain('<br onclick=');
  });
  it.each([
    'A fact[^1].\n\n[^1]: Explanation.',
    'A fact[^note].\n\n[^note]: This is a useful explanation with several words.',
    'A fact[^note].\n\n[^note]: The first paragraph.\n\n    A second paragraph.',
    'A fact[^日本語].\n\n[^日本語]: A source with context.',
  ])('detects real GFM footnotes so visual editing cannot silently drop them', content => {
    expect(hasArticleFootnotes(content)).toBe(true);
  });
  it.each([
    'Ordinary text and [a source][source].\n\n[source]: https://example.com',
    'An inline example: `[^note]: This is an example.`',
    '```md\n[^note]: This is an example.\n```',
    '    [^note]: This is an indented code example.',
    'A reference without a definition [^note].',
  ])('does not force source mode for ordinary references and code examples', content => {
    expect(hasArticleFootnotes(content)).toBe(false);
  });
});

describe('safe editor document serialization', () => {
  it('keeps supported text formatting while discarding active attributes, unsafe marks and unknown nodes', () => {
    const document: JSONContent = {type: 'doc', attrs: {onclick: 'attack()'}, content: [
      {type: 'paragraph', attrs: {style: 'color:red', onclick: 'attack()'}, content: [
        {type: 'text', text: 'Safe text', marks: [{type: 'bold'}, {type: 'underline'}, {type: 'link', attrs: {href: 'javascript:alert(1)', onclick: 'attack()'}}]},
        {type: 'text', text: 'safe source', marks: [{type: 'link', attrs: {href: '/percent-calculator', target: '_blank', onclick: 'attack()'}}]},
      ]},
      {type: 'iframe', attrs: {src: 'https://example.com'}},
      {type: 'image', attrs: {src: 'data:image/svg+xml,attack', alt: 'Visible fallback', onerror: 'attack()'}},
      {type: 'image', attrs: {src: '/og.png', alt: ' Helpful chart ', width: '100%', onerror: 'attack()'}},
    ]};
    const clean = sanitizeArticleDocument(document);
    const value = JSON.stringify(clean);
    expect(value).not.toMatch(/javascript:|data:image|onclick|onerror|iframe|underline|target|style|width/);
    expect(value).toContain('Visible fallback');
    expect(value).toContain('Helpful chart');
    const html = render(manager().serialize(clean));
    expect(html).toContain('<strong>Safe text</strong>');
    expect(html).toContain('href="/percent-calculator"');
    expect(html).toContain('src="/og.png"');
    expect(html).toContain('alt="Helpful chart"');
  });
  it('escapes image labels, link destinations and titles instead of allowing Markdown injection', () => {
    const document: JSONContent = {type: 'doc', content: [
      {type: 'paragraph', content: [{type: 'text', text: 'Trusted source', marks: [{type: 'link', attrs: {href: 'https://example.com/a(b)', title: 'Quoted "source"'}}]}]},
      {type: 'image', attrs: {src: '/og.png', alt: 'Chart ](javascript:alert(1)) ![second', title: 'A "chart" title'}},
    ]};
    const html = render(manager().serialize(sanitizeArticleDocument(document)));
    expect(html).toContain('href="https://example.com/a%28b%29"');
    expect(html).toContain('title="Quoted &quot;source&quot;"');
    expect((html.match(/<img\b/g) || [])).toHaveLength(1);
    expect(html).toContain('src="/og.png"');
    expect(html).not.toMatch(/href="javascript:|src="javascript:/);
    expect(html).toContain('alt="Chart ](javascript:alert(1)) ![second"');
  });
  it('keeps table content in GFM without unsupported cell merging metadata', () => {
    const document = parse('| Input | Result |\n| --- | --- |\n| 20% of 50 | 10 |');
    const table = document.content?.find(node => node.type === 'table');
    const cell = table?.content?.[0]?.content?.[0];
    if (!cell) throw new Error('Expected a parsed table header.');
    cell.attrs = {...cell.attrs, rowspan: 2, colspan: 3, colwidth: [500], style: 'color:red'};
    const serialized = manager().serialize(sanitizeArticleDocument(document));
    expect(render(serialized)).toContain('<th>Input</th>');
    expect(render(serialized)).not.toMatch(/rowspan|colspan|colwidth|style=/);
  });
});
