type Props = { className?: string };

// Eye glyph for the article view count. Not a Figma asset — the Figma action
// bar shows a Bookmark, but Nuance has no bookmark feature, so that slot
// shows the view count instead (Mr Nick, 2026-05-19). Filled, currentColor.
export function IconViews({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.5C6.4 4.5 2.5 8.8 1.1 11.6a.9.9 0 0 0 0 .8C2.5 15.2 6.4 19.5 12 19.5s9.5-4.3 10.9-7.1a.9.9 0 0 0 0-.8C21.5 8.8 17.6 4.5 12 4.5Zm0 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      />
      <circle cx="12" cy="12" r="1.9" />
    </svg>
  );
}
