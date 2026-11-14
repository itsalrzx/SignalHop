'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2, Pencil, Plus } from 'lucide-react';
import { api, type ShortLink } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog';
function localDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function LinkDialog({ link }: { link?: ShortLink }) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const expiration = localDate(link?.expiresAt || null);
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(link ? '/links/' + link.id : '/links', {
        method: link ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['links'] });
      void client.invalidateQueries({ queryKey: ['analytics'] });
      setOpen(false);
    },
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      destination: String(data.get('destination')).trim(),
      title: String(data.get('title')).trim(),
    };
    const expires = String(data.get('expiresAt'));
    if (!link || expires !== expiration)
      body.expiresAt = expires ? new Date(expires).toISOString() : null;
    if (link) body.enabled = data.get('enabled') === 'on';
    else if (data.get('customCode')) body.customCode = data.get('customCode');
    mutation.mutate(body);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        mutation.reset();
      }}
    >
      <DialogTrigger asChild>
        {link ? (
          <Button size="icon" variant="ghost" aria-label={'Edit ' + (link.title || link.code)}>
            <Pencil size={15} />
          </Button>
        ) : (
          <Button>
            <Plus size={16} />
            Create link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#eaf5ef] text-[#13795b]">
          <Link2 size={22} />
        </div>
        <DialogTitle className="text-xl font-semibold tracking-tight">
          {link ? 'Edit link' : 'Create a short link'}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-[#7b877f]">
          {link
            ? 'Update the destination without changing your short URL.'
            : 'Give a long URL a simpler home.'}
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="field-label">
            Destination URL
            <Input
              name="destination"
              type="url"
              required
              maxLength={2048}
              defaultValue={link?.destination}
              placeholder="https://example.com/something-great"
              autoFocus
            />
          </label>
          <label className="field-label">
            Title <span className="font-normal text-[#718174]">(optional)</span>
            <Input
              name="title"
              maxLength={120}
              defaultValue={link?.title || ''}
              placeholder="A name you’ll remember"
            />
          </label>
          {!link ? (
            <label className="field-label">
              Custom short code <span className="font-normal text-[#718174]">(optional)</span>
              <div className="mt-2 flex items-center overflow-hidden rounded-lg border border-[#dfe5e1]">
                <span className="border-r border-[#e5eae6] bg-[#f8faf8] px-3 py-3 text-xs text-[#91a096]">
                  /r/
                </span>
                <Input
                  name="customCode"
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9_-]{3,32}"
                  placeholder="something-memorable"
                  className="rounded-none border-0 shadow-none"
                />
              </div>
              <span className="mt-2 block text-[10px] font-normal text-[#718174]">
                Letters, numbers, hyphens, underscores. Codes are case-sensitive.
              </span>
            </label>
          ) : (
            <p className="rounded-lg bg-[#f5f8f4] p-3 text-xs text-[#7c8e7e]">
              Short code <strong className="font-mono">{link.code}</strong> stays the same.
            </p>
          )}
          <label className="field-label">
            Expiration <span className="font-normal text-[#718174]">(optional, local time)</span>
            <Input name="expiresAt" type="datetime-local" defaultValue={expiration} />
            <span className="mt-2 block text-[10px] font-normal text-[#718174]">
              Leave empty to keep your link available indefinitely.
            </span>
          </label>
          {link && (
            <label className="flex items-center justify-between rounded-lg border border-[#e4ebe5] p-3 text-sm">
              <span>
                Link enabled
                <span className="mt-1 block text-xs text-[#96a198]">
                  Disabled links won’t redirect visitors.
                </span>
              </span>
              <input
                name="enabled"
                type="checkbox"
                role="switch"
                defaultChecked={link.enabled}
                className="size-5 accent-[#13795b]"
              />
            </label>
          )}
          {mutation.error && (
            <p role="alert" className="error-banner">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end border-t border-[#edf0ed] pt-5">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : link ? (
                <Pencil size={15} />
              ) : (
                <Plus size={16} />
              )}{' '}
              {link ? 'Save changes' : 'Create short link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
