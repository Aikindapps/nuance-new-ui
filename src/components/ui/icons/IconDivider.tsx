type Props = { className?: string };

// NUR / Icon / Divider (Figma I1:37487;120:1040;30:512). fill is currentColor.
export function IconDivider({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 18 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 1C0 0.447715 0.447715 0 1 0H2C2.55228 0 3 0.447715 3 1C3 1.55228 2.55228 2 2 2H1C0.447715 2 0 1.55228 0 1ZM4 1C4 0.447715 4.44772 0 5 0H13C13.5523 0 14 0.447715 14 1C14 1.55228 13.5523 2 13 2H5C4.44772 2 4 1.55228 4 1ZM15 1C15 0.447715 15.4477 0 16 0H17C17.5523 0 18 0.447715 18 1C18 1.55228 17.5523 2 17 2H16C15.4477 2 15 1.55228 15 1Z"
        fill="currentColor"
      />
    </svg>
  );
}
