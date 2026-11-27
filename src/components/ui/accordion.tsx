import type {ComponentProps,ComponentPropsWithoutRef,ReactNode} from 'react';
import styles from './accordion.module.css';

export function Accordion({children,className='',...props}:ComponentPropsWithoutRef<'div'>){
  return <div {...props} className={`${styles.group} ${className}`}>{children}</div>;
}

type AccordionItemProps=Omit<ComponentProps<'details'>,'title'> & {title:ReactNode};

export function AccordionItem({title,children,className='',...props}:AccordionItemProps){
  return <details {...props} className={`${styles.item} ${className}`}>
    <summary className={styles.trigger}>
      <span className={styles.title}>{title}</span>
      <span className={styles.icon} aria-hidden="true">+</span>
    </summary>
    <div className={styles.content}>{children}</div>
  </details>;
}
