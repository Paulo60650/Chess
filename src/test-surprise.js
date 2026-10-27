const fs = require("fs"); const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true });
const w = dom.window, d = w.document; w.scrollTo = () => {}; const ev = (s) => w.eval(s);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC :", m); } else console.log("ok :", m); };
ev(`S.lines={}; S.hard={}; ["lon1","ita1"].forEach(id=>{S.lines[id]={seen:1,box:5,due:'2999-01-01'}}); S.lines.pir1={seen:1,box:0,due:'2000-01-01'};`);
// 1) hors plans : uniquement des lignes vues
const real = w.Math.random; let first = true; let forced = 0.9;
let always = null;
w.Math.random = () => { if (always != null) return always; if (first) { first = false; return forced; } return real.call(w.Math); };
const ids = {}; let bad = 0;
for (let k = 0; k < 24; k++) { first = true; forced = 0.9; ev("V.stack=[];V.view='home';X=null;P=null;xNew()"); const id = ev("X&&X.L.id"); ids[id] = (ids[id] || 0) + 1; if (!id || !["lon1","ita1","pir1"].includes(id)) bad++; }
ok(bad === 0, "toutes les positions viennent de lignes vues : " + JSON.stringify(ids));
ok((ids.pir1 || 0) >= (ids.lon1 || 0), "la ligne à réviser / faible tombe plus souvent (" + (ids.pir1 || 0) + " contre " + (ids.lon1 || 0) + ")");
// 2) repli quand rien n'est vu
ev(`S.lines={}`); first = true; forced = 0.9; ev("V.stack=[];V.view='home';X=null;xNew()"); ok(ev("V.view") === "surprise" && !!ev("X"), "aucune ligne vue : repli sur tout le répertoire");
// 3) problème de plan
ev(`S.pz={}`); first = true; forced = 0.1; ev("V.stack=[];V.view='strat';V.tab='strat';X=null;P=null;xNew()");
ok(ev("V.view") === "puzzle" && ev("P.mode") === "surprise" && ev("!!P.pz.pos"), "position surprise de milieu de jeu (problème de plan)");
ok(/Position surprise|Stratégie/.test(d.querySelector("#main .back").textContent), "libellé de retour : " + d.querySelector("#main .back").textContent);
ev("puzShow()"); ok(!!d.querySelector('[data-act="xnew2"]'), "bouton « Autre position surprise »");
always = 0.9; d.querySelector('[data-act="xnew2"]').click();
ok(ev("V.view") === "surprise" && ev("V.stack.length") === 1, "autre position : vue " + ev("V.view") + " pile " + ev("V.stack.length"));
always = null; ev("goBack()"); ok(ev("V.view") === "strat" && ev("V.stack.length") === 0, "retour au point de départ : " + ev("V.view"));
w.Math.random = real; console.log(fails ? "ÉCHECS" : "TOUT PASSE"); process.exit(fails ? 1 : 0);
