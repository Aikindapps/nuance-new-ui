import { homeSwitchCopy } from "../../../constants/copy";

export type HomeContentType = "articles" | "publications" | "writers";

const TABS: { id: HomeContentType; label: string }[] = [
  { id: "articles", label: homeSwitchCopy.articlesTab },
  { id: "publications", label: homeSwitchCopy.publicationsTab },
  { id: "writers", label: homeSwitchCopy.writersTab },
];

type Props = {
  value: HomeContentType;
  onChange: (t: HomeContentType) => void;
};

// Tier-1 content-type switch for the logged-in Home (NIC-325).
// 24px underline-tab variant of the Tab.tsx idiom — uses buttons (in-page
// state) rather than NavLinks (URL-driven). Active = bold brand-purple + 2px
// underline overlay; inactive = medium ink-80 + hover:text-ink.
export function HomeContentTypeTabs({ value, onChange }: Props) {
  return (
    <nav
      aria-label={homeSwitchCopy.ariaLabel}
      className="flex items-center border-b border-ink-border/20"
    >
      {TABS.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => onChange(tab.id)}
            className={[
              // Base — mirrors Tab.tsx but with text-title-sm (24px) and
              // rounded-sm for the focus ring clip.
              "relative flex items-center justify-center px-[calc(25*var(--fpx))] py-3 text-title-sm transition-colors rounded-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple",
              // State
              isActive
                ? "font-bold text-brand-purple after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-purple"
                : "font-medium text-ink-80 hover:text-ink",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
