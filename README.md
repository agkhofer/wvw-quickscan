# WvW Quick Scan Dashboard

Statische, client-side webapp die de Excel-exports uit Qualtrics (Medewerkerscan
en Werkgeverscan) omzet naar het interactieve dashboard, gefilterd op
organisatiecode. Alles draait in de browser van de gebruiker — er wordt niets
geüpload naar een server.

## Hoe het werkt

1. Bedrijfsadviseur kiest **Medewerkersscan** of **Werkgeversscan**.
2. Upload het .xlsx-bestand zoals geëxporteerd vanuit Qualtrics
   (Data & Analysis → Export & Import → Export Data → CSV/XLSX).
3. Vult de **organisatiecode** in. Alleen de rijen met die code (en
   `Finished = True`) worden meegenomen.
4. Het dashboard wordt lokaal in de browser opgebouwd (SheetJS parseert het
   Excel-bestand, alle berekeningen gebeuren in JavaScript).
5. Optioneel: PDF downloaden via de knop rechtsboven. De PDF wordt altijd op desktopbreedte
   opgebouwd en op plekken geknipt waar geen balk, kaart of grafiek doorsneden wordt.
6. Op het werkgevers-dashboard kan optioneel ook de bijbehorende
   medewerkersscan (zelfde organisatiecode) geüpload worden — dan verschijnt
   sectie 5 met de vergelijking werkgever vs. medewerker.

## Kolomherkenning

- **Medewerkersscan**: organisatiecode zit in de kolom `OrgaCode`.
- **Werkgeversscan**: organisatiecode zit in de kolom `PersCode` (dit is de
  enige code die in die scan wordt gevraagd).

Als Qualtrics ooit een kolom hernoemt, pas dit dan aan in
`js/app.js` (zoek naar `codeCol`).

## Projectstructuur

```
index.html                     landingpagina + flow (scantype → upload → code → dashboard)
css/shell.css                  landing/upload/orgcode-flow, WvW huisstijl
css/dashboard-common.css       gedeelde onderdelen (fit-balken, categorieblokken, tooltip)
css/employee-dashboard.css     styling medewerkers-dashboard (scoped .dash-employee)
css/employer-dashboard.css     styling werkgevers-dashboard (scoped .dash-employer)
js/constructs.js               construct-lijsten (24 medewerker- / 29 werkgeverconstructen) + schaalmappings
js/parser.js                   Excel inlezen (SheetJS) + omzetten naar dashboard-data
js/shared.js                   hover-omschrijvingen, categoriekleuren, gedeelde fit-sectie
js/render-employee.js          bouwt het medewerkers-dashboard in de DOM
js/render-employer.js          bouwt het werkgevers-dashboard in de DOM
js/pdf-export.js               PDF-export (vaste breedte, slimme paginaknips, paginanummers)
js/app.js                      stappen-flow, drag&drop upload, orgcode-validatie
```

Externe libraries (via CDN, geen buildstap nodig):
- [SheetJS/xlsx](https://cdn.jsdelivr.net) — Excel parsen in de browser
- [html2canvas](https://html2canvas.hertzen.com/) en [jsPDF](https://github.com/parallax/jsPDF) — dashboard naar PDF

## Publiceren op GitHub Pages

1. Kopieer de inhoud van deze map naar de root van je repo
   (`fcfc-cnos/wvw-quickscan`), of naar een `/docs` map als je die als bron
   gebruikt.
2. Commit & push naar de branch die GitHub Pages bedient (meestal `main`).
3. Zet in **Settings → Pages** de bron op die branch/map (als dat nog niet
   staat).
4. Klaar — de site is bereikbaar op `https://fcfc-cnos.github.io/wvw-quickscan/`.

Geen build-stap, geen server, geen dependencies om te installeren: het zijn
platte HTML/CSS/JS-bestanden.

## Testen op je eigen computer

```bash
cd wvw-quickscan
python3 -m http.server 8000
# open http://localhost:8000
```

## Uitbreiden

- **Nieuwe/gewijzigde constructen**: pas `EMPLOYEE_CONSTRUCTS` /
  `EMPLOYER_CONSTRUCTS` in `js/constructs.js` aan. De volgorde moet gelijk
  blijven aan `wvw_c1..N` in de Qualtrics-export. Per construct staan daar
  naam, categorie en de omschrijving voor de hover-tekst.
- **Omschrijvingen**: de huidige teksten zijn concepten. Vervang ze door de
  exacte formulering uit de scans (veld `desc`).
- **Categoriekleuren**: `CATEGORY_COLORS` bovenaan `js/constructs.js`.
- **Merk-kleuren**: CSS-variabelen bovenaan `css/shell.css`
  (`--wvw-purple`, `--wvw-yellow`, `--wvw-lavender`, `--wvw-cream`).
