type Props = { className?: string };

// NUR / Icon / Back (Figma I1:5291;36:242). A return-arrow glyph; fill is
// currentColor so the icon inherits the surrounding text color.
export function IconBack({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.70711 0.292893C7.09763 0.683418 7.09763 1.31658 6.70711 1.70711L3.41421 5H13C14.3261 5 15.5979 5.52678 16.5355 6.46447C17.4732 7.40215 18 8.67392 18 10V17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17V10C16 9.20435 15.6839 8.44129 15.1213 7.87868C14.5587 7.31607 13.7956 7 13 7H3.41421L6.70711 10.2929C7.09763 10.6834 7.09763 11.3166 6.70711 11.7071C6.31658 12.0976 5.68342 12.0976 5.29289 11.7071L0.292893 6.70711C-0.0976311 6.31658 -0.0976311 5.68342 0.292893 5.29289L5.29289 0.292893C5.68342 -0.0976311 6.31658 -0.0976311 6.70711 0.292893Z"
        fill="currentColor"
      />
    </svg>
  );
}
