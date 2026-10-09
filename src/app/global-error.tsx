'use client';
import Link from 'next/link';
import {jakarta} from "@/lib/fonts";
export default function GlobalError({retry}:{error:Error&{digest?:string};retry:()=>void}){return <html lang="en" className={jakarta.className}><head><title>Finflo — Something went wrong</title></head><body style={{fontFamily:'inherit',padding:'10vh 24px',textAlign:'center',color:'#14332a',background:'#fff'}}><main><h1>Finflo couldn’t load this page.</h1><p>An unexpected error occurred. Your browser may be able to recover with a retry.</p><button onClick={retry} style={{padding:'12px 24px',margin:'20px',font:'inherit',cursor:'pointer',background:'#087f5b',color:'#fff',border:0,borderRadius:'6px'}}>Try again</button><p><Link href="/" style={{color:"#087f5b"}}>Return to Finflo</Link></p></main></body></html>;}
