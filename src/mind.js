/* ===== Menaces et calcul : contrôle des menaces, visualisation, calcul long ===== */
var M = null, M_T = null;
var M_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
var M_ART = { k: ["le roi", 1], q: ["la dame", 0], r: ["la tour", 0], b: ["le fou", 1], n: ["le cavalier", 1], p: ["le pion", 1] };
var M_BLANK = "8/8/8/8/8/8/8/8 w - - 0 1";
function mName(p) { var a = M_ART[p.type]; return a[0] + " " + (p.color === "w" ? (a[1] ? "blanc" : "blanche") : (a[1] ? "noir" : "noire")); }
function mCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function mSide(c) { return c === "w" ? "Blancs" : "Noirs"; }
function mRand(n) { return Math.floor(Math.random() * n); }
function mShuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = mRand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function mStats(k) { if (!S.mind) S.mind = {}; return S.mind[k] || (S.mind[k] = { n: 0, ok: 0, r: [], lvl: 0 }); }
function mAcc(k) { var s = S.mind && S.mind[k]; if (!s || !s.r || s.r.length < 4) return null; return s.r.reduce(function (a, b) { return a + b; }, 0) / s.r.length; }
function mRecord(k, ok) {
  var s = mStats(k); s.n++; if (ok) s.ok++; s.r.push(ok ? 1 : 0); if (s.r.length > 20) s.r.shift();
  if (k === "mem") s.lvl = Math.max(0, Math.min(4, (s.lvl || 0) + (ok ? 1 : -1)));
  logDay(function (l) { l.m = (l.m || 0) + 1; });
  save(); sfx(ok ? "ok" : "bad");
}
var M_DRILLS = [
  { k: "thr", ic: "◉", c: "red", t: "Quelles pièces sont menacées ?", d: "Repère toutes les pièces que l'adversaire peut prendre avec profit.", grp: 0 },
  { k: "hang", ic: "⚠", c: "amber", t: "Ce coup est-il sûr ?", d: "Un coup tentant : laisse-t-il une pièce en prise ? Attention aux défenseurs déplacés.", grp: 0 },
  { k: "cct", ic: "✓", c: "blue", t: "Échecs et prises", d: "Compte vite les échecs ou les prises possibles : le réflexe qui évite de rater un coup forçant.", grp: 0 },
  { k: "blind", ic: "◐", c: "violet", t: "Puzzle à l'aveugle", d: "Retiens la position 20 secondes : les pièces disparaissent, puis résous le puzzle de tête.", grp: 1 },
  { k: "mem", ic: "▦", c: "teal", t: "Mémoire du plateau", d: "Observe quelques secondes, puis retrouve les cases de tes pièces sur un plateau vide.", grp: 1 },
  { k: "long", ic: "∞", c: "green", t: "Calcul long", d: "Calcule une longue combinaison sans toucher le plateau, puis choisis le premier coup.", grp: 1 }
];
var M_CAUSES = {
  menace: { t: "Menace adverse non vue", adv: "Avant chaque coup, demande-toi ce que l'adversaire menace (échecs, prises, menaces).", drill: "thr", chap: "def" },
  defenseur: { t: "Pièce laissée sans défense", adv: "Avant de déplacer une pièce, vérifie ce qu'elle protégeait et si elle arrive sur une case attaquée.", drill: "hang", chap: "def" },
  motif: { t: "Motif tactique raté", adv: "Regarde d'abord les échecs et les prises : le coup gagnant en fait presque toujours partie.", drill: "cct", chap: "att" },
  calcul: { t: "Calcul trop court", adv: "Pousse la ligne jusqu'à une position calme avant de te décider.", drill: "long" },
  decision: { t: "Décision ou plan", adv: "Ce n'est pas un coup tactique : revois les plans de milieu de jeu et les concepts de stratégie.", drill: null }
};

/* ---------- Moteur de menaces (sans Stockfish) ---------- */
function mFlipFen(fen, turn) { var f = fen.split(" "); f[1] = turn; f[3] = "-"; return f.join(" "); }
/* Pièces de la couleur « victim » que l'adversaire peut prendre avec profit (échange simple). */
function mThreats(fen, victim) {
  var f = mFlipFen(fen, victim === "w" ? "b" : "w");
  var g = new Chess(f); if (g.fen().split(" ")[0] !== f.split(" ")[0]) return null;
  var out = {};
  g.moves({ verbose: true }).forEach(function (m) {
    if (!m.captured || m.captured === "k") return;
    var sq = m.flags.indexOf("e") >= 0 ? m.to[0] + m.from[1] : m.to;
    g.move(m.san);
    var rec = g.moves({ verbose: true }).some(function (x) { return x.to === m.to; });
    g.undo();
    var net = M_VAL[m.captured] - (rec ? M_VAL[m.piece] : 0);
    if (net > 0 && (!out[sq] || out[sq].net < net)) out[sq] = { net: net, san: m.san, free: !rec, piece: g.get(sq) };
  });
  return out;
}
function mFens() {
  if (M_FENS) return M_FENS;
  M_FENS = allPz().filter(function (p) { return p.fen; });
  return M_FENS;
}
var M_FENS = null;
function mPick(test) {
  var all = mFens(), last = null;
  for (var i = 0; i < 400; i++) {
    var p = all[mRand(all.length)], g = new Chess(p.fen);
    if (g.in_check() || g.game_over()) continue;
    var r = test(p, g); if (r) return r; last = null;
  }
  return last;
}

/* ---------- Création des exercices ---------- */
function mNew(k) {
  clearTimeout(M_T);
  var x = null;
  try { x = ({ thr: mNewThr, hang: mNewHang, cct: mNewCct, blind: mNewBlind, mem: mNewMem, long: mNewLong })[k](); } catch (e) { x = null; }
  M = x ? Object.assign({ k: k }, x) : { k: k, err: true };
  render(); window.scrollTo(0, 0); mMemTimer();
}
function mNewThr() {
  var wantNone = Math.random() < 0.25;
  return mPick(function (p, g) {
    var th = mThreats(p.fen, g.turn()); if (!th) return null;
    var n = Object.keys(th).length;
    if (wantNone ? n !== 0 : (n === 0 || n > 4)) return null;
    return { fen: p.fen, side: g.turn(), th: th, sel: [], stage: "ask" };
  });
}
function mNewHang() {
  var want = Math.random() < 0.5 ? "safe" : "bad";
  return mPick(function (p, g) {
    var side = g.turn(), before = mThreats(p.fen, side); if (!before) return null;
    var moves = mShuf(g.moves({ verbose: true })).slice(0, 14);
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      if (m.captured || m.piece === "k" || m.promotion || /[+#]/.test(m.san)) continue;
      var g2 = new Chess(p.fen); g2.move(m.san);
      var after = mThreats(g2.fen(), side); if (!after) continue;
      var mate = g2.moves({ verbose: true }).some(function (x) { g2.move(x.san); var c = g2.in_checkmate(); g2.undo(); return c; });
      if (mate) continue;
      var bk = {}; Object.keys(before).forEach(function (s) { bk[s === m.from ? m.to : s] = before[s]; });
      var fresh = Object.keys(after).filter(function (s) { return !bk[s]; });
      if (want === "safe" && fresh.length === 0 && Object.keys(after).length === 0) return { fen: p.fen, san: m.san, from: m.from, to: m.to, side: side, want: "safe", after: g2.fen(), stage: "ask" };
      if (want === "bad" && fresh.length) {
        var s = fresh.sort(function (a, b) { return after[b].net - after[a].net; })[0];
        if (after[s].net < 3) continue;
        return { fen: p.fen, san: m.san, from: m.from, to: m.to, side: side, want: "bad", after: g2.fen(), vic: s, info: after[s], self: s === m.to, stage: "ask" };
      }
    }
    return null;
  });
}
function mNewCct() {
  return mPick(function (p, g) {
    var mv = g.moves({ verbose: true }), kind = Math.random() < 0.5 ? "check" : "cap";
    var list = mv.filter(function (m) { return kind === "check" ? /[+#]/.test(m.san) : !!m.captured; });
    if (list.length > 9) return null;
    var c = list.length, opts = [c];
    [1, -1, 2, -2, 3].forEach(function (d) { if (c + d >= 0 && opts.length < 4 && opts.indexOf(c + d) < 0) opts.push(c + d); });
    return { fen: p.fen, side: g.turn(), kind: kind, c: c, list: list.map(function (m) { return dispSan(m.san); }), opts: opts.sort(function (a, b) { return a - b; }), stage: "ask" };
  });
}
function mLineText(fen, sans) {
  var f = fen.split(" "), num = Number(f[5]) || 1, turn = f[1], out = [];
  sans.forEach(function (s, i) { out.push((turn === "w" ? num + "." : (i === 0 ? num + "…" : "")) + dispSan(s)); if (turn === "b") num++; turn = turn === "w" ? "b" : "w"; });
  return out.join(" ");
}
function bfRating(p) {
  var n = p.fen.split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
  return Math.max(600, Math.min(2400, pzRating(p) + 6 * (n - 14) + 25 * (Math.ceil(p.sol.length / 2) - 2)));
}
function mNewBlind() {
  var all = mFens().filter(function (p) { return p.sol && p.sol.length >= 1 && p.sol.length <= 7 && !p.pos; }), tgt = eloS().b;
  for (var t = 0; t < 600; t++) {
    var p = all[mRand(all.length)]; if (Math.abs(bfRating(p) - tgt) > 120 + t / 2) continue;
    var g = new Chess(p.fen), mv = [], ok = true;
    p.sol.forEach(function (sn) { if (!ok) return; var m = g.move(sn, { sloppy: true }); if (!m) ok = false; else mv.push({ from: m.from, to: m.to, san: m.san }); });
    if (!ok || !mv.length) continue;
    return { pz: p, side: new Chess(p.fen).turn(), mv: mv, n: 0, g: new Chess(p.fen), sel: null, errs: 0, peeks: 0, bf: bfRating(p), secs: 20, stage: "look", i: 0, elo: null };
  }
  return null;
}
function mNewMem() {
  var K = [4, 6, 8, 10, 13][mStats("mem").lvl || 0], secs = [10, 10, 9, 8, 8][mStats("mem").lvl || 0];
  return mPick(function (p, g) {
    var b = g.board(), items = [];
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) if (b[r][f]) items.push({ sq: "abcdefgh"[f] + (8 - r), type: b[r][f].type, color: b[r][f].color });
    var kings = items.filter(function (i) { return i.type === "k"; }), rest = mShuf(items.filter(function (i) { return i.type !== "k"; }));
    if (kings.length !== 2 || rest.length < K - 2) return null;
    var keep = kings.concat(rest.slice(0, K - 2)), g2 = new Chess(M_BLANK);
    keep.forEach(function (i) { g2.put({ type: i.type, color: i.color }, i.sq); });
    var groups = {};
    keep.forEach(function (i) { if (i.type === "k") return; var key = i.color + i.type; (groups[key] = groups[key] || []).push(i.sq); });
    var gk = Object.keys(groups).filter(function (k) { return groups[k].length <= 3; }); if (!gk.length) return null;
    var key = gk[mRand(gk.length)];
    return { fen: g2.fen(), grp: { color: key[0], type: key[1] }, ans: groups[key], sel: [], secs: secs, stage: "look", seq: Date.now() };
  });
}
function mNewLong() {
  var pool = mFens().filter(function (p) { return p.sol && p.sol.length >= 5 && !p.pos; });
  if (!pool.length) return null;
  var p = pool[mRand(pool.length)], g = new Chess(p.fen), first = g.move(p.sol[0], { sloppy: true });
  if (!first) return null;
  g = new Chess(p.fen);
  var mv = g.moves({ verbose: true }), good = first.san;
  var others = mShuf(mv.filter(function (m) { return m.san !== good; })), pref = others.filter(function (m) { return m.captured || /[+#]/.test(m.san); });
  var picks = pref.slice(0, 3); others.forEach(function (m) { if (picks.length < 3 && picks.indexOf(m) < 0) picks.push(m); });
  var opts = mShuf([good].concat(picks.map(function (m) { return m.san; })));
  return { pz: p, side: g.turn(), opts: opts, good: good, stage: "calc", i: 0 };
}

/* ---------- Affichage ---------- */
function mBoard(g, o) { return '<div style="width:100%;max-width:440px;margin:0 auto">' + boardHTML(g, o) + "</div>"; }
function mRoutineHTML() {
  return '<section class="card" data-k="blue"><span class="label">La routine avant chaque coup</span><ol class="list" style="margin:8px 0 0 18px"><li>Que menace mon adversaire ? <span class="muted small">échecs, prises, menaces</span></li><li>Que fait mon coup, et que cesse de protéger ma pièce ?</li><li>Mon coup laisse-t-il une pièce en prise ?</li></ol></section>';
}
function mTopCause() {
  var c = S.causes || {}, ks = Object.keys(c).filter(function (k) { return M_CAUSES[k]; }).sort(function (a, b) { return c[b] - c[a]; });
  var tot = ks.reduce(function (a, k) { return a + c[k]; }, 0);
  return tot >= 3 && ks.length ? ks[0] : null;
}
function mindHTML() {
  if (M) return mDrillHTML();
  var rec = mTopCause(), recDrill = rec && M_CAUSES[rec].drill;
  var h = '<div class="hdr"><h1>Menaces et calcul</h1><p class="muted">La plupart des gaffes viennent d\'une menace non vue ou d\'un calcul trop court. Ces exercices travaillent ces deux réflexes.</p></div>' + mRoutineHTML();
  if (rec) h += '<section class="card"><span class="label">D\'après tes parties</span><p>Ton erreur la plus fréquente : <b>' + esc(M_CAUSES[rec].t) + "</b>. " + esc(M_CAUSES[rec].adv) + "</p></section>";
  ["Contrôle des menaces", "Calcul et visualisation"].forEach(function (gt, gi) {
    h += '<h2 class="sec">' + gt + "</h2>";
    M_DRILLS.filter(function (d) { return d.grp === gi; }).forEach(function (d) {
      var s = S.mind && S.mind[d.k], a = mAcc(d.k);
      var sub = esc(d.d) + (s && s.n ? " · " + s.n + " fait" + (s.n > 1 ? "s" : "") + (a != null ? ", " + Math.round(100 * a) + " % de réussite" : "") + (d.k === "blind" ? ", Élo " + eloS().b : "") + ((d.k === "mem") ? ", niveau " + ((s.lvl || 0) + 1) + "/5" : "") : "");
      h += lkHTML(d.ic, esc(d.t) + (recDrill === d.k ? ' <span class="chip good">Conseillé</span>' : ""), sub, 'data-act="m_start" data-dr="' + d.k + '"');
    });
  });
  return h;
}
function mHead(d) {
  return '<button class="btn small back" data-act="m_hub">← Menu</button><div class="hdr"><h1>' + esc(d.t) + "</h1></div>";
}
function mNextRow() { return '<div class="row"><button class="btn primary" data-act="m_next">Suivant</button><button class="btn" data-act="m_hub">Menu</button></div>'; }
function mDrillHTML() {
  var d = M_DRILLS.filter(function (x) { return x.k === M.k; })[0], h = mHead(d);
  if (M.err) return h + '<div class="note bad">Impossible de préparer cet exercice. <button class="btn small" data-act="m_next">Réessayer</button></div>';
  var fn = { thr: mThrHTML, hang: mHangHTML, cct: mCctHTML, blind: mBlindHTML, mem: mMemHTML, long: mLongHTML }[M.k];
  return h + (M_EX[M.k] ? '<div class="row"><button class="btn small" data-act="mexo" data-dr="' + M.k + '">Voir un exemple</button></div>' : "") + '<div class="trainer">' + fn() + "</div>";
}
function mThrHTML() {
  var g = new Chess(M.fen), n = Object.keys(M.th).length, done = M.stage === "done";
  var board = mBoard(g, { orient: M.side, live: !done, marks: done ? M.sel.filter(function (s) { return !M.th[s]; }) : M.sel, last: done ? Object.keys(M.th).filter(function (s) { return M.sel.indexOf(s) >= 0; }) : [], tg: done ? Object.keys(M.th).filter(function (s) { return M.sel.indexOf(s) < 0; }) : [] });
  var info = '<div class="stack" style="gap:12px"><div class="note"><b>Aux ' + mSide(M.side) + " de jouer.</b> Si l'adversaire jouait maintenant, quelles pièces " + (M.side === "w" ? "blanches" : "noires") + " pourrait-il prendre avec profit ? Touche-les, puis valide. Aucune menace : valide sans rien toucher.</div>";
  if (!done) return board + info + '<div class="row"><button class="btn primary" data-act="m_check">' + (M.sel.length ? "Valider (" + M.sel.length + ")" : "Aucune menace") + "</button></div></div>";
  var ok = M.ok;
  info += '<div class="note ' + (ok ? "good" : "bad") + '"><b>' + (ok ? "Bien vu." : "Pas tout à fait.") + "</b> " + (n ? "Pièces menacées :" : "Aucune pièce n'est menacée avec profit.") + "</div>";
  if (n) info += '<ul class="list">' + Object.keys(M.th).map(function (s) {
    var t = M.th[s]; return "<li class=\"small\"><b>" + mCap(mName(t.piece)) + " en " + s + "</b> : " + dispSan(t.san) + " — " + (t.free ? "elle n'est pas défendue." : "elle est défendue, mais l'échange est perdant.") + "</li>";
  }).join("") + "</ul>";
  return board + info + mNextRow() + "</div>";
}
function mHangHTML() {
  var done = M.stage === "done", g = new Chess(done ? M.after : M.fen);
  var board = mBoard(g, { orient: M.side, live: false, last: [M.from, M.to], tg: done && M.vic ? [M.vic] : [] });
  var info = '<div class="stack" style="gap:12px"><div class="note"><b>Aux ' + mSide(M.side) + " de jouer.</b> Tu envisages <b>" + dispSan(M.san) + "</b> (cases " + M.from + " et " + M.to + " surlignées). Après ce coup, l'adversaire peut-il prendre une pièce avec profit ?</div>";
  if (!done) return board + info + '<div class="row"><button class="btn" data-act="m_ans" data-v="safe">C\'est sûr</button><button class="btn" data-act="m_ans" data-v="bad">Ça laisse une pièce</button></div></div>';
  var ok = M.ans === M.want, why;
  if (M.want === "safe") why = "Après " + dispSan(M.san) + ", aucune de tes pièces ne peut être prise avec profit.";
  else why = M.self ? mCap(mName(M.info.piece)) + " arrive en " + M.to + ", où elle peut être prise : " + dispSan(M.info.san) + "." : mCap(mName(M.info.piece)) + " en " + M.vic + " devient prenable : " + dispSan(M.info.san) + ". Ton coup a déplacé un défenseur ou ouvert une ligne.";
  info += '<div class="note ' + (ok ? "good" : "bad") + '"><b>' + (ok ? "Exact." : "Raté.") + "</b> " + esc(why) + "</div>";
  return board + info + mNextRow() + "</div>";
}
function mCctHTML() {
  var done = M.stage === "done", g = new Chess(M.fen), q = M.kind === "check" ? "donnent échec" : "sont des prises";
  var board = mBoard(g, { orient: M.side, live: false });
  var info = '<div class="stack" style="gap:12px"><div class="note"><b>Aux ' + mSide(M.side) + " de jouer.</b> Combien de coups légaux " + q + " ?</div>";
  if (!done) return board + info + '<div class="row">' + M.opts.map(function (o) { return '<button class="btn" data-act="m_ans" data-v="' + o + '">' + o + "</button>"; }).join("") + "</div></div>";
  info += '<div class="note ' + (M.ok ? "good" : "bad") + '"><b>' + (M.ok ? "Exact." : "Raté : c'était " + M.c + ".") + "</b> " + (M.c ? esc(M.list.join(", ")) + "." : "Aucun coup de ce type.") + "</div>";
  return board + info + mNextRow() + "</div>";
}
function mBlindHTML() {
  var pz = M.pz, info = '<div class="stack" style="gap:12px">', who = "Aux " + mSide(M.side) + " de jouer. ";
  if (M.stage === "look") return mBoard(new Chess(pz.fen), { orient: M.side, live: false }) + info + '<div class="note"><b>' + who + "Mémorise.</b> Les pièces disparaissent dans " + M.secs + ' secondes : retiens le roi adverse, les pièces qui l\'entourent et les lignes ouvertes.</div><div class="mbar" style="--t:' + M.secs + 's" aria-hidden="true"><i></i></div><div class="row"><button class="btn primary" data-act="m_hide">Je suis prêt</button></div></div>';
  if (M.stage === "peek") return mBoard(M.g, { orient: M.side, live: false }) + info + '<div class="note"><b>Revoir la position.</b> Elle se cache à nouveau dans 5 secondes (le gain d\'Élo sera réduit).</div><div class="mbar" style="--t:5s" aria-hidden="true"><i></i></div><div class="row"><button class="btn primary" data-act="m_hide">Cacher</button></div></div>';
  if (M.stage === "ask") {
    var played = M.mv.slice(0, M.n).map(function (m) { return m.san; });
    return mBoard(new Chess(M_BLANK), { orient: M.side, live: true, marks: M.sel ? [M.sel] : [] }) + info + '<div class="note"><b>' + who + "</b>" + esc(pz.goal || "") + "<br>" + (played.length ? "Coups joués : <b>" + esc(mLineText(pz.fen, played)) + "</b><br>" : "") + "Joue de tête : touche la case de départ, puis la case d'arrivée." + (M.sel ? " Départ : <b>" + M.sel + "</b>." : "") + '</div><div class="row"><button class="btn" data-act="m_peek">Revoir 5 s</button><button class="btn" data-act="m_giveup">Abandonner</button></div></div>';
  }
  var gg = new Chess(pz.fen), last = [], k;
  for (k = 0; k < M.i; k++) { var m = gg.move(pz.sol[k], { sloppy: true }); if (m) last = [m.from, m.to]; }
  return mBoard(gg, { orient: M.side, live: false, last: last }) + info + '<div class="note ' + (M.ok ? "good" : "bad") + '"><b>' + (M.ok ? "Bien joué à l'aveugle." : "Raté.") + "</b> " + (M.ok ? "" : "La solution : ") + "Ligne : " + esc(mLineText(pz.fen, pz.sol)) + "</div>" + (M.elo ? '<div class="row">' + eloChip(M.elo) + '<span class="small muted">puzzle coté ' + M.elo.opp + "</span></div>" : "") +
    '<div class="navrow" style="grid-template-columns:repeat(2,1fr)" role="group" aria-label="Parcourir la ligne"><button class="btn" data-act="m_step" data-d="-1"' + (M.i <= 0 ? " disabled" : "") + ' aria-label="Coup précédent">‹</button><button class="btn primary" data-act="m_step" data-d="1"' + (M.i >= pz.sol.length ? " disabled" : "") + ' aria-label="Coup suivant">›</button></div>' +
    '<div class="card"><span class="label">Pourquoi ça marche</span><p>' + esc(pz.why || "") + "</p></div>" + mNextRow() + "</div>";
}
function mBlindEnd(ok) {
  M.ok = ok; M.stage = "done"; M.i = 0;
  var score = ok ? (M.peeks ? 0.6 : 1) : (M.n >= 2 ? 0.25 : 0);
  M.elo = { d: eloUpdate("b", M.bf, score), now: eloS().b, opp: M.bf };
  mRecord("blind", ok); renderMain();
}
function mBlindMove(sq) {
  if (!M.sel) { M.sel = sq; renderMain(); return; }
  if (M.sel === sq) { M.sel = null; renderMain(); return; }
  var from = M.sel, exp = M.mv[M.n], mv = M.g.moves({ verbose: true }).filter(function (x) { return x.from === from && x.to === sq; })[0];
  M.sel = null;
  if (mv && (mv.from === exp.from && mv.to === exp.to || /#/.test(mv.san))) {
    M.g.move(mv.san); M.n++;
    if (mv.from !== exp.from || mv.to !== exp.to || /#/.test(mv.san)) { M.n = M.mv.length; return mBlindEnd(true); }
    if (M.n < M.mv.length) { M.g.move(M.mv[M.n].san); M.n++; }
    if (M.n >= M.mv.length) return mBlindEnd(true);
    renderMain(); return;
  }
  mBlindEnd(false);
}
function mMemName() {
  var n = M.ans.length, a = M_ART[M.grp.type], w = a[0].replace(/^le |^la /, ""), fem = !a[1], c = M.grp.color === "w" ? "blanc" : "noir";
  if (n === 1) return a[0] + " " + (fem ? c.replace("blanc", "blanche").replace("noir", "noire") : c);
  return "les " + n + " " + w + "s " + (fem ? c.replace("blanc", "blanche").replace("noir", "noire") : c) + "s";
}
function mMemHTML() {
  var info = '<div class="stack" style="gap:12px">', g = new Chess(M.fen);
  var nm = mMemName();
  if (M.stage === "look") return mBoard(g, { orient: "w", live: false }) + info + '<div class="note"><b>Observe.</b> Le plateau disparaît dans ' + M.secs + ' secondes.</div><div class="mbar" style="--t:' + M.secs + 's" aria-hidden="true"><i></i></div><div class="row"><button class="btn primary" data-act="m_hide">Prêt, cacher</button></div></div>';
  if (M.stage === "ask") return mBoard(new Chess(M_BLANK), { orient: "w", live: true, marks: M.sel }) + info + '<div class="note"><b>Où étaient ' + nm + " ?</b> Touche les " + M.ans.length + " case" + (M.ans.length > 1 ? "s" : "") + ", puis valide.</div><div class=\"row\"><button class=\"btn primary\" data-act=\"m_check\"" + (M.sel.length === M.ans.length ? "" : " disabled") + ">Valider (" + M.sel.length + "/" + M.ans.length + ")</button></div></div>";
  return mBoard(g, { orient: "w", live: false, last: M.ans.filter(function (s) { return M.sel.indexOf(s) >= 0; }), tg: M.ans.filter(function (s) { return M.sel.indexOf(s) < 0; }), marks: M.sel.filter(function (s) { return M.ans.indexOf(s) < 0; }) }) + info + '<div class="note ' + (M.ok ? "good" : "bad") + '"><b>' + (M.ok ? "Parfait." : "Pas tout à fait.") + "</b> Position d'origine : " + nm + " : " + M.ans.join(", ") + ".</div>" + mNextRow() + "</div>";
}
function mLongHTML() {
  var pz = M.pz, g = new Chess(pz.fen), info = '<div class="stack" style="gap:12px">';
  if (M.stage === "calc") return mBoard(g, { orient: M.side, live: false }) + info + '<div class="note"><b>Aux ' + mSide(M.side) + " de jouer.</b> " + esc(pz.goal) + "<br>Calcule dans ta tête, sans toucher le plateau : échecs, prises, menaces, jusqu'au bout de la combinaison (" + Math.ceil(pz.sol.length / 2) + " coups de ton côté).</div><div class=\"row\"><button class=\"btn primary\" data-act=\"m_ready\">J'ai calculé</button></div></div>";
  if (M.stage === "pick") return mBoard(g, { orient: M.side, live: false }) + info + '<div class="note"><b>Quel est le premier coup ?</b></div><div class="row">' + M.opts.map(function (o, i) { return '<button class="btn" data-act="m_pick" data-i="' + i + '">' + dispSan(o) + "</button>"; }).join("") + "</div></div>";
  var gg = new Chess(pz.fen), last = [], k;
  for (k = 0; k < M.i; k++) { var m = gg.move(pz.sol[k], { sloppy: true }); if (m) last = [m.from, m.to]; }
  return mBoard(gg, { orient: M.side, live: false, last: last }) + info + '<div class="note ' + (M.ok ? "good" : "bad") + '"><b>' + (M.ok ? "Bien calculé." : "Raté : c'était " + dispSan(M.good) + ".") + "</b> Ligne : " + esc(mLineText(pz.fen, pz.sol)) + "</div>" +
    '<div class="navrow" style="grid-template-columns:repeat(2,1fr)" role="group" aria-label="Parcourir la ligne"><button class="btn" data-act="m_step" data-d="-1"' + (M.i <= 0 ? " disabled" : "") + ' aria-label="Coup précédent">‹</button><button class="btn primary" data-act="m_step" data-d="1"' + (M.i >= pz.sol.length ? " disabled" : "") + ' aria-label="Coup suivant">›</button></div>' +
    '<div class="card"><span class="label">Pourquoi ça marche</span><p>' + esc(pz.why) + "</p></div>" + mNextRow() + "</div>";
}

/* ---------- Interactions ---------- */
function mindOpen(k) {
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "mind"; M = null; clearTimeout(M_T);
  if (k) mNew(k); else { render(); window.scrollTo(0, 0); }
}
function mToggle(sq, max) {
  var i = M.sel.indexOf(sq);
  if (i >= 0) M.sel.splice(i, 1); else if (M.sel.length < max) M.sel.push(sq);
  renderMain();
}
function mindSquare(sq) {
  if (!M || M.err) return;
  if (M.k === "thr" && M.stage === "ask") { var p = new Chess(M.fen).get(sq); if (p && p.color === M.side && p.type !== "k") mToggle(sq, 16); return; }
  if (M.k === "blind" && M.stage === "ask") { mBlindMove(sq); return; }
  if (M.k === "mem" && M.stage === "ask") mToggle(sq, M.ans.length);
}
function mHide() {
  clearTimeout(M_T);
  if (M.stage === "look" || M.stage === "peek") { M.stage = "ask"; renderMain(); }
}
function mindAct(d) {
  switch (d.act) {
    case "m_open": mindOpen(d.dr || null); break;
    case "m_start": mNew(d.dr); break;
    case "m_hub": clearTimeout(M_T); M = null; renderMain(); window.scrollTo(0, 0); break;
    case "m_next": if (M) mNew(M.k); break;
    case "m_hide": if (M) mHide(); break;
    case "m_check":
      if (!M) break;
      if (M.k === "thr") { var tk = Object.keys(M.th); M.ok = tk.length === M.sel.length && tk.every(function (s) { return M.sel.indexOf(s) >= 0; }); M.stage = "done"; mRecord("thr", M.ok); renderMain(); }
      else if (M.k === "mem" && M.sel.length === M.ans.length) { M.ok = M.ans.every(function (s) { return M.sel.indexOf(s) >= 0; }); M.stage = "done"; mRecord("mem", M.ok); renderMain(); }
      break;
    case "m_ans":
      if (!M || M.stage !== "ask") break;
      if (M.k === "hang") { M.ans = d.v; M.ok = d.v === M.want; M.stage = "done"; mRecord("hang", M.ok); renderMain(); }
      else if (M.k === "cct") { M.ok = Number(d.v) === M.c; M.stage = "done"; mRecord("cct", M.ok); renderMain(); }
      break;
    case "m_peek": if (M && M.k === "blind" && M.stage === "ask") { M.peeks++; M.sel = null; M.stage = "peek"; renderMain(); mMemTimer(); } break;
    case "m_giveup": if (M && M.k === "blind" && M.stage === "ask") mBlindEnd(false); break;
    case "m_ready": if (M && M.stage === "calc") { M.stage = "pick"; renderMain(); } break;
    case "m_pick":
      if (M && M.stage === "pick") { M.ok = M.opts[Number(d.i)] === M.good; M.stage = "done"; M.i = 0; mRecord("long", M.ok); renderMain(); }
      break;
    case "m_step": if (M && M.pz) { M.i = Math.max(0, Math.min(M.pz.sol.length, M.i + Number(d.d))); renderMain(); } break;
  }
}
/* La mémoire du plateau cache seule les pièces au bout du délai. */
function mMemTimer() {
  clearTimeout(M_T);
  if (M && (M.k === "mem" || M.k === "blind") && (M.stage === "look" || M.stage === "peek")) { var cur = M, st = M.stage; M_T = setTimeout(function () { if (M === cur && M.stage === st && V.view === "mind") { M.stage = "ask"; renderMain(); } }, (st === "peek" ? 5 : M.secs) * 1000); }
}

function mCausesHTML() {
  var c = S.causes || {}, ks = Object.keys(M_CAUSES).filter(function (k) { return c[k]; }), tot = ks.reduce(function (a, k) { return a + c[k]; }, 0);
  if (!tot) return "";
  ks.sort(function (a, b) { return c[b] - c[a]; });
  var h = '<div class="stack" style="gap:8px;margin-top:14px"><span class="label">Pourquoi tu perds du terrain</span><p class="small muted">Cause probable de chaque erreur repérée (estimation automatique).</p>';
  ks.forEach(function (k) {
    var pc = Math.round(100 * c[k] / tot), dr = M_CAUSES[k].drill;
    h += '<div><div class="row between small"><span><b>' + esc(M_CAUSES[k].t) + '</b></span><span class="muted">' + c[k] + " · " + pc + ' %</span></div><div class="bar" role="img" aria-label="' + esc(M_CAUSES[k].t) + " " + pc + ' pour cent"><i style="width:' + pc + '%"></i></div>' +
      '<p class="small muted" style="margin:4px 0">' + esc(M_CAUSES[k].adv) + "</p>" + (dr ? '<button class="btn small" data-act="m_open" data-dr="' + dr + '">S\'entraîner</button>' : '<button class="btn small" data-act="tab" data-v="plans">Plans de jeu</button>') + (M_CAUSES[k].chap ? ' <button class="btn small" data-act="adopen" data-id="' + M_CAUSES[k].chap + '">Chapitre ' + (M_CAUSES[k].chap === "def" ? "Défendre" : "Attaquer") + "</button>" : "") + "</div>";
  });
  return h + "</div>";
}

/* Exemples résolus et expliqués pour chaque exercice de « Menaces et calcul » (positions vérifiées : coups légaux, mats contrôlés) */
var M_EX = {
  thr: { title: "Exemple : repérer les pièces menacées", fen: "4k3/8/5n2/8/3b4/2N5/8/4K3 w - - 0 1", sans: ["Nb5", "Bb6"], orient: "w",
    notes: { 0: "Les Blancs jouent. Question : si l'adversaire jouait maintenant, quelle pièce blanche pourrait-il prendre ? Le fou noir en d4 attaque le cavalier en c3, et rien ne le protège : c'est une menace réelle.", 1: "Nb5 : le cavalier quitte la case attaquée et, du même coup, attaque le fou noir en d4 (qui n'est pas protégé).", 2: "Fb6 : le fou noir se retire. Réflexe à retenir : avant de jouer, repère toute pièce attaquée et pas protégée." },
    vz: { 0: { arr: [["d4", "c3", "r"]], weak: ["c3"], lab: { ar: "Menace adverse", weak: "Pièce menacée" } } } },
  hang: { title: "Exemple : ce coup est-il sûr ?", fen: "4k3/8/8/3r4/8/4B3/8/4K3 w - - 0 1", sans: ["Bg5", "Rxg5"], orient: "w",
    notes: { 0: "Les Blancs envisagent Fg5. Avant de jouer, on regarde la case d'arrivée : est-elle attaquée par une pièce adverse ?", 1: "Fg5 : la tour noire en d5 voit la case g5 le long de la 5e rangée (e5 et f5 sont vides).", 2: "Txg5 : le fou est pris et rien ne le protégeait. Ce coup n'était pas sûr. Un coup sûr ici : Ff4, hors de portée de la tour." },
    vz: { 0: { out: ["g5"], arr: [["d5", "g5", "r"]], files: [], lab: { ar: "Attaque adverse", out: "Case d'arrivée" } }, 1: { arr: [["d5", "g5", "r"]], lab: { ar: "Attaque adverse" } } } },
  cct: { title: "Exemple : échecs, prises, menaces", fen: "6k1/5ppp/8/8/8/8/5PPP/R3K3 w - - 0 1", sans: ["Ra8#"], orient: "w",
    notes: { 0: "On passe en revue d'abord les échecs. Ici, Ta8 donne échec le long de la 8e rangée. Le roi noir peut-il fuir ? Ses pions f7, g7 et h7 lui ferment les cases. Peut-on s'interposer ? Aucune pièce noire.", 1: "Ta8# : c'est mat. En vérifiant toujours échecs, prises et menaces dans cet ordre, on trouve ce genre de coup forcé." },
    vz: { 0: { arr: [["a1", "a8", "g"]], weak: ["g8", "f7", "g7", "h7"], files: ["a"], lab: { ag: "Échec possible", weak: "Roi et pions qui l'enferment", files: "Colonne de la tour" } } } },
  blind: { title: "Exemple : puzzle à l'aveugle", fen: "rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6", sans: ["Bxf7+", "Ke7", "Nd5#"], orient: "w",
    notes: { 0: "Tu as 20 secondes. Ne retiens pas 30 pièces : retiens ce qui compte. Le roi noir est resté au centre en e8, le pion f7 n'est protégé que par le roi, et ton fou c4 et ton cavalier e5 visent f7.", 1: "Fxf7+ : tu joues de tête, case c4 puis f7. Le plateau est vide, mais tu sais que le fou prend le pion avec échec.", 2: "Re7 : l'appli annonce la réponse adverse (le roi n'a que cette case). À toi de mettre à jour la position dans ta tête.", 3: "Cd5# : le cavalier de c3 va en d5. Le roi en e7 n'a plus de case de fuite : mat. Astuce : revois la position si tu doutes (5 secondes), mais l'Élo gagné sera réduit." },
    vz: { 0: { out: ["e8", "f7", "c4", "e5"], lab: { out: "À retenir" } }, 1: { arr: [["c4", "f7", "g"]] }, 3: { arr: [["c3", "d5", "g"]] } } },
  mem: { title: "Exemple : mémoriser une position", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", sans: ["e4", "e5", "Nf3"], orient: "w",
    notes: { 0: "Astuce : ne retiens pas 32 pièces une par une, retiens les groupes. Ici, la position de départ.", 1: "Après e4 : un pion blanc au centre en e4. Un seul changement à mémoriser.", 2: "Après e5 : le même pion noir, face au pion blanc. Les deux pions centraux sont l'un en face de l'autre.", 3: "Après Cf3 : un cavalier sort. On retient : pions e4 et e5, cavalier f3. Une position = quelques groupes simples." },
    vz: { 1: { out: ["e4"], lab: { out: "À retenir" } }, 2: { out: ["e4", "e5"], lab: { out: "À retenir" } }, 3: { out: ["e4", "e5", "f3"], lab: { out: "À retenir" } } } },
  long: { title: "Exemple : calcul long", fen: "rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6", sans: ["Bxf7+", "Ke7", "Nd5#"], orient: "w",
    notes: { 0: "Calcule toute la ligne avant de jouer : Fxf7+ est un échec. Le roi noir n'a qu'une réponse, Re7. Ensuite, Cd5 sera-t-il mat ? On vérifie chaque case de fuite.", 1: "Fxf7+ : le fou prend le pion en f7 avec échec. Le roi ne peut pas prendre (le cavalier e5 protège f7) : il doit aller en e7.", 2: "Re7 : réponse forcée.", 3: "Cd5# : mat. Le roi en e7 est attaqué par le cavalier et chaque case voisine est prise ou occupée. Calculer jusqu'au bout, c'est vérifier ces cases une à une." },
    vz: { 1: { arr: [["c4", "f7", "g"]], weak: ["e8", "e7"], lab: { ag: "Échec", weak: "Cases du roi" } }, 3: { arr: [["c3", "d5", "g"]], weak: ["e7"], lab: { ag: "Mat", weak: "Roi mat" } } } }
};
function mExOpen(k) { if (!M_EX[k]) return; V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "mex"; V.mexk = k; V.sifor = null; V.si = 0; render(); window.scrollTo(0, 0); }
function mExHTML() {
  const e = M_EX[V.mexk]; if (!e) return backBtn("Retour");
  if (!e._ill) e._ill = { kind: "pos", title: e.title, sub: "Regarde d'abord comment on s'y prend, puis fais l'exercice.", fen: e.fen, sans: e.sans, from: 0, orient: e.orient, notes: e.notes, vz: Object.keys(e.vz || {}).length ? e.vz : undefined, nokeys: true };
  return backBtn("Retour") + '<div class="hdr"><h1>' + esc(e.title) + '</h1></div><div class="stack" style="gap:16px">' + stIllHTML(e._ill) + '<div class="row"><button class="btn primary" data-act="back">À toi de jouer</button></div></div>';
}
