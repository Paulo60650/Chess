const {an,done,Chess}=require("./sf.js");const G=require("./games1.js");const fs=require("fs");
const FR=m=>m.replace(/\b([NBRQK])(?=[a-h1-8x])/g,x=>({N:"C",B:"F",R:"T",Q:"D",K:"R"})[x]).replace(/=([NBRQ])/g,(a,x)=>"="+({N:"C",B:"F",R:"T",Q:"D"})[x]);
const B="/tmp/claude-0/-home-claude/8be9f305-ba97-50e3-b2aa-fa88d7f43ef0/scratchpad/build/";
(async()=>{const {L,EX}=JSON.parse(fs.readFileSync("st1.json"));const P=[];const lvOf=c=>c.lv;
 for(const e of EX){const sp=G[e.k].split(" ");const g=new Chess();for(let i=0;i<e.ply-1;i++)g.move(sp[i],{sloppy:true});const fen=g.fen();
  const a=await an(fen,18,2);const m=g.move(sp[e.ply-1],{sloppy:true});const me=fen.split(" ")[1]==="w"?"Les Blancs":"Les Noirs";
  const ev=(a[0].cp/100);const evs=(ev>=0?"+":"−")+Math.abs(ev).toFixed(1).replace(".",",");
  const gap=a[1]?a[0].cp-a[1].cp:999;
  const why=e.why+" Stockfish préfère "+FR(m.san)+" ("+evs+" de ton point de vue)"+(gap>=50?" avec un écart net sur les autres coups.":" avec un petit écart sur les autres coups.");
  const lbl={bpair:"Paire de fous",bpbreak:"Affronter la paire",iqp:"Pion dame isolé",minor:"Attaque de minorité",hang:"Pions pendants",zugzwang:"Zugzwang",pillsbury:"Attaque Pillsbury",openfile:"Colonnes ouvertes",weakking:"Roque affaibli",prophyl:"Prophylaxie",bvn:"Fou contre cavalier",enfermement:"Enfermement",exsac:"Sacrifice positionnel"}[e.cpt];
  P.push({id:"st"+e.cpt+e.ply,op:"gen",th:e.th,cpt:e.cpt,tags:[],pos:e.pos||undefined,lv:e.lv,goal:e.goal,t:lbl+" · coup "+Math.ceil(e.ply/2),fen,sol:[m.san],why,src:"Partie de maître analysée avec Stockfish"});
  if(!e.pos)delete P[P.length-1].pos}
 const att=L.filter(l=>l.grp==="att"),str=L.filter(l=>l.grp!=="att");
 const js="/* concepts de stratégie issus de parties de maîtres (texte réécrit ; coups vérifiés avec Stockfish) */\n(function(){\nvar S="+JSON.stringify(str)+",A="+JSON.stringify(att)+",P="+JSON.stringify(P)+";\nS.forEach(function(c){var i=0;while(i<STRAT.length&&STRAT[i].lv<=c.lv)i++;STRAT.splice(i,0,c);STRAT_BY[c.id]=c;});\nA.forEach(function(c){var i=0,k=ADC.length;for(i=0;i<ADC.length;i++){if(ADC[i].grp===c.grp&&ADC[i].lv>c.lv){k=i;break}}ADC.splice(k,0,c);ADC_BY[c.id]=c;STRAT_BY[c.id]=c;});\nP.forEach(function(p){PUZZLES.push(p);});\n/* thème Zugzwang : problèmes Lichess rattachés à la leçon */\nvar Z=PUZZLES.filter(function(p){return p.th===\"Zugzwang\"&&!p.cpt&&!p.pos;}).sort(function(a,b){return (a.r||0)-(b.r||0);});var step=Math.max(1,Math.floor(Z.length/8));for(var j=0;j<Z.length&&j<8*step;j+=step){Z[j].cpt=\"zugzwang\";}\n})();\n";
 fs.writeFileSync(B+"stnew.js",js);console.log("ok",str.length,att.length,P.length,js.length);done();process.exit()})();
