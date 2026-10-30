/* ===== Tactiques liées à tes ouvertures ===== */
function pzDone(id) { const r = S.pz && S.pz[id]; return !!(r && r.ok); }
const PZ_THEMES = [
  ["Mat", "red", "Mater le roi : en 1, 2 ou 3 coups."],
  ["Fourchette", "amber", "Une pièce attaque deux cibles à la fois."],
  ["Clouage", "violet", "Immobiliser une pièce devant une plus précieuse."],
  ["Découverte", "teal", "Dévoiler l'attaque d'une pièce en bougeant une autre."],
  ["Sacrifice", "orange", "Donner du matériel pour gagner davantage."],
  ["Promotion", "green", "Faire une dame (ou une autre pièce) en fin de combinaison."],
  ["Gain de matériel", "blue", "Prendre une pièce ou un pion que l'adversaire laisse en prise."],
  ["Coup fort", "blue", "Le coup précis qui donne un net avantage."],
  ["Piège évité", "red", "Reconnaître le piège avant de tomber dedans."],
  ["Enfilade", "violet", "Attaquer une pièce de valeur pour gagner celle qui est derrière."],
  ["Échec double", "red", "Deux pièces donnent échec en même temps : le roi doit bouger."],
  ["Rayons X", "violet", "Une pièce agit à travers une autre sur la même ligne."],
  ["Interférence", "teal", "Couper la liaison entre un défenseur et ce qu'il protège."],
  ["Surcharge", "orange", "Un défenseur a trop de travail : attaque une cible, prends l'autre."],
  ["Sacrifice grec", "amber", "Fxh7+ puis Cg5+ et Dh5 : le « cheval de Troie » de Lichess."],
  ["Désperado", "blue", "Une pièce perdue vend sa vie le plus cher possible."],
  ["Contre-échec", "green", "Répondre à un échec par un échec."],
  ["Sous-promotion", "green", "Promouvoir en cavalier, tour ou fou plutôt qu'en dame."],
  ["Déviation", "orange", "Forcer un défenseur à quitter sa case."],
  ["Attraction", "red", "Attirer une pièce ou le roi sur une case fatale."],
  ["Coup intermédiaire", "amber", "Insérer un coup plus fort avant de reprendre."],
  ["Capture du défenseur", "blue", "Supprimer la pièce qui protège la cible."],
  ["Dégagement", "teal", "Libérer une case ou une ligne pour une attaque."],
  ["Pièce piégée", "green", "Une pièce adverse n'a plus de case sûre."],
  ["Zugzwang", "violet", "Chaque coup possible aggrave la position adverse."],
  ["Coup calme", "teal", "Ni échec ni prise : le coup tranquille qui décide."],
  ["Défense", "green", "Trouver le seul coup qui sauve la position."],
  ["Attaque du roi", "red", "Ouvrir les lignes contre un roi exposé."],
  ["Finale de pions", "amber", "Opposition, tempos et pions passés."],
  ["Finale de tours", "orange", "Tour active, roi coupé, positions de Lucena et Philidor."],
  ["Ton erreur", "teal", "Positions de tes propres parties."],
  ["Initiative", "amber", "Garder l'initiative : poser une menace que l'adversaire doit traiter."],
  ["Développement", "green", "Mettre les pièces en jeu et roquer avant d'attaquer."],
  ["Technique de finale", "violet", "Convertir un avantage ou tenir une position en finale."],
  ["Gain d'espace", "blue", "Prendre de l'espace pour gêner les pièces adverses."],
  ["Échanges", "orange", "Choisir quelle pièce échanger, et quand."],
  ["Prophylaxie", "red", "Empêcher le plan de l'adversaire avant de jouer le tien."],
  ["Coordination", "teal", "Faire jouer ensemble tes pièces, surtout la moins active."],
  ["Exploiter une faiblesse", "amber", "Viser le pion isolé, la case faible ou la pièce mal défendue."],
  ["Sécurité du roi", "red", "Protéger ton roi, ou ne pas affaiblir son abri."],
  ["Restriction", "violet", "Priver l'adversaire de bonnes cases."],
  ["Structure de pions", "green", "Fixer ou améliorer la structure de pions."],
  ["Contrôle du centre", "blue", "Contrôler le centre pour donner de l'espace à tes pièces."]
];
const PZ_POS = ["Initiative", "Développement", "Technique de finale", "Gain d'espace", "Échanges", "Prophylaxie", "Coordination", "Exploiter une faiblesse", "Sécurité du roi", "Restriction", "Structure de pions", "Contrôle du centre"];
const OP_GEN = { id: "gen", name: "Tactique générale", short: "Général", k: "blue", g: "✦", side: "w" };
OP_BY_ID.gen = OP_GEN;
const PZ_OPS = OPENINGS.concat([OP_GEN]);
const pzThemeK = (t) => (PZ_THEMES.find((x) => x[0] === t) || [0, "blue"])[1];
const pzLv = (p) => "●".repeat(p.lv || 1) + "○".repeat(3 - (p.lv || 1));
function pzList() { return allPz().filter((p) => (PZ_FILTER.op === "all" || p.op === PZ_FILTER.op) && (PZ_FILTER.th === "all" || p.th === PZ_FILTER.th) && (PZ_FILTER.kind === "all" || (PZ_FILTER.kind === "pos") === !!p.pos)); }
function pzNext(from) {
  const list = pzList();
  const start = from ? list.findIndex((p) => p.id === from) + 1 : 0;
  return list.slice(start).concat(list.slice(0, start)).find((p) => !pzDone(p.id)) || null;
}
function pzItem(p) {
  const o = OP_BY_ID[p.op], d = pzDone(p.id);
  return '<button class="item sess' + (d ? " done" : "") + '" data-k="' + (PZ_FILTER.by === "th" ? o.k : pzThemeK(p.th)) + '" data-act="pzopen" data-id="' + p.id + '"><span class="check' + (d ? " on" : "") + '">' + (d ? "✓" : "") + '</span><span class="grow"><span class="nm">' + esc(p.t) + '</span><br><span class="small muted">' + o.g + " " + esc(o.short) + " · niveau " + pzLv(p) + '</span></span><span class="chip k" data-k="' + pzThemeK(p.th) + '">' + esc(p.th) + "</span></button>";
}
function pzGroup(key, k, g, title, sub, list, extra) {
  const open = !!V.open["pz-" + key], dn = list.filter((p) => pzDone(p.id)).length;
  let h = '<section class="chap" data-k="' + k + '"><button class="chap-h" data-act="chtoggle" data-id="pz-' + esc(key) + '" aria-expanded="' + open + '"><span class="num">' + g + '</span><div class="grow stack" style="gap:2px"><h2>' + esc(title) + '</h2><span class="small muted">' + esc(sub) + '</span></div><span class="chip k">' + dn + "/" + list.length + "</span></button>";
  if (open) h += '<div class="chap-b stack">' + (extra || "") + list.map(pzItem).join("") + "</div>";
  return h + "</section>";
}
function puzHTML() {
  PZ_FILTER.kind = "tac"; PZ_FILTER.th = PZ_FILTER.th && PZ_POS.indexOf(PZ_FILTER.th) < 0 ? PZ_FILTER.th : "all";
  const all = allPz(), done = all.filter((p) => pzDone(p.id)).length, cur = pzList();
  let h = '<div class="hdr"><h1>S\'entraîner</h1></div>' + trainHubHTML();
  if ((V.trk || "tact") !== "tact") return h;
  h += '<h2 class="sec">Tous les problèmes</h2><p class="muted small">Des positions de tes ouvertures, des tactiques générales et des plans de milieu de jeu, rangés par thème. Chaque problème a une cote Élo, et ton classement évolue quand tu les résous. Les solutions sont vérifiées avec Stockfish.</p>';
  h += '<section class="card hero"><div class="row between"><div class="stack"><span class="label">Ta série · Élo ' + eloS().p + '</span><h2>' + done + " sur " + all.length + " résolus</h2></div>" +
    '<div class="stack"><button class="btn primary big" data-act="pznext"' + (pzNext() ? "" : " disabled") + ">" + (done ? "Problème suivant" : "Commencer") + '</button><button class="btn" data-act="xnew">Position surprise</button></div></div>' +
    '<div class="bar"><i style="width:' + Math.round(100 * done / Math.max(1, all.length)) + '%"></i></div>' +
    '<div class="seg" role="group" aria-label="Classement"><button data-act="pzby" data-v="th" aria-pressed="' + (PZ_FILTER.by === "th") + '">Par thème</button><button data-act="pzby" data-v="op" aria-pressed="' + (PZ_FILTER.by === "op") + '">Par ouverture</button></div>' +
    '<div class="chips"><button class="pill" data-k="blue" data-act="pzf" data-id="all" aria-pressed="' + (PZ_FILTER.op === "all") + '">Toutes</button>' +
    PZ_OPS.map((o) => '<button class="pill" data-k="' + o.k + '" data-act="pzf" data-id="' + o.id + '" aria-pressed="' + (PZ_FILTER.op === o.id) + '">' + o.g + " " + esc(o.short) + "</button>").join("") + "</div>" +
    '<div class="chips"><button class="pill" data-k="blue" data-act="pzt" data-id="all" aria-pressed="' + (PZ_FILTER.th === "all") + '">Tous thèmes</button>' +
    PZ_THEMES.filter((t) => all.some((p) => p.th === t[0] && (PZ_FILTER.kind === "all" || (PZ_FILTER.kind === "pos") === !!p.pos))).map((t) => '<button class="pill" data-k="' + t[1] + '" data-act="pzt" data-id="' + esc(t[0]) + '" aria-pressed="' + (PZ_FILTER.th === t[0]) + '">' + esc(t[0]) + "</button>").join("") + "</div></section>";
  if (!cur.length) return h + '<p class="muted">Aucun problème pour ce filtre.</p>';
  if (PZ_FILTER.by === "th") {
    let sep = false;
    PZ_THEMES.forEach((t, i) => {
      const l = cur.filter((p) => p.th === t[0]); if (!l.length) return;
      if (!sep && PZ_POS.indexOf(t[0]) >= 0) { sep = true; h += '<h2 class="sec">Plans de milieu de jeu</h2><p class="muted small">Pas de tactique ici : cherche le meilleur plan, le coup qui améliore ta position.</p>'; }
      h += pzGroup(t[0], t[1], l.length, t[0], t[2], l);
    });
  } else {
    PZ_OPS.forEach((o) => { const l = cur.filter((p) => p.op === o.id); if (l.length) h += pzGroup(o.id, o.k, o.g, o.name || o.short, l.length + " problème" + (l.length > 1 ? "s" : ""), l); });
  }
  return h;
}
function pzThHTML() {
  PZ_FILTER.kind = "tac"; PZ_FILTER.op = "all"; PZ_FILTER.th = "all"; PZ_FILTER.by = "th";
  const all = allPz().filter((p) => !p.pos), done = all.filter((p) => pzDone(p.id)).length;
  let h = backBtn("S'entraîner") + '<div class="hdr"><h1>Tactiques par thème</h1><p class="muted">Choisis un thème (fourchette, clouage, mat…) et travaille-le seul. ' + done + " sur " + all.length + " résolus.</p></div>";
  PZ_THEMES.forEach((t) => {
    if (PZ_POS.indexOf(t[0]) >= 0) return;
    const l = all.filter((p) => p.th === t[0]); if (!l.length) return;
    const nx = l.find((p) => !pzDone(p.id));
    const go = '<div class="row"><button class="btn primary" data-act="pzthgo" data-id="' + esc(t[0]) + '"' + (nx ? "" : " disabled") + ">" + (l.some((p) => pzDone(p.id)) ? "Continuer ce thème" : "Commencer ce thème") + "</button></div>";
    h += pzGroup("th-" + t[0], t[1], l.length, t[0], t[2], l, go);
  });
  return h;
}
function pzPosHTML() {
  PZ_FILTER.kind = "pos"; PZ_FILTER.th = "all"; PZ_FILTER.op = "all"; PZ_FILTER.by = "th";
  const cur = pzList(), done = cur.filter((p) => pzDone(p.id)).length;
  let h = '<div class="hdr"><h1>Problèmes de plans</h1><p class="muted">Pas de tactique ici : cherche le meilleur plan, le coup qui améliore ta position. ' + done + " sur " + cur.length + ' résolus.</p></div>';
  if (!cur.length) return h + '<p class="muted">Aucun problème de plan.</p>';
  PZ_THEMES.forEach((t) => { const l = cur.filter((p) => p.th === t[0]); if (l.length) h += pzGroup(t[0], t[1], l.length, t[0], t[2], l); });
  return h;
}
function puzNew(id, o) {
  o = o || {};
  const pz = allPz().find((p) => p.id === id);
  return { id, pz, g: new Chess(pz.fen), k: 0, errs: 0, wrong: 0, sel: null, tg: [], last: null, msg: "", hint: null, lock: false, stage: "play", shown: false, mode: o.mode || null, theme: o.theme || null, rush: o.mode === "rush", hinted: false, elo: null, sid: o.sid || null, mt: o.mt || null, t0: Date.now(), wpg: null };
}
function puzOpen(id, o) {
  P = puzNew(id, o);
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = "puzzle"; render(); window.scrollTo(0, 0);
}
function puzzleHTML() {
  if (!P) return backBtn();
  const pz = P.pz, op = OP_BY_ID[pz.op], me = new Chess(pz.fen).turn(), who = me === "w" ? "Les Blancs" : "Les Noirs";
  const blind = P.mode === "adapt" && !P.theme && P.stage === "play" && !P.shown;
  let h = P.rush ? rushBarHTML() : backBtn(P.mode === "daily" ? "Défi du jour" : P.mode === "wp" ? "Pic-vert" : P.mode === "mat" ? "Motif de mat" : P.mode === "surprise" ? "Position surprise" : "S'entraîner");
  h += '<div class="hdr kh" data-k="' + op.k + '"><div class="row"><span class="chip k">' + esc(op.short) + '</span>' + (blind ? "" : '<span class="chip k" data-k="' + pzThemeK(pz.th) + '">' + esc(pz.th) + "</span>") + '<span class="chip">niveau ' + pzLv(pz) + '</span><span class="chip">Élo ' + pzRating(pz) + "</span></div><h1>" + (blind ? "Trouve le meilleur coup" : esc(pz.t)) + "</h1></div>";
  h += '<div class="trainer"><div class="stack">' + (P.shown ? pzShownHTML(pz, me) : boardHTML(P.g, { orient: me, sel: P.sel, tg: P.tg, last: P.last || [], hint: P.hint, live: P.stage === "play" && !P.lock })) + "</div>";
  h += '<div class="stack" style="gap:12px">';
  if (P.rush) {
    h += '<div class="note ' + (P.stage === "rushok" ? "good" : "") + '"><b>' + (P.stage === "rushok" ? "Bien !" : who + " jouent.") + "</b> " + (P.stage === "rushok" ? "" : esc(pz.goal)) + "</div>";
    if (P.msg) h += '<div class="note bad">' + esc(P.msg) + "</div>";
  } else if (P.stage === "play") {
    h += '<div class="note"><b>' + who + " jouent.</b> " + esc(blind ? pz.goal.replace(/\s*Thème\s*:[^.]*\.?/, "") : pz.goal) + (pz.sol.length > 1 ? " Coup " + (Math.floor(P.k / 2) + 1) + " sur " + Math.ceil(pz.sol.length / 2) + "." : "") + "</div>";
    if (P.msg) h += '<div class="note bad">' + esc(P.msg) + "</div>";
    h += '<div class="row"><button class="btn" data-act="pzhint"' + (P.hint ? " disabled" : "") + '>Indice</button><button class="btn" data-act="pzshow">Voir la solution</button>' + (P.k === 0 && pzExFor(pz) ? '<button class="btn" data-act="pzex" data-id="' + pz.id + '">Voir un exemple</button>' : "") + '<span class="chip ' + (P.errs ? "bad" : "good") + '">' + P.errs + " erreur" + (P.errs > 1 ? "s" : "") + "</span></div>";
  } else {
    h += '<div class="note ' + (P.shown ? "warn" : "good") + '"><b>' + (P.shown ? "Solution : " : "Bien joué. ") + "</b>" + (P.shown ? esc(pz.sol.map(dispSan).join(" ")) : "Tu as trouvé la suite complète.") + "</div>";
    if (P.elo) h += '<div class="row">' + eloChip(P.elo) + '<span class="small muted">problème coté ' + P.elo.opp + "</span></div>";
    if (P.wpg) h += '<div class="row"><span class="chip ' + (P.wpg.g >= 4 ? "good" : "bad") + '">Note ' + WP_GRADES[P.wpg.g] + '</span><span class="small muted">' + Math.round(P.wpg.t / 1000) + " s · " + P.wpg.m + " erreur" + (P.wpg.m > 1 ? "s" : "") + "</span></div>";
    h += '<div class="card"><span class="label">Pourquoi ça marche</span><p>' + esc(pz.why) + "</p></div>";
    h += '<div class="row">' + (pzFollow(P) ? '<button class="btn primary" data-act="pznext2" data-id="' + pz.id + '">' + (P.mode === "daily" ? "Suite du défi" : "Problème suivant") + "</button>" : P.mode === "daily" ? '<span class="chip good">Défi du jour terminé</span>' : P.mode === "wp" ? '<button class="btn primary" data-act="wpres">Voir le résultat du passage</button>' : P.mode === "surprise" ? '<button class="btn primary" data-act="xnew2">Autre position surprise</button>' : "") +
      (pz.line && LINE_BY_ID[pz.line] ? '<button class="btn" data-act="learn" data-id="' + pz.line + '">Étudier la ligne</button>' : "") + '' + (P.mode === "wp" ? "" : '<button class="btn" data-act="pzretry">Rejouer</button>') + "</div>";
    h += aiBoxHTML("p:" + pz.id);
  }
  return h + "</div></div>";
}
function puzSquare(sq) {
  if (!P || P.stage !== "play" || P.lock) return;
  const g = P.g, p = g.get(sq), me = new Chess(P.pz.fen).turn();
  if (P.sel && P.tg.indexOf(sq) >= 0) { puzAttempt(P.sel, sq); return; }
  if (p && p.color === me && g.turn() === me) { P.sel = sq; P.tg = g.moves({ square: sq, verbose: true }).map((m) => m.to); } else { P.sel = null; P.tg = []; }
  renderMain();
}
function puzAttempt(from, to) {
  const g = P.g, exp = P.pz.sol[P.k], mv = g.move({ from, to, promotion: "q" });
  if (!mv) return;
  P.sel = null; P.tg = [];
  const ok = norm(mv.san) === norm(exp) || (/#$/.test(exp) && g.in_checkmate());
  sfx(ok ? "move" : "bad");
  if (!ok && P.rush) { g.undo(); rushWrong(); return; }
  if (!ok) {
    g.undo(); P.errs++; P.wrong++; P.msg = "Ce n'est pas le meilleur coup. Réessaie.";
    if (P.wrong >= 3) { const em = new Chess(g.fen()).move(exp); if (em) P.hint = em.from; }
    renderMain(); return;
  }
  P.msg = ""; P.wrong = 0; P.hint = null; P.last = [mv.from, mv.to]; P.k++;
  if (P.k >= P.pz.sol.length) { if (P.rush) rushRight(); else puzFinish(false); return; }
  P.lock = true; renderMain();
  setTimeout(() => {
    if (!P) return;
    P.g.move(P.pz.sol[P.k]); P.last = lastMoveOf(P.g); P.k++; P.lock = false;
    if (P.k >= P.pz.sol.length) { if (P.rush) rushRight(); else puzFinish(false); } else renderMain();
  }, 450);
}
function puzFinish(shown) {
  P.stage = "done"; P.shown = shown; P.sel = null; P.tg = [];
  const r = S.pz[P.id] || (S.pz[P.id] = { ok: 0, errs: 0, tries: 0, last: "" });
  const first = r.tries === 0 && !r.rated;
  r.tries++; r.last = todayStr(); r.errs += P.errs;
  P.elo = first ? eloPuzzle(P.pz, P.errs, shown, P.hinted) : null; if (first) { r.rated = 1; r.f = (!shown && P.errs === 0 && !P.hinted) ? 1 : 0; }
  if (P.mode === "daily" && !shown) dailyMark(P.id);
  if (P.mode === "wp") wpRecord(P, shown);
  if (!shown) r.ok = 1;
  logDay((l) => { l.p++; l.pe += P.errs + (shown ? 1 : 0); const th = P.pz.th; l.t[th] = (l.t[th] || 0) + P.errs + (shown ? 1 : 0); });
  sfx(shown || P.errs ? "ok" : "done");
  save(); renderMain();
  /* Pic-vert : dès que le problème est résolu sans aide, on enchaîne sur le suivant */
  if (P.mode === "wp" && !shown && pzFollow(P)) { const pid = P.id; setTimeout(() => { if (P && P.id === pid && P.stage === "done" && !P.shown && pzFollow(P)) { const n = pzFollow(P), o = { mode: P.mode, theme: P.theme, sid: P.sid, mt: P.mt }; V.stack.pop(); puzOpen(n, o); } }, 1200); }
}
function puzShow() {
  const g = new Chess(P.pz.fen); P.pz.sol.forEach((s) => g.move(s));
  P.g = g; P.last = lastMoveOf(g); V.sifor = "pz:" + P.id; V.si = 1; puzFinish(true);
}
/* « Voir la solution » : la solution se rejoue depuis la position de départ, en commençant par le premier coup cherché */
function pzShownHTML(pz, me) {
  if (!pz._sill) {
    const notes = {}; notes[0] = "Position de départ : " + (me === "w" ? "les Blancs" : "les Noirs") + " jouent. " + (pz.goal || "");
    if (pz.why) notes[pz.sol.length] = pz.why;
    pz._sill = { kind: "pos", title: "La solution, coup par coup", sub: "Le premier coup cherché est joué ; avance ou recule avec les flèches.", fen: pz.fen, sans: pz.sol, from: 1, orient: me, notes };
  }
  if (V.sifor !== "pz:" + P.id) { V.sifor = "pz:" + P.id; V.si = 1; }
  return stIllHTML(pz._sill);
}
function puzHint() { P.hinted = true; const em = new Chess(P.g.fen()).move(P.pz.sol[P.k]); if (em) { P.hint = em.from; renderMain(); } }

function rushBarHTML() {
  const left = Math.max(0, RU.end - Date.now());
  return '<div class="card" style="padding:10px 14px"><div class="row between"><span class="chip">Score <b id="rushscore">' + RU.score + '</b></span><b id="rushclock" style="font-size:1.4rem">' + fmtClock(left) + '</b><span class="chip ' + (RU.strikes ? "bad" : "") + '">' + "✕".repeat(RU.strikes) + "○".repeat(3 - RU.strikes) + '</span><button class="btn small" data-act="rushquit">Arrêter</button></div><div class="bar" style="margin-top:8px"><i id="rushbar" style="width:' + (100 * left / RUSH_MS) + '%"></i></div></div>';
}

/* Problèmes de plans : un exemple résolu du même thème, expliqué coup par coup, avant d'essayer */
function pzExFor(pz) {
  if (!pz._ex) { const l = allPz().filter((p) => !!p.pos === !!pz.pos && p.th === pz.th && p.id !== pz.id && p.sol && p.sol.length && p.sol.length <= 6 && p.why).sort((a, b) => (a.r || 0) - (b.r || 0)); pz._ex = l.length ? l[Math.floor(l.length / 4)] : false; }
  return pz._ex || null;
}
function pzExOpen(id) {
  const pz = allPz().find((p) => p.id === id), ex = pz && pzExFor(pz); if (!ex) return;
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "pzex"; V.pzid = id; V.sifor = null; V.si = 0; render(); window.scrollTo(0, 0);
}
function pzExHTML() {
  const pz = allPz().find((p) => p.id === V.pzid), ex = pz && pzExFor(pz); if (!ex) return backBtn("Retour");
  if (!ex._ill) {
    const me = new Chess(ex.fen).turn(), notes = {};
    notes[0] = "Exemple résolu du thème « " + ex.th + " ». " + (me === "w" ? "Les Blancs" : "Les Noirs") + " jouent. Objectif : " + ex.goal;
    notes[ex.sol.length] = ex.why;
    ex._ill = { kind: "pos", title: "Exemple : " + ex.th, sub: "Un autre problème du même thème, avec sa solution expliquée", fen: ex.fen, sans: ex.sol, from: 0, orient: me, notes };
  }
  let h = backBtn("Retour") + '<div class="hdr"><h1>Exemple : ' + esc(pz.th) + '</h1><p class="muted">Regarde d\'abord comment on raisonne sur un problème de ce thème, puis reviens essayer le tien.</p></div><div class="stack" style="gap:16px">' + stIllHTML(ex._ill);
  h += '<div class="card"><span class="label">Pourquoi ça marche</span><p>' + esc(ex.why) + "</p></div>";
  h += '<div class="row"><button class="btn primary" data-act="back">À toi d\'essayer</button></div></div>';
  return h;
}
