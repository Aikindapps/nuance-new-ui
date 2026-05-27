type Props = { className?: string };

// NUR / Icon / List — unordered (Figma I1:37231;36:194). fill is currentColor.
export function IconList({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 1C0 0.447715 0.447715 0 1 0H1.01C1.56228 0 2.01 0.447715 2.01 1C2.01 1.55228 1.56228 2 1.01 2H1C0.447715 2 0 1.55228 0 1ZM5 1C5 0.447715 5.44772 0 6 0H19C19.5523 0 20 0.447715 20 1C20 1.55228 19.5523 2 19 2H6C5.44772 2 5 1.55228 5 1ZM0 7C0 6.44772 0.447715 6 1 6H1.01C1.56228 6 2.01 6.44772 2.01 7C2.01 7.55228 1.56228 8 1.01 8H1C0.447715 8 0 7.55228 0 7ZM5 7C5 6.44772 5.44772 6 6 6H19C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H6C5.44772 8 5 7.55228 5 7ZM0 13C0 12.4477 0.447715 12 1 12H1.01C1.56228 12 2.01 12.4477 2.01 13C2.01 13.5523 1.56228 14 1.01 14H1C0.447715 14 0 13.5523 0 13ZM5 13C5 12.4477 5.44772 12 6 12H19C19.5523 12 20 12.4477 20 13C20 13.5523 19.5523 14 19 14H6C5.44772 14 5 13.5523 5 13Z"
        fill="currentColor"
      />
    </svg>
  );
}
