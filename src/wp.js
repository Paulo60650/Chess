/* ---------- Pic-vert (méthode Woodpecker) ----------
   Principe : une série fixe de problèmes que tu repasses en cycles, de plus en plus vite et sans faute.
   Notes (F à A+) et temps cibles inspirés de chesspecker (AGPL-3.0, github.com/chesspecker/chesspecker). */
var WP_LEVELS = [["easiest", "Bien plus facile", -550], ["easier", "Plus facile", -250], ["normal", "À ton niveau", 0], ["harder", "Plus dur", 250], ["hardest", "Bien plus dur", 550]];
var WP_GRADES = ["F", "E", "D", "C", "B", "A", "A+"];
function wpSets() { if (!S.wp) S.wp = { sets: [] }; return S.wp.sets; }
function wpSet(id) { return wpSets().find((s) => s.id === id) || null; }
function wpGrade(o) {
  if (o.cheat || o.mistakes >= 3) return 1;
  if (o.mistakes === 2 || (o.mistakes === 1 && o.t >= o.max)) return 2;
  if (o.mistakes === 1 || o.t >= o.max) return 3;
  if (o.t >= o.min) return 4;
  return o.streak < 2 ? 5 : 6;
}
function wpFmt(ms) { const s = Math.round(ms / 1000), m = Math.floor(s / 60); return m ? m + " min " + String(s % 60).padStart(2, "0") + " s" : s + " s"; }
function wpLast(s, id) { const g = s.grades[id]; return g && g.length ? g[g.length - 1] : 0; }
function wpShuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
function wpPool(th) { return allPz().filter((p) => p.th !== "Ton erreur" && !p.mine && (th === "all" || p.th === th)); }
function wpCreate(th, size, lvl) {
  const off = (WP_LEVELS.find((l) => l[0] === lvl) || WP_LEVELS[2])[2], target = eloS().p + off;
  const pool = wpPool(th).sort((a, b) => Math.abs(pzRating(a) - target) - Math.abs(pzRating(b) - target));
  const n = Math.min(size, pool.length); if (n < 3) return null;
  const ids = wpShuffle(pool.slice(0, Math.min(pool.length, n * 2)).map((p) => p.id)).slice(0, n);
  const s = { id: "w" + Date.now().toString(36), title: (th === "all" ? "Toutes tactiques" : th) + " · " + n, th, lvl, ids, created: todayStr(), cycles: 0, times: [], grades: {}, streak: {}, pass: null, lastRes: null };
  s.pass = { kind: "full", order: wpShuffle(ids), done: {}, t: 0, mist: 0 };
  wpSets().push(s); save(); return s;
}
function wpWeakThemes() {
  const st = themeStats();
  return Object.keys(st).filter((k) => k !== "Ton erreur" && st[k].rated >= 2).sort((a, b) => st[a].rate - st[b].rate).slice(0, 3);
}
function wpCreateWeak(size) {
  const ths = wpWeakThemes(); if (!ths.length) return null;
  const target = eloS().p - 150, pool = allPz().filter((p) => ths.indexOf(p.th) >= 0 && !p.mine);
  const bad = (p) => { const r = S.pz[p.id]; return !r || !r.rated || r.errs > 0 || !r.f ? 0 : 1; };
  pool.sort((a, b) => bad(a) - bad(b) || Math.abs(pzRating(a) - target) - Math.abs(pzRating(b) - target));
  const n = Math.min(size || 20, pool.length); if (n < 3) return null;
  const ids = wpShuffle(pool.slice(0, n).map((p) => p.id));
  const s = { id: "w" + Date.now().toString(36), title: "Mes faiblesses · " + ths.join(", "), th: "weak", lvl: "easier", ids, created: todayStr(), cycles: 0, times: [], grades: {}, streak: {}, pass: null, lastRes: null };
  s.pass = { kind: "full", order: wpShuffle(ids), done: {}, t: 0, mist: 0 };
  wpSets().push(s); save(); return s;
}
function wpNextId(s) { return s.pass.order.find((id) => !(id in s.pass.done)) || null; }
function wpPlay(sid) {
  const s = wpSet(sid); if (!s) return;
  const id = wpNextId(s); if (!id) return;
  puzOpen(id, { mode: "wp", sid });
}
function wpNext(sid) { const s = wpSet(sid); return s ? wpNextId(s) : null; }
/* Appelée par puzFinish : note le problème et clôt le passage s'il est terminé */
function wpRecord(p, shown) {
  const s = wpSet(p.sid); if (!s || !s.pass || p.id in s.pass.done) return;
  const n = Math.ceil(p.pz.sol.length / 2), t = Math.min(Date.now() - p.t0, 240000);
  const mistakes = p.errs + (p.hinted ? 1 : 0);
  const st = s.streak[p.id] || 0;
  const g = wpGrade({ cheat: shown, mistakes, t: t / 1000, max: n * 8, min: n * 4, streak: st });
  (s.grades[p.id] = s.grades[p.id] || []).push(g);
  s.streak[p.id] = g >= 5 ? st + 1 : 0;
  s.pass.done[p.id] = { g, t, m: mistakes }; s.pass.t += t; s.pass.mist += mistakes;
  p.wpg = { g, t, m: mistakes, shown };
  if (!wpNextId(s)) { wpClosePass(s); p.wpEnd = true; }
}
function wpClosePass(s) {
  const pass = s.pass, vals = s.ids.map((id) => wpLast(s, id));
  const weak = s.ids.filter((id) => wpLast(s, id) < 4);
  s.cycleT = (s.cycleT || 0) + pass.t;
  const res = { kind: pass.kind, t: pass.t, mist: pass.mist, n: pass.order.length, avg: vals.reduce((a, b) => a + b, 0) / vals.length, weak: weak.length, d: todayStr() };
  if (!weak.length) {
    s.cycles++; s.times.push(s.cycleT); res.cycleDone = true; res.cycleT = s.cycleT; s.cycleT = 0;
    s.pass = { kind: "full", order: wpShuffle(s.ids), done: {}, t: 0, mist: 0 };
  } else {
    s.pass = { kind: "rev", order: weak.slice().sort((a, b) => wpLast(s, a) - wpLast(s, b)), done: {}, t: 0, mist: 0 };
  }
  s.lastRes = res;
  logDay((l) => { l.w = (l.w || 0) + 1; });
}
function wpOpen() { V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "wp"; V.wpsid = null; render(); window.scrollTo(0, 0); }
function wpSetOpen(sid) { V.wpsid = sid; renderMain(); window.scrollTo(0, 0); }
var WPF = { th: "all", size: 20, lvl: "normal" };
function wpSparkHTML(times) {
  if (!times.length) return "";
  const mx = Math.max.apply(null, times);
  return '<div class="stack" style="gap:6px">' + times.map((t, i) => '<div class="row" style="gap:8px"><span class="small muted" style="width:62px">Cycle ' + (i + 1) + '</span><div style="flex:1;background:var(--line,#e3e6ef);border-radius:6px;height:12px"><div style="width:' + Math.max(6, Math.round(100 * t / mx)) + '%;height:12px;border-radius:6px;background:var(--accent,#2c4bd9)"></div></div><b class="small" style="min-width:70px;text-align:right">' + wpFmt(t) + "</b></div>").join("") + "</div>";
}
function wpHTML() {
  if (V.wpsid && wpSet(V.wpsid)) return wpSetHTML(wpSet(V.wpsid));
  let h = backBtn("S'entraîner") + '<div class="hdr"><h1>Pic-vert</h1><p class="muted">La méthode Woodpecker : tu prends une petite série de problèmes et tu la repasses en cycles. À chaque cycle tu vas plus vite, avec moins de fautes, jusqu\'à voir les motifs d\'un coup d\'œil. Chaque problème reçoit une note de F à A+ selon tes erreurs et ton temps.</p></div>';
  const sets = wpSets();
  if (sets.length) {
    h += '<section class="card"><span class="label">Tes séries</span><div class="stack">';
    sets.slice().reverse().forEach((s) => {
      const m = s.ids.filter((id) => wpLast(s, id) >= 4).length, best = s.times.length ? Math.min.apply(null, s.times) : 0;
      h += '<button class="item" data-k="amber" data-act="wpset" data-id="' + s.id + '"><div class="stack" style="gap:2px"><b>' + esc(s.title) + '</b><span class="small muted">' + s.cycles + " cycle" + (s.cycles > 1 ? "s" : "") + " terminé" + (s.cycles > 1 ? "s" : "") + " · " + m + "/" + s.ids.length + " maîtrisés" + (best ? " · record " + wpFmt(best) : "") + "</span></div></button>";
    });
    h += "</div></section>";
  }
  const weak = wpWeakThemes();
  h += '<section class="card" data-k="red" style="border-left:4px solid var(--k)"><span class="label">Mes faiblesses</span>' + (weak.length ? '<p class="muted">D\'après tes résultats, tes thèmes les plus fragiles : <b>' + weak.map(esc).join(", ") + '</b>. La série reprend en priorité les problèmes que tu as ratés.</p><div class="row"><button class="btn primary" data-act="wpweak">Créer une série sur mes faiblesses (20)</button></div>' : '<p class="muted">Résous quelques problèmes (au moins 2 par thème) pour que l\'appli repère les thèmes où tu te trompes le plus.</p>') + "</section>";
  const ths = PZ_THEMES.filter((t) => t[0] !== "Ton erreur" && wpPool(t[0]).length >= 3);
  const nPool = wpPool(WPF.th).length;
  h += '<section class="card"><span class="label">Nouvelle série</span><span class="label">Thème</span><div class="chips"><button class="pill" data-k="blue" data-act="wpf" data-f="th" data-v="all" aria-pressed="' + (WPF.th === "all") + '">Tous</button>' +
    ths.map((t) => '<button class="pill" data-k="' + t[1] + '" data-act="wpf" data-f="th" data-v="' + esc(t[0]) + '" aria-pressed="' + (WPF.th === t[0]) + '">' + esc(t[0]) + "</button>").join("") + "</div>" +
    '<span class="label">Taille</span><div class="seg" role="group" aria-label="Taille">' + [10, 20, 50, 100].map((n) => '<button data-act="wpf" data-f="size" data-v="' + n + '" aria-pressed="' + (WPF.size === n) + '">' + n + "</button>").join("") + "</div>" +
    '<span class="label">Difficulté (autour de ton Élo ' + eloS().p + ')</span><div class="chips">' + WP_LEVELS.map((l) => '<button class="pill" data-k="amber" data-act="wpf" data-f="lvl" data-v="' + l[0] + '" aria-pressed="' + (WPF.lvl === l[0]) + '">' + l[1] + "</button>").join("") + "</div>" +
    '<p class="small muted">' + nPool + " problèmes disponibles pour ce thème. Commence par 10 à 20 pour tester ; plus la série est longue, plus l\x27entraînement est profond.</p>" +
    '<div class="row"><button class="btn primary" data-act="wpnew"' + (nPool < 3 ? " disabled" : "") + ">Créer la série</button></div></section>";
  return h;
}
function wpSetHTML(s) {
  const m = s.ids.filter((id) => wpLast(s, id) >= 4).length, left = s.pass.order.filter((id) => !(id in s.pass.done)).length;
  let h = '<button class="btn small back" data-act="wpback">← Pic-vert</button><div class="hdr"><h1>' + esc(s.title) + '</h1><p class="muted">' + s.cycles + " cycle" + (s.cycles > 1 ? "s" : "") + " terminé" + (s.cycles > 1 ? "s" : "") + " · " + m + " sur " + s.ids.length + " maîtrisés (note B ou mieux).</p></div>";
  const r = s.lastRes;
  if (r) {
    h += '<div class="note ' + (r.cycleDone ? "good" : "") + '"><b>' + (r.cycleDone ? "Cycle " + s.cycles + " terminé en " + wpFmt(r.cycleT) + ". " : r.kind === "full" ? "Premier passage fini. " : "Révision finie. ") + "</b>Dernier passage : " + wpFmt(r.t) + ", " + r.mist + " erreur" + (r.mist > 1 ? "s" : "") + ", note moyenne " + WP_GRADES[Math.round(r.avg)] + (r.cycleDone ? ". Au prochain cycle, vise un meilleur temps." : r.weak ? ". " + r.weak + " problème" + (r.weak > 1 ? "s" : "") + " à retravailler avant de finir le cycle." : "") + "</div>";
  }
  h += '<section class="card"><span class="label">' + (s.pass.kind === "rev" ? "Révision des points faibles" : "Cycle " + (s.cycles + 1)) + '</span><p class="muted">' + (s.pass.kind === "rev" ? "Ces problèmes ont une note inférieure à B : tu les rejoues, les pires d'abord, jusqu'à ce que tous soient maîtrisés." : "Tout le monde passe dans un ordre aléatoire. Résous vite mais sans faute : sous le temps cible tu gagnes une meilleure note.") + "</p>" +
    '<div class="row"><button class="btn primary" data-act="wpgo" data-id="' + s.id + '">' + (Object.keys(s.pass.done).length ? "Continuer (" + left + " restants)" : "Commencer (" + s.pass.order.length + " problèmes)") + "</button></div></section>";
  if (s.times.length) h += '<section class="card"><span class="label">Temps par cycle</span>' + wpSparkHTML(s.times) + '<p class="small muted">Le but de la méthode : que cette barre raccourcisse à chaque cycle.</p></section>';
  const cnt = {}; s.ids.forEach((id) => { const g = wpLast(s, id); cnt[g] = (cnt[g] || 0) + 1; });
  h += '<section class="card"><span class="label">Notes actuelles</span><div class="row" style="flex-wrap:wrap">' + [6, 5, 4, 3, 2, 1, 0].filter((g) => cnt[g]).map((g) => '<span class="chip ' + (g >= 4 ? "good" : g ? "bad" : "") + '">' + (g ? WP_GRADES[g] : "pas joué") + " · " + cnt[g] + "</span>").join("") + "</div></section>";
  h += '<div class="row"><button class="btn" data-act="wpdel" data-id="' + s.id + '">Supprimer cette série</button></div>';
  return h;
}
