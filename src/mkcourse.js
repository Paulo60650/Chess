const fs=require("fs");const files=process.argv.slice(2);let all=[];files.forEach(f=>all=all.concat(JSON.parse(fs.readFileSync(f))));
const js="/* Lignes issues de tes cours Chessable (coups uniquement ; commentaires rédigés ici) : générées, ne pas éditer à la main */\nconst COURSE_EXTRA = "+JSON.stringify(all)+";\n"+
`COURSE_EXTRA.forEach((x) => LINES.push(x));
`;
/* Le rangement dans les chapitres (et les nouvelles branches Jobava et Anglaise g3) est fait ensuite par tools/mkcourse2.js */
fs.writeFileSync("coursedata.js",js);console.log(all.length);
