// NIC-538 -- Publication Settings: Categories section (add, rename, reorder,
// remove). Figma 1:42256 (2 rows + add-row) / 1:42349 (3 rows + add-row).
//
// Controlled for the committed rows (`rows` / `onRowsChange`); owns only
// transient state: per-row draft text (each filled row is a child keyed by
// its stable id, so its local draft only resets when that row's OWN commit
// changes its value -- reorders never remount it), per-row error, and drag
// state. Reorders (pointer + keyboard) mutate the committed array live
// through `onRowsChange` -- there is no separate "preview order".

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { publicationSettingsCopy as copy } from "../../../constants/copy";
import {
  CATEGORY_MAX_LENGTH,
  moveItem,
  validateCategoryName,
} from "../lib/categories";
import { IconDrag } from "../../../components/ui/icons/IconDrag";
import { IconTrash } from "../../../components/ui/icons/IconTrash";

export type CategoryRow = { id: string; value: string };

type Props = {
  rows: CategoryRow[];
  onRowsChange: (rows: CategoryRow[]) => void;
  onNewRowId: () => string;
  onHasErrorChange: (hasError: boolean) => void;
  disabled: boolean;
};

// Heading: 22/Bold/ink@80 (Figma "Categories" text layer); the
// NUR/GT Walsheim/22/Bold token carries -2% tracking (as HomeLoggedIn).
const headingClass =
  "text-[length:calc(22*var(--fpx))] font-bold leading-[calc(32*var(--fpx))] tracking-[calc(-0.44*var(--fpx))] text-ink/80";

// Helper: 16/Regular/ink@80 (Figma helper text layer -- NOT ink/60). At lg+
// it spans the 824 content column like the design (2 lines, matching the
// skeleton's h48), not the 448 fieldset; below lg it stays full width.
const helperClass =
  "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink/80 lg:w-[calc(824*var(--fpx))] lg:max-w-none";

// Inline field-error text -- same treatment as the rest of the form
// (errorClass in PublicationDetailsForm.tsx).
const errorClass =
  "text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/80";

// Category input: 264w desktop (flex-1 within the 336-wide row so the same
// markup reflows at phone widths -- step 13), 48h, 18/Regular, bg
// ink-border/5 (Figma fill #373A49 @5%), border ink-border/10 (purple +
// aria-invalid when invalid), radius 6.
function categoryInputClass(invalid: boolean): string {
  return [
    "flex-1 min-w-0 rounded-[calc(6*var(--fpx))]",
    "border",
    invalid ? "border-brand-purple" : "border-ink-border/10",
    "px-[calc(16*var(--fpx))] py-[calc(10*var(--fpx))] h-[calc(48*var(--fpx))]",
    "text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-ink/80",
    "bg-ink-border/5 outline-none",
    "focus:border-brand-purple",
    "transition-colors",
    "placeholder:italic placeholder:text-ink/60",
  ].join(" ");
}

// Drag handle -- 24x24 glyph; >=44x44 hit area at <=1023px (step 13), visual
// glyph size unchanged (negative margin keeps the row's own layout stable).
const dragHandleClass =
  "shrink-0 flex items-center justify-center touch-none " +
  "size-[calc(24*var(--fpx))] max-lg:size-[calc(44*var(--fpx))] max-lg:-m-[calc(10*var(--fpx))] " +
  "text-ink/60";

// Remove button -- 32x32 tertiary button; same >=44x44 phone hit-area treatment.
const removeButtonClass =
  "shrink-0 flex items-center justify-center rounded-[calc(4*var(--fpx))] " +
  "size-[calc(32*var(--fpx))] max-lg:size-[calc(44*var(--fpx))] max-lg:-m-[calc(6*var(--fpx))] " +
  "text-brand-purple";

export function CategoriesEditor({
  rows,
  onRowsChange,
  onNewRowId,
  onHasErrorChange,
  disabled,
}: Props) {
  // Per-row error state, keyed by row id.
  const [errors, setErrors] = useState<Record<string, "reserved" | "exists" | null>>({});
  const [addDraft, setAddDraft] = useState("");
  const [addError, setAddError] = useState<"reserved" | "exists" | null>(null);

  // Pointer-drag state.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingPointerId = useRef<number | null>(null);
  const rowElRefs = useRef(new Map<string, HTMLDivElement>());
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusId = useRef<string | null>(null);

  // Latest rows, read by the window pointer listeners so they never act on
  // a stale list (F4 -- React may move the dragged row's DOM node, which
  // can drop native pointer capture mid-gesture, so we do not rely on it).
  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const onRowsChangeRef = useRef(onRowsChange);
  useLayoutEffect(() => {
    onRowsChangeRef.current = onRowsChange;
  }, [onRowsChange]);

  // Report the aggregate error state up to the form (Save is blocked while
  // any category input shows an error).
  useEffect(() => {
    const anyRowError = Object.values(errors).some((e) => e !== null);
    onHasErrorChange(anyRowError || addError !== null);
  }, [errors, addError, onHasErrorChange]);

  // Re-focus the reordered row's handle after a keyboard move -- moving the
  // focused DOM node can otherwise drop focus.
  useEffect(() => {
    if (pendingFocusId.current) {
      const id = pendingFocusId.current;
      pendingFocusId.current = null;
      handleRefs.current.get(id)?.focus();
    }
  }, [rows]);

  const setRowError = useCallback(
    (id: string, error: "reserved" | "exists" | null) => {
      setErrors((prev) => (prev[id] === error ? prev : { ...prev, [id]: error }));
    },
    [],
  );

  const removeRow = useCallback(
    (id: string) => {
      onRowsChange(rows.filter((r) => r.id !== id));
      setErrors((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [rows, onRowsChange],
  );

  const renameRow = useCallback(
    (id: string, trimmed: string) => {
      onRowsChange(rows.map((r) => (r.id === id ? { ...r, value: trimmed } : r)));
    },
    [rows, onRowsChange],
  );

  // -- Add --

  const commitAdd = useCallback(() => {
    const trimmed = addDraft.trim();
    if (trimmed === "") {
      setAddDraft("");
      setAddError(null);
      return;
    }
    const validation = validateCategoryName(
      trimmed,
      rows.map((r) => r.value),
    );
    if (validation) {
      setAddError(validation);
      return;
    }
    onRowsChange([...rows, { id: onNewRowId(), value: trimmed }]);
    setAddDraft("");
    setAddError(null);
  }, [addDraft, rows, onRowsChange, onNewRowId]);

  // -- Reorder: shared midpoint logic --

  const reorderTo = useCallback((id: string, clientY: number) => {
    const currentRows = rowsRef.current;
    const fromIndex = currentRows.findIndex((r) => r.id === id);
    if (fromIndex === -1) return;
    let target = 0;
    for (const r of currentRows) {
      if (r.id === id) continue;
      const el = rowElRefs.current.get(r.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY > mid) target++;
    }
    if (target !== fromIndex) {
      onRowsChangeRef.current(moveItem(currentRows, fromIndex, target));
    }
  }, []);

  // -- Reorder: pointer (mouse + touch + pen) --
  //
  // We do NOT rely on element pointer capture for move/up (F4): when React
  // reorders keyed rows it may move the dragged row's DOM node, which can
  // drop capture mid-gesture. Instead we attach the move/up/cancel
  // listeners on window, filtered by the recorded pointerId.

  const endDragListeners = useRef<(() => void) | null>(null);

  // Imperative half of "end the drag": drop the recorded pointer id and tear
  // down the window listeners. Safe to call from an effect body -- it does
  // not touch React state.
  const cancelDragListeners = useCallback(() => {
    draggingPointerId.current = null;
    if (endDragListeners.current) {
      endDragListeners.current();
      endDragListeners.current = null;
    }
  }, []);

  const stopDrag = useCallback(() => {
    cancelDragListeners();
    setDraggingId(null);
  }, [cancelDragListeners]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>, id: string) => {
      if (disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // A second concurrent pointer (another finger, a pen while the mouse
      // drags) is ignored: the first drag keeps its window listeners and
      // ends cleanly on its own pointerup. The SAME pointer id arriving
      // again means its pointerup was missed -- tear the stale listeners
      // down before starting over, so none are ever orphaned.
      if (draggingPointerId.current !== null) {
        if (draggingPointerId.current !== e.pointerId) return;
        cancelDragListeners();
      }
      e.preventDefault();
      draggingPointerId.current = e.pointerId;
      setDraggingId(id);

      const onMove = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== draggingPointerId.current) return;
        reorderTo(id, ev.clientY);
      };
      const onUp = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== draggingPointerId.current) return;
        stopDrag();
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      endDragListeners.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    },
    [disabled, reorderTo, stopDrag, cancelDragListeners],
  );

  // Disabled mid-drag (save started) -- end any drag in progress immediately.
  // Tear down the window listeners synchronously (so no further move/up can
  // reorder rows); the visual "dragging" state is cleared right after, off
  // the effect's synchronous call stack.
  useEffect(() => {
    if (disabled) {
      cancelDragListeners();
      queueMicrotask(() => setDraggingId(null));
    }
  }, [disabled, cancelDragListeners]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      if (endDragListeners.current) {
        endDragListeners.current();
        endDragListeners.current = null;
      }
    };
  }, []);

  // -- Reorder: keyboard --

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (disabled) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const from = rows.findIndex((r) => r.id === id);
      if (from === -1) return;
      const to = e.key === "ArrowUp" ? from - 1 : from + 1;
      if (to < 0 || to >= rows.length) return;
      pendingFocusId.current = id;
      onRowsChange(moveItem(rows, from, to));
    },
    [disabled, rows, onRowsChange],
  );

  return (
    <div className="pt-[calc(40*var(--fpx))] flex flex-col gap-[calc(24*var(--fpx))]">
      {/* Heading + helper (Frame 10) */}
      <div className="flex flex-col gap-[calc(8*var(--fpx))]">
        <h2 className={headingClass}>{copy.categoriesHeading}</h2>
        <p className={helperClass}>{copy.categoriesHelper}</p>
      </div>

      {/* List (Frame 798) -- 336 wide desktop, gap 8, grows vertically. */}
      <div className="flex flex-col gap-[calc(8*var(--fpx))] w-full lg:w-[calc(336*var(--fpx))]">
        {rows.map((row) => {
          const error = errors[row.id] ?? null;
          const others = rows.filter((r) => r.id !== row.id).map((r) => r.value);
          return (
            <CategoryFilledRow
              key={row.id}
              row={row}
              others={others}
              error={error}
              disabled={disabled}
              dragging={draggingId === row.id}
              onRename={(trimmed) => renameRow(row.id, trimmed)}
              onErrorChange={(err) => setRowError(row.id, err)}
              onRemove={() => removeRow(row.id)}
              rowElRefs={rowElRefs}
              handleRefs={handleRefs}
              onPointerDown={(e) => handlePointerDown(e, row.id)}
              onKeyDown={(e) => handleKeyDown(e, row.id)}
            />
          );
        })}

        {/* Add-row (Frame 797, row 1:42366 = 296 wide) -- the drag glyph is
            drawn (1:42367) but decorative only: an aria-hidden span, no
            pointer or keyboard behaviour. A 32 trailing spacer stands in for
            the remove button so the input is 264 wide and lines up with the
            filled rows (phone too: the filled rows' remove button also
            nets 32 there). */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <div className="flex flex-row items-center gap-[calc(8*var(--fpx))]">
            <span
              className="shrink-0 flex items-center justify-center size-[calc(24*var(--fpx))] text-ink/60"
              aria-hidden
            >
              <IconDrag className="size-[calc(24*var(--fpx))]" />
            </span>
            <input
              type="text"
              value={addDraft}
              onChange={(e) => {
                setAddDraft(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAdd();
                }
              }}
              onBlur={commitAdd}
              placeholder={copy.categoryAddPlaceholder}
              aria-label={copy.categoryAddAria}
              aria-invalid={addError !== null || undefined}
              maxLength={CATEGORY_MAX_LENGTH}
              className={categoryInputClass(addError !== null)}
            />
            <span className="shrink-0 size-[calc(32*var(--fpx))]" aria-hidden />
          </div>
          {addError && (
            <p role="alert" className={errorClass}>
              {addError === "exists" ? copy.errorCategoryExists : copy.errorCategoryReserved}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Filled row (rename + drag + remove) --

type FilledRowProps = {
  row: CategoryRow;
  others: string[];
  error: "reserved" | "exists" | null;
  disabled: boolean;
  dragging: boolean;
  onRename: (trimmed: string) => void;
  onErrorChange: (error: "reserved" | "exists" | null) => void;
  onRemove: () => void;
  rowElRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  handleRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
};

// Draft is local state seeded from `row.value`, keyed by `row.id` by the
// parent's `key={row.id}` -- it only resets when this row's OWN rename
// changes its value (a fresh id remounts with a fresh draft); reorders
// never touch it.
function CategoryFilledRow({
  row,
  others,
  error,
  disabled,
  dragging,
  onRename,
  onErrorChange,
  onRemove,
  rowElRefs,
  handleRefs,
  onPointerDown,
  onKeyDown,
}: FilledRowProps) {
  const [draft, setDraft] = useState(row.value);

  const reorderAria = copy.categoryReorderAria.replace("{name}", row.value);
  const removeAria = copy.categoryRemoveAria.replace("{name}", row.value);

  const handleBlur = () => {
    // Identical to the committed value -- do nothing (never re-trim/re-case
    // a value the editor did not change, e.g. legacy "Articles ").
    if (draft === row.value) {
      onErrorChange(null);
      return;
    }
    const trimmed = draft.trim();
    if (trimmed === "") {
      // Blank -- revert the input to the committed value, no error.
      onErrorChange(null);
      setDraft(row.value);
      return;
    }
    const validation = validateCategoryName(trimmed, others);
    if (validation) {
      onErrorChange(validation);
      return;
    }
    onErrorChange(null);
    setDraft(trimmed);
    onRename(trimmed);
  };

  return (
    <div className="flex flex-col gap-[calc(6*var(--fpx))]">
      <div
        ref={(el) => {
          if (el) rowElRefs.current.set(row.id, el);
          else rowElRefs.current.delete(row.id);
        }}
        className={
          "flex flex-row items-center gap-[calc(8*var(--fpx))]" +
          (dragging ? " opacity-70" : "")
        }
      >
        <button
          ref={(el) => {
            if (el) handleRefs.current.set(row.id, el);
            else handleRefs.current.delete(row.id);
          }}
          type="button"
          aria-label={reorderAria}
          disabled={disabled}
          className={dragHandleClass}
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
        >
          <IconDrag className="size-[calc(24*var(--fpx))]" />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onErrorChange(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          onBlur={handleBlur}
          maxLength={CATEGORY_MAX_LENGTH}
          aria-invalid={error !== null || undefined}
          aria-label={copy.categoryNameAria}
          className={categoryInputClass(error !== null)}
        />
        <button
          type="button"
          aria-label={removeAria}
          onClick={onRemove}
          className={removeButtonClass}
        >
          <IconTrash className="size-[calc(24*var(--fpx))]" />
        </button>
      </div>
      {error && (
        <p role="alert" className={errorClass}>
          {error === "exists" ? copy.errorCategoryExists : copy.errorCategoryReserved}
        </p>
      )}
    </div>
  );
}
