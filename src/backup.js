/* ===== Sauvegarde de la progression : export / import JSON, fusion entre appareils ===== */
const BK_APP = "apres-ouverture";
const BK_DAYS = 14; /* rappel de sauvegarde au bout de 14 jours */
const BK_BAD = ["__proto__", "constructor", "prototype"];

/* Retire les clés dangereuses d'un JSON importé (jamais fiable) */
function bkClean(o, depth) {
  depth = depth || 0;
  if (!o || typeof o !== "object" || depth > 12) return o;
  if (Array.isArray(o)) return o.map((x) => bkClean(x, depth + 1));
  const r = {};
  Object.keys(o).forEach((k) => { if (BK_BAD.indexOf(k) < 0) r[k] = bkClean(o[k], depth + 1); });
  return r;
}
function bkTotal(s) { return ["p", "s", "g", "b"].reduce((a, k) => a + ((s.elo && s.elo[k + "n"]) || 0), 0); }

/* Fusion de deux états : `a` l'emporte pour les réglages simples, les collections sont réunies.
   Évite qu'un appareil écrase tout le travail fait sur l'autre. */
function mergeState(a, b) {
  a = a || {}; b = b || {};
  /* Une réinitialisation volontaire plus récente que l'autre état l'emporte sans fusion */
  if ((a.resetAt || 0) >= (b.updated || 0) && a.resetAt) return clone(a);
  if ((b.resetAt || 0) >= (a.updated || 0) && b.resetAt) return clone(b);
  const out = clone(a);
  const newer = (x, y) => { const lx = x.last || "", ly = y.last || ""; return lx !== ly ? (lx > ly ? x : y) : ((x.tries || 0) >= (y.tries || 0) ? x : y); };
  /* Ligne ou problème : l'état le plus récent gagne, mais « vu » et « réussi » ne régressent jamais */
  const pick = (x, y) => { const w = Object.assign({}, newer(x, y)); if (x.seen || y.seen) w.seen = 1; if (x.ok || y.ok) w.ok = Math.max(x.ok || 0, y.ok || 0); return w; };
  const act = (l) => (l.l || 0) + (l.p || 0) + (l.h || 0) + (l.x || 0) + (l.m || 0);
  const byKey = (k, f) => {
    const m = Object.assign({}, b[k] || {});
    Object.keys(a[k] || {}).forEach((id) => { m[id] = id in m ? f(a[k][id], m[id]) : a[k][id]; });
    out[k] = m;
  };
  byKey("lines", pick); byKey("pz", pick); byKey("sr", (x, y) => ((x.last || "") >= (y.last || "") ? x : y));
  byKey("hard", (x, y) => ((x.last || "") >= (y.last || "") ? x : y));
  byKey("days", (x, y) => Math.max(x || 0, y || 0));
  byKey("q", (x, y) => ((x.ok || 0) + (x.ko || 0) >= (y.ok || 0) + (y.ko || 0) ? x : y));
  byKey("eg", (x, y) => ({ ok: Math.max(x.ok || 0, y.ok || 0), tries: Math.max(x.tries || 0, y.tries || 0) }));
  byKey("log", (x, y) => (act(x) >= act(y) ? x : y));
  byKey("stv", (x) => x); byKey("egl", (x) => x);
  byKey("mind", (x, y) => ((x.n || 0) >= (y.n || 0) ? x : y));
  const un = (k, key) => { const seen = new Set(), r = []; (a[k] || []).concat(b[k] || []).forEach((x) => { const id = x && x[key]; if (id && !seen.has(id)) { seen.add(id); r.push(x); } }); out[k] = r; };
  un("custom", "id"); un("mypz", "id");
  out.mypz = out.mypz.slice(-40);
  /* Élo : on garde l'historique le plus riche (le plus de parties notées) */
  if (a.elo || b.elo) out.elo = bkTotal(a) >= bkTotal(b) ? clone(a.elo || b.elo) : clone(b.elo || a.elo);
  /* Séries de Pic-vert : réunion, la série la plus avancée gagne */
  const ws = {}; ((b.wp && b.wp.sets) || []).concat((a.wp && a.wp.sets) || []).forEach((s) => { const o = ws[s.id]; if (!o || (s.cycles || 0) >= (o.cycles || 0)) ws[s.id] = s; });
  if (Object.keys(ws).length) out.wp = { sets: Object.keys(ws).map((k) => ws[k]) };
  /* Records et séries */
  out.best = Math.max(a.best || 0, b.best || 0);
  if ((b.lastDay || "") > (a.lastDay || "")) { out.lastDay = b.lastDay; out.streak = b.streak; }
  if (a.rush || b.rush) out.rush = { best: Math.max((a.rush && a.rush.best) || 0, (b.rush && b.rush.best) || 0), runs: Math.max((a.rush && a.rush.runs) || 0, (b.rush && b.rush.runs) || 0) };
  if (a.dd || b.dd) out.dd = Array.from(new Set((a.dd || []).concat(b.dd || []))).sort().slice(-120);
  if (a.causes || b.causes) { out.causes = {}; Object.keys(Object.assign({}, a.causes, b.causes)).forEach((k) => { out.causes[k] = Math.max((a.causes || {})[k] || 0, (b.causes || {})[k] || 0); }); }
  if (a.vs || b.vs) out.vs = (b.vs || []).concat(a.vs || []).filter((x, i, arr) => arr.findIndex((y) => y.date === x.date && y.score === x.score && (y.moves || []).length === (x.moves || []).length) === i).slice(-30);
  out.start = [a.start, b.start].filter(Boolean).sort()[0] || a.start;
  out.lastBackup = Math.max(a.lastBackup || 0, b.lastBackup || 0) || undefined;
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}

/* ---------- Export ---------- */
function bkExport() {
  const doc = { app: BK_APP, version: 1, exported: new Date().toISOString(), state: clone(S) };
  const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "apres-ouverture-" + todayStr() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  S.lastBackup = Date.now(); S.backupSnooze = 0; save();
  V.bk = { msg: "Sauvegarde téléchargée : garde ce fichier en lieu sûr (cloud, e-mail à toi-même…)." };
  renderMain();
}

/* ---------- Import ---------- */
function bkParse(text) {
  let doc;
  try { doc = JSON.parse(text); } catch (e) { return { err: "Ce fichier n'est pas un JSON valide." }; }
  if (!doc || typeof doc !== "object") return { err: "Fichier vide ou illisible." };
  const st = doc.app === BK_APP ? doc.state : null;
  if (!st || typeof st !== "object" || Array.isArray(st) || typeof st.lines !== "object" || st.lines === null) return { err: "Ce fichier n'est pas une sauvegarde de « Après l'ouverture »." };
  const clean = bkClean(st);
  const seen = Object.keys(clean.lines || {}).filter((k) => clean.lines[k] && clean.lines[k].seen).length;
  return { state: clean, seen, solved: Object.keys(clean.pz || {}).filter((k) => clean.pz[k] && clean.pz[k].ok).length, custom: (clean.custom || []).length, days: Object.keys(clean.days || {}).length, exported: doc.exported || "" };
}
function bkApply(mode) {
  const p = V.bk && V.bk.pending; if (!p) return;
  const keepUser = S.user;
  if (mode === "merge") adopt(mergeState(S, p.state));
  else { adopt(p.state); if (!S.user) S.user = keepUser; }
  S.updated = Date.now();
  delete S.session; S.session = null; ensureSession();
  localSave(); scheduleRemote();
  V.bk = { msg: mode === "merge" ? "Sauvegarde fusionnée avec ta progression actuelle." : "Progression remplacée par la sauvegarde." };
  renderMain();
}
document.addEventListener("change", (e) => {
  if (e.target.id !== "bkfile" || !e.target.files || !e.target.files[0]) return;
  const f = e.target.files[0], fr = new FileReader();
  if (f.size > 8 * 1024 * 1024) { V.bk = { err: "Fichier trop gros (plus de 8 Mo) : ce n'est pas une sauvegarde." }; renderMain(); return; }
  fr.onload = () => {
    const r = bkParse(String(fr.result || ""));
    V.bk = r.err ? { err: r.err } : { pending: r };
    renderMain();
  };
  fr.onerror = () => { V.bk = { err: "Impossible de lire ce fichier." }; renderMain(); };
  fr.readAsText(f);
});
function bkAct(d) {
  switch (d.act) {
    case "bk_export": bkExport(); break;
    case "bk_merge": bkApply("merge"); break;
    case "bk_replace": bkApply("replace"); break;
    case "bk_cancel": V.bk = null; renderMain(); break;
    case "bk_snooze": S.backupSnooze = Date.now(); save(); renderMain(); break;
  }
}

/* ---------- Affichage ---------- */
function bkAgeDays() { return S.lastBackup ? Math.floor((Date.now() - S.lastBackup) / 86400000) : null; }
function bkNeeded() {
  if (remote) return false; /* déjà synchronisé sur le compte */
  const active = Object.keys(S.days || {}).length >= 3;
  if (!active) return false;
  if (S.backupSnooze && Date.now() - S.backupSnooze < 7 * 86400000) return false;
  const age = bkAgeDays();
  return age === null || age >= BK_DAYS;
}
function bkNudgeHTML() {
  if (!bkNeeded()) return "";
  const age = bkAgeDays();
  return '<section class="card" data-k="amber" style="border-left:4px solid var(--k)"><span class="label">Pense à sauvegarder</span><p class="small">' + (age === null ? "Ta progression n'est enregistrée que dans ce navigateur : si tu vides ses données, elle disparaît." : "Ta dernière sauvegarde date de " + age + " jours.") + '</p><div class="row"><button class="btn primary small" data-act="bk_export">Télécharger une sauvegarde</button><button class="btn small" data-act="bk_snooze">Plus tard</button></div></section>\n\n';
}
function bkCardHTML() {
  const b = V.bk || {}, age = bkAgeDays();
  let h = '<section class="card"><span class="label">Sauvegarde</span><p class="small muted">' + (remote ? "Ta progression est aussi synchronisée sur ton compte. " : "Ta progression n'est enregistrée que dans ce navigateur. ") + (age === null ? "Aucune sauvegarde téléchargée pour l'instant." : age === 0 ? "Dernière sauvegarde : aujourd'hui." : "Dernière sauvegarde : il y a " + age + " jour" + (age > 1 ? "s" : "") + ".") + "</p>";
  if (b.msg) h += '<div class="note good" role="status">' + esc(b.msg) + "</div>";
  if (b.err) h += '<div class="note bad" role="alert">' + esc(b.err) + "</div>";
  if (b.pending) {
    const p = b.pending;
    h += '<div class="note"><b>Sauvegarde reconnue</b>' + (p.exported ? " (" + esc(String(p.exported).slice(0, 10)) + ")" : "") + " : " + p.seen + " ligne" + (p.seen > 1 ? "s" : "") + " vue" + (p.seen > 1 ? "s" : "") + ", " + p.solved + " problème" + (p.solved > 1 ? "s" : "") + " résolu" + (p.solved > 1 ? "s" : "") + ", " + p.custom + " ligne" + (p.custom > 1 ? "s" : "") + " perso, " + p.days + " jour" + (p.days > 1 ? "s" : "") + " d'activité.</div>" +
      '<p class="small">Fusionner garde le meilleur des deux côtés (recommandé). Remplacer efface ce qui est ici.</p><div class="row"><button class="btn primary" data-act="bk_merge">Fusionner</button><button class="btn" data-act="bk_replace" style="border-color:var(--bad);color:var(--bad)">Remplacer</button><button class="btn" data-act="bk_cancel">Annuler</button></div>';
  } else {
    h += '<div class="row"><button class="btn primary" data-act="bk_export">Télécharger ma sauvegarde</button><label class="btn" for="bkfile" style="display:inline-flex;align-items:center">Restaurer un fichier</label><input type="file" id="bkfile" accept=".json,application/json" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" tabindex="-1"></div>';
  }
  return h + "</section>";
}
