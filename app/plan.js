/* PEFEPrep — plan picker: choose a length, preview the schedule, commit it. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var pool = null, profile = null, generated = null;

  async function init() {
    var u = await PFPAuth.require(); if (!u) return;
    profile = await PFPUser.getProfile();
    var exam = (profile && profile.exam_date) || "2026-07-08";
    var today = PFPDates.todayISO();
    var daysToExam = Math.round((new Date(exam + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    if (daysToExam < 1) {
      $("intro").innerHTML = "Your exam date (" + exam + ") is today or past. Update it on your <a href='./account.html'>account</a> to build a plan.";
      return;
    }
    var rec = recommendedKey(daysToExam);
    var head = "Exam date <b style='color:var(--ink)'>" + exam + "</b> — <b style='color:var(--ink)'>" + daysToExam + " day" + (daysToExam === 1 ? "" : "s") + " away</b>. ";
    head += (daysToExam <= 16)
      ? "With under two weeks left, every plan runs those " + daysToExam + " days — the choice is how hard to push. "
      : "Each plan counts down to your exam. ";
    head += "All cover the 15 areas in exam proportions, with a weekly mini-exam and a final mock. Recommended: <b style='color:var(--accent)'>" + PFPPlan.PRESETS[rec].label + "</b>.";
    $("intro").innerHTML = head;
    renderCards(daysToExam, exam, today, rec);
  }

  function intensity(daily) {
    return daily >= 24 ? ["intense", "Intense"] : daily >= 20 ? ["heavy", "Heavy"] : daily >= 17 ? ["mod", "Moderate"] : ["light", "Light"];
  }
  // Smallest preset that still fits the time before the exam (least compression); else the longest.
  function recommendedKey(daysToExam) {
    var P = PFPPlan.PRESETS, keys = Object.keys(P);
    var fit = keys.filter(function (k) { return P[k].days >= daysToExam; }).sort(function (a, b) { return P[a].days - P[b].days; });
    return fit[0] || keys[keys.length - 1];
  }

  function renderCards(daysToExam, exam, today, rec) {
    var P = PFPPlan.PRESETS;
    $("plans").innerHTML = Object.keys(P).map(function (k) {
      var p = P[k], eff = Math.min(p.days, daysToExam), tot = eff * p.daily, it = intensity(p.daily), w = Math.min(100, Math.round(p.daily / 28 * 100));
      return '<div class="plancard' + (k === rec ? " on" : "") + '" data-k="' + k + '">' +
        (k === rec ? '<span class="rec">RECOMMENDED</span>' : "") +
        '<div class="pname">' + p.label + '</div>' +
        '<div class="pbig">' + p.daily + ' <small>Q/day</small></div>' +
        '<span class="itag ' + it[0] + '">' + it[1] + '</span>' +
        '<div class="pmeta">' + eff + ' study days · ~' + tot + ' questions</div>' +
        '<div class="ibar"><div style="width:' + w + '%"></div></div></div>';
    }).join("");
    Array.prototype.forEach.call($("plans").children, function (c) {
      c.onclick = function () {
        Array.prototype.forEach.call($("plans").children, function (x) { x.classList.toggle("on", x === c); });
        select(c.dataset.k, exam, today);
      };
    });
    select(rec, exam, today); // show a preview immediately
  }

  async function select(k, exam, today) {
    $("commitMsg").textContent = "";
    if (!pool) { $("intro").textContent += "  (loading question pool…)"; pool = await PFPUser.questionPool(); }
    var p = PFPPlan.PRESETS[k];
    generated = PFPPlan.generate({ pool: pool, examDate: exam, today: today, lengthDays: p.days, dailyTarget: p.daily });
    generated._key = k;
    renderPreview(p);
  }

  function renderPreview(p) {
    $("preview").style.display = "";
    var studyDays = generated.days.filter(function (d) { return d.kind === "study"; }).length;
    var minis = generated.days.filter(function (d) { return d.kind === "mini_exam"; }).length;
    var totalQ = generated.days.reduce(function (s, d) { return s + d.question_ids.length; }, 0);
    $("pvTitle").textContent = p.label + " plan — " + generated.length_days + " study days";
    $("pvSub").textContent = "Starts " + generated.start_date + " · " + studyDays + " study days · " + minis + " weekly mini-exams · final mock · " + totalQ + " total question-slots.";
    $("sched").innerHTML = generated.days.map(function (d) {
      var lbl = d.kind === "exam" ? "★" : d.kind === "final_mock" ? "M" : d.kind === "mini_exam" ? "Q" : (d.day_index + 1);
      return '<div class="cell ' + d.kind + '" title="' + d.date + " · " + d.label + '">' + lbl + "</div>";
    }).join("");
    $("commit").disabled = false;
    $("commit").onclick = commit;
  }

  async function commit() {
    $("commit").disabled = true; $("commitMsg").textContent = "Saving…";
    var P = PFPPlan.PRESETS[generated._key];
    try {
      await PFPUser.createPlan({
        length_key: generated._key, length_days: generated.length_days,
        start_date: generated.start_date, exam_date: generated.exam_date,
        daily_target: generated.daily_target, config: { preset: P.label }
      }, generated.days);
      $("commitMsg").textContent = "Done ✓ Opening your dashboard…";
      location.href = "./dashboard.html";
    } catch (e) { $("commitMsg").textContent = "Error: " + (e.message || e); $("commit").disabled = false; }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
