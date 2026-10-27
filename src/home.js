/* ===== Accueil : sections repliables ===== */
function foldHTML(id, title, sub, inner) {
  const open = !!V.open[id];
  return '<section class="fold"><button class="fold-h" data-act="chtoggle" data-id="' + id + '" aria-expanded="' + open + '"><span class="stack" style="gap:1px;text-align:left"><b>' + esc(title) + '</b><span class="small muted">' + esc(sub) + '</span></span><span class="chev" aria-hidden="true">' + (open ? "▾" : "▸") + "</span></button>" + (open ? '<div class="fold-b">' + inner + "</div>" : "") + "</section>";
}
/* ===== Accueil : sliders et regroupements ===== */
function sliderHTML(id, slides, o) {
  o = o || {};
  const cur = (V.sl && V.sl[id] != null) ? V.sl[id] : (o.start || 0);
  let h = '<div class="slider" data-sl="' + id + '"><div class="track" role="list" tabindex="0" aria-label="' + esc(o.label || "Diaporama") + '" data-start="' + cur + '">';
  slides.forEach((s, i) => { h += '<div class="slide' + (o.wide ? " wide" : "") + '" role="listitem" aria-label="' + (i + 1) + " sur " + slides.length + '">' + s + "</div>"; });
  h += '</div><div class="dots" role="group" aria-label="Aller à la diapositive">';
  slides.forEach((s, i) => { h += '<button class="dot' + (i === cur ? " on" : "") + '" data-act="sldot" data-id="' + id + '" data-i="' + i + '" aria-label="Diapositive ' + (i + 1) + '"' + (i === cur ? ' aria-current="true"' : "") + "></button>"; });
  return h + "</div></div>";
}
function sliderInit() {
  document.querySelectorAll(".slider .track").forEach((tr) => {
    const slides = tr.children, i = Number(tr.dataset.start) || 0;
    if (i > 0 && slides[i]) tr.scrollLeft = slides[i].offsetLeft - slides[0].offsetLeft;
  });
}
function sliderGo(id, i) {
  const sl = document.querySelector('.slider[data-sl="' + id + '"]'); if (!sl) return;
  const tr = sl.querySelector(".track"), s = tr.children[i]; if (!s) return;
  const x = s.offsetLeft - tr.children[0].offsetLeft;
  if (tr.scrollTo) tr.scrollTo({ left: x, behavior: "smooth" }); else tr.scrollLeft = x;
}
document.addEventListener("scroll", (e) => {
  const tr = e.target; if (!tr || !tr.classList || !tr.classList.contains("track")) return;
  const sl = tr.closest(".slider"), kids = tr.children; if (!sl || !kids.length) return;
  let best = 0, bd = 1e9;
  for (let i = 0; i < kids.length; i++) { const d = Math.abs(kids[i].offsetLeft - kids[0].offsetLeft - tr.scrollLeft); if (d < bd) { bd = d; best = i; } }
  if (!V.sl) V.sl = {}; V.sl[sl.dataset.sl] = best;
  sl.querySelectorAll(".dot").forEach((d, i) => { d.classList.toggle("on", i === best); if (i === best) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
}, true);

function lkHTML(ic, title, sub, attrs) {
  return '<button class="lk" ' + attrs + '><span class="lki" aria-hidden="true">' + ic + '</span><span class="stack" style="gap:1px"><b>' + title + '</b><span class="small muted">' + sub + '</span></span><span class="chev" aria-hidden="true">›</span></button>';
}
function homeRest(t, sid) {
  const seen = LINES.filter((L) => isSeen(L.id)).length, mast = LINES.filter((L) => boxOf(L.id) >= 4 && isSeen(L.id)).length, due = LINES.filter((L) => isDue(L.id, t)).length;
  const fiche = STRUCTS[sid], fop = OP_BY_ID[fiche.op], dg = dailyGet(), e = eloS();
  const dayIdx = Math.max(0, diffDays(S.start, t)), cyc = dayIdx % 28, wkI = Math.floor(cyc / 7);
  let h = "";

  h += planCardHTML();
  // Explorer
  const expl = sliderHTML("cats", [
    '<section class="cat" data-k="blue"><div class="cath"><span class="ti" aria-hidden="true">📖</span><div class="stack" style="gap:0"><h3>Apprendre</h3><span class="small muted">Lignes, plans et pièges</span></div></div>' +
      lkHTML("♗", "Répertoire", "Les " + OPENINGS.length + " ouvertures et leurs lignes", 'data-act="tab" data-v="rep"') +
      lkHTML("⚠", "Pièges", "À tendre et à éviter", 'data-act="tab" data-v="rep"') +
      lkHTML("＋", "Ma ligne", "Ajouter et annoter", 'data-act="edadd" data-op="lon"') + "</section>",
    '<section class="cat" data-k="violet"><div class="cath"><span class="ti" aria-hidden="true">♜</span><div class="stack" style="gap:0"><h3>Stratégie</h3><span class="small muted">Concepts, plans, attaque, défense</span></div></div>' +
      lkHTML("♜", "Concepts", STRAT.filter((c) => stSeen(c.id)).length + " sur " + STRAT.length + " vus", 'data-act="tab" data-v="concepts"') +
      lkHTML("▦", "Plans de jeu", "Quoi jouer après l'ouverture", 'data-act="tab" data-v="plans"') +
      lkHTML("⚔", "Attaquer", adList("att").filter((c) => stSeen(c.id)).length + " sur " + adList("att").length + " concepts · sacrifice grec", 'data-act="adopen" data-id="att"') +
      lkHTML("🛡", "Défendre", adList("def").filter((c) => stSeen(c.id)).length + " sur " + adList("def").length + " concepts · menaces, contre-attaque", 'data-act="adopen" data-id="def"') +
      lkHTML("◎", "Problèmes de plans", "Cherche le meilleur plan", 'data-act="pzpos"') + "</section>",
    '<section class="cat" data-k="amber"><div class="cath"><span class="ti" aria-hidden="true">⚡</span><div class="stack" style="gap:0"><h3>S\'entraîner</h3><span class="small muted">Tactique et calcul</span></div></div>' +
      lkHTML("◉", "Menaces et calcul", "Exercices mentaux : menaces, visualisation", 'data-act="m_open"') +
      lkHTML("⚡", "Tous les problèmes", "Rangés par thème ou ouverture", 'data-act="tab" data-v="puz"') +
      lkHTML("⏱", "Rafale 3 min", "Record : " + ((S.rush && S.rush.best) || 0), 'data-act="rush"') +
      lkHTML("♚", "Motifs de mat", MATS.length + " mats classiques à reconnaître", 'data-act="matopen"') +
      lkHTML("⟳", "Pic-vert", "Même série, cycle après cycle", 'data-act="wpopen"') +
      lkHTML("◎", "Entraînement adapté", "Selon ton Élo", 'data-act="pzadapt"') +
      lkHTML("?", "Position surprise", "Retrouve ton coup", 'data-act="xnew"') + "</section>",
    '<section class="cat" data-k="red"><div class="cath"><span class="ti" aria-hidden="true">♚</span><div class="stack" style="gap:0"><h3>Jouer</h3><span class="small muted">Parties et finales</span></div></div>' +
      lkHTML("♚", "Contre Stockfish", "9 niveaux · Élo " + e.g, 'data-act="vsopen"') +
      lkHTML("♔", "Finales", EG_LIST.filter((x, i) => S.eg && S.eg[i] && S.eg[i].ok).length + " sur " + EG_LIST.length + " réussies", 'data-act="endg"') +
      lkHTML("♟", "Mes parties", "Importer et trouver mes erreurs", 'data-act="tab" data-v="games"') + "</section>",
    '<section class="cat" data-k="green"><div class="cath"><span class="ti" aria-hidden="true">★</span><div class="stack" style="gap:0"><h3>Progresser</h3><span class="small muted">Classements et bilans</span></div></div>' +
      lkHTML("★", "Mes Élo", "Problèmes " + e.p + " · Études " + e.s + " · Parties " + e.g + " · Aveugle " + e.b, 'data-act="tab" data-v="prog"') +
      lkHTML("▮", "Bilan de la semaine", "Activité et erreurs", 'data-act="tab" data-v="prog"') +
      lkHTML("◔", "Objectifs", "Cibles et projection", 'data-act="tab" data-v="prog"') + "</section>"
  ], { label: "Catégories" });
  h += hardCardHTML(4);

  // Programme
  let prog = sliderHTML("weeks", WEEKS.map((w, i) =>
    '<section class="card wk' + (i === wkI ? " now" : "") + '"><div class="row between"><h3>' + esc(w.t) + '</h3><span class="chip ' + (i === wkI ? "acc" : i < wkI ? "good" : "") + '">' + (i === wkI ? "Jour " + (cyc + 1) + " sur 28" : i < wkI ? "Terminée" : "À venir") + '</span></div><p class="muted">' + esc(w.d) + "</p></section>"), { start: wkI, label: "Semaines du programme" }) + '<section class="card"><div class="week" role="img" aria-label="Les sept derniers jours">';
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t, -i), n = S.days[d] || 0, dn = parseD(d).toLocaleDateString("fr-FR", { weekday: "narrow" });
    prog += "<div><i class=\"" + (n ? "on" : "") + (i === 0 ? " today" : "") + '"></i>' + dn.toUpperCase() + "</div>";
  }
  prog += '</div><p class="small muted">Chaque jour : la séance de cartes, une fiche de plan, un défi et une partie dès que tu peux. Le programme repart de zéro tous les 28 jours.</p></section>';
  return h + foldHTML("hm-prog", "Programme sur 4 semaines", "Semaine " + (wkI + 1) + " sur 4", prog);
}

/* ---------- Démarrage (après le chargement de tous les modules) ---------- */
localLoad(); try { rebuildCustom(); } catch (e) { /* rien */ }
if (!S.user) S.user = "Polo60";
ensureSession();
render();
initRemote();
