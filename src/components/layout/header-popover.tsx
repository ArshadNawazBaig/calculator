'use client';
import dynamic from 'next/dynamic';
import {useId, useRef, useState, type ReactNode} from 'react';
import {useHydrated} from '@/lib/use-hydrated';

const AnchoredDialog = dynamic(() => import('@/components/ui/anchored-popover').then(module => module.AnchoredDialog));

type HeaderPopoverProps = {
  label: string; description: string; trigger: ReactNode; triggerClassName: string;
  dialogLabel: string; dialogClassName: string; popoverClassName: string; children: ReactNode;
};

export function HeaderPopover({label, description, trigger, triggerClassName, dialogLabel, dialogClassName, popoverClassName, children}: HeaderPopoverProps) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const button = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const descriptionId = useId();
  function changeOpen(value: boolean) {
    setOpen(value);
    if (!value) button.current?.focus({preventScroll: true});
  }
  return <>
    <button type="button" ref={button} disabled={!hydrated} className={triggerClassName}
      aria-label={label} aria-describedby={descriptionId} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined}
      onClick={() => changeOpen(!open)} onKeyDown={event => {if (open && event.key === 'Escape') changeOpen(false);}}>
      {trigger}
    </button>
    <span id={descriptionId} hidden>{description}</span>
    {open && <AnchoredDialog isOpen triggerRef={button} onOpenChange={changeOpen} placement="bottom end" offset={10}
      dialogId={dialogId} label={dialogLabel} dialogClassName={dialogClassName} className={popoverClassName} data-theme-surface="dark">
      {children}
    </AnchoredDialog>}
  </>;
}
