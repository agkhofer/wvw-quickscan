function renderEmployerDashboard(container, DATA, meta, empLookup) {
  const N = DATA.n;
  const constructs = DATA.constructs;
  const hasCompare = empLookup && Object.keys(empLookup).length > 0;
  const cats = EMPLOYER_CATS.filter(cat => constructs.some(c => c.cat === cat));

  container.innerHTML = `
    <div class="dash dash-employer">
      <div class="header">
        <div>
          <div class="header-brand">Werk van Waarde — Universiteit Groningen</div>
          <div class="header-title">Quick Scan<br><em>Werkgevers</em></div>
          <div class="header-badge">Werkgeversperspectief</div>
        </div>
        <div class="header-meta">
          <strong>${N}</strong>
          respondenten · Bedrijfscode ${escapeHtml(meta.orgCode)}<br>
          Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}
        </div>
      </div>

      <div class="page">
        <div class="kpi-strip">
          <div class="kpi green"><div class="kpi-val">${N}</div><div class="kpi-label">Respondenten</div><div class="kpi-sub">werkgevers</div></div>
          <div class="kpi blue"><div class="kpi-val">${DATA.avg_werkgeluk || '–'}</div><div class="kpi-label">${outcomeLabel('er_werkgeluk')}</div><div class="kpi-sub">inschatting 1–5</div></div>
          <div class="kpi blue"><div class="kpi-val">${DATA.avg_tevredenheid || '–'}</div><div class="kpi-label">${outcomeLabel('er_tevredenheid')}</div><div class="kpi-sub">inschatting 1–5</div></div>
          <div class="kpi amber"><div class="kpi-val">${DATA.avg_sat_pct}%</div><div class="kpi-label">${outcomeLabel('er_pct')}</div><div class="kpi-sub">geschat percentage</div></div>
          <div class="kpi green"><div class="kpi-val">${DATA.avg_orgsat || '–'}</div><div class="kpi-label">${outcomeLabel('er_orgsat')}</div><div class="kpi-sub">tevredenheid 1–5</div></div>
        </div>

        <div class="section-hd">
          <div class="section-num">1</div>
          <div class="section-title">Hoe gaat het op de werkvloer?</div>
          <div class="section-sub">Per construct: gaat goed, kan beter of is een knelpunt</div>
        </div>
        <div id="fit-section"></div>

        <div class="section-hd">
          <div class="section-num">2</div>
          <div class="section-title">Inschatting medewerkersbeleving</div>
          <div class="section-sub">Hoe schatten werkgevers de beleving van hun medewerkers in?</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
          <div id="outcome-left"></div>
          <div id="outcome-right"></div>
        </div>

        <div class="section-hd">
          <div class="section-num">3</div>
          <div class="section-title">Belang per construct</div>
          <div class="section-sub">Hoe belangrijk vinden werkgevers elk aspect (schaal 1–5)</div>
        </div>
        <div class="legend" id="imp-legend"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;">
          <div id="imp-ranking" class="imp-ranking"></div>
          <svg id="radar-svg" viewBox="0 0 360 340" width="360" height="340"></svg>
        </div>

        ${hasCompare ? `
        <div class="section-hd">
          <div class="section-num">4</div>
          <div class="section-title">Vergelijking: werkgevers en medewerkers</div>
          <div class="section-sub">Constructen die in beide scans voorkomen (bedrijfscode ${escapeHtml(meta.orgCode)})</div>
        </div>
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:var(--c-emp)"></div>Werkgever</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--c-wn)"></div>Medewerker (${empLookup.__stats.n} respondenten)</div>
        </div>
        <div class="cmp-title">Tevredenheid: % gaat goed (werkgever) tegenover % past goed (medewerker)</div>
        <div id="compare-fit"></div>

        <div class="cmp-title">Belang: waar lopen de inschattingen uiteen?</div>
        <p class="fit-note">Werkgevers geven aan hoe belangrijk ze een construct vinden om hun medewerkers te behouden. Medewerkers geven aan hoe belangrijk zij het aspect vinden. De vraagstelling is dus niet identiek: lees de verschillen als signaal, niet als exacte meting. Verschillen vanaf 0,5 punt zijn gemarkeerd. Alleen constructen die in beide scans voorkomen.</p>
        <div id="imp-callout" class="cmp-callout"></div>
        <div class="legend">
          <div class="legend-item"><span class="db-key wg"></span>Werkgever (belang voor het behouden van medewerkers)</div>
          <div class="legend-item"><span class="db-key wn"></span>Medewerker (belang van het aspect)</div>
        </div>

        <div class="cmp-title">Gemiddeld belang per categorie</div>
        <div id="compare-radar" class="cmp-radar"></div>

        <div class="cmp-title">Belang per construct</div>
        <div class="fit-controls" data-html2canvas-ignore="true">
          <div class="seg-toggle" role="group" aria-label="Weergave belang">
            <button type="button" data-impview="category" class="active">Per categorie</button>
            <button type="button" data-impview="gap">Grootste verschil eerst</button>
          </div>
        </div>
        <p class="fit-note">Rang = positie onder de gedeelde constructen (werkgever vs medewerker).</p>
        <div id="compare-imp"></div>
        ` : ''}

        <div class="section-hd">
          <div class="section-num">${hasCompare ? 5 : 4}</div>
          <div class="section-title">Organisatiecontext</div>
          <div class="section-sub">Kenmerken van deelnemende organisaties</div>
        </div>
        <div class="context-grid" id="context-grid"></div>
      </div>

      <footer class="dash-footer">Werk van Waarde — Universiteit Groningen &nbsp;·&nbsp; Alle gegevens lokaal verwerkt</footer>
    </div>
  `;

  const $ = sel => container.querySelector(sel);

  // 1. FIT
  renderFitSection($('#fit-section'), constructs, {
    segments: [
      { key: 'goed',     label: 'Dit gaat goed',        color: 'var(--c-good)' },
      { key: 'beter',    label: 'Dit kan beter',        color: 'var(--c-mid)' },
      { key: 'knelpunt', label: 'Dit is een knelpunt',  color: 'var(--c-bad)' },
    ],
    // "Alles op volgorde": eerst knelpunten, dan kan beter, dan gaat goed
    statusGroups: [
      { key: 'knelpunt', title: 'Knelpunten',  color: '#b42a3c' },
      { key: 'beter',    title: 'Kan beter',   color: '#b7770a' },
      { key: 'goed',     title: 'Gaat goed',   color: '#2f7d5b' },
    ],
    goodKey: 'goed',
    goodLabel: 'gaat goed',
    notes: {
      category: 'Per categorie staan de constructen met het laagste percentage "gaat goed" bovenaan. Bij een gelijk percentage staan de belangrijkste constructen eerst.',
      all: 'Elk construct staat bij het antwoord dat het vaakst is gekozen (bij een gelijke stand telt het zwaarste). Binnen elke groep staan de belangrijkste constructen bovenaan, gemeten aan het belang dat werkgevers eraan hechten (zie deel 3).',
    },
  }, N);

  // 2. INSCHATTING
  function outcomeBar(el, key, label, val, max, unit) {
    const pctW = max ? Math.round((val / max) * 100) : 0;
    const color = max === 100 ? '#2a6b3d' : (val >= 4 ? '#2f7d5b' : val >= 3 ? '#8a9a2a' : val >= 2 ? '#e0762a' : '#b42a3c');
    const div = document.createElement('div');
    div.className = 'outcome-item';
    div.innerHTML = `<div class="outcome-row">
      <div class="outcome-label">${outcomeLabel(key, label)}</div>
      <div class="outcome-barwrap"><div class="outcome-seg" style="width:${pctW}%;background:${color}">${val}${unit}</div></div>
      <div class="outcome-val">${val}${unit}</div></div>
      <div class="outcome-desc">${escapeHtml(OUTCOME_INFO[key].desc)}</div>`;
    el.appendChild(div);
  }
  const ol = $('#outcome-left'), or_ = $('#outcome-right');
  outcomeBar(ol, 'er_werkgeluk', 'Inschatting werkgeluk', DATA.avg_werkgeluk, 5, '/5');
  outcomeBar(ol, 'er_zinvolheid', 'Inschatting zinvolheid', DATA.avg_zinvolheid, 5, '/5');
  outcomeBar(ol, 'er_tevredenheid', 'Inschatting tevredenheid', DATA.avg_tevredenheid, 5, '/5');
  outcomeBar(or_, 'er_pct', '% tevreden medewerkers', DATA.avg_sat_pct, 100, '%');
  outcomeBar(or_, 'er_orgsat', 'Organisatiesucces (eigen)', DATA.avg_orgsat, 5, '/5');
  if (hasCompare && empLookup.__stats) {
    const s = empLookup.__stats;
    const note = document.createElement('div');
    note.style.cssText = 'margin-top:1rem;padding:0.75rem 1rem;background:#e8f5e8;border-radius:8px;font-size:0.8rem;color:var(--muted);border-left:3px solid var(--accent)';
    note.innerHTML = `<strong style="color:var(--accent)">Medewerkersscan:</strong> medewerkers rapporteren gemiddeld een werktevredenheid van <strong>${s.avg_sat}/5</strong> en werkgeluk van <strong>${s.avg_hap}/5</strong>.`;
    or_.appendChild(note);
  }

  // 3. BELANG
  $('#imp-legend').innerHTML = catLegendHtml(cats);
  const impRanking = $('#imp-ranking');
  [...constructs].sort((a, b) => b.avg_imp - a.avg_imp || a.name.localeCompare(b.name, 'nl')).forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'imp-row';
    row.innerHTML = `
      <div class="imp-rank">${i + 1}</div>
      <div class="imp-name">${catDot(c.cat)}${nameTip(c)}</div>
      <div class="imp-barwrap"><div class="imp-barfill" style="width:${c.avg_imp / 5 * 100}%;background:${catColor(c.cat)}"></div></div>
      <div class="imp-val">${c.avg_imp}</div>`;
    impRanking.appendChild(row);
  });

  (function drawRadar() {
    const svg = $('#radar-svg');
    const catAvg = {};
    cats.forEach(cat => {
      const items = constructs.filter(c => c.cat === cat);
      catAvg[cat] = items.reduce((s, c) => s + c.avg_imp, 0) / items.length;
    });
    const cx = 180, cy = 170, R = 105, n = cats.length;
    const angleOf = i => (i / n) * 2 * Math.PI - Math.PI / 2;
    const pt = (i, r) => [cx + r * Math.cos(angleOf(i)), cy + r * Math.sin(angleOf(i))];
    let html = '';
    [1, 2, 3, 4, 5].forEach(v => {
      const pts = cats.map((_, i) => pt(i, (v / 5) * R).join(',')).join(' ');
      html += `<polygon points="${pts}" fill="none" stroke="#c8d8c8" stroke-width="${v === 5 ? 1.5 : 0.8}"/>`;
    });
    cats.forEach((_, i) => { const [x, y] = pt(i, R); html += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#c8d8c8" stroke-width="0.8"/>`; });
    html += `<polygon points="${cats.map((cat, i) => pt(i, (catAvg[cat] / 5) * R).join(',')).join(' ')}" fill="rgba(42,107,61,0.12)" stroke="#2a6b3d" stroke-width="2"/>`;
    cats.forEach((cat, i) => { const [x, y] = pt(i, (catAvg[cat] / 5) * R); html += shapeEl(cat, x, y, 6.5, 'stroke="#fff" stroke-width="1.5"'); });
    cats.forEach((cat, i) => {
      const [x, y] = pt(i, R + 24);
      const short = cat === 'Org.-uitkomsten' ? 'Org.' : cat;
      html += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="DM Sans,sans-serif" font-size="10.5" font-weight="700" fill="#161c16">${escapeHtml(short)}<tspan x="${x}" dy="12" font-size="10" fill="#161c16" font-weight="500">${catAvg[cat].toFixed(1)}</tspan></text>`;
    });
    svg.innerHTML = html;
  })();

  // 4. VERGELIJKING (tevredenheid en belang)
  if (hasCompare) {
    const shared = constructs.filter(c => c.emp_id !== null && empLookup[c.emp_id] !== undefined);
    const fmt1 = v => v.toFixed(1).replace('.', ',');

    // 4a. Tevredenheid: % gaat goed (werkgever) tegenover % past goed (medewerker)
    (function drawFitCompare() {
      let html = '';
      cats.forEach(cat => {
        const items = shared.filter(c => c.cat === cat).map(c => ({ c, wg: c.goed_pct, wn: empLookup[c.emp_id].goed_pct }));
        if (!items.length) return;
        items.sort((a, b) => Math.abs(b.wg - b.wn) - Math.abs(a.wg - a.wn));
        html += `<div class="cat-block" style="--cc:${catColor(cat)}">
          <div class="cat-head">${catDot(cat, 18)}<span class="cat-title plain">${escapeHtml(cat)}</span></div>
          ${items.map(({ c, wg, wn }) => {
            const d = wg - wn;
            const big = Math.abs(d) >= 10;
            const cls = big ? (d > 0 ? 'up' : 'down') : '';
            const diff = big
              ? `<strong>${d > 0 ? 'werkgever' : 'medewerker'} positiever</strong><span>+${Math.abs(d)} pp</span>`
              : `<strong>vergelijkbaar</strong>`;
            return `<div class="cmp-row">
              <div class="cmp-name">${nameTip(c)}</div>
              <div class="cmp-bars">
                <div class="cmp-line"><div class="cmp-fill" style="width:${wg}%;max-width:calc(100% - 60px);background:var(--c-emp)"></div><span style="color:var(--c-emp)">${wg}%</span></div>
                <div class="cmp-line"><div class="cmp-fill" style="width:${wn}%;max-width:calc(100% - 60px);background:var(--c-wn)"></div><span style="color:var(--c-wn)">${wn}%</span></div>
              </div>
              <div class="cmp-diff ${cls}">${diff}</div>
            </div>`;
          }).join('')}
        </div>`;
      });
      $('#compare-fit').innerHTML = html || `<div style="font-size:0.85rem;color:var(--muted);font-style:italic;">Geen gedeelde constructen om te vergelijken.</div>`;
    })();

    // 4b. Belang: werkgever tegenover medewerker, als stippenlijn per construct
    (function drawImportanceCompare() {
      const rows = shared
        .map(c => ({ c, wg: c.avg_imp, wn: empLookup[c.emp_id].avg_imp }))
        .filter(x => x.wg > 0 && x.wn > 0);
      const el = $('#compare-imp');
      if (!rows.length) {
        el.innerHTML = `<div style="font-size:0.85rem;color:var(--muted);font-style:italic;">Geen belangscores om te vergelijken.</div>`;
        $('#imp-callout').innerHTML = '';
        return;
      }
      const rankOf = key => rows.forEach(x => { x['r' + key] = 1 + rows.filter(y => y[key] > x[key]).length; });
      rankOf('wg'); rankOf('wn');
      rows.forEach(x => {
        x.d = Math.round((x.wg - x.wn) * 10) / 10;
        x.flag = Math.abs(x.d) >= 0.5;
      });
      const byGap = (a, b) => Math.abs(b.d) - Math.abs(a.d)
        || Math.abs(b.rwg - b.rwn) - Math.abs(a.rwg - a.rwn)
        || a.c.name.localeCompare(b.c.name, 'nl');

      // samenvatting boven de grafiek
      const list = arr => arr.sort(byGap).slice(0, 5)
        .map(x => `<li>${escapeHtml(x.c.name)} <span>(+${fmt1(Math.abs(x.d))})</span></li>`).join('');
      const hi = rows.filter(x => x.flag && x.d > 0), lo = rows.filter(x => x.flag && x.d < 0);
      $('#imp-callout').innerHTML = (hi.length || lo.length)
        ? `${hi.length ? `<div class="box wg"><h5>Werkgevers vinden belangrijker</h5><ul>${list(hi)}</ul></div>` : ''}
           ${lo.length ? `<div class="box wn"><h5>Medewerkers vinden belangrijker</h5><ul>${list(lo)}</ul></div>` : ''}`
        : `<div class="box"><h5>Geen grote verschillen</h5><ul><li>Werkgevers en medewerkers verschillen op geen enkel gedeeld construct 0,5 punt of meer.</li></ul></div>`;

      // Radar en tabel: gemiddeld belang per categorie, alleen over de gedeelde constructen
      (function drawRadarCompare() {
        const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
        const stats = cats.map(cat => {
          const it = rows.filter(x => x.c.cat === cat);
          return it.length ? { cat, n: it.length, wg: avg(it.map(x => x.wg)), wn: avg(it.map(x => x.wn)) } : null;
        }).filter(Boolean);
        const target = $('#compare-radar');
        if (!stats.length) { target.innerHTML = ''; return; }

        // Schaal: ringen van het laagste hele getal tot 5, zodat verschillen zichtbaar blijven
        const lo = Math.max(1, Math.min(4, Math.floor(Math.min(...stats.flatMap(s => [s.wg, s.wn])))));
        const W = 430, H = 400, cx = 215, cy = 200, R = 118, n = stats.length;
        const ang = i => (i / n) * 2 * Math.PI - Math.PI / 2;
        const pt = (i, rad) => [cx + rad * Math.cos(ang(i)), cy + rad * Math.sin(ang(i))];
        const rad = v => Math.max(0, (v - lo) / (5 - lo)) * R;
        let svg = '';
        for (let v = lo; v <= 5; v++) {
          svg += `<polygon points="${stats.map((_, i) => pt(i, rad(v)).join(',')).join(' ')}" fill="none" stroke="#c8d8c8" stroke-width="${v === 5 ? 1.5 : 0.8}"/>`;
        }
        stats.forEach((_, i) => { const [x, y] = pt(i, R); svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#c8d8c8" stroke-width="0.8"/>`; });
        const poly = (key, fill, stroke, dash) => `<polygon points="${stats.map((s, i) => pt(i, rad(s[key])).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
        svg += poly('wg', 'rgba(42,107,61,0.14)', '#2a6b3d', '');
        svg += poly('wn', 'rgba(47,79,191,0.08)', '#2f4fbf', '7 4');
        stats.forEach((s, i) => {
          const [gx, gy] = pt(i, rad(s.wg)), [nx, ny] = pt(i, rad(s.wn));
          svg += `<circle cx="${gx}" cy="${gy}" r="5" fill="#2a6b3d" stroke="#fff" stroke-width="1.5"/><circle cx="${nx}" cy="${ny}" r="4" fill="#2f4fbf" stroke="#fff" stroke-width="1.5"/>`;
        });
        stats.forEach((s, i) => {
          const c = Math.cos(ang(i));
          const [sx, sy] = pt(i, R + 15);
          const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
          // zijkanten: tekst naast de vorm; boven/onder: tekst voorbij de vorm
          const [tx, ty] = anchor === 'middle' ? pt(i, R + 36) : pt(i, R + 15);
          const dx = anchor === 'start' ? 12 : anchor === 'end' ? -12 : 0;
          const short = s.cat === 'Org.-uitkomsten' ? 'Org.' : s.cat;
          svg += shapeEl(s.cat, sx, sy, 6.5, '');
          svg += `<text x="${tx + dx}" y="${ty}" text-anchor="${anchor}" dominant-baseline="middle" font-family="DM Sans,sans-serif" font-size="11" font-weight="700" fill="#161c16">${escapeHtml(short)}</text>`;
        });
        // ringwaarden als laatste, met lichte rand zodat ze leesbaar blijven boven de vlakken
        for (let v = lo + 1; v <= 5; v++) {
          svg += `<text x="${cx + 5}" y="${cy - rad(v) + 11}" font-size="9.5" font-weight="600" fill="#4a5a4a" stroke="#f0f4f0" stroke-width="3" paint-order="stroke" font-family="DM Sans,sans-serif">${v}</text>`;
        }

        const rowsHtml = stats.map(s => {
          const d = Math.round((s.wg - s.wn) * 10) / 10;
          const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
          return `<tr><td>${catDot(s.cat, 14)}${escapeHtml(s.cat)} <span class="cmp-n">(${s.n})</span></td>
            <td class="num" style="color:var(--c-emp)">${fmt1(s.wg)}</td>
            <td class="num" style="color:var(--c-wn)">${fmt1(s.wn)}</td>
            <td class="num ${cls}">${d > 0 ? '+' : ''}${fmt1(d)}</td></tr>`;
        }).join('');

        target.innerHTML = `
          <div class="cmp-radar-chart">
            <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Radar: gemiddeld belang per categorie, werkgever tegenover medewerker">${svg}</svg>
            <div class="cmp-radar-key"><span><i class="line wg"></i>Werkgever</span><span><i class="line wn"></i>Medewerker</span></div>
            ${lo > 1 ? `<p class="cmp-radar-note">De schaal van deze grafiek begint bij ${lo}, zodat de verschillen zichtbaar blijven.</p>` : ''}
          </div>
          <div>
            <table class="cmp-table">
              <thead><tr><th>Categorie</th><th class="num">Werkgever</th><th class="num">Medewerker</th><th class="num">Verschil</th></tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
            <p class="cmp-radar-note">Gemiddelde belangscore (schaal 1 tot 5) over de gedeelde constructen in de categorie. Tussen haakjes: aantal constructen. Verschil = werkgever min medewerker.</p>
          </div>`;
      })();

      const pos = v => (v - 1) / 4 * 100;
      const axis = `<div class="db-row db-axis"><div></div><div class="db-track">${[1, 2, 3, 4, 5].map(v => `<span class="db-tick" style="left:${pos(v)}%">${v}</span>`).join('')}</div><div></div></div>`;
      const rowHtml = (x, showCat) => {
        const lo_ = Math.min(x.wg, x.wn), hi_ = Math.max(x.wg, x.wn);
        const lineColor = x.flag ? (x.d > 0 ? 'var(--c-emp)' : 'var(--c-wn)') : '#c3cfc3';
        const cls = x.flag ? (x.d > 0 ? 'up' : 'down') : '';
        const label = x.flag ? `${x.d > 0 ? 'werkgever' : 'medewerker'} hoger +${fmt1(Math.abs(x.d))}` : 'vergelijkbaar';
        return `<div class="db-row${x.flag ? ' flag' : ''}">
          <div class="cmp-name">${showCat ? catDot(x.c.cat) : ''}${nameTip(x.c)}</div>
          <div class="db-track">
            <div class="db-line" style="left:${pos(lo_)}%;width:${pos(hi_) - pos(lo_)}%;background:${lineColor}"></div>
            <div class="db-dot wg" style="left:${pos(x.wg)}%" title="Werkgever: ${fmt1(x.wg)}"></div>
            <div class="db-dot wn" style="left:${pos(x.wn)}%" title="Medewerker: ${fmt1(x.wn)}"></div>
          </div>
          <div class="db-info ${cls}"><strong>${label}</strong><span>${fmt1(x.wg)} vs ${fmt1(x.wn)} · rang ${x.rwg} vs ${x.rwn}</span></div>
        </div>`;
      };

      let view = 'category';
      function draw() {
        if (view === 'category') {
          el.innerHTML = cats.map(cat => {
            const items = rows.filter(x => x.c.cat === cat).sort(byGap);
            if (!items.length) return '';
            return `<div class="cat-block" style="--cc:${catColor(cat)}">
              <div class="cat-head">${catDot(cat, 18)}<span class="cat-title plain">${escapeHtml(cat)}</span></div>
              ${axis}${items.map(x => rowHtml(x, false)).join('')}
            </div>`;
          }).join('');
        } else {
          el.innerHTML = `<div class="cat-block long">${axis}${[...rows].sort(byGap).map(x => rowHtml(x, true)).join('')}</div>
            <div class="legend cat-legend-inline">${catLegendHtml(uniqueCats(rows.map(x => x.c)))}</div>`;
        }
      }
      container.querySelectorAll('[data-impview]').forEach(btn => btn.addEventListener('click', () => {
        view = btn.dataset.impview;
        container.querySelectorAll('[data-impview]').forEach(b => b.classList.toggle('active', b === btn));
        draw();
      }));
      draw();
    })();
  }

  // 5. CONTEXT
  const contextGrid = $('#context-grid');
  function makeContextCard(title, data, maxVal) {
    const card = document.createElement('div');
    card.className = 'context-card';
    let html = `<h4>${title}</h4>`;
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    if (!entries.length) html += `<div style="font-size:0.8rem;color:var(--muted);font-style:italic;">Geen data.</div>`;
    entries.forEach(([k, v]) => {
      html += `<div class="context-item">
        <div class="context-name">${escapeHtml(k)}</div>
        <div class="context-bar"><div class="context-bar-fill" style="width:${v / maxVal * 100}%"></div></div>
        <div class="context-val">${v}</div></div>`;
    });
    card.innerHTML = html;
    contextGrid.appendChild(card);
  }
  makeContextCard('Organisatiegrootte', DATA.sizes, N || 1);
  makeContextCard('Sector', DATA.sectors, N || 1);
  makeContextCard('Aanleiding deelname', DATA.reasons, N || 1);
}
