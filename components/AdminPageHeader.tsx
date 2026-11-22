import type { LucideIcon } from "lucide-react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
};

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#10161a] px-6 py-7 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div className="mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] sm:flex">
              <Icon size={20} className="text-blue-200" />
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-blue-300/60">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">{description}</p>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
