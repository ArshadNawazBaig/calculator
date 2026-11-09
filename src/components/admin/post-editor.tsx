'use client';

import Link from '@/components/document-link';

import {useEffect, useRef, useState, useTransition, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {BLOG_CATEGORIES, type BlogPost, type BlogPostInput, type BlogPostStatus} from '@/lib/blog/types';
import {savePostAction} from '@/app/(en)/admin/actions';
import {BlogMarkdown} from '@/components/blog/blog-markdown';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import styles from './admin.module.css';

const blank: BlogPostInput = {title: '', slug: '', excerpt: '', content: '', category: 'Updates', coverImageUrl: null, coverImageAlt: '', seoTitle: '', seoDescription: '', status: 'draft'};
function formValues(post?: BlogPost): BlogPostInput {if (!post) return blank; const {title, slug, excerpt, content, category, coverImageUrl, coverImageAlt, seoTitle, seoDescription, status} = post; return {title, slug, excerpt, content, category, coverImageUrl, coverImageAlt, seoTitle, seoDescription, status};}
function makeSlug(value: string) {return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '');}

export function PostEditor({initialPost}: {initialPost?: BlogPost}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [savedPost, setSavedPost] = useState(initialPost);
  const [values, setValues] = useState<BlogPostInput>(() => formValues(initialPost));
  const [savedValues, setSavedValues] = useState(() => JSON.stringify(formValues(initialPost)));
  const [slugEdited, setSlugEdited] = useState(Boolean(initialPost));
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);
  const [pending, startTransition] = useTransition();
  const body = useRef<HTMLTextAreaElement>(null);
  const dirty = JSON.stringify(values) !== savedValues;
  const slugLocked = Boolean(savedPost?.publishedAt);
  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {event.preventDefault();}
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  function change<K extends keyof BlogPostInput>(field: K, value: BlogPostInput[K]) {
    setValues(current => ({...current, [field]: value, ...(field === 'title' && !slugEdited && !slugLocked ? {slug: makeSlug(String(value))} : {})}));
  }
  function fieldErrors(field: keyof BlogPostInput) {return errors[field]?.map((error, index) => <span className={styles.fieldError} key={index}>{error}</span>);}
  function insert(before: string, after = '', placeholder = 'text') {
    const textarea = body.current;
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const selection = values.content.slice(start, end) || placeholder;
    change('content', values.content.slice(0, start) + before + selection + after + values.content.slice(end));
    requestAnimationFrame(() => {textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selection.length);});
  }
  function submit(status: BlogPostStatus) {
    if (!hydrated || pending || conflict) return;
    setMessage(''); setErrors({}); setFailed(false); setSignInRequired(false);
    startTransition(async () => {
      try {
        const result = await savePostAction({...values, status, ...(savedPost ? {id: savedPost.id, expectedVersion: savedPost.version} : {})});
        if (!result.ok) {setFailed(true); setMessage(result.message); setErrors(result.fieldErrors || {}); setConflict(Boolean(result.conflict)); setSignInRequired(Boolean(result.signInRequired)); return;}
        const updated = formValues(result.post);
        setValues(updated); setSavedValues(JSON.stringify(updated)); setSavedPost(result.post); setSlugEdited(true);
        setMessage(result.post.status === 'published' ? 'Article saved and published.' : result.post.status === 'archived' ? 'Article archived. It is no longer public.' : savedPost?.status === 'published' ? 'Article saved as a draft. It is no longer public.' : 'Draft saved.');
        if (!savedPost) router.replace(`/admin/posts/${result.post.id}`, {scroll: false});
      } catch {setFailed(true); setMessage('The article could not be saved. Your edits are still here; please try again.');}
    });
  }
  function onSubmit(event: FormEvent) {event.preventDefault(); submit(values.status);}
  return <form method="post" onSubmit={onSubmit} className={styles.form}>
    <div className={styles.top}><div><h1>{savedPost ? 'Edit article' : 'Write an article'}</h1><p className={styles.muted}>{savedPost ? <><span className={styles.badge}>{savedPost.status}</span> · Version {savedPost.version}</> : 'Start with a draft. Only published articles appear on the blog.'}</p></div>{savedPost && <div className={styles.actions}><Link href={`/admin/posts/${savedPost.id}/preview`}>Saved preview</Link>{savedPost.status === 'published' && <Link href={`/blog/${savedPost.slug}`}>View live article</Link>}</div>}</div>
    <fieldset disabled={!hydrated || pending} className={styles.form} style={{border: 0, padding: 0, margin: 0, minWidth: 0}}>
      <div className={styles.two}><label className={styles.field}>Title<input name="title" value={values.title} maxLength={160} onChange={e => change('title', e.target.value)} aria-invalid={Boolean(errors.title)}/>{fieldErrors('title')}</label><label className={styles.field}>Category<select name="category" value={values.category} onChange={e => change('category', e.target.value as BlogPostInput['category'])}>{BLOG_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select>{fieldErrors('category')}</label></div>
      <label className={styles.field}>URL slug<input name="slug" value={values.slug} required maxLength={120} readOnly={slugLocked} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e => {setSlugEdited(true); change('slug', e.target.value);}} aria-invalid={Boolean(errors.slug)}/><small>/blog/{values.slug || 'your-article'}{slugLocked ? ' · Fixed after first publication to preserve links.' : ' · Lowercase letters, numbers and hyphens.'}</small>{fieldErrors('slug')}</label>
      <label className={styles.field}>Excerpt<textarea name="excerpt" value={values.excerpt} maxLength={320} rows={3} onChange={e => change('excerpt', e.target.value)} aria-invalid={Boolean(errors.excerpt)}/><small>A useful summary for the article listing. {values.excerpt.length}/320 characters.</small>{fieldErrors('excerpt')}</label>
      <section aria-label="Article body"><div className={styles.bodyLabel}><label htmlFor="post-content">Article body</label><div className={styles.toolbar}><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button></div></div>{!preview && <div className={styles.toolbar} aria-label="Markdown formatting">{[['Bold', '**', '**'], ['Italic', '*', '*'], ['Heading', '\n## ', ''], ['Subheading', '\n### ', ''], ['List', '\n- ', ''], ['Quote', '\n> ', ''], ['Link', '[', '](https://example.com)'], ['Code', '`', '`']].map(([label, before, after]) => <button type="button" key={label} onClick={() => insert(before, after)}>{label}</button>)}</div>}
        {preview ? <div className={styles.preview}>{values.content ? <BlogMarkdown content={values.content}/> : <p className={styles.muted}>Your article preview will appear here.</p>}</div> : <textarea ref={body} className={`${styles.editor} ${styles.field}`} style={{width: '100%', padding: 16, color: 'var(--color-ink)', background: 'var(--color-input)', border: '1px solid var(--color-line-strong)', borderRadius: 8}} id="post-content" name="content" maxLength={100000} value={values.content} onChange={e => change('content', e.target.value)} aria-invalid={Boolean(errors.content)} aria-describedby="markdown-help"/>}
        <p id="markdown-help" className={styles.muted}>Use Markdown for headings, lists, links and tables. Raw HTML is omitted. Add source links, examples and limitations where they help readers.</p>{fieldErrors('content')}
      </section>
      <details className={styles.details}><summary>Cover image and search appearance</summary><div className={styles.form}><label className={styles.field}>Cover image URL<input type="text" name="coverImageUrl" value={values.coverImageUrl || ''} maxLength={2048} onChange={e => change('coverImageUrl', e.target.value || null)} aria-invalid={Boolean(errors.coverImageUrl)}/><small>Optional HTTPS image URL or an existing /path/to/image. Use images you own or have permission to publish.</small>{fieldErrors('coverImageUrl')}</label><label className={styles.field}>Cover image alternative text<input name="coverImageAlt" value={values.coverImageAlt} maxLength={300} onChange={e => change('coverImageAlt', e.target.value)} aria-invalid={Boolean(errors.coverImageAlt)}/>{fieldErrors('coverImageAlt')}</label><label className={styles.field}>SEO title<input name="seoTitle" value={values.seoTitle} maxLength={70} onChange={e => change('seoTitle', e.target.value)}/><small>Optional. Uses the article title when empty. {values.seoTitle.length}/70.</small>{fieldErrors('seoTitle')}</label><label className={styles.field}>SEO description<textarea name="seoDescription" value={values.seoDescription} maxLength={200} rows={2} onChange={e => change('seoDescription', e.target.value)}/><small>Optional. Uses the excerpt when empty. {values.seoDescription.length}/200.</small>{fieldErrors('seoDescription')}</label></div></details>
    </fieldset>
    <noscript><p>Enable JavaScript to edit and save articles.</p></noscript>
    {message && <div role={failed ? 'alert' : 'status'} className={failed ? styles.error : styles.notice}>{message}{conflict && <p>Copy your unsaved changes before <Link href={savedPost ? `/admin/posts/${savedPost.id}` : '/admin/posts'}>reloading the latest version</Link>.</p>}{signInRequired && <p>Keep this tab open to preserve edits and <Link href="/admin/sign-in" target="_blank" rel="noopener noreferrer">sign in in a new tab</Link>.</p>}</div>}
    <div className={styles.saveBar}><p aria-live="polite">{pending ? 'Saving…' : dirty ? 'Unsaved changes' : savedPost ? 'All changes saved' : 'Not saved yet'}</p><div className={styles.actions}><Button type="button" variant="secondary" disabled={!hydrated || pending || conflict} onClick={() => submit(values.status === 'published' ? 'published' : 'draft')}>{values.status === 'published' ? 'Save changes' : 'Save draft'}</Button>{values.status === 'published' ? <Button type="button" variant="secondary" disabled={!hydrated || pending || conflict} onClick={() => submit('draft')}>Unpublish</Button> : <Button type="button" disabled={!hydrated || pending || conflict} onClick={() => submit('published')}>Publish article</Button>}{savedPost && values.status !== 'archived' && <Button type="button" variant="ghost" className={styles.dangerButton} disabled={!hydrated || pending || conflict} onClick={() => submit('archived')}>Archive</Button>}</div></div>
  </form>;
}
