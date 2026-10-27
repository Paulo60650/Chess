const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {};
const ev = (s) => w.eval(s); let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("ÉCHEC :", m); } };
const news = () => JSON.parse(ev("JSON.stringify(S.session.items.filter(i=>i.kind==='new').map(i=>LINE_BY_ID[i.id].op))"));
const newIds = () => JSON.parse(ev("JSON.stringify(S.session.items.filter(i=>i.kind==='new').map(i=>i.id))"));
// 1. départ à zéro : 1 Blancs (Londres par défaut) + 1 Noirs (Pirc par défaut), sans choix
ev("S=defaults();S.session=null;ensureSession();render()");
let o = news().map((x) => ev("OP_BY_ID['" + x + "'].side")).sort().join("");
ok(o === "bw", "1 nouvelle Noirs + 1 nouvelle Blancs : " + news());
ok(/choisis ton ouverture/.test(d.getElementById("main").textContent) && /Choisir mes ouvertures/.test(d.getElementById("main").textContent), "carte : invite à choisir");
// 2. choix explicite
ev("S.act={w:'ita',b:'dut'};S.session=null;ensureSession();render()");
ok(JSON.stringify(news().sort()) === JSON.stringify(["dut", "ita"]), "choix respecté : " + news());
// 3. plusieurs jours : même ouverture, ligne suivante dans l'ordre des chapitres
const seenOps = new Set(); let prev = [];
for (let day = 0; day < 6; day++) {
  ev("S.session=null;ensureSession()");
  const ids = newIds(); ids.forEach((id) => { seenOps.add(ev("LINE_BY_ID['" + id + "'].op")); ev("markSeen('" + id + "')"); });
  ok(!ids.some((i) => prev.includes(i)), "jour " + day + " : leçons déjà vues non reproposées");
  prev = prev.concat(ids);
}
ok([...seenOps].sort().join() === "dut,ita", "6 jours : toujours les mêmes ouvertures " + [...seenOps]);
// 4. ordre des chapitres
ev("S=defaults();S.act={w:'lon',b:'pir'};S.session=null;ensureSession()");
const firstW = ev("S.session.items.filter(i=>i.kind==='new').map(i=>LINE_BY_ID[i.id]).find(L=>L.op==='lon').chi"), minW = ev("Math.min(...LINES.filter(L=>L.op==='lon').map(L=>L.chi))");
ok(firstW === minW, "première ligne = premier chapitre");
// 5. ouverture terminée → suivante de la même couleur (Blancs : lon -> ita ; Noirs : pir -> dut)
ev("LINES.filter(L=>L.op==='lon').forEach(L=>markSeen(L.id));S.session=null;ensureSession()");
ok(ev("S.act.w") === "ita" && news().includes("ita"), "Londres terminée -> Italienne : " + ev("S.act.w"));
ev("LINES.filter(L=>L.op==='pir').forEach(L=>markSeen(L.id));S.session=null;ensureSession()");
ok(ev("S.act.b") === "dut" && news().includes("dut"), "Pirc terminée -> Hollandaise");
// 6. tout est vu côté Noirs : deux leçons Blancs
ev("LINES.filter(L=>L.op==='dut').forEach(L=>markSeen(L.id));S.session=null;ensureSession()");
ok(news().length === 2 && news().every((x) => ev("OP_BY_ID['" + x + "'].side") === "w"), "Noirs épuisé : 2 leçons Blancs " + news());
// 7. reprise d'une ouverture déjà commencée
ev("S=defaults();['bir1'].forEach(()=>0);const b=LINES.filter(L=>L.op==='bir').slice(0,3);b.forEach(L=>markSeen(L.id));S.session=null;ensureSession()");
ok(ev("S.act.w") === "bir", "ouverture commencée reprise : " + ev("S.act.w"));
// 8. changement manuel : bouton + remplacement des nouvelles non faites
ev("S=defaults();S.session=null;ensureSession();render()");
d.querySelector('#main [data-act="actch"]').click();
const btn = d.querySelector('#main [data-act="actset"][data-op="eng"]'); ok(!!btn, "bouton Anglaise");
btn.click(); ok(ev("S.act.w") === "eng" && news().includes("eng") && !news().includes("lon"), "changement manuel : " + news());
// une leçon déjà faite reste
ev("S.session.items.find(i=>i.kind==='new'&&LINE_BY_ID[i.id].op==='eng').done=true");
d.querySelector('#main [data-act="actch"]') && 0;
ev("S.act.w='bir';refreshNew()"); ok(news().filter((x) => x === "eng").length === 1, "leçon déjà faite conservée : " + news());
// 9. carte affichée
ev("S.act={w:'lon',b:'pir'};render()"); ok(/Blancs.*Londres.*lignes vues/.test(d.getElementById("main").textContent) && /Noirs.*Pirc/.test(d.getElementById("main").textContent), "carte : ouvertures en cours");
console.log("vérifs", n, "échecs", fails, errors.slice(0, 3)); process.exit(fails || errors.length ? 1 : 0);
