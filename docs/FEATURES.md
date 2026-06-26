# PEFEPrep — Feature Registry

> **The running list of everything the product does.** This is the "what," `ARCHITECTURE.md` is the "how."
>
> **Keep this current.** When you ship, change, or remove a feature, edit the matching row in the same PR. Status legend: ✅ live · 🟡 partial · 🛠️ planned · ⛔ removed. **Tier**: `Engine` = reusable across exams · `Content` = per-exam · `Mixed`.

---

## Study engine
| Feature | Status | Where (page) | Files | Tier | Notes |
|---|---|---|---|---|---|
| Daily question set | ✅ | Today | `today.js`, `data.js`, `store.js` | Engine | Interleaves due reviews + new, capped at daily size |
| MCQ + Numeric questions | ✅ | Today, Bank, Live, Plan | controllers, `math.js` | Engine | KaTeX-rendered math; numeric tolerance grading |
| Equations-first, solution-on-demand | ✅ | Today | `today.js` | Engine | Show formulas before revealing the worked solution |
| Step-by-step solution reveal | ✅ | Today | `today.js` | Engine | Unlock steps one at a time |
| Reveal-on-demand in Bank | ✅ | Bank, Live | `browse.js`, `bank-live.js` | Engine | Attempt first; "Show answer" reveals answer + formula |
| Handbook page references | ✅ | all question surfaces | content + `*.js` | Mixed | Every Q cites the NCEES Handbook section + page |
| Question navigator + Handbook side panel | ✅ | Today | `today.js` | Engine | Toggleable study columns |

## Spaced repetition & progress
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Leitner spaced repetition | ✅ | Today, Plan | `store.js`, `sb.js` | Engine | Boxes 1–5; due-date scheduling; resurfaces misses |
| Section mastery | ✅ | Progress | `store.js`, `progress.js` | Engine | Coverage × depth per KA → green/amber/red |
| Due-review resurfacing (signed-in) | ✅ | My Plan | `sb.js`, `dashboard.js` | Engine | `review_state` drives the dashboard's due set |
| Per-question history (got/missed dots) | ✅ | Bank, Live, Progress | `store.js`, `sb.js` | Engine | "blue-dot"-style status |

## Gamification & habit
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Daily streak (+ weekly grace) | ✅ | all | `store.js` | Engine | One missed day/week forgiven |
| Daily goal + ring | ✅ | Today, Progress | `store.js`, CSS | Engine | Goal progress ring |
| Achievements | ✅ | Progress | `store.js` | Engine | 12 unlockable badges |
| Celebrations (confetti/toasts) | ✅ | Today | `celebrate.js` | Engine | Milestone + goal-met moments |
| Focus / engagement tracking | ✅ | (background) | `engage.js`, `store.js` | Engine | Focus minutes, leave count |
| Streak freeze | 🛠️ | — | — | Engine | Planned (see rebrand-research roadmap) |
| Daily reminder (email/push) | 🛠️ | — | — | Engine | Planned; needs Supabase cron/edge fn |

## Accounts & plans (Supabase)
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Google sign-in | ✅ | Account | `sb.js`, `account.js` | Engine | OAuth; profile auto-created |
| Exam-date profile | ✅ | Account | `account.js`, `sb.js` | Mixed | Per-user exam date |
| Training plans (2wk–3mo) | ✅ | Build plan | `plan-engine.js`, `plan.js`, `sb.js` | Engine | KA-weighted, counts down to exam |
| Weekly mini-exams + final mock | ✅ | Plan/Dashboard | `plan-engine.js` | Engine | Scheduled checkpoints |
| Dashboard (today's plan day) | ✅ | My Plan | `dashboard.js` | Engine | Planned set + due reviews + stats |
| Auto-rescheduling plan | 🛠️ | — | — | Engine | Planned: catch up when behind |
| Readiness score | 🛠️ | — | — | Engine | Planned ("practice strength," not pass-prob) |

## Question bank
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Static Bank (offline) | ✅ | Bank | `browse.js`, `data/days/*` | Mixed | Day-file sets; works offline |
| Live Bank (Supabase, all 15 KAs) | ✅ | Live | `bank-live.js`, `sb.js` | Engine | ~760 Q; filter by KA/type/source/status |
| My List (star) / Missed / mastery filters | ✅ | Bank, Live | `store.js` | Engine | Shared across the site |
| Custom test builder | 🛠️ | — | — | Engine | Planned (UWorld-style) |
| Per-distractor rationales | 🛠️ | — | — | Mixed | Planned content upgrade |

## Sync, PWA, platform
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Cross-device sync (everything) | ✅ | all (signed-in) | `sync.js`, `store.js`, `sb.js` | Engine | cards↔review_state, attempts, blob (streak/stars/etc.) |
| Installable PWA | ✅ | all | `manifest.webmanifest`, `pwa.js` | Mixed | Add-to-home-screen; app shortcuts |
| Offline support | ✅ | all | `sw.js`, `pwa.js` | Engine | Network-first pages, SWR assets, offline shell |
| Update-available toast | ✅ | all | `pwa.js`, `sw.js` | Engine | Surfaces new deploys |
| Report a question | ✅ | all question cards | `report.js` | Engine | Reasons + free text; anon or attributed |

## Design & content pipeline
| Feature | Status | Where | Files | Tier | Notes |
|---|---|---|---|---|---|
| Light/dark themes + toggle | ✅ | all | `style.css`, `theme.js` | Engine | Light default, navy dark; `?theme=` deep-link |
| Design system (tokens/fonts/components) | ✅ | all | `style.css` | Engine | WCAG-AA; see `rebrand-research.md` |
| SEO / social cards | ✅ | all | `*.html`, `icons/og-image.png` | Mixed | OG/Twitter meta per page |
| Version badge + changelog | ✅ | all | `version.js`, `changelog.json` | Engine | Floating badge + What's-new page |
| Printable day PDFs | ✅ | PDFs | `scripts/build_day_pdf.py`, `materials/` | Content | LaTeX day sheets |
| Daily authoring contract | ✅ | (process) | `CLAUDE.md`, `engine-integration.md` | Mixed | Relevance/Handbook/solvability gates |

---

### Backlog (prioritized — from `rebrand-research.md`)
**P0 (static, high-impact):** Today "where you stand" dashboard · daily-completion screen · per-distractor rationales · Handbook badge/pane.
**P1 (needs Supabase):** custom test builder · readiness score · auto-rescheduling plan · streak freeze · daily reminders.
**P2 (gated on ≥100 users):** peer answer %, leagues/social, cohort benchmarks.
