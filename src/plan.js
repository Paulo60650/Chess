/* ===== Plan de la semaine adaptatif : un tiers tactique, un tiers parties, un tiers point faible ===== */
var PLAN_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
var PLAN_AREAS = {
  ouv: { t: "Ouvertures", ic: "♗" },
  fin: { t: "Finales", ic: "♔" },
  strat: { t: "Stratégie", ic: "♜" },
  ment: { t: "Menaces et calcul", ic: "◉" }
};
function planMonday(t) { var d = parseD(t), w = (d.getDay() + 6) % 7; return addDays(t, -w); }
function planDayIdx(t) { return (parseD(t).getDay() + 6) % 7; }
/* Niveau de maîtrise de 0 à 1 pour chaque domaine. */
function planScores() {
  var ouv = LINES.length ? LINES.reduce(function (a, L) { return a + boxOf(L.id); }, 0) / (6 * LINES.length) : 0;
  var fin = EG_LIST.length ? EG_LIST.filter(function (x, i) { return S.eg && S.eg[i] && S.eg[i].ok; }).length / EG_LIST.length : 0;
  var strat = Object.keys(S.stv || {}).length / Math.max(1, STRAT.length + SACS.length + ADC.length);
  var ks = ["thr", "hang", "cct", "blind", "mem", "long"], tot = 0, sum = 0;
  ks.forEach(function (k) { var s = S.mind && S.mind[k]; if (s) tot += s.n; var a = mAcc(k); if (a != null) sum += a; });
  var accs = ks.map(mAcc).filter(function (a) { return a != null; });
  var ment = accs.length ? (sum / accs.length) * Math.min(1, tot / 40) : 0;
  var top = mTopCause();
  if (top && top !== "decision") ment *= 0.6;
  if (top === "decision") strat *= 0.6;
  return { ouv: Math.min(1, ouv), fin: fin, strat: Math.min(1, strat), ment: ment };
}
function planFocus(sc) {
  var order = ["ouv", "ment", "fin", "strat"];
  return order.slice().sort(function (a, b) { return sc[a] - sc[b] || order.indexOf(a) - order.indexOf(b); })[0];
}
function planWeakTasks(focus) {
  var a = [];
  if (focus === "ouv") {
    var due = LINES.filter(function (L) { return isDue(L.id, todayStr()); }).length;
    a.push({ t: "Séance de lignes", sub: due ? due + " ligne" + (due > 1 ? "s" : "") + " à réviser" : "Révise et apprends de nouvelles lignes", attrs: 'data-act="tab" data-v="rep"' });
    a.push({ t: "Fiches de plan", sub: plDueList().length + " fiche(s) à revoir", attrs: 'data-act="plgo"' });
  } else if (focus === "fin") {
    var les = EG_LESSONS.filter(function (l) { return !egRead(l.id); })[0];
    var ex = EG_LIST.map(function (x, i) { return i; }).filter(function (i) { return !(S.eg && S.eg[i] && S.eg[i].ok); })[0];
    a.push(les ? { t: "Leçon : " + les.t, sub: "Comprendre avant de s'entraîner", attrs: 'data-act="eglesson" data-id="' + les.id + '"' } : { t: "Finales", sub: "Reprends les exercices", attrs: 'data-act="endg"' });
    a.push(ex != null ? { t: "Exercice : " + EG_LIST[ex].t, sub: "Finale à réussir", attrs: 'data-act="egplay" data-i="' + ex + '"' } : { t: "Finales", sub: "Tout est réussi : rejoue les plus dures", attrs: 'data-act="endg"' });
  } else if (focus === "strat") {
    var un = STRAT.concat(ADC).filter(function (c) { return !stSeen(c.id); });
    a.push(un[0] ? { t: "Concept : " + un[0].t, sub: "Explication et partie illustrée", attrs: 'data-act="stc" data-id="' + un[0].id + '"' } : { t: "Stratégie", sub: "Relis un concept", attrs: 'data-act="tab" data-v="strat"' });
    a.push(un[1] ? { t: "Concept : " + un[1].t, sub: "Explication et partie illustrée", attrs: 'data-act="stc" data-id="' + un[1].id + '"' } : { t: "Problèmes de plans", sub: "Cherche le meilleur plan", attrs: 'data-act="pzpos"' });
  } else {
    var rank = M_DRILLS.slice().sort(function (x, y) { var ax = mAcc(x.k), ay = mAcc(y.k); return (ax == null ? -1 : ax) - (ay == null ? -1 : ay); });
    var tc = mTopCause(), pref = tc && M_CAUSES[tc].drill;
    var first = pref ? M_DRILLS.filter(function (d) { return d.k === pref; })[0] : rank[0], second = rank.filter(function (d) { return d !== first; })[0];
    a.push({ t: first.t, sub: "Exercice mental, 10 à 15 minutes", attrs: 'data-act="m_open" data-dr="' + first.k + '"' });
    a.push({ t: second.t, sub: "Exercice mental, 10 à 15 minutes", attrs: 'data-act="m_open" data-dr="' + second.k + '"' });
  }
  return a;
}
function planBuild(focus) {
  var w = planWeakTasks(focus), ment = M_DRILLS.slice().sort(function (x, y) { var ax = mAcc(x.k), ay = mAcc(y.k); return (ax == null ? -1 : ax) - (ay == null ? -1 : ay); })[0];
  return {
    focus: focus,
    days: [
      { g: "tact", t: "Tactique", sub: "Problèmes adaptés à ton Élo, solution trouvée avant de jouer", min: 25, attrs: 'data-act="pzadapt"' },
      { g: "weak", t: w[0].t, sub: w[0].sub, min: 30, attrs: w[0].attrs },
      { g: "games", t: "Une partie réfléchie", sub: "Cadence lente, contre Stockfish ou Maia", min: 40, attrs: 'data-act="vsopen"' },
      { g: "tact", t: focus === "ment" ? "Rafale 3 min" : ment.t, sub: focus === "ment" ? "Vitesse de reconnaissance" : "Menaces et calcul", min: 20, attrs: focus === "ment" ? 'data-act="rush"' : 'data-act="m_open" data-dr="' + ment.k + '"' },
      { g: "weak", t: w[1].t, sub: w[1].sub, min: 30, attrs: w[1].attrs },
      { g: "games", t: "Analyser mes parties", sub: "Importe tes parties, trouve tes erreurs et leurs causes", min: 40, attrs: 'data-act="tab" data-v="games"' },
      { g: "rev", t: "Révision et bilan", sub: "Fiches de plan à revoir, puis le bilan de la semaine", min: 20, attrs: 'data-act="plgo"' }
    ]
  };
}
function planGet(force) {
  var mon = planMonday(todayStr());
  if (force || !S.plan || S.plan.wk !== mon) {
    var sc = planScores(), f = planFocus(sc), b = planBuild(f);
    S.plan = { wk: mon, focus: f, days: b.days, done: {} }; save();
  }
  return S.plan;
}
function planSplit(p) {
  var s = { tact: 0, games: 0, weak: 0, rev: 0 };
  p.days.forEach(function (d) { s[d.g] += d.min; });
  return s;
}
var PLAN_G = { tact: "Tactique et calcul", games: "Parties et analyse", weak: "Point faible", rev: "Révision" };
function planCardHTML() {
  var p = planGet(), i = planDayIdx(todayStr()), d = p.days[i], dn = Object.keys(p.done).length, f = PLAN_AREAS[p.focus];
  return '<section class="card" data-k="violet" style="border-left:4px solid var(--k)"><div class="row between"><div class="stack" style="gap:2px"><span class="label">Plan de la semaine · ' + PLAN_DAYS[i] + " · " + d.min + ' min</span><b>' + esc(d.t) + '</b></div><span class="chip">' + dn + '/7</span></div><div class="row" style="margin-top:8px"><button class="btn primary" ' + d.attrs + '>Commencer</button><button class="btn" data-act="w_open">Semaine</button></div></section>';
}
function weekHTML() {
  var p = planGet(), t = todayStr(), ti = planDayIdx(t), sc = planScores(), sp = planSplit(p), tot = sp.tact + sp.games + sp.weak + sp.rev;
  var h = '<div class="hdr"><h1>Plan de la semaine</h1><p class="muted">Un bon entraînement tient en trois parts : la tactique, les parties analysées, et un seul point faible à la fois. Le plan se recalcule chaque lundi d\'après ta progression.</p></div>';
  h += '<section class="card" data-k="violet"><span class="label">Point faible de la semaine</span><h2>' + PLAN_AREAS[p.focus].ic + " " + esc(PLAN_AREAS[p.focus].t) + "</h2>";
  h += '<div class="stack" style="gap:8px;margin-top:8px">' + Object.keys(PLAN_AREAS).map(function (k) {
    return '<div><div class="row between small"><span>' + esc(PLAN_AREAS[k].t) + (k === p.focus ? " <b>· à travailler</b>" : "") + "</span><span class=\"muted\">" + Math.round(100 * sc[k]) + ' %</span></div><div class="bar" role="img" aria-label="' + esc(PLAN_AREAS[k].t) + " " + Math.round(100 * sc[k]) + ' pour cent"><i style="width:' + Math.round(100 * sc[k]) + '%"></i></div></div>';
  }).join("") + "</div>";
  var tc = mTopCause(); if (tc) h += '<p class="small muted" style="margin-top:8px">Tes parties montrent surtout : ' + esc(M_CAUSES[tc].t.toLowerCase()) + ".</p>";
  h += '<div class="row" style="margin-top:8px"><button class="btn small" data-act="w_regen">Recalculer</button></div></section>';
  h += '<section class="card"><span class="label">Répartition · ' + tot + " min</span><div class=\"row\" style=\"flex-wrap:wrap;gap:6px\">" + Object.keys(PLAN_G).map(function (g) { return '<span class="chip">' + PLAN_G[g] + " " + sp[g] + " min</span>"; }).join("") + "</div></section>";
  h += '<ul class="stack" style="gap:10px;list-style:none;padding:0;margin:0">' + p.days.map(function (d, i) {
    var done = !!p.done[i], today = i === ti;
    return '<li class="card' + (today ? " now" : "") + '" style="' + (today ? "border-color:var(--accent);" : "") + (done ? "opacity:.75" : "") + '"><div class="row between"><span class="label">' + PLAN_DAYS[i] + (today ? " · aujourd'hui" : "") + '</span><span class="chip">' + d.min + ' min</span></div><p style="margin:4px 0"><b>' + esc(d.t) + '</b><br><span class="small muted">' + esc(d.sub) + '</span></p><div class="row"><button class="btn' + (today && !done ? " primary" : "") + '" ' + d.attrs + ">Ouvrir</button><button class=\"btn\" data-act=\"w_done\" data-i=\"" + i + '" aria-pressed="' + done + '">' + (done ? "✓ Fait" : "Marquer fait") + "</button></div></li>";
  }).join("") + "</ul>";
  return h + weeklyHTML();
}
function planAct(d) {
  if (d.act === "w_open") { V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "week"; render(); window.scrollTo(0, 0); }
  else if (d.act === "w_done") { var p = planGet(); if (p.done[d.i]) delete p.done[d.i]; else { p.done[d.i] = 1; sfx("ok"); } save(); renderMain(); }
  else if (d.act === "w_regen") { planGet(true); renderMain(); }
}
