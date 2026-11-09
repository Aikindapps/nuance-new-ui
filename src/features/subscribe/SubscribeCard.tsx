import { IconStar } from "../../components/ui/icons/IconStar";
import { subscribeCardCopy } from "../../constants/copy";

type Props = {
  variant: "writer" | "publication";
  layout: "desktop" | "phone";
  onSubscribe: () => void;
};

// The "Like these articles?" Subscribe card (NIC-636). Presentational: the
// button hands the click to the page, which opens the Subscribe window.
export function SubscribeCard({ variant, layout, onSubscribe }: Props) {
  const desktop = layout === "desktop";
  const bodyBefore =
    variant === "writer"
      ? subscribeCardCopy.writerBodyBefore
      : subscribeCardCopy.publicationBodyBefore;

  return (
    <div
      role="group"
      aria-label={subscribeCardCopy.ariaLabel}
      className={
        desktop
          ? "flex w-[calc(488*var(--fpx))] shrink-0 flex-col justify-between gap-6 rounded-card border border-brand-purple/60 bg-brand-purple-5 px-12 py-10 text-left"
          : "flex w-full flex-col gap-6 rounded-card border border-brand-purple/60 bg-brand-purple-5 p-6 text-left"
      }
    >
      <div className={`flex items-center ${desktop ? "gap-6" : "gap-4"}`}>
        <div className="bg-brand-gradient flex size-[calc(72*var(--fpx))] shrink-0 items-center justify-center rounded-[calc(6.545*var(--fpx))] text-white">
          <IconStar className="size-[calc(38*var(--fpx))]" />
        </div>
        <h2
          className={`text-[length:calc(32*var(--fpx))] leading-[calc(40*var(--fpx))] font-bold text-brand-purple ${desktop ? "whitespace-nowrap" : "min-w-0"}`}
        >
          {subscribeCardCopy.title}
        </h2>
      </div>
      <p className="text-[length:calc(22*var(--fpx))] leading-[calc(32*var(--fpx))] font-medium text-brand-purple">
        {bodyBefore}
        <span className="underline">{subscribeCardCopy.bodyUnderlined}</span>
        {subscribeCardCopy.bodyAfter}
      </p>
      <button
        type="button"
        onClick={onSubscribe}
        className={`bg-brand-gradient-button rounded-card px-6 py-2.5 text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90 ${desktop ? "self-start" : "w-full"}`}
      >
        {subscribeCardCopy.button}
      </button>
    </div>
  );
}
