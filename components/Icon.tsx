/* Small line icons (24 × 24, drawn with the current text colour). Decorative unless a label is given. */
const paths = {
  back: "M15 18l-6-6 6-6",
  forward: "M9 18l6-6-6-6",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  home: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z",
  slips: "M8 3h9a2 2 0 0 1 2 2v12M6 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm2 5h5m-5 4h3",
  people: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m17 0v-1a4 4 0 0 0-3-3.9M13 4.1a4 4 0 0 1 0 7.8M13.5 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  plus: "M12 5v14M5 12h14",
  whatsapp: "M4 20l1.3-3.9A8 8 0 1 1 8.2 19L4 20Zm5-11.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-1.9-1-1 .9a4.6 4.6 0 0 1-2.4-2.4l.9-1-1-1.9L9 8.5Z",
  mail: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 1 8 6 8-6",
  download: "M12 4v11m0 0 4-4m-4 4-4-4M5 20h14",
  keyboard: "M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm4 3h.01M11 10h.01M15 10h.01M7 14h10",
  close: "M6 6l12 12M18 6 6 18",
  cloud: "M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7Z",
  check: "m5 12 4 4 10-10",
  google: "",
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, className = "h-5 w-5", label }: { name: IconName; className?: string; label?: string }) {
  if (name === "google") {
    return (
      <svg viewBox="0 0 24 24" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={paths[name]} />
    </svg>
  );
}
