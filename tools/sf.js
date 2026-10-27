const {Chess}=require("chess.js");const {spawn}=require("child_process");
const sf=spawn(process.env.STOCKFISH||"stockfish");let buf="",resolve;
sf.stdout.on("data",x=>{buf+=x;let i;while((i=buf.indexOf("\n"))>=0){const l=buf.slice(0,i);buf=buf.slice(i+1);if(resolve&&resolve(l))resolve=null}});
const send=s=>sf.stdin.write(s+"\n");
send("uci");send("setoption name Threads value 2");send("setoption name Hash value 256");
// returns [{uci,san,cp (side-to-move POV; mates ±100000-n)}] multipv
function an(fen,depth=18,mpv=3){return new Promise(r=>{const res={};send("setoption name MultiPV value "+mpv);send("position fen "+fen);send("go depth "+depth);
 resolve=l=>{const m=l.match(/depth (\d+) .*multipv (\d+) score (cp|mate) (-?\d+) .* pv (\S+)/);if(m&&+m[1]===depth){const v=+m[4];res[m[2]]={uci:m[5],cp:m[3]==="cp"?v:(v>0?100000-v:-100000-v)}}
 if(l.startsWith("bestmove")){const g=new Chess(fen);r(Object.keys(res).sort().map(k=>{const u=res[k].uci;const c=new Chess(fen);const mv=c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});return {uci:u,san:mv.san,cp:res[k].cp}}));return true}return false}})}
async function play(fen,plies,depth=18){const g=new Chess(fen);const out=[];for(let i=0;i<plies&&!g.game_over();i++){const a=await an(g.fen(),depth,2);const f=g.fen();const white=g.turn()==="w";out.push({fen:f,san:a[0].san,cp:white?a[0].cp:-a[0].cp,gap:a[1]?a[0].cp-a[1].cp:9999,alt:a[1]?a[1].san:null});g.move(a[0].san)}return out}
module.exports={an,play,done:()=>sf.kill(),Chess};
