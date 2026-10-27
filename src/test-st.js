const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {};
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC :", m); } else console.log("ok :", m); };
const ev = (s) => w.eval(s);
ev(`V.stack=[];go("home");render()`);
const ids = ["bpair", "bpbreak", "iqp", "minor", "hang", "zugzwang", "pillsbury", "openfile", "weakking", "prophyl"];
let bad = 0;
ids.forEach((id) => {
  ev(`V.stack=[];V.view="concepts";stConceptOpen("${id}")`);
  const t = d.querySelector("#main").textContent;
  if (/undefined|NaN/.test(t)) { bad++; console.log("page sale", id); }
  const n = d.querySelectorAll('#main [data-act="pzopen"]').length, m = d.querySelectorAll('#main [data-act="stgo"]').length;
  console.log(id, "exercices", n, "boutons", m);
  // parcourir toute l'illustration
  const ill = ev(`STRAT_BY["${id}"].ills[0].sans.length`);
  ev(`V.si=STRAT_BY["${id}"].ills[0].from`);
  for (let i = 0; i < ill; i++) { ev(`V.si=Math.min(V.si+1,STRAT_BY["${id}"].ills[0].sans.length);renderMain()`); if (/undefined|NaN/.test(d.querySelector("#main").textContent)) { bad++; console.log("illustration sale", id, i); break; } }
  ev(`pzList=pzList`);
  const exs = ev(`allPz().filter(p=>p.cpt==="${id}").map(p=>p.id)`);
  exs.forEach((pid) => { ev(`V.stack=[];puzOpen("${pid}",{mode:"free"})`); if (/undefined|NaN/.test(d.querySelector("#main").textContent)) { bad++; console.log("exercice sale", pid); } });
});
ok(bad === 0, "pages, illustrations et exercices propres");
// chapitre sacrifices dans une ouverture
ev(`V.stack=[];V.opId="ita";V.view="op";V.open["ita-sacs"]=true;render()`);
ok(d.querySelectorAll('#main [data-act="sac"]').length === ev(`SACS.filter(s=>s.op==="ita").length`), "sacrifices listés dans l'ouverture");
ok(!/Sacrifices typiques/.test(ev(`(function(){go("tab");return ""})()`) || ""), "ok");
ev(`V.stack=[];go("home")`);
ok(!/Sacrifices typiques/.test(d.querySelector("#main").textContent), "plus de tuile Sacrifices sur l'accueil");
console.log("erreurs JS:", errors.length, errors.slice(0, 2).map(String).join(" ").slice(0, 300));
console.log(fails || errors.length ? "ÉCHECS" : "TOUT PASSE");
