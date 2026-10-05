/* Gedeelde helpers voor beide dashboards */

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}
function escAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/* Constructnaam met hover-omschrijving */
function nameTip(c) {
  const name = escapeHtml(c.name);
  if (!c.desc) return `<span class="c-name">${name}</span>`;
  return `<span class="c-name has-tip" tabindex="0" data-tip-title="${escAttr(c.name)}" data-tip-cat="${escAttr(c.cat)}" data-tip-body="${escAttr(c.desc)}">${name}<i class="tip-i" data-html2canvas-ignore="true">i</i></span>`;
}

/* Label van een uitkomstvariabele met hover-omschrijving */
function outcomeLabel(key, text) {
  const o = OUTCOME_INFO[key];
  return nameTip({ name: text || o.name, desc: o.desc, cat: '' });
}

/* Elke categorie: eigen kleur (catColor) en eigen vorm */
const CATEGORY_SHAPES = {
  "Leren": "circle", "Autonomie": "square", "Relaties": "triangle", "Zinvolheid": "diamond",
  "Werkdruk": "hexagon", "Werktijden": "cross", "Beloning": "star", "Org.-uitkomsten": "triangle-down",
};
function shapeEl(cat, cx, cy, r, extra) {
  const f = catColor(cat), x = extra || '';
  const poly = pts => `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${f}" ${x}/>`;
  switch (CATEGORY_SHAPES[cat] || 'circle') {
    case 'square': return `<rect x="${(cx - r * 0.88).toFixed(1)}" y="${(cy - r * 0.88).toFixed(1)}" width="${(r * 1.76).toFixed(1)}" height="${(r * 1.76).toFixed(1)}" rx="1" fill="${f}" ${x}/>`;
    case 'triangle': return poly([[cx, cy - r * 1.05], [cx + r * 1.05, cy + r * 0.85], [cx - r * 1.05, cy + r * 0.85]]);
    case 'triangle-down': return poly([[cx, cy + r * 1.05], [cx + r * 1.05, cy - r * 0.85], [cx - r * 1.05, cy - r * 0.85]]);
    case 'diamond': return poly([[cx, cy - r * 1.15], [cx + r * 1.15, cy], [cx, cy + r * 1.15], [cx - r * 1.15, cy]]);
    case 'hexagon': return poly([0, 1, 2, 3, 4, 5].map(k => [cx + r * 1.08 * Math.cos(k * Math.PI / 3), cy + r * 1.08 * Math.sin(k * Math.PI / 3)]));
    case 'cross': { const a = r * 1.05, b = r * 0.38;
      return poly([[-b, -a], [b, -a], [b, -b], [a, -b], [a, b], [b, b], [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b]].map(p => [cx + p[0], cy + p[1]])); }
    case 'star': return poly(Array.from({ length: 10 }, (_, k) => { const rad = (k % 2 ? r * 0.5 : r * 1.2), ang = -Math.PI / 2 + k * Math.PI / 5; return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]; }));
    default: return `<circle cx="${cx}" cy="${cy}" r="${(r * 0.98).toFixed(1)}" fill="${f}" ${x}/>`;
  }
}
function catDot(cat, size) {
  const sz = size || 16, c = sz / 2;
  return `<svg class="cat-dot" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" role="img" aria-label="${escAttr(cat)}"><title>${escapeHtml(cat)}</title>${shapeEl(cat, c, c, c - 1.5)}</svg>`;
}
function catChip(cat) {
  return `<span class="cat-chip">${catDot(cat, 13)}${escapeHtml(cat)}</span>`;
}
function catLegendHtml(cats) {
  return cats.map(cat => `<div class="legend-item">${catDot(cat)}${escapeHtml(cat)}</div>`).join('');
}

/* Eén zwevende tooltip voor alle [data-tip-body] elementen (hover, focus, tik) */
(function initTooltips() {
  if (window.__wvwTipsInit) return;
  window.__wvwTipsInit = true;
  const tip = document.createElement('div');
  tip.className = 'wvw-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  function show(el) {
    const cat = el.dataset.tipCat;
    tip.innerHTML = `<div class="wvw-tt-title">${escapeHtml(el.dataset.tipTitle)}</div>` +
      (cat ? `<div class="wvw-tt-cat"><span style="background:${catColor(cat)}"></span>${escapeHtml(cat)}</div>` : '') +
      `<div class="wvw-tt-body">${escapeHtml(el.dataset.tipBody)}</div>`;
    tip.style.display = 'block';
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = r.top - th - 8;
    if (top < 8) top = r.bottom + 8;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hide() { tip.style.display = 'none'; }
  const find = t => t.closest && t.closest('.has-tip');

  document.addEventListener('mouseover', e => { const el = find(e.target); if (el) show(el); });
  document.addEventListener('mouseout', e => { if (find(e.target)) hide(); });
  document.addEventListener('focusin', e => { const el = find(e.target); if (el) show(el); });
  document.addEventListener('focusout', e => { if (find(e.target)) hide(); });
  document.addEventListener('touchstart', e => {
    const el = find(e.target);
    if (el) show(el); else hide();
  }, { passive: true });
  window.addEventListener('scroll', hide, true);
})();

/* ── Herbruikbare "past het werk / gaat het goed" sectie ──────────────────
   cfg = {
     segments: [{ key, label, color }, ...]   // eerste = positieve categorie
     goodKey:  'goed',
     goodLabel: 'past goed',
     notes: { category: '...', all: '...' }   // uitleg onder de knoppen, per weergave
     statusGroups: [{ key, title, color }, ...]  // optioneel: "Alles op volgorde" groepeert
                                                 // dan per status (slechtste eerst) en sorteert
                                                 // binnen elke groep op belang
   }
   Sorteert binnen elke categorie op laagste % positief, bij gelijke stand
   eerst het belangrijkste construct.
*/
function renderFitSection(root, constructs, cfg, N) {
  const state = { view: 'category', desc: false };

  const sortFn = (a, b) => {
    if (a[cfg.goodKey + '_pct'] !== b[cfg.goodKey + '_pct']) return a[cfg.goodKey + '_pct'] - b[cfg.goodKey + '_pct'];
    if (b.avg_imp !== a.avg_imp) return b.avg_imp - a.avg_imp;
    return a.name.localeCompare(b.name, 'nl');
  };

  root.innerHTML = `
    <div class="fit-controls" data-html2canvas-ignore="true">
      <div class="seg-toggle" role="group" aria-label="Weergave">
        <button type="button" data-view="category" class="active">Per categorie</button>
        <button type="button" data-view="all">Alles op volgorde</button>
      </div>
      <label class="check-toggle"><input type="checkbox" id="desc-toggle"> Beschrijvingen tonen</label>
    </div>
    <div class="legend">
      ${cfg.segments.map(s => `<div class="legend-item"><div class="legend-dot" style="background:${s.color}"></div>${s.label}</div>`).join('')}
    </div>
    <p class="fit-note"></p>
    <div class="fit-chart"></div>
  `;
  const chart = root.querySelector('.fit-chart');
  const noteEl = root.querySelector('.fit-note');

  function rowHtml(c, showCat) {
    const goodN = c[cfg.goodKey], goodP = c[cfg.goodKey + '_pct'];
    const segs = cfg.segments.map(s => {
      const p = c[s.key + '_pct'], n = c[s.key];
      const label = p >= 14 ? `${p}%` : '';
      return `<div class="fit-seg" style="width:${p}%;background:${s.color}" title="${escAttr(s.label)}: ${n} van ${N} (${p}%)">${label}</div>`;
    }).join('');
    return `
      <div class="fit-row">
        <div class="fit-label">
          <div class="fit-name">${showCat ? catDot(c.cat) : ''}${nameTip(c)}</div>
          ${state.desc && c.desc ? `<div class="fit-desc">${escapeHtml(c.desc)}</div>` : ''}
        </div>
        <div class="fit-bar-wrap">${segs}</div>
        <div class="fit-num"><strong>${goodP}%</strong><span>${goodN} van ${N}</span></div>
      </div>`;
  }

  function draw() {
    let html = '';
    if (state.view === 'category') {
      const cats = [];
      constructs.forEach(c => { if (!cats.includes(c.cat)) cats.push(c.cat); });
      cats.sort((a, b) => catRank(a) - catRank(b));
      cats.forEach(cat => {
        const items = constructs.filter(c => c.cat === cat).sort(sortFn);
        const avg = Math.round(items.reduce((s, c) => s + c[cfg.goodKey + '_pct'], 0) / items.length);
        html += `
          <div class="cat-block${items.length > 8 ? ' long' : ''}" style="--cc:${catColor(cat)}">
            <div class="cat-head">
              ${catDot(cat, 18)}
              <span class="cat-title plain">${escapeHtml(cat)}</span>
              <span class="cat-avg">gemiddeld ${avg}% ${cfg.goodLabel}</span>
            </div>
            ${items.map(c => rowHtml(c, false)).join('')}
          </div>`;
      });
    } else if (cfg.statusGroups) {
      // Groepeer op de vaakst gekozen antwoordoptie (bij gelijke stand telt de zwaarste),
      // sorteer binnen een groep op belang.
      const byImportance = (a, b) => b.avg_imp - a.avg_imp
        || a[cfg.goodKey + '_pct'] - b[cfg.goodKey + '_pct']
        || a.name.localeCompare(b.name, 'nl');
      const buckets = cfg.statusGroups.map(g => ({ g, items: [] }));
      const unanswered = [];
      constructs.forEach(c => {
        let best = null, bestN = 0;
        cfg.statusGroups.forEach((g, i) => { if (c[g.key] > bestN) { best = i; bestN = c[g.key]; } });
        if (best === null) unanswered.push(c); else buckets[best].items.push(c);
      });
      const groupHtml = (title, color, items) => `
        <div class="cat-block${items.length > 8 ? ' long' : ''}" style="--cc:${color}">
          <div class="cat-head">
            <span class="cat-bar"></span>
            <span class="cat-title">${escapeHtml(title)}</span>
            <span class="cat-avg">${items.length} ${items.length === 1 ? 'construct' : 'constructen'}</span>
          </div>
          ${items.map(c => rowHtml(c, true)).join('')}
        </div>`;
      buckets.forEach(b => { if (b.items.length) html += groupHtml(b.g.title, b.g.color, b.items.sort(byImportance)); });
      if (unanswered.length) html += groupHtml('Geen antwoorden', '#9ca3af', unanswered.sort(byImportance));
      html += `<div class="legend cat-legend-inline">${catLegendHtml(uniqueCats(constructs))}</div>`;
    } else {
      html = `<div class="cat-block long">${[...constructs].sort(sortFn).map(c => rowHtml(c, true)).join('')}</div>`;
      html += `<div class="legend cat-legend-inline">${catLegendHtml(uniqueCats(constructs))}</div>`;
    }
    noteEl.textContent = (cfg.notes && cfg.notes[state.view]) || cfg.note || '';
    chart.innerHTML = html;
  }

  root.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      root.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });
  root.querySelector('#desc-toggle').addEventListener('change', e => {
    state.desc = e.target.checked;
    draw();
  });
  draw();
}
