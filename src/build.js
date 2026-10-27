const fs = require("fs");
const read = (f) => fs.readFileSync(__dirname + "/" + f, "utf8");
const maiaSrc = fs.readFileSync(__dirname + "/../maia/worker.js", "utf8");
const css = read("style.css"), data = "var MAIA_WEIGHTS = \"maia3-5m.int8.wasm\";\nvar MAIA_SRC = " + JSON.stringify(maiaSrc) + ";\n" + read("data.js") + "\n" + read("matsdata.js") + "\n" + read("stratdata.js") + "\n" + read("puzdata.js") + "\n" + read("addata.js") + "\n" + read("adnew.js") + "\n" + read("stnew.js") + "\n" + read("lichessdata.js") + "\n" + read("coursedata.js") + "\n" + read("coursemats.js") + "\n" + read("mqdata.js") + "\n" + read("punishdata.js") + "\n" + read("masterdata.js") + "\n" + read("evaldata.js") + "\n" + read("egex.js") + "\n" + read("eglsec.js"), core = read("core.js"), app = read("viz.js") + "\n" + read("app.js") + "\n" + read("ai.js") + "\n" + read("edit.js") + "\n" + read("puz.js") + "\n" + read("extra.js") + "\n" + read("elo.js") + "\n" + read("train.js") + "\n" + read("wp.js") + "\n" + read("plrev.js") + "\n" + read("mats.js") + "\n" + read("eglessons.js") + "\n" + read("egnew.js") + "\n" + read("egnew2.js") + "\n" + read("explain.js") + "\n" + read("strat.js") + "\n" + read("ad.js") + "\n" + read("mind.js") + "\n" + read("master.js") + "\n" + read("evalview.js") + "\n" + read("plan.js") + "\n" + read("home.js");
const fonts = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
const head = (inlineLib) => `<title>Après l'ouverture</title>
<meta name="claude:viewport-fit-sides" content="cover">
${inlineLib ? "" : `<link rel="stylesheet" href="${fonts}">`}
<style>
${css}
</style>
<div id="app"><p style="padding:24px">Chargement…</p></div>
`;
const guard = `if (typeof Chess === "undefined") { document.getElementById("app").innerHTML = '<p style="padding:24px">Le moteur d\\'échecs n\\'a pas pu se charger. Recharge la page.</p>'; } else {\n`;
// Version publiée : bibliothèque chargée depuis jsDelivr (version fixée), code dans une fonction
const prod = head(false) +
  `<script src="https://cdn.jsdelivr.net/npm/chess.js@0.10.3/chess.js"></script>\n<script>\n${guard}${data}\n${core}\n${app}\n}\n</script>\n`;
fs.writeFileSync(__dirname + "/apres-ouverture.html", prod);
// Version de test : bibliothèque inline, pas de garde (variables accessibles à jsdom)
const chessSrc = fs.readFileSync(__dirname + "/node_modules/chess.js/chess.js", "utf8");
const test = head(true) + `<script>\n${chessSrc}\n</script>\n<script>\n${data}\n${core}\n${app}\n</script>\n`;
fs.writeFileSync(__dirname + "/test.html", test);
console.log("prod", prod.length, "octets ; test", test.length, "octets");
