/* PEFEPrep — cross-device progress sync.
 *
 * localStorage (PFP / store.js) stays the synchronous working store; this layer
 * mirrors it to the signed-in Supabase account so progress follows the user
 * across devices:
 *   - cards    <-> review_state   (Leitner boxes / due dates / counts)
 *   - attempts  ->  attempts      (history + dashboard stats; append-only, de-duped)
 *   - the rest (streak, My List stars, achievements, daily, engagement,
 *     settings) <-> user_state.state   (one jsonb blob)
 *
 * Hydrates on load (cloud -> local, smart-merged) then pushes (local -> cloud),
 * and keeps pushing on change (debounced) and on page hide. Fully silent and
 * non-blocking when signed out or offline. Requires store.js + sb.js + supabase-js.
 */
(function () {
  "use strict";
  if (!window.PFP || !window.PFPAuth || !window.PFP_SB) return;
  var SB = window.PFP_SB;
  var BLOB_KEYS = ["streak", "streakDay", "bestStreak", "lastGrace", "graceDay",
    "starred", "achievements", "daily", "engagement", "settings", "perfectSets", "practiceBeat"];

  var uid = null, applying = false, snapshot = {}, pushTimer = null,
      cloudHadAttempts = false, startPromise = null, lastSummary = null,
      statusCbs = [], seededNow = false;

  function nowISO() { return new Date().toISOString(); }
  function isDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ""); }
  function tsFor(d) { return isDate(d) ? d + "T12:00:00Z" : nowISO(); }
  function clampBox(b) { b = b || 0; return b < 1 ? 1 : b > 5 ? 5 : b; }
  function laterStr(a, b) { a = a || ""; b = b || ""; return a > b ? a : b; }
  function seededKey() { return "pefeprep_synced_" + uid; }
  function isSeeded() { try { return !!localStorage.getItem(seededKey()); } catch (e) { return false; } }
  function markSeeded() { try { localStorage.setItem(seededKey(), nowISO()); } catch (e) {} }

  /* ---- merge helpers ---- */
  function reviewToCard(r) {
    return { box: clampBox(r.box), seen: r.attempts || 0, wrong: r.wrong || 0,
      due: r.due_date || null, last: (r.last_seen || "").slice(0, 10) || null };
  }
  function mergeCard(a, b) {
    if (!a) return b; if (!b) return a;
    var newer = (b.last || "") > (a.last || "") ? b : a;
    return {
      box: Math.max(a.box || 0, b.box || 0),
      seen: Math.max(a.seen || 0, b.seen || 0),
      wrong: Math.max(a.wrong || 0, b.wrong || 0),
      due: laterStr(a.due, b.due), last: laterStr(a.last, b.last),
      lastCorrect: (typeof newer.lastCorrect === "boolean") ? newer.lastCorrect : (a.lastCorrect),
      topic: a.topic || b.topic
    };
  }
  function mergeEngagement(a, b) {
    a = a || {}; b = b || {}; var o = Object.assign({}, a);
    Object.keys(b).forEach(function (d) {
      var x = a[d], y = b[d];
      o[d] = !x ? y : { focusMs: Math.max(x.focusMs || 0, y.focusMs || 0), leaves: Math.max(x.leaves || 0, y.leaves || 0) };
    });
    return o;
  }
  /* Merge cloud blob + review rows into the local state object (in place). */
  function mergeInto(s, cloud, reviews) {
    if (cloud) {
      if ((cloud.streak || 0) > (s.streak || 0)) s.streak = cloud.streak;
      s.streakDay = laterStr(s.streakDay, cloud.streakDay);
      s.bestStreak = Math.max(s.bestStreak || 0, cloud.bestStreak || 0);
      s.lastGrace = laterStr(s.lastGrace, cloud.lastGrace);
      s.graceDay = laterStr(s.graceDay, cloud.graceDay);
      s.starred = Object.assign({}, cloud.starred || {}, s.starred || {});
      s.achievements = s.achievements || {};
      var ca = cloud.achievements || {};
      Object.keys(ca).forEach(function (k) { if (!s.achievements[k] || ca[k] < s.achievements[k]) s.achievements[k] = ca[k]; });
      s.daily = Object.assign({}, cloud.daily || {}, s.daily || {});
      s.engagement = mergeEngagement(s.engagement, cloud.engagement);
      s.settings = Object.assign({}, cloud.settings || {}, s.settings || {});
      s.perfectSets = Math.max(s.perfectSets || 0, cloud.perfectSets || 0);
      s.practiceBeat = s.practiceBeat || cloud.practiceBeat;
    }
    if (reviews && reviews.length) {
      s.cards = s.cards || {};
      reviews.forEach(function (r) { s.cards[r.question_id] = mergeCard(s.cards[r.question_id], reviewToCard(r)); });
    }
    return s;
  }
  function blobOf(s) { var o = {}; BLOB_KEYS.forEach(function (k) { if (s[k] !== undefined) o[k] = s[k]; }); return o; }

  /* ---- cloud reads/writes ---- */
  async function fetchBlob() {
    var r = await SB.from("user_state").select("state").maybeSingle();
    return (r.data && r.data.state) || null;
  }
  async function fetchReviews() {
    var out = [], from = 0, page = 1000;
    while (true) {
      var r = await SB.from("review_state").select("question_id,box,attempts,wrong,due_date,last_seen").range(from, from + page - 1);
      if (r.error || !r.data || !r.data.length) break;
      out = out.concat(r.data); if (r.data.length < page) break; from += page;
    }
    return out;
  }
  async function cloudAttemptCount() {
    var r = await SB.from("attempts").select("id", { count: "exact", head: true });
    return r.count || 0;
  }
  async function pushCards(cards, onlyChanged) {
    var ids = Object.keys(cards || {}).filter(function (id) {
      var c = cards[id]; if (!c) return false;
      if (!onlyChanged) return true;
      var p = snapshot[id];
      return !p || p.box !== c.box || p.seen !== c.seen || p.wrong !== c.wrong || p.due !== c.due;
    });
    for (var i = 0; i < ids.length; i += 200) {
      var rows = ids.slice(i, i + 200).map(function (id) {
        var c = cards[id];
        return { user_id: uid, question_id: id, box: clampBox(c.box), attempts: c.seen || 0,
          wrong: c.wrong || 0, due_date: isDate(c.due) ? c.due : null, last_seen: tsFor(c.last) };
      });
      var er = await SB.from("review_state").upsert(rows, { onConflict: "user_id,question_id" });
      if (er.error) throw er.error;
    }
    ids.forEach(function (id) { var c = cards[id]; snapshot[id] = { box: c.box, seen: c.seen, wrong: c.wrong, due: c.due }; });
    return ids.length;
  }
  /* Append attempts not yet pushed, tracked by a slice-safe high-water mark
     (attemptsSyncedTotal vs the monotonic attemptsTotal). When the account
     already has history we baseline existing ones as synced (allowSeed=false)
     rather than re-sending. Returns the new high-water mark, or null if nothing
     to do (caller writes the mark with a fresh read so concurrent answers, which
     bump attemptsTotal past this mark, simply sync on the next push). */
  async function pushAttempts(s, allowSeed) {
    var log = Array.isArray(s.attempts) ? s.attempts : [];
    var total = (s.attemptsTotal != null) ? s.attemptsTotal : log.length;
    var synced = s.attemptsSyncedTotal || 0;
    var nNew = total - synced;
    if (nNew <= 0) return null;
    if (allowSeed) {
      var pending = log.slice(Math.max(0, log.length - nNew)).filter(function (a) { return a && a.id; });
      for (var i = 0; i < pending.length; i += 200) {
        var rows = pending.slice(i, i + 200).map(function (a) {
          return { user_id: uid, question_id: a.id, correct: !!a.correct, source: "sync", created_at: tsFor(a.date) };
        });
        var ir = await SB.from("attempts").insert(rows);
        if (ir.error) throw ir.error;
      }
    }
    return total;
  }
  function markAttemptsSynced(newSynced) {
    if (newSynced == null) return;
    applying = true;
    try { var f = PFP.getState(); f.attemptsSyncedTotal = newSynced; PFP.replaceState(f); } finally { applying = false; }
  }

  function applyState(s) { applying = true; try { PFP.replaceState(s); } finally { applying = false; } }

  /* Full reconcile: pull cloud, merge into local, write back, push local up. */
  async function sync(initial) {
    var cloud = null, reviews = [];
    try { cloud = await fetchBlob(); } catch (e) {}
    try { reviews = await fetchReviews(); } catch (e) {}
    if (initial && !isSeeded()) { try { cloudHadAttempts = (await cloudAttemptCount()) > 0; } catch (e) { cloudHadAttempts = true; } }

    // snapshot = what the cloud already holds, so the push below sends only the
    // cards that are local-only or more advanced (not all of them every load).
    snapshot = {};
    (reviews || []).forEach(function (r) { var c = reviewToCard(r); snapshot[r.question_id] = { box: c.box, seen: c.seen, wrong: c.wrong, due: c.due }; });

    var s = PFP.getState();
    mergeInto(s, cloud, reviews);
    applyState(s);

    // push merged state up (blob always; cards only where they differ from cloud)
    try { await SB.from("user_state").upsert({ user_id: uid, state: blobOf(s), updated_at: nowISO() }, { onConflict: "user_id" }); } catch (e) {}
    try { await pushCards(s.cards || {}, true); } catch (e) {}
    // attempts: on first-ever sync for this device, seed history only if the
    // account had none; afterwards just send genuinely new attempts.
    var firstSeed = initial && !isSeeded();
    try { markAttemptsSynced(await pushAttempts(s, firstSeed ? !cloudHadAttempts : true)); } catch (e) {}
    if (firstSeed) { markSeeded(); seededNow = true; }
    lastSummary = summary(s);
    statusCbs.forEach(function (cb) { try { cb(lastSummary); } catch (e) {} });
    try { window.dispatchEvent(new CustomEvent("pfp:synced", { detail: lastSummary })); } catch (e) {}
  }

  function summary(s) {
    var cards = s.cards || {};
    return { cards: Object.keys(cards).length, streak: s.streak || 0, best: s.bestStreak || 0,
      starred: Object.keys(s.starred || {}).length, achievements: Object.keys(s.achievements || {}).length,
      seededNow: seededNow };
  }

  /* Debounced incremental push after a local change. */
  function schedulePush() {
    if (applying) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { pushTimer = null; flush(); }, 1400);
  }
  async function flush() {
    if (!uid) return;
    var s = PFP.getState();
    try { await SB.from("user_state").upsert({ user_id: uid, state: blobOf(s), updated_at: nowISO() }, { onConflict: "user_id" }); } catch (e) {}
    try { await pushCards(s.cards || {}, true); } catch (e) {}
    try { markAttemptsSynced(await pushAttempts(s, true)); } catch (e) {}
  }

  /* Public: start syncing if signed in. Returns a promise that resolves after
     the first full sync. onReady(summary) fires then (and immediately if a
     sync has already completed). Idempotent — one in-flight sync is shared. */
  function start(onReady) {
    if (onReady) { statusCbs.push(onReady); if (lastSummary) { try { onReady(lastSummary); } catch (e) {} } }
    if (startPromise) return startPromise;
    startPromise = (async function () {
      var u; try { u = await PFPAuth.user(); } catch (e) { u = null; }
      if (!u) return;
      uid = u.id;
      await sync(true);
      PFP.onChange(schedulePush);
      window.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; } flush(); } });
      window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; } flush(); });
    })();
    return startPromise;
  }

  /* Render a live sync-status card into `host` (account / dashboard). */
  async function status(host) {
    if (!host) return;
    var u; try { u = await PFPAuth.user(); } catch (e) { u = null; }
    if (!u) return;
    var box = document.createElement("section");
    box.className = "card";
    box.style.cssText = "border:1.5px solid var(--accent);box-shadow:0 0 0 3px rgba(245,166,35,.12);";
    box.innerHTML = '<h2 style="margin:0 0 4px;">🔄 Syncing your progress…</h2>' +
      '<p class="sub" id="pfpSyncMsg" style="margin:0;">Bringing your on-device study into your account so it follows you across every device you sign in on.</p>';
    host.appendChild(box);
    start(function (sum) {
      box.querySelector("h2").textContent = "✓ Your progress is synced";
      box.querySelector("#pfpSyncMsg").innerHTML = "<strong>" + sum.cards + "</strong> question" + (sum.cards === 1 ? "" : "s") +
        " tracked · 🔥 " + sum.streak + "-day streak · ⭐ " + sum.starred + " starred · 🏅 " + sum.achievements +
        " achievement" + (sum.achievements === 1 ? "" : "s") + ". Sign in on any device to pick up right where you left off.";
    });
  }

  window.PFPSync = { start: start, status: status, flush: flush };

  // Auto-start on every page that loads this module (no-op when signed out).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { start(); });
  } else { start(); }
})();
