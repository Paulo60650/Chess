/* ===== Outils visuels façon Lichess sur les fiches de plan =====
   weak : cases faibles (anneau rouge)       out : avant-postes / cases clés (anneau vert)
   files : colonnes à occuper (bande bleue)  diags : diagonales (bande bleue)
   arr : flèches [départ, arrivée, couleur] g = ton plan, r = menace adverse, b = cassure de pion, y = manœuvre à repérer */
const VIZ = {
  "lon-std": { out: ["e5"], weak: ["h7"], diags: [["b1", "h7"]], arr: [["f2", "f4", "b"], ["e3", "e4", "b"], ["d2", "f3", "g"]] },
  "lon-qb6": { weak: ["b3", "d3"], out: ["e5"], files: ["a"], arr: [["b2", "b3", "b"], ["e3", "e4", "b"], ["f3", "e5", "g"]] },
  "lon-kid": { out: ["e4"], files: ["c"], arr: [["e3", "e4", "b"], ["f4", "h2", "g"], ["d1", "c2", "g"], ["g7", "d4", "r"]] },
  "lon-nh5": { weak: ["h7"], files: ["h"], arr: [["d3", "h7", "g"], ["c5", "d4", "r"], ["e3", "e4", "b"]] },
  "lon-bf5": { weak: ["b7"], out: ["e5"], arr: [["d1", "b3", "g"], ["f3", "e5", "g"], ["f5", "e4", "r"]] },
  "lon-qi": { weak: ["h7"], out: ["e5"], arr: [["f3", "e5", "g"], ["d3", "h7", "g"], ["b7", "f3", "r"]] },
  "lon-side": { out: ["f7"], arr: [["f7", "d8", "g"], ["f7", "h8", "g"], ["d6", "f4", "r"]] },
  "lon-ben": { out: ["e4"], weak: ["d6"], arr: [["e4", "e5", "b"], ["f4", "d6", "g"], ["g7", "c3", "r"]] },
  "ita-pian": { out: ["d4"], arr: [["d3", "d4", "b"], ["a2", "a4", "b"], ["g3", "f5", "g"], ["a7", "f2", "r"]] },
  "ita-greco": { weak: ["b7"], files: ["e"], arr: [["b3", "b7", "g"], ["c4", "d5", "g"], ["a4", "a5", "b"]] },
  "ita-slow": { out: ["d5"], arr: [["d3", "d4", "b"], ["g3", "f5", "g"], ["c1", "e3", "g"]] },
  "ita-b4": { weak: ["f7"], arr: [["d3", "d4", "b"], ["c4", "f7", "g"], ["d2", "b3", "g"], ["b6", "f2", "r"]] },
  "ita-evans": { weak: ["f7"], out: ["d5"], arr: [["c4", "f7", "g"], ["g5", "d8", "g"], ["d4", "d5", "b"], ["e4", "e5", "b"], ["b6", "d4", "r"]] },
  "pir-class": { out: ["c5"], weak: ["b6"], files: ["e"], arr: [["d7", "c5", "g"], ["e5", "d4", "b"], ["a5", "a6", "r"]] },
  "pir-bg4": { out: ["d4"], files: ["d"], arr: [["d4", "f3", "g"], ["e3", "d4", "r"], ["d8", "d2", "g"]] },
  "pir-aus": { out: ["d4"], files: ["c"], arr: [["a5", "c3", "g"], ["e4", "e5", "r"], ["f4", "f5", "r"], ["c8", "g4", "g"]] },
  "pir-150": { weak: ["g7"], files: ["b"], arr: [["h6", "h7", "r"], ["b7", "e4", "g"], ["b5", "b4", "b"]] },
  "pir-czech": { weak: ["f4", "d4"], arr: [["a5", "c3", "g"], ["g4", "f3", "g"], ["e5", "f4", "b"], ["b8", "d7", "g"]] },
  "pir-byrne": { weak: ["a2"], files: ["c"], arr: [["a5", "a2", "g"], ["h6", "g7", "r"], ["h4", "h5", "r"], ["g4", "f3", "g"]] },
  "dut-len": { out: ["e4"], weak: ["e6"], files: ["e"], arr: [["e7", "e5", "b"], ["e8", "h5", "g"], ["a6", "c5", "g"], ["f3", "d4", "r"]] },
  "dut-stone": { out: ["e4"], weak: ["e5"], arr: [["f6", "e4", "g"], ["c8", "a6", "g"], ["f3", "e5", "r"]] },
  "dut-class": { weak: ["c3", "c4"], arr: [["e6", "e5", "b"], ["e8", "h5", "g"], ["f6", "e4", "g"]] },
  "dut-hopton": { weak: ["g6"], files: ["e"], arr: [["c6", "c5", "b"], ["d6", "h2", "g"], ["b8", "d7", "g"]] },
  "dut-staunton": { weak: ["d4"], arr: [["e4", "f6", "r"], ["f6", "d4", "g"], ["d7", "d5", "b"]] },
  "dut-lond": { out: ["e4"], weak: ["e5"], diags: [["a8", "h1"]], arr: [["f6", "e4", "g"], ["d7", "d5", "b"], ["f3", "e5", "r"]] },
  "dut-gcl": { out: ["d4"], weak: ["e4"], arr: [["f5", "f4", "b"], ["c6", "d4", "g"], ["e7", "f6", "g"], ["c4", "c5", "r"]] }
};
const VIZ_LAYERS = [
  ["out", "Cases clés", "g"], ["weak", "Cases faibles", "r"], ["files", "Colonnes et diagonales", "b"],
  ["ag", "Ton plan", "g"], ["ar", "Menaces adverses", "r"], ["ab", "Cassures de pions", "b"]
];
const VIZ_COL = { g: "#15781b", r: "#b32020", b: "#1c4fb5", y: "#e68f00" };

function vizXY(sq, orient) {
  const f = "abcdefgh".indexOf(sq[0]), r = Number(sq[1]);
  return orient === "w" ? [f + 0.5, 8 - r + 0.5] : [7 - f + 0.5, r - 0.5];
}
function vizSVG(viz, orient, L) {
  if (!viz) return "";
  const xy = (s) => vizXY(s, orient);
  let s = '<svg class="viz" viewBox="0 0 8 8" aria-hidden="true"><defs>' +
    ["g", "r", "b", "y"].map((c) => '<marker id="ah-' + c + '" markerWidth="3" markerHeight="3" refX="1.9" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 z" fill="' + VIZ_COL[c] + '"/></marker>').join("") + "</defs>";
  if (L.files) {
    (viz.files || []).forEach((f) => { const x = orient === "w" ? "abcdefgh".indexOf(f) : 7 - "abcdefgh".indexOf(f); s += '<rect x="' + x + '" y="0" width="1" height="8" fill="#1c4fb5" opacity=".2"/>'; });
    (viz.diags || []).forEach((d) => { const a = xy(d[0]), b = xy(d[1]); s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#1c4fb5" stroke-width=".5" stroke-linecap="round" opacity=".18"/>'; });
  }
  if (L.weak) (viz.weak || []).forEach((q) => { const p = xy(q); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".42" fill="#b32020" fill-opacity=".18" stroke="#b32020" stroke-width=".08" opacity=".9"/>'; });
  if (L.out) (viz.out || []).forEach((q) => { const p = xy(q); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".42" fill="#15781b" fill-opacity=".18" stroke="#15781b" stroke-width=".08" opacity=".9"/>'; });
  (viz.arr || []).forEach((a) => {
    if (!L["a" + a[2]]) return;
    const p = xy(a[0]), q = xy(a[1]), dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const x1 = p[0] + ux * 0.25, y1 = p[1] + uy * 0.25, x2 = q[0] - ux * 0.5, y2 = q[1] - uy * 0.5;
    s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + VIZ_COL[a[2]] + '" stroke-width=".16" stroke-linecap="round" marker-end="url(#ah-' + a[2] + ')" opacity=".82"/>';
  });
  return s + "</svg>";
}
function vizLegendHTML(viz) {
  const has = { out: viz.out && viz.out.length, weak: viz.weak && viz.weak.length, files: (viz.files && viz.files.length) || (viz.diags && viz.diags.length),
    ag: (viz.arr || []).some((a) => a[2] === "g"), ar: (viz.arr || []).some((a) => a[2] === "r"), ab: (viz.arr || []).some((a) => a[2] === "b") };
  return '<div class="vizbar" role="group" aria-label="Repères sur l\'échiquier">' + VIZ_LAYERS.filter((l) => has[l[0]]).map((l) =>
    '<button class="vz" data-vk="' + l[2] + '" data-act="vlayer" data-id="' + l[0] + '" aria-pressed="' + (!!V.layers[l[0]]) + '"><i></i>' + esc((viz.lab && viz.lab[l[0]]) || l[1]) + "</button>").join("") + "</div>";
}
