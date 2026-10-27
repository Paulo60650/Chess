/* ===== Mes lignes : ajouter, annoter et entraîner ses propres lignes ===== */

function cleanPgn(t) {
  let s = String(t || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  s = s.replace(/^\[.*\]\s*$/gm, " ");
  s = s.replace(/\{\s*\[%[^}]*\}/g, " ").replace(/\[%[^\]]*\]/g, " ");
  let prev;
  do { prev = s; s = s.replace(/\([^()]*\)/g, " "); } while (s !== prev);
  s = s.replace(/\$\d+/g, " ").replace(/;[^\n]*/g, " ");
  return s;
}
function linePgn(sans, notes) {
  let out = "";
  sans.forEach((m, i) => {
    out += (i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : "") + m + " ";
    const n = (notes[i] || "").replace(/[{}]/g, "").trim();
    if (n) out += "{" + n + "} ";
  });
  return out.trim();
}
function rebuildCustom() {
  for (let i = LINES.length - 1; i >= 0; i--) if (LINES[i].custom) { delete LINE_BY_ID[LINES[i].id]; LINES.splice(i, 1); }
  (S.custom || []).forEach((c) => {
    if (!OP_BY_ID[c.op] || !STRUCTS[c.struct]) return;
    const L = { id: c.id, op: c.op, struct: c.struct, ch: c.ch, name: c.name, pgn: c.pgn, custom: true, parent: c.parent || null, bp: c.bp == null ? null : c.bp };
    Object.assign(L, parseLine(c.pgn));
    if (L.ch === "pieges") L.trap = c.trap || "set";
    L.chi = Math.max(0, (CHAPTERS[L.op] || []).findIndex((x) => x.id === L.ch));
    LINES.push(L); LINE_BY_ID[L.id] = L;
  });
  BOOKS = null;
}

function edReset(op) {
  const o = OP_BY_ID[op || "lon"];
  E = { id: null, op: o.id, ch: "perso", struct: Object.keys(STRUCTS).find((k) => STRUCTS[k].op === o.id), name: "", sans: [], notes: {}, idx: 0, g: new Chess(), sel: null, tg: [], last: null, msg: "", imp: "" };
}
function edOpen(op, id) {
  edReset(op);
  if (id) {
    const L = LINE_BY_ID[id];
    E.id = id; E.parentId = L.parent || null; E.bp = L.bp; E.trap = L.trap; if (L.parent && LINE_BY_ID[L.parent]) E.parent = { id: L.parent, name: LINE_BY_ID[L.parent].name, sans: LINE_BY_ID[L.parent].sans.slice() }; E.op = L.op; E.ch = L.ch; E.struct = L.struct; E.name = L.name; E.sans = L.sans.slice(); E.notes = Object.assign({}, L.notes); E.idx = L.sans.length;
    edRebuild(); E.last = lastMoveOf(E.g);
  }
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = "edit"; render(); window.scrollTo(0, 0);
}
function edBranch(id, ply) {
  const L = LINE_BY_ID[id]; if (!L) return;
  edReset(L.op);
  const n = ply == null || isNaN(ply) ? L.sans.length : Math.max(0, Math.min(L.sans.length, Number(ply)));
  Object.assign(E, { op: L.op, ch: L.ch, struct: L.struct, name: L.name + " · variante", sans: L.sans.slice(), notes: Object.assign({}, L.notes), idx: n, trap: L.trap, parent: { id: L.id, name: L.name, sans: L.sans.slice() } });
  edRebuild(); E.last = lastMoveOf(E.g);
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId });
  V.view = "edit"; render(); window.scrollTo(0, 0);
}
/* Premier demi-coup où la variante s'écarte de la ligne d'origine (ou -1) */
function edBp() {
  if (!E.parent) return 0;
  const a = E.parent.sans, b = E.sans;
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === b.length) return -1;
  return i;
}
function edExplainStats() {
  const bp = edBp(); if (bp < 0) return { bp, total: 0, done: 0, miss: [] };
  const miss = []; let done = 0;
  for (let i = bp; i < E.sans.length; i++) { if ((E.notes[i] || "").trim()) done++; else miss.push(i); }
  return { bp, total: E.sans.length - bp, done, miss };
}
function edNextMissing() {
  const st = edExplainStats(); if (!st.miss.length) { E.msg = "Tous les coups de ta variante sont expliqués."; renderMain(); return; }
  const nx = st.miss.find((i) => i >= E.idx) != null ? st.miss.find((i) => i >= E.idx) : st.miss[0];
  edJump(nx + 1);
}
async function edExplain() {
  if (E.idx < 1 || E.busy) return;
  const i = E.idx - 1, g = new Chess(); for (let k = 0; k < i; k++) g.move(E.sans[k]);
  const fenBefore = g.fen(), mv = E.sans[i], white = g.turn() === "w";
  E.busy = true; E.msg = "L'analyse démarre : le moteur puis Claude rédigent une explication à relire."; renderMain();
  let eng = [];
  try { if (await engInit()) eng = await engAnalyse(fenBefore, 13, 5000); } catch (e) { eng = []; }
  const o = OP_BY_ID[E.op], hist = E.sans.slice(0, i).map((m, k) => (k % 2 === 0 ? Math.floor(k / 2) + 1 + ". " : "") + dispSan(m)).join(" ");
  let p = "Tu es un entraîneur d'échecs. Explique en français, en 40 mots maximum et deux phrases, pourquoi on joue " + dispSan(mv) + " (" + (white ? "les Blancs" : "les Noirs") + ") dans cette ligne d'ouverture : " + E.name + ".\nCoups avant : " + (hist || "(début)") + ".\nFEN avant le coup : " + fenBefore + ".\n";
  if (E.parent) p += "C'est une variante d'une ligne connue : " + E.parent.name + ".\n";
  if (eng && eng.length) { p += "Analyse Stockfish (point de vue des Blancs, en pions) :\n"; eng.forEach((r, k) => { p += (k + 1) + ". " + pvSan(fenBefore, r.pv, 4) + " → " + evalTxt(r) + "\n"; }); }
  else p += "Pas d'analyse moteur : ne donne aucune évaluation chiffrée.\n";
  p += "Donne l'idée du coup (plan, menace, case contrôlée) sans inventer de variante absente de l'analyse. Pas de titre, pas de liste.";
  let txt = "";
  try {
    const smp = window.claude && window.claude.use ? await window.claude.use("sample") : null;
    if (smp) { const r = await smp(p, { cache: false }); txt = (r && r.text || "").trim(); }
  } catch (e) { txt = ""; }
  E.busy = false;
  if (!E || !E.sans) return;
  if (txt) { if (!(E.notes[i] || "").trim()) E.notes[i] = txt; else E.notes[i] += "\n" + txt; E.msg = "Explication proposée : relis-la et corrige-la avant d'enregistrer."; }
  else E.msg = "Pas de proposition disponible : écris l'explication toi-même.";
  renderMain();
}
function edRebuild() { const g = new Chess(); for (let i = 0; i < E.idx; i++) g.move(E.sans[i]); E.g = g; }
function edSquare(sq) {
  const g = E.g, p = g.get(sq);
  if (E.sel && E.tg.indexOf(sq) >= 0) {
    const mv = g.move({ from: E.sel, to: sq, promotion: "q" });
    if (mv) {
      if (E.idx < E.sans.length) { E.sans.length = E.idx; Object.keys(E.notes).forEach((k) => { if (Number(k) >= E.idx) delete E.notes[k]; }); }
      E.sans.push(mv.san); E.idx++; E.last = [mv.from, mv.to]; E.msg = "";
    }
    E.sel = null; E.tg = []; renderMain(); return;
  }
  if (p && p.color === g.turn()) { E.sel = sq; E.tg = g.moves({ square: sq, verbose: true }).map((m) => m.to); } else { E.sel = null; E.tg = []; }
  renderMain();
}
function edJump(i) { E.idx = Math.max(0, Math.min(E.sans.length, i)); edRebuild(); E.sel = null; E.tg = []; E.last = lastMoveOf(E.g); renderMain(); }
function edTruncate() { E.sans.length = E.idx; Object.keys(E.notes).forEach((k) => { if (Number(k) >= E.idx) delete E.notes[k]; }); renderMain(); }
function edImport() {
  const ta = $("#edPgn"); const raw = ta ? ta.value : E.imp; E.imp = raw;
  const p = parseLine(cleanPgn(raw)), g = new Chess(), sans = [];
  for (const s of p.sans) { const m = g.move(s, { sloppy: true }); if (!m) break; sans.push(m.san); }
  if (!sans.length) { E.msg = "Aucun coup lisible dans ce texte. Colle des coups comme « 1. d4 d5 2. Nf3 {ton commentaire} »."; renderMain(); return; }
  // les commentaires gardent leur place ; on recalcule si des coups ont été écartés
  E.sans = sans; E.notes = {}; Object.keys(p.notes).forEach((k) => { if (Number(k) < sans.length) E.notes[k] = p.notes[k]; });
  E.idx = sans.length; edRebuild(); E.last = lastMoveOf(E.g);
  E.msg = sans.length < p.sans.length ? "Importé jusqu'au coup " + sans.length + " : le coup suivant n'est pas légal." : "Ligne importée : " + sans.length + " demi-coups.";
  renderMain();
}
function edSave() {
  if (E.sans.length < 2) { E.msg = "Joue au moins deux coups pour créer une ligne."; renderMain(); return; }
  if (!E.name.trim()) { E.msg = "Donne un nom à ta ligne."; renderMain(); return; }
  let bp = null;
  if (E.parent) {
    bp = edBp();
    if (bp < 0) { E.msg = "Ta variante est identique à la ligne d'origine : joue un autre coup à partir du point de départ."; renderMain(); return; }
    if (bp >= E.sans.length) { E.msg = "Ajoute au moins un coup différent de la ligne d'origine."; renderMain(); return; }
    if (!(E.notes[bp] || "").trim()) { E.msg = "Explique d'abord pourquoi tu t'écartes de la ligne au coup " + plyLabel(bp) + dispSan(E.sans[bp]) + " : une variante sans explication ne s'étudie pas."; E.idx = bp + 1; edRebuild(); E.last = lastMoveOf(E.g); renderMain(); return; }
    const lastI = E.sans.length - 1;
    if (!(E.notes[lastI] || "").trim()) { E.msg = "Dis aussi ce que doit donner la variante (objectif ou piège) en commentant son dernier coup."; E.idx = lastI + 1; edRebuild(); E.last = lastMoveOf(E.g); renderMain(); return; }
  }
  if (!S.custom) S.custom = [];
  const id = E.id || "u" + Date.now().toString(36);
  const rec = { id, op: E.op, ch: E.ch, struct: E.struct, name: E.name.trim(), pgn: linePgn(E.sans, E.notes), trap: E.trap || "set", parent: E.parent ? E.parent.id : (E.parentId || null), bp: E.parent ? bp : (E.bp == null ? null : E.bp) };
  const i = S.custom.findIndex((c) => c.id === id);
  if (i >= 0) S.custom[i] = rec; else S.custom.push(rec);
  save(); rebuildCustom();
  V.open[E.op + "-" + E.ch] = true; V.opId = E.op;
  const done = E.name.trim(); E = null;
  V.stack.pop(); V.view = "op"; V.opId = rec.op; V.flash = "Ligne « " + done + " » enregistrée."; render(); window.scrollTo(0, 0);
}
function edDelete(id) {
  S.custom = (S.custom || []).filter((c) => c.id !== id); delete S.lines[id]; save(); rebuildCustom();
  if (S.session && S.session.items) S.session.items = S.session.items.filter((it) => it.id !== id);
  V.confirmDel = null; renderMain();
}
function editHTML() {
  const o = OP_BY_ID[E.op], chs = CHAPTERS[E.op], structs = Object.keys(STRUCTS).filter((k) => STRUCTS[k].op === E.op);
  const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(t) + "</option>";
  let h = backBtn("Retour") + '<div class="hdr kh" data-k="teal"><h1>' + (E.id ? "Modifier ma ligne" : E.parent ? "Ajouter une sous-variante" : "Ajouter ma ligne") + '</h1><p class="muted">Joue les coups sur l\'échiquier (les deux camps), puis écris un commentaire sur chaque coup important. Tu peux aussi coller un PGN annoté.</p></div>';
  if (E.parent) {
    const st = edExplainStats();
    h += '<div class="card" data-k="violet" style="border-left:4px solid var(--k)"><span class="label">Sous-variante de « ' + esc(E.parent.name) + ' »</span><p class="small">Les coups avant ton écart viennent de la ligne d\'origine, avec leurs explications. Place-toi sur le dernier coup commun avec ◀ ▶, puis joue ton coup différent : la suite d\'origine est remplacée. Explique ensuite chaque coup de ta variante.</p>' +
      (st.bp < 0 ? '<p class="small muted">Pour l\'instant, ta variante est identique à la ligne d\'origine.</p>' : '<div class="row"><span class="chip ' + (st.miss.length ? "bad" : "good") + '">Explications : ' + st.done + " sur " + st.total + '</span>' + (st.miss.length ? '<button class="btn small" data-act="ednext">Coup suivant à expliquer</button>' : "") + "</div>") + "</div>";
  }
  h += '<div class="trainer"><div class="stack">' + boardHTML(E.g, { orient: o.side, sel: E.sel, tg: E.tg, last: E.last || [], live: true }) +
    '<div class="row"><button class="btn small" data-act="edjump" data-i="0" aria-label="Début">⏮</button><button class="btn small" data-act="edjump" data-i="' + (E.idx - 1) + '" aria-label="Coup précédent">◀</button><button class="btn small" data-act="edjump" data-i="' + (E.idx + 1) + '" aria-label="Coup suivant">▶</button><button class="btn small" data-act="edjump" data-i="' + E.sans.length + '" aria-label="Fin">⏭</button><button class="btn small" data-act="edtrunc"' + (E.idx >= E.sans.length ? " disabled" : "") + '>Effacer la suite</button></div>' +
    '<p class="small muted">Jouer un autre coup au milieu de la ligne remplace la suite. Les noirs sont en bas si ton ouverture est jouée avec les Noirs.</p></div>';
  h += '<div class="stack" style="gap:12px"><div class="card"><span class="label">Coups</span>' + (E.sans.length ? movesHTML(E.sans, E.idx, true) : '<p class="muted">Aucun coup pour l\'instant : touche une pièce, puis sa case d\'arrivée.</p>') + "</div>";
  const cur = E.idx > 0 ? E.idx - 1 : -1;
  h += '<div class="card"><span class="label">Commentaire' + (cur >= 0 ? " sur " + plyLabel(cur) + dispSan(E.sans[cur]) : "") + '</span>' + (cur >= 0 ? '<textarea id="edNote" style="min-height:90px;font-family:var(--f-body);font-size:.95rem" placeholder="Pourquoi ce coup ? Quel plan, quelle menace, quel piège ?">' + esc(E.notes[cur] || "") + "</textarea>" : '<p class="muted">Joue un coup, puis explique-le ici.</p>') + (cur >= 0 ? '<div class="row"><button class="btn small" data-act="edexplain"' + (E.busy ? " disabled" : "") + ">" + (E.busy ? "Analyse en cours…" : "Proposer une explication") + '</button><span class="small muted">Stockfish analyse, Claude rédige : à relire.</span></div>' : "") + "</div>";
  h += '<div class="card"><label class="stack"><span class="label">Nom de la ligne</span><input type="text" id="edName" value="' + esc(E.name) + '" placeholder="par exemple : Londres contre ...c5 avec Db3"></label>' +
    '<label class="stack"><span class="label">Ouverture</span><select id="edOp">' + OPENINGS.map((x) => opt(x.id, x.name, E.op)).join("") + "</select></label>" +
    '<label class="stack"><span class="label">Chapitre</span><select id="edCh">' + chs.map((c) => opt(c.id, c.t, E.ch)).join("") + "</select></label>" +
    '<label class="stack"><span class="label">Fiche de plan associée</span><select id="edStruct">' + structs.map((k) => opt(k, STRUCTS[k].title, E.struct)).join("") + "</select></label></div>";
  h += '<details class="card"' + (E.imp ? " open" : "") + '><summary>Coller un PGN annoté</summary><textarea id="edPgn" placeholder="1. d4 d5 2. Nf3 {ton commentaire} Nf6 ...">' + esc(E.imp) + '</textarea><div class="row"><button class="btn" data-act="edimport">Charger ce PGN</button></div><p class="small muted">Les variantes entre parenthèses et les annotations d\'horloge sont ignorées. Les commentaires entre accolades sont gardés.</p></details>';
  if (E.msg) h += '<div class="note ' + (/enregistr|importée|Importé/.test(E.msg) ? "good" : "warn") + '">' + esc(E.msg) + "</div>";
  h += '<div class="row"><button class="btn primary big" data-act="edsave">Enregistrer la ligne</button></div></div></div>';
  return h;
}
