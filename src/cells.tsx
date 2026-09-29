import type { CustomCellRendererProps } from "ag-grid-react";
import { useEffect, useState } from "react";
import type { GridRow } from "./types";

type TaskFields = {
  doneField: "topDone" | "highDone" | "med1Done" | "med2Done" | "lowDone";
  labelField: "topLabel" | "highLabel" | "med1Label" | "med2Label" | "lowLabel";
};

export type GridContext = {
  canEdit: boolean;
  onPatch: (id: string, patch: Partial<GridRow>) => void;
};

type TaskCellProps = CustomCellRendererProps<GridRow, string, GridContext> & TaskFields;

export function TaskCell({ data, context, doneField, labelField }: TaskCellProps) {
  const label = data?.[labelField] ?? "";
  const done = Boolean(data?.[doneField]);
  const [draft, setDraft] = useState(label);

  useEffect(() => {
    setDraft(label);
  }, [label]);

  if (!data) return null;

  return (
    <div className="task-cell">
      <input
        type="checkbox"
        checked={done}
        disabled={!context.canEdit}
        aria-label={`${data.person} ${data.day} done`}
        onChange={(event) => context.onPatch(data.id, { [doneField]: event.target.checked })}
      />
      {context.canEdit ? (
        <input
          type="text"
          value={draft}
          aria-label={`${data.person} ${data.day} task`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (draft !== label) context.onPatch(data.id, { [labelField]: draft });
          }}
        />
      ) : (
        <span className={done ? "task-done" : undefined}>{label}</span>
      )}
    </div>
  );
}

type BoolCellProps = CustomCellRendererProps<GridRow, boolean, GridContext>;

export function BoolCell({ data, value, context, colDef }: BoolCellProps) {
  if (!data || !colDef?.field) return null;
  const field = colDef.field as "top5" | "exercise" | "reading";

  return (
    <div className="bool-cell">
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={!context.canEdit}
        aria-label={`${data.person} ${data.day} ${colDef.headerName ?? field}`}
        onChange={(event) => context.onPatch(data.id, { [field]: event.target.checked })}
      />
    </div>
  );
}
