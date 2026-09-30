import { useNavigate } from "react-router-dom";
import { writeArticleCopy } from "../../../constants/copy";
import type { WriteReturn } from "../lib/writeReturn";
import { MobileEditorTopBar } from "./MobileEditorTopBar";
import { MobileActionBar } from "./MobileActionBar";

// Phone loading state for /write/:id (NIC-539, Figma 2683:3283): the real
// top bar (Back works), skeleton title / subtitle / cover / 6 body lines, and
// the action pill faded and disabled until the article has loaded.
const C = writeArticleCopy;
const BAR = "animate-pulse bg-ink-border-10";
const LINES = [
  "w-full",
  "w-[calc(340*var(--fpx))]",
  "w-[calc(355*var(--fpx))]",
  "w-[calc(300*var(--fpx))]",
  "w-full",
  "w-[calc(220*var(--fpx))]",
];
const noop = () => {};

export function WriteLoadingMobile({ back }: { back: WriteReturn }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col">
      <MobileEditorTopBar
        onBack={() => navigate(back.to)}
        backLabel={back.fromPublication ? back.label : "Go back"}
        status={C.statusDraft}
        caption={C.loadingArticle}
      />
      <div aria-hidden className="flex flex-col px-[calc(16*var(--fpx))] pt-[calc(16*var(--fpx))]">
        <div className={`${BAR} h-[calc(32*var(--fpx))] w-[calc(260*var(--fpx))] max-w-full rounded-[calc(8*var(--fpx))]`} />
        <div className={`${BAR} mt-[calc(12*var(--fpx))] h-[calc(20*var(--fpx))] w-[calc(180*var(--fpx))] max-w-full rounded-[calc(4*var(--fpx))]`} />
        <div className={`${BAR} mt-[calc(12*var(--fpx))] h-[calc(160*var(--fpx))] w-full rounded-[calc(8*var(--fpx))]`} />
        <div className="mt-[calc(16*var(--fpx))] flex flex-col gap-[calc(12*var(--fpx))]">
          {LINES.map((width, i) => (
            <div
              key={i}
              className={`${BAR} h-[calc(16*var(--fpx))] max-w-full rounded-[calc(4*var(--fpx))] ${width}`}
            />
          ))}
        </div>
      </div>
      <MobileActionBar
        disabled
        onUndo={noop}
        onRedo={noop}
        onMore={noop}
        onContinue={noop}
      />
    </div>
  );
}
