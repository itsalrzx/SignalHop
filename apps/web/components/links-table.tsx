'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Link2 } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, type LinkPage } from '@/lib/api';
import { Button } from './ui/button';
export function LinksTable({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  const query = useQuery({
    queryKey: ['links', page],
    queryFn: () => api<LinkPage>('/links?' + params),
    placeholderData: keepPreviousData,
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
  if (query.error)
    return (
      <div role="alert" className="error-banner">
        {query.error.message}
        <button className="ml-3 underline" onClick={() => void query.refetch()}>
          Try again
        </button>
      </div>
    );
  return (
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
          <h3 className="font-semibold">Your next great link starts here.</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#8a958e]">
            Create your first short link and keep everything worth sharing in one place.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="links-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Destination</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((link) => {
                const expired = link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
                const state = expired ? 'Expired' : link.enabled ? 'Active' : 'Disabled';
                return (
                  <tr key={link.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="link-tile">
                          <Link2 size={19} />
                        </span>
                        <div>
                          <span className="block max-w-[220px] truncate font-medium text-[#37483d]">
                            {link.title || new URL(link.destination).hostname}
                          </span>
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
                        className="block max-w-[220px] truncate text-xs text-[#718075]"
                        title={link.destination}
                      >
                        {link.destination}
                      </span>
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
  );
}
