/* PEFEPrep — Daily Player.
 * Equations shown up front (solution hidden) · pick or recall · reveal answer ·
 * unlock the worked solution step by step · searchable Handbook panel.
 * Runs on the shared store (Leitner SRS + mastery + streak). KaTeX for math.
 */
(function () {
  "use strict";

  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [], QUESTIONS = [], HB = [], idx = 0;
  var session = {}, resolved = {};
  var view = { picked: null, revealed: false, stepsShown: 0 };
  var settings = PFP.getSettings();

  var $ = function (id) { return document.getElementById(id); };
  var pill = function (k, v) { return '<span class="pill"><b>' + v + "</b> · " + k + "</span>"; };
  var math = function (el) { if (window.renderMath) window.renderMath(el); };

  async function init() {
    try {
      var q = await (await fetch("./data/questions.json", { cache: "no-store" })).json();
      ALL = q.questions || [];
      try { HB = (await (await fetch("./data/handbook.json", { cache: "no-store" })).json()).entries || []; }
      catch (e) { HB = []; }
      wireHandbook();
      renderIntro();
    } catch (e) {
      $("introTitle").textContent = "Couldn’t load today’s set";
      $("introSub").textContent = String(e);
      show("intro");
    }
  }

  function renderIntro() {
    settings = PFP.getSettings();
    QUESTIONS = PFP.buildDailySet(ALL);
    var done = PFP.isDoneToday();
    var topics = QUESTIONS.map(function (q) { return q.topic; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });

    $("dateLabel").textContent = new Date().toLocaleDateString(undefined,
      { weekday: "long", month: "long", day: "numeric" });
    $("streakChip").textContent = "🔥 " + PFP.getStreak() + " day streak";
    $("countdown").textContent = PFP.daysToExam() + " days to exam";
    $("introMeta").innerHTML =
      pill("Questions", QUESTIONS.length) +
      pill("Focus", topics.length > 1 ? topics.length + " topics" : (topics[0] || "Mixed")) +
      pill("Mode", settings.srs ? "Spaced repetition" : "Practice");

    if (done) {
      $("introTitle").textContent = "You’re done for today ✓";
      $("introSub").textContent = "Nice — " + PFP.getStreak() +
        " day streak. Fresh set tomorrow, or redo today’s to review.";
      $("startBtn").textContent = "Redo today’s set";
    } else {
      $("introTitle").textContent = "Today’s set";
      $("introSub").textContent =
        "The equations are shown up front — work it yourself, then reveal the answer and unlock the solution one step at a time.";
      $("startBtn").textContent = "Start →";
    }
    show("intro");
  }

  function start() {
    if (QUESTIONS.length === 0) QUESTIONS = PFP.buildDailySet(ALL);
    idx = 0; session = {}; resolved = {};
    show("player");
    renderQuestion();
  }

  function renderQuestion() {
    var q = QUESTIONS[idx];
    view = { picked: null, revealed: false, stepsShown: 0 };

    $("bar").style.width = (idx / QUESTIONS.length * 100) + "%";
    $("qcount").textContent = "Question " + (idx + 1) + " of " + QUESTIONS.length;
    $("qtopic").textContent = q.topic;
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
      b.className = "opt";
      b.dataset.i = i;
      b.innerHTML = '<span class="key">' + KEYS[i] + "</span><span>" + text + "</span>";
      b.onclick = function () { selectOption(i); };
      opts.appendChild(b);
    });

    $("feedback").className = "feedback";
    $("verdict").innerHTML = "";
    $("steps").innerHTML = "";
    $("refbox").innerHTML = "";
    $("selfgrade").innerHTML = "";
    $("revealBtn").classList.remove("hide");
    $("stepBtn").classList.add("hide");
    $("nextBtn").classList.add("hide");

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

  function resolve(correct) {
    var q = QUESTIONS[idx];
    session[q.id] = { correct: correct, topic: q.topic };
    if (!resolved[q.id]) {
      resolved[q.id] = true;
      if (settings.srs) PFP.recordResult(q.id, correct, q.topic);
    }
  }

  function revealEquations() {
    $("equations").classList.remove("hide");
    math($("equations"));
    $("eqBtn").classList.add("hide");
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
        '<button class="sg" data-g="knew">I knew it</button>' +
        '<button class="sg" data-g="missed">I missed it</button></div>';
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
    $("steps").appendChild(div);
    math(div);
    view.stepsShown++;
    if (view.stepsShown >= arr.length) {
      $("stepBtn").classList.add("hide");
    } else {
      $("stepBtn").textContent = "Show step " + (view.stepsShown + 1) + " of " + arr.length;
    }
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
    var streak = PFP.completeDay(known, total);

    var pct = total ? Math.round(known / total * 100) : 0;
    $("doneScore").textContent = known;
    $("doneTotal").textContent = " / " + total;
    $("doneMsg").textContent = pct >= 80
      ? pct + "% — strong session."
      : pct >= 50
        ? pct + "% — solid. Review the misses, then run it again tomorrow."
        : pct + "% — keep at it; the misses are where the gains are.";
    $("doneStreak").textContent = "🔥 " + streak + " day streak";

    var byTopic = {};
    recs.forEach(function (r) {
      var k = r.topic || "—";
      byTopic[k] = byTopic[k] || { c: 0, n: 0 };
      byTopic[k].n++;
      if (r.correct === true) byTopic[k].c++;
    });
    $("doneTopics").innerHTML = Object.keys(byTopic).map(function (k) {
      var v = byTopic[k];
      return '<div class="trow"><span>' + k + "</span><span>" + v.c + "/" + v.n + "</span></div>";
    }).join("");

    show("done");
  }

  /* Handbook side panel */
  function wireHandbook() {
    var s = $("hbSearch");
    if (s) s.oninput = function () { renderHandbook(s.value); };
  }
  function renderHandbook(query) {
    var list = $("hbList");
    if (!list) return;
    var q = (query || "").toLowerCase().trim();
    var rows;
    if (q) {
      rows = HB.filter(function (e) {
        return (e.section + " " + e.eq + " " + (e.note || "") + " " + e.topic).toLowerCase().indexOf(q) >= 0;
      });
    } else {
      var topic = (QUESTIONS[idx] ? QUESTIONS[idx].topic : "") || "";
      var inTopic = HB.filter(function (e) { return topic.indexOf(e.topic) >= 0; });
      var rest = HB.filter(function (e) { return topic.indexOf(e.topic) < 0; });
      rows = inTopic.concat(rest);
    }
    list.innerHTML = rows.length ? rows.map(function (e) {
      return '<div class="hbentry"><div class="hs">' + e.section + "</div>" +
        '<div class="he">' + e.eq + "</div>" +
        (e.note ? '<div class="hn">' + e.note + "</div>" : "") + "</div>";
    }).join("") : '<div class="sub" style="font-size:13px;">No matches.</div>';
    math(list);
  }

  function show(which) {
    ["intro", "player", "done"].forEach(function (s) {
      $(s).classList.toggle("hide", s !== which);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("keydown", function (e) {
    if ($("player").classList.contains("hide")) return;
    if (e.target && e.target.tagName === "INPUT") return; // don't hijack handbook search
    if (/^[1-9]$/.test(e.key)) {
      var i = Number(e.key) - 1;
      if (!view.revealed && QUESTIONS[idx] && i < QUESTIONS[idx].options.length) selectOption(i);
    } else if (e.key.toLowerCase() === "e") {
      if (!view.revealed) revealEquations();
    } else if (e.key === " " || e.key.toLowerCase() === "r") {
      e.preventDefault();
      if (!view.revealed) reveal();
    } else if (e.key.toLowerCase() === "s") {
      if (view.revealed) showNextStep();
    } else if (e.key === "Enter") {
      if (view.revealed) next();
    }
  });

  window.addEventListener("DOMContentLoaded", function () {
    $("startBtn").onclick = start;
    $("eqBtn").onclick = revealEquations;
    $("revealBtn").onclick = reveal;
    $("stepBtn").onclick = showNextStep;
    $("nextBtn").onclick = next;
    $("againBtn").onclick = start;
    init();
  });
})();
