'use client';
import Link from 'next/link';
import { ArrowRight, Link2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, type LinkPage } from '@/lib/api';
import { useAuth } from '@/components/providers';
import { LinkDialog } from '@/components/link-dialog';
import { LinksTable } from '@/components/links-table';
import { Button } from '@/components/ui/button';
export default function DashboardPage() {
  const { user } = useAuth();
  const links = useQuery({
    queryKey: ['links', 1],
    queryFn: () => api<LinkPage>('/links?page=1&limit=10'),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">YOUR WORKSPACE</p>
          <h1>Overview.</h1>
          <p>Create short links, copy them, and open your redirects.</p>
        </div>
        <LinkDialog />
      </div>
      <section className="welcome-card mb-7">
        <div>
          <p className="eyebrow !text-[#a6cbb8]">READY TO SHARE</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Welcome back{user ? ', ' + user.name : ''}.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#cbe0d4]">
            {links.data
              ? `You currently have ${links.data.total} short ${links.data.total === 1 ? 'link' : 'links'} stored in PostgreSQL.`
              : 'Create your first short link to start redirecting visitors.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              asChild
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/links">
                Manage links <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="welcome-arrow" aria-hidden="true">
          <Link2 size={44} />
        </div>
      </section>
      <div className="section-heading">
        <h2>Recent links</h2>
        <span>Most recently created first</span>
      </div>
      <LinksTable compact />
    </>
  );
}
