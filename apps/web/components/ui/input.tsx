import * as React from 'react';
import { cn } from '@/lib/utils';
export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-lg border border-[#dfe5e1] bg-white px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-[#9aa59f] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
