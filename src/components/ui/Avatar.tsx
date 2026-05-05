import { useState } from "react";

type AvatarProps = {
  src: string;
  label: string;
  sizeClass: string;
  textClass?: string;
  rounded?: "full" | "card";
};

/** Renders a user/publication avatar with a graceful fallback:
 *  - empty src → branded initial block
 *  - non-empty src that fails to load → branded initial block
 *  - loading non-empty src → branded initial block (shown until onLoad fires)
 *
 *  The fallback uses the first character of `label` on a brand-gradient fill,
 *  matching what shipped for missing avatars throughout the design system.
 */
export function Avatar({
  src,
  label,
  sizeClass,
  textClass = "text-[24px]",
  rounded = "full",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (label || "?").trim().charAt(0).toUpperCase();
  const radius = rounded === "full" ? "rounded-full" : "rounded-card";
  const showImg = src && !failed;

  if (!showImg) {
    return (
      <div
        aria-hidden
        className={`bg-brand-gradient flex ${sizeClass} shrink-0 items-center justify-center ${radius} font-bold text-white ${textClass}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 ${radius} object-cover`}
    />
  );
}
