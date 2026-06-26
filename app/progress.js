/* PEFEPrep — dashboard. Readiness + per-section mastery, publish verification,
 * clickable schedule with per-day progress, and one-click misses export. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtDate(d) { try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch (e) { return d; } }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function missed(q) { var c = PFP.getCard(q.id); return !!(c && c.wrong > 0); }

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

    renderGoal();
    renderAchievements(ALL);
    renderLists(ALL);
    renderPublish(ALL, S);
    renderCalendar(ALL, S);
    renderSchedule(ALL, S);

    var hist = PFP.getHistory(), cells = [];
    for (var i = 13; i >= 0; i--) {
      var dd = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      var h = hist[dd], n = h && h.ids ? Object.keys(h.ids).length : 0;
      cells.push('<div class="d' + (n > 0 ? " on" : "") + (h && h.goalMet ? " full" : "") + '" title="' + dd + (n ? " · " + n + " answered" : "") + '"></div>');
    }
    $("heat").innerHTML = cells.join("");
  }

  function renderGoal() {
    var ans = PFP.getAnsweredToday(), goal = PFP.getDailyGoal();
    var done = ans >= goal, pct = goal ? Math.min(1, ans / goal) : 0;
    var R = 42, C = 2 * Math.PI * R, off = C * (1 - pct);
    $("goalRing").innerHTML =
      '<svg viewBox="0 0 100 100" class="ring">' +
        '<circle cx="50" cy="50" r="42" class="ring-bg"></circle>' +
        '<circle cx="50" cy="50" r="42" class="ring-fg' + (done ? " done" : "") + '" transform="rotate(-90 50 50)" ' +
          'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
        '<text x="50" y="47" class="ring-num">' + Math.min(ans, goal) + "/" + goal + "</text>" +
        '<text x="50" y="63" class="ring-lbl">' + (done ? "goal met 🎉" : "today") + "</text>" +
      "</svg>";
    $("streakBig").textContent = PFP.getStreak();
    $("bestBig").textContent = PFP.getBestStreak();
    $("focusToday").innerHTML = PFP.focusMinutesToday() + "<small>m</small>";
    $("leavesToday").textContent = PFP.leavesToday();
  }

  function renderAchievements(ALL) {
    PFP.checkAchievements(ALL).forEach(function (a, i) {
      setTimeout(function () { if (window.PFPCelebrate) PFPCelebrate({ title: a.icon + " " + a.title, msg: a.desc }); }, 500 + i * 800);
    });
    var list = PFP.getAchievements();
    $("achCount").textContent = list.filter(function (a) { return a.unlocked; }).length + " / " + list.length + " unlocked";
    $("achGrid").innerHTML = list.map(function (a) {
      return '<div class="ach' + (a.unlocked ? " on" : "") + '" title="' + a.desc + '">' +
        '<div class="ach-ic">' + a.icon + "</div>" +
        '<div class="ach-t">' + a.title + "</div>" +
        '<div class="ach-d">' + (a.unlocked ? a.desc : "🔒 " + a.desc) + "</div></div>";
    }).join("");
  }

  function byDayMap(ALL) { var b = {}; ALL.forEach(function (q) { (b[q.day] = b[q.day] || []).push(q); }); return b; }

  function renderLists(ALL) {
    var sc = PFP.starredCount();
    $("ltStarCount").textContent = sc;
    var sl = $("ltStarReview");
    if (sc > 0) { sl.href = "./today.html?filter=starred"; sl.textContent = "Review My List →"; }
    else { sl.href = "./browse.html"; sl.textContent = "Star questions in the Bank →"; }
    var mc = ALL.filter(missed).length;
    $("ltMissCount").textContent = mc;
    var ml = $("ltMissReview");
    if (mc > 0) { ml.href = "./today.html?filter=missed"; ml.textContent = "Review misses →"; }
    else { ml.href = "./browse.html"; ml.textContent = "Nothing missed yet"; }
  }

  /* Month-grid calendar of the study plan: green = live (click to review),
     amber = past-but-pending, neutral = upcoming, red = exam, ring = today. */
  function renderCalendar(ALL, S) {
    var box = $("calendar"); if (!box) return;
    var byDay = byDayMap(ALL), t = PFP.today();
    var sched = {}; (S.days || []).forEach(function (d) { sched[d.date] = d; });
    var dates = (S.days || []).map(function (d) { return d.date; }).sort();
    if (!dates.length) { box.innerHTML = "<p class='sub'>No schedule.</p>"; return; }
    var end = new Date(((S.examDate || dates[dates.length - 1])) + "T00:00:00");
    var cur = new Date(dates[0] + "T00:00:00"); cur.setDate(1);
    var months = [];
    while (cur.getFullYear() < end.getFullYear() || (cur.getFullYear() === end.getFullYear() && cur.getMonth() <= end.getMonth())) {
      months.push(monthGrid(cur.getFullYear(), cur.getMonth(), sched, byDay, t));
      cur.setMonth(cur.getMonth() + 1);
    }
    box.innerHTML = '<div class="cal-months">' + months.join("") + "</div>" +
      '<div class="cal-legend">' +
        '<span><i class="cal-sw avail"></i>Live · click to review</span>' +
        '<span><i class="cal-sw pending"></i>Pending</span>' +
        '<span><i class="cal-sw upcoming"></i>Upcoming</span>' +
        '<span><i class="cal-sw examday"></i>Exam / practice</span>' +
        '<span class="cal-todaykey">▢ Today</span>' +
      "</div>";
    Array.prototype.forEach.call(box.querySelectorAll(".cal-cell.clickable"), function (el) {
      el.onclick = function () { location.href = "./today.html?day=" + el.dataset.day; };
    });
  }

  function monthGrid(year, month, sched, byDay, t) {
    var startDow = new Date(year, month, 1).getDay();
    var dim = new Date(year, month + 1, 0).getDate();
    var cells = "";
    for (var i = 0; i < startDow; i++) cells += '<div class="cal-cell cal-blank"></div>';
    for (var dn = 1; dn <= dim; dn++) {
      var ds = year + "-" + pad(month + 1) + "-" + pad(dn);
      var sd = sched[ds], isToday = ds === t;
      if (!sd) { cells += '<div class="cal-cell cal-empty' + (isToday ? " cal-today" : "") + '"><span class="cal-date">' + dn + "</span></div>"; continue; }
      var qs = byDay[sd.day] || [], cnt = qs.length;
      var seenC = qs.filter(function (q) { return PFP.getCard(q.id); }).length;
      var mastC = qs.filter(function (q) { var c = PFP.getCard(q.id); return c && c.box >= 4; }).length;
      var cls, clickable = false, mark = "D" + sd.day, statusTxt;
      if (sd.type === "exam-day") { cls = "cal-examday"; mark = "🎯"; statusTxt = "Exam day"; }
      else if (cnt > 0) { cls = "cal-avail"; clickable = true; statusTxt = seenC === 0 ? cnt + " Q" : (mastC >= cnt ? "mastered" : seenC + "/" + cnt + " seen"); }
      else if (ds < t) { cls = "cal-pending"; statusTxt = "content pending"; }
      else { cls = "cal-upcoming"; statusTxt = "upcoming"; }
      if (sd.type === "exam") cls += " cal-special";
      var title = (sd.topic + " — " + statusTxt).replace(/"/g, "'");
      cells += '<div class="cal-cell ' + cls + (isToday ? " cal-today" : "") + (clickable ? " clickable" : "") + '"' +
        (clickable ? ' data-day="' + sd.day + '"' : "") + ' title="' + title + '">' +
        '<span class="cal-date">' + dn + "</span>" +
        '<span class="cal-mark">' + mark + "</span>" +
        '<span class="cal-topic">' + sd.topic + "</span></div>";
    }
    return '<div class="cal-month"><div class="cal-mhead">' + MON[month] + " " + year + "</div>" +
      '<div class="cal-wd">' + WD.map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div>" +
      '<div class="cal-grid">' + cells + "</div></div>";
  }

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
