const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s); let fails = 0; const bad = (m) => { fails++; console.log("ÉCHEC :", m); };
const n = ev("EG_LIST.length");
for (let i = 0; i < n; i++) {
  if (!ev("!!EG_EX[" + i + "]")) { bad("pas d'exemple pour " + i); continue; }
  const r = ev(`(function(){const e=EG_EX[${i}],x=EG_LIST[${i}],g=new Chess(x.fen);if(e.o!==g.turn()&&false)return 'o';
    for(let k=0;k<e.st.length;k++){if(!g.move(e.st[k].s,{sloppy:true}))return 'illégal '+k+' '+e.st[k].s;
      if(!e.st[k].t||/undefined|NaN|\\[object/.test(e.st[k].t))return 'texte '+k;
      const v=e.st[k].v;if(v){for(const a of (v.arr||[]))if(!/^[a-h][1-8]$/.test(a[0])||!/^[a-h][1-8]$/.test(a[1]))return 'flèche '+k;
        for(const q of [...(v.out||[]),...(v.weak||[])])if(!/^[a-h][1-8]$/.test(q))return 'case '+k;}}
    return g.in_checkmate()?'mat':(g.in_draw()||g.in_stalemate()?'nulle':'fin')})()`);
  if (/illégal|texte|flèche|case/.test(r)) bad("exemple " + i + " : " + r);
  if (x_goal(i) === "win" && /^(0|1|2)$/.test(String(i)) && r !== "mat") bad("exemple " + i + " devrait finir par mat : " + r);
  ev("V.stack=[];VS=null;setTab('puz');V.trk='end';render()");
  ev("egStart(" + i + ")");
  if (ev("V.view") !== "egex") { bad("egStart " + i + " n'ouvre pas l'exemple : " + ev("V.view")); continue; }
  const steps = ev("EG_EX[" + i + "].st.length");
  for (let k = 0; k <= steps; k++) { ev("V.si=" + k + ";renderMain()"); if (!d.querySelector("#main .note")) bad("pas de note " + i + "/" + k); if (!d.querySelector("#main svg.viz") && k > 0 && ev("!!EG_EX[" + i + "].st[" + (k - 1) + "].v")) bad("pas de repères " + i + "/" + k); }
  d.querySelector('#main [data-act="egplay2"]').click();
  if (ev("V.view") !== "vs") bad("À toi " + i + " : " + ev("V.view"));
  const depth = ev("V.stack.length"); d.querySelector('#main [data-act="back"]').click();
  if (ev("V.view") !== "endg" && ev("V.view") !== "puz") bad("retour après À toi " + i + " : " + ev("V.view") + " pile " + depth);
}
function x_goal() { return "win"; }
console.log("exemples", n, "échecs", fails, errors.slice(0, 3)); process.exit(fails || errors.length ? 1 : 0);
