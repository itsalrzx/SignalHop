'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Link2, Loader2, ShieldCheck } from 'lucide-react';
import { api, signIn } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from './brand';
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get('email'));
      const password = String(data.get('password'));
      if (register)
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: data.get('name'), email, password }),
        });
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="flex min-h-dvh flex-col px-6 py-9 sm:px-12 lg:px-20">
        <Link href="/" className="w-fit">
          <Brand />
        </Link>
        <div className="m-auto w-full max-w-[370px] py-14">
          <p className="eyebrow mb-3">A LITTLE LINK GOES A LONG WAY</p>
          <h1 className="text-[32px] font-semibold tracking-[-1.1px]">
            {register ? 'Make room for better links.' : 'Welcome back.'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#78847c]">
            {register
              ? 'One home for your links. A clearer view of what comes next.'
              : 'Your links, insights, and next big idea are right here.'}
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            {register && (
              <label className="field-label">
                Full name
                <Input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label className="field-label">
              Email address
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>
            <label className="field-label">
              Password
              <span className="relative block">
                <Input
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  minLength={10}
                  maxLength={128}
                  required
                  placeholder={register ? 'At least 10 characters' : 'Enter your password'}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-[#8b9790]"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {error && (
              <p role="alert" className="error-banner">
                {error}
              </p>
            )}
            <Button disabled={busy} className="h-11 w-full" type="submit">
              {busy ? <Loader2 size={17} className="animate-spin" /> : null}
              {register ? 'Create account' : 'Sign in'}
              <ArrowRight size={16} />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#7c8981]">
            {register ? 'Already have an account?' : 'New to SignalHop?'}{' '}
            <Link
              className="font-medium text-[#13795b] hover:underline"
              href={register ? '/login' : '/register'}
            >
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-[#8c9890]">
          <ShieldCheck size={14} /> Your links. Your space.
        </p>
      </section>
      <aside className="auth-art">
        <div className="relative z-10 max-w-sm">
          <span className="mb-10 inline-flex rounded-2xl border border-white/20 bg-white/10 p-4">
            <Link2 size={42} />
          </span>
          <h2 className="text-[48px] font-medium leading-[1.12] tracking-[-2px]">
            Small links.
            <br />
            Bigger possibilities.
          </h2>
          <p className="mt-6 max-w-[290px] text-[15px] leading-7 text-[#b9d4c7]">
            Create something worth sharing. Keep it organized. See where it takes you.
          </p>
          <div className="mt-10 h-px w-12 bg-[#85b49e]" />
          <p className="mt-5 text-xs uppercase tracking-[2px] text-[#9fc5b3]">
            Less friction. More connection.
          </p>
        </div>
      </aside>
    </main>
  );
}
