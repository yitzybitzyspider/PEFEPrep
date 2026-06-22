/* PEFEPrep shared store — all user state in localStorage (PRD v1, single-device).
 * Owns: settings, Leitner spaced-repetition cards, attempts, daily goal + streak
 * (with weekly grace) + best streak, achievements, and engagement (focus/leaves).
 * Exposed as window.PFP.
 */
window.PFP = (function () {
  "use strict";

  var STORE = "pefeprep_v1";
  var DEFAULTS = {
    dailySize: 20,        // F7.1 cap on the daily set
    mixNew: 12,           // F1.2 new vs review split (rest of dailySize is review)
    dailyGoal: 20,        // questions/day to keep the streak alive
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
  function dayDiff(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }

  /* Advance the streak for today. One missed day per week is forgiven (grace). */
  function streakTouch(s) {
    var t = today();
    if (s.streakDay === t) return;
    var last = s.streakDay;
    if (!last) { s.streak = 1; }
    else {
      var gap = dayDiff(last, t);
      if (gap <= 1) s.streak = (s.streak || 0) + 1;
      else if (gap === 2 && (!s.lastGrace || dayDiff(s.lastGrace, t) >= 7)) { s.streak = (s.streak || 0) + 1; s.lastGrace = t; s.graceDay = t; }
      else s.streak = 1;
    }
    s.streakDay = t;
    s.bestStreak = Math.max(s.bestStreak || 0, s.streak || 0);
  }

  /* Record a result for a question: reschedule its Leitner card, log the attempt,
     count it toward today's goal, and bump the streak when the goal is reached.
     Returns { goalJustMet, answered, goal }. */
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

    s.daily = s.daily || {};
    var t = today();
    var dd = s.daily[t] || { ids: {}, goalMet: false };
    dd.ids[id] = !!correct;
    var goal = Object.assign({}, DEFAULTS, s.settings || {}).dailyGoal;
    var answered = Object.keys(dd.ids).length;
    var goalJustMet = false;
    if (!dd.goalMet && answered >= goal) { dd.goalMet = true; goalJustMet = true; }
    s.daily[t] = dd;
    if (goalJustMet) streakTouch(s);

    save(s);
    return { goalJustMet: goalJustMet, answered: answered, goal: goal };
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

  /* Mark today's daily set finished (credits the streak even if under the goal). */
  function completeDay(known, total) {
    var s = load();
    var t = today();
    s.daily = s.daily || {};
    var dd = s.daily[t] || { ids: {}, goalMet: false };
    if (!dd.goalMet) { dd.goalMet = true; s.daily[t] = dd; streakTouch(s); }
    save(s);
    return s.streak || 0;
  }
  function notePerfectSet() { var s = load(); s.perfectSets = (s.perfectSets || 0) + 1; save(s); }

  function getStreak() { return load().streak || 0; }
  function getBestStreak() { return load().bestStreak || 0; }
  function getDailyGoal() { return getSettings().dailyGoal; }
  function getAnsweredToday() { var dd = (load().daily || {})[today()]; return dd ? Object.keys(dd.ids).length : 0; }
  function isGoalMetToday() { var dd = (load().daily || {})[today()]; return !!(dd && dd.goalMet); }
  function isDoneToday() { return isGoalMetToday(); }
  function getHistory() { return load().daily || {}; }
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

  /* ---- Engagement: focused time + how often you leave (per day) ---- */
  function engToday(s) { s.engagement = s.engagement || {}; var t = today(); return (s.engagement[t] = s.engagement[t] || { focusMs: 0, leaves: 0 }); }
  function bumpFocus(ms) { if (!(ms > 0)) return; var s = load(); engToday(s).focusMs += ms; save(s); }
  function bumpLeave() { var s = load(); engToday(s).leaves++; save(s); }
  function getEngagement(date) { var s = load(); return (s.engagement || {})[date || today()] || { focusMs: 0, leaves: 0 }; }
  function focusMinutesToday() { return Math.round(getEngagement().focusMs / 60000); }
  function leavesToday() { return getEngagement().leaves; }
  function focusMinutes(date) { return Math.round(getEngagement(date).focusMs / 60000); }

  /* ---- Achievements ---- */
  var ACHIEVEMENTS = [
    { id: "first_day", icon: "👟", title: "First Day Done", desc: "Hit your daily goal once.", test: function (m) { return m.goalEver; } },
    { id: "streak_3", icon: "🔥", title: "On a Roll", desc: "Reach a 3-day streak.", test: function (m) { return m.best >= 3; } },
    { id: "streak_7", icon: "🗓️", title: "Week Warrior", desc: "Reach a 7-day streak.", test: function (m) { return m.best >= 7; } },
    { id: "streak_14", icon: "⚡", title: "Fortnight", desc: "Reach a 14-day streak.", test: function (m) { return m.best >= 14; } },
    { id: "seen_50", icon: "📚", title: "Half-Century", desc: "See 50 different questions.", test: function (m) { return m.seen >= 50; } },
    { id: "seen_all", icon: "🧭", title: "Full Sweep", desc: "See every question in the bank.", test: function (m) { return m.total > 0 && m.seen >= m.total; } },
    { id: "perfect", icon: "💯", title: "Flawless", desc: "Finish a set with a perfect score.", test: function (m) { return m.perfect > 0; } },
    { id: "section", icon: "🟢", title: "Section Cleared", desc: "Take a section to exam-ready (70%+).", test: function (m) { return m.green >= 1; } },
    { id: "five_sections", icon: "🏅", title: "Specialist", desc: "Get 5 sections exam-ready.", test: function (m) { return m.green >= 5; } },
    { id: "focus_30", icon: "⏱️", title: "Locked In", desc: "30 minutes of focused study in a day.", test: function (m) { return m.focusMax >= 30 * 60000; } },
    { id: "comeback", icon: "🔁", title: "Comeback", desc: "Re-master everything you'd missed.", test: function (m) { return m.everMissed >= 5 && m.notMastered === 0; } }
  ];

  function metrics(all) {
    var s = load(), cards = s.cards || {};
    var seen = 0, everMissed = 0, notMastered = 0;
    Object.keys(cards).forEach(function (id) {
      var c = cards[id];
      if (c.seen > 0) seen++;
      if (c.wrong > 0) { everMissed++; if (c.box < 4) notMastered++; }
    });
    var green = 0;
    if (all && all.length) { var m = sectionMastery(all); Object.keys(m).forEach(function (k) { if (m[k].level === "green") green++; }); }
    var fm = 0, e = s.engagement || {}; Object.keys(e).forEach(function (k) { if (e[k].focusMs > fm) fm = e[k].focusMs; });
    return {
      goalEver: !!s.streakDay, best: s.bestStreak || 0, seen: seen, total: all ? all.length : 0,
      perfect: s.perfectSets || 0, green: green, everMissed: everMissed, notMastered: notMastered, focusMax: fm
    };
  }

  /* Unlock any newly-earned achievements; returns the list of just-unlocked ones. */
  function checkAchievements(all) {
    var s = load();
    s.achievements = s.achievements || {};
    var m = metrics(all), newly = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (!s.achievements[a.id] && a.test(m)) { s.achievements[a.id] = today(); newly.push(a); }
    });
    if (newly.length) save(s);
    return newly;
  }
  function getAchievements() {
    var got = load().achievements || {};
    return ACHIEVEMENTS.map(function (a) { return { id: a.id, icon: a.icon, title: a.title, desc: a.desc, unlocked: !!got[a.id], date: got[a.id] || null }; });
  }

  return {
    DEFAULTS: DEFAULTS,
    getSettings: getSettings, setSetting: setSetting,
    recordResult: recordResult, buildDailySet: buildDailySet,
    sectionMastery: sectionMastery, completeDay: completeDay, notePerfectSet: notePerfectSet,
    getStreak: getStreak, getBestStreak: getBestStreak, isDoneToday: isDoneToday, getHistory: getHistory,
    getDailyGoal: getDailyGoal, getAnsweredToday: getAnsweredToday, isGoalMetToday: isGoalMetToday,
    daysToExam: daysToExam, today: today, resetAll: resetAll, getCard: getCard,
    getStarred: getStarred, isStarred: isStarred, toggleStar: toggleStar, setStar: setStar, starredCount: starredCount,
    bumpFocus: bumpFocus, bumpLeave: bumpLeave, getEngagement: getEngagement,
    focusMinutesToday: focusMinutesToday, leavesToday: leavesToday, focusMinutes: focusMinutes,
    checkAchievements: checkAchievements, getAchievements: getAchievements
  };
})();
