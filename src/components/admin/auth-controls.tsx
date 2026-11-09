'use client';

import {createAuthClient} from 'better-auth/react';
import {useState, type FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {TextField} from '@/components/ui/text-field';
import {useHydrated} from '@/lib/use-hydrated';
import styles from './admin.module.css';

const authClient = createAuthClient();

export function AdminSignIn() {
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated || pending) return;
    const fields = new FormData(event.currentTarget);
    setError(''); setPending(true);
    try {
      const result = await authClient.signIn.email({email: String(fields.get('email') || '').trim(), password: String(fields.get('password') || ''), rememberMe: false});
      if (result.error) {
        if (result.error.status === 403) setError('This address is not allowed for sign-in. Open the configured site address and try again.');
        else if (result.error.status === 429) setError('Too many attempts. Wait a few minutes before trying again.');
        else if (result.error.status === 401) setError('Email or password is incorrect.');
        else setError('Sign-in is temporarily unavailable. Please try again shortly.');
      }
      else window.location.assign(new URL('/admin', window.location.origin).href);
    } catch {setError('Sign-in is temporarily unavailable. Please try again.');}
    finally {setPending(false);}
  }
  return <form method="post" onSubmit={submit} className={styles.form}>
    <TextField label="Email address" name="email" type="email" autoComplete="username" required maxLength={254} disabled={!hydrated || pending}/>
    <TextField label="Password" name="password" type="password" autoComplete="current-password" required minLength={16} maxLength={128} disabled={!hydrated || pending}/>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <Button type="submit" disabled={!hydrated || pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
    <noscript><p>Enable JavaScript to sign in securely.</p></noscript>
  </form>;
}

export function AdminSignOut() {
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    setPending(true); setError('');
    try {
      const result = await authClient.signOut();
      if (result.error) setError('Could not sign out. Please try again.');
      else window.location.assign(new URL('/admin/sign-in', window.location.origin).href);
    } catch {setError('Could not sign out. Please try again.');}
    finally {setPending(false);}
  }
  return <div className={styles.signOut}><Button type="button" variant="ghost" disabled={!hydrated || pending} onClick={signOut}>{pending ? 'Signing out…' : 'Sign out'}</Button>{error && <span role="alert">{error}</span>}</div>;
}
