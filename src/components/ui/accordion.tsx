import type {ComponentPropsWithoutRef,ReactNode} from 'react';
import {Plus} from 'lucide-react';
import styles from './accordion.module.css';

export function Accordion({children,className='',...props}:ComponentPropsWithoutRef<'div'>){
  return <div {...props} className={`${styles.group} ${className}`}>{children}</div>;
}

type AccordionItemProps=Omit<ComponentPropsWithoutRef<'details'>,'title'> & {title:ReactNode};

export function AccordionItem({title,children,className='',...props}:AccordionItemProps){
  return <details {...props} className={`${styles.item} ${className}`}>
    <summary className={styles.trigger}>
      <span className={styles.title}>{title}</span>
      <Plus className={styles.icon} size={20} aria-hidden="true"/>
    </summary>
    <div className={styles.content}>{children}</div>
  </details>;
}
