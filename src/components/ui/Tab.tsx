import { NavLink } from "react-router-dom";

type TabProps = {
  to: string;
  end?: boolean;
  children: React.ReactNode;
};

export function Tab({ to, end, children }: TabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "relative flex items-center justify-center px-6 py-3 text-body transition-colors",
          isActive
            ? "font-bold text-brand-purple"
            : "font-medium text-ink-80 hover:text-ink",
          isActive && "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-purple",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
