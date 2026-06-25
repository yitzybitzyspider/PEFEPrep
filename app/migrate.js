/* PEFEPrep — one-time import of on-device (localStorage) progress into the
 * signed-in Supabase account. Carries the Leitner spaced-repetition state
 * (cards -> review_state) and the attempt history (attempts -> attempts), so a
 * student who studied signed-out keeps their progress once they sign in.
 *
 * Safe to run more than once and across devices:
 *  - review_state: only adds questions NOT already started in the account
 *    (never clobbers in-account progress);
 *  - attempts: only seeds the log when the account has none yet
 *    (so re-runs / a second device can't double-count stats).
 * Requires sb.js (PFP_SB, PFPAuth, PFPUser) loaded first. */
(function () {
  "use strict";
  var LS = "pefeprep_v1";

  function local() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function nowISO() { return new Date().toISOString(); }
  function isDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ""); }
  function dateToTs(d) { return isDate(d) ? d + "T12:00:00Z" : nowISO(); }
  function clampBox(b) { b = b || 0; return b < 1 ? 1 : b > 5 ? 5 : b; }
  function syncedKey(uid) { return "pefeprep_synced_" + uid; }
  function alreadySynced(uid) { try { return !!localStorage.getItem(syncedKey(uid)); } catch (e) { return false; } }

  /* What's available on this device to import. */
  function summary() {
    var s = local(), cards = s.cards || {};
    var seen = Object.keys(cards).filter(function (id) { return cards[id] && cards[id].seen > 0; });
    return {
      cards: seen.length,
      attempts: Array.isArray(s.attempts) ? s.attempts.length : 0,
      streak: s.streak || 0, best: s.bestStreak || 0,
      starred: Object.keys(s.starred || {}).length
    };
  }

  async function run() {
    var SB = window.PFP_SB;
    var user = await window.PFPAuth.user();
    if (!SB || !user) throw new Error("not signed in");
    var uid = user.id;
    var s = local(), cards = s.cards || {};

    // --- review_state: add only questions not already started in the account ---
    var ids = Object.keys(cards).filter(function (id) { return cards[id] && cards[id].seen > 0; });
    var existing = {};
    for (var i = 0; i < ids.length; i += 300) {
      var r = await SB.from("review_state").select("question_id").in("question_id", ids.slice(i, i + 300));
      if (r.error) throw r.error;
      (r.data || []).forEach(function (x) { existing[x.question_id] = 1; });
    }
    var rsRows = ids.filter(function (id) { return !existing[id]; }).map(function (id) {
      var c = cards[id];
      return {
        user_id: uid, question_id: id, box: clampBox(c.box),
        attempts: c.seen || 0, wrong: c.wrong || 0,
        due_date: isDate(c.due) ? c.due : null,
        last_seen: dateToTs(c.last)
      };
    });
    var reviewImported = 0;
    for (var j = 0; j < rsRows.length; j += 200) {
      var chunk = rsRows.slice(j, j + 200);
      var er = await SB.from("review_state").upsert(chunk, { onConflict: "user_id,question_id" });
      if (er.error) throw er.error;
      reviewImported += chunk.length;
    }

    // --- attempts: seed the log only if the account has none yet ---
    var attemptsImported = 0, hadAttempts = false;
    var ac = await SB.from("attempts").select("id", { count: "exact", head: true });
    if ((ac.count || 0) > 0) {
      hadAttempts = true;
    } else {
      var log = Array.isArray(s.attempts) ? s.attempts : [];
      var aRows = log.filter(function (a) { return a && a.id; }).map(function (a) {
        return { user_id: uid, question_id: a.id, correct: !!a.correct, source: "import", created_at: dateToTs(a.date) };
      });
      for (var k = 0; k < aRows.length; k += 200) {
        var chunkA = aRows.slice(k, k + 200);
        var ir = await SB.from("attempts").insert(chunkA);
        if (ir.error) throw ir.error;
        attemptsImported += chunkA.length;
      }
    }

    // --- carry the on-device exam date into the profile if set ---
    try {
      if (s.settings && isDate(s.settings.examDate)) {
        await window.PFPUser.saveProfile({ exam_date: s.settings.examDate });
      }
    } catch (e) { /* non-fatal */ }

    try { localStorage.setItem(syncedKey(uid), nowISO()); } catch (e) {}
    return {
      reviewImported: reviewImported,
      skippedExisting: ids.length - rsRows.length,
      attemptsImported: attemptsImported, hadAttempts: hadAttempts
    };
  }

  /* Render a one-click import banner into `host` when there's local progress to
     import that hasn't been synced to this account on this device yet. */
  async function banner(host, onDone) {
    if (!host) return;
    var user = await window.PFPAuth.user(); if (!user) return;
    var sum = summary();
    if (alreadySynced(user.id) || (!sum.cards && !sum.attempts)) return;

    var box = document.createElement("section");
    box.className = "card";
    box.style.cssText = "border:1.5px solid var(--accent);box-shadow:0 0 0 3px rgba(245,166,35,.12);";
    box.innerHTML =
      '<h2 style="margin:0 0 4px;">📥 Sync your on-device progress</h2>' +
      '<p class="sub" style="margin:0 0 12px;max-width:60ch;">We found <strong>' + sum.cards +
        '</strong> question' + (sum.cards === 1 ? "" : "s") + ' of study progress saved on this device' +
        (sum.attempts ? ' (' + sum.attempts + ' attempt' + (sum.attempts === 1 ? "" : "s") + ')' : '') +
        '. Import it into your account so your spaced-repetition reviews and stats are part of your synced plan.</p>' +
      '<div class="btn-row"><button class="btn-primary" id="pfpDoImport">Import my progress →</button>' +
      '<span class="sub" id="pfpImportMsg"></span></div>';
    host.appendChild(box);

    var btn = box.querySelector("#pfpDoImport"), msg = box.querySelector("#pfpImportMsg");
    btn.onclick = async function () {
      btn.disabled = true; btn.textContent = "Importing…"; msg.textContent = "";
      try {
        var res = await run();
        box.querySelector("h2").textContent = "✓ Progress synced to your account";
        box.querySelector("p").innerHTML = "Imported <strong>" + res.reviewImported + "</strong> review card" +
          (res.reviewImported === 1 ? "" : "s") +
          (res.attemptsImported ? " and " + res.attemptsImported + " attempt" + (res.attemptsImported === 1 ? "" : "s") : "") +
          (res.skippedExisting ? " (" + res.skippedExisting + " already in your account)" : "") +
          ". Your synced reviews are ready.";
        btn.style.display = "none";
        if (onDone) onDone(res);
      } catch (e) {
        btn.disabled = false; btn.textContent = "Import my progress →";
        msg.textContent = "Couldn't import — " + (e.message || "please try again.");
      }
    };
  }

  window.PFPMigrate = { summary: summary, run: run, banner: banner, alreadySynced: alreadySynced };
})();
