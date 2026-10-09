import Link from "next/link";
import {ChevronRight} from "lucide-react";
import styles from "./home.module.css";

type SectionHeadingProps = {
  id:string;
  eyebrow:string;
  title:string;
  description?:string;
  link?:{href:string;label:string};
};

export function SectionHeading({id,eyebrow,title,description,link}:SectionHeadingProps) {
  return <div className={styles.sectionHeading}>
    <div><span className={styles.eyebrow}>{eyebrow}</span><h2 id={id}>{title}</h2>{description&&<p>{description}</p>}</div>
    {link&&<Link className={styles.sectionLink} href={link.href}>{link.label}<ChevronRight size={16} aria-hidden="true"/></Link>}
  </div>;
}
