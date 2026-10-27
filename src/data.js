/* ===== Données du répertoire =====
   Les coups sont en notation anglaise (moteur) ; l'affichage les convertit en français.
   Les commentaires {…} sont en français. */

const OPENINGS = [
  { id: "lon", name: "Système de Londres", short: "Londres", side: "w", k: "blue", g: "♗\uFE0E",
    blurb: "1.d4 puis Ff4, e3, c3 et Cbd2. Un système solide qui offre des plans clairs contre presque toutes les défenses." },
  { id: "ita", name: "Partie italienne", short: "Italienne", side: "w", k: "green", g: "♘\uFE0E",
    blurb: "1.e4 e5 2.Cf3 Cc6 3.Fc4. Le Giuoco Pianissimo (c3, d3) pour jouer la durée, avec d4 comme grand objectif." },
  { id: "pir", name: "Défense Pirc", short: "Pirc", side: "b", k: "violet", g: "♙\uFE0E",
    blurb: "1.e4 d6 avec ...Cf6, ...g6, ...Fg7. Tu laisses le centre aux Blancs puis tu l'attaques par ...c5 ou ...e5." },
  { id: "dut", name: "Défense hollandaise", short: "Hollandaise", side: "b", k: "orange", g: "♕\uFE0E",
    blurb: "1.d4 f5. Tu prends de l'espace côté roi et tu attaques dès le premier coup : Léningrad, Stonewall ou classique." },
  { id: "bir", name: "Ouverture Bird", short: "Bird", side: "w", k: "amber", g: "♖\uFE0E",
    blurb: "1.f4 : une Hollandaise à l'envers. Tu contrôles e5, tu sors Cf3, Fe2 ou Fb2, puis tu attaques à l'aile roi avec f4-f5 et la dame." },
  { id: "eng", name: "Anglaise de Botvinnik", short: "Anglaise", side: "w", k: "teal", g: "♔\uFE0E",
    blurb: "1.c4 puis Cc3, g3, Fg2 et e4 : le triangle de pions c4-d3-e4 contrôle d5. Un système flexible, avec f2-f4 et b2-b4 comme leviers." }
];

const LINES = [
  /* ---------- LONDRES (Blancs) ---------- */
  { id: "lon1", op: "lon", struct: "lon-std", name: "Classique : ...e6, ...c5, ...Cc6",
    pgn: `1. d4 d5 2. Nf3 {Ordre de coups souple : 2.Ff4 est possible aussi. Avec Cf3 tu gardes plus d'options.} Nf6 3. Bf4 {Le fou sort avant d'être enfermé par e3. C'est l'idée centrale du système.} e6 4. e3 c5 5. c3 {Le pion c3 soutient d4 et prépare Cbd2.} Nc6 6. Nbd2 Bd6 7. Bg3 {Si ...Fxg3, reprends hxg3 : la colonne h devient semi-ouverte et ton centre reste intact.} O-O 8. Bd3 {Le fou d3 vise h7. Le sacrifice Fxh7+ devient possible si le Cf6 est dévié ou cloué. Vérifie toujours les coups forcés.} b6 9. Ne5 {Avant-poste en e5, soutenu par d4. Plans : f2-f4, Df3, ou Te1 puis e3-e4.} Bb7` },

  { id: "lon2", op: "lon", struct: "lon-qb6", name: "Contre ...Db6 : structure avec ...c4",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3 Nc6 5. c3 Qb6 {Attaque sur b2 : le thème classique contre le Londres.} 6. Qb3 {Tu proposes l'échange des dames. Si les Noirs l'acceptent, leurs pions b6 seront doublés.} c4 {Le pion c4 attaque b3 et contrôle d3.} 7. Qxb6 axb6 8. Nbd2 Bf5 9. Be2 {Le fou ne va pas en d3 : le pion c4 le prendrait. e2 est la bonne case.} e6 10. O-O Be7` },

  { id: "lon3", op: "lon", struct: "lon-kid", name: "Contre le fianchetto : ...g6, ...Fg7",
    pgn: `1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 O-O 5. h3 {Offre la case h2 au fou si ...Ch5, et empêche ...Cg4.} d6 6. Be2 Nbd7 7. O-O c5 8. c3 {Le schéma reste le même : c3, e3, Cbd2.} b6 9. Nbd2 Bb7` },

  { id: "lon4", op: "lon", struct: "lon-nh5", name: "Après ...Ch5 et hxg3",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 Nh5 {Les Noirs veulent gagner la paire de fous.} 5. Bg3 Nxg3 6. hxg3 {Reprise thématique : la colonne h est semi-ouverte et le centre e3-d4 reste solide.} c5 7. c3 Nc6 8. Nbd2 Bd6 9. Bd3 O-O` },

  { id: "lon5", op: "lon", struct: "lon-bf5", name: "Ordre 2.Ff4 contre ...Ff5 et ...c5",
    pgn: `1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 {c3 est occupée par le pion : le cavalier b1 passe donc par d2.} Bf5 6. Ngf3 e6 7. Be2 Be7 8. O-O O-O` },

  /* ---------- ITALIENNE (Blancs) ---------- */
  { id: "ita1", op: "ita", struct: "ita-pian", name: "Pianissimo : ...a6, ...Fa7",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 {Giuoco Pianissimo : tu construis le centre sans te presser. d4 viendra plus tard, mieux préparé.} a6 6. O-O Ba7 7. Bb3 {Le fou se met à l'abri de ...Ca5 et garde la diagonale a2-g8.} d6 8. Re1 O-O 9. h3 {Prophylaxie : empêche ...Fg4 et ...Cg4.} h6 10. Nbd2 Re8 11. Nf1 {Plan classique : Cf1-g3 (ou e3), comme dans l'Espagnole fermée.} Be6 12. Bxe6 Rxe6 13. Ng3` },

  { id: "ita2", op: "ita", struct: "ita-greco", name: "Piano : 5.d4 et centre mobile",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 {Variante plus ouverte : tu prends le centre tout de suite.} exd4 6. cxd4 Bb4+ 7. Bd2 {Fd2 est le choix de ce répertoire (Cc3 est possible mais plus compliqué).} Bxd2+ 8. Nbxd2 {Le cavalier reprend : il soutient e4 et la poussée d4-d5 reste possible.} d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 c6 13. a4 {Tu as le pion d4 et plus d'espace. Les Noirs sont solides mais un peu passifs.}` },

  { id: "ita3", op: "ita", struct: "ita-slow", name: "Italienne lente : 4.d3 Fe7",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 {Contre 3...Cf6 tu évites la théorie de 4.Cg5 avec ce coup tranquille.} Be7 5. O-O O-O 6. Re1 d6 7. c3 a6 8. Bb3 Na5 9. Bc2 {Le fou garde la diagonale b1-h7 sans être échangé.} c5 10. Nbd2 Re8 11. Nf1 Bf8 12. Ng3 g6` },

  { id: "ita4", op: "ita", struct: "ita-slow", name: "Italienne lente : 4.d3 h6",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 h6 {Les Noirs évitent Fg5 mais perdent un temps.} 5. O-O d6 6. c3 Be7 7. Re1 O-O 8. Nbd2 Be6 9. Bb3 Qd7 10. Nf1 Rad8` },

  { id: "ita5", op: "ita", struct: "ita-b4", name: "Pianissimo avec b4, a4, b5",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. b4 {Gain d'espace à l'aile dame : le fou noir doit reculer.} Bb6 6. d3 d6 7. a4 a5 8. b5 {Le cavalier c6 est chassé.} Ne7 9. O-O O-O 10. Nbd2 Ng6` },

  /* ---------- PIRC (Noirs) ---------- */
  { id: "pir1", op: "pir", struct: "pir-class", name: "Classique : ...c6, ...Dc7, ...e5",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O c6 {Le pion c6 prépare ...Dc7 et ...e5 sans laisser de faiblesse en d5.} 7. a4 Nbd7 8. a5 Qc7 9. h3 e5 {Cassure thématique. Le fou g7 se réveille et le centre blanc est mis sous pression.} 10. Be3 Re8` },

  { id: "pir2", op: "pir", struct: "pir-bg4", name: "Classique : ...Fg4, ...Cc6, ...e5",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Bg4 {Clouage sur Cf3 : le centre blanc perd un défenseur.} 7. Be3 Nc6 8. Qd2 e5 9. dxe5 dxe5 10. h3 Bxf3 {Tu donnes la paire de fous : ta compensation sera l'avant-poste en d4.} 11. Bxf3 Nd4` },

  { id: "pir3", op: "pir", struct: "pir-aus", name: "Attaque autrichienne : 4.f4 c5",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 c5 {Frappe le centre à trois pions. C'est la réponse de principe.} 6. dxc5 Qa5 7. Bd3 Qxc5 8. Qe2 O-O 9. Be3 Qa5` },

  { id: "pir4", op: "pir", struct: "pir-150", name: "Attaque 150 : 4.Fe3, ...c6 et ...b5",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 {Contre-jeu à l'aile dame avant que les Blancs n'ouvrent la colonne h.} 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7` },

  { id: "pir5", op: "pir", struct: "pir-150", name: "Attaque 150 : ordre 4.Cf3 puis Fe3",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be3 O-O 6. Qd2 c6 7. Bh6 Nbd7 8. Bxg7 Kxg7 9. O-O-O Qa5 {Plan de Pirc contre l'attaque 150 : la dame vise a2 et prépare ...Tb8 puis ...b5, sans te précipiter.}` },

  { id: "pir6", op: "pir", struct: "pir-czech", name: "Pirc tchèque : ...c6, ...Da5, ...e5",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 c6 {Pirc tchèque : tu gardes g6 en réserve et tu prépares ...e5 tout de suite.} 4. f4 Qa5 5. Bd3 e5 {Contre le centre blanc : si fxe5 dxe5, tes pièces deviennent actives.} 6. Nf3 Bg4` },

  /* ---------- HOLLANDAISE (Noirs) ---------- */
  { id: "dut1", op: "dut", struct: "dut-len", name: "Léningrad : ...De8 et ...Ca6",
    pgn: `1. d4 f5 2. g3 Nf6 3. Bg2 g6 {Fianchetto Léningrad : ...Fg7 viendra vite et ...e5 est ton objectif.} 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Qe8 {La dame soutient ...e5 et prépare ...Dh5.} 8. d5 Na6` },

  { id: "dut2", op: "dut", struct: "dut-len", name: "Léningrad : ...Cc6, ...Ca5 et ...c5",
    pgn: `1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Nc6 8. d5 Na5 9. Nd2 c5` },

  { id: "dut3", op: "dut", struct: "dut-stone", name: "Stonewall : ...Fd6, ...De7 et Fa3",
    pgn: `1. d4 f5 2. g3 Nf6 3. Bg2 e6 4. Nf3 d5 5. O-O Bd6 {Le fou d6 est la pièce clé du Stonewall moderne. Face à g3 il soutient ...Ce4 ; contre Fd3 sans g3 il vise aussi h2.} 6. c4 c6 7. b3 Qe7 8. Ba3 Bxa3 9. Nxa3 O-O` },

  { id: "dut4", op: "dut", struct: "dut-stone", name: "Stonewall contre Cc3 et Fd3",
    pgn: `1. d4 f5 2. c4 Nf6 3. Nc3 e6 4. Nf3 d5 5. e3 c6 6. Bd3 Bd6 7. O-O O-O 8. Qc2 Qe8 9. Bd2 Nbd7` },

  { id: "dut5", op: "dut", struct: "dut-class", name: "Classique : ...Fb4, ...d6, ...De8",
    pgn: `1. d4 f5 2. c4 Nf6 3. Nc3 e6 4. Nf3 Bb4 {Clouage de Cc3 : tu prépares ...Fxc3 pour doubler les pions blancs.} 5. e3 O-O 6. Bd3 d6 7. O-O Nc6 8. a3 Bxc3 9. bxc3 Qe8` },

  { id: "dut6", op: "dut", struct: "dut-hopton", name: "Contre 2.Fg5 : ...Cf6 et ...exf6",
    pgn: `1. d4 f5 2. Bg5 Nf6 3. Bxf6 exf6 {Reprise avec le pion e : les pions f sont doublés mais le centre est solide.} 4. e3 d5 5. Nf3 Bd6 6. Nbd2 O-O 7. c3 c6` },

  { id: "dut7", op: "dut", struct: "dut-staunton", name: "Contre le gambit Staunton : 2.e4",
    pgn: `1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 e6 5. Nxe4 Be7 6. Bxf6 Bxf6 7. Nf3 O-O 8. Bd3 Nc6 {Développe d'abord : ...Cc6 attaque d4 et prépare ...d5 ou ...d6.}` },

  /* ---------- Ajouts après lecture de tes cours Chessable (titres de chapitres) ---------- */
  { id: "lon6", op: "lon", struct: "lon-qi", name: "Contre l'Indienne de la Dame : ...b6, ...Fb7, ...d5",
    pgn: `1. d4 Nf6 2. Bf4 e6 3. e3 b6 4. Nf3 Bb7 5. Bd3 Be7 6. h3 {Prophylaxie habituelle : la case h2 reste une retraite pour le fou et ...Cg4 disparaît.} d5 7. O-O O-O 8. Nbd2 c5 9. c3 {Tu gardes le pion d4 solide. Si les Noirs prennent, tu reprends du pion e.} cxd4 10. exd4 {Pas de pion isolé à craindre : ton fou f4 et ton cavalier visent e5, la colonne e est ouverte pour tes tours.}` },

  { id: "lon7", op: "lon", struct: "lon-ben", name: "Contre ...c5 sur 2.Ff4 : structure de Benoni",
    pgn: `1. d4 Nf6 2. Bf4 c5 3. d5 {Tu fermes le centre : la poussée est plus forte quand le fou est déjà sorti.} d6 4. Nc3 g6 5. e4 {Centre de pions e4-d5, comme dans un Benoni où ton fou est mieux placé.} Bg7 6. Nf3 O-O 7. a4 {Empêche ...b5 et fixe l'aile dame avant de jouer pour l'attaque au centre.}` },

  { id: "lon8", op: "lon", struct: "lon-kid", name: "Contre ...g6 : plan d'attaque avec h4",
    pgn: `1. d4 Nf6 2. Bf4 d5 3. e3 g6 4. Nc3 {Contre ...g6, un cavalier en c3 permet de jouer h4 sans perdre le centre.} Bg7 5. h4 {Plan agressif : le pion h avance pour ouvrir la colonne h ou gêner le fianchetto.} c6 6. Be2 O-O 7. Nf3 Nbd7 8. Ne5 {Même avant-poste que d'habitude, mais ton roi n'est pas encore roqué : sois attentif aux contre-coups ...h6 et ...g5.}` },

  { id: "ita6", op: "ita", struct: "ita-evans", name: "Gambit Evans : 4.b4 Fxb4 5.c3 Fa5",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 {Gambit Evans : un pion contre du développement et un grand centre.} Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 {Le fou noir se met à l'abri en b6.} 9. Nc3 Na5 10. Bg5 {Tu as le centre et les pièces mieux développées : continue à créer des menaces.}` },

  { id: "ita7", op: "ita", struct: "ita-evans", name: "Evans : 5.c3 Fa5 6.d4 d6 7.Db3 Dd7",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Qb3 {La dame attaque f7 et b7 : les Noirs doivent défendre sans perdre de temps.} Qd7 8. O-O Bb6 9. Nbd2 exd4 10. cxd4 Nxd4 11. Nxd4 Bxd4 12. Rb1 Nf6 13. Nf3 Bb6 14. e5 {Poussée thématique : le pion e5 gagne du temps sur le cavalier et ouvre la diagonale c1-h6.} Ne4 15. Ba3 O-O 16. Rbe1 Nc5 17. Bxc5 Bxc5 18. e6` },

  { id: "ita8", op: "ita", struct: "ita-evans", name: "Evans : 5.c3 Fa5 6.d4 exd4 7.Db3 Df6",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. Qb3 Qf6 8. O-O {Tu laisses prendre le pion c3 : les pièces blanches se développent avec des menaces.} dxc3 9. Bg5 {Le fou chasse la dame et gagne un temps.} Qg6 10. Nxc3 Bxc3 11. Qxc3 Nf6 12. e5 Ne4 13. Qe3 O-O` },


  { id: "dut8", op: "dut", struct: "dut-lond", name: "Contre le Londres : ...e6, ...Fe7 et ...b6",
    pgn: `1. d4 f5 2. Bf4 Nf6 3. e3 e6 4. Nf3 Be7 5. h3 O-O 6. Bd3 b6 {Fianchetto du fou dame : il vise la grande diagonale et tu gardes ...Fb7 pour attaquer e4.} 7. O-O Bb7 8. c3 {Les Blancs jouent le schéma habituel. Tu peux enchaîner avec ...Ce4 ou ...d6.}` },

  { id: "pir7", op: "pir", struct: "pir-byrne", name: "Contre 4.Fg5 (Byrne) : 5.e5 Cfd7 et ...cxd6",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bg5 {Le fou veut clouer ton cavalier f6 : ne le laisse pas gêner ta structure.} Bg7 5. e5 {Poussée de pion : réponds par le cavalier plutôt que de perdre un pion.} Nfd7 6. exd6 cxd6 7. Nf3 Nf6 8. Qd2 O-O 9. Bh6 {Les Blancs veulent échanger ton fou g7 : prépare ...Da5 et un contre-jeu actif.} Qa5 10. h4 Bg4 11. O-O-O Rc8` },

  { id: "pir8", op: "pir", struct: "pir-byrne", name: "Contre 4.Ff4 : ...c6, ...Da5 et échange des dames",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bf4 c6 {Le pion c6 prépare ...Da5 et rend la poussée e5 moins dangereuse.} 5. Qd2 Qa5 6. Nf3 Nbd7 7. e5 dxe5 8. dxe5 Nd5 {Le cavalier d5 trouve un bon poste : si les Blancs échangent les dames, tu obtiens un jeu égal.} 9. Nxd5 Qxd5 10. Qxd5 cxd5` },

  { id: "dut9", op: "dut", struct: "dut-gcl", name: "Classique avec g3 : 7.Cc3 Ce4 8.Dc2 Cxc3",
    pgn: `1. d4 f5 2. Nf3 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. c4 d6 7. Nc3 Ne4 {Le cavalier e4 est la pièce clé de la Classique : il occupe la case que f5 contrôle.} 8. Qc2 Nxc3 9. bxc3 {Les Blancs ont des pions c doublés mais plus de contrôle central.} Nc6 10. e4 e5 11. dxe5 dxe5 12. Rb1` },

  { id: "dut10", op: "dut", struct: "dut-gcl", name: "Classique avec g3 : 8.Cxe4 fxe4 9.Cd2 d5 10.f3",
    pgn: `1. d4 f5 2. Nf3 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. c4 d6 7. Nc3 Ne4 8. Nxe4 fxe4 {Le pion e4 gagne de l'espace et gêne le développement blanc.} 9. Nd2 d5 10. f3 {Les Blancs attaquent le pion e4 : ne le défends pas passivement, cherche la structure ouverte.} Nc6 11. fxe4 Rxf1+ 12. Nxf1 dxc4 13. Be3 Bd7` },

  { id: "dut11", op: "dut", struct: "dut-gcl", name: "Classique avec g3 : 8.Cxe4 fxe4 9.Cd2 d5 10.e3",
    pgn: `1. d4 f5 2. Nf3 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. c4 d6 7. Nc3 Ne4 8. Nxe4 fxe4 9. Nd2 d5 10. e3 Nc6 11. f3 exf3` },

  { id: "dut12", op: "dut", struct: "dut-hopton", name: "Contre 2.Cc3 : ...Cf6, 3.Fg5 d5 et ...exf6",
    pgn: `1. d4 f5 2. Nc3 Nf6 3. Bg5 d5 4. Bxf6 exf6 5. e3 Be6` },

  { id: "dut13", op: "dut", struct: "dut-lond", name: "Contre le Londres : ...b6, ...Fb7, ...Fd6 et ...Ce4",
    pgn: `1. d4 f5 2. Nf3 Nf6 3. Bf4 e6 4. e3 b6 5. Bd3 Bb7 6. Nbd2 Bd6 7. Bxd6 cxd6 {Reprise du pion c : tu gardes un pion e5 central et une colonne c semi-ouverte.} 8. c3 O-O 9. O-O Nc6 10. a3 d5 {Tu fixes enfin le centre : ...d5 contrôle e4 et prépare ...Te8 ou ...Dc7.} 11. Qe2 Rc8` },

  { id: "lon9", op: "lon", struct: "lon-side", name: "Contre ...Fd6 : 5.Ce5 et le coup 6.Fb5+",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 Bd6 {Les Noirs veulent échanger ton fou f4. Ne te laisse pas faire sans réfléchir.} 5. Ne5 {Le cavalier attaque f7 et prépare une combinaison tactique.} c5 6. Bb5+ {Échec qui détourne le cavalier b8 de sa bonne case.} Nbd7 7. Bxd7+ Bxd7 8. Nxf7 {Le pion f7 tombe : vérifie toujours les clouages avant de jouer 5.Ce5.}` },

  { id: "lon10", op: "lon", struct: "lon-qb6", name: "Contre 5...Db6 : 6.Tb1 et plan h3, Fd3",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 c5 5. Nbd2 Qb6 6. Rb1 {Variante moderne : la tour protège b2 sans que tu aies à te défendre par c1-b3.} Nc6 7. c3 Be7 8. h3 O-O 9. Bd3 Qd8 {La dame noire recule : tu as gagné du temps et ton schéma est installé.} 10. O-O` },

  { id: "lon11", op: "lon", struct: "lon-qb6", name: "Contre 3...c5 4.e3 Db6 : 5.Cc3, sacrifice de pion",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3 Qb6 5. Nc3 {Plan tranchant : tu laisses b2 en prise pour développer et obtenir la paire de fous.} Bd7 6. dxc5 Qxb2 7. Nb5 {La dame est piégée dans ton camp : sois précis.} Bxb5 8. Qd4 Qxd4 9. Bxb5+ Nc6 10. exd4` },

  { id: "lon12", op: "lon", struct: "lon-side", name: "Contre 2...c5 : 3.dxc5 Cf6 4.c4",
    pgn: `1. d4 d5 2. Nf3 c5 3. dxc5 {Contre ...c5 tu prends le pion : le fou f4 n'est pas encore sorti, donc le choix est ouvert.} Nf6 4. c4 Nc6 5. cxd5 Qxd5 6. Qxd5 Nxd5 7. e4 Ndb4 8. Kd1 Be6 9. Be3` },

  { id: "lon13", op: "lon", struct: "lon-side", name: "Contre 2...e6 : 3...Fd6 4.e3 Ce7 et pression à l'aile dame",
    pgn: `1. d4 d5 2. Nf3 e6 3. Bf4 Bd6 4. e3 Ne7 5. Bxd6 {Ici l'échange te convient : tu gardes l'avantage d'espace.} Qxd6 6. c4 O-O 7. c5 {Le pion c5 chasse la dame et prépare b4-b5 pour attaquer à l'aile dame.} Qd8 8. b4` },

  { id: "lon14", op: "lon", struct: "lon-side", name: "Contre la Slave (2...c6) : Ff4, h3, g4 et Ce5",
    pgn: `1. d4 d5 2. Nf3 c6 3. Bf4 Nf6 4. e3 Bg4 5. h3 Bh5 6. Nbd2 e6 7. g4 {Agressif : le fou noir est coincé sur la colonne h.} Bg6 8. Ne5 Nbd7 9. h4 {Menace h5 pour piéger le fou g6.} Nxe5 10. dxe5` },
  /* ---------- Nouvelles lignes (vérifiées au moteur) ---------- */
  { id: "lon15", op: "lon", struct: "lon-kid", name: "Contre ...g6 et ...d5 : Fe2, c3 et ...b6",
    pgn: `1. d4 Nf6 2. Nf3 g6 3. Bf4 Bg7 4. e3 d5 {Les Noirs jouent ...d5 : ils veulent une structure de Grünfeld calme. Tu gardes ton schéma.} 5. Be2 c5 6. c3 O-O 7. Nbd2 b6 8. h3 {Ce coup donne une case de repli au fou f4 et empêche ...Cg4.} Nc6 9. O-O Bb7` },

  { id: "lon16", op: "lon", struct: "lon-side", name: "Contre ...Cc6 et ...Ff5 : Fb5 et c4",
    pgn: `1. d4 d5 2. Bf4 Nf6 3. e3 Nc6 4. Nf3 Bf5 5. Bb5 {Le fou b5 vise le cavalier c6 qui protège d5 et d4 : les Noirs doivent réagir.} Bd7 6. c4 e6 7. O-O Bd6 8. cxd5 exd5 9. Bxd6 {Échange favorable : tu gardes plus d'espace et l'initiative.} cxd6` },

  /* ---------- Chapitre « Pièges » ---------- */
  { id: "tlon1", op: "lon", struct: "lon-qb6", ch: "pieges", trap: "set", name: "Piège : le pion b2 empoisonné",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3 Qb6 {Les Noirs visent b2. C'est le thème classique contre le Londres.} 5. Nc3 {Tu laisses volontairement b2 en prise : c'est l'appât.} Qxb2 6. Nb5 {Le cavalier menace Cc7+ et la dame noire manque d'espace. Les Noirs sont déjà en difficulté.} Na6 7. a3 {Un coup calme : la dame ne trouve pas de bonne case de retraite. Stockfish voit un net avantage blanc.} Bf5 8. dxc5` },

  { id: "tita1", op: "ita", struct: "ita-pian", ch: "pieges", trap: "set", name: "Piège : le mat de Légal",
    pgn: `1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 {Le fou noir cloue ton cavalier f3 contre la dame. Les Noirs pensent que tu ne peux plus le bouger.} 4. Nc3 g6 5. Nxe5 {Le sacrifice de dame : si les Noirs prennent la dame, le mat est forcé.} Bxd1 6. Bxf7+ Ke7 7. Nd5#` },

  { id: "tita2", op: "ita", struct: "ita-pian", ch: "pieges", trap: "set", name: "Légal avec ...Cc6 et h3",
    pgn: `1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 Nc6 5. h3 {Tu demandes au fou ce qu'il compte faire.} Bh5 6. Nxe5 {Même idée : si les Noirs prennent la dame, le mat arrive.} Bxd1 7. Bxf7+ Ke7 8. Nd5# {Si les Noirs reprennent plutôt 6...Cxe5, tu joues Dxh5 et tu gardes un avantage.}` },

  { id: "tita3", op: "ita", struct: "ita-pian", ch: "pieges", trap: "avoid", name: "À éviter : le Blackburne Shilling",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 {Un piège pour les Blancs gourmands. Si tu joues 4.Cxe5? Dg5! tu perds : 5.Cxf7 Dxg2 6.Tf1 Dxe4+ 7.Fe2 Cf3 est mat.} 4. Nxd4 {Le bon réflexe : prends d'abord le cavalier, sans te laisser tenter par le pion e5.} exd4 5. O-O {Tu es mieux développé. Stockfish donne environ +1,3.}` },

  { id: "tita4", op: "ita", struct: "ita-pian", ch: "pieges", trap: "set", name: "Bonus : le Foie grillé (4.Cg5)",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 {Hors de ton plan de base (4.d3), mais c'est l'arme à connaître contre 3...Cf6.} d5 5. exd5 {Contre ...Ca5! (le coup sérieux), tu joues Fb5+. Mais beaucoup d'adversaires répondent 5...Cxd5.} Nxd5 6. Nxf7 {Le sacrifice : le roi noir est attiré au centre.} Kxf7 7. Qf3+ Ke6 8. Nc3 {Attaque très dangereuse pour les Noirs. Stockfish voit environ +1.}` },

  { id: "tpir1", op: "pir", struct: "pir-byrne", ch: "pieges", trap: "avoid", name: "À éviter : ...Cg4 après l'échange des dames",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bg5 Bg7 5. e5 dxe5 6. dxe5 Qxd1+ 7. Rxd1 Nfd7 {Le seul bon coup. Si tu joues 7...Cg4? 8.h3 Cxe5? 9.Cd5 tu perds du matériel : le pion e5 est un appât.} 8. Nf3 c6 {Tu attaques le pion e5 avec ...Cc5 ou ...Cb6 à venir. Position correcte pour les Noirs.}` },

  { id: "tpir2", op: "pir", struct: "pir-bg4", ch: "pieges", trap: "avoid", name: "À éviter : prendre en d5 avec le cavalier",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Bg4 7. Be3 Nc6 8. Qd2 e5 9. d5 {Les Blancs poussent d5. Attention : 9...Cxd5? 10.exd5 Fxf3 11.Fxf3 te coûte une pièce.} Ne7 {Le bon retrait. Tu gardes un jeu correct.} 10. h3 Bd7 11. Rad1` },

  { id: "tdut1", op: "dut", struct: "dut-hopton", ch: "pieges", trap: "avoid", name: "Piège : le gambit Hopton et la case h5",
    pgn: `1. d4 f5 2. Bg5 h6 3. Bh4 g5 {Variante piquante. Si tu préfères la sécurité, 2...Cf6 reste ta réponse de base.} 4. Bg3 Nf6 {Le bon coup. 4...f4? 5.e3 fxg3?? 6.Dh5# est mat : la diagonale e8-h5 est ouverte.} 5. e3 d6 {5...Ch5?? 6.Dxh5# est le même motif.} 6. h4 Rg8 7. hxg5 hxg5` },

  { id: "tdut2", op: "dut", struct: "dut-staunton", ch: "pieges", trap: "set", name: "Piège : le clouage sur la colonne e (Staunton)",
    pgn: `1. d4 f5 2. e4 fxe4 3. Nc3 Nf6 4. Bg5 Nc6 5. Bxf6 exf6 {La colonne e est ouverte : c'est l'arme des Noirs.} 6. Nxe4 {Le coup naturel, mais une erreur.} Qe7 {Le cavalier e4 est cloué sur la colonne e. Si les Blancs jouent 7.Cxf6+? gxf6 8.Dxe7+ Rxe7, ils ont donné une pièce pour un pion.} 7. Qe2 Nxd4 8. Qd3 d5 9. Qxd4 Qxe4+ 10. Qxe4 dxe4 {Les Noirs ont gagné un pion et gardent l'avantage.}` },

  { id: "lon17", op: "lon", struct: "lon-side", ch: "autres", name: "Contre la Hollandaise (...f5)",
    pgn: `1. d4 f5 2. Bf4 {Le fou sort avant e3 : il surveille la diagonale b8-h2 et la case e5, clé de la structure.} Nf6 3. e3 e6 4. Nf3 g6 {Les Noirs choisissent un Léningrad. Ton plan ne change pas : e3, c4, Cc3 et h3.} 5. c4 Bg7 6. Nc3 O-O 7. h3 b6 8. Be2 Ne4 9. h4 {h4 ouvre un second front sur l'aile roi et prépare Fg5 contre le cavalier e4.} Nc6 10. d5 e5 11. Bg5 Nxg5 {Après l'échange en g5, Stockfish donne environ +1,3 aux Blancs : le pion d5 gagne de l'espace.}` },

  { id: "lon18", op: "lon", struct: "lon-kid", ch: "fian", name: "Contre la Moderne (...g6, ...Fg7)",
    pgn: `1. d4 g6 2. Nf3 Bg7 3. Bf4 {Position typique : e3 et c3 d'abord, le cavalier b1 ira en d2 ou a3 selon la réponse.} d6 4. e3 Nf6 5. c3 O-O 6. h3 Nfd7 7. Be2 e5 {Après ...e5, ramène le fou en h2 : il garde la diagonale et évite l'échange.} 8. Bh2 f5 9. O-O Nc6 10. a4 Kh8 11. a5 a6 {Évaluation à peu près égale : le jeu se joue sur la structure, pas sur un piège.}` },

  { id: "lon19", op: "lon", struct: "lon-std", ch: "autres", name: "Contre ...Fd6 : le recul 5.Fg3",
    pgn: `1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 Bd6 5. Bg3 {Fg3 offre l'échange mais, après ...Fxg3 hxg3, la colonne h t'appartient. Si les Noirs jouent autre chose, ton fou reste actif.} c5 {Les Noirs frappent le centre avec ...c5 : c'est le seul vrai plan contre le Londres bien installé.} 6. dxc5 Bxc5 7. c4 O-O {Tu rocques côté roi, le centre est ouvert, mais ton développement est meilleur.} 8. Qc2 Be7 9. Nc3 Nc6 10. Rd1 Qa5 11. Nd2 Bb4 {Stockfish voit environ +0,35 : avantage léger pour les Blancs.}` },

  { id: "lon20", op: "lon", struct: "lon-std", ch: "autres", name: "Contre 2...c5 : 3.e3 Cc6 4.c3",
    pgn: `1. d4 d5 2. Nf3 c5 3. e3 Nc6 4. c3 {c3 renforce d4 et prépare Cbd2. C'est le schéma habituel contre ...c5.} e6 5. Nbd2 cxd4 {Les Noirs échangent en d4. Reprends avec e×d4 et visa la case e5.} 6. exd4 Bd6 7. Bd3 f6 {...f6 empêche Ce5, mais affaiblit la diagonale a2-g8.} 8. c4 Nge7 9. a3 O-O 10. O-O Nf5 11. b4 Nfxd4 {Position équilibrée (+0,16) : l'avantage vient d'une meilleure connaissance du plan.}` },

  { id: "ita9", op: "ita", struct: "ita-evans", ch: "evans", name: "Evans refusé : 4...Fb6",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 {4.b4 : si les Noirs refusent le pion avec ...Fb6, ne force rien.} Bb6 5. a4 a6 {a4 menace a5 et gagne du temps sur le fou noir.} 6. O-O d6 {O-O et c3 : tu construis le centre sans te précipiter.} 7. c3 Nf6 8. d3 h6 9. Nbd2 O-O 10. Re1 Ng4 11. Re2 Kh8 {Évaluation quasi égale (+0,13), mais tu as l'initiative au centre.}` },

  { id: "ita10", op: "ita", struct: "ita-greco", ch: "greco", name: "Attaque Moeller : 7.Fd2 simplifie",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 {d4 coupe le jeu au centre. Les Noirs répondent en général ...exd4 puis ...Fb4+.} exd4 6. cxd4 Bb4+ 7. Bd2 {L'échange des fous est le plus sûr : tu gardes un joli centre.} Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 {Les Noirs ont deux pièces bien placées au centre : surveille la case d4.} 10. O-O O-O 11. Re1 Nb6 12. Bb3 Nxd4 {Les Noirs ont égalisé (-0,04) : il faut connaître la ligne, pas la jouer à l'aveugle.}` },

  { id: "ita11", op: "ita", struct: "ita-greco", ch: "greco", name: "Contre ...Ca5 : retraite Fe2",
    pgn: `1. e4 e5 2. Nf3 Nc6 {4.Cg5 est l'arme contre 3...Cf6 : les Noirs ont deux réponses sérieuses.} 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 {Après ...Ca5, 6.Fb5+ gagne du temps : le fou revient en e2.} 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 {Les Noirs ont rendu le pion mais ont un jeu actif. Tu dois surveiller h6 et Ch3.} 9. Nh3 Bc5 10. O-O Nb7 11. Nc3 Qc7 12. Kh1 O-O {Position à peu près égale (+0,2).}` },

  { id: "ita12", op: "ita", struct: "ita-greco", ch: "greco", name: "Deux Cavaliers : 4.d4 et O-O",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 {4.d4 ouvre le centre dès le départ : l'idée est de sacrifier un pion pour l'initiative.} exd4 5. O-O Nxe4 {Après ...Cxe4 Te1 d5 Fxd5 Dxd5, les dames sont sorties tôt : suis bien les échanges.} 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qh5 {La dame noire est sortie tôt : elle devient une cible.} 9. Nxe4 Be6 10. Bg5 Bd6 11. Nxd6+ cxd6 {Stockfish voit -0,05 : tu paies la sortie par la sécurité.}` },

  { id: "ita13", op: "ita", struct: "ita-slow", ch: "lente", name: "Italienne hongroise (3...Fe7)",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d3 {3...Fe7 est la variante hongroise : très solide, elle refuse l'ouverture.} Nf6 5. O-O {O-O, c3, Fb3 : tu gardes la structure lente.} a6 6. c3 d6 7. Bb3 {...Fe6 échange l'un de tes fous. Joue Fb3 pour garder la diagonale.} Be6 8. d4 Bg4 9. h3 Bxf3 10. Qxf3 exd4 11. Qd3 dxc3 {Évaluation +0,04 : tu dois créer des problèmes sans prendre de risques.}` },

  { id: "pir9", op: "pir", struct: "pir-class", ch: "autres", name: "Attaque Bayonet (h4)",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be2 Bg7 5. h4 {h4 est l'arme moderne : le pion avance pour attaquer ton roque.} h5 {...h5 est la réponse la plus simple : tu fixes la tour h et le fou noir reste actif.} 6. f3 c6 7. a4 O-O {...O-O reste possible, mais garde un oeil sur Fh6.} 8. Nh3 Qa5 9. Be3 Bxh3 10. Rxh3 a6 11. Qd2 Nbd7 {Stockfish donne environ +0,5 aux Blancs : défense délicate mais jouable.}` },

  { id: "pir10", op: "pir", struct: "pir-bg4", ch: "autres", name: "Variante Kholmov (4.Fc4)",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bc4 {4.Fc4 cherche une attaque rapide sur f7.} Bg7 5. Qe2 Nc6 {...Cc6 prépare ...Fg4 et détruit la poussée e5.} 6. Nf3 Bg4 7. Be3 O-O {...O-O puis ...Ca5 : tu chasses le fou c4.} 8. O-O-O Na5 9. Bd3 Nd7 10. h3 Bxf3 11. gxf3 c5 {Position égale (+0,17) : tu as résolu le problème d'ouverture.}` },

  { id: "pir11", op: "pir", struct: "pir-class", ch: "autres", name: "Système avec g3",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. g3 {g3 est une réponse tranquille : fou fianchetté, jeu long.} Bg7 5. Nge2 O-O 6. Bg2 Re8 7. h3 {...c6 prépare ...e5 : tu fais tomber le centre blanc.} c6 8. a4 e5 9. Be3 exd4 10. Bxd4 d5 11. exd5 cxd5 {Les Noirs sont à l'aise (+0,15) : tu as un jeu facile.}` },

  { id: "pir12", op: "pir", struct: "pir-aus", ch: "aut", name: "Attaque autrichienne : 6.Fd3",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 {Tu es dans l'Attaque autrichienne : le centre blanc est large.} 5. Nf3 O-O 6. Bd3 Na6 {...Ca6 et ...c5 : le plan classique pour défaire le centre.} 7. O-O c5 8. d5 c4 9. Bxc4 b5 10. Nxb5 Nxe4 {Les pions blancs avancent, mais ta position reste solide.} 11. Qe1 Nac5 12. Nbd4 Qb6 {Stockfish donne +0,83 aux Blancs : la ligne est tendue, apprends-la bien.}` },

  { id: "pir13", op: "pir", struct: "pir-aus", ch: "aut", name: "Attaque autrichienne : 6.e5 (Unzicker)",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. e5 dxe5 {6.e5 ! cherche à ouvrir les lignes avant que tu sois rocqué.} 7. fxe5 Nd5 {...dxe5 fxe5 Cd5 : le cavalier se centralise.} 8. Bc4 Be6 9. Nxd5 Bxd5 10. Bxd5 Qxd5 11. Qe2 Qd7 {Après les échanges, +0,37 : la partie reste jouable.} 12. Qe4 Qc6` },

  { id: "pir14", op: "pir", struct: "pir-class", ch: "autres", name: "Variante Schlechter (5.h3)",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. h3 {h3 prépare la sortie du fou sans craindre ...Fg4.} d5 {...d5 est la réponse de principe : tu contre-attaques au centre.} 6. e5 Ne4 7. Nxe4 dxe4 8. Ng5 c5 {Les dames sont échangées : tu es à l'aise (+0,43 pour les Blancs, très faible).} 9. c3 Nc6 10. dxc5 O-O 11. Qxd8 Rxd8 {Les dames partent : joue la finale calmement.}` },

  { id: "dut14", op: "dut", struct: "dut-gcl", ch: "gamb", name: "Gambit Krejcik (2.g4)",
    pgn: `1. d4 f5 2. g4 fxg4 3. e4 {2.g4 !? : un pion sacrifié contre l'initiative. Prends-le.} d5 {Après ...fxg4 e4 d5, rends le pion au bon moment.} 4. Nc3 dxe4 5. Nxe4 Nc6 6. Ne2 Nf6 7. Bg2 e5 8. Be3 Bf5 9. N4g3 Bd7 10. O-O Bd6 {Tu es mieux (-0,54) : les Blancs n'ont pas assez de compensation.}` },

  { id: "dut15", op: "dut", struct: "dut-staunton", ch: "gamb", name: "Gambit Staunton : ...c6 contre Fg5",
    pgn: `1. d4 f5 2. e4 fxe4 3. Nc3 {2.e4 !? le gambit Staunton : le but est le développement rapide.} Nf6 4. Bg5 c6 5. f3 {...c6 est un coup solide. Ensuite ...d5 pour contrôler la colonne e.} d5 6. fxe4 dxe4 7. Bc4 Qa5 8. Qd2 Bf5 {Stockfish donne +0,62 aux Blancs : la ligne est un peu meilleure pour eux.} 9. Nge2 Nbd7 10. O-O h6 11. Bxf6 Nxf6 {Pas de piège : joue calmement.}` },

  { id: "dut16", op: "dut", struct: "dut-class", ch: "class", name: "Nimzo-hollandaise (...Fb4+)",
    pgn: `1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 {...Fb4+ est le coup du Nimzo-hollandaise : les Blancs doivent parer l'échec.} Bb4+ 5. Bd2 Be7 6. Nh3 d5 {Après Cf3 / Ch3, le fou revient en e7 sans perdre de temps.} 7. O-O O-O 8. Qc1 a5 9. Nf4 c6 10. Rd1 b6 11. Nc3 Bd6 12. Qc2 Ra7 {Évaluation +0,49 : les Blancs gardent un léger avantage.}` },

  { id: "dut17", op: "dut", struct: "dut-class", ch: "class", name: "Ilyin-Zhenevsky : 8.b3",
    pgn: `1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 {...Fe7 puis ...O-O : le schéma classique.} O-O 6. O-O d6 7. Nc3 {...De8 prépare ...Dh5 ou ...Fh5 selon le plan blanc.} Qe8 8. b3 {8.b3 vise Fa3 : le fou blanc attaque d6.} a5 9. e3 c6 10. Bb2 d5 11. Ne2 Bd6 12. Nf4 Qe7 13. Qc2 Bd7 {Stockfish donne +0,68 : tu défends, mais sans risque immédiat.}` },

  { id: "dut18", op: "dut", struct: "dut-len", ch: "len", name: "Hort-Antoshin (...c6 avec ...Dc7)",
    pgn: `1. d4 f5 2. c4 Nf6 {...d6, ...c6 et ...Dc7 : un système flexible.} 3. g3 d6 4. Bg2 c6 5. Nc3 Qc7 {...Dc7 prépare ...e5 : ton plan principal.} 6. Nf3 e5 7. e4 fxe4 8. Ng5 Be7 9. O-O Bf5 10. d5 Nbd7 11. Be3 O-O {Évaluation +0,69 : les Blancs ont un petit avantage, mais ton jeu est solide.}` },

  { id: "dut19", op: "dut", struct: "dut-len", ch: "len", name: "Léningrad : 7.Cc3 Ca6",
    pgn: `1. d4 f5 2. g3 Nf6 3. Bg2 {...g6 : le Léningrad, le fou va en g7.} g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 c6 {...c6 et ...Dc7 : tu prépares ...e5.} 8. b3 Qc7 9. Re1 Na6 10. Ba3 Ne4 11. Qc2 Nxc3 12. Qxc3 Nc5 13. Qc2 Ne4 {Stockfish voit +0,44 : la ligne est équilibrée.}` },

  { id: "tlon2", op: "lon", struct: "lon-qb6", ch: "pieges", trap: "set", name: "Piège : le pion b2 empoisonné",
    pgn: `1. d4 d5 2. Bf4 c5 3. e3 Qb6 {Les Noirs visent b2. Une erreur classique.} 4. Nc3 {Offre le pion b2, mais ouvre une tactique.} Qxb2 {Les Noirs ont mordu à l'hameçon.} 5. Nb5! {Menace Tb1 qui piège la dame, et Cc7+. Stockfish donne environ +1,5.} Na6 6. Rb1 Qxa2 7. Ra1 {La dame noire est en danger.}` },

  { id: "tpir3", op: "pir", struct: "pir-class", ch: "pieges", trap: "avoid", name: "À éviter : 3...Cf6 dans la Moderne",
    pgn: `1. e4 g6 2. d4 Bg7 3. Nc3 Nf6? {Ce coup est imprécis : 4.e5 chasse le cavalier avec avantage.} 4. e5 {Si 4...O-O? 5.exf6 gagne une pièce (+4 pour les Blancs).} Ng4 {Le seul coup. Mais les Blancs sont déjà mieux. Joue plutôt 3...d6.}` },


  { id: "bir1", op: "bir", struct: "bir-main", ch: "d5", name: "Bird classique : 1...d5 et ...g6",
    pgn: `1. f4 d5 2. Nf3 {Cf3 contrôle e5 et h4, deux cases clés du Bird.} Nf6 3. e3 {e3 prépare Fe2 : tu joues un Stonewall flexible.} g6 4. Be2 {Fe2, puis roque court : c'est le schéma de base du Bird.} Bg7 5. O-O O-O 6. d3 {d3 renforce e4 et prépare De1.} c5 7. Qe1 {De1 vers h4 ou f2 selon la réponse : la dame rejoint l'aile roi.} b5 {Les Noirs gagnent de l'espace en b5 : réponds a3 et Cc3.} 8. a3 Qb6 9. h3 Nc6 10. Qf2 Bb7 11. Nc3 {Cc3 avant e4 : tu prépares la cassure centrale.} a6 12. Bd2 Rac8 13. e4 e6 {Stockfish voit −0,4 : le Bird est une ouverture d'équilibre, on se bat au milieu de jeu.}` },

  { id: "bir2", op: "bir", struct: "bir-stone", ch: "d5", name: "Bird avec b3 et Fb2 contre ...e6",
    pgn: `1. f4 d5 2. Nf3 Nf6 3. e3 e6 4. b3 {b3 et Fb2 : le fou vise e5 et la grande diagonale.} Be7 5. Bb2 O-O 6. Bd3 {Fd3 pointe sur h7 : Fxh7+ si le roque noir se dégarnit.} b6 7. O-O Bb7 8. Nc3 {Cc3 renforce e4 et prépare le cavalier en e5.} Ne4 9. f5 {f5 ! lance l'attaque : les Noirs doivent réagir.} Nc5 10. fxe6 {fxe6 fxe6 ouvre la colonne f : tes tours deviennent actives.} fxe6 11. Be2 Nc6 12. Qe1 a6 13. Rd1 Bd6 {Position équilibrée (0,00) : tu as le temps de manœuvrer.}` },

  { id: "bir3", op: "bir", struct: "bir-g3", ch: "d5", name: "Léningrad inversée : g3 et Fg2",
    pgn: `1. f4 d5 2. Nf3 Nf6 3. g3 {g3 et Fg2 : tu vises la grande diagonale.} g6 4. Bg2 Bg7 5. O-O {O-O puis d3 : tu prépares De1 et Cc3.} O-O 6. d3 c5 7. Qe1 {De1 : la dame peut aller en h4 ou f2.} d4 {...d4 gagne de l'espace côté dame : la réponse naturelle est Ce5.} 8. Ne5 {Ce5 : cavalier idéal, difficile à déloger.} Nfd7 9. Nc4 Nb6 10. Nbd2 Nd5 11. Ne4 b5 12. Ne5 Nd7 13. Nxd7 Bxd7 {Position équilibrée (0,0).}` },

  { id: "bir4", op: "bir", struct: "bir-main", ch: "autres", name: "Contre 1...Cf6 et ...g6",
    pgn: `1. f4 Nf6 2. Nf3 {Contre 1...Cf6, joue Cf3 et e3 : la structure reste compacte.} g6 3. e3 Bg7 4. Be2 {Fe2 et O-O, puis d3 : le Bird contre une défense indienne.} O-O 5. O-O d6 6. d3 b5 {...b5 est un pion avancé : ne force rien.} 7. a3 c5 8. Qe1 {De1 pour aller en h4 ou f2 selon la réponse.} a5 9. e4 {e4 : la cassure centrale quand tes pièces sont prêtes.} Nc6 10. Nc3 Qb6 11. Kh1 Nd4 12. Bd1 Rb8 {Position quasiment égale (−0,3).}` },

  { id: "bir5", op: "bir", struct: "bir-main", ch: "autres", name: "Contre 1...c5 : Cf3, e3 et b3",
    pgn: `1. f4 c5 2. Nf3 {Contre 1...c5, développe naturellement : Cf3, e3 et b3.} Nc6 3. e3 d5 4. b3 {b3 prépare Fb2 : ton fou vise la grande diagonale.} a6 5. Bb2 {Fb2 : le fou et la tour soutiennent f4.} Bf5 6. g3 {g3 ménage Fg2 contre ...Ff5.} e6 7. Bg2 h5 8. O-O Be7 9. h3 Bf6 10. Bxf6 Nxf6 11. d3 Rc8 {Équilibre (−0,1).}` },

  { id: "bir6", op: "bir", struct: "bir-stone", ch: "autres", name: "Contre 1...e6 : Cf3, e3 et b3",
    pgn: `1. f4 e6 2. Nf3 {Contre 1...e6, joue Cf3, e3 puis b3 : tu entres dans la structure Stonewall / Fb2.} d5 3. e3 Nf6 4. b3 Be7 5. Bb2 O-O 6. Bd3 {Fd3 vise h7 : un thème récurrent du Bird.} c5 7. O-O Nc6 8. Ne5 {Ce5 : ton cavalier trouve sa case idéale.} Bd7 9. c4 {c4 pour agrandir ton espace.} Qc7 10. Na3 Rad8 11. Rc1 Qa5 12. Bb1 Nxe5 {Position équilibrée.}` },

  { id: "bir7", op: "bir", struct: "bir-g3", ch: "autres", name: "Contre 1...f5 : d4, g3 et Fg2",
    pgn: `1. f4 f5 2. Nf3 {Contre 1...f5, joue d4, g3 et Fg2 : tu joues une Hollandaise en miroir.} Nf6 3. d4 e6 4. g3 Be7 5. Bg2 {Fg2, O-O : ton fou va viser b7 et d5.} O-O 6. O-O d5 7. c4 {c4 : ton centre est complet.} c5 8. cxd5 {cxd5 exd5 : structure symétrique.} exd5 9. e3 Re8 10. Nc3 Nc6 11. a3 h6 12. Na4 b6 {Égalité (−0,2).}` },

  { id: "bir8", op: "bir", struct: "bir-from", ch: "from", name: "Gambit From : 4.Cf3 Cf6 5.g3",
    pgn: `1. f4 e5 2. fxe5 {Accepte le gambit From avec fxe5 : un pion de plus.} d6 3. exd6 {exd6 Fxd6 : les Noirs menacent ...Dh4+.} Bxd6 4. Nf3 {Cf3 ! couvre h4 : la menace ...Dh4+ disparaît.} Nf6 5. g3 {g3 puis Fg2 : tu ranges ton roi et gardes ton pion.} O-O 6. Bg2 Nc6 7. Nc3 {Cc3 et O-O : tu es à l'abri et mieux développé.} Bg4 8. O-O Qd7 9. a3 Nd4 10. e3 Nxf3+ 11. Bxf3 h5 {Les Blancs gardent un léger avantage (+0,7).}` },

  { id: "bir9", op: "bir", struct: "bir-from", ch: "from", name: "Gambit From : variante Lasker 4...g5",
    pgn: `1. f4 e5 2. fxe5 d6 3. exd6 Bxd6 4. Nf3 {Cf3 coupe la diagonale e1-h4.} g5 {...g5 est la variante Lasker : les Noirs chassent le cavalier.} 5. d4 {d4 ! soutient le cavalier.} g4 6. Ne5 {Ce5 : le cavalier saute au centre malgré l'attaque.} Bxe5 7. dxe5 Qxd1+ {Qxd1+ Kxd1 : les dames sont échangées ; ton roi reste au centre mais en sécurité.} 8. Kxd1 Nc6 9. Nc3 Be6 10. Bg5 a6 11. Ke1 Nxe5 12. Bf4 f6 {Les Blancs sont légèrement mieux (+0,6).}` },

  { id: "bir10", op: "bir", struct: "bir-sturm", ch: "from", name: "Gambit Mujannah-Sturm : 2.c4 d4",
    pgn: `1. f4 d5 2. c4 {2.c4 est le gambit Mujannah-Sturm : un pion pour le développement.} d4 {...d4 est le meilleur moyen de refuser le pion.} 3. Nf3 {Cf3 puis e3 : tu attaques le pion d4.} c5 4. e3 Nc6 5. exd4 {exd4 cxd4 : tu as ouvert la colonne e.} cxd4 6. d3 Nh6 7. Na3 g6 8. Nc2 Nf5 9. b4 Bg7 10. b5 Nb8 11. g3 a6 {Les Noirs gardent un petit avantage (−0,7) : le Sturm est surtout un piège contre ...dxc4.}` },

  { id: "bir11", op: "bir", struct: "bir-stone", ch: "d5", name: "Variante Lasker : 3.e3 c5",
    pgn: `1. f4 d5 2. Nf3 Nf6 3. e3 c5 {...c5 est la variante Lasker du Bird.} 4. b3 Nc6 5. Bb2 {Fb2 : les deux fous visent le centre.} g6 6. Bb5 {Fb5 est une idée, mais attention à ...d4 !} Bd7 7. Nc3 d4 {...d4 : les Noirs ouvrent le jeu.} 8. exd4 Nxd4 9. Bxd7+ {Fxd7+ Dxd7 : tu échanges ton fou contre un fou clé.} Qxd7 10. Ne5 Qc7 11. Ne2 Bh6 12. Nxd4 cxd4 {Équilibre (−0,1).}` },

  { id: "eng1", op: "eng", struct: "eng-bot", ch: "bot", name: "Botvinnik : 7...Cge7 et O-O",
    pgn: `1. c4 e5 2. Nc3 {Cc3 prépare g3, Fg2 et e4 : tu construis le triangle du Botvinnik.} Nc6 3. g3 {g3 et Fg2 : la diagonale a8-h1 et le roque court.} g6 4. Bg2 Bg7 5. e4 {e4 ! : les pions c4 et e4 contrôlent d5, c'est le cœur du système.} d6 6. Nge2 {Cge2 laisse la case f3 libre pour f4.} Nge7 7. O-O {O-O puis d3 : tu consolides le centre.} O-O 8. d3 {d3 est calme mais précis : il protège e4.} Rb8 9. Rb1 {Tb1 prépare b4 : un levier à l'aile dame.} a6 10. b4 b5 11. Nd5 {Cd5 : le cavalier s'installe sur la case rêvée.} h6 12. Be3 Nd4 13. Qd2 Kh7 14. Rfc1 Nxe2+ 15. Qxe2 Be6 {Les Blancs sont légèrement mieux (+0,4).}` },

  { id: "eng2", op: "eng", struct: "eng-bot", ch: "bot", name: "Botvinnik contre ...Fe6 et ...Dd7",
    pgn: `1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e4 d6 6. Nge2 Be6 {...Fe6 vise c4 et d5 ; ne laisse pas la case d5 aux Noirs.} 7. O-O Qd7 8. d3 {d3 protège c4 ; garde tes pions c4/e4 mobiles.} h5 9. h4 Nf6 10. Rb1 {Tb1 et b4 : le plan à l'aile dame.} O-O 11. b4 {b4 gagne de l'espace avant que les Noirs ne bougent.} Nd8 12. Nd5 {Cd5 : le cavalier prend la place. Échange sur f6 pour écarter la défense.} Bh3 13. Nxf6+ Bxf6 14. a4 Bxg2 {Équilibre (+0,1).}` },

  { id: "eng3", op: "eng", struct: "eng-f5", ch: "bot", name: "Botvinnik contre ...f5 et ...Cf6",
    pgn: `1. c4 e5 2. Nc3 Nc6 3. g3 f5 {...f5 est un coup agressif ; ne te précipite pas, joue g3 et Fg2.} 4. Bg2 Nf6 5. e3 {e3 contrôle d4 et prépare Cge2.} e4 {...e4 : les Noirs avancent leur pion, ouvre la ligne d3 pour le contester.} 6. d3 {d3 attaque e4 tout de suite.} Bb4 7. Ne2 Ne5 8. dxe4 fxe4 {fxe4 : les pions noirs sont doublés et affaiblis.} 9. O-O Nf3+ 10. Kh1 Bxc3 11. Nxc3 d5 12. cxd5 O-O {Avantage net (+1,2) pour les Blancs.}` },

  { id: "eng4", op: "eng", struct: "eng-d5", ch: "e5", name: "Sicilienne inversée : 3.g3 d5 4.cxd5",
    pgn: `1. c4 e5 2. Nc3 Nf6 3. g3 {g3 ouvre la ligne du fou g2, comme dans la Sicilienne inversée.} d5 4. cxd5 {cxd5 : tu prends le pion et le cavalier d5 revient en jeu.} Nxd5 5. Bg2 {Fg2 : le fou attaque le cavalier d5 et prépare le roque.} Nb6 6. d3 Be7 7. Nf3 {Cf3 puis O-O : le schéma classique ; garde Ce4 comme idée.} Nc6 8. O-O O-O 9. a3 {a3 prépare b4 : un coup typique de la Sicilienne inversée.} Be6 10. b4 {b4 : tu avances sur l'aile dame.} Nd4 11. Bb2 Nxf3+ 12. Bxf3 c6 13. Ne4 Nd7 14. Qc2 f5 {Avantage léger (+0,3).}` },

  { id: "eng5", op: "eng", struct: "eng-bot", ch: "bot", name: "Botvinnik contre ...Fb4 : e4 et dxc3",
    pgn: `1. c4 e5 2. Nc3 Nf6 3. g3 {g3 et Fg2 : tu cherches à jouer e4 sans craindre ...Cd4.} Bb4 4. Bg2 O-O 5. e4 {e4 : tu prends le centre malgré Fb4.} Bxc3 {...Fxc3 dxc3 : tes pions sont doublés, mais tu as la paire de fous.} 6. dxc3 d6 7. Ne2 {Ce2 et O-O : tu garderas la structure compacte.} a5 8. a4 Na6 9. f3 Nd7 10. g4 Qh4+ 11. Ng3 Ndc5 12. Be3 Ne6 13. Kd2 Nf4 {Position à peu près égale (−0,4) avec un jeu de manœuvres.}` },

  { id: "eng6", op: "eng", struct: "eng-d5", ch: "e5", name: "Quatre cavaliers : 3...Cc6, g3 et ...d5",
    pgn: `1. c4 e5 2. Nc3 Nf6 3. Nf3 {Cf3 puis g3 : la même structure que 3.g3.} Nc6 4. g3 d5 5. cxd5 {cxd5 Cxd5 : le cavalier d5 est actif.} Nxd5 6. Bg2 {Fg2 : pression sur d5.} Nb6 7. O-O Be7 8. d3 {d3 : renforce e4.} Be6 9. a3 O-O 10. b4 {b4 : tu gagnes de l'espace.} Nd4 {...Cd4 : les Noirs forcent l'échange du cavalier f3.} 11. Rb1 Nxf3+ 12. Bxf3 c6 13. Qc2 h6 {Avantage léger (+0,4).}` },

  { id: "eng7", op: "eng", struct: "eng-sym", ch: "sym", name: "Contre ...c5 : Botvinnik avec e3 et d4",
    pgn: `1. c4 c5 2. Nc3 {Cc3 puis g3 : contre ...c5, tu transposes dans une Anglaise symétrique.} Nc6 3. g3 g6 4. Bg2 Bg7 5. e3 {e3 : tu protèges d4 et prépares Cge2.} d6 6. Nge2 {Cge2 : tu gardes f4 en réserve.} Nf6 7. O-O O-O 8. d4 {d4 : tu ouvres le centre au bon moment, avec tes pièces développées.} cxd4 9. exd4 e5 10. d5 {d5 : ferme le jeu et gagne de l'espace.} Nb4 11. a3 Na6 12. b4 Bf5 13. Qb3 Qd7 14. Bg5 Rfc8 {Avantage léger (+0,5).}` },

  { id: "eng8", op: "eng", struct: "eng-sym", ch: "sym", name: "Hérisson : 2...Cf6, ...e6 et ...b6",
    pgn: `1. c4 c5 2. Nf3 Nf6 3. Nc3 {Cc3 e6 g3 b6 : le Hérisson noir ; reste calme.} e6 4. g3 b6 5. Bg2 {Fg2 et O-O : ton roi est à l'abri.} Bb7 6. O-O Be7 7. d4 {d4 : tu prends la case centrale quand les Noirs sont occupés.} Ne4 8. d5 {d5 : tu fermes la position.} Nxc3 9. bxc3 d6 10. dxe6 fxe6 11. Qd3 Bf6 12. Bf4 e5 13. Bg5 Nd7 {Avantage (+0,9) : les Blancs ont l'initiative.}` },

  { id: "eng9", op: "eng", struct: "eng-bot", ch: "autres", name: "Botvinnik contre ...Cf6 et ...g6",
    pgn: `1. c4 Nf6 2. Nc3 {Contre ...Cf6 et ...g6, la même structure : g3, Fg2, e4.} g6 3. g3 Bg7 4. Bg2 O-O 5. e4 {e4 : tu poses ton centre ; ton roque court est assuré.} d6 6. Nge2 {Cge2 : tu gardes f3 libre et prépares d3.} e5 7. O-O c5 {...c5 : les Noirs gagnent de l'espace à l'aile dame.} 8. d3 Nc6 9. Rb1 {Tb1 : plan b4.} a6 10. a3 Rb8 11. Nd5 Nxd5 12. exd5 Nd4 13. Nxd4 cxd4 14. b4 Qe7 {Léger avantage (+0,3).}` },

  { id: "tbir1", op: "bir", struct: "bir-from", ch: "pieges", trap: "avoid", name: "À éviter : 4.Cc3? dans le gambit From",
    pgn: `1. f4 e5 2. fxe5 d6 3. exd6 Bxd6 4. Nc3? {Le coup naturel, mais il perd : la diagonale e1-h4 est ouverte.} Qh4+ 5. g3 Qxg3+ {Le sacrifice de la dame, forcé.} 6. hxg3 Bxg3# {Mat : f2 est libre depuis f4. Le bon coup était 4.Cf3 qui couvre h4.}` },

  { id: "tbir2", op: "bir", struct: "bir-main", ch: "pieges", trap: "avoid", name: "À éviter : 2.g4?? (mat du berger inversé)",
    pgn: `1. f4 e5 2. g4?? {Un coup que beaucoup jouent par réflexe d'attaque…} Qh4# {…mais la diagonale e1-h4 est ouverte : mat immédiat. Rappelle-toi : après f4, g2-g4 est interdit tant que la dame noire peut atteindre h4.}` },

  { id: "tbir3", op: "bir", struct: "bir-sturm", ch: "pieges", trap: "set", name: "Piège : Sturm, 3...b5? 4.a4 et Df3",
    pgn: `1. f4 d5 2. c4 {Le gambit Mujannah-Sturm.} dxc4 3. e3 b5? {Trop gourmand : ...b5 défend c4 mais les Noirs ne sont pas développés.} 4. a4 c6? {4...Cf6! était préférable.} 5. axb5 cxb5 6. Qf3! {La dame double sur a8 et b7 : les Noirs perdent du matériel (+3 environ).} Nc6 7. Qxc6+ {Échec : la dame prend le cavalier.} Bd7 {Les Blancs ont gagné un cavalier : Stockfish donne environ +2,7.}` },

  { id: "teng1", op: "eng", struct: "eng-bot", ch: "pieges", trap: "set", name: "Piège de Carlsen : 8.Da4+ c6? 9.Dxb4",
    pgn: `1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e4 Bb4 5. Nd5 Nxd5 6. cxd5 Nd4 7. Nxd4 exd4 8. Qa4+ {Échec sur la diagonale a4-e8, et le fou b4 n'est plus défendu.} c6? {Le coup qui perd : les Noirs doivent jouer 8...a5! ou ...Cd7 pour garder l'équilibre.} 9. Qxb4 {Tu as gagné une pièce (+4,9) : le fou b4 était cloué par l'échec.}` }
];

/* ===== Fiches de structure : plans pour toi, plans de l'adversaire, cassures, cases clés ===== */
const STRUCTS = {
  "lon-std": {
    op: "lon", rep: "lon1",
    title: "Londres classique",
    tag: "Triangle c3-d4-e3, fous en d3 et g3, cavalier en e5",
    plans: [
      "Place le fou en d3 (il vise h7). Garde le fou f4 en sécurité sur g3 ou h2 si un cavalier le menace.",
      "Installe un cavalier en e5, soutenu par d4. S'il est échangé, reprends avec le fou ou le pion.",
      "Roque court, puis Dd2, De2 ou Df3, et tours en e1 ou c1 selon la structure.",
      "Quand tes pièces sont placées, ouvre avec e3-e4, ou prépare f2-f4 pour renforcer e5 et attaquer."
    ],
    opp: [
      "...c5 et ...Db6 pour viser b2, ...Fd6 pour échanger ton fou f4.",
      "...Ch5 ou ...Ce4 pour gêner le fou, ou ...Fg4 pour clouer Cf3."
    ],
    breaks: ["e3-e4 (central)", "f2-f4 (appuie e5)", "c3-c4 (aile dame)"],
    squares: ["e5", "d3", "g3", "f3"],
    mistakes: [
      "Jouer les coups du système sans regarder les tactiques. b2, h7 et d4 sont des cibles qui reviennent.",
      "Laisser le fou f4 sans case de retraite face à ...Ch5 ou ...Fd6.",
      "Retarder Cbd2 : sans lui, e3-e4 reste impossible."
    ],
    quiz: { q: "Quelle est la case idéale pour le cavalier f3 dans le plan principal du Londres ?",
      opts: ["e5", "h4", "d2", "g5"], a: 0,
      why: "e5 est protégée par d4. Le cavalier y gêne les Noirs et prépare f2-f4 ou Fxh7+." }
  },

  "lon-qb6": {
    op: "lon", rep: "lon2",
    title: "Londres contre ...Db6 (structure avec ...c4)",
    tag: "Les Noirs gagnent de l'espace en c4 mais ouvrent la colonne a",
    plans: [
      "Réponds à ...Db6 par Db3. Si les Noirs échangent, leurs pions b6 sont doublés.",
      "Le pion c4 contrôle b3 et d3. Le fou va donc en e2, pas en d3.",
      "Développe Cbd2, Fe2, roque court. Ensuite vise la case e5 avec le cavalier.",
      "Prépare e3-e4 pour contester le centre. Pense aussi à b2-b3 pour miner le pion c4."
    ],
    opp: [
      "...e5 ou ...b5 pour consolider l'espace gagné à l'aile dame.",
      "Utiliser la colonne a ouverte pour mettre la tour en face de ton aile dame."
    ],
    breaks: ["e3-e4", "b2-b3 (contre c4)"],
    squares: ["c4", "b3", "d3", "e2"],
    mistakes: [
      "Jouer Fd3 : le pion c4 le capture.",
      "Laisser ...Dxb2 sans avoir préparé Db3 ou Cbd2.",
      "Oublier la colonne a ouverte pour les Noirs."
    ],
    quiz: { q: "Pourquoi le fou blanc va-t-il en e2 plutôt qu'en d3 quand les Noirs ont un pion en c4 ?",
      opts: ["Le pion c4 contrôle d3", "e2 vise directement h7", "d3 est déjà occupée par un pion noir", "Le roque court l'interdit"], a: 0,
      why: "Un pion noir en c4 attaque b3 et d3. Un fou en d3 serait pris par le pion." }
  },

  "lon-kid": {
    op: "lon", rep: "lon3",
    title: "Londres contre ...g6 et ...Fg7",
    tag: "Même schéma c3, e3, Cbd2 avec un fou prudent",
    plans: [
      "Joue h3 pour offrir h2 au fou si ...Ch5 et pour empêcher ...Cg4.",
      "Monte Fe2, roque, c3, Cbd2. Ce schéma marche contre ...c5 comme contre ...e5.",
      "Quand tes pièces sont prêtes, e3-e4 est ton levier. Sinon Dc2 ou Db3 et Tac1 pour la colonne c."
    ],
    opp: [
      "...c5 avec ...Cc6 pour attaquer d4.",
      "...e5 pour contester le fou f4, ou ...Ch5 pour gagner la paire de fous."
    ],
    breaks: ["e3-e4", "c3-c4 (avec Cbd2)"],
    squares: ["h2", "e2", "d2", "e4"],
    mistakes: [
      "Laisser le fou f4 sans retraite.",
      "Jouer e4 avant Cbd2 et Fe2 sans surveiller ...c5 et ...e5.",
      "Croire que le système joue tout seul : contre ...e5 il faut calculer."
    ],
    quiz: { q: "Pourquoi jouer h3 contre le plan ...g6 et ...Cf6 ?",
      opts: ["Donner h2 au fou f4 et empêcher ...Cg4", "Préparer g2-g4 tout de suite", "Attaquer le pion g6", "Prendre la colonne h"], a: 0,
      why: "Après ...Ch5 le fou peut se retirer en h2, et ...Cg4 n'est plus possible." }
  },

  "lon-nh5": {
    op: "lon", rep: "lon4",
    title: "Londres après ...Ch5 et hxg3",
    tag: "Colonne h semi-ouverte, paire de fous donnée",
    plans: [
      "Reprends hxg3 : la colonne h devient semi-ouverte et ton centre e3-d4 reste intact.",
      "Reprends le schéma classique : c3, Cbd2, Fd3. Si les Noirs jouent ...Fxg3, reprends fxg3.",
      "Choisis le côté du roque en regardant où les Noirs jouent. Les pions g et h ont changé."
    ],
    opp: [
      "...c5 et ...Cc6 pour viser d4.",
      "...Fd6 pour échanger sur g3 et ouvrir la colonne f."
    ],
    breaks: ["e3-e4", "c3-c4"],
    squares: ["h1", "g3", "h7", "d3"],
    mistakes: [
      "Reprendre avec le pion f sans raison : ça ouvre la colonne f et affaiblit e3.",
      "Rouler à l'attaque sans avoir roqué : la colonne h est aussi ouverte contre toi."
    ],
    quiz: { q: "Après 5.Fg3 Cxg3, quelle reprise donne la colonne h semi-ouverte ?",
      opts: ["hxg3", "fxg3", "Ne pas reprendre", "Dxg3"], a: 0,
      why: "La reprise avec le pion h ouvre la colonne h pour ta tour et garde la structure e3-d4." }
  },

  "lon-bf5": {
    op: "lon", rep: "lon5",
    title: "Londres contre ...Ff5 et ...c5",
    tag: "Le fou f5 contrôle e4 : joue sur Ce5 et Fe2",
    plans: [
      "Le cavalier b1 passe par d2 car c3 est occupée. Cgf3 suit.",
      "Le fou noir contrôle e4. Ne force pas e3-e4 : développe Fe2, roque, puis vise e5.",
      "Cherche Db3 ou Ce5 pour mettre de la pression sur b7 et c6."
    ],
    opp: [
      "...Fg4 ou ...Ch5 pour embêter le fou f4.",
      "...Db6 si tu laisses b2 sans protection."
    ],
    breaks: ["c3-c4 (prépare)", "e3-e4 (quand possible)"],
    squares: ["e5", "e2", "b3", "f5"],
    mistakes: [
      "Forcer e4 alors que ...Ff5 le contrôle.",
      "Oublier la défense de b2 face à ...Db6."
    ],
    quiz: { q: "Pourquoi le cavalier b1 va-t-il en d2 dans ce schéma ?",
      opts: ["La case c3 est occupée par le pion", "d2 vise f5", "Il n'a aucune autre case", "Pour préparer ...Fd6"], a: 0,
      why: "Avec le pion en c3 il ne reste que d2. Le cavalier se développe sans bloquer le pion." }
  },

  "ita-pian": {
    op: "ita", rep: "ita1",
    title: "Giuoco Pianissimo (c3, d3, Cbd2-f1-g3)",
    tag: "Centre e4-d3-c3, fou en b3, cavalier vers g3",
    plans: [
      "Roque, Te1, h3, puis Cbd2-f1-g3 (ou e3). Le cavalier b1 contourne le pion c3.",
      "Recule le fou en b3 pour éviter ...Ca5. Il pourra aller en c2 avant d4.",
      "Prépare d3-d4. Toutes tes pièces (Te1, Cf1 ou g3, fou b3 ou c2) doivent être derrière avant la rupture.",
      "Si les Noirs jouent ...a6 et ...Fa7, gagne de l'espace avec a2-a4, et parfois b2-b4."
    ],
    opp: [
      "...a6 et ...Fa7 pour garder le fou, ...h6 et ...Fe6 pour échanger ton fou b3.",
      "...Ce7-g6 (le cavalier c6 est gêné par c3) et ...d5 au bon moment."
    ],
    breaks: ["d3-d4 (préparée)", "a2-a4 / b2-b4 (aile dame)"],
    squares: ["g3", "b3", "e1", "d4"],
    mistakes: [
      "Jouer d4 trop tôt : les Noirs répondent ...exd4 cxd4 puis ...Cxe4 si la structure est mal protégée. Prépare avec Te1 et Cbd2.",
      "Oublier ...Fg4 : un clouage sur Cf3 complique d4. D'où h3."
    ],
    quiz: { q: "Quelle manœuvre amène le cavalier b1 en jeu sans gêner c3 ?",
      opts: ["Cbd2-f1-g3", "Ca3-c4", "Cb1-c3 directement", "Cb1-a3-b5"], a: 0,
      why: "Le pion c3 occupe la case naturelle du cavalier. On passe par d2 puis f1 vers g3 (ou e3), comme dans l'Espagnole fermée." }
  },

  "ita-greco": {
    op: "ita", rep: "ita2",
    title: "Piano classique : d4 et centre mobile",
    tag: "Pion blanc en d4, centre noir échangé",
    plans: [
      "Après l'échange de fous, reprends avec Cbxd2 : le cavalier soutient e4 et d4-d5 reste possible.",
      "Place Db3 (pression sur b7) et Tfe1 : la colonne e est ouverte après exd5.",
      "Joue a2-a4 pour gagner de l'espace à l'aile dame, et d4-d5 quand ça chasse un cavalier noir."
    ],
    opp: [
      "...c6 et ...Cd5 centralisé, ...Ce7 pour réorganiser les cavaliers.",
      "Échanger des pièces pour réduire ton avantage d'espace."
    ],
    breaks: ["d4-d5", "a2-a4"],
    squares: ["d4", "e1", "b3", "d5"],
    mistakes: [
      "Accepter un échange de dames trop tôt : tu as plus d'espace, tu as besoin des pièces.",
      "Oublier ...Fb4+ après cxd4. Réponds Fd2 dans ce répertoire."
    ],
    quiz: { q: "Après 6.cxd4 Fb4+, quelle réponse suit ce répertoire ?",
      opts: ["Fd2", "Rf1", "Cc3", "Dd2"], a: 0,
      why: "Fd2 échange le fou noir et garde un jeu sain. Cc3 existe mais mène à un milieu de jeu plus compliqué." }
  },

  "ita-slow": {
    op: "ita", rep: "ita3",
    title: "Italienne lente (d3, c3, Fb3-c2, Cbd2-f1-g3)",
    tag: "Les mêmes plans que l'Espagnole fermée",
    plans: [
      "Pose le pion c3, le fou en b3 puis c2, Cbd2-f1-g3, Te1. Tu construis le centre, puis tu l'ouvres.",
      "Surveille ...d5 : s'il arrive trop tôt, ouvre avec exd5 et reprends la structure avec ton avantage de développement.",
      "Quand tout est prêt, d3-d4 ouvre la position."
    ],
    opp: [
      "...c5 et ...Ca5 pour échanger le fou, puis ...Te8 et ...Ff8 pour regrouper les pièces.",
      "...Fg4 et ...Ch5 si tu oublies h3."
    ],
    breaks: ["d3-d4"],
    squares: ["c2", "g3", "e1", "d4"],
    mistakes: [
      "Rester passif : sans d4 les Noirs égalisent facilement.",
      "Négliger h3 contre ...Fg4."
    ],
    quiz: { q: "Quelle cassure ouvre le centre dans l'Italienne lente ?",
      opts: ["d3-d4", "f2-f4", "g2-g4", "a2-a4"], a: 0,
      why: "d3-d4, préparée par c3, Te1 et le cavalier en g3, est la cassure qui libère tes pièces." }
  },

  "ita-b4": {
    op: "ita", rep: "ita5",
    title: "Pianissimo avec b4, a4 et b5",
    tag: "Expansion à l'aile dame pour chasser le cavalier c6",
    plans: [
      "Avance b2-b4 puis a2-a4 : le fou noir est chassé en b6, puis b5 chasse le cavalier c6.",
      "Après b5, joue Cbd2, roque et prépare d4 avec le fou c4 bien placé.",
      "Surveille le centre : tu as avancé des pions à l'aile, ne laisse pas ...d5 sans réponse."
    ],
    opp: [
      "...d5 au bon moment, ...Ce7-g6 pour regrouper les pièces.",
      "...a5 pour fixer la chaîne de pions à l'aile dame."
    ],
    breaks: ["b4-b5", "d3-d4"],
    squares: ["b5", "c4", "d4", "g6"],
    mistakes: [
      "Pousser b4, a4 et b5 sans surveiller le centre.",
      "Laisser le fou c4 sans bonne case après ...d5."
    ],
    quiz: { q: "Quel est le but de la poussée b4, a4, b5 ?",
      opts: ["Gagner de l'espace et chasser le cavalier c6", "Attaquer directement le roi noir", "Ouvrir la colonne h", "Forcer l'échange des dames"], a: 0,
      why: "Les pions avancent pour gagner de l'espace et repousser les pièces noires." }
  },

  "pir-class": {
    op: "pir", rep: "pir1",
    title: "Pirc classique : ...c6, ...Dc7, ...e5",
    tag: "Fou g7 vers e5, pions c6 et d6, cavalier en d7",
    plans: [
      "Prépare ...e5 avec ...c6, ...Cbd7 et ...Dc7. Tu gardes d5 sous contrôle et le fou g7 s'ouvre.",
      "...Dc7 soutient ...e5 et relie tes pièces. Place ensuite la tour en e8.",
      "Si les Blancs jouent dxe5, reprends dxe5 : la structure est symétrique et tes pièces sont actives."
    ],
    opp: [
      "a2-a4 et a4-a5 pour gagner de l'espace à l'aile dame.",
      "h3, Fe3, Dd2 pour tenir e5 sous contrôle."
    ],
    breaks: ["...e5 (principale)", "...c5 (alternative)"],
    squares: ["e5", "d4", "c7", "e8"],
    mistakes: [
      "Attendre trop longtemps ...e5 ou ...c5 : le centre blanc devient dominant.",
      "Laisser e4-e5 sans réagir : ...dxe5 ou ...Cfd7 selon la position.",
      "Jouer ...e5 sans avoir développé ...Cbd7 ou ...Dc7."
    ],
    quiz: { q: "Quelles sont les deux cassures centrales principales de la Pirc ?",
      opts: ["...e5 et ...c5", "...b5 et ...a5", "...h5 et ...g5", "...f5 et ...d5"], a: 0,
      why: "...c5 vise la case d4, ...e5 vise la case d5. Les deux sont soutenues par le fou g7." }
  },

  "pir-bg4": {
    op: "pir", rep: "pir2",
    title: "Pirc : ...Fg4, ...Cc6 et ...e5",
    tag: "Clouage sur Cf3, cassure ...e5, avant-poste d4",
    plans: [
      "Cloue Cf3 avec ...Fg4, développe ...Cc6 puis frappe avec ...e5.",
      "Si dxe5 dxe5, tes pièces sont actives. L'avant-poste ...Cd4 est ton objectif.",
      "Si les Blancs jouent d4-d5, déplace le cavalier c6 (...Ca5 ou ...Ce5) et vise c4 et e4."
    ],
    opp: [
      "h3 et Fxf3 pour gagner la paire de fous.",
      "Dd2 et Fh6 pour échanger ton fou g7."
    ],
    breaks: ["...e5"],
    squares: ["d4", "e5", "g4", "f3"],
    mistakes: [
      "Échanger sur f3 sans avoir de plan : les Blancs gardent la paire de fous. Ta compensation est ...Cd4.",
      "Laisser d4-d5 gagner de l'espace sans ...Ca5 ou ...Ce5."
    ],
    quiz: { q: "Quel avant-poste vise le cavalier c6 après ...e5 et l'échange des pions au centre ?",
      opts: ["d4", "b4", "f4", "h4"], a: 0,
      why: "Après dxe5 dxe5, la case d4 n'est plus contrôlée par un pion blanc. Le cavalier s'y installe." }
  },

  "pir-aus": {
    op: "pir", rep: "pir3",
    title: "Pirc contre l'attaque autrichienne (f4)",
    tag: "Centre à trois pions : réponds avec ...c5",
    plans: [
      "Frappe le centre avec ...c5. C'est la réponse de principe à 4.f4 Fg7 5.Cf3.",
      "Si dxc5, joue ...Da5 puis ...Dxc5 : tu récupères le pion avec activité.",
      "Roque, puis ...Cc6 et ...Fg4 pour peser sur d4 et f3.",
      "Si e4-e5, calcule : ...dxe5, ...Cg4 ou ...Cfd7 selon la position."
    ],
    opp: [
      "Poussées e4-e5 et f4-f5 pour attaquer le roi.",
      "Fb5+ pour gêner le développement, Dd2 et Fe3 pour renforcer."
    ],
    breaks: ["...c5 (principale)"],
    squares: ["c5", "d4", "a5", "g4"],
    mistakes: [
      "Laisser f4-f5 sans contre-jeu au centre : l'attaque blanche file.",
      "Pousser ...e5 ou ...c5 sans calculer les coups forcés : la position est très tactique."
    ],
    quiz: { q: "Quelle cassure frappe le centre blanc dans l'attaque autrichienne ?",
      opts: ["...c5", "...a5", "...b5", "...h5"], a: 0,
      why: "...c5 attaque d4. Elle est soutenue par le fou g7 et la dame en a5 après dxc5." }
  },

  "pir-150": {
    op: "pir", rep: "pir4",
    title: "Pirc contre l'attaque 150 (Fe3, Dd2, f3, Fh6)",
    tag: "Contre-jeu à l'aile dame avant l'ouverture de la colonne h",
    plans: [
      "Joue ...c6 puis ...b5 : tu lances l'aile dame avant que les Blancs n'ouvrent la colonne h.",
      "Développe ...Cbd7, ...Fb7 (ou ...a6) et prépare ...e5 pour verrouiller le centre.",
      "Quand Fh6 arrive, tu peux échanger (...Fxh6 ou ...Cbd7 puis Fxg7 Rxg7) selon ton plan de contre-jeu."
    ],
    opp: [
      "Roque long, h2-h4-h5 pour ouvrir la colonne h.",
      "Fh6 pour échanger ton fou g7."
    ],
    breaks: ["...b5", "...e5"],
    squares: ["b5", "b7", "c6", "h6"],
    mistakes: [
      "Rester passif : si tu n'as pas de contre-jeu, la colonne h gagne.",
      "Échanger le fou g7 sans plan clair : c'est ta pièce défensive principale."
    ],
    quiz: { q: "Contre l'attaque 150, quel pion lance le contre-jeu à l'aile dame ?",
      opts: ["...b5", "...h5", "...f5", "...g5"], a: 0,
      why: "...c6 puis ...b5 attaque l'aile dame pendant que les Blancs préparent leur attaque sur l'aile roi." }
  },

  "pir-czech": {
    op: "pir", rep: "pir6",
    title: "Pirc tchèque (...c6, ...Da5, ...e5)",
    tag: "Clouage de Cc3 et cassure ...e5 immédiate",
    plans: [
      "Joue ...c6 puis ...Da5 pour clouer Cc3 et soutenir ...e5.",
      "Frappe tout de suite avec ...e5 : après Fd3 tu gardes le contrôle du centre.",
      "Si e4-e5 arrive trop tôt, reprends ...dxe5 pour ouvrir la position."
    ],
    opp: [
      "Fd3 et Cf3 pour développer sans complication.",
      "Fd2 pour casser le clouage."
    ],
    breaks: ["...e5"],
    squares: ["e5", "a5", "c3", "g4"],
    mistakes: [
      "Laisser Cc3 se libérer du clouage sans réaction.",
      "Oublier ...e5 : sans lui le centre blanc domine."
    ],
    quiz: { q: "Quel coup conteste le centre dans la Pirc tchèque ?",
      opts: ["...e5", "...g5", "...h5", "...a5"], a: 0,
      why: "...e5 attaque directement le centre blanc, avec la dame en a5 qui soutient la manœuvre." }
  },

  "dut-len": {
    op: "dut", rep: "dut1",
    title: "Hollandaise Léningrad (...g6, ...Fg7, ...d6)",
    tag: "Cassure ...e5, dame en e8, chaîne f5-d6",
    plans: [
      "Prépare ...e5 : c'est la cassure qui libère le fou g7 et le centre.",
      "Joue ...De8 : elle soutient ...e5 et prépare ...Dh5.",
      "Contre d4-d5, ...Ca6-c5 et ...a5 (puis ...c6 pour ouvrir) quand tu veux changer la structure.",
      "Dans la ligne avec ...Cc6, après d5 ...Ca5 et ...c5, prépare ...Tb8 et ...b5 à l'aile dame."
    ],
    opp: [
      "Cassure g2-g4 contre le roi noir.",
      "d4-d5 pour gagner de l'espace et Cd4 pour viser e6."
    ],
    breaks: ["...e5 (idée n°1)", "...c5 (selon la structure)"],
    squares: ["e5", "e8", "c5", "h5"],
    mistakes: [
      "Installer f5, g6 et d6 sans jamais préparer ...e5 : plan passif.",
      "Négliger les faiblesses autour du roi (e6, g6).",
      "Oublier le contre-jeu à l'aile dame (...c5 ou ...a5)."
    ],
    quiz: { q: "Quelle est l'idée centrale de la Léningrad ?",
      opts: ["La cassure ...e5", "La cassure ...b5", "La cassure ...h5", "...c6 seulement"], a: 0,
      why: "...e5 est l'idée n°1 : elle libère le fou g7 et ouvre le centre pour tes pièces." }
  },

  "dut-stone": {
    op: "dut", rep: "dut3",
    title: "Hollandaise Stonewall (c6-d5-e6-f5)",
    tag: "Mur de pions, attaque avec les pièces",
    plans: [
      "Joue ...Fd6, ...De7 et ...Ce4. Les pièces visent le roi blanc. Contre Fd3 sans g3, le fou d6 et la dame en e7 visent aussi h2.",
      "Pas de cassure de pions : ...Tf6-h6 pour attaquer. Le fou c8 est ton « mauvais fou » : ...b6 et ...Fa6 pour l'échanger.",
      "Défends le trou e5 : garde un cavalier en e4 et évite d'échanger sans plan."
    ],
    opp: [
      "Ce5 (avant-poste) et Fa3 ou Ff4 pour échanger ton fou noir d6.",
      "Ouvrir un second front (g3-g4 ou h4) avant la cassure à l'aile dame."
    ],
    breaks: ["Aucune cassure de pion : jeu de pièces"],
    squares: ["e5", "e4", "g3", "a6"],
    mistakes: [
      "Laisser un cavalier blanc s'installer en e5 sans pouvoir l'échanger.",
      "Échanger ton fou d6 sans plan : les cases noires s'affaiblissent.",
      "Jouer passif : l'attaque doit venir de toi."
    ],
    quiz: { q: "Quelle est la faiblesse permanente du Stonewall ?",
      opts: ["La case e5", "La case e4", "Le pion c6", "La case h7"], a: 0,
      why: "Tes pions f5 et d5 ne peuvent plus contrôler e5. Un cavalier blanc s'y installe souvent." }
  },

  "dut-class": {
    op: "dut", rep: "dut5",
    title: "Hollandaise classique : ...Fb4",
    tag: "Fou b4, roque, ...d6, ...De8",
    plans: [
      "Cloue Cc3 avec ...Fb4. Après a3 Fxc3 bxc3, la structure blanche est fragile.",
      "Joue ...De8 puis ...Dh5 ou ...e5 : la dame soutient l'attaque et la cassure.",
      "Après ...Fxc3 bxc3, vise les pions doublés (c3, c4)."
    ],
    opp: [
      "d4-d5 et e3-e4 pour reprendre le centre.",
      "Ce5 pour fixer la case e5."
    ],
    breaks: ["...e5", "...Ce4"],
    squares: ["b4", "e8", "c3", "h5"],
    mistakes: [
      "Échanger sur c3 sans plan clair.",
      "Oublier ...e5 : sans cassure tu restes passif."
    ],
    quiz: { q: "Pourquoi jouer ...De8 dans cette structure ?",
      opts: ["Soutenir ...Dh5 et ...e5", "Préparer ...Fd7 seulement", "Défendre h7", "Échanger les dames"], a: 0,
      why: "La dame en e8 peut aller en h5 pour attaquer, ou soutenir la cassure ...e5." }
  },

  "dut-hopton": {
    op: "dut", rep: "dut6",
    title: "Hollandaise contre 2.Fg5",
    tag: "Après Fxf6 exf6 : pions doublés mais centre solide",
    plans: [
      "Reprends avec le pion e (exf6) : tu gardes le centre et la colonne e s'ouvre.",
      "Joue ...d5, ...Fd6 et roque court. Ton roi est protégé par f5 et f6.",
      "Prépare ...c5 pour contester le centre, ...Cc6 et ...Te8 sur la colonne e."
    ],
    opp: [
      "Cbd2 et c3 pour un jeu tranquille.",
      "Dh5+ si tu laisses g6 sans défense."
    ],
    breaks: ["...c5", "...e5 (rare)"],
    squares: ["d5", "e8", "d6", "f6"],
    mistakes: [
      "Reprendre gxf6 : la colonne g s'ouvre contre ton roi.",
      "Laisser la dame blanche attaquer sur h5 sans anticiper."
    ],
    quiz: { q: "Après 3.Fxf6, quelle reprise est naturelle ?",
      opts: ["exf6", "gxf6", "Cc6", "h6"], a: 0,
      why: "exf6 garde ton roi à l'abri derrière f5-f6 et ouvre la colonne e pour ta tour." }
  },

  "dut-staunton": {
    op: "dut", rep: "dut7",
    title: "Hollandaise contre le gambit Staunton (2.e4)",
    tag: "Rends le pion avec une structure saine",
    plans: [
      "Réponds ...Cf6 puis ...e6 : tu développes et tu menaces ...Fb4 ou ...Fe7.",
      "Après Cxe4, échange le cavalier actif avec ...Fe7, ...O-O, ...b6 et ...Fb7.",
      "Simplifie et roque tôt : ta structure est saine, ton roi est en sécurité."
    ],
    opp: [
      "Fg5 et Cxe4 pour développer avec tempo.",
      "Fxf6 pour ruiner ta structure."
    ],
    breaks: ["...d5", "...c5"],
    squares: ["e4", "b7", "f6", "d5"],
    mistakes: [
      "Retarder le roque : les pièces blanches sont actives.",
      "Oublier ...Fe7 pour répondre à Fg5."
    ],
    quiz: { q: "Dans le gambit Staunton, quel coup suit 4.Fg5 dans cette ligne ?",
      opts: ["...e6", "...g6", "...h6", "...a6"], a: 0,
      why: "...e6 développe, soutient ...Fe7 et prépare le roque." }

  },

  "lon-qi": {
    op: "lon", rep: "lon6",
    title: "Londres contre les montages à la Indienne de la Dame",
    tag: "Fous en d3 et f4, h3 de prophylaxie, rupture e3-e4 ou pression sur e5",
    plans: [
      "Joue h3 tôt pour garder une retraite à ton fou f4 et empêcher ...Cg4.",
      "Si les Noirs jouent ...c5 puis ...cxd4, reprends du pion e : tu obtiens la colonne e ouverte et un fou f4 actif.",
      "Place le cavalier en e5 si les Noirs te laissent la case, ou prépare e3-e4 avec Cbd2."
    ],
    opp: [
      "...d5 et ...c5 pour contester ton centre.",
      "...Ce4 si ton fou n'est pas protégé, ou ...Fb7 pour viser la grande diagonale."
    ],
    breaks: ["e3-e4", "c2-c4 (si ...d5 est fixé)"],
    squares: ["e5", "h2", "d3", "e4"],
    mistakes: [
      "Oublier ...Ce4 avec échange de fous quand h3 n'a pas été joué.",
      "Reprendre en d4 avec le cavalier au lieu du pion e et laisser la structure se relâcher."
    ],
    quiz: { q: "Après ...cxd4, avec quelle pièce reprends-tu dans cette structure ?",
      opts: ["Le pion e3", "Le cavalier f3", "La dame", "Le fou f4"], a: 0,
      why: "Le pion e3 reprend : ton centre reste solide et la colonne e s'ouvre pour tes tours." }

  },

  "lon-side": {
    op: "lon", rep: "lon9",
    title: "Londres contre les écarts : ...Fd6, ...c5, ...e6, ...c6",
    tag: "Garde ton schéma, mais surveille les tactiques sur f7, b2 et le fou f4",
    plans: [
      "Contre ...Fd6, tu peux échanger si cela te donne de l'espace ; sinon vise f7 avec Ce5, mais vérifie l'échec Fb5+ et les clouages.",
      "Contre ...c5 sans ...Cf6, prends en c5 puis ouvre le jeu : tu gagnes un pion et de l'initiative.",
      "Contre la Slave avec ...Fg4, joue h3 puis g4 : le fou noir est vite en difficulté.",
      "Dans tous les cas, termine ton développement avec e3, Cbd2 et c3 avant d'attaquer."
    ],
    opp: [
      "...c5 et ...Db6 pour viser b2 tant que ton fou f4 est loin.",
      "...Fd6 pour échanger ton meilleur fou, ou ...Fg4 pour clouer Cf3."
    ],
    breaks: ["e3-e4", "c4-c5", "g2-g4 (contre ...Fg4)"],
    squares: ["e5", "f7", "b2", "h5"],
    mistakes: [
      "Jouer 5.Ce5 sans avoir vu l'échec Fb5+ ou une riposte ...Fxe5.",
      "Laisser b2 sans défense face à ...Db6, sauf si tu veux sacrifier le pion volontairement."
    ],
    quiz: { q: "Face à ...Fd6 dans le Londres, quelle tactique les Blancs peuvent-ils tenter après 5.Ce5 ?",
      opts: ["Fb5+ et Cxf7", "Fxh7+ et Dh5", "g4 et h4", "Cb5 et Cxd6"], a: 0,
      why: "Après ...c5, l'échec Fb5+ détourne le cavalier b8 et prépare Cxf7 ; vérifie bien les détails avant de la jouer." }
  },

  "lon-ben": {
    op: "lon", rep: "lon7",
    title: "Londres contre ...c5 : structure de Benoni",
    tag: "d4-d5 ferme le centre, e4 et a4 sont tes plans",
    plans: [
      "Joue d5 pour fermer le centre dès que ...c5 vient : ton fou f4 est déjà actif.",
      "Place les pions en e4 et d5, puis Cc3 et Cf3.",
      "Joue a4 pour éviter ...b5 puis prépare une poussée au centre."
    ],
    opp: [
      "...b5 pour ouvrir la colonne b et miner ton aile dame.",
      "...Cg4 ou ...Fg4 pour viser les cases noires autour de ton roi."
    ],
    breaks: ["e4-e5 (à préparer)", "a4 (anti-...b5)"],
    squares: ["e4", "d5", "c4", "b5"],
    mistakes: [
      "Laisser ...b5 sans réponse : tu perds du contrôle de c4.",
      "Pousser e5 trop tôt, quand le fou g7 est actif."
    ],
    quiz: { q: "Quel est le but du coup a2-a4 dans cette structure ?",
      opts: ["Empêcher ...b5", "Préparer le roque", "Attaquer la dame", "Libérer la tour"], a: 0,
      why: "a4 contrôle b5 : les Noirs perdent leur principal contre-jeu à l'aile dame." }
  },

  "ita-evans": {
    op: "ita", rep: "ita6",
    title: "Gambit Evans : un pion pour l'initiative",
    tag: "Centre blanc c3-d4, développement rapide, attaque sur f7",
    plans: [
      "Après 4.b4 Fxb4, joue c3 pour attaquer le fou, puis d4 pour prendre le centre.",
      "Roque court rapidement et reprends d4 avec le pion c pour garder un grand centre.",
      "Utilise la diagonale c4-f7 et les menaces Fg5 ou Cg5 pour garder l'initiative.",
      "Après ...Fa5 et d4, joue Db3 : la dame attaque f7 et b7 et force les Noirs à se défendre. Contre ...d6, un plan simple est roque, Cbd2 puis e5.",
      "Si les Noirs prennent en d4 puis c3, accepte de laisser un pion : tes pièces se développent avec tempo (Fg5, Cxc3) et la dame noire est chassée."
    ],
    opp: [
      "...Fb6 ou ...Fa5 pour sauver le fou, ...d6 pour fermer la diagonale.",
      "...Cge7 et ...O-O pour consolider puis rendre le pion au bon moment."
    ],
    breaks: ["d4-d5", "e4-e5"],
    squares: ["d4", "f7", "g5", "e5"],
    mistakes: [
      "Ralentir le développement : le pion donné n'est compensé que par l'initiative.",
      "Oublier que le fou noir sur b6 vise f2 et le pion d4."
    ],
    quiz: { q: "Quel pion les Blancs offrent-ils dans le gambit Evans ?",
      opts: ["Le pion b", "Le pion a", "Le pion f", "Le pion h"], a: 0,
      why: "4.b4 : le pion b est offert pour gagner un temps avec c3 et prendre un grand centre avec d4." }
  },

  "dut-lond": {
    op: "dut", rep: "dut8",
    title: "Hollandaise contre le Londres (Ff4 et e3)",
    tag: "...e6, ...Fe7, ...b6 : un montage souple et solide",
    plans: [
      "Joue ...Cf6, ...e6 et ...Fe7, puis roque court.",
      "Prépare ...b6 et ...Fb7 pour viser e4 et la grande diagonale.",
      "Si les Blancs jouent h3, vise ...Ce4 ou ...d6 puis ...Cbd7 pour avancer au centre."
    ],
    opp: [
      "Fd3, Cbd2 et Ce5 pour fixer ton centre.",
      "Un fou f4 qui vise la case b8 ou c7 quand tes pièces s'avancent."
    ],
    breaks: ["...d5 (Stonewall)", "...Ce4"],
    squares: ["e4", "e5", "b7", "d6"],
    mistakes: [
      "Négliger la case e5 : le cavalier blanc y devient très actif.",
      "Jouer ...g5 trop tôt et affaiblir l'aile roi."
    ],
    quiz: { q: "Quel est l'objectif du coup ...b6 dans ce montage ?",
      opts: ["Placer le fou en b7", "Préparer ...a5", "Attaquer la dame", "Roquer"], a: 0,
      why: "...b6 puis ...Fb7 : le fou vise e4 et la grande diagonale." }

  },

  "dut-gcl": {
    op: "dut", rep: "dut9",
    title: "Hollandaise classique avec g3 : l'avant-poste e4",
    tag: "...Ce4 occupe la case clé ; ...d5 ou ...e5 selon la réponse blanche",
    plans: [
      "Joue ...Cf6, ...e6, ...Fe7 et roque court, puis ...d6 : la structure est souple et sûre.",
      "Quand les Blancs jouent Cc3, place ton cavalier en e4. S'ils l'échangent, reprends avec le pion f pour garder l'espace.",
      "Après Dc2 Cxc3 bxc3, joue ...Cc6 puis ...e5 pour réagir au centre.",
      "Après Cxe4 fxe4, appuie le pion e4 par ...d5 et cherche une structure ouverte.",
      "Plan de milieu de jeu n°1 : les Blancs cherchent souvent à percer à l'aile dame (c4-c5, b4-b5). Avant chaque coup, demande-toi qui doit jouer de quel côté, puis comment et pourquoi.",
      "Plan n°2 : tu contrôles souvent l'aile roi, mais l'excès d'ambition est le vrai risque. Si ton pion f5 est visé, la situation peut vite devenir mauvaise : ne lance ...g5 ou ...Dh5 que quand ton roi est à l'abri.",
      "Autres thèmes à retravailler : le combat des fous de cases blanches, les cases e4 et e5, les cases noires, et les tactiques qui reviennent (clouages, fourchettes sur e4)."
    ],
    opp: [
      "Cd2 et f3 pour attaquer ton pion e4.",
      "b4-b5 ou b3 pour gagner de l'espace côté dame et préparer c5."
    ],
    breaks: ["...e5", "...d5", "...c5"],
    squares: ["e4", "c3", "e5", "f3"],
    mistakes: [
      "Laisser ton pion e4 sans soutien quand f3 arrive.",
      "Pousser ...e5 avant d'avoir développé les pièces."
    ],
    quiz: { q: "Quel coup noir suit 7.Cc3 dans la ligne principale classique ?",
      opts: ["...Ce4", "...Cc6", "...a5", "...Fd7"], a: 0,
      why: "...Ce4 occupe la case que f5 contrôle et prépare un échange favorable ou un pion en e4." }
  },

  "pir-byrne": {
    op: "pir", rep: "pir7",
    title: "Pirc contre 4.Fg5 (Byrne) et 4.Ff4",
    tag: "Le fou blanc sort tôt : tu réponds par ...Fg7 ou ...c6",
    plans: [
      "Contre 4.Fg5, joue ...Fg7 puis réponds à e5 par ...Cfd7, qui attaque la pointe e5.",
      "Après exd6 cxd6, développe ...Cf6, roque, puis vise ...Da5 pour contre-attaquer.",
      "Contre 4.Ff4, joue ...c6 puis ...Da5 et prépare ...Cbd7 : l'échange des dames te convient.",
      "Garde un œil sur la poussée e5 : réponds par ...dxe5 si tu peux ensuite jouer ...Cd5."
    ],
    opp: [
      "e5 pour gagner un temps sur le cavalier, ou Dd2 puis Fh6 pour échanger ton fou g7.",
      "O-O-O et h4 pour attaquer ton roque."
    ],
    breaks: ["...c5", "...dxe5", "...e5"],
    squares: ["e5", "d5", "g7", "a5"],
    mistakes: [
      "Ignorer la menace e5-e6 quand ton cavalier f6 est cloué.",
      "Prendre le pion h4 sans contre-jeu : l'attaque blanche est forte."
    ],
    quiz: { q: "Après 4.Fg5 Fg7 5.e5, où va le cavalier f6 ?",
      opts: ["d7", "e4", "h5", "g4"], a: 0,
      why: "Cfd7 attaque e5 ; après exd6 cxd6, tu as un centre solide et un jeu actif." }
  },

  "bir-main": {
    op: "bir", rep: "bir1",
    title: "Bird classique : f4, e3, Fe2, d3 et De1",
    tag: "Une Hollandaise à l'envers : pions f4-e3-d3, fou e2, dame en e1 puis h4",
    plans: ["Développe Cf3 puis Fe2, roque court et joue d3 : c'est la structure de base, comme une Hollandaise à l'envers.","Joue De1 puis Dh4 ou Dg3 : la dame passe sur l'aile roi, appuie f4-f5 et surveille la case e5.","Contrôle e5 avec f4 et d3. Un cavalier en e5 est ton meilleur placement, mais ne laisse pas tes pions f4/e3 sans soutien.","Quand tes pièces sont prêtes (Cc3, Fd2 ou Fb2), ouvre le centre avec e3-e4."],
    opp: ["...c5 et ...Cc6 pour contrôler d4, puis ...d4 pour gagner de l'espace.","...Fg4 clouant le cavalier f3, ou ...Dd6 / ...Dh5 sur la grande diagonale."],
    breaks: ["e3-e4 (central)","f4-f5 (attaque)","c2-c4 (espace)"],
    squares: ["e5","f3","e1","h4"],
    mistakes: ["Oublier la diagonale e1-h4 : ...Dh4+ arrive vite si g3 n'est pas possible.","Jouer g2-g4 trop tôt : ton roi devient trop exposé.","Laisser les Noirs jouer ...e5 sans réaction."],
    quiz: {"q":"Quelle case centrale le Bird cherche-t-il à contrôler avec f4 et d3 ?","opts":["e5","d5","g5","c5"],"a":0,"why":"f4 et d3 contrôlent e5 : c'est la case de ton futur cavalier et le point d'appui de l'attaque."}
  },

  "bir-stone": {
    op: "bir", rep: "bir2",
    title: "Bird avec b3 et Fb2 : la grande diagonale",
    tag: "Fou b2 sur la grande diagonale, fou d3 contre h7, cavalier e5",
    plans: ["Joue b3 et Fb2 : le fou fianchetté vise e5 et la grande diagonale.","Place le fou en d3 puis Ce5 : e5 est le pivot de ta position.","Prépare f4-f5 ou De1-h4, puis cherche Fxh7+ si les Noirs affaiblissent leur roque.","Quand la structure est stable, Cc3 et De2, tour en e1 pour jouer e3-e4."],
    opp: ["...c5 avec ...Cc6 pour contester e5, ...b6 et ...Fb7 symétriques.","...Ce4 pour gêner f4-f5."],
    breaks: ["f4-f5","e3-e4"],
    squares: ["e5","d3","b2","h7"],
    mistakes: ["Laisser tes deux fous bloqués par tes propres pions.","Lancer f5 sans avoir de pièces prêtes pour soutenir l'attaque."],
    quiz: {"q":"Avec le fou en d3 et le cavalier en e5, quelle case adverse est visée ?","opts":["h7","a7","g8","b7"],"a":0,"why":"Le fou d3 vise h7 : combiné au cavalier e5 et à la dame, il prépare Fxh7+ si le roque noir se dégarnit."}
  },

  "bir-g3": {
    op: "bir", rep: "bir3",
    title: "Léningrad inversée : g3, Fg2, d3 et De1",
    tag: "Pions f4-g3-d3, fou en g2, jeu sur l'aile roi et au centre",
    plans: ["g3 et Fg2 : le fou long surveille la grande diagonale.","d3, De1, puis Cc3 et e4 pour lancer le centre.","Cc3 et Cd5 : le trou d5 devient un nid pour ton cavalier.","À l'aile dame, a4 ou b4 selon la réponse noire."],
    opp: ["...c5 puis ...d4 pour gagner de l'espace et attaquer c3.","...Cc6 et ...Fe6 pour renforcer c4 et d5."],
    breaks: ["e2-e4","c2-c4"],
    squares: ["g2","d5","e4","e5"],
    mistakes: ["Jouer e4 sans Cc3 : d5 devient une case forte pour les Noirs.","Échanger ton fou g2 sans raison : il protège ton roque."],
    quiz: {"q":"Dans la Léningrad inversée, quel coup central prépare-t-on avec d3 et De1 ?","opts":["e2-e4","a2-a4","h2-h4","b2-b4"],"a":0,"why":"d3 et De1 soutiennent e4 : c'est ta cassure centrale quand tes pièces sont prêtes."}
  },

  "bir-from": {
    op: "bir", rep: "bir8",
    title: "Gambit From : Cf3, pas Cc3",
    tag: "Après 1...e5 2.fxe5 d6 3.exd6 Fxd6 : joue Cf3 pour couvrir h4",
    plans: ["Accepte le gambit : fxe5 puis exd6, tu gagnes un pion.","Joue Cf3 tout de suite : 4.Cc3? Dh4+! 5.g3 Dxg3+ 6.hxg3 Fxg3# est mat.","Après ...Cf6, joue g3, Fg2 et O-O : ton roi se met à l'abri et tu gardes ton pion.","Contre ...g5 (Lasker), joue d4 puis Ce5 : le cavalier saute au centre."],
    opp: ["...Dh4+ immédiat si tu oublies la diagonale e1-h4.","...g5 pour chasser le cavalier f3 : réponds d4 et Ce5."],
    breaks: ["d2-d4","e2-e4"],
    squares: ["f3","h4","g3","g2"],
    mistakes: ["Jouer Cc3 en 4e coup : Dh4+ gagne la partie.","Jouer g2-g4?? sur 1...e5 : Dh4# est immédiat."],
    quiz: {"q":"Après 1.f4 e5 2.fxe5 d6 3.exd6 Fxd6, quel est le bon 4e coup ?","opts":["Cf3","Cc3","g3","d4"],"a":0,"why":"Cf3 couvre h4. Cc3? permet Dh4+ g3 Dxg3+ hxg3 Fxg3#."}
  },

  "bir-sturm": {
    op: "bir", rep: "bir10",
    title: "Gambit Mujannah-Sturm : c4 puis jeu à la Réti",
    tag: "2.c4 : si ...d4, Cf3 et e3 pour attaquer le pion d4",
    plans: ["Contre 2...d4, joue Cf3 puis e3 et attaque le pion d4 avec exd4.","Si les Noirs prennent en c4, joue e3 puis récupère le pion : un jeu rapide t'attend.","Garde ta structure compacte et surveille la diagonale a2-g8 ; la colonne e s'ouvre après exd4."],
    opp: ["...d4 est le meilleur refus du gambit.","...dxc4 suivi de ...b5? perd une pièce après a4 et Df3."],
    breaks: ["e3xd4","d2-d3"],
    squares: ["d4","e3","f3","c4"],
    mistakes: ["Jouer 2.c4 sans connaître la réponse ...d4 : l'avantage disparaît.","Oublier a4 contre ...b5 : tu rates la tactique."],
    quiz: {"q":"Après 1.f4 d5 2.c4 d4, quel plan est naturel ?","opts":["Cf3, e3 et exd4","g4 immédiat","Dh5","b4"],"a":0,"why":"Tu attaques le pion d4 avec e3 : l'ouverture de la colonne e donne un jeu actif."}
  },

  "eng-bot": {
    op: "eng", rep: "eng1",
    title: "Botvinnik : triangle c4-d3-e4, Cge2 et f4",
    tag: "Pions c4-d3-e4, fou g2, cavalier e2, roque, puis f2-f4 ou b2-b4",
    plans: ["Installe les pions c4, d3 et e4 : le triangle contrôle d5 et empêche ...d5.","Place les cavaliers en c3 et e2, le fou en g2, roque court. Ensuite d3, puis f4 ou Tb1 et b4.","Ouvre l'aile roi avec f2-f4 (appuyé par Fe3 ou Cc3/Cd5) : si les Noirs échangent en f4, reprends avec le cavalier ou le fou.","À l'aile dame, avance b2-b4 avec Tb1 : b5 gêne Cc6.","Un cavalier en d5 est puissant : échange-le seulement s'il t'offre quelque chose."],
    opp: ["...f5 pour contester le centre, souvent suivi de ...Cf6.","...Fe6 et ...Dd7 pour échanger le cavalier d5 et gagner du temps.","...Cd4 : le cavalier noir s'installe en d4 ; échange avec Cxd4 exd4 et Cd5."],
    breaks: ["f2-f4","b2-b4","d3-d4"],
    squares: ["d5","e2","g2","f4"],
    mistakes: ["Jouer e4 sans Cc3 : d5 devient un trou pour les Noirs.","Échanger ton fou g2 sans raison : il protège ton roque et ta grande diagonale.","Précipiter f4 sans Fe3 : la colonne f peut se retourner contre toi."],
    quiz: {"q":"Quelle est l'idée du triangle de pions c4-d3-e4 ?","opts":["Contrôler d5 et soutenir f4","Préparer d3-d4 immédiatement","Défendre l'aile dame seulement","Attaquer le roque par g4"],"a":0,"why":"Les pions c4 et e4 contrôlent d5 ; d3 les relie et prépare f4."}
  },

  "eng-d5": {
    op: "eng", rep: "eng4",
    title: "Sicilienne inversée : la case d5",
    tag: "1.c4 e5 avec Cc3, g3 et Fg2 : une Sicilienne avec un tempo de plus",
    plans: ["Contre ...d5, prends cxd5 Cxd5 puis Fg2 : la pression sur d5 te donne l'initiative.","Place ton cavalier en f3 et ton fou sur g2 : roque court, puis d3 et Ce4 ou a3 et b4.","Prépare b4 : si ...Cd4, Cxd4 exd4 Ce4 donne un avantage à long terme.","Joue Tb1 et b4 quand les Noirs jouent ...Fe6."],
    opp: ["...Cb6 pour viser c4, puis ...Fe6.","...Cd4 pour gêner f3 et préparer ...c6."],
    breaks: ["b2-b4","d3-d4","a2-a3 puis b4"],
    squares: ["d5","e4","d4","b4"],
    mistakes: ["Oublier a3 avant b4 : le cavalier d4 devient fort.","Échanger sur d5 trop vite sans gain."],
    quiz: {"q":"Dans la Sicilienne inversée, quel est le grand atout des Blancs ?","opts":["Un tempo de plus","Une dame en moins","Un pion de plus","Le roque long"],"a":0,"why":"C'est une Sicilienne où tu joues avec le trait : tu as un coup d'avance."}
  },

  "eng-sym": {
    op: "eng", rep: "eng7",
    title: "Anglaise symétrique (...c5) : e3, Cge2 et d4",
    tag: "Pions c4 et e3, fou g2, plan d4 ou b4",
    plans: ["Joue g3, Fg2 et e3 : une structure compacte sans faiblesse en d3.","Cge2 et O-O, puis d4 pour ouvrir le jeu quand tu es mieux développé.","Si les Noirs jouent ...d6 et ...e5, sois prêt à reprendre en d4 avec un pion et à jouer d5.","Avec Tb1, joue b4 pour étendre ton avantage d'espace."],
    opp: ["...Fe6 et ...Dd7 pour ménager ...d5.","...f5 pour prendre l'espace à l'aile roi."],
    breaks: ["d2-d4","b2-b4"],
    squares: ["d4","e2","g2","b4"],
    mistakes: ["Ouvrir d4 sans avoir fini ton développement.","Laisser ...d5 libre : tu perds ton espace."],
    quiz: {"q":"Quel pion pousses-tu pour ouvrir le centre dans cette structure ?","opts":["Le pion d","Le pion h","Le pion g","Le pion a"],"a":0,"why":"d2-d4 est la cassure centrale quand tes pièces sont placées."}
  },

  "eng-f5": {
    op: "eng", rep: "eng3",
    title: "Contre ...f5 : e3, d3 et Cge2",
    tag: "Les Noirs avancent ...f5 : reste solide et frappe ensuite",
    plans: ["Contre ...f5, joue g3, Fg2 et e3 : tu laisses l'adversaire s'étendre pour mieux frapper ensuite.","Cge2 et d3 contre ...e4 : tu ouvres la colonne d et attaques le pion avancé.","Cherche à échanger ton cavalier c3 contre le fou b4 si besoin, pour casser la pression."],
    opp: ["...e4 pour gagner de l'espace ; réponds d3.","...Fb4 pour clouer Cc3."],
    breaks: ["d3xe4","d2-d4"],
    squares: ["e4","d3","e2","g2"],
    mistakes: ["Ignorer ...e4 : le pion avancé gêne ton jeu.","Jouer f3 trop tôt : tu affaiblis ton roque."],
    quiz: {"q":"Contre ...e4, quel coup immédiat est utile ?","opts":["d3","h4","a3","Db3"],"a":0,"why":"d3 attaque le pion e4 et ouvre le jeu pour ton fou g2."}
  },
};

/* Lectures et sources utilisées pour construire les plans */
const SOURCES = [
  { t: "Oscar de Prado, The London System in 12 Lessons (New In Chess) : plans, tactiques et structures typiques du Londres." },
  { t: "Alexander Delchev, Bc4 against the Open Games (Chess Stars) : Giuoco Pianissimo et plans sans ...a6." },
  { t: "Georgios Souleidis, Winning with the Slow Italian : structures et manœuvres de l'Italienne lente." },
  { t: "Milos Pavlovic, The Modernized Stonewall Defense : plans du Stonewall avec ...Fd6, et plans blancs avec Ce5." },
  { t: "Pages ouvertures de Chess.com, 365chess et ChessBase Learn : attaque autrichienne, attaque 150, Léningrad, Stonewall." },
  { t: "Tes cours Chessable (titres de chapitres seulement) : Short & Sweet London System, Play the Power Pirc, Short & Sweet Classical Dutch, Krykun's Italian Game, Killer Dutch Middlegames. Contenu payant non recopié ; plans reformulés." },
  { t: "Lotus Chess (app) : analyse de tes parties, entraînement répété jusqu'à l'automatisme, programme quotidien court." }
];

/* ===== Chapitres : regroupent les lignes de chaque ouverture ===== */
const CHAPTERS = {
  lon: [
    { id: "base",  t: "Le plan de base",          c: "blue",   d: "Ff4, e3, c3, Cbd2 : le schéma à jouer contre ...d5, ...e6 et ...c5." },
    { id: "qb6",   t: "Contre ...Db6",             c: "teal",   d: "Le pion b2 est la cible favorite. Défends-le ou propose l'échange." },
    { id: "fian",  t: "Contre les fianchettos",    c: "violet", d: "Quand les Noirs jouent ...g6 et ...Fg7, ton fou et le pion h changent de rôle." },
    { id: "autres",t: "Autres défenses",           c: "amber",  d: "Indienne de la Dame, Benoni, Slave, ...c5 immédiat et ...e6 avec ...Fd6." },
    { id: "pieges",t: "Pièges",                    c: "red",    d: "Les coups tentants qui font perdre une pièce, côté Blancs comme côté Noirs." }
  ],
  ita: [
    { id: "pian",  t: "Pianissimo",               c: "green",  d: "c3, d3 et un jeu lent. Le plan : manœuvrer le cavalier en g3 puis préparer d4." },
    { id: "greco", t: "Piano avec d4",            c: "teal",   d: "Quand tu joues d4 tout de suite : le centre mobile et les tactiques en e4." },
    { id: "lente", t: "Italienne lente",          c: "blue",   d: "d3 sans c3 : le cavalier va via d2-f1-g3, le fou garde la diagonale." },
    { id: "evans", t: "Gambit Evans",             c: "amber",  d: "4.b4 : un pion sacrifié contre une avance de développement." },
    { id: "pieges",t: "Pièges",                   c: "red",    d: "Légal, Blackburne, Foie grillé : à tendre ou à éviter." }
  ],
  pir: [
    { id: "class", t: "Système classique",        c: "violet", d: "Cf3, Fe2, 0-0 : tu joues ...c6, ...Cbd7 ou ...Fg4 avec ...e5." },
    { id: "aut",   t: "Attaque autrichienne",     c: "amber",  d: "4.f4 : Blancs agressifs. Ta réponse : ...c5 et la contre-attaque au centre." },
    { id: "a150",  t: "Attaque 150 (Fe3, Dd2)",   c: "blue",   d: "Fe3, Dd2, Fh6 : sois précis avec ...c6, ...b5 et ...Cbd7." },
    { id: "fg5",   t: "Contre Fg5 et Ff4",        c: "teal",   d: "Le fou sort tôt : réponds par ...c6, ...Da5 ou l'échange des dames." },
    { id: "tch",   t: "Pirc tchèque",             c: "green",  d: "...c6 et ...Da5 : une structure plus flexible contre f4." },
    { id: "autres",t: "Autres systèmes",           c: "orange", d: "Bayonet, Kholmov, g3 et Schlechter : les systèmes plus rares à connaître." },
    { id: "pieges",t: "Pièges",                   c: "red",    d: "Les coups tentants à ne pas jouer et les tactiques à connaître." }
  ],
  dut: [
    { id: "len",   t: "Léningrad",                c: "orange", d: "...g6, ...Fg7, ...d6 : le plan classique avec ...De8 et ...c5." },
    { id: "stone", t: "Stonewall",                c: "blue",   d: "...d5, ...e6, ...c6, ...Fd6 : un mur solide, un cavalier en e4." },
    { id: "class", t: "Classique",                c: "violet", d: "...e6, ...Fe7 et ...d6 : attaque sur e4 et centre flexible." },
    { id: "lond",  t: "Contre le Londres",        c: "teal",   d: "...e6, ...b6 puis ...Fb7 et ...Fd6 pour disputer la diagonale." },
    { id: "gamb",  t: "Gambits et 2.Fg5",         c: "amber",  d: "Staunton, 2.Fg5, 2.Cc3 : des tentatives de sortir de la théorie." },
    { id: "pieges",t: "Pièges",                   c: "red",    d: "Hopton, Staunton et autres motifs tactiques à connaître." }
  ],
  bir: [
    { id: "d5",     t: "Contre 1...d5",           c: "amber",  d: "Le Bird classique : Cf3, e3, Fe2 ou Fb2, d3 et De1. Tu joues une Hollandaise inversée." },
    { id: "from",   t: "Gambits : From et Sturm", c: "violet", d: "1...e5 (gambit From) et 2.c4 (Mujannah-Sturm) : des lignes aiguës, à connaître dans les deux sens." },
    { id: "autres", t: "Autres défenses",         c: "blue",   d: "Contre 1...Cf6, 1...c5, 1...e6 et 1...f5 : la même structure compacte, adaptée." },
    { id: "pieges", t: "Pièges",                  c: "red",    d: "Dh4+ sur la diagonale e1-h4, le Sturm et d'autres pièges à tendre ou à éviter." }
  ],
  eng: [
    { id: "bot",    t: "Système Botvinnik",       c: "teal",   d: "Pions c4-d3-e4, fou en g2, cavalier en e2 : le plan central du système, contre ...e5 et ...f5." },
    { id: "e5",     t: "Autres lignes contre ...e5", c: "blue", d: "La Sicilienne inversée : ...Cf6 et ...d5. La case d5, le plan b4 et le fou g2." },
    { id: "sym",    t: "Contre ...c5",            c: "green",  d: "Anglaise symétrique et Hérisson : e3, d4 ou b4 selon la réponse." },
    { id: "autres", t: "Autres défenses",         c: "amber",  d: "Contre ...Cf6 et ...g6 : le système Botvinnik transposé." },
    { id: "pieges", t: "Pièges",                  c: "red",    d: "Le piège de Carlsen et les coups tentants à éviter." }
  ]
};
const LINE_CH = {
  bir1: "d5", bir2: "d5", bir3: "d5", bir11: "d5", bir4: "autres", bir5: "autres", bir6: "autres", bir7: "autres", bir8: "from", bir9: "from", bir10: "from",
  eng1: "bot", eng2: "bot", eng3: "bot", eng5: "bot", eng4: "e5", eng6: "e5", eng7: "sym", eng8: "sym", eng9: "autres",
  lon1: "base", lon5: "base", lon4: "base",
  lon2: "qb6", lon10: "qb6",
  lon3: "fian", lon8: "fian", lon15: "fian",
  lon6: "autres", lon7: "autres", lon12: "autres", lon13: "autres", lon14: "autres", lon16: "autres",
  lon9: "pieges", lon11: "pieges",
  ita1: "pian", ita5: "pian", ita2: "greco", ita3: "lente", ita4: "lente",
  ita6: "evans", ita7: "evans", ita8: "evans",
  pir1: "class", pir2: "class", pir3: "aut", pir4: "a150", pir5: "a150",
  pir7: "fg5", pir8: "fg5", pir6: "tch",
  pir9: "autres", pir10: "autres", pir11: "autres", pir14: "autres",
  dut1: "len", dut2: "len", dut3: "stone", dut4: "stone",
  dut5: "class", dut9: "class", dut10: "class", dut11: "class",
  dut8: "lond", dut13: "lond",
  dut6: "gamb", dut7: "gamb", dut12: "gamb"
};
/* Lignes de pièges réutilisées : le type précise qui tend le piège. */
const TRAP_KIND = { lon9: "set", lon11: "set" };

/* Finales vérifiées au moteur */
var EG_LIST = [
  { t: "Mat avec Dame et Roi", fen: "8/8/8/4k3/8/8/2Q5/4K3 w - - 0 1", goal: "win", lv: 1, why: "Rétrécis la boîte autour du roi adverse avec la dame, un coup de cavalier de distance. Amène ensuite ton roi et mate. Attention au pat : laisse toujours une case au roi noir tant que tu n'as pas le mat." },
  { t: "Mat avec Tour et Roi", fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", goal: "win", lv: 1, why: "Coupe le roi par une rangée avec la tour, avance ton roi pour prendre l'opposition, puis donne échec sur la dernière rangée. Garde la tour loin du roi adverse pour ne pas la perdre." },
  { t: "Mat avec deux Tours", fen: "8/8/8/8/3k4/8/R7/1R5K w - - 0 1", goal: "win", lv: 1, why: "La méthode de l'escalier : une tour coupe une rangée, l'autre donne échec sur la rangée suivante, et ainsi de suite jusqu'au bord." },
  { t: "Roi et pion : la sixième rangée", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", goal: "win", lv: 2, why: "Avec ton roi en sixième rangée devant le pion, tu gagnes quel que soit le trait. Joue Rf6, puis conduis le pion à la promotion sans bloquer ton propre roi." },
  { t: "Pion g avec roi en f6", fen: "7k/8/5K2/6P1/8/8/8/8 w - - 0 1", goal: "win", lv: 2, why: "Le roi adverse est coincé dans le coin, mais attention au pat ! Avance le pion avec précision et vérifie à chaque coup qu'il reste un coup légal au roi noir." },
  { t: "Lucena : bâtir le pont", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", goal: "win", lv: 3, why: "La position la plus célèbre des finales de tours. Pour gagner, il faut « construire un pont » : mets la tour sur la quatrième rangée (Td4), amène le roi hors de la case de promotion, puis abrite-le derrière la tour." },
  { t: "Pion de tour : la nulle", fen: "k7/8/1K6/P7/8/8/8/8 w - - 0 1", goal: "draw", lv: 2, why: "Avec un pion de colonne a ou h, le roi défenseur dans le coin fait nulle par pat. Tu ne peux pas gagner : joue 20 coups sans te faire mater, ou provoque le pat." },
  { t: "Philidor : la défense passive", fen: "4k3/8/r7/4PK2/8/8/8/7R b - - 0 1", goal: "draw", lv: 3, why: "Les Noirs défendent en gardant la tour sur la sixième rangée pour empêcher le roi blanc d'avancer. Dès que le pion avance en sixième, la tour attaque par derrière et fait des échecs. Tiens 20 coups." }
];
