type Props = { className?: string };

// NUR / Icon / Date (calendar glyph for the Publish date field).
export function IconCalendar({ className = "" }: Props) {
  const d1 =
    "M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 " +
    "2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1z";
  const d2 = "M2 10h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10z";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d={d1} fill="currentColor" />
      <path d={d2} fill="currentColor" />
    </svg>
  );
}
