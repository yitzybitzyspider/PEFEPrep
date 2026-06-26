/* PEFEPrep — Settings (M4). Reads/writes PFP settings; reset progress. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function setSeg(name, val) {
    var seg = document.querySelector('[data-seg="' + name + '"]');
    if (!seg) return;
    Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.dataset.v === val);
    });
  }

  function refresh() {
    var s = PFP.getSettings();
    $("dailySize").value = s.dailySize;
    $("dailyGoal").value = s.dailyGoal;
    $("mixNew").value = s.mixNew;
    $("srs").checked = !!s.srs;
    setSeg("reveal", s.revealMode);
    $("mixHint").textContent = "≈ " + s.mixNew + " new + " +
      Math.max(0, s.dailySize - s.mixNew) + " review per day";
  }

  function init() {
    refresh();

    $("dailySize").onchange = function (e) {
      PFP.setSetting("dailySize", clamp(parseInt(e.target.value, 10) || 20, 1, 200));
      refresh();
    };
    $("dailyGoal").onchange = function (e) {
      PFP.setSetting("dailyGoal", clamp(parseInt(e.target.value, 10) || 20, 1, 200));
      refresh();
    };
    $("mixNew").onchange = function (e) {
      PFP.setSetting("mixNew", clamp(parseInt(e.target.value, 10) || 0, 0, 200));
      refresh();
    };
    $("srs").onchange = function (e) { PFP.setSetting("srs", e.target.checked); };

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-seg="reveal"] button'),
      function (b) {
        b.onclick = function () { PFP.setSetting("revealMode", b.dataset.v); setSeg("reveal", b.dataset.v); };
      }
    );

    $("resetBtn").onclick = function () {
      if (confirm("Reset all progress, streak, and spaced-repetition data on this device? This can’t be undone.")) {
        PFP.resetAll();
        refresh();
        $("resetNote").textContent = "Progress cleared.";
      }
    };
  }

  window.addEventListener("DOMContentLoaded", init);
})();
