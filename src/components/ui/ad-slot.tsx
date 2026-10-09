// No ad network is active. A real integration must supply its script, publisher ID,
// consent controls, and policies before mounting this optional placement.
export function AdSlot({enabled=false,children}:{enabled?:boolean;children?:React.ReactNode}){if(!enabled)return null;return <aside aria-label="Advertisement" className="ad-slot" style={{minHeight:280,contain:'layout',marginBlock:32}}><span className="text-xs text-muted">Advertisement</span>{children}</aside>;}
