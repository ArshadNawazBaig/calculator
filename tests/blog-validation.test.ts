import {describe, expect, it} from 'vitest';
import {blogPostInputSchema, BlogValidationError, hasReadableBlogText, isSafeBlogImageUrl, validateBlogPostInput} from '@/lib/blog/validation';

const draft = {slug: 'a-real-article', title: 'A real article'};
const published = {...draft, status: 'published', excerpt: 'A short explanation of the worked example.', content: '## A useful example\n\nFollow the inputs and compare the result.'};

describe('blog editorial validation', () => {
  it('defaults to a draft, with no artificial publication word count', () => {
    expect(validateBlogPostInput(draft).status).toBe('draft');
    expect(validateBlogPostInput({...published, content: 'Check this example.'}).status).toBe('published');
    expect(validateBlogPostInput({...draft, title: '', excerpt: '', content: ''}).status).toBe('draft');
  });
  it('preserves Markdown indentation and trailing newlines', () => {
    const content = '    const example = 42;\n\n';
    expect(validateBlogPostInput({...draft, content}).content).toBe(content);
  });
  it.each(['UPPERCASE', 'two--hyphens', '-leading', 'trailing-', '../private', 'hello/world', '', 'x'.repeat(121)])('rejects an invalid slug: %s', slug => {
    expect(blogPostInputSchema.safeParse({...draft, slug}).success).toBe(false);
  });
  it.each([['title', 161], ['excerpt', 321], ['content', 100_001], ['seoTitle', 71], ['seoDescription', 201]])('bounds %s at its documented size', (field, size) => {
    expect(blogPostInputSchema.safeParse({...draft, [field]: 'x'.repeat(Number(size))}).success).toBe(false);
  });
  it.each(['<div>Hidden HTML</div>', '<script>alert("ignored")</script>', '<div>\nHidden HTML', '<custom-block>\nHidden HTML', '<!-- invisible -->', '![Only an image](https://example.com/a.png)', '![Only an image][cover]\n\n[cover]: https://example.com/a.png', '---\n###\n***', '```markdown\n```', '&nbsp;&#32;&#x20;', '  \n\t'])('does not publish a body without readable rendered text: %s', content => {
    expect(() => validateBlogPostInput({...published, content})).toThrow(BlogValidationError);
  });
  it('distinguishes hidden HTML from actual Markdown and code text', () => {
    expect(hasReadableBlogText('<div>Hidden</div>\n\nA visible paragraph.')).toBe(true);
    expect(hasReadableBlogText('```js\nconst total = 42;\n```')).toBe(true);
    expect(hasReadableBlogText('[A visible link](https://example.com/)')).toBe(true);
    expect(hasReadableBlogText('Visible <strong>inline</strong> text.')).toBe(true);
  });
  it.each(['title', 'excerpt', 'content'])('requires readable %s when publishing', field => {
    expect(() => validateBlogPostInput({...published, [field]: '  '})).toThrow(BlogValidationError);
  });
  it('checks draft fields again when the publish action is explicit', () => {
    expect(() => validateBlogPostInput({...draft, content: '<p>Hidden</p>'}, {publishing: true})).toThrow(BlogValidationError);
  });
  it('returns actionable field errors and ignores untrusted author and timestamp fields', () => {
    try {validateBlogPostInput({...published, slug: 'Bad', title: ''});} catch (error) {
      expect(error).toBeInstanceOf(BlogValidationError);
      expect((error as BlogValidationError).fieldErrors).toHaveProperty('slug');
      expect((error as BlogValidationError).fieldErrors).toHaveProperty('title');
    }
    const value = validateBlogPostInput({...published, authorId: 'attacker', publishedAt: '1990-01-01', version: 99});
    expect(value).not.toHaveProperty('authorId');
    expect(value).not.toHaveProperty('publishedAt');
    expect(value).not.toHaveProperty('version');
  });
});

describe('blog cover images', () => {
  it.each(['https://example.com/image.webp', 'https://example.com/cover.png?width=1200', '/images/blog/cover.webp', '/brand/logo-dark.svg'])('accepts safe image locations: %s', value => {
    expect(isSafeBlogImageUrl(value)).toBe(true);
  });
  it.each(['javascript:alert(1)', 'data:image/svg+xml,test', 'http://example.com/a.jpg', '//evil.example/a.jpg', 'https://user:secret@example.com/a.jpg', '/images/../private', '/images/%2e%2e/private', '/images/cover.jpg\n', '/\\evil.example/a.jpg', 'https://example.com/\na.jpg'])('rejects unsafe image locations: %s', value => {
    expect(isSafeBlogImageUrl(value)).toBe(false);
  });
  it('requires a description for a provided cover', () => {
    expect(() => validateBlogPostInput({...draft, coverImageUrl: '/images/cover.webp', coverImageAlt: ''})).toThrow(BlogValidationError);
    expect(validateBlogPostInput({...draft, coverImageUrl: '/images/cover.webp', coverImageAlt: 'A comparison of two saving scenarios.'}).coverImageUrl).toBe('/images/cover.webp');
    expect(validateBlogPostInput({...draft, coverImageUrl: ''}).coverImageUrl).toBeNull();
  });
});
