/* Two slips, yellow behind pink, like a duplicate book */
export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className={className}>
      <rect x="7" y="3" width="17" height="21" rx="2.5" fill="#fff1a8" stroke="#e3c44a" strokeWidth="1.5" transform="rotate(8 15 13)" />
      <rect x="4" y="5" width="17" height="21" rx="2.5" fill="#ffd3de" stroke="#e58aa3" strokeWidth="1.5" />
      <path d="M8 11h9M8 15h9M8 19h5" stroke="#1e3a8a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
