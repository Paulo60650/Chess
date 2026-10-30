const fs=require("fs");const {Chess}=require("chess.js");
const FR=m=>m.replace(/[NBRQK]/g,x=>({N:"C",B:"F",R:"T",Q:"D",K:"R"})[x]);
// exercices : [key,titre,fen,goal,lv,max,why,intro,end,plies,notes[]]
const EX=[
 {k:"t1",t:"Trébuchet : gagner le trait",fen:"8/8/8/8/4K1p1/6Pk/8/8 w - - 0 1",goal:"win",lv:3,max:90,
  why:"Rf4! installe le trébuchet avec les Noirs au trait. Tous les autres coups du roi laissent le roi noir prendre g3 et le pion g4 passe. Quand tu es à un coup de la position, joue-la : c'est à l'adversaire de céder.",
  i:"Objectif : gagner. Les pions g3 et g4 se bloquent et le roi noir attaque g3. Trouve la case du roi qui met les Noirs en zugzwang.",
  e:"Le pion g avance, soutenu par le roi : il promeut en dame, puis tu mates.",
  p:"Kf4 Kh2 Kxg4 Kg2 Kf4 Kh3 g4 Kh4 g5 Kh5 Kf5 Kh4".split(" "),
  n:["Le roi se place en f4 : c'est le trébuchet, avec les Noirs au trait.","Le roi noir doit lâcher la garde de g4 : il s'écarte.","Le roi blanc prend le pion g4.","Le roi noir attaque g3 mais n'a plus de pion à protéger.","Le roi défend g3 et reste devant le pion.","Le roi noir s'approche.","Le pion g avance, escorté par son roi.","Le roi noir recule devant le pion.","Le pion continue.","Le roi noir est repoussé vers le bord.","Le roi blanc prend la case devant le pion.","Le roi noir n'a plus rien à défendre."]},
 {k:"t2",t:"Trébuchet : le roi arrive de loin",fen:"8/8/8/5K2/6p1/6Pk/8/8 w - - 0 1",goal:"win",lv:3,max:90,
  why:"Même idée, avec le roi un cran plus haut : Rf4! est le seul coup qui gagne. Tout autre roi permet ...Rxg3 et le pion g4 passe.",
  i:"Objectif : gagner. Ton roi est en f5, les rois et les pions sont presque en place. Un seul coup crée le zugzwang.",
  e:"Le pion g promeut, tu gagnes une dame.",
  p:"Kf4 Kh2 Kxg4 Kg2 Kf4 Kf1 g4 Ke2 g5 Ke1 g6 Kd2".split(" "),
  n:["Le roi vient en f4 : trébuchet, les Noirs doivent jouer.","Le roi noir lâche le contrôle de g4.","Le roi blanc prend le pion g4.","Le roi noir attaque g3.","Le roi blanc défend g3.","Le roi noir s'éloigne.","Le pion g avance.","Le roi noir est impuissant.","Le pion avance encore.","Le roi noir est trop loin.","Le pion arrive en g6.","Le roi noir tente sa chance de l'autre côté."]},
 {k:"t3",t:"Trébuchet : jouer avec les Noirs",fen:"8/8/8/8/5Kp1/6P1/7k/8 b - - 0 1",goal:"win",lv:3,max:90,
  why:"Rh3! (et seulement ce coup) crée le trébuchet avec les Blancs au trait : leur roi doit lâcher g3 ou le pion g4 tombe. Même idée que pour les Blancs, vue de l'autre côté.",
  i:"Objectif : gagner avec les Noirs. Ton roi est en h2, celui des Blancs en f4 : un seul coup te donne le trébuchet.",
  e:"Le pion noir g avance jusqu'à la promotion.",
  p:"Kh3 Kf5 Kxg3 Ke4 Kh3 Kd5 g3 Kc5 Kg4 Kc4 g2 Kb4".split(" "),
  n:["Le roi noir va en h3 : trébuchet, les Blancs doivent jouer.","Le roi blanc doit lâcher le pion g4 ou g3.","Le roi noir prend le pion g3.","Le roi blanc cherche du jeu.","Le roi noir laisse la voie libre à son pion.","Le roi blanc est trop loin.","Le pion g avance.","Le roi blanc passe de l'autre côté.","Le roi noir escorte son pion.","Le roi blanc s'éloigne.","Le pion arrive en g2.","Le pion va promouvoir."]},
 {k:"a1",t:"Tour active : retourne sur la sixième rangée",fen:"R7/6k1/P7/8/3K4/8/5r2/8 b - - 0 1",goal:"draw",lv:3,
  why:"Tf6! est le seul coup : la tour attaque le pion a6 par le côté et fige la tour blanche. Une tour qui reste ailleurs (derrière, devant ou sur la septième) perd.",
  i:"Objectif : faire nulle. Ta tour est loin de l'action. Ramène-la sur la bonne rangée pour harceler le pion a6.",
  e:"Les Blancs ne peuvent plus progresser : nulle.",
  p:"Rf6 Kc4 Rb6 Kd5 Rf6 Ra7+ Kg8 Ra8+ Kg7".split(" "),
  n:["La tour se place sur la sixième rangée : le pion a6 est attaqué.","Le roi blanc cherche un abri sur l'aile dame.","La tour noire reste sur la sixième rangée et coupe le roi blanc.","Le roi blanc essaie de revenir.","La tour reprend la case f6.","La tour blanche doit donner échec pour se dégager.","Le roi noir s'écarte sur la huitième rangée.","Les échecs continuent, mais sans résultat.","Le roi noir revient : on tourne en rond."]},
 {k:"a2",t:"Tour active : cas du pion h",fen:"R7/6k1/P7/8/3K4/8/7r/8 b - - 0 1",goal:"draw",lv:3,
  why:"Th6! est le seul coup : la tour attaque le pion a6 de loin, et la tour blanche ne peut pas le quitter. Les autres coups (Ta2, Th5, Tc2) perdent.",
  i:"Objectif : faire nulle. Ta tour est sur la colonne h. Trouve son seul bon placement.",
  e:"La tour tient la position : nulle.",
  p:"Rh6 Ra7+ Kh8 Ra8+ Kg7 Ra7+ Kh8 Ra8+ Kg7".split(" "),
  n:["La tour se place sur la sixième rangée.","Les Blancs cherchent un échec.","Le roi noir va au coin, loin des échecs de la tour blanche.","La tour blanche revient.","Le roi retourne en g7.","La tour blanche essaie encore.","Le roi retourne au coin.","La même position revient.","Le roi retourne en g7 : nulle."]},
 {k:"a3",t:"Tour active : garde la sixième rangée",fen:"R7/6k1/P4r2/4K3/8/8/8/8 b - - 0 1",goal:"draw",lv:3,
  why:"Les Blancs ont avancé leur roi, mais la tour noire n'a qu'une consigne : rester sur la sixième rangée (Tc6, Tb6, Tg6 ou Th6). Dès qu'elle la quitte, le pion a6 devient un danger.",
  i:"Objectif : faire nulle. Le roi blanc avance. Garde ta tour sur la rangée où elle attaque le pion.",
  e:"Les Blancs n'ont pas d'idée de progrès : nulle.",
  p:"Rc6 Kd5 Rf6 Ke5 Rc6 Ra7+ Kg8 Ra8+ Kg7".split(" "),
  n:["La tour reste sur la sixième rangée, devant le roi blanc.","Le roi blanc tente de passer.","La tour noire se replace sur la sixième rangée.","Le roi blanc revient.","La tour garde la sixième rangée.","La tour blanche donne échec.","Le roi noir se place derrière sa tour.","L'échec continue, sans effet.","Le roi retourne en g7."]},
 {k:"f1",t:"Tour folle : l'échec qui force le pat",fen:"R7/8/2k5/8/6q1/7p/7P/7K w - - 0 1",goal:"draw",lv:3,
  why:"Ta6+! : la tour est sacrifiée avec échec. Si le roi noir la prend, le roi blanc n'a plus de case : pat. S'il s'éloigne, la tour revient donner échec ailleurs. Il ne faut surtout pas jouer sans échec (par exemple Tg8) : les Noirs répondent Df3+ et mettent mat.",
  i:"Objectif : faire nulle. Les pions bloquent ton roi, la dame noire contrôle g1 et g2, et ...Dg2# est dans l'air. Utilise ta tour comme un sacrifice qui te donne le pat.",
  e:"Les Noirs ne peuvent ni prendre la tour (pat), ni s'en débarrasser : nulle.",
  p:"Ra6+ Kb5 Ra5+ Kc6 Ra6+ Kb5".split(" "),
  n:["La tour s'offre avec échec : si le roi la prend, c'est pat.","Le roi noir attaque la tour sans la prendre.","La tour échappe au roi et redonne échec.","Le roi noir s'éloigne de la tour.","La tour revient avec échec : la position se répète.","Les Noirs ne trouvent pas mieux."]},
 {k:"f2",t:"Tour folle : le roi noir loin dans le coin",fen:"8/8/8/8/6q1/7p/3R3P/k6K w - - 0 1",goal:"draw",lv:3,
  why:"Ta2+! : même thème, l'échec empêche les Noirs d'ignorer la tour. Si Rxa2, c'est pat ; sinon la tour continue ses échecs.",
  i:"Objectif : faire nulle. Le roi noir est dans le coin a1 et la dame contrôle les cases de ton roi. Sauve-toi avec ta tour.",
  e:"La tour continue ses échecs ou le roi la prend et c'est pat : nulle.",
  p:"Ra2+ Kb1 Rb2+ Kc1 Rc2+ Kb1".split(" "),
  n:["La tour se jette avec échec : si le roi la prend, c'est pat.","Le roi noir attaque la tour.","La tour s'échappe avec un nouvel échec.","Le roi noir poursuit la tour.","La tour donne encore échec.","Le roi noir revient : répétition."]},
 {k:"f3",t:"Tour folle : le roi noir au milieu",fen:"8/8/8/8/8/p2R4/P1q2k2/K7 w - - 0 1",goal:"draw",lv:3,
  why:"Tf3+! : la dame noire attaque ta tour et menace ...Db2#, mais l'échec force la décision. Rxf3 est pat, et ...Re2 ou ...Rg2 laissent une tour qui continue ses échecs.",
  i:"Objectif : faire nulle. Ta tour est attaquée par la dame et un mat menace en b2. Trouve l'échec qui sauve la partie.",
  e:"Pat ! Le roi noir a pris la tour et les Blancs n'ont plus aucun coup.",
  p:"Rf3+ Kxf3".split(" "),
  n:["La tour donne échec : si le roi la prend, les Blancs n'ont plus de coup.","Le roi noir prend la tour : pat, la partie est nulle."]}
];
const E3=require("./eg3.js");EX.push(...E3.EX);
const X=[];
for(const e of EX){const g=new Chess(e.fen);if(e.p.length!==e.n.length)throw new Error(e.k+" notes "+e.n.length+" vs "+e.p.length);
 const st=[];e.p.forEach((s,j)=>{const m=g.move(s);if(!m)throw new Error(e.k+" illégal "+s);st.push({s:m.san,t:FR(m.san)+" : "+e.n[j]})});
 X.push({k:e.k,t:e.t,fen:e.fen,goal:e.goal,lv:e.lv,max:e.max,why:e.why,o:e.fen.split(" ")[1],i:e.i,e:e.e,st,end:g.in_stalemate()?"pat":g.in_checkmate()?"mat":"" })}
// leçons
const SEC={
 treb:[
  ["La position du trébuchet","8/8/8/8/5Kp1/6Pk/8/8 w - - 0 1","Les pions g3 et g4 se bloquent. Le roi blanc attaque g4, le roi noir attaque g3, mais chaque pion est défendu par son roi. Celui qui doit jouer est perdu : si le roi blanc s'éloigne, Rxg3 et le pion g4 file. Ici les Blancs jouent, donc ils perdent.","Ke4 Kxg3 Kd5 Kh3 Kd4 g3".split(" ")],
  ["Les Noirs au trait : ils perdent aussi","8/8/8/8/5Kp1/6Pk/8/8 b - - 0 1","Même position, mais les Noirs jouent : le roi noir doit quitter h3. Le pion g4 n'est plus défendu et le roi blanc le prend. C'est un zugzwang réciproque : celui qui a le trait perd.","Kh2 Kxg4 Kg2 Kf4 Kf1 Ke4".split(" ")],
  ["Atteindre le trébuchet","8/8/8/8/4K1p1/6Pk/8/8 w - - 0 1","Le but est de jouer le coup qui crée le trébuchet avec l'adversaire au trait. Ici Rf4! installe la position : les Noirs doivent céder un pion. Tous les autres coups du roi blanc laissent le roi noir prendre g3.","Kf4 Kh2 Kxg4 Kg2 Kf4 Kh3 g4 Kh4".split(" ")]],
 actif:[
  ["La tour active : Vančura","R7/6k1/P4r2/8/3K4/8/8/8 w - - 0 1","Les Blancs ont un pion a6 soutenu par la tour en a8, mais la tour noire est sur la sixième rangée. Elle attaque le pion de côté, ce qui fige la tour blanche, et donne des échecs dès que le roi s'approche. Le roi noir reste près du coin : ni l'échec en h8 ni le sacrifice de tour ne marchent. Les Blancs n'avancent pas : nulle.","Ke5 Rb6 Kd5 Rf6 Kc5 Rf5+ Kb6 Rf6+ Ka7 Rf7+ Kb8 Rf8+".split(" ")],
  ["La tour passive perd","R7/5rk1/P7/8/3K4/8/8/8 w - - 0 1","Si la tour noire se range passivement sur la septième rangée (ou ailleurs que sur la sixième), la tour blanche est libérée : elle n'a plus besoin de défendre le pion à tout prix. Rb8 puis Rb5-a5 amènent le roi, le pion avance et les Noirs perdent.","Rb8 Kf6 Rb5 Ke6 Ra5 Kd6 a7 Rf4+ Ke3 Rf8 a8=Q Rxa8".split(" ")],
  ["Revenir sur la bonne rangée","R7/6k1/P7/8/3K4/8/5r2/8 b - - 0 1","Même position de base, mais la tour noire est mal placée et les Noirs jouent. Tf6! est le seul coup qui sauve la partie : la tour retourne sur la sixième rangée, devant le roi blanc. Tout autre coup perd.","Rf6 Kc4 Rb6 Kd5 Rf6 Ra7+ Kg8 Ra8+".split(" ")]],
 tfolle:[
  ["Le sacrifice avec échec","R7/8/2k5/8/6q1/7p/7P/7K w - - 0 1","Le roi blanc est bloqué par ses propres pions et la dame noire contrôle g1 et g2. Les Noirs menacent ...Dg2#. La tour blanche s'offre avec échec : Ta6+! Si le roi la prend, c'est pat. Le roi noir peut chercher à l'éviter, mais la tour retourne donner échec sans fin : nulle.","Ra6+ Kb5 Ra5+ Kc6 Ra6+ Kb5".split(" ")],
  ["Le roi noir est dans le coin","8/8/8/8/6q1/7p/3R3P/k6K w - - 0 1","Même thème, autre décor. Le roi noir est en a1 et la dame contrôle g1 et g2. Ta2+! offre la tour avec échec : Rxa2 est pat, sinon la tour s'échappe en b2, c2 avec échecs.","Ra2+ Kb1 Rb2+ Kc1 Rc2+ Kb1".split(" ")],
  ["Un sacrifice sans échec ne marche pas","R7/8/2k5/8/6q1/7p/7P/7K w - - 0 1","Attention : sans échec, la tour folle n'est pas forcée. Si les Blancs jouent Tg8?, les Noirs ignorent le sacrifice : Df3+! Tg2 Dxg2 est mat. Une tour folle doit donner échec ou menacer quelque chose de plus fort que la capture.","Rg8 Qf3+ Rg2 Qxg2#".split(" ")]]
};
const LES=[
 {id:"treb",t:"Le trébuchet",lv:3,exk:["t1","t2","t3"],grp:"pions",intro:"Quand deux pions se bloquent sur une même colonne et que chaque roi attaque le pion de l'adversaire, celui qui doit jouer perd un pion, donc la partie. C'est un zugzwang réciproque, et il s'appelle le trébuchet.",pts:["Chaque roi attaque le pion adverse et défend le sien : aucun ne peut bouger.","Celui qui a le trait perd : l'autre roi prend le pion.","Pour gagner, cherche le coup de roi qui donne le trait à l'adversaire.","Compte les tempi : une case de plus ou de moins change le résultat."]},
 {id:"actif",t:"Défense active et passive en finale de tours",lv:3,exk:["a1","a2","a3"],grp:"tours",intro:"En finale de tours, rester passif perd presque toujours : la tour doit travailler. Contre un pion en a6 (position de Vančura), la tour noire sur la sixième rangée attaque le pion de côté et tient la nulle. Une tour rangée passivement ailleurs perd.",pts:["Une tour active attaque le pion ou le roi adverse par le côté.","Garde ta tour sur la rangée où elle attaque le pion, ici la sixième.","Une tour passive libère la tour de l'adversaire pour avancer son pion.","Garde ton roi près du coin pour éviter les échecs et les sacrifices."]},
 {id:"tfolle",t:"La tour folle",lv:3,exk:["f1","f2","f3"],grp:"tours",intro:"La tour folle est une tour qui se sacrifie exprès pour forcer le pat. Elle sauve une partie perdue quand le roi est bloqué par ses propres pions et que toutes ses cases sont contrôlées. L'échec est presque toujours nécessaire, sinon l'adversaire ignore la tour.",pts:["Le roi doit être sans case, tes pions bloqués : alors la capture donne pat.","Donne échec avec la tour : l'adversaire ne peut pas l'ignorer.","Si l'adversaire peut refuser sans risque, le sacrifice ne marche pas.","Quand tu attaques, ne prends pas une tour qui offre un pat."]}
];
Object.assign(SEC,E3.SEC);LES.push(...E3.LES);
const SECS={};LES.forEach(l=>{SEC[l.id].forEach((s,i)=>{const g=new Chess(s[1]);const sans=[];for(const x of s[3]){const m=g.move(x);if(!m)throw new Error(l.id+i+" illégal "+x);sans.push(m.san)}SECS[l.id+":"+i]={sans,end:g.in_checkmate()?"mat":g.in_stalemate()?"pat":g.in_draw()?"nulle":""}})});
const lessons=LES.map(l=>({id:l.id,t:l.t,lv:l.lv,grp:l.grp,exk:l.exk,intro:l.intro,secs:SEC[l.id].map(s=>({t:s[0],fen:s[1],txt:s[2],orient:s[1].split(" ")[1]})),pts:l.pts}));
const exList=X.map(x=>({t:x.t,fen:x.fen,goal:x.goal,lv:x.lv,max:x.max,why:x.why}));const exModels=X.map(x=>({o:x.o,i:x.i,e:x.e,st:x.st}));
const keys=X.map(x=>x.k);
const js=`/* Finales : trébuchet, tour folle, défense active/passive ; rangement des leçons par chapitres (positions vérifiées avec Stockfish) */
(function () {
 var base = EG_LIST.length, K = ${JSON.stringify(keys)};
 var XL = ${JSON.stringify(exList)}, XM = ${JSON.stringify(exModels)}, LS = ${JSON.stringify(lessons)}, SC = ${JSON.stringify(SECS)};
 XL.forEach(function (x, k) { var o = { t: x.t, fen: x.fen, goal: x.goal, lv: x.lv, why: x.why }; if (x.max) o.max = x.max; EG_LIST.push(o); EG_EX[base + k] = XM[k]; });
 LS.forEach(function (l) { l.ex = l.exk.map(function (k) { return base + K.indexOf(k); }); delete l.exk; EG_LESSONS.push(l); });
 Object.keys(SC).forEach(function (k) { EG_SEC[k] = SC[k]; });
 var G = { mats: "mats", fous: "mats", foucav: "mats", carre: "pions", opposition: "pions", cles: "pions", sixieme: "pions", trait: "pions", tri: "pions", perc: "pions", treb: "pions", tours: "tours", tourfou: "tours", tcp: "tours", actif: "tours", tfolle: "tours", mauvais: "fous", ocb: "fous", cav: "cavaliers", "dame-pion": "dames" };
 EG_CHAPS = [{ id: "mats", t: "Les mats de base", d: "Dame, tour, deux fous, fou et cavalier : savoir mater avant tout." }, { id: "pions", t: "Finales de pions", d: "Opposition, cases clés, triangulation, trébuchet : le roi est la pièce principale." }, { id: "tours", t: "Finales de tours", d: "Les plus fréquentes : Lucena, Philidor, défense active, tour folle." }, { id: "fous", t: "Finales de fous", d: "Bon et mauvais fou, fous de couleurs opposées." }, { id: "cavaliers", t: "Finales de cavaliers", d: "Le cavalier contre les pions de bord, les mats dans le coin." }, { id: "dames", t: "Finales de dame", d: "La dame contre un pion à la septième rangée." }];
 EG_LESSONS.forEach(function (l, i) { l.grp = G[l.id] || l.grp; l.o = i; });
 EG_LESSONS.sort(function (a, b) { var ia = EG_CHAPS.findIndex(function (c) { return c.id === a.grp; }), ib = EG_CHAPS.findIndex(function (c) { return c.id === b.grp; }); return ia - ib || a.o - b.o; });
 EG_LESSONS.forEach(function (l, i) { l.n = i + 1; EG_LBY[l.id] = l; });
 EG_LIST.forEach(function (x, i) { EG_LESSONS.forEach(function (l) { if (l.ex.indexOf(i) >= 0) x.ls = l.id; }); });
})();
`;
fs.writeFileSync("/tmp/claude-0/-home-claude/8be9f305-ba97-50e3-b2aa-fa88d7f43ef0/scratchpad/build/egnew2.js",js);
console.log("ok",X.length,Object.keys(SECS).length,X.map(x=>x.k+":"+x.end).join(" "));
