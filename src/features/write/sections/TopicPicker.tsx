import { useMemo, useState } from "react";
import { useAllTags } from "../../onboarding/useAllTags";
import { writeArticleCopy } from "../../../constants/copy";

// Topic selector for the Publish modal. The canister requires 1–3 existing tag
// IDs and `createTag` is admin-only, so this is SELECT-ONLY: filter the global
// tag list, click to add a chip (max 3), click × to remove. (Figma 5.6 shows
// "press Enter to add a new one" — not backable by the canister, so dropped.)
export function TopicPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const tags = useAllTags();
  const all = useMemo(() => tags.data ?? [], [tags.data]);
  const [filter, setFilter] = useState("");
  const c = writeArticleCopy.publish;

  const labelById = useMemo(
    () => new Map(all.map((t) => [t.id, t.value])),
    [all],
  );
  const atMax = selected.length >= 3;

  const matches = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return all
      .filter(
        (t) =>
          !selected.includes(t.id) &&
          (q === "" || t.value.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [all, filter, selected]);

  const add = (id: string) => {
    if (atMax || selected.includes(id)) return;
    onChange([...selected, id]);
    setFilter("");
  };
  const remove = (id: string) =>
    onChange(selected.filter((x) => x !== id));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-ink-border-10 bg-ink-border-5 p-3">
        {selected.map((id) => (
          <span
            key={id}
            className="flex items-center gap-1 rounded-full bg-brand-purple-10 px-3 py-1 text-body text-brand-purple"
          >
            {labelById.get(id) ?? id}
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label={`Remove ${labelById.get(id) ?? id}`}
              className="text-brand-purple"
            >
              ×
            </button>
          </span>
        ))}
        {!atMax && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={selected.length === 0 ? c.topicsPlaceholder : ""}
            aria-label={c.topicsPlaceholder}
            className="min-w-[120px] flex-1 bg-transparent text-body outline-none placeholder:text-ink-40"
          />
        )}
      </div>

      {!atMax && matches.length > 0 && (
        <ul className="mt-2 max-h-[calc(220*var(--fpx))] overflow-auto rounded-card border border-ink-border-10">
          {matches.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => add(t.id)}
                className="w-full px-4 py-2 text-left text-body text-ink hover:bg-brand-purple-5"
              >
                {t.value}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[length:calc(14*var(--fpx))] text-ink-60">
        {c.topicsHint}
      </p>
    </div>
  );
}
