# Top 5

An app version of the Top 5 Awesome Inc scorecard created by Jim Host. People write five tasks a day, check off Top 5, Exercise, and Reading, and everyone can see the weekly points.

The app runs in the browser today. Supabase is the planned database, and it is not connected yet. Until Kyle shares the project URL and the public key, every edit stays in this browser.

## Groups

The colored bars on the sheet are three groups of people on one scorecard. Each person still has the same five days and the same points.

| Group | Who |
|---|---|
| ACES | The ACES section of the sheet |
| Alpha | Team Alpha, the internship program. The sheet banner reads ALPHIAS |
| Awesomes | Full-time Awesome Inc staff |

Logan Zakeri is the admin once sign-in exists. That role is separate from his group.

## Points

Daily points use the sheet formula:

```
=SUM(IF(Top5=TRUE,+15,+0)+IF(Exercise=TRUE,+5,+0)+IF(Reading=TRUE,+5,+0))
```

| Checkbox | Points |
|---|---|
| Top 5 | 15 |
| Exercise | 5 |
| Reading | 5 |

A finished day is 25. A finished week is 125, the sum of Monday through Friday. The five priority columns are the task list. Checking one of those does not add points.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

| Script | What it does |
|---|---|
| `npm run dev` | Start the local site |
| `npm run build` | Typecheck and build the static site |
| `npm run preview` | Serve the production build locally |

## Pages

The week control sits under the title and applies to both pages. **Next week** stays disabled on the current week, so the scorecard cannot move into the future. **Previous week** opens the Monday before. If that week has no saved rows, the same people appear with blank days. Import CSV fills whichever week is selected.

**My week** (`/`) edits one person. The menu at the top picks who, because there is no sign-in yet. Checking Top 5, Exercise, or Reading updates that day's points and the weekly total.

**Dashboard** (`/dashboard`) is read-only. The top grid is one row per person, with Monday through Friday and the week total. The grid below is the full task list. The filter box searches both grids.

**Load sample** puts the bundled sample sheet on the current week. **Import CSV** replaces only the week you are looking at.

## Import the Google Sheet

1. Open the scorecard tab.
2. File → Download → Comma-separated values (.csv).
3. In the app, select the week that file belongs to.
4. Click Import CSV and choose the file.

Checkboxes arrive as `TRUE` or `FALSE`. The app ignores the Daily Points and Total Points cells and recalculates from the three scoring checkboxes. If a person's name is filled in only on the first of their five rows, the importer copies that name down.

The sheet layout the importer expects:

| Column | Contents |
|---|---|
| A | Person name, or a group banner (`ACES`, `ALPHIAS`, `AWESOMES`) on its own row |
| Then five pairs | A checkbox column and a text column for Top, High, Medium, Medium, and Low |
| Notes | Free text |
| Top 5 | Checkbox worth 15 |
| Exercise | Checkbox worth 5 |
| Reading | Checkbox worth 5 |

A group banner has to be the only text in its row. `public/sample-top5.csv` is a small file in that shape, used the first time the app opens.

## Where the data lives

Edits are written to `localStorage` under `top5-board-v2`. Each week is stored separately, keyed by that week's Monday (`2026-09-28`). Refreshing the page keeps those weeks. Clearing the site data for this origin deletes them. Another browser, or another person, does not see them.

Supabase will replace that save when the project exists. The browser will call Supabase directly. There is no Prisma layer and no custom API server in this version. Google sign-in is already enabled on the Supabase side Kyle showed. This app does not use it yet.

## Project layout

```
src/
  main.tsx            Starts React, routing, AG Grid, and the saved board
  App.tsx             Header, week switcher, and the two routes
  types.ts            A person-day row and the three groups
  points.ts           The 15 / 5 / 5 formula and weekly totals
  weeks.ts            Monday dates, blank weeks, and the roster copy
  parseSheetCsv.ts    Turns a Google Sheets CSV into rows
  cells.tsx           Checkbox and task-text cells inside the grid
  columns.tsx         Column definitions for the task grid
  board.tsx           Saved weeks, import, and the shared AG Grid
  pages/MyWeek.tsx    Editable scorecard for one person
  pages/Dashboard.tsx Read-only standings and the full task grid
public/
  sample-top5.csv     Sample scorecard used before a real import
```

AG Grid Community is the free edition. The grids use sorting, filtering, and custom cells. Row grouping is a paid feature, so the dashboard sorts by group instead of grouping rows.
