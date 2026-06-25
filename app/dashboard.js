/* PEFEPrep — dashboard: today's planned set + due spaced-repetition reviews,
 * answered live and recorded per-user to Supabase. */
(function () {
  "use strict";
  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var $ = function (id) { return document.getElementById(id); };
  var KA = {};

  async function init() {
    var u = await PFPAuth.require(); if (!u) return;
    var plan = await PFPUser.activePlan();
    if (!plan) { renderNoPlan(); return; }
    var areas = await PFP_SB.from("knowledge_areas").select("id,title");
    (areas.data || []).forEach(function (a) { KA[a.id] = a.title; });
    var allDays = await PFPUser.planDays(plan.id);
    await renderDay(plan, allDays, PFPDates.todayISO());
  }

  function renderNoPlan() {
    $("root").innerHTML = "<section class='card' style='text-align:center;'><h1>No active plan yet</h1>" +
      "<p class='sub'>Build a personalized training plan — a day-by-day schedule covering every exam area, counting down to your exam date.</p>" +
      "<div class='btn-row' style='justify-content:center;'><a class='btn-primary' href='./plan.html' style='text-decoration:none;'>Build my plan →</a></div></section>";
  }

  async function renderDay(plan, allDays, today) {
    var exam = plan.exam_date;
    var daysToExam = Math.max(0, Math.round((new Date(exam + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000));
    var todayDay = allDays.filter(function (d) { return d.date === today; })[0];
    var nextDay = todayDay || allDays.filter(function (d) { return d.date >= today; })[0] || allDays[allDays.length - 1];
    var preset = (plan.config && plan.config.preset) || plan.length_key;

    var strip = allDays.map(function (d) {
      return '<div class="scell ' + d.kind + (d.date === today ? " today" : "") + (d.date < today ? " done" : "") + '" title="' + d.date + " · " + d.label + '"></div>';
    }).join("");

    var head = '<section class="card"><div class="hero">' +
      '<div><div class="countbig">' + daysToExam + ' days to exam</div><div class="sub">' + preset + ' plan · exam ' + exam + '</div></div>' +
      '<div style="text-align:right;"><span class="kindtag kind-' + (nextDay ? nextDay.kind : "study") + '">' + (nextDay ? nextDay.label : "") + '</span><div class="sub" id="hstats">…</div></div>' +
      '</div><div class="strip">' + strip + '</div></section><div id="setarea"></div>';
    $("root").innerHTML = head;
    PFPUser.stats().then(function (s) { $("hstats").textContent = s.attempts + " answered · " + s.mastered + " mastered"; });

    var planIds = todayDay ? todayDay.question_ids.slice() : [];
    var due = await PFPUser.dueReviews(20);
    var dueIds = due.map(function (x) { return x.question_id; }).filter(function (id) { return planIds.indexOf(id) < 0; });

    if (todayDay && todayDay.kind === "exam") {
      $("setarea").innerHTML = '<section class="card" style="text-align:center;"><h1>★ Exam day — good luck!</h1><p class="sub">You put in the work. Go get it.</p></section>';
      return;
    }
    if (!todayDay && today < allDays[0].date) {
      $("setarea").innerHTML = '<section class="card"><h2>Your plan starts ' + allDays[0].date + '</h2><p class="sub">Nothing scheduled yet — warm up in the <a href="./bank-live.html">question bank</a> meanwhile.</p></section>';
      if (!dueIds.length) return;
    }
    if (!todayDay && !dueIds.length) {
      $("setarea").innerHTML = '<section class="card"><h2>Rest day 🎉</h2><p class="sub">No set scheduled and no reviews due. Browse the <a href="./bank-live.html">bank</a> if you want extra reps.</p></section>';
      return;
    }
    await renderSet(plan, todayDay, planIds, dueIds);
  }

  async function renderSet(plan, day, planIds, dueIds) {
    var allIds = planIds.concat(dueIds);
    var qs = await PFPUser.questionsByIds(allIds);
    var title = day ? day.label : "Spaced-repetition review";
    var sub = (day ? planIds.length + " planned" : "") + (dueIds.length ? (day ? " + " : "") + dueIds.length + " due review" + (dueIds.length > 1 ? "s" : "") : "");
    $("setarea").innerHTML = '<section class="card"><h2>' + title + '</h2>' +
      '<p class="sub"><span class="kindtag kind-' + (day ? day.kind : "study") + '">' + (day ? day.kind.replace("_", " ") : "review") + '</span> &nbsp;' + sub + '</p>' +
      '<div class="qprog" id="qprog"></div></section><div id="qlist"></div>';
    var done = 0;
    function prog() { $("qprog").textContent = done + " / " + qs.length + " answered this session"; }
    prog();
    $("qlist").innerHTML = qs.map(function (q, i) { return cardHtml(q, i, dueIds.indexOf(q.id) >= 0); }).join("");
    qs.forEach(function (q, i) { wireCard(q, i, day, function () { done++; prog(); }); });
    if (window.renderMath) window.renderMath($("qlist"));
  }

  function eqbox(q) {
    if (!q.equations || !q.equations.length) return "";
    return '<div class="eqbox" style="margin:4px 0 10px;"><h4>Equations</h4>' + q.equations.map(function (e) {
      var s = /^\s*\$/.test(e) ? e : ("$" + e + "$"); return '<div class="eq">' + s + "</div>";
    }).join("") + "</div>";
  }

  function cardHtml(q, i, isReview) {
    var hasOpts = Array.isArray(q.options) && q.options.length;
    var opts = hasOpts ? q.options.map(function (t, j) {
      return '<div class="opt pick" data-j="' + j + '"><span class="key">' + KEYS[j] + "</span><span>" + t + "</span></div>";
    }).join("") : "";
    return '<div class="qcard" data-i="' + i + '">' +
      '<div class="qtop"><span class="topic-tag">' + (KA[q.ka_id] || ("KA" + q.ka_id)) + "</span> " +
        (isReview ? '<span class="qtype" style="color:#ffd98a;border-color:rgba(245,166,35,.4);">↻ review</span> ' : "") +
        '<span class="qtype">' + q.type + "</span></div>" +
      (q.concept ? '<div class="qconcept" style="font-weight:600;margin:4px 0;">' + q.concept + "</div>" : "") +
      '<div class="qstem">' + q.stem + "</div>" +
      (hasOpts ? '<div class="opts" style="margin:12px 0;">' + opts + "</div>"
               : '<div class="qactions"><button class="btn-ghost reveal">Show answer</button></div>') +
      '<div class="qans hide">' + eqbox(q) +
        (hasOpts ? "" : '<div class="opt correct"><span class="key">✓</span><span>' + q.answer + "</span></div>") +
        '<div class="sol" style="margin-top:8px;">' + (q.solution || "") + "</div>" +
        '<div class="ref">Handbook: ' + (q.handbook || "—") + "</div>" +
        (hasOpts ? "" : '<div class="qactions"><button class="qact mk-got" data-r="1">✓ Got it</button><button class="qact mk-miss" data-r="0">✗ Missed</button></div>') +
      "</div></div>";
  }

  function wireCard(q, i, day, onDone) {
    var card = document.querySelector('.qcard[data-i="' + i + '"]');
    if (!card) return;
    var answered = false;
    var hasOpts = Array.isArray(q.options) && q.options.length;
    async function record(correct, chosen) {
      if (answered) return; answered = true; onDone();
      try {
        await PFPUser.recordAttempt({ question_id: q.id, correct: correct, chosen: (chosen == null ? null : chosen), plan_day_id: (day ? day.id : null), source: (day ? (day.kind === "study" ? "plan" : "exam") : "bank") });
      } catch (e) { /* offline / RLS — silent */ }
    }
    if (hasOpts) {
      Array.prototype.forEach.call(card.querySelectorAll(".opt.pick"), function (o) {
        o.onclick = function () {
          if (answered) return;
          var j = Number(o.dataset.j), correct = (j === q.answer);
          Array.prototype.forEach.call(card.querySelectorAll(".opt.pick"), function (x) { x.classList.remove("pick"); });
          o.classList.add(correct ? "correct" : "wrong");
          if (!correct) { var rc = card.querySelectorAll(".opt")[q.answer]; if (rc) rc.classList.add("correct"); }
          var ans = card.querySelector(".qans"); ans.classList.remove("hide");
          if (window.renderMath) window.renderMath(ans);
          record(correct, j);
        };
      });
    } else {
      card.querySelector(".reveal").onclick = function () {
        var a = card.querySelector(".qans"); var h = a.classList.toggle("hide");
        this.textContent = h ? "Show answer" : "Hide answer";
        if (!h && window.renderMath) window.renderMath(a);
      };
      Array.prototype.forEach.call(card.querySelectorAll(".mk-got,.mk-miss"), function (b) {
        b.onclick = function () { if (answered) return; b.classList.add("on"); record(b.dataset.r === "1", null); };
      });
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
