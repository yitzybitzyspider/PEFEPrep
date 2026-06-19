# PEFEPrep — Product Requirements Document (PRD)

> **Status:** Draft v0.1 · **Last updated:** 2026-06-19 · **Owner:** Yitzy
> Living document — edit freely. Open decisions are tracked in §9.

---

## 1. Vision

PEFEPrep is a **daily-habit exam-prep platform** for the engineering licensure exams
(NCEES **FE** and **PE**). It is **not** a textbook or a video course — it is a *practice
engine*: a small, Handbook-sourced set of questions every day, delivered automatically,
reviewed in a clean Khan-Academy-style flow, with **spaced repetition** that resurfaces
what you're forgetting and **per-section mastery tracking** that shows exactly where you stand.

**First target:** the **FE Environmental** exam (Yitzy's exam: **Wednesday, July 8, 2026**).
The architecture is built so additional exams/disciplines (FE Civil, PE, etc.) drop in later.

**One-line pitch:** *"20 questions a day, sourced from the Handbook, that quietly drill you
on exactly the things you're about to forget — and show you when you're exam-ready."*

---

## 2. Goals & Non-Goals

### Goals (v1)
- Build a **daily study habit**: one short, finishable session per day.
- Cover **every FE Environmental section** through interleaved practice + review.
- Make every question **Handbook-faithful** (equations, thresholds, citations).
- **Track mastery** per section and surface weak spots.
- **Automate** the whole loop: generate → publish → notify, hands-off.
- Keep features **modular/togglable** so the experience can be tuned.

### Non-Goals (explicitly out of scope for v1)
- Video lectures or long-form written lessons.
- Community, forums, social features.
- Multi-tenant / selling to other users (single-user first; multi-user is a later architecture concern, not a v1 feature).
- Payments / subscriptions (revisit post-exam).

---

## 3. Primary User & Daily Flow

**Primary user:** Yitzy, studying 3–4 hrs/day for FE Environmental.
(Designing for one user now, but the data model assumes "a user" so accounts can be added.)

**A day in the life (the core loop we're optimizing):**
1. Morning notification arrives: *"Today's set is ready — 20 questions."*
2. Opens pefeprep.com → **Today** screen shows ~20 questions: a mix of **today's new topic**
   plus **spaced-repetition reviews** of earlier sections that are due.
3. Goes question-by-question (Khan/GregMat style): reads it, **tries it with answers hidden**,
   then **reveals** the answer + worked solution + the **Handbook equation/section** + any
   **extra references**.
4. Each answer feeds the **spaced-repetition** engine (got it / missed it → reschedules).
5. **Progress dashboard** updates per section ("Fluid Mechanics: 78% · exam-ready"; "Air Quality: 41% · needs work").
6. Done in one sitting. Streak +1.

---

## 4. Domain Model (concepts)

```
Exam (FE, PE)
└─ Discipline (Environmental, Civil, …)
   └─ Section / Topic (Fluid Mechanics, Hydrology, Air Quality, …)  ← NCEES taxonomy
      └─ Question (stem · 4 options · answer · worked solution · Handbook ref · references)

User ──< Attempt (question, correct?, time, date)
User ──< ReviewState (question, ease, interval, due date, mastery)   ← spaced repetition
User ──> SectionMastery (section, accuracy, readiness)               ← derived
DailySet (date, [questions])                                          ← scheduler output
```

---

## 5. Feature Catalog (priority + toggle)

Priorities: **P0** = core daily loop (build first) · **P1** = makes it real · **P2** = later.
"Toggle" = user can turn it on/off in Settings.

| ID | Feature | Priority | Toggle | Inspired by |
|----|---------|:--------:|:------:|-------------|
| F1 | Daily Question Set ("Today") | **P0** | size only | GregMat dailies |
| F2 | Question Player (hide/reveal, explanations) | **P0** | yes | Khan Academy |
| F3 | Handbook Equation & Reference Sourcing | **P0** | — | UWorld explanations |
| F4 | Spaced Repetition / Mastery (Anki-style) | **P1** | yes | Anki |
| F5 | Progress & Section Mastery Dashboard | **P0** | — | GregMat score predictor |
| F6 | Browse / Search the Question Bank | **P1** | — | UWorld Qbank |
| F7 | Settings & Feature Toggles | **P0** | — | — |
| F8 | Daily Automation & Delivery (notify) | **P0** | per-channel | Duolingo streak nudge |
| F9 | Accounts & Cross-Device Sync (Supabase) | **P1** | — | — |
| F10 | Practice Exams / Timed Simulator | **P2** | — | NCEES Pearson VUE |
| F11 | Cheat Sheet & Study Notes pages | **P2** | — | — |

---

## 6. Detailed Requirements

### F1 — Daily Question Set ("Today")  · P0
The heart of the product: a short, finishable daily session.
- **F1.1** Each day presents a **capped set (~20, configurable; default 20, never auto-exceed)**.
- **F1.2** The set is **composed by a scheduler**, not just today's fresh topic: it **interleaves**
  (a) new questions from the day's scheduled section + (b) **due spaced-repetition reviews** from
  earlier sections. This is what "pushes me to see if I know other subjects."
- **F1.3** Clear **completion state** (progress bar, "X of 20", "done for today" + streak).
- **F1.4** A finished day is **revisitable** read-only; you can't accidentally lose it.
- **F1.5** If no new content for the day, the set falls back to **pure review** of due/weak items.

### F2 — Question Player (hide/reveal)  · P0
- **F2.1** One question at a time; 4-option MCQ + numeric-entry types.
- **F2.2** **Answers hidden by default**; an explicit **Reveal** action shows the answer.
  *(Togglable: "auto-reveal after I answer" vs "manual reveal".)*
- **F2.3** On reveal, show: correct answer, **worked solution**, the **Handbook equation/section**
  (F3), and any **extra references** to look up.
- **F2.4** A **self-grade** option for when answers are hidden and he's testing recall
  ("I knew it / I didn't") — feeds F4 even without committing to an option.
- **F2.5** Keyboard-friendly (1–4 to pick, space to reveal, enter for next) — fast daily reps.
- **F2.6** Works great on mobile (likely where the morning session happens).

### F3 — Handbook Equation & Reference Sourcing  · P0
- **F3.1** Every question carries its **NCEES FE Reference Handbook** citation (section name)
  and a **Ctrl-F term** (already a column in `FE_Question_Bank.xlsx`).
- **F3.2** Equations render as **real math** (LaTeX/MathJax), matching the Handbook's exact notation
  (C not K; Re>10,000; R=D/4 — per the engine's fidelity rules).
- **F3.3** Each question may list **additional references** ("look this up") — Handbook page,
  study-guide section, or external link.
- **F3.4** Content is **verified against the Handbook by the generator** before it ever reaches the site
  (fidelity is the engine's job; the site just displays + links).

### F4 — Spaced Repetition / Mastery (Anki-style)  · P1 *(togglable)*
- **F4.1** Track per-question **recall state** (ease, interval, due date) using a simple,
  proven scheme (Leitner boxes or SM-2 — see §9 open decision).
- **F4.2** Missed/forgotten items **resurface sooner**; mastered items **stretch out**.
- **F4.3** Drives F1.2's review portion of the daily set.
- **F4.4** Per-item **mastery level** (New → Learning → Reviewing → Mastered) visible to the user.
- **F4.5** Entire SRS layer is **togglable** — can run as a plain daily quiz if he prefers.

### F5 — Progress & Section Mastery Dashboard  · P0
- **F5.1** **Per-section** accuracy + a readiness signal (e.g., red / amber / green).
- **F5.2** Overall **exam-readiness** estimate, weighted by NCEES topic distribution.
- **F5.3** **Streak** + activity history (daily completion).
- **F5.4** "Weakest sections" callout so he knows where to spend time.
- **F5.5** Days-until-exam countdown (July 8, 2026).

### F6 — Browse / Search the Question Bank  · P1
- **F6.1** Browse the cumulative bank by **section/topic**.
- **F6.2** **Filter** by section, difficulty, type, and status (missed, mastered, unseen).
- **F6.3** **Search** by keyword / concept / Handbook term.
- **F6.4** Launch an **ad-hoc drill** from any filter ("give me 10 from Air Quality I've missed").

### F7 — Settings & Feature Toggles  · P0
Everything tunable, per the "all togglable" requirement.
- **F7.1** Daily set **size** (default 20).
- **F7.2** **Reveal mode** (manual vs auto-reveal).
- **F7.3** **Spaced repetition** on/off (F4).
- **F7.4** **Timed mode** on/off (F10 preview).
- **F7.5** **Notifications** per channel on/off + delivery time (F8).
- **F7.6** **Mix ratio** new vs review in the daily set.

### F8 — Daily Automation & Delivery  · P0
The "set it and forget it" routine.
- **F8.1** A **scheduled job** runs every morning: generate the day's content → publish to the site → notify.
- **F8.2** **Generation** is the existing FE daily engine (Handbook-sourced); it must **also emit a
  machine-readable `questions.json`** (full stem + 4 options + solution + metadata), not just the PDF/xlsx.
- **F8.3** **Publish:** new content lands in the site's data store and the site updates automatically
  (the CD pipeline already does this on push to `main`).
- **F8.4** **Notify:** send Yitzy a notification with a link to today's set (channel TBD — §9).
- **F8.5** **Idempotent & resilient:** re-running a day doesn't duplicate; a failed day is recoverable.

### F9 — Accounts & Cross-Device Sync  · P1
- **F9.1** Persist attempts, SRS state, settings, streak in **Supabase** (Postgres + auth).
- **F9.2** Same progress on phone (morning) and laptop (evening).
- **F9.3** Question bank lives in the **private** DB / API (not the public repo).
- **F9.4** Single login now; multi-user-ready schema.

### F10 — Practice Exams / Timed Simulator  · P2
- Full-length (110-question) timed mock matching NCEES distribution; the engine already
  generates Exam #1 (Jul 3) and #2 (Jul 6).

### F11 — Cheat Sheet & Study Notes  · P2
- Render `FE_CheatSheet` and the Day PDFs as in-site reference pages.

---

## 7. Architecture (overview)

```
┌─────────────────────────────┐     ┌──────────────────────────┐
│  CONTENT ENGINE (daily)     │     │  NCEES FE Handbook v10.6 │  ← source of truth
│  Claude routine, Handbook-  │◄────┤  (PDF + text extract)    │
│  verified. Emits:           │     └──────────────────────────┘
│   • questions.json (NEW)    │
│   • FE_Question_Bank.xlsx   │
│   • FE_CheatSheet / Day PDFs│
└──────────────┬──────────────┘
               │  to Google Drive folder "FE Environmental Exam Prep"
               ▼
┌─────────────────────────────┐
│  INGEST / SYNC              │  read Drive → upsert into DB (skip dupes)
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐     ┌──────────────────────────┐
│  SUPABASE (P1)              │     │  GITHUB PAGES (live)     │
│  questions · attempts ·     │◄────┤  pefeprep.com  (frontend)│
│  review_state · settings    │     │  Today · Player · Dash   │
└─────────────────────────────┘     └──────────────────────────┘
               ▲                                  ▲
               └──────── SCHEDULED JOB ───────────┘
        (cron / GitHub Actions: generate → publish → notify)
```

**v0 (already live):** static frontend on GitHub Pages + auto-deploy on push to `main`;
demo drill reading `data/questions.json`. This is the seam everything else snaps into.

**Stack:** Frontend = static (GitHub Pages); upgrade to Vite + React when the app outgrows
single pages. Backend = Supabase (Postgres/Auth). Automation = scheduled GitHub Action (or the
Claude routine) calling the engine + ingest. Math = MathJax/KaTeX. Notifications = §9.

---

## 8. Roadmap (phased)

- **v0 — Live shell ✅** *(done)* — domain, CD pipeline, demo drill, JSON seam.
- **v1 — The daily loop (P0):** Today screen (F1), question player w/ hide-reveal + Handbook refs
  (F2/F3), section progress (F5), settings (F7), and the daily automation that generates + publishes
  + notifies (F8). Real FE Environmental content flowing in from the engine.
- **v2 — Make it stick (P1):** Spaced repetition (F4), accounts + sync via Supabase (F9),
  browse/search the bank (F6).
- **v3 — Exam mode (P2):** timed full-length simulator (F10), cheat-sheet/notes pages (F11),
  readiness predictor tuning.
- **post-exam:** generalize to other exams/disciplines; consider multi-user + monetization.

---

## 9. Open Decisions (need Yitzy's input)

1. **Notification channel (F8.4):** email · mobile push (installable PWA) · text/SMS · more than one?
2. **Where the daily routine runs (F8.1):** keep it in the Claude cowork project · a scheduled
   GitHub Action · another scheduler? (Affects how hands-off it is.)
3. **Accounts now or later (F9):** single-user with browser storage for v1, or stand up Supabase
   auth immediately for cross-device from day one?
4. **Spaced-repetition algorithm (F4.1):** lightweight **Leitner boxes** (simple, transparent) vs
   **SM-2** (Anki's algorithm, more tuned). Recommend starting Leitner, upgrade later.
5. **Daily set composition (F1.2):** confirm the default new-vs-review mix (e.g., ~12 new + ~8 review?).

---

## 10. Success Metrics
- **Habit:** daily-completion streak (target: unbroken through July 8).
- **Coverage:** every FE Environmental section seen + reviewed at least to "Reviewing".
- **Readiness:** ≥ target % sections "green" before exam day.
- **Automation:** % of days the set generates + delivers with zero manual touch.
