/* ===== Entraînement : adaptatif, rafale, défi du jour, finales, stats, objectifs, bilan de partie ===== */
function rngSeed(s) { let a = strHash(String(s)) || 1; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

/* ---------- Statistiques par thème / ouverture ---------- */
function themeStats() {
  const m = {};
  allPz().forEach((p) => {
    const t = m[p.th] || (m[p.th] = { th: p.th, n: 0, rated: 0, f: 0, done: 0 });
    t.n++; const r = S.pz[p.id];
    if (r && r.ok) t.done++;
    if (r && r.rated) { t.rated++; t.f += r.f ? 1 : 0; }
  });
  Object.keys(m).forEach((k) => { m[k].rate = (m[k].f + 1) / (m[k].rated + 2); });
  return m;
}
function themeWeak(th, st) { const t = (st || themeStats())[th]; return t ? 1 - t.rate : 0.5; }
function openingStats() {
  return OPENINGS.map((o) => {
    let tries = 0, errs = 0;
    LINES.forEach((L) => { if (L.op !== o.id) return; const l = S.lines[L.id]; if (l) { tries += l.tries || 0; errs += l.errs || 0; } });
    return { o, tries, errs, avg: tries ? errs / tries : null };
  });
}
function statsCardHTML() {
  const st = themeStats(), rows = Object.keys(st).map((k) => st[k]).filter((t) => t.n).sort((a, b) => a.rate - b.rate);
  const due = pzDueList();
  let h = due.length ? '<section class="card"><span class="label">À revoir aujourd\'hui</span><p class="muted">' + due.length + " problème" + (due.length > 1 ? "s" : "") + " raté" + (due.length > 1 ? "s" : "") + " reviennent à intervalles croissants (1, 3, 7, 16 puis 35 jours) tant que tu ne les réussis pas du premier coup.</p><div class=\"row\"><button class=\"btn primary\" data-act=\"pzdue\">Réviser mes ratés</button></div></section>" : "";
  h += '<section class="card"><span class="label">Réussite par thème (premier essai)</span>';
  const noData = !rows.some((t) => t.rated);
  if (noData) h += '<p class="muted">Résous quelques problèmes : cette carte te montrera les thèmes où tu perds le plus de points.</p>';
  else {
    h += '<div class="stack">';
    rows.forEach((t, i) => {
      const pc = Math.round(100 * t.rate), k = pzThemeK(t.th);
      h += '<div class="stack" style="gap:4px"><div class="row between small"><span>' + (i === 0 && t.rated >= 2 ? "⚠ " : "") + "<b>" + esc(t.th) + '</b> <span class="muted">' + t.rated + " noté" + (t.rated > 1 ? "s" : "") + "</span></span><b>" + (t.rated ? pc + " %" : "—") + '</b></div><div class="bar" data-k="' + k + '"><i style="width:' + (t.rated ? pc : 0) + "%;background:var(--k)" + '"></i></div></div>';
    });
    h += "</div>";
    const w = rows.find((t) => t.rated >= 2);
    if (w) h += '<div class="row"><button class="btn primary" data-act="pzadapt" data-th="' + esc(w.th) + '">S\'entraîner : ' + esc(w.th) + "</button></div>";
  }
  h += '</section><section class="card"><span class="label">Erreurs par ouverture (révisions de lignes)</span><div class="stack">';
  openingStats().forEach((x) => { h += '<div class="row between small"><span>' + x.o.g + " <b>" + esc(x.o.short) + "</b></span><span>" + (x.avg == null ? "pas encore rejouée" : x.avg.toFixed(1).replace(".", ",") + " erreur" + (x.avg >= 2 ? "s" : "") + " par révision") + "</span></div>"; });
  return h + "</div></section>";
}

/* ---------- Objectifs Élo ---------- */
function goalOf(k) { if (!S.goal || typeof S.goal !== "object") S.goal = {}; return typeof S.goal[k] === "number" ? S.goal[k] : 1500; }
function projText(k) {
  const e = eloS(), cur = e[k], g = goalOf(k);
  if (cur >= g) return "Objectif atteint 🎉";
  if (e.h.length < 2) return "Joue sur plusieurs jours pour voir une projection.";
  const a = e.h[0], b = e.h[e.h.length - 1], days = Math.max(1, diffDays(a.d, b.d)), slope = (b[k] - a[k]) / days;
  if (slope < 1) return "Pas de progression nette pour l'instant.";
  const n = Math.ceil((g - cur) / slope);
  return n > 365 ? "Plus d'un an à ce rythme." : "Environ " + n + " jour" + (n > 1 ? "s" : "") + " à ce rythme (+" + slope.toFixed(1).replace(".", ",") + " par jour).";
}
function goalsHTML() {
  const e = eloS(), L = [["p", "Problèmes", "amber"], ["s", "Études", "blue"], ["g", "Parties", "green"], ["b", "À l'aveugle", "violet"]];
  let h = '<section class="card"><span class="label">Tes objectifs</span><div class="stack">';
  L.forEach((x) => {
    const k = x[0], g = goalOf(k), pc = Math.max(0, Math.min(100, Math.round(100 * (e[k] - 1200) / Math.max(50, g - 1200))));
    h += '<div class="stack" style="gap:6px" data-k="' + x[2] + '"><div class="row between"><span><b>' + x[1] + "</b> · " + e[k] + " → " + g + '</span><span class="row" style="gap:6px"><button class="btn small" data-act="goal" data-k2="' + k + '" data-v="-100" aria-label="Baisser l\'objectif">−100</button><button class="btn small" data-act="goal" data-k2="' + k + '" data-v="100" aria-label="Monter l\'objectif">+100</button></span></div><div class="bar"><i style="width:' + (e[k] >= g ? 100 : pc) + '%;background:var(--k)"></i></div><span class="small muted">' + projText(k) + "</span></div>";
  });
  return h + "</div></section>";
}

/* ---------- Entraînement adapté ---------- */
function pzAdaptive(theme, exclude) {
  const st = themeStats(), e = eloS(), rnd = Math.random;
  let pool = allPz().filter((p) => (!theme || p.th === theme) && p.id !== exclude);
  if (!pool.length) return null;
  const w = pool.map((p) => {
    const r = pzRating(p), done = pzDone(p.id), r0 = S.pz[p.id];
    let x = Math.exp(-Math.abs(r - (e.p + 40)) / 220) * (0.6 + 1.4 * themeWeak(p.th, st));
    x *= done ? 0.5 : 1.3;
    if (r0 && r0.due && r0.due <= todayStr()) x *= 8;
    if (r0 && r0.last === todayStr()) x *= 0.3;
    return x + 0.001;
  });
  let s = w.reduce((a, b) => a + b, 0), t = rnd() * s;
  for (let i = 0; i < pool.length; i++) { t -= w[i]; if (t <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
function adaptStart(theme) {
  const p = pzAdaptive(theme || null); if (!p) return;
  puzOpen(p.id, { mode: "adapt", theme: theme || null });
}

/* ---------- Défi du jour ---------- */
function dailyGet() {
  const t = todayStr();
  if (!S.daily || S.daily.d !== t) {
    const rnd = rngSeed("jour" + t), e = eloS(), st = themeStats();
    const pool = allPz().filter((p) => !p.mine).map((p) => ({ p, k: Math.abs(pzRating(p) - (e.p + 60)) + rnd() * 500 - 350 * themeWeak(p.th, st) })).sort((a, b) => a.k - b.k);
    const ids = [], ths = new Set();
    for (const x of pool) { if (ids.length >= 5) break; if (ths.has(x.p.th) && ths.size < 5) continue; ths.add(x.p.th); ids.push(x.p.id); }
    for (const x of pool) { if (ids.length >= 5) break; if (ids.indexOf(x.p.id) < 0) ids.push(x.p.id); }
    S.daily = { d: t, ids, done: [] };
  }
  return S.daily;
}
function dailyDone() { const d = dailyGet(); return d.done.length >= d.ids.length; }
function dailyStreak() {
  const dd = Array.isArray(S.dd) ? S.dd : [], t = todayStr();
  let n = 0, c = dd.indexOf(t) >= 0 ? t : addDays(t, -1);
  while (dd.indexOf(c) >= 0) { n++; c = addDays(c, -1); }
  return n;
}
function dailyNext() { const d = dailyGet(); return d.ids.find((id) => d.done.indexOf(id) < 0) || null; }
function dailyStart() { const id = dailyNext() || dailyGet().ids[0]; puzOpen(id, { mode: "daily" }); }
function dailyMark(id) {
  const d = dailyGet(); if (d.done.indexOf(id) >= 0) return;
  d.done.push(id);
  if (d.done.length >= d.ids.length) { if (!Array.isArray(S.dd)) S.dd = []; if (S.dd.indexOf(d.d) < 0) S.dd.push(d.d); S.dd = S.dd.slice(-120); }
}
/* Suite de la série dans le mode courant */
function pzFollow(p) {
  if (!p) return null;
  if (p.mode === "daily") return dailyNext();
  if (p.mode === "mat") return matNext(p.mt, p.id);
  if (p.mode === "wp") return p.wpEnd ? null : wpNext(p.sid);
  if (p.mode === "surprise") return null;
  if (p.mode === "adapt") { const n = pzAdaptive(p.theme, p.id); return n ? n.id : null; }
  const n = pzNext(p.id); return n ? n.id : null;
}

/* ---------- Rafale ---------- */
var RUSH_MS = 180000;
function rushStart() {
  RU = { end: Date.now() + RUSH_MS, score: 0, strikes: 0, seen: [], tm: null, over: false };
  if (!S.rush) S.rush = { best: 0, runs: 0 };
  rushPick(true);
  RU.tm = setInterval(rushTick, 250);
}
function rushPick(first) {
  const target = 900 + Math.min(900, RU.score * 55);
  const pool = allPz().filter((p) => !p.mine && !p.pos && p.sol.length <= 3 && RU.seen.indexOf(p.id) < 0);
  const list = (pool.length ? pool : allPz().filter((p) => !p.mine && !p.pos && p.sol.length <= 3)).map((p) => ({ p, k: Math.abs(pzRating(p) - target) + Math.random() * 250 })).sort((a, b) => a.k - b.k);
  const p = list[0] && list[0].p; if (!p) return rushEnd();
  RU.seen.push(p.id);
  if (first) puzOpen(p.id, { mode: "rush" });
  else { P = puzNew(p.id, { mode: "rush" }); renderMain(); }
}
function rushTick() {
  if (!RU || RU.over) return;
  const left = RU.end - Date.now();
  if (left <= 0 || V.view !== "puzzle" || !P || !P.rush) { if (left <= 0) rushEnd(); else rushStop(); return; }
  const c = $("#rushclock"); if (c) c.textContent = fmtClock(left);
  const b = $("#rushbar"); if (b) b.style.width = Math.max(0, 100 * left / RUSH_MS) + "%";
}
function fmtClock(ms) { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function rushStop() { if (RU && RU.tm) clearInterval(RU.tm); if (RU) { RU.tm = null; RU.over = true; } }
function rushEnd() {
  if (!RU || RU.over) return;
  rushStop(); const best = S.rush.best; S.rush.runs++; RU.newBest = RU.score > best; if (RU.newBest) S.rush.best = RU.score;
  logDay((l) => { l.p += RU.score; });
  save(); sfx(RU.newBest ? "done" : "ok");
  P = null; V.view = "rush"; render();
}
function rushWrong() {
  RU.strikes++; sfx("bad");
  if (RU.strikes >= 3) return rushEnd();
  P.lock = true; P.msg = "Raté ! (" + RU.strikes + "/3)"; renderMain();
  setTimeout(() => { if (RU && !RU.over && P && P.rush) rushPick(false); }, 650);
}
function rushRight() {
  RU.score++; P.lock = true; P.stage = "rushok"; renderMain();
  setTimeout(() => { if (RU && !RU.over && P && P.rush) rushPick(false); }, 350);
}
function rushHTML() {
  if (!RU) return backBtn();
  const r = S.rush || { best: 0 };
  return backBtn("S'entraîner") + '<div class="hdr"><h1>Rafale terminée</h1></div><section class="card hero"><span class="label">Score</span><h2 style="font-size:3rem">' + RU.score + '</h2><div class="row">' +
    (RU.newBest ? '<span class="chip good">Nouveau record !</span>' : '<span class="chip">Record : ' + r.best + "</span>") + '<span class="chip">' + RU.strikes + " erreur" + (RU.strikes > 1 ? "s" : "") + '</span></div><div class="row"><button class="btn primary" data-act="rush">Rejouer</button></div></section>' +
    '<p class="small muted">En rafale, 3 minutes et 3 erreurs maximum : les problèmes sont courts et deviennent plus difficiles. Le classement Élo n\'est pas modifié.</p>';
}

/* ---------- Tuiles de la page Tactiques ---------- */
function trainTilesHTML() {
  const d = dailyGet(), sk = dailyStreak(), r = S.rush || { best: 0 };
  return '<div class="tiles" style="margin-bottom:14px">' +
    '<button class="tile" data-k="amber" data-act="pzadapt"><span class="ti">◎</span><b>Entraînement adapté</b><span class="small muted">Proche de ton Élo ' + eloS().p + "</span></button>" +
    '<button class="tile" data-k="red" data-act="rush"><span class="ti">⏱</span><b>Rafale 3 min</b><span class="small muted">Record : ' + r.best + "</span></button>" +
    '<button class="tile" data-k="green" data-act="daily"><span class="ti">☀</span><b>Défi du jour</b><span class="small muted">' + d.done.length + "/" + d.ids.length + (sk ? " · série " + sk : "") + "</span></button>" +
    '<button class="tile" data-k="teal" data-act="wpopen"><span class="ti">⟳</span><b>Pic-vert</b><span class="small muted">' + wpSets().length + " série" + (wpSets().length > 1 ? "s" : "") + " · méthode Woodpecker</span></button>" +
    '<button class="tile" data-k="red" data-act="matopen"><span class="ti">♚</span><b>Motifs de mat</b><span class="small muted">' + MATS.length + " mats classiques</span></button>" +
    '<button class="tile" data-k="blue" data-act="m_open"><span class="ti">◉</span><b>Menaces et calcul</b><span class="small muted">6 exercices mentaux</span></button>' +
    '<button class="tile" data-k="violet" data-act="endg"><span class="ti">♔</span><b>Finales</b><span class="small muted">' + EG_LIST.filter((x, i) => S.eg && S.eg[i] && S.eg[i].ok).length + "/" + EG_LIST.length + " réussies</span></button></div>";
}

/* ---------- Hub S'entraîner : Tactique / Menaces et calcul / Finales ---------- */
function trainHubHTML() {
  const t = V.trk || "tact", d = dailyGet(), sk = dailyStreak(), r = S.rush || { best: 0 };
  let h = '<div class="seg subnav" role="group" aria-label="Catégorie">' + [["tact", "Tactique"], ["mind", "Menaces et calcul"], ["end", "Finales"]].map((c) => '<button data-act="trk" data-v="' + c[0] + '" aria-pressed="' + (t === c[0]) + '">' + c[1] + "</button>").join("") + "</div>";
  h += '<ul class="trows" style="margin-bottom:14px">';
  if (t === "tact") {
    h += trowHTML("◈", "blue", "Tactiques par thème", "Fourchette, clouage, mat… un thème à la fois", "", 'data-act="pzth"');
    h += trowHTML("◎", "amber", "Entraînement adapté", "Proche de ton Élo " + eloS().p, "", 'data-act="pzadapt"');
    h += trowHTML("⏱", "red", "Rafale 3 min", "Record : " + r.best, "", 'data-act="rush"');
    h += trowHTML("☀", "green", "Défi du jour", d.done.length + " sur " + d.ids.length + " problèmes" + (sk ? " · série " + sk : ""), d.done.length + "/" + d.ids.length, 'data-act="daily"');
    h += trowHTML("⟳", "teal", "Pic-vert", wpSets().length + " série" + (wpSets().length > 1 ? "s" : "") + " · méthode Woodpecker", "", 'data-act="wpopen"');
    h += trowHTML("♚", "red", "Motifs de mat", MATS.length + " mats classiques", "", 'data-act="matopen"');
    h += trowHTML("?", "blue", "Position surprise", "Retrouve ton coup", "", 'data-act="xnew"');
  } else if (t === "mind") {
    h += trowHTML("◉", "blue", "Tous les exercices", "Menaces, visualisation, calcul long", "", 'data-act="m_open"');
    M_DRILLS.forEach((x) => { const a = mAcc(x.k); h += trowHTML(x.ic, x.c, x.t, x.d.length > 60 ? x.d.slice(0, 58) + "…" : x.d, a == null ? "" : Math.round(100 * a) + " %", 'data-act="m_open" data-dr="' + x.k + '"'); });
  } else {
    const okN = EG_LIST.filter((x, i) => S.eg && S.eg[i] && S.eg[i].ok).length;
    h += '</ul><p class="small muted" style="margin:0 0 10px">' + okN + " sur " + EG_LIST.length + " finales réussies. Ouvre un chapitre pour voir ses leçons et ses exercices.</p>" + egChaptersHTML() + "<ul>";
  }
  return h + "</ul>";
}

/* ---------- Finales ---------- */
function egOpen() { VS = null; V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "endg"; render(); window.scrollTo(0, 0); }
function egExOpen(i) { V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "egex"; V.egi = i; V.si = 0; render(); window.scrollTo(0, 0); }
function egStart(i, direct) {
  if (!direct && typeof EG_EX !== "undefined" && EG_EX[i] && V.view !== "egex") { egExOpen(i); return; }
  const x = EG_LIST[i], g = new Chess(x.fen), me = g.turn();
  VS = { stage: "play", eg: i, lvl: 7, me, g, sel: null, tg: [], last: null, lock: false, msg: "", over: null, res: null, id: Date.now() };
  if (V.view === "egex") { V.view = "vs"; } else { V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "vs"; }
  render(); window.scrollTo(0, 0);
  if (g.turn() !== me) vsEngine();
}
function egEnd(ok, reason) {
  VS.over = reason; VS.stage = "done"; VS.lock = false; VS.sel = null; VS.tg = [];
  if (!S.eg) S.eg = {};
  const r = S.eg[VS.eg] || (S.eg[VS.eg] = { ok: 0, tries: 0 }); r.tries++; if (ok) r.ok = 1;
  VS.res = { ok };
  logDay((l) => { l.x = (l.x || 0) + 1; });
  sfx(ok ? "done" : "bad"); save(); renderMain();
}
function egCheck() {
  const g = VS.g, x = EG_LIST[VS.eg];
  if (g.in_checkmate()) { if (g.turn() === VS.me) egEnd(false, "Tu es mat"); else egEnd(x.goal === "win", x.goal === "win" ? "Échec et mat !" : "Mat, mais le but était la nulle"); return true; }
  if (g.in_draw() || g.in_stalemate()) { egEnd(x.goal === "draw", x.goal === "draw" ? "Nulle obtenue" : (g.in_stalemate() ? "Pat : tu as laissé filer la victoire" : "Nulle : la victoire t'a échappé")); return true; }
  const myMoves = g.history().length / 2;
  if (x.fail === "promo" && g.board().some((r) => r.some((q) => q && q.color !== VS.me && q.type !== "k" && q.type !== "p"))) { egEnd(false, "Le pion a promu : tu n'as pas pu le rattraper"); return true; }
  if (x.goal === "draw" && myMoves >= 22) { egEnd(true, "Tu as tenu 20 coups : la nulle est là"); return true; }
  if (x.goal === "win" && myMoves >= (x.max || 60)) { egEnd(false, "Trop lent : limite de " + (x.max || 60) + " coups"); return true; }
  return false;
}
