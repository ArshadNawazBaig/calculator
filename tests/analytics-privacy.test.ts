import {afterEach,describe,expect,it,vi} from 'vitest';
import {WebAnalytics} from '@/components/layout/web-analytics';

const state=vi.hoisted(()=>({cleanup:undefined as undefined|(()=>void)}));
vi.mock('react',()=>({useEffect:(effect:()=>undefined|(()=>void))=>{state.cleanup=effect();}}));
afterEach(()=>{state.cleanup?.();state.cleanup=undefined;vi.unstubAllGlobals();});
function setup({host='finflo.org',dnt='0',gpc=false,existing=false}={}) {
  const script={id:'',src:'',defer:false,referrerPolicy:'',dataset:{} as Record<string,string>,remove:vi.fn()};
  const append=vi.fn(),createElement=vi.fn(()=>script);
  vi.stubGlobal('navigator',{doNotTrack:dnt,globalPrivacyControl:gpc});
  vi.stubGlobal('location',{hostname:host});
  vi.stubGlobal('document',{getElementById:()=>existing?script:null,createElement,head:{append}});
  WebAnalytics({token:'a'.repeat(32),host:'finflo.org'});
  return {script,append,createElement};
}
describe('optional analytics privacy boundaries',()=>{
  it.each([{host:'preview.example'},{dnt:'1'},{gpc:true},{existing:true}])('does not load for %j',options=>{
    expect(setup(options).createElement).not.toHaveBeenCalled();
  });
  it('passes only the public token and navigation setting, then removes the script on cleanup',()=>{
    const {script,append}=setup();
    expect(append).toHaveBeenCalledOnce();
    expect(script.src).toBe('https://static.cloudflareinsights.com/beacon.min.js');
    expect(JSON.parse(script.dataset.cfBeacon)).toEqual({token:'a'.repeat(32),spa:true});
    expect(script.referrerPolicy).toBe('strict-origin');
    state.cleanup?.();state.cleanup=undefined;
    expect(script.remove).toHaveBeenCalledOnce();
  });
});
