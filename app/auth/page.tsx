'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type AuthMode = 'signin' | 'signup' | 'recovery' | 'reset';

const HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/;

function getInitialMode(): AuthMode {
  if (typeof window === 'undefined') return 'signin';
  const requestedMode = new URLSearchParams(window.location.search).get('mode');
  return requestedMode === 'signup' || requestedMode === 'reset' ? requestedMode : 'signin';
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setCanResetPassword(Boolean(data.user));
      if (data.user && mode !== 'reset') window.location.replace('/account');
    });
  }, [mode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage(null);
    setError(null);
    setPassword('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'signup' && !HANDLE_PATTERN.test(handle)) {
      setError('Choose a handle with 3–24 lowercase letters, numbers, or underscores.');
      return;
    }
    if ((mode === 'signin' || mode === 'signup' || mode === 'reset') && password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { handle },
          },
        });
        if (signUpError) throw signUpError;
        setMessage('Check your inbox to confirm your email address, then sign in.');
        setPassword('');
      }

      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.assign('/account');
      }

      if (mode === 'recovery') {
        const resetDestination = new URL('/auth', window.location.origin);
        resetDestination.searchParams.set('mode', 'reset');
        const callbackUrl = new URL('/auth/callback', window.location.origin);
        callbackUrl.searchParams.set('next', `${resetDestination.pathname}${resetDestination.search}`);
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl.toString(),
        });
        if (recoveryError) throw recoveryError;
        setMessage('If an account exists for that email, a password-reset link is on its way.');
      }

      if (mode === 'reset') {
        if (!canResetPassword) {
          setError('This password-reset link is invalid or has expired. Request a new one below.');
          setMode('recovery');
          return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage('Your password has been updated. You can return to your trainer home.');
        setPassword('');
      }
    } catch (authError) {
      const detail = authError instanceof Error ? authError.message : 'Something went wrong. Please try again.';
      setError(mode === 'signup' && /profile|handle|unique/i.test(detail)
        ? 'That handle is unavailable. Please choose another one.'
        : detail);
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'signup' ? 'Join DexLab' : mode === 'recovery' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Welcome back';
  const buttonLabel = mode === 'signup' ? 'Create account' : mode === 'recovery' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in';

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/" aria-label="DexLab home"><span className="pokeball" aria-hidden="true"><i /></span><span>Dex<span>Lab</span></span></Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow"><span /> Trainer account</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">{mode === 'signup' ? 'Save your trainer identity for future collections and favorites.' : 'Your Pokédex is always here when you need it.'}</p>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <label>Handle
            <input value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} name="handle" autoComplete="username" minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required placeholder="misty_99" />
            <small>3–24 lowercase letters, numbers, or underscores.</small>
          </label>}
          {mode !== 'reset' && <label>Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" required placeholder="trainer@example.com" />
          </label>}
          {mode !== 'recovery' && <label>{mode === 'reset' ? 'New password' : 'Password'}
            <input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" autoComplete={mode === 'reset' ? 'new-password' : mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required />
          </label>}

          {error && <p className="auth-notice error" role="alert">{error}</p>}
          {message && <p className="auth-notice success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Working…' : buttonLabel}</button>
        </form>

        <div className="auth-links">
          {mode === 'signin' && <><button onClick={() => switchMode('recovery')}>Forgot password?</button><button onClick={() => switchMode('signup')}>Need an account? Sign up</button></>}
          {mode === 'signup' && <button onClick={() => switchMode('signin')}>Already have an account? Sign in</button>}
          {mode === 'recovery' && <button onClick={() => switchMode('signin')}>Back to sign in</button>}
          {mode === 'reset' && <><Link href="/account">Trainer home</Link><button onClick={() => switchMode('recovery')}>Request a new link</button></>}
        </div>
      </section>
    </main>
  );
}
