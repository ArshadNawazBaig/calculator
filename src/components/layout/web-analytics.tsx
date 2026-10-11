'use client';

import {useEffect} from 'react';

/** Optional page/performance measurement. Calculator state is never passed here. */
export function WebAnalytics({token,host}:{token:string;host:string}) {
  useEffect(()=>{
    const privacy = navigator as Navigator & {globalPrivacyControl?:boolean};
    if(location.hostname!==host || navigator.doNotTrack==='1' || privacy.globalPrivacyControl) return;
    if(document.getElementById('finflo-web-analytics')) return;
    const script=document.createElement('script');
    script.id='finflo-web-analytics';
    script.src='https://static.cloudflareinsights.com/beacon.min.js';
    script.defer=true;
    script.referrerPolicy='strict-origin';
    script.dataset.cfBeacon=JSON.stringify({token,spa:true});
    document.head.append(script);
    return ()=>{script.remove();};
  },[token,host]);
  return null;
}
