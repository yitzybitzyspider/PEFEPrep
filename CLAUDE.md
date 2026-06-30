# CLAUDE.md — PEFEPrep daily routine

PEFEPrep is a daily-habit FE/PE exam-prep site (first target: **FE Environmental**,
exam **2026-07-08**). Product spec: `docs/PRD.md`. Engine→site seam: `docs/engine-integration.md`.
**Live site: pefeprep.com** (GitHub Pages, auto-deploys on push to `main`).

## How to run this routine — Opus + ultracode, every time
Run each daily routine on **Opus** with **ultracode** (multi-agent `Workflow` orchestration).
Decompose the day's work (build → verify math → render → audit) into fan-out + adversarial-verify
phases rather than doing it single-threaded; token cost is not the constraint, correctness is.
(The session model is chosen at trigger time; if a run starts on a non-Opus model, say so.)

## Source of truth — read/update these
- **`docs/ARCHITECTURE.md`** — how the system is built (layers, data model, flows, file map). Update it when you change how a layer works.
- **`docs/FEATURES.md`** — the running feature registry. **Update the matching row in the same PR** whenever you ship/change/remove a feature.
- **`docs/NEW-EXAM-PLAYBOOK.md`** — how to fork this engine for a different exam.
- **`app/config.js` (`window.APP_CONFIG`)** is the per-exam "fork surface": exam id/name/**date**, brand/wordmark, tagline, handbook, and the knowledge-area list + weights. The engine reads from it (with fallbacks). **Never hard-code "FE Environmental" or the exam date in engine code** — read it from config so the codebase stays reusable across exams.

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
- **Math formatting (renders via KaTeX on the site):** every formula/variable shown to the student
  must be wrapped in `$…$` (inline) or `$$…$$` (display) — bare `X_A`, `H^{3/2}`, or a loose `{,}`
  thousands-separator render as raw text. Inside `$…$`: use plain commas in `\text{}` (the `{,}`
  tight-comma trick only works in pure math, not text), never put `\cdot`/`·` inside `\text{}`
  (write `\text{mg/(kg}\cdot\text{day)}`), and give a stray degree an empty base (`{}^\circ`). In
  prose stems/options, use a plain comma in numbers (`1,200`, not `1{,}200`). Don't hand-write a
  formula in a stem (see the closed-book gate) — but any variable you *do* name must be `$…$`-wrapped.
  Sanity-check by mentally rendering each `_`/`^`/`\text{}` you author. (Fractions: `\dfrac{}{}`.)
- **Currency `$` must be self-delimited math — never bare.** A bare `$5,400` in prose/tables collides
  with KaTeX's `$` math delimiter: adjacent amounts pair up and the prose between them renders as
  garbled math, and table `|` separators get swallowed. **Always write money as a self-contained
  inline math span** `$\$5{,}400$` (→ "$5,400"), `$\$12{,}000/\text{yr}$`, `$\$0$`. This is the one
  case where prose numbers use `{,}` not a plain comma (because they live inside `$…$`). Every `$`
  must be balanced. The same self-delimited form renders identically in the LaTeX PDF. (The PDF
  builder `scripts/build_day_pdf.py` and the site renderer `app/math.js` both assume this.)
- **Exam-relevance (do this per question, every build):** map **each** question to a specific
  FE Environmental knowledge-area subtopic in `reference/fe-environmental-spec.md` (e.g. "10.A —
  frequency"). If a question maps to nothing on the spec, **cut it** — only ship questions that
  matter for the exam. Spread the set across the day's KA subtopics rather than piling onto one,
  and keep the SI+USCS mix. (Relevance is a separate gate from Handbook fidelity below — both must pass.)
- **Render-check both surfaces before publishing (don't skip):** rendering bugs hide from
  author-time review. After building, (1) confirm `pdflatex` exits clean and *read* a few
  `pdftoppm -png` pages — currency, **bold**, tables, and bullets must render (not raw `**`/`|`/`$`);
  (2) for any set with tables or currency-heavy prose, sanity-check the live renderer `app/math.js`
  (KaTeX + Markdown) on a stem/solution (a quick headless-Chromium render catches garbled math and
  dropped table columns). The self-delimited currency rule above is what keeps both surfaces clean.
- **Recompute every numeric answer in `python3`** before authoring.
- **Handbook fidelity:** the real NCEES FE Reference Handbook v10.6 lives in Google Drive
  (text extract file id `15oZdEEaXPVhYwSl2DvlFZntBSPmBzcnP`, PDF `1TwS6okS13YuzlV3Nq_QOxjlaV3SGwKot`).
  Cross-check each formula against it (a subagent works well — keep the big text out of context).
  Use the Handbook's exact notation (e.g. **capital `I`** in `Q = CIA`; `C` not `K`; `R = D/4`).
  Anything standard-but-not-printed-in-v10.6 (e.g. SI Rational `/360`, `T = 1/P`, IDF) must be
  **flagged as supplemental** in the `fidelityNote` and cheat sheet — don't imply it's Handbook-sourced.
- **Closed-book solvability gate (per question):** the exam is closed-book except the Handbook, so
  every question must be answerable on exam day using only one of: (i) a **Handbook formula**,
  (ii) genuinely **fundamental knowledge** (e.g. return period `T = 1/P`, area-weighting, volume =
  depth × area), or (iii) a relation **written into the question stem** (the way the real exam hands
  you a chart or equation). If a question would otherwise require *recalling* a formula that is
  neither in the Handbook nor fundamental (e.g. the SI Rational `/360` factor, SI curve-number
  `25400/CN − 254`, a Talbot IDF with constants), **either state that relation in the stem or recast
  to a Handbook-faithful unit system** (consistent SI — m/s, m² → m³/s — needs no magic factor).
  Don't ship it as a pure memory test. **Tag each question** with a `source` field —
  `"handbook"` | `"fundamental"` | `"in-stem"` — so the Handbook status is always explicit.

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
