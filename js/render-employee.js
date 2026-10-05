function renderEmployeeDashboard(container, DATA, meta) {
  const N = DATA.n;
  const constructs = DATA.constructs;

  container.innerHTML = `
    <div class="dash dash-employee">
      <div class="header">
        <div>
          <div class="header-brand">Werk van Waarde — Universiteit Groningen</div>
          <div class="header-title">Quick Scan<br><em>Medewerkers</em></div>
        </div>
        <div class="header-meta">
          <strong>${N}</strong>
          respondenten · Bedrijfscode ${escapeHtml(meta.orgCode)}<br>
          Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}
        </div>
      </div>

      <div class="page">
        <div class="kpi-strip">
          <div class="kpi k-green"><div class="kpi-val">${N}</div><div class="kpi-label">Respondenten</div><div class="kpi-sub">Totale steekproef</div></div>
          <div class="kpi k-blue"><div class="kpi-val">${DATA.avg_sat || '–'}</div><div class="kpi-label">${outcomeLabel('sat')}</div><div class="kpi-sub">gemiddeld, schaal 1–5</div></div>
          <div class="kpi k-blue"><div class="kpi-val">${DATA.avg_hap || '–'}</div><div class="kpi-label">${outcomeLabel('hap')}</div><div class="kpi-sub">gemiddeld, schaal 1–5</div></div>
          <div class="kpi k-red"><div class="kpi-val">${DATA.search_pct}%</div><div class="kpi-label">${outcomeLabel('search')}</div><div class="kpi-sub">${DATA.search_n} van ${N} respondenten</div></div>
          <div class="kpi k-red"><div class="kpi-val">${DATA.leave_pct}%</div><div class="kpi-label">${outcomeLabel('leave')}</div><div class="kpi-sub">${DATA.leave_n} van ${N} respondenten</div></div>
        </div>

        <div class="section-hd">
          <div class="section-num">1</div>
          <div class="section-title">Hoe past het werk?</div>
          <div class="section-sub">Wie is tevreden en wie wil meer of minder, per aspect</div>
        </div>
        <div id="fit-section"></div>

        <div class="section-hd">
          <div class="section-num">2</div>
          <div class="section-title">Vertrekrisico bij aspecten die niet passen</div>
          <div class="section-sub">Hoeveel respondenten zeggen "past niet", en hoeveel van hen overweegt te vertrekken</div>
        </div>
        <p class="leave-explain">Vertrekintentie is per aspect gevraagd aan de respondenten die aangaven dat het aspect niet past. Het percentage vertrek is berekend op die groep. Gesorteerd op het aantal respondenten dat overweegt te vertrekken.</p>
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:var(--c-leave)"></div>Past niet en overweegt te vertrekken</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--c-stay)"></div>Past niet maar blijft waarschijnlijk</div>
        </div>
        <div id="leave-section"></div>

        <div class="section-hd">
          <div class="section-num">3</div>
          <div class="section-title">Gewenste richting</div>
          <div class="section-sub">Wil men meer of minder van de aspecten die niet passen? (zelfde aspecten en volgorde als deel 2)</div>
        </div>
        <div id="dir-section"></div>

        <div class="section-hd">
          <div class="section-num">4</div>
          <div class="section-title">Belang per aspect</div>
          <div class="section-sub">Hoe belangrijk vinden medewerkers elk aspect (schaal 1–5)</div>
        </div>
        <div class="legend" id="imp-legend"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;">
          <div id="imp-ranking" class="imp-ranking"></div>
          <svg id="radar-svg" viewBox="0 0 360 340" width="360" height="340"></svg>
        </div>

        <div class="section-hd">
          <div class="section-num">5</div>
          <div class="section-title">Uitkomsten</div>
          <div class="section-sub">Werktevredenheid, werkgeluk en zoekgedrag</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
          <div>
            <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);margin-bottom:0.75rem;">Tevredenheid en geluk</div>
            <div id="outcome-bars"></div>
          </div>
          <div>
            <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);margin-bottom:0.75rem;">Zoekgedrag en vertrekintentie</div>
            <div id="search-bars"></div>
          </div>
        </div>

        <div class="section-hd">
          <div class="section-num">6</div>
          <div class="section-title">Open antwoorden</div>
          <div class="section-sub">Kwalitatieve opmerkingen van respondenten</div>
        </div>
        <div class="open-box"><div class="open-label">Past goed: extra opmerkingen</div><div id="open-goed"></div></div>
        <div class="open-box"><div class="open-label">Kan beter: extra opmerkingen</div><div id="open-beter"></div></div>
        <div class="open-box"><div class="open-label">Past niet: extra opmerkingen</div><div id="open-niet"></div></div>
      </div>

      <footer class="dash-footer">Werk van Waarde — Universiteit Groningen &nbsp;·&nbsp; Alle gegevens lokaal verwerkt</footer>
    </div>
  `;

  const $ = sel => container.querySelector(sel);

  // 1. PAST HET WERK
  renderFitSection($('#fit-section'), constructs, {
    segments: [
      { key: 'goed',   label: 'Past goed, ik ben tevreden', color: 'var(--c-good)' },
      { key: 'meer',   label: 'Past niet, ik wil meer',     color: 'var(--c-more)' },
      { key: 'minder', label: 'Past niet, ik wil minder',   color: 'var(--c-less)' },
    ],
    goodKey: 'goed',
    goodLabel: 'past goed',
    notes: {
      category: 'Per categorie staan de aspecten met het laagste percentage "past goed" bovenaan. Bij een gelijk percentage staan de belangrijkste aspecten eerst.',
      all: 'Alle aspecten staan op volgorde van het laagste percentage "past goed". Bij een gelijk percentage staan de belangrijkste aspecten eerst.',
    },
  }, N);

  // 2. VERTREKRISICO
  const notFit = constructs.filter(c => c.not_fit > 0).sort((a, b) =>
    b.vertrek - a.vertrek || b.not_fit - a.not_fit || b.avg_imp - a.avg_imp);
  const leaveEl = $('#leave-section');
  if (!notFit.length) {
    leaveEl.innerHTML = `<div class="leave-none">Geen enkele respondent gaf aan dat een aspect niet past.</div>`;
  } else {
    leaveEl.innerHTML = `
      <div class="leave-head"><div>Aspect</div><div>Verdeling (van alle ${N} respondenten)</div><div>Past niet</div><div>Overweegt te vertrekken</div></div>
      ${notFit.map(c => `
        <div class="leave-row">
          <div class="leave-name">${nameTip(c)}<br>${catChip(c.cat)}</div>
          <div class="leave-bar">
            <div class="leave-seg" style="width:${N ? c.vertrek / N * 100 : 0}%;background:var(--c-leave)" title="Past niet en overweegt te vertrekken: ${c.vertrek} van ${N}"></div>
            <div class="leave-seg" style="width:${N ? (c.not_fit - c.vertrek) / N * 100 : 0}%;background:var(--c-stay)" title="Past niet maar blijft waarschijnlijk: ${c.not_fit - c.vertrek} van ${N}"></div>
          </div>
          <div class="leave-cell"><strong>${c.not_fit} van ${N}</strong><span>${c.not_fit_pct}% van alle respondenten</span></div>
          <div class="leave-cell"><strong>${c.vertrek} van ${c.not_fit}</strong><span>${c.vertrek_of_notfit_pct}% van wie "past niet" zegt</span></div>
        </div>`).join('')}
      ${(() => {
        const rest = constructs.filter(c => c.not_fit === 0).map(c => escapeHtml(c.name));
        return rest.length ? `<div class="leave-none">Geen enkele respondent zegt dat het niet past: ${rest.join(', ')}.</div>` : '';
      })()}`;
  }

  // 3. GEWENSTE RICHTING
  const dirConstrs = notFit;   // dezelfde aspecten en volgorde als in deel 2
  const dirEl = $('#dir-section');
  if (!dirConstrs.length) {
    dirEl.innerHTML = `<div style="font-size:0.85rem;color:var(--muted);font-style:italic;">Geen aspecten met een duidelijke richtingsvoorkeur.</div>`;
  } else {
    const maxDir = Math.max(...dirConstrs.map(c => Math.max(c.meer, c.minder)));
    const barMaxW = 150;
    dirEl.innerHTML = `
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:var(--c-less)"></div>Wil minder</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--c-more)"></div>Wil meer</div>
      </div>
      <div class="dir-axis"><div></div><div class="ax"><span style="text-align:right">← Wil minder</span><span style="text-align:left;padding-left:14px">Wil meer →</span></div><div></div></div>
      <div class="dir-grid">
        ${dirConstrs.map(c => `
          <div class="dir-row">
            <div class="dir-name">${catDot(c.cat)}${nameTip(c)}</div>
            <div class="dir-chart">
              <div class="dir-half l"><div class="dir-bar l" style="width:${c.minder / maxDir * barMaxW}px"></div></div>
              <div class="dir-center"></div>
              <div class="dir-half"><div class="dir-bar r" style="width:${c.meer / maxDir * barMaxW}px"></div></div>
            </div>
            <div class="dir-count">
              ${c.minder ? `<span style="color:var(--c-less)">${c.minder}× minder</span> ` : ''}
              ${c.meer ? `<span style="color:#c47a08">${c.meer}× meer</span>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
  }

  // 4. BELANG
  const cats = EMPLOYEE_CATS.filter(cat => constructs.some(c => c.cat === cat));
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
    const cx = 180, cy = 170, R = 110, n = cats.length;
    const angleOf = i => (i / n) * 2 * Math.PI - Math.PI / 2;
    const pt = (i, r) => [cx + r * Math.cos(angleOf(i)), cy + r * Math.sin(angleOf(i))];
    let html = '';
    [1, 2, 3, 4, 5].forEach(v => {
      const pts = cats.map((_, i) => pt(i, (v / 5) * R).join(',')).join(' ');
      html += `<polygon points="${pts}" fill="none" stroke="#e0d9ce" stroke-width="${v === 5 ? 1.5 : 0.8}"/>`;
    });
    cats.forEach((_, i) => { const [x, y] = pt(i, R); html += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e0d9ce" stroke-width="0.8"/>`; });
    html += `<polygon points="${cats.map((cat, i) => pt(i, (catAvg[cat] / 5) * R).join(',')).join(' ')}" fill="rgba(200,80,42,0.15)" stroke="#c8502a" stroke-width="2"/>`;
    cats.forEach((cat, i) => { const [x, y] = pt(i, (catAvg[cat] / 5) * R); html += shapeEl(cat, x, y, 6.5, 'stroke="#fff" stroke-width="1.5"'); });
    cats.forEach((cat, i) => {
      const [x, y] = pt(i, R + 24);
      html += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="DM Sans,sans-serif" font-size="11" font-weight="700" fill="#1c1a16">${escapeHtml(cat)}<tspan x="${x}" dy="12" font-size="10" fill="#1c1a16" font-weight="500">${catAvg[cat].toFixed(1)}</tspan></text>`;
    });
    svg.innerHTML = html;
  })();

  // 5. UITKOMSTEN
  const bar = (el, labelHtml, desc, value, pctWidth, color, text) => {
    const div = document.createElement('div');
    div.className = 'outcome-item';
    div.innerHTML = `<div class="outcome-row">
      <div class="outcome-label">${labelHtml}</div>
      <div class="outcome-barwrap"><div class="outcome-seg" style="width:${pctWidth}%;background:${color}">${text}</div></div>
      <div class="outcome-val">${value}</div></div>
      <div class="outcome-desc">${escapeHtml(desc)}</div>`;
    el.appendChild(div);
  };
  const scoreColor = v => v >= 4 ? '#2f7d5b' : v >= 3 ? '#c8a028' : v >= 2 ? '#e0762a' : '#b42a3c';
  const ob = $('#outcome-bars');
  bar(ob, outcomeLabel('sat'), OUTCOME_INFO.sat.desc, `${DATA.avg_sat}/5`, DATA.avg_sat / 5 * 100, scoreColor(DATA.avg_sat), DATA.avg_sat);
  bar(ob, outcomeLabel('hap'), OUTCOME_INFO.hap.desc, `${DATA.avg_hap}/5`, DATA.avg_hap / 5 * 100, scoreColor(DATA.avg_hap), DATA.avg_hap);
  const sb = $('#search-bars');
  [['search', DATA.search_pct, DATA.search_n], ['leave', DATA.leave_pct, DATA.leave_n]].forEach(([key, p, k]) => {
    const color = p >= 50 ? '#b42a3c' : p >= 30 ? '#c8a028' : '#2f7d5b';
    bar(sb, outcomeLabel(key), OUTCOME_INFO[key].desc, `${k} van ${N}`, p, color, `${p}%`);
  });

  // 6. OPEN ANTWOORDEN
  const fillOpen = (sel, list) => {
    $(sel).innerHTML = list.length
      ? list.map(t => `<div class="open-item">${escapeHtml(t)}</div>`).join('')
      : `<div class="open-empty">Geen opmerkingen.</div>`;
  };
  fillOpen('#open-goed', DATA.open_goed || []);
  fillOpen('#open-beter', DATA.open_beter || []);
  fillOpen('#open-niet', DATA.open_niet || []);
}
