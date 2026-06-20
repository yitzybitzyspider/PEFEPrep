/* PEFEPrep — M1 Daily Player
 * Active-recall flow: see question → (optionally pick) → Reveal → solution +
 * Handbook ref → self-grade. Tracks score, streak, per-topic breakdown.
 * All state in localStorage (single-device, per PRD v1). No backend yet.
 */
(function () {
  "use strict";

  var EXAM_DATE = new Date("2026-07-08T00:00:00");
  var STORE = "pefeprep_v1";
  var KEYS = ["A", "B", "C", "D", "E", "F"];

  var QUESTIONS = [];
  var idx = 0;
  var results = {};            // qid -> { id, picked, correct, selfGrade, topic }
  var view = { picked: null, revealed: false };

  var $ = function (id) { return document.getElementById(id); };
  var todayStr = function () { return new Date().toISOString().slice(0, 10); };
  var pill = function (k, v) { return '<span class="pill"><b>' + v + "</b> · " + k + "</span>"; };

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function saveState(s) { localStorage.setItem(STORE, JSON.stringify(s)); }

  function daysToExam() {
    return Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86400000));
  }

  function show(which) {
    ["intro", "player", "done"].forEach(function (s) {
      $(s).classList.toggle("hide", s !== which);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    try {
      var res = await fetch("./data/questions.json", { cache: "no-store" });
      var data = await res.json();
      QUESTIONS = data.questions || [];
      renderIntro();
    } catch (e) {
      $("introTitle").textContent = "Couldn’t load today’s set";
      $("introSub").textContent = String(e);
      show("intro");
    }
  }

  function renderIntro() {
    var st = loadState();
    var doneToday = st.lastCompleted === todayStr();
    var topic = QUESTIONS[0] ? QUESTIONS[0].topic : "Mixed";

    $("dateLabel").textContent = new Date().toLocaleDateString(undefined,
      { weekday: "long", month: "long", day: "numeric" });
    $("streakChip").textContent = "🔥 " + (st.streak || 0) + " day streak";
    $("countdown").textContent = daysToExam() + " days to exam";
    $("introMeta").innerHTML =
      pill("Questions", QUESTIONS.length) +
      pill("Focus", topic) +
      pill("Mode", "Hide → reveal → self-grade");

    if (doneToday) {
      $("introTitle").textContent = "You’re done for today ✓";
      $("introSub").textContent = "Nice work — " + (st.streak || 1) +
        " day streak going. Come back tomorrow for a fresh set, or redo today’s to review.";
      $("startBtn").textContent = "Redo today’s set";
    } else {
      $("introTitle").textContent = "Today’s set";
      $("introSub").textContent = "Go one at a time. Try to recall the answer first, then reveal it — " +
        "and grade yourself honestly. That’s what makes it stick.";
      $("startBtn").textContent = "Start →";
    }
    show("intro");
  }

  function start() {
    idx = 0; results = {}; view = { picked: null, revealed: false };
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

    var head;
    if (view.picked === null) {
      head = '<div class="verdict">Answer: ' + KEYS[q.answer] + "</div>";
    } else {
      var ok = view.picked === q.answer;
      head = '<div class="verdict ' + (ok ? "ok" : "no") + '">' +
        (ok ? "✓ You got it" : "✗ Answer is " + KEYS[q.answer]) + "</div>";
    }

    var refs = q.references ? '<div class="refs">Look up: ' + q.references + "</div>" : "";
    var selfgrade = view.picked === null
      ? '<div class="selfgrade"><span>Did you get it?</span>' +
        '<button class="sg" data-g="knew">I knew it</button>' +
        '<button class="sg" data-g="missed">I missed it</button></div>'
      : "";

    var fb = $("feedback");
    fb.innerHTML = head + "<div>" + q.solution + "</div>" + refs +
      '<div class="ref">Handbook: ' + q.handbook + "</div>" + selfgrade;
    fb.className = "feedback show";
    Array.prototype.forEach.call(fb.querySelectorAll(".sg"), function (b) {
      b.onclick = function () { selfGrade(b.dataset.g); };
    });

    record();
    $("revealBtn").classList.add("hide");
    $("nextBtn").classList.remove("hide");
    if (typeof window.renderMath === "function") window.renderMath(fb);
  }

  function record() {
    var q = QUESTIONS[idx];
    var correct = view.picked === null ? null : (view.picked === q.answer);
    results[q.id] = { id: q.id, picked: view.picked, correct: correct, topic: q.topic,
                      selfGrade: results[q.id] ? results[q.id].selfGrade : null };
  }

  function selfGrade(g) {
    var q = QUESTIONS[idx];
    var r = results[q.id] || { id: q.id, topic: q.topic, picked: null };
    r.selfGrade = g;
    r.correct = (g === "knew");
    results[q.id] = r;
    Array.prototype.forEach.call($("feedback").querySelectorAll(".sg"), function (b) {
      b.classList.toggle("on", b.dataset.g === g);
    });
  }

  function next() {
    idx++;
    if (idx >= QUESTIONS.length) finish();
    else renderQuestion();
  }

  function finish() {
    $("bar").style.width = "100%";
    var recs = Object.keys(results).map(function (k) { return results[k]; });
    var known = recs.filter(function (r) { return r.correct === true; }).length;
    var total = QUESTIONS.length;

    var st = loadState();
    var t = todayStr();
    if (st.lastCompleted !== t) {
      var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      st.streak = (st.lastCompleted === y) ? (st.streak || 0) + 1 : 1;
      st.lastCompleted = t;
    }
    st.history = st.history || {};
    st.history[t] = { known: known, total: total };
    saveState(st);

    var pct = total ? Math.round(known / total * 100) : 0;
    $("doneScore").textContent = known;
    $("doneTotal").textContent = " / " + total;
    $("doneMsg").textContent = pct >= 80
      ? pct + "% — strong session."
      : pct >= 50
        ? pct + "% — solid. Review the misses, then run it again tomorrow."
        : pct + "% — keep at it; the misses are where the gains are.";
    $("doneStreak").textContent = "🔥 " + st.streak + " day streak";

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
