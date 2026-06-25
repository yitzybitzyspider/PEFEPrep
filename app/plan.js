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
    $("intro").textContent = "Exam date: " + exam + " (" + daysToExam + " days away). Pick a length — it counts down to your exam, covers all 15 areas in exam proportions, with weekly mini-exams and a final 110-question mock.";
    renderCards(daysToExam, exam, today);
  }

  function renderCards(daysToExam, exam, today) {
    var P = PFPPlan.PRESETS, html = "";
    Object.keys(P).forEach(function (k) {
      var p = P[k], eff = Math.min(p.days, daysToExam), tight = p.days > daysToExam;
      html += '<div class="plancard' + (tight ? " tight" : "") + '" data-k="' + k + '">' +
        '<div class="len">' + p.label + '</div>' +
        '<div class="meta">~' + p.daily + ' Q/day</div>' +
        '<div class="meta">' + (tight ? "compresses to " + eff + "d" : p.days + " days") + '</div></div>';
    });
    $("plans").innerHTML = html;
    Array.prototype.forEach.call($("plans").children, function (c) {
      c.onclick = function () {
        Array.prototype.forEach.call($("plans").children, function (x) { x.classList.toggle("on", x === c); });
        select(c.dataset.k, exam, today);
      };
    });
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
