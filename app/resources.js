/* PEFEPrep — PDFs / downloads page. Lists study PDFs from data/resources.json. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  fetch("./data/resources.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      $("resList").innerHTML = (d.groups || []).map(function (g) {
        return '<section class="card"><h2>' + g.title + "</h2>" +
          g.items.map(function (it) {
            var url = it.url || ("https://drive.google.com/file/d/" + it.id + "/view");
            return '<div class="schrow"><div class="schmain"><div class="schtopic">📄 ' + it.name + "</div></div>" +
              '<a class="reviewbtn" href="' + url + '" target="_blank" rel="noopener">Open / Download →</a></div>';
          }).join("") + "</section>";
      }).join("");
    })
    .catch(function (e) { $("resList").innerHTML = "<section class='card'><p class='sub'>Couldn’t load resources: " + e + "</p></section>"; });
})();
