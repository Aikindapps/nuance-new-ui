import type { ReactNode } from "react";
import { IconHeading2 } from "../../../../components/ui/icons/IconHeading2";
import { IconHeading3 } from "../../../../components/ui/icons/IconHeading3";
import { IconQuote } from "../../../../components/ui/icons/IconQuote";
import { IconImage } from "../../../../components/ui/icons/IconImage";
import { IconDivider } from "../../../../components/ui/icons/IconDivider";
import { IconList } from "../../../../components/ui/icons/IconList";
import { IconListOrdered } from "../../../../components/ui/icons/IconListOrdered";
import {
  EditorBottomSheet,
  EditorSheetRow,
} from "../../sections/EditorBottomSheet";
import { editorMobileCopy } from "../../sections/editorMobileCopy";

// Phone "Insert block" sheet (NIC-539, Figma 2679:6263): the same seven
// block types, labels and icons as the desktop "+" foldout, as rows of a
// bottom sheet. Picking a row reports the block type; the "+" plugin applies
// it at the caret and closes the sheet. Scrim, Cancel and Escape close with
// no change.
export type InsertBlockKind =
  | "h2"
  | "h3"
  | "quote"
  | "image"
  | "divider"
  | "ul"
  | "ol";

const ICON = "size-[calc(24*var(--fpx))]";

const ITEMS: { kind: InsertBlockKind; label: string; icon: ReactNode }[] = [
  { kind: "h2", label: "Heading 2", icon: <IconHeading2 className={ICON} /> },
  { kind: "h3", label: "Heading 3", icon: <IconHeading3 className={ICON} /> },
  { kind: "quote", label: "Quote", icon: <IconQuote className={ICON} /> },
  { kind: "image", label: "Insert image", icon: <IconImage className={ICON} /> },
  { kind: "divider", label: "Divider", icon: <IconDivider className={ICON} /> },
  { kind: "ul", label: "Unordered list", icon: <IconList className={ICON} /> },
  { kind: "ol", label: "Ordered list", icon: <IconListOrdered className={ICON} /> },
];

export function InsertBlockSheet({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (kind: InsertBlockKind) => void;
}) {
  return (
    <EditorBottomSheet title={editorMobileCopy.insertBlockTitle} onClose={onClose}>
      {ITEMS.map((item) => (
        <EditorSheetRow
          key={item.kind}
          icon={item.icon}
          label={item.label}
          onClick={() => onPick(item.kind)}
        />
      ))}
    </EditorBottomSheet>
  );
}
