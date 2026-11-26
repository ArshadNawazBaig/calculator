"use client";
import {Button, Dialog, Heading, Modal, ModalOverlay} from 'react-aria-components';
import {ChevronRight, X} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import Link from '@/components/i18n/link';
import {Search} from '@/components/search';
import {ToolIcon} from '@/components/ui/tool-icon';
import styles from './header.module.css';

const popular=[
  {slug:"mortgage-calculator",label:"Mortgage calculator",description:"Plan your monthly home payment.",category:"finance"},
  {slug:"compound-interest-calculator",label:"Compound interest",description:"See how your savings could grow.",category:"finance"},
  {slug:"bmi-calculator",label:"BMI calculator",description:"Check your body mass index.",category:"health"},
  {slug:"age-calculator",label:"Age calculator",description:"Find an age in years, months, and days.",category:"everyday"},
] as const;

export default function HeaderSearchDialog({id, onClose}: {id: string; onClose: () => void}) {
  const {t, locale} = useI18n();
  return <ModalOverlay isOpen isDismissable onOpenChange={open => {if (!open) onClose();}} className={styles.searchOverlay}>
      <Modal className={styles.searchModal} data-theme-surface="dark">
        <Dialog id={id} className={styles.searchDialog}>
          <div className={styles.searchHeading}><Heading slot="title">{t("Find a calculator")}</Heading><Button onPress={onClose} className={styles.closeSearch} aria-label={t("Close search")}><X size={20} aria-hidden="true"/></Button></div>
          <Search autoFocus suggestionLayout="inline" onNavigate={onClose} placeholder={t("Search calculators…")} emptyContent={<>
          <p className={styles.popularLabel}>{t("Popular calculators")}</p>
          <div className={styles.popularLinks}>{popular.map(tool=><Link key={tool.slug} href={`/${tool.slug}`} onClick={onClose}><span className={styles.popularIcon}><ToolIcon slug={tool.slug} size={20}/></span><span><strong>{locale==='en'?tool.label:t(`tool.${tool.slug}`)}</strong>{locale==='en'&&<small>{tool.description}</small>}</span><ChevronRight size={16} aria-hidden="true"/></Link>)}</div>
          <div className={styles.searchFooter}><span>{t("Free calculators for money, health, math, and everyday life.")}</span><span><kbd>Esc</kbd> {t("to close")}</span></div>
          </>}/>
        </Dialog>
      </Modal>
    </ModalOverlay>;
}
