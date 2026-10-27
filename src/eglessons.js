/* ---------- Finales : leçons (du plus facile au plus difficile) + exercices ---------- */
/* Exercices ajoutés à EG_LIST (les indices 0-7 existants sont conservés pour garder les réussites). */
EG_LIST.push(
  { t: "Carré du pion : le rattraper", fen: "8/8/7k/p7/8/3K4/8/8 w - - 0 1", goal: "draw", lv: 1, fail: "promo", do: "Rattrape le pion avant qu'il ne devienne dame.", why: "Le pion a5 doit parcourir 4 cases ; ton roi en d3 est dans le carré a1-d1-d5-a5. Rc3 puis Rb4 ou Rb3 : tu le prends avant la promotion." },
  { t: "Carré du pion : le lancer", fen: "8/8/7k/2P5/8/8/8/K7 w - - 0 1", goal: "win", lv: 1, why: "Le roi noir est hors du carré c5-f8 : le pion court sans être rattrapé. Promeus en dame, puis mate (Dame et Roi, voir la première leçon)." },
  { t: "Opposition : la gagner", fen: "8/3k4/8/8/3PK3/8/8/8 w - - 0 1", goal: "win", lv: 2, why: "Rd5! prend l'opposition. Le roi noir doit reculer et le roi blanc atteint une case clé (c6, d6 ou e6) : la partie est gagnée." },
  { t: "Opposition : tenir la nulle", fen: "8/8/4k3/8/3PK3/8/8/8 b - - 0 1", goal: "draw", lv: 2, why: "Rd6! reprend l'opposition. Tant que ton roi garde la case devant le pion et l'opposition, les Blancs ne peuvent pas avancer sans perdre le pion." },
  { t: "Cases clés : les atteindre", fen: "4k3/8/8/3K4/4P3/8/8/8 w - - 0 1", goal: "win", lv: 2, why: "Re6! : le roi blanc entre sur une case clé (d6, e6 ou f6) devant son pion. À partir de là le pion avance et promeut." },
  { t: "Cases clés : les interdire", fen: "4k3/8/8/4K3/4P3/8/8/8 b - - 0 1", goal: "draw", lv: 2, why: "Re7! garde les trois cases clés d6, e6 et f6. Les Blancs ne peuvent plus y poser leur roi et ne gagnent pas." },
  { t: "Mat avec deux Fous", fen: "8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1", goal: "win", lv: 2, max: 80, why: "Garde tes deux fous côte à côte sur des diagonales voisines pour former un mur, avance ton roi et repousse le roi noir vers un coin. Le mat est possible dans n'importe quel coin." },
  { t: "Mauvais fou : tenir la nulle", fen: "7k/8/5K1P/8/8/8/8/5B2 b - - 0 1", goal: "draw", lv: 3, why: "Le pion h promeut en h8, case foncée, et ton adversaire a un fou de cases claires : le « mauvais fou ». Reste en h8 ou g8 : tu ne peux pas être délogé. Attention à ne pas t'enfermer au point de te faire mater." },
  { t: "Tour contre fou : tenir (Blancs)", fen: "8/8/8/4k3/3r4/8/4B3/4K3 w - - 0 1", goal: "draw", lv: 3, why: "Garde ton roi proche de ton fou et en dehors des coins de la couleur opposée à celle de ton fou. Évite les fourchettes tour + roi sur ton fou." },
  { t: "Tour contre fou : tenir (Noirs)", fen: "8/8/3k4/8/8/2b5/6R1/7K b - - 0 1", goal: "draw", lv: 3, why: "Garde le roi au centre et le fou protégé par ton roi. La tour seule ne peut pas t'attaquer sans l'aide de son roi." },
  { t: "Mat Fou et Cavalier", fen: "8/8/8/4k3/8/8/8/4KBN1 w - - 0 1", goal: "win", lv: 3, max: 100, why: "Le plus difficile des mats de base. Chasse d'abord le roi vers un coin de la couleur de ton fou, puis applique la méthode de Delétang : mat en 33 coups au plus." }
);
var EG_LESSONS = [
  { id: "mats", t: "Les mats élémentaires", lv: 1, ex: [0, 1, 2],
    intro: "Avant tout, il faut savoir mater avec un gros avantage matériel. La règle d'or : repousser le roi adverse vers un bord, puis vers un coin, sans jamais le mettre pat.",
    secs: [
      { t: "Dame et Roi : la boîte", fen: "8/8/8/4k3/8/8/2Q5/4K3 w - - 0 1", txt: "Place la dame à un coup de cavalier du roi adverse : elle lui ferme des rangées et des colonnes entières. Réduis la boîte à chaque coup, puis fais venir ton roi pour soutenir la dame." },
      { t: "Le piège du pat", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", txt: "Les Noirs n'ont aucun coup légal et ne sont pas en échec : c'est pat, donc nulle ! Avant chaque coup, vérifie qu'il reste une case libre au roi adverse." },
      { t: "Le mat de la dame", fen: "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1", txt: "Le mat classique : la dame protégée par son roi, face au roi qui est au bord." },
      { t: "Tour et Roi : couper et opposer", fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", txt: "La tour coupe le roi sur une rangée. Avance ton roi pour prendre l'opposition, puis donne échec avec la tour sur la dernière rangée. Garde la tour loin du roi adverse." },
      { t: "Le mat de la tour", fen: "R6k/8/6K1/8/8/8/8/8 b - - 0 1", txt: "Le roi blanc ferme les cases g7 et h7, la tour donne échec sur la huitième rangée." },
      { t: "Deux tours : l'escalier", fen: "R6k/1R6/8/8/8/8/8/7K b - - 0 1", txt: "Méthode de l'escalier : une tour coupe une rangée, l'autre donne échec sur la rangée suivante, et le roi est repoussé d'une rangée à chaque paire de coups, jusqu'au mat." }
    ],
    pts: ["Toujours laisser au moins une case au roi adverse tant que le mat n'est pas donné (pat).", "Dame : reste à un coup de cavalier du roi adverse.", "Tour : coupe, prends l'opposition, échec sur la dernière rangée.", "Deux tours : l'escalier, sans jamais les mettre à portée du roi."] },

  { id: "carre", t: "Le carré du pion", lv: 1, ex: [8, 9],
    intro: "Un pion passé peut-il être rattrapé par le roi adverse ? On le sait sans calculer, grâce à la règle du carré.",
    secs: [
      { t: "Tracer le carré", fen: "8/8/7k/2P5/8/8/8/K7 w - - 0 1", marks: ["c5", "d5", "e5", "f5", "c6", "d6", "e6", "f6", "c7", "d7", "e7", "f7", "c8", "d8", "e8", "f8"], txt: "Le pion c5 est à 3 coups de la promotion. On construit un carré dont un côté va du pion à la case de promotion (c5-c8) : c'est le carré c5-f8, en surbrillance. Le roi noir est en h6, hors du carré : il ne rattrapera jamais le pion." },
      { t: "Roi dans le carré", fen: "8/8/5k2/2P5/8/8/8/K7 w - - 0 1", marks: ["c5", "d5", "e5", "f5", "c6", "d6", "e6", "f6", "c7", "d7", "e7", "f7", "c8", "d8", "e8", "f8"], txt: "Maintenant le roi noir est en f6, dans le carré. Même si c'est aux Blancs de jouer, le roi rattrape le pion : il file en e6, puis en d7 et contrôle la case de promotion c8." }
    ],
    pts: ["Compte les coups du pion jusqu'à la promotion : cela donne la taille du carré.", "Si c'est au roi de jouer, il gagne un coup : le carré s'élargit d'une colonne.", "Un pion encore sur sa case de départ peut avancer de deux cases : compte à partir de la troisième rangée.", "Le roi adverse hors du carré : le pion va à dame, on peut lancer sans calculer."] },

  { id: "opposition", t: "L'opposition", lv: 2, ex: [10, 11],
    intro: "L'opposition est le concept central des finales roi et pion. Deux rois se font face avec une case entre eux : celui qui doit jouer est obligé de céder du terrain.",
    secs: [
      { t: "Prendre l'opposition", fen: "8/8/3k4/8/3K4/8/8/8 b - - 0 1", marks: ["d5"], txt: "Les rois sont face à face, séparés par la case d5. Les Noirs sont au trait : ils ont perdu l'opposition et doivent laisser passer le roi blanc." },
      { t: "Un pion et l'opposition : nulle", fen: "8/3k4/8/3K4/3P4/8/8/8 w - - 0 1", txt: "Roi blanc en d5, pion en d4, roi noir en d7 : les Blancs sont au trait et ne peuvent pas progresser. Les Noirs gardent l'opposition et font nulle. Avec les Noirs au trait, ce serait gagné pour les Blancs." },
      { t: "Un pas en arrière : la gagner", fen: "8/3k4/8/8/3PK3/8/8/8 w - - 0 1", txt: "Cette fois le roi blanc est en e4, un peu plus loin. Les Blancs jouent Rd5! : ils prennent l'opposition. Le roi noir doit reculer et Rc6 atteint une case clé." }
    ],
    pts: ["Se placer face au roi adverse avec une case entre vous : celui qui doit jouer cède le terrain.", "Il faut parfois perdre un temps exprès pour avoir l'opposition au bon moment.", "L'opposition mène aux cases clés (leçon suivante).", "Le roi doit toujours précéder son pion, jamais le suivre."] },

  { id: "cles", t: "Les cases clés", lv: 2, ex: [12, 13],
    intro: "À chaque pion correspondent des cases clés : si ton roi les occupe, le pion promeut quoi que fasse l'adversaire. Il suffit de les atteindre.",
    secs: [
      { t: "Quelles sont-elles ?", fen: "4k3/8/8/4P3/8/8/8/4K3 w - - 0 1", marks: ["d6", "e6", "f6"], txt: "Pion en e5 : les cases clés sont d6, e6 et f6. Même chose avec un pion en e4. Pour un pion plus reculé, ce sont les trois cases deux rangées devant lui (pion e3 : d5, e5, f5)." },
      { t: "Les atteindre", fen: "4k3/8/8/3K4/4P3/8/8/8 w - - 0 1", marks: ["d6", "e6", "f6"], txt: "Le roi blanc est en d5 et joue Re6 ou Rd6 : il atteint une case clé et la partie est gagnée." },
      { t: "Les interdire", fen: "4k3/8/8/4K3/4P3/8/8/8 b - - 0 1", marks: ["d6", "e6", "f6"], txt: "Roi blanc devant son pion, mais au trait des Noirs : Re7! surveille d6, e6 et f6. Les Blancs ne peuvent pas poser leur roi sur une case clé et la partie est nulle." }
    ],
    pts: ["Pion e4/e5 : cases clés d6, e6, f6. Pion plus reculé : trois cases deux rangées devant.", "Roi sur une case clé = victoire du camp du pion.", "Défenseur : prends l'opposition ou garde les cases clés avec ton roi.", "Les pions de tour (a, h) ont des cases clés particulières : la nulle est fréquente."] },

  { id: "sixieme", t: "Sixième rangée et pion de tour", lv: 2, ex: [3, 4, 6],
    intro: "Deux règles pratiques pour les finales de roi et pion : la règle de la sixième rangée et l'exception des pions de colonne a et h.",
    secs: [
      { t: "La sixième rangée", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", marks: ["e6"], txt: "Roi devant le pion et en sixième rangée : c'est gagné, quel que soit le trait. Conduis le pion à la promotion sans bloquer ton roi, et attention au pat." },
      { t: "Le pion de tour : nulle", fen: "k7/8/1K6/P7/8/8/8/8 w - - 0 1", txt: "Avec un pion a ou h, le roi défenseur dans le coin se met en sécurité (par pat). Le roi adverse ne peut pas le déloger : le pion de tour seul fait nulle." }
    ],
    pts: ["Roi en sixième rangée devant son pion : victoire.", "Pion de tour seul : nulle si le roi défenseur atteint le coin.", "Attention au pat : laisse toujours un coup au roi adverse."] },

  { id: "fous", t: "Mat avec deux fous", lv: 2, ex: [14],
    intro: "Deux fous (un clair, un foncé) et le roi mattent un roi seul, dans n'importe quel coin. Il faut de la méthode : les fous travaillent en mur.",
    secs: [
      { t: "Le mur de fous", fen: "8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1", txt: "Place les deux fous côte à côte sur deux diagonales voisines : ils forment un mur que le roi adverse ne peut pas franchir. Fais avancer le mur pour le repousser vers le bord." },
      { t: "Le mat", fen: "7k/5K2/6B1/8/3B4/8/8/8 b - - 0 1", txt: "Le roi noir est au coin. Le fou d4 donne échec sur la grande diagonale, le fou g6 ferme h7 et le roi f7 ferme g8 et g7." }
    ],
    pts: ["Deux fous de couleurs différentes sont nécessaires.", "Fous côte à côte, mur sur diagonales voisines.", "Rapproche le roi pour finir le travail.", "Mat en 19 coups au plus avec la meilleure méthode."] },

  { id: "mauvais", t: "Le mauvais fou", lv: 3, ex: [15],
    intro: "Fou et pion de tour contre roi seul : si le fou n'est pas de la couleur de la case de promotion, le roi défenseur se réfugie dans le coin et fait nulle.",
    secs: [
      { t: "Mauvais fou = nulle", fen: "7k/8/5K1P/8/8/8/8/5B2 b - - 0 1", txt: "Le pion h promeut en h8 (case foncée) mais le fou blanc en f1 est de cases claires. Le roi noir se réfugie en h8 ou g8 et ne peut pas être délogé : nulle." },
      { t: "Bon fou = victoire", fen: "7k/8/5K1P/8/8/8/8/2B5 b - - 0 1", txt: "Même position avec un fou de cases foncées : il contrôle h8 et les Blancs gagnent. Seule la couleur du fou change." }
    ],
    pts: ["Le fou doit contrôler la case de promotion, sinon nulle.", "Vaut pour les pions de colonne a et h.", "Si tu défends : va au coin, ne le quitte pas inutilement.", "Si tu attaques : évite de t’engager dans ce finale avec le mauvais fou."] },

  { id: "dame-pion", t: "Dame contre pion en septième", lv: 3, ex: [],
    intro: "La dame gagne en général contre un pion en septième rangée, mais pas toujours. Si le roi défenseur est près du pion, le pion de fou ou de tour peut sauver la partie grâce au pat.",
    secs: [],
    pts: ["Pion central (d, e) ou pion de cavalier : la dame gagne en général.", "Pion de fou (c, f) ou de tour (a, h) avec le roi défenseur proche : nulle par pat possible.", "Pour gagner, la dame doit faire venir son roi : sans lui, rien."] },

  { id: "tours", t: "Lucena et Philidor", lv: 3, ex: [5, 7],
    intro: "Les deux positions fondamentales des finales de tours. L'une se gagne, l'autre se défend.",
    secs: [
      { t: "Lucena : bâtir le pont", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", txt: "Le pion est en septième, le roi devant lui, mais le roi adverse bloque la route. Avec Td1+ Re7 Td4! (le pont), la tour se met sur la quatrième rangée. Quand le roi quittera l'abri, la tour viendra le protéger des échecs." },
      { t: "Philidor : la défense passive", fen: "4k3/8/r7/4PK2/8/8/8/7R b - - 0 1", txt: "Les Noirs gardent la tour sur la sixième rangée pour empêcher le roi blanc d'avancer. Dès que le pion avance en sixième rangée, la tour passe derrière et donne des échecs de loin." }
    ],
    pts: ["Lucena : pion en septième, roi devant, tour sur la quatrième rangée (pont).", "Philidor : tour sur la sixième rangée jusqu'à l'avance du pion, puis échecs par derrière.", "La tour est plus forte derrière les pions passés."] },

  { id: "tourfou", t: "Tour contre fou", lv: 3, ex: [16, 17],
    intro: "En général une tour contre un fou est nulle, mais le camp de la tour a toujours des chances d'y gagner si le défenseur s'y prend mal. Voici comment tenir.",
    secs: [
      { t: "Garde le roi au centre", fen: "8/8/8/4k3/3r4/8/4B3/4K3 w - - 0 1", txt: "Le fou protégé par le roi est difficile à attaquer. Reste près de ton fou, et ne laisse pas la tour te séparer de ton roi." },
      { t: "Évite les coins", fen: "8/8/3k4/8/8/2b5/6R1/7K b - - 0 1", txt: "Le camp qui défend ne doit pas se laisser enfermer dans un coin de la couleur opposée à son fou, où le roi et le fou peuvent être attaqués ensemble." }
    ],
    pts: ["Roi proche du fou, tous deux au centre.", "Évite les fourchettes tour + roi.", "Évite les coins de la couleur opposée au fou."] },

  { id: "foucav", t: "Mat Fou et Cavalier", lv: 3, ex: [18],
    intro: "Le plus difficile des mats de base. Il faut chasser le roi vers un coin de la couleur de ton fou, puis mater. La méthode de Delétang : trois étapes, au plus 33 coups.",
    secs: [
      { t: "Le coin de ton fou", fen: "8/8/8/4k3/8/8/8/4KBN1 w - - 0 1", txt: "Avec un fou de cases claires, le mat se donne dans un coin clair (a8 ou h1). Si le roi adverse est dans l'autre coin, il faut d'abord le ramener vers le bon." },
      { t: "Le mat final", fen: "8/8/8/3B4/6N1/8/8/5K1k b - - 0 1", txt: "Le roi noir est en h1. Le fou d5 donne échec sur la grande diagonale, le cavalier g4 ferme h2 et le roi f1 ferme g1 et g2." }
    ],
    pts: ["Mate dans le coin de la couleur de ton fou.", "Le cavalier et le fou travaillent ensemble, le roi les rejoint.", "Deux cavaliers ne forcent pas le mat (sauf faute adverse)."] }
];
var EG_CHAPS;
var EG_LBY = {}; EG_LESSONS.forEach((l, i) => { l.n = i + 1; EG_LBY[l.id] = l; });
EG_LIST.forEach((x, i) => { EG_LESSONS.forEach((l) => { if (l.ex.indexOf(i) >= 0) x.ls = l.id; }); });
var EG_VIZ_ALL = { out: 1, weak: 1, ag: 1, ar: 1, ab: 1, ay: 1, files: 1 };
function egRead(id) { return !!(S.egl && S.egl[id]); }
function egItem(i) {
  const x = EG_LIST[i], r = S.eg && S.eg[i], side = x.fen.split(" ")[1] === "w" ? "Blancs" : "Noirs";
  return '<button class="item sess' + (r && r.ok ? " done" : "") + '" data-k="' + (x.goal === "win" ? "green" : "amber") + '" data-act="egplay" data-i="' + i + '"><span class="check' + (r && r.ok ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + esc(x.t) + '</b><span class="small muted">' + (x.goal === "win" ? "Gagner" : "Faire nulle") + " avec les " + side + " · niveau " + "●".repeat(x.lv) + "○".repeat(3 - x.lv) + "</span></div></button>";
}
function egHTML() {
  const nl = EG_LESSONS.filter((l) => egRead(l.id)).length;
  let h = backBtn("S'entraîner") + '<div class="hdr"><h1>Finales</h1><p class="muted">Chaque thème commence par une leçon illustrée, puis des exercices contre Stockfish au maximum de sa force. Les leçons sont rangées par pièces : mats de base, pions, tours, fous, cavaliers. ' + nl + " leçon" + (nl > 1 ? "s lues" : " lue") + " sur " + EG_LESSONS.length + ".</p></div><div class=\"stack\" style=\"gap:18px\">";
  return h + egChaptersHTML() + "</div>";
}
function egChaptersHTML() {
  let h = "";
  const chaps = typeof EG_CHAPS !== "undefined" ? EG_CHAPS : [{ id: "", t: "Finales", d: "" }];
  chaps.forEach((c) => {
    const ls = EG_LESSONS.filter((l) => (l.grp || "") === c.id); if (!ls.length) return;
    const nr = ls.filter((l) => egRead(l.id)).length;
    let inner = '<div class="stack" style="gap:18px">';
    ls.forEach((l) => {
      const read = egRead(l.id);
      inner += '<section class="stack" style="gap:8px"><button class="item sess' + (read ? " done" : "") + '" data-k="violet" data-act="eglesson" data-id="' + l.id + '"><span class="check' + (read ? " on" : "") + '"></span><div class="stack" style="gap:2px"><b>' + l.n + ". " + esc(l.t) + '</b><span class="small muted">Leçon' + (read ? " lue" : " à lire d'abord") + " · niveau " + "●".repeat(l.lv) + "○".repeat(3 - l.lv) + "</span></div></button>";
      l.ex.forEach((i) => { inner += egItem(i); });
      inner += "</section>";
    });
    h += foldHTML("egc-" + c.id, c.t, ls.length + " leçon" + (ls.length > 1 ? "s" : "") + " · " + nr + " lue" + (nr > 1 ? "s" : "") + (c.d ? " · " + c.d : ""), inner + "</div>");
  });
  return h;
}
function egLessonOpen(id) {
  if (!EG_LBY[id]) return;
  V.stack.push({ view: V.view, sid: V.sid, opId: V.opId }); V.view = "eglesson"; V.lsid = id; render(); window.scrollTo(0, 0);
}
function egSecIll(s, key, E, i) {
  if (!s._ill) {
    const notes = {}, vz = {};
    if (E.fen) { notes[0] = "Position de départ de la démonstration : joue les coups avec ›."; notes[E.sans.length] = s.txt; } else notes[0] = s.txt;
    if (s.marks && s.marks.length) vz[0] = { out: s.marks, lab: { out: "Cases importantes" } };
    s._ill = { kind: "pos", title: (i + 1) + ". " + s.t, sub: "", fen: E.fen || s.fen, sans: E.sans, from: 0, orient: s.orient || "w", notes, vz, nokeys: true, key };
  }
  return s._ill;
}
function egLessonHTML() {
  const l = EG_LBY[V.lsid]; if (!l) return backBtn("Finales");
  let h = backBtn("Finales") + '<div class="hdr kh" data-k="violet"><div class="row"><span class="chip k">Leçon ' + l.n + " sur " + EG_LESSONS.length + '</span><span class="chip">niveau ' + "●".repeat(l.lv) + "○".repeat(3 - l.lv) + "</span></div><h1>" + esc(l.t) + '</h1><p class="muted">' + esc(l.intro) + "</p></div>";
  h += '<div class="stack" style="gap:16px">';
  l.secs.forEach((s, i) => {
    const key = l.id + ":" + i, E = typeof EG_SEC !== "undefined" ? EG_SEC[key] : null;
    if (E && E.sans && E.sans.length) { h += stIllHTML(egSecIll(s, key, E, i)); return; }
    const g = new Chess(s.fen);
    h += '<div class="card"><span class="label">' + (i + 1) + ". " + esc(s.t) + '</span><div style="width:100%;max-width:360px;margin:8px auto">' + boardHTML(g, { orient: s.orient || "w", live: false, last: [], marks: s.marks || [], viz: s.viz, layers: EG_VIZ_ALL }) + "</div><p>" + esc(s.txt) + "</p></div>";
  });
  h += '<div class="card"><span class="label">À retenir</span><ul>' + l.pts.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul></div>";
  h += '<div class="row"><button class="btn' + (egRead(l.id) ? "" : " primary") + '" data-act="egread" data-id="' + l.id + '">' + (egRead(l.id) ? "✓ Leçon lue" : "J'ai compris, marquer comme lue") + "</button></div>";
  if (l.ex.length) h += '<span class="label">Exercices</span><div class="stack">' + l.ex.map(egItem).join("") + "</div>";
  return h + "</div>";
}

/* ---------- Exemple commenté avant chaque finale (données : egex.js) ---------- */
function egExIll(i) {
  const e = EG_EX[i], x = EG_LIST[i], notes = {}, vz = {};
  notes[0] = e.i; vz[0] = e.v0;
  const LB = { ag: "Coup joué", ar: "Coup adverse" };
  e.st.forEach((s, k) => { notes[k + 1] = s.t; if (s.v) vz[k + 1] = Object.assign({}, s.v, { lab: Object.assign({}, LB, s.v.lab || {}) }); });
  notes[e.st.length] = (notes[e.st.length] ? notes[e.st.length] + " " : "") + e.e;
  return { title: "Exemple : " + x.t, sub: "Une partie type, coup par coup. Les repères colorés montrent les cases, colonnes et diagonales importantes.", fen: x.fen, sans: e.st.map((s) => s.s), from: 0, orient: e.o, notes, vz, nokeys: true, noauto: true };
}
function egExHTML() {
  const i = V.egi, x = EG_LIST[i]; if (!x || !EG_EX[i]) return backBtn("Finales");
  let h = backBtn("Finales") + '<div class="hdr kh" data-k="' + (x.goal === "win" ? "green" : "amber") + '"><div class="row"><span class="chip k">' + (x.goal === "win" ? "Gagner" : "Faire nulle") + '</span><span class="chip">niveau ' + "\u25CF".repeat(x.lv) + "\u25CB".repeat(3 - x.lv) + '</span></div><h1>' + esc(x.t) + '</h1><p class="muted">Regarde d\'abord comment on s\'y prend, puis essaie toi-même.</p></div>';
  h += '<div class="stack" style="gap:16px">' + stIllHTML(egExIll(i));
  h += '<div class="card"><span class="label">À retenir</span><p>' + esc(x.why) + '</p></div>';
  h += '<div class="row"><button class="btn primary" data-act="egplay2" data-i="' + i + '">À toi de jouer !</button></div></div>';
  return h;
}
