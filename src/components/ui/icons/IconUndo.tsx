type Props = { className?: string };

// NUR / Icon / Undo (Figma I1:4721;263:722). fill is currentColor.
export function IconUndo({ className = "" }: Props) {
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
        d="M1 0C1.55228 0 2 0.447715 2 1V4.75464L3.33231 3.55556C5.16437 1.9124 7.53801 1.00251 9.99898 1H10C12.6522 1 15.1957 2.05357 17.0711 3.92893C18.9464 5.8043 20 8.34784 20 11C20 11.5523 19.5523 12 19 12C18.4477 12 18 11.5523 18 11C18 8.87827 17.1571 6.84344 15.6569 5.34315C14.1567 3.84298 12.1221 3.00014 10.0005 3C8.03221 3.00212 6.13375 3.72982 4.6683 5.04389C4.6681 5.04407 4.66851 5.04371 4.6683 5.04389L3.60596 6H7C7.55228 6 8 6.44772 8 7C8 7.55228 7.55228 8 7 8H1C0.447715 8 0 7.55228 0 7V1C0 0.447715 0.447715 0 1 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
