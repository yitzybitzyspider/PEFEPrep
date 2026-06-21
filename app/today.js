/* PEFEPrep — Daily Player (M1) on the shared store (M3 SRS, M4 settings).
 * Active-recall: see question -> optional pick -> Reveal -> solution + Handbook
 * ref -> self-grade. Every resolved question feeds PFP (Leitner + mastery + streak).
 */
(function () {
  "use strict";

  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var ALL = [], QUESTIONS = [], idx = 0;
  var session = {};            // qid -> { correct, topic }  (this session, for summary)
  var resolved = {};           // qid -> true once recorded to the store
  var view = { picked: null, revealed: false };
  var settings = PFP.getSettings();

  var $ = function (id) { return document.getElementById(id); };
  var pill = function (k, v) { return '<span class="pill"><b>' + v + "</b> · " + k + "</span>"; };

  async function init() {
    try {
      var res = await fetch("./data/questions.json", { cache: "no-store" });
      var data = await res.json();
      ALL = data.questions || [];
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
    var topics = Array.prototype.filter.call(
      QUESTIONS.map(function (q) { return q.topic; }),
      function (v, i, a) { return a.indexOf(v) === i; }
    );

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
        "Recall first, then reveal — and grade yourself honestly. That’s what makes it stick.";
      $("startBtn").textContent = "Start →";
    }
    show("intro");
  }

  function start() {
    if (QUESTIONS.length === 0) QUESTIONS = PFP.buildDailySet(ALL);
    idx = 0; session = {}; resolved = {}; view = { picked: null, revealed: false };
    show("player");
    renderQuestion();
  }

  function renderQuestion() {
    var q = QUESTIONS[idx];
    view = { picked: null, revealed: false };

    $("bar").style.width = (idx / QUESTIONS.length * 100) + "%";
    $("qcount").textContent = "Question " + (idx + 1) + " of " + QUESTIONS.length;
    $("qtopic").textContent = q.topic;
    $("stem").textContent = q.stem;

    var opts = $("opts");
    opts.innerHTML = "";
    q.options.forEach(function (text, i) {
      var b = document.createElement("button");
      b.className = "opt";
      b.dataset.i = i;
      b.innerHTML = '<span class="key">' + KEYS[i] + "</span><span>" + text + "</span>";
      b.onclick = function () { selectOption(i); };
      opts.appendChild(b);
    });

    var fb = $("feedback");
    fb.className = "feedback";
    fb.innerHTML = "";
    $("revealBtn").classList.remove("hide");
    $("nextBtn").classList.add("hide");
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

  function reveal() {
    if (view.revealed) return;
    view.revealed = true;
    var q = QUESTIONS[idx];

    Array.prototype.forEach.call($("opts").children, function (b) {
      b.disabled = true;
      var bi = Number(b.dataset.i);
      if (bi === q.answer) b.classList.add("correct");
      if (bi === view.picked && bi !== q.answer) b.classList.add("wrong");
    });

    var head, selfgrade = "";
    if (view.picked === null) {
      head = '<div class="verdict">Answer: ' + KEYS[q.answer] + "</div>";
      selfgrade = '<div class="selfgrade"><span>Did you get it?</span>' +
        '<button class="sg" data-g="knew">I knew it</button>' +
        '<button class="sg" data-g="missed">I missed it</button></div>';
    } else {
      var ok = view.picked === q.answer;
      head = '<div class="verdict ' + (ok ? "ok" : "no") + '">' +
        (ok ? "✓ You got it" : "✗ Answer is " + KEYS[q.answer]) + "</div>";
      resolve(ok);
    }

    var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
    var fb = $("feedback");
    fb.innerHTML = head + "<div>" + q.solution + "</div>" + refs +
      '<div class="ref">Handbook: ' + q.handbook + "</div>" + selfgrade;
    fb.className = "feedback show";
    Array.prototype.forEach.call(fb.querySelectorAll(".sg"), function (b) {
      b.onclick = function () { selfGrade(b.dataset.g); };
    });

    $("revealBtn").classList.add("hide");
    $("nextBtn").classList.remove("hide");
  }

  function selfGrade(g) {
    resolve(g === "knew");
    Array.prototype.forEach.call($("feedback").querySelectorAll(".sg"), function (b) {
      b.classList.toggle("on", b.dataset.g === g);
    });
  }

  function next() {
    var q = QUESTIONS[idx];
    if (!resolved[q.id]) resolve(false); // skipped self-grade -> counts as a miss
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

  function show(which) {
    ["intro", "player", "done"].forEach(function (s) {
      $(s).classList.toggle("hide", s !== which);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("keydown", function (e) {
    if ($("player").classList.contains("hide")) return;
    if (/^[1-9]$/.test(e.key)) {
      var i = Number(e.key) - 1;
      if (!view.revealed && QUESTIONS[idx] && i < QUESTIONS[idx].options.length) selectOption(i);
    } else if (e.key === " " || e.key.toLowerCase() === "r") {
      e.preventDefault();
      if (!view.revealed) reveal();
    } else if (e.key === "Enter") {
      if (view.revealed) next();
    }
  });

  window.addEventListener("DOMContentLoaded", function () {
    $("startBtn").onclick = start;
    $("revealBtn").onclick = reveal;
    $("nextBtn").onclick = next;
    $("againBtn").onclick = start;
    init();
  });
})();
