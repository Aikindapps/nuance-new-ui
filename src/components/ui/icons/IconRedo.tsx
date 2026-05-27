type Props = { className?: string };

// NUR / Icon / Redo (Figma I1:4722;36:191). fill is currentColor.
export function IconRedo({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19 0C19.5523 0 20 0.447715 20 1V7C20 7.55228 19.5523 8 19 8H13C12.4477 8 12 7.55228 12 7C12 6.44772 12.4477 6 13 6H16.394L15.3323 5.04444C15.3321 5.04424 15.3319 5.04404 15.3316 5.04383C13.8662 3.7298 11.9678 3.00212 9.99946 3C7.87792 3.00014 5.84331 3.84298 4.34315 5.34315C2.84285 6.84344 2 8.87827 2 11C2 11.5523 1.55228 12 1 12C0.447715 12 0 11.5523 0 11C0 8.34784 1.05357 5.8043 2.92893 3.92893C4.8043 2.05357 7.34784 1 10 1H10.001C12.462 1.00251 14.8356 1.9124 16.6677 3.55556L16.669 3.5567L18 4.75464V1C18 0.447715 18.4477 0 19 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
