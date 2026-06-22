/* PEFEPrep — dashboard. Readiness + per-section mastery, publish verification,
 * clickable schedule with per-day progress, and one-click misses export. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function fmtDate(d) { try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch (e) { return d; } }

  async function init() {
    try {
      var ALL = await PFPDATA.load();
      var S = await (await fetch("./data/schedule.json", { cache: "no-store" })).json();
      render(ALL, S);
      wireExport();
    } catch (e) { $("bars").innerHTML = "<p class='sub'>Couldn’t load data: " + e + "</p>"; }
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
      return '<div class="mrow"><div class="mtop"><span class="mname">' + k + "</span>" +
        '<span class="mval">' + v.readiness + "% · " + v.seen + "/" + v.total + "</span></div>" +
        '<div class="mbar"><div class="' + v.level + '" style="width:' + Math.max(4, v.readiness) + '%"></div></div></div>';
    }).join("") : "<p class='sub'>No questions loaded yet.</p>";

    var weak = topics.filter(function (k) { return m[k].seen > 0; }).slice(0, 3);
    $("weak").textContent = weak.length ? weak.join(" · ") : "Finish a session and your weakest sections show up here.";

    renderPublish(ALL, S);
    renderSchedule(ALL, S);

    var hist = PFP.getHistory(), cells = [];
    for (var i = 13; i >= 0; i--) { var dd = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); cells.push('<div class="d' + (hist[dd] ? " on" : "") + '" title="' + dd + '"></div>'); }
    $("heat").innerHTML = cells.join("");
  }

  function byDayMap(ALL) { var b = {}; ALL.forEach(function (q) { (b[q.day] = b[q.day] || []).push(q); }); return b; }

  function renderPublish(ALL, S) {
    var byDay = byDayMap(ALL);
    var withC = Object.keys(byDay).map(Number).sort(function (a, b) { return a - b; });
    var latest = withC.length ? withC[withC.length - 1] : null;
    var t = PFP.today();
    var todaySched = (S.days || []).filter(function (x) { return x.date === t; })[0];
    var html = "";
    if (latest !== null) {
      var ld = (S.days || []).filter(function (x) { return x.day === latest; })[0];
      html += '<div class="pubrow"><span class="pi pub-ok">✓</span><span>Latest published: <strong>Day ' + latest + " — " + (ld ? ld.topic : "") + "</strong> (" + byDay[latest].length + " questions)</span></div>";
    }
    if (todaySched) {
      if (byDay[todaySched.day]) html += '<div class="pubrow"><span class="pi pub-ok">✓</span><span>Today’s set (Day ' + todaySched.day + " — " + todaySched.topic + ") is published.</span></div>";
      else html += '<div class="pubrow"><span class="pi pub-wait">⏳</span><span>Today’s set (Day ' + todaySched.day + " — " + todaySched.topic + ") hasn’t published yet.</span></div>";
    }
    $("publish").innerHTML = html || "<p class='sub'>No content yet.</p>";
  }

  function renderSchedule(ALL, S) {
    var byDay = byDayMap(ALL);
    var t = PFP.today();
    $("scheduleList").innerHTML = (S.days || []).filter(function (d) { return d.type !== "exam-day"; }).map(function (d) {
      var qs = byDay[d.day] || [];
      var cnt = qs.length;
      var seenC = qs.filter(function (q) { return PFP.getCard(q.id); }).length;
      var mastC = qs.filter(function (q) { var c = PFP.getCard(q.id); return c && c.box >= 4; }).length;
      var cls, status, clickable = false, pct = 0;
      if (cnt > 0) { cls = "avail"; clickable = true; pct = Math.round(seenC / cnt * 100); status = seenC === 0 ? (cnt + " Q →") : (mastC >= cnt ? "✓ mastered" : seenC + "/" + cnt + " seen →"); }
      else if (d.date < t) { cls = "pending"; status = "content pending"; }
      else { cls = "upcoming"; status = "upcoming"; }
      var bar = cnt ? '<div class="schbar"><div style="width:' + pct + '%"></div></div>' : '<div style="flex:0 0 70px;"></div>';
      return '<div class="schrow ' + cls + (clickable ? " clickable" : "") + '"' + (clickable ? ' data-day="' + d.day + '"' : "") + ">" +
        '<div class="schday">Day ' + d.day + "</div>" +
        '<div class="schmain"><div class="schtopic">' + d.topic + "</div><div class=\"schmeta\">" + fmtDate(d.date) + (cnt ? " · " + cnt + " Q" : "") + "</div></div>" +
        bar + '<div class="schstat">' + status + "</div></div>";
    }).join("");
    Array.prototype.forEach.call($("scheduleList").querySelectorAll(".schrow.clickable"), function (el) {
      el.onclick = function () { location.href = "./today.html?day=" + el.dataset.day; };
    });
  }

  function wireExport() {
    var btn = $("exportBtn");
    if (btn) btn.onclick = function () { $("exportText").value = PFPDATA.missedExport(); $("exportModal").classList.remove("hide"); };
    if ($("exportClose")) $("exportClose").onclick = function () { $("exportModal").classList.add("hide"); };
    if ($("copyExport")) $("copyExport").onclick = function () {
      var ta = $("exportText"); ta.select();
      try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand("copy"); }
      $("copyExport").textContent = "Copied ✓"; setTimeout(function () { $("copyExport").textContent = "Copy"; }, 1500);
    };
  }

  window.addEventListener("DOMContentLoaded", init);
})();
