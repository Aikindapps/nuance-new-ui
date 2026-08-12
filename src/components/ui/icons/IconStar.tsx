type Props = { className?: string; filled?: boolean };

// Star glyph for the §4.8 topic follow toggle. currentColor; `filled` = following.
export function IconStar({ className = "", filled = false }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M12 3.5l2.6 5.27 5.82.846-4.21 4.104.994 5.796L12 16.99l-5.204 2.736.994-5.796-4.21-4.104 5.82-.846L12 3.5z" />
    </svg>
  );
}
