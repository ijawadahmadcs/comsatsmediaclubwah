import type { LucideIcon } from "lucide-react";

type PublicPageHeaderProps = {
  eyebrow: string;
  title: string;
  highlightedTitle?: string;
  description: string;
  icon?: LucideIcon;
};

export default function PublicPageHeader({
  eyebrow,
  title,
  highlightedTitle,
  description,
  icon: Icon,
}: PublicPageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-500/[0.08] blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative flex items-start justify-between gap-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-300/[0.07]">
                <Icon size={17} className="text-blue-200" />
              </span>
            ) : null}
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">{eyebrow}</p>
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.92] tracking-tight text-white sm:text-7xl lg:text-8xl">
            {title}
            {highlightedTitle ? (
              <>
                <br />
                <span className="text-white/30">{highlightedTitle}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">{description}</p>
        </div>
      </div>
    </header>
  );
}
