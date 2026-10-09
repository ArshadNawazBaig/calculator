import Link from "next/link";
export function Logo({inverse=false}:{inverse?:boolean}) {
  return <Link href="/" aria-label="Finflo home" className={`logo ${inverse ? "text-white" : "text-ink"}`}><svg aria-hidden="true" viewBox="0 0 35 35" className="h-8 w-8 text-brand" fill="currentColor"><rect x="1" y="22" width="6" height="11" rx="1.3"/><rect x="10" y="16" width="6" height="17" rx="1.3"/><rect x="19" y="8" width="6" height="25" rx="1.3"/><rect x="28" y="1" width="6" height="32" rx="1.3"/></svg><span>finflo</span></Link>;
}
