type Props = { className?: string };

// NUR / Icon / Chevron Left. fill currentColor.
export function IconChevronLeft({ className = "" }: Props) {
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
        d="M12.8452 0.488155C12.1943 -0.162718 11.139 -0.162718 10.4882 0.488155L0.488155 10.4882C-0.162718 11.139 -0.162718 12.1943 0.488155 12.8452L10.4882 22.8452C11.139 23.4961 12.1943 23.4961 12.8452 22.8452C13.4961 22.1943 13.4961 21.139 12.8452 20.4882L3.62369 11.6667L12.8452 2.84518C13.4961 2.1943 13.4961 1.13903 12.8452 0.488155Z"
        fill="currentColor"
      />
    </svg>
  );
}
