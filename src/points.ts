import type { DayRow, Team } from "./types";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const MAX_DAY_POINTS = 25;
export const MAX_WEEK_POINTS = MAX_DAY_POINTS * DAY_NAMES.length;

export function dailyPoints(row: Pick<DayRow, "top5" | "exercise" | "reading">): number {
  return (row.top5 ? 15 : 0) + (row.exercise ? 5 : 0) + (row.reading ? 5 : 0);
}

export function personKey(row: Pick<DayRow, "team" | "person">): string {
  return `${row.team}|${row.person}`;
}

export function peopleInOrder(rows: DayRow[]): Array<{ key: string; person: string; team: Team }> {
  const seen = new Set<string>();
  const people: Array<{ key: string; person: string; team: Team }> = [];
  for (const row of rows) {
    const key = personKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    people.push({ key, person: row.person, team: row.team });
  }
  return people;
}

export function weekPoints(rows: DayRow[], key: string): number {
  return rows.reduce((sum, row) => (personKey(row) === key ? sum + dailyPoints(row) : sum), 0);
}
