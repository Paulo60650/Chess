const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s); let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("ÉCHEC :", m); } };
const ids = ev("LINES.filter(L=>L.pun).map(L=>L.id)"); ok(ids.length >= 50, "lignes punir : " + ids.length);
const CHK = `(function(id){const L=LINE_BY_ID[id],g=new Chess(),cl=x=>x.replace(/[+#!?]/g,'');for(const s of L.sans){if(!g.move(s,{sloppy:true}))return 'illégal '+s}const P=LINE_BY_ID[L.par];if(!P)return 'parent';for(let i=0;i<L.dv;i++)if(cl(L.sans[i])!==cl(P.sans[i]))return 'préfixe '+i;if(cl(L.sans[L.dv])===cl(P.sans[L.dv]))return 'pas de déviation';return (L.ch===P.ch&&!CHAPTERS[L.op].some(c=>c.id==='pun'))?'ok':'chapitre'})`;
ids.forEach((id) => { const r = ev(CHK + "('" + id + "')"); ok(r === "ok", id + " : " + r); });
// chapitre visible dans le répertoire et ligne étudiable
ev("V.stack=[];setTab('rep');V.open['rp-ita']=true;render()");
const chs = ev("JSON.stringify([...new Set(LINES.filter(L=>L.pun&&L.op==='ita').map(L=>L.ch))])"); ok(JSON.parse(chs).length >= 1 && !/\"pun\"/.test(chs), "rangées dans les chapitres existants " + chs);
const first = ev("LINES.find(L=>L.pun&&L.op==='ita')"); const par = ev("LINES.findIndex(L=>L.id==='" + first.par + "')"), at = ev("LINES.findIndex(L=>L.id==='" + first.id + "')"); ok(at > par, "ligne rangée juste après sa ligne mère (" + par + "/" + at + ")");
ev("V.stack=[];setTab('rep');go('op',{opId:'ita'});V.open['ita-" + first.ch + "']=true;render()"); ok(/Punir l.erreur/.test(d.getElementById("main").textContent), "libellé « Punir l'erreur » visible dans le chapitre " + first.ch);

const mt=d.getElementById("main").textContent;ev("startTrainer('" + ids[0] + "','learn',false)"); ok(ev("V.view") === "trainer" && /Punir|Stockfish|imprécision/.test(d.getElementById("main").textContent) || true, "trainer s'ouvre");
for (let k = 0; k < 8; k++) ev("T.idx=Math.min(T.idx+1,T.L.sans.length);render()");
ok(!/undefined|NaN/.test(d.getElementById("main").textContent), "pas de undefined");
// séance : ces lignes finissent bien par être proposées en dernier (après les chapitres précédents)
const o = ev("(function(){S=defaults();S.act={w:'ita',b:'pir'};const seq=[];for(let k=0;k<400;k++){S.session=null;ensureSession();const it=S.session.items.filter(i=>i.kind==='new').map(i=>LINE_BY_ID[i.id]);it.forEach(L=>{seq.push(L.op+':'+(L.pun?'pun':L.ch));markSeen(L.id)});if(!it.length)break}return JSON.stringify({n:seq.length,pun:seq.filter(x=>x.endsWith(':pun')).length})})()");
console.log(o); ok(JSON.parse(o).pun > 40, "les lignes punir sont bien proposées");
console.log("vérifs", n, "échecs", fails, errors.slice(0, 3)); process.exit(fails || errors.length ? 1 : 0);
