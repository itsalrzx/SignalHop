'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, QrCode } from 'lucide-react';
import { apiBlob, type ShortLink } from '@/lib/api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
export function QRDialog({ link }: { link: ShortLink }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const query = useQuery({
    queryKey: ['qr', link.id],
    queryFn: () => apiBlob('/links/' + link.id + '/qr'),
    enabled: open,
    staleTime: Infinity,
  });
  useEffect(() => {
    if (!query.data) return;
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={'QR code for ' + (link.title || link.code)}>
          <QrCode size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle className="mt-2 text-xl font-semibold">Made to be scanned.</DialogTitle>
        <DialogDescription className="mt-3 text-xs leading-6 text-[#718174]">
          A little bridge to {link.title || 'your link'}.<br />
          This code follows your short URL, even when the destination changes.
        </DialogDescription>
        <div className="mx-auto my-6 flex size-52 items-center justify-center rounded-xl border border-[#e7ece5] bg-white">
          {query.error ? (
            <p role="alert" className="p-4 text-xs text-red-700">
              {query.error.message}
            </p>
          ) : url ? (
            <img src={url} width={192} height={192} alt={'QR code for ' + link.code} />
          ) : (
            <Loader2 size={24} className="animate-spin text-[#91ae99]" />
          )}
        </div>
        <p className="mb-5 break-all font-mono text-[10px] text-[#7b8b7d]">{link.shortUrl}</p>
        <Button className="w-full" asChild disabled={!url}>
          {url ? (
            <a href={url} download={'signalhop-' + link.code + '.png'}>
              <Download size={15} />
              Download PNG
            </a>
          ) : (
            <span>
              <Loader2 size={15} className="animate-spin" />
              Preparing your code…
            </span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
