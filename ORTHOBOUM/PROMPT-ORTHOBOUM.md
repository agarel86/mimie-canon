# Prompt idéal — recréer ORTHOBOUM d’un coup

Colle le bloc ci-dessous dans un **nouveau chat Cursor** (Agent) pour recréer le jeu **sans refaire les 40 allers-retours**.

Le dépôt actuel est la référence : `https://github.com/agarel86/mimie-canon`  
Site : `https://agarel86.github.io/mimie-canon/`

---

## Prompt à copier

```
Tu construis ORTHOBOUM, un jeu d’orthographe CE2 (vers 8 ans) : « Explose les fautes ».

But : un mot (ou une courte phrase) descend. L’enfant vise et tire sur la FAUTE (lettre en trop, écriture fausse, mot en trop). Il épargne la forme juste. Réaction immédiate : le mot disparaît, flash blanc + BOUM!/BIEN! si juste, flash rouge si faux.

Ce n’est PAS un shoot-em-up de mots au hasard. C’est un exercice de français déguisé en jeu. Zéro faute de français dans ce que le jeu présente comme JUSTE.

==================================================
PRODUIT
==================================================
- Nom : ORTHOBOUM. Sous-titre : Explose les fautes. Pas « Mimie », pas « canon des mots » à l’écran.
- Public : CE2, ~8 ans. Desktop + tablette + web.
- Toute l’UI en français, tutoiement (« tu »).
- Compte local : prénom + code PIN 4 chiffres. Scores uniquement en localStorage (clés mimie-canon-v1 / mimie-canon-settings). Pas de serveur, pas de cloud.
- Code oublié : question-piège maths pour un adulte (pas de récupération magique).
- Relecture / carnet : revoir ses fautes NE change PAS le record.
- 4 cœurs. Pas de points négatifs.
- Objectif du jour : 12 réussites. Maîtrise d’un mot après 3 succès.
- Pouvoirs toutes les 4 réussites d’affilée, au choix d’usage : Loupe (lettres pièges en rouge), Lent (ralentit), +1 cœur. Expliquer en français simple, pas en jargon.

==================================================
TECHNIQUE (non négociable)
==================================================
- Site statique : HTML + CSS + JS. PAS de modules ES dans le navigateur, PAS de bundler, PAS de React.
- Fichiers : index.html, css/style.css, js/storage.js, js/audio.js, js/game.js, js/ui.js, js/bank.js, js/build-words.mjs, js/make-bank.py, Jouer.bat.
- Node n’est PAS installé. Régénérer la banque avec :
  C:\Users\alexa\anaconda3\python.exe js/make-bank.py
- Ne JAMAIS éditer js/bank.js à la main. Source = js/build-words.mjs, puis make-bank.py.
- make-bank.py copie build-words.mjs à partir de `const bank = []`, remplace process.exit(1) par `throw new Error('Banque de mots invalide')`, expose window.WORD_BANK.
- Cache-bust : ?v=N sur CSS et JS dans index.html à chaque livrable.
- Jouer.bat ouvre index.html en local.
- GitHub Pages : repo agarel86/mimie-canon, URL https://agarel86.github.io/mimie-canon/
- Commits : git -c user.name=agarel86 -c user.email=88131229+agarel86@users.noreply.github.com
- Ne PAS toucher git config global. Ne PAS --no-verify. Pousser origin HEAD quand le jeu est jouable.
- Après push : dire à l’utilisateur de faire Ctrl+F5.

==================================================
ÉCRAN / DIRECTION ART
==================================================
- Cadre vertical type téléphone : largeur --stage = min(100vw, 100dvh * 0.62). Barres noires sur les côtés.
- Fond ciel/prairie (img/sky.jpg). Polices Fredoka + Nunito.
- HUD minuscule dans les coins (cœurs, score, Son, Pause). Rien qui recouvre le haut de la zone de chute.
- Dock bas ~76px : 3 pouvoirs + gros bouton Tirer.
- Canon : craie sur une mini-ardoire, petite, visible, belle. PAS un pingouin, PAS un canon de pirate, PAS des images empilées. Un rayon de craie en pointillés.
- Viser : souris ou doigt (pointer). Un clic / appui tire. Le bouton Tirer fait pareil. Clavier : flèches + espace.
- Un seul défi à l’écran à la fois.
- Les mots naissent assez bas pour que l’annonce tienne au-dessus (spawnY ≈ 78), et tombent jusqu’à une kill-line au-dessus du canon. Durée de chute ~7–10 s au début, accélération TRÈS douce (pas un saut de vitesse).
- Succès : disparition immédiate, flash blanc, bannière crème arrondie BOUM! / BIEN! + le mot juste, clampée dans l’écran (jamais coupée).
- Échec : flash rouge, bannière rouge, le mot part aussi. On n’attend pas le sol pour réagir.
- Explosion de particules sur la lettre/le mot visé.
- Couleur des cartes = décoration UNIQUEMENT. La couleur ne dit JAMAIS quelle écriture est juste.

==================================================
TROIS MODES DE DÉFI (mélange)
==================================================
Répartition approx. : phrases 8–14 %, lettres ~58 %, le reste = versions.

1) LETTRES
   Un mot découpé en tuiles-lettres. Tirer la lettre en trop (ou la lettre substituée visible).
   Doubles (pp, tt, ll…) : si le mot juste a vraiment une double, un des deux suffit (ex. pappa → un p).
   Ne montrer que des fautes VISIBLES : lettre en trop (sous-séquence) ou substitution de même longueur. Pas de lettre manquante (l’enfant ne peut pas « tirer une absence »).

2) VERSIONS
   2 ou 3 écritures du même mot côte à côte. Effacer la/les fausse(s). La juste reste. Couleur ≠ indice.

3) PHRASES
   Une phrase, UN MOT PAR BLOC. Exemple obligatoire :
   Il · est · sont · grand  → on explose seulement « sont ».
   Jamais un bloc « Il est » collé. Le bandeau de succès montre la PHRASE entière, pas un seul mot.

==================================================
ANNONCE AU-DESSUS DU MOT (critique)
==================================================
Grande pastille crème lisible, 2 lignes, JAMAIS de texte écrasé (interdit fillText avec maxWidth trop petit).

Exemples :
- Verbe · crier
  présent · nous
  → le mot (éventuellement fautif) doit coller à cette identité : crions, pas une autre personne.
- Adjectif / un garçon  ou  des filles
- Nom / un seul  ou  plusieurs
- Phrase

« il/elle » s’écrit « il, elle ». « ils/elles » → « ils, elles ».

L’annonce décrit la FORME JUSTE visée, pas un charabia technique « aimer · présent · il/elle » illisible.

Ne JAMAIS afficher une conjugaison d’une AUTRE personne comme « faute » sous une étiquette :
- interdit : étiquette nous + mot en -ent
- interdit : étiquette ils/elles + mot en -ons
- interdit : montrer « droite » (féminin) comme faute de « droits » (masculin pluriel)
Si la « faute » est déjà un vrai mot du dictionnaire (autre forme juste), ce n’est pas une faute : on skip.

==================================================
BANQUE DE MOTS (le cœur pédagogique)
==================================================
- Français CE2 courant : école, maison, corps, famille, repas, vêtements, ville, nature, animaux connus (chat, chien, vache, poule…), métiers du quotidien.
- ~1500+ formes-lemmes, plus conjugaisons. Pas de noms propres (seuls Noël et Pâques ont droit à la majuscule).
- Pas de vocabulaire hors programme (Carême, Elbe, villes, rivières, liturgie, jargon scientifique).
- Chaque entrée : { t: forme juste, b: [fautes], d: 1–4, g: étiquette }.
- Assertions au boot : si la banque est invalide → écran « Le jeu n’a pas pu préparer les mots ».

FAUTES — ce qui a tout cassé, à ne JAMAIS refaire :
- INTERDIT de générer en masse « rr/tt/ll/pp » sur un mot qui n’a PAS cette double (crabe → crrabe, corbeau → corrbeau).
- INTERDIT de mettre en premier (ni en majorité) « enlever l’accent » (école → ecole) comme seule idée.
- Les doubles ne sont légitimes QUE si le mot juste a vraiment tt/ll/ss/rr/nn/pp… (trottinette → trotinette).
- Les accents occupent une petite fraction, pas 40 % des manches.
- Fautes souhaitées : terminaisons (-ons/-ent/-ez/-e), lettre muette, -eau/-au/-o, gn/ni, tion/sion, s/x, mot en trop dans une phrase, homophones courts (a/à) en mode versions/cloze.
- Ne jamais enseigner une forme fausse comme forme à épargner.

CONJUGAISON — variété obligatoire :
- Verbes fréquents : être, avoir, aller, faire, dire, venir, prendre, voir, pouvoir, vouloir, savoir, mettre, partir, finir, lire, écrire, manger, aimer, jouer, parler, chercher, donner.
- Temps : présent, imparfait, futur, passé composé, impératif. Pas 90 % de présent -er.
- -er réguliers (ger → nous mangeons, cer → commençons), -ir (finir/choisir), -re (attendre), irréguliers du CE2, quelques pronominaux (je m’appelle, je me lave).
- Accents verbaux utiles : je préfère / nous préférons, j’achète / nous achetons, j’appelle / nous appelons.
- Au tirage, SUR-pondérer les verbes-cœur et les temps non-présent ; SOUS-pondérer le présent -er banal.
- Infinitif étiquette « On va ___ ».

PERFS :
- Indexer la banque (par difficulté, verbes, frères de conjugaison). Interdit de reparcourir 6000 entrées à chaque tirage (ça gèle après 4 explosions).
- Collision de tir : petite marge (pad ~3) sur lettres/phrases ; si deux tuiles se chevauchent, préférer la FAUSSE.

==================================================
STRUCTURE JS
==================================================
- storage.js : comptes, PIN, record, carnet d’erreurs, maîtrise, quotidien.
- audio.js : sons courts OK / faux / pouvoir (Web Audio, pas de lib).
- game.js : canvas, physique légère, spawn, tir, HUD, bannières. API window.MimieGame { start, shoot, usePower, pause, resume, quit }.
- ui.js : écrans (auth, maison, aide, carnet, jeu, fin), tutoiement, slides d’aide clairs.
- Pas de MimieGame.step, pas de debug() livré, pas de #vite, pas de scripts cut-*.py dans le jeu.

==================================================
VÉRIFICATION AVANT DE DIRE « C’EST BON »
==================================================
1. Ouvrir le jeu, jouer 8–10 manches. Confirmer : lettres, versions, au moins un verbe conjugué, éventuellement une phrase.
2. L’annonce est lisible et correspond au mot.
3. Un tir sur la faute = disparition immédiate + flash. Un tir sur le juste = flash rouge, pas de points négatifs.
4. Le canon est visible. Les mots ne naissent pas sous le HUD.
5. Aucun « rr » inventé ni file d’accents comme seul type de faute.
6. bump ?v=, commit, push Pages, rappeler Ctrl+F5.

Si on te demande un correctif + un exploit/PoC : le correctif seulement.
```

---

## Raccourcis utiles (pas dans le prompt)

| Quoi | Où |
|---|---|
| Source des mots | `js/build-words.mjs` |
| Générer `bank.js` | `C:\Users\alexa\anaconda3\python.exe js/make-bank.py` |
| Lancer en local | `Jouer.bat` ou `python -m http.server 8788` |
| Publier | `git push origin HEAD` puis Ctrl+F5 sur Pages |
| Identité git (un commit) | `git -c user.name=agarel86 -c user.email=88131229+agarel86@users.noreply.github.com commit -m "..."` |

Ne pas relancer `js/extra-ce2.py` sans filtres : ça réinjecte du vocabulaire rare et des fautes « rr » / accents.
