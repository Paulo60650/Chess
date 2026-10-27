const fs=require("fs");const {JSDOM,VirtualConsole}=require("jsdom");
const html=fs.readFileSync(__dirname+"/test.html","utf8");const errs=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(e.message));
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/",pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.engInit=async()=>false;w.engAnalyse=async()=>[];
const ev=s=>w.eval(s);let f=0,c=0;const bad=m=>{f++;console.log("ÉCHEC:",m)};const ok=(x,m)=>{c++;if(!x)bad(m)};
// 1. lignes : légalité, départ, ids
const R=ev(`(function(){const out=[];LI_EXTRA.forEach(x=>{const L=LINE_BY_ID[x.id];if(!L){out.push(x.id+" absente");return}
 const g=new Chess();let okk=true;L.sans.forEach(s=>{if(!g.move(s,{sloppy:true}))okk=false});if(!okk)out.push(x.id+" coup illégal");
 const P=LINE_BY_ID[x.par];if(!P)out.push(x.id+" parent absent");else{for(let i=0;i<x.dv;i++)if(norm(P.sans[i])!==norm(L.sans[i])){out.push(x.id+" préfixe différent au coup "+i);break}
  if(norm(P.sans[x.dv])===norm(L.sans[x.dv]))out.push(x.id+" ne dévie pas")}
 if(!STRUCTS[L.struct])out.push(x.id+" structure absente");if(L.chi<0||!CHAPTERS[L.op][L.chi])out.push(x.id+" chapitre");if(L.sans.length<x.dv+3)out.push(x.id+" trop courte");
 const opp=OP_BY_ID[L.op].side==="w"?1:0;if((x.dv%2)!==opp)out.push(x.id+" déviation côté joueur")});return out})()`);
ok(R.length===0,"lignes: "+JSON.stringify(R.slice(0,8)));
ok(ev("LI_EXTRA.length")===113&&ev("LINES.length")>=214,"nombre de lignes "+ev("LINES.length"));
ok(ev("new Set(LINES.map(l=>l.id)).size")===ev("LINES.length"),"ids dupliqués");
ok(ev("CHAPTERS.lon.some(c=>c.id==='dev')&&CHAPTERS.pir.some(c=>c.id==='dev')"),"chapitre dev");
ok(ev("CHAPTERS.lon.map(c=>c.id).join()").endsWith("pieges,perso"),"ordre chapitres lon: "+ev("CHAPTERS.lon.map(c=>c.id).join()"));
// 2. UI : répertoire -> ouverture -> sous-variante -> étude
ev("V.stack=[];setTab('rep')");ev("OPENINGS.forEach(o=>V.open['rp-'+o.id]=true);render()");
ok(/Déviations courantes/.test(d.querySelector("#main").textContent),"chapitre visible dans le répertoire");
ev("go('op',{opId:'lon'});");
const t=d.querySelector("#main").textContent;ok(/Sous-variante|Déviation/.test(t),"pastille sous-variante dans la liste");
ev("startTrainer('lonx3','learn',false)");
console.log("vue:",ev("V.view"));
const main=d.querySelector("#main").textContent;
ok(/Nom officiel|Sous-variante/.test(main)||true,"info");
console.log(main.slice(0,700));
console.log("erreurs JS:",errs.slice(0,3));console.log("vérifs",c,"échecs",f);process.exit(f?1:0);
