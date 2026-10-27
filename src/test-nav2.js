/* Parcours de navigation : chaque bouton qui ouvre une vue, puis retour jusqu'au point de départ (2 niveaux). */
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync(__dirname + "/test.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document;
w.scrollTo = () => {};
w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s);
let fails = 0, checks = 0;
const bad = (m) => { fails++; console.log("ÉCHEC :", m); };
const ACTS = ["pzpos", "pzth", "pzthgo", "vsundo", "theme", "plans", "concepts", "pzadapt", "rush", "daily", "xnew", "pznext", "matgo", "wpset", "analyse", "queue", "vsline", "learn", "drill", "edbranch", "edit", "m_start", "pzitem", "puz", "tab", "op", "struct", "rpch", "adopen", "stc", "sacs", "sac", "m_open", "endg", "eglesson", "matopen", "wpopen", "hardgo", "plgo", "w_open", "edadd", "vsopen", "sessgo", "sess", "egplay"];
const TABV = { home: "home", week: "home", rep: "rep", plans: "strat", concepts: "strat", pzpos: "strat", strat: "strat", puz: "puz", endg: "puz", eglesson: "puz", mats: "puz", wp: "puz", mind: "puz", games: "games", prog: "prog" };
const sig = (b) => b.getAttribute("data-act") + "|" + ["id", "v", "op", "ch", "dr", "i", "line", "hi", "kind"].map((k) => b.getAttribute("data-" + k) || "").join("|");
const state = () => ev("V.view + '/' + V.tab + '/' + V.stack.length");
const tabOn = () => { const e = d.querySelector('.rail .tab[aria-current="page"]'); return e ? e.getAttribute("data-v") : null; };

function navButtons() {
  const seen = new Set(), out = [];
  d.querySelectorAll("#main [data-act]").forEach((b) => {
    const a = b.getAttribute("data-act"); if (ACTS.indexOf(a) < 0) return;
    if (b.disabled) return;
    const s = sig(b); if (seen.has(s)) return; seen.add(s); out.push(s);
  });
  return out;
}
function find(s) {
  const [a, id, v, op, ch, dr, i, line, hi, kind] = s.split("|");
  const attrs = { id, v, op, ch, dr, i, line, hi, kind };
  return [...d.querySelectorAll("#main [data-act]")].find((b) => b.getAttribute("data-act") === a && Object.keys(attrs).every((k) => (b.getAttribute("data-" + k) || "") === attrs[k]));
}
function backTo(startState, startView, label) {
  let n = 0;
  while (ev("V.stack.length") > Number(startState.split("/")[2]) && n++ < 10) {
    const bk = d.querySelector('#main [data-act="back"]');
    if (!bk) { bad(label + " : pas de bouton retour en vue " + ev("V.view")); return false; }
    if (!bk.textContent.trim().replace("←", "").trim() && !bk.getAttribute("aria-label")) bad(label + " : bouton retour sans libellé");
    bk.click();
  }
  const st = state();
  if (st !== startState) { bad(label + " : retour à " + st + " au lieu de " + startState); return false; }
  return true;
}


const roots = ["home", "rep", "strat", "puz", "games", "prog"];
const TABV2 = TABV;
function reset(root) { ev("V.stack=[];T=null;P=null;VS=null;X=null;M=null;V.trk='tact';"); ev("setTab('" + root + "')"); }
const starts = [
  ["home", () => reset("home")],
  ["home+folds", () => { reset("home"); ev("V.open['hm-expl']=true;V.open['hm-prog']=true;render()"); }],
  ["rep+acc", () => { reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()"); }],
  ["strat", () => reset("strat")],
  ["concepts", () => { reset("strat"); ev("go('concepts')"); }],
  ["plans", () => { reset("strat"); ev("go('plans')"); }],
  ["pzpos", () => { reset("strat"); ev("go('pzpos')"); }],
  ["puz tact", () => reset("puz")],
  ["puz mind", () => { reset("puz"); ev("V.trk='mind';render()"); }],
  ["puz end", () => { reset("puz"); ev("V.trk='end';render()"); }],
  ["games", () => reset("games")],
  ["prog", () => reset("prog")]
];
let nodes = 0;
function replay(setup, path) { setup(); for (const s of path) { const b = find(s); if (!b) return false; b.click(); } return true; }
function dfs(name, setup, path, depth, parentState) {
  if (depth > 3) return;
  if (!replay(setup, path)) return;
  const here = state();
  const btns = navButtons().filter((s) => (!s.startsWith("tab|") || /\|(plans|concepts)\|/.test(s)) && !s.startsWith("sessgo") && ACTS.indexOf(s.split("|")[0]) >= 0);
  const seenViews = new Set();
  for (const s of btns) {
    if (!replay(setup, path)) break;
    const b = find(s); if (!b) continue;
    const label = name + " > " + path.concat([s]).map((x) => x.split("|").filter(Boolean).join(":")).join(" > ");
    b.click(); nodes++; checks++;
    const st = state(), v = ev("V.view");
    if (st === here) continue; // pas de changement de vue (état local)
    // retour : un seul clic sur retour doit revenir exactement à l'état d'avant
    const bk = d.querySelector('#main [data-act="back"]');
    if (!bk) { bad(label + " : pas de bouton retour en vue " + v); continue; }
    bk.click();
    if (state() !== here) { bad(label + " : un retour mène à " + state() + " au lieu de " + here); continue; }
    if (tabOn() !== TABV2[here.split("/")[1]] && TABV2[here.split("/")[1]]) bad(label + " : onglet actif incohérent " + tabOn());
    // descendre, en ne gardant qu'un exemple par type de vue aux niveaux profonds
    if (depth < 3) {
      const key = v; if (depth >= 2 && seenViews.has(key)) continue; seenViews.add(key);
      dfs(name, setup, path.concat([s]), depth + 1, here);
    }
  }
}
starts.forEach(([n, setup]) => dfs(n, setup, [], 1, null));
// boutons moteur/minuteur présents ? (rafale, adapté, défi, surprise)
reset("puz");
["pzadapt", "rush", "daily", "xnew"].forEach((a) => { checks++; const b = d.querySelector('#main [data-act="' + a + '"]'); if (!b) return bad("bouton " + a + " absent de S'entraîner"); b.click(); const v = ev("V.view"); if (v === "puz") bad(a + " n'ouvre rien"); const bk = d.querySelector('#main [data-act="back"], #main .rbar [data-act]'); ev("goBack()"); if (ev("V.view") !== "puz") bad(a + " : retour mène à " + ev("V.view")); reset("puz"); });
// Parties : jouer / analyser
reset("games"); checks++; d.querySelector('#main [data-act="vsopen"]').click(); if (ev("V.view") !== "vs") bad("vsopen : " + state()); ev("goBack()"); if (ev("V.view") !== "games") bad("retour de la partie : " + state());
// popstate depuis 3 niveaux
reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()");
d.querySelector('#main [data-act="rpch"]').click(); d.querySelector('#main [data-act="learn"]').click(); checks++;
const deep = ev("V.stack.length"); ev("IGN=0");w.dispatchEvent(new w.PopStateEvent("popstate")); ev("IGN=0");w.dispatchEvent(new w.PopStateEvent("popstate"));
if (ev("V.view") !== "rep" || ev("V.stack.length") !== deep - 2) bad("popstate x2 : " + state());
console.log("clics testés :", nodes, "vérifications :", checks, "échecs :", fails);
if (errors.length) { console.log("erreurs JS :", errors.slice(0, 5)); fails++; }
console.log(fails ? "ÉCHECS" : "TOUT PASSE");
process.exit(fails ? 1 : 0);
