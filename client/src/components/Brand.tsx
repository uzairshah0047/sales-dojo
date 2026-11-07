interface MarkProps {
  className?: string;
  /** Decorative marks pass an empty alt; the wordmark keeps the accessible name. */
  alt?: string;
}

export function BrandMark({ className = "h-9 w-9", alt = "Sales Dojo" }: MarkProps) {
  return (
    <img
      src="/brand/sellio-logo.png"
      alt={alt}
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className="h-9 w-9" alt="" />
      <span className="text-[22px] font-extrabold tracking-[-0.045em] text-ink">Sales Dojo</span>
    </span>
  );
}
