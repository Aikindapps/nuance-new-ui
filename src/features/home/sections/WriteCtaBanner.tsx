import { Link } from "react-router-dom";
import { writeCtaBannerCopy } from "../../../constants/copy";

// Figma 1:50057 — logged-in write CTA.
// Purple-100 2px border on a purple-5% tinted bg, 16px radius, 48/32 padding.
// Heading on the left (32/Bold/purple-100), gradient button on the right
// (reuses bg-brand-gradient-button + shadow-purple-glow-medium from PR #3).
// Button links to /write (stub route per decision #26; Lexical editor lands
// at decision #22's first writing-consumer milestone).

export function WriteCtaBanner() {
  return (
    <section
      className="flex flex-col items-start gap-6 rounded-[16px] border-2 border-brand-purple bg-brand-purple-5 p-8 md:flex-row md:items-center md:justify-between md:px-12 md:py-8"
      aria-labelledby="write-cta-heading"
    >
      <h2
        id="write-cta-heading"
        className="text-[24px] font-bold leading-tight tracking-[-0.48px] text-brand-purple md:whitespace-nowrap md:text-[32px] md:leading-[40px] md:tracking-[-0.64px]"
      >
        {writeCtaBannerCopy.heading}
      </h2>

      <Link
        to="/write"
        aria-label={writeCtaBannerCopy.primaryAriaLabel}
        className="bg-brand-gradient-button inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-[8px] px-6 py-[10px] text-[18px] font-medium leading-7 text-white shadow-purple-glow-medium transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
      >
        {writeCtaBannerCopy.primary}
      </Link>
    </section>
  );
}
