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
  return { load: load };
})();
