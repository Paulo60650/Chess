/* ---------- Révision espacée des fiches de plan ----------
   Pour chaque structure vue dans une ligne étudiée : rappel des plans, puis quiz, puis note de confiance. */
var PL = null;
function plSr() { if (!S.sr) S.sr = {}; return S.sr; }
function plEligible(sid) {
  if (plSr()[sid]) return true;
  return LINES.some((L) => L.struct === sid && isSeen(L.id));
}
function plDueList() {
  const t = todayStr();
  return Object.keys(STRUCTS).filter((sid) => plEligible(sid) && (!plSr()[sid] || diffDays(t, plSr()[sid].due) <= 0))
    .sort((a, b) => ((plSr()[a] || { box: -1 }).box) - ((plSr()[b] || { box: -1 }).box));
}
function plRevOpen() {
  const q = plDueList().slice(0, 6); if (!q.length) return;
  PL = { queue: q, i: 0, stage: "start", self: null, pick: null, res: [] };
  PL.stage = plSr()[q[0]] ? "recall" : "learn";
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "plrev"; render(); window.scrollTo(0, 0);
}
function plCardHTML() {
  const n = plDueList().length, tot = Object.keys(STRUCTS).filter(plEligible).length;
  if (!tot) return '<div class="note">Les fiches de plan à réviser apparaîtront ici dès que tu auras étudié une ligne.</div>';
  const learned = Object.keys(plSr()).length;
  return '<div class="card flat" data-k="violet" style="border-left:4px solid var(--k)"><div class="row between"><div class="stack" style="gap:2px"><span class="label">Fiches de plan</span><b>' + (n ? n + " à réviser aujourd'hui" : "Tout est à jour") + '</b><span class="small muted">' + learned + " sur " + tot + (tot > 1 ? " fiches déjà révisées." : " fiche déjà révisée.") + " Rappel des plans, puis quiz.</span></div>" + (n ? '<button class="btn primary small" data-act="plgo">Réviser</button>' : "") + "</div></div>";
}
function plRevHTML() {
  if (!PL) return backBtn();
  const sid = PL.queue[PL.i], s = STRUCTS[sid], op = OP_BY_ID[s.op], rep = LINE_BY_ID[s.rep], g = lineGame(rep);
  const li = (a, c) => '<ul class="list ' + (c || "") + '">' + a.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  let h = '<button class="btn small back" data-act="plquit">← Quitter</button><div class="hdr kh" data-k="' + op.k + '"><div class="row"><span class="chip">Fiche ' + (PL.i + 1) + " sur " + PL.queue.length + "</span>" + sideChip(op.side) + '<span class="chip k" data-k="' + op.k + '">' + esc(op.short) + "</span></div><h1>" + esc(s.title) + "</h1><p class=\"muted\">" + esc(s.tag) + "</p></div>";
  h += '<div class="trainer"><div class="stack">' + boardHTML(g, { orient: op.side, marks: [], last: lastMoveOf(g) || [], live: false }) + '<p class="small muted">Position après « ' + esc(rep.name) + " ».</p></div><div class=\"stack\" style=\"gap:12px\">";
  if (PL.stage === "recall") {
    h += '<div class="card"><span class="label">Rappel</span><h3>Quels sont tes plans dans cette structure ?</h3><p class="muted">Dis-les à voix haute ou note-les : où vont tes pièces, quelle cassure prépares-tu, que veut l\'adversaire ? Puis révèle la fiche.</p><div class="row"><button class="btn primary" data-act="plreveal">Révéler la fiche</button></div></div>';
  } else if (PL.stage === "reveal" || PL.stage === "learn") {
    h += '<div class="card"><span class="label">Tes plans</span>' + li(s.plans) + '</div><div class="card"><span class="label">Plans de l\'adversaire</span>' + li(s.opp, "opp") + '</div><div class="card"><span class="label">Cassures</span>' + li(s.breaks) + '</div><div class="card"><span class="label">Erreurs à éviter</span>' + li(s.mistakes, "warnl") + "</div>";
    if (PL.stage === "learn") h += '<div class="row"><button class="btn primary" data-act="plquizgo">J\'ai lu, passons au quiz</button></div>';
    else h += '<div class="card"><span class="label">Tu les connaissais ?</span><div class="row" style="flex-wrap:wrap"><button class="btn" data-act="plself" data-v="2">Oui, tous</button><button class="btn" data-act="plself" data-v="1">En partie</button><button class="btn" data-act="plself" data-v="0">Pas du tout</button></div></div>';
  } else if (PL.stage === "quiz") {
    const q = s.quiz;
    h += '<div class="card"><span class="label">Quiz</span><h3>' + esc(q.q) + '</h3><div class="stack">' + q.opts.map((o, i) => '<button class="opt' + (PL.pick == null ? "" : i === q.a ? " ok" : i === PL.pick ? " ko" : "") + '" data-act="plpick" data-i="' + i + '"' + (PL.pick != null ? " disabled" : "") + ">" + esc(o) + "</button>").join("") + "</div>";
    if (PL.pick != null) h += '<div class="note ' + (PL.pick === q.a ? "good" : "bad") + '"><b>' + (PL.pick === q.a ? "Exact." : "Pas tout à fait.") + "</b> " + esc(q.why) + '</div><div class="row"><button class="btn primary" data-act="plfinish">Continuer</button></div>';
    h += "</div>";
  } else if (PL.stage === "res") {
    const r = PL.res[PL.res.length - 1];
    h += '<div class="card"><span class="label">Bilan de la fiche</span><h2>' + (r.ok ? "Fiche retenue" : "À revoir bientôt") + '</h2><p class="muted">Prochaine révision ' + (r.days <= 1 ? "demain" : "dans " + r.days + " jours") + '.</p><div class="row">' + (PL.i + 1 < PL.queue.length ? '<button class="btn primary" data-act="plnext">Fiche suivante</button>' : '<button class="btn primary" data-act="plquit">Terminer</button>') + "</div></div>";
  }
  return h + "</div></div>";
}
function plFinish() {
  const sid = PL.queue[PL.i], q = STRUCTS[sid].quiz, okQ = PL.pick === q.a, r = plSr()[sid] || { box: 0 };
  const first = !plSr()[sid], self = PL.self == null ? 2 : PL.self;
  recordQuiz(sid, okQ);
  let box;
  if (first) box = okQ ? 1 : 0;
  else if (okQ && self === 2) box = Math.min(INTERVALS.length - 1, (r.box || 0) + 1);
  else if (okQ && self === 1) box = r.box || 0;
  else box = 0;
  const days = Math.max(1, INTERVALS[box] || 1);
  plSr()[sid] = { box, due: addDays(todayStr(), days), last: todayStr() };
  PL.res.push({ sid, ok: okQ && self >= 1, days });
  logDay((l) => { l.pl = (l.pl || 0) + 1; });
  PL.stage = "res"; save(); renderMain();
}
function plNext() {
  PL.i++; PL.self = null; PL.pick = null; PL.stage = plSr()[PL.queue[PL.i]] ? "recall" : "learn"; renderMain(); window.scrollTo(0, 0);
}
