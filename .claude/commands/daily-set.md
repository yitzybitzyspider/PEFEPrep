---
description: Build and publish today's PEFEPrep daily set (FE Environmental), Opus + ultracode.
---

# Daily set — PEFEPrep

This is the daily routine. Read `CLAUDE.md` first — it holds the authoritative
authoring, math-formatting, currency, Handbook-fidelity, closed-book, and
publish-to-`main` rules. This file is the *procedure*; CLAUDE.md is the *rules*.

## Run it on Opus, with ultracode (always)
**Use the `Workflow` tool to orchestrate this run** — decompose it into fan-out +
adversarial-verify phases (build → verify math → render-check → audit) instead of
doing it single-threaded. Token cost is not the constraint; correctness is. This
instruction is a standing opt-in to multi-agent orchestration: use it every run,
no keyword needed.
(The session **model** is selected by the scheduler at trigger time and cannot be
set from here. Prefer Opus. If a run starts on a non-Opus model, say so in the
first line of your reply, then proceed.)

## Steps
1. **Pick the day.** Find today's date in `data/schedule.json`. If today is **Jul 3
   or Jul 6** → build the full 110-question practice exam instead of a daily set.
   If **Jul 8 or later** → stop and post a good-luck note. Otherwise it's a normal
   "topic" day: build **18–22 questions** for the day's knowledge area.
2. **Author** the questions per CLAUDE.md: every numeric answer recomputed in
   `python3`; each question mapped to a `reference/fe-environmental-spec.md`
   subtopic (cut anything that maps to nothing); SI+USCS mix; `source` tag on each;
   Handbook formulas cross-checked against v10.6 (use a subagent).
3. **Math & currency formatting (the gate that bites):** every variable/formula is
   `$…$`/`$$…$$`-wrapped, and **every dollar amount is a self-delimited math span**
   `$\$5{,}400$` — never a bare `$5,400` (bare currency collides with KaTeX's `$`
   and garbles prose + breaks tables). See CLAUDE.md → Verification for the full
   rule and the table/`\text{}`/`\cdot` gotchas.
4. **Emit** all of: `data/days/dayNN.json`; add `dayNN` to `data/manifest.json`
   (+bump `updated`); append equations to `data/handbook.json`; add a
   `data/changelog.json` entry (+bump `version`).
5. **Build the PDF:** `python3 scripts/build_day_pdf.py data/days/dayNN.json
   materials/` then `pdflatex` twice → commit the `.pdf` and `.tex`.
6. **Render-check before publishing (do not skip — this is how rendering bugs are
   caught automatically):**
   - **PDF:** confirm `pdflatex` exits clean, then `pdftoppm -png` a few pages and
     *read the PNGs* — verify currency, **bold**, tables, and bullet lists render
     (not raw `**`/`|`/`$`).
   - **Site:** the live renderer is `app/math.js` (KaTeX auto-render + a Markdown
     pass). For any set with tables or currency-heavy prose, sanity-check that
     `renderMarkdown` + KaTeX produce clean output — a quick headless-Chromium
     render of a stem/solution against `app/math.js` catches garbled math and
     dropped table columns that author-time review misses.
7. **Publish to `main` automatically** (no review gate): commit, open a PR and
   squash-merge it yourself (or push to `main`). `.github/workflows/deploy.yml`
   redeploys pefeprep.com. If this branch's prior PR was already merged, restart
   the branch from the latest `main` first (see the git rules in the system prompt).

Success = a compiled, verified PDF + a clean-rendering set for today, live on `main`.
