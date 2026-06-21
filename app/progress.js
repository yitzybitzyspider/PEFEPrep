/* PEFEPrep — Progress dashboard (schedule-aware). Reads questions + schedule +
 * PFP localStorage. Updates automatically as new days/questions are added. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  function fmtDate(d) {
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    catch (e) { return d; }
  }

  async function init() {
    try {
      var Q = await (await fetch("./data/questions.json", { cache: "no-store" })).json();
      var S = await (await fetch("./data/schedule.json", { cache: "no-store" })).json();
      render(Q.questions || [], S);
    } catch (e) {
      $("bars").innerHTML = "<p class='sub'>Couldn’t load data: " + e + "</p>";
    }
  }

  function render(ALL, S) {
    var m = PFP.sectionMastery(ALL);
    var topics = Object.keys(m).sort(function (a, b) { return m[a].readiness - m[b].readiness; });

    var tot = 0, seen = 0, boxSum = 0;
    topics.forEach(function (k) { tot += m[k].total; seen += m[k].seen; boxSum += m[k].boxSum; });
    var overall = tot ? Math.round(boxSum / (tot * 5) * 100) : 0;

    $("stReady").textContent = overall + "%";
    $("stStreak").textContent = PFP.getStreak();
    $("stDays").textContent = PFP.daysToExam();
    $("stSeen").textContent = seen + " / " + tot;

    $("bars").innerHTML = topics.length ? topics.map(function (k) {
      var v = m[k];
      return '<div class="mrow"><div class="mtop">' +
        '<span class="mname">' + k + "</span>" +
        '<span class="mval">' + v.readiness + "% · " + v.seen + "/" + v.total + "</span></div>" +
        '<div class="mbar"><div class="' + v.level + '" style="width:' + Math.max(4, v.readiness) + '%"></div></div></div>';
    }).join("") : "<p class='sub'>No questions loaded yet.</p>";

    var weak = topics.filter(function (k) { return m[k].seen > 0; }).slice(0, 3);
    $("weak").textContent = weak.length ? weak.join(" · ") : "Finish a session and your weakest sections show up here.";

    // schedule coverage
    var byDay = {};
    ALL.forEach(function (q) { (byDay[q.day] = byDay[q.day] || []).push(q); });
    var t = PFP.today();
    $("scheduleList").innerHTML = (S.days || []).filter(function (d) { return d.type !== "exam-day"; })
      .map(function (d) {
        var qs = byDay[d.day] || [];
        var cnt = qs.length;
        var seenC = qs.filter(function (q) { return PFP.getCard(q.id); }).length;
        var mastC = qs.filter(function (q) { var c = PFP.getCard(q.id); return c && c.box >= 4; }).length;
        var status, cls;
        if (cnt > 0) {
          cls = "avail";
          status = seenC === 0 ? (cnt + " questions") :
            (mastC >= cnt ? "✓ mastered" : seenC + "/" + cnt + " seen");
        } else if (d.date < t) { cls = "pending"; status = "content pending"; }
        else { cls = "upcoming"; status = "upcoming"; }
        return '<div class="schrow ' + cls + '">' +
          '<div class="schday">Day ' + d.day + "</div>" +
          '<div class="schmain"><div class="schtopic">' + d.topic + "</div>" +
          '<div class="schmeta">' + fmtDate(d.date) + (cnt ? " · " + cnt + " Q" : "") + "</div></div>" +
          '<div class="schstat">' + status + "</div></div>";
      }).join("");

    // 14-day streak heatmap
    var hist = PFP.getHistory();
    var cells = [];
    for (var i = 13; i >= 0; i--) {
      var dd = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      cells.push('<div class="d' + (hist[dd] ? " on" : "") + '" title="' + dd + '"></div>');
    }
    $("heat").innerHTML = cells.join("");
  }

  window.addEventListener("DOMContentLoaded", init);
})();
