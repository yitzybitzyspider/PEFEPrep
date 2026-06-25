/* PEFEPrep — Live Bank. Reads questions straight from Supabase (not the static
 * data/days/*.json files), so it shows the full bank across all 15 Knowledge Areas.
 * This is a PARALLEL page: the original ./browse.html (static day files) is untouched
 * and still works offline. Star / ✓ Got / ✗ Missed share the same localStorage progress
 * store (app/store.js) as the rest of the site, so your history carries across both. */
(function () {
  "use strict";
  var SUPABASE_URL = "https://aymngvobpehrnffnifls.supabase.co";
  var ANON_KEY = "sb_publishable_urkQ-XcNslpuvw-0o3lK3A_whR7fHZL"; // publishable (read-only via RLS)
  var KEYS = ["A", "B", "C", "D", "E", "F"];
  var SRCLBL = { handbook: "📘 Handbook", fundamental: "🧠 Fundamental", "in-stem": "📝 In-stem" };
  var ALL = [], QBYID = {}, KA = {};
  var FILT = { ka: "all", type: "all", source: "all", status: "all", q: "" };
  var $ = function (id) { return document.getElementById(id); };

  function api(path) {
    return fetch(SUPABASE_URL + "/rest/v1/" + path, {
      headers: { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY }
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  async function init() {
    try {
      var areas = await api("knowledge_areas?select=id,title,sort_order&order=sort_order");
      areas.forEach(function (a) { KA[a.id] = a; });
      ALL = await api("questions?select=*&order=ka_id&limit=5000");
      ALL.forEach(function (q) {
        q._ka = (KA[q.ka_id] || {}).title || ("KA " + q.ka_id);
        // Authored rows store raw LaTeX with no delimiters; wrap so KaTeX typesets them.
        q._eqs = (q.equations || []).map(function (e) { return /^\s*\$/.test(e) ? e : ("$" + e + "$"); });
        QBYID[q.id] = q;
      });
      $("srcline").textContent = "Live from Supabase · " + ALL.length + " questions · " + areas.length + " knowledge areas";
      buildFilters(); wire(); render();
    } catch (e) {
      $("list").innerHTML = "<div class='card'><p class='sub'>Couldn’t reach Supabase (" + e +
        "). The original <a href='./browse.html'>static Bank</a> still works.</p></div>";
    }
  }

  function countBy(fn) { var m = {}; ALL.forEach(function (q) { var k = fn(q); m[k] = (m[k] || 0) + 1; }); return m; }

  function buildFilters() {
    var byKa = countBy(function (q) { return q.ka_id; });
    var opts = '<option value="all">All areas (' + ALL.length + ")</option>";
    Object.keys(KA).map(Number).sort(function (a, b) { return a - b; }).forEach(function (id) {
      if (!byKa[id]) return;
      opts += '<option value="' + id + '">' + KA[id].title + " (" + byKa[id] + ")</option>";
    });
    $("fKa").innerHTML = opts;
    var byType = countBy(function (q) { return q.type; });
    $("fType").innerHTML = '<option value="all">All types</option>' +
      Object.keys(byType).sort().map(function (t) { return '<option value="' + t + '">' + t + " (" + byType[t] + ")</option>"; }).join("");
    var bySrc = countBy(function (q) { return q.source || "—"; });
    var lbl = { handbook: "Handbook", fundamental: "Fundamental", "in-stem": "In-stem" };
    $("fSrc").innerHTML = '<option value="all">All sources</option>' +
      Object.keys(bySrc).sort().map(function (s) { return '<option value="' + s + '">' + (lbl[s] || s) + " (" + bySrc[s] + ")</option>"; }).join("");
  }

  function setSeg(name, val) {
    var s = document.querySelector('[data-seg="' + name + '"]');
    Array.prototype.forEach.call(s.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.v === val); });
  }

  function wire() {
    $("fKa").onchange = function (e) { FILT.ka = e.target.value; render(); };
    $("fType").onchange = function (e) { FILT.type = e.target.value; render(); };
    $("fSrc").onchange = function (e) { FILT.source = e.target.value; render(); };
    $("fSearch").oninput = function (e) { FILT.q = e.target.value.toLowerCase(); render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-seg="status"] button'), function (b) {
      b.onclick = function () { FILT.status = b.dataset.v; setSeg("status", b.dataset.v); render(); };
    });
  }

  function statusOf(q) { var c = PFP.getCard(q.id); if (!c) return "unseen"; if (c.box >= 4) return "mastered"; return "learning"; }
  function missed(q) { return PFP.lastOutcome(q.id) === false; }
  function histStatus(q) { var o = PFP.lastOutcome(q.id); return o === null ? "new" : o ? "got" : "miss"; }

  function matches(q) {
    if (FILT.ka !== "all" && q.ka_id !== Number(FILT.ka)) return false;
    if (FILT.type !== "all" && q.type !== FILT.type) return false;
    if (FILT.source !== "all" && (q.source || "—") !== FILT.source) return false;
    if (FILT.status === "starred") { if (!PFP.isStarred(q.id)) return false; }
    else if (FILT.status === "missed") { if (!missed(q)) return false; }
    else if (FILT.status !== "all" && statusOf(q) !== FILT.status) return false;
    if (FILT.q) { var hay = (q.stem + " " + (q.concept || "") + " " + q._ka + " " + (q.handbook || "")).toLowerCase(); if (hay.indexOf(FILT.q) < 0) return false; }
    return true;
  }

  function badgeLabel(q) { var st = statusOf(q); var l = { unseen: "Unseen", learning: "Learning", mastered: "Mastered" }[st]; if (missed(q)) l += " · missed"; return l; }

  function updateCounts(shown) {
    if (typeof shown === "number") $("count").textContent = shown + " of " + ALL.length + " questions";
    var sc = PFP.starredCount(); $("cntStar").textContent = sc ? "(" + sc + ")" : "";
    var mc = ALL.filter(missed).length; $("cntMissed").textContent = mc ? "(" + mc + ")" : "";
  }

  function decorate(card, q) {
    var st = histStatus(q);
    card.querySelector(".dot").className = "dot " + st;
    var bdg = card.querySelector(".bdg"); bdg.className = "bdg " + statusOf(q); bdg.textContent = badgeLabel(q);
    var on = PFP.isStarred(q.id);
    var star = card.querySelector('[data-act="star"]'); star.classList.toggle("on", on); star.textContent = on ? "★ Saved" : "☆ Save";
    card.querySelector('[data-act="got"]').classList.toggle("on", st === "got");
    card.querySelector('[data-act="miss"]').classList.toggle("on", st === "miss");
  }

  function render() {
    var items = ALL.filter(matches);
    items.sort(function (a, b) { return a.ka_id - b.ka_id || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    updateCounts(items.length);
    $("list").innerHTML = items.length ? items.map(function (q) {
      var st = histStatus(q), on = PFP.isStarred(q.id);
      var hasOpts = Array.isArray(q.options) && q.options.length;
      var opts = hasOpts ? q.options.map(function (t, j) {
        return '<div class="opt' + (j === q.answer ? " correct" : "") + '"><span class="key">' + KEYS[j] + "</span><span>" + t + "</span></div>";
      }).join("") : '<div class="opt correct"><span class="key">✓</span><span>' + q.answer + "</span></div>";
      var eqs = (q._eqs && q._eqs.length)
        ? '<div class="eqbox" style="margin:4px 0 12px;"><h4>Equations</h4>' + q._eqs.map(function (e) { return '<div class="eq">' + e + "</div>"; }).join("") + "</div>" : "";
      var src = q.source ? '<span class="srcbadge">' + (SRCLBL[q.source] || q.source) + "</span>" : "";
      return '<div class="qcard" data-id="' + q.id + '">' +
        '<div class="qtop"><span class="topic-tag">' + q._ka + "</span> " + src + ' <span class="qtype">' + q.type + "</span>" +
          '<span class="qstatus"><span class="dot ' + st + '"></span><span class="bdg ' + statusOf(q) + '">' + badgeLabel(q) + "</span></span></div>" +
        (q.concept ? '<div class="qconcept">' + q.concept + "</div>" : "") +
        '<div class="qstem">' + q.stem + "</div>" +
        '<div class="qactions">' +
          '<button class="qact star' + (on ? " on" : "") + '" data-act="star">' + (on ? "★ Saved" : "☆ Save") + "</button>" +
          '<button class="qact mk-got' + (st === "got" ? " on" : "") + '" data-act="got">✓ Got it</button>' +
          '<button class="qact mk-miss' + (st === "miss" ? " on" : "") + '" data-act="miss">✗ Missed</button>' +
          '<button class="btn-ghost reveal" data-act="reveal">Show answer</button>' +
          '<button class="qact report" data-act="report" title="Report a problem with this question">⚑ Report</button>' +
        "</div>" +
        '<div class="qans hide">' + eqs +
          '<div class="opts" style="margin:12px 0;">' + opts + "</div>" +
          '<div class="sol">' + (q.solution || "") + "</div>" +
          '<div class="ref">Handbook: ' + (q.handbook || "—") + ' · <span class="qid">' + q.id + "</span></div>" +
        "</div></div>";
    }).join("") : "<div class='card'><p class='sub'>No questions match these filters.</p></div>";

    Array.prototype.forEach.call($("list").querySelectorAll(".qcard"), function (card) {
      var q = QBYID[card.dataset.id];
      Array.prototype.forEach.call(card.querySelectorAll(".qact, .reveal"), function (b) {
        b.onclick = function () {
          var act = b.dataset.act;
          if (act === "report") { if (window.PFPReport) PFPReport.open(q.id); return; }
          if (act === "reveal") {
            var ans = card.querySelector(".qans");
            var hidden = ans.classList.toggle("hide");
            b.textContent = hidden ? "Show answer" : "Hide answer";
            if (!hidden && window.renderMath) window.renderMath(ans);
            return;
          }
          if (act === "star") PFP.toggleStar(q.id);
          else if (act === "got") PFP.recordResult(q.id, true, q._ka);
          else if (act === "miss") PFP.recordResult(q.id, false, q._ka);
          decorate(card, q); updateCounts();
          if ((FILT.status === "starred" && !PFP.isStarred(q.id)) ||
              (FILT.status === "missed" && !missed(q))) render();
        };
      });
    });
    if (window.renderMath) window.renderMath($("list"));
  }

  window.addEventListener("DOMContentLoaded", init);
})();
