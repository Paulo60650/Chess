const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync(__dirname + "/test.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document; w.scrollTo = () => {};
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC :", m); } else console.log("ok :", m); };
const ev = (s) => w.eval(s);
const click = (sel) => { const el = d.querySelector(sel); if (!el) { fails++; console.log("ÉCHEC : introuvable", sel); return false; } el.click(); return true; };
(async () => {
  // Menaces : cas connus
  ok(ev(`Object.keys(mThreats("4k3/8/8/8/4n3/6P1/8/4K3 w - - 0 1","w")).join()`) === "g3", "pion g3 non défendu menacé par le cavalier");
  ok(ev(`Object.keys(mThreats("4k3/8/8/8/4n3/8/3P4/4K3 w - - 0 1","w")).length`) === 0, "pion d2 défendu par le roi : pas de menace");
  // Génération en masse
  for (const k of ["thr", "hang", "cct", "blind", "mem", "long"]) {
    const r = ev(`(function(){var f=0,n=60;for(var i=0;i<n;i++){mNew("${k}");if(!M||M.err)f++;else{var h=mindHTML();if(/undefined|NaN/.test(h))f+=100;}}return f})()`);
    ok(r === 0, "exercice " + k + " : 60 générations sans échec (" + r + ")");
  }
  // Cohérence : hang 'safe' / 'bad'
  const hb = ev(`(function(){var bad=0;for(var i=0;i<40;i++){mNew("hang");var g=new Chess(M.fen);if(!g.move(M.san))bad++;if(M.want==="bad"&&!M.vic)bad++;}return bad})()`);
  ok(hb === 0, "ce coup est-il sûr : coups légaux et victime renseignée");
  // Aveugle : solution jouable, Élo dans la plage
  const tr = ev(`(function(){var bad=0;for(var i=0;i<60;i++){mNew("blind");var g=new Chess(M.pz.fen);M.mv.forEach(function(m){if(!g.move(m.san))bad++});if(Math.abs(M.bf-eloS().b)>400)bad++;if(M.secs!==20)bad++;}return bad})()`);
  ok(tr === 0, "aveugle : solutions légales et puzzle proche de l'Élo (" + tr + ")");
  // Parcours UI : menaces
  ev(`M=null;V.stack=[];go("home")`); click('[data-act="tab"][data-v="puz"]'); click('[data-act="trk"][data-v="mind"]');
  ok(!!d.querySelector('[data-act="m_open"]'), "tuile Menaces et calcul dans S'entraîner");
  click('[data-act="m_open"]');
  ok(/Menaces et calcul/.test(d.querySelector("#main").textContent) && /routine/i.test(d.querySelector("#main").textContent), "hub + routine");
  ok(d.querySelectorAll('[data-act="m_start"]').length === 6, "6 exercices au menu");
  click('[data-act="m_start"][data-dr="thr"]');
  const th = ev("Object.keys(M.th)");
  th.forEach((s) => { const b = d.querySelector('[data-sq="' + s + '"]'); if (b) b.click(); });
  click('[data-act="m_check"]');
  ok(ev("M.stage") === "done" && ev("M.ok") === true, "menaces : bonne réponse validée");
  ok(ev("S.mind.thr.n") === 1, "progression enregistrée");
  click('[data-act="m_next"]'); click('[data-act="m_check"]');
  ok(ev("M.stage") === "done", "menaces : validation sans sélection");
  // cct
  ev(`mNew("cct")`); click('[data-act="m_ans"][data-v="' + ev("M.c") + '"]'); ok(ev("M.ok") === true, "échecs et prises : bonne réponse");
  // hang
  ev(`mNew("hang")`); click('[data-act="m_ans"][data-v="' + ev("M.want") + '"]'); ok(ev("M.ok") === true, "sûr ou non : bonne réponse");
  // aveugle : réussite, Élo qui monte
  ev(`mNew("blind")`); const b0 = ev("S.elo.b"), n0 = ev("S.elo.bn");
  click('[data-act="m_hide"]');
  for (let i = 0; i < 6 && ev('M.stage') === 'ask'; i++) { const m = ev("M.mv[M.n]"); click('[data-sq="' + m.from + '"]'); click('[data-sq="' + m.to + '"]'); }
  ok(ev("M.ok") === true && ev("S.elo.b") > b0 && ev("S.elo.bn") === n0 + 1, "aveugle : réussi, Élo aveugle monte");
  ok(ev("M.i") === 0 && /Ligne/.test(d.body.textContent), "aveugle : solution rejouée depuis le début");
  // aveugle : mauvais coup, revoir, abandon
  ev(`mNew("blind")`); click('[data-act="m_hide"]'); click('[data-act="m_peek"]'); ok(ev("M.stage") === "peek", "aveugle : revoir la position"); click('[data-act="m_hide"]'); ok(ev("M.stage") === "ask", "aveugle : retour au plateau vide");
  const b1 = ev("S.elo.b"); click('[data-act="m_giveup"]'); ok(ev("M.ok") === false && ev("S.elo.b") < b1, "aveugle : abandon, Élo baisse");
  // mem
  ev(`mNew("mem")`); click('[data-act="m_hide"]'); ev("M.ans").forEach((s) => click('[data-sq="' + s + '"]')); click('[data-act="m_check"]'); ok(ev("M.ok") === true, "mémoire du plateau : réussie");
  // long
  ev(`mNew("long")`); click('[data-act="m_ready"]'); click('[data-act="m_pick"][data-i="' + ev("M.opts.indexOf(M.good)") + '"]'); ok(ev("M.ok") === true, "calcul long : réussi");
  click('[data-act="m_step"][data-d="1"]'); ok(ev("M.i") === 1, "ligne parcourue pas à pas");
  // classification
  const cls = ev(`(function(){
    var fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; return classifyMistake(fen,"e4",[{t:"cp",v:30,pv:["e2e4"]}],[{t:"cp",v:20,pv:["e7e5"]}],1)})()`);
  ok(typeof cls === "string" && cls.length > 0, "classification renvoie une cause : " + cls);
  const c2 = ev(`classifyMistake("4k3/8/8/8/4n3/8/8/R3K3 w - - 0 1","Kd1",[{t:"cp",v:300,pv:["a1a8"]}],[{t:"cp",v:-200,pv:["e4f2"]}],1)`);
  ok(c2 === "menace" || c2 === "defenseur", "prise adverse : cause " + c2);
  // Plan
  ev(`S.plan=null; go("home")`);
  ok(!!d.querySelector('[data-act="w_open"]'), "carte du plan sur l'accueil");
  click('[data-act="w_open"]');
  ok(d.querySelectorAll('[data-act="w_done"]').length === 7, "7 jours dans le plan");
  click('[data-act="w_done"][data-i="0"]'); ok(ev("S.plan.done[0]") === 1, "jour marqué fait");
  click('[data-act="w_regen"]'); ok(ev("S.plan.days.length") === 7, "plan recalculé");
  const attrs = ev("S.plan.days.map(function(x){return x.attrs})");
  ok(attrs.every((a) => /data-act=/.test(a)), "chaque tâche a une action");
  // Toutes les actions du plan, pour chaque point faible, mènent à une vue
  for (const f of ["ouv", "fin", "strat", "ment"]) {
    ev(`S.plan={wk:planMonday(todayStr()),focus:"${f}",days:planBuild("${f}").days,done:{}};V.stack=[];go("week")`);
    const bad = [];
    d.querySelectorAll("#main [data-act]").forEach((b) => { if (b.dataset.act === "w_done") return; ev(`V.stack=[];go("week")`); const el = [...d.querySelectorAll("#main [data-act]")].find((e) => e.outerHTML === b.outerHTML); if (!el) return; try { el.click(); } catch (e) { bad.push(b.dataset.act + ":" + e.message); } });
    ok(bad.length === 0, "plan (" + f + ") : toutes les actions fonctionnent " + bad.join(";"));
  }
  // Poids
  ok(/Pourquoi tu perds/.test(ev(`S.causes={menace:3,motif:1};scanHTML()`)), "profil des causes dans l'analyse");
  ev(`S.mind=null;S.causes=null`);
  ok(errors.length === 0, "aucune erreur JS " + errors.slice(0, 3).join("|"));
  console.log(fails ? "ÉCHECS : " + fails : "TOUT PASSE"); process.exit(fails ? 1 : 0);
})();
