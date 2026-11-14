'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog';
export function LinkDialog() {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: { destination: string; title?: string }) =>
      api('/links', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['links'] });
      setOpen(false);
    },
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = String(data.get('title')).trim();
    mutation.mutate({
      destination: String(data.get('destination')).trim(),
      ...(title ? { title } : {}),
    });
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
        <Button>
          <Plus size={16} />
          Create link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#eaf5ef] text-[#13795b]">
          <Link2 size={22} />
        </div>
        <DialogTitle className="text-xl font-semibold tracking-tight">
          Create a short link
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-[#7b877f]">
          Give a long URL a simpler home.
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="field-label">
            Destination URL
            <Input
              name="destination"
              type="url"
              required
              maxLength={2048}
              placeholder="https://example.com/something-great"
              autoFocus
            />
          </label>
          <label className="field-label">
            Title <span className="font-normal text-[#718174]">(optional)</span>
            <Input name="title" maxLength={120} placeholder="A name you’ll remember" />
          </label>
          {mutation.error && (
            <p role="alert" className="error-banner">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end border-t border-[#edf0ed] pt-5">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}{' '}
              Create short link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
