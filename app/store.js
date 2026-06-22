/* PEFEPrep shared store — all user state in localStorage (PRD v1, single-device).
 * Owns: settings, Leitner spaced-repetition cards, attempts, streak, history.
 * Exposed as window.PFP.
 */
window.PFP = (function () {
  "use strict";

  var STORE = "pefeprep_v1";
  var DEFAULTS = {
    dailySize: 20,        // F7.1 cap on the daily set
    mixNew: 12,           // F1.2 new vs review split (rest of dailySize is review)
    srs: true,            // F4 spaced repetition on/off
    revealMode: "manual", // "manual" | "auto" (F2.2)
    examDate: "2026-07-08"
  };
  // Leitner box -> days until due. Box 0 = brand new.
  var BOX_DAYS = [0, 1, 3, 7, 16, 35];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(STORE, JSON.stringify(s)); }

  function getSettings() {
    var s = load();
    return Object.assign({}, DEFAULTS, s.settings || {});
  }
  function setSetting(k, v) {
    var s = load();
    s.settings = Object.assign({}, DEFAULTS, s.settings || {});
    s.settings[k] = v;
    save(s);
  }

  function today() { return new Date().toISOString().slice(0, 10); }
  function addDays(dStr, n) {
    var dt = new Date(dStr + "T00:00:00");
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  }

  /* Record a result for a question and reschedule its Leitner card. */
  function recordResult(id, correct, topic) {
    var s = load();
    s.cards = s.cards || {};
    var c = s.cards[id] || { box: 0, due: today(), seen: 0, right: 0, wrong: 0, topic: topic };
    c.seen++;
    if (topic) c.topic = topic;
    if (correct) { c.right++; c.box = Math.min((c.box || 0) + 1, 5); }
    else { c.wrong++; c.box = 1; }
    c.due = addDays(today(), BOX_DAYS[c.box]);
    c.last = today();
    s.cards[id] = c;
    s.attempts = s.attempts || [];
    s.attempts.push({ id: id, correct: correct, topic: topic, date: today() });
    if (s.attempts.length > 2000) s.attempts = s.attempts.slice(-2000);
    save(s);
  }

  /* Compose today's set: interleave due reviews + new, capped at dailySize. */
  function buildDailySet(all) {
    var s = load();
    var set = getSettings();
    s.cards = s.cards || {};
    var t = today();

    if (!set.srs) return all.slice(0, Math.min(set.dailySize, all.length));

    var due = all.filter(function (q) { var c = s.cards[q.id]; return c && c.due <= t; });
    var unseen = all.filter(function (q) { return !s.cards[q.id]; });

    var reviewQuota = Math.max(0, set.dailySize - set.mixNew);
    var review = due.slice(0, reviewQuota);
    var news = unseen.slice(0, set.dailySize - review.length);
    var out = review.concat(news);

    if (out.length < set.dailySize) {
      var extra = due.slice(review.length).concat(unseen.slice(news.length));
      extra = extra.filter(function (q) { return out.indexOf(q) < 0; });
      out = out.concat(extra.slice(0, set.dailySize - out.length));
    }
    // Nothing new and nothing due: fall back to the soonest-due items so there's always a set.
    if (out.length === 0) {
      out = all.slice().sort(function (a, b) {
        var ca = s.cards[a.id], cb = s.cards[b.id];
        var da = ca ? ca.due : "9999", db = cb ? cb.due : "9999";
        return da < db ? -1 : da > db ? 1 : 0;
      }).slice(0, Math.min(set.dailySize, all.length));
    }
    return out;
  }

  /* Per-section mastery from Leitner boxes: coverage x depth. */
  function sectionMastery(all) {
    var s = load();
    s.cards = s.cards || {};
    var by = {};
    all.forEach(function (q) {
      var k = q.topic || "—";
      by[k] = by[k] || { total: 0, seen: 0, boxSum: 0, mastered: 0 };
      by[k].total++;
      var c = s.cards[q.id];
      if (c) {
        by[k].seen++;
        by[k].boxSum += c.box;
        if (c.box >= 4) by[k].mastered++;
      }
    });
    Object.keys(by).forEach(function (k) {
      var v = by[k];
      var coverage = v.total ? v.seen / v.total : 0;
      var depth = v.seen ? (v.boxSum / v.seen) / 5 : 0;
      v.readiness = Math.round(coverage * depth * 100);
      v.level = v.readiness >= 70 ? "green" : v.readiness >= 35 ? "amber" : "red";
    });
    return by;
  }

  function completeDay(known, total) {
    var s = load();
    var t = today();
    if (s.lastCompleted !== t) {
      var y = addDays(t, -1);
      s.streak = (s.lastCompleted === y) ? (s.streak || 0) + 1 : 1;
      s.lastCompleted = t;
    }
    s.history = s.history || {};
    s.history[t] = { known: known, total: total };
    save(s);
    return s.streak;
  }

  function getStreak() { return load().streak || 0; }
  function isDoneToday() { return load().lastCompleted === today(); }
  function getHistory() { return load().history || {}; }
  function daysToExam() {
    var set = getSettings();
    return Math.max(0, Math.ceil((new Date(set.examDate + "T00:00:00") - new Date()) / 86400000));
  }
  function getCard(id) { var s = load(); return (s.cards || {})[id] || null; }
  function resetAll() { localStorage.removeItem(STORE); }

  /* "My List" — questions you've starred to study together. */
  function getStarred() { var s = load(); return Object.keys(s.starred || {}); }
  function isStarred(id) { var s = load(); return !!(s.starred && s.starred[id]); }
  function toggleStar(id) {
    var s = load(); s.starred = s.starred || {};
    if (s.starred[id]) delete s.starred[id]; else s.starred[id] = true;
    save(s); return !!s.starred[id];
  }
  function setStar(id, on) {
    var s = load(); s.starred = s.starred || {};
    if (on) s.starred[id] = true; else delete s.starred[id];
    save(s);
  }
  function starredCount() { return getStarred().length; }

  return {
    DEFAULTS: DEFAULTS,
    getSettings: getSettings, setSetting: setSetting,
    recordResult: recordResult, buildDailySet: buildDailySet,
    sectionMastery: sectionMastery, completeDay: completeDay,
    getStreak: getStreak, isDoneToday: isDoneToday, getHistory: getHistory,
    daysToExam: daysToExam, today: today, resetAll: resetAll, getCard: getCard,
    getStarred: getStarred, isStarred: isStarred, toggleStar: toggleStar,
    setStar: setStar, starredCount: starredCount
  };
})();
