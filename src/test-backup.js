/* Tests sans navigateur : fusion de progression, import sécurisé, répétition espacée adaptative.
   Usage : cd src && node test-backup.js (pas besoin de chess.js ni de jsdom) */
const fs = require("fs");
const vm = require("vm");
const read = (f) => fs.readFileSync(__dirname + "/" + f, "utf8");
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("ÉCHEC :", m); } else console.log("ok    :", m); };

/* Faux navigateur minimal : suffit pour charger les fonctions pures */
const store = {};
const ctx = {
  console, Date, Math, JSON, Object, Array, Set, Map, String, Number, Promise, setTimeout, clearTimeout, URL, Blob: function () {},
  localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  navigator: {}, history: { pushState() {}, back() {} }, location: { href: "https://example.org/" },
  document: { addEventListener() {}, documentElement: { setAttribute() {}, removeAttribute() {} }, querySelector: () => null, getElementById: () => null, querySelectorAll: () => [] },
  window: { addEventListener() {}, scrollTo() {} }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const src = ["data.js", "core.js", "viz.js", "app.js", "extra.js", "backup.js"].map(read).join("\n") +
  "\n;globalThis.__t={S:()=>S,setS:(x)=>{S=x},applyResult,mergeState,bkParse,bkClean,LINES,diffDays,todayStr,defaults,adopt,INTERVALS};";
vm.runInContext(src, ctx);
const T = ctx.__t;

/* ---------- Fusion ---------- */
const A = { updated: 200, lines: { l1: { box: 2, due: "2026-10-10", seen: 1, tries: 3, errs: 1, last: "2026-10-05" } }, days: { "2026-10-01": 2, "2026-10-05": 1 }, best: 3, streak: 1, lastDay: "2026-10-05", custom: [{ id: "u1", name: "A" }], pz: { p1: { ok: 1, tries: 1, last: "2026-10-02" } }, user: "A" };
const B = { updated: 100, lines: { l1: { box: 4, due: "2026-10-20", seen: 1, tries: 5, errs: 0, last: "2026-10-09" }, l2: { box: 1, due: "2026-10-06", seen: 1, tries: 1, errs: 0, last: "2026-10-06" } }, days: { "2026-10-01": 5, "2026-10-09": 1 }, best: 6, streak: 4, lastDay: "2026-10-09", custom: [{ id: "u1", name: "B" }, { id: "u2", name: "B2" }], pz: { p1: { ok: 0, tries: 2, last: "2026-10-08" } }, user: "B" };
const M = T.mergeState(A, B);
ok(M.lines.l1.box === 4, "ligne : l'état le plus récent gagne (box 4)");
ok(!!M.lines.l2, "ligne présente d'un seul côté conservée");
ok(M.days["2026-10-01"] === 5 && M.days["2026-10-05"] === 1 && M.days["2026-10-09"] === 1, "jours d'activité : maximum par jour, union des dates");
ok(M.best === 6, "record = maximum des deux");
ok(M.lastDay === "2026-10-09" && M.streak === 4, "série : celle du jour d'activité le plus récent");
ok(M.custom.length === 2 && M.custom.find((c) => c.id === "u1").name === "A", "lignes perso : union par id, l'état prioritaire gagne");
ok(M.pz.p1.ok === 1, "un problème réussi ne redevient jamais non réussi");
ok(M.user === "A" && M.updated === 200, "réglages simples : état prioritaire ; date = la plus récente");
ok(A.lines.l1.box === 2, "la fusion ne modifie pas ses entrées");

const R = { updated: 150, resetAt: 150, lines: {} };
ok(Object.keys(T.mergeState(R, B).lines).length === 0, "une réinitialisation plus récente l'emporte sur l'ancien état");
ok(Object.keys(T.mergeState(B, R).lines).length === 0, "idem dans l'autre sens (pas de résurrection des données)");
const R2 = { updated: 90, resetAt: 90, lines: {} };
ok(Object.keys(T.mergeState(R2, B).lines).length === 2, "une activité postérieure à la réinitialisation est conservée");

/* ---------- Import ---------- */
ok(T.bkParse("pas du json").err, "import : texte invalide refusé");
ok(T.bkParse(JSON.stringify({ app: "autre", state: { lines: {} } })).err, "import : autre application refusée");
ok(T.bkParse(JSON.stringify({ app: "apres-ouverture", state: [] })).err, "import : état invalide refusé");
const evil = T.bkParse('{"app":"apres-ouverture","state":{"lines":{"x":{"seen":1}},"__proto__":{"polluted":1},"a":{"constructor":{"b":1}}}}');
ok(!evil.err && evil.seen === 1, "import : sauvegarde valide reconnue");
ok(!Object.prototype.hasOwnProperty.call(evil.state, "__proto__") && !("polluted" in {}) && !("constructor" in evil.state.a && Object.prototype.hasOwnProperty.call(evil.state.a, "constructor")), "import : clés dangereuses retirées");

/* ---------- Répétition espacée adaptative ---------- */
T.setS(T.defaults());
const id = T.LINES[0].id;
let prev = -1, mono = true;
for (let i = 0; i < 7; i++) {
  T.applyResult(id, 0, false);
  const l = T.S().lines[id], d = T.diffDays(T.todayStr(), l.due);
  if (d < prev) mono = false;
  prev = d;
}
const last = T.S().lines[id];
ok(mono, "sans faute : l'intervalle ne diminue jamais");
ok(last.box === 6 && T.diffDays(T.todayStr(), last.due) >= 32 && T.diffDays(T.todayStr(), last.due) <= 52, "7 réussites : case 6, révision dans 32 à 52 jours (facteur de facilité plafonné)");
ok(last.ease <= 1.6 && last.ease >= 0.7, "facteur de facilité borné (" + last.ease + ")");
T.applyResult(id, 3, false);
const l2 = T.S().lines[id];
ok(l2.box === 4 && T.diffDays(T.todayStr(), l2.due) < 32, "3 erreurs : la case baisse de 2 et la révision revient plus tôt");
for (let i = 0; i < 12; i++) T.applyResult(id, 3, false);
ok(T.S().lines[id].ease >= 0.7 && T.diffDays(T.todayStr(), T.S().lines[id].due) >= 1, "erreurs répétées : plancher respecté, jamais de date passée");

console.log(bad ? "\n" + bad + " échec(s)" : "\nTous les tests passent");
process.exit(bad ? 1 : 0);
