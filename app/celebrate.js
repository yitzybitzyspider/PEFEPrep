/* PEFEPrep — celebrations: lightweight confetti + toasts, no dependencies.
 * window.PFPCelebrate({title, msg})  -> toast + confetti burst
 * window.PFPToast(title, msg)        -> toast only
 * Honors prefers-reduced-motion (skips confetti). */
(function () {
  "use strict";
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var toastWrap = null, canvas = null, ctx = null, parts = [], raf = null;

  function ensureDom() {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "pfp-toasts";
      document.body.appendChild(toastWrap);
    }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "pfp-confetti";
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
    }
  }

  function toast(title, msg) {
    ensureDom();
    var t = document.createElement("div");
    t.className = "pfp-toast";
    t.innerHTML = '<div class="pt-title">' + title + "</div>" + (msg ? '<div class="pt-msg">' + msg + "</div>" : "");
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("in"); });
    setTimeout(function () { t.classList.remove("in"); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350); }, 3600);
  }

  function resize() { if (!canvas) return; canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  var COLORS = ["#3ecf8e", "#4c8bf5", "#f5a623", "#f76d6d", "#b98bff", "#ffd166"];

  function burst() {
    if (reduce) return;
    ensureDom(); resize();
    var n = 90, cx = window.innerWidth / 2;
    for (var i = 0; i < n; i++) {
      parts.push({
        x: cx + (Math.random() - 0.5) * 220, y: window.innerHeight * 0.28 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 9, vy: Math.random() * -8 - 3,
        g: 0.22 + Math.random() * 0.12, size: 5 + Math.random() * 6,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[(Math.random() * COLORS.length) | 0], life: 0, ttl: 70 + Math.random() * 40
      });
    }
    if (!raf) tick();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      var alpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore();
      if (p.life >= p.ttl || p.y > canvas.height + 20) parts.splice(i, 1);
    }
    if (parts.length) { raf = requestAnimationFrame(tick); }
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); raf = null; }
  }

  var NUDGES = {
    quarter: ["🌱 25% of today's goal", "Good start — keep the momentum."],
    half: ["💪 Halfway to your goal", "You're cruising — finish strong."]
  };

  window.addEventListener("resize", resize);
  window.PFPToast = function (title, msg) { toast(title, msg); };
  window.PFPNudge = function (kind) { var n = NUDGES[kind]; if (n) toast(n[0], n[1]); };
  window.PFPCelebrate = function (opts) { opts = opts || {}; toast(opts.title || "Nice!", opts.msg || ""); burst(); };
})();
