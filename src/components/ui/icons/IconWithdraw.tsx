type Props = { className?: string };

// Figma node I1:46398;31:204 (NUR / Icon / Withdraw) — up arrow out of a tray.
export function IconWithdraw({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.29289 0.292893C7.68342 -0.0976311 8.31658 -0.0976311 8.70711 0.292893L14.7071 6.29289C15.0976 6.68342 15.0976 7.31658 14.7071 7.70711C14.3166 8.09763 13.6834 8.09763 13.2929 7.70711L9 3.41421V15C9 15.5523 8.55228 16 8 16C7.44772 16 7 15.5523 7 15V3.41421L2.70711 7.70711C2.31658 8.09763 1.68342 8.09763 1.29289 7.70711C0.902369 7.31658 0.902369 6.68342 1.29289 6.29289L7.29289 0.292893ZM0 19C0 18.4477 0.447715 18 1 18H15C15.5523 18 16 18.4477 16 19C16 19.5523 15.5523 20 15 20H1C0.447715 20 0 19.5523 0 19Z"
        fill="currentColor"
      />
    </svg>
  );
}
