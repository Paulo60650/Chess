/* Construit l'appli à partir des sources.
   Sorties :
     ../index.html        version publiée (GitHub Pages), prête à servir
     ../sw.js             version du cache mise à jour automatiquement (empreinte de index.html)
     apres-ouverture.html fragment de la version publiée (ignoré par git)
     test.html            version de test pour jsdom (nécessite `npm i` dans src/)
   Usage : cd src && node build.js            (ajouter --no-index pour ne pas toucher à ../index.html) */
const fs = require("fs");
const crypto = require("crypto");
const ROOT = __dirname + "/..";
const read = (f) => fs.readFileSync(__dirname + "/" + f, "utf8");
const noIndex = process.argv.includes("--no-index");

const maiaSrc = fs.readFileSync(ROOT + "/maia/worker.js", "utf8");
const dataFiles = ["data.js", "matsdata.js", "stratdata.js", "puzdata.js", "addata.js", "adnew.js", "stnew.js", "lichessdata.js", "coursedata.js", "coursemats.js", "mqdata.js", "punishdata.js", "masterdata.js", "evaldata.js", "egex.js", "eglsec.js"];
const appFiles = ["viz.js", "app.js", "ai.js", "edit.js", "puz.js", "extra.js", "elo.js", "train.js", "wp.js", "plrev.js", "mats.js", "eglessons.js", "egnew.js", "egnew2.js", "explain.js", "strat.js", "ad.js", "mind.js", "master.js", "evalview.js", "plan.js", "backup.js", "home.js"];
const css = read("style.css");
const data = 'var MAIA_WEIGHTS = "maia3-5m.int8.wasm";\nvar MAIA_SRC = ' + JSON.stringify(maiaSrc) + ";\n" + dataFiles.map(read).join("\n");
const core = read("core.js");
const app = appFiles.map(read).join("\n");
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

/* Version publiée : bibliothèque chargée depuis jsDelivr (version fixée), code dans une fonction */
const prod = head(false) +
  `<script src="https://cdn.jsdelivr.net/npm/chess.js@0.10.3/chess.js"></script>\n<script>\n${guard}${data}\n${core}\n${app}\n}\n</script>\n`;
fs.writeFileSync(__dirname + "/apres-ouverture.html", prod);

/* Enveloppe de la page publiée (manifeste, icônes, enregistrement du service worker) */
const PAGE_HEAD = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="theme-color" content="#1f3a2e">';
const PAGE_TAIL = "<script>if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}</script></body></html>";
const page = PAGE_HEAD + prod + PAGE_TAIL;

if (!noIndex) {
  fs.writeFileSync(ROOT + "/index.html", page);
  /* Le cache du service worker change dès que la page change : plus de numéro à incrémenter à la main */
  const hash = crypto.createHash("sha256").update(page).digest("hex").slice(0, 8);
  const swPath = ROOT + "/sw.js";
  const sw = fs.readFileSync(swPath, "utf8");
  const next = sw.replace(/const V='ao-'\+'[^']*';/, "const V='ao-'+'" + hash + "';");
  if (next === sw && !sw.includes("'" + hash + "'")) console.warn("sw.js : ligne de version introuvable, cache non mis à jour");
  fs.writeFileSync(swPath, next);
  console.log("index.html", page.length, "octets ; cache sw", "ao-" + hash);
}

/* Version de test : bibliothèque inline, pas de garde (variables accessibles à jsdom) */
try {
  const chessSrc = fs.readFileSync(__dirname + "/node_modules/chess.js/chess.js", "utf8");
  const test = head(true) + `<script>\n${chessSrc}\n</script>\n<script>\n${data}\n${core}\n${app}\n</script>\n`;
  fs.writeFileSync(__dirname + "/test.html", test);
  console.log("test.html", test.length, "octets");
} catch (e) {
  console.warn("test.html non généré (lance d'abord `npm i` dans src/) :", e.code || e.message);
}
