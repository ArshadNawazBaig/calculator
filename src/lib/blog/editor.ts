import type {JSONContent} from '@tiptap/core';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {TaskItem, TaskList} from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import {TableCell, TableHeader, TableKit} from '@tiptap/extension-table';
import {Markdown} from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {gfmFromMarkdown} from 'mdast-util-gfm';
import {gfm} from 'micromark-extension-gfm';

/** The editor accepts the same destination types as the public article renderer. */
export function articleEditorUrl(value: string, image = false): string | undefined {
  const text = value.trim();
  if (!text || /[\s\u0000-\u001f\u007f-\u009f\\]/.test(text) || text.startsWith('//')) return undefined;
  if (text.startsWith('/') || !image && text.startsWith('#')) return text;
  try {
    const url = new URL(text);
    if (url.username || url.password) return undefined;
    return (image ? url.protocol === 'https:' : ['https:', 'http:', 'mailto:'].includes(url.protocol)) ? text : undefined;
  } catch { return undefined; }
}

type MarkdownTree = {type: string; value?: string; position?: {start: {offset?: number}; end: {offset?: number}}; children?: MarkdownTree[]};
const articleTree = (markdown: string) => fromMarkdown(markdown, {extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()]});

/** Marked does not support remark-GFM footnotes; retain these in source mode. */
export function hasArticleFootnotes(markdown: string): boolean {
  if (!markdown.includes('[^')) return false;
  function visit(node: MarkdownTree): boolean {
    return node.type === 'footnoteDefinition' || !!node.children?.some(visit);
  }
  return visit(articleTree(markdown));
}

/** Match public skipHtml without changing code examples or escaped angle brackets. */
export function stripArticleHtml(markdown: string): string {
  if (!markdown.includes('<')) return markdown;
  const ranges: {start: number; end: number}[] = [];
  function visit(node: MarkdownTree) {
    if (node.type === 'html') {
      // The public renderer explicitly turns only attribute-free br tags into
      // breaks, allowing multiline GFM table cells without enabling raw HTML.
      if (/^<br\s*\/?>$/i.test((node.value || '').trim())) return;
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start !== undefined && end !== undefined) ranges.push({start, end});
    } else node.children?.forEach(visit);
  }
  visit(articleTree(markdown));
  return ranges.sort((a, b) => b.start - a.start).reduce((text, range) => text.slice(0, range.start) + text.slice(range.end), markdown);
}

const nodeTypes = new Set(['doc', 'paragraph', 'heading', 'text', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'taskList', 'taskItem', 'codeBlock', 'hardBreak', 'horizontalRule', 'image', 'table', 'tableRow', 'tableCell', 'tableHeader']);
const markTypes = new Set(['bold', 'italic', 'strike', 'code', 'link']);

/** Keep schema content inert even when importing Markdown from an old/source post. */
export function sanitizeArticleDocument(document: JSONContent): JSONContent {
  function cleanMarks(marks: JSONContent['marks']) {
    return marks?.flatMap(mark => {
      if (!markTypes.has(mark.type)) return [];
      if (mark.type !== 'link') return [{type: mark.type}];
      const href = typeof mark.attrs?.href === 'string' ? articleEditorUrl(mark.attrs.href) : undefined;
      return href ? [{type: 'link', attrs: {href, title: typeof mark.attrs?.title === 'string' ? mark.attrs.title : null}}] : [];
    });
  }
  function clean(node: JSONContent): JSONContent | undefined {
    if (!node.type || !nodeTypes.has(node.type)) return undefined;
    if (node.type === 'image') {
      const src = typeof node.attrs?.src === 'string' ? articleEditorUrl(node.attrs.src, true) : undefined;
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt.trim() : '';
      if (!src || !alt) return alt ? {type: 'text', text: alt} : undefined;
      const marks = cleanMarks(node.marks);
      return {type: 'image', attrs: {src, alt, title: typeof node.attrs?.title === 'string' ? node.attrs.title : null}, ...(marks?.length ? {marks} : {})};
    }
    const result: JSONContent = {type: node.type};
    if (node.type === 'text') {
      if (!node.text) return undefined;
      result.text = node.text;
      const marks = cleanMarks(node.marks);
      if (marks?.length) result.marks = marks;
    }
    if (node.type === 'heading') result.attrs = {level: Math.min(6, Math.max(1, Number(node.attrs?.level) || 2))};
    if (node.type === 'orderedList') result.attrs = {start: Math.max(1, Number(node.attrs?.start) || 1)};
    if (node.type === 'taskItem') result.attrs = {checked: node.attrs?.checked === true};
    if (node.type === 'codeBlock') result.attrs = {language: typeof node.attrs?.language === 'string' ? node.attrs.language : null};
    if (node.type === 'tableCell' || node.type === 'tableHeader') {
      const align = node.attrs?.align;
      result.attrs = {colspan: 1, rowspan: 1, colwidth: null, ...(align === 'left' || align === 'center' || align === 'right' ? {align} : {})};
    }
    if (node.content) result.content = node.content.flatMap(child => {
      const value = clean(child);
      if (!value) return [];
      const inline = value.type === 'text' || value.type === 'image' || value.type === 'hardBreak';
      return inline && ['doc', 'blockquote', 'listItem', 'taskItem', 'tableCell', 'tableHeader'].includes(node.type || '') ? [{type: 'paragraph', content: [value]}] : [value];
    });
    return result;
  }
  const result = clean(document);
  return result?.type === 'doc' && result.content?.length ? result : {type: 'doc', content: [{type: 'paragraph'}]};
}

/** Clipboard HTML is inert, has no styles/events, and never imports active embeds. */
export function sanitizeArticleClipboardHtml(html: string): string {
  if (typeof document === 'undefined') return '';
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('li').forEach(item => {
    const checkbox = item.querySelector<HTMLInputElement>(':scope > input[type="checkbox"], :scope > label > input[type="checkbox"]');
    if (!checkbox) return;
    item.setAttribute('data-type', 'taskItem');
    item.setAttribute('data-checked', checkbox.hasAttribute('checked') ? 'true' : 'false');
    if (item.parentElement?.tagName === 'UL') item.parentElement.setAttribute('data-type', 'taskList');
    // Tiptap's accessible checkbox label is editor chrome, not article text.
    if (checkbox.parentElement?.tagName === 'LABEL') checkbox.parentElement.remove();
  });
  template.content.querySelectorAll('script,style,iframe,object,embed,svg,math,video,audio,source,form,button,input,textarea,select,link,meta,base,template').forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(element => {
    const href = element.tagName === 'A' ? articleEditorUrl(element.getAttribute('href') || '') : undefined;
    const src = element.tagName === 'IMG' ? articleEditorUrl(element.getAttribute('src') || '', true) : undefined;
    const alt = element.getAttribute('alt')?.trim();
    const title = element.getAttribute('title');
    const taskType = element.getAttribute('data-type');
    const checked = element.getAttribute('data-checked') === 'true';
    Array.from(element.attributes).forEach(attribute => element.removeAttribute(attribute.name));
    if (element.tagName === 'UL' && taskType === 'taskList') element.setAttribute('data-type', taskType);
    if (element.tagName === 'LI' && taskType === 'taskItem') {
      element.setAttribute('data-type', taskType);
      element.setAttribute('data-checked', String(checked));
    }
    if (element.tagName === 'A') {
      if (href) {
        element.setAttribute('href', href);
        if (title) element.setAttribute('title', title);
      } else element.replaceWith(...element.childNodes);
    }
    if (element.tagName === 'IMG') {
      if (src && alt) {
        element.setAttribute('src', src);
        element.setAttribute('alt', alt);
        if (title) element.setAttribute('title', title);
      } else element.replaceWith(document.createTextNode(alt || ''));
    }
  });
  return template.innerHTML;
}

const markdownDestination = (value: string) => value.replace(/[<>()]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
const markdownLabel = (value: string) => value.replace(/\\/g, '\\\\').replace(/[[\]]/g, '\\$&').replace(/[\r\n]/g, ' ');
const markdownTitle = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ');

const ArticleLink = Link.extend({
  parseMarkdown(token, helpers) {
    const content = helpers.parseInline(token.tokens || []);
    const href = typeof token.href === 'string' ? articleEditorUrl(token.href) : undefined;
    return href ? helpers.applyMark('link', content, {href, title: token.title || null}) : content;
  },
  renderMarkdown(node, helpers) {
    const text = helpers.renderChildren(node);
    const href = typeof node.attrs?.href === 'string' ? articleEditorUrl(node.attrs.href) : undefined;
    if (!href) return text;
    const title = node.attrs?.title ? ` "${markdownTitle(String(node.attrs.title))}"` : '';
    return `[${text}](${markdownDestination(href)}${title})`;
  },
}).configure({
  openOnClick: false,
  defaultProtocol: 'https',
  markdownLinks: true,
  isAllowedUri: value => typeof value === 'string' && !!articleEditorUrl(value),
  shouldAutoLink: value => !!articleEditorUrl(value),
  HTMLAttributes: {target: null, rel: 'noopener noreferrer', class: null},
});

const ArticleImage = Image.extend({
  addAttributes() {
    return {src: {default: null}, alt: {default: null}, title: {default: null}};
  },
  parseHTML() {
    return [{tag: 'img[src]', getAttrs: element => {
      const src = articleEditorUrl(element.getAttribute('src') || '', true);
      const alt = element.getAttribute('alt')?.trim();
      return src && alt ? {src, alt, title: element.getAttribute('title')} : false;
    }}];
  },
  renderHTML({node}) {
    const src = typeof node.attrs.src === 'string' ? articleEditorUrl(node.attrs.src, true) : undefined;
    const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt.trim() : '';
    return src && alt ? ['img', {src, alt, title: node.attrs.title || null, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer'}] : ['span', {}, alt];
  },
  parseMarkdown(token, helpers) {
    const src = typeof token.href === 'string' ? articleEditorUrl(token.href, true) : undefined;
    const alt = typeof token.text === 'string' ? token.text.trim() : '';
    if (!src || !alt) return alt ? helpers.createTextNode(alt) : [];
    return helpers.createNode('image', {src, alt, title: token.title || null});
  },
  renderMarkdown(node) {
    const src = typeof node.attrs?.src === 'string' ? articleEditorUrl(node.attrs.src, true) : undefined;
    const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt.trim() : '';
    if (!src || !alt) return markdownLabel(alt);
    const title = node.attrs?.title ? ` "${markdownTitle(String(node.attrs.title))}"` : '';
    return `![${markdownLabel(alt)}](${markdownDestination(src)}${title})`;
  },
  // The stock image input rule bypasses URL/alt validation. Use the image panel.
  addInputRules() { return []; },
}).configure({inline: true, allowBase64: false, resize: false});

// Older Markdown may contain # headings. Keep their source level while giving
// the page title sole ownership of h1 in both the editing and public views.
const ArticleHeading = Heading.extend({
  renderHTML({node}) {
    const level = Number(node.attrs.level) || 2;
    return [`h${level === 1 ? 2 : level}`, {}, 0];
  },
}).configure({levels: [1, 2, 3, 4, 5, 6]});

// GFM cells support inline formatting and line breaks, rather than nested block
// structures. Schema rules protect this boundary for keyboard commands/paste too.
const ArticleTableCell = TableCell.extend({content: 'paragraph+'});
const ArticleTableHeader = TableHeader.extend({content: 'paragraph+'});

/** Only formatting that has a useful Markdown/public-renderer representation. */
export function createArticleEditorExtensions() {
  return [
    StarterKit.configure({underline: false, link: false, heading: false, trailingNode: false}),
    ArticleHeading,
    ArticleLink,
    ArticleImage,
    TaskList,
    TaskItem.configure({nested: true}),
    TableKit.configure({table: {resizable: false, renderWrapper: true}, tableCell: false, tableHeader: false}),
    ArticleTableCell,
    ArticleTableHeader,
    Markdown.configure({markedOptions: {gfm: true}}),
    Placeholder.configure({placeholder: 'Start writing your article…'}),
  ];
}
