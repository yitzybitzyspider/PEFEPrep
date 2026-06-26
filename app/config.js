/* =====================================================================
 * PEFEPrep — EXAM CONFIG (the per-exam "fork surface")
 * ---------------------------------------------------------------------
 * This file holds everything specific to ONE exam. The rest of app/ is the
 * exam-agnostic ENGINE (study loop, spaced repetition, streaks, accounts,
 * plans, sync, PWA, design system). To stand up a prep app for a different
 * exam, you change THIS file + the content (questions, schedule, handbook,
 * branding assets) — not the engine. See docs/NEW-EXAM-PLAYBOOK.md.
 *
 * Loaded in <head> before store.js / plan-engine.js so they can read it.
 * Everything that reads this also has a hard-coded fallback, so the app
 * still works if this file is ever missing.
 * ===================================================================== */
window.APP_CONFIG = (function () {
  "use strict";

  // Knowledge areas: id → { name, w, family }
  //   w      = relative exam weight (NCEES FE Environmental question proportions);
  //            drives plan coverage in app/plan-engine.js.
  //   family = color family for the design system (see app/style.css --ka-*):
  //            water | air | waste | found | prof
  var KA = {
    1:  { name: "Mathematics",                          w: 6.5,  family: "found" },
    2:  { name: "Probability and Statistics",           w: 5,    family: "found" },
    3:  { name: "Ethics and Professional Practice",     w: 6.5,  family: "prof"  },
    4:  { name: "Engineering Economics",                w: 6.5,  family: "prof"  },
    5:  { name: "Fundamental Principles",               w: 9,    family: "found" },
    6:  { name: "Environmental Chemistry",              w: 9,    family: "found" },
    7:  { name: "Health Hazards and Risk Assessment",   w: 5,    family: "prof"  },
    8:  { name: "Fluid Mechanics and Hydraulics",       w: 15,   family: "water" },
    9:  { name: "Thermodynamics",                       w: 4,    family: "air"   },
    10: { name: "Surface Water Resources and Hydrology",w: 11.5, family: "water" },
    11: { name: "Groundwater, Soils, and Sediments",    w: 10,   family: "water" },
    12: { name: "Water and Wastewater",                 w: 15,   family: "water" },
    13: { name: "Air Quality and Control",              w: 10,   family: "air"   },
    14: { name: "Solid and Hazardous Waste",            w: 9,    family: "waste" },
    15: { name: "Energy and Environment",               w: 5,    family: "air"   }
  };
  var kaWeights = {};
  Object.keys(KA).forEach(function (k) { kaWeights[k] = KA[k].w; });

  return {
    examId:   "fe-environmental",     // stable slug; also the Supabase exam scope
    examName: "FE Environmental",     // human label shown in UI copy
    examDate: "2026-07-08",           // exam day (drives countdowns + plan length)

    brand: {
      full:   "PEFEPrep",
      a:      "PEFE",                 // amber half of the wordmark
      b:      "Prep",                 // ink half of the wordmark
      domain: "pefeprep.com"
    },
    tagline: "Pass the FE — 20 minutes a day.",

    // The closed-book reference students may use on exam day.
    handbook: { name: "NCEES FE Reference Handbook", version: "10.6" },

    knowledgeAreas: KA,
    kaWeights: kaWeights
  };
})();
