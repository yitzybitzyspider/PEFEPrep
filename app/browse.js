/* PEFEPrep — Question Bank. Filter by day / topic / status, sort, and search.
 * Each card shows a history dot (green=got, red=missed, grey=unseen) and lets you
 * star it into "My List", or mark it ✓ Got / ✗ Missed if you worked it on paper.
 * "Review these →" steps through the current filter in the full study interface. */
(function () {
  "use strict";
  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [], SCHED = { days: [] }, QBYID = {};
  var FILT = { day: "all", topic: "all", status: "all", sort: "day", q: "" };
  var $ = function (id) { return document.getElementById(id); };

  async function init() {
    try {
      ALL = await PFPDATA.load();
      ALL.forEach(function (q) { QBYID[q.id] = q; });
      try { SCHED = await (await fetch("./data/schedule.json", { cache: "no-store" })).json(); } catch (e) { SCHED = { days: [] }; }
      buildFilters(); wire(); render();
    } catch (e) { $("list").innerHTML = "<p class='sub'>Couldn’t load questions: " + e + "</p>"; }
  }

  function schedTopic(day) { var d = (SCHED.days || []).filter(function (x) { return x.day === day; })[0]; return d ? d.topic : "Day " + day; }
  function statusOf(q) { var c = PFP.getCard(q.id); if (!c) return "unseen"; if (c.box >= 4) return "mastered"; return "learning"; }
  function missed(q) { return PFP.lastOutcome(q.id) === false; }
  function wrongOf(q) { var c = PFP.getCard(q.id); return c ? c.wrong : 0; }
  /* Latest outcome — matches the study navigator. Marking Got/Missed flips it. */
  function histStatus(q) { var o = PFP.lastOutcome(q.id); return o === null ? "new" : o ? "got" : "miss"; }

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
    $("fSort").onchange = function (e) { FILT.sort = e.target.value; render(); };
    $("fSearch").oninput = function (e) { FILT.q = e.target.value.toLowerCase(); render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-seg="status"] button'), function (b) {
      b.onclick = function () { FILT.status = b.dataset.v; setSeg("status", b.dataset.v); render(); };
    });
    $("reviewBtn").onclick = launchReview;
    $("addBtn").onclick = addThese;
  }

  function launchReview() {
    if (FILT.status === "starred") location.href = "./today.html?filter=starred";
    else if (FILT.status === "missed") location.href = "./today.html?filter=missed";
    else if (FILT.day !== "all") location.href = "./today.html?day=" + FILT.day;
    else if (FILT.topic !== "all") location.href = "./today.html?topic=" + encodeURIComponent(FILT.topic);
    else location.href = "./today.html?all=1";
  }

  /* Star every question in the current filter — easy way to build a list. */
  function addThese() {
    var items = ALL.filter(matches);
    items.forEach(function (q) { PFP.setStar(q.id, true); });
    var b = $("addBtn"); b.textContent = "Added " + items.length + " ✓";
    setTimeout(function () { b.textContent = "★ Add these to My List"; }, 1400);
    render();
  }

  function matches(q) {
    if (FILT.day !== "all" && q.day !== Number(FILT.day)) return false;
    if (FILT.topic !== "all" && q.topic !== FILT.topic) return false;
    if (FILT.status === "starred") { if (!PFP.isStarred(q.id)) return false; }
    else if (FILT.status === "missed") { if (!missed(q)) return false; }
    else if (FILT.status !== "all" && statusOf(q) !== FILT.status) return false;
    if (FILT.q) { var hay = (q.stem + " " + (q.concept || "") + " " + q.topic).toLowerCase(); if (hay.indexOf(FILT.q) < 0) return false; }
    return true;
  }

  /* Celebrate a daily-goal hit / milestone or any freshly-unlocked achievement after marking. */
  function afterMark(r) {
    if (r && r.goalJustMet && window.PFPCelebrate) PFPCelebrate({ title: "🎯 Daily goal hit!", msg: r.goal + " questions today · " + PFP.getStreak() + "-day streak 🔥" });
    else if (r && r.milestone && window.PFPNudge) PFPNudge(r.milestone);
    if (PFP.checkAchievements) {
      PFP.checkAchievements(ALL).forEach(function (a, i) {
        setTimeout(function () { if (window.PFPCelebrate) PFPCelebrate({ title: a.icon + " " + a.title, msg: a.desc }); }, 700 + i * 850);
      });
    }
  }

  function rankMissedFirst(q) { var st = histStatus(q); return st === "miss" ? 0 : st === "new" ? 1 : 2; }
  function sortItems(items) {
    var arr = items.slice();
    if (FILT.sort === "topic") arr.sort(function (a, b) { return a.topic < b.topic ? -1 : a.topic > b.topic ? 1 : (a.day - b.day); });
    else if (FILT.sort === "missedfirst") arr.sort(function (a, b) { return rankMissedFirst(a) - rankMissedFirst(b) || (a.day - b.day); });
    else if (FILT.sort === "mostmissed") arr.sort(function (a, b) { return wrongOf(b) - wrongOf(a) || (a.day - b.day); });
    else arr.sort(function (a, b) { return a.day - b.day; });
    return arr;
  }

  function badgeLabel(q) {
    var st = statusOf(q);
    var l = { unseen: "Unseen", learning: "Learning", mastered: "Mastered" }[st];
    if (missed(q)) l += " · missed";
    return l;
  }

  function updateCounts(shown) {
    if (typeof shown === "number") $("count").textContent = shown + " of " + ALL.length + " questions";
    var sc = PFP.starredCount(); $("cntStar").textContent = sc ? "(" + sc + ")" : "";
    var mc = ALL.filter(missed).length; $("cntMissed").textContent = mc ? "(" + mc + ")" : "";
  }

  /* Re-sync a single card's dot, badge, star, and got/miss buttons in place. */
  function decorate(card, q) {
    var st = histStatus(q);
    card.querySelector(".dot").className = "dot " + st;
    var bdg = card.querySelector(".bdg"); bdg.className = "bdg " + statusOf(q); bdg.textContent = badgeLabel(q);
    var on = PFP.isStarred(q.id);
    var star = card.querySelector('[data-act="star"]'); star.classList.toggle("on", on); star.textContent = on ? "★ Saved" : "☆ Save";
    card.querySelector('[data-act="got"]').classList.toggle("on", st === "got");
    card.querySelector('[data-act="miss"]').classList.toggle("on", st === "miss");
  }

  function render() {
    var items = sortItems(ALL.filter(matches));
    updateCounts(items.length);
    $("list").innerHTML = items.length ? items.map(function (q) {
      var st = histStatus(q), on = PFP.isStarred(q.id);
      var hasOpts = Array.isArray(q.options) && q.options.length;
      var optsHtml = hasOpts ? '<div class="opts" style="margin:12px 0;">' + q.options.map(function (t, j) {
        return '<div class="opt" data-j="' + j + '"><span class="key">' + KEYS[j] + "</span><span>" + t + "</span></div>";
      }).join("") + "</div>" : "";
      var numAns = hasOpts ? "" : '<div class="opt correct"><span class="key">✓</span><span>' + q.answer + "</span></div>";
      var eqs = (q.equations && q.equations.length)
        ? '<div class="eqbox" style="margin:4px 0 12px;"><h4>Equations</h4>' + q.equations.map(function (e) { return '<div class="eq">' + e + "</div>"; }).join("") + "</div>" : "";
      var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
      return '<div class="qcard" data-id="' + q.id + '">' +
        '<div class="qtop"><span class="topic-tag">Day ' + q.day + " · " + q.topic + "</span>" +
          '<span class="qstatus"><span class="dot ' + st + '"></span><span class="bdg ' + statusOf(q) + '">' + badgeLabel(q) + "</span></span></div>" +
        '<div class="qstem">' + q.stem + "</div>" +
        optsHtml +
        '<div class="qactions">' +
          '<button class="qact star' + (on ? " on" : "") + '" data-act="star">' + (on ? "★ Saved" : "☆ Save") + "</button>" +
          '<button class="qact mk-got' + (st === "got" ? " on" : "") + '" data-act="got">✓ Got it</button>' +
          '<button class="qact mk-miss' + (st === "miss" ? " on" : "") + '" data-act="miss">✗ Missed</button>' +
          '<button class="btn-ghost reveal" data-act="reveal">Show answer</button>' +
          '<button class="qact report" data-act="report" title="Report a problem with this question">⚑ Report</button>' +
        "</div>" +
        '<div class="qans hide">' + eqs + numAns +
          '<div class="sol">' + q.solution + "</div>" + refs +
          '<div class="ref">Handbook: ' + q.handbook + "</div>" +
        "</div></div>";
    }).join("") : "<p class='sub'>No questions match these filters. (Star some questions to fill ★ My List, or mark a few ✗ Missed.)</p>";

    Array.prototype.forEach.call($("list").querySelectorAll(".qcard"), function (card) {
      var q = QBYID[card.dataset.id];
      Array.prototype.forEach.call(card.querySelectorAll(".qact, .reveal"), function (b) {
        b.onclick = function () {
          var act = b.dataset.act;
          if (act === "report") { if (window.PFPReport) PFPReport.open(q.id); return; }
          if (act === "reveal") {
            var ans = card.querySelector(".qans");
            var hidden = ans.classList.toggle("hide");
            b.textContent = hidden ? "Show answer" : "Hide answer";
            var co = card.querySelector('.opt[data-j="' + q.answer + '"]');
            if (co) co.classList.toggle("correct", !hidden);
            if (!hidden && window.renderMath) window.renderMath(ans);
            return;
          }
          if (act === "star") PFP.toggleStar(q.id);
          else if (act === "got") afterMark(PFP.recordResult(q.id, true, q.topic));
          else if (act === "miss") afterMark(PFP.recordResult(q.id, false, q.topic));
          decorate(card, q);
          updateCounts();
          // If the change drops the card out of the current filter, refresh the list.
          if ((FILT.status === "starred" && !PFP.isStarred(q.id)) ||
              (FILT.status === "missed" && !missed(q))) render();
        };
      });
    });
    if (window.renderMath) window.renderMath($("list"));
  }

  window.addEventListener("DOMContentLoaded", init);
})();
