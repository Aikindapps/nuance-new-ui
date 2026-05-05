type Props = {
  className?: string;
  label?: string;
};

export function IconNft({ className = "", label = "NFT-minted article" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 0H0V24H24V0ZM9.51176 21L5.20987 13.7624V21H3V10H5.20987L9.51913 17.2527V10H22V11.8359H18.7147V21H16.5048V11.8359H11.7904V14.6765H14.9431V16.5048H11.7904V21H9.51176Z"
        fill="currentColor"
      />
    </svg>
  );
}
