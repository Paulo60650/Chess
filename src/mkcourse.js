const fs=require("fs");const files=process.argv.slice(2);let all=[];files.forEach(f=>all=all.concat(JSON.parse(fs.readFileSync(f))));
const js="/* Lignes issues de tes cours Chessable (coups uniquement ; commentaires rédigés ici) : générées, ne pas éditer à la main */\nconst COURSE_EXTRA = "+JSON.stringify(all)+";\n"+
`COURSE_EXTRA.forEach((x) => LINES.push(x));
["lon", "ita", "pir", "dut", "bir", "eng"].forEach((op) => {
  if (!COURSE_EXTRA.some((x) => x.op === op)) return;
  const a = CHAPTERS[op], i = a.findIndex((c) => c.id === "pieges");
  a.splice(i < 0 ? a.length : i, 0, { id: "cours", t: "Lignes de tes cours", c: "violet", d: "Variantes tirées des cours Chessable que tu suis, jouées à la place de nos lignes principales quand elles divergent." });
});
`;
fs.writeFileSync("coursedata.js",js);console.log(all.length);
