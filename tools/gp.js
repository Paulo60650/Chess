const {an,done,Chess}=require("./sf.js");
const mv=process.argv[2].split(" ");const from=+process.argv[3],to=+process.argv[4];
(async()=>{const g=new Chess();for(let i=0;i<mv.length;i++){if(i+1>=from&&i+1<=to){const a=await an(g.fen(),18,3);const m=g.move(mv[i]);const top=a[0].san===m.san;const gap=a[1]?a[0].cp-a[1].cp:999;console.log((i+1)+"."+m.san,top?"TOP":"alt:"+a[0].san,"gap",gap,"cp",a[0].cp)}else g.move(mv[i])}done();process.exit()})()
