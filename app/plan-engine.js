/* PEFEPrep — training-plan generator.
 * Pure function: given the question pool + exam date + chosen length, it builds a
 * day-by-day schedule that (a) covers every KA in official FE-Environmental exam
 * proportions, (b) drops a weekly mini-exam at the end of each week, and (c) ends
 * with a full 110-question mock the day before the exam. The schedule counts down
 * TO the exam date: a shorter plan simply starts closer to exam day.
 * Spaced-repetition resurfacing of missed questions is layered on at run time
 * (see app/sb.js dueReviews) — this file lays down the fixed coverage backbone. */
(function () {
  "use strict";
  // Per-exam KA exam-weight proportions from app/config.js (FE-Environmental
  // question-count midpoints, sum ≈ 127). Fallback keeps the engine working alone.
  var WEIGHTS = (window.APP_CONFIG && window.APP_CONFIG.kaWeights) ||
    { 1: 6.5, 2: 5, 3: 6.5, 4: 6.5, 5: 9, 6: 9, 7: 5, 8: 15, 9: 4, 10: 11.5, 11: 10, 12: 15, 13: 10, 14: 9, 15: 5 };

  function iso(d) { return d.toISOString().slice(0, 10); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* opts: { pool:[{id,ka_id}], examDate:'YYYY-MM-DD', today:'YYYY-MM-DD', lengthDays:int, dailyTarget:int } */
  function generatePlan(opts) {
    var exam = new Date(opts.examDate + "T00:00:00");
    var now = new Date((opts.today || iso(new Date())) + "T00:00:00");
    var dailyTarget = opts.dailyTarget || 20;

    // Window counts down to the exam: start = exam - lengthDays, but never before today.
    var start = new Date(exam); start.setDate(start.getDate() - opts.lengthDays);
    if (start < now) start = new Date(now);
    var lastStudy = new Date(exam); lastStudy.setDate(lastStudy.getDate() - 1); // exam day itself is the exam

    var dates = [];
    for (var d = new Date(start); d <= lastStudy; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
    if (!dates.length) dates.push(new Date(now)); // exam is today/past — degenerate 1-day plan

    // Pool grouped by KA, shuffled; a per-KA cursor cycles (and reuses for reinforcement).
    var byKa = {}, qka = {};
    opts.pool.forEach(function (q) { (byKa[q.ka_id] = byKa[q.ka_id] || []).push(q.id); qka[q.id] = q.ka_id; });
    Object.keys(byKa).forEach(function (k) { shuffle(byKa[k]); });
    var cursor = {}; Object.keys(byKa).forEach(function (k) { cursor[k] = 0; });
    var kas = Object.keys(WEIGHTS).map(Number).filter(function (k) { return byKa[k] && byKa[k].length; });
    var totalW = kas.reduce(function (s, k) { return s + WEIGHTS[k]; }, 0);

    function nextFor(ka) { var arr = byKa[ka]; if (!arr || !arr.length) return null; var id = arr[cursor[ka] % arr.length]; cursor[ka]++; return id; }
    // Largest-remainder interleave: pulls n ids in KA-proportional order, persisting the cursor across days.
    var acc = {}; kas.forEach(function (k) { acc[k] = 0; });
    function weightedPull(n) {
      var out = [];
      var guard = 0;
      while (out.length < n && guard < n * 4) {
        guard++;
        kas.forEach(function (k) { acc[k] += WEIGHTS[k] / totalW; });
        var best = kas[0]; kas.forEach(function (k) { if (acc[k] > acc[best]) best = k; });
        acc[best] -= 1;
        var id = nextFor(best);
        if (id) out.push(id);
      }
      return out;
    }
    function kaBreakdown(ids) { var m = {}; ids.forEach(function (id) { var k = qka[id]; m[k] = (m[k] || 0) + 1; }); return m; }

    var days = [];
    dates.forEach(function (dt, i) {
      var isLast = (i === dates.length - 1);
      var isWeekEnd = ((i + 1) % 7 === 0);
      var kind = "study", label = "Study set", qids;
      if (isLast) { kind = "final_mock"; label = "Final mock exam"; qids = weightedPull(Math.min(110, opts.pool.length)); }
      else if (isWeekEnd) { kind = "mini_exam"; label = "Weekly mini-exam"; qids = weightedPull(28); }
      else { kind = "study"; qids = weightedPull(dailyTarget); }
      days.push({ day_index: i, date: iso(dt), kind: kind, label: label, question_ids: qids, meta: { ka: kaBreakdown(qids), count: qids.length } });
    });
    // Exam day marker (no questions).
    days.push({ day_index: dates.length, date: iso(exam), kind: "exam", label: "EXAM DAY — good luck!", question_ids: [], meta: {} });

    return {
      start_date: iso(start),
      exam_date: opts.examDate,
      length_days: dates.length,
      daily_target: dailyTarget,
      days: days
    };
  }

  // Recommended daily intensity by plan length (shorter plan → heavier days).
  var PRESETS = {
    "2w": { label: "2 weeks", days: 14, daily: 26 },
    "1m": { label: "1 month", days: 30, daily: 22 },
    "6w": { label: "6 weeks", days: 42, daily: 20 },
    "2m": { label: "2 months", days: 60, daily: 17 },
    "3m": { label: "3 months", days: 90, daily: 15 }
  };

  window.PFPPlan = { generate: generatePlan, PRESETS: PRESETS, WEIGHTS: WEIGHTS };
})();
