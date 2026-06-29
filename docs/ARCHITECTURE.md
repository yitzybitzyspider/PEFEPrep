# PEFEPrep — Architecture

> **What this is.** The single source of truth for *how the system is built*. If you change how a layer works, update this file. For the running list of product features see [`FEATURES.md`](./FEATURES.md); to fork this for a different exam see [`NEW-EXAM-PLAYBOOK.md`](./NEW-EXAM-PLAYBOOK.md).

---

## 1. Design philosophy

Four rules the whole codebase obeys:

1. **Static-first.** The core study experience is plain HTML + vanilla JS + one CSS file, served as static files. **No build step, no framework, no bundler.** You can open any page from disk. This is what makes it cheap, fast, durable, and trivially forkable.
2. **The cloud is additive, never required.** Supabase powers accounts/plans/cross-device sync, but every signed-out user gets a fully working app from `localStorage`. If Supabase is down, the daily study loop still works.
3. **Offline by default.** A service worker makes it an installable PWA that opens and runs a study session with no network.
4. **Engine vs. content.** The code splits cleanly into an **exam-agnostic engine** (study loop, spaced repetition, streaks, accounts, plans, sync, PWA, design system) and **exam-specific content/config** (questions, schedule, knowledge areas, branding, exam date). Everything exam-specific is funnelled through [`app/config.js`](../app/config.js) + the `data/` files so the engine can be reused for other exams.

---

## 2. The big picture

```
                         ┌─────────────────────────────────────────────┐
   Browser (the app)     │  HTML pages  +  app/*.js  +  app/style.css   │
                         │  ── exam-agnostic ENGINE ──                  │
                         │  store.js (localStorage) · plan-engine.js ·  │
                         │  theme.js · sync.js · pwa.js · sw.js         │
                         │  ── exam-specific ──                         │
                         │  config.js  +  data/*.json (questions, etc.) │
                         └───────────┬───────────────────┬─────────────┘
                                     │                   │
                 localStorage (offline cache,        Supabase (optional, signed-in)
                 source of truth offline)            auth · per-user data · question bank
                                     │                   │
                                     └──── sync.js ──────┘  (two-way merge while signed in)

   Hosting: GitHub Pages (custom domain pefeprep.com via CNAME),
            auto-deploys on every push to main (.github/workflows/deploy.yml).
```

---

## 3. Layers

### 3.1 Hosting & deploy
- **GitHub Pages**, custom domain in `CNAME` (`pefeprep.com`).
- **Auto-deploy on push to `main`** via `.github/workflows/deploy.yml`. There is **no manual review gate** — merging to `main` *is* shipping. (See the publish rule in `CLAUDE.md`.)
- Cache-busting: every CSS/JS `<script>`/`<link>` carries `?v=X.Y.Z`. Bump it when that asset changes so browsers refetch. All assets are kept on one version for simplicity.

### 3.2 Static app shell (the pages)
Each page is a thin HTML template (nav + containers) that loads a small set of `app/*.js` controllers. Shared chrome (app bar, nav, cards, chips, buttons) comes from `app/style.css`. KaTeX (CDN) renders math. No router — pages are real files.

### 3.3 Data layer (`data/`)
Plain JSON, fetched at runtime:
- `days/dayNN.json` — the daily question sets (the static "Bank"). **The canonical question schema** (see §6).
- `manifest.json` — the list of day files to load + an `updated` stamp; `app/data.js` reads this to assemble the full static bank.
- `handbook.json` — the on-site equation/cheat-sheet index.
- `schedule.json` — date → topic map driving "today's set".
- `resources.json` — the PDFs list.
- `changelog.json` — `version` + history; drives the floating version badge and the *What's new* page.

### 3.4 Client engine — `app/store.js` (`window.PFP`)
The offline brain. Owns everything in `localStorage` under key `pefeprep_v1`:
- `settings` (daily size, goal, SRS on/off, reveal mode, **examDate** — from config),
- `cards{ id: {box,due,seen,right,wrong,topic,lastCorrect,last} }` — the **Leitner spaced-repetition** state,
- `attempts[]` (+ `attemptsTotal` / `attemptsSyncedTotal` high-water marks for sync),
- `daily{}` (per-day answered + goal), `streak`/`streakDay`/`bestStreak`/`lastGrace` (streak with weekly grace),
- `starred{}` ("My List"), `engagement{}` (focus/leaves), `achievements{}`, `perfectSets`, `practiceBeat`.

Key API: `recordResult`, `buildDailySet`, `sectionMastery`, `lastOutcome`, streak/goal getters, `getStarred/toggleStar`, `checkAchievements`, and the sync hooks `getState`/`replaceState`/`onChange`.

### 3.5 Accounts & platform — Supabase
Project `aymngvobpehrnffnifls` (`https://aymngvobpehrnffnifls.supabase.co`), publishable/anon key shipped in the client. Auth = **Google OAuth**. Access via the supabase-js CDN client created in `app/sb.js` (`window.PFP_SB`, `PFPAuth`, `PFPUser`, `PFPDates`). Tables in §5.

### 3.6 Sync — `app/sync.js` (`window.PFPSync`)
Bridges `localStorage` ↔ Supabase while signed in. `localStorage` stays the synchronous working store; sync **hydrates** from the account on load (cloud→local, smart-merged) and **pushes** on change (debounced + on page hide). Mapping:
- `cards` ↔ `review_state` (push only diffs),
- `attempts[]` → `attempts` (slice-safe high-water mark, never double-counts),
- everything else (streak, stars, achievements, daily, engagement, settings) ↔ `user_state.state` (one jsonb blob).
Merge favors the better of each device: higher streak, union of stars/achievements (earliest unlock date), most-advanced review box per question.

### 3.7 PWA — `manifest.webmanifest` + `sw.js` + `app/pwa.js`
- **Manifest**: name/icons/theme, `display:standalone`, `start_url:/today.html`, app shortcuts.
- **Service worker** (`/sw.js`, scope `/`): navigations & JSON = **network-first → cache → offline shell**; versioned assets & fonts = **stale-while-revalidate**; Supabase = **network-only** (never cached). Cache name is versioned (`pefeprep-<VERSION>`); old caches purged on activate.
- **`pwa.js`**: registers the SW, shows an *update available → Refresh* toast on new deploys, and an *Install app* chip when the browser allows it.

### 3.8 Design system — `app/style.css` + `app/theme.js`
CSS custom properties drive everything. `:root` = light theme (default); `[data-theme="dark"]` = navy dark. `theme.js` sets the theme pre-paint (no flash), injects the toggle, persists the choice, and supports `?theme=light|dark`. Type: Bricolage Grotesque (display) / Plus Jakarta Sans (body) / JetBrains Mono (data), via Google Fonts. All color pairs are WCAG-AA verified. Full spec + component recipes: [`rebrand-research.md`](./rebrand-research.md).

### 3.9 Config seam — `app/config.js` (`window.APP_CONFIG`)
The one file that holds everything specific to **this exam**: `examId`, `examName`, `examDate`, `brand`, `tagline`, `handbook`, and the 15 `knowledgeAreas` (name + exam weight + color family). Loaded in `<head>` before `store.js`/`plan-engine.js`, which read it (with hard-coded fallbacks so the engine still runs if it's missing). This is the primary lever for [forking to a new exam](./NEW-EXAM-PLAYBOOK.md).

---

## 4. File map

| File | Role | Layer | Exam-agnostic? |
|---|---|---|---|
| `*.html` (11 pages) | Page templates / chrome | Shell | Engine (branding strings are per-exam) |
| `app/style.css` | Design system / all styling | Design | ✅ Engine (palette tokens are themeable per-exam) |
| `app/theme.js` | Light/dark toggle, pre-paint | Design | ✅ Engine |
| `app/config.js` | **Per-exam config** | Config | ❌ **Content** |
| `app/store.js` | localStorage engine (SRS/streak/etc.) | Engine | ✅ Engine |
| `app/sync.js` | Cross-device sync | Engine | ✅ Engine |
| `app/sb.js` | Supabase client/auth/per-user store | Engine | ✅ Engine (project URL/key are deploy config) |
| `app/plan-engine.js` | Training-plan generator | Engine | ✅ Engine (reads weights from config) |
| `app/data.js` | Loads static bank from `data/` | Engine | ✅ Engine |
| `app/math.js` | KaTeX render helper + Markdown renderer (`renderMarkdown`/`renderInline`/`renderRich`): GFM tables, bold/italic, lists, paragraphs — math spans protected so KaTeX still typesets them. Page controllers run stems/options/solutions through it. | Engine | ✅ Engine |
| `app/today.js` `browse.js` `bank-live.js` `dashboard.js` `plan.js` `progress.js` `settings.js` `resources.js` `account.js` | Page controllers | Engine | ✅ Engine |
| `app/report.js` | Report-a-question modal | Engine | ✅ Engine |
| `app/celebrate.js` `engage.js` | Confetti/toasts, focus tracking | Engine | ✅ Engine |
| `app/version.js` | Version badge from changelog | Engine | ✅ Engine |
| `app/pwa.js` | SW registration / update / install | PWA | ✅ Engine |
| `sw.js` | Service worker | PWA | ✅ Engine |
| `manifest.webmanifest` | PWA manifest | PWA | ❌ Content (name/icons per-exam) |
| `icons/*` | App icons + social card | Brand | ❌ Content |
| `data/days/*.json` | Question bank (static) | Data | ❌ **Content** |
| `data/schedule.json` `manifest.json` `handbook.json` `resources.json` | Daily schedule / indexes | Data | ❌ Content |
| `data/changelog.json` | Version + what's new | Data | Mixed |
| `.github/workflows/deploy.yml` | Auto-deploy | Deploy | ✅ Engine |
| `CNAME` | Custom domain | Deploy | ❌ Content |

---

## 5. Data model (Supabase, schema `public`)

**Content (public read):**
- `knowledge_areas(id int, title text)` — the 15 KAs.
- `questions(id text PK, ka_id, day, set_label, type, concept, stem, equations jsonb, options jsonb, answer jsonb, steps jsonb, solution, handbook, source, origin, topic, verified bool, "references" text)` — ~760 Q across all KAs. (`references` is a reserved word — always quote it in SQL.)

**Per-user (RLS: `auth.uid() = user_id`):**
- `profiles(id uuid PK = auth user, email, display_name, exam_date, created_at, updated_at)`
- `plans(id, user_id, status, exam_date, length_key, config jsonb, created_at)` + `plan_days(id, plan_id, user_id, day_index, date, kind, label, question_ids jsonb, meta jsonb)`
- `attempts(id uuid, user_id, question_id, correct, chosen, plan_day_id, source, created_at)`
- `review_state(user_id, question_id, box, due_date, attempts, wrong, last_seen)` — **PK `(user_id, question_id)`**; the cloud mirror of `cards`.
- `user_state(user_id PK, state jsonb, updated_at)` — the sync blob for streak/stars/achievements/daily/settings.

**Reports:** `question_reports(question_id, user_id nullable, reason, detail, …)` — RLS allows **anonymous** insert when `user_id IS NULL`, else `auth.uid() = user_id`.

`handle_new_user()` trigger seeds a `profiles` row on signup (SECURITY DEFINER; execute revoked from public/anon/authenticated).

---

## 6. The question schema (canonical)

A question object (in `data/days/*.json` and the `questions` table):

```jsonc
{
  "id": "D1-Q01",            // stable unique id (Day-Question, or KA-scoped for the bank)
  "set": "A",                // sub-set label
  "type": "MCQ",             // "MCQ" | "Numeric"
  "concept": "Quadratic equation",
  "stem": "Solve 2x² − 5x − 3 = 0.",
  "equations": ["$x = \\dfrac{-b\\pm\\sqrt{...}}{2a}$"],   // KaTeX; shown on demand
  "options": ["x = 3, −1/2", "..."],                       // MCQ only
  "answer": 0,               // MCQ: option index · Numeric: value/string
  "solution": "…",           // worked solution (KaTeX ok)
  "handbook": "Mathematics — Quadratic Equation (p. 37)",  // NCEES Handbook locator + page
  "references": "Ctrl-F: Quadratic",                       // exam-day search hint
  "source": "handbook"       // "handbook" | "fundamental" | "in-stem" (closed-book solvability tag)
}
```

The verification gates for authoring (exam-relevance, recompute-in-Python, Handbook fidelity, closed-book solvability) are owned by `CLAUDE.md` and `docs/engine-integration.md`.

---

## 7. Key runtime flows

1. **Signed-out daily study.** `today.html` → `data.js` loads the bank → `store.buildDailySet()` interleaves due reviews + new → user answers → `store.recordResult()` reschedules the Leitner card, logs the attempt, advances streak/goal → `celebrate.js` fires milestones. All in `localStorage`.
2. **Sign in.** `account.html` → `PFPAuth.signInGoogle()` → Google OAuth → back to `dashboard.html`. `handle_new_user()` makes a profile.
3. **First sync.** Any page: `sync.js` `start()` → pull `user_state` + `review_state`, merge into `localStorage`, push the merged result up; seed history once. Thereafter every local change debounce-pushes.
4. **Signed-in plan day.** `dashboard.js` → `await PFPSync.start()` (so review state is current) → `PFPUser.activePlan()` + `planDays()` → renders today's planned set + due reviews → answers go to `attempts` + `review_state` via `PFPUser.recordAttempt()`.
5. **Build a plan.** `plan.html` → `plan-engine.generate()` (KA-weighted, weekly mini-exams, final mock, counts down to `examDate`) → `PFPUser.createPlan()`.
6. **New daily set published.** Author `dayNN.json` → add to `manifest.json` → append cheat sheet → build PDF → changelog bump → push to `main` → auto-deploy. (The daily-run contract lives in `CLAUDE.md`.)
7. **Offline.** SW serves the cached shell + last-seen data; study runs from `localStorage`; sync resumes when back online.

---

## 8. Security model
- The Supabase **anon/publishable key is meant to be public**; all protection is **RLS**. Per-user tables are locked to `auth.uid() = user_id`; content tables are read-only to everyone; reports allow anonymous insert only with a null user.
- No secrets in the repo. OAuth is configured in the Supabase dashboard.
- Run `get_advisors` after any schema change.

---

## 9. Versioning & cache-busting
- One product version lives in `data/changelog.json` (`version`) and is mirrored to every asset `?v=` token and the service-worker `VERSION`. Bump all three together on a release.
- The SW `VERSION` change is what makes browsers adopt a new service worker and purge the old cache.

---

## 10. Extension points (where to plug in)
- **New exam** → `app/config.js` + content + branding ([playbook](./NEW-EXAM-PLAYBOOK.md)).
- **New question source** → conform to the §6 schema; add to `data/days/` (static) and/or the `questions` table (bank).
- **New page** → copy a page template's `<head>` (fonts, theme, config, manifest, meta) + `<body>` scripts; reuse `style.css` components.
- **New synced field** → add to `BLOB_KEYS` in `sync.js` (rides the `user_state` blob) — no schema change.
- **New gamification** → add an achievement to `ACHIEVEMENTS` in `store.js`.
