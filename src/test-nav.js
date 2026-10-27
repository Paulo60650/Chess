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
const ACTS = ["tab", "op", "struct", "rpch", "adopen", "stc", "sacs", "sac", "m_open", "endg", "eglesson", "matopen", "wpopen", "hardgo", "plgo", "w_open", "edadd", "vsopen", "vsundo", "theme", "pzth", "pzthgo", "sessgo", "sess", "egplay", "egplay2", "egexo", "pzex", "mexo", "actset"];
const TABV = { home: "home", week: "home", rep: "rep", plans: "strat", concepts: "strat", pzpos: "strat", strat: "strat", puz: "puz", endg: "puz", eglesson: "puz", egex: "puz", pzex: "puz", mex: "puz", mats: "puz", wp: "puz", mind: "puz", games: "games", prog: "prog" };
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

function reset(root) { ev("V.stack=[];T=null;P=null;VS=null;X=null;V.trk='tact';"); ev("setTab('" + root + "')"); }

(function run() {
  // Onglets : chacun s'ouvre et se met en surbrillance, y compris depuis un autre onglet
  roots.forEach((r) => {
    roots.forEach((r2) => { reset(r); d.querySelector('.rail .tab[data-v="' + r2 + '"]').click(); checks++; if (ev("V.view") !== r2 || tabOn() !== r2 || ev("V.stack.length") !== 0) bad("onglet " + r + " -> " + r2 + " : " + state() + " surbrillance " + tabOn()); });
  });
  // Sous-pages Répertoire
  ["plans", "concepts"].forEach((v) => { reset("strat"); d.querySelector('#main [data-act="tab"][data-v="' + v + '"]').click(); checks++; if (ev("V.view") !== v || tabOn() !== "strat" || ev("V.stack.length") !== 1) bad("sous-page " + v + " : " + state() + " onglet " + tabOn()); d.querySelector('#main [data-act="back"]').click(); if (ev("V.view") !== "strat" || ev("V.stack.length") !== 0) bad("retour sous-page " + v + " : " + state()); });
  reset("strat"); d.querySelector('#main [data-act="pzpos"]').click(); checks++; if (ev("V.view") !== "pzpos") bad("problèmes de plans : " + state()); d.querySelector('#main [data-act="back"]').click(); if (ev("V.view") !== "strat") bad("retour problèmes de plans");
  // Segment S'entraîner
  ["tact", "mind", "end"].forEach((k) => { reset("puz"); d.querySelector('#main [data-act="trk"][data-v="' + k + '"]').click(); checks++; if (ev("V.trk") !== k) bad("segment " + k); });

  const visited = new Set();
  const plan = [];
  // Niveau 1 depuis chaque racine (et chaque état d'affichage)
  const views = [
    ["home", () => reset("home")],
    ["home+explorer", () => { reset("home"); ev("V.open['hm-expl']=true;V.open['hm-prog']=true;render()"); }],
    ["rep", () => { reset("rep"); }],
    ["rep+accordéon", () => { reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()"); }],
    ["strat", () => { reset("strat"); }],
    ["concepts", () => { reset("strat"); ev("go('concepts')"); }],
    ["plans", () => { reset("strat"); ev("go('plans')"); }],
    ["puz tact", () => { reset("puz"); }],
    ["puz mind", () => { reset("puz"); ev("V.trk='mind';render()"); }],
    ["puz end", () => { reset("puz"); ev("V.trk='end';render()"); }],
    ["games", () => reset("games")],
    ["prog", () => reset("prog")]
  ];
  views.forEach(([name, setup]) => {
    setup();
    const btns = navButtons();
    const startState = state();
    btns.forEach((s) => {
      setup();
      const b = find(s); if (!b) return;
      const label = name + " > " + s.split("|").filter(Boolean).join(":");
      checks++;
      b.click();
      const st1 = state();
      const v1 = ev("V.view");
      if (s.startsWith("tab|") && !/\|(plans|concepts)\|/.test(s)) { // changement d'onglet : pas de pile, bon onglet
        if (ev("V.stack.length") !== 0) bad(label + " : pile non vide après changement d'onglet");
        return;
      }
      if (st1 === startState) { return; } // action sans changement de vue (désactivée / pas de ligne)
      if (!backTo(startState, ev("V.view"), label)) return;
      // niveau 2
      setup(); find(s).click();
      const mid = state();
      const btns2 = navButtons();
      btns2.forEach((s2) => {
        if ((s2.startsWith("tab|") && !/\|(plans|concepts)\|/.test(s2)) || s2.startsWith("sessgo") || s2.startsWith("sess|")) return;
        if (s2 === s) return;
        // revenir à l'état intermédiaire
        setup(); find(s).click();
        const b2 = find(s2); if (!b2) return;
        const l2 = label + " >> " + s2.split("|").filter(Boolean).join(":");
        checks++;
        b2.click();
        if (state() === mid) return;
        if (!backTo(mid, ev("V.view"), l2)) return;
        // et encore un retour jusqu'au départ
        if (!backTo(startState, ev("V.view"), l2 + " (retour racine)")) return;
        // l'onglet actif reste cohérent
        const expTab = TABV[startState.split("/")[0]];
        if (tabOn() !== expTab) bad(l2 + " : onglet actif " + tabOn() + " au lieu de " + expTab);
      });
    });
  });
  // Depuis une vue profonde, chaque onglet ramène à sa racine avec une pile vide
  roots.forEach((r) => {
    reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()");
    d.querySelector('#main [data-act="rpch"]').click(); d.querySelector('#main [data-act="learn"]') && d.querySelector('#main [data-act="learn"]').click();
    checks++;
    if (ev("V.stack.length") < 2) bad("vue profonde non atteinte : " + state());
    d.querySelector('.rail .tab[data-v="' + r + '"]').click();
    if (ev("V.view") !== r || ev("V.stack.length") !== 0 || tabOn() !== r) bad("onglet " + r + " depuis une vue profonde : " + state());
  });
  // Libellés du bouton retour selon l'origine
  reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()"); d.querySelector('#main [data-act="rpch"]').click(); checks++;
  if (!/Répertoire/.test(d.querySelector('#main .back').textContent)) bad("libellé retour depuis le répertoire : " + d.querySelector('#main .back').textContent);
  reset("home"); d.querySelector('#main [data-act="op"], #main [data-act="sess"]') ; ev("go('op',{opId:OPENINGS[0].id})"); checks++;
  if (!/Aujourd'hui/.test(d.querySelector('#main .back').textContent)) bad("libellé retour depuis Aujourd'hui : " + d.querySelector('#main .back').textContent);
  reset("puz"); ev("V.trk='end';EG_CHAPS.forEach((c)=>{V.open['egc-'+c.id]=true});render()"); d.querySelector('#main [data-act="eglesson"]').click(); checks++;
  if (!/S'entraîner/.test(d.querySelector('#main .back').textContent)) bad("libellé retour leçon : " + d.querySelector('#main .back').textContent);
  // Bouton retour du navigateur (popstate) : même effet que le bouton retour
  reset("rep"); ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()");
  const first = d.querySelector('#main [data-act="op"]'); first.click(); checks++;
  if (ev("V.view") !== "op") bad("op non ouverte");
  ev("IGN=0");w.dispatchEvent(new w.PopStateEvent("popstate"));
  if (ev("V.view") !== "rep") bad("popstate depuis une ouverture : " + state());
  console.log("vérifications :", checks, "échecs :", fails);
  if (errors.length) { console.log("erreurs JS :", errors.slice(0, 5)); fails++; }
  console.log(fails ? "ÉCHECS" : "TOUT PASSE");
  process.exit(fails ? 1 : 0);
})();
