# Haas Waiver Prep — build plan (v0)

> First application of `NEW-EXAM-PLAYBOOK.md`: reuse the PEFEPrep engine for a **closed-book, multi-course** exam. One app, seven course-tracks, counts down to the Haas waiver window.
>
> **Status:** plan / spec. Not built. Calibrate the content against the real Haas study guides + bCourses sample exams before finalizing counts.

---

## 1. The product
**Haas Waiver Prep** — one installable app that helps an incoming Haas full-time MBA waive as many core courses as possible. Seven course-tracks, each a closed-book "course-final" drill engine with spaced repetition, a per-course plan, and a countdown to the **waiver window (≈ the week before Fall classes start — confirm exact date in bCourses; for the Class of 2028 that's ~mid/late August 2026, so this is a near-term, ~8-week build)**.

One account spans all seven; you pick which you're attacking; progress/streak/mastery are per-course. Working name options: **Haas Waiver Prep** · WaivePrep · CoreWaive · Oski Prep.

The seven tracks (from the newadmits *Waiver Exam Preparation Materials* page):
| Course | Code | Profile |
|---|---|---|
| Data & Decisions | 200S | quant (stats) |
| Microeconomics | 201A | quant + concept |
| Macroeconomics in the Global Economy | 201B | concept + quant |
| Financial Accounting | 202 | quant + recall |
| Introduction to Finance | 203 | quant |
| Operations | 204 | quant |
| Marketing | 206 | concept + recall |

---

## 2. Engine changes — the reusable "closed-book capability layer"
Built **once** into the engine, reused for any future closed-book exam (PE, course finals, etc.).

**2.1 Config becomes an "exam profile."** `app/config.js` gains:
```js
openReference: false,                 // no Handbook → hide the reference panel, drop page refs
questionTypes: ["MCQ","Numeric","Flashcard"],
studyPanel: "notes",                  // "handbook" | "notes" | "none"
hierarchy: "course-topic"             // 2-level content model (vs FE's flat KA)
courses: [ { id:"acct202", name:"Financial Accounting", code:"MBA 202",
             topics:[ {id, name, w} … ] }, … ]   // course → topic → question
```
The engine reads these and adapts: which question types render, what the "source" line means, what the study panel shows, and the **course → topic → question** hierarchy (today's engine is flat KA → question; here each *course* is the top dimension like an `exam_id`, *topics* are the KAs within it).

**2.2 New question type — Flashcard / cloze.** Front/back and "the ___ is the powerhouse" cloze, with a flip + self-grade ("Got it / Missed"), wired into the **existing Leitner SRS** (this is the whole point — closed-book = memorization = SRS). Adds to MCQ/Numeric; schema gains `type:"Flashcard"`, `front`, `back`, optional `cloze`.

**2.3 Study UI shifts** (closed-book): the FE Handbook side-panel → a **notes / worked-explanation panel**; quant courses get a **"formula sheet" review deck**; the "source" field reads "study source" (textbook ch.) not an exam-day locator.

**2.4 Unchanged (the reused 80%):** Leitner SRS, streaks/goals/achievements, per-course training plans + countdown, cross-device sync, PWA/offline, the whole design system, progress/mastery, report-a-question, accounts/auth.

**2.5 Backend.** New Supabase project (cleanest) **or** the shared one with a `course_id`/`exam_id` column. Recommend a **new project** for isolation; the schema is the same migrations + a `courses` table and `course_id` on `questions`.

---

## 3. Content blueprint (v1 targets — calibrate to Haas)
~360 questions for a strong v1; each course is course → topics → questions with a type mix tuned to how that exam tests.

| Course | Core topics | v1 Q | Mix (Num / MCQ / Flash) |
|---|---|---|---|
| **Financial Accounting (202)** ⭐pilot | accounting equation & debits/credits · journal entries/T-accounts · income statement & accrual/revenue recognition · balance sheet · cash-flow statement · inventory (FIFO/LIFO/avg) · depreciation · receivables/bad debt · liabilities & equity · ratio analysis | 60 | 45 / 25 / 30 |
| **Intro to Finance (203)** | TVM (PV/FV/annuity/perpetuity) · NPV/IRR/payback · bond valuation & yields · stock valuation (DDM/multiples) · risk & return · CAPM & beta · WACC · capital structure basics | 60 | 65 / 25 / 10 |
| **Data & Decisions (200S)** | descriptive stats · probability & Bayes · distributions (binomial/normal) · sampling & CLT · confidence intervals · hypothesis tests · regression (simple/multiple) · decision analysis/trees | 55 | 60 / 30 / 10 |
| **Microeconomics (201A)** | supply/demand & equilibrium · elasticity · consumer theory/utility · production & costs · perfect competition · monopoly · oligopoly & game theory · externalities | 50 | 45 / 35 / 20 |
| **Operations (204)** | process analysis (flow/capacity/bottleneck/utilization) · Little's Law · EOQ · newsvendor (critical fractile) · queuing basics · variability/process improvement | 45 | 65 / 25 / 10 |
| **Macroeconomics (201B)** | national accounts/GDP · inflation & unemployment · money & banking/the Fed · monetary policy · fiscal policy & multipliers · AD-AS/IS-LM · exchange rates · growth | 45 | 30 / 40 / 30 |
| **Marketing (206)** | strategy & STP (segment/target/position) · 4Ps · customer lifetime value (CLV) · pricing · product & brand · promotion & channels · market research | 45 | 25 / 35 / 40 |

**Authoring discipline (the closed-book version of the FE gates):** every numeric answer recomputed in Python; every question tagged to a course→topic; concept questions written for *recall under time pressure*; a "study source" citation (textbook chapter) per question; SI/units sanity. Calibrate emphasis + difficulty to the **Haas study guides + bCourses sample exams** once available.

---

## 4. Content sources (canonical per course)
- **Financial Accounting** → *Libby, Libby & Hodge, Financial Accounting* (McGraw-Hill) — **already in your Google Drive** ✅ → this is the natural **pilot course**.
- **Finance** → Berk & DeMarzo, *Corporate Finance* (or Ross/Westerfield).
- **Data & Decisions** → Albright/Winston, *Data Analysis & Decision Making* (or Anderson, *Statistics for Business & Economics*).
- **Microeconomics** → Pindyck & Rubinfeld, *Microeconomics*.
- **Macroeconomics** → Mankiw, *Macroeconomics*.
- **Operations** → Cachon & Terwiesch, *Matching Supply with Demand*.
- **Marketing** → Kotler & Keller, *Marketing Management*.
- **Calibration (Haas-specific):** the per-course study guides behind each `+` on the waiver-prep page + the bCourses exam instructions/sample exams (provided 1 week before the window).

---

## 5. Build sequencing
- **Phase 0 — engine layer (reusable):** config exam-profile flags + course→topic hierarchy + Flashcard/cloze type into the Leitner SRS + the notes/formula-sheet study panel. *(This is the only real new engine code; everything else is content + reskin.)*
- **Phase 1 — fork the app + pilot one course end-to-end:** stand up "Haas Waiver Prep" (branding, Supabase, closed-book mode), author **Financial Accounting (202)** fully (we have the textbook), ship it, use it. Proves the whole pipeline.
- **Phase 2 — the quant courses:** Finance (203), Data & Decisions (200S), Operations (204).
- **Phase 3 — the concept-heavy courses + flashcard depth:** Micro (201A), Macro (201B), Marketing (206).
- **Phase 4 — calibrate** every bank against the Haas study guides / sample exams; tune difficulty and topic weights.

Given the ~August 2026 window, a realistic path is: **Phase 0 + Phase 1 now** (a working app + your highest-value waiver), then fan out the rest course-by-course.

---

## 6. Open inputs (to finalize this plan)
1. **The Haas study guides / sample exams** (behind the accordions + bCourses) — to calibrate format, emphasis, difficulty. Upload to Drive or attach.
2. **Confirm the exact waiver-exam window date** (the countdown target).
3. **Which course(s) you most want to waive** (pilot priority — default: Financial Accounting, since we have the textbook).
4. **App name + whether to reuse the PEFEPrep Supabase or a new project.**
