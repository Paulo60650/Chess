const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync(__dirname + "/test.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.detail || e.message)));
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document;
w.scrollTo = () => {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC :", m); } else console.log("ok :", m); };
const click = (sel) => { const el = d.querySelector(sel); if (!el) { fails++; console.log("ÉCHEC : introuvable", sel); return false; } el.click(); return true; };
const ev = (s) => w.eval(s);

(async () => {
  ok(d.querySelector("#main") && d.querySelectorAll(".trow").length >= 3, "accueil rendu avec la séance du jour");
  ok(/séance du jour/i.test(d.body.textContent), "titre séance");
  const items0 = ev("S.session.items.map(i=>i.id+':'+i.kind).join(',')");
  console.log("séance :", items0);
  ok(items0.startsWith("lon1:new"), "première ligne = lon1 nouvelle");

  // Commencer la séance -> mode étude
  click('[data-act="sessgo"]');
  ok(/Étude/.test(d.body.textContent), "mode étude ouvert");
  for (let i = 0; i < 18; i++) click('[data-act="lstep"][data-d="1"]');
  ok(ev("T.idx") === 18, "18 demi-coups joués en étude");
  ok(/Ligne terminée/.test(d.body.textContent), "fin de ligne en étude");
  ok(ev("S.lines.lon1 && S.lines.lon1.seen") === 1, "ligne marquée vue");
  click('[data-act="toguide"]');
  ok(/2 · Accompagné/.test(d.body.textContent) && !!d.querySelector("svg.viz line"), "étape accompagnée avec flèche de proposition");
  // un mauvais coup n'est pas une erreur en mode accompagné
  { const e0 = ev("(function(){const m=expectedMove();return m.from})()"); const bf = e0 === "d2" ? "b1" : "d2"; click('[data-sq="' + bf + '"]'); const tg = bf === "b1" ? "c3" : "d3"; click('[data-sq="' + tg + '"]'); }
  ok(ev("T.errs") === 0, "pas d'erreur comptée en mode accompagné");
  { let g2 = 0; while (ev("T.stage") === "play" && g2++ < 40) { if (ev("T.lock")) { await sleep(450); continue; } const mv = ev("(function(){const m=expectedMove();return m.from+'-'+m.to})()").split("-"); click('[data-sq="' + mv[0] + '"]'); click('[data-sq="' + mv[1] + '"]'); await sleep(40); } }
  ok(ev("T.stage") === "result" && /Jouer la ligne seul/.test(d.body.textContent), "fin de l'étape accompagnée");
  click('[data-act="todrill"]');
  ok(/3 · Seul/.test(d.body.textContent), "entraînement seul avec indices");

  // coup faux
  const exp0 = ev("(function(){const m=expectedMove();return m.from+m.to})()");
  const wrongFrom = exp0.slice(0, 2) === "d2" ? "b1" : "d2";
  click('[data-sq="' + (exp0.slice(0, 2) === "e2" ? "g1" : "e2") + '"]');
  // joue la ligne complète
  let guard = 0;
  while (ev("T.stage") === "play" && guard++ < 40) {
    if (ev("T.lock")) { await sleep(450); continue; }
    const mv = ev("(function(){const m=expectedMove();return m.from+'-'+m.to})()").split("-");
    click('[data-sq="' + mv[0] + '"]');
    click('[data-sq="' + mv[1] + '"]');
    await sleep(40);
  }
  ok(ev("T.stage") === "quiz", "fin de ligne -> question de structure (étape : " + ev("T.stage") + ")");
  ok(ev("T.errs") === 0, "aucune erreur sur la ligne complète");
  click('[data-act="tq"][data-i="0"]');
  ok(/Exact/.test(d.body.textContent), "quiz bonne réponse");
  click('[data-act="toresult"]');
  ok(/Sans faute/.test(d.body.textContent), "bilan sans faute");
  ok(ev("S.lines.lon1.box") === 1, "boîte passée à 1");
  ok(ev("S.session.items[0].done") === true, "élément de séance coché");

  // test avec erreurs : ligne ita1 en drill, 3 coups faux de suite
  ev("startTrainer('ita1','drill',false)");
  const e1 = ev("(function(){const m=expectedMove();return m.from})()");
  const bad = e1 === "a2" ? "h2" : "a2";
  click('[data-sq="' + bad + '"]');
  click('[data-sq="' + bad[0] + "3" + '"]');
  ok(ev("T.errs") >= 1, "coup hors répertoire compté comme erreur (" + ev("T.errs") + ")");
  ok(/Ce n'est pas le coup/.test(d.body.textContent), "message d'erreur affiché");

  // Pirc : orientation Noirs et coup blanc automatique
  ev("startTrainer('pir1','drill',false)");
  ok(ev("T.user") === "b" && ev("T.idx") === 1, "Pirc : blancs jouent 1.e4 automatiquement");
  ok(d.querySelector("#board .sq").dataset.sq === "h1", "échiquier retourné pour les Noirs");

  // Parties
  click('.tab[data-v="games"]');
  click('[data-act="sample"]');
  ok(d.querySelector("#gpgn").value.includes("adversaire4"), "exemple chargé");
  click('[data-act="analyse"]');
  await sleep(300);
  const gtxt = d.querySelector("#gres").textContent;
  console.log(gtxt.replace(/\s+/g, " ").slice(0, 400));
  ok(/Parties\s*4/.test(gtxt), "4 parties reconnues");
  ok(/Sorties à toi\s*1/.test(gtxt), "1 sortie de répertoire détectées");
  ok(/Coups de tes adversaires/.test(gtxt) && /6\. Cc3/.test(gtxt), "nouveauté adverse 6.Cc3 listée");
  ok(!/4\. b4/.test(gtxt) && /1\.\.\. e5/.test(gtxt), "4.b4 est maintenant dans le livre ; 1...e5 reste une sortie");

  // Format Lichess : fins de ligne Windows, horloges, mauvais pseudo
  ev("V.pgn = '\\uFEFF[Event \"Rated Blitz game\"]\\r\\n[White \"Polo60\"]\\r\\n[Black \"ami\"]\\r\\n[Result \"1-0\"]\\r\\n\\r\\n1. d4 { [%clk 0:03:00] } d5 { [%clk 0:03:00] } 2. Nf3 Nf6 3. Bf4 e6 1-0\\r\\n\\r\\n'");
  ev("S.user = 'Pol'"); ev("renderMain()");
  click('[data-act="analyse"]');
  await sleep(300);
  ok(/Polo60/.test(d.querySelector("#gres").textContent) && !!d.querySelector('[data-act="useguess"]'), "pseudo erroné : suggestion proposée");
  click('[data-act="useguess"]');
  await sleep(300);
  ok(/Parties\s*1/.test(d.querySelector("#gres").textContent), "PGN Lichess (CRLF, horloges) analysé");

  // Plans
  click('.tab[data-v="strat"]'); click('[data-act="tab"][data-v="plans"]');
  ok(d.querySelectorAll('[data-act="struct"]').length === 35, "35 fiches de structure");
  click('[data-act="struct"][data-id="pir-class"]');
  ok(/Pirc classique/.test(d.body.textContent) && d.querySelectorAll("svg.viz line").length >= 3 && d.querySelectorAll("svg.viz circle").length >= 2, "fiche Pirc avec flèches et cercles");
  ok(!!d.querySelector('[data-act="understand"][data-src="s"]'), "bouton Comprendre sur la fiche");
  click('[data-act="understand"][data-src="s"]');
  await new Promise((r) => setTimeout(r, 300));
  ok(/n'a pas pu se charger|pas disponible/.test(d.body.textContent), "repli propre sans moteur");
  click('[data-act="sq"][data-i="0"]');
  ok(ev("S.q['pir-class'].ok") === 1, "quiz de fiche enregistré");

  // Répertoire / Progrès
  click('.tab[data-v="rep"]');
  ok(d.querySelectorAll('.acc').length === 6, "6 ouvertures");
  click('[data-act="chtoggle"][data-id="rp-dut"]');
  click('[data-act="op"][data-id="dut"]');
  ok(d.querySelectorAll('[data-act="learn"]').length === 4, "chapitre 1 ouvert seul (4 lignes)");
  click('[data-act="chtoggle"][data-id="dut-pieges"]');
  ok(d.querySelectorAll('[data-act="learn"]').length === 6, "ouverture d'un chapitre au toucher");
  click('[data-act="jump"][data-id="dut-class"]');
  ok(d.querySelectorAll('[data-act="learn"]').length === 12, "pastille de chapitre l'ouvre");
  ["dut-stone","dut-lond","dut-gamb","dut-dev"].forEach((x) => click('[data-act="chtoggle"][data-id="' + x + '"]'));
  ok(d.querySelectorAll(".chap").length === 10, "10 chapitres hollandais (dont Mes lignes et Lignes de tes cours)");
  ok(d.querySelectorAll('.chap[data-k="red"] .chip.bad, .chap[data-k="red"] .chip.good').length >= 2, "chapitre Pièges avec types");
  ok(d.querySelectorAll('[data-act="learn"]').length === 27, "27 lignes hollandaises une fois tout ouvert");
  ok(d.querySelectorAll('[data-act="jump"]').length === 10, "navigation par chapitres");
  // Éditeur de lignes personnelles
  click('[data-act="edadd"]');
  ok(ev("V.view") === "edit" && ev("E.op") === "dut", "éditeur ouvert pour la hollandaise");
  ["d2", "d4", "f7", "f5", "c2", "c4"].forEach((s) => click('[data-sq="' + s + '"]'));
  ok(ev("E.sans.join(' ')") === "d4 f5 c4", "trois coups joués sur l'échiquier");
  ev("E.notes[2] = 'Mon commentaire'; E.name = 'Ma ligne test'; E.ch = 'perso'");
  click('[data-act="edsave"]');
  ok(ev("S.custom.length") === 1 && ev("LINES.filter((L) => L.custom).length") === 1, "ligne perso enregistrée");
  ok(ev("LINES.find((L) => L.custom).notes[2]") === "Mon commentaire", "commentaire conservé");
  ev("startTrainer(LINES.find((L) => L.custom).id, 'learn', false)");
  ok(ev("T.L.sans.length") === 3 && /Ma ligne test/.test(d.body.textContent), "ligne perso jouable dans l'entraîneur");
  ev("goBack()");
  ev("E = null; edOpen('dut', LINES.find((L) => L.custom).id)");
  ev("$('#edPgn').value = '1. d4 {Centre} f5 2. g3 (2. Nc3) Nf6 3. Bg2 {Fou en g2} e6'");
  ev("edImport()");
  ok(ev("E.sans.join(' ')") === "d4 f5 g3 Nf6 Bg2 e6" && ev("E.notes[0]") === "Centre", "import PGN annoté avec variantes");
  ev("goBack()");
  ev("edDelete(LINES.find((L) => L.custom).id)");
  ok(ev("LINES.filter((L) => L.custom).length") === 0, "ligne perso supprimée");
  click('.tab[data-v="prog"]');
  ok(/Maîtrise par ouverture/.test(d.body.textContent), "progrès rendu");
  click('[data-act="reset1"]'); click('[data-act="reset2"]');
  ok(ev("Object.keys(S.lines).length") === 0, "réinitialisation");


  // Tactiques : résoudre chaque problème en cliquant les cases
  click('[data-act="tab"][data-v="puz"]');
  ok(d.querySelectorAll('[data-act="chtoggle"]').length >= 3, "problèmes rangés en groupes par thème");
  ev("PZ_THEMES.forEach(t=>{V.open['pz-'+t[0]]=true});renderMain()");
  ok(d.querySelectorAll('[data-act="pzopen"]').length === ev("allPz().filter(p=>!p.pos).length"), "liste des problèmes (hors problèmes de plans)");
  const ids = ev("PUZZLES.map(p=>p.id)").filter((x, i) => i % 300 === 0 || /^[be]\d{3}$|^s00[1-3]$/.test(x));
  for (const id of ids) {
    if (ev("!!allPz().find(p=>p.id==='" + id + "').pos")) { ev("V.stack=[];V.view='strat';V.tab='strat';render();go('pzpos');PZ_THEMES.forEach(t=>{V.open['pz-'+t[0]]=true});renderMain()"); }
    else { click('[data-act="tab"][data-v="puz"]');
    ev("PZ_THEMES.forEach(t=>{V.open['pz-'+t[0]]=true});renderMain()"); }
    if (!d.querySelector('[data-act="pzopen"][data-id="' + id + '"]')) { ev("V.stack=[];V.view='puz';render();PZ_THEMES.forEach(t=>{V.open['pz-'+t[0]]=true});renderMain()"); }
    click('[data-act="pzopen"][data-id="' + id + '"]');
    const sol = ev("PUZZLES.find(p=>p.id==='" + id + "').sol"), fen = ev("PUZZLES.find(p=>p.id==='" + id + "').fen");
    const g = new (ev("Chess"))(fen);
    for (let i = 0; i < sol.length; i += 2) {
      const m = g.move(sol[i]); click('[data-sq="' + m.from + '"]'); click('[data-sq="' + m.to + '"]');
      if (sol[i + 1]) g.move(sol[i + 1]);
      await sleep(600);
    }
    await sleep(700);
    ok(ev("!!S.pz['" + id + "']"), "problème " + id + " résolu");
  }


  // Coups difficiles : une erreur est mémorisée puis révisable
  ev("V.stack=[];V.view='home';render()");
  ev("startTrainer('lon1','drill',false)");
  const exp1 = ev("new Chess(T.g.fen()).move(T.L.sans[T.idx])");
  click('[data-sq="' + (exp1.from === "g1" ? "b1" : "a2") + '"]'); 
  click('[data-sq="' + (exp1.from === "g1" ? "c3" : "a3") + '"]');
  ok(ev("hardList().length") === 1 || ev("Object.keys(S.hard).length") === 1, "erreur mémorisée comme coup difficile");
  ev("V.stack=[];V.view='home';render()");
  ok(/Coups difficiles/.test(d.body.textContent), "carte coups difficiles sur l'accueil");
  click('[data-act="hardgo"]');
  ok(ev("T.partial && T.mode==='drill'"), "révision depuis le coup difficile");
  ev("startTrainer('lon1','learn',false)");
  ok(!!d.querySelector(".navrow") && !!d.querySelector("svg.viz line"), "flèches sous l'échiquier + flèche d'aperçu");


  // Moteur simulé avec Stockfish natif
  const { spawn } = require("child_process");
  const sfRun = (fen, depth) => new Promise((resolve) => {
    const p = spawn("/usr/games/stockfish"), white = fen.split(" ")[1] === "w", res = {}; let buf = "";
    p.stdout.on("data", (dd) => { buf += dd; let i; while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1);
      const m = l.match(/^info depth (\d+).*? multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/); if (m) res[m[2]] = { d: +m[1], t: m[3], v: (white ? 1 : -1) * +m[4], pv: m[5].trim().split(/\s+/) };
      if (l.indexOf("bestmove") === 0) { p.kill(); resolve(Object.keys(res).sort((a, b) => a - b).map((k) => res[k])); } } });
    p.stdin.write("uci\nsetoption name MultiPV value 3\nposition fen " + fen + "\ngo depth " + Math.min(depth, 9) + "\n");
  });
  w.engInit = async () => true; w.engAnalyse = (fen, depth) => sfRun(fen, depth);

  // Erreurs de parties -> problèmes
  const gpgn = '[Event "t"]\n[White "adv"]\n[Black "toi"]\n[Result "1-0"]\n\n1. f3 e5 2. g4 Nc6 3. h3 Nf6 1-0\n';
  w.eval("window.__r = null"); w.__pg = gpgn;
  await w.eval("analyseText(__pg, 'toi').then(r => { V.gres = r; })");
  ev("V.view='games';render()");
  ok(!!d.querySelector('[data-act="scan"]'), "bouton de recherche d'erreurs");
  ev("SCAN_MIN = 0");
  await w.eval("scanMistakes()");
  ok(ev("S.mypz.length") >= 1 && ev("S.mypz[0].sol[0]") === "Qh4#", "erreur de partie transformée en problème (Qh4#)");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  ok(/Ton erreur/.test(d.body.textContent), "problème personnel dans l'onglet Tactiques");

  // Préparer une sortie adverse
  const opgn = '[Event "t"]\n[White "adv"]\n[Black "toi"]\n[Result "1-0"]\n\n1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. h3 Bg7 1-0\n';
  w.__pg = opgn;
  await w.eval("analyseText(__pg, 'toi').then(r => { V.gres = r; })");
  ev("V.stack=[];V.view='games';render()");
  ok(!!d.querySelector('[data-act="prep"]'), "bouton Préparer sur une sortie adverse");
  await w.eval("prepareLine(0)");
  ok(ev("V.view") === "edit" && ev("E.sans.length") > 8, "ligne préparée ouverte dans l'éditeur");

  // Position surprise
  ev("V.stack=[];V.view='home';render()");
  ev("V.stack=[];V.view='puz';V.tab='puz';render()");
  { const rr = w.Math.random; w.Math.random = () => 0.9; click('[data-act="xnew"]'); w.Math.random = rr; }
  ok(ev("V.view") === "surprise", "position surprise ouverte");
  const xm = ev("(()=>{const m=new Chess(X.g.fen()).move(X.L.sans[X.i]);return [m.from,m.to]})()");
  click('[data-sq="' + xm[0] + '"]'); click('[data-sq="' + xm[1] + '"]');
  ok(ev("X.stage") === "done" && ev("X.ok"), "bon coup accepté en position surprise");
  ok(/Cette position vient de/.test(d.body.textContent), "origine de la position affichée");

  // Séance avec coups difficiles + bilan
  ev("S.session=null;ensureSession()");
  ok(ev("S.session.items.some(i=>i.kind==='hard')"), "coup difficile dans la séance");
  ev("V.stack=[];V.view='prog';render()");
  ok(/Bilan des 7 derniers jours/.test(d.body.textContent) && !!d.querySelector(".wkbars"), "bilan hebdomadaire");
  click('[data-act="sndtoggle"]'); ok(ev("S.sound") === 0, "sons désactivables");

  // Élo
  ev("V.stack=[];V.view='home';render()"); ev("startTrainer('lon5','drill')");
  { let g2 = 0; while (ev("T.stage") === "play" && g2++ < 60) { if (ev("T.lock")) { await sleep(450); continue; } const mv = ev("(function(){const m=expectedMove();return m.from+'-'+m.to})()").split("-"); click('[data-sq="' + mv[0] + '"]'); click('[data-sq="' + mv[1] + '"]'); await sleep(40); } }
  ok(/Élo \+/.test(d.body.textContent) || ev("T.stage") === "quiz", "Élo études affiché au bilan");
  ok(ev("S.elo.pn") > 5 && ev("S.elo.sn") >= 1, "Élo problèmes et études mis à jour");
  ev("V.stack=[];V.view='prog';render()");
  ok(/Tes classements/.test(d.body.textContent) && !!d.querySelector(".elospark, .grid3"), "carte des classements");
  ok(ev("pzRating(PUZZLES[0])") > 800 && ev("lineRating(LINES[0])") > 800, "cotes des problèmes et des lignes");

  // Partie contre Stockfish (moteur simulé : premier coup légal)
  w.engPlay = async (fen) => { const g = new (ev("Chess"))(fen); const m = g.moves({ verbose: true })[0]; return m ? m.from + m.to + (m.promotion || "") : null; };
  ev("V.stack=[];V.view='home';render()");
  ev("V.stack=[];V.view='games';V.tab='games';render()"); click('[data-act="vsopen"]'); ok(ev("V.view") === "vs", "écran de partie ouvert");
  click('[data-act="vslvl"][data-i="4"]'); click('[data-act="vscol"][data-v="w"]'); click('[data-act="vsstart"]');
  ok(ev("VS.stage") === "play" && ev("VS.me") === "w", "partie lancée");
  click('[data-sq="e2"]'); click('[data-sq="e4"]');
  await sleep(900);
  ok(ev("VS.g.history().length") === 2, "le moteur répond");
  click('[data-act="vsundo"]'); ok(ev("VS.g.history().length") === 0 && ev("VS.g.turn()") === "w" && ev("VS.stage") === "play" && !ev("VS.lock") && !!d.querySelector('[data-act="vsundo"][disabled]'), "annuler le coup : retour à ta position, bouton grisé");
  click('[data-sq="d2"]'); click('[data-sq="d4"]'); await sleep(900); ok(ev("VS.g.history().length") === 2, "on peut rejouer après l'annulation");
  const g0 = ev("S.elo.gn");
  click('[data-act="vsresign"]');
  ok(ev("S.elo.gn") === g0 + 1 && ev("S.elo.g") < 1200 && ev("S.vs.length") === 1, "abandon : Élo parties en baisse");
  ok(/Défaite/.test(d.body.textContent), "résultat affiché");
  click('[data-act="vsscan"]'); ok(ev("V.view") === "games" && ev("V.gres.games.length") === 1, "partie envoyée à la recherche d'erreurs");
  ev("V.stack=[];V.view='home';render()");
  w.engPlay = async (fen) => null;
  ev("V.stack=[];V.view='games';V.tab='games';render()"); click('[data-act="vsopen"]'); click('[data-act="vsstart"]'); // Noirs ou Blancs au hasard
  await sleep(300);
  ok(/Le moteur n'a pas pu se charger|À toi|réfléchit/.test(d.body.textContent), "moteur absent géré");

  // Entraînement adapté, défi du jour, rafale, finales, stats, objectifs
  w.engInit = async () => true; w.engAnalyse = async () => [];
  const solveP = async () => { let n = 0; while (ev("P && P.stage") === "play" && n++ < 12) { if (ev("P.lock")) { await sleep(500); continue; } const m = ev("(function(){const m=new Chess(P.g.fen()).move(P.pz.sol[P.k],{sloppy:true});return m.from+'-'+m.to})()").split("-"); click('[data-sq="' + m[0] + '"]'); click('[data-sq="' + m[1] + '"]'); await sleep(550); } };
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  ok(!!d.querySelector('[data-act="pzadapt"]') && !!d.querySelector('[data-act="rush"]') && !!d.querySelector('[data-act="daily"]') && !!d.querySelector('[data-act="matopen"]') && !!d.querySelector('[data-act="trk"][data-v="end"]'), "lignes d'entraînement");
  click('[data-act="pzth"]'); ok(ev("V.view") === "pzth" && d.querySelectorAll(".chap").length >= 5 && !d.querySelector('[data-act="pzthgo"]'), "Tactiques par thème : thèmes fermés");
  const th0 = d.querySelector(".chap-h").getAttribute("data-id"); click('.chap-h[data-id="' + th0 + '"]'); ok(!!d.querySelector('[data-act="pzthgo"]') && d.querySelectorAll('[data-act="pzopen"]').length > 0, "thème ouvert : bouton Commencer et problèmes");
  click('[data-act="pzthgo"]'); ok(ev("V.view") === "puzzle" && ev("P.pz.th") === ev("PZ_FILTER.th"), "le thème choisi est lancé");
  ev("goBack()"); ok(ev("V.view") === "pzth", "retour à la liste des thèmes"); ev("goBack()"); ok(ev("V.view") === "puz", "retour à S'entraîner");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  const pn0 = ev("S.elo.pn");
  click('[data-act="pzadapt"]'); ok(ev("P.mode") === "adapt", "entraînement adapté lancé");
  ok(!/Thème\s*:/.test(d.getElementById("main").textContent) && !d.querySelector('.hdr .chip.k[data-k]:nth-child(2)') && /Trouve le meilleur coup/.test(d.getElementById("main").textContent), "entraînement adapté : thème caché");
  await solveP(); ok(ev("P.stage") === "done", "problème adapté résolu");
  ok(/Suivant|suivant/.test(d.body.textContent), "suite proposée");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  click('[data-act="daily"]'); ok(ev("P.mode") === "daily", "défi du jour lancé");
  for (let i = 0; i < 5; i++) { await solveP(); if (i < 4) { click('[data-act="pznext2"]'); await sleep(100); } }
  ok(ev("S.daily.done.length") === 5 && ev("S.dd.indexOf(todayStr())") >= 0, "défi du jour terminé et série enregistrée");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  click('[data-act="rush"]'); ok(ev("RU && !RU.over") && ev("P.rush"), "rafale lancée");
  await solveP2();
  async function solveP2() { const id0 = ev("P.id"); let n = 0; while (ev("P.id") === id0 && ev("RU.score") === 0 && n++ < 6) { if (ev("P.lock")) { await sleep(500); continue; } const m = ev("(function(){const m=new Chess(P.g.fen()).move(P.pz.sol[P.k],{sloppy:true});return m.from+'-'+m.to})()").split("-"); click('[data-sq="' + m[0] + '"]'); click('[data-sq="' + m[1] + '"]'); await sleep(700); } }
  ok(ev("RU.score") >= 1, "point marqué en rafale");
  ev("rushWrong()"); await sleep(800); ev("rushWrong()"); await sleep(800); ev("rushWrong()"); await sleep(100);
  ok(ev("V.view") === "rush" && ev("S.rush.best") >= 1 && /Rafale terminée/.test(d.body.textContent), "rafale terminée avec record");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  ev("V.stack=[];V.view='strat';V.tab='strat';render()");
  ok(d.querySelectorAll("#main .trow").length === 6 && d.querySelector('.tab[aria-current="page"]').textContent.indexOf("Stratégie") >= 0, "onglet Stratégie : 6 entrées regroupées");
  click('[data-act="tab"][data-v="concepts"]'); ok(ev("V.view") === "concepts" && d.querySelectorAll('[data-act="stc"]').length === 17, "concepts : 17 concepts");
  click('[data-act="stc"][data-id="exchange"]'); ok(ev("V.view") === "stratc" && d.querySelectorAll(".board").length === 1 && d.querySelectorAll('[data-act="stex"]').length === 2, "concept avec 2 exemples");
  click('[data-act="stgo"][data-i="1"]'); ok(ev("V.si") === 1 && /sacrifice de qualité/i.test(d.body.textContent), "pas dans la ligne");
  click('[data-act="stex"][data-i="1"]'); ok(ev("V.ii") === 1, "second exemple");
  click('[data-act="stseen"]'); ok(ev("S.stv.exchange") === 1, "concept marqué vu");
  ev("goBack()"); ok(ev("V.view") === "concepts", "retour à la liste");
  ok(ev("STRAT.every((c) => c.ills.every((x) => { const g = x.fen ? new Chess(x.fen) : new Chess(); return x.sans.every((m) => g.move(m, { sloppy: true })); }))"), "tous les exemples sont légaux");
  ev("V.stack=[];V.opId='ita';V.view='op';V.open['ita-sacs']=true;render()"); ok(d.querySelectorAll('#main [data-act="sac"]').length === 3, "3 sacrifices italiens dans la page de l'ouverture");
  click('[data-act="sac"][data-id="ita-fried"]'); ok(ev("V.view") === "sac" && /Fried Liver/.test(d.body.textContent), "sacrifice ouvert");
  for (let i = 0; i < 4; i++) click('[data-act="stgo"][data-i="' + (ev("V.si") + 1) + '"]');
  ok(ev("SACS.length") >= 14 && ev("OPENINGS.every((o) => SACS.some((s) => s.op === o.id))"), "chaque ouverture a des sacrifices");
  ev("V.stack=[];V.opId='lon';V.view='op';render()"); ok(!!d.querySelector('[data-act="chtoggle"][data-id="lon-sacs"]'), "chapitre sacrifices dans l'ouverture");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  click('[data-act="trk"][data-v="end"]'); ok(d.querySelectorAll('.fold').length === 6 && d.querySelectorAll('[data-act="egplay"]').length === 0 && d.querySelectorAll('.fold-h[aria-expanded="false"]').length === 6, "onglet Finales : 6 chapitres fermés par défaut"); ev("V.open={};V.stack=[];V.view='endg';render()"); ok(d.querySelectorAll('.fold').length === 6 && d.querySelectorAll('[data-act="egplay"]').length === 0, "page Finales : chapitres fermés"); ev("EG_CHAPS.forEach((c) => { V.open['egc-' + c.id] = true; });render()"); ok(ev("V.view") === "endg" && d.querySelectorAll('[data-act="egplay"]').length === 41 && d.querySelectorAll('[data-act="eglesson"]').length === 20, "41 finales en 20 leçons, 6 chapitres");
  click('[data-act="eglesson"][data-id="opposition"]'); ok(ev("V.view") === "eglesson" && d.querySelectorAll(".board").length === 3 && /L'opposition/.test(d.body.textContent), "leçon avec 3 diagrammes");
  click('[data-act="egread"]'); ok(ev("S.egl.opposition") === 1, "leçon marquée lue");
  ev("goBack()"); ok(ev("V.view") === "endg", "retour à la liste");
  ev("V.lsid='dame-pion';V.view='eglesson';render()"); ok(!/undefined/.test(d.getElementById('main').textContent), "leçon sans diagramme");
  ev("V.view='endg';render()");
  ev("EG_LIST.forEach((x, i) => { if (!new Chess(x.fen).moves().length) throw new Error('finale ' + i); }); EG_LESSONS.forEach((l) => l.secs.forEach((s) => { if (!new Chess(s.fen)) throw 1; }))");
  click('[data-act="egplay"][data-i="0"]'); ok(ev("V.view") === "egex" && /Exemple/.test(d.getElementById("main").textContent), "exemple avant la finale"); click('[data-act="egplay2"]'); ok(ev("VS.eg") === 0 && ev("V.view") === "vs", "finale ouverte");
  ev("VS.g = new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1'); VS.me='w'; renderMain()");
  click('[data-sq="f7"]'); click('[data-sq="g7"]');
  ok(ev("S.eg[0].ok") === 1 && /Réussi/.test(d.body.textContent), "mat réussi dans la finale");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()");
  click('[data-act="wpopen"]'); ok(ev("V.view") === "wp" && /Woodpecker/.test(d.body.textContent), "page Pic-vert");
  ev("WPF.th='Promotion'"); click('[data-act="wpf"][data-f="size"][data-v="10"]'); click('[data-act="wpnew"]');
  const wsid = ev("V.wpsid"); ok(!!wsid && ev("S.wp.sets[0].ids.length") >= 3, "série Pic-vert créée");
  const wn = ev("S.wp.sets[0].ids.length");
  click('[data-act="wpgo"]'); ok(ev("P.mode") === "wp", "série lancée");
  for (let i = 0; i < wn; i++) { await solveP(); if (i < wn - 1) { click('[data-act="pznext2"]'); await sleep(100); } }
  ok(/Note/.test(d.body.textContent) && !!d.querySelector('[data-act="wpres"]'), "note affichée et bouton de résultat");
  click('[data-act="wpres"]'); ok(ev("V.view") === "wp" && ev("S.wp.sets[0].cycles") === 1 && ev("S.wp.sets[0].times.length") === 1, "cycle terminé et temps enregistré");
  ok(/Cycle 1 terminé/.test(d.body.textContent), "résumé du cycle");
  click('[data-act="wpdel"]'); ok(ev("S.wp.sets.length") === 0, "série supprimée");
  ev("V.stack=[];V.view='prog';render()");
  ok(/Réussite par thème/.test(d.body.textContent) && /Tes objectifs/.test(d.body.textContent), "statistiques et objectifs");
  click('[data-act="goal"][data-k2="p"][data-v="100"]'); ok(ev("S.goal.p") === 1600, "objectif modifiable");
  // bilan de partie avec moteur simulé qui désigne un meilleur coup
  w.engAnalyse = async (fen) => { const g = new (ev("Chess"))(fen); const ms = g.moves({ verbose: true }); return [{ d: 9, t: "cp", v: 300, pv: [ms[ms.length - 1].from + ms[ms.length - 1].to] }, { d: 9, t: "cp", v: -300, pv: [ms[0].from + ms[0].to] }]; };
  w.engPlay = async (fen) => { const g = new (ev("Chess"))(fen); const m = g.moves({ verbose: true })[0]; return m ? m.from + m.to : null; };
  ev("V.stack=[];V.view='home';render()");
  ev("V.stack=[];V.view='games';V.tab='games';render()"); click('[data-act="vsopen"]'); click('[data-act="vscol"][data-v="w"]'); click('[data-act="vsstart"]');
  for (const mv of [["e2", "e4"], ["d2", "d4"], ["c2", "c4"], ["g1", "f3"], ["b1", "c3"]]) { click('[data-sq="' + mv[0] + '"]'); click('[data-sq="' + mv[1] + '"]'); await sleep(800); }
  click('[data-act="vsresign"]'); await sleep(600);
  ok(ev("VS.rev && !VS.rev.busy"), "bilan de partie terminé");
  const bn = ev("VS.rev.items.length");
  if (bn) { click('[data-act="vsadd"][data-i="0"]'); ok(ev("S.mypz.some(p=>/Stockfish/.test(p.t))"), "erreur de partie ajoutée aux problèmes"); } else ok(/Aucun coup très faible/.test(d.body.textContent), "bilan sans erreur affiché");


  // --- Sous-variante d'une ligne existante, avec explications obligatoires
  ev("S.custom = []; rebuildCustom(); V.stack=[]; V.view='home'; render()");
  const base = ev("LINES.find((L) => L.op === 'lon').id"), baseSans = ev("LINE_BY_ID['" + base + "'].sans");
  ev("V.stack=[];V.view='op';V.opId=LINE_BY_ID['" + base + "'].op;V.open[LINE_BY_ID['" + base + "'].op + '-' + LINE_BY_ID['" + base + "'].ch]=true;render()");
  ok(!!d.querySelector('[data-act="vsline"][data-id="' + base + '"]') && !!d.querySelector('[data-act="edbranch"][data-id="' + base + '"]'), "boutons sous-variante et jouer la suite sur la ligne");
  click('[data-act="edbranch"][data-id="' + base + '"]');
  ev("E.idx = 3; edRebuild(); renderMain()");
  ok(ev("V.view") === "edit" && ev("!!E.parent && E.idx") === 3 && /Sous-variante de/.test(d.body.textContent), "éditeur de sous-variante ouvert au coup 3");
  ev("E.sans = E.sans.slice(0,3); Object.keys(E.notes).forEach((k) => { if (Number(k) >= 3) delete E.notes[k]; }); E.idx = 3; edRebuild(); E.g = new Chess(); E.sans.forEach((m) => E.g.move(m)); renderMain()");
  ok(ev("edBp()") === -1, "variante identique détectée");
  const alt = ev("(function(){const g=new Chess();E.sans.forEach((m)=>g.move(m));const orig=LINE_BY_ID['" + base + "'].sans[3];const mv=g.moves().find((m)=>m!==orig&&!/[#+]/.test(m));return mv})()");
  const am = ev("(function(){const g=new Chess();E.sans.forEach((m)=>g.move(m));const m=g.move('" + alt + "');return m.from+'-'+m.to})()").split("-");
  click('[data-sq="' + am[0] + '"]'); click('[data-sq="' + am[1] + '"]');
  ok(ev("edBp()") === 3 && ev("E.sans.length") === 4, "variante différente au coup 4");
  const rm = ev("(function(){const m=E.g.moves({verbose:true})[0];return m.from+'-'+m.to})()").split("-"); click('[data-sq="' + rm[0] + '"]'); click('[data-sq="' + rm[1] + '"]');
  ok(ev("E.sans.length") === 5, "deuxième coup de la variante joué");
  ev("E.name = 'Sous-variante test'"); click('[data-act="edsave"]');
  ok(ev("S.custom.length") === 0 && /Explique/.test(d.body.textContent), "enregistrement refusé sans explication");
  ev("E.notes[3] = 'Je joue ça pour la raison X'"); click('[data-act="edsave"]');
  ok(ev("S.custom.length") === 0 && /dernier coup/.test(d.body.textContent), "dernier coup aussi à expliquer");
  ev("E.notes[E.sans.length-1] = 'Objectif : plan Y'"); click('[data-act="edsave"]');
  ok(ev("S.custom.length") === 1 && ev("S.custom[0].parent") === base && ev("S.custom[0].bp") === 3, "sous-variante enregistrée avec son parent");
  ok(ev("LINES.find((L) => L.custom).notes[3]") === "Je joue ça pour la raison X" && ev("LINES.find((L) => L.custom).sans.slice(0,3).join(' ')") === baseSans.slice(0, 3).join(" "), "explication et début de ligne conservés");
  ev("startTrainer(LINES.find((L) => L.custom).id, 'learn', false)");
  ok(ev("T.L.parent") === base, "sous-variante étudiable comme une ligne");
  ev("goBack(); S.custom=[]; rebuildCustom()");

  // --- Partie depuis une position de ligne
  ev("S.vs = []; vsLine('" + base + "', 4)");
  ok(ev("V.view") === "vs" && /Départ depuis ta ligne/.test(d.body.textContent), "départ depuis une ligne proposé");
  click('[data-act="vscol"][data-v="w"]'); click('[data-act="vsstart"]');
  ok(ev("VS.stage") === "play" && ev("VS.g.history().length") === 4 && ev("VS.startPly") === 4, "partie commencée après 4 demi-coups de la ligne");
  ev("V.stack=[];V.view='home';render()");

  // --- Révision espacée des fiches de plan
  ev("S.sr = {}; S.lines['" + base + "'] = Object.assign(S.lines['" + base + "'] || {}, { seen: 1, box: 1, due: todayStr() })");
  ev("V.stack=[];V.view='home';render()");
  ok(/Fiches de plan/.test(d.body.textContent) && !!d.querySelector('[data-act="plgo"]'), "fiches de plan à réviser sur l'accueil");
  click('[data-act="plgo"]');   ok(ev("V.view") === "plrev" && ev("PL.stage") === "learn", "première fiche : lecture");
  click('[data-act="plquizgo"]'); const sq0 = ev("STRUCTS[PL.queue[0]].quiz.a"); click('[data-act="plpick"][data-i="' + sq0 + '"]'); click('[data-act="plfinish"]');
  ok(ev("S.sr[PL.queue[0]].box") === 1 && ev("PL.stage") === "res", "fiche notée et planifiée");
  ev("S.sr[PL.queue[0]].due = addDays(todayStr(), -1); PL.i = 0; PL.stage='recall'; renderMain()");
  click('[data-act="plreveal"]'); click('[data-act="plself"][data-v="2"]'); click('[data-act="plpick"][data-i="' + sq0 + '"]'); click('[data-act="plfinish"]');
  ok(ev("S.sr[PL.queue[0]].box") === 2, "fiche retenue : intervalle allongé");
  ev("PL = null; V.stack=[];V.view='home';render()");

  // --- Pic-vert sur mes faiblesses
  ev("S.wp = { sets: [] }; allPz().filter((p) => p.th === 'Fourchette').slice(0, 3).forEach((p) => { S.pz[p.id] = { ok: 1, errs: 2, tries: 1, rated: 1, f: 0, last: todayStr() }; })");
  ev("V.trk='tact';V.stack=[];V.view='puz';render()"); click('[data-act="wpopen"]');
  ok(/Mes faiblesses/.test(d.body.textContent) && ev("wpWeakThemes().indexOf('Fourchette')") >= 0, "thèmes faibles repérés");
  click('[data-act="wpweak"]'); ok(ev("S.wp.sets.length") === 1 && /Mes faiblesses/.test(ev("S.wp.sets[0].title")), "série de faiblesses créée");


  // --- Navigation : 5 onglets, barre du haut, motifs de mat
  ev("V.stack=[];V.view='home';V.tab='home';render()");
  ok(d.querySelectorAll('nav .tab').length === 6, "6 onglets de navigation");
  click('[data-act="tab"][data-v="rep"]');
  ok(!!d.querySelector('.chips2') && d.querySelectorAll('.acc').length === 6 && !d.querySelector('[data-act="adopen"]'), "Répertoire : ouvertures seules");
  click('[data-act="tab"][data-v="strat"]'); click('[data-act="tab"][data-v="plans"]'); ok(ev("V.view") === "plans" && d.querySelector('.tab[aria-current="page"]').textContent.indexOf("Stratégie") >= 0, "onglet Stratégie actif sur les plans");
  ev("V.stack=[];V.view='puz';V.tab='puz';render()");
  click('[data-act="matopen"]'); ok(ev("V.view") === "mats" && d.querySelectorAll('.matcard').length === ev("MATS.length") && !!d.querySelector('.topbar'), "page des motifs de mat avec barre du haut");
  click('[data-act="matd"][data-id="arabe"]'); ok(/Mat des Arabes/.test(d.body.textContent), "fiche du mat des Arabes");
  click('[data-act="matgo"]'); ok(ev("P.mode") === "mat" && ev("P.mt") === "arabe" && ev("P.pz.mt") === "arabe", "problème de mat lancé");
  await solveP(); ok(ev("P.stage") === "done", "mat résolu");
  const nxt = ev("pzFollow(P)"); ok(nxt && ev("allPz().find((p) => p.id === '" + nxt + "').mt") === "arabe", "problème suivant du même motif");
  ev("goBack(); V.stack=[];V.view='home';V.tab='home';render()");

  ev("V.stack=[];V.view='home';render()");
  ev("V.open['hm-prog']=false;render()");
  ok(d.querySelectorAll('.slider').length === 0, "accueil épuré : sections repliées");
  ev("V.open['hm-prog']=true;render()");
  ok(d.querySelectorAll('.slider').length === 1 && !/Explorer/.test(d.getElementById("main").textContent), "accueil sans Explorer, un slider (Programme)");
  ev("V.open['hm-prog']=false;render()");

  console.log(errors.length ? "ERREURS JS :\n" + errors.join("\n") : "aucune erreur JS");
  console.log(fails ? fails + " échec(s)" : "TOUT PASSE");
  process.exit(fails || errors.length ? 1 : 0);
})();
