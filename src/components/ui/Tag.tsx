type TagProps = {
  label: string;
  href?: string;
};

const classes =
  "inline-flex items-center justify-center rounded-full border-2 border-white-60 px-4 py-1 text-body font-medium text-white transition-colors hover:bg-white-10 lg:px-6 lg:text-lg";

export function Tag({ label, href }: TagProps) {
  if (href) {
    return (
      <a href={href} className={classes}>
        {label}
      </a>
    );
  }
  return <span className={classes}>{label}</span>;
}
