import { DAY_NAMES, peopleInOrder } from "./points";
import type { DayRow, Team } from "./types";

export type WeekRecord = {
  rows: DayRow[];
  source: string;
};

export type BoardState = {
  selectedWeek: string;
  weeks: Record<string, WeekRecord>;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function mondayOf(date: Date): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay();
  const daysFromMonday = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + daysFromMonday);
  return formatISODate(copy);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

export function currentMonday(): string {
  return mondayOf(new Date());
}

export function formatWeekLabel(mondayIso: string): string {
  const monday = parseISODate(mondayIso);
  const friday = parseISODate(addDays(mondayIso, 4));
  const mondayText = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fridayText =
    monday.getMonth() === friday.getMonth()
      ? String(friday.getDate())
      : friday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${mondayText} – ${fridayText}`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function withWeekIds(rows: DayRow[], weekId: string): DayRow[] {
  const prefix = `${weekId}-`;
  return rows.map((row) => ({
    ...row,
    id: row.id.startsWith(prefix) ? row.id : `${prefix}${row.id}`,
  }));
}

export function blankWeek(people: Array<{ person: string; team: Team }>, weekId: string): DayRow[] {
  return people.flatMap((person) =>
    DAY_NAMES.map((day, index) => ({
      id: `${weekId}-${slug(person.team)}-${slug(person.person)}-${index + 1}`,
      person: person.person,
      team: person.team,
      day,
      topLabel: "",
      topDone: false,
      highLabel: "",
      highDone: false,
      med1Label: "",
      med1Done: false,
      med2Label: "",
      med2Done: false,
      lowLabel: "",
      lowDone: false,
      notes: "",
      top5: false,
      exercise: false,
      reading: false,
    })),
  );
}

export function weekIsEmpty(rows: DayRow[]): boolean {
  return (
    rows.length > 0 &&
    rows.every(
      (row) =>
        !row.topLabel &&
        !row.highLabel &&
        !row.med1Label &&
        !row.med2Label &&
        !row.lowLabel &&
        !row.notes &&
        !row.topDone &&
        !row.highDone &&
        !row.med1Done &&
        !row.med2Done &&
        !row.lowDone &&
        !row.top5 &&
        !row.exercise &&
        !row.reading,
    )
  );
}

export function rosterFrom(weeks: Record<string, WeekRecord>, preferredWeek: string): Array<{ person: string; team: Team }> {
  const preferred = weeks[preferredWeek]?.rows ?? [];
  if (preferred.length > 0) return peopleInOrder(preferred);
  const ids = Object.keys(weeks).sort().reverse();
  for (const id of ids) {
    if (weeks[id].rows.length > 0) return peopleInOrder(weeks[id].rows);
  }
  return [];
}
