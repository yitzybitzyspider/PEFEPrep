/* PEFEPrep — review/study player (Today + Bank + dashboard all open this).
 * Set is chosen by URL params: ?day=N | ?topic=X | ?filter=missed | (default = current day).
 * Equations hidden by default, reveal answer, unlock worked solution step by step,
 * self-grade. Question navigator on the left, Handbook on the right. Tracks every
 * miss; exports a markdown list to paste into Claude as a tutor.
 */
(function () {
  "use strict";

  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [], SCHED = { days: [] }, HB = [], QUESTIONS = [], idx = 0;
  var session = {}, resolved = {};
  var view = { picked: null, revealed: false, stepsShown: 0, stepsArr: [] };
  var settings = PFP.getSettings();
  var mode = { kind: "day", day: null, isDaily: false, title: "", sub: "" };

  var $ = function (id) { return document.getElementById(id); };
  var pill = function (k, v) { return '<span class="pill"><b>' + v + "</b> · " + k + "</span>"; };
  var math = function (el) { if (window.renderMath) window.renderMath(el); };
  var todayStr = function () { return new Date().toISOString().slice(0, 10); };

  async function init() {
    try {
      ALL = await PFPDATA.load();
      try { SCHED = await (await fetch("./data/schedule.json", { cache: "no-store" })).json(); } catch (e) { SCHED = { days: [] }; }
      try { HB = (await (await fetch("./data/handbook.json", { cache: "no-store" })).json()).entries || []; } catch (e) { HB = []; }
      wireHandbook();
      determineMode();
      renderIntro();
    } catch (e) {
      $("introTitle").textContent = "Couldn’t load questions";
      $("introSub").textContent = String(e);
      show("intro");
    }
  }

  function daysWithContent() {
    var s = {}; ALL.forEach(function (q) { s[q.day] = true; });
    return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
  }
  function schedTopic(day) {
    var d = (SCHED.days || []).filter(function (x) { return x.day === day; })[0];
    return d ? d.topic : "Day " + day;
  }
  function schedType(day) {
    var d = (SCHED.days || []).filter(function (x) { return x.day === day; })[0];
    return d ? d.type : "";
  }
  function isMissed(q) { return PFP.lastOutcome(q.id) === false; }

  function determineMode() {
    var p = new URLSearchParams(location.search);
    var day = p.get("day"), topic = p.get("topic"), filter = p.get("filter");
    if (filter === "missed") { mode = { kind: "filter", filter: "missed", isDaily: false, title: "Review — questions you’ve missed", sub: "Everything you’ve gotten wrong, to drill again." }; return; }
    if (filter === "starred") { mode = { kind: "filter", filter: "starred", isDaily: false, title: "Review — ★ My List", sub: "The questions you’ve saved to study together." }; return; }
    if (topic) { mode = { kind: "topic", topic: topic, isDaily: false, title: "Review — " + topic, sub: "All questions in this topic." }; return; }
    if (day) { var d = Number(day); mode = { kind: "day", day: d, isDaily: false, title: "Day " + d + " — " + schedTopic(d), sub: "All questions from this day." }; return; }
    if (p.get("all")) { mode = { kind: "all", isDaily: false, title: "Review — all questions", sub: "Every question in the bank." }; return; }
    var info = currentDayInfo();
    mode = { kind: "day", day: info.day, isDaily: info.isToday, title: "Day " + info.day + " — " + schedTopic(info.day), sub: info.note };
  }

  function currentDayInfo() {
    var t = todayStr();
    var withC = daysWithContent();
    var sched = (SCHED.days || []).filter(function (x) { return x.date === t; })[0];
    if (sched && withC.indexOf(sched.day) >= 0) return { day: sched.day, isToday: true, note: "Today’s scheduled set." };
    var latest = withC.length ? withC[withC.length - 1] : 1;
    if (sched) return { day: latest, isToday: false, note: "Today is Day " + sched.day + " (" + sched.topic + ") — not generated yet, so showing the latest available day." };
    return { day: latest, isToday: false, note: "Showing the latest available day." };
  }

  function setList() {
    if (mode.kind === "filter") {
      if (mode.filter === "starred") return ALL.filter(function (q) { return PFP.isStarred(q.id); });
      return ALL.filter(isMissed);
    }
    if (mode.kind === "topic") return ALL.filter(function (q) { return q.topic === mode.topic; });
    if (mode.kind === "day") return ALL.filter(function (q) { return q.day === mode.day; });
    return ALL.slice();
  }

  function renderIntro() {
    settings = PFP.getSettings();
    QUESTIONS = setList();

    var withC = daysWithContent();
    var sel = $("daySelect");
    sel.innerHTML = withC.map(function (d) {
      return '<option value="' + d + '"' + (mode.kind === "day" && mode.day === d ? " selected" : "") + ">Day " + d + " — " + schedTopic(d) + "</option>";
    }).join("");
    sel.onchange = function () { location.href = "./today.html?day=" + sel.value; };

    $("dateLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    $("streakChip").textContent = "🔥 " + PFP.getStreak() + " day streak";
    $("countdown").textContent = PFP.daysToExam() + " days to exam";
    if ($("goalChip")) {
      var ans = PFP.getAnsweredToday(), goal = PFP.getDailyGoal();
      $("goalChip").textContent = (ans >= goal ? "✅ goal " : "🎯 ") + Math.min(ans, goal) + "/" + goal + " today";
      $("goalChip").classList.toggle("goal-done", ans >= goal);
    }
    if ($("bestChip")) { var bs = PFP.getBestStreak(); $("bestChip").textContent = "🏆 best " + bs; $("bestChip").style.display = bs > 0 ? "" : "none"; }
    $("introTitle").textContent = mode.title;
    $("introSub").textContent = mode.sub + (PFP.isDoneToday() && mode.isDaily ? " You’ve already finished today — redo any time to review." : "");
    $("introMeta").innerHTML = pill("Questions", QUESTIONS.length) +
      pill("Mode", mode.isDaily ? "Today" : (mode.kind === "filter" ? "Missed review" : "Review"));
    $("startBtn").textContent = QUESTIONS.length ? "Start →" : "No questions yet";
    $("startBtn").disabled = QUESTIONS.length === 0;
    show("intro");
  }

  function start() {
    QUESTIONS = setList();
    if (!QUESTIONS.length) return;
    idx = 0; session = {}; resolved = {};
    show("player");
    applyPanels();
    renderQuestion();
  }

  /* Per-question status for the navigator. The current session wins; otherwise
     fall back to saved history so reopening a section shows what you got
     right (green) and everything you've ever missed (red). */
  function navStatus(q) {
    var r = session[q.id];
    if (r) return r.correct ? "got" : "miss";
    var o = PFP.lastOutcome(q.id);
    return o === null ? "new" : o ? "got" : "miss";
  }

  function renderNav() {
    var nav = $("navList");
    if (!nav) return;
    var counts = { got: 0, miss: 0, "new": 0 };
    nav.innerHTML = QUESTIONS.map(function (q, i) {
      var st = navStatus(q); counts[st]++;
      var cls = "navq " + st + (i === idx ? " cur" : "");
      return '<div class="' + cls + '" data-i="' + i + '"><span class="dot"></span>Q' + (i + 1) + " · " + (q.concept || q.topic) + "</div>";
    }).join("");
    var leg = $("navLegend");
    if (leg) leg.innerHTML =
      '<span class="lg got" title="Got right">✓ ' + counts.got + "</span>" +
      '<span class="lg miss" title="Missed (drill these)">✗ ' + counts.miss + "</span>" +
      '<span class="lg new" title="Not seen yet">○ ' + counts["new"] + "</span>";
    Array.prototype.forEach.call(nav.querySelectorAll(".navq"), function (el) {
      el.onclick = function () { idx = Number(el.dataset.i); renderQuestion(); };
    });
  }

  function renderQuestion() {
    var q = QUESTIONS[idx];
    view = { picked: null, revealed: false, stepsShown: 0, stepsArr: [] };

    $("bar").style.width = (idx / QUESTIONS.length * 100) + "%";
    $("qcount").textContent = "Question " + (idx + 1) + " of " + QUESTIONS.length;
    $("qtopic").textContent = "Day " + q.day + " · " + q.topic;
    $("stem").textContent = q.stem;
    math($("stem"));

    var eq = q.equations || [];
    $("equations").innerHTML = eq.length
      ? eq.map(function (e) { return '<div class="eq">' + e + "</div>"; }).join("")
      : '<div class="eq" style="color:var(--muted);">(no formulas listed)</div>';
    $("equations").classList.add("hide");
    $("eqBtn").classList.remove("hide");
    $("eqBtn").textContent = "💡 Show relevant formulas";

    var opts = $("opts");
    opts.innerHTML = "";
    (q.options || []).forEach(function (text, i) {
      var b = document.createElement("button");
      b.className = "opt"; b.dataset.i = i;
      b.innerHTML = '<span class="key">' + KEYS[i] + "</span><span>" + text + "</span>";
      b.onclick = function () { selectOption(i); };
      opts.appendChild(b);
    });

    $("feedback").className = "feedback";
    $("verdict").innerHTML = ""; $("steps").innerHTML = ""; $("refbox").innerHTML = ""; $("selfgrade").innerHTML = "";
    $("revealBtn").classList.remove("hide");
    $("stepBtn").classList.add("hide");
    $("nextBtn").classList.toggle("hide", false);
    $("nextBtn").textContent = (idx === QUESTIONS.length - 1) ? "Finish" : "Next →";
    $("nextBtn").classList.add("hide");

    renderNav();
    renderHandbook();
  }

  function selectOption(i) {
    if (view.revealed) return;
    view.picked = i;
    Array.prototype.forEach.call($("opts").children, function (b) {
      b.classList.toggle("selected", Number(b.dataset.i) === i);
    });
    if (settings.revealMode === "auto") reveal();
  }

  function revealEquations() {
    $("equations").classList.remove("hide");
    math($("equations"));
    $("eqBtn").classList.add("hide");
  }

  function resolve(correct) {
    var q = QUESTIONS[idx];
    session[q.id] = { correct: correct, topic: q.topic };
    if (!resolved[q.id]) {
      resolved[q.id] = true;
      var r = PFP.recordResult(q.id, correct, q.topic);
      if (r && r.goalJustMet && window.PFPCelebrate) PFPCelebrate({ title: "🎯 Daily goal hit!", msg: r.goal + " questions today · " + PFP.getStreak() + "-day streak 🔥" });
      else if (r && r.milestone && window.PFPNudge) PFPNudge(r.milestone);
      celebrateNewAchievements();
    }
    renderNav();
  }

  function celebrateNewAchievements() {
    if (!PFP.checkAchievements) return;
    var newly = PFP.checkAchievements(ALL);
    newly.forEach(function (a, i) {
      setTimeout(function () { if (window.PFPCelebrate) PFPCelebrate({ title: a.icon + " " + a.title, msg: a.desc }); }, 700 + i * 850);
    });
  }

  function reveal() {
    if (view.revealed) return;
    view.revealed = true;
    var q = QUESTIONS[idx];
    var hasOpts = Array.isArray(q.options) && q.options.length > 0;
    var answerText = hasOpts ? (KEYS[q.answer] + ") " + q.options[q.answer]) : String(q.answer);

    if (hasOpts) {
      Array.prototype.forEach.call($("opts").children, function (b) {
        b.disabled = true;
        var bi = Number(b.dataset.i);
        if (bi === q.answer) b.classList.add("correct");
        if (bi === view.picked && bi !== q.answer) b.classList.add("wrong");
      });
    }

    if (view.picked === null) {
      $("verdict").className = "verdict";
      $("verdict").innerHTML = "Answer: " + answerText;
      $("selfgrade").innerHTML = '<div class="selfgrade"><span>Did you get it?</span>' +
        '<button class="sg" data-g="knew">I knew it</button><button class="sg" data-g="missed">I missed it</button></div>';
      Array.prototype.forEach.call($("selfgrade").querySelectorAll(".sg"), function (b) {
        b.onclick = function () { selfGrade(b.dataset.g); };
      });
    } else {
      var ok = view.picked === q.answer;
      $("verdict").className = "verdict " + (ok ? "ok" : "no");
      $("verdict").innerHTML = ok ? "✓ You got it" : "✗ Answer is " + answerText;
      resolve(ok);
    }

    var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
    $("refbox").innerHTML = refs + '<div class="ref">Handbook: ' + q.handbook + "</div>";
    $("feedback").className = "feedback show";

    view.stepsArr = (q.steps && q.steps.length) ? q.steps : (q.solution ? [q.solution] : []);
    if (view.stepsArr.length) {
      $("stepBtn").textContent = view.stepsArr.length > 1 ? "Show step 1" : "Show worked solution";
      $("stepBtn").classList.remove("hide");
    }
    $("revealBtn").classList.add("hide");
    $("nextBtn").classList.remove("hide");
    math($("refbox"));
  }

  function showNextStep() {
    var arr = view.stepsArr || [];
    if (view.stepsShown >= arr.length) return;
    var n = view.stepsShown;
    var div = document.createElement("div");
    div.className = "step";
    div.innerHTML = (arr.length > 1 ? '<span class="n">' + (n + 1) + ".</span>" : "") + arr[n];
    $("steps").appendChild(div); math(div);
    view.stepsShown++;
    if (view.stepsShown >= arr.length) $("stepBtn").classList.add("hide");
    else $("stepBtn").textContent = "Show step " + (view.stepsShown + 1) + " of " + arr.length;
  }

  function selfGrade(g) {
    resolve(g === "knew");
    Array.prototype.forEach.call($("selfgrade").querySelectorAll(".sg"), function (b) {
      b.classList.toggle("on", b.dataset.g === g);
    });
  }

  function next() {
    var q = QUESTIONS[idx];
    if (!resolved[q.id]) resolve(false);
    idx++;
    if (idx >= QUESTIONS.length) finish();
    else renderQuestion();
  }

  function finish() {
    $("bar").style.width = "100%";
    var recs = Object.keys(session).map(function (k) { return session[k]; });
    var known = recs.filter(function (r) { return r.correct === true; }).length;
    var total = QUESTIONS.length;
    var streak = PFP.getStreak();
    if (mode.isDaily) streak = PFP.completeDay(known, total);
    if (total >= 10 && known === total) {
      PFP.notePerfectSet();
      if (window.PFPCelebrate) PFPCelebrate({ title: "💯 Flawless!", msg: "Perfect score across " + total + " questions." });
    }
    if (mode.kind === "day" && schedType(mode.day) === "exam" && total > 0 && known / total >= 0.7) PFP.notePracticeBeat();
    celebrateNewAchievements();
    streak = PFP.getStreak();

    var pct = total ? Math.round(known / total * 100) : 0;
    $("doneScore").textContent = known;
    $("doneTotal").textContent = " / " + total;
    $("doneMsg").textContent = pct >= 80 ? pct + "% — strong." : pct >= 50 ? pct + "% — solid; review the misses below." : pct + "% — the misses below are where the gains are.";
    $("doneStreak").textContent = "🔥 " + streak + " day streak";

    var miss = recs.filter(function (r) { return r.correct === false; });
    var missQ = QUESTIONS.filter(function (q) { return session[q.id] && session[q.id].correct === false; });
    $("doneTopics").innerHTML = "<h2>Missed this session (" + miss.length + ")</h2>" + (missQ.length
      ? missQ.map(function (q) {
        var hasOpts = Array.isArray(q.options) && q.options.length;
        var ans = hasOpts ? (KEYS[q.answer] + ") " + q.options[q.answer]) : String(q.answer);
        return '<div class="missrow"><div class="mq">' + q.stem + '</div><div class="ma">Correct: ' + ans + " · " + q.topic + "</div></div>";
      }).join("")
      : "<p class='sub' style='color:var(--good);'>Clean sweep — nothing missed. 🎯</p>");

    show("done");
  }

  /* ---- Missed export (paste into Claude as a tutor) ---- */
  function buildExport() {
    var missed = ALL.filter(isMissed);
    var byTopic = {};
    missed.forEach(function (q) { (byTopic[q.topic] = byTopic[q.topic] || []).push(q); });
    var lines = ["# PEFEPrep — questions I've missed (" + todayStr() + ")",
      "Total missed: " + missed.length,
      "", "Use these as a tutoring session: explain each, then quiz me on the weak areas.", ""];
    Object.keys(byTopic).forEach(function (t) {
      lines.push("## " + t);
      byTopic[t].forEach(function (q) {
        var hasOpts = Array.isArray(q.options) && q.options.length;
        var ans = hasOpts ? (KEYS[q.answer] + ") " + q.options[q.answer]) : String(q.answer);
        var c = PFP.getCard(q.id);
        lines.push("- [" + q.id + "] " + q.stem);
        lines.push("    Correct: " + ans + "  |  Handbook: " + q.handbook + (c ? "  |  missed " + c.wrong + "x" : ""));
      });
      lines.push("");
    });
    if (!missed.length) lines.push("_No missed questions yet — go get some wrong first!_");
    return lines.join("\n");
  }

  function openExport() {
    $("exportText").value = (window.PFPDATA && PFPDATA.missedExport) ? PFPDATA.missedExport() : buildExport();
    $("exportModal").classList.remove("hide");
  }

  function show(which) {
    ["intro", "player", "done"].forEach(function (s) { $(s).classList.toggle("hide", s !== which); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- Show/hide the Questions + Handbook panels (remembered) ---- */
  function panelPref(key, val) {
    if (arguments.length === 2) {
      try { localStorage.setItem("pfp_view_" + key, val ? "1" : "0"); } catch (e) {}
      return val;
    }
    try { return localStorage.getItem("pfp_view_" + key) !== "0"; } catch (e) { return true; }
  }
  function applyPanels() {
    var grid = document.querySelector(".studygrid");
    if (!grid) return;
    var showNav = panelPref("nav"), showHb = panelPref("hb");
    grid.classList.toggle("hide-nav", !showNav);
    grid.classList.toggle("hide-hb", !showHb);
    var tn = $("toggleNav"), th = $("toggleHb");
    if (tn) { tn.classList.toggle("on", showNav); tn.setAttribute("aria-pressed", showNav); }
    if (th) { th.classList.toggle("on", showHb); th.setAttribute("aria-pressed", showHb); }
  }

  /* Handbook side panel */
  function wireHandbook() { var s = $("hbSearch"); if (s) s.oninput = function () { renderHandbook(s.value); }; }
  function renderHandbook(query) {
    var list = $("hbList"); if (!list) return;
    var q = (query || "").toLowerCase().trim(), rows;
    if (q) rows = HB.filter(function (e) { return (e.section + " " + e.eq + " " + (e.note || "") + " " + e.topic).toLowerCase().indexOf(q) >= 0; });
    else {
      var topic = (QUESTIONS[idx] ? QUESTIONS[idx].topic : "") || "";
      var inT = HB.filter(function (e) { return topic.indexOf(e.topic) >= 0; });
      var rest = HB.filter(function (e) { return topic.indexOf(e.topic) < 0; });
      rows = inT.concat(rest);
    }
    list.innerHTML = rows.length ? rows.map(function (e) {
      return '<div class="hbentry"><div class="hs">' + e.section + '</div><div class="he">' + e.eq + "</div>" + (e.note ? '<div class="hn">' + e.note + "</div>" : "") + "</div>";
    }).join("") : '<div class="sub" style="font-size:13px;">No matches.</div>';
    math(list);
  }

  document.addEventListener("keydown", function (e) {
    if ($("player").classList.contains("hide")) return;
    if (e.target && e.target.tagName === "INPUT") return;
    if (/^[1-9]$/.test(e.key)) { var i = Number(e.key) - 1; if (!view.revealed && QUESTIONS[idx] && i < (QUESTIONS[idx].options || []).length) selectOption(i); }
    else if (e.key === " " || e.key.toLowerCase() === "r") { e.preventDefault(); if (!view.revealed) reveal(); }
    else if (e.key.toLowerCase() === "e") { if (!view.revealed) revealEquations(); }
    else if (e.key.toLowerCase() === "s") { if (view.revealed) showNextStep(); }
    else if (e.key === "Enter") { if (view.revealed) next(); }
  });

  // Focus-mode lite: a gentle welcome-back when you return mid-session.
  var lastBack = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if ($("player").classList.contains("hide")) return;
    var now = Date.now();
    if (now - lastBack < 60000) return;
    lastBack = now;
    if (window.PFPToast) PFPToast("👋 Welcome back", "Pick up where you left off — you've got this.");
  });

  window.addEventListener("DOMContentLoaded", function () {
    $("startBtn").onclick = start;
    $("eqBtn").onclick = revealEquations;
    $("revealBtn").onclick = reveal;
    $("stepBtn").onclick = showNextStep;
    $("nextBtn").onclick = next;
    if ($("reportBtn")) $("reportBtn").onclick = function () { var q = QUESTIONS[idx]; if (q && window.PFPReport) PFPReport.open(q.id); };
    $("againBtn").onclick = function () { renderIntro(); };
    if ($("toggleNav")) $("toggleNav").onclick = function () { panelPref("nav", !panelPref("nav")); applyPanels(); };
    if ($("toggleHb")) $("toggleHb").onclick = function () { panelPref("hb", !panelPref("hb")); applyPanels(); };
    if ($("exportBtn")) $("exportBtn").onclick = openExport;
    if ($("exportClose")) $("exportClose").onclick = function () { $("exportModal").classList.add("hide"); };
    if ($("copyExport")) $("copyExport").onclick = function () {
      var ta = $("exportText"); ta.select();
      try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand("copy"); }
      $("copyExport").textContent = "Copied ✓";
      setTimeout(function () { $("copyExport").textContent = "Copy"; }, 1500);
    };
    init();
  });
})();
