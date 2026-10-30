/* Range les lignes de cours dans les chapitres de leurs lignes (ou dans de nouvelles branches). Usage : node mkcourse2.js (depuis src/, après un build) */
const fs=require("fs");const {JSDOM}=require("jsdom");
const w=new JSDOM(fs.readFileSync("test.html","utf8"),{runScripts:"dangerously",url:"https://example.org/",pretendToBeVisual:true}).window;
const src=fs.readFileSync("coursedata.js","utf8");const C=JSON.parse(src.match(/const COURSE_EXTRA = (\[.*\]);/)[1]);
const NEW={jobc:["lon","jobava"],cex:["eng","g3"]}; /* cours sans équivalent : une nouvelle branche */
const info=JSON.parse(w.eval(`JSON.stringify((function(){const base=LINES.filter(l=>!l.course);
 const lcp=(a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i};
 return LINES.filter(l=>l.course).map(c=>{const cov=base.filter(b=>b.op===c.op&&!b.trap&&b.ch!=="pieges"&&lcp(c.sans,b.sans)>=c.dv+1);
  const par=LINE_BY_ID[c.par];return {id:c.id,cov:cov[0]?cov[0].ch:null,par:par?par.ch:null}})})())`));
const by={};info.forEach(i=>by[i.id]=i);
C.forEach(c=>{const i=by[c.id];const nw=Object.keys(NEW).find(p=>c.id.startsWith(p)&&!i.cov);
 c.ch=nw?NEW[nw][1]:(i.cov||i.par);
 c.name=c.name.replace(/^Cours Chessexplained · /,"").replace(/^Cours : /,"")});
const tail=`COURSE_EXTRA.forEach((x) => LINES.push(x));
(function () {
  var NB = { lon: { id: "jobava", t: "Jobava London", c: "violet", d: "Le système 2.Cc3 et Ff4 contre les défenses principales, tiré de ton cours." }, eng: { id: "g3", t: "Anglaise avec g3", c: "violet", d: "Les réponses noires à 1.c4 et 2.g3, tirées de ton cours." } };
  Object.keys(NB).forEach(function (op) {
    if (!COURSE_EXTRA.some(function (x) { return x.op === op; })) return;
    var a = CHAPTERS[op], i = a.findIndex(function (c) { return c.id === "pieges"; });
    a.splice(i < 0 ? a.length : i, 0, NB[op]);
  });
})();
`;
const head=src.slice(0,src.indexOf("COURSE_EXTRA.forEach"));
fs.writeFileSync(process.env.OUT||"coursedata.js",head.replace(/const COURSE_EXTRA = .*;\n/,"const COURSE_EXTRA = "+JSON.stringify(C)+";\n")+tail);
const n={};C.forEach(c=>{const k=c.op+"/"+c.ch;n[k]=(n[k]||0)+1});console.log(n);process.exit();
