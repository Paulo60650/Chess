# Après l'ouverture — appli d'apprentissage des échecs (FR)

Appli web en un seul fichier HTML (6 ouvertures + plans de milieu de jeu, tactiques, finales, concepts stratégiques, entraînement). Installable en PWA (GitHub Pages).

## Structure
- `index.html` : app construite (+ manifeste, service worker). Servie telle quelle par GitHub Pages. Générée par `src/build.js`, ne pas éditer à la main.
- `maia3-5m.int8.wasm` (racine, à côté de index.html) : poids du modèle Maia chargés au premier usage ; `maia/worker.js` : worker Maia, inclus dans la page par le build.
- `sw.js` : service worker. Le nom du cache est mis à jour tout seul par le build (empreinte de index.html).
- `src/` : sources. `node build.js` assemble tout : `../index.html` (page publiée complète), `../sw.js`, `apres-ouverture.html` (fragment) et `test.html` (pour les tests).
- `src/backup.js` : export / import JSON de la progression, fusion entre appareils (aussi utilisée par la synchro du compte).
- `tools/` : scripts d'analyse Stockfish (sf.js, gp.js : coup top-1 et écart, lk.js : plateaux, mkst*.js : génération des concepts de stratégie). Variables : `STOCKFISH` (commande du moteur, défaut `stockfish`), `ST_OUT` (dossier de sortie), `ST_MK` (chemin de mk.js, non versionné), `EVALS_OUT` (src/evpos.js).
- Mise à jour : `cd src && npm i && node build.js`, lancer les tests, commiter `index.html` et `sw.js` avec les sources (la CI vérifie qu'ils sont à jour).

## Tests (jsdom, depuis `src/`, `NODE_PATH=$PWD/node_modules`)
test-backup (sans navigateur, rapide), test-ui (long), test-data, test-ad, test-st, test-egex, test-eglsec, test-li, test-master, test-mind, test-surprise, test-xp, test-act, test-pun, test-srs, test-nav, test-nav2 (longs, lancer en arrière-plan). Vérifier la syntaxe des `<script>` de test.html avec `node --check`.

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
- Rafraîchir les statistiques Lichess des lignes : bloqué, l'explorateur (explorer.lichess.ovh) répond 401 sans jeton. Il faut un jeton Lichess sans aucune portée, lu dans une variable d'environnement (jamais dans le dépôt). Choix en attente : régénérer les commentaires ou seulement les cartes d'info.
- Finales de tours encore absentes : Philidor avancé, tour contre deux pions, 3 contre 2 du même côté, Kasparian.
