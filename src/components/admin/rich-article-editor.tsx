'use client';

import {EditorContent, useEditor, useEditorState} from '@tiptap/react';
import {TextSelection} from '@tiptap/pm/state';
import {Bold, Code, CodeXml, ImagePlus, Italic, Link2, List, ListChecks, ListOrdered, Quote, Redo2, Strikethrough, Table2, Undo2, X} from 'lucide-react';
import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {TextField} from '@/components/ui/text-field';
import {articleEditorUrl, createArticleEditorExtensions, hasArticleFootnotes, sanitizeArticleClipboardHtml, sanitizeArticleDocument, stripArticleHtml} from '@/lib/blog/editor';
import styles from './rich-article-editor.module.css';

export type RichArticleEditorProps = {
  content: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
  id?: string;
  onReady?: (ready: boolean) => void;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

function ToolButton({label, shortcut, icon, active, disabled, onClick}: {label: string; shortcut?: string; icon: ReactNode; active?: boolean; disabled: boolean; onClick: () => void}) {
  return <Button type="button" variant="ghost" className={styles.toolButton} aria-label={label} title={shortcut ? `${label} (${shortcut})` : label} aria-pressed={active} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onClick}>{icon}</Button>;
}

/** Finflo's controls around a headless editor; the persisted format stays Markdown. */
export function RichArticleEditor({content, onChange, disabled = false, id = 'post-content', onReady, 'aria-describedby': describedBy, 'aria-invalid': invalid}: RichArticleEditorProps) {
  const generatedId = useId();
  const helpId = `${generatedId}-help`;
  const panelId = `${generatedId}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({onChange, onReady});
  const initialized = useRef(false);
  const incoming = useRef<string | null>(null);
  const emitted = useRef<string | null>(null);
  const currentEditor = useRef<ReturnType<typeof useEditor>>(null);
  const [panel, setPanel] = useState<'link' | 'image' | null>(null);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [panelError, setPanelError] = useState('');
  const [pasteError, setPasteError] = useState('');
  const sourceOnly = useMemo(() => hasArticleFootnotes(content), [content]);
  const readOnly = disabled || sourceOnly;
  const extensions = useMemo(() => createArticleEditorExtensions(), []);

  useEffect(() => { callbacks.current = {onChange, onReady}; }, [onChange, onReady]);

  const editor = useEditor({
    extensions,
    content: '',
    contentType: 'markdown',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-label': 'Article body',
        'aria-multiline': 'true',
        'aria-describedby': [describedBy, helpId].filter(Boolean).join(' '),
        'aria-invalid': invalid ? 'true' : 'false',
        'aria-disabled': disabled ? 'true' : 'false',
        'aria-readonly': readOnly ? 'true' : 'false',
        'data-rich-article-editor': '',
        class: styles.document,
      },
      transformPastedHTML: sanitizeArticleClipboardHtml,
      handlePaste(_view, event) {
        const instance = currentEditor.current;
        if (!instance?.isEditable || instance.isActive('codeBlock')) return false;
        const text = event.clipboardData?.getData('text/plain');
        if (!text || !instance.markdown) return false;
        if (hasArticleFootnotes(text)) {
          setPasteError('Paste articles with footnotes into Markdown source so their references and definitions are preserved.');
          return true;
        }
        if (event.clipboardData?.getData('text/html')) return false;
        const document = sanitizeArticleDocument(instance.markdown.parse(stripArticleHtml(text)));
        instance.commands.insertContent(document.content || []);
        return true;
      },
      handleDOMEvents: {
        // A content-editing surface should never navigate the administrator away.
        click(_view, event) {
          if ((event.target as Element | null)?.closest('a')) event.preventDefault();
          return false;
        },
      },
    },
    onUpdate({editor: instance, transaction}) {
      if (!initialized.current || !transaction.docChanged || !instance.isEditable) return;
      const markdown = instance.getMarkdown();
      emitted.current = markdown;
      callbacks.current.onChange(markdown);
    },
  });

  useEffect(() => {
    currentEditor.current = editor;
    return () => { currentEditor.current = null; };
  }, [editor]);

  useEffect(() => {
    if (!editor?.markdown || incoming.current === content) return;
    incoming.current = content;
    // Parent echo of our own transaction must retain the selection and undo stack.
    if (emitted.current !== content) {
      initialized.current = false;
      const document = sanitizeArticleDocument(editor.markdown.parse(stripArticleHtml(content)));
      editor.chain().setMeta('addToHistory', false).setContent(document, {emitUpdate: false}).run();
      emitted.current = content;
    }
    initialized.current = true;
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly, false);
    editor.view.dom.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(checkbox => { checkbox.disabled = readOnly; });
  }, [content, readOnly, editor]);

  useEffect(() => {
    callbacks.current.onReady?.(!!editor);
    return () => { callbacks.current.onReady?.(false); };
  }, [editor]);

  useEffect(() => {
    if (panel && !readOnly) panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [panel, readOnly]);

  const state = useEditorState({editor, selector: ({editor: instance}) => {
    if (!instance) return null;
    return {
      bold: instance.isActive('bold'), italic: instance.isActive('italic'), strike: instance.isActive('strike'), code: instance.isActive('code'),
      bulletList: instance.isActive('bulletList'), orderedList: instance.isActive('orderedList'), taskList: instance.isActive('taskList'), blockquote: instance.isActive('blockquote'), codeBlock: instance.isActive('codeBlock'),
      link: instance.isActive('link'), image: instance.isActive('image'), table: instance.isActive('table'),
      heading: instance.isActive('heading') ? String(instance.getAttributes('heading').level) : 'paragraph',
      canUndo: instance.can().undo(), canRedo: instance.can().redo(),
      canAddRow: instance.can().addRowAfter(), canAddColumn: instance.can().addColumnAfter(), canDeleteRow: instance.can().deleteRow(), canDeleteColumn: instance.can().deleteColumn(),
      words: (instance.getText().match(/\S+/g) || []).length,
    };
  }});
  const unavailable = readOnly || !editor;

  function closePanel() { setPanel(null); setPanelError(''); editor?.commands.focus(); }
  function openPanel(kind: 'link' | 'image') {
    if (!editor || readOnly) return;
    const attributes = editor.getAttributes(kind);
    setUrl(typeof attributes[kind === 'link' ? 'href' : 'src'] === 'string' ? attributes[kind === 'link' ? 'href' : 'src'] : '');
    setLabel(kind === 'image' ? String(attributes.alt || '') : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '));
    setPanelError('');
    setPanel(kind);
  }
  function applyLink() {
    if (!editor || readOnly) return;
    const href = articleEditorUrl(url);
    if (!href) { setPanelError('Use an https://, http:// or mailto: URL, a site path starting with /, or a #section link.'); return; }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      if (!label.trim()) { setPanelError('Enter descriptive link text.'); return; }
      editor.chain().focus().insertContent({type: 'text', text: label.trim(), marks: [{type: 'link', attrs: {href}}]}).unsetMark('link', {extendEmptyMarkRange: false}).run();
    } else editor.chain().focus().extendMarkRange('link').setLink({href}).run();
    closePanel();
  }
  function applyImage() {
    if (!editor || readOnly) return;
    const src = articleEditorUrl(url, true);
    if (!src) { setPanelError('Use an HTTPS image URL or a site image path starting with /.'); return; }
    if (!label.trim()) { setPanelError('Describe the image in the alternative text field.'); return; }
    editor.chain().focus().setImage({src, alt: label.trim()}).run();
    closePanel();
  }
  function panelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); closePanel(); }
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) { event.preventDefault(); if (panel === 'link') applyLink(); else applyImage(); }
  }

  const importedHeading = state?.heading && !['paragraph', '2', '3'].includes(state.heading);
  const blockOptions = [{value: 'paragraph', label: 'Paragraph'}, {value: '2', label: 'Heading 2'}, {value: '3', label: 'Heading 3'}, ...(importedHeading ? [{value: state.heading, label: `Heading ${state.heading}`}]: [])];

  return <div className={styles.editor} data-disabled={readOnly || undefined} data-invalid={invalid || undefined} onKeyDownCapture={event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !readOnly) { event.preventDefault(); event.stopPropagation(); openPanel('link'); }
  }}>
    {sourceOnly && <p className={styles.sourceNotice} role="status">Footnotes are preserved. Use Markdown source to edit this article.</p>}
    {pasteError && <p className={styles.sourceNotice} role="alert">{pasteError}</p>}
    <div className={styles.toolbar} role="group" aria-label="Article formatting">
      <div className={styles.blockPicker}>
        <Dropdown aria-label="Text style" value={state?.heading || 'paragraph'} options={blockOptions} size="compact" searchable={false} disabled={unavailable || !!state?.table} onValueChange={value => {
          if (!editor || readOnly) return;
          if (value === 'paragraph') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().setHeading({level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6}).run();
        }}/>
      </div>
      <div className={styles.toolGroup} role="group" aria-label="Text formatting">
        <ToolButton label="Bold" shortcut="Ctrl/Cmd+B" icon={<Bold size={17}/>} active={state?.bold} disabled={unavailable} onClick={() => editor?.chain().focus().toggleBold().run()}/>
        <ToolButton label="Italic" shortcut="Ctrl/Cmd+I" icon={<Italic size={17}/>} active={state?.italic} disabled={unavailable} onClick={() => editor?.chain().focus().toggleItalic().run()}/>
        <ToolButton label="Strikethrough" icon={<Strikethrough size={17}/>} active={state?.strike} disabled={unavailable} onClick={() => editor?.chain().focus().toggleStrike().run()}/>
        <ToolButton label="Inline code" icon={<Code size={17}/>} active={state?.code} disabled={unavailable} onClick={() => editor?.chain().focus().toggleCode().run()}/>
      </div>
      <div className={styles.toolGroup} role="group" aria-label="Paragraph formatting">
        <ToolButton label="Bullet list" icon={<List size={18}/>} active={state?.bulletList} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().toggleBulletList().run()}/>
        <ToolButton label="Numbered list" icon={<ListOrdered size={18}/>} active={state?.orderedList} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().toggleOrderedList().run()}/>
        <ToolButton label="Checklist" icon={<ListChecks size={18}/>} active={state?.taskList} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().toggleTaskList().run()}/>
        <ToolButton label="Blockquote" icon={<Quote size={17}/>} active={state?.blockquote} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().toggleBlockquote().run()}/>
        <ToolButton label="Code block" icon={<CodeXml size={18}/>} active={state?.codeBlock} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}/>
      </div>
      <div className={styles.toolGroup} role="group" aria-label="Insert content">
        <ToolButton label={state?.link ? 'Edit link' : 'Add link'} shortcut="Ctrl/Cmd+K" icon={<Link2 size={17}/>} active={state?.link} disabled={unavailable} onClick={() => openPanel('link')}/>
        <ToolButton label={state?.image ? 'Edit image' : 'Insert image'} icon={<ImagePlus size={18}/>} active={state?.image} disabled={unavailable} onClick={() => openPanel('image')}/>
        <ToolButton label="Insert table" icon={<Table2 size={18}/>} disabled={unavailable || !!state?.table} onClick={() => editor?.chain().focus().insertTable({rows: 3, cols: 3, withHeaderRow: true}).run()}/>
      </div>
      <div className={`${styles.toolGroup} ${styles.history}`} role="group" aria-label="Edit history">
        <ToolButton label="Undo" shortcut="Ctrl/Cmd+Z" icon={<Undo2 size={18}/>} disabled={unavailable || !state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}/>
        <ToolButton label="Redo" shortcut="Ctrl/Cmd+Shift+Z" icon={<Redo2 size={18}/>} disabled={unavailable || !state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}/>
      </div>
    </div>

    {panel && !readOnly && <div ref={panelRef} id={panelId} className={styles.panel} role="region" aria-label={panel === 'link' ? 'Link settings' : 'Image settings'} onKeyDown={panelKeyDown}>
      <div className={styles.panelHeading}><strong>{panel === 'link' ? 'Add or edit a link' : 'Add or edit an image'}</strong><Button type="button" variant="ghost" className={styles.closeButton} aria-label="Close settings" onClick={closePanel}><X size={18}/></Button></div>
      <div className={styles.panelFields}>
        <TextField label={panel === 'link' ? 'Link URL' : 'Image URL'} value={url} onChange={event => {setUrl(event.target.value); setPanelError('');}} type="text" inputMode="url" placeholder={panel === 'link' ? 'https://example.com/article' : 'https://example.com/image.jpg'} maxLength={2000} autoComplete="off" aria-describedby={panelError ? `${panelId}-error` : undefined}/>
        <TextField label={panel === 'link' ? 'Link text' : 'Alternative text'} value={label} onChange={event => {setLabel(event.target.value); setPanelError('');}} maxLength={panel === 'image' ? 300 : 500} hint={panel === 'link' ? 'Used when inserting a link at the cursor. Selected text keeps its wording.' : 'Describe the information in the image for readers who cannot see it.'}/>
      </div>
      {panelError && <p id={`${panelId}-error`} className={styles.error} role="alert">{panelError}</p>}
      <div className={styles.panelActions}>
        <Button type="button" variant="primary" onClick={panel === 'link' ? applyLink : applyImage}>{panel === 'link' ? 'Apply link' : 'Insert image'}</Button>
        {panel === 'link' && state?.link && <Button type="button" variant="secondary" onClick={() => {editor?.chain().focus().extendMarkRange('link').unsetLink().run(); closePanel();}}>Remove link</Button>}
        <Button type="button" variant="ghost" onClick={closePanel}>Cancel</Button>
      </div>
    </div>}

    {state?.table && <div className={styles.tableToolbar} role="group" aria-label="Table controls">
      <span className={styles.tableLabel}>Table</span>
      <Button type="button" variant="ghost" disabled={unavailable || !state.canAddRow} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().addRowAfter().run()}>Add row after</Button>
      <Button type="button" variant="ghost" disabled={unavailable || !state.canAddColumn} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().addColumnAfter().run()}>Add column after</Button>
      <Button type="button" variant="ghost" disabled={unavailable || !state.canDeleteRow} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().deleteRow().run()}>Delete row</Button>
      <Button type="button" variant="ghost" disabled={unavailable || !state.canDeleteColumn} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().deleteColumn().run()}>Delete column</Button>
      <Button type="button" variant="ghost" disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().command(({state: currentState, tr}) => {
        const {$from} = currentState.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name !== 'table') continue;
          const position = $from.after(depth);
          tr.insert(position, currentState.schema.nodes.paragraph.create());
          tr.setSelection(TextSelection.near(tr.doc.resolve(position + 1)));
          return true;
        }
        return false;
      }).run()}>Paragraph after table</Button>
      <Button type="button" variant="ghost" disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().deleteTable().run()}>Delete table</Button>
    </div>}

    {!editor && <div className={styles.loading} role="status">Loading article editor…</div>}
    <EditorContent editor={editor} className={styles.content}/>
    <div className={styles.footer}><p id={helpId}>Use headings to organize your article. Preview checks the published formatting.</p><span>{state?.words || 0} {(state?.words || 0) === 1 ? 'word' : 'words'}</span></div>
  </div>;
}
