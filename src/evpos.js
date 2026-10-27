const fs=require("fs");const {JSDOM,VirtualConsole}=require("jsdom");const {spawn}=require("child_process");
const dom=new JSDOM(fs.readFileSync("test.html","utf8"),{runScripts:"dangerously",url:"https://example.org/",pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const keys=JSON.parse(dom.window.eval(`(function(){const s=new Map();Object.values(LINE_BY_ID).forEach(L=>{const g=new Chess();const add=()=>{const f=g.fen();s.set(f.split(" ").slice(0,4).join(" "),f)};add();L.sans.forEach(m=>{g.move(m.replace(/[?!]/g,""),{sloppy:true});add()})});return JSON.stringify([...s])})()`));
const OUT=process.env.EVALS_OUT||"./evals.json";let res={};try{res=JSON.parse(fs.readFileSync(OUT))}catch(e){}
const todo=keys.filter(([k])=>!(k in res));console.log("à faire",todo.length,"/",keys.length);
const N=+process.argv[2]||4,D=+process.argv[3]||15;let idx=0,done=0;
function worker(){return new Promise(resolve=>{const sf=spawn(process.env.STOCKFISH||"stockfish");let buf="",cur=null,last=null;
 sf.stdout.on("data",d=>{buf+=d;let i;while((i=buf.indexOf("\n"))>=0){const l=buf.slice(0,i);buf=buf.slice(i+1);
  const m=l.match(/^info depth (\d+).* score (cp|mate) (-?\d+)/);if(m&&!/lowerbound|upperbound/.test(l))last=[m[2],+m[3]];
  if(l.startsWith("bestmove")){const stm=cur[1].split(" ")[1];let v=last?(last[0]==="cp"?last[1]:(last[1]>0?100000-last[1]:-100000-last[1])):0;if(stm==="b")v=-v;res[cur[0]]=v;done++;if(done%100===0){fs.writeFileSync(OUT,JSON.stringify(res));console.log(done)}next()}}});
 function next(){if(idx>=todo.length){sf.stdin.write("quit\n");resolve();return}cur=todo[idx++];last=null;sf.stdin.write("position fen "+cur[1]+"\ngo depth "+D+"\n")}
 sf.stdin.write("uci\nsetoption name Threads value 1\nsetoption name Hash value 64\nisready\n");setTimeout(next,500)})}
Promise.all(Array.from({length:N},worker)).then(()=>{fs.writeFileSync(OUT,JSON.stringify(res));console.log("FIN",Object.keys(res).length)});
