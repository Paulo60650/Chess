# Après l'ouverture — appli d'apprentissage des échecs (FR)

Appli web en un seul fichier HTML (6 ouvertures + plans de milieu de jeu, tactiques, finales, concepts stratégiques, entraînement). Installable en PWA (GitHub Pages).

## Structure
- `index.html` : app construite (+ manifeste, service worker). Servie telle quelle par GitHub Pages.
- `src/` : sources. `node build.js` assemble data*.js, core.js et les scripts d'appli en `apres-ouverture.html` + `test.html`.
- `tools/` : scripts d'analyse Stockfish (sf.js, gp.js : coup top-1 et écart, lk.js : plateaux, mkst*.js : génération des concepts de stratégie).
- Mise à jour : `cd src && npm i && node build.js`, lancer les tests, puis régénérer `../index.html` : `apres-ouverture.html` est un fragment, il faut l'entourer de `<!doctype html><html lang="fr"><head>` (meta charset/viewport, link manifest, icônes, theme-color) avant et du script d'enregistrement de `sw.js` + `</html>` après (voir l'actuel index.html) ; incrémenter `V` dans `sw.js`.

## Tests (jsdom, depuis `src/`, `NODE_PATH=$PWD/node_modules`)
test-ui (long), test-data, test-ad, test-st, test-egex, test-eglsec, test-li, test-master, test-mind, test-surprise, test-xp, test-act, test-pun, test-nav, test-nav2 (longs, lancer en arrière-plan). Vérifier la syntaxe des `<script>` de test.html avec `node --check`.

## Règles de contenu
- Tout en français. Notation SAN française (C, F, T, D, R) dans les textes.
- Contenu Chessable : lu seulement, réécrit avec mes propres mots.
- Concepts de stratégie : vraies parties de maîtres, notes vérifiées avec Stockfish ; exercices = coup joué top-1 avec écart ≥ ~20 cp.
- Un exemple résolu avant chaque exercice ; « Voir la solution » rejoue depuis le début.
- Les positions d'un concept doivent vraiment montrer le concept.
- Compte Lichess : Polo60.

## Façon de travailler
- Annoncer le plan et attendre le feu vert pour les gros changements.
- Revue complète avant publication, navigation dans les deux sens comprise.
- Demander en cas de doute.
- FEN invalide (roi manquant ou en échec) : Stockfish s'arrête sans message, toujours valider.
- Dépendances : chess.js 0.10.3 (ancienne API), jsdom.

## TODO (plus tard)
- Concepts de stratégie sans partie source : bon fou contre mauvais cavalier, enfermement de pièce, sacrifice positionnel. Trouver une vraie partie de maître pour chacun (chessgames), notes vérifiées Stockfish, 2–5 exercices, puis ajouter via tools/mkst4.js (modèle) et rebuild.
- Rafraîchir les statistiques Lichess des lignes (choix en attente : régénérer les commentaires ou seulement les cartes d'info).
- Option : remplacer l'exemple Lichess de « d-rendre » par une partie célèbre.
