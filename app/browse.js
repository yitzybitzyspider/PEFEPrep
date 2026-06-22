/* PEFEPrep — Question Bank. Filter by day + topic + status + search; expand any
 * question to review in place; or launch the full review interface on the current
 * filter (a day / a topic / your misses / all). */
(function () {
  "use strict";
  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [], SCHED = { days: [] };
  var FILT = { day: "all", topic: "all", status: "all", q: "" };
  var $ = function (id) { return document.getElementById(id); };

  async function init() {
    try {
      ALL = await PFPDATA.load();
      try { SCHED = await (await fetch("./data/schedule.json", { cache: "no-store" })).json(); } catch (e) { SCHED = { days: [] }; }
      buildFilters(); wire(); render();
    } catch (e) { $("list").innerHTML = "<p class='sub'>Couldn’t load questions: " + e + "</p>"; }
  }

  function schedTopic(day) { var d = (SCHED.days || []).filter(function (x) { return x.day === day; })[0]; return d ? d.topic : "Day " + day; }
  function statusOf(q) { var c = PFP.getCard(q.id); if (!c) return "unseen"; if (c.box >= 4) return "mastered"; return "learning"; }
  function missed(q) { var c = PFP.getCard(q.id); return !!(c && c.wrong > 0); }

  function buildFilters() {
    var days = ALL.map(function (q) { return q.day; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    $("fDay").innerHTML = '<option value="all">All days</option>' + days.map(function (d) { return '<option value="' + d + '">Day ' + d + " — " + schedTopic(d) + "</option>"; }).join("");
    var topics = ALL.map(function (q) { return q.topic; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    $("fTopic").innerHTML = '<option value="all">All topics</option>' + topics.map(function (t) { return '<option value="' + t + '">' + t + "</option>"; }).join("");
  }

  function setSeg(name, val) {
    var s = document.querySelector('[data-seg="' + name + '"]');
    Array.prototype.forEach.call(s.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.v === val); });
  }

  function wire() {
    $("fDay").onchange = function (e) { FILT.day = e.target.value; render(); };
    $("fTopic").onchange = function (e) { FILT.topic = e.target.value; render(); };
    $("fSearch").oninput = function (e) { FILT.q = e.target.value.toLowerCase(); render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-seg="status"] button'), function (b) {
      b.onclick = function () { FILT.status = b.dataset.v; setSeg("status", b.dataset.v); render(); };
    });
    $("reviewBtn").onclick = launchReview;
  }

  function launchReview() {
    if (FILT.day !== "all") location.href = "./today.html?day=" + FILT.day;
    else if (FILT.topic !== "all") location.href = "./today.html?topic=" + encodeURIComponent(FILT.topic);
    else if (FILT.status === "missed") location.href = "./today.html?filter=missed";
    else location.href = "./today.html?all=1";
  }

  function matches(q) {
    if (FILT.day !== "all" && q.day !== Number(FILT.day)) return false;
    if (FILT.topic !== "all" && q.topic !== FILT.topic) return false;
    if (FILT.status === "missed") { if (!missed(q)) return false; }
    else if (FILT.status !== "all" && statusOf(q) !== FILT.status) return false;
    if (FILT.q) { var hay = (q.stem + " " + (q.concept || "") + " " + q.topic).toLowerCase(); if (hay.indexOf(FILT.q) < 0) return false; }
    return true;
  }

  function badge(q) {
    var st = statusOf(q);
    var label = { unseen: "Unseen", learning: "Learning", mastered: "Mastered" }[st];
    if (missed(q)) label += " · missed";
    return '<span class="bdg ' + st + '">' + label + "</span>";
  }

  function render() {
    var items = ALL.filter(matches);
    $("count").textContent = items.length + " of " + ALL.length + " questions";
    $("list").innerHTML = items.length ? items.map(function (q) {
      var hasOpts = Array.isArray(q.options) && q.options.length;
      var opts = hasOpts ? q.options.map(function (t, j) {
        return '<div class="opt' + (j === q.answer ? " correct" : "") + '"><span class="key">' + KEYS[j] + "</span><span>" + t + "</span></div>";
      }).join("") : '<div class="opt correct"><span class="key">✓</span><span>' + q.answer + "</span></div>";
      var eqs = (q.equations && q.equations.length)
        ? '<div class="eqbox" style="margin:4px 0 12px;"><h4>Equations</h4>' + q.equations.map(function (e) { return '<div class="eq">' + e + "</div>"; }).join("") + "</div>" : "";
      var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
      return '<div class="qcard">' +
        '<div class="qtop"><span class="topic-tag">Day ' + q.day + " · " + q.topic + "</span>" + badge(q) + "</div>" +
        '<div class="qstem">' + q.stem + "</div>" +
        '<button class="btn-ghost reveal">Show answer</button>' +
        '<div class="qans hide">' + eqs +
          '<div class="opts" style="margin:12px 0;">' + opts + "</div>" +
          '<div class="sol">' + q.solution + "</div>" + refs +
          '<div class="ref">Handbook: ' + q.handbook + "</div>" +
        "</div></div>";
    }).join("") : "<p class='sub'>No questions match these filters.</p>";

    Array.prototype.forEach.call($("list").querySelectorAll(".reveal"), function (b) {
      b.onclick = function () {
        var ans = b.parentNode.querySelector(".qans");
        var hidden = ans.classList.toggle("hide");
        b.textContent = hidden ? "Show answer" : "Hide answer";
        if (!hidden && window.renderMath) window.renderMath(ans);
      };
    });
    if (window.renderMath) window.renderMath($("list"));
  }

  window.addEventListener("DOMContentLoaded", init);
})();
