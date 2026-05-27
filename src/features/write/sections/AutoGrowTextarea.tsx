import { useLayoutEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

// A single-field textarea that grows with its content — used for the title and
// subtitle. These are plain text (no rich formatting), so they are not Lexical
// instances (decision #36: Lexical only for the article body).
export function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-ink-40 ${className}`}
    />
  );
}
