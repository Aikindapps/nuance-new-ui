import { Link } from "react-router-dom";
import { Header } from "../components/ui/Header";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { writeStubCopy } from "../constants/copy";

// Decision #26: deferred features ship as real routes that render "Coming
// soon" stubs. /write is the Article editor's future destination; the
// Lexical editor lands per decision #22 backlog at first writing consumer.
//
// Header matches the visitor's auth state — every entry point to /write is
// authed-only (HeaderLoggedIn's "Start writing" button, WriteCtaBanner), so
// an authed user gets the white HeaderLoggedIn rather than the logged-out
// purple band; an anon visitor arriving by direct URL gets the purple Header.

export function WriteStub() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <title>{writeStubCopy.metadata.title}</title>
      <meta name="description" content={writeStubCopy.metadata.description} />

      <main className="min-h-screen">
        {isAuthenticated ? (
          <HeaderLoggedIn />
        ) : (
          <div className="bg-brand-gradient w-full text-white">
            <Header />
          </div>
        )}

        <div className="mx-auto max-w-[calc(800*var(--fpx))] px-4 py-20 text-center md:py-28 lg:py-32">
          <h1 className="text-h2 font-bold text-ink">{writeStubCopy.heading}</h1>
          <p className="mt-4 text-body text-ink-80">{writeStubCopy.body}</p>
          <Link
            to="/"
            className="mt-8 inline-block text-body font-medium text-brand-purple underline underline-offset-4 hover:no-underline"
          >
            {writeStubCopy.backLabel}
          </Link>
        </div>
      </main>
    </>
  );
}
