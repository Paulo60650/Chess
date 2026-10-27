const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s); let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("ÉCHEC :", m); } };
const ids = ev("MASTER.map(g=>g.id)"); ok(ids.length >= 5, "parties : " + ids.length);
ok(ev("Object.values(MASTER_BY_LINE).every(a=>a.length===1)"), "une seule partie par ligne");
ids.forEach((id) => {
  const r = ev(`(function(id){const G=MASTER.find(x=>x.id===id),g=new Chess();for(const s of G.sans){if(!g.move(s,{sloppy:true}))return 'illégal '+s}
    const L=LINE_BY_ID[G.line];if(!L)return 'ligne absente';
    const side=OP_BY_ID[L.op].side;if(side!==G.side)return 'mauvais camp';
    for(const k of Object.keys(G.notes)){if(Number(k)<1||Number(k)>G.sans.length)return 'note hors partie '+k}
    // étude : fin de ligne => la partie apparaît, on la parcourt entièrement
    V.stack=[];setTab('rep');startTrainer(L.id,'learn',false);T.idx=0;render();if(!/t'attend à la fin/.test(document.getElementById('main').textContent))return 'teaser absent';
    T.idx=L.sans.length;render();let t=document.getElementById('main').textContent;if(!/Partie de maître/.test(t))return 'section absente';
    if(V.si!==masterIll(G).from)return 'départ '+V.si;
    for(let i=0;i<=G.sans.length;i++){V.si=i;renderMain();t=document.getElementById('main').textContent;if(/undefined|NaN/.test(t))return 'texte invalide au coup '+i}
    return 'ok'})('${id}')`);
  ok(r === "ok", id + " : " + r);
});
ok(errors.length === 0, "erreurs JS : " + errors.slice(0, 2).join(" | "));
console.log("vérifs", n, "échecs", fails); process.exit(fails ? 1 : 0);
