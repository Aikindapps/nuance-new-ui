import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { Header } from "./Header";
import { HeaderLoggedIn } from "./HeaderLoggedIn";

// Auth-aware page shell for profile/publication/404 routes (NIC-42).
// Intentionally mirrors the private ArticleShell + Centered components in
// ReadArticle.tsx without refactoring that file (zero-diff requirement on
// ReadArticle.tsx; ~15-line duplication is intentional per the task spec).

const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

export function PageShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? (
        <HeaderLoggedIn />
      ) : (
        <div className="bg-brand-gradient w-full text-white">
          <Header />
        </div>
      )}
      {children}
    </div>
  );
}

type CenteredMessageProps = {
  heading: string;
  body: string;
  // Optional call-to-action link (used by 404 to link home).
  actionHref?: string;
  actionLabel?: string;
};

export function CenteredMessage({
  heading,
  body,
  actionHref,
  actionLabel,
}: CenteredMessageProps) {
  return (
    <PageShell>
      <main className={`${CONTAINER} px-6 py-24 text-center`}>
        <h1 className="text-title-md font-bold text-ink">{heading}</h1>
        <p className="mt-2 text-body text-ink-80">{body}</p>
        {actionHref && actionLabel && (
          <Link
            to={actionHref}
            className="mt-8 inline-block text-body font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
          >
            {actionLabel}
          </Link>
        )}
      </main>
    </PageShell>
  );
}
