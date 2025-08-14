export function TwitterIcon({ className = "", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={`ui-icon ${className}`} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 5.92c-.74.33-1.54.55-2.38.65a4.13 4.13 0 0 0 1.81-2.28 8.2 8.2 0 0 1-2.6.99A4.1 4.1 0 0 0 12 7.97c0 .32.04.63.11.93A11.65 11.65 0 0 1 3.15 4.9a4.1 4.1 0 0 0 1.27 5.48 4.07 4.07 0 0 1-1.86-.52v.05a4.11 4.11 0 0 0 3.29 4.02c-.45.12-.93.18-1.42.07a4.11 4.11 0 0 0 3.83 2.84A8.23 8.23 0 0 1 2 19.54 11.63 11.63 0 0 0 8.29 21c7.5 0 11.6-6.21 11.6-11.6l-.01-.53A8.24 8.24 0 0 0 22 5.92z" />
    </svg>
  );
}