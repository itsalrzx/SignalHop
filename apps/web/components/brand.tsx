import { ArrowUpRight } from 'lucide-react';
export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-[-0.7px]">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#13795b] text-white">
        <ArrowUpRight size={23} strokeWidth={2.5} />
      </span>
      signalhop<span className="-ml-1 text-[#13795b]">.</span>
    </span>
  );
}
