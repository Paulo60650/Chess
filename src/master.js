/* ===== Parties de maître, à la suite de l'étude d'une ligne ===== */
function masterIll(g) {
  if (!g._ill) {
    const L = LINE_BY_ID[g.line], norm = (s) => s.replace(/[+#?!]/g, "");
    let n = 0; while (n < L.sans.length && n < g.sans.length && norm(L.sans[n]) === norm(g.sans[n])) n++;
    g._n = n;
    g._ill = { kind: "pos", title: "Partie de maître : " + g.w + " – " + g.b, sub: g.ev + ", " + g.yr + " · résultat " + g.res.replace("-", "–").replace("1/2–1/2", "½–½"), sans: g.sans, from: n, orient: g.side, notes: g.notes };
  }
  return g._ill;
}
function masterTeaser(L) {
  const gs = MASTER_BY_LINE[L.id]; if (!gs) return "";
  return '<div class="note good small">🏆 Une partie de maître (' + esc(gs[0].w.split(" ").pop()) + " – " + esc(gs[0].b.split(" ").pop()) + ", " + esc(gs[0].yr) + ") t'attend à la fin de cette ligne.</div>";
}
function masterHTML(L) {
  const gs = MASTER_BY_LINE[L.id]; if (!gs) return "";
  const g = gs[0], ill = masterIll(g), key = "gm:" + g.id, n = g._n;
  if (V.sifor !== key) { V.sifor = key; V.si = ill.from; }
  const rel = n >= L.sans.length ? "La partie suit ta ligne jusqu'au bout (coup " + Math.ceil(L.sans.length / 2) + "), puis continue." : n >= 6 ? "Elle suit ta ligne jusqu'au coup " + Math.ceil(n / 2) + ", puis s'en écarte en gardant la même structure." : "L'ordre des coups diffère de ta ligne, mais la structure obtenue est la même.";
  return '<div class="stack" style="gap:10px"><h2 class="sec">Partie de maître</h2><p class="muted">' + esc(g.sum) + " " + esc(rel) + " Fais défiler les coups avec ›.</p>" + stIllHTML(ill) + "</div>";
}
