/* Banque CE2 executee dans le navigateur. */
const bank = [];
const skipped = [];

function noAccent(s) {
  return s
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueWrongs(correct, wrongs) {
  const out = [];
  for (const raw of wrongs) {
    if (!raw) continue;
    const w = String(raw).trim();
    if (!w || w === correct || out.includes(w)) continue;
    out.push(w);
  }
  return out;
}

function enrich(correct, wrongs) {
  const extra = noAccent(correct);
  return uniqueWrongs(correct, [...wrongs, extra === correct ? null : extra]);
}

function addItem(t, wrongs, d, g) {
  const b = enrich(t, wrongs);
  if (!b.length) {
    skipped.push(t + " | " + g);
    return;
  }
  bank.push({ t, b, d, g });
}

const MUTE_H_PREFIX = /^(habit|hirond|herbe|heure|honn|hum)/i;

function withJe(form, inf = "") {
  if (!form || form.startsWith("j'")) return form;
  if (/^h/i.test(form)) {
    if (MUTE_H_PREFIX.test(form) || MUTE_H_PREFIX.test(inf)) return "j'" + form;
    return form;
  }
  if (/^[aeiouàâäéèêëîïôöùûüœæ]/i.test(form)) return "j'" + form;
  return form;
}

function addConj(inf, tense, person, form, wrongs, d, elide = true) {
  let shown = form;
  let bads = wrongs.slice();
  if (elide && person.startsWith("je")) {
    shown = withJe(form, inf);
    bads = bads.map((w) => withJe(w, inf));
    if (shown.startsWith("j'")) {
      bads.push(shown.slice(2));
      bads.push("j" + shown.slice(2));
    }
  }
  // L'infinitif est déjà écrit dans l'étiquette : ce n'est pas une faute lisible.
  bads = bads.filter((w) => w !== inf && w !== "j'" + inf);
  addItem(shown, bads, d, `${inf} · ${tense} · ${person}`);
}

function presentEr(inf) {
  const stem = inf.slice(0, -2);
  let nous = stem + "ons";
  if (inf.endsWith("ger") && !inf.endsWith("guer")) nous = stem + "eons";
  if (inf.endsWith("cer")) nous = stem.slice(0, -1) + "çons";
  const je = stem + "e";
  const tu = stem + "es";
  const il = stem + "e";
  const vous = stem + "ez";
  const ils = stem + "ent";
  return [
    ["je", je, [tu, ils, stem, inf]],
    ["tu", tu, [je, stem + "est", stem + "s"]],
    ["il/elle", il, [tu, ils, stem + "t"]],
    ["nous", nous, [stem + "ons", ils, stem + "on", stem + "eons"]],
    ["vous", vous, [inf, stem + "é", stem + "ezz", stem + "er"]],
    ["ils/elles", ils, [je, tu, stem + "ents", stem + "e"]],
  ];
}

function pushRows(inf, tense, rows, d, elide = true) {
  for (const [person, form, bad] of rows) addConj(inf, tense, person, form, bad, d, elide);
}

function addRegularPresent(inf, d = 2) {
  pushRows(inf, "présent", presentEr(inf), d);
}

/** é + consonne(s) + er : je préfère / nous préférons, je règle / nous réglons */
function presentEAcute(inf) {
  const stem = inf.slice(0, -2);
  const accent = stem.lastIndexOf("é");
  if (accent < 0) throw new Error("Pas de é dans " + inf);
  const stemE = stem.slice(0, accent) + "è" + stem.slice(accent + 1);
  const je = stemE + "e";
  const tu = stemE + "es";
  const il = stemE + "e";
  const nous = stem + "ons";
  const vous = stem + "ez";
  const ils = stemE + "ent";
  return [
    ["je", je, [stem + "e", tu, ils]],
    ["tu", tu, [je, stem + "es"]],
    ["il/elle", il, [stem + "e", tu]],
    ["nous", nous, [stemE + "ons", ils]],
    ["vous", vous, [stemE + "ez", inf]],
    ["ils/elles", ils, [je, stem + "ent"]],
  ];
}

/** e + consonne + er : j'achète / nous achetons */
function presentEMute(inf) {
  const stem = inf.slice(0, -2);
  const head = stem.slice(0, -2);
  const last = stem.slice(-1);
  const eStem = head + "è" + last;
  const je = eStem + "e";
  const tu = eStem + "es";
  const nous = stem + "ons";
  const vous = stem + "ez";
  const ils = eStem + "ent";
  return [
    ["je", je, [stem + "e", tu, head + "é" + last + "e"]],
    ["tu", tu, [je, stem + "es"]],
    ["il/elle", je, [tu, stem + "e"]],
    ["nous", nous, [eStem + "ons", ils]],
    ["vous", vous, [eStem + "ez", inf]],
    ["ils/elles", ils, [je, stem + "ent"]],
  ];
}

function addTable(inf, tense, forms, wrongs, d, elide = true) {
  const persons = ["je", "tu", "il/elle", "nous", "vous", "ils/elles"];
  forms.forEach((form, i) => addConj(inf, tense, persons[i], form, wrongs[i] || [], d, elide));
}

function addFutur(inf, stem, d, alts = []) {
  const ends = [
    ["je", "ai"],
    ["tu", "as"],
    ["il/elle", "a"],
    ["nous", "ons"],
    ["vous", "ez"],
    ["ils/elles", "ont"],
  ];
  for (const [person, end] of ends) {
    const form = stem + end;
    const wrongs = [];
    if (end === "ai") wrongs.push(stem + "ais", stem + "as", stem + "a");
    if (end === "as") wrongs.push(stem + "a", stem + "ai");
    if (end === "a") wrongs.push(stem + "as", stem + "at");
    if (end === "ons") wrongs.push(stem + "ont", stem + "on");
    if (end === "ez") wrongs.push(stem + "er", stem + "é");
    if (end === "ont") wrongs.push(stem + "ons", stem + "ent");
    if (stem.endsWith("er")) wrongs.push(stem.slice(0, -1) + end);
    for (const alt of alts) wrongs.push(alt + end);
    addConj(inf, "futur", person, form, wrongs, d);
  }
}

function imparfaitForm(stem, ending) {
  let s = stem;
  if (s.endsWith("ge") && ending.startsWith("i")) s = s.slice(0, -1);
  if (s.endsWith("ç") && /^[ie]/.test(ending)) s = s.slice(0, -1) + "c";
  return s + ending;
}

function addImparfait(inf, nousForm, d = 4) {
  if (!nousForm.endsWith("ons")) throw new Error("Imparfait, nous inattendu : " + inf + " " + nousForm);
  const stem = nousForm.slice(0, -3);
  const je = imparfaitForm(stem, "ais");
  const il = imparfaitForm(stem, "ait");
  const nous = imparfaitForm(stem, "ions");
  const vous = imparfaitForm(stem, "iez");
  const ils = imparfaitForm(stem, "aient");
  pushRows(inf, "imparfait", [
    ["je", je, [il, stem + "é", stem + "er"]],
    ["tu", je, [il, stem + "é"]],
    ["il/elle", il, [je, stem + "é", stem + "aît"]],
    ["nous", nous, [ils, stem + "ons", stem + "ion"]],
    ["vous", vous, [stem + "ez", stem + "ier", ils]],
    ["ils/elles", ils, [il, je, stem + "aients"]],
  ], d);
}

function addImp(inf, tu, nous, vous, d, wtu, wnous, wvous) {
  addConj(inf, "impératif", "tu", tu, wtu, d, false);
  addConj(inf, "impératif", "nous", nous, wnous, d, false);
  addConj(inf, "impératif", "vous", vous, wvous, d, false);
}

function addPasseAvoir(inf, part, d = 3) {
  const bare = noAccent(part);
  pushRows(inf, "passé composé", [
    ["je", "ai " + part, ["ai " + inf, "ai " + bare, "suis " + part, "ai " + part + "s", "ai " + part + "e"]],
    ["tu", "as " + part, ["a " + part, "as " + inf, "as " + bare, "es " + part]],
    ["il/elle", "a " + part, ["as " + part, "a " + inf, "à " + part, "est " + part, "a " + bare]],
    ["nous", "avons " + part, ["avons " + inf, "ont " + part, "avons " + bare, "sommes " + part]],
    ["vous", "avez " + part, ["avez " + inf, "avait " + part, "avez " + bare]],
    ["ils/elles", "ont " + part, ["on " + part, "ont " + inf, "sont " + part, "ont " + bare]],
  ], d);
}

function addPasseEtre(inf, m, f, mp, fp, d = 3) {
  pushRows(inf, "passé composé", [
    ["je · garçon", "suis " + m, ["suis " + f, "suis " + inf, "ai " + m, "suis " + noAccent(m)]],
    ["je · fille", "suis " + f, ["suis " + m, "suis " + inf, "ai " + f, "suis " + noAccent(f)]],
    ["tu · garçon", "es " + m, ["es " + f, "est " + m, "es " + inf]],
    ["tu · fille", "es " + f, ["es " + m, "est " + f, "es " + inf]],
    ["il", "est " + m, ["est " + f, "a " + m, "et " + m, "est " + inf]],
    ["elle", "est " + f, ["est " + m, "a " + f, "est " + inf]],
    ["nous · garçons", "sommes " + mp, ["sommes " + m, "sommes " + fp, "avons " + mp, "sommes " + inf]],
    ["nous · filles", "sommes " + fp, ["sommes " + mp, "sommes " + f, "sommes " + inf]],
    ["ils", "sont " + mp, ["sont " + m, "ont " + mp, "son " + mp, "sont " + inf]],
    ["elles", "sont " + fp, ["sont " + mp, "sont " + f, "ont " + fp]],
  ], d);
}

function addInfinitif(inf, wrongs, d = 3) {
  addItem(inf, wrongs, d, "On va ___");
}

// ---------------------------------------------------------------------------
// Lexique
// ---------------------------------------------------------------------------

const LEX = [
  // École — fautes d'accent évidentes
  ["école", ["écolle", "écoule"], 1, "école"],
  ["élève", ["éleve", "élefe"], 1, "école"],
  ["maître", ["mètre", "métaire"], 2, "à l'école"],
  ["maîtresse", ["métaisse", "maitrèse"], 2, "à l'école"],
  ["cahier", ["cahié", "caillé"], 1, "école"],
  ["crayon", ["créyon", "craillon"], 1, "école"],
  ["trousse", ["trouse", "trousse"], 1, "école"],
  ["gomme", ["gome", "gomme"], 1, "école"],
  ["règle", ["régle", "règgle"], 1, "école"],
  ["cartable", ["cartabe", "cartaple"], 1, "école"],
  ["ardoise", ["ardoise", "ardoize"], 2, "école"],
  ["tableau", ["tablau", "tableaud"], 1, "école"],
  ["récréation", ["récreation", "récréassion"], 2, "école"],
  ["bibliothèque", ["bibliotèque", "bibliothèque"], 2, "école"],
  ["dictionnaire", ["dictionaire", "dictionère"], 2, "école"],
  ["exercice", ["éxercice", "exercisse"], 2, "école"],
  ["leçon", ["lecon", "léçon"], 1, "école"],
  ["devoir", ["devoire", "dévoir"], 2, "école"],
  ["lecture", ["lècture", "lecturre"], 2, "école"],
  ["poésie", ["poesie", "poèzie"], 2, "école"],
  ["histoire", ["istoire", "histoir"], 1, "école"],
  ["géographie", ["geografie", "géografie"], 3, "école"],
  ["sciences", ["siences", "sciences"], 2, "école"],
  ["dessin", ["dessain", "décin"], 1, "école"],
  ["musique", ["muzique", "musike"], 2, "école"],
  ["camarade", ["cammarade", "camarade"], 2, "école"],
  ["professeur", ["profeseur", "proffesseur"], 2, "école"],
  ["classe", ["clase", "clace"], 1, "école"],
  ["stylo", ["stilo", "stilot"], 1, "école"],
  ["feutre", ["feuttre", "feutre"], 2, "école"],
  ["colle", ["cole", "colle"], 1, "école"],
  ["ciseaux", ["ciseau", "cizeaux"], 2, "école · plusieurs"],
  ["équerre", ["equerre", "écaire"], 3, "école"],
  ["compas", ["compas", "comptas"], 2, "école"],
  ["taille-crayon", ["taille crayon", "taille-craillon"], 2, "école"],
  ["affichage", ["afichage", "affichage"], 2, "école"],
  ["question", ["kestion", "queston"], 2, "école"],
  ["réponse", ["reponse", "réponce"], 1, "école"],
  ["exemple", ["exempe", "égzemple"], 2, "école"],
  ["phrase", ["frase", "phraze"], 2, "école"],
  ["orthographe", ["ortographe", "orthografe"], 2, "école"],
  ["accueil", ["acceuil", "acueuil"], 2, "école"],
  ["directeur", ["directeure", "direkteur"], 3, "école"],
  ["directrice", ["directive", "directrisse"], 3, "école"],

  // Famille
  ["famille", ["famile", "famie"], 1, "famille"],
  ["père", ["péren", "pèrre"], 1, "famille"],
  ["mère", ["mer", "maire"], 2, "maman"],
  ["parents", ["parent", "parants"], 2, "famille · plusieurs"],
  ["frère", ["frere", "frèrre"], 1, "famille"],
  ["sœur", ["seur", "soeure"], 1, "famille"],
  ["grand-père", ["grand père", "grand-péren"], 2, "famille"],
  ["grand-mère", ["grand mère", "grand-mer"], 2, "famille"],
  ["bébé", ["bebe", "bébée"], 1, "famille"],
  ["oncle", ["onkle", "onque"], 2, "famille"],
  ["tante", ["tente", "thante"], 2, "famille"],
  ["cousin", ["couzin", "cousain"], 2, "famille"],
  ["cousine", ["couzine", "cousinne"], 2, "famille"],
  ["enfant", ["anfant", "enfant"], 1, "famille"],
  ["garçon", ["garcon", "garssont"], 1, "famille"],
  ["fille", ["file", "fille"], 1, "famille"],
  ["maman", ["mamanne", "mament"], 1, "famille"],
  ["papa", ["papat", "pappa"], 1, "famille"],
  ["jumeau", ["jumo", "jumot"], 3, "famille"],
  ["jumelle", ["jumèle", "jumelle"], 3, "famille"],

  // Maison
  ["maison", ["maizon", "mèson"], 1, "maison"],
  ["appartement", ["apartement", "appartemant"], 2, "maison"],
  ["chambre", ["chambre", "cheambre"], 1, "maison"],
  ["cuisine", ["cuizine", "cuisine"], 1, "maison"],
  ["salon", ["salont", "çalont"], 1, "maison"],
  ["jardin", ["jarden", "jardin"], 1, "maison"],
  ["fenêtre", ["fenetre", "fénètre"], 1, "maison"],
  ["porte", ["porte", "portte"], 1, "maison"],
  ["toit", ["tois", "toît"], 2, "maison"],
  ["escalier", ["èscalié", "escalié"], 2, "maison"],
  ["lit", ["li", "lit"], 1, "maison"],
  ["table", ["tabl", "table"], 1, "maison"],
  ["chaise", ["chaize", "chèze"], 1, "maison"],
  ["armoire", ["armoir", "armoère"], 2, "maison"],
  ["lampe", ["lante", "lambe"], 1, "maison"],
  ["miroir", ["miroire", "mirroir"], 2, "maison"],
  ["rideau", ["rido", "ridot"], 2, "maison"],
  ["coussin", ["coussain", "coucin"], 2, "maison"],
  ["tapis", ["tapi", "tappis"], 2, "maison"],
  ["assiette", ["asiette", "aciette"], 2, "maison"],
  ["verre", ["vert", "ver"], 2, "pour boire"],
  ["fourchette", ["fourchete", "fourchète"], 2, "maison"],
  ["couteau", ["couto", "coutot"], 2, "maison"],
  ["cuillère", ["cuillere", "cuilière"], 2, "maison"],
  ["casserole", ["caserole", "cacérole"], 2, "maison"],
  ["réfrigérateur", ["refrigerateur", "réfrigérateure"], 3, "maison"],
  ["escalier", ["escalié", "eskalier"], 2, "maison"],
  ["clé", ["clef", "clée"], 2, "maison"],
  ["serrure", ["sérure", "serrurre"], 3, "maison"],
  ["balai", ["balais", "ballai"], 2, "maison"],
  ["poubelle", ["poubele", "poubèle"], 2, "maison"],
  ["serviette", ["serviete", "serviète"], 2, "maison"],
  ["oreiller", ["oreilier", "oreillé"], 2, "maison"],
  ["couverture", ["couverturre", "couvérture"], 2, "maison"],
  ["salle", ["sale", "sal"], 2, "une pièce"],
  ["sale", ["salle", "sal"], 2, "pas propre"],

  // Corps
  ["tête", ["téte", "tète"], 1, "corps"],
  ["cheveux", ["cheveu", "cheveus"], 2, "corps · plusieurs"],
  ["visage", ["visaje", "vizage"], 2, "corps"],
  ["œil", ["yeux", "eui"], 2, "corps · un seul"],
  ["yeux", ["œil", "yeus"], 2, "corps · plusieurs"],
  ["oreille", ["oreil", "oreye"], 1, "corps"],
  ["nez", ["né", "nés"], 1, "corps"],
  ["bouche", ["boucche", "bouje"], 1, "corps"],
  ["dent", ["dan", "dents"], 2, "corps · une seule"],
  ["langue", ["lange", "lague"], 2, "corps"],
  ["cou", ["coup", "coux"], 2, "corps"],
  ["épaule", ["epaule", "épaulle"], 1, "corps"],
  ["bras", ["bra", "brats"], 1, "corps"],
  ["main", ["maint", "mains"], 2, "corps · une seule"],
  ["doigt", ["doit", "doight"], 2, "corps"],
  ["ventre", ["venttre", "vantr"], 1, "corps"],
  ["dos", ["dau", "do"], 1, "corps"],
  ["jambe", ["jamme", "jente"], 1, "corps"],
  ["genou", ["genoux", "jenou"], 2, "corps · un seul"],
  ["genoux", ["genous", "genou"], 3, "corps · plusieurs"],
  ["pied", ["pie", "piéd"], 1, "corps"],
  ["cœur", ["cueur", "coeure"], 1, "corps"],
  ["corps", ["cor", "corp"], 2, "corps"],
  ["doigt", ["doi", "doigs"], 2, "corps"],
  ["cheville", ["chevile", "chéville"], 2, "corps"],
  ["poignet", ["poignét", "poiniet"], 3, "corps"],
  ["front", ["frond", "fron"], 2, "corps"],
  ["joue", ["jou", "joue"], 2, "corps"],
  ["lèvre", ["lévre", "lèvre"], 2, "corps"],
  ["sang", ["sans", "cent"], 3, "dans le corps"],
  ["foie", ["fois", "foi"], 4, "dans le corps"],
  ["os", ["au", "oh"], 3, "dans le corps"],
  ["peau", ["pot", "péau"], 2, "corps"],
  ["ongle", ["ongl", "ongle"], 2, "corps"],

  // Vêtements
  ["pantalon", ["pantalont", "pentalon"], 1, "vêtement"],
  ["jupe", ["juppe", "jupe"], 1, "vêtement"],
  ["robe", ["robbe", "raube"], 1, "vêtement"],
  ["chemise", ["chemize", "chemmise"], 2, "vêtement"],
  ["pull", ["pule", "pulle"], 2, "vêtement"],
  ["manteau", ["manto", "manteaud"], 1, "vêtement"],
  ["chaussure", ["chausure", "chaussûre"], 1, "vêtement"],
  ["chaussette", ["chausette", "chaussete"], 1, "vêtement"],
  ["bonnet", ["bonet", "bonnè"], 1, "vêtement"],
  ["écharpe", ["echarpe", "écharppe"], 1, "vêtement"],
  ["gant", ["gand", "gans"], 2, "vêtement"],
  ["ceinture", ["ceinturre", "cinture"], 2, "vêtement"],
  ["pyjama", ["pijama", "pyjamat"], 2, "vêtement"],
  ["maillot", ["maio", "malliot"], 2, "vêtement"],
  ["bouton", ["boutton", "boutont"], 2, "vêtement"],
  ["poche", ["poche", "poshe"], 2, "vêtement"],
  ["casquette", ["casquete", "casquète"], 2, "vêtement"],

  // Repas
  ["pain", ["peint", "pin"], 2, "repas"],
  ["gâteau", ["gateau", "gatto"], 1, "repas"],
  ["chocolat", ["chocola", "chokola"], 1, "repas"],
  ["bonbon", ["bombon", "bonbon"], 1, "repas"],
  ["fruit", ["frui", "frut"], 1, "repas"],
  ["pomme", ["pome", "pomme"], 1, "repas"],
  ["poire", ["poir", "poiare"], 1, "repas"],
  ["fraise", ["fraize", "frèze"], 1, "repas"],
  ["cerise", ["cérise", "cerize"], 1, "repas"],
  ["banane", ["bananne", "banane"], 1, "repas"],
  ["orange", ["orenge", "oranje"], 1, "fruit"],
  ["citron", ["citronn", "sitron"], 2, "fruit"],
  ["raisin", ["raizin", "rèsain"], 2, "fruit"],
  ["légume", ["legume", "légumme"], 1, "repas"],
  ["carotte", ["carote", "carotte"], 1, "repas"],
  ["tomate", ["tomatte", "tomate"], 1, "repas"],
  ["salade", ["salade", "sallade"], 1, "repas"],
  ["soupe", ["soupe", "souppe"], 1, "repas"],
  ["viande", ["viande", "viende"], 2, "repas"],
  ["poisson", ["poissont", "poison"], 1, "repas"],
  ["œuf", ["euf", "euve"], 1, "repas"],
  ["fromage", ["fromaje", "frommage"], 1, "repas"],
  ["yaourt", ["yourt", "yaourte"], 2, "repas"],
  ["lait", ["lai", "lé"], 1, "repas"],
  ["confiture", ["confiturre", "confiture"], 2, "repas"],
  ["beurre", ["beure", "beurre"], 1, "repas"],
  ["miel", ["miel", "mielle"], 2, "repas"],
  ["riz", ["ri", "ris"], 2, "repas"],
  ["pâtes", ["pates", "pattes"], 2, "on les mange"],
  ["crêpe", ["crepe", "crèpe"], 1, "repas"],
  ["tarte", ["tartte", "tarte"], 2, "repas"],
  ["glace", ["glasse", "glace"], 1, "repas"],
  ["biscuit", ["bisqui", "biscui"], 2, "repas"],
  ["sandwich", ["sandwish", "centwiche"], 3, "repas"],
  ["goûter", ["gouter", "goté"], 2, "repas"],
  ["déjeuner", ["dejeuner", "déjeuné"], 2, "repas"],
  ["dîner", ["diner", "diné"], 2, "repas"],
  ["pâte", ["patte", "pat"], 3, "à modeler ou à tarte"],
  ["patte", ["pâte", "pate"], 2, "d'un animal"],
  ["pomme de terre", ["pomme de tere", "pomme de terre"], 2, "légume"],
  ["eau", ["au", "oh"], 1, "on la boit"],

  // Animaux
  ["chat", ["cha", "shat"], 1, "animal"],
  ["chien", ["chiens", "chient"], 1, "animal · un seul"],
  ["oiseau", ["oizo", "wazo"], 1, "animal"],
  ["oiseaux", ["oiseaus", "oiseau"], 3, "animal · plusieurs"],
  ["cheval", ["chevaux", "chevals"], 2, "animal · un seul"],
  ["chevaux", ["chevals", "cheval"], 3, "animal · plusieurs"],
  ["vache", ["vach", "vache"], 1, "animal"],
  ["mouton", ["moutont", "mouton"], 1, "animal"],
  ["cochon", ["cochont", "cochon"], 1, "animal"],
  ["poule", ["poule", "poul"], 1, "animal"],
  ["coq", ["coque", "koc"], 2, "animal"],
  ["lapin", ["lapain", "lapin"], 1, "animal"],
  ["souris", ["sourit", "souri"], 2, "animal"],
  ["lion", ["liont", "liant"], 1, "animal"],
  ["tigre", ["tigre", "tiggre"], 1, "animal"],
  ["éléphant", ["elephant", "élefan"], 1, "animal"],
  ["girafe", ["girafe", "jiraf"], 1, "animal"],
  ["singe", ["singe", "sinje"], 1, "animal"],
  ["ours", ["our", "ourse"], 1, "animal"],
  ["loup", ["lou", "loups"], 2, "animal · un seul"],
  ["renard", ["renar", "renart"], 1, "animal"],
  ["écureuil", ["ecureuil", "écureil"], 2, "animal"],
  ["hérisson", ["herisson", "hérison"], 2, "animal"],
  ["grenouille", ["grenouille", "grenouye"], 1, "animal"],
  ["tortue", ["tortu", "tortue"], 1, "animal"],
  ["papillon", ["papilon", "papillion"], 1, "animal"],
  ["abeille", ["abeille", "abeye"], 1, "animal"],
  ["fourmi", ["fourmi", "fourmie"], 2, "animal"],
  ["araignée", ["araignee", "araignè"], 1, "animal"],
  ["dauphin", ["dofin", "daufin"], 2, "animal"],
  ["baleine", ["balaine", "balène"], 2, "animal"],
  ["requin", ["requin", "rekin"], 2, "animal"],
  ["crocodile", ["crocodile", "krocodile"], 2, "animal"],
  ["canard", ["canar", "canart"], 1, "animal"],
  ["cygne", ["signe", "cyne"], 3, "animal"],
  ["hibou", ["hiboux", "ibou"], 2, "animal · un seul"],
  ["hiboux", ["hibous", "hibou"], 3, "animal · plusieurs"],
  ["aigle", ["aigle", "ègle"], 2, "animal"],
  ["serpent", ["serpend", "cerpent"], 1, "animal"],
  ["zèbre", ["zebre", "zèbère"], 2, "animal"],
  ["hippopotame", ["hipopotame", "hippopotamme"], 3, "animal"],
  ["rhinocéros", ["rhinoceros", "rinocéros"], 3, "animal"],
  ["kangourou", ["kangourou", "cangourou"], 2, "animal"],
  ["koala", ["koala", "coala"], 2, "animal"],
  ["panda", ["panda", "penda"], 2, "animal"],
  ["perroquet", ["perroket", "pérroquet"], 2, "animal"],
  ["hamster", ["amster", "hanster"], 2, "animal"],
  ["escargot", ["ècargot", "escargo"], 2, "animal"],
  ["coccinelle", ["coccinèle", "cocinel"], 2, "animal"],
  ["chenille", ["chenile", "chénille"], 2, "animal"],
  ["libellule", ["libellule", "libelule"], 2, "animal"],
  ["crapaud", ["crapo", "crappaud"], 2, "animal"],
  ["phoque", ["foc", "phoque"], 2, "animal"],
  ["pingouin", ["pingoin", "pinguoin"], 2, "animal"],
  ["chèvre", ["chèfre", "chévre"], 2, "animal"],
  ["âne", ["ane", "ânne"], 1, "animal"],
  ["poule", ["poulle", "poule"], 1, "animal"],
  ["poussin", ["pousin", "poussaint"], 2, "animal"],
  ["ver", ["verre", "vert"], 3, "petit animal"],
  ["animal", ["animaux", "animale"], 2, "un seul"],
  ["animaux", ["animauxs", "animal"], 2, "plusieurs"],
  ["chou", ["choux", "chou"], 3, "légume · un seul"],
  ["choux", ["chous", "chou"], 3, "légume · plusieurs"],
  ["bijou", ["bijoux", "bijout"], 3, "un seul"],
  ["bijoux", ["bijous", "bijou"], 3, "plusieurs"],
  ["caillou", ["cailloux", "cayou"], 2, "un seul"],
  ["cailloux", ["caillous", "caillou"], 3, "plusieurs"],
  ["journal", ["journaux", "journale"], 3, "un seul"],
  ["journaux", ["journaus", "journal"], 3, "plusieurs"],

  // Nature
  ["arbre", ["arbre", "arbe"], 1, "nature"],
  ["fleur", ["fleure", "fleur"], 1, "nature"],
  ["herbe", ["erbe", "herbbe"], 1, "nature"],
  ["feuille", ["feuil", "feuille"], 1, "nature"],
  ["forêt", ["foret", "forrêt"], 1, "nature"],
  ["rivière", ["riviere", "riviére"], 1, "nature"],
  ["mer", ["mère", "maire"], 2, "la grande eau"],
  ["plage", ["plaje", "plage"], 1, "nature"],
  ["montagne", ["montanie", "montagne"], 1, "nature"],
  ["colline", ["coline", "collinne"], 1, "nature"],
  ["ciel", ["ciel", "siel"], 1, "nature"],
  ["nuage", ["nuaje", "nuge"], 1, "nature"],
  ["soleil", ["soleille", "solèye"], 1, "nature"],
  ["lune", ["lune", "lunne"], 1, "nature"],
  ["étoile", ["etoile", "étoille"], 1, "nature"],
  ["pluie", ["plui", "pluie"], 1, "nature"],
  ["neige", ["nège", "nége"], 1, "nature"],
  ["vent", ["vand", "vent"], 1, "nature"],
  ["orage", ["oraje", "ourage"], 2, "nature"],
  ["tonnerre", ["tonerre", "tonnère"], 2, "nature"],
  ["arc-en-ciel", ["arc en ciel", "arcenciel"], 2, "nature"],
  ["plante", ["plante", "plente"], 1, "nature"],
  ["graine", ["grène", "grenne"], 2, "nature"],
  ["racine", ["racinne", "razine"], 2, "nature"],
  ["branche", ["brenche", "branche"], 1, "nature"],
  ["champ", ["chant", "chan"], 2, "nature"],
  ["île", ["ile", "îlle"], 2, "nature"],
  ["volcan", ["volcan", "volcant"], 2, "nature"],
  ["désert", ["desert", "déser"], 2, "nature"],
  ["sable", ["sable", "sabble"], 1, "nature"],
  ["rocher", ["roché", "roché"], 2, "nature"],
  ["lac", ["laque", "lak"], 2, "nature"],
  ["océan", ["ocean", "océant"], 2, "nature"],
  ["nuage", ["nuage", "nujage"], 1, "nature"],
  ["rosée", ["rosé", "rosee"], 3, "nature"],
  ["flaque", ["flaque", "flace"], 2, "nature"],
  ["sentier", ["sentié", "centier"], 2, "nature"],
  ["prairie", ["préri", "prairi"], 3, "nature"],
  ["champignon", ["champinion", "champlignon"], 2, "nature"],
  ["châtaigne", ["chataigne", "châtaigne"], 2, "nature"],
  ["chêne", ["chene", "chèene"], 2, "nature"],
  ["rose", ["rose", "roze"], 1, "fleur"],
  ["tulipe", ["tulipe", "tulippe"], 2, "fleur"],
  ["marguerite", ["margerite", "marguerite"], 2, "fleur"],

  // Ville et transports
  ["ville", ["vile", "ville"], 1, "ville"],
  ["village", ["vilage", "villaje"], 1, "ville"],
  ["rue", ["ru", "rue"], 1, "ville"],
  ["route", ["route", "routte"], 1, "ville"],
  ["pont", ["pond", "pont"], 2, "ville"],
  ["place", ["place", "plasse"], 2, "ville"],
  ["mairie", ["mairie", "mérie"], 2, "la ville"],
  ["maire", ["mer", "mère"], 3, "la ville"],
  ["église", ["eglise", "églize"], 1, "ville"],
  ["château", ["chateau", "chato"], 1, "bâtiment"],
  ["magasin", ["magazin", "magazin"], 1, "ville"],
  ["boulangerie", ["boulanjerie", "boulangeri"], 2, "ville"],
  ["pharmacie", ["farmacie", "pharmaci"], 2, "ville"],
  ["hôpital", ["hopital", "hopital"], 2, "ville"],
  ["gare", ["garre", "gare"], 1, "ville"],
  ["voiture", ["voatur", "voiturre"], 1, "transport"],
  ["vélo", ["velo", "vélo"], 1, "transport"],
  ["train", ["trin", "trein"], 1, "transport"],
  ["avion", ["avion", "avion"], 1, "transport"],
  ["bateau", ["bato", "batto"], 1, "transport"],
  ["camion", ["camion", "cammion"], 1, "transport"],
  ["moto", ["moto", "motto"], 2, "transport"],
  ["bus", ["busse", "bu"], 2, "transport"],
  ["trottoir", ["trottoir", "trotoir"], 2, "ville"],
  ["carrefour", ["carrefour", "carefour"], 3, "ville"],
  ["parc", ["parque", "park"], 2, "ville"],
  ["musée", ["musee", "muzé"], 2, "ville"],
  ["cinéma", ["cinema", "cinémar"], 1, "ville"],
  ["théâtre", ["theatre", "téâtre"], 2, "ville"],
  ["piscine", ["picine", "pissine"], 1, "ville"],
  ["stade", ["stade", "stadde"], 2, "ville"],
  ["trotinette", ["trotinete", "trottinete"], 2, "transport"],
  ["ambulance", ["anbulance", "ambulence"], 2, "ville"],
  ["pompier", ["pompié", "pompier"], 1, "métier"],
  ["boulanger", ["boulangé", "boulanger"], 2, "métier"],
  ["médecin", ["medecin", "médeçin"], 2, "métier"],
  ["infirmier", ["infirmié", "infimié"], 3, "métier"],
  ["infirmière", ["infirmiere", "infirmière"], 3, "métier"],
  ["policier", ["policié", "polissier"], 2, "métier"],
  ["facteur", ["facteure", "fakteur"], 2, "métier"],
  ["cuisinier", ["cuisinié", "cuisinier"], 2, "métier"],
  ["pilote", ["pilote", "pillote"], 2, "métier"],
  ["agriculteur", ["agriculteure", "agriculteur"], 3, "métier"],

  // Temps
  ["lundi", ["lundie", "lundi"], 1, "jour"],
  ["mardi", ["mardie", "mardi"], 1, "jour"],
  ["mercredi", ["mercedi", "mercredi"], 1, "jour"],
  ["jeudi", ["jeudie", "jeudi"], 1, "jour"],
  ["vendredi", ["vendredie", "vendredi"], 1, "jour"],
  ["samedi", ["sammedi", "samedi"], 1, "jour"],
  ["dimanche", ["dimmanche", "dimenche"], 1, "jour"],
  ["janvier", ["janvié", "janvier"], 2, "mois"],
  ["février", ["fevrier", "févrir"], 1, "mois"],
  ["mars", ["marce", "mar"], 2, "mois"],
  ["avril", ["avrile", "avril"], 2, "mois"],
  ["mai", ["mait", "mé"], 2, "mois"],
  ["juin", ["juain", "juin"], 2, "mois"],
  ["juillet", ["juillet", "juillié"], 2, "mois"],
  ["août", ["aout", "aoùt"], 1, "mois"],
  ["septembre", ["septembre", "septambre"], 2, "mois"],
  ["octobre", ["octobre", "oktobre"], 2, "mois"],
  ["novembre", ["novembre", "novambre"], 2, "mois"],
  ["décembre", ["decembre", "décemvre"], 1, "mois"],
  ["matin", ["matin", "matain"], 1, "moment"],
  ["soir", ["soar", "soir"], 1, "moment"],
  ["nuit", ["nui", "nuite"], 1, "moment"],
  ["hier", ["hière", "hierr"], 2, "moment"],
  ["aujourd'hui", ["aujourdhui", "aujourd hui"], 2, "moment"],
  ["demain", ["demin", "demaint"], 1, "moment"],
  ["semaine", ["semène", "semainne"], 1, "temps"],
  ["mois", ["moi", "moâ"], 2, "temps"],
  ["année", ["anée", "anné"], 1, "temps"],
  ["saison", ["sèzon", "saison"], 2, "temps"],
  ["printemps", ["printemp", "printems"], 2, "saison"],
  ["été", ["était", "aité"], 3, "saison"],
  ["automne", ["autone", "automme"], 2, "saison"],
  ["hiver", ["ivère", "hiverre"], 2, "saison"],
  ["heure", ["heur", "eure"], 1, "temps"],
  ["minute", ["minutte", "minut"], 2, "temps"],
  ["horloge", ["orloge", "horloche"], 2, "temps"],
  ["calendrier", ["calandrier", "calendrié"], 3, "temps"],
  ["anniversaire", ["aniversaire", "anniversère"], 2, "fête"],
  ["Noël", ["noel", "noël"], 1, "fête"],
  ["Pâques", ["paques", "Pake"], 2, "fête"],

  // Nombres
  ["deux", ["deu", "deuc"], 1, "nombre"],
  ["trois", ["troi", "troas"], 1, "nombre"],
  ["quatre", ["quatre", "catre"], 1, "nombre"],
  ["cinq", ["cinc", "sinq"], 1, "nombre"],
  ["six", ["sice", "cice"], 2, "nombre"],
  ["sept", ["sette", "cet"], 2, "nombre"],
  ["huit", ["uit", "huite"], 1, "nombre"],
  ["neuf", ["neuve", "neuf"], 2, "nombre"],
  ["dix", ["dis", "dice"], 2, "nombre"],
  ["onze", ["onse", "onze"], 2, "nombre"],
  ["douze", ["douce", "douze"], 2, "nombre"],
  ["treize", ["trèze", "treise"], 2, "nombre"],
  ["quatorze", ["catorze", "quatorsse"], 2, "nombre"],
  ["quinze", ["quainze", "cuinze"], 2, "nombre"],
  ["seize", ["sèze", "sèze"], 2, "nombre"],
  ["vingt", ["vin", "vaint"], 1, "nombre"],
  ["trente", ["trente", "trate"], 2, "nombre"],
  ["quarante", ["quarente", "quarente"], 2, "nombre"],
  ["cinquante", ["cinquante", "sinquante"], 2, "nombre"],
  ["soixante", ["soissante", "soixente"], 2, "nombre"],
  ["cent", ["sang", "sans"], 2, "nombre 100"],
  ["mille", ["mil", "mile"], 2, "nombre"],
  ["premier", ["premiers", "prémier"], 2, "un garçon"],
  ["première", ["premier", "prémière"], 2, "une fille"],
  ["deuxième", ["deuxieme", "deusième"], 2, "adjectif · singulier · masculin ou féminin"],
  ["dernier", ["dernié", "derniers"], 2, "un garçon"],
  ["dernière", ["dernier", "derniere"], 2, "une fille"],

  // Mots outils
  ["toujours", ["toujour", "toujourt"], 2, "mot"],
  ["beaucoup", ["bocoup", "beaucou"], 1, "mot"],
  ["encore", ["encor", "anfore"], 2, "mot"],
  ["jamais", ["jamai", "jamé"], 2, "mot"],
  ["souvent", ["souvant", "souvand"], 2, "mot"],
  ["maintenant", ["maintenan", "maintenent"], 2, "mot"],
  ["après", ["apres", "aprè"], 1, "mot"],
  ["avant", ["avan", "avant"], 2, "mot"],
  ["pendant", ["pendans", "pandant"], 2, "mot"],
  ["depuis", ["depuits", "depuie"], 2, "mot"],
  ["derrière", ["derriere", "derière"], 1, "mot"],
  ["devant", ["devan", "devant"], 2, "mot"],
  ["très", ["tres", "trai"], 1, "mot"],
  ["déjà", ["deja", "déja"], 1, "mot"],
  ["bientôt", ["bien tôt", "bientot"], 3, "dans peu de temps"],
  ["aussi", ["aussy", "ossie"], 2, "mot"],
  ["alors", ["alor", "alors"], 2, "mot"],
  ["ensuite", ["ensuite", "ensuitte"], 2, "mot"],
  ["enfin", ["enfin", "anfin"], 2, "mot"],
  ["surtout", ["surtou", "surtou"], 2, "mot"],
  ["vraiment", ["vraiement", "vraimant"], 3, "adverbe"],
  ["vite", ["vitte", "vite"], 2, "adverbe"],
  ["lentement", ["lentemant", "lentement"], 2, "adverbe"],
  ["doucement", ["doucemant", "dousement"], 2, "adverbe"],
  ["heureusement", ["heureusemant", "heureusment"], 3, "adverbe"],
  ["longtemps", ["longtemp", "lontemps"], 2, "adverbe"],
  ["facilement", ["facilemant", "facillement"], 3, "adverbe"],
  ["gentiment", ["gentilment", "gentimant"], 3, "adverbe"],
  ["attention", ["atention", "attantion"], 2, "mot"],
  ["voilà", ["voila", "volla"], 1, "mot"],
  ["voici", ["voici", "voissi"], 2, "mot"],
  ["chez", ["ché", "chèz"], 2, "mot"],
  ["parce que", ["par ce que", "parque"], 3, "mot"],
  ["pourquoi", ["pourqoi", "pourquoi"], 2, "mot"],
  ["comment", ["commant", "commen"], 2, "mot"],
  ["combien", ["combein", "combien"], 2, "mot"],
  ["quel", ["quelle", "kel"], 3, "déterminant · singulier · masculin"],
  ["quelle", ["quel", "qelle"], 3, "déterminant · singulier · féminin"],
  ["quels", ["quel", "qu'elle"], 3, "déterminant · pluriel · masculin"],
  ["quelles", ["quelle", "kel"], 3, "déterminant · pluriel · féminin"],

  // Homophones — l'étiquette ne contient pas la réponse
  ["à", ["a"], 2, "___ bientôt"],
  ["a", ["à", "as"], 2, "il ___ faim"],
  ["et", ["est"], 1, "un ___ deux"],
  ["est", ["et", "es"], 2, "elle ___ petite"],
  ["on", ["ont"], 2, "___ y va"],
  ["ont", ["on"], 3, "ils ___ un vélo"],
  ["son", ["sont"], 2, "___ chien"],
  ["sont", ["son"], 3, "ils ___ grands"],
  ["ce", ["se"], 2, "___ soir"],
  ["se", ["ce"], 3, "elle ___ brosse"],
  ["ces", ["ses"], 3, "___ jours-ci"],
  ["ses", ["ces"], 2, "___ parents"],
  ["ou", ["où"], 2, "pain ___ fromage"],
  ["où", ["ou"], 2, "___ est-il ?"],
  ["la", ["là", "l'a"], 1, "___ porte"],
  ["là", ["la"], 2, "reste ___"],
  ["l'a", ["la", "là"], 3, "il ___ dit"],
  ["mes", ["mais", "met"], 2, "___ jouets"],
  ["mais", ["mes", "met"], 2, "petit, ___ fort"],
  ["met", ["mais", "mes"], 3, "il ___ la table"],
  ["peu", ["peut", "peux"], 3, "un ___ d'eau"],
  ["peut", ["peu", "peux"], 3, "elle ___ venir"],
  ["peux", ["peut", "peu"], 3, "tu ___ jouer"],
  ["c'est", ["s'est", "ces"], 3, "___ beau"],
  ["s'est", ["c'est", "ces"], 4, "elle ___ levée"],
  ["sa", ["ça"], 2, "___ maman"],
  ["ça", ["sa"], 2, "___ va"],
  ["près", ["prêt", "pret"], 3, "tout ___"],
  ["prêt", ["près", "pret"], 3, "je suis ___"],
  ["leur", ["leurs"], 3, "___ maison, à eux"],
  ["leurs", ["leur"], 3, "___ cahiers"],
  ["tout", ["tous", "tou"], 2, "___ doux"],
  ["tous", ["tout"], 3, "___ ensemble"],
  ["plutôt", ["plus tôt", "plutot"], 4, "___ content"],
  ["plus tôt", ["plutôt"], 4, "arrive ___"],
  ["quand", ["quant", "can"], 3, "___ il pleut"],
  ["ni", ["n'y", "nie"], 4, "l'un ___ l'autre"],
  ["n'y", ["ni"], 4, "je ___ vais pas"],
  ["au", ["eau", "aux"], 3, "___ parc"],
  ["aux", ["au", "eau"], 3, "___ copains"],
  ["vers", ["vert", "verre"], 3, "en direction de"],
  ["vert", ["verre", "vers"], 2, "couleur · garçon"],
  ["verte", ["vert", "verte"], 2, "couleur · fille"],
  ["compte", ["conte", "comte"], 3, "un calcul"],
  ["conte", ["compte"], 3, "une histoire"],
  ["fois", ["foi", "foie"], 3, "une seule ___"],
  ["sans", ["sang", "cent"], 3, "___ sucre"],
  ["mètre", ["maître", "metre"], 2, "pour mesurer"],

  // Couleurs et adjectifs irréguliers
  ["bleu", ["bleue", "bleux"], 2, "couleur · garçon"],
  ["bleue", ["bleu", "bleue"], 2, "couleur · fille"],
  ["blanc", ["blan", "blanche"], 2, "couleur · garçon"],
  ["blanche", ["blanc", "blenche"], 2, "couleur · fille"],
  ["noir", ["noire", "noire"], 2, "couleur · garçon"],
  ["noire", ["noir", "noire"], 2, "couleur · fille"],
  ["gris", ["grise", "gri"], 2, "couleur · garçon"],
  ["grise", ["gris", "grize"], 2, "couleur · fille"],
  ["rouge", ["rouje", "rouge"], 1, "couleur"],
  ["jaune", ["jaune", "jône"], 1, "couleur"],
  ["violet", ["violette", "violete"], 2, "couleur · garçon"],
  ["violette", ["violet", "violete"], 2, "couleur · fille"],
  ["marron", ["maron", "maront", "marrons", "marronne"], 2, "adjectif · invariable"],
  ["beau", ["bo", "belle"], 1, "pour un garçon"],
  ["belle", ["bele", "beau"], 2, "pour une fille"],
  ["beaux", ["beau", "beaus"], 3, "plusieurs garçons"],
  ["nouveau", ["nouvo", "nouvelle"], 2, "pour un garçon"],
  ["nouvelle", ["nouveau", "nouvel"], 2, "pour une fille"],
  ["vieux", ["vieu", "vieille"], 2, "pour un garçon"],
  ["vieille", ["vieux", "vieille"], 2, "pour une fille"],
  ["fou", ["folle", "fous"], 3, "pour un garçon"],
  ["folle", ["fou", "fole"], 3, "pour une fille"],
  ["mou", ["molle", "mou"], 3, "pour un garçon"],
  ["molle", ["mou", "mole"], 3, "pour une fille"],
  ["doux", ["dou", "douce"], 2, "pour un garçon"],
  ["douce", ["doux", "dousse"], 2, "pour une fille"],
  ["faux", ["fau", "fausse"], 3, "pour un garçon"],
  ["fausse", ["faux", "fose"], 3, "pour une fille"],
  ["sec", ["sèche", "sek"], 3, "pour un garçon"],
  ["sèche", ["sec", "seche"], 3, "pour une fille"],
  ["frais", ["fraîche", "frai"], 3, "pour un garçon"],
  ["fraîche", ["frais", "fraiche"], 3, "pour une fille"],
  ["gros", ["grosse", "gro"], 2, "pour un garçon"],
  ["grosse", ["gros", "grose"], 2, "pour une fille"],
  ["bon", ["bonne", "bond"], 2, "pour un garçon"],
  ["bonne", ["bon", "bone"], 2, "pour une fille"],
  ["gentil", ["gentille", "jenti"], 2, "pour un garçon"],
  ["gentille", ["gentil", "gentile"], 2, "pour une fille"],
  ["heureux", ["heureu", "heureuse"], 2, "pour un garçon"],
  ["heureuse", ["heureux", "heurese"], 2, "pour une fille"],
  ["sérieux", ["serieu", "sérieuse"], 3, "pour un garçon"],
  ["sérieuse", ["sérieux", "serieuse"], 3, "pour une fille"],
  ["joyeux", ["joyeu", "joyeuse"], 2, "pour un garçon"],
  ["joyeuse", ["joyeux", "joyeuse"], 2, "pour une fille"],
  ["courageux", ["courageu", "courageuse"], 2, "pour un garçon"],
  ["courageuse", ["courageux", "courageuse"], 2, "pour une fille"],
  ["dangereux", ["dangereu", "dangereuse"], 2, "pour un garçon"],
  ["dangereuse", ["dangereux", "dangereuse"], 2, "pour une fille"],
  ["malheureux", ["malheureu", "malheureuse"], 3, "pour un garçon"],
  ["malheureuse", ["malheureux", "malheurese"], 3, "pour une fille"],
  ["paresseux", ["paresseu", "paresseuse"], 3, "pour un garçon"],
  ["paresseuse", ["paresseux", "paresseuse"], 3, "pour une fille"],
  ["léger", ["leger", "légère"], 2, "pour un garçon"],
  ["légère", ["léger", "legere"], 2, "pour une fille"],
  ["fier", ["fière", "fier"], 3, "pour un garçon"],
  ["fière", ["fier", "fiere"], 3, "pour une fille"],
  ["complet", ["complète", "complé"], 3, "pour un garçon"],
  ["complète", ["complet", "complete"], 3, "pour une fille"],
  ["secret", ["secrète", "secré"], 3, "pour un garçon"],
  ["secrète", ["secret", "secrete"], 3, "pour une fille"],
  ["muet", ["muette", "mué"], 3, "pour un garçon"],
  ["muette", ["muet", "muete"], 3, "pour une fille"],
  ["long", ["longue", "lon"], 2, "pour un garçon"],
  ["longue", ["long", "longue"], 2, "pour une fille"],
  ["favori", ["favorite", "favorit"], 4, "pour un garçon"],
  ["favorite", ["favori", "favoritte"], 4, "pour une fille"],
  ["travailleur", ["travailleuse", "travailleur"], 3, "pour un garçon"],
  ["travailleuse", ["travailleur", "travailleuse"], 3, "pour une fille"],
  ["rêveur", ["rêveuse", "reveur"], 3, "pour un garçon"],
  ["rêveuse", ["rêveur", "reveuse"], 3, "pour une fille"],
  ["menteur", ["menteuse", "menteur"], 3, "pour un garçon"],
  ["menteuse", ["menteur", "menteuse"], 3, "pour une fille"],
  ["nœud", ["neud", "neu"], 3, "nom"],
  ["vœu", ["veu", "veue"], 4, "nom"],
  ["Noël", ["noël", "noel"], 1, "fête"],
];

for (const [t, b, d, g] of LEX) addItem(t, b, d, g);

const ADJ_E = [
  ["petit", "petite"],
  ["grand", "grande"],
  ["content", "contente"],
  ["fort", "forte"],
  ["faible", "faible"],
  ["rapide", "rapide"],
  ["lent", "lente"],
  ["chaud", "chaude"],
  ["froid", "froide"],
  ["jeune", "jeune"],
  ["propre", "propre"],
  ["facile", "facile"],
  ["difficile", "difficile"],
  ["important", "importante"],
  ["différent", "différente"],
  ["court", "courte"],
  ["haut", "haute"],
  ["bas", "basse"],
  ["lourd", "lourde"],
  ["clair", "claire"],
  ["sombre", "sombre"],
  ["brillant", "brillante"],
  ["rond", "ronde"],
  ["pointu", "pointue"],
  ["sucré", "sucrée"],
  ["salé", "salée"],
  ["délicieux", "délicieuse"],
  ["magnifique", "magnifique"],
  ["terrible", "terrible"],
  ["curieux", "curieuse"],
  ["joli", "jolie"],
  ["triste", "triste"],
  ["drôle", "drôle"],
  ["calme", "calme"],
  ["timide", "timide"],
  ["poli", "polie"],
  ["fort", "forte"],
  ["premier", "première"],
];

function pluralOf(form) {
  if (/(s|x)$/i.test(form)) return form;
  return form + "s";
}

function adjMascLabel(form) {
  return /(s|x)$/i.test(form)
    ? "adjectif · masculin · même au pluriel"
    : "adjectif · singulier · masculin";
}

function adjFemLabel(form) {
  return /(s|x)$/i.test(form)
    ? "adjectif · féminin · même au pluriel"
    : "adjectif · singulier · féminin";
}

function addAdj(masc, fem, d = 2) {
  const mp = pluralOf(masc);
  const fp = pluralOf(fem);
  const bare = (w) => (noAccent(w) === w ? null : noAccent(w));
  if (masc === fem) {
    addItem(masc, [masc + "e", mp, bare(masc)], d, "adjectif · singulier · masculin ou féminin");
    if (mp !== masc) addItem(mp, [masc, mp + "e", mp + "s", bare(mp)], d, "adjectif · pluriel · masculin ou féminin");
    return;
  }
  addItem(masc, [fem, mp, bare(masc)], d, adjMascLabel(masc));
  addItem(fem, [masc, fp, bare(fem)], d, adjFemLabel(fem));
  if (mp !== masc) addItem(mp, [masc, fem, fp, bare(mp)], d, "adjectif · pluriel · masculin");
  if (fp !== fem && fp !== mp) addItem(fp, [fem, masc, mp, bare(fp)], d, "adjectif · pluriel · féminin");
}

for (const [m, f] of ADJ_E) addAdj(m, f, m.length > 6 ? 2 : 1);

for (const [m, f, d] of [
  ["bleu", "bleue", 2], ["blanc", "blanche", 2], ["noir", "noire", 2], ["gris", "grise", 2],
  ["violet", "violette", 2], ["beau", "belle", 1], ["nouveau", "nouvelle", 2],
  ["vieux", "vieille", 2], ["fou", "folle", 3], ["mou", "molle", 3], ["doux", "douce", 2],
  ["faux", "fausse", 3], ["sec", "sèche", 3], ["frais", "fraîche", 3], ["gros", "grosse", 2],
  ["bon", "bonne", 2], ["gentil", "gentille", 2], ["heureux", "heureuse", 2],
  ["sérieux", "sérieuse", 3], ["joyeux", "joyeuse", 2], ["courageux", "courageuse", 2],
  ["dangereux", "dangereuse", 2], ["malheureux", "malheureuse", 3],
  ["paresseux", "paresseuse", 3], ["léger", "légère", 2], ["fier", "fière", 3],
  ["complet", "complète", 3], ["secret", "secrète", 3], ["muet", "muette", 3],
  ["long", "longue", 2], ["favori", "favorite", 4], ["travailleur", "travailleuse", 3],
  ["rêveur", "rêveuse", 3], ["menteur", "menteuse", 3],
  ["premier", "première", 2], ["dernier", "dernière", 2],
  ["rouge", "rouge", 1], ["jaune", "jaune", 1], ["deuxième", "deuxième", 2]
]) addAdj(m, f, d);

// Mots fréquents supplémentaires, fautes phonétiques
const MORE = [
  ["livre", ["livres", "livr"], 2, "un seul"],
  ["livres", ["livre", "livrent"], 2, "plusieurs"],
  ["ami", ["amie", "amis"], 2, "nom · masculin"],
  ["amie", ["ami", "amie"], 2, "nom · féminin"],
  ["amis", ["ami", "amies"], 2, "nom · pluriel"],
  ["histoire", ["istoire", "istoire"], 1, "récit"],
  ["image", ["imaje", "image"], 1, "nom"],
  ["photo", ["foto", "fausto"], 2, "nom"],
  ["téléphone", ["telefone", "téléfone"], 2, "objet"],
  ["ordinateur", ["ordinatteur", "ordinateur"], 2, "objet"],
  ["tablette", ["tablete", "tablette"], 2, "objet"],
  ["écran", ["ecran", "écrant"], 2, "objet"],
  ["clavier", ["clavié", "klavie"], 2, "objet"],
  ["souris", ["souriss", "souri"], 3, "de l'ordinateur"],
  ["jeu", ["jeut", "jeux"], 2, "un seul"],
  ["jeux", ["jeus", "jeu"], 2, "plusieurs"],
  ["ballon", ["balon", "ballon"], 1, "jeu"],
  ["poupée", ["poupee", "poupé"], 1, "jeu"],
  ["peluche", ["peluche", "pluche"], 2, "jeu"],
  ["vélo", ["vélo", "vello"], 1, "jeu"],
  ["trottinette", ["trotinette", "trottinète"], 2, "transport"],
  ["lettre", ["letre", "lètre"], 1, "école"],
  ["phrase", ["frase", "fraze"], 2, "école"],
  ["mot", ["maux", "mot"], 3, "un seul"],
  ["mots", ["mot", "maux"], 3, "plusieurs"],
  ["texte", ["texte", "tèkste"], 2, "école"],
  ["titre", ["titre", "tître"], 2, "école"],
  ["page", ["page", "paje"], 1, "école"],
  ["ligne", ["ligne", "linie"], 2, "école"],
  ["point", ["poind", "poin"], 2, "école"],
  ["virgule", ["virgulle", "virgule"], 2, "école"],
  ["majuscule", ["majuscull", "majiscule"], 3, "école"],
  ["minuscule", ["miniscule", "minuscull"], 3, "école"],
  ["accent", ["acent", "aksan"], 2, "école"],
  ["erreur", ["éreur", "erreure"], 2, "école"],
  ["faute", ["faute", "fôte"], 2, "école"],
  ["réussite", ["reussite", "réussitte"], 2, "école"],
  ["effort", ["efort", "effore"], 2, "école"],
  ["progrès", ["progres", "progrè"], 2, "école"],
  ["courage", ["couraje", "courage"], 2, "qualité"],
  ["patience", ["pacience", "patiencce"], 3, "qualité"],
  ["gentillesse", ["gentilesse", "jentillesse"], 3, "qualité"],
  ["politesse", ["politese", "politèsse"], 3, "qualité"],
  ["sourire", ["sourire", "sourir"], 2, "nom"],
  ["rire", ["rire", "rires"], 2, "nom"],
  ["larme", ["larme", "larmme"], 2, "nom"],
  ["bruit", ["brui", "bruie"], 2, "nom"],
  ["silence", ["cilence", "silance"], 2, "nom"],
  ["voix", ["voie", "vois"], 3, "on l'entend"],
  ["voie", ["voix", "voie"], 3, "un chemin"],
  ["chemin", ["chemin", "chemain"], 1, "nom"],
  ["voyage", ["voiage", "voyage"], 2, "nom"],
  ["vacances", ["vacance", "vakance"], 2, "plusieurs"],
  ["valise", ["valize", "valisse"], 2, "nom"],
  ["carte", ["carte", "cartte"], 2, "nom"],
  ["pays", ["payi", "péi"], 2, "nom"],
  ["monde", ["monde", "monnde"], 2, "nom"],
  ["terre", ["tère", "terre"], 1, "nom"],
  ["planète", ["planete", "planète"], 2, "nom"],
  ["espace", ["espace", "espas"], 2, "nom"],
  ["fusée", ["fusee", "fuzée"], 2, "nom"],
  ["pirate", ["pirate", "piratte"], 2, "nom"],
  ["princesse", ["princese", "prinsesse"], 2, "nom"],
  ["prince", ["prince", "prinse"], 2, "nom"],
  ["roi", ["roie", "roi"], 2, "nom"],
  ["reine", ["reine", "rène"], 2, "nom"],
  ["dragon", ["dragon", "dragont"], 2, "nom"],
  ["magie", ["maji", "maggie"], 2, "nom"],
  ["baguette", ["baguete", "baguète"], 2, "nom"],
  ["trésor", ["tresor", "tréssor"], 2, "nom"],
  ["île", ["ile", "îsle"], 2, "nom"],
  ["bateau", ["bato", "bateaud"], 1, "nom"],
  ["voile", ["voile", "voille"], 2, "nom"],
  ["ancre", ["ancre", "encre"], 3, "du bateau"],
  ["encre", ["ancre", "encre"], 3, "pour écrire"],
  ["crayon", ["craillon", "créon"], 1, "école"],
  ["peinture", ["peinturre", "pinture"], 2, "école"],
  ["couleur", ["couleure", "couleur"], 1, "école"],
  ["forme", ["forme", "phorme"], 2, "école"],
  ["carré", ["caré", "carrré"], 1, "forme"],
  ["triangle", ["triangle", "triengle"], 2, "forme"],
  ["cercle", ["cercle", "sercle"], 2, "forme"],
  ["rectangle", ["rectengle", "rektangle"], 3, "forme"],
  ["moitié", ["moitie", "moitiée"], 2, "maths"],
  ["double", ["duble", "doubble"], 2, "maths"],
  ["dizaine", ["dizène", "disaine"], 2, "maths"],
  ["centaine", ["centène", "sentaine"], 3, "maths"],
  ["calcul", ["calcule", "kalkul"], 2, "maths"],
  ["addition", ["adition", "addicion"], 2, "maths"],
  ["nombre", ["nombre", "nomre"], 2, "maths"],
  ["chiffre", ["chiffre", "chifr"], 2, "maths"],
  ["résultat", ["resultat", "résulta"], 2, "maths"],
  ["problème", ["probleme", "problème"], 2, "maths"],
  ["mesure", ["mesure", "mezure"], 2, "maths"],
  ["heure", ["eure", "heurre"], 1, "temps"],
  ["matin", ["mattin", "matin"], 1, "moment"],
  ["après-midi", ["apres-midi", "après midi"], 2, "moment"],
  ["minuit", ["minui", "minuit"], 2, "moment"],
  ["midi", ["midit", "middi"], 2, "moment"],
  ["saison", ["sèzon", "saison"], 2, "temps"],
  ["fête", ["fete", "fète"], 1, "nom"],
  ["cadeau", ["cado", "cadeaud"], 1, "nom"],
  ["invitation", ["invitassion", "invitation"], 3, "nom"],
  ["surprise", ["surprise", "surprize"], 2, "nom"],
  ["bougie", ["bouji", "bouggie"], 2, "nom"],
  ["gâteau", ["gato", "gâteaud"], 1, "fête"],
  ["bonheur", ["boneur", "bonheure"], 2, "nom"],
  ["peur", ["peure", "peur"], 2, "nom"],
  ["colère", ["colere", "colèrre"], 2, "nom"],
  ["joie", ["joi", "joie"], 2, "nom"],
  ["tristesse", ["tristese", "tristèsse"], 3, "nom"],
  ["rêve", ["reve", "raive"], 2, "nom"],
  ["sommeil", ["someil", "sommeille"], 2, "nom"],
  ["réveil", ["reveil", "réveil"], 2, "nom"],
  ["matin", ["matin", "mattain"], 1, "moment"],
  ["histoire", ["istoire", "hitoire"], 1, "récit"],
  ["personnage", ["personage", "personnaje"], 2, "récit"],
  ["aventure", ["avanture", "aventurre"], 2, "récit"],
  ["chevalier", ["chevalié", "chevaliè"], 2, "récit"],
  ["sorcière", ["sorciere", "sorssièr"], 2, "récit"],
  ["sorcier", ["sorcié", "sorsier"], 2, "récit"],
  ["fée", ["fee", "fé"], 1, "récit"],
  ["loup", ["lou", "leup"], 2, "récit"],
  ["forêt", ["forait", "forrêt"], 1, "récit"],
  ["maison", ["mèzon", "maizon"], 1, "récit"],
];

for (const [t, b, d, g] of MORE) addItem(t, b, d, g);

// ---------------------------------------------------------------------------
// Conjugaison
// ---------------------------------------------------------------------------

const ER = [...new Set([
  "aimer", "jouer", "chanter", "parler", "regarder", "écouter", "habiter", "tomber",
  "arriver", "donner", "trouver", "passer", "porter", "raconter", "demander",
  "travailler", "dessiner", "sauter", "marcher", "entrer", "rentrer", "monter",
  "montrer", "apporter", "préparer", "ranger", "laver", "aider", "chercher",
  "penser", "rêver", "crier", "voler", "visiter", "compter", "ajouter", "poser",
  "fermer", "allumer", "utiliser", "expliquer", "continuer", "traverser", "glisser",
  "pousser", "colorier", "découper", "plier", "mesurer", "déjeuner", "goûter",
  "coller", "couper", "tourner", "gagner", "nager", "plonger", "changer", "mélanger",
  "partager", "corriger", "protéger", "déranger", "voyager", "loger", "avancer",
  "annoncer", "tracer", "remplacer", "prononcer", "effacer", "placer", "lancer",
  "commencer", "manger", "songer", "charger", "diriger", "créer", "oublier",
  "étudier", "skier", "remercier", "copier", "crier", "plier", "lier", "nier",
  "marier", "prier", "apprécier", "détester",
])];

for (const inf of ER) {
  if (!inf.endsWith("er")) throw new Error("Pas un verbe en -er : " + inf);
  addRegularPresent(inf, 2);
  addInfinitif(inf, [inf.slice(0, -2) + "é", inf.slice(0, -2) + "er", inf.slice(0, -1)], 3);
}

for (const inf of ["préférer", "répéter", "espérer", "céder", "régler", "compléter", "posséder"]) {
  pushRows(inf, "présent", presentEAcute(inf), 3);
  addInfinitif(inf, [inf.slice(0, -2) + "é", noAccent(inf)], 3);
}

for (const inf of ["acheter", "lever", "mener", "peser", "semer", "geler", "amener", "emmener", "enlever"]) {
  pushRows(inf, "présent", presentEMute(inf), 3);
  addInfinitif(inf, [inf.slice(0, -2) + "é", noAccent(inf)], 3);
}

// appeler / jeter : consonne double
function presentDouble(inf, singleStem, doubleStem) {
  // appeler : single appel / double appell
  pushRows(inf, "présent", [
    ["je", doubleStem + "e", [singleStem + "e", doubleStem + "es"]],
    ["tu", doubleStem + "es", [doubleStem + "e", singleStem + "es"]],
    ["il/elle", doubleStem + "e", [singleStem + "e", doubleStem + "ent"]],
    ["nous", singleStem + "ons", [doubleStem + "ons", singleStem + "ent"]],
    ["vous", singleStem + "ez", [doubleStem + "ez", inf]],
    ["ils/elles", doubleStem + "ent", [singleStem + "ent", doubleStem + "e"]],
  ], 3);
}
presentDouble("appeler", "appel", "appell");
presentDouble("jeter", "jet", "jett");
addInfinitif("appeler", ["appelé", "appeller", "apeler"], 3);
addInfinitif("jeter", ["jeté", "jetter", "jéter"], 3);

// essayer / envoyer / nettoyer
pushRows("essayer", "présent", [
  ["je", "essaie", ["essaye", "éssaie", "essaies"]],
  ["tu", "essaies", ["essaie", "essayes"]],
  ["il/elle", "essaie", ["essaye", "essaient"]],
  ["nous", "essayons", ["essaions", "essayion"]],
  ["vous", "essayez", ["essayer", "essayé"]],
  ["ils/elles", "essaient", ["essaie", "essayent"]],
], 3);
// "essaye" est aussi admis : on le retire des fautes de "essaie"
{
  const item = bank.find((w) => w.t === "j'essaie" || (w.t === "essaie" && w.g.includes("essayer")));
  // corrigé plus bas après élision : on filtre "j'essaye" / "essaye" ensuite
}
pushRows("envoyer", "présent", [
  ["je", "envoie", ["envoye", "envoi", "envoies"]],
  ["tu", "envoies", ["envoie", "envoyes"]],
  ["il/elle", "envoie", ["envoye", "envoit"]],
  ["nous", "envoyons", ["envoions", "envoyion"]],
  ["vous", "envoyez", ["envoyer", "envoyé"]],
  ["ils/elles", "envoient", ["envoie", "envoyent"]],
], 3);
pushRows("nettoyer", "présent", [
  ["je", "nettoie", ["nettoye", "netoie", "nettoies"]],
  ["tu", "nettoies", ["nettoie", "netoyes"]],
  ["il/elle", "nettoie", ["nettoye", "nettoient"]],
  ["nous", "nettoyons", ["nettoions", "netoyons"]],
  ["vous", "nettoyez", ["nettoyer", "nettoyé"]],
  ["ils/elles", "nettoient", ["nettoie", "nettoyent"]],
], 3);
addInfinitif("essayer", ["essayé", "éssayer"], 3);
addInfinitif("envoyer", ["envoyé", "anvoyer"], 3);
addInfinitif("nettoyer", ["nettoyé", "nétoyer"], 3);

// "j'essaye" et "essaye" sont corrects : on retire ces fautes.
for (const item of bank) {
  if (!item.g.startsWith("essayer ·")) continue;
  item.b = item.b.filter((w) => w !== "essaye" && w !== "j'essaye" && w !== "jessayes" && w !== "tu essayes");
}

addTable("être", "présent",
  ["suis", "es", "est", "sommes", "êtes", "sont"],
  [
    ["sui", "suit", "suis"],
    ["est", "ai", "é", "et"],
    ["et", "es", "ai", "a"],
    ["some", "sonmes", "sont", "somme"],
    ["etes", "été", "ète", "êtes"],
    ["son", "sons", "ont", "sonts"],
  ], 2);
addTable("avoir", "présent",
  ["ai", "as", "a", "avons", "avez", "ont"],
  [
    ["ais", "a", "es"],
    ["a", "es", "à"],
    ["à", "as", "et"],
    ["avon", "avont", "ont"],
    ["avé", "avais", "avés"],
    ["on", "sons", "onts"],
  ], 2);
addTable("aller", "présent",
  ["vais", "vas", "va", "allons", "allez", "vont"],
  [
    ["va", "vait", "vé"],
    ["va", "vais", "vat"],
    ["vas", "vais", "vat"],
    ["allon", "allont", "vont"],
    ["allé", "allés", "aller"],
    ["von", "vonts", "vont"],
  ], 2);
addTable("faire", "présent",
  ["fais", "fais", "fait", "faisons", "faites", "font"],
  [
    ["fait", "fai", "fé"],
    ["fait", "fai", "fes"],
    ["fais", "fai", "fes"],
    ["faisont", "fesons", "font"],
    ["faisez", "faites", "fétes"],
    ["fon", "fonds", "font"],
  ], 2);
addTable("dire", "présent",
  ["dis", "dis", "dit", "disons", "dites", "disent"],
  [
    ["dit", "di", "dis"],
    ["dit", "di"],
    ["dis", "di", "dît"],
    ["disont", "disent"],
    ["disez", "dites", "ditez"],
    ["dise", "disents", "dient"],
  ], 2);
addTable("venir", "présent",
  ["viens", "viens", "vient", "venons", "venez", "viennent"],
  [
    ["vient", "vien", "viens"],
    ["vient", "vien"],
    ["viens", "vient"],
    ["venont", "viennent"],
    ["venir", "vené"],
    ["vienent", "vienne", "viennent"],
  ], 3);
addTable("tenir", "présent",
  ["tiens", "tiens", "tient", "tenons", "tenez", "tiennent"],
  [
    ["tient", "tien"],
    ["tient", "tien"],
    ["tiens", "tient"],
    ["tenont", "tiennent"],
    ["tenir", "tené"],
    ["tienent", "tienne"],
  ], 3);
addTable("voir", "présent",
  ["vois", "vois", "voit", "voyons", "voyez", "voient"],
  [
    ["voit", "voi", "vois"],
    ["voit", "voi"],
    ["vois", "voi"],
    ["voyont", "voyons"],
    ["voir", "voyé"],
    ["voie", "voyent", "vois"],
  ], 3);
addTable("prendre", "présent",
  ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
  [
    ["prend", "pren", "prent"],
    ["prend", "pren"],
    ["prends", "prent"],
    ["prennons", "prenont"],
    ["prennez", "prendre"],
    ["prendent", "prenne", "prennnent"],
  ], 2);
addTable("apprendre", "présent",
  ["apprends", "apprends", "apprend", "apprenons", "apprenez", "apprennent"],
  [
    ["apprend", "appren"],
    ["apprend", "appren"],
    ["apprends", "apprent"],
    ["apprennons", "apprenont"],
    ["apprennez", "apprendre"],
    ["apprendent", "apprenne"],
  ], 3);
addTable("comprendre", "présent",
  ["comprends", "comprends", "comprend", "comprenons", "comprenez", "comprennent"],
  [
    ["comprend", "compren"],
    ["comprend"],
    ["comprends"],
    ["comprennons"],
    ["comprennez"],
    ["comprendent", "comprenne"],
  ], 3);
addTable("pouvoir", "présent",
  ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
  [
    ["peut", "peu", "peus"],
    ["peut", "peu"],
    ["peux", "peu"],
    ["pouvont", "peuvent"],
    ["pouvoir", "pouvé"],
    ["peuvent", "peuve", "peuvent"],
  ], 3);
// filter duplicate wrong "peuvent" later via unique
addTable("vouloir", "présent",
  ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
  [
    ["veut", "veu"],
    ["veut", "veu"],
    ["veux", "veu"],
    ["voulont", "veulent"],
    ["vouloir", "voulé"],
    ["voulent", "veule", "veulent"],
  ], 3);
addTable("devoir", "présent",
  ["dois", "dois", "doit", "devons", "devez", "doivent"],
  [
    ["doit", "doi", "doigt"],
    ["doit", "doi"],
    ["dois", "doi"],
    ["devont", "doivent"],
    ["devoir", "devé"],
    ["doive", "doivent", "dois"],
  ], 3);
addTable("savoir", "présent",
  ["sais", "sais", "sait", "savons", "savez", "savent"],
  [
    ["sait", "c'est", "sé"],
    ["sait", "ses"],
    ["sais", "c'est", "ses"],
    ["savont", "savent"],
    ["savoir", "savé"],
    ["save", "savents"],
  ], 3);
addTable("mettre", "présent",
  ["mets", "mets", "met", "mettons", "mettez", "mettent"],
  [
    ["met", "mais", "mes"],
    ["met", "mais"],
    ["mets", "mais"],
    ["metons", "mettont"],
    ["mettre", "metté"],
    ["metent", "mette"],
  ], 3);
addTable("promettre", "présent",
  ["promets", "promets", "promet", "promettons", "promettez", "promettent"],
  [
    ["promet", "promet"],
    ["promet"],
    ["promets"],
    ["prometons"],
    ["promettre"],
    ["prometent"],
  ], 3);
addTable("partir", "présent",
  ["pars", "pars", "part", "partons", "partez", "partent"],
  [
    ["part", "par"],
    ["part", "par"],
    ["pars", "part"],
    ["partont", "partent"],
    ["partir", "parti"],
    ["parte", "partents"],
  ], 2);
for (const [inf, je, il, nous, vous, ils] of [
  ["sortir", "sors", "sort", "sortons", "sortez", "sortent"],
  ["dormir", "dors", "dort", "dormons", "dormez", "dorment"],
  ["sentir", "sens", "sent", "sentons", "sentez", "sentent"],
  ["servir", "sers", "sert", "servons", "servez", "servent"],
  ["mentir", "mens", "ment", "mentons", "mentez", "mentent"],
]) {
  addTable(inf, "présent", [je, je, il, nous, vous, ils], [
    [il, je.slice(0, -1)],
    [il],
    [je],
    [ils, nous.slice(0, -1)],
    [inf, il],
    [il + "e", je],
  ], 3);
}
addTable("courir", "présent",
  ["cours", "cours", "court", "courons", "courez", "courent"],
  [
    ["court", "cour"],
    ["court", "cour"],
    ["cours", "cour"],
    ["couront", "courent"],
    ["courir", "courrez", "courez"],
    ["courrent", "coure"],
  ], 3);
addTable("lire", "présent",
  ["lis", "lis", "lit", "lisons", "lisez", "lisent"],
  [
    ["lit", "li"],
    ["lit", "li"],
    ["lis", "li"],
    ["lisont", "lisent"],
    ["lire", "lizé"],
    ["lise", "lisents"],
  ], 2);
addTable("écrire", "présent",
  ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"],
  [
    ["écrit", "écri"],
    ["écrit", "écri"],
    ["écris", "écrit"],
    ["écrivont", "écrivons"],
    ["écrire", "écrivez"],
    ["écrive", "écrivents"],
  ], 3);
addTable("ouvrir", "présent",
  ["ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent"],
  [
    ["ouvrent", "ouvre"],
    ["ouvre", "ouvert"],
    ["ouvres", "ouvrent"],
    ["ouvront", "ouvrent"],
    ["ouvrir", "ouvré"],
    ["ouvre", "ouvrents"],
  ], 3);
addTable("offrir", "présent",
  ["offre", "offres", "offre", "offrons", "offrez", "offrent"],
  [
    ["offrent", "offre"],
    ["offre", "offert"],
    ["offres"],
    ["offront"],
    ["offrir", "offré"],
    ["offre", "offrents"],
  ], 3);
addTable("découvrir", "présent",
  ["découvre", "découvres", "découvre", "découvrons", "découvrez", "découvrent"],
  [
    ["découvrent"],
    ["découvre"],
    ["découvres"],
    ["découvront"],
    ["découvrir"],
    ["découvre"],
  ], 3);
addTable("souffrir", "présent",
  ["souffre", "souffres", "souffre", "souffrons", "souffrez", "souffrent"],
  [
    ["souffrent", "soufre"],
    ["souffre", "soufre"],
    ["souffres"],
    ["souffront", "soufrons"],
    ["souffrir"],
    ["souffre", "soufrent"],
  ], 3);
addTable("connaître", "présent",
  ["connais", "connais", "connaît", "connaissons", "connaissez", "connaissent"],
  [
    ["connaît", "conait"],
    ["connaît", "connait"],
    ["connais", "connait"],
    ["connaisons", "connaitons"],
    ["connaître", "connaisez"],
    ["connaise", "connaisents"],
  ], 3);
addTable("finir", "présent",
  ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
  [
    ["finit", "fini"],
    ["finit", "fini"],
    ["finis", "fini"],
    ["finisons", "finissont"],
    ["finir", "finisé"],
    ["finise", "finissents"],
  ], 2);
for (const inf of ["choisir", "grandir", "réussir", "remplir", "rougir", "grossir", "punir", "obéir", "agir", "réfléchir"]) {
  const s = inf.slice(0, -2);
  addTable(inf, "présent",
    [s + "is", s + "is", s + "it", s + "issons", s + "issez", s + "issent"],
    [
      [s + "it", s + "i"],
      [s + "it", s + "i"],
      [s + "is", s + "i"],
      [s + "isons", s + "issont"],
      [inf, s + "isé"],
      [s + "ise", s + "issents"],
    ], 3);
  addInfinitif(inf, [s + "i", s + "ie", noAccent(inf)], 3);
}
addTable("attendre", "présent",
  ["attends", "attends", "attend", "attendons", "attendez", "attendent"],
  [
    ["attend", "atten"],
    ["attend"],
    ["attends"],
    ["attendont"],
    ["attendre"],
    ["attende", "attendents"],
  ], 3);
for (const inf of ["entendre", "répondre", "perdre", "vendre", "rendre", "descendre", "défendre", "fondre"]) {
  const stem = inf.slice(0, -2);
  addTable(inf, "présent",
    [stem + "s", stem + "s", stem, stem + "ons", stem + "ez", stem + "ent"],
    [
      [stem, stem.slice(0, -1)],
      [stem],
      [stem + "s"],
      [stem + "ont"],
      [inf],
      [stem + "e", stem + "ents"],
    ], 3);
  addInfinitif(inf, [stem + "u", stem.slice(0, -1)], 3);
}
addTable("battre", "présent",
  ["bats", "bats", "bat", "battons", "battez", "battent"],
  [
    ["bat", "batt"],
    ["bat"],
    ["bats", "batt"],
    ["batons", "battont"],
    ["battre"],
    ["batent", "batte"],
  ], 3);

addInfinitif("être", ["été", "etre", "être"], 2);
addInfinitif("avoir", ["eu", "avoire", "avoir"], 2);
addInfinitif("aller", ["allé", "aler", "aller"], 2);
addInfinitif("faire", ["fait", "fer", "faire"], 2);
addInfinitif("dire", ["dit", "dire"], 2);
addInfinitif("venir", ["venu", "venir"], 3);
addInfinitif("tenir", ["tenu", "tenir"], 3);
addInfinitif("voir", ["vu", "voirre"], 3);
addInfinitif("prendre", ["pris", "prend"], 2);
addInfinitif("apprendre", ["appris", "apprend"], 3);
addInfinitif("comprendre", ["compris", "comprend"], 3);
addInfinitif("pouvoir", ["pu", "pouvoire"], 3);
addInfinitif("vouloir", ["voulu", "voulouar"], 3);
addInfinitif("devoir", ["dû", "du"], 3);
addInfinitif("savoir", ["su", "savoirre"], 3);
addInfinitif("mettre", ["mis", "mettre"], 3);
addInfinitif("partir", ["parti", "partire"], 2);
addInfinitif("lire", ["lu", "lire"], 2);
addInfinitif("écrire", ["écrit", "écrire"], 2);
addInfinitif("ouvrir", ["ouvert", "ouvrire"], 3);
addInfinitif("offrir", ["offert", "offrire"], 3);
addInfinitif("connaître", ["connu", "connaitre"], 3);
addInfinitif("courir", ["couru", "courrire"], 3);
addInfinitif("finir", ["fini", "finire"], 2);
addInfinitif("attendre", ["attendu", "attendre"], 3);
addInfinitif("battre", ["battu", "battre"], 3);
addInfinitif("naître", ["né", "naitre"], 3);

// Futur
const FUTURS = [
  ["être", "ser", ["ét", "être"]],
  ["avoir", "aur", ["av", "avoir"]],
  ["aller", "ir", ["all", "aller"]],
  ["faire", "fer", ["fair", "faire"]],
  ["venir", "viendr", ["venir", "viend"]],
  ["voir", "verr", ["voir", "ver"]],
  ["prendre", "prendr", ["prendre", "prend"]],
  ["apprendre", "apprendr", ["apprendre", "apprend"]],
  ["pouvoir", "pourr", ["pouvoir", "pour"]],
  ["vouloir", "voudr", ["vouloir", "voud"]],
  ["devoir", "devr", ["devoir", "dev"]],
  ["savoir", "saur", ["savoir", "sau"]],
  ["dire", "dir", ["dire", "di"]],
  ["mettre", "mettr", ["mettre", "mett"]],
  ["partir", "partir", ["parti"]],
  ["finir", "finir", ["fini"]],
  ["lire", "lir", ["lire"]],
  ["écrire", "écrir", ["écrire"]],
  ["connaître", "connaîtr", ["connaître", "connaitr"]],
  ["aimer", "aimer", ["aimé"]],
  ["jouer", "jouer", ["joué"]],
  ["manger", "manger", ["mangé"]],
  ["parler", "parler", ["parlé"]],
  ["regarder", "regarder", ["regardé"]],
  ["appeler", "appeller", ["appeler"]],
  ["jeter", "jetter", ["jeter"]],
  ["envoyer", "enverr", ["envoyer", "enver"]],
  ["acheter", "achèter", ["acheter"]],
  ["essayer", "essaier", ["essayer"]],
  ["préférer", "préférer", ["préfèrer"]],
  ["lever", "lèver", ["lever"]],
];
for (const [inf, stem, alts] of FUTURS) addFutur(inf, stem, 3, alts);

// Passé composé avec avoir
const PASSE_AVOIR = [
  ["être", "été"],
  ["avoir", "eu"],
  ["faire", "fait"],
  ["dire", "dit"],
  ["voir", "vu"],
  ["prendre", "pris"],
  ["apprendre", "appris"],
  ["comprendre", "compris"],
  ["pouvoir", "pu"],
  ["vouloir", "voulu"],
  ["devoir", "dû"],
  ["savoir", "su"],
  ["mettre", "mis"],
  ["promettre", "promis"],
  ["finir", "fini"],
  ["choisir", "choisi"],
  ["réussir", "réussi"],
  ["manger", "mangé"],
  ["aimer", "aimé"],
  ["jouer", "joué"],
  ["parler", "parlé"],
  ["regarder", "regardé"],
  ["écouter", "écouté"],
  ["habiter", "habité"],
  ["donner", "donné"],
  ["trouver", "trouvé"],
  ["lire", "lu"],
  ["écrire", "écrit"],
  ["ouvrir", "ouvert"],
  ["offrir", "offert"],
  ["connaître", "connu"],
  ["attendre", "attendu"],
  ["entendre", "entendu"],
  ["répondre", "répondu"],
  ["perdre", "perdu"],
  ["vendre", "vendu"],
  ["courir", "couru"],
  ["dormir", "dormi"],
  ["sentir", "senti"],
  ["servir", "servi"],
  ["battre", "battu"],
];
for (const [inf, part] of PASSE_AVOIR) addPasseAvoir(inf, part, 3);

addPasseEtre("aller", "allé", "allée", "allés", "allées");
addPasseEtre("arriver", "arrivé", "arrivée", "arrivés", "arrivées");
addPasseEtre("entrer", "entré", "entrée", "entrés", "entrées");
addPasseEtre("partir", "parti", "partie", "partis", "parties");
addPasseEtre("sortir", "sorti", "sortie", "sortis", "sorties");
addPasseEtre("venir", "venu", "venue", "venus", "venues");
addPasseEtre("rester", "resté", "restée", "restés", "restées");
addPasseEtre("tomber", "tombé", "tombée", "tombés", "tombées");
addPasseEtre("naître", "né", "née", "nés", "nées");

// rester / tomber à l'infinitif et au présent déjà partiellement couverts
addRegularPresent("rester", 2);
addInfinitif("rester", ["resté", "reste"], 3);
addRegularPresent("tomber", 2);
// tomber already if in ER? not in ER list. good.

// Imparfait
addTable("être", "imparfait",
  ["étais", "étais", "était", "étions", "étiez", "étaient"],
  [
    ["était", "été", "etais"],
    ["était", "été"],
    ["étais", "été", "etait"],
    ["étaient", "étions", "étion"],
    ["étiez", "était", "étiez"],
    ["était", "étais", "étaients"],
  ], 4);
const IMPARFAIT_NOUS = {
  avoir: "avons",
  aller: "allons",
  faire: "faisons",
  dire: "disons",
  venir: "venons",
  prendre: "prenons",
  voir: "voyons",
  finir: "finissons",
  aimer: "aimons",
  manger: "mangeons",
  parler: "parlons",
  pouvoir: "pouvons",
  vouloir: "voulons",
  savoir: "savons",
  mettre: "mettons",
  connaître: "connaissons",
  écrire: "écrivons",
  partir: "partons",
  attendre: "attendons",
  lire: "lisons",
  ouvrir: "ouvrons",
  courir: "courons",
  commencer: "commençons",
};
for (const [inf, nous] of Object.entries(IMPARFAIT_NOUS)) addImparfait(inf, nous, 4);

// Impératif
function erImp(inf) {
  const rows = presentEr(inf);
  const tu = rows[0][1];
  const nous = rows[3][1];
  const vous = rows[4][1];
  addImp(inf, tu, nous, vous, 3,
    [tu + "s", inf, tu.slice(0, -1) + "é"],
    [inf, tu],
    [inf, tu.slice(0, -1) + "é"]);
}
for (const inf of ["aimer", "jouer", "chanter", "parler", "regarder", "écouter", "manger", "dessiner", "chercher", "donner", "fermer", "continuer"]) {
  erImp(inf);
}
addImp("être", "sois", "soyons", "soyez", 3, ["soit", "es", "sui"], ["être", "sommes"], ["êtes", "soyez"]);
addImp("avoir", "aie", "ayons", "ayez", 3, ["ais", "ai", "aies"], ["avons", "ayons"], ["avez", "ayez"]);
addImp("aller", "va", "allons", "allez", 3, ["vas", "vais", "aller"], ["aller", "vont"], ["allé", "aller"]);
addImp("faire", "fais", "faisons", "faites", 3, ["fait", "faire"], ["faire", "font"], ["faisez", "faites"]);
addImp("dire", "dis", "disons", "dites", 3, ["dit", "dire"], ["dire"], ["disez", "dites"]);
addImp("lire", "lis", "lisons", "lisez", 3, ["lit", "lire"], ["lire"], ["lire"]);
addImp("écrire", "écris", "écrivons", "écrivez", 3, ["écrit", "écrire"], ["écrire"], ["écrire"]);
addImp("prendre", "prends", "prenons", "prenez", 3, ["prend", "prendre"], ["prendre"], ["prendre"]);
addImp("venir", "viens", "venons", "venez", 3, ["vient", "venir"], ["venir"], ["venir"]);
addImp("finir", "finis", "finissons", "finissez", 3, ["fini", "finit"], ["finir"], ["finir"]);
addImp("ouvrir", "ouvre", "ouvrons", "ouvrez", 3, ["ouvres", "ouvrir"], ["ouvrir"], ["ouvrir"]);
addImp("attendre", "attends", "attendons", "attendez", 3, ["attend", "attendre"], ["attendre"], ["attendre"]);

// Pronominaux très utiles en CE2
const REFLEX = [
  ["se laver", "présent", "je", "je me lave", ["je me laves", "je me lavent", "je me lav", "je m'lave"]],
  ["se laver", "présent", "tu", "tu te laves", ["tu te lave", "tu te lavent", "tu t'laves"]],
  ["se laver", "présent", "il/elle", "il se lave", ["il se laves", "il se lavent"]],
  ["se laver", "présent", "nous", "nous nous lavons", ["nous nous lavent", "nous nous lavonz"]],
  ["se laver", "présent", "vous", "vous vous lavez", ["vous vous laver", "vous vous lavé"]],
  ["se laver", "présent", "ils/elles", "ils se lavent", ["ils se lave", "ils se laves"]],
  ["s'appeler", "présent", "je", "je m'appelle", ["je m'appel", "je m'apelle", "je m'appelles", "j'appelle"]],
  ["s'appeler", "présent", "tu", "tu t'appelles", ["tu t'appelle", "tu t'apelles", "tu t'appel"]],
  ["s'appeler", "présent", "il", "il s'appelle", ["il s'appel", "il s'apelle", "il s'appellent"]],
  ["s'appeler", "présent", "elle", "elle s'appelle", ["elle s'appel", "elle s'apelle"]],
  ["s'appeler", "présent", "nous", "nous nous appelons", ["nous nous appellons", "nous nous appeller"]],
  ["s'appeler", "présent", "vous", "vous vous appelez", ["vous vous appellez", "vous vous appeler"]],
  ["s'appeler", "présent", "ils", "ils s'appellent", ["ils s'appelle", "ils s'apelent"]],
  ["se lever", "présent", "je", "je me lève", ["je me leve", "je me lèves", "je me lèvent"]],
  ["se lever", "présent", "tu", "tu te lèves", ["tu te lève", "tu te léves"]],
  ["se lever", "présent", "il/elle", "il se lève", ["il se lèves", "il se leve"]],
  ["se lever", "présent", "nous", "nous nous levons", ["nous nous lèvons", "nous nous lèvent"]],
  ["se lever", "présent", "vous", "vous vous levez", ["vous vous lèvez", "vous vous lever"]],
  ["se lever", "présent", "ils/elles", "ils se lèvent", ["ils se lève", "ils se leve"]],
  ["s'habiller", "présent", "je", "je m'habille", ["je m'abile", "je m'habile", "je m'habilles"]],
  ["s'habiller", "présent", "tu", "tu t'habilles", ["tu t'habille", "tu t'habiles"]],
  ["s'habiller", "présent", "il/elle", "il s'habille", ["il s'habiles", "il s'habille"]],
  ["s'habiller", "présent", "nous", "nous nous habillons", ["nous nous habilons", "nous nous habillent"]],
  ["s'habiller", "présent", "vous", "vous vous habillez", ["vous vous habillez", "vous vous habiller"]],
  ["s'habiller", "présent", "ils/elles", "ils s'habillent", ["ils s'habille", "ils s'habilent"]],
];
for (const [inf, tense, person, form, bad] of REFLEX) {
  addConj(inf, tense, person, form, bad, 3, false);
}

// ---------------------------------------------------------------------------
// Nature du mot : adjectif (avec l'accord), nom, invariable
// ---------------------------------------------------------------------------

const INVARIABLE = new Set([
  "toujours", "beaucoup", "encore", "jamais", "souvent", "maintenant",
  "après", "avant", "pendant", "depuis", "derrière", "devant", "très",
  "déjà", "bientôt", "aussi", "alors", "ensuite", "enfin", "surtout",
  "vraiment", "vite", "lentement", "doucement", "heureusement", "longtemps",
  "facilement", "gentiment", "voilà", "voici", "chez", "parce que",
  "pourquoi", "comment", "combien", "hier", "demain"
]);

function genderLabel(form, feminine) {
  const same = /(s|x)$/i.test(form);
  if (feminine) return same ? "adjectif · féminin · même au pluriel" : "adjectif · singulier · féminin";
  return same ? "adjectif · masculin · même au pluriel" : "adjectif · singulier · masculin";
}

function retag(item) {
  const g = item.g;
  const t = item.t;
  if (/ · (présent|futur|imparfait|passé|impératif)/.test(g)) return g;
  if (g === "On va ___" || g.includes("___")) return g;
  if (g === "nom" || g.startsWith("nom · ") || g.startsWith("adjectif") || g.startsWith("invariable") || g.startsWith("déterminant")) return g;
  if (g === "pour un garçon" || g === "couleur · garçon" || g === "un garçon") return genderLabel(t, false);
  if (g === "pour une fille" || g === "couleur · fille" || g === "une fille") return genderLabel(t, true);
  if (g === "plusieurs garçons") return "adjectif · pluriel · masculin";
  if (g === "plusieurs filles") return "adjectif · pluriel · féminin";
  if (g === "adjectif" || g === "couleur") {
    if (t === "marron") return "adjectif · invariable";
    return "adjectif · singulier · masculin ou féminin";
  }
  if (g === "animal · un seul" || g === "un seul") return "nom · singulier";
  if (g === "animal · plusieurs" || g === "plusieurs") return "nom · pluriel";
  if (g === "nombre" || g === "nombre 100") return "invariable · nombre";
  if (g === "adverbe" || INVARIABLE.has(t)) return "invariable";
  return "nom · " + g;
}

for (const item of bank) item.g = retag(item);

// ---------------------------------------------------------------------------
// Nettoyage, contrôles, écriture
// ---------------------------------------------------------------------------

// Retire les doublons exacts et les fautes devenues égales à la forme juste
// après élision. Fusionne les mauvaises graphies.
const merged = new Map();
for (const item of bank) {
  const b = uniqueWrongs(item.t, item.b).filter((w) => w !== item.t);
  if (!b.length) {
    skipped.push(item.t + " | " + item.g);
    continue;
  }
  const key = item.g + "||" + item.t;
  if (!merged.has(key)) merged.set(key, { t: item.t, b, d: item.d, g: item.g });
  else {
    const prev = merged.get(key);
    prev.b = uniqueWrongs(prev.t, [...prev.b, ...b]);
    prev.d = Math.min(prev.d, item.d);
  }
}

let words = [...merged.values()];

// "essaye" est une graphie admise : ne jamais la compter comme une faute.
words = words
  .map((item) => ({
    ...item,
    b: item.b.filter((w) => !["essaye", "j'essaye", "essayes", "j'essayes"].includes(w)),
  }))
  .filter((item) => item.b.length > 0);

const EXPECT = {
  "aimer|présent|je": "j'aime",
  "aimer|présent|tu": "aimes",
  "aimer|présent|il/elle": "aime",
  "aimer|présent|nous": "aimons",
  "aimer|présent|vous": "aimez",
  "aimer|présent|ils/elles": "aiment",
  "tourner|présent|je": "tourne",
  "tourner|présent|tu": "tournes",
  "tourner|présent|il/elle": "tourne",
  "tourner|présent|nous": "tournons",
  "tourner|présent|vous": "tournez",
  "tourner|présent|ils/elles": "tournent",
  "manger|présent|nous": "mangeons",
  "manger|présent|je": "mange",
  "commencer|présent|nous": "commençons",
  "lancer|présent|nous": "lançons",
  "habiter|présent|je": "j'habite",
  "écouter|présent|je": "j'écoute",
  "créer|présent|je": "crée",
  "créer|présent|nous": "créons",
  "appeler|présent|je": "j'appelle",
  "appeler|présent|nous": "appelons",
  "appeler|présent|ils/elles": "appellent",
  "jeter|présent|je": "jette",
  "jeter|présent|nous": "jetons",
  "jeter|présent|ils/elles": "jettent",
  "préférer|présent|je": "préfère",
  "préférer|présent|nous": "préférons",
  "préférer|présent|ils/elles": "préfèrent",
  "préférer|présent|vous": "préférez",
  "espérer|présent|je": "j'espère",
  "espérer|présent|nous": "espérons",
  "acheter|présent|je": "j'achète",
  "acheter|présent|nous": "achetons",
  "acheter|présent|ils/elles": "achètent",
  "emmener|présent|je": "j'emmène",
  "emmener|présent|nous": "emmenons",
  "essayer|présent|je": "j'essaie",
  "essayer|présent|nous": "essayons",
  "envoyer|présent|je": "j'envoie",
  "envoyer|présent|nous": "envoyons",
  "être|présent|je": "suis",
  "être|présent|tu": "es",
  "être|présent|il/elle": "est",
  "être|présent|nous": "sommes",
  "être|présent|vous": "êtes",
  "être|présent|ils/elles": "sont",
  "avoir|présent|je": "j'ai",
  "avoir|présent|tu": "as",
  "avoir|présent|vous": "avez",
  "aller|présent|je": "vais",
  "aller|présent|ils/elles": "vont",
  "faire|présent|vous": "faites",
  "dire|présent|vous": "dites",
  "dire|présent|ils/elles": "disent",
  "prendre|présent|je": "prends",
  "prendre|présent|ils/elles": "prennent",
  "prendre|présent|nous": "prenons",
  "venir|présent|ils/elles": "viennent",
  "voir|présent|nous": "voyons",
  "pouvoir|présent|ils/elles": "peuvent",
  "vouloir|présent|il/elle": "veut",
  "écrire|présent|je": "j'écris",
  "écrire|présent|nous": "écrivons",
  "écrire|présent|il/elle": "écrit",
  "connaître|présent|il/elle": "connaît",
  "connaître|présent|nous": "connaissons",
  "courir|présent|vous": "courez",
  "ouvrir|présent|je": "j'ouvre",
  "finir|présent|nous": "finissons",
  "finir|présent|ils/elles": "finissent",
  "attendre|présent|je": "j'attends",
  "attendre|présent|il/elle": "attend",
  "battre|présent|je": "bats",
  "battre|présent|nous": "battons",
  "aimer|futur|je": "j'aimerai",
  "être|futur|je": "serai",
  "avoir|futur|je": "j'aurai",
  "aller|futur|je": "j'irai",
  "faire|futur|je": "ferai",
  "voir|futur|je": "verrai",
  "prendre|futur|je": "prendrai",
  "appeler|futur|je": "j'appellerai",
  "jeter|futur|je": "jetterai",
  "envoyer|futur|je": "j'enverrai",
  "acheter|futur|je": "j'achèterai",
  "essayer|futur|je": "j'essaierai",
  "préférer|futur|je": "préférerai",
  "devoir|passé composé|je": "j'ai dû",
  "manger|passé composé|je": "j'ai mangé",
  "manger|passé composé|tu": "as mangé",
  "aller|passé composé|je · garçon": "suis allé",
  "aller|passé composé|je · fille": "suis allée",
  "aller|passé composé|elle": "est allée",
  "aller|passé composé|ils": "sont allés",
  "venir|passé composé|elle": "est venue",
  "être|imparfait|je": "j'étais",
  "être|imparfait|tu": "étais",
  "manger|imparfait|vous": "mangiez",
  "commencer|imparfait|nous": "commencions",
  "commencer|imparfait|vous": "commenciez",
  "commencer|imparfait|ils/elles": "commençaient",
  "régler|présent|je": "règle",
  "régler|présent|nous": "réglons",
  "régler|présent|ils/elles": "règlent",
  "régler|présent|vous": "réglez",
  "posséder|présent|je": "possède",
  "posséder|présent|nous": "possédons",
  "céder|présent|je": "cède",
  "répéter|présent|je": "répète",
  "répéter|présent|nous": "répétons",
  "être|imparfait|ils/elles": "étaient",
  "avoir|imparfait|je": "j'avais",
  "avoir|imparfait|nous": "avions",
  "manger|imparfait|je": "mangeais",
  "manger|imparfait|nous": "mangions",
  "aimer|imparfait|je": "j'aimais",
  "commencer|imparfait|je": "commençais",
  "finir|imparfait|nous": "finissions",
  "faire|imparfait|ils/elles": "faisaient",
  "aller|imparfait|je": "j'allais",
  "écrire|imparfait|je": "j'écrivais",
  "dire|impératif|vous": "dites",
  "être|impératif|tu": "sois",
  "avoir|impératif|tu": "aie",
  "aimer|impératif|tu": "aime",
  "finir|impératif|tu": "finis",
  "faire|impératif|vous": "faites",
};

const byKey = new Map(words.map((w) => {
  const g = w.g;
  const parts = g.split(" · ");
  // inf · tense · person  OR clue without tense
  return [parts.length >= 3 ? `${parts[0]}|${parts[1]}|${parts.slice(2).join(" · ")}` : g, w];
}));

const errors = [];
for (const [key, expected] of Object.entries(EXPECT)) {
  const found = words.find((w) => {
    const parts = w.g.split(" · ");
    if (parts.length < 3) return false;
    const k = `${parts[0]}|${parts[1]}|${parts.slice(2).join(" · ")}`;
    return k === key;
  });
  if (!found) errors.push("MANQUE " + key + " (attendu " + expected + ")");
  else if (found.t !== expected) errors.push(key + " : obtenu « " + found.t + " », attendu « " + expected + " »");
}

function mustHave(t, g, msg) {
  if (!words.some((w) => w.t === t && w.g === g)) errors.push(msg || (t + " → " + g));
}
mustHave("calmes", "adjectif · pluriel · masculin ou féminin");
mustHave("calme", "adjectif · singulier · masculin ou féminin");
mustHave("petits", "adjectif · pluriel · masculin");
mustHave("petites", "adjectif · pluriel · féminin");
mustHave("heureux", "adjectif · masculin · même au pluriel");
mustHave("marron", "adjectif · invariable");
mustHave("hier", "invariable");
mustHave("vite", "invariable");
mustHave("vingt", "invariable · nombre");
if (!words.some((w) => w.t === "chat" && w.g.startsWith("nom"))) errors.push("chat devrait être un nom");
if (words.some((w) => w.g === "adjectif" || w.g === "pour un garçon" || w.g === "mot")) errors.push("étiquette trop vague");

const ILS_ER_SPECIAL = { aller: "vont" };
for (const w of words) {
  const parts = w.g.split(" · ");
  if (parts.length < 3 || parts[1] !== "présent") continue;
  const person = parts.slice(2).join(" · ");
  if (person !== "ils/elles" && person !== "ils" && person !== "elles") continue;
  const inf = parts[0];
  if (!inf.endsWith("er")) continue;
  const special = ILS_ER_SPECIAL[inf];
  if (special) {
    if (w.t !== special) errors.push(inf + " · " + person + " : « " + w.t + " » au lieu de « " + special + " »");
    continue;
  }
  if (!w.t.endsWith("ent")) errors.push(inf + " · " + person + " affiche « " + w.t + " » : la terminaison doit être -ent");
  const singular = words.find((other) => {
    const p = other.g.split(" · ");
    return p[0] === inf && p[1] === "présent" && (p[2] === "il/elle" || p[2] === "il" || p[2] === "elle");
  });
  if (singular && w.t === singular.t) errors.push(inf + " : ils/elles reprend la forme du singulier « " + w.t + " »");
}

if (errors.length) {
  console.error(errors.join("\n"));
  throw new Error('Banque de mots invalide');
}

// "clef" est admis pour "clé" : on ne le compte pas comme une faute.
words = words
  .map((item) => ({ ...item, b: item.b.filter((w) => !(item.t === "clé" && w === "clef")) }))
  .filter((item) => item.b.length);

const byD = [0, 0, 0, 0, 0];
let verbs = 0;
for (const w of words) {
  byD[w.d] = (byD[w.d] || 0) + 1;
  if (w.g.includes(" · présent") || w.g.includes(" · futur") || w.g.includes(" · passé") || w.g.includes(" · imparfait") || w.g.includes(" · impératif") || w.g === "On va ___") verbs++;
}

if (words.length < 1000) {
  console.error("Seulement " + words.length + " entrées.");
  throw new Error('Banque de mots invalide');
}

words.sort((a, b) => a.d - b.d || a.g.localeCompare(b.g, "fr") || a.t.localeCompare(b.t, "fr"));

window.WORD_BANK = words;
window.WORD_BANK_INFO = { count: words.length, byD: byD, verbs: verbs };
console.log('Mots', words.length, byD, 'conjugaison', verbs);
