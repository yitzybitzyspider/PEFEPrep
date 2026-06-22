# CLAUDE.md — PEFEPrep daily routine

PEFEPrep is a daily-habit FE/PE exam-prep site (first target: **FE Environmental**,
exam **2026-07-08**). Product spec: `docs/PRD.md`. Engine→site seam: `docs/engine-integration.md`.
**Live site: pefeprep.com** (GitHub Pages, auto-deploys on push to `main`).

## The one rule that matters
**Publish to `main` automatically.** The user just opens the website each day and the new
set is there — there is **no manual merge/review gate**. After the day's set is generated and
the PDF is verified, get it onto `main`:
- Commit the new/updated files, and **either push to `main` directly or open a PR and merge it
  yourself** (squash). Do not leave a PR sitting for manual review.
- `.github/workflows/deploy.yml` then redeploys pefeprep.com automatically.

## What each daily run produces
Find today's date + topic in `data/schedule.json`. For a normal "topic" day, build **18–22
questions** and emit all of:

1. **Questions** → `data/days/dayNN.json` (schema in `docs/engine-integration.md`): `id, set,
   type` (`MCQ`/`Numeric`), `concept, stem, equations[], options[], answer, solution, handbook,
   references`. Optional top-level `fidelityNote` (rendered on the PDF; ignored by the site).
2. **Bank** → add `"dayNN"` to `data/manifest.json` and bump its `updated`. (The "bank" is just
   the flattened day files — `app/data.js` loads them; Today/Bank/Progress update with no code change.)
3. **Cheat sheet** → append the day's equations to `data/handbook.json` (the on-site equation index).
4. **PDF** → `python3 scripts/build_day_pdf.py data/days/dayNN.json materials/` then `pdflatex`
   (run twice) → `materials/FE_DayNN_*.pdf`. Commit the `.pdf` and `.tex`.
5. **Changelog** → add an entry + bump `version` in `data/changelog.json` (drives the site's
   version badge + "what's new"). Days have shipped at 0.5.0, 0.6.0, … 0.9.0 (Day 5).

Schedule specials: **Jul 3 / Jul 6** → full 110-question practice exam instead of a daily set.
**Jul 8+** → stop; post a good-luck note.

## Verification — do not skip
- **Recompute every numeric answer in `python3`** before authoring.
- **Handbook fidelity:** the real NCEES FE Reference Handbook v10.6 lives in Google Drive
  (text extract file id `15oZdEEaXPVhYwSl2DvlFZntBSPmBzcnP`, PDF `1TwS6okS13YuzlV3Nq_QOxjlaV3SGwKot`).
  Cross-check each formula against it (a subagent works well — keep the big text out of context).
  Use the Handbook's exact notation (e.g. **capital `I`** in `Q = CIA`; `C` not `K`; `R = D/4`).
  Anything standard-but-not-printed-in-v10.6 (e.g. SI Rational `/360`, `T = 1/P`, IDF) must be
  **flagged as supplemental** in the `fidelityNote` and cheat sheet — don't imply it's Handbook-sourced.

## Build environment notes
- `pdflatex` (texlive-latex-base/recommended/fonts) and `poppler-utils` may need installing per
  fresh container: `apt-get update && apt-get install -y --no-install-recommends texlive-latex-base
  texlive-latex-recommended texlive-fonts-recommended poppler-utils`.
- `scripts/build_day_pdf.py` uses **only base/recommended LaTeX** (no `-extra`) and maps Unicode →
  LaTeX, so it compiles cleanly. Inspect output with `pdftoppm -png` + read the PNG.

## Progress / mastery persistence
Per-question right/wrong, Leitner review state, attempts, streak, and section mastery are already
saved in **`localStorage`** (`app/store.js`). Cross-device sync via **Supabase** is the PRD v2 plan
(not yet built).
