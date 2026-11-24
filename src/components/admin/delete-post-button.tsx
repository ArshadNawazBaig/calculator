'use client';

import {startTransition, useActionState, useId} from 'react';
import {Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay} from 'react-aria-components';
import {Trash2} from 'lucide-react';
import {deletePostAction} from '@/app/(en)/admin/actions';
import Link from '@/components/document-link';
import {useHydrated} from '@/lib/use-hydrated';
import styles from './admin.module.css';

type Props = {id: string; version: number; title: string; disabled?: boolean};

export function DeletePostButton({id, version, title, disabled}: Props) {
  const hydrated = useHydrated();
  const descriptionId = useId();
  const [failure, remove, pending] = useActionState(() => deletePostAction(id, version), null);

  return <DialogTrigger>
    <Button type="button" className={`button button-ghost ${styles.dangerButton} ${styles.deleteTrigger}`} aria-label={`Delete article “${title}”`} isDisabled={!hydrated || disabled || pending}>
      <Trash2 size={16} aria-hidden="true"/>Delete article
    </Button>
    <ModalOverlay className={styles.deleteOverlay} isDismissable={!pending} isKeyboardDismissDisabled={pending}>
      <Modal className={styles.deleteModal}>
        <Dialog role="alertdialog" aria-describedby={descriptionId} className={styles.deleteDialog}>
          <Heading slot="title">Delete article?</Heading>
          <p id={descriptionId}>This will permanently delete <strong>“{title}”</strong> from Finflo.</p>
          {failure && <div role="alert" className={styles.error}>{failure.message}
            {failure.conflict && <> <Link href={`/admin/posts/${id}`}>Review the latest version</Link></>}
            {failure.signInRequired && <> <Link href="/admin/sign-in" target="_blank" rel="noopener noreferrer">Sign in again</Link></>}
          </div>}
          <div className={styles.actions}>
            <Button type="button" slot="close" autoFocus className="button button-secondary" isDisabled={pending}>Cancel</Button>
            <Button type="button" className={`button button-secondary ${styles.dangerButton}`} isDisabled={pending || failure?.conflict} onPress={() => startTransition(remove)}>
              {pending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>;
}
