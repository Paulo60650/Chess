/* ===== Élo (problèmes, études, parties) et parties contre Stockfish ===== */
function eloS() {
  if (!S.elo || typeof S.elo !== "object") S.elo = {};
  const e = S.elo;
  ["p", "s", "g"].forEach((k) => { if (typeof e[k] !== "number") e[k] = 1200; if (typeof e[k + "n"] !== "number") e[k + "n"] = 0; });
  if (typeof e.b !== "number") e.b = Math.max(800, e.p - 250);
  if (typeof e.bn !== "number") e.bn = 0;
  if (!Array.isArray(e.h)) e.h = [];
  e.h.forEach((x) => { if (typeof x.b !== "number") x.b = e.b; });
  return e;
}
function strHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
/* Cote d'un problème : niveau de base + petit écart fixe propre au problème */
function pzRating(p) { if (p.r) return p.r; return [0, 1000, 1350, 1700][p.lv || 1] + (strHash(p.id) % 161) - 80; }
/* Cote d'une ligne : plus elle est longue, plus elle est difficile à rejouer sans faute */
function lineRating(L) {
  const mine = Math.ceil(L.sans.length / 2);
  let r = 750 + 38 * mine + (L.trap ? 60 : 0);
  Object.keys(S.hard || {}).forEach((k) => { if (S.hard[k].id === L.id) r += 25; });
  return Math.max(700, Math.min(2100, r));
}
function eloUpdate(key, opp, score) {
  const e = eloS(), n = e[key + "n"], K = n < 20 ? 40 : n < 60 ? 28 : 20;
  const exp = 1 / (1 + Math.pow(10, (opp - e[key]) / 400));
  const d = Math.round(K * (score - exp));
  e[key] += d; e[key + "n"]++;
  const t = todayStr(), last = e.h[e.h.length - 1];
  if (last && last.d === t) { last.p = e.p; last.s = e.s; last.g = e.g; last.b = e.b; } else e.h.push({ d: t, p: e.p, s: e.s, g: e.g, b: e.b });
  if (e.h.length > 90) e.h.shift();
  return d;
}
function eloSigned(d) { return (d > 0 ? "+" : d < 0 ? "−" : "±") + Math.abs(d); }
function eloStudy(L, errs) {
  const score = errs === 0 ? 1 : errs === 1 ? 0.65 : errs <= 3 ? 0.3 : 0;
  return { d: eloUpdate("s", lineRating(L), score), now: eloS().s, opp: lineRating(L) };
}
function eloPuzzle(pz, errs, shown, hinted) {
  let score = shown ? 0 : errs === 0 ? 1 : errs === 1 ? 0.5 : 0.25;
  if (hinted && score > 0.5) score = 0.5;
  return { d: eloUpdate("p", pzRating(pz), score), now: eloS().p, opp: pzRating(pz) };
}
function eloChip(x) { return x ? '<span class="chip ' + (x.d > 0 ? "good" : x.d < 0 ? "bad" : "") + '">Élo ' + eloSigned(x.d) + " → " + x.now + "</span>" : ""; }
function eloSpark(e) {
  if (e.h.length < 2) return '<p class="small muted">Le graphique apparaît dès le deuxième jour de jeu.</p>';
  const W = 300, H = 90, pad = 6, ks = [["p", "var(--c-amber, #d9922b)"], ["s", "var(--c-blue, #3b7dd8)"], ["g", "var(--c-green, #2f9e6a)"], ["b", "#8b5cf6"]];
  let lo = 1e9, hi = -1e9;
  e.h.forEach((x) => ks.forEach((k) => { lo = Math.min(lo, x[k[0]]); hi = Math.max(hi, x[k[0]]); }));
  if (hi - lo < 40) { hi += 20; lo -= 20; }
  const X = (i) => pad + (W - 2 * pad) * i / (e.h.length - 1), Y = (v) => H - pad - (H - 2 * pad) * (v - lo) / (hi - lo);
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" class="elospark" role="img" aria-label="Évolution des Élo">';
  ks.forEach((k) => { s += '<polyline fill="none" stroke="' + k[1] + '" stroke-width="2" stroke-linejoin="round" points="' + e.h.map((x, i) => X(i).toFixed(1) + "," + Y(x[k[0]]).toFixed(1)).join(" ") + '"/>'; });
  return s + "</svg>";
}
function eloCardHTML() {
  const e = eloS();
  return '<section class="card"><span class="label">Tes classements</span>' +
    '<div class="grid3 wkstats"><div class="stat" data-k="amber"><span class="label">Problèmes</span><b>' + e.p + '</b><span class="small muted">' + e.pn + ' résolus notés</span></div>' +
    '<div class="stat" data-k="blue"><span class="label">Études</span><b>' + e.s + '</b><span class="small muted">' + e.sn + ' lignes notées</span></div>' +
    '<div class="stat" data-k="green"><span class="label">Parties</span><b>' + e.g + '</b><span class="small muted">' + e.gn + " contre Stockfish</span></div>" +
    '<div class="stat" data-k="violet"><span class="label">À l\'aveugle</span><b>' + e.b + '</b><span class="small muted">' + e.bn + " puzzles notés</span></div></div>" +
    eloSpark(e) + '<p class="small muted"><span style="color:#d9922b">●</span> problèmes · <span style="color:#3b7dd8">●</span> études · <span style="color:#2f9e6a">●</span> parties · <span style="color:#8b5cf6">●</span> à l\'aveugle. Chaque classement part de 1200. Ils évoluent comme aux échecs : réussir un problème ou une ligne plus dur que toi rapporte plus.</p></section>';
}

/* ---------- Jouer contre Stockfish ---------- */
var VS_LEVELS = [
  { n: "Débutant", e: 800, sk: 0, ms: 250 }, { n: "Novice", e: 1000, sk: 2, ms: 300 }, { n: "Club", e: 1200, sk: 5, ms: 400 },
  { n: "Intermédiaire", e: 1400, sk: 8, ms: 500 }, { n: "Confirmé", e: 1600, sk: 11, ms: 700 }, { n: "Avancé", e: 1800, sk: 14, ms: 900 },
  { n: "Expert", e: 2000, sk: 17, ms: 1200 }, { n: "Maître", e: 2300, sk: 20, ms: 1800 }, { n: "Maximum", e: 2600, sk: 20, ms: 3000 }
];
var MAIA_LEVELS = [
  { n: "Joueur de 900", e: 900 }, { n: "Joueur de 1100", e: 1100 }, { n: "Joueur de 1300", e: 1300 }, { n: "Joueur de 1500", e: 1500 },
  { n: "Joueur de 1700", e: 1700 }, { n: "Joueur de 1900", e: 1900 }, { n: "Joueur de 2100", e: 2100 }
];
function vsLv(o) { o = o || VS; return (o && o.eng === "maia" ? MAIA_LEVELS : VS_LEVELS)[o.lvl] || VS_LEVELS[0]; }
function vsName(o) { o = o || VS; return (o && o.eng === "maia" ? "Maia " : "Stockfish ") + vsLv(o).e; }
/* Maia 3 (Université de Toronto, via maia3-web de G. Plitt, AGPL-3.0) : prédit le coup d'un humain d'un Élo donné */
var MAIA = { w: null, n: 0, pend: {}, err: null, ready: null };
function maiaInit() {
  if (MAIA.ready) return MAIA.ready;
  MAIA.ready = new Promise((resolve) => {
    try {
      if (typeof MAIA_SRC === "undefined") { MAIA.err = "module absent"; resolve(false); return; }
      const w = new Worker(URL.createObjectURL(new Blob([MAIA_SRC], { type: "text/javascript" })));
      w.onmessage = (e) => { const r = e.data, p = MAIA.pend[r.id]; if (!p) return; delete MAIA.pend[r.id]; p(r.type === "result" ? r : null, r.error); };
      w.onerror = (e) => { MAIA.err = (e && e.message) || "erreur du worker"; };
      w.postMessage({ type: "load", weights: new URL(MAIA_WEIGHTS, location.href).href });
      MAIA.w = w; resolve(true);
    } catch (e) { MAIA.err = String(e.message || e); resolve(false); }
  });
  return MAIA.ready;
}
/* Demande à Maia les probabilités de chaque coup légal pour un joueur de selfElo. */
function maiaAsk(fens, legal, selfElo, oppoElo, timeout) {
  return maiaInit().then((ok) => {
    if (!ok) return null;
    return new Promise((resolve) => {
      const id = ++MAIA.n;
      const tm = setTimeout(() => { delete MAIA.pend[id]; MAIA.err = "délai dépassé (chargement des poids ?)"; resolve(null); }, timeout || 60000);
      MAIA.pend[id] = (r, err) => { clearTimeout(tm); if (!r) { MAIA.err = err || "erreur"; resolve(null); return; } resolve(r); };
      MAIA.w.postMessage({ type: "analyse", id, fens, legal, selfElo: Math.max(600, Math.min(2400, selfElo)), oppoElo: Math.max(600, Math.min(2400, oppoElo)) });
    });
  });
}
function maiaFens(g) { const t = new Chess(), fens = [t.fen()]; g.history().forEach((m) => { t.move(m); fens.push(t.fen()); }); return fens; }
function maiaLegal(g) { return g.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion || "")); }
function maiaPlay(g, elo, myElo) {
  return maiaAsk(maiaFens(g), maiaLegal(g), elo, myElo).then((r) => {
    if (!r) return null;
    let x = Math.random(), pick = r.moves[0].move;
    for (const m of r.moves) { x -= m.p; if (x <= 0) { pick = m.move; break; } }
    return pick;
  });
}
function engPlay(fen, sk, ms) {
  return engInit().then((ok) => {
    if (!ok) return null;
    return new Promise((resolve) => {
      const w = ENG.w;
      const tm = setTimeout(() => w.postMessage("stop"), ms);
      ENG.listener = (l) => {
        if (l.indexOf("bestmove") !== 0) return;
        clearTimeout(tm); ENG.listener = null;
        w.postMessage("setoption name Skill Level value 20"); w.postMessage("setoption name MultiPV value 3");
        const m = l.split(" ")[1]; resolve(m && m !== "(none)" ? m : null);
      };
      w.postMessage("ucinewgame"); w.postMessage("setoption name MultiPV value 1");
      w.postMessage("setoption name Skill Level value " + sk);
      w.postMessage("position fen " + fen); w.postMessage("go depth 18");
    });
  });
}
function vsOpen() {
  VS = { stage: "setup", lvl: 2, col: "r", eng: "sf", start: null };
  go("vs");
}
/* Joue la suite d'une ligne contre le moteur : la partie démarre après `ply` demi-coups de la ligne */
function vsLine(id, ply) {
  const L = LINE_BY_ID[id]; if (!L) return;
  const n = ply == null || isNaN(ply) ? L.sans.length : Math.max(0, Math.min(L.sans.length, Number(ply)));
  VS = { stage: "setup", lvl: 2, col: OP_BY_ID[L.op].side, eng: "sf", start: { id: L.id, name: L.name, ply: n, sans: L.sans.slice(0, n), struct: L.struct } };
  go("vs");
}
function vsStart() {
  const me = VS.col === "r" ? (Math.random() < 0.5 ? "w" : "b") : VS.col;
  const g0 = new Chess(); if (VS.start) VS.start.sans.forEach((m) => g0.move(m));
  VS = Object.assign(VS, { stage: "play", me, g: g0, startPly: VS.start ? VS.start.sans.length : 0, sel: null, tg: [], last: null, lock: false, msg: "", over: null, res: null, id: Date.now() });
  renderMain();
  if (g0.turn() !== me) vsEngine();
}
function vsEnd(reason, score) {
  VS.over = reason; VS.stage = "done"; VS.lock = false; VS.sel = null; VS.tg = [];
  const L = vsLv();
  VS.res = { score, d: eloUpdate("g", L.e, score), now: eloS().g };
  S.vs = (S.vs || []).concat([{ date: todayStr(), lvl: VS.lvl, eng: VS.eng, me: VS.me, score, moves: VS.g.history() }]).slice(-30);
  logDay((l) => { l.v = (l.v || 0) + 1; });
  sfx(score === 1 ? "done" : score === 0 ? "bad" : "ok");
  save(); renderMain(); vsReview();
}
function vsCheck() {
  if (VS.eg != null) return egCheck();
  const g = VS.g;
  if (g.in_checkmate()) { vsEnd("Échec et mat", g.turn() === VS.me ? 0 : 1); return true; }
  if (g.in_stalemate()) { vsEnd("Pat", 0.5); return true; }
  if (g.in_draw()) { vsEnd(g.in_threefold_repetition() ? "Répétition de la position" : g.insufficient_material() ? "Matériel insuffisant" : "Règle des 50 coups", 0.5); return true; }
  return false;
}
function vsSquare(sq) {
  if (!VS || VS.stage !== "play" || VS.lock) return;
  const g = VS.g, p = g.get(sq);
  if (g.turn() !== VS.me) return;
  if (VS.sel && VS.tg.indexOf(sq) >= 0) {
    const mv = g.move({ from: VS.sel, to: sq, promotion: "q" });
    VS.sel = null; VS.tg = [];
    if (!mv) return;
    VS.last = [mv.from, mv.to]; VS.msg = ""; sfx("move");
    if (vsCheck()) return;
    VS.lock = true; renderMain(); vsEngine(); return;
  }
  if (p && p.color === VS.me) { VS.sel = sq; VS.tg = g.moves({ square: sq, verbose: true }).map((m) => m.to); } else { VS.sel = null; VS.tg = []; }
  renderMain();
}
function vsEngine() {
  const id = VS.id, L = vsLv();
  VS.lock = true; renderMain();
  const t0 = Date.now();
  (VS.eng === "maia" ? maiaPlay(VS.g, L.e, eloS().g) : engPlay(VS.g.fen(), L.sk, L.ms)).then((u) => {
    if (!VS || VS.id !== id || VS.stage !== "play") return;
    if (!u) { VS.lock = false; VS.msg = VS.eng === "maia" ? "Maia n'a pas pu se charger (" + (MAIA.err || "inconnu") + "). Maia a besoin de la version publiée de la page et de 5 Mo de données. Réessaie ou choisis Stockfish." : "Le moteur n'a pas pu se charger (" + (ENG.err || "inconnu") + "). Recharge la page ou réessaie."; renderMain(); return; }
    const wait = Math.max(0, 350 - (Date.now() - t0));
    setTimeout(() => {
      if (!VS || VS.id !== id || VS.stage !== "play") return;
      const mv = VS.g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      if (!mv) { VS.lock = false; VS.msg = "Coup du moteur illisible."; renderMain(); return; }
      VS.last = [mv.from, mv.to]; VS.lock = false; sfx("move");
      if (!vsCheck()) renderMain();
    }, wait);
  });
}
function vsUndoBtn() { const can = VS.g.history().length > (VS.me === "b" ? 1 : 0); return '<button class="btn" data-act="vsundo"' + (can ? "" : " disabled") + '>Annuler le coup</button>'; }
function vsUndo() {
  if (!VS || VS.stage !== "play") return;
  const g = VS.g, minH = VS.me === "b" ? 1 : 0;
  if (VS.lock) { if (g.history().length > minH && g.turn() !== VS.me) { VS.id = Date.now(); g.undo(); VS.lock = false; } else return; }
  else { if (g.turn() !== VS.me || g.history().length <= minH) return; g.undo(); if (g.history().length > minH) g.undo(); }
  VS.sel = null; VS.tg = []; VS.msg = ""; VS.last = null; sfx("move"); renderMain();
}
function vsResign() { if (VS && VS.stage === "play") { if (VS.eg != null) egEnd(false, "Abandon"); else vsEnd("Abandon", 0); } }
function vsScan() {
  const g = VS.g, h = g.history();
  V.gres = { total: 1, bad: 0, skipped: 0, games: [{ color: VS.me, score: VS.res ? VS.res.score : null, inBook: 0, dev: null, len: h.length, moves: h, opp: vsName() }] };
  setTab("games");
}
function vsPgn() {
  const h = VS.g.history(); let s = "";
  h.forEach((m, i) => { if (i % 2 === 0) s += (i / 2 + 1) + ". "; s += m + " "; });
  const r = VS.res ? (VS.res.score === 1 ? "1-0" : VS.res.score === 0 ? "0-1" : "1/2-1/2") : "*";
  const w = VS.me === "w" ? "Moi" : vsName(), b = VS.me === "w" ? vsName() : "Moi";
  const rr = VS.me === "w" ? r : (r === "1-0" ? "0-1" : r === "0-1" ? "1-0" : r);
  return '[White "' + w + '"]\n[Black "' + b + '"]\n[Result "' + rr + '"]\n\n' + s + rr;
}
function vsHTML() {
  if (!VS) return backBtn();
  if (VS.eg != null) return egPlayHTML();
  let h = backBtn("Parties") + '<div class="hdr"><h1>Jouer une partie</h1><p class="muted">Choisis ton adversaire : Stockfish (fort, froid) ou Maia (il joue comme un humain du niveau choisi). Ta cote « Parties » ' + eloS().g + " évolue après chaque partie terminée.</p></div>";
  if (VS.stage === "setup") {
    if (VS.start) h += '<section class="card" data-k="teal" style="border-left:4px solid var(--k)"><span class="label">Départ depuis ta ligne</span><b>' + esc(VS.start.name) + '</b><p class="small muted">La partie commence après ' + (VS.start.ply ? VS.start.sans.map((m, i) => (i % 2 === 0 ? (i / 2 + 1) + ". " : "") + dispSan(m)).join(" ") : "0 coup") + ". Applique le plan de la fiche « " + esc(STRUCTS[VS.start.struct].title) + ' » et vois si tu sais jouer la suite. <button class="btn small" data-act="struct" data-id="' + VS.start.struct + '">Voir la fiche de plan</button></p></section>';
    h += '<section class="card"><span class="label">Adversaire</span><div class="seg" role="group" aria-label="Adversaire">' + [["sf", "Stockfish"], ["maia", "Maia (humain)"]].map((c) => '<button data-act="vseng" data-v="' + c[0] + '" aria-pressed="' + (VS.eng === c[0]) + '">' + c[1] + "</button>").join("") + "</div>" + (VS.eng === "maia" ? '<p class="small muted">Maia 3 prédit le coup qu\'un joueur humain de ce niveau jouerait : il se trompe comme un humain, au lieu de faire des gaffes absurdes. Premier coup : environ 5 Mo à charger. Modèle Maia 3 de l\'équipe CSSLab (Toronto), version web de G. Plitt, licence AGPL-3.0.</p>' : '<p class="small muted">Neuf niveaux, de 800 à 2600 environ. Le niveau est indicatif : ce n\'est pas l\'Élo de Lichess.</p>') + '<span class="label">Niveau</span><div class="stack">';
    (VS.eng === "maia" ? MAIA_LEVELS : VS_LEVELS).forEach((L, i) => { h += '<button class="item" data-k="' + (i < 2 ? "green" : i < 5 ? "amber" : "red") + '" data-act="vslvl" data-i="' + i + '" aria-pressed="' + (VS.lvl === i) + '"><span class="check' + (VS.lvl === i ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + L.n + '</b><span class="small muted">environ ' + L.e + "</span></div></button>"; });
    h += '</div><span class="label">Tu joues</span><div class="seg" role="group" aria-label="Couleur">' + [["w", "Blancs"], ["b", "Noirs"], ["r", "Au hasard"]].map((c) => '<button data-act="vscol" data-v="' + c[0] + '" aria-pressed="' + (VS.col === c[0]) + '">' + c[1] + "</button>").join("") + '</div><button class="btn primary big" data-act="vsstart">Commencer la partie</button></section>';
    const hist = (S.vs || []).slice(-5).reverse();
    if (hist.length) h += '<section class="card"><span class="label">Dernières parties</span>' + hist.map((x) => '<div class="row between small"><span>' + esc(x.date) + " · " + vsLv(x).n + '</span><span class="chip ' + (x.score === 1 ? "good" : x.score === 0 ? "bad" : "") + '">' + (x.score === 1 ? "Victoire" : x.score === 0 ? "Défaite" : "Nulle") + "</span></div>").join("") + "</section>";
    return h;
  }
  const L = vsLv(), myTurn = VS.g.turn() === VS.me && VS.stage === "play";
  h += '<div class="trainer"><div class="stack">' + boardHTML(VS.g, { orient: VS.me, sel: VS.sel, tg: VS.tg, last: VS.last || [], live: VS.stage === "play" && myTurn && !VS.lock }) + "</div>";
  h += '<div class="stack" style="gap:12px"><div class="row"><span class="chip">' + L.n + " · " + L.e + '</span><span class="chip">Tu as les ' + (VS.me === "w" ? "Blancs" : "Noirs") + "</span></div>";
  if (VS.stage === "play") {
    h += '<div class="note">' + (VS.g.in_check() ? "<b>Échec.</b> " : "") + (VS.lock ? (VS.eng === "maia" ? "Maia réfléchit…" : "Stockfish réfléchit…") : myTurn ? "À toi de jouer." : "…") + "</div>";
    if (VS.msg) h += '<div class="note bad">' + esc(VS.msg) + "</div>";
    h += '<div class="row">' + vsUndoBtn() + '<button class="btn" data-act="vsresign">Abandonner</button>' + (typeof EG_EX !== "undefined" && EG_EX[VS.eg] ? '<button class="btn" data-act="egexo" data-i="' + VS.eg + '">Revoir l\'exemple</button>' : "") + "</div>";
  } else {
    const r = VS.res;
    h += '<div class="card"><span class="label">' + esc(VS.over) + "</span><h2>" + (r.score === 1 ? "Victoire" : r.score === 0 ? "Défaite" : "Partie nulle") + "</h2><div class=\"row\">" + eloChip({ d: r.d, now: r.now }) + '</div><div class="row"><button class="btn primary" data-act="vsagain">Nouvelle partie</button><button class="btn" data-act="vsscan">Chercher mes erreurs</button><button class="btn" data-act="vscopy">Copier le PGN</button></div></div>';
  }
  if (VS.stage === "done" && VS.rev) h += vsRevHTML();
  const hist = VS.g.history();
  if (hist.length) h += '<p class="small muted" style="word-break:break-word">' + hist.map((m, i) => (i % 2 === 0 ? (i / 2 + 1) + ". " : "") + dispSan(m)).join(" ") + "</p>";
  return h + "</div></div>";
}

function egPlayHTML() {
  const x = EG_LIST[VS.eg], myTurn = VS.g.turn() === VS.me && VS.stage === "play";
  let h = backBtn("Finales") + '<div class="hdr kh" data-k="' + (x.goal === "win" ? "green" : "amber") + '"><div class="row"><span class="chip k">' + (x.goal === "win" ? "Gagner" : "Faire nulle") + '</span><span class="chip">niveau ' + "●".repeat(x.lv) + "○".repeat(3 - x.lv) + "</span></div><h1>" + esc(x.t) + "</h1></div>";
  h += '<div class="trainer"><div class="stack">' + boardHTML(VS.g, { orient: VS.me, sel: VS.sel, tg: VS.tg, last: VS.last || [], live: VS.stage === "play" && myTurn && !VS.lock }) + '</div><div class="stack" style="gap:12px">';
  if (VS.stage === "play") {
    h += '<div class="note"><b>' + (VS.me === "w" ? "Les Blancs" : "Les Noirs") + " jouent.</b> " + (x.do || (x.goal === "win" ? "Donne mat en moins de " + (x.max || 60) + " coups." : "Tiens 20 coups sans te faire mater.")) + " " + (VS.lock ? (VS.eng === "maia" ? "Maia réfléchit…" : "Stockfish réfléchit…") : "") + "</div>";
    if (VS.msg) h += '<div class="note bad">' + esc(VS.msg) + "</div>";
    h += '<div class="row">' + vsUndoBtn() + '<button class="btn" data-act="vsresign">Abandonner</button></div>';
  } else {
    h += '<div class="note ' + (VS.res.ok ? "good" : "warn") + '"><b>' + (VS.res.ok ? "Réussi. " : "Raté. ") + "</b>" + esc(VS.over) + '</div><div class="card"><span class="label">À retenir</span><p>' + esc(x.why) + '</p></div><div class="row"><button class="btn primary" data-act="egplay2" data-i="' + VS.eg + '">Rejouer</button>' + (typeof EG_EX !== "undefined" && EG_EX[VS.eg] ? '<button class="btn" data-act="egexo" data-i="' + VS.eg + '">Revoir l\'exemple</button>' : "") + '<button class="btn" data-act="back">Retour à la liste</button>' + (x.ls ? '<button class="btn" data-act="eglesson" data-id="' + x.ls + '">Revoir la leçon</button>' : "") + "</div>";
  }
  const hist = VS.g.history();
  if (hist.length) h += '<p class="small muted" style="word-break:break-word">' + hist.map((m, i) => (i % 2 === 0 ? (i / 2 + 1) + ". " : "") + dispSan(m)).join(" ") + "</p>";
  return h + "</div></div>";
}

/* ---------- Bilan automatique de la partie ---------- */
async function vsReview() {
  const id = VS.id; VS.rev = { busy: true, msg: "Analyse de ta partie…", items: [] }; renderMain();
  const ready = await engInit();
  if (!ready) { if (VS && VS.id === id) { VS.rev = { busy: false, msg: "Analyse indisponible : le moteur n'a pas pu se charger.", items: [] }; renderMain(); } return; }
  const g = new Chess(), hist = VS.g.history(), jobs = [], sign = VS.me === "w" ? 1 : -1;
  for (let i = 0; i < hist.length; i++) { if ((i % 2 === 0 ? "w" : "b") === VS.me && i >= Math.max(4, VS.startPly || 0) && jobs.length < 24) jobs.push({ i, fen: g.fen(), san: hist[i] }); if (!g.move(hist[i])) break; }
  const found = [];
  for (let k = 0; k < jobs.length; k++) {
    if (!VS || VS.id !== id) return;
    const j = jobs[k], el = $("#vsrevmsg"); if (el) el.textContent = "Coup " + (k + 1) + " sur " + jobs.length + "…";
    try {
      const res = await engAnalyse(j.fen, 9, 900); if (!res.length) continue;
      const pu = uciOf(j.fen, j.san); if (!pu || res[0].pv[0] === pu) continue;
      const bestV = pzVal(res[0], sign); let pv; const top = res.find((q) => q.pv[0] === pu);
      if (top) pv = pzVal(top, sign); else { const g2 = new Chess(j.fen); g2.move(j.san, { sloppy: true }); const r2 = await engAnalyse(g2.fen(), 8, 700); if (!r2.length) continue; pv = pzVal(r2[0], sign); }
      const loss = bestV - pv; if (loss < 150 || (bestV > 900 && pv > 600)) continue;
      const u = res[0].pv[0], bm = new Chess(j.fen).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      found.push({ i: j.i, fen: j.fen, san: j.san, loss, bestV, playedV: pv, best: bm ? bm.san : null, line: pvSan(j.fen, res[0].pv, 3) });
    } catch (e) { /* coup ignoré */ }
  }
  if (!VS || VS.id !== id) return;
  found.sort((a, b) => b.loss - a.loss);
  VS.rev = { busy: false, items: found.slice(0, 3), msg: found.length ? "" : "Aucun coup très faible détecté : belle partie." }; renderMain();
  /* Maia : que jouerait un humain de ton niveau à cet endroit ? (facultatif, 5 Mo au premier usage) */
  if (VS.rev.items.length) {
    const rev = VS.rev; rev.maia = "wait"; renderMain();
    const myE = eloS().g;
    for (const x of rev.items) {
      if (!VS || VS.id !== id) return;
      try {
        const gg = new Chess(); hist.slice(0, x.i).forEach((m) => gg.move(m));
        const r = await maiaAsk(maiaFens(gg), maiaLegal(gg), myE, myE, 30000);
        if (!r) { rev.maia = "off"; break; }
        const pu = uciOf(x.fen, x.san), pm = r.moves.find((q) => q.move === pu), t = r.moves[0], tm = new Chess(x.fen).move({ from: t.move.slice(0, 2), to: t.move.slice(2, 4), promotion: t.move[4] });
        x.mp = pm ? pm.p : 0; x.mtop = tm ? tm.san : null; x.mtopP = t.p;
      } catch (e) { rev.maia = "off"; break; }
    }
    if (rev.maia === "wait") rev.maia = "ok";
    if (VS && VS.id === id) renderMain();
  }
}
function vsRevHTML() {
  const r = VS.rev; let h = '<section class="card"><span class="label">Bilan de ta partie</span>';
  if (r.busy) return h + '<p class="muted" id="vsrevmsg">' + esc(r.msg) + "</p></section>";
  if (!r.items.length) return h + '<p class="muted">' + esc(r.msg) + "</p></section>";
  h += '<div class="stack">';
  r.items.forEach((x, i) => {
    h += '<div class="stack" style="gap:4px"><b>Coup ' + (Math.floor(x.i / 2) + 1) + " : " + esc(dispSan(x.san)) + "</b><span class=\"small muted\">Le moteur préfère " + esc(x.line) + " (" + cpTxt(x.bestV) + " pour toi, contre " + cpTxt(x.playedV) + ' avec ton coup).</span>' + (x.mtop ? '<span class="small">Un joueur de ton niveau (' + eloS().g + ') jouerait le plus souvent <b>' + esc(dispSan(x.mtop)) + "</b> (" + Math.round(100 * x.mtopP) + " %). " + Math.round(100 * x.mp) + " % d'entre eux jouent ton coup : " + (x.mp >= 0.2 ? "c'est une erreur courante à ton niveau, donc un réflexe à corriger." : x.mp >= 0.05 ? "erreur assez fréquente." : "erreur inhabituelle : sûrement une inattention.") + "</span>" : "") + (x.added ? '<span class="chip good">Ajouté aux problèmes</span>' : '<button class="btn small" data-act="vsadd" data-i="' + i + '">Ajouter en problème</button>') + "</div>";
  });
  if (r.maia === "wait") h += '<p class="small muted">Maia cherche ce qu\'un joueur de ton niveau aurait joué…</p>';
  if (r.maia === "off") h += '<p class="small muted">Comparaison avec Maia indisponible pour l\'instant.</p>';
  return h + "</div></section>";
}
function vsAddPz(i) {
  const x = VS.rev && VS.rev.items[i]; if (!x || x.added || !x.best) return;
  const key = x.fen.split(" ").slice(0, 4).join(" ");
  if (!S.mypz.some((p) => p.key === key)) {
    const hist = VS.g.history(), n = Math.floor(x.i / 2) + 1;
    S.mypz.push({ id: "m" + Date.now().toString(36) + i, key, mine: true, op: guessOp(VS.me, hist[0]), th: "Ton erreur", t: "Ta partie contre Stockfish · coup " + n, fen: x.fen, sol: [x.best],
      goal: "Dans ta partie contre Stockfish (coup " + n + "), tu as joué " + dispSan(x.san) + ". Trouve le coup que le moteur préfère.",
      why: "Le moteur préfère " + dispSan(x.best) + " (" + cpTxt(x.bestV) + " pour toi). Ton coup " + dispSan(x.san) + " ramène l'évaluation à " + cpTxt(x.playedV) + ". Avant de jouer, cherche les échecs, les prises et les menaces de l'adversaire." });
    if (S.mypz.length > 40) S.mypz.shift();
  }
  x.added = true; save(); renderMain();
}
