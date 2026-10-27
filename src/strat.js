/* ---------- Stratégie : concepts illustrés + sacrifices typiques (données : stratdata.js) ---------- */
function stSeen(id) { return !!(S.stv && S.stv[id]); }
function stGameAt(ill, idx) {
  const g = ill.fen ? new Chess(ill.fen) : new Chess();
  for (let i = 0; i < idx && i < ill.sans.length; i++) g.move(ill.sans[i], { sloppy: true });
  return g;
}
const stK = (ill) => (ill.key ? ' data-sk="' + esc(ill.key) + '"' : "");
function stMoveChips(ill, idx) {
  const g = ill.fen ? new Chess(ill.fen) : new Chess(), f = g.fen().split(" "); let num = Number(f[5]) || 1, turn = f[1];
  let h = '<div class="mvchips">';
  ill.sans.forEach((san, i) => {
    const label = (turn === "w" ? num + "." : (i === 0 ? num + "…" : "")) + dispSan(san);
    h += '<button class="mvchip' + (i + 1 === idx ? " cur" : "") + (ill.notes && ill.notes[i + 1] && !ill.nokeys ? " key" : "") + '" data-act="stgo"' + stK(ill) + ' data-i="' + (i + 1) + '">' + esc(label) + "</button>";
    if (turn === "b") num++; turn = turn === "w" ? "b" : "w";
  });
  return h + "</div>";
}
function stIllHTML(ill) {
  const cur = ill.key ? (V.sis && V.sis[ill.key] != null ? V.sis[ill.key] : ill.from) : (V.si == null ? ill.from : V.si), idx = Math.max(0, Math.min(cur, ill.sans.length)), g = stGameAt(ill, idx), hist = g.history({ verbose: true }), lm = hist.length && idx > 0 ? hist[hist.length - 1] : null;
  const keys = Object.keys(ill.notes || {}).map(Number).sort((a, b) => a - b);
  let h = '<div class="card"><span class="label">' + esc(ill.title) + '</span><p class="small muted">' + esc(ill.sub) + "</p>";
  const xp = !ill.noauto && idx > 0 ? xpIll(ill, idx) : null;
  const fin = ill.vzfinal && idx === ill.sans.length ? ill.vzfinal : null;
  const vz = fin || (ill.vz && ill.vz[idx]) || (xp ? xp.v : null);
  h += '<div style="width:100%;max-width:420px;margin:8px auto">' + boardHTML(g, { orient: ill.orient || "w", live: false, last: lm ? [lm.from, lm.to] : [], viz: vz, layers: V.layers }) + "</div>";
  if (vz) h += vizLegendHTML(vz);
  h += '<div class="navrow" role="group" aria-label="Parcourir les coups">' +
    '<button class="btn" data-act="stgo"' + stK(ill) + ' data-i="0"' + (idx === 0 ? " disabled" : "") + ' aria-label="Début">«</button>' +
    '<button class="btn" data-act="stgo"' + stK(ill) + ' data-i="' + (idx - 1) + '"' + (idx === 0 ? " disabled" : "") + ' aria-label="Coup précédent">‹</button>' +
    '<button class="btn primary" data-act="stgo"' + stK(ill) + ' data-i="' + (idx + 1) + '"' + (idx >= ill.sans.length ? " disabled" : "") + ' aria-label="Coup suivant">›</button>' +
    '<button class="btn" data-act="stgo"' + stK(ill) + ' data-i="' + ill.sans.length + '"' + (idx >= ill.sans.length ? " disabled" : "") + ' aria-label="Fin">»</button></div>';
  const note = (ill.notes && ill.notes[idx]) || (xp && xp.t);
  h += '<div class="note' + (note ? " good" : "") + '" aria-live="polite">' + (note ? esc(note) : '<span class="small muted">' + (idx === 0 && !ill.notes[0] ? "Appuie sur › pour jouer la suite. Les coups marqués d'un point sont commentés." : "Appuie sur › pour continuer, ou saute à un moment clé ci-dessous.") + "</span>") + "</div>";
  if (keys.length && !ill.nokeys) h += '<div class="row" style="flex-wrap:wrap;gap:6px"><span class="small muted">Moments clés :</span>' + keys.map((k) => '<button class="btn small' + (k === idx ? " primary" : "") + '" data-act="stgo"' + stK(ill) + ' data-i="' + k + '">' + (k === 0 ? "Départ" : esc(dispSan(ill.sans[k - 1]))) + "</button>").join("") + "</div>";
  h += stMoveChips(ill, idx) + "</div>";
  return h;
}
function stConceptOpen(id) { const c = STRAT_BY[id]; if (!c) return; V.sifor = null; V.stack.push({ view: V.view === "stratc" ? "concepts" : V.view, sid: V.sid, opId: V.opId }); V.view = "stratc"; V.cid = id; V.ii = 0; V.si = c.ills[0].from; render(); window.scrollTo(0, 0); }
function stSacOpen(id) { const s = SAC_BY[id]; if (!s) return; V.sifor = null; V.stack.push({ view: V.view, opId: V.opId, sacOp: V.sacOp }); V.view = "sac"; V.sid2 = id; V.si = s.ill.from; render(); window.scrollTo(0, 0); }
function stratHubHTML() {
  const seenC = STRAT.filter((c) => stSeen(c.id)).length, att = adList("att"), def = adList("def"), nS = Object.keys(STRUCTS).length;
  const sacSeen = SACS.filter((x) => stSeen("sac-" + x.id)).length, pos = allPz().filter((p) => p.pos), posDone = pos.filter((p) => pzDone(p.id)).length, pn = plDueList().length;
  const q = Object.keys(S.q || {}).filter((k) => S.q[k] && S.q[k].ok).length;
  let h = '<div class="hdr"><h1>Stratégie</h1><p class="muted">Tout le fond du milieu de jeu au même endroit : les concepts, l\'attaque et la défense, les plans de tes ouvertures et les problèmes de plans. Les sacrifices typiques sont dans la page de chaque ouverture.</p></div><ul class="trows" style="margin-bottom:14px">';
  h += trowHTML("♜", "blue", "Concepts de stratégie", STRAT.length + " concepts, du plus simple au plus difficile", seenC + "/" + STRAT.length, 'data-act="tab" data-v="concepts"');
  h += trowHTML("⚔", "red", "Attaquer", att.length + " concepts · sacrifice grec, attaque du roi", att.filter((c) => stSeen(c.id)).length + "/" + att.length, 'data-act="adopen" data-id="att"');
  h += trowHTML("🛡", "green", "Défendre", def.length + " concepts · menaces, contre-attaque", def.filter((c) => stSeen(c.id)).length + "/" + def.length, 'data-act="adopen" data-id="def"');
  h += trowHTML("▦", "violet", "Plans de jeu", nS + " fiches de structure · quiz " + q + "/" + nS, "", 'data-act="tab" data-v="plans"');
  h += trowHTML("◎", "teal", "Problèmes de plans", "Cherche le meilleur plan, pas une tactique", posDone + "/" + pos.length, 'data-act="pzpos"');
  h += trowHTML("⟲", "red", "Fiches de plan à réviser", pn ? pn + " à revoir" : "Tout est à jour", pn ? String(pn) : "✓", 'data-act="plgo"');
  return h + "</ul>";
}
function stratHTML() {
  const n = STRAT.filter((c) => stSeen(c.id)).length;
  let h = '<div class="hdr"><h1>Concepts de stratégie</h1><p class="muted">Les grands concepts du milieu de jeu, du plus simple au plus difficile. Chacun est expliqué puis illustré par une partie ou une position rejouable. ' + n + " vu" + (n > 1 ? "s" : "") + " sur " + STRAT.length + ".</p></div><div class=\"stack\">";
  STRAT.forEach((c, i) => {
    const seen = stSeen(c.id);
    h += '<button class="item sess' + (seen ? " done" : "") + '" data-k="' + (c.lv === 1 ? "green" : c.lv === 2 ? "amber" : "red") + '" data-act="stc" data-id="' + c.id + '"><span class="check' + (seen ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + (i + 1) + ". " + esc(c.t) + '</b><span class="small muted">' + esc(c.ills[0].title) + " · niveau " + "●".repeat(c.lv) + "○".repeat(3 - c.lv) + "</span></div></button>";
  });
  h += "</div>";
  return h;
}
function stratcHTML() {
  const c = STRAT_BY[V.cid]; if (!c) return backBtn("Stratégie");
  const ill = c.ills[V.ii || 0] || c.ills[0], idx = c.ills.indexOf(ill), lst = c.grp ? adList(c.grp) : STRAT, nm = c.grp ? AD_INFO[c.grp].t : "Stratégie";
  let h = backBtn(nm) + '<div class="hdr kh" data-k="' + (c.lv === 1 ? "green" : c.lv === 2 ? "amber" : "red") + '"><div class="row"><span class="chip k">Concept ' + (lst.indexOf(c) + 1) + " sur " + lst.length + '</span><span class="chip">niveau ' + "●".repeat(c.lv) + "○".repeat(3 - c.lv) + "</span></div><h1>" + esc(c.t) + '</h1><p class="muted">' + esc(c.intro) + "</p></div>";
  h += '<div class="stack" style="gap:16px"><div class="card"><span class="label">À retenir</span><ul>' + c.pts.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul></div>";
  if (c.ills.length > 1) h += '<div class="seg" role="group" aria-label="Exemples">' + c.ills.map((x, i) => '<button data-act="stex" data-i="' + i + '" aria-pressed="' + (i === idx) + '">Exemple ' + (i + 1) + "</button>").join("") + "</div>";
  h += stIllHTML(ill);
  if (c.grp || adExs(c).length) h += adExHTML(c);
  h += '<div class="row"><button class="btn' + (stSeen(c.id) ? "" : " primary") + '" data-act="stseen" data-id="' + c.id + '">' + (stSeen(c.id) ? "✓ Concept compris" : "J'ai compris, marquer comme vu") + "</button></div></div>";
  return h;
}
function sacsHTML() {
  const o = OP_BY_ID[V.sacOp] || OPENINGS[0], l = SACS.filter((s) => s.op === o.id);
  let h = backBtn("Retour") + '<div class="hdr kh" data-k="' + o.k + '"><h1>Sacrifices typiques</h1><div class="row"><span class="ava sm">' + o.g + "</span><b>" + esc(o.name) + '</b></div><p class="muted">Des sacrifices que l\'on rencontre souvent dans cette ouverture : ceux que tu peux tenter, et ceux que ton adversaire peut tenter contre toi. Chaque exemple se rejoue coup par coup.</p></div><div class="stack">';
  l.forEach((s) => { h += '<button class="item sess' + (stSeen("sac-" + s.id) ? " done" : "") + '" data-k="' + (s.who === "toi" ? "green" : "amber") + '" data-act="sac" data-id="' + s.id + '"><span class="check' + (stSeen("sac-" + s.id) ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + esc(s.name) + '</b><span class="small muted">' + (s.who === "toi" ? "Tu le joues" : "Contre toi") + " · " + esc(s.tag) + "</span></div></button>"; });
  h += "</div><div class=\"row\" style=\"flex-wrap:wrap;gap:6px\">" + OPENINGS.map((x) => '<button class="btn small' + (x.id === o.id ? " primary" : "") + '" data-act="sacs" data-id="' + x.id + '">' + esc(x.short) + "</button>").join("") + "</div>";
  return h;
}
function sacHTML() {
  const s = SAC_BY[V.sid2]; if (!s) return backBtn("Retour");
  const o = OP_BY_ID[s.op];
  let h = backBtn("Retour") + '<div class="hdr kh" data-k="' + o.k + '"><div class="row"><span class="chip k">' + esc(o.short) + '</span><span class="chip">' + (s.who === "toi" ? "Tu le joues" : "Contre toi") + "</span></div><h1>" + esc(s.name) + '</h1><p class="muted">' + esc(s.why) + "</p></div>";
  h += '<div class="stack" style="gap:16px">' + stIllHTML(s.ill);
  h += '<div class="card"><span class="label">À retenir</span><ul>' + s.pts.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul>" + (s.eval ? '<p class="small muted">Évaluation du moteur après le sacrifice : ' + esc(s.eval) + ".</p>" : "") + "</div>";
  h += '<div class="row"><button class="btn' + (stSeen("sac-" + s.id) ? "" : " primary") + '" data-act="stseen" data-id="sac-' + s.id + '">' + (stSeen("sac-" + s.id) ? "✓ Vu" : "Marquer comme vu") + "</button>" + (s.pz ? '<button class="btn" data-act="pzopen" data-id="' + s.pz + '">S\'entraîner sur ce thème</button>' : "") + "</div></div>";
  return h;
}

/* Fiche de plan : la ligne qui mène à la structure, rejouable coup par coup, avec explications et repères */
function structIllHTML(sid) {
  const s = STRUCTS[sid], rep = LINE_BY_ID[s.rep], op = OP_BY_ID[s.op]; if (!rep) return "";
  if (!s._ill) {
    const notes = {}; notes[0] = "Voici comment on arrive à la structure « " + s.title + " » : la ligne « " + rep.name + " », jouée coup par coup. Chaque coup est expliqué ; à la fin, les repères montrent tes plans.";
    notes[rep.sans.length] = "Structure atteinte : " + s.tag + ". Les repères colorés rappellent tes plans (flèches vertes), les menaces adverses (rouges) et les cases clés.";
    s._ill = { kind: "struct", title: "Exemple : " + rep.name, sub: "La ligne qui mène à cette structure, jouée coup par coup", sans: rep.sans, from: 0, orient: op.side, notes, vzfinal: VIZ[sid] || null };
  }
  if (V.sifor !== "s:" + sid) { V.sifor = "s:" + sid; V.si = 0; }
  return stIllHTML(s._ill);
}
