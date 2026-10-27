/* ---------- Motifs de mat : écrans (données dans matsdata.js) ---------- */
function matList(mt) { return PUZZLES.filter((p) => p.mt === mt).sort((a, b) => (a.r || 0) - (b.r || 0)); }
function matExample(mt) { const l = matList(mt).slice().sort((a, b) => a.sol.length - b.sol.length || (a.r || 0) - (b.r || 0)); return l[0] || null; }
function matFinal(p) { const g = new Chess(p.fen); p.sol.forEach((m) => g.move(m)); return g; }
function matOpen() { V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "mats"; V.mt = null; render(); window.scrollTo(0, 0); }
function matNext(mt, from) {
  const l = matList(mt), i = from ? l.findIndex((p) => p.id === from) + 1 : 0;
  const n = l.slice(i).concat(l.slice(0, i)).find((p) => !pzDone(p.id) && p.id !== from);
  return n ? n.id : null;
}
function matsHTML() {
  if (V.mt && MATS_BY[V.mt]) return matDetailHTML(V.mt);
  const tot = MATS.reduce((a, m) => a + matList(m[0]).length, 0), done = MATS.reduce((a, m) => a + matList(m[0]).filter((p) => pzDone(p.id)).length, 0);
  let h = '<div class="hdr"><h1>Motifs de mat</h1><p class="muted">' + MATS.length + " mats classiques à reconnaître d'un coup d'œil, avec leur position finale, une explication et des problèmes. " + done + " problèmes réussis sur " + tot + ".</p></div>";
  h += '<div class="matgrid">';
  MATS.forEach((m) => {
    const ex = matExample(m[0]), l = matList(m[0]), d = l.filter((p) => pzDone(p.id)).length;
    h += '<div class="matcard" role="button" tabindex="0" data-act="matd" data-id="' + m[0] + '">' + (ex ? '<div inert aria-hidden="true" style="pointer-events:none">' + boardHTML(matFinal(ex), { orient: new Chess(ex.fen).turn(), live: false, last: [] }) + "</div>" : "") + '<b>' + esc(m[1]) + '</b><span class="small muted">' + d + " / " + l.length + " réussis</span></div>";
  });
  return h + "</div>";
}
function matDetailHTML(mt) {
  const m = MATS_BY[mt], l = matList(mt), ex = matExample(mt), d = l.filter((p) => pzDone(p.id)).length;
  let h = '<button class="btn small back" data-act="matback">← Motifs de mat</button><div class="hdr kh" data-k="red"><h1>' + esc(m[1]) + "</h1><p class=\"muted\">" + esc(m[2]) + "</p></div>";
  h += '<div class="trainer"><div class="stack">' + (ex ? matIll(mt, m, ex) : "") + '</div><div class="stack" style="gap:12px"><div class="card"><span class="label">Comment le reconnaître</span><p>' + esc(m[3]) + '</p></div><div class="card"><span class="label">S\'entraîner</span><p class="muted">' + l.length + " problèmes, du plus facile au plus dur. " + d + ' réussis.</p><div class="row"><button class="btn primary" data-act="matgo" data-id="' + mt + '"' + (l.length ? "" : " disabled") + ">" + (d ? "Continuer" : "Commencer") + "</button></div></div></div></div>";
  return h;
}

/* Exemple joué du motif : la solution d'un problème de la série, coup par coup, avec explications et repères */
function matIll(mt, m, ex) {
  if (!ex._ill) {
    const me = new Chess(ex.fen).turn(), notes = {};
    notes[0] = (me === "w" ? "Les Blancs" : "Les Noirs") + " jouent et mènent au mat « " + m[1] + " ». Avance coup par coup pour voir comment on y arrive.";
    notes[ex.sol.length] = "Échec et mat ! " + m[2];
    ex._ill = { kind: "pos", title: "Exemple : " + m[1], sub: "Un problème de la série, joué coup par coup", fen: ex.fen, sans: ex.sol, from: 0, orient: me, notes };
  }
  if (V.sifor !== "m:" + mt) { V.sifor = "m:" + mt; V.si = 0; }
  return stIllHTML(ex._ill);
}
