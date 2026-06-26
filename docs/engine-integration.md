# FE Engine → PEFEPrep: the daily routine

How new questions flow onto the site every day with zero manual work.

## The seam
The site is fully data-driven. It reads:

```
data/manifest.json        → { "days": ["day02","day03",...] }
data/days/dayNN.json      → one file per study day (the questions)
data/schedule.json        → the fixed 21-day plan
data/handbook.json        → equation index for the Handbook panel
```

The loader (`app/data.js`) reads the manifest, loads each day file, and flattens them
into the question bank. **Adding a day = drop `data/days/dayNN.json` + add `"dayNN"` to
`manifest.json`.** Today, Bank, and Progress all update automatically — no code changes.

## What the FE engine must emit
After generating Day N, also write **`dayNN.json`** in this schema (the engine already
has all of this data — it's just one more output format):

```json
{
  "day": 5,
  "date": "2026-06-21",
  "topic": "Surface Water & Hydrology",
  "questions": [
    {
      "id": "D5-Q01",
      "set": "A",
      "type": "MCQ",                       // "MCQ" or "Numeric"
      "concept": "Rational method",
      "stem": "A 20 ha catchment (C = 0.45) ...",
      "equations": ["$Q = CiA$"],          // shown as a hint, LaTeX in $...$
      "options": ["12 L/s", "25 L/s", "...", "..."],   // omit for Numeric
      "answer": 1,                          // option index (MCQ) OR value string (Numeric)
      "steps": ["$Q = CiA = ...$", "..."],  // worked solution, step by step
      "solution": "$Q = CiA = ...$",        // optional single-string fallback
      "handbook": "Surface Water — Rational Method",
      "references": "Ctrl-F: Rational",
      "source": "handbook"                  // "handbook" | "fundamental" | "in-stem"
    }
  ]
}
```

Rules:
- **MCQ**: include `options` (4) and `answer` = the correct **index** (0-3).
- **Numeric**: omit `options`; `answer` = the value **string** (e.g. `"24.5 kW"`).
- Math goes in `$...$` (KaTeX). Use the Handbook's exact notation (C not K, etc.).
- `equations` = the relevant formulas (hidden until the user asks). `steps` = the worked
  solution unlocked one step at a time. Provide one or both.
- `source` = the question's Handbook status (closed-book solvability gate, see CLAUDE.md):
  `"handbook"` (formula is printed in the NCEES FE Handbook v10.6), `"fundamental"` (assumed
  knowledge, e.g. `T = 1/P`), or `"in-stem"` (the needed relation is stated in the question).
  A question must be one of these three — never a memory test for a non-Handbook formula.

## Wiring the routine (pick one)

### Option A — engine commits directly (recommended)
Give the FE engine project push access to the `pefeprep` repo. Add this step to the
engine prompt:

> **STEP — Emit machine-readable JSON for the website.** After the PDF is built, also
> write `data/days/dayNN.json` in the PEFEPrep schema (see docs/engine-integration.md):
> one object per question with id, set, type, concept, stem, equations, options, answer,
> steps, handbook, references. Then add `"dayNN"` to `data/manifest.json`, set
> `data/manifest.json.updated` to today, and commit + push to the `pefeprep` repo on
> `main`. GitHub Pages auto-deploys.

That's the whole routine — the existing daily run now also updates the site.

### Option C — engine → Drive → scheduled Action
If the engine can't get repo access: it writes `dayNN.json` into the Drive folder, and a
daily GitHub Action (with a Google service-account token) copies new day files into
`data/days/`, updates the manifest, and commits. More moving parts; same result.

## Manual backfill (what was done for Days 2-4)
Until the engine emits JSON, day files were authored from the Day PDFs in Drive. The same
schema applies, so when the engine starts emitting JSON nothing else changes.
