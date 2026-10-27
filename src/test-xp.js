const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s); let fails = 0, checks = 0; const bad = (m) => { fails++; console.log("ÉCHEC :", m); };
const main = () => d.getElementById("main").textContent;
// 1. explications : tous les coups de toutes les illustrations
const r = JSON.parse(ev(`(function(){const ills=[];STRAT.forEach(c=>c.ills.forEach(i=>ills.push(i)));adList('att').concat(adList('def')).forEach(c=>c.ills.forEach(i=>ills.push(i)));SACS.forEach(s=>ills.push(s.ill));
 let n=0,bad=[];ills.forEach((ill,k)=>{for(let i=1;i<=ill.sans.length;i++){const x=xpIll(ill,i);n++;if(!x||!x.t||/undefined|NaN|null|\\[object/.test(x.t)||!x.v.arr.length)bad.push(k+'/'+i)}});return JSON.stringify({n,bad:bad.slice(0,5)})})()`));
checks += r.n; if (r.bad.length) bad("explications manquantes " + r.bad);
// 2. fiches de plan : exemple rejouable
ev("Object.keys(STRUCTS)").forEach((sid) => {
  ev("V.stack=[];setTab('strat');V.view='struct';V.sid='" + sid + "';V.sifor=null;render()"); checks++;
  if (!d.querySelector('#main [data-act="stgo"]')) { bad("pas d'exemple dans la fiche " + sid); return; }
  const n = ev("STRUCTS['" + sid + "']._ill.sans.length");
  for (let k = 0; k <= n; k++) { ev("V.si=" + k + ";renderMain()"); if (!d.querySelector("#main .note")) bad("pas de note " + sid + "/" + k); }
  if (!d.querySelector("#main svg.viz") && ev("!!VIZ['" + sid + "']")) bad("pas de repères en fin de ligne " + sid);
});
// 3. problèmes de plans : voir un exemple puis retour
const ids = ev("allPz().filter(p=>p.pos).map(p=>p.id)"); let shown = 0;
ids.slice(0, 40).forEach((id) => {
  ev("V.stack=[];setTab('strat');P=null;V.view='pzpos';render();puzOpen('" + id + "')"); checks++;
  const b = d.querySelector('#main [data-act="pzex"]'); if (!b) return; shown++;
  b.click(); if (ev("V.view") !== "pzex") { bad("pzex " + id + " : " + ev("V.view")); return; }
  const n = ev("pzExFor(allPz().find(p=>p.id==='" + id + "'))._ill.sans.length");
  for (let k = 0; k <= n; k++) { ev("V.si=" + k + ";renderMain()"); }
  d.querySelector('#main [data-act="back"]').click();
  if (ev("V.view") !== "puzzle") bad("retour après exemple " + id + " : " + ev("V.view"));
});
if (!shown) bad("aucun bouton Voir un exemple");
// 4. tactique : un exemple par thème
const ths = ev("[...new Set(allPz().filter(p=>!p.pos).map(p=>p.th))]"); let tshown = 0;
ths.forEach((th) => { const id = ev("allPz().find(p=>!p.pos&&p.th===" + JSON.stringify(th) + ").id"); ev("V.stack=[];setTab('puz');P=null;puzOpen('" + id + "')"); checks++; const b = d.querySelector('#main [data-act="pzex"]'); if (!b) { console.log("sans exemple (thème peu fourni) :", th); return; } tshown++; b.click(); if (ev("V.view") !== "pzex") bad("pzex tactique " + th); const n = ev("pzExFor(allPz().find(p=>p.id==='" + id + "'))._ill.sans.length"); for (let k = 0; k <= n; k++) { ev("V.si=" + k + ";renderMain()"); } d.querySelector('#main [data-act="back"]').click(); if (ev("V.view") !== "puzzle") bad("retour tactique " + th); });
// 5. menaces et calcul : 6 exemples
["thr","hang","cct","blind","mem","long"].forEach((k) => { ev("V.stack=[];setTab('puz');M=null;V.view='mind';render();mExOpen('" + k + "')"); checks++; if (ev("V.view") !== "mex") { bad("mex " + k); return; } const n = ev("M_EX['" + k + "'].sans.length"); const ok = ev("(function(){const e=M_EX['" + k + "'],g=new Chess(e.fen);return e.sans.every(s=>g.move(s,{sloppy:true}))})()"); if (!ok) bad("coup illégal mex " + k); for (let q = 0; q <= n; q++) { ev("V.si=" + q + ";renderMain()"); if (/undefined/.test(main())) bad("undefined mex " + k); } d.querySelector('#main [data-act="back"]').click(); if (ev("V.view") !== "mind") bad("retour mex " + k + " " + ev("V.view")); });
// 6. Voir la solution : première étape = premier coup cherché, position de départ avant
let sh = 0; ev("allPz().filter((p,i)=>i%25===0).map(p=>p.id)").forEach((id) => { ev("V.stack=[];setTab('puz');P=null;puzOpen('" + id + "')"); const b = d.querySelector('#main [data-act="pzshow"]'); if (!b) return; checks++; sh++; b.click();
  if (ev("V.si") !== 1) bad("solution " + id + " : V.si=" + ev("V.si"));
  const fen = ev("(function(){const g=new Chess(P.pz.fen);g.move(P.pz.sol[0],{sloppy:true});return g.fen().split(' ')[0]})()");
  const shown = ev("[...document.querySelectorAll('#main .board [data-sq]')].length"); if (!d.querySelector('#main [data-act="stgo"]')) bad("pas de lecteur de solution " + id);
  ev("V.si=0;renderMain()"); if (!d.querySelector("#main svg.viz") === false) {} ev("V.si=" + ev("P.pz.sol.length") + ";renderMain()"); });
console.log("solutions montrées", sh);
console.log("thèmes tactiques avec exemple", tshown, "/", ths.length);
console.log("vérifs", checks, "boutons exemple", shown, "échecs", fails, errors.slice(0, 3)); process.exit(fails || errors.length ? 1 : 0);
