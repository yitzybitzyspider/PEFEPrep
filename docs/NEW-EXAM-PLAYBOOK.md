# New-Exam Playbook — turning PEFEPrep into a platform

> **Goal:** stand up a daily-habit prep app for a *different* exam (another FE discipline, the PE, a licensing test, a course final…) by reusing this engine instead of rebuilding. This is the strategic doc behind "I'll want to build more of these as I go through school."

---

## 1. The mental model: **engine + skin + content**

Everything here is one of three things:

| Layer | What it is | Reused across exams? | Lives in |
|---|---|---|---|
| **Engine** | The study loop, spaced repetition, streaks, accounts, plans, sync, PWA, page controllers, design system | **100% reused** | `app/*.js` (except `config.js`), `sw.js`, `style.css` |
| **Skin** | Name, wordmark, colors, icons, social card, domain | Swapped per exam | `app/config.js` (text) · `style.css` tokens (palette) · `icons/` · `CNAME` · HTML `<head>` brand strings |
| **Content** | Questions, schedule, knowledge areas, the reference handbook, PDFs | Swapped per exam | `app/config.js` (KAs) · `data/*` · Supabase `questions`/`knowledge_areas` |

**If a change you're making touches the engine, it should be exam-neutral** (read per-exam values from `config.js`, never hard-code "FE Environmental" or `2026-07-08`). That discipline is what keeps the platform forkable.

---

## 2. The fork surface (everything that changes per exam)

### 2.1 Config — `app/config.js`  ← start here
One file. Set: `examId`, `examName`, `examDate`, `brand{full,a,b,domain}`, `tagline`, `handbook{name,version}`, and the `knowledgeAreas` map (`name`, exam weight `w`, color `family`). The engine reads exam date and plan weights straight from here.

### 2.2 Skin
- **Wordmark + titles in HTML.** Each page's `<title>`, the `.brand` markup (`PEFE`/`Prep` halves), and the OG/Twitter meta carry the brand name. Find-and-replace across the 11 pages. *(See §5 for how to make this one-step later.)*
- **Palette.** Keep the system, change the hue: edit the `--accent` / `--accent2` (+ dark variants) tokens at the top of `style.css`. Everything else recolors automatically.
- **Icons + social card.** Re-run the icon generator (the PIL script that produced `icons/`) with the new letter + accent color → `icon-192/512`, `icon-maskable-512`, `apple-touch-icon`, `favicon-32`, `og-image`. Update the `name`/`short_name` in `manifest.webmanifest`.
- **Domain.** `CNAME` + DNS, and the absolute URLs in the OG meta + manifest.

### 2.3 Content
- **Questions.** Author `data/days/*.json` to the [canonical schema](./ARCHITECTURE.md#6-the-question-schema-canonical) and/or load the `questions` table. Keep the closed-book gates from `CLAUDE.md`.
- **Schedule.** `data/schedule.json` (date→topic) for the daily cadence; `data/manifest.json` lists the day files.
- **Cheat sheet / handbook index.** `data/handbook.json`.
- **Reference handbook + page refs.** Each exam has its own closed-book reference; redo the page-number pass against that document (the method is in this repo's history + `CLAUDE.md`).
- **PDFs.** `materials/` via `scripts/build_day_pdf.py`.

### 2.4 Backend (Supabase) — pick one (see §4)
Either a **new Supabase project** (clean isolation) or the **shared project with an `exam_id` column** (one backend, many exams).

---

## 3. Step-by-step: spin up a new exam

1. **Create the repo** from this one (GitHub → *Use this template*, once it's marked a template repo — see §5).
2. **Edit `app/config.js`** — id, name, date, brand, tagline, handbook, the KA list + weights.
3. **Reskin** — accent tokens in `style.css`; re-run the icon script; set `manifest.webmanifest` name; find-replace the wordmark/titles/OG in the 11 HTML heads; set `CNAME`.
4. **Backend** — new Supabase project (run the schema migrations) *or* add `exam_id` scoping to the shared one; put the project URL + anon key in `app/sb.js`; configure Google OAuth redirect for the new domain.
5. **Seed content** — author day 1, wire `data/schedule.json` + `manifest.json`, load the `questions`/`knowledge_areas` for the exam.
6. **Ship** — set up GitHub Pages + the `deploy.yml`, point DNS, push to `main`.
7. **Verify** — both themes, mobile, a study session offline, sign-in + sync, install to home screen.

**Day-zero scope:** you can launch with the static side only (config + a few day files + branding) and add accounts/plans later — the engine degrades gracefully without Supabase.

---

## 4. Multi-exam backend strategy

| Option | How | Pros | Cons | Use when |
|---|---|---|---|---|
| **A — project per exam** | New Supabase project each time | Total isolation; simplest mental model; no schema changes | N projects to manage; a user's account is per-exam | First 1–3 exams |
| **B — shared project, `exam_id`** | Add `exam_id` to `questions`, `knowledge_areas`, `plans`, etc.; filter by it | One backend; one account spans exams ("I'm prepping for two") | Schema + RLS changes; more careful queries | Once you have several exams / want one login |

**Recommendation:** start with **A** (it's a 10-minute setup and keeps each app dead-simple), and migrate to **B** only when you actually have ≥3 exams or want a single cross-exam account. The per-user tables already key on `user_id`; adding `exam_id` later is additive.

---

## 5. Making forking *turnkey* (config-surface roadmap)

Today the engine is already exam-neutral for **exam date** and **plan weights** (read from `config.js`). To get to "**fork = edit one file + drop in content**," move these remaining per-exam values behind the config seam:

- **Brand strings in HTML → render from `config.js`.** A tiny `app/brand.js` could set `.brand`/`document.title`/OG from `APP_CONFIG` on load. *(Trade-off: a flash on the wordmark; mitigate by keeping the wordmark in markup and only templating titles/OG.)* Cleanest long-term fix: a 5-line build/templating script that stamps the brand into the HTML at deploy.
- **Supabase URL + anon key → `config.js`** (so `sb.js` stays pure engine).
- **Palette tokens → an optional `config.theme` block** that `theme.js` applies, so the accent comes from config too.
- **Schedule / manifest → already data files**, just per-exam content.
- **Mark this repo a GitHub _template repository_** so new exams start with *Use this template* (engine included), and engine fixes propagate by merging template updates (or a small `sync-engine` script that copies `app/` minus `config.js`).

When those are done, a new exam is: **template → `config.js` → content → branding assets → deploy.** Until then, this playbook's find-replace steps cover the gap.

> Keep this file honest: when you move something behind `config.js`, delete it from the §2 fork surface and add it to the §5 "done" list. That's how this stays a real platform and not just a doc.
