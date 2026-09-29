# Top 5

An app version of the Top 5 Awesome Inc doc created by Jim Host. Points and tasks stay in this browser until Supabase is connected.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

My week edits one person's checkboxes for the week selected at the top. Dashboard shows everyone's points for that same week. Previous week opens an older scorecard. Changes are saved in this browser only.

## Import the Google Sheet

1. Open the scorecard tab.
2. File → Download → Comma-separated values (.csv).
3. In the app, click Import CSV and choose that file.

Checkboxes come through as TRUE or FALSE. The app recalculates points from the Top 5, Exercise, and Reading columns.
