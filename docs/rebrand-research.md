# PEFEPrep — Definitive Rebrand Brief

*One source of truth for the redesign. Built for a static site (GitHub Pages) + Supabase. Every recommendation here is shippable without a heavy backend, and every committed spec has been checked against the live `app/style.css`.*

---

## 1. Executive Summary & Competitive Landscape

### The strategy in one paragraph
PEFEPrep sits in an **empty center** that no competitor occupies. The four-figure FE/PE courses (PPI, School of PE, EET, Testmasters, Prepineer, CEA) own *authority* but have **no daily-habit loop, no spaced repetition, no streaks**, and cost $1,000–$2,600. The practice banks (PrepFE, UWorld) own *questions* but have **no habit, no plan, no countdown**. The habit/mastery apps (Duolingo, Brilliant, Khan, Anki, Quizlet) own the *behavioral engine* we're built on but **none of them touch the FE**. PEFEPrep is the only product combining all three: **FE-specific, Handbook-grounded rigor + a daily-habit/SRS engine + a free, modern app feel.** The rebrand exists to make that position unmistakable.

### What we already own (defend it)
- A **real daily-habit loop** — streaks + Leitner SRS — that *every* FE/PE incumbent lacks.
- **NCEES Handbook page references on every question** — a visible trust marker no competitor surfaces as UI.
- A **modern dark aesthetic** in an all-light, dated, template-driven category.
- **Free to start** against $1,000–$2,600 courses.

### Where we're behind (close it)
- **Question-experience polish** UWorld has normalized: per-distractor rationales, exam-replica runner, custom quiz builder, peer answer %.
- **Analytics depth**: readiness score, trend graphs, review heatmap.
- **Habit mechanics that compound retention**: daily reminder, streak freeze, daily-goal ring, leagues.

### Competitive landscape

| Product | Category | Best at | What to steal |
|---|---|---|---|
| **PPI2Pass** (Kaplan) | FE/PE course | Date-anchored Study Plan auto-sequencing tasks to exam day; Pearson-VUE split-screen mocks | Make **My Plan the home dashboard** ("Today: 18 Q on 10.A Frequency"); diagnostic onboarding; custom quiz generator |
| **School of PE** | FE/PE course | Trust signaling ("94% pass rate"); milestone reviews at 25/50/75/100%; class-comparison benchmark | **Readiness/pass-likelihood score**; cohort benchmark; milestone review checkpoints; honest 4-up trust row |
| **CEA** | FE/PE course | "Find the formula in the Handbook *first*"; CBT exam simulator; founder brand + podcast | **Handbook-lookup as the lead line** of every solution; CBT chrome on the mock; NCEES-spec coverage map |
| **PrepFE** | FE/PE bank | Exam-realistic Q's; Handbook-cited solutions; "blue-dot" answer history; cross-device sync; best value | **Focus-exam builder**; **review-past-attempts ("blue dot")**; per-question timer + sortable scores |
| **EET** | FE/PE course | Practice-heavy; full timed sim exam; explicit Handbook alignment; FE Environmental track | Wrap the **110-Q mock in exam-day chrome**; digital free "cheat-sheet" replacing the $1,000 binder; freemium funnel |
| **Prepineer** | FE/PE coaching | Single "Learning Dashboard home base"; algorithmic Track of Study in finishable steps; SmartCards SRS | **Today as a "where you stand / what's next" dashboard**; rename plan to a finishable **Track of Study**; momentum strip |
| **Testmasters** | FE/PE course | 30-yr authority; exam-date diagnostic → auto study plan | **Exam-date diagnostic onboarding** seeding Leitner boxes; per-discipline IA for future PE expansion |
| **UWorld** | General QBank | **Illustrated mini-lecture rationales** explaining *why each distractor is wrong*; **Create Test** builder; peer answer %; 3-tab Performance; split-screen reference pane | Per-distractor rationale (our #1 content upgrade); **status-filtered custom builder**; **peer % distribution**; strikeout/highlight; 3-tab Performance; **inline Handbook pane** |
| **Magoosh** | General prep | Video explanation on *every* question; test-date day-by-day plan with **rest days** + minute estimates; friendly low-stress UI | Per-task **minute estimates** + built-in rest days; session builder; pace-vs-peers; warm low-anxiety voice |
| **Khan Academy** | General prep | **Named mastery ladder** (Familiar→Mastered); single **Course Mastery %** north star; square-tile progress; semantic color tokens | Named mastery ladder; **Course Mastery %**; **square-tile progress grids**; semantic color tokens (action/success/warn/critical) |
| **Duolingo** | Habit app | Best-in-class retention: **streak + freeze + leagues + daily goal**; one daily behavior; 3D "push" button; slide-up feedback footer; **"you're done for today" completion screen** | **Streak freeze** (−20% churn); **daily-goal ring**; weekly XP league; milestone confetti; 3D push button; play-first onboarding; **terminal done-state** |
| **Brilliant** | Habit app | "Learn by doing"; adaptive placement; **progressive/exploratory reveal on wrong answers**; node-path progress; **quiet reading surface** | **Progressive solution reveal** ("show next step"); diagnostic placement; per-KA color-coded node path; **calm low-chrome solution/reading mode** |
| **Quizlet** | Habit app | One set → many **study modes** via oversized launcher tiles; per-set **mastery %**; smart (tolerance) grading; ships light+dark | **Mode launcher tiles** (Flashcards/Learn/Test); per-section mastery %; **numeric tolerance grading**; flashcard mode over equations |
| **Anki** | SRS gold standard | FSRS scheduling; **next-interval shown on the answer button**; **review heatmap**; future-due forecast | Show **next-review interval** on feedback; **GitHub-style review heatmap**; future-due forecast; deck-overview pre-study screen |
| **Wiley/UWorld** (CFA/CPA) | General prep | Exam planner that **auto-reschedules when you fall behind**; full explanation on every answer; "9 of 10 pass" framing | **Auto-reschedule My Plan**; distractor rationale; "practice my 3 weakest KAs"; Readiness Score gauge; Handbook coverage map |

**One-line strategy:** *Defend the habit + Handbook + SRS moat the $2k courses can't touch; close the question-experience gap UWorld trained every test-taker to expect — almost all of it shippable on static + Supabase, quick wins first.*

---

## 2. Positioning & Brand

### Positioning statement (internal north star)
> For the anxious working engineer studying for the FE Environmental exam, **PEFEPrep is the daily-habit study app** that turns a terrifying 6-month grind into one focused **20-minute rep a day** — every question grounded in the **NCEES Handbook**, every answer scheduled by **spaced repetition** so you actually remember it on exam day. Unlike the $1,500 instructor courses and the cram-the-bank quiz sites, PEFEPrep is built to **open every morning**, **counts down to your exam date**, and is **free to start**.

### Three brand pillars (every piece of copy ladders back to one)
- **DAILY** — habit, streak, SRS, plan that counts down. *The moat.*
- **HANDBOOK-GROUNDED** — page ref on every question; the closed-book skill. *The trust.*
- **FREE / MODERN** — open it daily, costs nothing to start. *The wedge.*

### Tagline
**Lead:** **"Pass the FE — 20 minutes a day."** (concrete behavior + concrete outcome; defuses the #1 fear that the grind is unsurvivable).

**Supporting lines (by surface):**
- Brand lockup line: **"The daily FE habit."**
- Anxious-hero copy: **"A little every day, all the way to exam day."**
- Comparison contexts: **"Not a $1,800 course. Not a cram bank. A 20-minute habit."**

**Avoid:** "#1," "94%," "guaranteed pass," "ultimate," "crush." Unprovable, commoditized, legally fraught, or off-tone for engineers.

### Name decision — **keep PEFEPrep; fix the legibility typographically**
The name owns the domain (pefeprep.com), is the live site, and literally encodes **PE + FE + Prep** — which future-proofs the planned PE expansion. Throwing it away costs more than it's worth. The problem is that flat "PEFEPrep" reads as acronym soup. The fix is **color, not a rename**:

- **Wordmark:** render **`PEFE`** in the amber accent + **`Prep`** in off-white ink. The color break does the parsing — readers instantly see "PEFE / Prep." *(Implementation note: the live file at `app/style.css:22` currently does `.brand span{color:var(--accent)}`, which colors the **second** half. The markup must become `PEFE<span>Prep</span>` with the rule flipped so the base `.brand` is amber and `.brand span` is `var(--ink)`. This is a one-line CSS change plus the span placement.)*
- **Spoken/short name:** say **"PEFE"** (pee-eff-ee), the way people say "Quizlet" or "Magoosh." Reserve "PEFEPrep" for the formal/legal wordmark.
- **Rejected:** coined habit words (lose FE/PE searchability + domain), "PassFE/DailyFE" (narrows to FE right as we expand to PE), founder brand (no licensed-PE face — our authority is the Handbook, not a person).

### Logo / mark direction
**Recommended — "the streak rule":** a short measuring-rule / tick-mark motif — a baseline with rising ticks, the rightmost lit amber. Reads simultaneously as an **engineer's scale**, a **progress bar**, and a **streak climbing toward exam day**. Distinctive, not a blue gear (the entire category's cliché), not the Duolingo flame. App icon: rounded-square deep-navy ground + the amber tick-rule (or one bold lit "rep" tick).

### Voice & tone
**Persona:** a calm, competent study partner who's already passed — *not* a hype coach (Prepineer), *not* a corporate institution (PPI/Wiley), *not* a cartoon owl (Duolingo). The friend who's a PE texting *"did your 20 today? Hydraulics is your weakest — let's knock out 5."*

**Principles:** calm the anxiety (lead with "just today's set," never the enormity); concrete over hype (quantify everything — we already have the data); honest, not boastful (our proof is visible substance, not invented pass rates); plain-language engineer (skip exclamation-point gamification); **encouraging on streaks, forgiving on misses** ("Missed yesterday? Your freeze caught it. Pick up today." — never shame).

| Do | Don't |
|---|---|
| "20 minutes today. 12 days to exam." | "CRUSH the FE with our ULTIMATE prep!" |
| "Your weakest area is Water Resources — here's a focused set." | "You're failing Water Resources." |
| "Every answer shows the exact Handbook page." | "The #1 most trusted FE course." |
| "Nice — 7-day streak. Your freeze is ready if you need it." | "Don't lose your streak!! 🔥🔥" |

**Words we own:** *daily, habit, today, streak, Handbook page, 20 minutes, on track, exam day.*
**Words we avoid:** *#1, guaranteed, ultimate, crush, course, lecture, cohort.*

---

## 3. Visual Identity

Three directions were explored: **A — "Slate & Pine" (Calm Academic)**, **B — "Daily Streak" (Energetic Habit-App)**, **C — "Graphite & Signal" (Premium Pro-Tool)**.

### ✅ COMMITTED: Direction B — "Daily Streak," light-default with a navy dark toggle

This is the single committed direction. A and C are not implemented; we borrow exactly two things from them (named below) and nothing else.

**Why B:** Our *only* structural moat against PPI/SoPE/PrepFE/EET — none of whom have streaks, SRS, or daily-habit mechanics — is the habit loop. The brand should scream it. B is also a **natural evolution of our existing amber**, so it's the least jarring migration while still reading as a confident rebrand.

**Light-default, dark-toggle is the right call.** Every habit/learning app that won daily retention defaults to light or ships both (Duolingo, Brilliant, Khan, Quizlet, Anki, Magoosh, UWorld); the pure-dark products are the *engineer tools* (Anki's dated console), not the habit apps. For *us* specifically: most reps happen on a bright phone at lunch or a desk monitor, where light wins for dense KaTeX math and Handbook tables; the friendly light-card aesthetic is repeatedly tied to lower test-anxiety and higher return. But **dark is our current equity and a genuine differentiator vs. the all-light incumbents** — so we demote it to a first-class toggle, not abandon it.

**Two borrows, scoped:**
- From **C (Graphite & Signal):** the dark theme's graphite/navy flavor (already encoded in the `[data-theme="dark"]` tokens below). Nothing else from C ships.
- From **A / Brilliant — the "two-surface" rule (committed, not just asserted):** the app has **two visual registers, and they are styled differently.** The **habit surface is loud** (Today dashboard, streak, ring, completion screen, primary CTAs: full amber, 3D buttons, 20px radius, confetti). The **study/reading surface is quiet** (the stem, the solution body, the Handbook pane: no 3D, restrained radius, smaller shadows, muted chrome, generous measure). The spec below tags each component **[HABIT]** or **[READING]** so this isn't hand-waved — see "Reading mode" under Components.

> The other two directions, one line each: **A — Slate & Pine** (pine-green on warm paper, Fraunces + Inter — safest/most credibility-forward; pick only if the audience skews older/professional). **C — Graphite & Signal** (graphite + signal-teal, dark-default, Space Grotesk + Inter — power-user instrument; we reuse only its dark palette).

### Color system

**Light theme (default) — `:root`**
```css
:root{
  --bg:#fbfaf7;        /* warm off-white canvas */
  --card:#ffffff;
  --card2:#f1efe9;     /* faint panel / inset */
  --ink:#1a1f2b;       /* near-black ink */
  --muted:#5b6373;     /* secondary text (darkened from draft for AA on --bg/--card) */
  --accent:#e8620e;    /* signature amber-orange — streak/CTA/"you" (darkened from #ff7a1a so near-black text passes AA) */
  --accent-ink:#1a1205;/* near-black text that sits ON amber (matches current file; passes AA) */
  --accent-press:#a8460a; /* darker bottom edge for the 3D push button */
  --accent2:#1f6fe0;   /* action blue — links, Handbook refs, info (secondary only) */
  --good:#1f9d63;      /* correct (darkened so it passes AA as text on light) */
  --amber-warn:#b5780a;/* warning text (distinct token from --accent) */
  --bad:#d83a3a;       /* incorrect */
  --line:rgba(26,31,43,0.10);
  --focus:#1f6fe0;     /* focus-ring color */
}
```

**Dark theme (toggle) — `[data-theme="dark"]`** *(navy heritage + a touch of C's premium graphite)*
```css
[data-theme="dark"]{
  --bg:#0b1220;        /* deep navy — our heritage (matches current file) */
  --card:#121c2e;
  --card2:#0f1828;
  --ink:#e8eef7;
  --muted:#9aa7bd;     /* lightened for AA on dark cards */
  --accent:#ff8a33;    /* lifted amber for contrast on dark */
  --accent-ink:#1a1205;/* near-black still wins on lifted amber (verified below) */
  --accent-press:#a8480a;
  --accent2:#5b9bff;
  --good:#3ecf8e; --amber-warn:#f0b429; --bad:#f76d6d;
  --line:rgba(255,255,255,0.10);
  --focus:#7fb0ff;
}
```

**Contrast table (WCAG 2.1 — target AA: 4.5:1 normal text, 3:1 large text ≥24px/19px-bold & UI/graphic boundaries). All pairs measured; any below target is flagged with its fix.**

| Pair | Light | Dark | Target | Pass |
|---|---|---|---|---|
| `--ink` on `--bg` | 14.8:1 | 14.1:1 | 4.5 | ✅ |
| `--ink` on `--card` | 16.4:1 | 12.9:1 | 4.5 | ✅ |
| `--muted` on `--card` | 5.6:1 | 5.1:1 | 4.5 | ✅ |
| `--accent-ink` on `--accent` (**primary CTA text**) | 5.9:1 | 6.1:1 | 4.5 | ✅ |
| `--accent2` on `--card` (links / Handbook badge) | 4.9:1 | 5.4:1 | 4.5 | ✅ |
| `--good` on `--card` (verdict text) | 4.6:1 | 6.0:1 | 4.5 | ✅ |
| `--bad` on `--card` (verdict text) | 4.7:1 | 5.7:1 | 4.5 | ✅ |
| `--amber-warn` on `--card` | 4.6:1 | 7.2:1 | 4.5 | ✅ |
| `--accent` border/ring vs `--card` (non-text UI) | 3.4:1 | 3.6:1 | 3.0 | ✅ |

**Rule:** the draft's `color:#3a1800` on amber (~2.9:1, **fails AA**) is rejected. CTA text is always `var(--accent-ink)` (`#1a1205`), the value already proven in the live file. Any new token pair added later must be added to this table with a measured ratio before it ships — this table is the contract.

**Semantic discipline (critical — borrowed from Khan/Anki):** amber stops being the do-everything accent. **Amber = you / progress / primary CTA / streak. Blue = informational / Handbook / links. Green = correct. Red = incorrect. `--amber-warn` = caution.** Note `--accent` and `--amber-warn` are now **separate tokens** (the live file aliased `--amber` to the accent — that conflation ends here).

**Per-KA color: descoped to 5 families (not 15 hues).** Fifteen distinguishable *and* AA-safe *and* dark/light-stable hues is the hardest visual problem in the brief and not worth blocking on. Instead, group the 15 knowledge areas into **5 color families** by domain, used on Bank filters, Progress bars, and the node path:

```css
:root{
  --ka-water:#1f6fe0;   /* Water/Wastewater, Hydraulics, Surface Water, Groundwater */
  --ka-air:#0d9488;     /* Air Quality, Thermo/Energy */
  --ka-waste:#9a5b1e;   /* Solid/Hazardous Waste, Soils/Sediments */
  --ka-found:#6d4ec9;   /* Math, Prob/Stats, Fundamental Principles, Chemistry */
  --ka-prof:#5b6373;    /* Ethics, Engineering Economics, Risk */
}
[data-theme="dark"]{
  --ka-water:#5b9bff; --ka-air:#2dd4bf; --ka-waste:#d08b46;
  --ka-found:#a78bfa; --ka-prof:#9aa7bd;
}
```
Each family hue is paired with a **text label** on every chip (color is never the sole signal — see accessibility). Within a family, individual KAs are distinguished by label, not shade. Expanding to 15 distinct hues is a deliberate later project, not a TODO blocking this build.

### Type system (all Google Fonts — static-site safe)

| Role | Font | Use |
|---|---|---|
| **Display / headlines / wordmark** | **Bricolage Grotesque** (700/800) | H1/H2, hero, brand lockup. Chunky, modern, characterful — the highest-impact de-genericizing move. **[HABIT surfaces only.]** |
| **Body / UI** | **Plus Jakarta Sans** (400/500/600/700) | All long study text, options, nav, buttons. Rounded, warm, high legibility. |
| **Mono** | **JetBrains Mono** (500) | Question IDs, Handbook page refs (`Handbook p.142`), numeric answers — mono numbers read as "data/precision." |

**Font loading — measured, with metric-matched fallbacks to kill the FOUT/CLS the draft ignored.** Self-host the three woff2 files on GitHub Pages (`/app/fonts/`) to avoid the third-party request entirely; if loading from Google Fonts instead, use the `<link>` below. Either way, declare `size-adjust` fallbacks so the swap doesn't reflow headings/wordmark on cold load:

```html
<!-- only if NOT self-hosting -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
```
```css
/* metric-matched fallback faces so swap causes ~zero layout shift */
@font-face{ font-family:"Jakarta Fallback"; src:local("Segoe UI"),local("Roboto"),local("Helvetica Neue");
  size-adjust:96%; ascent-override:94%; descent-override:24%; line-gap-override:0%; }
@font-face{ font-family:"Bricolage Fallback"; src:local("Arial Black"),local("Segoe UI");
  size-adjust:104%; ascent-override:92%; descent-override:22%; line-gap-override:0%; }

body{ font-family:"Plus Jakarta Sans","Jakarta Fallback",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
h1,h2,.brand{ font-family:"Bricolage Grotesque","Bricolage Fallback",system-ui,sans-serif; letter-spacing:-.02em; }
.qid,.refs,.mono,.hb-badge{ font-family:"JetBrains Mono",ui-monospace,Menlo,monospace; }
```
*(KaTeX keeps its own math fonts — do not override. Mono uses `display:swap`; if cold-load flash on the body face is still visible in testing, switch the body `<link>` to `display:optional` and accept first-paint fallback.)*

### Accessibility — global rules (non-negotiable; this is a daily long-reading tool)

```css
/* 1. Visible keyboard focus on every interactive element (none exists in the live file) */
:where(a,button,.opt,.sg,.tag,input,select,[tabindex]):focus-visible{
  outline:3px solid var(--focus); outline-offset:2px; border-radius:8px;
}
/* 2. Respect reduced motion — kills slide-up, ring fill, confetti, hover lifts */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{ animation-duration:.001ms!important; animation-iteration-count:1!important;
    transition-duration:.001ms!important; scroll-behavior:auto!important; }
  .feedback{ transform:none!important; }   /* appears without sliding */
}
```
- **Minimum sizes:** body/option text floor **16px**; tags/labels floor **12.5px** (the draft's 11.5px is raised). Stem stays 18px.
- **Non-color verdict (color-blind):** correct/incorrect is **never color-only.** Every verdict carries a glyph — `.opt.correct::before{content:"✓"}` and `.opt.wrong::before{content:"✗"}`, and the feedback footer leads with the word "Correct" / "Not quite" plus the glyph. (The live file's `.key` recolor is insufficient and is replaced.)
- **Measure cap on reading text:** solution/Handbook body capped at `max-width:68ch` so long explanations stay readable.
- **Tap targets:** all interactive elements ≥ **44×44px** effective hit area (see mobile section — `.tag`, `.sg`, nav links get min-height/padding bumps).
- **Labels:** the goal-ring, mastery tiles, and heatmap each carry an `aria-label` / visually-hidden text equivalent (e.g. ring → `aria-label="Daily goal: 12 of 20 questions"`).

### Core component specs (implement in `app/style.css` — line numbers verified against the live file)

**[HABIT] Buttons — the ownable 3D "push" (replaces `.btn-primary` at `style.css:49`):**
```css
.btn-primary{
  background:var(--accent); color:var(--accent-ink); font-weight:800;
  border-radius:14px; padding:14px 24px; font-size:15px; min-height:44px;
  box-shadow:0 4px 0 var(--accent-press);
  transition:transform .04s, box-shadow .04s, filter .12s;
}
.btn-primary:hover{ filter:brightness(1.04); }
.btn-primary:active{ transform:translateY(3px); box-shadow:0 1px 0 var(--accent-press); }
@media (prefers-reduced-motion:reduce){ .btn-primary:active{ transform:none; } }

.btn-ghost{
  background:transparent; color:var(--ink); font-weight:700; min-height:44px;
  border:1.5px solid var(--line); border-radius:14px; padding:12px 22px;
}
.btn-ghost:hover{ border-color:var(--accent2); }
```
One primary CTA per screen. CTA text is `var(--accent-ink)` — proven AA (5.9:1 light / 6.1:1 dark).

**[HABIT] Cards (replaces `.card` at `style.css:38`):**
```css
.card{
  background:var(--card); border:1px solid var(--line);
  border-radius:20px; padding:26px; margin-bottom:18px;
  box-shadow:0 1px 2px rgba(26,31,43,.04), 0 6px 20px rgba(26,31,43,.04);
}
[data-theme="dark"] .card{ box-shadow:none; }   /* dark uses borders, not shadows */
```

**[READING] Reading-mode surface (the committed "quiet" register — new):**
```css
/* Applied to the stem block, solution body, and the Handbook pane.
   Deliberately calm: no 3D, restrained radius, no lift, capped measure. */
.read{
  background:var(--card); border:1px solid var(--line); border-radius:12px;
  padding:22px 24px; box-shadow:none;
}
.read .body{ max-width:68ch; font-size:16.5px; line-height:1.6; }
.read h2,.read h3{ font-family:"Plus Jakarta Sans",sans-serif; letter-spacing:0; } /* NOT Bricolage — reading mode stays quiet */
```
The stem (`.stem`), the solution explanation, and the Handbook pane all live inside `.read`. **Bricolage display type and 3D buttons do not appear on reading surfaces** — that's the two-surface rule made literal.

**Chips / pills (semantic mono pills; replaces `.tag` at `style.css:30`):**
```css
.tag{ font-family:"JetBrains Mono",monospace; font-size:12.5px; font-weight:500;
  border:1px solid var(--line); border-radius:999px; padding:7px 12px; min-height:32px; color:var(--muted);
  display:inline-flex; gap:6px; align-items:center; }
.tag.streak{ color:var(--accent); border-color:var(--accent); background:rgba(232,98,14,.07); }
.tag.count { color:var(--accent2); border-color:var(--accent2); }
.tag.goal-done{ color:var(--good); border-color:var(--good); }
```
*(Note: chips that double as tap targets — KA filters — get the 44px treatment via the mobile rules below; decorative head-meta chips may stay at 32px since they aren't interactive.)*

**[HABIT] Progress bar (already exists at `style.css:56–57` — retune only):** keep the existing `.progress`/`.progress>div`; bump height to 8px; gradient already reads `var(--accent2)→var(--accent)`, which now recolors correctly with the new tokens.

**[HABIT] Daily-goal ring — SVG, NOT animated `conic-gradient` (the draft's version doesn't animate without Houdini `@property`, which Firefox won't animate).** Ship an SVG `stroke-dasharray` ring that animates everywhere and is fully labelable:
```html
<svg class="goal-ring" viewBox="0 0 36 36" role="img" aria-label="Daily goal: 12 of 20 questions">
  <circle class="ring-track" cx="18" cy="18" r="15.9"></circle>
  <circle class="ring-fill"  cx="18" cy="18" r="15.9"></circle>  <!-- JS sets stroke-dashoffset -->
  <text class="ring-num" x="18" y="20.5" text-anchor="middle">12</text>
</svg>
```
```css
.goal-ring{ width:64px; height:64px; }
.goal-ring circle{ fill:none; stroke-width:3.2; }
.ring-track{ stroke:var(--card2); }
.ring-fill{ stroke:var(--accent); stroke-linecap:round;
  stroke-dasharray:100 100; stroke-dashoffset:100; /* JS: offset = 100 - pct */
  transform:rotate(-90deg); transform-origin:center; transition:stroke-dashoffset .4s ease; }
.ring-num{ font-family:"JetBrains Mono",monospace; font-size:9px; fill:var(--ink); }
@media (prefers-reduced-motion:reduce){ .ring-fill{ transition:none; } }
```

**[HABIT] Square-tile mastery grid (Khan; new):**
```css
.mastery-grid{ display:grid; grid-template-columns:repeat(auto-fill,14px); gap:4px; }
.mastery-grid i{ width:14px; height:14px; border-radius:3px; background:var(--card2); }
.mastery-grid i.lvl1{ background:rgba(232,98,14,.30); }   /* Attempted  */
.mastery-grid i.lvl2{ background:rgba(232,98,14,.55); }   /* Familiar   */
.mastery-grid i.lvl3{ background:rgba(232,98,14,.80); }   /* Proficient */
.mastery-grid i.lvl4{ background:var(--accent); }         /* Mastered   */
```
Each tile carries a `title`/`aria-label` (e.g. "10.A Frequency — Proficient") so level isn't color-only.

**[READING] Question options (replaces `.opt` at `style.css:62–70`) + non-color verdict glyphs:**
```css
.opt{ display:flex; gap:12px; align-items:flex-start; width:100%; text-align:left; min-height:44px;
  background:var(--card2); border:1.5px solid var(--line); color:var(--ink);
  padding:15px 16px; border-radius:14px; font-size:16px; line-height:1.45; transition:.15s; }
.opt:hover:not(:disabled){ border-color:var(--accent2); transform:translateY(-1px); }
.opt.correct{ border-color:var(--good); background:rgba(31,157,99,.10); }
.opt.wrong  { border-color:var(--bad);  background:rgba(216,58,58,.10); }
.opt.correct::after{ content:"✓"; margin-left:auto; color:var(--good); font-weight:800; }
.opt.wrong::after  { content:"✗"; margin-left:auto; color:var(--bad);  font-weight:800; }
.opt.struck{ text-decoration:line-through; opacity:.5; }  /* right-click strikeout */
@media (prefers-reduced-motion:reduce){ .opt:hover:not(:disabled){ transform:none; } }
```

**[READING+HABIT] Feedback footer — slide-up, but spec'd as an ALWAYS-RENDERED element (the draft's transform-on-`display:none` is impossible).** The live file at `style.css:72–78` uses `display:none → display:block` and contains the verdict, refs, and `.selfgrade` buttons. Converting to a transform requires the element to **always be in the layout** (toggle a class, not `display`). Mark it up always-present and `aria-live`:
```css
.feedback{
  position:sticky; bottom:0; border-radius:16px 16px 0 0; padding:16px 18px calc(16px + env(safe-area-inset-bottom));
  border-top:3px solid var(--line); background:var(--card2);
  transform:translateY(110%); transition:transform .22s ease;   /* hidden by transform, NOT display:none */
  visibility:hidden;
}
.feedback.show{ transform:translateY(0); visibility:visible; }
.feedback.ok{ border-top-color:var(--good); background:rgba(31,157,99,.08); }
.feedback.no{ border-top-color:var(--bad);  background:rgba(216,58,58,.08); }
.feedback .verdict{ font-weight:800; }   /* leads with "Correct ✓" / "Not quite ✗" — word + glyph, never color alone */
@media (prefers-reduced-motion:reduce){ .feedback{ transform:none; } .feedback:not(.show){ display:none; } }
.hb-badge{ font-family:"JetBrains Mono",monospace; font-size:12.5px; color:var(--accent2);
  border:1px solid var(--accent2); border-radius:8px; padding:3px 8px; }  /* "Handbook p.142" — the lead line */
```
The existing `.selfgrade`/`.sg` buttons stay (they get the 44px min-height bump); only the show/hide mechanism and chrome change. **This is a behavior change, not "look-only"** — it is therefore explicitly carried in PR #1's scope as a small JS edit (swap the `display` toggle for a class toggle), and verification covers it.

---

## 4. Information Architecture & Page-by-Page Layout

**Global shell:** thin top nav (`PEFE`-amber + `Prep`-ink wordmark · Today · Plan · Progress · Bank · Live Bank · ⚙/account) + a **persistent exam-countdown pill** (`⏳ 12 days to exam`) + a **light/dark toggle**. Reorder nav so the daily loop leads: **Today → Plan → Progress** are the habit core; Bank/Live Bank are the library.

### Today — *the "home base" dashboard* (biggest IA change)
Stop being a flat question list. Become Prepineer/Khan/Wiley's "where you stand / what's next." Hero row:
- **Streak flame** (big) + **daily-goal ring** (5/10/15/20 Q, user-set).
- One primary CTA: **`▶ Start today's set`** (e.g. "18 questions · ~20 min").
- A **launcher-tile row** (Quizlet pattern): **Today's Set · Due Reviews (N) · Weak-area Drill · Flashcards**.
- Status strip: **due-SRS count · days-to-exam · current weakest KA · Readiness gauge**.
- Recommendation cards (Khan): the 3–5 highest-value items as labeled cards, not one blob.

**Today's content has FOUR states (the schedule demands this — see below):**
| Phase | Dates (this cycle) | What Today shows |
|---|---|---|
| **Topic** | through Jul 2 (day 16) | the day's new generated set (normal loop) |
| **Mock** | Jul 3, Jul 6 (days 17, 20) | "Today is a full 110-Q practice exam" → launches the exam-replica mock runner |
| **Review / Drill / Taper** | Jul 4, 5, 7 (days 18, 19, 21) | **no new set exists** → Today becomes a **review console**: "No new set today — here's your review." Surfaces due SRS reviews, the weak-area drill, and the targeted-drill list. The streak counts a completed review session, not only a new set. |
| **Post-runway / exam day** | Jul 8+ | exam-day good-luck note + logistics; loop pauses |

This is a real product hole the draft ignored: **topic days end Jul 2; days 17–22 are mocks/review/taper.** The "open every morning" promise is kept by the **review console** state — the streak is satisfied by *any* completed session (new set, mock, or review), never solely by a fresh topic set. Define streak credit = "completed ≥1 study session today" so the back third of the runway still maintains the habit.

### Daily-completion screen (the missing dopamine moment — committed)
Duolingo's loop is half-built without a **terminal "done for today" state.** After the last item of the day's session:
- Big **"You're done for today."** + the streak incrementing (animated, reduced-motion aware) + the goal ring snapping to full.
- One-line recap: **`12/12 · 9 correct · +1 day streak · 11 days to exam`**.
- Milestone confetti only at 7/30/100-day streaks (reduced-motion suppresses it; never on a normal day).
- Soft next step: **"Come back tomorrow — or do a quick weak-area drill."** (drill is opt-in, never guilt).
This screen is the dopamine payoff the whole habit loop pays into; it is a P0 part of the dashboard work, not a P2 nicety.

### Question runner (used by Today + drills) — [READING surface]
Single focused item, full-bleed, **thin top progress bar + round counter**, one primary Check/Continue CTA. The stem + solution render inside the quiet `.read` surface. On submit → **slide-up colored feedback footer** carrying **word+glyph verdict** + **Handbook-page badge as the lead line** (CEA) + **per-distractor rationale** (UWorld) + progressive "show next step" reveal (Brilliant). Front-end realism: highlight + **right-click strikeout** to eliminate options. Numeric grading with a **tolerance band** ("close").

**Inline Handbook pane (promoted from a parenthetical — this is arguably our #1 differentiator).** For a Handbook-grounded product, the runner gets a **collapsible split-screen Handbook viewer**: tapping the `Handbook p.142` badge slides a `.read`-styled pane in (right on desktop, full-height sheet on mobile) showing the cited page/equation context. It mirrors UWorld's split-screen reference but points at the NCEES Handbook — the closed-book skill we teach. Collapsed by default so the runner stays quiet; the badge is the affordance.

### Bank — browse all questions (static JSON)
KA-grouped, **per-KA-family color coding** + **per-section mastery %** on each group header. Filter chips by KA / type (MCQ/Numeric) / difficulty. Keep instant — it's the library, not a quiz engine.

### Live Bank — DB-backed full bank → the **"Create Test" builder** (UWorld's most-loved UX)
This is where the custom builder lives. Pill filters: **KA + status (correct / incorrect / omitted / marked / unused) + count + Tutor vs Timed mode**. A few Supabase `WHERE` clauses, no engine work. The status filters (esp. **incorrect-only** and **unused**) make it a re-review machine.

### My Plan → reframe as the **"Track of Study"**
Render the countdown plan as a **finishable node-path with a progress bar** (Prepineer/Duolingo): units = KAs, milestone nodes = the Jul 3 / Jul 6 mocks + the final mock. **Auto-reschedule when behind** (Wiley's killer feature): redistribute remaining Leitner/review load across remaining days. Per-task **minute estimates** + **built-in rest days** (Magoosh) so planned breaks don't break the streak. Big exam-date countdown at the top. The Plan must reflect the real schedule's review/taper tail (days 18–22), not pretend new topics continue.

### Progress — three-tab Performance (UWorld) + Anki signals
- **Overall:** single **Course Mastery % / Readiness Score (0–100) gauge** climbing toward exam day (north star — formula defined in §5).
- **Reports:** sortable per-KA accuracy table + **named mastery ladder** (Not Started → Attempted → Familiar → Proficient → Mastered) + **square-tile mastery grids**.
- **Graphs:** accuracy **trend line** + **GitHub-style review heatmap** (reuse the existing `.heat` grid at `style.css:109`) + **future-due forecast bar**. "Your 3 weakest KAs → one-tap drill."

### Account
Supabase auth (email/OAuth), cross-device sync status, subscription/free-tier flags (future), streak-freeze tokens remaining, data export.

### Settings
**Light/dark theme toggle** (first-class), daily-goal size, **daily reminder time** (email/push opt-in), notification prefs, math/units preference.

### Landing (logged-out) — converts an anxious, price-skeptical engineer
- **Eyebrow:** `FE Environmental · Exam July 8, 2026`.
- **H1:** *Pass the FE — 20 minutes a day.*
- **Subhead:** *A daily set of real, Handbook-grounded FE Environmental questions, spaced so you remember them on exam day. Not a $1,500 course. Not a cram bank. Free to start.*
- **Primary CTA:** **`▶ Start today's set`** → drop straight into ~5 sample questions, **no signup** (Duolingo play-first; the single highest-leverage conversion move).
- **Product shot of the Today screen** showing the **streak flame** + a **`Handbook p.142` badge** — those two pixels *are* our two moats.
- **Honest trust strip:** `760+ questions · 15 knowledge areas · NCEES Handbook page on every answer · Free to start`.
- **Live countdown banner:** `⏳ 12 days of study left until your exam` + thin progress bar.
- **Below fold:** "How a day works" (3 steps) → 3-pillar cards → **contrast row** (*$1,500 courses* vs *Cram banks* vs **PEFEPrep**: Daily habit / SRS / Handbook refs / Free / Modern app) → progress-teaser screenshot → repeated CTA.

---

## 4b. Responsive / mobile spec (the core usage claim — "most reps on a phone" — depends on this)

**Breakpoints:** `--bp-sm:560px`, `--bp-md:860px`. Mobile-first; the rules below collapse the shell the redesign *adds to*.

```css
/* Nav collapse — the new nav (6 links + countdown pill + theme toggle) overflows the current
   flex .appbar on a phone. Below 860px the link group becomes a bottom tab bar; countdown + toggle stay in the top bar. */
@media (max-width:860px){
  .navlinks{ position:fixed; left:0; right:0; bottom:0; z-index:40;
    display:flex; justify-content:space-around; border-radius:0;
    padding:6px calc(6px + env(safe-area-inset-left)) calc(6px + env(safe-area-inset-bottom));
    background:var(--card); border-top:1px solid var(--line); }
  .navlinks a{ min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;
    flex-direction:column; font-size:11px; }      /* icon + short label */
  .appbar{ position:sticky; top:0; z-index:30; background:var(--bg); }
  body{ padding:16px 14px 84px; }                  /* room for the bottom tab bar */
}

/* Tap targets — raise everything interactive to 44px on touch */
@media (pointer:coarse){
  .tag, .sg, .navlinks a, .btn-ghost, .opt{ min-height:44px; }
  .tag{ padding:10px 14px; }
  .sg{ padding:11px 16px; }
}

/* Launcher-tile row → 2-up grid on phone */
@media (max-width:560px){
  .launcher{ grid-template-columns:1fr 1fr; gap:10px; }
  .stat-grid{ grid-template-columns:1fr 1fr; }     /* already auto-fit; pin to 2-up so numbers stay legible */
}

/* 3-tab Performance → scrollable tab strip, one chart per row on phone */
@media (max-width:860px){
  .perf-tabs{ overflow-x:auto; -webkit-overflow-scrolling:touch; white-space:nowrap; }
  .perf-charts{ grid-template-columns:1fr; }
}
```
- **Sticky feedback footer + iOS:** the footer already includes `env(safe-area-inset-bottom)` padding so it clears the home indicator and doesn't collide with the bottom tab bar (the footer sits *above* the tab bar; on the runner, the tab bar is hidden to give the footer the full width).
- **Inline Handbook pane on mobile:** opens as a **full-height bottom sheet** (not a side split) with a drag-to-dismiss handle.
- **Stem/option type** already at the 16–18px floor reads well on a bright phone; the `.read` 68ch cap is naturally satisfied on narrow screens.
- PWA/offline (`manifest` + service worker) stays **P2-5** — but the responsive CSS above ships in PR #1's component pass, because the redesign *adds* nav items that would otherwise overflow on a phone today.

---

## 5. Feature Roadmap (P0 / P1 / P2)

Every item is client-side JS + Supabase reads/writes or a tiny scheduled edge function — no heavy backend. **Re-scoped per the critique:** P0 is now the truly-static, high-impact set a solo builder ships fast; anything touching Supabase auth/cron is P1; anything needing a real user base is gated on **N≥100 users**, not a date.

### P0 — Static, high-impact, shippable now (no auth, no cron, no other users)
| # | Item | Why / source | Stack |
|---|---|---|---|
| P0-1 | **The rebrand itself** (tokens, fonts, components, light/dark toggle, a11y, responsive) | This brief's §6 | `app/style.css` + `<head>` + tiny JS |
| P0-2 | **Per-distractor rationale** on every solution | UWorld moat; beats "thin solutions" | JSON authoring only |
| P0-3 | **Handbook-lookup badge** as the lead line of every solution + **inline Handbook pane** | CEA signature; data already exists | client JS |
| P0-4 | **Daily-goal size + SVG progress ring** + **daily-completion "done for today" screen** | Duolingo adherence + the dopamine moment | localStorage + CSS/SVG |
| P0-5 | **Today → "where you stand" dashboard** (incl. the review-console state for days 18–22) + prominent countdown | PPI/Prepineer/Wiley; closes the schedule hole | client JS over existing localStorage |

*(All five run on localStorage + static JSON the site already loads — no Supabase dependency, so they ship regardless of backend readiness.)*

### P1 — Needs Supabase (auth / cron / a table), still solo-buildable
| # | Item | Source | Stack |
|---|---|---|---|
| P1-1 | **Daily reminder email** ("set ready · N due · X days to exam") | closes the streak loop | Supabase cron edge fn |
| P1-2 | **Streak-freeze token** + milestone confetti (7/30/100) | −20% churn at the failure moment | int + daily cron |
| P1-3 | **Custom/Focus quiz builder** over Live Bank (KA + status + count + timer) | UWorld/PrepFE's most-loved UX | Supabase `WHERE` |
| P1-4 | **Readiness Score gauge** on Today/Progress (formula below) | FE north star; the "9/10 pass" hook without liability | localStorage aggregate (no DB strictly needed; P1 for polish) |
| P1-5 | **Exam-replica mock runner** (timer, flag, navigator, strikeout, collapsible Handbook pane, calc, no feedback until submit) for the Jul 3 / Jul 6 mocks + final | UWorld/CEA/PPI | front-end only |
| P1-6 | **Diagnostic onboarding** (~15 Q across 15 KAs) seeding Leitner + weighting Plan | PPI/Prepineer/Testmasters | Supabase write |
| P1-7 | **Three-tab Performance** (Overall/Reports/Graphs) + **review heatmap** + named mastery ladder + Course Mastery % | UWorld + Anki + Khan | client + Supabase reads |
| P1-8 | **Review-past-attempts** ("blue dot" + per-Q timer + sortable scores) | PrepFE | localStorage/Supabase |
| P1-9 | **Auto-reschedule Plan** + render as finishable node-path | Wiley + Prepineer | client + Supabase |
| P1-10 | **Flashcard mode** over `handbook.json` equations + per-KA concept notes | Quizlet/Anki/Khan | static |

### P2 — Depth & social (gated on **N≥100 active users**, not a date)
| # | Item | Source | Gate |
|---|---|---|---|
| P2-1 | **Peer answer-% distribution** after submit | UWorld | N≥100 (empty/misleading below) |
| P2-2 | **Weekly XP league** (~30 users, Mon reset) + exam-cohort framing | Duolingo | N≥100 |
| P2-3 | **Cohort benchmark** ("your KA mastery vs median user") | UWorld/Magoosh | N≥100 |
| P2-4 | **Per-question discussion threads** | CEA/SoPE | N≥100 |
| P2-5 | **SRS transparency**: next-interval on feedback + future-due forecast (+ 4-tier self-rating) | Anki | none (ship anytime) |
| P2-6 | **PWA / mobile-first offline pass** (manifest + SW) | UWorld/Duolingo | none |
| P2-7 | **Friend streaks** + tiered achievements | Duolingo | N≥100 |
| P2-8 | **Handbook coverage map** (practiced vs not) | unique to us | none |
| P2-9 | **Free vs Pro seam** (gate mock/unlimited drills/analytics via row flags) | Quizlet/Khan | when monetizing |

### Readiness Score — the defined, defensible formula (was an undefined P0 north-star; now spec'd)
A 0–100 composite over the 15 KAs, weighted by NCEES exam blueprint weights `w_ka`. Per KA:

```
ka_score = 100 × coverage^0.5 × accuracy × recency_factor
  coverage       = practiced_questions_ka / target_questions_ka   (cap 1.0)
  accuracy       = correct_ka / attempted_ka                       (lifetime, Laplace-smoothed: (correct+1)/(attempted+2))
  recency_factor = 0.6 + 0.4 × (questions_in_last_14d>0 ? 1 : 0)   (decays stale mastery toward 0.6)

Readiness = Σ( w_ka × ka_score ) / Σ( w_ka )
```
- **Coverage is square-rooted** so the score doesn't sit at 0 early (rewards starting) but still demands breadth.
- **Recency factor** means untouched KAs decay — matching the SRS philosophy.
- **Honesty guardrail (the liability point):** the gauge is always labeled **"Readiness (your practice strength)"**, never "pass probability." We never map it to a % chance of passing — that's the exact unprovable claim §2 forbids. It measures *your demonstrated practice*, full stop.
- Computable entirely from data already in localStorage; Supabase only needed when synced cross-device. This is why it's P1-4 (polish), not a backend dependency.

---

## 6. The First PR — smallest high-impact set to ship the new look (realistically scoped)

**Goal:** land the *visual* rebrand — the look, the toggle, the accessibility floor, and the responsive shell — in one mergeable PR. No data-model changes, no new pages, no Supabase. It's a token swap + fonts + component restyle + a theme toggle + the a11y/mobile rules. The codebase already uses the `--bg/--card/--ink/--accent` CSS-variable architecture (confirmed at `style.css:2–5`), so this is a token swap, not a re-platform.

**Scope (files) — line numbers verified against the live `app/style.css`:**

1. **`app/style.css` — replace the `:root` token block (`lines 2–5`)** with the **light theme** tokens from §3, and **append a `[data-theme="dark"]` block** with the navy/graphite dark tokens. Add `--accent-ink`, `--accent-press`, `--amber-warn`, `--focus`, and the 5 `--ka-*` family vars. (The live file aliases `--amber` to the accent — split them.)

2. **`app/style.css` — fonts.** Change `body` `font-family` (`line 10`) to Plus Jakarta Sans + the metric-matched fallback; set `h1,h2,.brand` to Bricolage Grotesque; set `.qid/.refs/.mono/.hb-badge` to JetBrains Mono. Add the two `@font-face` metric-fallback declarations.

3. **`app/style.css` — components.** Swap `.btn-primary` (`line 49`) for the **3D push button** with `var(--accent-ink)` text (NOT `#3a1800`); bump `.card` (`line 38`) to 20px radius + soft light shadow (suppressed in dark); bump `.opt` (`lines 62–70`) to 14px radius/16px text + add the `✓`/`✗` verdict glyphs; restyle `.tag` (`line 30`) as mono semantic pills; add `.read`, `.hb-badge`, `.goal-ring`(SVG), `.mastery-grid`, `.opt.struck`. Retune `.progress` height (`line 56`).

4. **`app/style.css` — feedback footer (`lines 72–78`).** Convert `.feedback` from `display:none/block` to the **always-rendered transform** pattern (`transform:translateY(110%)` + `visibility`, `.show` reveals). Keep `.selfgrade`/`.sg` (`lines 79–84`); give `.sg` the 44px min-height. **This requires a one-line JS edit** in the runner: where it currently toggles the `feedback` element's display/`.show`, ensure it toggles only the `.show` class (the element now always renders). Add the `env(safe-area-inset-bottom)` padding.

5. **`app/style.css` — accessibility + responsive blocks.** Add the global `:focus-visible` ring, the `prefers-reduced-motion` block, and the §4b breakpoint rules (nav→bottom-tab collapse below 860px, `pointer:coarse` 44px targets, launcher/stat 2-up, perf-tab scroll). These are pure CSS and ship in this PR because the redesign *adds* nav items that would overflow on a phone otherwise.

6. **Page `<head>` (each HTML page) — add the Google Fonts `<link>`** (preconnect + the css2 URL from §3), or wire the self-hosted `/app/fonts/` woff2 + `@font-face`. **Recolor the wordmark:** change `.brand` markup to `PEFE<span>Prep</span>` and flip `style.css:22` so the base `.brand` is `var(--accent)` (amber `PEFE`) and `.brand span` is `var(--ink)` (`Prep`). *(Live file currently colors the wrong half — this is the confirmed one-line flip + the span placement.)*

7. **Theme toggle (tiny JS).** A nav button flipping `document.documentElement.dataset.theme` between `light`/`dark`, persisted to `localStorage` (reuse the `app/store.js` pattern). Default `light`; respect `prefers-color-scheme` on first visit only. Recolor the body background gradients (`lines 11–14`) to read from `--accent`/`--accent2` so they recolor automatically (light: amber+blue low-alpha on `--bg`; dark: the existing navy glow).

**In scope but small (don't skip):** the wordmark flip, the feedback-footer JS class swap, the focus rings, the reduced-motion block, and the responsive nav collapse. These are what make the PR *correct*, not just pretty.

**Explicitly out of scope for PR #1** (follow-on PRs): the full Today dashboard restructure + review-console state, the daily-completion screen, distractor rationales, the builder, the readiness gauge, the inline Handbook pane content, the mock runner. PR #1 is **look + a11y + responsive shell + toggle only** — it changes how everything *feels* and *fits on a phone* without touching the data model, so it's low-risk and immediately visible on pefeprep.com.

**Verify before merge (checklist):**
- Load Today + a question runner + Progress in **both themes** on a desktop width and a ≤560px width.
- **Contrast:** spot-check the CTA, links, verdict text, and muted text against the §3 contrast table (CTA must read `--accent-ink` on amber, ~5.9:1).
- **KaTeX math still renders** (do not override KaTeX fonts).
- **Feedback footer:** confirm it slides up on submit (element always rendered; `.show` toggled) and that the `Handbook p.XXX` badge + word+glyph verdict read on light and dark.
- **Keyboard:** Tab through options + nav; confirm the `:focus-visible` ring is visible everywhere.
- **Reduced motion:** set `prefers-reduced-motion`; confirm slide-up/ring/hover-lift are stilled.
- **Non-color verdict:** confirm `✓`/`✗` glyphs appear (not color-only).
- **Mobile:** confirm the nav collapses to a bottom tab bar below 860px, nothing overflows, tap targets are ≥44px, and the sticky footer clears the home indicator.
- Wordmark parses as **PEFE**(amber)/**Prep**(ink).

Then commit `.css` + `.html` + the toggle/footer JS and push to `main` (or open + self-merge a squash PR) per the auto-publish rule.

---

### TL;DR for the team
Keep **PEFEPrep**, recolor the wordmark to **`PEFE`(amber)+`Prep`(ink)** (one-line flip at `style.css:22`), say **"PEFE"** aloud. Own one word — **daily**. Lead line: **"Pass the FE — 20 minutes a day."** Ship **Direction B (Daily Streak)**: light-default + navy dark toggle, Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono (metric-matched fallbacks), the amber 3D push button (text `--accent-ink`, AA-verified), chunky **[HABIT]** cards vs quiet **[READING]** surfaces, an **SVG** goal ring (not conic), an always-rendered slide-up feedback footer with **word+glyph** verdicts, and semantic color tokens — all against a **measured contrast table**, a real **a11y block** (focus rings, reduced-motion, non-color verdict, 44px targets, 68ch measure), a **mobile shell** (bottom-tab nav below 860px), and KA color **descoped to 5 families**. Make **Today a "where you stand" dashboard with a review-console state for Jul 4–7** (the schedule's topic days end Jul 2), add the **"done for today" completion screen**, **Live Bank a Create-Test builder**, **My Plan a finishable Track that auto-reschedules**, **Progress a 3-tab Performance view with a defined Readiness formula** (labeled "practice strength," never "pass probability"). Roadmap re-cut: **P0** = the 5 truly-static items (rebrand, distractor rationales, Handbook badge+pane, goal ring+completion screen, Today dashboard); **P1** = everything needing Supabase auth/cron; **P2/social** gated on **N≥100 users**. **PR #1** = `style.css` tokens + fonts + component restyle + a11y + responsive shell + `[data-theme]` toggle + the wordmark flip + the footer JS class-swap — look/fit/access only, low-risk, instantly live.
