/* PEFEPrep — Question bank / browse (F6). Filter by topic + status, search,
 * expand to hide/reveal answer + solution + Handbook ref + references. */
(function () {
  "use strict";
  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [];
  var FILT = { topic: "all", status: "all", q: "" };
  var $ = function (id) { return document.getElementById(id); };

  async function init() {
    try {
      var res = await fetch("./data/questions.json", { cache: "no-store" });
      var data = await res.json();
      ALL = data.questions || [];
      buildTopicFilter();
      wire();
      render();
    } catch (e) {
      $("list").innerHTML = "<p class='sub'>Couldn’t load questions: " + e + "</p>";
    }
  }

  function statusOf(q) {
    var c = PFP.getCard(q.id);
    if (!c) return "unseen";
    if (c.box >= 4) return "mastered";
    return "learning";
  }
  function missed(q) { var c = PFP.getCard(q.id); return !!(c && c.wrong > 0); }

  function buildTopicFilter() {
    var topics = ALL.map(function (q) { return q.topic; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    $("fTopic").innerHTML = '<option value="all">All topics</option>' +
      topics.map(function (t) { return '<option value="' + t + '">' + t + "</option>"; }).join("");
  }

  function setSeg(name, val) {
    var s = document.querySelector('[data-seg="' + name + '"]');
    Array.prototype.forEach.call(s.querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.dataset.v === val);
    });
  }

  function wire() {
    $("fTopic").onchange = function (e) { FILT.topic = e.target.value; render(); };
    $("fSearch").oninput = function (e) { FILT.q = e.target.value.toLowerCase(); render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-seg="status"] button'), function (b) {
      b.onclick = function () { FILT.status = b.dataset.v; setSeg("status", b.dataset.v); render(); };
    });
  }

  function matches(q) {
    if (FILT.topic !== "all" && q.topic !== FILT.topic) return false;
    if (FILT.status === "missed") { if (!missed(q)) return false; }
    else if (FILT.status !== "all" && statusOf(q) !== FILT.status) return false;
    if (FILT.q) {
      var hay = (q.stem + " " + (q.concept || "") + " " + q.topic).toLowerCase();
      if (hay.indexOf(FILT.q) < 0) return false;
    }
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
      var opts = q.options.map(function (t, j) {
        return '<div class="opt' + (j === q.answer ? " correct" : "") + '"><span class="key">' +
          KEYS[j] + "</span><span>" + t + "</span></div>";
      }).join("");
      var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
      var eqs = (q.equations && q.equations.length)
        ? '<div class="eqbox" style="margin:4px 0 12px;"><h4>Equations</h4>' +
          q.equations.map(function (e) { return '<div class="eq">' + e + "</div>"; }).join("") + "</div>"
        : "";
      return '<div class="qcard">' +
        '<div class="qtop"><span class="topic-tag">' + q.topic + "</span>" + badge(q) + "</div>" +
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
