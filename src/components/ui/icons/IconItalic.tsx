type Props = { className?: string };

// NUR / Icon / Italic (Figma I1:37225;36:194). fill is currentColor.
export function IconItalic({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 1C5 0.447715 5.44772 0 6 0H15C15.5523 0 16 0.447715 16 1C16 1.55228 15.5523 2 15 2H11.693L6.443 16H10C10.5523 16 11 16.4477 11 17C11 17.5523 10.5523 18 10 18H1C0.447715 18 0 17.5523 0 17C0 16.4477 0.447715 16 1 16H4.307L9.557 2H6C5.44772 2 5 1.55228 5 1Z"
        fill="currentColor"
      />
    </svg>
  );
}
