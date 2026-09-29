import { AgGridReact } from "ag-grid-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildColumns, gridTheme } from "./columns";
import type { GridContext } from "./cells";
import { importSummary, parseSheetCsv } from "./parseSheetCsv";
import { dailyPoints, peopleInOrder, personKey, weekPoints } from "./points";
import type { DayRow, GridRow } from "./types";
import {
  addDays,
  blankWeek,
  currentMonday,
  formatWeekLabel,
  rosterFrom,
  weekIsEmpty,
  withWeekIds,
  type BoardState,
  type WeekRecord,
} from "./weeks";

const STORAGE_KEY = "top5-board-v2";
const LEGACY_KEY = "top5-board-v1";

type Notice = { tone: "ok" | "error"; text: string };

type BoardValue = {
  rows: DayRow[];
  ready: boolean;
  source: string;
  notice: Notice | null;
  people: ReturnType<typeof peopleInOrder>;
  selectedWeek: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  weekIds: string[];
  weekIsBlank: boolean;
  onPatch: GridContext["onPatch"];
  importCsv: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  selectWeek: (weekId: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
};

const BoardContext = createContext<BoardValue | null>(null);

function isDayRowArray(value: unknown): value is DayRow[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0]?.person === "string";
}

function readSaved(): BoardState | null {
  const current = currentMonday();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BoardState;
      if (parsed?.weeks && typeof parsed.selectedWeek === "string" && Object.keys(parsed.weeks).length > 0) {
        return {
          selectedWeek: parsed.selectedWeek > current ? current : parsed.selectedWeek,
          weeks: parsed.weeks,
        };
      }
    }
  } catch {
    // Fall through to the older single-week save.
  }

  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const rows = JSON.parse(legacy) as unknown;
    if (!isDayRowArray(rows)) return null;
    return {
      selectedWeek: current,
      weeks: { [current]: { rows: withWeekIds(rows, current), source: "Saved on this computer" } },
    };
  } catch {
    return null;
  }
}

function ensureWeek(weeks: Record<string, WeekRecord>, weekId: string, fromWeek: string): Record<string, WeekRecord> {
  if (weeks[weekId]) return weeks;
  const roster = rosterFrom(weeks, fromWeek);
  return {
    ...weeks,
    [weekId]: {
      rows: blankWeek(roster, weekId),
      source: roster.length > 0 ? "Blank week" : "Empty week",
    },
  };
}

async function fetchSample(): Promise<DayRow[]> {
  const response = await fetch("/sample-top5.csv");
  if (!response.ok) throw new Error("Could not load the sample sheet.");
  return parseSheetCsv(await response.text());
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const saved = useMemo(() => readSaved(), []);
  const [selectedWeek, setSelectedWeek] = useState(saved?.selectedWeek ?? currentMonday());
  const [weeks, setWeeks] = useState<Record<string, WeekRecord>>(saved?.weeks ?? {});
  const [ready, setReady] = useState(Boolean(saved));
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (saved) return;
    let cancel = false;
    const weekId = currentMonday();
    fetchSample()
      .then((next) => {
        if (cancel) return;
        setSelectedWeek(weekId);
        setWeeks({ [weekId]: { rows: withWeekIds(next, weekId), source: "Sample sheet" } });
        setReady(true);
        setNotice({ tone: "ok", text: `Sample sheet loaded. ${importSummary(next)}` });
      })
      .catch((error: unknown) => {
        if (cancel) return;
        setReady(true);
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load the sample sheet.",
        });
      });
    return () => {
      cancel = true;
    };
  }, [saved]);

  useEffect(() => {
    if (!ready || Object.keys(weeks).length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedWeek, weeks }));
  }, [ready, selectedWeek, weeks]);

  const onPatch = useCallback<GridContext["onPatch"]>(
    (id, patch) => {
      setWeeks((current) => {
        const week = current[selectedWeek];
        if (!week) return current;
        return {
          ...current,
          [selectedWeek]: {
            ...week,
            rows: week.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        };
      });
    },
    [selectedWeek],
  );

  const importCsv = useCallback(
    async (file: File) => {
      try {
        const next = withWeekIds(parseSheetCsv(await file.text()), selectedWeek);
        setWeeks((current) => ({
          ...current,
          [selectedWeek]: { rows: next, source: file.name },
        }));
        setNotice({ tone: "ok", text: `Imported ${importSummary(next, file.name)}` });
      } catch (error: unknown) {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not read that CSV.",
        });
      }
    },
    [selectedWeek],
  );

  const loadSample = useCallback(async () => {
    try {
      const weekId = currentMonday();
      const next = withWeekIds(await fetchSample(), weekId);
      setSelectedWeek(weekId);
      setWeeks((current) => ({
        ...current,
        [weekId]: { rows: next, source: "Sample sheet" },
      }));
      setNotice({ tone: "ok", text: `Sample sheet loaded. ${importSummary(next)}` });
    } catch (error: unknown) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not load the sample sheet.",
      });
    }
  }, []);

  const selectWeek = useCallback((weekId: string) => {
    setSelectedWeek(weekId);
    setNotice(null);
  }, []);

  const goToPreviousWeek = useCallback(() => {
    const previous = addDays(selectedWeek, -7);
    if (!weeks[previous]) {
      setNotice({
        tone: "ok",
        text: `No saved scorecard for ${formatWeekLabel(previous)}. The roster is blank until you import or fill it in.`,
      });
    }
    setWeeks((current) => ensureWeek(current, previous, selectedWeek));
    setSelectedWeek(previous);
  }, [selectedWeek, weeks]);

  const goToNextWeek = useCallback(() => {
    const today = currentMonday();
    const next = addDays(selectedWeek, 7);
    if (next > today) return;
    setNotice(null);
    setWeeks((current) => ensureWeek(current, next, selectedWeek));
    setSelectedWeek(next);
  }, [selectedWeek]);

  const rows = weeks[selectedWeek]?.rows ?? [];
  const source = weeks[selectedWeek]?.source ?? "Sample sheet";
  const people = useMemo(() => peopleInOrder(rows), [rows]);
  const weekIds = useMemo(() => Object.keys(weeks).sort().reverse(), [weeks]);
  const today = currentMonday();
  const isCurrentWeek = selectedWeek === today;
  const weekLabel = formatWeekLabel(selectedWeek);
  const weekIsBlank = weekIsEmpty(rows);

  const value = useMemo(
    () => ({
      rows,
      ready,
      source,
      notice,
      people,
      selectedWeek,
      weekLabel,
      isCurrentWeek,
      weekIds,
      weekIsBlank,
      onPatch,
      importCsv,
      loadSample,
      selectWeek,
      goToPreviousWeek,
      goToNextWeek,
    }),
    [
      rows,
      ready,
      source,
      notice,
      people,
      selectedWeek,
      weekLabel,
      isCurrentWeek,
      weekIds,
      weekIsBlank,
      onPatch,
      importCsv,
      loadSample,
      selectWeek,
      goToPreviousWeek,
      goToNextWeek,
    ],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardValue {
  const value = useContext(BoardContext);
  if (!value) throw new Error("useBoard must be used inside BoardProvider");
  return value;
}

export function toGridRows(rows: DayRow[]): GridRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = personKey(row);
    totals.set(key, (totals.get(key) ?? 0) + dailyPoints(row));
  }
  return rows.map((row) => ({
    ...row,
    daily: dailyPoints(row),
    week: totals.get(personKey(row)) ?? weekPoints(rows, personKey(row)),
  }));
}

type ScoreGridProps = {
  rows: DayRow[];
  canEdit: boolean;
  showWeek?: boolean;
  height?: number | string;
  quickFilter?: string;
};

export function ScoreGrid({ rows, canEdit, showWeek = false, height, quickFilter }: ScoreGridProps) {
  const { onPatch, selectedWeek } = useBoard();
  const gridRows = useMemo(() => toGridRows(rows), [rows]);
  const columnDefs = useMemo(() => buildColumns(showWeek), [showWeek]);
  const context = useMemo<GridContext>(() => ({ canEdit, onPatch }), [canEdit, onPatch]);

  return (
    <div className="grid-wrap" key={selectedWeek} style={height == null ? undefined : { height }}>
      <AgGridReact<GridRow>
        theme={gridTheme}
        rowData={gridRows}
        columnDefs={columnDefs}
        context={context}
        getRowId={(params) => params.data.id}
        defaultColDef={{ sortable: true, resizable: true, suppressMovable: true }}
        enableBrowserTooltips
        tooltipShowDelay={400}
        quickFilterText={quickFilter}
        headerHeight={52}
        rowHeight={44}
        suppressCellFocus={!canEdit}
        onCellValueChanged={(event) => {
          if (!event.data || event.colDef.field !== "notes") return;
          onPatch(event.data.id, { notes: String(event.newValue ?? "") });
        }}
        stopEditingWhenCellsLoseFocus
      />
    </div>
  );
}
