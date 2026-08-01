'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (clean.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Check if username is already taken
    const { data: existing } = await supabase.rpc('get_email_by_username', { p_username: clean });
    if (existing) {
      setError('Username already taken.');
      setLoading(false);
      return;
    }

    const fakeEmail = `${clean}@itravel.app`;
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: { data: { name: username.trim(), username: clean } },
    });

    if (authError) {
      setError(typeof authError.message === 'string' ? authError.message : JSON.stringify(authError));
      setLoading(false);
    } else if (signUpData.user && !signUpData.session) {
      // Email confirmation is still enabled in Supabase — prompt user to disable it
      setError('Account created but email confirmation is required. Please disable "Confirm email" in Supabase Auth settings.');
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">🌍</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start managing your trips</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2.5 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
