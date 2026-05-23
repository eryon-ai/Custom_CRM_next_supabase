'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set New Password"
      subtitle={done ? 'Password updated!' : 'Enter your new password'}
      footer={
        <span>
          <Link className="text-blue-600 font-medium hover:underline" href="/login">
            Back to login
          </Link>
        </span>
      }
    >
      {done ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleUpdate}>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <input
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm"
            placeholder="New password (min 6 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
