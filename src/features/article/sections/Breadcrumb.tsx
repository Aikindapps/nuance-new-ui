import { Link, useNavigate } from "react-router-dom";
import { IconBack } from "../../../components/ui/icons/IconBack";

// Figma 1:5290 — back button + a trail of crumbs. Crumbs with a `to` render
// as underlined purple links; the last crumb (current location) is plain.
// 18/28 type, brand-purple. The Figma trail is "Overview / {publication} /
// {category}" — the route assembles the list and passes it in.

export type Crumb = { label: string; to?: string };

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-3 px-6 py-3 lg:px-14"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        <IconBack className="size-[calc(18*var(--fpx))]" />
      </button>

      <p className="min-w-0 truncate text-lg text-brand-purple">
        {crumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`}>
            {i > 0 && <span className="text-brand-purple"> / </span>}
            {crumb.to ? (
              <Link to={crumb.to} className="underline hover:no-underline">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </p>
    </nav>
  );
}
