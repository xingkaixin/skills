import { Link } from "react-router-dom";

export function SiteBrand({
  subtle = false,
}: {
  subtle?: boolean;
}) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M15 12h-5"/>
          <path d="M15 8h-5"/>
          <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
          <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 0 0-2 2z"/>
        </svg>
      </span>
      <span
        className={`font-semibold text-sm ${subtle ? "text-text-muted" : "text-text"}`}
      >
        XingKaiXin&apos;s Skills
      </span>
    </Link>
  );
}
