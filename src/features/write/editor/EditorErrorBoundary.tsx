import { Component, type ErrorInfo, type ReactNode } from "react";
import { writeArticleCopy } from "../../../constants/copy";

// Error boundary around the Lexical editor (PR #9 review M2). An unhandled
// editor error (a bad node render, a malformed restored state that slips past
// the editorConfig try/catch, etc.) would otherwise crash the whole /write
// route. Here it degrades to a recoverable card: the browser autosave is
// already on disk, so "Reload editor" remounts the subtree (via a key bump)
// and restores from that autosave. `onError` is also non-throwing in prod
// (see Editor.tsx) so most editor errors never reach this boundary at all.
type Props = { children: ReactNode };
type State = { failed: boolean };

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[editor] crashed:", error, info.componentStack);
  }

  private reload = () => {
    // Full reload is the simplest safe reset: it re-runs WriteArticleForm's
    // autosave restore from a clean slate rather than trying to revive a
    // half-torn-down editor instance.
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const c = writeArticleCopy.editorError;
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-[calc(16*var(--fpx))] rounded-[calc(16*var(--fpx))] border border-ink-border-20 bg-brand-purple-5 p-[calc(32*var(--fpx))]"
      >
        <h2 className="text-title-sm font-bold text-ink">{c.title}</h2>
        <p className="text-body text-ink-80">{c.body}</p>
        <button
          type="button"
          onClick={this.reload}
          className="bg-brand-gradient-button flex h-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] px-[calc(24*var(--fpx))] text-body font-medium text-white shadow-purple-glow-medium transition-opacity hover:opacity-90"
        >
          {c.reload}
        </button>
      </div>
    );
  }
}
