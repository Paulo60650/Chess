/* ===== Chapitres Attaquer et Défendre (dans Apprendre) ===== */
function adList(g) { return ADC.filter(function (c) { return c.grp === g; }); }
function adExs(c) { return allPz().filter(function (p) { return p.cpt === c.id; }); }
var AD_INFO = {
  att: { t: "Attaquer", k: "red", ic: "⚔", intro: "Attaquer, c'est transformer un avantage (développement, espace, roi adverse affaibli) en menaces concrètes. Du plus simple au plus difficile : quand attaquer, comment amener les pièces, puis les grands schémas, dont le sacrifice grec." },
  def: { t: "Défendre", k: "green", ic: "🛡", intro: "Défendre, c'est comprendre ce que veut l'adversaire, l'empêcher, puis neutraliser ses pièces dangereuses. Du plus simple au plus difficile : repérer la menace, la prophylaxie, l'échange, la contre-attaque et les ressources de survie." }
};
function adOpen(g) {
  if (V.view === "ad") { V.adg = g; renderMain(); window.scrollTo(0, 0); return; }
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "ad"; V.adg = g; render(); window.scrollTo(0, 0);
}
function adHTML() {
  var g = V.adg === "def" ? "def" : "att", I = AD_INFO[g], L = adList(g), n = L.filter(function (c) { return stSeen(c.id); }).length;
  var h = '<div class="seg" role="group" aria-label="Chapitre">' + ["att", "def"].map(function (x) { return '<button data-act="adopen" data-id="' + x + '" aria-pressed="' + (x === g) + '">' + AD_INFO[x].t + "</button>"; }).join("") + "</div>";
  h += '<div class="hdr"><h1>' + I.t + '</h1><p class="muted">' + esc(I.intro) + " " + n + " vu" + (n > 1 ? "s" : "") + " sur " + L.length + ".</p></div><div class=\"stack\">";
  L.forEach(function (c, i) {
    var seen = stSeen(c.id), ex = adExs(c), dn = ex.filter(function (p) { return pzDone(p.id); }).length;
    h += '<button class="item sess' + (seen ? " done" : "") + '" data-k="' + (c.lv === 1 ? "green" : c.lv === 2 ? "amber" : "red") + '" data-act="stc" data-id="' + c.id + '"><span class="check' + (seen ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + (i + 1) + ". " + esc(c.t) + '</b><span class="small muted">niveau ' + "●".repeat(c.lv) + "○".repeat(3 - c.lv) + (ex.length ? " · exercices " + dn + "/" + ex.length : "") + "</span></div></button>";
  });
  return h + "</div>";
}
function adExHTML(c) {
  var ex = adExs(c); if (!ex.length) return "";
  ex.sort(function (a, b) { return pzRating(a) - pzRating(b); });
  var dn = ex.filter(function (p) { return pzDone(p.id); }).length;
  var h = '<div class="card"><div class="row between"><span class="label">Exercices</span><span class="chip">' + dn + "/" + ex.length + '</span></div><p class="small muted">' + (ex.every(function (p) { return p.pos; }) ? "Positions de partie sans tactique : cherche le meilleur plan (coup vérifié par Stockfish), du plus facile au plus difficile." : "Positions réelles de la base de problèmes Lichess, du plus facile au plus difficile.") + '</p><div class="row" style="flex-wrap:wrap;gap:6px">';
  ex.forEach(function (p, i) { h += '<button class="btn small' + (pzDone(p.id) ? "" : " primary") + '" data-act="pzopen" data-id="' + p.id + '" aria-label="Exercice ' + (i + 1) + ", niveau " + pzRating(p) + '">' + (pzDone(p.id) ? "✓ " : "") + (i + 1) + "</button>"; });
  return h + "</div></div>";
}
