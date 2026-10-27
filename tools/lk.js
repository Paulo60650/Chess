const {an,done,Chess}=require("./sf.js");const G=require("./games1.js");
const k=process.argv[2];const mv=G[k].split(" ");const show=(process.argv[3]||"").split(",").map(Number);
(async()=>{const g=new Chess();const out=[];for(let i=0;i<mv.length;i++){const m=g.move(mv[i]);if(!m){console.log("ILLEGAL",i+1,mv[i]);break}
 const a=await an(g.fen(),14,1);const e=g.turn()==="w"?a[0].cp:-a[0].cp;out.push((i+1)+"."+m.san+"("+e+")");
 if(show.includes(i+1)){console.log("PLY",i+1,g.fen());console.log(g.ascii())}}
 console.log(out.join(" "));done();process.exit()})()
