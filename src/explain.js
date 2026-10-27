/* ---------- Explication automatique d'un coup : phrase + repères (cases, colonnes, diagonales) ----------
   Tout vient de faits vérifiables sur l'échiquier (qui attaque quoi, quelle colonne est ouverte…), jamais d'une théorie supposée. */
const XP_NAME = { p: "pion", n: "cavalier", b: "fou", r: "tour", q: "dame", k: "roi" };
const XP_FEM = { r: 1, q: 1 };
const XP_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const XP_FILES = "abcdefgh";
function xpArt(t, def) { return (def ? (XP_FEM[t] ? "la " : "le ") : (XP_FEM[t] ? "une " : "un ")) + XP_NAME[t]; }
function xpSq(f, r) { return XP_FILES[f] + (r + 1); }
function xpBoard(g) { // tableau [rang 0..7][colonne 0..7] avec {type,color}
  const b = g.board(), o = [];
  for (let r = 0; r < 8; r++) { o[r] = []; for (let f = 0; f < 8; f++) o[r][f] = b[7 - r][f]; }
  return o;
}
function xpAttacks(B, f, r) { // cases attaquées par la pièce en (f, r)
  const p = B[r][f]; if (!p) return [];
  const out = [], add = (ff, rr) => { if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) out.push([ff, rr]); };
  if (p.type === "p") { const d = p.color === "w" ? 1 : -1; add(f - 1, r + d); add(f + 1, r + d); return out; }
  if (p.type === "n") { [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach((m) => add(f + m[0], r + m[1])); return out; }
  if (p.type === "k") { for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) if (a || c) add(f + a, r + c); return out; }
  const dirs = p.type === "b" ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : p.type === "r" ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  dirs.forEach((d) => { let ff = f + d[0], rr = r + d[1]; while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) { out.push([ff, rr]); if (B[rr][ff]) break; ff += d[0]; rr += d[1]; } });
  return out;
}
function xpDefended(B, f, r, color) { // le camp `color` protège-t-il (f, r) ?
  for (let rr = 0; rr < 8; rr++) for (let ff = 0; ff < 8; ff++) { const q = B[rr][ff]; if (q && q.color === color && !(ff === f && rr === r) && xpAttacks(B, ff, rr).some((a) => a[0] === f && a[1] === r)) return true; }
  return false;
}
function xpList(a) { return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]; }
/* g0 : position avant le coup ; san : coup ; orient : camp « du joueur » ; prevTo : case d'arrivée du coup précédent (pour « reprend »). */
function xpExplain(g0, san, orient, prevTo) {
  const g = new Chess(g0.fen()), mv = g.move(san, { sloppy: true }); if (!mv) return null;
  const me = mv.color, opp = me === "w" ? "b" : "w", B = xpBoard(g), B0 = xpBoard(g0);
  const df = XP_FILES.indexOf(mv.to[0]), dr = Number(mv.to[1]) - 1, ff = XP_FILES.indexOf(mv.from[0]), fr = Number(mv.from[1]) - 1;
  const pt = mv.piece, P = XP_FEM[pt] ? "elle" : "il", side = me === "w" ? "Les Blancs" : "Les Noirs", mine = me === orient;
  const v = { arr: [[mv.from, mv.to, mine ? "g" : "r"]], lab: { ag: "Coup joué", ar: "Coup adverse", weak: "Cibles ou cases attaquées", out: "Case importante", files: "Colonne ou diagonale" } };
  const weak = [], out = [], files = [], diags = []; const bits = [];
  let t;
  const flags = mv.flags || "";
  if (flags.indexOf("k") >= 0 || flags.indexOf("q") >= 0) {
    t = side + " roquent " + (flags.indexOf("k") >= 0 ? "du côté du roi" : "du côté de la dame") + " : le roi se met à l'abri et la tour entre en jeu.";
    v.arr = [[mv.from, mv.to, mine ? "g" : "r"]];
  } else {
    const cap = mv.captured;
    if (cap) {
      const again = prevTo && prevTo === mv.to;
      t = side + " : " + xpArt(pt, true) + (again ? " reprend" : " prend") + " " + (cap === "p" && mv.flags.indexOf("e") >= 0 ? "le pion en passant" : xpArt(cap, true) + " en " + mv.to);
      weak.push(mv.to);
      if (mv.promotion) t += " et promeut en " + XP_NAME[mv.promotion];
    } else if (mv.promotion) t = side + " : le pion avance en " + mv.to + " et promeut en " + XP_NAME[mv.promotion];
    else {
      const homeN = { w: ["b1", "g1"], b: ["b8", "g8"] }[me], homeB = { w: ["c1", "f1"], b: ["c8", "f8"] }[me];
      if ((pt === "n" && homeN.indexOf(mv.from) >= 0) || (pt === "b" && homeB.indexOf(mv.from) >= 0)) t = side + " développent " + xpArt(pt, false) + " en " + mv.to;
      else if (pt === "p") t = side + " : le pion avance en " + mv.to;
      else t = side + " : " + xpArt(pt, true) + " va en " + mv.to;
    }
    if (g.in_checkmate()) t += " : échec et mat !";
    else if (g.in_check()) t += ", avec échec";
    // Pion : centre
    if (pt === "p" && !cap && !mv.promotion && (mv.to === "e4" || mv.to === "d4" || mv.to === "e5" || mv.to === "d5")) { bits.push(P + " occupe le centre"); out.push(mv.to); }
    // Cibles attaquées par la pièce déplacée
    if (pt !== "k") {
      const tg = [];
      xpAttacks(B, df, dr).forEach((a) => { const q = B[a[1]][a[0]]; if (q && q.color === opp && q.type !== "k") tg.push({ sq: xpSq(a[0], a[1]), t: q.type, free: !xpDefended(B, a[0], a[1], opp), more: XP_VAL[q.type] > XP_VAL[pt] }); });
      const worth = tg.filter((x) => x.free || x.more || (x.t !== "p"));
      worth.sort((a, b) => XP_VAL[b.t] - XP_VAL[a.t]);
      if (g.in_check() && worth.length >= 1 && !g.in_checkmate()) { // échec + cible : fourchette
        bits.push(P + " menace aussi " + xpArt(worth[0].t, true) + " en " + worth[0].sq + (worth[0].free ? ", qui n'est pas protégé" + (XP_FEM[worth[0].t] ? "e" : "") : ""));
        weak.push(worth[0].sq);
      } else if (worth.length >= 2) {
        const w2 = worth.slice(0, 2); bits.push("fourchette : " + P + " attaque en même temps " + xpArt(w2[0].t, true) + " en " + w2[0].sq + " et " + xpArt(w2[1].t, true) + " en " + w2[1].sq);
        w2.forEach((x) => weak.push(x.sq));
      } else if (worth.length === 1 && !cap) {
        const x = worth[0]; bits.push(P + " attaque " + xpArt(x.t, true) + " en " + x.sq + (x.free ? ", qui n'est pas protégé" + (XP_FEM[x.t] ? "e" : "") : x.more ? ", qui vaut plus que lui" : ""));
        weak.push(x.sq);
      }
      // Clouage : tour, fou ou dame
      if (pt === "b" || pt === "r" || pt === "q") {
        const dirs = pt === "b" ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : pt === "r" ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
        dirs.forEach((d) => {
          let x = df + d[0], y = dr + d[1], first = null;
          while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const q = B[y][x];
            if (q) { if (!first) { if (q.color !== opp || q.type === "k") break; first = { sq: xpSq(x, y), t: q.type }; } else { if (q.color === opp && q.type === "k") bits.push(P + " cloue " + xpArt(first.t, true) + " en " + first.sq + " : cette pièce ne peut plus bouger sans exposer le roi"); break; } }
            x += d[0]; y += d[1];
          }
        });
      }
    }
    // Colonnes ouvertes
    if (pt === "r" || pt === "q") {
      let mineP = 0, theirP = 0; for (let r = 0; r < 8; r++) { const q = B[r][df]; if (q && q.type === "p") { if (q.color === me) mineP++; else theirP++; } }
      if (!mineP && !theirP) { bits.push(P + " prend la colonne " + XP_FILES[df] + ", ouverte (aucun pion)"); files.push(XP_FILES[df]); }
      else if (!mineP && theirP && pt === "r") { bits.push(P + " vise le pion adverse sur la colonne " + XP_FILES[df] + ", sans pion à elle devant"); files.push(XP_FILES[df]); }
    }
    // Grande diagonale
    if (pt === "b" || pt === "q") {
      const onA = df === dr, onH = df + dr === 7;
      if (onA || onH) { const n = xpAttacks(B, df, dr).filter((a) => (onA ? a[0] === a[1] : a[0] + a[1] === 7)).length; if (n >= 5) { bits.push("sur la grande diagonale, ouverte sur " + n + " cases"); diags.push(onA ? ["a1", "h8"] : ["a8", "h1"]); } }
    }
    // Avant-poste du cavalier
    if (pt === "n") {
      const adv = me === "w" ? dr >= 3 : dr <= 4, dir = me === "w" ? 1 : -1;
      if (adv) {
        const prot = [df - 1, df + 1].some((x) => x >= 0 && x < 8 && B[dr - dir] && B[dr - dir][x] && B[dr - dir][x].type === "p" && B[dr - dir][x].color === me);
        let chase = false; for (let r = dr + dir; r >= 0 && r < 8; r += dir) [df - 1, df + 1].forEach((x) => { if (x >= 0 && x < 8 && B[r][x] && B[r][x].type === "p" && B[r][x].color === opp) chase = true; });
        const nEnemy = (() => { let c = 0; for (let r = 0; r < 8; r++) for (let x = 0; x < 8; x++) if (B[r][x] && B[r][x].type === "p" && B[r][x].color === opp && Math.abs(x - df) === 1 && (me === "w" ? r > dr : r < dr)) c++; return c; })();
        if (prot && !chase && nEnemy === 0) { bits.push("avant-poste solide : le cavalier est protégé par un pion, et aucun pion adverse ne peut le chasser"); out.push(mv.to); }
      }
    }
  }
  const cap1 = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  t = t.replace(/[.!]$/, (m) => m);
  if (!/[.!]$/.test(t)) t += ".";
  if (bits.length) t += " " + bits.map((x) => cap1(x) + ".").join(" ");
  if (g.in_check()) { // le roi attaqué est la cible
    for (let r = 0; r < 8; r++) for (let x = 0; x < 8; x++) { const q = B[r][x]; if (q && q.type === "k" && q.color === opp) weak.push(xpSq(x, r)); }
  }
  if (weak.length) v.weak = [...new Set(weak)];
  if (out.length) v.out = out;
  if (files.length) v.files = files;
  if (diags.length) v.diags = diags;
  return { t, v, to: mv.to };
}
/* Explication d'un coup d'une illustration (cache par illustration) */
function xpIll(ill, idx) {
  if (idx < 1 || idx > ill.sans.length) return null;
  if (!ill._xp) ill._xp = {};
  if (ill._xp[idx] === undefined) {
    const g = ill.fen ? new Chess(ill.fen) : new Chess();
    let prevTo = null;
    for (let i = 0; i < idx - 1; i++) { const m = g.move(ill.sans[i], { sloppy: true }); prevTo = m ? m.to : null; }
    ill._xp[idx] = xpExplain(g, ill.sans[idx - 1], ill.orient || "w", prevTo);
  }
  return ill._xp[idx];
}
