/* PEFEPrep — engagement tracker. Measures *focused* study time (page visible
 * and you've interacted in the last 60s) and counts how often you leave/switch
 * away. Flushes to the store every few seconds and when the page is hidden.
 * Include on study pages (Today, Bank). No UI of its own. */
(function () {
  "use strict";
  if (!window.PFP) return;

  var IDLE_MS = 60000;       // no interaction this long => not "focused"
  var TICK_MS = 1000;        // sample once a second
  var FLUSH_MS = 8000;       // persist accumulated focus this often
  var lastActivity = Date.now();
  var lastTick = Date.now();
  var pending = 0;           // unflushed focused ms
  var sinceFlush = 0;

  function active() { lastActivity = Date.now(); }
  ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"].forEach(function (ev) {
    window.addEventListener(ev, active, { passive: true });
  });

  function flush() { if (pending > 0) { PFP.bumpFocus(pending); pending = 0; } sinceFlush = 0; }

  function tick() {
    var now = Date.now(), dt = now - lastTick; lastTick = now;
    var focused = (document.visibilityState === "visible") && (now - lastActivity < IDLE_MS);
    if (focused && dt > 0 && dt < 5000) { pending += dt; sinceFlush += dt; }
    if (sinceFlush >= FLUSH_MS) flush();
  }
  var iv = setInterval(tick, TICK_MS);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { flush(); PFP.bumpLeave(); }
    else { lastTick = Date.now(); lastActivity = Date.now(); }
  });
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  window.addEventListener("blur", function () { /* count only real tab/app switches via visibilitychange */ });
})();
