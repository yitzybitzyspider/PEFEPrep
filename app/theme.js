/* PEFEPrep — light/dark theme toggle.
 * Loaded in <head> so the theme is applied before first paint (no flash):
 * the top of this file sets data-theme synchronously; the toggle button is
 * injected into the app bar on DOMContentLoaded. Default = light; first visit
 * follows the OS preference; the user's explicit choice is saved to localStorage. */
(function () {
  "use strict";
  var KEY = "pefeprep_theme";
  var root = document.documentElement;

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function osDark() { return !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  function current() { return root.dataset.theme === "dark" ? "dark" : "light"; }
  function apply(t) { if (t === "dark") root.dataset.theme = "dark"; else root.removeAttribute("data-theme"); }

  // --- run immediately (pre-paint): pick the theme ---
  // ?theme=light|dark forces a theme for this load only (deep-link / testing);
  // otherwise use the saved choice, else the OS preference.
  var param = null;
  try { param = new URLSearchParams(location.search).get("theme"); } catch (e) {}
  var initial = (param === "light" || param === "dark") ? param : (saved() || (osDark() ? "dark" : "light"));
  apply(initial);

  // --- inject the toggle button once the app bar exists ---
  function label(btn) {
    var dark = current() === "dark";
    btn.textContent = dark ? "☀️" : "🌙";
    btn.title = dark ? "Switch to light theme" : "Switch to dark theme";
    btn.setAttribute("aria-label", btn.title);
  }
  function mount() {
    var bar = document.querySelector(".appbar");
    if (!bar || bar.querySelector(".themetoggle")) return;
    var btn = document.createElement("button");
    btn.className = "themetoggle"; btn.type = "button";
    label(btn);
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label(btn);
    });
    bar.appendChild(btn);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
