/* PEFEPrep — data loader.
 * Reads data/manifest.json -> loads each data/days/dayNN.json -> flattens into
 * one questions array (injecting day/date/topic from each file header).
 * This is the seam the daily routine plugs into: add a day file + manifest entry
 * and the whole app (Today, Bank, Progress) updates with zero code changes.
 */
window.PFPDATA = (function () {
  var cache = null;
  async function load() {
    if (cache) return cache;
    var man;
    try { man = await (await fetch("./data/manifest.json", { cache: "no-store" })).json(); }
    catch (e) { man = { days: [] }; }
    var files = man.days || [];
    var parts = await Promise.all(files.map(function (f) {
      return fetch("./data/days/" + f + ".json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }));
    var all = [];
    parts.forEach(function (dj) {
      if (!dj) return;
      (dj.questions || []).forEach(function (q) {
        if (q.day == null) q.day = dj.day;
        if (!q.date) q.date = dj.date;
        if (!q.topic) q.topic = dj.topic;
        all.push(q);
      });
    });
    cache = all;
    return all;
  }
  // Markdown list of every question missed so far — paste into Claude as a tutor.
  function missedExport() {
    var KEYS = ["A", "B", "C", "D", "E", "F"];
    var all = cache || [];
    var missed = all.filter(function (q) { var c = PFP.getCard(q.id); return c && c.wrong > 0; });
    var byTopic = {};
    missed.forEach(function (q) { (byTopic[q.topic] = byTopic[q.topic] || []).push(q); });
    var t = new Date().toISOString().slice(0, 10);
    var lines = ["# PEFEPrep — questions I've missed (" + t + ")",
      "Total missed: " + missed.length, "",
      "Be my FE Environmental tutor: explain each of these, then quiz me on the weak spots.", ""];
    Object.keys(byTopic).forEach(function (topic) {
      lines.push("## " + topic);
      byTopic[topic].forEach(function (q) {
        var hasOpts = Array.isArray(q.options) && q.options.length;
        var ans = hasOpts ? (KEYS[q.answer] + ") " + q.options[q.answer]) : String(q.answer);
        var c = PFP.getCard(q.id);
        lines.push("- [" + q.id + "] " + q.stem);
        lines.push("    Correct: " + ans + "  |  Handbook: " + q.handbook + (c ? "  |  missed " + c.wrong + "x" : ""));
      });
      lines.push("");
    });
    if (!missed.length) lines.push("_No missed questions yet._");
    return lines.join("\n");
  }
  return { load: load, missedExport: missedExport };
})();
