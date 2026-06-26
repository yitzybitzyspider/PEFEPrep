/* PEFEPrep — PWA glue: registers the service worker, surfaces an "update
 * available" refresh toast when a new version deploys, and offers an
 * "Install app" chip when the browser allows it. Theme-aware, dismissible,
 * and a no-op where service workers aren't supported. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  var DISMISS_KEY = "pefeprep_install_dismissed";

  function chip(html) {
    var el = document.createElement("div");
    el.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9990;max-width:min(92vw,420px);" +
      "background:var(--card,#fff);color:var(--ink,#1a1f2b);border:1px solid var(--accent,#e8620e);" +
      "border-radius:14px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.18);" +
      "font:600 13.5px/1.45 'Plus Jakarta Sans',system-ui,sans-serif;display:flex;gap:10px;align-items:center;";
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  }
  function btn(label, primary) {
    return '<button type="button" data-act="' + (primary ? "go" : "no") + '" style="' +
      "font:inherit;cursor:pointer;border-radius:9px;padding:7px 12px;min-height:36px;border:1px solid var(--line,#ddd);" +
      (primary ? "background:var(--accent,#e8620e);color:var(--accent-ink,#1a1205);border-color:transparent;font-weight:800;" : "background:transparent;color:var(--muted,#5b6373);") +
      '">' + label + "</button>";
  }

  // ---- update-available toast ----
  function offerUpdate(reg) {
    if (document.getElementById("pwaUpdate")) return;
    var el = chip('<span style="flex:1;">✨ A new version is ready.</span>' + btn("Refresh", true) + btn("Later", false));
    el.id = "pwaUpdate";
    el.querySelector('[data-act="go"]').onclick = function () {
      if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
      el.remove();
    };
    el.querySelector('[data-act="no"]').onclick = function () { el.remove(); };
  }

  // ---- install chip ----
  var deferred = null;
  function standalone() {
    return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }
  function recentlyDismissed() {
    try { var t = +localStorage.getItem(DISMISS_KEY) || 0; return (Date.now() - t) < 12096e5; } catch (e) { return false; } // 14 days
  }
  function offerInstall() {
    if (standalone() || recentlyDismissed() || document.getElementById("pwaInstall")) return;
    var el = chip('<span style="font-size:18px;">📲</span><span style="flex:1;">Install <strong>PEFEPrep</strong> for one-tap daily study, offline.</span>' + btn("Install", true) + btn("✕", false));
    el.id = "pwaInstall";
    el.querySelector('[data-act="go"]').onclick = function () {
      el.remove();
      if (deferred) { deferred.prompt(); deferred = null; }
    };
    el.querySelector('[data-act="no"]').onclick = function () {
      el.remove();
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
    };
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    if (document.readyState === "complete") offerInstall();
    else window.addEventListener("load", offerInstall);
  });
  window.addEventListener("appinstalled", function () {
    var el = document.getElementById("pwaInstall"); if (el) el.remove();
    try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
  });

  // ---- register ----
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg);
      reg.addEventListener("updatefound", function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", function () {
          if (nw.state === "installed" && navigator.serviceWorker.controller) offerUpdate(reg);
        });
      });
    }).catch(function () {});
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (reloaded) return; reloaded = true; location.reload();
    });
  });
})();
