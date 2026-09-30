import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { publicationSettingsCopy, writeArticleCopy } from "../../../constants/copy";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { useToast } from "../../../services/toast";
import { usePublicationSettings } from "../../publication/hooks/usePublicationSettings";
import { useAddPublicationCategory } from "../../publication/hooks/useAddPublicationCategory";
import {
  CATEGORY_MAX_LENGTH,
  categorySlug,
  categoryTabs,
  validateCategoryName,
} from "../../publication/lib/categories";

const LABEL_ID = "publish-category-label";
const LIST_ID = "publish-category-listbox";
const HELPER_ID = "publish-category-helper";

// Same row look as the Publish-to foldout rows.
const rowClass = (selected: boolean) =>
  [
    "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
    selected
      ? "bg-brand-purple-fluor-80 font-medium"
      : "hover:bg-brand-purple-fluor-80",
  ].join(" ");

// Publish panel "Category" field (NIC-536, D-115; Figma 890:6572). Shown by
// PublishView only for an editor of the selected publication. Lists the
// publication's categories in saved order (same read + cache as Settings),
// plus "No category" and a "Type to add a new category" row. Hidden when
// the publication has no categories. `value` is the category exactly as
// stored (legacy names can carry stray spaces) -- never trimmed here.
// PublishView remounts it per publication (key), so an add still in flight
// for one publication can never select into another.
export function PublishCategoryField({
  handle,
  value,
  onChange,
  open,
  onOpenChange,
}: {
  handle: string;
  value: string;
  onChange: (category: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const c = writeArticleCopy.publish;
  const { show } = useToast();
  const { publication, isLoading, isError } = usePublicationSettings(handle);
  const options = useMemo(
    () => categoryTabs(publication?.categories ?? []),
    [publication],
  );
  const add = useAddPublicationCategory(handle);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside mousedown (same as the Publish-to foldout).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onOpenChange]);

  // A failed background refetch keeps the list it already has.
  const loadFailed = isError && publication === null;

  if (isLoading || loadFailed) {
    // Existing disabled-field look (the old gated category field).
    return (
      <div className="flex flex-col gap-[calc(6*var(--fpx))]">
        <label id={LABEL_ID} className="text-label font-bold text-ink">
          {c.categoryLabel}
        </label>
        <div
          role="combobox"
          aria-disabled="true"
          aria-expanded="false"
          aria-labelledby={LABEL_ID}
          aria-describedby={loadFailed ? HELPER_ID : undefined}
          className="flex h-[calc(48*var(--fpx))] w-full cursor-not-allowed select-none items-center justify-between rounded-[calc(6*var(--fpx))] border-2 border-ink-border-10 bg-ink-border-5 px-[calc(16*var(--fpx))] text-body text-ink-60 opacity-50"
        >
          <span>
            {isLoading ? c.categoryLoading : value || c.categoryPlaceholder}
          </span>
          <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0" />
        </div>
        {loadFailed && (
          <p
            id={HELPER_ID}
            className="text-[length:calc(14*var(--fpx))] text-ink-60 mt-[calc(4*var(--fpx))]"
          >
            {c.categoryLoadError}
          </p>
        )}
      </div>
    );
  }

  // No categories: no field (the article keeps whatever it already has).
  if (options.length === 0) return null;

  // "In the list" = same slug (same category page), so a stored "food"
  // marks the "Food" row. A stored name no longer in the list still shows
  // as the value; the foldout lists only current categories.
  const valueSlug = value === "" ? null : categorySlug(value);
  const query = draft.trim().toLowerCase();
  const shown =
    query === ""
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query));

  const pick = (category: string) => {
    onChange(category);
    onOpenChange(false);
    buttonRef.current?.focus();
  };

  const commitAdd = () => {
    if (add.isPending) return;
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed.length > CATEGORY_MAX_LENGTH) return;
    const invalid = validateCategoryName(
      trimmed,
      options.map((o) => o.label),
    );
    if (invalid === "reserved") {
      show(publicationSettingsCopy.errorCategoryReserved, "error");
      return;
    }
    if (invalid === "exists") {
      const slug = categorySlug(trimmed);
      const match = options.find((o) => o.slug === slug);
      if (match) pick(match.label);
      return;
    }
    add.mutate(trimmed, {
      onSuccess: (category) => {
        setDraft("");
        pick(category);
      },
      onError: () => show(c.categoryAddFailed, "error"),
    });
  };

  // Arrow keys move through the rows and the add field; Escape closes and
  // returns focus to the field. Enter on a row is the button's own click.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      onOpenChange(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (!open) {
      onOpenChange(true);
      return;
    }
    const items = Array.from(
      wrapRef.current?.querySelectorAll<HTMLElement>("[data-category-item]") ??
        [],
    );
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowUp" && i <= 0) {
      buttonRef.current?.focus();
      return;
    }
    const next = e.key === "ArrowDown" ? Math.min(i + 1, items.length - 1) : i - 1;
    items[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-[calc(6*var(--fpx))]">
      <label id={LABEL_ID} className="text-label font-bold text-ink">
        {c.categoryLabel}
      </label>
      <div className="relative" ref={wrapRef} onKeyDown={onKeyDown}>
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={LIST_ID}
          aria-labelledby={LABEL_ID}
          onClick={() => {
            if (!open) setDraft("");
            onOpenChange(!open);
          }}
          className={[
            "flex h-[calc(48*var(--fpx))] w-full items-center justify-between rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] text-body",
            value === "" ? "text-ink-60" : "text-ink-80",
            open
              ? "border-2 border-brand-purple bg-brand-purple-5"
              : "border-2 border-ink-border-10 bg-ink-border-5",
          ].join(" ")}
        >
          <span className="truncate">{value || c.categoryPlaceholder}</span>
          <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0 text-ink-80" />
        </button>

        {open && (
          <div className="absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-full rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]">
            <ul
              id={LIST_ID}
              role="listbox"
              aria-labelledby={LABEL_ID}
              className="flex flex-col gap-[calc(4*var(--fpx))]"
            >
              {/* "No category" clears the choice; always drawn in the
                  unselected row style (spec), even when nothing is chosen. */}
              <li role="option" aria-selected={value === ""}>
                <button
                  type="button"
                  data-category-item
                  onClick={() => pick("")}
                  className={rowClass(false)}
                >
                  {c.categoryNone}
                </button>
              </li>
              {shown.map((o) => (
                <li
                  key={o.slug}
                  role="option"
                  aria-selected={o.slug === valueSlug}
                >
                  <button
                    type="button"
                    data-category-item
                    onClick={() => pick(o.label)}
                    className={rowClass(o.slug === valueSlug)}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="text"
              data-category-item
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAdd();
                }
              }}
              readOnly={add.isPending}
              aria-busy={add.isPending || undefined}
              aria-label={c.categoryAddAria}
              placeholder={c.categoryAddPlaceholder}
              maxLength={CATEGORY_MAX_LENGTH}
              className="w-full rounded-[calc(6*var(--fpx))] bg-transparent px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white placeholder:text-white/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
