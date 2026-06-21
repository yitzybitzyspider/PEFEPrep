/* PEFEPrep — version badge + changelog.
 * Fetches changelog.json with no-store (bypasses the 10-min edge cache) so the
 * badge always reflects the latest deployed build. Auto-injects a floating
 * badge on every page; fills #changelog on the changelog page.
 */
(function () {
  function fmt(d) {
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    catch (e) { return d; }
  }
  fetch("./data/changelog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var badge = document.getElementById("verBadge");
      if (!badge) {
        badge = document.createElement("a");
        badge.id = "verBadge";
        badge.href = "./changelog.html";
        badge.className = "verbadge";
        document.body.appendChild(badge);
      }
      badge.textContent = "v" + d.version;
      badge.title = "Updated " + fmt(d.updated) + " — tap for what's new";

      var log = document.getElementById("changelog");
      if (log && d.history) {
        log.innerHTML = d.history.map(function (h) {
          return '<div class="card"><div class="qtop" style="margin-bottom:10px;">' +
            '<h2 style="margin:0;font-size:18px;">' + h.title + "</h2>" +
            '<span class="tag">v' + h.version + " · " + fmt(h.date) + "</span></div>" +
            '<ul class="chlist">' +
            h.changes.map(function (c) { return "<li>" + c + "</li>"; }).join("") +
            "</ul></div>";
        }).join("");
      }
    })
    .catch(function () { /* offline / not deployed yet */ });
})();
