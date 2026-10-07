'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing your sign-in…');

  useEffect(() => {
    const completeAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const next = url.searchParams.get('next') || '/account';
      if (!code) {
        window.location.replace('/auth');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage('This link is invalid or has expired. Please request a new one.');
        return;
      }
      window.location.replace(next.startsWith('/') ? next : '/auth');
    };

    void completeAuth();
  }, []);

  return <main className="auth-page"><section className="auth-card auth-callback"><h1>{message}</h1><p>You can close this page if nothing happens.</p></section></main>;
}
