type Props = { className?: string };

// NUR / Icon / Chevron Right. fill currentColor.
export function IconChevronRight({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 13.3333 23.3333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.488155 0.488155C1.13903 -0.162718 2.1943 -0.162718 2.84518 0.488155L12.8452 10.4882C13.4961 11.139 13.4961 12.1943 12.8452 12.8452L2.84518 22.8452C2.1943 23.4961 1.13903 23.4961 0.488155 22.8452C-0.162718 22.1943 -0.162718 21.139 0.488155 20.4882L9.30964 11.6667L0.488155 2.84518C-0.162718 2.1943 -0.162718 1.13903 0.488155 0.488155Z"
        fill="currentColor"
      />
    </svg>
  );
}
