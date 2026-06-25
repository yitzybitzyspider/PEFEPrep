/* PEFEPrep — "Report this question" modal.
 * Drop-in on any page: call PFPReport.open(questionId). If the supabase-js
 * client (window.PFP_SB) is present it attributes the report to the signed-in
 * user; otherwise it submits anonymously via REST with the publishable key.
 * Writes to public.question_reports (RLS allows anon + authenticated inserts). */
(function () {
  "use strict";
  var URL = "https://aymngvobpehrnffnifls.supabase.co";
  var ANON = "sb_publishable_urkQ-XcNslpuvw-0o3lK3A_whR7fHZL";
  var REASONS = [
    "Incorrect answer",
    "Typo or formatting error",
    "Unclear or ambiguous wording",
    "Wrong equation / Handbook reference",
    "Not relevant to the exam",
    "Other"
  ];
  var qid = null, built = false;

  function build() {
    if (built) return; built = true;
    var css = ".pfp-rov{position:fixed;inset:0;background:rgba(3,8,18,.66);display:none;align-items:center;justify-content:center;z-index:1000;padding:20px;}" +
      ".pfp-rov.on{display:flex;}" +
      ".pfp-rmodal{background:var(--card,#121c2e);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:16px;padding:24px;max-width:460px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.5);}" +
      ".pfp-rmodal h3{margin:0 0 4px;font-size:18px;}" +
      ".pfp-rsub{color:var(--muted,#93a1b8);font-size:13.5px;margin:0 0 16px;line-height:1.5;}" +
      ".pfp-rreasons{display:flex;flex-direction:column;gap:8px;margin-bottom:13px;}" +
      ".pfp-ropt{display:flex;align-items:center;gap:10px;background:var(--card2,#0f1828);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:10px;padding:10px 13px;font-size:14px;cursor:pointer;color:var(--ink,#e8eef7);}" +
      ".pfp-ropt:hover{border-color:var(--accent2,#4c8bf5);}" +
      ".pfp-ropt input{accent-color:var(--accent,#f5a623);width:16px;height:16px;}" +
      ".pfp-rta{width:100%;min-height:76px;background:var(--card2,#0f1828);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:10px;color:var(--ink,#e8eef7);padding:10px 12px;font:inherit;font-size:14px;resize:vertical;}" +
      ".pfp-ractions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;align-items:center;}" +
      ".pfp-rmsg{font-size:13px;color:var(--muted,#93a1b8);margin-right:auto;}";
    var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

    var ov = document.createElement("div"); ov.id = "pfpReportOv"; ov.className = "pfp-rov";
    ov.innerHTML = '<div class="pfp-rmodal" role="dialog" aria-modal="true">' +
      "<h3>Report this question</h3>" +
      '<p class="pfp-rsub">Flag it for review — pick what looks wrong, and add detail if you like.</p>' +
      '<div class="pfp-rreasons">' + REASONS.map(function (r, i) {
        return '<label class="pfp-ropt"><input type="radio" name="pfprr" value="' + r.replace(/"/g, "&quot;") + '"' + (i === 0 ? " checked" : "") + "><span>" + r + "</span></label>";
      }).join("") + "</div>" +
      '<textarea id="pfpRDetail" class="pfp-rta" placeholder="Optional details — what is wrong, the answer you think is right, etc. (required if you pick \'Other\')"></textarea>' +
      '<div class="pfp-ractions"><span class="pfp-rmsg" id="pfpRMsg"></span>' +
        '<button class="btn-ghost" id="pfpRCancel" type="button">Cancel</button>' +
        '<button class="btn-primary" id="pfpRSend" type="button">Send report</button></div>' +
      "</div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.getElementById("pfpRCancel").onclick = close;
    document.getElementById("pfpRSend").onclick = send;
  }

  function msg(t, bad) { var m = document.getElementById("pfpRMsg"); if (m) { m.textContent = t; m.style.color = bad ? "var(--bad,#f76d6d)" : "var(--muted,#93a1b8)"; } }
  function open(questionId) {
    build(); qid = questionId;
    document.getElementById("pfpRDetail").value = "";
    var first = document.querySelector('input[name="pfprr"]'); if (first) first.checked = true;
    msg(""); document.getElementById("pfpReportOv").classList.add("on");
  }
  function close() { var ov = document.getElementById("pfpReportOv"); if (ov) ov.classList.remove("on"); }

  async function send() {
    var picked = document.querySelector('input[name="pfprr"]:checked');
    var reason = picked ? picked.value : "Other";
    var detail = document.getElementById("pfpRDetail").value.trim();
    if (reason === "Other" && !detail) { msg("Add a detail for “Other”.", true); return; }
    var btn = document.getElementById("pfpRSend"); btn.disabled = true; msg("Sending…");
    try {
      if (window.PFP_SB) {
        var u = (await window.PFP_SB.auth.getUser()).data.user;
        var r = await window.PFP_SB.from("question_reports").insert({ question_id: qid, user_id: u ? u.id : null, reason: reason, detail: detail || null });
        if (r.error) throw r.error;
      } else {
        var resp = await fetch(URL + "/rest/v1/question_reports", {
          method: "POST",
          headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ question_id: qid, reason: reason, detail: detail || null })
        });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
      }
      msg("Thanks — reported ✓");
      setTimeout(close, 950);
    } catch (e) { msg("Couldn’t send: " + (e.message || e), true); }
    btn.disabled = false;
  }

  window.PFPReport = { open: open };
})();
