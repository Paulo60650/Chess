/* ===== Noyau : notation, lecture des lignes, livre de répertoire ===== */
const FR_LETTERS = { N: "C", B: "F", R: "T", Q: "D", K: "R" };
function dispSan(s) { return s.replace(/[NBRQK]/g, (c) => FR_LETTERS[c]); }
function norm(s) { return s.replace(/[+#!?]/g, ""); }

function parseLine(pgn) {
  const sans = [], notes = {};
  const re = /\{([^}]*)\}|(\S+)/g;
  let m;
  while ((m = re.exec(pgn))) {
    if (m[1] !== undefined) {
      if (sans.length) {
        const i = sans.length - 1;
        notes[i] = (notes[i] ? notes[i] + " " : "") + m[1].trim();
      }
      continue;
    }
    const t = m[2].replace(/^\d+\.+/, "");
    if (!t || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)) continue;
    sans.push(t);
  }
  return { sans, notes };
}

LINES.forEach((L) => Object.assign(L, parseLine(L.pgn)));
LINES.forEach((L) => {
  if (!L.ch) L.ch = LINE_CH[L.id];
  if (L.ch === "pieges" && !L.trap) L.trap = TRAP_KIND[L.id] || "set";
  L.chi = Math.max(0, (CHAPTERS[L.op] || []).findIndex((c) => c.id === L.ch));
});
const LINE_BY_ID = {};
LINES.forEach((L) => { LINE_BY_ID[L.id] = L; });
const OP_BY_ID = {};
OPENINGS.forEach((o) => { OP_BY_ID[o.id] = o; });

function posKey(g) { return g.fen().split(" ").slice(0, 3).join(" "); }

/* Position après n demi-coups d'une ligne */
function lineGame(L, plies) {
  const g = new Chess();
  const n = plies == null ? L.sans.length : plies;
  for (let i = 0; i < n; i++) g.move(L.sans[i]);
  return g;
}

/* Livre : position -> coups attendus (avec les lignes qui les contiennent) */
function buildBook(side) {
  const map = new Map();
  LINES.forEach((L) => {
    if (side && OP_BY_ID[L.op].side !== side) return;
    if (L.trap === "avoid") return; /* ces lignes montrent un piège : on ne les compte pas comme livre */
    const g = new Chess();
    L.sans.forEach((san) => {
      const k = posKey(g);
      let e = map.get(k);
      if (!e) { e = { moves: new Map() }; map.set(k, e); }
      const n = norm(san);
      if (!e.moves.has(n)) e.moves.set(n, new Set());
      e.moves.get(n).add(L.id);
      g.move(san);
    });
  });
  return map;
}
/* Chapitre réservé aux lignes personnelles de chaque ouverture */
OPENINGS.forEach((o) => { CHAPTERS[o.id].push({ id: "perso", t: "Mes lignes", c: "teal", d: "Tes propres variantes, avec tes commentaires. Elles s'entraînent comme les autres lignes." }); });
