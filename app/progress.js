/* PEFEPrep — Progress dashboard (M2). Reads mastery/streak/history from PFP. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  async function init() {
    try {
      var res = await fetch("./data/questions.json", { cache: "no-store" });
      var data = await res.json();
      render(data.questions || []);
    } catch (e) {
      $("bars").innerHTML = "<p class='sub'>Couldn’t load data: " + e + "</p>";
    }
  }

  function render(ALL) {
    var m = PFP.sectionMastery(ALL);
    var topics = Object.keys(m).sort(function (a, b) { return m[a].readiness - m[b].readiness; });

    var tot = 0, seen = 0, boxSum = 0, mastered = 0;
    topics.forEach(function (k) {
      tot += m[k].total; seen += m[k].seen; boxSum += m[k].boxSum; mastered += m[k].mastered;
    });
    var overall = tot ? Math.round(boxSum / (tot * 5) * 100) : 0;

    $("stReady").textContent = overall + "%";
    $("stStreak").textContent = PFP.getStreak();
    $("stDays").textContent = PFP.daysToExam();
    $("stSeen").textContent = seen + " / " + tot;

    $("bars").innerHTML = topics.length ? topics.map(function (k) {
      var v = m[k];
      return '<div class="mrow"><div class="mtop">' +
        '<span class="mname">' + k + "</span>" +
        '<span class="mval">' + v.readiness + "% · " + v.seen + "/" + v.total + " seen</span></div>" +
        '<div class="mbar"><div class="' + v.level + '" style="width:' + Math.max(4, v.readiness) + '%"></div></div></div>';
    }).join("") : "<p class='sub'>No questions loaded yet.</p>";

    var weak = topics.filter(function (k) { return m[k].seen > 0; }).slice(0, 3);
    $("weak").textContent = weak.length
      ? weak.join(" · ")
      : "Finish a session and your weakest sections show up here.";

    // 14-day streak heatmap
    var hist = PFP.getHistory();
    var cells = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      cells.push('<div class="d' + (hist[d] ? " on" : "") + '" title="' + d + '"></div>');
    }
    $("heat").innerHTML = cells.join("");
  }

  window.addEventListener("DOMContentLoaded", init);
})();
