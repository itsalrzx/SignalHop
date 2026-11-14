'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Brand } from './brand';
import { useAuth } from './providers';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);
  useEffect(() => {
    setMobile(false);
  }, [pathname]);
  if (loading || !user)
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 text-[#13795b]">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm">Opening your space…</span>
      </div>
    );
  const nav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/links', label: 'My links', icon: Link2 },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  return (
    <div>
      <div className="mobile-bar">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label={mobile ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobile}
          aria-controls="primary-navigation"
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      {mobile && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="primary-navigation" className={cn('sidebar', mobile && 'sidebar-open')}>
        <Link href="/dashboard" className="mb-12 w-fit">
          <Brand />
        </Link>
        <p className="eyebrow mb-4 px-3">YOUR WORKSPACE</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={cn(
                'nav-item',
                (pathname === item.href ||
                  (item.href === '/links' && pathname.startsWith('/links/'))) &&
                  'nav-active',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="nav-item mb-5">
            <BookOpen size={17} />
            API documentation
            <ArrowUpRight size={14} className="ml-auto" />
          </a>
          <div className="border-t border-[#edf0ed] pt-5">
            <div className="flex items-center gap-3 px-1">
              <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#718075]">Personal account</p>
              </div>
              <button
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void logout().catch(() => router.replace('/login'))}
                className="rounded-md p-2 text-[#718075] hover:bg-[#f2f5f3]"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <span className="text-xs text-[#8a958f]">
            Workspace <span className="mx-2 text-[#c4cbc6]">/</span>
            <span className="font-medium text-[#526359]">
              {nav.find((n) => n.href === pathname)?.label || 'Link detail'}
            </span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-[#e3e9e4] bg-white px-3 py-1.5 text-[11px] text-[#69796e]">
            <span className="size-1.5 rounded-full bg-[#48a67d]" />
            Personal workspace
          </span>
        </header>
        <main className="main-content">{children}</main>
        <footer className="app-footer">
          <span>Made for the links that matter.</span>
          <span className="font-medium">
            SignalHop <span className="text-[#b2bcb5]">/</span> A little goes a long way.
          </span>
        </footer>
      </div>
    </div>
  );
}
