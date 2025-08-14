export function HeartFilledIcon({ className = "", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={`ui-icon ${className}`} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.645 20.91a1 1 0 0 0 .71 0C17.6 18.93 22 15.36 22 10.6 22 7.7 19.76 5.5 16.9 5.5c-1.7 0-3.23.77-4.1 1.98C11.93 6.27 10.4 5.5 8.7 5.5 5.84 5.5 3.6 7.7 3.6 10.6c0 4.76 4.4 8.33 8.045 10.31z" />
    </svg>
  );
}