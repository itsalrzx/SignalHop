'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LinkPage, type ShortLink } from '@/lib/api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { LinkDialog } from './link-dialog';
import { QRDialog } from './qr-dialog';
export function LinksTable({ compact = false }: { compact?: boolean }) {
  const client = useQueryClient();
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  const [deleting, setDeleting] = useState<ShortLink | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setSearch(term), 250);
    return () => clearTimeout(id);
  }, [term]);
  const params = new URLSearchParams({ page: String(page), limit: '10', status, search });
  const query = useQuery({
    queryKey: ['links', page, status, search],
    queryFn: () => api<LinkPage>('/links?' + params),
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api('/links/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      setDeleting(null);
      void client.invalidateQueries({ queryKey: ['links'] });
      void client.invalidateQueries({ queryKey: ['analytics'] });
      if (query.data?.items.length === 1 && page > 1) setPage(page - 1);
    },
  });
  async function copy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setCopyError('');
    } catch {
      setCopyError('Could not copy. Select and copy the short URL manually.');
    }
  }
  return (
    <>
      {!compact && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-[310px]">
            <Search size={15} className="absolute left-3 top-3 text-[#718174]" />
            <input
              aria-label="Search links"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search your links…"
              className="h-10 w-full rounded-lg border border-[#e2e8e2] bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-600"
            />
          </label>
          <select
            aria-label="Filter by status"
            className="h-10 rounded-lg border border-[#e2e8e2] bg-white px-3 text-xs text-[#718075]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      )}
      {query.error ? (
        <div role="alert" className="error-banner">
          {query.error.message}
          <button className="ml-3 underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {copyError && (
            <p role="alert" className="error-banner m-4">
              {copyError}
            </p>
          )}
          {query.isPending ? (
            <div className="p-12 text-center text-sm text-[#8a958e]">Loading your links…</div>
          ) : !query.data?.items.length ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-9 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#4f8f6c]">
                <Link2 size={24} />
              </span>
              <h3 className="font-semibold">
                {search || status !== 'all'
                  ? 'No links match your filters.'
                  : 'Your next great link starts here.'}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#8a958e]">
                {search || status !== 'all'
                  ? 'Try another search or a different status.'
                  : 'Create your first short link and keep everything worth sharing in one place.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="links-table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th>Destination</th>
                    <th>Clicks</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((link) => {
                    const expired =
                      link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
                    const state = expired ? 'Expired' : link.enabled ? 'Active' : 'Disabled';
                    return (
                      <tr key={link.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="link-tile">
                              <Link2 size={19} />
                            </span>
                            <div>
                              <Link
                                href={'/links/' + link.id}
                                className="block max-w-[220px] truncate font-medium text-[#37483d] hover:text-[#13795b]"
                              >
                                {link.title || new URL(link.destination).hostname}
                              </Link>
                              <a
                                className="mt-1 inline-flex items-center gap-1 whitespace-nowrap text-xs text-[#27815f] hover:underline"
                                href={'/r/' + link.code}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {new URL(link.shortUrl).host}/r/{link.code}
                                <ArrowUpRight size={11} />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="block max-w-[180px] truncate text-xs text-[#718075]"
                            title={link.destination}
                          >
                            {link.destination}
                          </span>
                        </td>
                        <td className="tabular-nums text-[#718575]">
                          {new Intl.NumberFormat().format(link.clicks || 0)}
                        </td>
                        <td>
                          <span
                            className={
                              'status-badge ' +
                              (state === 'Active'
                                ? 'status-active'
                                : state === 'Expired'
                                  ? 'status-expired'
                                  : 'status-disabled')
                            }
                          >
                            <span className="size-1 rounded-full bg-current" />
                            {state}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={'Copy ' + link.code}
                              onClick={() => void copy(link.id, link.shortUrl)}
                            >
                              {copied === link.id ? (
                                <Check size={15} className="text-[#13795b]" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </Button>
                            <QRDialog link={link} />
                            <LinkDialog link={link} />
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={'Delete ' + (link.title || link.code)}
                              onClick={() => {
                                setDeleting(link);
                                remove.reset();
                              }}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {query.data && (
            <div className="flex items-center justify-between gap-2 border-t border-[#edf0ed] px-5 py-3 text-[11px] text-[#718174]">
              <span>
                {query.data.total
                  ? (query.data.page - 1) * 10 +
                    1 +
                    '–' +
                    Math.min(query.data.page * 10, query.data.total) +
                    ' of '
                  : ''}
                {query.data.total} links
              </span>
              {!compact && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    disabled={page === 1 || query.isFetching}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="px-1">Page {page}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    disabled={!query.data || page * 10 >= query.data.total || query.isFetching}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">Delete this link?</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-[#7c8980]">
            “{deleting?.title || deleting?.code}” will stop redirecting. Its short code cannot be
            reused.
          </DialogDescription>
          {remove.error && (
            <p role="alert" className="error-banner mt-4">
              {remove.error.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep link
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending && <Loader2 className="animate-spin" size={16} />}Delete link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
