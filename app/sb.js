/* PEFEPrep — Supabase client, auth, and per-user store.
 * Powers the signed-in experience (account / plan / dashboard). Requires the
 * supabase-js v2 CDN script to be loaded first (global `supabase`).
 * The static daily site and the Live Bank are unaffected by this file. */
(function () {
  "use strict";
  var URL = "https://aymngvobpehrnffnifls.supabase.co";
  var ANON = "sb_publishable_urkQ-XcNslpuvw-0o3lK3A_whR7fHZL";
  if (!window.supabase) { console.error("supabase-js not loaded before sb.js"); return; }
  var SB = window.supabase.createClient(URL, ANON);
  var _uid = null;

  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function addDays(iso, n) { var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function leitnerDays(box) { return [1, 1, 2, 4, 7, 14][Math.max(0, Math.min(5, box))]; }

  var Auth = {
    client: SB,
    async user() { var r = await SB.auth.getUser(); _uid = r.data && r.data.user ? r.data.user.id : null; return r.data ? r.data.user : null; },
    uid() { return _uid; },
    async signInGoogle(redirectTo) {
      return SB.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo || (location.origin + "/dashboard.html") } });
    },
    async signOut() { await SB.auth.signOut(); _uid = null; },
    onChange(cb) { SB.auth.onAuthStateChange(function (_e, s) { _uid = s && s.user ? s.user.id : null; cb(s); }); },
    /* Guard a page: returns the user, or redirects to account.html if signed out. */
    async require() {
      var u = await this.user();
      if (!u) { location.href = "./account.html"; return null; }
      return u;
    }
  };

  var Store = {
    async getProfile() {
      var r = await SB.from("profiles").select("*").maybeSingle();
      return r.data || null;
    },
    async saveProfile(patch) {
      patch.id = _uid; patch.updated_at = new Date().toISOString();
      var r = await SB.from("profiles").upsert(patch).select().maybeSingle();
      return r.data;
    },
    async activePlan() {
      var r = await SB.from("plans").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return r.data || null;
    },
    /* Archive any existing active plan, then insert the new plan + its days. */
    async createPlan(plan, days) {
      await SB.from("plans").update({ status: "archived" }).eq("status", "active");
      plan.user_id = _uid;
      var pr = await SB.from("plans").insert(plan).select().single();
      if (pr.error) throw pr.error;
      var pid = pr.data.id;
      var rows = days.map(function (d) {
        return { plan_id: pid, user_id: _uid, day_index: d.day_index, date: d.date, kind: d.kind, label: d.label, question_ids: d.question_ids, meta: d.meta };
      });
      // insert in chunks of 100
      for (var i = 0; i < rows.length; i += 100) {
        var er = await SB.from("plan_days").insert(rows.slice(i, i + 100));
        if (er.error) throw er.error;
      }
      return pr.data;
    },
    async planDays(planId) {
      var r = await SB.from("plan_days").select("*").eq("plan_id", planId).order("day_index", { ascending: true });
      return r.data || [];
    },
    async dayForDate(planId, dateISO) {
      var r = await SB.from("plan_days").select("*").eq("plan_id", planId).eq("date", dateISO).maybeSingle();
      return r.data || null;
    },
    async questionsByIds(ids) {
      if (!ids || !ids.length) return [];
      var out = [];
      for (var i = 0; i < ids.length; i += 200) {
        var r = await SB.from("questions").select("*").in("id", ids.slice(i, i + 200));
        if (r.data) out = out.concat(r.data);
      }
      // preserve requested order
      var by = {}; out.forEach(function (q) { by[q.id] = q; });
      return ids.map(function (id) { return by[id]; }).filter(Boolean);
    },
    /* Lightweight pool for the plan generator: id + ka_id only. */
    async questionPool() {
      var out = [], from = 0, page = 1000;
      while (true) {
        var r = await SB.from("questions").select("id,ka_id").range(from, from + page - 1);
        if (r.error || !r.data || !r.data.length) break;
        out = out.concat(r.data);
        if (r.data.length < page) break;
        from += page;
      }
      return out;
    },
    /* Record an answer + advance the Leitner box (spaced-repetition resurfacing). */
    async recordAttempt(a) {
      a.user_id = _uid;
      await SB.from("attempts").insert(a);
      var cur = await SB.from("review_state").select("*").eq("question_id", a.question_id).maybeSingle();
      var rs = cur.data;
      var box = rs ? rs.box : 1;
      box = a.correct ? Math.min(box + 1, 5) : 1;
      var rec = {
        user_id: _uid, question_id: a.question_id, box: box,
        attempts: (rs ? rs.attempts : 0) + 1,
        wrong: (rs ? rs.wrong : 0) + (a.correct ? 0 : 1),
        due_date: addDays(todayISO(), leitnerDays(box)),
        last_seen: new Date().toISOString()
      };
      await SB.from("review_state").upsert(rec);
      return rec;
    },
    /* Questions due for review today (missed/low-box resurfacing). */
    async dueReviews(limit) {
      var r = await SB.from("review_state").select("question_id,box,wrong")
        .lte("due_date", todayISO()).order("box", { ascending: true }).limit(limit || 30);
      return r.data || [];
    },
    /* Per-user stats for the dashboard progress view. */
    async stats() {
      var a = await SB.from("attempts").select("correct", { count: "exact" });
      var total = a.count || 0;
      var c = await SB.from("attempts").select("id", { count: "exact" }).eq("correct", true);
      var mastered = await SB.from("review_state").select("question_id", { count: "exact" }).gte("box", 4);
      return { attempts: total, correct: c.count || 0, mastered: mastered.count || 0 };
    },
    /* Latest outcome per question so the dashboard can show got/missed dots. */
    async outcomesFor(ids) {
      if (!ids || !ids.length) return {};
      var r = await SB.from("review_state").select("question_id,box,wrong,attempts").in("question_id", ids);
      var m = {}; (r.data || []).forEach(function (x) { m[x.question_id] = x; });
      return m;
    }
  };

  window.PFP_SB = SB;
  window.PFPAuth = Auth;
  window.PFPUser = Store;
  window.PFPDates = { todayISO: todayISO, addDays: addDays };
})();
