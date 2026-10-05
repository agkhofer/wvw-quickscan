/* ── WvW construct schemas ──────────────────────────────────────────────
   De koppeling met de Qualtrics-kolommen loopt via `id`:
   id 25 leest wvw_c25 / lk_lk25 / leave_c25. De volgorde in deze lijst is de
   volgorde waarin constructen in het dashboard staan (binnen hun categorie).

   Nieuw construct toevoegen of aanpassen: alleen dit bestand wijzigen.
   - name: naam zoals die in het dashboard staat
   - cat:  categorie (nieuwe categorieen krijgen een grijze kleur, tenzij je
           er hieronder een kleur voor toevoegt in CATEGORY_COLORS)
   - desc: omschrijving voor de hover-tekst, overgenomen uit de Qualtrics-scans
           (medewerkers- en werkgeversscan).
   ─────────────────────────────────────────────────────────────────────── */

// Kleuren zijn gekozen om onderling goed uit elkaar te blijven, ook voor mensen met
// kleurenblindheid of verminderd kleurenzicht. Elke categorie heeft daarnaast een eigen
// vorm (zie CATEGORY_SHAPES in shared.js), zodat kleur nooit het enige verschil is.
const CATEGORY_COLORS = {
  "Leren":           "#1a2fa0",  // donkerblauw
  "Autonomie":       "#ef7b45",  // zalmoranje
  "Relaties":        "#5cc8f0",  // lichtblauw
  "Zinvolheid":      "#e5348e",  // roze
  "Werkdruk":        "#cdb300",  // goud
  "Werktijden":      "#6b3f1d",  // bruin
  "Beloning":        "#9b6fe0",  // violet
  "Org.-uitkomsten": "#111827",  // bijna zwart
  "Overig":          "#9ca3af",  // grijs
};
function catColor(cat) { return CATEGORY_COLORS[cat] || "#9ca3af"; }

const EMPLOYEE_CONSTRUCTS = [
  { id: 1,  name: "Ontwikkelmogelijkheden",        cat: "Leren",      bidir: false, desc: "Kansen om jezelf te ontwikkelen via trainingen of cursussen." },
  { id: 2,  name: "Competentie",                   cat: "Leren",      bidir: true,  desc: "Je voelt je bekwaam en krijgt kansen om je vaardigheden te benutten." },
  { id: 27, name: "Loopbaanmogelijkheden",         cat: "Leren",      bidir: false, desc: "Er zijn reële mogelijkheden voor jou om door te groeien binnen de organisatie." },
  { id: 3,  name: "Autonomie",                     cat: "Autonomie",  bidir: true,  desc: "Vrijheid om zelf te bepalen hoe, wanneer en waar je werkt." },
  { id: 25, name: "Inspraak en invloed",           cat: "Autonomie",  bidir: false, desc: "Je hebt invloed op hoe werk wordt uitgevoerd en beslissingen worden genomen." },
  { id: 5,  name: "Collega's",                     cat: "Relaties",   bidir: true,  desc: "Collega's zijn er voor je en helpen wanneer nodig." },
  { id: 6,  name: "Leidinggevende",                cat: "Relaties",   bidir: false, desc: "Je leidinggevende luistert en ondersteunt je in je werk." },
  { id: 7,  name: "Sfeer op het werk",             cat: "Relaties",   bidir: false, desc: "Je voelt je vrij om ideeën te uiten, fouten te maken en jezelf te zijn zonder angst voor oordeel." },
  { id: 8,  name: "Inclusie en diversiteit",       cat: "Relaties",   bidir: true,  desc: "Iedereen voelt zich welkom, ongeacht achtergrond of kenmerken." },
  { id: 9,  name: "Authenticiteit op het werk",    cat: "Relaties",   bidir: false, desc: "Je kunt jezelf zijn op het werk, ongeacht wie je bent of hoe je denkt." },
  { id: 10, name: "Zinvolheid",                    cat: "Zinvolheid", bidir: false, desc: "Je werk maakt een positief verschil voor anderen of de maatschappij." },
  { id: 11, name: "Aansluiting waarden",           cat: "Zinvolheid", bidir: false, desc: "Jouw waarden passen bij de cultuur van de organisatie." },
  { id: 12, name: "Taakinhoud",                    cat: "Zinvolheid", bidir: true,  desc: "De taken die je uitvoert zijn interessant en je doet ze met plezier." },
  { id: 26, name: "Betrokkenheid en bevlogenheid", cat: "Zinvolheid", bidir: false, desc: "Je voelt je betrokken bij de organisatie, enthousiast over je werk en je gaat er met energie voor." },
  { id: 13, name: "Werkdruk",                      cat: "Werkdruk",   bidir: true,  desc: "De hoeveelheid werk en stress past bij wat je aankan." },
  { id: 14, name: "Lichamelijke uitdaging",        cat: "Werkdruk",   bidir: true,  desc: "De lichamelijke belasting past bij wat je aankan." },
  { id: 15, name: "Emotionele uitdaging",          cat: "Werkdruk",   bidir: true,  desc: "De emotionele belasting past bij wat je aankan." },
  { id: 16, name: "Mentale uitdaging",             cat: "Werkdruk",   bidir: true,  desc: "De mentale belasting past bij wat je aankan." },
  { id: 17, name: "Werk-privébalans",              cat: "Werkdruk",   bidir: true,  desc: "Je hebt voldoende tijd en energie voor je privéleven." },
  { id: 18, name: "Productiviteit",                cat: "Werkdruk",   bidir: true,  desc: "Je kunt je taken effectief uitvoeren zonder dat obstakels je in de weg zitten." },
  { id: 19, name: "Werkuren",                      cat: "Werktijden", bidir: true,  desc: "Het aantal uren dat je werkt past bij wat je wilt." },
  { id: 20, name: "Thuiswerkmogelijkheden",        cat: "Werktijden", bidir: true,  desc: "De mogelijkheid om vanuit huis te werken past bij wat je wilt." },
  { id: 21, name: "Salaris",                       cat: "Beloning",   bidir: false, desc: "Je inkomen past bij wat je verwacht en verdient." },
  { id: 22, name: "Secundaire arbeidsvoorwaarden", cat: "Beloning",   bidir: false, desc: "Extra voorwaarden zoals vakantiedagen, pensioen en bonussen." },
  { id: 23, name: "Contracttype",                  cat: "Beloning",   bidir: false, desc: "Jouw contractvorm (vast of tijdelijk) past bij wat je wilt." },
  { id: 24, name: "Baanzekerheid",                 cat: "Beloning",   bidir: false, desc: "De zekerheid dat jouw baan blijft bestaan." },
];

const EMPLOYER_CONSTRUCTS = [
  { id: 1,  name: "Ontwikkelmogelijkheden",           cat: "Leren",           emp_id: 1,    desc: "De organisatie biedt medewerkers kansen om zich te ontwikkelen via trainingen en opleidingen." },
  { id: 2,  name: "Skills match",                     cat: "Leren",           emp_id: 2,    desc: "De vaardigheden van de medewerkers passen goed bij de taken die ze doen." },
  { id: 3,  name: "Loopbaanmogelijkheden",            cat: "Leren",           emp_id: 27,   desc: "Er zijn reële mogelijkheden voor medewerkers om door te groeien binnen de organisatie." },
  { id: 4,  name: "Autonomie",                        cat: "Autonomie",       emp_id: 3,    desc: "Medewerkers hebben vrijheid om zelf te bepalen hoe, wanneer en waar zij werken." },
  { id: 5,  name: "Inspraak en invloed",              cat: "Autonomie",       emp_id: 25,   desc: "Medewerkers hebben invloed op hoe werk wordt uitgevoerd en beslissingen worden genomen." },
  { id: 6,  name: "Samenwerking tussen collega's",    cat: "Relaties",        emp_id: 5,    desc: "Collega's ondersteunen elkaar en helpen waar nodig." },
  { id: 7,  name: "Leiderschapskwaliteit",            cat: "Relaties",        emp_id: 6,    desc: "Leidinggevenden ondersteunen medewerkers en hebben oog voor hun welzijn." },
  { id: 8,  name: "Sfeer en werkklimaat",             cat: "Relaties",        emp_id: 7,    desc: "Medewerkers voelen zich vrij om ideeën te delen, fouten te maken en hulp te vragen." },
  { id: 30, name: "Authenticiteit op het werk",       cat: "Relaties",        emp_id: 9,    desc: "Medewerkers kunnen zichzelf zijn op het werk, ongeacht wie ze zijn of hoe ze denken." },
  { id: 9,  name: "Inclusie en diversiteit",          cat: "Relaties",        emp_id: 8,    desc: "Iedereen voelt zich welkom en gewaardeerd binnen de organisatie." },
  { id: 10, name: "Personeelsverloop",                cat: "Org.-uitkomsten", emp_id: null, desc: "De organisatie slaagt erin medewerkers te behouden en verloop te beperken." },
  { id: 11, name: "Zinvolheid van het werk",          cat: "Zinvolheid",      emp_id: 10,   desc: "Medewerkers ervaren hun werk als zinvol en betekenisvol." },
  { id: 12, name: "Aansluiting waarden",              cat: "Zinvolheid",      emp_id: 11,   desc: "De waarden van medewerkers sluiten aan bij de organisatiecultuur." },
  { id: 13, name: "Betrokkenheid en bevlogenheid",    cat: "Zinvolheid",      emp_id: 26,   desc: "Medewerkers zijn betrokken, gemotiveerd en werken met energie." },
  { id: 14, name: "Maatschappelijke rol",             cat: "Zinvolheid",      emp_id: null, desc: "De organisatie speelt een zichtbare rol in de regio en draagt bij aan de samenleving." },
  { id: 31, name: "Taakinhoud",                       cat: "Zinvolheid",      emp_id: 12,   desc: "De taken die medewerkers uitvoeren zijn interessant en worden met plezier gedaan." },
  { id: 15, name: "Werkdruk",                         cat: "Werkdruk",        emp_id: 13,   desc: "De werkdruk is beheersbaar en past bij wat medewerkers aankunnen." },
  { id: 16, name: "Fysieke belasting",                cat: "Werkdruk",        emp_id: 14,   desc: "De fysieke belasting van het werk is passend en verantwoord." },
  { id: 17, name: "Emotionele belasting",             cat: "Werkdruk",        emp_id: 15,   desc: "De emotionele belasting van het werk is beheersbaar." },
  { id: 18, name: "Mentale belasting",                cat: "Werkdruk",        emp_id: 16,   desc: "De mentale belasting van het werk is passend bij wat medewerkers aankunnen." },
  { id: 19, name: "Ziekteverzuim",                    cat: "Werkdruk",        emp_id: null, desc: "Het ziekteverzuim is laag en medewerkers zijn inzetbaar." },
  { id: 20, name: "Werk-privébalans",                 cat: "Werkdruk",        emp_id: 17,   desc: "Medewerkers hebben voldoende balans tussen werk en privé." },
  { id: 21, name: "Werkuren",                         cat: "Werktijden",      emp_id: 19,   desc: "Medewerkers hebben voldoende uren om de taken uit te voeren." },
  { id: 22, name: "Thuiswerkmogelijkheden",           cat: "Werktijden",      emp_id: 20,   desc: "Er zijn passende mogelijkheden om vanuit huis te werken." },
  { id: 23, name: "Salaris",                          cat: "Beloning",        emp_id: 21,   desc: "Medewerkers worden eerlijk beloond voor hun werk." },
  { id: 24, name: "Secundaire arbeidsvoorwaarden",    cat: "Beloning",        emp_id: 22,   desc: "De secundaire arbeidsvoorwaarden zijn goed geregeld." },
  { id: 25, name: "Contracttype",                     cat: "Beloning",        emp_id: 23,   desc: "De contractvorm (vast of tijdelijk) van medewerkers past bij wat zij willen." },
  { id: 32, name: "Baanzekerheid",                    cat: "Beloning",        emp_id: 24,   desc: "Medewerkers hebben de zekerheid dat hun baan behouden blijft." },
  { id: 26, name: "Productiviteit",                   cat: "Org.-uitkomsten", emp_id: 18,   desc: "Medewerkers zijn productief." },
  { id: 27, name: "Personeelstekort",                 cat: "Org.-uitkomsten", emp_id: null, desc: "De organisatie heeft voldoende personeel om het werk uit te voeren." },
  { id: 28, name: "Innovatie en toekomstgerichtheid", cat: "Org.-uitkomsten", emp_id: null, desc: "De organisatie innoveert en past zich aan aan veranderingen." },
  { id: 29, name: "Arbeidsmarktpositie",              cat: "Org.-uitkomsten", emp_id: null, desc: "De organisatie is aantrekkelijk als werkgever in de regio." },
];

// Categorieen in vaste volgorde (zie CATEGORY_COLORS)
const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);
function catRank(cat) { const i = CATEGORY_ORDER.indexOf(cat); return i === -1 ? 999 : i; }
function uniqueCats(list) {
  const out = [];
  list.forEach(c => { if (!out.includes(c.cat)) out.push(c.cat); });
  return out.sort((a, b) => catRank(a) - catRank(b));
}
const EMPLOYEE_CATS = uniqueCats(EMPLOYEE_CONSTRUCTS);
const EMPLOYER_CATS = uniqueCats(EMPLOYER_CONSTRUCTS);

/* ── Likert scale label -> number mappings ── */

// "Hoe tevreden bent u..." (1-5)
const SAT_SCALE = {
  "zeer ontevreden": 1, "ontevreden": 2, "neutraal": 3, "tevreden": 4, "zeer tevreden": 5
};
// "Hoe gelukkig bent u..." (1-5)
const HAP_SCALE = {
  "zeer ongelukkig": 1, "niet gelukkig": 2, "neutraal": 3, "gelukkig": 4, "zeer gelukkig": 5
};
// "In hoeverre denkt u dat uw medewerkers..." (1-5)
const MATE_SCALE = {
  "helemaal niet": 1, "in zeer geringe mate": 1, "in geringe mate": 2, "in redelijke mate": 3,
  "in hoge mate": 4, "in zeer hoge mate": 5
};

function scaleLookup(map, raw) {
  if (raw === null || raw === undefined) return null;
  const key = String(raw).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

/* ── Fit-answer categorisation (robust to typos like "Dit pas niet") ── */
function categorizeEmployeeFit(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v.includes("meer")) return "meer";
  if (v.includes("minder")) return "minder";
  if (v.includes("goed")) return "goed";
  return null;
}
function categorizeEmployerFit(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v.includes("knelpunt")) return "knelpunt";
  if (v.includes("beter")) return "beter";
  if (v.includes("goed")) return "goed";
  return null;
}
function categorizeLeave(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v.includes("vertrek")) return "vertrek";
  if (v.includes("blijf")) return "blijf";
  return null;
}

/* ── Korte omschrijvingen van de uitkomstvariabelen (hover + tekst onder de balken) ── */
const OUTCOME_INFO = {
  // medewerkersscan
  sat:    { name: "Werktevredenheid", desc: "Hoe tevreden je over je werk als geheel bent, zoals voorwaarden, omstandigheden, doorgroei en contact met collega's en leidinggevende. Het is een afweging over een langere periode, niet alleen hoe je je nu voelt." },
  hap:    { name: "Werkgeluk",        desc: "Het gevoel dat je werk je geeft: positieve emoties, voldoening en zingeving. Dit kan van moment tot moment verschillen." },
  search: { name: "Actief zoekend",   desc: "Heeft de respondent het afgelopen jaar actief gezocht naar een andere baan?" },
  leave:  { name: "Vertrekintentie",  desc: "Overweegt de respondent de huidige baan in het komende jaar te verlaten?" },
  // werkgeversscan
  er_werkgeluk:    { name: "Werkgeluk mw.",      desc: "Inschatting van de werkgever in hoeverre medewerkers werkgeluk ervaren: het gevoel dat het werk geeft, met positieve emoties en voldoening." },
  er_tevredenheid: { name: "Tevredenheid mw.",   desc: "Inschatting van de werkgever hoe tevreden medewerkers over het algemeen zijn met hun werk, een afweging over een langere periode." },
  er_zinvolheid:   { name: "Zinvolheid mw.",     desc: "Inschatting van de werkgever in hoeverre medewerkers hun werk als waardevol ervaren." },
  er_pct:          { name: "% tevreden mw.",     desc: "Het percentage medewerkers dat volgens de werkgever tevreden is met het werk." },
  er_orgsat:       { name: "Organisatiesucces",  desc: "Hoe tevreden de werkgever zelf is over het functioneren en het succes van de organisatie." },
};
