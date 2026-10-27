/* ===== Journal, sons, erreurs de parties, position surprise, bilan ===== */
function logDay(f) {
  const t = todayStr(), l = S.log[t] || (S.log[t] = { l: 0, e: 0, p: 0, pe: 0, h: 0, x: 0, o: {}, t: {} });
  f(l);
  const ks = Object.keys(S.log).sort();
  while (ks.length > 70) delete S.log[ks.shift()];
}
function sfx(k) {
  if (S.sound === 0) return;
  try {
    const seq = { ok: [[660, 0, 0.09], [880, 0.09, 0.14]], bad: [[200, 0, 0.2]], move: [[420, 0, 0.04]], done: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.22]] }[k];
    if (!seq) return;
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime;
    seq.forEach((n) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "sine"; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.1, t + n[1] + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + n[2]);
      o.connect(g); g.connect(AC.destination); o.start(t + n[1]); o.stop(t + n[1] + n[2] + 0.03);
    });
    if (navigator.vibrate) navigator.vibrate(k === "bad" ? 60 : k === "ok" || k === "done" ? 20 : 0);
  } catch (e) { /* son indisponible */ }
}
function allPz() { return PUZZLES.concat(S.mypz || []); }
function guessOp(color, first) {
  if (color === "w") return first === "e4" ? "ita" : first === "f4" ? "bir" : first === "c4" ? "eng" : "lon";
  return first === "e4" ? "pir" : first === "d4" ? "dut" : "pir";
}

/* ---------- Erreurs de tes parties -> problèmes ---------- */
function uciOf(fen, san) { const m = new Chess(fen).move(san, { sloppy: true }); return m ? m.from + m.to + (m.promotion || "") : null; }
function pzVal(r, sign) { return sign * (r.t === "mate" ? (r.v > 0 ? 1 : -1) * (10000 - Math.abs(r.v)) : r.v); }
function cpTxt(v) { return Math.abs(v) > 5000 ? "mat" : (v > 0 ? "+" : v < 0 ? "−" : "") + (Math.abs(v) / 100).toFixed(1).replace(".", ","); }
let SCAN_MIN = 6;
function scanHTML() {
  const sc = V.scan || {}, n = (S.mypz || []).length;
  let h = '<span class="label">Tes erreurs tactiques</span>';
  h += '<p class="muted">Stockfish (dans ton navigateur) regarde tes dernières parties, repère les coups où il existait une réponse nettement meilleure, et en fait des problèmes dans l\'onglet Tactiques. Compte quelques minutes.</p>';
  if (sc.busy) h += '<div class="bar"><i style="width:' + Math.round(100 * (sc.done || 0) / Math.max(1, sc.total || 1)) + '%"></i></div><p class="small muted" id="scanmsg">' + esc(sc.msg || "") + '</p><div class="row"><button class="btn" data-act="scanstop">Arrêter</button></div>';
  else {
    if (sc.msg) h += '<p class="small">' + esc(sc.msg) + "</p>";
    h += '<div class="row"><button class="btn primary" data-act="scan">' + (n ? "Chercher encore" : "Chercher mes erreurs") + "</button>" + (n ? '<button class="btn" data-act="tab" data-v="puz">Voir mes ' + n + " problèmes</button>" : "") + "</div>";
  }
  return h + mCausesHTML();
}
function paintScan() { const el = $("#scanbox"); if (el) el.innerHTML = scanHTML(); }
async function scanMistakes() {
  const r = V.gres; if (!r || (V.scan && V.scan.busy)) return;
  V.scan = { busy: true, stop: false, done: 0, total: 1, msg: "Chargement du moteur…" }; paintScan();
  const ready = await engInit();
  if (!ready) { V.scan = { busy: false, msg: "Le moteur n'a pas pu se charger (" + ENG.err + "). Réessaie plus tard." }; paintScan(); return; }
  const jobs = [];
  r.games.slice(0, 12).forEach((x) => {
    if (!x.moves) return;
    const g = new Chess(); let c = 0;
    for (let i = 0; i < Math.min(x.moves.length, 46); i++) {
      const mover = i % 2 === 0 ? "w" : "b";
      if (mover === x.color && i >= Math.max(SCAN_MIN, x.inBook) && c < 18) { jobs.push({ x, i, fen: g.fen(), san: x.moves[i] }); c++; }
      if (!g.move(x.moves[i])) break;
    }
  });
  jobs.splice(240);
  V.scan.total = jobs.length; let found = 0;
  for (let k = 0; k < jobs.length; k++) {
    if (V.scan.stop) break;
    const j = jobs[k], sign = j.x.color === "w" ? 1 : -1;
    V.scan.done = k; V.scan.msg = "Position " + (k + 1) + " sur " + jobs.length + " · " + found + " erreur(s) trouvée(s)"; paintScan();
    try {
      const res = await engAnalyse(j.fen, 10, 1500);
      if (!res.length) continue;
      const pu = uciOf(j.fen, j.san); if (!pu || res[0].pv[0] === pu) continue;
      const bestV = pzVal(res[0], sign);
      let playedV, r2 = null; const inTop = res.find((q) => q.pv[0] === pu);
      if (inTop) playedV = pzVal(inTop, sign);
      else { const g2 = new Chess(j.fen); g2.move(j.san, { sloppy: true }); r2 = await engAnalyse(g2.fen(), 9, 1200); if (!r2.length) continue; playedV = pzVal(r2[0], sign); }
      const loss = bestV - playedV;
      if (loss < 220 || bestV < -80 || (bestV > 900 && playedV > 600)) continue;
      if (res[1] && bestV - pzVal(res[1], sign) < 120) continue;
      if (!r2) { try { const g2b = new Chess(j.fen); g2b.move(j.san, { sloppy: true }); r2 = await engAnalyse(g2b.fen(), 9, 1000); } catch (e) { r2 = []; } }
      const cause = classifyMistake(j.fen, j.san, res, r2, sign);
      const g3 = new Chess(j.fen), sol = [], isMate = res[0].t === "mate";
      for (const u of res[0].pv.slice(0, isMate ? 7 : 1)) { const m = g3.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (!m) break; sol.push(m.san); }
      if (!sol.length) continue;
      if (sol.length % 2 === 0) sol.pop();
      const key = j.fen.split(" ").slice(0, 4).join(" ");
      if (S.mypz.some((p) => p.key === key)) continue;
      const n = Math.floor(j.i / 2) + 1, first = j.x.moves[0], op = guessOp(j.x.color, first);
      S.mypz.push({
        id: "m" + Date.now().toString(36) + k, key, mine: true, op, th: "Ton erreur", cause, t: "Ta partie · coup " + n, fen: j.fen, sol,
        goal: "Dans ta partie contre " + (j.x.opp || "un adversaire") + " (coup " + n + "), tu as joué " + dispSan(j.san) + ". Trouve le coup que le moteur préfère.",
        why: "Le moteur préfère " + dispSan(sol[0]) + " (" + cpTxt(bestV) + " pour toi). Ton coup " + dispSan(j.san) + " ramène l'évaluation à " + cpTxt(playedV) + ". Cause probable : " + M_CAUSES[cause].t.toLowerCase() + ". " + M_CAUSES[cause].adv
      });
      found++;
      if (!S.causes) S.causes = {};
      S.causes[cause] = (S.causes[cause] || 0) + 1;
      if (S.mypz.length > 40) S.mypz.shift();
      save();
    } catch (e) { /* position ignorée */ }
  }
  V.scan = { busy: false, msg: found ? found + " nouveau(x) problème(s) ajouté(s) à l'onglet S'entraîner." : "Aucune erreur nette trouvée dans ces parties." };
  paintScan();
}

/* Cause probable de l'erreur (estimation à partir de la réfutation et du meilleur coup). */
function classifyMistake(fen, san, res, r2, sign) {
  try {
    const g = new Chess(fen), me = g.turn(), mv = g.move(san, { sloppy: true }); if (!mv) return "decision";
    const before = mThreats(fen, me), ref = r2 && r2[0];
    if (ref && ref.pv && ref.pv[0]) {
      const mateAgainst = ref.t === "mate" && pzVal(ref, sign) < 0;
      if (mateAgainst) return Math.abs(ref.v) <= 2 ? "menace" : "calcul";
      const u = ref.pv[0], m2 = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      if (m2 && m2.captured) {
        const victim = m2.to === mv.to ? mv.from : (m2.flags.indexOf("e") >= 0 ? m2.to[0] + m2.from[1] : m2.to);
        if (m2.to === mv.to || (before && before[victim])) return "menace";
        return "defenseur";
      }
      if (m2 && /[+#]/.test(m2.san)) return "menace";
    }
    const best = res[0], bu = best.pv[0], bm = new Chess(fen).move({ from: bu.slice(0, 2), to: bu.slice(2, 4), promotion: bu[4] });
    if (best.t === "mate") return Math.abs(best.v) <= 2 ? "motif" : "calcul";
    if (bm && (bm.captured || /[+#]/.test(bm.san))) return "motif";
    return best.pv.length >= 4 ? "calcul" : "decision";
  } catch (e) { return "decision"; }
}

/* ---------- Préparer une sortie adverse ---------- */
async function prepareLine(i) {
  const e = (V.prepList || [])[i]; if (!e) return;
  const d = e.d, g = new Chess(d.fen), mv = g.move(d.move, { sloppy: true }); if (!mv) return;
  const hist = (d.hist || []).slice(), op = guessOp(e.color, hist[0]);
  let pv = [], info = "";
  const b = $("#prep" + i); if (b) { b.disabled = true; b.textContent = "Analyse…"; }
  try {
    if (await engInit()) {
      const res = await engAnalyse(g.fen(), 13, 3500);
      if (res[0]) {
        const sign = e.color === "w" ? 1 : -1, gg = new Chess(g.fen());
        for (const u of res[0].pv.slice(0, 5)) { const m = gg.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (!m) break; pv.push(m.san); }
        info = "Réponse proposée par Stockfish (profondeur " + res[0].d + ") : évaluation " + cpTxt(pzVal(res[0], sign)) + " pour toi.";
      }
    }
  } catch (err) { /* sans moteur : on garde l'historique */ }
  edOpen(op);
  E.name = "À préparer : " + plyLabel(d.ply) + dispSan(d.move);
  E.sans = hist.concat(pv); E.notes = {};
  E.notes[hist.length - 1] = "Coup adverse rencontré " + e.n + " fois dans tes parties. Cette ligne n'est pas dans ton répertoire.";
  if (pv.length) E.notes[hist.length] = info;
  E.idx = E.sans.length; edRebuild(); E.last = lastMoveOf(E.g);
  E.msg = pv.length ? "Ligne préparée avec le moteur : relis-la, ajoute tes commentaires, puis enregistre." : "Historique repris jusqu'au coup adverse. Joue ta réponse sur l'échiquier, puis enregistre.";
  render();
}

/* ---------- Position surprise ---------- */
function xWeight(L) {
  const t = todayStr(), b = boxOf(L.id);
  return 1 + (6 - Math.min(6, b)) + (isDue(L.id, t) ? 4 : 0);
}
function xPlanPick() {
  const pos = allPz().filter((p) => p.pos); if (!pos.length) return null;
  const todo = pos.filter((p) => !pzDone(p.id)), src = todo.length ? todo : pos;
  return src[Math.floor(Math.random() * src.length)];
}
function xNew() {
  /* Une position sur trois vient d'un problème de plan (milieu de jeu) ; le reste vient de tes lignes vues, les plus faibles ou à réviser d'abord. */
  if (Math.random() < 0.33) { const pp = xPlanPick(); if (pp) { X = null; if (V.view === "surprise") { const q = V.stack.pop(); if (q) { V.view = q.view; V.sid = q.sid; V.opId = q.opId; } } puzOpen(pp.id, { mode: "surprise" }); return; } }
  const books = { w: buildBook("w"), b: buildBook("b") };
  let pool = [];
  LINES.forEach((L) => {
    if (L.trap === "avoid") return;
    const side = OP_BY_ID[L.op].side;
    for (let i = 4; i < L.sans.length; i++) if ((i % 2 === 0) === (side === "w")) pool.push([L, i, side]);
  });
  const seen = pool.filter((p) => isSeen(p[0].id)); if (seen.length) pool = seen;
  const hardP = hardList(); let pick;
  if (hardP.length && Math.random() < 0.3) { const h = hardP[Math.floor(Math.random() * hardP.length)]; pick = pool.find((p) => p[0].id === h.id && p[1] === h.i); }
  if (!pick) {
    const ws = pool.map((p) => xWeight(p[0])), tot = ws.reduce((x, y) => x + y, 0); let r = Math.random() * tot;
    for (let k = 0; k < pool.length; k++) { r -= ws[k]; if (r <= 0) { pick = pool[k]; break; } }
    if (!pick) pick = pool[pool.length - 1];
  }
  const L = pick[0], i = pick[1], side = pick[2], g = new Chess();
  for (let k = 0; k < i; k++) g.move(L.sans[k]);
  const e = books[side].get(posKey(g)), acc = e ? Array.from(e.moves.keys()) : [norm(L.sans[i])];
  const ids = []; if (e) e.moves.forEach((s) => s.forEach((x) => { if (ids.indexOf(x) < 0) ids.push(x); })); if (ids.indexOf(L.id) < 0) ids.push(L.id);
  X = { L, i, side, g, acc, ids, errs: 0, stage: "play", ok: false, sel: null, tg: [], last: lastMoveOf(g), hint: null, msg: "", info: false, marked: false };
  if (V.view !== "surprise") V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = "surprise"; render(); window.scrollTo(0, 0);
}
function xSquare(sq) {
  if (!X || X.stage !== "play") return;
  const g = X.g, p = g.get(sq);
  if (X.sel && X.tg.indexOf(sq) >= 0) { xAttempt(X.sel, sq); return; }
  if (p && p.color === X.side && g.turn() === X.side) { X.sel = sq; X.tg = g.moves({ square: sq, verbose: true }).map((m) => m.to); } else { X.sel = null; X.tg = []; }
  renderMain();
}
function xAttempt(from, to) {
  const g = X.g, mv = g.move({ from, to, promotion: "q" }); if (!mv) return;
  X.sel = null; X.tg = [];
  if (X.acc.indexOf(norm(mv.san)) >= 0) {
    X.stage = "done"; X.ok = true; X.last = [mv.from, mv.to]; X.played = mv.san;
    if (!X.errs && !X.hint) hardOk(X.L.id, X.i);
    logDay((l) => { l.x++; l.e += X.errs; });
    sfx(X.errs ? "ok" : "done"); save(); renderMain(); return;
  }
  g.undo(); X.errs++; sfx("bad");
  if (!X.marked) { X.marked = true; markHard(X.L.id, X.i); }
  if (X.errs >= 2) { xReveal(); return; }
  X.msg = "Ce n'est pas un coup de ton répertoire pour cette position. Réessaie, ou demande un indice.";
  renderMain();
}
function xReveal() {
  if (!X) return;
  if (!X.marked) { X.marked = true; markHard(X.L.id, X.i); }
  const m = X.g.move(X.L.sans[X.i]); X.played = m && m.san; X.last = m ? [m.from, m.to] : null;
  X.stage = "done"; X.ok = false; logDay((l) => { l.x++; l.e += 1; }); save(); renderMain();
}
function surpriseHTML() {
  if (!X) return backBtn() + '<p class="muted">Aucune position.</p>';
  const op = OP_BY_ID[X.L.op], n = Math.floor(X.i / 2) + 1;
  let h = backBtn("Retour") + '<div class="hdr"><div class="row"><span class="chip acc">Position surprise</span>' + sideChip(X.side) + (X.stage === "done" || X.info ? '<span class="chip k" data-k="' + op.k + '">' + esc(op.short) + "</span>" : "") + "</div><h1>" + (X.stage === "done" ? esc(X.L.name) : "Quel est ton coup ?") + "</h1></div>";
  h += '<div class="trainer"><div class="stack">' + boardHTML(X.g, { orient: X.side, sel: X.sel, tg: X.tg, last: X.last || [], hint: X.hint, live: X.stage === "play" }) + "</div>";
  h += '<div class="stack" style="gap:12px">';
  if (X.stage === "play") {
    h += '<div class="note"><b>' + (X.side === "w" ? "Les Blancs" : "Les Noirs") + " (toi) jouent le coup " + n + ".</b> Tu ne sais pas de quelle ligne vient cette position : retrouve le bon coup de ton répertoire.</div>";
    if (X.msg) h += '<div class="note bad">' + esc(X.msg) + "</div>";
    h += '<div class="row"><button class="btn" data-act="xhint"' + (X.info ? " disabled" : "") + '>Indice</button><button class="btn" data-act="xshow">Je ne sais pas</button><span class="chip ' + (X.errs ? "bad" : "good") + '">' + X.errs + " erreur" + (X.errs > 1 ? "s" : "") + "</span></div>";
    if (X.info) h += '<div class="note warn">Indice : cette position vient de ton répertoire <b>' + esc(op.short) + "</b>, chapitre « " + esc((chapOf(X.L) || {}).t || "") + " ».</div>";
  } else {
    h += '<div class="note ' + (X.ok ? "good" : "warn") + '"><b>' + (X.ok ? (X.errs ? "Trouvé." : "Bien joué.") : "Le coup du répertoire : ") + "</b> " + (X.ok ? "" : esc(dispSan(X.played || "")) + ". Cette position reviendra dans tes coups difficiles.") + "</div>";
    h += '<div class="card"><span class="label">Cette position vient de</span><ul class="list">' + X.ids.slice(0, 4).map((id) => '<li class="small">' + esc(OP_BY_ID[LINE_BY_ID[id].op].short) + " · " + esc(LINE_BY_ID[id].name) + "</li>").join("") + '</ul></div>';
    h += '<div class="row"><button class="btn primary" data-act="xnew">Autre position</button><button class="btn" data-act="struct" data-id="' + X.L.struct + '">Voir le plan</button><button class="btn" data-act="learn" data-id="' + X.L.id + '">Étudier la ligne</button></div>';
  }
  return h + "</div></div>";
}

/* ---------- Bilan de la semaine ---------- */
function weeklyHTML() {
  const t = todayStr(), days = [];
  for (let k = 13; k >= 0; k--) days.push(addDays(t, -k));
  const get = (d) => S.log[d] || { l: 0, e: 0, p: 0, pe: 0, h: 0, x: 0, m: 0, o: {}, t: {} };
  const sum = (arr) => arr.reduce((a, d) => { const l = get(d); a.l += l.l; a.e += l.e; a.p += l.p; a.pe += l.pe; a.h += l.h || 0; a.x += l.x || 0; a.m += l.m || 0; Object.keys(l.o).forEach((k) => { a.o[k] = (a.o[k] || 0) + l.o[k]; }); Object.keys(l.t).forEach((k) => { a.t[k] = (a.t[k] || 0) + l.t[k]; }); return a; }, { l: 0, e: 0, p: 0, pe: 0, h: 0, x: 0, m: 0, o: {}, t: {} });
  const w = sum(days.slice(7)), pw = sum(days.slice(0, 7));
  const act = (d) => { const l = get(d); return l.l + l.p + (l.h || 0) + (l.x || 0) + (l.m || 0); };
  const mx = Math.max(1, ...days.slice(7).map(act));
  const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a])[0];
  const arrow = (a, b, goodUp) => a === b ? "=" : (a > b) === goodUp ? "▲" : "▼";
  let h = '<section class="card"><span class="label">Bilan des 7 derniers jours</span>';
  if (!(w.l + w.p + w.h + w.x + w.m)) return h + '<p class="muted">Rien encore cette semaine. Fais ta séance du jour pour voir apparaître ton bilan.</p></section>';
  h += '<div class="wkbars" role="img" aria-label="Activité par jour">' + days.slice(7).map((d) => '<span class="wkb"><i style="height:' + Math.round(8 + 52 * act(d) / mx) + 'px"' + (act(d) ? "" : ' class="z"') + "></i><small>" + "DLMMJVS"[parseD(d).getDay()] + "</small></span>").join("") + "</div>";
  h += '<div class="wkstats"><div class="stat" data-k="blue"><span class="label">Exercices</span><b>' + (w.l + w.h + w.x + w.m) + '</b><span class="small muted">' + arrow(w.l + w.h + w.x + w.m, pw.l + pw.h + pw.x + pw.m, true) + " vs " + (pw.l + pw.h + pw.x + pw.m) + '</span></div>' +
    '<div class="stat" data-k="red"><span class="label">Erreurs</span><b>' + w.e + '</b><span class="small muted">' + arrow(w.e, pw.e, false) + " vs " + pw.e + '</span></div>' +
    '<div class="stat" data-k="amber"><span class="label">Problèmes</span><b>' + w.p + '</b><span class="small muted">' + (w.p ? Math.round(100 * Math.max(0, w.p - w.pe) / w.p) + " % sans erreur" : "aucun") + "</span></div></div>";
  const wk = top(w.o), th = top(w.t);
  const notes = [];
  if (wk && w.o[wk] > 0) notes.push("Ouverture la plus fragile : <b>" + esc(OP_BY_ID[wk].short) + "</b> (" + w.o[wk] + " erreur" + (w.o[wk] > 1 ? "s" : "") + ").");
  if (th && w.t[th] > 0) notes.push("Thème tactique le plus raté : <b>" + esc(th) + "</b>.");
  const hl = hardList().length; if (hl) notes.push(hl + " coup" + (hl > 1 ? "s" : "") + " difficile" + (hl > 1 ? "s" : "") + " à revoir.");
  h += notes.length ? '<ul class="list">' + notes.map((n) => '<li class="small">' + n + "</li>").join("") + "</ul>" : '<p class="muted">Pas d\'erreur marquante cette semaine.</p>';
  return h + "</section>";
}
function soundCardHTML() {
  return '<section class="card"><div class="row between"><div class="stack"><span class="label">Sons et vibrations</span><span class="small muted">Petits sons sur les coups, les erreurs et la fin d\'une ligne.</span></div><button class="btn" data-act="sndtoggle" aria-pressed="' + (S.sound !== 0) + '">' + (S.sound === 0 ? "Désactivés" : "Activés") + "</button></div></section>";
}

function themeApply() { try { const r = document.documentElement, t = S.theme; if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t === "dark" ? "dark" : "light"); } catch (e) {} }
function themeCardHTML() {
  const t = S.theme === "auto" || S.theme === "dark" ? S.theme : "light";
  return '<section class="card"><div class="row between"><div class="stack"><span class="label">Apparence</span><span class="small muted">Mode clair, mode sombre, ou celui de ton appareil.</span></div><div class="seg" role="group" aria-label="Apparence">' + [["auto", "Auto"], ["light", "Clair"], ["dark", "Sombre"]].map((c) => '<button data-act="theme" data-v="' + c[0] + '" aria-pressed="' + (t === c[0]) + '"' + (t === c[0] ? ' class="on"' : "") + ">" + c[1] + "</button>").join("") + "</div></div></section>";
}
themeApply();
