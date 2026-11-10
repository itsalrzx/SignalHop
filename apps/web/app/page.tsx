'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Server, Database } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
type Health = { status: string; dependencies: { postgres: string; redis: string } };
export default function Foundation() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/health', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Dependencies are unavailable. Check the API logs.');
        setHealth((await response.json()) as Health);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Cannot reach the API.');
      });
    return () => controller.abort();
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col px-6 py-10 sm:px-10">
      <Brand />
      <section className="my-auto py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Phase 0 · Project foundation
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          A solid start for better links.
        </h1>
        <p className="mt-5 max-w-xl leading-7 text-slate-600">
          SignalHop’s application foundation is ready for review. Account, link management, and
          analytics features belong to later phases.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-emerald-100 bg-white p-6">
            <Server className="mb-4 text-emerald-700" aria-hidden="true" size={24} />
            <h2 className="font-semibold">Application foundation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Next.js, NestJS, TypeScript, and documented health endpoints.
            </p>
          </section>
          <section
            className="rounded-2xl border border-emerald-100 bg-white p-6"
            aria-live="polite"
          >
            <Database className="mb-4 text-emerald-700" aria-hidden="true" size={24} />
            <h2 className="font-semibold">Connected services</h2>
            {error ? (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {error}
              </p>
            ) : health ? (
              <p className="mt-2 flex items-center gap-2 text-sm leading-6 text-emerald-800">
                <CheckCircle2 size={16} aria-hidden="true" />
                PostgreSQL {health.dependencies.postgres} · Redis {health.dependencies.redis}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Checking the backend…</p>
            )}
          </section>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <a href="/docs">
              API documentation <ArrowUpRight size={16} />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/health">Dependency health</a>
          </Button>
        </div>
      </section>
      <footer className="text-xs text-slate-600">
        Local Docker Compose infrastructure · No sample product data
      </footer>
    </main>
  );
}
