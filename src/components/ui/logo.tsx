import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return <Link href="/" aria-label="Finflo home" className="logo"><Image src="/finflo-logo.webp" width={626} height={212} alt="Finflo — Calculate, plan, grow" unoptimized loading="eager"/></Link>;
}
