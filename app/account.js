/* PEFEPrep — account page: Google sign-in + exam-date profile. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  async function init() {
    var user = await PFPAuth.user();
    if (!user) {
      $("signedOut").style.display = "";
      $("googleBtn").onclick = function () { PFPAuth.signInGoogle(location.origin + location.pathname.replace(/account\.html$/, "dashboard.html")); };
      return;
    }
    $("signedIn").style.display = "";
    $("who").textContent = "Signed in as " + (user.email || user.id);
    if (window.PFPMigrate) PFPMigrate.banner($("migrateHost"));
    var prof = await PFPUser.getProfile();
    var exam = (prof && prof.exam_date) || "2026-07-08"; // FE Environmental default
    $("examDate").value = exam;
    if (!prof || !prof.exam_date) { await PFPUser.saveProfile({ exam_date: exam }); }

    $("saveDate").onclick = async function () {
      var v = $("examDate").value;
      if (!v) { $("dateMsg").textContent = "Pick a date."; return; }
      await PFPUser.saveProfile({ exam_date: v });
      $("dateMsg").textContent = "Saved ✓";
      setTimeout(function () { $("dateMsg").textContent = ""; }, 1500);
    };
    $("signOut").onclick = async function () { await PFPAuth.signOut(); location.reload(); };
  }

  window.addEventListener("DOMContentLoaded", init);
})();
