interface MarkProps {
  className?: string;
  tone?: "orange" | "ink" | "cream";
}

export function BlobMark({ className = "h-9 w-9", tone = "orange" }: MarkProps) {
  const body = tone === "ink" ? "#141313" : tone === "cream" ? "#ffe8d6" : "#ff7300";
  const face = tone === "cream" ? "#141313" : "#ffffff";

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Sellio"
      fill="none"
    >
      <path
        d="M24 3.5c10.8 0 20.5 7.4 20.5 19.2 0 10.4-6.9 17.6-15.2 20.2-2.9.9-5.9 1.6-8.6 1.1-9.7-1.7-17.2-9.3-17.2-20.6C3.5 11.5 13.2 3.5 24 3.5Z"
        fill={body}
      />
      <circle cx="18.4" cy="22" r="2.4" fill={face} />
      <circle cx="29.6" cy="22" r="2.4" fill={face} />
      <path
        d="M18.6 28.2c1.6 2.6 4.1 3.9 6.4 3.9 2.4 0 4.7-1.3 6.3-3.9"
        stroke={face}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BlobMark className="h-8 w-8" />
      <span className="text-[22px] font-extrabold tracking-[-0.045em] text-ink">
        sellio
      </span>
    </span>
  );
}
