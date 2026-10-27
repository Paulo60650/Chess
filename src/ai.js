/* ===== Moteur Stockfish.js 10 (chargé à la demande) + explication en français par Claude ===== */
const SF_URL = "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";
const ENG = { w: null, p: null, err: "", listener: null };

function engInit() {
  if (ENG.p) return ENG.p;
  ENG.p = new Promise((resolve) => {
    let done = false, tm = null;
    const fin = (ok, err) => {
      if (done) return;
      done = true; clearTimeout(tm);
      if (!ok) { ENG.err = err || "inconnue"; ENG.p = null; try { if (ENG.w) ENG.w.terminate(); } catch (e) { /* rien */ } ENG.w = null; }
      resolve(ok);
    };
    tm = setTimeout(() => fin(false, "délai dépassé au chargement"), 30000);
    try {
      const blob = new Blob(['importScripts("' + SF_URL + '");'], { type: "application/javascript" });
      const w = new Worker(URL.createObjectURL(blob));
      ENG.w = w;
      w.onmessage = (e) => {
        const l = String(e.data);
        if (l === "uciok") { w.postMessage("setoption name MultiPV value 3"); w.postMessage("isready"); }
        else if (l === "readyok") fin(true);
        else if (ENG.listener) ENG.listener(l);
      };
      w.onerror = (e) => fin(false, (e && e.message) || "erreur du moteur");
      w.postMessage("uci");
    } catch (e) { fin(false, String((e && e.message) || e)); }
  });
  return ENG.p;
}
function engAnalyse(fen, depth, ms) {
  return new Promise((resolve) => {
    const res = {}, w = ENG.w, white = fen.split(" ")[1] === "w";
    let fin = false, tm = null;
    const done = () => {
      if (fin) return; fin = true; clearTimeout(tm); ENG.listener = null;
      resolve(Object.keys(res).sort((a, b) => a - b).map((k) => res[k]));
    };
    tm = setTimeout(() => w.postMessage("stop"), ms);
    ENG.listener = (l) => {
      if (l.indexOf("bestmove") === 0) return done();
      const m = l.match(/^info depth (\d+).*? multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/);
      if (m) res[m[2]] = { d: +m[1], t: m[3], v: (white ? 1 : -1) * +m[4], pv: m[5].trim().split(/\s+/) };
    };
    w.postMessage("setoption name Skill Level value 20"); w.postMessage("setoption name MultiPV value 3");
    w.postMessage("ucinewgame");
    w.postMessage("position fen " + fen);
    w.postMessage("go depth " + depth);
  });
}
function evalTxt(r) {
  if (r.t === "mate") return "mat en " + Math.abs(r.v) + (r.v > 0 ? " pour les Blancs" : " pour les Noirs");
  const p = r.v / 100;
  return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p).toFixed(1).replace(".", ",");
}
function evalWords(r, mySide) {
  if (r.t === "mate") return (r.v > 0) === (mySide === "w") ? "gagnant pour toi" : "gagnant pour l'adversaire";
  const me = (mySide === "w" ? 1 : -1) * r.v / 100, a = Math.abs(me);
  if (a < 0.3) return "position égale";
  const deg = a < 0.8 ? "léger avantage" : a < 1.8 ? "avantage net" : "avantage décisif";
  return deg + (me > 0 ? " pour toi" : " pour l'adversaire");
}
function pvSan(fen, pv, n) {
  const g = new Chess(fen), out = [];
  for (let i = 0; i < pv.length && out.length < n; i++) {
    const m = g.move({ from: pv[i].slice(0, 2), to: pv[i].slice(2, 4), promotion: pv[i][4] });
    if (!m) break;
    out.push(dispSan(m.san));
  }
  return out.join(" ");
}
function movesText(g) {
  const h = g.history(), out = [];
  h.forEach((s, i) => out.push((i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : "") + dispSan(s)));
  return out.join(" ");
}

/* Contexte de la position à expliquer */
function aiContext(src) {
  if (src === "s") {
    const s = STRUCTS[V.sid], rep = LINE_BY_ID[s.rep], op = OP_BY_ID[s.op], g = lineGame(rep);
    return { key: "s:" + V.sid, g, side: op.side, line: rep.name,
      extra: "Structure : " + s.title + ".\nPlans connus du joueur : " + s.plans.join(" | ") + "\nPlans de l'adversaire : " + s.opp.join(" | ") + "\nCassures : " + s.breaks.join(" | ") };
  }
  if (src === "p") {
    const z = P.pz, g0 = new Chess(z.fen);
    return { key: "p:" + z.id, g: g0, side: g0.turn(), line: z.t,
      extra: "Problème tactique (" + z.th + ") : " + z.goal + "\nSolution vérifiée : " + z.sol.map(dispSan).join(" ") + "\nIdée : " + z.why };
  }
  const L = T.L, op = OP_BY_ID[L.op], s = STRUCTS[L.struct];
  return { key: "t:" + L.id + ":" + T.g.history().length, g: T.g, side: op.side, line: L.name,
    extra: "Structure visée : " + s.title + ".\nPlans connus du joueur : " + s.plans.join(" | ") };
}
function aiPrompt(c, eng) {
  const turn = c.g.turn() === "w" ? "Blancs" : "Noirs", me = c.side === "w" ? "Blancs" : "Noirs";
  let p = "Tu es un entraîneur d'échecs qui s'adresse en français à un joueur de club (il joue les " + me + ").\n" +
    "Ligne d'ouverture étudiée : " + c.line + ".\nCoups joués (lettres françaises : C cavalier, F fou, T tour, D dame, R roi) : " + movesText(c.g) + "\n" +
    "FEN : " + c.g.fen() + "\nAu trait : les " + turn + ".\n" + c.extra + "\n";
  if (eng && eng.length) {
    p += "Analyse du moteur Stockfish (évaluation du point de vue des Blancs, en pions) :\n";
    eng.forEach((r, i) => { p += (i + 1) + ". " + pvSan(c.g.fen(), r.pv, 5) + " → " + evalTxt(r) + " (profondeur " + r.d + ")\n"; });
  } else p += "Aucune analyse du moteur n'est disponible : n'avance AUCUNE évaluation chiffrée et ne prétends pas qui est mieux avec certitude.\n";
  p += "\nConsigne : explique la position en 150 mots maximum, simplement, en français. Trois courts paragraphes :\n" +
    "1) Qui est mieux ou si c'est égal, et pourquoi, en citant des éléments concrets visibles sur l'échiquier (structure de pions, activité des pièces, sécurité des rois, cases faibles). Appuie-toi sur l'évaluation du moteur donnée ci-dessus, sans en inventer.\n" +
    "2) Le plan à suivre pour le joueur (cases et cassures précises).\n" +
    "3) Ce que cherche l'adversaire, et le piège ou l'erreur typique à éviter.\n" +
    "N'invente pas de variantes qui ne figurent pas dans les coups ou les lignes du moteur ci-dessus. Pas de titres, pas de liste à puces.";
  return p;
}
async function understand(src) {
  const c = aiContext(src);
  const A = V.ai = { key: c.key, st: "engine", eng: [], err: "", text: "", side: c.side };
  paintAI();
  let eng = [];
  if (await engInit()) {
    try { eng = await engAnalyse(c.g.fen(), 14, 9000); } catch (e) { eng = []; }
    A.eng = eng;
  } else A.err = "Le moteur n'a pas pu se charger (" + ENG.err + ").";
  if (V.ai !== A) return;
  A.st = "claude"; paintAI();
  try {
    const sample = window.claude && window.claude.use ? await window.claude.use("sample") : null;
    if (!sample) { A.st = "done"; A.noSample = true; paintAI(); return; }
    await sample(aiPrompt(c, eng), { cache: false, onText: (x) => { if (V.ai === A) { A.text = x.text; A.st = "claude"; paintAI(); } } });
    A.st = "done";
  } catch (e) {
    A.st = "done";
    A.err2 = e && e.code === "not_granted" ? "Autorisation refusée : l'explication par Claude est désactivée." : "L'explication par Claude n'a pas répondu.";
  }
  if (V.ai === A) paintAI();
}
function aiInner(key) {
  const A = V.ai;
  if (!A || A.key !== key) return '<button class="btn primary" data-act="understand" data-src="' + key.split(":")[0] + '">Comprendre cette position</button><p class="small muted">Stockfish évalue la position, puis Claude t\'explique le plan en français.</p>';
  let h = "";
  if (A.eng && A.eng.length) {
    h += '<div class="stack" style="gap:4px">' + A.eng.map((r, i) => '<div class="small"><span class="chip ' + (i ? "" : "acc") + '">' + evalTxt(r) + '</span> <span class="mono">' + esc(pvSan(aiFen(), r.pv, 5)) + '</span></div>').join("") + '</div>';
    h += '<p class="small muted">Verdict du moteur : <b>' + esc(evalWords(A.eng[0], A.side)) + "</b> (profondeur " + A.eng[0].d + ").</p>";
  }
  if (A.st === "engine") h += '<p class="muted" role="status">Le moteur réfléchit… (la première fois, il se charge : quelques secondes)</p>';
  if (A.err) h += '<div class="note warn">' + esc(A.err) + "</div>";
  if (A.st === "claude" && !A.text) h += '<p class="muted" role="status">Claude rédige l\'explication…</p>';
  if (A.text) h += A.text.split(/\n\s*\n/).map((t) => "<p>" + esc(t) + "</p>").join("");
  if (A.noSample) h += '<div class="note warn">L\'explication par Claude n\'est pas disponible ici.</div>';
  if (A.err2) h += '<div class="note warn">' + esc(A.err2) + "</div>";
  if (A.st === "done") h += '<div class="row"><button class="btn small" data-act="understand" data-src="' + key.split(":")[0] + '">Relancer</button><button class="btn small" data-act="aiclose">Fermer</button></div>';
  return h;
}
function aiFen() { const c = aiContext(V.ai.key[0]); return c.g.fen(); }
function aiBoxHTML(key) { return '<section class="card" id="ai-box" data-k="violet" style="border-left:4px solid var(--k)"><span class="label">Comprendre la position</span><div id="ai-in">' + aiInner(key) + "</div></section>"; }
function paintAI() { const el = document.getElementById("ai-in"); if (el && V.ai) el.innerHTML = aiInner(V.ai.key); }
