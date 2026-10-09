'use client';
import {useI18n} from "@/components/i18n/provider";
import {useEffect,useState} from 'react';
export function NetworkStatus(){
 const {t}=useI18n();
const [offline,setOffline]=useState(false);useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);return offline?<div className="offline-notice" role="status">{t("You’re offline. Loaded calculators can keep working; new pages may need a connection.")} <button className="underline" onClick={()=>window.location.reload()}>{t("Retry")}</button></div>:null;}
