export function SearchIcon({ className = "", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={`ui-icon ${className}`} fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}