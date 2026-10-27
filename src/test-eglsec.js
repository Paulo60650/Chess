const fs = require("fs"); const { JSDOM, VirtualConsole } = require("jsdom");
const errors = []; const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errors.push(e.detail || e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + "/test.html", "utf8"), { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.engInit = async () => false; w.engAnalyse = async () => [];
const ev = (s) => w.eval(s); let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("ÉCHEC :", m); } };
const tot = ev("Object.keys(EG_SEC).length"); ok(tot >= 26, "séquences : " + tot);
// toutes les sections de leçon (sauf vides) ont une suite jouable
const miss = ev(`(function(){var m=[];EG_LESSONS.forEach(function(l){l.secs.forEach(function(s,i){var E=EG_SEC[l.id+":"+i];if(!E||!E.sans.length){m.push(l.id+":"+i);return}var g=new Chess(E.fen||s.fen);E.sans.forEach(function(x){if(!g.move(x,{sloppy:true}))m.push(l.id+":"+i+" illégal "+x)})})});return m.join(",")})()`);
ok(miss === "", "sections sans suite ou illégales : " + miss);
// UI : chaque leçon s'ouvre, les flèches avancent, chaque section a son propre index
const lessons = ev("EG_LESSONS.filter(function(l){return l.secs.length}).map(function(l){return l.id})");
lessons.forEach((id) => {
  ev(`V.stack=[];V.sis={};V.view='puz';render();egLessonOpen('${id}')`);
  const nsec = ev(`EG_LESSONS.find(function(l){return l.id==='${id}'}).secs.length`);
  const btns = d.querySelectorAll('[data-act="stgo"][data-sk]'); ok(btns.length >= nsec * 4, id + " : boutons de navigation (" + btns.length + ")");
  for (let i = 0; i < nsec; i++) {
    const key = id + ":" + i, len = ev(`EG_SEC['${key}'].sans.length`);
    const nb = d.querySelector('[data-act="stgo"][data-sk="' + key + '"][data-i="1"]'); ok(!!nb, key + " : bouton ›");
    if (nb) { nb.click(); ok(ev(`V.sis['${key}']`) === 1, key + " : index 1 après clic"); }
    ev(`V.sis['${key}']=${len};renderMain()`);
    const t = d.getElementById("main").textContent; ok(!/undefined|NaN/.test(t), key + " : texte valide à la fin");
    if (i + 1 < nsec) ok(ev(`V.sis['${id}:${i + 1}']`) == null, key + " : les autres sections ne bougent pas");
  }
});
ok(errors.length === 0, "erreurs JS : " + errors.slice(0, 2).join(" | "));
console.log("vérifs", n, "échecs", fails); process.exit(fails ? 1 : 0);
