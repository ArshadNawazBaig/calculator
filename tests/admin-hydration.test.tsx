import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';

vi.mock('next/navigation',()=>({useRouter:()=>({replace:vi.fn()})}));
vi.mock('@/app/(en)/admin/actions',()=>({savePostAction:vi.fn()}));
vi.mock('better-auth/react',()=>({createAuthClient:()=>({signIn:{email:vi.fn()},signOut:vi.fn()})}));
import {AdminSignIn} from '@/components/admin/auth-controls';
import {PostEditor} from '@/components/admin/post-editor';
import content from '@/data/information-content.json';

describe('administrator form hydration boundary',()=>{
  it('never offers an active GET form for credentials before JavaScript mounts',()=>{
    const html=renderToStaticMarkup(<AdminSignIn/>);
    expect(html).toMatch(/<form[^>]*method="post"/);
    for (const name of ['email','password']) {
      const input=[...html.matchAll(/<input[^>]*>/g)].map(match=>match[0]).find(tag=>tag.includes(`name="${name}"`));
      expect(input).toContain('disabled=""');
    }
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain('minLength="16"');
  });
  it('keeps draft fields and every save/publish control disabled before hydration',()=>{
    const html=renderToStaticMarkup(<PostEditor/>);
    expect(html).toMatch(/<form[^>]*method="post"/);expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    // Shared Finflo buttons may include an SVG icon; inspect their complete
    // contents without accidentally skipping the disabled publishing controls.
    const buttons=[...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match=>match[0]).filter(button=>/^(Save draft|Publish article)$/.test(button.replace(/<[^>]*>/g,'').trim()));
    expect(buttons).toHaveLength(2);for(const button of buttons)expect(button).toContain('disabled=""');
    expect(html).not.toMatch(/contenteditable="true"/i);
    expect(html).toContain('Loading article editor');
  });
});

describe('publishing disclosures distinguish server records from local tools',()=>{
  it('covers private authentication and publishing without claiming calculator database storage',()=>{
    const privacy=content.privacy.sections.flatMap(section=>section.paragraphs).join(' ');
    expect(privacy).toContain('does not store calculator inputs in its publishing database');
    expect(privacy).toContain('password hashes');expect(privacy).toContain('author’s account name');expect(privacy).toContain('If Neon is enabled');expect(privacy).toContain('Drafts and archived articles remain');
    expect(content.cookies.sections.some(section=>section.title==='Essential administrator sign-in cookies')).toBe(true);
    expect(content.terms.sections.some(section=>section.title==='Published articles and restricted publishing accounts')).toBe(true);
  });
});
