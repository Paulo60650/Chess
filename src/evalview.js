/* Évaluation Stockfish précalculée (profondeur 15) des positions des lignes. Valeurs en centipions, point de vue des Blancs. */
function sfEvalKey(fen) { return fen.split(" ").slice(0, 4).join(" "); }
function sfEvalOf(fen) { const v = typeof EVAL_DATA !== "undefined" ? EVAL_DATA[sfEvalKey(fen)] : undefined; return v === undefined ? null : v; }
function sfEvalText(v) {
  if (Math.abs(v) >= 90000) { const n = 100000 - Math.abs(v); return (v > 0 ? "Mat des Blancs en " : "Mat des Noirs en ") + n; }
  const p = v / 100; return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p).toFixed(1).replace(".", ",");
}
function sfEvalVerdict(v) {
  const a = Math.abs(v), s = v > 0 ? "Blancs" : "Noirs";
  if (Math.abs(v) >= 90000) return "mat forcé";
  if (a < 25) return "position égale";
  if (a < 80) return "léger avantage " + (v > 0 ? "aux " : "aux ") + s;
  if (a < 200) return "avantage net aux " + s;
  if (a < 500) return "gros avantage aux " + s;
  return "position gagnante pour les " + s;
}
function sfEvalHTML(g) {
  const v = sfEvalOf(g.fen()); if (v === null) return "";
  const pct = Math.abs(v) >= 90000 ? (v > 0 ? 100 : 0) : Math.round(100 / (1 + Math.exp(-v / 160)));
  return '<div class="sfeval" title="Évaluation de Stockfish (profondeur 15), du point de vue des Blancs"><div class="sfbar"><i style="width:' + pct + '%"></i></div><div class="sftxt"><b>' + sfEvalText(v) + '</b> <span class="small muted">· ' + sfEvalVerdict(v) + ' · Stockfish</span></div></div>';
}
