/* ===== Application ===== */
const $ = (s, r) => (r || document).querySelector(s);
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function p2(n) { return String(n).padStart(2, "0"); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------- Dates ---------- */
function fmtD(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
function todayStr() { return fmtD(new Date()); }
function parseD(s) { const a = s.split("-").map(Number); return new Date(a[0], a[1] - 1, a[2]); }
function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); }
function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }

/* ---------- État et stockage ---------- */
const LS_KEY = "apres-ouverture:v1";
const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
const PACE = { 5: 3, 10: 6, 20: 12 };
function defaults() {
  return { v: 1, lines: {}, q: {}, custom: [], pz: {}, hard: {}, mypz: [], log: {}, sound: 1, pace: 10, user: "Polo60", start: todayStr(), streak: 0, best: 0, lastDay: "", days: {}, session: null, updated: 0 };
}
let S = defaults();
function adopt(o) {
  const d = defaults();
  S = Object.assign(d, o || {});
  ["lines", "q", "days", "pz", "hard", "log"].forEach((k) => { if (!S[k] || typeof S[k] !== "object") S[k] = {}; });
  if (!Array.isArray(S.custom)) S.custom = [];
  if (!Array.isArray(S.mypz)) S.mypz = [];
  try { rebuildCustom(); } catch (e) { /* lignes perso illisibles */ }
}
function localLoad() {
  try { const r = localStorage.getItem(LS_KEY); if (r) adopt(JSON.parse(r)); } catch (e) { /* stockage indisponible */ }
}
function localSave() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* ignoré */ } }

/* Synchronisation entre appareils quand la base partagée est disponible */
let remote = null, remoteTimer = null;
function save() { S.updated = Date.now(); localSave(); scheduleRemote(); }
function scheduleRemote() {
  if (!remote) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(flushRemote, 1800);
}
async function flushRemote() {
  if (!remote) return;
  if (remote.busy) { remote.dirty = true; return; }
  remote.busy = true;
  try { await remote.doc.set(clone(S)); } catch (e) { /* on réessaiera au prochain enregistrement */ }
  remote.busy = false;
  if (remote.dirty) { remote.dirty = false; scheduleRemote(); }
}
async function initRemote() {
  try {
    if (!window.claude || !window.claude.use) return;
    const user = await window.claude.use("user");
    const db = await window.claude.use("db");
    if (!user || !db) return;
    const id = await user.id();
    if (!id) return;
    const doc = db.doc("data/users/" + id + "/progress");
    const snap = await doc.get();
    remote = { doc, busy: false, dirty: false };
    if (snap.exists) {
      const d = snap.data();
      if (d && (d.updated || 0) > (S.updated || 0)) { adopt(clone(d)); localSave(); ensureSession(); }
      else if (d && (d.updated || 0) < (S.updated || 0)) scheduleRemote();
    } else if (S.updated > 0) scheduleRemote();
    render();
  } catch (e) { remote = null; }
}

/* ---------- Répétition espacée ---------- */
function ls(id) { return S.lines[id] || (S.lines[id] = { box: 0, due: "", seen: 0, tries: 0, errs: 0, last: "" }); }
function isSeen(id) { const l = S.lines[id]; return !!(l && l.seen); }
function isDue(id, t) { const l = S.lines[id]; return !!(l && l.seen && l.due && l.due <= t); }
function boxOf(id) { return isSeen(id) ? S.lines[id].box || 0 : 0; }
function kindFor(id) { return boxOf(id) >= 3 ? "test" : "drill"; }

/* ---------- Ouverture en cours par couleur : on approfondit la même ouverture jour après jour ---------- */
function opLines(op) { return LINES.filter((L) => L.op === op); }
function opUnseen(op) { return opLines(op).filter((L) => !isSeen(L.id)).sort((x, y) => x.chi - y.chi); }
function activeOp(side) { // ouverture en cours de la couleur (null = pas encore choisie)
  const ops = OPENINGS.filter((o) => o.side === side);
  if (!S.act || typeof S.act !== "object") S.act = {};
  let cur = S.act[side] && ops.find((o) => o.id === S.act[side]);
  if (!cur) { // déjà commencée avant ce réglage : on reprend celle où l'on a le plus avancé
    const best = ops.map((o) => ({ o, n: opLines(o.id).filter((L) => isSeen(L.id)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0];
    if (best) { S.act[side] = best.o.id; cur = best.o; }
  }
  if (cur && !opUnseen(cur.id).length) { // tout est vu : on passe à la suivante de la même couleur
    for (let k = 1; k < ops.length; k++) { const o = ops[(ops.indexOf(cur) + k) % ops.length]; if (opUnseen(o.id).length) { S.act[side] = o.id; return o; } }
  }
  return cur || null;
}
function newLessons() { // une nouvelle leçon avec les Blancs, une avec les Noirs ; à défaut, deux de la même couleur
  const out = [], take = (op) => { const L = opUnseen(op.id).find((x) => !out.includes(x)); if (L) out.push(L); return !!L; };
  ["w", "b"].forEach((side) => { const op = activeOp(side) || OPENINGS.find((o) => o.side === side); if (op) take(op); });
  if (out.length < 2) { const sides = out.length ? [out[0].op] : []; const op = sides.length ? OP_BY_ID[sides[0]] : null; if (op) take(op); }
  return out;
}
function buildSession() {
  const t = todayStr(), n = PACE[S.pace] || 6, items = [];
  hardList().slice(0, n >= 10 ? 3 : 2).forEach((h) => items.push({ id: "h:" + h.id + ":" + h.i, kind: "hard", line: h.id, hi: h.i, done: false }));
  const due = LINES.filter((L) => isDue(L.id, t)).sort((a, b) => boxOf(a.id) - boxOf(b.id));
  for (const L of due) { if (items.length >= n + 3) break; items.push({ id: L.id, kind: kindFor(L.id), done: false }); }
  newLessons().forEach((L) => items.push({ id: L.id, kind: "new", done: false }));
  if (items.length < Math.min(n, 3)) {
    const rest = LINES.filter((L) => isSeen(L.id) && !items.find((i) => i.id === L.id)).sort((a, b) => boxOf(a.id) - boxOf(b.id));
    for (const L of rest) { if (items.length >= Math.min(n, 3)) break; items.push({ id: L.id, kind: kindFor(L.id), done: false }); }
  }
  return { d: t, items, completed: false };
}
function refreshNew() { // change d'ouverture : les nouvelles leçons pas encore faites sont remplacées
  if (!S.session) return;
  const keep = S.session.items.filter((i) => i.kind !== "new" || i.done);
  const have = new Set(keep.filter((i) => i.kind === "new").map((i) => LINE_BY_ID[i.id] && LINE_BY_ID[i.id].op));
  newLessons().forEach((L) => { if (!keep.find((i) => i.id === L.id) && !have.has(L.op)) keep.push({ id: L.id, kind: "new", done: false }); });
  S.session.items = keep; S.session.completed = false;
}
function actCardHTML() {
  const rows = ["w", "b"].map((side) => {
    const op = activeOp(side), ops = OPENINGS.filter((o) => o.side === side), nm = side === "w" ? "Blancs" : "Noirs";
    if (!op) return '<div class="row between"><span><b>' + nm + '</b> : choisis ton ouverture</span></div>';
    const all = opLines(op.id), seen = all.filter((L) => isSeen(L.id)).length;
    return '<div class="row between"><span><b>' + nm + '</b> : ' + esc(op.short) + ' <span class="muted small">' + seen + "/" + all.length + " lignes vues</span></span></div>";
  });
  const open = !!V.open["act-ch"], need = ["w", "b"].some((s) => !S.act || !S.act[s]);
  let h = '<section class="card"><span class="label">Ouvertures en cours</span><div class="stack" style="gap:6px">' + rows.join("") + '</div><p class="small muted">Une nouvelle leçon par couleur chaque jour, dans l\'ouverture en cours, jusqu\'à la fin de ses lignes.</p>';
  h += '<button class="btn small' + (need ? " primary" : "") + '" data-act="actch" aria-expanded="' + open + '">' + (need ? "Choisir mes ouvertures" : "Changer d'ouverture") + "</button>";
  if (open) ["w", "b"].forEach((side) => {
    h += '<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px"><span class="small muted">' + (side === "w" ? "Blancs" : "Noirs") + " :</span>" + OPENINGS.filter((o) => o.side === side).map((o) => '<button class="btn small' + (S.act && S.act[side] === o.id ? " primary" : "") + '" data-act="actset" data-side="' + side + '" data-op="' + o.id + '">' + esc(o.short) + "</button>").join("") + "</div>";
  });
  return h + "</section>\n\n";
}
function ensureSession() {
  const t = todayStr();
  if (!S.session || S.session.d !== t) { S.session = buildSession(); save(); }
}
function sessionStats() {
  const it = (S.session && S.session.items) || [];
  return { total: it.length, done: it.filter((i) => i.done).length, next: it.find((i) => !i.done) };
}
function markSessionDone(id) {
  if (!S.session) return;
  const it = S.session.items.find((i) => i.id === id && !i.done);
  if (it) it.done = true;
  const st = sessionStats();
  if (st.total && st.done === st.total && !S.session.completed) {
    S.session.completed = true;
    const t = S.session.d;
    if (S.lastDay === addDays(t, -1)) S.streak++; else if (S.lastDay !== t) S.streak = 1;
    S.lastDay = t; S.best = Math.max(S.best || 0, S.streak);
  }
}
function applyResult(id, errors, fromSession) {
  logDay((l) => { l.l++; l.e += errors; const o = LINE_BY_ID[id].op; l.o[o] = (l.o[o] || 0) + errors; });
  const t = todayStr(), l = ls(id);
  l.seen = 1; l.tries = (l.tries || 0) + 1; l.errs = (l.errs || 0) + errors; l.last = t;
  if (errors === 0) l.box = Math.min(6, (l.box || 0) + 1);
  else if (errors <= 2) l.box = Math.max(1, l.box || 0);
  else l.box = Math.max(1, (l.box || 0) - 2);
  l.due = addDays(t, INTERVALS[l.box]);
  S.days[t] = (S.days[t] || 0) + 1;
  if (fromSession) markSessionDone(id);
  save();
}
function markSeen(id) {
  const l = ls(id);
  if (!l.seen) { l.seen = 1; l.due = todayStr(); l.box = 0; save(); }
}
function currentStreak() {
  const t = todayStr();
  return S.lastDay === t || S.lastDay === addDays(t, -1) ? S.streak : 0;
}
function dueLabel(id) {
  const l = S.lines[id];
  if (!l || !l.seen) return { t: "Nouveau", c: "acc" };
  const d = diffDays(todayStr(), l.due);
  if (d <= 0) return { t: "À réviser", c: "warn" };
  return { t: "Dans " + d + " j", c: "" };
}

/* ---------- Échiquier ---------- */
const PIECE_FR = { k: "roi", q: "dame", r: "tour", b: "fou", n: "cavalier", p: "pion" };
function boardHTML(g, o) {
  o = o || {};
  const orient = o.orient || "w", b = g.board();
  const last = o.last || [], marks = o.marks || [], tg = o.tg || [];
  let h = '<div class="board' + (o.shake ? " shake" : "") + '" id="board" data-live="' + (o.live ? 1 : 0) + '" role="group" aria-label="Échiquier">';
  for (let ri = 0; ri < 8; ri++) {
    const r = orient === "w" ? ri : 7 - ri;
    for (let fi = 0; fi < 8; fi++) {
      const f = orient === "w" ? fi : 7 - fi;
      const sq = "abcdefgh"[f] + (8 - r), p = b[r][f];
      let c = "sq " + ((r + f) % 2 === 1 ? "d" : "l");
      if (o.sel === sq) c += " sel";
      if (last.indexOf(sq) >= 0) c += " last";
      if (tg.indexOf(sq) >= 0) c += p ? " tgt cap" : " tgt";
      if (o.hint === sq) c += " hint";
      if (o.flash === sq) c += " flash";
      if (marks.indexOf(sq) >= 0) c += " mark";
      const lab = sq + (p ? ", " + PIECE_FR[p.type] + (p.color === "w" ? " blanc" : " noir") : "");
      h += '<button type="button" class="' + c + '" data-sq="' + sq + '" aria-label="' + lab + '"' + (o.live ? "" : ' tabindex="-1"') + ">";
      if (fi === 0) h += '<span class="co r">' + (8 - r) + "</span>";
      if (ri === 7) h += '<span class="co f">' + "abcdefgh"[f] + "</span>";
      if (p) h += '<span class="pc ' + p.color + p.type.toUpperCase() + '"></span>';
      h += "</button>";
    }
  }
  if (o.viz) h += vizSVG(o.viz, orient, o.layers || {});
  return h + "</div>";
}
function movesHTML(sans, idx, showAll) {
  let h = '<div class="moves">';
  const end = showAll ? sans.length : idx;
  for (let i = 0; i < end; i++) {
    if (i % 2 === 0) h += '<span class="mn">' + (i / 2 + 1) + ".</span>";
    h += '<span class="mv' + (i === idx - 1 ? " cur" : "") + (i >= idx ? " fut" : "") + '">' + esc(dispSan(sans[i])) + "</span> ";
  }
  return h + "</div>";
}
function dots(n) {
  let h = '<span class="dots" role="img" aria-label="Maîtrise ' + n + ' sur 6">';
  for (let i = 0; i < 6; i++) h += "<i" + (i < n ? ' class="on"' : "") + "></i>";
  return h + "</span>";
}
function chapOf(L) { return (CHAPTERS[L.op] || []).find((c) => c.id === L.ch) || null; }
/* Données Lichess : statistiques de la ligne et de chaque coup */
function liStat(L, i) {
  if (L.par && i < L.dv) return liStat(LINE_BY_ID[L.par], i);
  if (L.st && i === L.dv) return { sh: L.st.sh, n: L.st.n };
  const M = typeof LI_META !== "undefined" && LI_META[L.id];
  return M && M.mf && M.mf[i] ? { sh: M.mf[i][0], n: M.mf[i][1] } : null;
}
function liMoveNote(L, i) {
  const s = i >= 0 ? liStat(L, i) : null;
  if (!s || s.n < 30) return "";
  return '<div class="small muted">Dans les parties Lichess : ce coup est joué dans ' + String(s.sh).replace(".", ",") + " % des cas à ce stade (" + s.n.toLocaleString("fr-FR") + " parties).</div>";
}
function liInfoHTML(L) {
  const M = typeof LI_META !== "undefined" && LI_META[L.id];
  const eco = L.lx ? (L.eco ? { eco: L.eco, en: L.en } : null) : (M && M.eco ? { eco: M.eco, en: M.en } : null);
  let h = "";
  if (eco) h += '<div class="small"><b>Nom officiel</b> (ECO ' + esc(eco.eco) + ") : " + esc(eco.en) + "</div>";
  if (L.par && L.st) {
    const P = LINE_BY_ID[L.par], r = L.st.r, t = (r[0] + r[1] + r[2]) || 1, w = (x) => Math.round(100 * x / t);
    h += '<div class="small"><b>' + (L.ch === "dev" ? "Déviation courante" : L.pun ? "Punir l'erreur" : "Sous-variante") + "</b> · " + (P && L.ch !== "dev" ? "elle dévie de « " + esc(P.name) + " » au coup " + (Math.floor(L.dv / 2) + 1) + ". " : "") + "Jouée dans " + String(L.st.sh).replace(".", ",") + " % des parties arrivées là (" + L.st.n.toLocaleString("fr-FR") + " sur " + L.st.nn.toLocaleString("fr-FR") + "). Résultats : Blancs " + w(r[0]) + " % · nulles " + w(r[1]) + " % · Noirs " + w(r[2]) + " %.</div>";
  } else if (M && M.n >= 30) {
    const r = M.r, t = (r[0] + r[1] + r[2]) || 1, w = (x) => Math.round(100 * x / t);
    h += '<div class="small">Cette ligne complète a été jouée dans ' + M.n.toLocaleString("fr-FR") + " parties Lichess. Résultats : Blancs " + w(r[0]) + " % · nulles " + w(r[1]) + " % · Noirs " + w(r[2]) + " %.</div>";
  }
  return h ? '<div class="card flat stack" style="gap:6px">' + h + '<div class="small muted">Source : ' + LI_GAMES.toLocaleString("fr-FR") + " parties Lichess de mai 2015 (Élo ≥ 1300, hors bullet).</div></div>" : "";
}
function trapChip(L) { return L.trap === "avoid" ? '<span class="chip bad">Piège à éviter</span>' : L.trap ? '<span class="chip good">Tu tends le piège</span>' : ""; }
function lineBtns(L) { return '<div class="row"><button class="btn small" data-act="learn" data-id="' + L.id + '">Étudier</button><button class="btn small primary" data-act="drill" data-id="' + L.id + '">' + (boxOf(L.id) >= 3 ? "Test" : "S\'entraîner") + "</button></div>"; }
function sideChip(side) { return '<span class="chip ' + side + '">' + (side === "w" ? "Blancs" : "Noirs") + "</span>"; }

/* ---------- Navigation ---------- */
const V = { layers: { out: 1, weak: 1, files: 1, ag: 1, ar: 1, ab: 1 }, open: {}, tab: "home", view: "home", stack: [], sid: null, opId: null, qs: {}, pgn: "", gres: null, gbusy: false, confirmReset: false };
const ICONS = {
  home: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/></svg>',
  rep: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/></svg>',
  strat: '<svg viewBox="0 0 24 24"><path d="M12 3l8 6-3 11H7L4 9z"/><path d="M9 20l3-9 3 9"/></svg>',
  plans: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M14 17h6M17 14v6"/></svg>',
  puz: '<svg viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
  games: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  prog: '<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-7"/></svg>'
};
const TABS = [["home", "Aujourd'hui", ["home", "week"]], ["rep", "Répertoire", ["rep"]], ["strat", "Stratégie", ["strat", "plans", "concepts", "pzpos"]], ["puz", "S'entraîner", ["puz", "pzth", "endg", "eglesson", "egex", "pzex", "mex", "mats", "wp", "mind"]], ["games", "Parties", ["games"]], ["prog", "Progrès", ["prog"]]];
const ROOTS = ["home", "rep", "strat", "puz", "games", "prog"];
const FOCUS_VIEWS = ["puzzle", "trainer", "vs", "rush", "plrev", "edit", "surprise"];
const VIEW_TITLES = { op: "Ouverture", struct: "Fiche de plan", trainer: "Entraînement", edit: "Éditeur de ligne", puzzle: "Problème", surprise: "Position surprise", vs: "Partie", rush: "Rafale", plrev: "Révision des fiches", mats: "Motifs de mat", wp: "Pic-vert", endg: "Finales", eglesson: "Leçon de finale", egex: "Exemple de finale", pzex: "Exemple résolu", mex: "Exemple d'exercice", pzth: "Tactiques par thème", stratc: "Concept", sac: "Sacrifice", sacs: "Sacrifices typiques", mind: "Menaces et calcul", ad: "Attaquer et défendre", week: "Plan de la semaine", plans: "Plans de jeu", concepts: "Concepts de stratégie", pzpos: "Problèmes de plans", pzth: "Tactiques par thème" };
function navBadge(id) {
  try {
    if (id === "home") { const st = sessionStats(); return st.total ? Math.max(0, st.total - st.done) : 0; }
    if (id === "strat") return plDueList().length;
  } catch (e) { return 0; }
  return 0;
}
function topbarHTML() {
  if (ROOTS.indexOf(V.view) >= 0) return "";
  let t = VIEW_TITLES[V.view] || "";
  if (V.view === "op" && V.opId && OP_BY_ID[V.opId]) t = OP_BY_ID[V.opId].name;
  if (V.view === "ad") t = V.adg === "def" ? "Défendre" : "Attaquer";
  if (V.view === "mats" && V.mt && MATS_BY[V.mt]) t = MATS_BY[V.mt][1];
  if (V.view === "wp" && V.wpsid && wpSet(V.wpsid)) t = wpSet(V.wpsid).title;
  return '<div class="topbar"><button class="tb-back" data-act="back" aria-label="Retour">' + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="tb-title">' + esc(t) + "</span></div>";
}
function appSegHTML() {
  return '<div class="seg subnav" role="group" aria-label="Apprendre">' + [["rep", "Répertoire"], ["plans", "Plans de jeu"], ["strat", "Stratégie"]].map((c) => '<button data-act="tab" data-v="' + c[0] + '" aria-pressed="' + (V.view === c[0]) + '">' + c[1] + "</button>").join("") + "</div>";
}
function setTab(t) { V.tab = t; V.view = t; V.stack = []; T = null; V.confirmReset = false; render(); window.scrollTo(0, 0); }
function go(view, extra) {
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = view; Object.assign(V, extra || {});
  render(); window.scrollTo(0, 0);
}
function goBack(fromPop) {
  /* Une entrée d'historique « tampon » existe tant qu'on est dans une vue secondaire. En revenant à la racine avec le bouton de l'appli, on la consomme, sinon le retour du navigateur resterait « un cran en retard ». */
  if (!fromPop && HB && V.stack.length === 1) { HB = false; try { IGN++; history.back(); setTimeout(function () { IGN = 0; }, 500); } catch (e) { IGN = 0; } }
  const p = V.stack.pop();
  if (V.view === "puzzle") { if (P && P.rush) rushStop(); P = null; }
  if (V.view === "surprise") X = null;
  if (!p) return setTab(V.tab);
  V.view = p.view; V.sid = p.sid; V.opId = p.opId; if (p.view !== "trainer") T = null; render();
}

/* ---------- Entraîneur ---------- */
let T = null;
let E = null;
let P = null;
let X = null;
let AC = null;
let VS = null;
let RU = null;
const PZ_FILTER = { op: "all", th: "all", by: "th", kind: "all" };
/* ---------- Coups difficiles : mémorisés pour être révisés ---------- */
const hk = (id, i) => id + ":" + i;
function markHard(id, i) {
  const k = hk(id, i), h = S.hard[k] || (S.hard[k] = { id, i, n: 0, ok: 0 });
  h.n++; h.ok = 0; h.last = todayStr(); save();
}
function hardOk(id, i) {
  const h = S.hard[hk(id, i)]; if (!h) return;
  h.ok++; if (h.ok >= 2) delete S.hard[hk(id, i)];
  save();
}
function hardList() {
  return Object.keys(S.hard || {}).map((k) => S.hard[k]).filter((h) => LINE_BY_ID[h.id] && LINE_BY_ID[h.id].sans[h.i])
    .sort((a, b) => (b.n - b.ok) - (a.n - a.ok) || (a.last < b.last ? 1 : -1));
}
function hardLabel(h) {
  const L = LINE_BY_ID[h.id], n = Math.floor(h.i / 2) + 1;
  return n + (h.i % 2 ? "..." : ".") + " " + dispSan(L.sans[h.i]);
}
function hardCardHTML(max) {
  const l = hardList(); if (!l.length) return "";
  let h = '<section class="card"><div class="row between"><span class="label">Coups difficiles à revoir</span><span class="chip bad">' + l.length + '</span></div><ul class="list">';
  l.slice(0, max).forEach((x) => {
    const L = LINE_BY_ID[x.id], op = OP_BY_ID[L.op];
    h += '<li style="padding:0"><button class="item sess" data-k="' + op.k + '" data-act="hardgo" data-id="' + x.id + '" data-i="' + x.i + '"><span class="grow"><span class="nm">' + esc(hardLabel(x)) + '</span><br><span class="small muted">' + esc(op.short) + " · " + esc(L.name) + '</span></span><span class="chip bad">' + x.n + " erreur" + (x.n > 1 ? "s" : "") + "</span></button></li>";
  });
  return h + "</ul>" + (l.length > max ? '<p class="small muted">+ ' + (l.length - max) + " autres dans l'onglet Progrès.</p>" : "") + "</section>";
}
function startTrainer(id, mode, fromSession, from) {
  const L = LINE_BY_ID[id], op = OP_BY_ID[L.op];
  T = { id, L, mode, fromSession: !!fromSession, user: op.side, g: new Chess(), idx: 0, errs: 0, wrong: 0, sel: null, tg: [], last: null,
    hint: null, flash: null, note: "", msg: "", lock: false, stage: "play", pick: null, shake: false, hintsUsed: 0, res: null, moveErr: false, partial: false };
  if (from != null) { T.partial = true; T.startIdx = from; for (let i = 0; i < from; i++) T.g.move(L.sans[i]); T.idx = from; T.last = from ? lastMoveOf(T.g) : null; T.note = L.notes[from - 1] || ""; }
  else if (mode !== "learn") autoOpp();
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = "trainer";
  render(); window.scrollTo(0, 0);
}
function lastMoveOf(g) {
  const h = g.history({ verbose: true }), m = h[h.length - 1];
  return m ? [m.from, m.to] : null;
}
function autoOpp() {
  while (T.idx < T.L.sans.length && T.g.turn() !== T.user) {
    T.g.move(T.L.sans[T.idx]); T.last = lastMoveOf(T.g); T.idx++;
  }
}
function learnStep(d) {
  if (!T || T.mode !== "learn") return;
  if (d === 1 || d === -1) sfx("move");
  if (d === 0) { T.g = new Chess(); T.idx = 0; }
  else if (d > 0 && T.idx < T.L.sans.length) { T.g.move(T.L.sans[T.idx]); T.idx++; }
  else if (d < 0 && T.idx > 0) { T.g.undo(); T.idx--; }
  else if (d === 99) { while (T.idx < T.L.sans.length) { T.g.move(T.L.sans[T.idx]); T.idx++; } }
  T.last = lastMoveOf(T.g);
  T.note = T.L.notes[T.idx - 1] || "";
  if (T.idx >= T.L.sans.length) markSeen(T.id);
  renderMain();
}
function expectedMove() {
  const g2 = new Chess(T.g.fen());
  return g2.move(T.L.sans[T.idx]);
}
function onSquare(sq) {
  if (V.view === "edit") return edSquare(sq);
  if (V.view === "puzzle") return puzSquare(sq);
  if (V.view === "surprise") return xSquare(sq);
  if (V.view === "mind") return mindSquare(sq);
  if (V.view === "vs") return vsSquare(sq);
  if (!T || T.stage !== "play" || T.mode === "learn" || T.lock) return;
  const g = T.g, p = g.get(sq);
  if (T.sel && T.tg.indexOf(sq) >= 0) { attempt(T.sel, sq); return; }
  if (p && p.color === T.user && g.turn() === T.user) {
    T.sel = sq; T.tg = g.moves({ square: sq, verbose: true }).map((m) => m.to);
  } else { T.sel = null; T.tg = []; }
  renderMain();
}
function attempt(from, to) {
  const g = T.g, exp = T.L.sans[T.idx];
  const mv = g.move({ from, to, promotion: "q" });
  if (!mv) return;
  T.sel = null; T.tg = []; T.flash = null; T.shake = false;
  if (norm(mv.san) === norm(exp)) { afterUserMove(mv, false); return; }
  g.undo();
  if (T.mode === "guide") { T.flash = to; T.shake = true; T.msg = "Joue le coup proposé par la flèche verte."; sfx("bad"); renderMain(); return; }
  T.errs++; T.wrong++; T.flash = to; T.shake = true; sfx("bad");
  if (!T.moveErr) { T.moveErr = true; markHard(T.id, T.idx); }
  const limit = T.mode === "test" ? 2 : 3;
  if (T.wrong >= limit) {
    const em = expectedMove();
    T.g.move(T.L.sans[T.idx]);
    T.msg = "Le coup attendu était " + dispSan(exp) + ". On continue.";
    afterUserMove(em, true);
    return;
  }
  T.msg = T.mode === "drill" ? "Ce n'est pas le coup du répertoire. Réessaie ou demande un indice." : "Ce n'est pas le coup du répertoire. Réessaie.";
  if (T.mode === "drill" && T.wrong >= 2) { const em = expectedMove(); T.hint = em.from; }
  renderMain();
}
function afterUserMove(mv, revealed) {
  if (!revealed) sfx("move");
  if (!T.moveErr && !revealed) hardOk(T.id, T.idx);
  T.moveErr = false;
  T.idx++; T.last = [mv.from, mv.to]; T.hint = null; T.wrong = 0; T.flash = null;
  if (!revealed) T.msg = "";
  T.note = T.L.notes[T.idx - 1] || "";
  if (T.idx >= T.L.sans.length) { finishPlay(); return; }
  T.lock = true; renderMain();
  setTimeout(() => {
    if (!T) return;
    T.g.move(T.L.sans[T.idx]); T.last = lastMoveOf(T.g); T.idx++;
    T.note = T.L.notes[T.idx - 1] || T.note;
    T.lock = false;
    if (T.idx >= T.L.sans.length) finishPlay(); else renderMain();
  }, 420);
}
function giveHint() {
  if (!T || T.mode !== "drill" || T.stage !== "play" || T.lock || T.hint) return;
  T.hint = expectedMove().from; T.errs++; T.hintsUsed++;
  if (!T.moveErr) { T.moveErr = true; markHard(T.id, T.idx); }
  T.msg = "Indice : la pièce à jouer est surlignée. Il compte comme une erreur.";
  renderMain();
}
function finishPlay() {
  T.lock = false;
  if (T.mode === "guide") { T.res = { guide: true }; T.stage = "result"; sfx("done"); renderMain(); return; }
  if (T.partial) {
    T.res = { errs: T.errs, partial: true }; T.stage = "result";
    logDay((l) => { l.h = (l.h || 0) + 1; l.e += T.errs; const o = LINE_BY_ID[T.id].op; l.o[o] = (l.o[o] || 0) + T.errs; });
    if (T.fromSession) markSessionDone("h:" + T.id + ":" + T.startIdx);
    save(); sfx(T.errs ? "bad" : "done"); renderMain(); return;
  }
  const before = boxOf(T.id);
  applyResult(T.id, T.errs, T.fromSession);
  T.res = { errs: T.errs, before, after: boxOf(T.id), due: S.lines[T.id].due, elo: eloStudy(T.L, T.errs) };
  save();
  T.stage = STRUCTS[T.L.struct].quiz ? "quiz" : "result";
  sfx(T.errs ? "ok" : "done");
  renderMain();
}
function answerQuiz(i) {
  const st = STRUCTS[T.L.struct]; if (T.pick !== null) return;
  T.pick = i; recordQuiz(T.L.struct, i === st.quiz.a);
  renderMain();
}
function recordQuiz(sid, ok) {
  const q = S.q[sid] || (S.q[sid] = { ok: 0, ko: 0 });
  if (ok) q.ok++; else q.ko++;
  save();
}

/* ---------- Vues ---------- */
var HB = false;
function ensureHist() { try { if (!HB && V.stack.length) { history.pushState({ a: 1 }, ""); HB = true; } } catch (e) {} }
var IGN = 0;
try { document.documentElement.lang = "fr"; window.addEventListener("popstate", function () { if (IGN > 0) { IGN--; return; } HB = false; if (V.stack.length) goBack(true); }); } catch (e) {}
function render() {
  ensureHist();
  $("#app").innerHTML = shellHTML(); sliderInit();
  const m = $("#main"); if (m) { m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter"); }
}
function renderMain() { const m = $("#main"); if (m) m.innerHTML = viewHTML(); sliderInit(); }

function shellHTML() {
  let nav = '<nav class="rail" aria-label="Navigation"><div class="brand"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="7" style="fill:var(--accent)"/><rect x="5" y="5" width="12" height="12" fill="#fff" opacity=".92"/><rect x="17" y="17" width="12" height="12" fill="#fff" opacity=".92"/><rect x="17" y="5" width="12" height="12" fill="#fff" opacity=".28"/><rect x="5" y="17" width="12" height="12" fill="#fff" opacity=".28"/></svg><span>Après<br>l\'ouverture</span></div>';
  TABS.forEach((t) => { const on = t[2].indexOf(V.tab) >= 0, nb = navBadge(t[0]); nav += '<button class="tab" data-act="tab" data-v="' + t[0] + '"' + (on ? ' aria-current="page"' : "") + '><span class="ic">' + ICONS[t[0]] + (nb ? '<i class="nbadge">' + nb + "</i>" : "") + '</span><span class="lb">' + t[1] + "</span></button>"; });
  nav += '<div class="sync small muted">' + (remote ? "Progression synchronisée sur ton compte" : "Progression enregistrée sur cet appareil") + "</div></nav>";
  return '<div class="shell' + (FOCUS_VIEWS.indexOf(V.view) >= 0 ? " focus" : "") + '">' + nav + '<main class="main" id="main">' + viewHTML() + "</main></div>";
}
function viewHTML() { return topbarHTML() + viewInner(); }
function viewInner() {
  switch (V.view) {
    case "home": return homeHTML();
    case "rep": return repHTML();
    case "op": return opHTML();
    case "plans": return plansHTML();
    case "struct": return structHTML();
    case "games": return gamesHTML();
    case "prog": return progHTML();
    case "trainer": return trainerHTML();
    case "edit": return E ? editHTML() : backBtn();
    case "puz": return puzHTML();
    case "puzzle": return puzzleHTML();
    case "surprise": return surpriseHTML();
    case "vs": return vsHTML();
    case "rush": return rushHTML();
    case "plrev": return plRevHTML();
    case "mats": return matsHTML();
    case "wp": return wpHTML();
    case "endg": return egHTML();
    case "eglesson": return egLessonHTML();
    case "egex": return egExHTML();
    case "pzex": return pzExHTML();
    case "mex": return mExHTML();
    case "strat": return stratHubHTML();
    case "concepts": return stratHTML();
    case "pzpos": return pzPosHTML();
    case "pzth": return pzThHTML();
    case "stratc": return stratcHTML();
    case "sacs": return sacsHTML();
    case "sac": return sacHTML();
    case "mind": return mindHTML();
    case "ad": return adHTML();
    case "week": return weekHTML();
  }
  return "";
}
var BACK_NAMES = { home: "Aujourd'hui", rep: "Répertoire", plans: "Plans de jeu", strat: "Stratégie", puz: "S'entraîner", games: "Parties", prog: "Progrès", week: "Plan de la semaine", mind: "Menaces et calcul", endg: "Finales", egex: "Exemple", pzex: "Problème", mex: "Exercice", ad: "Attaquer et défendre", wp: "Pic-vert", mats: "Motifs de mat", sacs: "Sacrifices", stratc: "Concept", concepts: "Concepts", pzpos: "Problèmes de plans" };
function prevLabel(def) {
  const p = V.stack[V.stack.length - 1]; if (!p) return def || "Retour";
  if (p.view === "op" && p.opId && OP_BY_ID[p.opId]) return OP_BY_ID[p.opId].short || OP_BY_ID[p.opId].name;
  if (p.view === "ad") return V.adg === "def" ? "Défendre" : "Attaquer";
  return BACK_NAMES[p.view] || def || "Retour";
}
function backBtn(label) { return '<button class="btn small back" data-act="back">← ' + esc(prevLabel(label)) + "</button>"; }

/* --- Accueil : séance du jour --- */
const WEEKS = [
  { t: "Semaine 1 · Découvrir", d: "Étudie une à deux nouvelles lignes par jour avec leurs commentaires, puis rejoue-les avec les indices. Lis une fiche de plan par jour." },
  { t: "Semaine 2 · Ancrer", d: "La répétition espacée te ramène les lignes au bon moment. Ajoute les variantes secondaires et passe les lignes principales en test à l'aveugle." },
  { t: "Semaine 3 · Comprendre", d: "Réponds au quiz de chaque structure et relis ses plans. Joue des parties d'entraînement qui arrivent dans ces positions." },
  { t: "Semaine 4 · Éprouver", d: "Importe tes parties, repère où tu quittes le répertoire et corrige. Fais un test à l'aveugle de tout ce qui est maîtrisé." }
];
const STRUCT_IDS = Object.keys(STRUCTS);
function trowHTML(ic, k, title, sub, right, attrs) {
  return '<li><button class="trow" data-k="' + k + '" ' + attrs + '><span class="tri" aria-hidden="true">' + ic + '</span><span class="stack" style="gap:1px;min-width:0"><b>' + esc(title) + '</b><span class="small muted">' + esc(sub) + "</span></span>" + (right ? '<span class="trc">' + esc(right) + "</span>" : "") + '<span class="chev" aria-hidden="true">›</span></button></li>';
}
function homeHTML() {
  ensureSession();
  const st = sessionStats(), t = todayStr();
  const dayIdx = Math.max(0, diffDays(S.start, t)), cyc = dayIdx % 28, wk = WEEKS[Math.floor(cyc / 7)];
  const sid = STRUCT_IDS[dayIdx % STRUCT_IDS.length];
  const due = LINES.filter((L) => isDue(L.id, t)).length, dg = dailyGet(), pn = plDueList().length, sk = currentStreak();
  let h = '<section class="card hero"><div class="row between"><div class="stack" style="gap:2px"><span class="label">Aujourd\'hui · séance du jour</span><h2 style="margin:0;font-size:1.15rem">' +
    (st.total && st.done === st.total ? "Séance terminée" : st.done + " sur " + st.total + " faites") + '</h2><span class="small muted">' + (sk ? "Série de " + sk + " jour" + (sk > 1 ? "s" : "") + " · " : "") + due + " ligne" + (due > 1 ? "s" : "") + ' à réviser</span></div>' +
    '<div class="seg" role="group" aria-label="Durée de la séance">';
  [5, 10, 20].forEach((m) => { h += '<button data-act="pace" data-v="' + m + '" aria-pressed="' + (S.pace === m) + '">' + m + " min</button>"; });
  h += "</div></div>";
  h += '<div class="bar" role="img" aria-label="Avancement"><i style="width:' + (st.total ? Math.round(100 * st.done / st.total) : 0) + '%"></i></div>';
  h += '<button class="btn primary big" style="width:100%;margin:10px 0" data-act="sessgo"' + (st.next ? "" : " disabled") + ">" + (st.done ? "Continuer la séance" : "Commencer la séance") + "</button>";
  const its = S.session.items || [], groups = [], gm = {};
  its.forEach((it) => {
    const hd = it.kind === "hard", L = LINE_BY_ID[hd ? it.line : it.id], key = hd ? "hard" : L.op;
    if (!gm[key]) { gm[key] = { key, items: [] }; groups.push(gm[key]); }
    gm[key].items.push(it);
  });
  groups.sort((x, y) => (x.key === "hard") - (y.key === "hard"));
  const itAttrs = (it) => 'data-act="sess" data-id="' + it.id + '" data-kind="' + it.kind + '"' + (it.kind === "hard" ? ' data-line="' + it.line + '" data-hi="' + it.hi + '"' : "");
  h += '<ul class="trows">';
  groups.forEach((gp) => {
    const todo = gp.items.filter((i) => !i.done), nn = todo.filter((i) => i.kind === "new").length, nr = todo.length - nn, dn = gp.items.length - todo.length;
    if (gp.key === "hard") {
      h += trowHTML("!", "red", "Coups difficiles", todo.length ? todo.length + " à revoir" : "Tout revu", dn + "/" + gp.items.length, todo[0] ? itAttrs(todo[0]) : 'data-act="tab" data-v="prog"');
    } else {
      const op = OP_BY_ID[gp.key];
      h += trowHTML(op.g, op.k, op.short, (nn ? nn + " nouvelle" + (nn > 1 ? "s" : "") : "") + (nn && nr ? " · " : "") + (nr ? nr + " à réviser" : "") || "Terminé", dn + "/" + gp.items.length, todo[0] ? itAttrs(todo[0]) : 'data-act="op" data-id="' + op.id + '"');
    }
  });
  if (!groups.length) h += '<li class="muted small" style="padding:6px 2px">Rien à réviser aujourd\'hui. Reviens demain, ou ouvre le répertoire pour t\'entraîner à la demande.</li>';
  const hl = hardList().length; if (hl && !gm.hard) h += trowHTML("!", "red", "Coups difficiles", hl + " à revoir", String(hl), 'data-act="hardgo" data-id="' + hardList()[0].id + '" data-i="' + hardList()[0].i + '"');
  if (Object.keys(STRUCTS).filter(plEligible).length) h += trowHTML("▦", "violet", "Fiches de plan", pn ? pn + " à réviser" : "Tout est à jour", pn ? String(pn) : "✓", 'data-act="plgo"');
  h += trowHTML(OP_BY_ID[STRUCTS[sid].op].g, OP_BY_ID[STRUCTS[sid].op].k, "Fiche du jour", STRUCTS[sid].title, "", 'data-act="struct" data-id="' + sid + '"');
  h += trowHTML("☀", "amber", "Défi du jour", dg.done.length + " sur " + dg.ids.length + " problèmes", dg.done.length + "/" + dg.ids.length, 'data-act="daily"');
  h += "</ul></section>\n\n";
  h += actCardHTML();
  h += homeRest(t, sid);
  return h;
}

/* --- Répertoire --- */
function repHTML() {
  const nch = OPENINGS.reduce((n, o) => n + CHAPTERS[o.id].filter((c) => LINES.some((L) => L.op === o.id && L.ch === c.id)).length, 0);
  if (!V.rpInit) { V.rpInit = true; if (V.open["rp-" + OPENINGS[0].id] == null) V.open["rp-" + OPENINGS[0].id] = true; }
  let h = '<div class="hdr"><h1>Répertoire</h1><p class="muted">' + OPENINGS.length + " ouvertures, " + LINES.length + " lignes en " + nch + ' chapitres. Chaque ligne se termine sur la fiche de plan de la structure obtenue.</p></div>';
  h += '<div class="chips2" role="group" aria-label="Actions"><button class="pill2" data-act="edadd" data-op="lon">+ Ajouter ma ligne</button></div>';
  OPENINGS.forEach((o) => {
    const ls_ = LINES.filter((L) => L.op === o.id), avg = ls_.reduce((a, L) => a + boxOf(L.id), 0) / (6 * Math.max(1, ls_.length)), seen = ls_.filter((L) => isSeen(L.id)).length;
    const open = !!V.open["rp-" + o.id], dueN = ls_.filter((L) => isDue(L.id, todayStr())).length;
    h += '<section class="acc" data-k="' + o.k + '"><button class="acc-h" data-act="chtoggle" data-id="rp-' + o.id + '" aria-expanded="' + open + '"><span class="ava">' + o.g + '</span><span class="stack" style="gap:1px;min-width:0"><b>' + esc(o.name) + '</b><span class="small muted">' + (o.side === "w" ? "avec les Blancs" : "avec les Noirs") + " · " + seen + " sur " + ls_.length + " vues" + (dueN ? " · " + dueN + " à réviser" : "") + '</span></span><span class="trc">' + Math.round(avg * 100) + ' %</span><span class="chev" aria-hidden="true">' + (open ? "▾" : "▸") + '</span></button><span class="bar"><i style="width:' + Math.round(avg * 100) + '%"></i></span>';
    if (open) {
      h += '<div class="acc-b"><p class="small muted">' + esc(o.blurb) + "</p>";
      CHAPTERS[o.id].filter((c) => ls_.some((L) => L.ch === c.id)).forEach((c) => {
        const cl = ls_.filter((L) => L.ch === c.id), cs = cl.filter((L) => isSeen(L.id)).length;
        h += '<button class="acc-r" data-act="rpch" data-op="' + o.id + '" data-ch="' + c.id + '"><span>' + (c.id === "pieges" ? "⚠ " : "") + esc(c.t) + '</span><span class="small muted">' + cs + "/" + cl.length + "</span></button>";
      });
      h += '<button class="acc-r" data-act="op" data-id="' + o.id + '"><span><b>Ouvrir toute l\'ouverture</b></span><span aria-hidden="true">›</span></button></div>';
    }
    h += "</section>";
  });
  return h;
}
function opHTML() {
  const o = OP_BY_ID[V.opId], chs = CHAPTERS[o.id];
  if (!V.opInit) V.opInit = {};
  if (!V.opInit[o.id]) { V.opInit[o.id] = true; V.open[o.id + "-" + chs[0].id] = true; }
  const opSacs = SACS.filter((x) => x.op === o.id), chsS = opSacs.length ? chs.filter((c) => c.id !== "perso").concat([{ id: "sacs", t: "Sacrifices typiques", d: "Les sacrifices classiques de cette ouverture : ceux que tu joues, ceux à éviter, ceux que l'adversaire tente", c: "amber" }], chs.filter((c) => c.id === "perso")) : chs;
  const shown = chsS.filter((c) => c.id === "perso" || c.id === "sacs" || LINES.some((L) => L.op === o.id && L.ch === c.id));
  let h = backBtn("Répertoire") + '<div class="hdr kh" data-k="' + o.k + '"><div class="row"><span class="ava sm">' + o.g + "</span><h1>" + esc(o.name) + "</h1>" + sideChip(o.side) + '</div><p class="muted">' + esc(o.blurb) + "</p></div>";
  if (V.flash) { h += '<div class="note good" role="status">' + esc(V.flash) + "</div>"; V.flash = ""; }
  h += '<div class="row"><button class="btn primary small" data-act="edadd" data-op="' + o.id + '">+ Ajouter ma ligne</button></div>';
  h += '<nav class="chnav" aria-label="Chapitres">' + shown.map((c, i) => '<button class="pill" data-k="' + c.c + '" data-act="jump" data-id="' + o.id + "-" + c.id + '">' + (c.id === "pieges" ? "⚠ " : i + 1 + ". ") + esc(c.t) + "</button>").join("") + "</nav>";
  shown.forEach((c, i) => {
    const ls_ = LINES.filter((L) => L.op === o.id && L.ch === c.id);
    if (c.id === "sacs") {
      const sn = opSacs.filter((x) => stSeen("sac-" + x.id)).length, so = !!V.open[o.id + "-sacs"];
      h += '<section class="chap" id="ch-' + o.id + '-sacs" data-k="amber"><button class="chap-h" data-act="chtoggle" data-id="' + o.id + '-sacs" aria-expanded="' + so + '"><span class="num">✦</span><div class="grow stack" style="gap:2px"><h2>' + esc(c.t) + '</h2><span class="small muted">' + esc(c.d) + '</span><span class="bar" style="margin-top:4px"><i style="width:' + Math.round(100 * sn / opSacs.length) + '%"></i></span></div><span class="cnt">' + sn + "/" + opSacs.length + '<br>vus</span><span class="chev" aria-hidden="true">' + (so ? "▾" : "▸") + "</span></button>";
      if (so) { h += '<div class="stack">'; opSacs.forEach((s2) => { h += '<button class="item sess' + (stSeen("sac-" + s2.id) ? " done" : "") + '" data-k="' + (s2.who === "toi" ? "green" : "amber") + '" data-act="sac" data-id="' + s2.id + '"><span class="check' + (stSeen("sac-" + s2.id) ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + esc(s2.name) + '</b><span class="small muted">' + (s2.who === "toi" ? "Tu le joues" : s2.who === "contre" ? "Contre toi" : "À éviter") + " · " + esc(s2.tag) + '</span></div></button>'; }); h += "</div>"; }
      h += "</section>"; return;
    }
    const seen = ls_.filter((L) => isSeen(L.id)).length, avg = ls_.length ? ls_.reduce((x, L) => x + boxOf(L.id), 0) / (6 * ls_.length) : 0;
    const isOpen = !!V.open[o.id + "-" + c.id];
    h += '<section class="chap" id="ch-' + o.id + "-" + c.id + '" data-k="' + c.c + '"><button class="chap-h" data-act="chtoggle" data-id="' + o.id + "-" + c.id + '" aria-expanded="' + isOpen + '"><span class="num">' + (c.id === "pieges" ? "⚠" : i + 1) + '</span><div class="grow stack" style="gap:2px"><h2>' + esc(c.t) + '</h2><span class="small muted">' + esc(c.d) + '</span><span class="bar" style="margin-top:4px"><i style="width:' + Math.round(avg * 100) + '%"></i></span></div><span class="cnt">' + seen + "/" + ls_.length + '<br>vues</span><span class="chev" aria-hidden="true">' + (isOpen ? "▾" : "▸") + "</span></button>";
    if (!isOpen) { h += "</section>"; return; }
    if (c.id === "pieges") h += '<div class="legend"><span><span class="chip good">Tu tends le piège</span> ton adversaire peut tomber dedans</span><span><span class="chip bad">Piège à éviter</span> le coup tentant qu\'il ne faut pas jouer</span></div>';
    if (c.id === "perso" && !ls_.length) h += '<div class="card flat"><p class="muted">Tu n\'as pas encore de ligne personnelle dans cette ouverture. Ajoute-en une avec tes propres coups et commentaires.</p><div class="row"><button class="btn primary small" data-act="edadd" data-op="' + o.id + '">+ Ajouter ma ligne</button></div></div>';
    ls_.forEach((L) => {
      const dl = dueLabel(L.id), s = STRUCTS[L.struct];
      h += '<div class="card line" style="gap:10px"><div class="row between"><div class="stack"><span class="nm" style="font-weight:700">' + esc(L.name) + '</span><span class="small muted">' + esc(s.title) + '</span></div><div class="chips">' + trapChip(L) + (L.lx ? '<span class="chip k" data-k="orange">' + (L.ch === "dev" ? "Déviation" : L.pun ? "Punir l'erreur" : "Sous-variante") + " · " + String(L.st.sh).replace(".", ",") + " %</span>" : "") + '<span class="chip ' + dl.c + '">' + dl.t + "</span></div></div>" +
        '<div class="row between">' + dots(boxOf(L.id)) + lineBtns(L) + "</div>" +
        (L.custom ? (V.confirmDel === L.id ? '<div class="row"><span class="small">Supprimer cette ligne et sa progression ?</span><button class="btn small" style="border-color:var(--bad);color:var(--bad)" data-act="eddel2" data-id="' + L.id + '">Oui, supprimer</button><button class="btn small" data-act="eddelno">Annuler</button></div>' : '<div class="row"><button class="btn small" data-act="edit" data-id="' + L.id + '">Modifier</button><button class="btn small" data-act="eddel" data-id="' + L.id + '">Supprimer</button><span class="chip k" data-k="teal">' + (L.parent ? "Variante" : "Ma ligne") + "</span></div>") : "") +
        '<div class="row"><button class="btn small" data-act="edbranch" data-id="' + L.id + '">+ Sous-variante</button><button class="btn small" data-act="vsline" data-id="' + L.id + '">Jouer la suite</button>' + (L.parent && LINE_BY_ID[L.parent] ? '<span class="small muted">de « ' + esc(LINE_BY_ID[L.parent].name) + " »</span>" : "") + "</div></div>";
    });
    h += "</section>";
  });
  return h;
}

/* --- Plans --- */
function plansHTML() {
  let h = '<div class="hdr"><h1>Plans de milieu de jeu</h1><p class="muted">Une fiche par structure de pions obtenue après l\'ouverture : où placer les pièces, quelle cassure préparer, ce que veut l\'adversaire.</p></div>';
  OPENINGS.forEach((o) => {
    h += '<div class="ophead" data-k="' + o.k + '"><span class="ava sm">' + o.g + "</span><h2>" + esc(o.short) + "</h2>" + sideChip(o.side) + "</div>";
    STRUCT_IDS.filter((id) => STRUCTS[id].op === o.id).forEach((id) => {
      const s = STRUCTS[id], q = S.q[id];
      h += '<button class="item" data-act="struct" data-id="' + id + '"><span class="grow"><span class="nm">' + esc(s.title) + '</span><br><span class="small muted">' + esc(s.tag) + "</span></span>" + (q && q.ok ? '<span class="chip good">Quiz réussi</span>' : "") + "</button>";
    });
  });
  h += '<section class="card"><h3>Sources</h3><ul class="sources small muted">' + SOURCES.map((s) => "<li>" + esc(s.t) + "</li>").join("") + "</ul><p class=\"small muted\">Les lignes sont pédagogiques. Avant un tournoi, vérifie-les dans l'explorateur d'ouvertures de Lichess.</p></section>";
  return h;
}
function structHTML() {
  const sid = V.sid, s = STRUCTS[sid], rep = LINE_BY_ID[s.rep], op = OP_BY_ID[s.op];
  const g = lineGame(rep), sel = V.qs[sid];
  const li = (a, c) => '<ul class="list ' + (c || "") + '">' + a.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  let h = backBtn("Retour") + '<div class="hdr kh" data-k="' + op.k + '"><div class="row"><h1>' + esc(s.title) + "</h1></div><div class=\"row\">" + sideChip(op.side) + '<span class="chip k" data-k="' + op.k + '">' + esc(op.short) + '</span></div><p class="muted">' + esc(s.tag) + "</p></div>";
  const viz = VIZ[sid];
  h += '<div class="trainer"><div class="stack">' + boardHTML(g, { orient: op.side, marks: viz ? [] : s.squares, last: lastMoveOf(g) || [], live: false, viz, layers: V.layers }) +
    (viz ? vizLegendHTML(viz) + '<p class="small muted">Position après la ligne « ' + esc(rep.name) + ' ». Touche une couleur pour afficher ou masquer les repères : cercles verts = cases clés, rouges = cases faibles ou cibles, bandes bleues = colonnes et diagonales, flèches vertes = ton plan, rouges = menaces adverses, bleues = cassures de pions.</p>' : '<p class="small muted">Position après la ligne « ' + esc(rep.name) + ' ». Les cases cerclées sont les cases clés.</p>') + '</div><div class="stack" style="gap:14px">';
  h += structIllHTML(sid);
  h += '<div class="card"><span class="label">Tes plans</span>' + li(s.plans) + "</div>";
  h += '<div class="card"><span class="label">Plans de l\'adversaire</span>' + li(s.opp, "opp") + "</div>";
  h += '<div class="card"><span class="label">Cassures</span>' + li(s.breaks) + "</div>";
  h += '<div class="card"><span class="label">Erreurs à éviter</span>' + li(s.mistakes, "warnl") + "</div>";
  h += aiBoxHTML("s:" + sid);
  h += "</div></div>";
  h += '<section class="card"><span class="label">Vérifie que tu as compris</span><h3>' + esc(s.quiz.q) + '</h3><div class="stack">';
  s.quiz.opts.forEach((o, i) => {
    const cls = sel == null ? "" : i === s.quiz.a ? " ok" : i === sel ? " ko" : "";
    h += '<button class="opt' + cls + '" data-act="sq" data-id="' + sid + '" data-i="' + i + '"' + (sel != null ? " disabled" : "") + ">" + esc(o) + "</button>";
  });
  h += "</div>";
  if (sel != null) h += '<div class="note ' + (sel === s.quiz.a ? "good" : "bad") + '"><b>' + (sel === s.quiz.a ? "Exact." : "Pas tout à fait.") + "</b> " + esc(s.quiz.why) + '</div><div><button class="btn small" data-act="sqreset" data-id="' + sid + '">Refaire le quiz</button></div>';
  h += "</section>";
  h += '<section class="card"><span class="label">Lignes qui mènent à cette structure</span>';
  LINES.filter((L) => L.struct === sid).forEach((L) => {
    h += '<div class="row between"><span class="nm">' + esc(L.name) + '</span><div class="row"><button class="btn small" data-act="learn" data-id="' + L.id + '">Étudier</button><button class="btn small primary" data-act="drill" data-id="' + L.id + '">' + (boxOf(L.id) >= 3 ? "Test" : "S'entraîner") + "</button></div></div>";
  });
  return h + "</section>";
}

/* --- Entraîneur --- */
function learnNavHTML() {
  const n = T.L.sans.length;
  return '<div class="navrow" role="group" aria-label="Parcourir les coups">' +
    '<button class="btn" data-act="lstep" data-d="0" aria-label="Début"' + (T.idx === 0 ? " disabled" : "") + ">«</button>" +
    '<button class="btn" data-act="lstep" data-d="-1" aria-label="Coup précédent"' + (T.idx === 0 ? " disabled" : "") + ">‹</button>" +
    '<button class="btn primary" data-act="lstep" data-d="1" aria-label="Coup suivant"' + (T.idx >= n ? " disabled" : "") + ">›</button>" +
    '<button class="btn" data-act="lstep" data-d="99" aria-label="Fin"' + (T.idx >= n ? " disabled" : "") + ">»</button></div>";
}
function nextMoveHTML() {
  const L = T.L, i = T.idx, mine = (i % 2 === 0) === (T.user === "w"), n = Math.floor(i / 2) + 1;
  const hard = S.hard && S.hard[hk(T.id, i)];
  return '<div class="note ' + (mine ? "good" : "") + '"><b>' + (mine ? "Ton coup" : "Réponse de l'adversaire") + " : " + n + (i % 2 ? "..." : ".") + " " + esc(dispSan(L.sans[i])) + "</b>" +
    (hard ? ' <span class="chip bad">⚠ coup difficile</span>' : "") + '<br><span class="small muted">La flèche verte montre le coup. Appuie sur › pour le jouer.</span></div>';
}
function trainerHTML() {
  if (!T) return backBtn() + '<p class="muted">Aucune ligne en cours.</p>';
  const L = T.L, op = OP_BY_ID[L.op], mode = T.mode;
  const modeLbl = mode === "learn" ? "1 · Étude" : mode === "guide" ? "2 · Accompagné" : mode === "drill" ? "3 · Seul, avec indices" : "Test à l'aveugle";
  let h = backBtn(T.fromSession ? "Séance" : "Retour") + '<div class="hdr"><div class="row"><span class="chip acc">' + modeLbl + "</span>" + sideChip(op.side) + '<span class="chip k" data-k="' + op.k + '">' + esc(op.short) + "</span>" + (chapOf(L) ? '<span class="chip k" data-k="' + chapOf(L).c + '">' + (L.ch === "pieges" ? "⚠ " : "") + esc(chapOf(L).t) + "</span>" : "") + trapChip(L) + "</div><h1>" + esc(L.name) + "</h1></div>";
  let nextViz = null;
  if ((mode === "learn" || (mode === "guide" && !T.lock && T.g.turn() === T.user)) && T.stage === "play" && T.idx < L.sans.length) { const nm = new Chess(T.g.fen()).move(L.sans[T.idx]); if (nm) nextViz = { arr: [[nm.from, nm.to, "g"]] }; }
  h += '<div class="trainer"><div class="stack">' + boardHTML(T.g, { orient: T.user, sel: T.sel, tg: T.tg, last: T.last || [], hint: T.hint, flash: T.flash, live: mode !== "learn" && T.stage === "play" && !T.lock, shake: T.shake, viz: nextViz, layers: { ag: 1 } });
  if (mode === "learn" && T.stage === "play") h += learnNavHTML();
  h += "</div>";
  T.shake = false;
  h += '<div class="stack" style="gap:12px">';
  if (T.stage === "play") {
    if (mode === "learn") {
      h += '<div class="card"><span class="label">Coups</span>' + movesHTML(L.sans, T.idx, true) + "</div>";
      h += sfEvalHTML(T.g);
      h += '<div class="note' + (T.note ? "" : " warn") + '">' + (T.note ? esc(T.note) : (T.idx === 0 ? "Avance coup par coup. Les commentaires expliquent les idées clés." : "Pas de commentaire sur ce coup. Continue.")) + liMoveNote(L, T.idx - 1) + "</div>";
      if (T.idx === 0) h += liInfoHTML(L) + masterTeaser(L);
      h += '<div class="row"><button class="btn small" data-act="edbranch" data-id="' + L.id + '" data-ply="' + T.idx + '">Ajouter une variante à partir d\'ici</button><button class="btn small" data-act="vsline" data-id="' + L.id + '" data-ply="' + T.idx + '">Jouer la suite contre le moteur</button></div>';
      if (T.idx < L.sans.length) h += nextMoveHTML();
      if (T.idx >= L.sans.length) h += '<div class="card flat"><b>Ligne terminée.</b><p class="muted">Étape suivante : rejoue-la toi-même, l\'appli te propose chaque coup avec une flèche.</p><div class="row"><button class="btn primary" data-act="toguide">Jouer avec les propositions</button><button class="btn" data-act="struct" data-id="' + L.struct + '">Voir le plan</button></div></div>';
      if (T.idx >= L.sans.length) h += masterHTML(L);
    } else {
      const total = L.sans.length, mine = Math.ceil((total - (op.side === "w" ? 0 : 1)) / 2);
      const nextMove = Math.floor(T.idx / 2) + 1;
      h += '<div class="card"><span class="label">Coups joués</span>' + (T.idx ? movesHTML(L.sans, T.idx, false) : '<p class="muted">Aucun coup pour l\'instant.</p>') + "</div>";
      h += '<div class="note' + (T.msg ? " bad" : "") + '">' + (T.msg ? esc(T.msg) : T.note ? esc(T.note) : (mode === "guide" && T.idx < L.sans.length ? "À toi : " + nextMove + (T.user === "w" ? ". " : "... ") + dispSan(L.sans[T.idx]) + ". Suis la flèche verte : touche la pièce, puis sa case d'arrivée." : "À toi de jouer le coup " + nextMove + ". Touche une pièce, puis sa case d'arrivée.")) + "</div>";
      if (T.msg && T.note) h += '<div class="note">' + esc(T.note) + "</div>";
      h += '<div class="row">' + (mode === "drill" ? '<button class="btn" data-act="hint"' + (T.hint || T.lock ? " disabled" : "") + ">Indice</button>" : "") + '<span class="chip' + (T.errs ? " bad" : " good") + '">' + T.errs + " erreur" + (T.errs > 1 ? "s" : "") + "</span><span class=\"small muted\">" + mine + " coups à jouer dans cette ligne</span></div>";
    }
  }
  if (T.stage === "quiz") {
    const q = STRUCTS[L.struct].quiz;
    h += '<div class="note good"><b>Ligne terminée.</b> Voyons si tu as compris le plan qui en découle.</div><div class="card"><span class="label">Question sur la structure</span><h3>' + esc(q.q) + '</h3><div class="stack">';
    q.opts.forEach((o, i) => {
      const cls = T.pick == null ? "" : i === q.a ? " ok" : i === T.pick ? " ko" : "";
      h += '<button class="opt' + cls + '" data-act="tq" data-i="' + i + '"' + (T.pick != null ? " disabled" : "") + ">" + esc(o) + "</button>";
    });
    h += "</div>";
    if (T.pick != null) h += '<div class="note ' + (T.pick === q.a ? "good" : "bad") + '"><b>' + (T.pick === q.a ? "Exact." : "Pas tout à fait.") + "</b> " + esc(q.why) + '</div><button class="btn primary" data-act="toresult">Voir le bilan</button>';
    h += "</div>";
  }
  if (T.stage === "result") {
    const r = T.res;
    if (r.guide) {
      h += '<div class="card"><span class="label">Étape 2 terminée</span><h2>Ligne jouée avec les propositions</h2><p class="muted">Maintenant, joue-la toi-même : tu n\'as plus la flèche, seulement un indice si tu bloques.</p><div class="row"><button class="btn primary" data-act="todrill">Jouer la ligne seul</button><button class="btn" data-act="toguide">Refaire avec les propositions</button><button class="btn" data-act="struct" data-id="' + L.struct + '">Voir le plan</button></div></div></div></div>';
      return h;
    }
    if (r.partial) {
      h += '<div class="card"><span class="label">Révision du coup</span><h2>' + (r.errs === 0 ? "Sans faute" : r.errs + " erreur" + (r.errs > 1 ? "s" : "")) + "</h2><p class=\"muted\">" + (r.errs === 0 ? "Bien joué : réussis-le encore une fois sans faute et il sortira de ta liste de coups difficiles." : "Il reste dans ta liste de coups difficiles.") + '</p><div class="row">' + (T.fromSession && sessionStats().next ? '<button class="btn primary" data-act="sessgo">Suivant</button>' : '<button class="btn primary" data-act="back">Retour</button>') + '<button class="btn" data-act="again">Rejouer la ligne entière</button></div></div>';
      h += "</div></div>"; return h;
    }
    const up = r.after > r.before;
    const days = Math.max(0, diffDays(todayStr(), r.due));
    h += '<div class="card"><span class="label">Bilan</span><h2>' + (r.errs === 0 ? "Sans faute" : r.errs + " erreur" + (r.errs > 1 ? "s" : "")) + "</h2>" +
      '<div class="row">' + dots(r.after) + '<span class="chip ' + (up ? "good" : r.errs > 2 ? "bad" : "") + '">' + (up ? "Niveau en hausse" : r.errs > 2 ? "Niveau en baisse" : "Niveau stable") + "</span></div>" +
      '<div class="row">' + eloChip(r.elo) + '<span class="small muted">ligne cotée ' + (r.elo ? r.elo.opp : "") + "</span></div>" + '<p class="muted">Prochaine révision ' + (days === 0 ? "aujourd'hui" : days === 1 ? "demain" : "dans " + days + " jours") + ".</p>" +
      '<div class="row">';
    const st = sessionStats();
    if (T.fromSession && st.next) h += '<button class="btn primary" data-act="sessgo">Ligne suivante</button>';
    else if (T.fromSession) h += '<button class="btn primary" data-act="tab" data-v="home">Terminer la séance</button>';
    h += '<button class="btn" data-act="struct" data-id="' + L.struct + '">Voir le plan</button><button class="btn" data-act="again">Rejouer la ligne</button></div></div>';
  }
  if (mode === "learn" || T.stage === "result") h += aiBoxHTML("t:" + L.id + ":" + T.g.history().length);
  h += "</div></div>";
  return h;
}

/* --- Parties : analyse du PGN --- */
let BOOKS = null;
const SAMPLE_PGN = `[Event "Exemple"]
[White "toi"]
[Black "adversaire1"]
[Result "1-0"]

1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3 b6 9. Ne5 Bb7 10. f4 Qe7 11. O-O 1-0

[Event "Exemple"]
[White "toi"]
[Black "adversaire2"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O Nf6 8. cxd4 0-1

[Event "Exemple"]
[White "adversaire3"]
[Black "toi"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O 1/2-1/2

[Event "Exemple"]
[White "adversaire4"]
[Black "toi"]
[Result "0-1"]

1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. Nc3 d6 7. d5 Na6 8. Rb1 c6 9. dxc6 bxc6 0-1`;

function plyLabel(ply) { return Math.floor(ply / 2) + 1 + (ply % 2 === 0 ? "." : "...") + " "; }
function analyseGame(g, color) {
  const BOOK = BOOKS[color], hist = g.history(), t = new Chess(), out = { inBook: 0, dev: null };
  for (let i = 0; i < hist.length; i++) {
    const mover = i % 2 === 0 ? "w" : "b", mine = mover === color, mv = hist[i], n = norm(mv), e = BOOK.get(posKey(t));
    if (!e) { out.dev = { type: "end", ply: i, move: mv, fen: t.fen() }; break; }
    if (!e.moves.has(n)) {
      const ids = new Set(); e.moves.forEach((s) => s.forEach((x) => ids.add(x)));
      out.dev = { type: mine ? "me" : "opp", ply: i, move: mv, exp: Array.from(e.moves.keys()), ids: Array.from(ids), fen: t.fen(), hist: hist.slice(0, i + 1) };
      break;
    }
    out.inBook = i + 1; t.move(mv);
  }
  return out;
}
async function analyseText(text, user) {
  if (!BOOKS) BOOKS = { w: buildBook("w"), b: buildBook("b") };
  text = String(text).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const chunks = text.split(/\n(?=\[Event )/).map((s) => s.trim()).filter((s) => /\b1\./.test(s));
  const names = {};
  const res = { total: chunks.length, bad: 0, skipped: 0, games: [] };
  const u = user.trim().toLowerCase();
  for (let i = 0; i < chunks.length; i++) {
    const g = new Chess();
    let ok = false;
    try { ok = g.load_pgn(chunks[i], { sloppy: true }); } catch (e) { ok = false; }
    if (!ok) { res.bad++; continue; }
    const h = g.header(), w = (h.White || "").toLowerCase(), b = (h.Black || "").toLowerCase();
    [h.White, h.Black].forEach((n) => { if (n) names[n] = (names[n] || 0) + 1; });
    const color = w === u ? "w" : b === u ? "b" : null;
    if (!color) { res.skipped++; continue; }
    const r = h.Result, win = (color === "w" && r === "1-0") || (color === "b" && r === "0-1"), loss = (color === "w" && r === "0-1") || (color === "b" && r === "1-0");
    const a = analyseGame(g, color);
    res.games.push({ color, score: win ? 1 : loss ? 0 : r === "1/2-1/2" ? 0.5 : null, inBook: a.inBook, dev: a.dev, len: g.history().length, moves: g.history(), opp: color === "w" ? h.Black : h.White });
    if (i % 25 === 24) { const el = $("#gprog"); if (el) el.textContent = "Analyse : " + (i + 1) + " / " + chunks.length; await new Promise((rr) => setTimeout(rr, 0)); }
  }
  const top = Object.keys(names).sort((x, y) => names[y] - names[x])[0];
  if (top) res.guess = top;
  return res;
}
function groupDev(games, type) {
  const m = new Map();
  games.forEach((x) => {
    if (!x.dev || x.dev.type !== type) return;
    const k = x.dev.fen + "|" + x.dev.move;
    const e = m.get(k) || { d: x.dev, n: 0, color: x.color };
    e.n++; m.set(k, e);
  });
  return Array.from(m.values()).sort((a, b) => b.n - a.n).slice(0, 6);
}
function avgScore(arr) { const s = arr.filter((x) => x.score != null); return s.length ? s.reduce((a, x) => a + x.score, 0) / s.length : null; }
function pct(x) { return x == null ? "n/a" : Math.round(x * 100) + " %"; }
function gamesHTML() {
  let h = '<div class="hdr"><h1>Mes parties</h1><p class="muted">Colle le PGN exporté de Lichess ou de Chess.com, ou charge le fichier. L\'appli compare tes coups à ton répertoire et te dit où tu en sors.</p></div>';
  h += '<section class="card"><label class="stack" for="guser"><span class="label">Ton pseudo exact dans les parties</span><input type="text" id="guser" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(S.user) + '" placeholder="par exemple : toi"></label>' +
    '<label class="stack" for="gpgn"><span class="label">Parties au format PGN</span><textarea id="gpgn" placeholder="[Event &quot;…&quot;]&#10;1. d4 d5 2. Nf3 …" spellcheck="false">' + esc(V.pgn) + "</textarea></label>" +
    '<div class="row"><button class="btn primary" data-act="analyse"' + (V.gbusy ? " disabled" : "") + '>Analyser</button><label class="btn" for="gfile" style="display:inline-flex;align-items:center">Charger un fichier</label><input type="file" id="gfile" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" tabindex="-1"><button class="btn" data-act="paste">Coller</button><button class="btn" data-act="sample">Essayer avec un exemple</button><span class="small muted" id="gprog" role="status"></span></div>' +
    '<div class="row" style="margin-top:4px"><a class="btn" id="glink" href="https://lichess.org/games/export/' + encodeURIComponent(S.user || "Polo60") + '?max=100&opening=false&clocks=false&evals=false" target="_blank" rel="noopener noreferrer">1. Télécharger mes parties Lichess (PGN)</a><span class="small muted">puis 2. « Charger un fichier », puis « Analyser »</span></div>' +
    '<p class="small muted">Les sites ne laissent pas cette page se connecter à ton compte : l\'export public se fait dans un onglet Lichess, sans mot de passe saisi ici. Pour Chess.com : télécharge les archives mensuelles en PGN. Les données restent dans ton navigateur.</p></section>';
  h += '<section class="card"><span class="label">Jouer</span><p class="muted">Affronte Stockfish ou Maia (qui joue comme un humain) à ton niveau : ta cote « Parties » est de ' + eloS().g + '.</p><button class="btn primary" data-act="vsopen">Jouer une partie</button></section>';
  h += '<div id="gres">' + gresHTML() + "</div>";
  return h;
}
function devRow(e, type, idx) {
  const d = e.d, ids = (d.ids || []).slice(0, 3).map((i) => LINE_BY_ID[i].name);
  let t = "<tr><td class=\"mono\">" + e.n + "×</td><td><b class=\"mono\">" + esc(plyLabel(d.ply) + dispSan(d.move)) + "</b>";
  if (type === "me") t += "<br><span class=\"small muted\">Attendu : " + esc((d.exp || []).slice(0, 3).map(dispSan).join(", ")) + "</span>";
  else t += "<br><span class=\"small muted\">Pas dans ton répertoire</span>";
  t += "</td><td class=\"small\">" + (ids.length ? esc(ids.join(" · ")) : "") + "</td><td>";
  if (type === "me" && d.ids && d.ids.length) t += '<button class="btn small" data-act="queue" data-ids="' + d.ids.join(",") + '">Réviser</button>';
  if (type === "opp") t += '<button class="btn small" id="prep' + idx + '" data-act="prep" data-i="' + idx + '">Préparer</button>';
  t += "</td></tr>";
  return t;
}
function gresHTML() {
  const r = V.gres;
  if (!r) return '<section class="card flat"><p class="muted">Aucune analyse pour l\'instant. Les résultats apparaissent ici : profondeur dans le livre, sorties de répertoire, nouveautés de tes adversaires.</p></section>';
  if (!r.games.length) return '<section class="card"><h3>Aucune partie reconnue</h3><p class="muted">' + r.total + " partie(s) lues, " + r.skipped + " sans ton pseudo, " + r.bad + " illisible(s). Vérifie l'orthographe du pseudo, il doit être identique à celui des en-têtes PGN.</p>" + (r.guess && r.guess.toLowerCase() !== (S.user || "").trim().toLowerCase() ? '<p>Le pseudo le plus fréquent dans ces parties est <b>' + esc(r.guess) + '</b>. <button class="btn small" data-act="useguess" data-v="' + esc(r.guess) + '">Utiliser ce pseudo et relancer</button></p>' : "") + "</section>";
  const gs = r.games, inB = gs.filter((x) => x.inBook > 0), me = gs.filter((x) => x.dev && x.dev.type === "me"), kept = gs.filter((x) => !(x.dev && x.dev.type === "me"));
  const depth = gs.length ? gs.reduce((a, x) => a + x.inBook, 0) / gs.length / 2 : 0;
  let h = '<section class="card"><span class="label">Résumé</span><div class="grid3">' +
    '<div class="stat"><span class="label">Parties</span><b>' + gs.length + '</b><span class="small muted">sur ' + r.total + " lues</span></div>" +
    '<div class="stat"><span class="label">Dans le livre</span><b>' + inB.length + '</b><span class="small muted">profondeur moyenne ' + depth.toFixed(1) + " coups</span></div>" +
    '<div class="stat"><span class="label">Sorties à toi</span><b>' + me.length + '</b><span class="small muted">tu as quitté le répertoire</span></div></div>' +
    '<p class="muted">Score quand tu restes dans ton répertoire : <b>' + pct(avgScore(kept)) + "</b>. Quand tu en sors : <b>" + pct(avgScore(me)) + "</b>.</p></section>";
  const mine = groupDev(gs, "me"), opp = groupDev(gs, "opp"); V.prepList = opp;
  h += '<section class="card"><span class="label">Là où tu quittes ton répertoire</span>';
  h += mine.length ? '<div class="scroll"><table class="tbl"><thead><tr><th>Fois</th><th>Ton coup</th><th>Lignes</th><th></th></tr></thead><tbody>' + mine.map((e) => devRow(e, "me")).join("") + "</tbody></table></div>" : '<p class="muted">Aucune sortie de ta part dans ces parties. Bien joué.</p>';
  h += "</section>";
  h += '<section class="card"><span class="label">Coups de tes adversaires hors de tes lignes</span>';
  h += opp.length ? '<div class="scroll"><table class="tbl"><thead><tr><th>Fois</th><th>Coup adverse</th><th>Lignes</th><th></th></tr></thead><tbody>' + opp.map((e, i) => devRow(e, "opp", i)).join("") + "</tbody></table></div><p class=\"small muted\">Ces coups ne sont pas dans tes lignes. Cherche la bonne réponse dans l'explorateur de Lichess, puis ajoute-la à ton répertoire.</p>" : '<p class="muted">Tes adversaires n\'ont pas dévié de tes lignes.</p>';
  h += "</section>";
  return h + '<section class="card" id="scanbox">' + scanHTML() + "</section>";
}

/* --- Progrès --- */
function progHTML() {
  const t = todayStr();
  let h = '<div class="hdr"><h1>Progrès</h1></div>';
  const seen = LINES.filter((L) => isSeen(L.id)).length;
  h += '<div class="grid3"><div class="stat"><span class="label">Série en cours</span><b>' + currentStreak() + '</b><span class="small muted">record : ' + (S.best || 0) + '</span></div>' +
    '<div class="stat"><span class="label">Lignes vues</span><b>' + seen + "/" + LINES.length + '</b></div><div class="stat"><span class="label">Plans compris</span><b>' + STRUCT_IDS.filter((id) => S.q[id] && S.q[id].ok).length + "/" + STRUCT_IDS.length + "</b></div></div>";
  h += eloCardHTML();
  h += goalsHTML();
  h += statsCardHTML();
  h += weeklyHTML();
  h += hardCardHTML(30);
  h += themeCardHTML() + soundCardHTML();
  h += '<section class="card"><span class="label">Maîtrise par ouverture</span>';
  OPENINGS.forEach((o) => {
    const arr = LINES.filter((L) => L.op === o.id), avg = arr.reduce((a, L) => a + boxOf(L.id), 0) / (6 * arr.length);
    h += '<div class="stack" style="gap:4px"><div class="row between"><span class="nm" style="font-weight:600">' + esc(o.name) + '</span><span class="mono small">' + Math.round(avg * 100) + ' %</span></div><div class="bar"><i style="width:' + Math.round(avg * 100) + '%"></i></div></div>';
  });
  h += "</section>";
  const vals = [], max = Math.max(1, ...Array.from({ length: 14 }, (_, i) => S.days[addDays(t, -(13 - i))] || 0));
  h += '<section class="card"><span class="label">Lignes travaillées, 14 derniers jours</span><div class="chart" role="img" aria-label="Lignes travaillées par jour">';
  for (let i = 13; i >= 0; i--) { const d = addDays(t, -i), n = S.days[d] || 0; h += "<div><span class=\"mono\">" + (n || "") + '</span><i style="height:' + Math.round(n / max * 78) + 'px"></i></div>'; }
  h += "</div></section>";
  const weak = LINES.filter((L) => S.lines[L.id] && S.lines[L.id].tries > 0).map((L) => ({ L, r: S.lines[L.id].errs / S.lines[L.id].tries })).filter((x) => x.r > 0).sort((a, b) => b.r - a.r).slice(0, 5);
  h += '<section class="card"><span class="label">Lignes les plus fragiles</span>';
  h += weak.length ? '<ul class="stack">' + weak.map((x) => '<li class="row between"><span>' + esc(x.L.name) + '<br><span class="small muted">' + esc(OP_BY_ID[x.L.op].short) + '</span></span><span class="chip bad">' + x.r.toFixed(1) + ' erreur par essai</span><button class="btn small" data-act="drill" data-id="' + x.L.id + '">Rejouer</button></li>').join("") + "</ul>" : '<p class="muted">Aucune ligne fragile pour l\'instant. Fais une séance pour que cette liste se remplisse.</p>';
  h += "</section>";
  h += '<section class="card flat"><span class="label">Données</span>' + (V.confirmReset ? '<p>Effacer toute la progression de cet appareil et de ton compte ?</p><div class="row"><button class="btn" data-act="reset2" style="border-color:var(--bad);color:var(--bad)">Oui, tout effacer</button><button class="btn" data-act="reset0">Annuler</button></div>' : '<button class="btn small" data-act="reset1" style="align-self:flex-start">Effacer ma progression</button>') + "</section>";
  return h;
}

/* ---------- Événements ---------- */
document.addEventListener("click", (e) => {
  const sqEl = e.target.closest("[data-sq]");
  if (sqEl) { const b = sqEl.closest("#board"); if (b && b.dataset.live === "1") onSquare(sqEl.dataset.sq); return; }
  const a = e.target.closest("[data-act]");
  if (!a) return;
  const d = a.dataset;
  if (d.act.slice(0, 2) === "m_") return mindAct(d);
  if (d.act.slice(0, 2) === "w_") return planAct(d);
  switch (d.act) {
    case "tab": if (d.v === "plans" || d.v === "concepts") go(d.v); else setTab(d.v); break;
    case "back": goBack(); break;
    case "actset": { if (!S.act) S.act = {}; S.act[d.side] = d.op; refreshNew(); save(); renderMain(); break; }
    case "actch": V.open["act-ch"] = !V.open["act-ch"]; renderMain(); break;
    case "pace": S.pace = Number(d.v); S.session = buildSession(); save(); renderMain(); break;
    case "sess": if (d.kind === "hard") startTrainer(d.line, "drill", true, Number(d.hi)); else startTrainer(d.id, d.kind === "new" ? "learn" : d.kind, true); break;
    case "paste": {
      const gp = $("#gprog");
      (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject(new Error("indisponible")))
        .then((t) => { V.pgn = String(t || ""); renderMain(); const g2 = $("#gprog"); if (g2) g2.textContent = V.pgn.trim() ? "Collé. Touche Analyser." : "Le presse-papiers est vide."; })
        .catch(() => { if (gp) gp.textContent = "Collage automatique refusé : appuie longuement dans la zone de texte puis « Coller »."; });
      break;
    }
    case "useguess": S.user = d.v; save(); renderMain(); runAnalysis(); break;
    case "edadd": edOpen(d.op); break;
    case "edit": edOpen(null, d.id); break;
    case "eddel": V.confirmDel = d.id; renderMain(); break;
    case "eddelno": V.confirmDel = null; renderMain(); break;
    case "eddel2": edDelete(d.id); break;
    case "edbranch": edBranch(d.id, d.ply); break;
    case "ednext": edNextMissing(); break;
    case "edexplain": edExplain(); break;
    case "vsline": vsLine(d.id, d.ply); break;
    case "plgo": plRevOpen(); break;
    case "plquit": PL = null; goBack(); break;
    case "plreveal": PL.stage = "reveal"; renderMain(); break;
    case "plself": PL.self = Number(d.v); PL.stage = "quiz"; renderMain(); break;
    case "plquizgo": PL.stage = "quiz"; renderMain(); break;
    case "plpick": PL.pick = Number(d.i); renderMain(); break;
    case "plfinish": plFinish(); break;
    case "plnext": plNext(); break;
    case "matopen": matOpen(); break;
    case "matd": V.mt = d.id; renderMain(); window.scrollTo(0, 0); break;
    case "matback": V.mt = null; renderMain(); break;
    case "matgo": { const l = matList(d.id), n = l.find((p) => !pzDone(p.id)) || l[0]; if (n) puzOpen(n.id, { mode: "mat", mt: d.id }); break; }
    case "edjump": edJump(Number(d.i)); break;
    case "edtrunc": edTruncate(); break;
    case "edimport": edImport(); break;
    case "edsave": edSave(); break;
    case "pznext": { const n = pzNext(); if (n) puzOpen(n.id); break; }
    case "pznext2": { const n = pzFollow(P); if (n) { const o = { mode: P.mode, theme: P.theme, sid: P.sid, mt: P.mt }; V.stack.pop(); puzOpen(n, o); } break; }
    case "sldot": sliderGo(d.id, Number(d.i)); break;
    case "pzadapt": adaptStart(d.th || null); break;
    case "rush": rushStart(); break;
    case "wpopen": wpOpen(); break;
    case "wpset": wpSetOpen(d.id); break;
    case "wpback": V.wpsid = null; renderMain(); break;
    case "wpf": WPF[d.f] = d.f === "size" ? Number(d.v) : d.v; renderMain(); break;
    case "wpnew": { const s = wpCreate(WPF.th, WPF.size, WPF.lvl); if (s) wpSetOpen(s.id); break; }
    case "wpweak": { const s = wpCreateWeak(20); if (s) wpSetOpen(s.id); break; }
    case "wpgo": wpPlay(d.id); break;
    case "wpres": { const sid = P && P.sid; V.stack.pop(); P = null; V.view = "wp"; V.wpsid = sid; render(); window.scrollTo(0, 0); break; }
    case "wpdel": { S.wp.sets = wpSets().filter((x) => x.id !== d.id); save(); V.wpsid = null; renderMain(); break; }
    case "rushquit": rushEnd(); break;
    case "daily": dailyStart(); break;
    case "endg": egOpen(); break;
    case "eglesson": egLessonOpen(d.id); break;
    case "stc": stConceptOpen(d.id); break;
    case "adopen": adOpen(d.id); break;
    case "stgo": { if (d.sk) { V.sis = V.sis || {}; V.sis[d.sk] = Math.max(0, Number(d.i)); } else V.si = Math.max(0, Number(d.i)); renderMain(); break; }
    case "stex": { const c = STRAT_BY[V.cid]; V.ii = Number(d.i); V.si = c.ills[V.ii].from; renderMain(); break; }
    case "stseen": { S.stv = S.stv || {}; S.stv[d.id] = 1; save(); sfx("done"); renderMain(); break; }
    case "sacs": V.sacOp = d.id; if (V.view === "sacs") renderMain(); else { V.stack.push({ view: V.view, opId: V.opId }); V.view = "sacs"; render(); window.scrollTo(0, 0); } break;
    case "sac": stSacOpen(d.id); break;
    case "egread": { S.egl = S.egl || {}; S.egl[d.id] = 1; save(); sfx("done"); renderMain(); break; }
    case "egplay": egStart(Number(d.i)); break;
    case "egplay2": egStart(Number(d.i), true); break;
    case "egexo": egExOpen(Number(d.i)); break;
    case "pzex": pzExOpen(d.id); break;
    case "mexo": mExOpen(d.dr); break;
    case "goal": { const k = d.k2; S.goal = S.goal || {}; S.goal[k] = Math.max(1300, Math.min(2800, goalOf(k) + Number(d.v))); save(); renderMain(); break; }
    case "vsadd": vsAddPz(Number(d.i)); break;
    case "pzopen": puzOpen(d.id); break;
    case "vsopen": vsOpen(); break;
    case "vseng": VS.eng = d.v; VS.lvl = d.v === "maia" ? 3 : 2; renderMain(); break;
    case "vslvl": VS.lvl = Number(d.i); renderMain(); break;
    case "vscol": VS.col = d.v; renderMain(); break;
    case "vsstart": vsStart(); break;
    case "vsresign": vsResign(); break;
    case "vsundo": vsUndo(); break;
    case "vsagain": { const l = VS.lvl, c = VS.col; VS = { stage: "setup", lvl: l, col: c }; renderMain(); break; }
    case "vsscan": vsScan(); break;
    case "vscopy": try { navigator.clipboard.writeText(vsPgn()); } catch (er) { /* refusé */ } break;
    case "pzpos": go("pzpos"); break;
    case "pzth": go("pzth"); break;
    case "pzthgo": { PZ_FILTER.op = "all"; PZ_FILTER.kind = "tac"; PZ_FILTER.th = d.id; const n = pzNext(); if (n) puzOpen(n.id); break; }
    case "trk": V.trk = d.v; renderMain(); break;
    case "pzk": PZ_FILTER.kind = d.v; PZ_FILTER.th = "all"; renderMain(); break;
    case "pzf": PZ_FILTER.op = d.id; renderMain(); break;
    case "pzt": PZ_FILTER.th = d.id; renderMain(); break;
    case "pzby": PZ_FILTER.by = d.v; renderMain(); break;
    case "pzhint": puzHint(); break;
    case "pzshow": puzShow(); break;
    case "pzretry": { const id = P.id; V.stack.pop(); puzOpen(id); break; }
    case "vlayer": V.layers[d.id] = V.layers[d.id] ? 0 : 1; renderMain(); break;
    case "understand": understand(d.src); break;
    case "aiclose": V.ai = null; paintAI(); renderMain(); break;
    case "chtoggle": V.open[d.id] = !V.open[d.id]; renderMain(); break;
    case "jump": {
      V.open[d.id] = true; renderMain();
      const el = document.getElementById("ch-" + d.id);
      if (el) { const y = el.getBoundingClientRect().top + (window.pageYOffset || 0) - 8; try { window.scrollTo({ top: y, behavior: "auto" }); } catch (e) { window.scrollTo(0, y); } }
      break;
    }
    case "sessgo": { const n = sessionStats().next; if (n) { if (V.view === "trainer") { V.stack.pop(); } if (n.kind === "hard") startTrainer(n.line, "drill", true, n.hi); else startTrainer(n.id, n.kind === "new" ? "learn" : n.kind, true); } break; }
    case "op": go("op", { opId: d.id }); break;
    case "rpch": {
      if (!V.opInit) V.opInit = {}; V.opInit[d.op] = true; V.open[d.op + "-" + d.ch] = true;
      go("op", { opId: d.op });
      const el = document.getElementById("ch-" + d.op + "-" + d.ch);
      if (el) { const y = el.getBoundingClientRect().top + (window.pageYOffset || 0) - 8; try { window.scrollTo({ top: y, behavior: "auto" }); } catch (e) { window.scrollTo(0, y); } }
      break;
    }
    case "learn": startTrainer(d.id, "learn", false); break;
    case "drill": startTrainer(d.id, kindFor(d.id), false); break;
    case "struct": go("struct", { sid: d.id }); break;
    case "sq": { const s = STRUCTS[d.id]; V.qs[d.id] = Number(d.i); recordQuiz(d.id, Number(d.i) === s.quiz.a); renderMain(); break; }
    case "sqreset": delete V.qs[d.id]; renderMain(); break;
    case "lstep": learnStep(Number(d.d)); break;
    case "theme": S.theme = d.v; save(); themeApply(); renderMain(); break;
    case "sndtoggle": S.sound = S.sound === 0 ? 1 : 0; save(); if (S.sound) sfx("ok"); renderMain(); break;
    case "xnew": xNew(); break;
    case "xnew2": { P = null; const q = V.stack.pop(); if (q) { V.view = q.view; V.sid = q.sid; V.opId = q.opId; } xNew(); break; }
    case "xhint": if (X) { X.info = true; X.hint = new Chess(X.g.fen()).move(X.L.sans[X.i]).from; renderMain(); } break;
    case "xshow": xReveal(); break;
    case "scan": scanMistakes(); break;
    case "scanstop": if (V.scan) V.scan.stop = true; break;
    case "prep": prepareLine(Number(d.i)); break;
    case "hardgo": { startTrainer(d.id, "drill", false, Number(d.i)); break; }
    case "toguide": { const id = T.id, fs = T.fromSession; V.stack.pop(); startTrainer(id, "guide", fs); break; }
    case "todrill": { const id = T.id, fs = T.fromSession; V.stack.pop(); startTrainer(id, "drill", fs); break; }
    case "hint": giveHint(); break;
    case "tq": answerQuiz(Number(d.i)); break;
    case "toresult": T.stage = "result"; renderMain(); break;
    case "again": { const id = T.id; V.stack.pop(); startTrainer(id, kindFor(id), false); break; }
    case "analyse": runAnalysis(); break;
    case "sample": V.pgn = SAMPLE_PGN; S.user = "toi"; save(); V.gres = null; renderMain(); break;
    case "queue": {
      const ids = d.ids.split(",");
      ensureSession();
      ids.forEach((id) => { const l = ls(id); if (l.seen) l.due = todayStr(); if (!S.session.items.find((i) => i.id === id)) S.session.items.unshift({ id, kind: isSeen(id) ? kindFor(id) : "new", done: false }); });
      save(); a.textContent = "Ajouté à la séance"; a.disabled = true; break;
    }
    case "reset1": V.confirmReset = true; renderMain(); break;
    case "reset0": V.confirmReset = false; renderMain(); break;
    case "reset2": { const u = S.user; adopt(defaults()); S.user = u; S.updated = Date.now(); localSave(); scheduleRemote(); V.confirmReset = false; ensureSession(); renderMain(); break; }
  }
});
document.addEventListener("input", (e) => {
  if (E && V.view === "edit") {
    if (e.target.id === "edName") E.name = e.target.value;
    if (e.target.id === "edNote" && E.idx > 0) { if (e.target.value.trim()) E.notes[E.idx - 1] = e.target.value; else delete E.notes[E.idx - 1]; }
    if (e.target.id === "edPgn") E.imp = e.target.value;
  }
  if (e.target.id === "gpgn") V.pgn = e.target.value;
  if (e.target.id === "guser") { S.user = e.target.value; save(); }
});
document.addEventListener("change", (e) => {
  if (E && V.view === "edit") {
    if (e.target.id === "edOp") { const nm = E.name, nt = E.notes, ns = E.sans, ni = E.idx; edReset(e.target.value); E.name = nm; E.sans = ns; E.notes = nt; E.idx = ni; edRebuild(); renderMain(); return; }
    if (e.target.id === "edCh") { E.ch = e.target.value; return; }
    if (e.target.id === "edStruct") { E.struct = e.target.value; return; }
  }
  if (e.target.id === "gfile" && e.target.files && e.target.files[0]) {
    const f = e.target.files[0], fr = new FileReader();
    const gp = $("#gprog"); if (gp) gp.textContent = "Lecture de " + f.name + "…";
    fr.onload = () => { V.pgn = String(fr.result || ""); renderMain(); const gp2 = $("#gprog"); if (gp2) gp2.textContent = "Fichier chargé : " + f.name + " (" + Math.round(f.size / 1024) + " ko)."; runAnalysis(); };
    fr.onerror = () => { const gp3 = $("#gprog"); if (gp3) gp3.textContent = "Impossible de lire ce fichier. Copie-colle son contenu dans la zone de texte."; };
    fr.readAsText(f);
  }
});
async function runAnalysis() {
  const ta = $("#gpgn"), us = $("#guser");
  if (ta) V.pgn = ta.value;
  if (us) { S.user = us.value; save(); }
  const box = $("#gres");
  if (!V.pgn.trim()) { if (box) box.innerHTML = '<section class="card"><p class="muted">Colle d\'abord des parties au format PGN.</p></section>'; return; }
  if (!S.user.trim()) { if (box) box.innerHTML = '<section class="card"><p class="muted">Indique ton pseudo : il sert à savoir si tu jouais les Blancs ou les Noirs.</p></section>'; return; }
  V.gbusy = true; const gp = $("#gprog"); if (gp) gp.textContent = "Analyse en cours…";
  try { V.gres = await analyseText(V.pgn, S.user); } catch (err) { V.gres = { total: 0, bad: 0, skipped: 0, games: [] }; const eb = $("#gres"); if (eb) eb.innerHTML = '<section class="card"><p class="muted">L\'analyse a échoué : ' + esc(String((err && err.message) || err)) + "</p></section>"; }
  V.gbusy = false;
  const b2 = $("#gres"); if (b2 && V.gres && (V.gres.games.length || V.gres.total)) b2.innerHTML = gresHTML(); else if (b2 && !b2.innerHTML.includes("a échoué")) b2.innerHTML = gresHTML();
  const gp2 = $("#gprog"); if (gp2) gp2.textContent = "";
}


document.addEventListener("keydown", (e) => {
  if (!T || V.view !== "trainer" || T.mode !== "learn" || T.stage !== "play") return;
  const tg = e.target && e.target.tagName; if (tg === "INPUT" || tg === "TEXTAREA") return;
  if (e.key === "ArrowRight") { learnStep(1); e.preventDefault(); } else if (e.key === "ArrowLeft") { learnStep(-1); e.preventDefault(); }
});
