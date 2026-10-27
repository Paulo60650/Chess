const fs = require("fs");
const vm = require("vm");
const { Chess } = require("chess.js");
const src = fs.readFileSync(__dirname + "/data.js", "utf8") + "\n" + fs.readFileSync(__dirname + "/core.js", "utf8") +
  "\n;globalThis.__out={OPENINGS,LINES,STRUCTS,LINE_BY_ID,lineGame,buildBook,dispSan,CHAPTERS};";
const ctx = { Chess, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { OPENINGS, LINES, STRUCTS, lineGame, buildBook, dispSan, CHAPTERS } = ctx.__out;

let bad = 0;
const files = "abcdefgh";
LINES.forEach((L) => {
  const g = new Chess();
  L.sans.forEach((san, i) => {
    const m = g.move(san);
    if (!m) { bad++; console.log("ILLÉGAL", L.id, "coup", i + 1, san, "FEN", g.fen()); }
  });
  console.log(L.id.padEnd(5), String(L.sans.length).padStart(2), "demi-coups", L.sans.map(dispSan).join(" "));
  if (!STRUCTS[L.struct]) { bad++; console.log("Structure inconnue", L.id, L.struct); }
  if (L.pgn.includes("{") && Object.keys(L.notes).length === 0) { bad++; console.log("Notes perdues", L.id); }
  if (!(CHAPTERS[L.op] || []).some((c) => c.id === L.ch)) { bad++; console.log("Chapitre inconnu", L.id, L.ch); }
  if (L.ch === "pieges" && !L.trap) { bad++; console.log("Piège sans type", L.id); }
  const o = OPENINGS.find((x) => x.id === L.op);
  if (!o) { bad++; console.log("Ouverture inconnue", L.id); }
});
Object.entries(STRUCTS).forEach(([id, s]) => {
  const own = LINES.filter((l) => l.struct === id);
  if (!own.length) { bad++; console.log("Structure sans ligne", id); }
  if (!own.find((l) => l.id === s.rep)) { bad++; console.log("rep invalide", id); }
  s.squares.forEach((q) => { if (!/^[a-h][1-8]$/.test(q)) { bad++; console.log("Case invalide", id, q); } });
  if (s.quiz.a < 0 || s.quiz.a >= s.quiz.opts.length) { bad++; console.log("Quiz invalide", id); }
  if (s.op !== LINES.find((l) => l.id === s.rep).op) { bad++; console.log("op incohérent", id); }
});
const book = buildBook();
console.log("Positions du livre :", book.size, "| erreurs :", bad);
process.exit(bad ? 1 : 0);
