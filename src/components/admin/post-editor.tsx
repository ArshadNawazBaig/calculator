'use client';

import {useEffect, useState, useTransition, type CSSProperties, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {Archive, ArrowUpRight, Check, FileText, Save, Send} from 'lucide-react';
import Link from '@/components/document-link';
import {BLOG_CATEGORIES, type BlogPost, type BlogPostInput, type BlogPostStatus} from '@/lib/blog/types';
import {savePostAction} from '@/app/(en)/admin/actions';
import {BlogMarkdown} from '@/components/blog/blog-markdown';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {TextField} from '@/components/ui/text-field';
import {AdminPageHeader} from './admin-page-header';
import {RichArticleEditor} from './rich-article-editor';
import {useHydrated} from '@/lib/use-hydrated';
import tabs from '@/components/ui/segmented-tabs.module.css';
import styles from './admin.module.css';

type WritingView = 'write' | 'source' | 'preview';
const blank: BlogPostInput = {title: '', slug: '', excerpt: '', content: '', category: 'Updates', coverImageUrl: null, coverImageAlt: '', seoTitle: '', seoDescription: '', status: 'draft'};
function formValues(post?: BlogPost): BlogPostInput {
  if (!post) return blank;
  const {title, slug, excerpt, content, category, coverImageUrl, coverImageAlt, seoTitle, seoDescription, status} = post;
  return {title, slug, excerpt, content, category, coverImageUrl, coverImageAlt, seoTitle, seoDescription, status};
}
function makeSlug(value: string) {return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '');}

export function PostEditor({initialPost}: {initialPost?: BlogPost}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [savedPost, setSavedPost] = useState(initialPost);
  const [values, setValues] = useState<BlogPostInput>(() => formValues(initialPost));
  const [savedValues, setSavedValues] = useState(() => JSON.stringify(formValues(initialPost)));
  const [slugEdited, setSlugEdited] = useState(Boolean(initialPost));
  const [view, setView] = useState<WritingView>('write');
  const [editorReady, setEditorReady] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(values) !== savedValues;
  const slugLocked = Boolean(savedPost?.publishedAt);
  const disabled = !hydrated || pending;
  const cannotSave = disabled || conflict || (view === 'write' && !editorReady);

  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {event.preventDefault();}
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  function change<K extends keyof BlogPostInput>(field: K, value: BlogPostInput[K]) {
    setValues(current => ({...current, [field]: value, ...(field === 'title' && !slugEdited && !slugLocked ? {slug: makeSlug(String(value))} : {})}));
  }

  function submit(status: BlogPostStatus) {
    if (cannotSave) return;
    setMessage(''); setErrors({}); setFailed(false); setSignInRequired(false);
    startTransition(async () => {
      try {
        const result = await savePostAction({...values, status, ...(savedPost ? {id: savedPost.id, expectedVersion: savedPost.version} : {})});
        if (!result.ok) {
          setFailed(true); setMessage(result.message); setErrors(result.fieldErrors || {});
          setConflict(Boolean(result.conflict)); setSignInRequired(Boolean(result.signInRequired));
          return;
        }
        const updated = formValues(result.post);
        setValues(updated); setSavedValues(JSON.stringify(updated)); setSavedPost(result.post); setSlugEdited(true);
        setMessage(result.post.status === 'published' ? 'Article saved and published.' : result.post.status === 'archived' ? 'Article archived. It is no longer public.' : savedPost?.status === 'published' ? 'Article saved as a draft. It is no longer public.' : 'Draft saved.');
        if (!savedPost) router.replace(`/admin/posts/${result.post.id}`, {scroll: false});
      } catch {setFailed(true); setMessage('The article could not be saved. Your edits are still here; please try again.');}
    });
  }

  function onSubmit(event: FormEvent) {event.preventDefault(); submit(values.status);}

  return <form method="post" onSubmit={onSubmit} className={styles.form}>
    <AdminPageHeader title={savedPost ? 'Edit article' : 'Write an article'} description="Give readers a clear explanation, a useful example and a reason to keep reading.">
      {savedPost && <><Link className="button button-secondary" href={`/admin/posts/${savedPost.id}/preview`}>Saved preview<ArrowUpRight size={16} aria-hidden="true"/></Link>{savedPost.status === 'published' && <Link className="button button-secondary" href={`/blog/${savedPost.slug}`}>View live article<ArrowUpRight size={16} aria-hidden="true"/></Link>}</>}
    </AdminPageHeader>

    <fieldset disabled={disabled} className={styles.form} style={{border: 0, padding: 0, margin: 0, minWidth: 0}}>
      <div className={styles.editorLayout}>
        <div className={styles.editorMain}>
          <section className={styles.section} aria-labelledby="article-basics-heading">
            <div className={styles.sectionHeader}><h2 id="article-basics-heading">Article details</h2><FileText size={18} aria-hidden="true"/></div>
            <div className={styles.form}>
              <TextField label="Title" name="title" value={values.title} maxLength={160} onChange={e => change('title', e.target.value)} errors={errors.title} disabled={disabled} placeholder="What will your readers learn?"/>
              <TextField multiline label="Excerpt" name="excerpt" value={values.excerpt} maxLength={320} rows={3} onChange={e => change('excerpt', e.target.value)} errors={errors.excerpt} disabled={disabled} hint={`A short summary for the article listing. ${values.excerpt.length}/320 characters.`}/>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="article-body-heading">
            <div className={styles.sectionHeader}><h2 id="article-body-heading">Article body</h2></div>
            <div className={tabs.tabs} role="group" aria-label="Article writing view" style={{'--tab-columns': 3} as CSSProperties}>
              {([['write', 'Write'], ['source', 'Markdown source'], ['preview', 'Preview']] as const).map(([value, label]) => <Button key={value} type="button" variant="ghost" className={tabs.item} aria-pressed={view === value} disabled={disabled} onClick={() => setView(value)}>{label}</Button>)}
            </div>
            <div hidden={view !== 'write'}>
              <RichArticleEditor id="post-content" content={values.content} onChange={content => change('content', content)} disabled={disabled || view !== 'write'} onReady={setEditorReady} aria-describedby="article-body-help article-body-errors" aria-invalid={Boolean(errors.content)}/>
            </div>
            <div hidden={view !== 'source'}>
              <TextField multiline label="Markdown source" id="post-markdown-source" name="content" controlClassName={styles.editor} value={values.content} onChange={e => change('content', e.target.value)} maxLength={100000} rows={18} disabled={disabled || view !== 'source'} errors={errors.content} spellCheck={false} hint="For advanced editing. Changes here also update the visual editor and preview."/>
            </div>
            <div hidden={view !== 'preview'} className={styles.preview} aria-label="Article preview">{values.content ? <BlogMarkdown content={values.content}/> : <p className={styles.muted}>Your article preview will appear here.</p>}</div>
            <p id="article-body-help" className={styles.muted}>Use the formatting toolbar to structure your article. Add examples, source links and limitations where they help readers.</p>
            <div id="article-body-errors">{view !== 'source' && errors.content?.map(error => <p key={error} className={styles.fieldError}>{error}</p>)}</div>
          </section>
        </div>

        <aside className={styles.editorAside} aria-label="Article settings">
          <section className={styles.section} aria-labelledby="publishing-heading">
            <div className={styles.sectionHeader}><h2 id="publishing-heading">Publishing</h2><span className={`${styles.badge} ${savedPost?.status === 'published' ? styles.published : ''}`}>{savedPost?.status || 'draft'}</span></div>
            <div className={styles.form}>
              <div className={styles.field}>
                <label id="post-category-label" htmlFor="post-category">Category</label>
                <Dropdown id="post-category" name="category" value={values.category} onValueChange={category => change('category', category as BlogPostInput['category'])} options={BLOG_CATEGORIES.map(category => ({value: category, label: category}))} disabled={disabled} aria-labelledby="post-category-label" aria-describedby={errors.category ? 'post-category-error' : undefined}/>
                {errors.category && <p id="post-category-error" className={styles.fieldError}>{errors.category.join(' ')}</p>}
              </div>
              <TextField label="URL slug" name="slug" value={values.slug} required maxLength={120} readOnly={slugLocked} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e => {setSlugEdited(true); change('slug', e.target.value);}} errors={errors.slug} disabled={disabled} hint={<><span>/blog/{values.slug || 'your-article'}</span><br/>{slugLocked ? 'Fixed after first publication to preserve links.' : 'Created from the title. You can edit it before publishing.'}</>}/>
              <p className={styles.muted}>{savedPost ? `Version ${savedPost.version}. ` : ''}Only published articles appear on the public blog. Saving a draft keeps it private.</p>
            </div>
          </section>

          <details className={styles.details}><summary>Cover image</summary><div className={styles.form}>
            <TextField label="Cover image URL" name="coverImageUrl" value={values.coverImageUrl || ''} maxLength={2048} onChange={e => change('coverImageUrl', e.target.value || null)} errors={errors.coverImageUrl} disabled={disabled} hint="Use an HTTPS image URL or an existing /path/to/image. Publish images you own or have permission to use."/>
            <TextField label="Cover image alternative text" name="coverImageAlt" value={values.coverImageAlt} maxLength={300} onChange={e => change('coverImageAlt', e.target.value)} errors={errors.coverImageAlt} disabled={disabled}/>
          </div></details>

          <details className={styles.details}><summary>Search appearance</summary><div className={styles.form}>
            <TextField label="SEO title" name="seoTitle" value={values.seoTitle} maxLength={70} onChange={e => change('seoTitle', e.target.value)} errors={errors.seoTitle} disabled={disabled} hint={`Optional; uses the article title when empty. ${values.seoTitle.length}/70 characters.`}/>
            <TextField multiline label="SEO description" name="seoDescription" value={values.seoDescription} maxLength={200} rows={3} onChange={e => change('seoDescription', e.target.value)} errors={errors.seoDescription} disabled={disabled} hint={`Optional; uses the excerpt when empty. ${values.seoDescription.length}/200 characters.`}/>
          </div></details>
        </aside>
      </div>
    </fieldset>

    <noscript><p>Enable JavaScript to edit and save articles.</p></noscript>
    {message && <div role={failed ? 'alert' : 'status'} className={failed ? styles.error : styles.notice}>{message}{conflict && <p>Copy your unsaved changes before <Link href={savedPost ? `/admin/posts/${savedPost.id}` : '/admin/posts'}>reloading the latest version</Link>.</p>}{signInRequired && <p>Keep this tab open to preserve edits and <Link href="/admin/sign-in" target="_blank" rel="noopener noreferrer">sign in in a new tab</Link>.</p>}</div>}
    <div className={styles.saveBar}>
      <p aria-live="polite">{pending ? 'Saving…' : dirty ? 'Unsaved changes' : savedPost ? <><Check size={16} aria-hidden="true"/>All changes saved</> : 'Not saved yet'}</p>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" disabled={cannotSave} onClick={() => submit(values.status === 'published' ? 'published' : 'draft')}><Save size={16} aria-hidden="true"/>{values.status === 'published' ? 'Save changes' : 'Save draft'}</Button>
        {values.status === 'published' ? <Button type="button" variant="secondary" disabled={cannotSave} onClick={() => submit('draft')}>Unpublish</Button> : <Button type="button" disabled={cannotSave} onClick={() => submit('published')}><Send size={16} aria-hidden="true"/>Publish article</Button>}
        {savedPost && values.status !== 'archived' && <Button type="button" variant="ghost" className={styles.dangerButton} disabled={cannotSave} onClick={() => submit('archived')}><Archive size={16} aria-hidden="true"/>Archive</Button>}
      </div>
    </div>
  </form>;
}
