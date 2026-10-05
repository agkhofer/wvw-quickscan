/* PDF-export van het dashboard.

   1. Het dashboard wordt in een verborgen iframe van vaste breedte (1100 px) opgebouwd,
      zodat de PDF er hetzelfde uitziet als op een desktopscherm, ook als het browservenster
      smal is.
   2. Het geheel wordt als een lange afbeelding gerenderd (html2canvas).
   3. De afbeelding wordt in A4-pagina's geknipt op plekken waar niets doorgesneden wordt:
      niet door een balk, kaart, grafiek of tabelrij, en een kop blijft bij de eerste regel
      eronder. Zo blijven de witruimtes aan het einde van een pagina klein.
   Vereist: html2canvas en jsPDF (zie index.html). */

const PDF_RENDER_WIDTH = 1100;   // css px

// Elementen die nooit doorgesneden mogen worden
const PDF_ANCHORS = ['.header', '.kpi-strip', '.fit-row', '.leave-row', '.dir-row', '.cmp-row', '.db-row',
  '.imp-row', '.outcome-item', '.open-box', '.context-card', '.cmp-callout', '.cmp-radar',
  '.leave-none', '.cat-legend-inline', '.dash-footer'];
const PDF_UNBREAKABLE_EXTRA = ['#radar-svg'];
// Koppen, legenda's en toelichtingen: blijven samen met de eerste regel die erna komt
const PDF_HEADS = ['.section-hd', '.cmp-title', '.cat-head', '.legend:not(.cat-legend-inline)', '.fit-note',
  '.leave-explain', '.leave-head', '.dir-axis', '.db-axis'];

function pdfComputeBreaks(root, firstPageH, nextPageH, slack) {
  const top0 = root.getBoundingClientRect().top;
  const rectOf = el => { const r = el.getBoundingClientRect(); return { t: r.top - top0, b: r.bottom - top0 }; };
  const all = sel => Array.from(root.querySelectorAll(sel)).map(rectOf).filter(r => r.b - r.t > 0);

  const anchors = PDF_ANCHORS.flatMap(all).sort((a, b) => a.t - b.t);
  const zones = anchors.concat(PDF_UNBREAKABLE_EXTRA.flatMap(all));
  PDF_HEADS.flatMap(all).forEach(h => {
    const next = anchors.find(a => a.t >= h.b - 2);
    zones.push({ t: h.t, b: next ? next.b : h.b });
  });
  const valid = y => !zones.some(z => y > z.t + 0.5 && y < z.b - 0.5);

  const total = Math.ceil(root.getBoundingClientRect().height);
  const pages = [];
  let y0 = 0;
  while (y0 < total - 1) {
    const pageH = pages.length === 0 ? firstPageH : nextPageH;
    const limit = y0 + pageH;
    // laatste stukje mag de ondermarge in, zodat er geen pagina met alleen een voetregel ontstaat
    if (total - y0 <= pageH + slack) { pages.push([y0, total]); break; }
    let y = Math.floor(limit);
    const minChunk = (limit - y0) * 0.3;
    while (y > y0 + minChunk && !valid(y)) y -= 1;
    if (y <= y0 + minChunk) y = Math.floor(limit);          // geen goede plek gevonden
    else if (valid(y - 5)) y -= 5;                          // beetje lucht boven de volgende regel
    pages.push([y0, y]);
    y0 = y;
  }
  return { pages, total };
}

async function exportDashboardPdf(srcEl, filename) {
  const W = PDF_RENDER_WIDTH;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;height:1200px;border:0;`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    const clone = srcEl.cloneNode(true);
    clone.querySelectorAll('[data-html2canvas-ignore]').forEach(n => n.remove());
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`).join('');
    doc.open();
    doc.write(`<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">${links}` +
      `<style>html,body{margin:0;padding:0;background:#fff}body{width:${W}px}` +
      `.dash-footer{display:none !important}</style></head><body></body></html>`);
    doc.close();
    doc.body.appendChild(doc.importNode(clone, true));

    // wachten op stijlen en lettertypen
    await new Promise(res => {
      const done = () => res();
      if (doc.readyState === 'complete') done();
      else iframe.contentWindow.addEventListener('load', done, { once: true });
      setTimeout(done, 5000);
    });
    try { await doc.fonts.ready; } catch (e) { /* niet kritiek */ }
    await new Promise(r => setTimeout(r, 300));

    const root = doc.body.firstElementChild;
    const PT_PER_PX = 595.28 / W;                 // A4 breed = 595,28 pt
    const PAGE_H = 841.89, MARGIN_TOP = 24, MARGIN_BOTTOM = 24;
    const firstH = (PAGE_H - MARGIN_BOTTOM) / PT_PER_PX;
    const nextH = (PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) / PT_PER_PX;
    const { pages, total } = pdfComputeBreaks(root, firstH, nextH, 0);

    // één lange afbeelding (schaal aangepast om onder de canvas-limieten te blijven)
    const scale = Math.min(2, 14000 / total);
    const full = await html2canvas(root, {
      scale, backgroundColor: null, useCORS: true, logging: false,
      width: W, height: total, windowWidth: W, windowHeight: total,
    });

    const bg = (getComputedStyle(root).backgroundColor.match(/\d+/g) || [255, 255, 255]).map(Number);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });

    pages.forEach(([a, b], i) => {
      if (i > 0) pdf.addPage();
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(0, 0, 595.28, PAGE_H, 'F');
      const sy = Math.round(a * scale), sh = Math.max(1, Math.round((b - a) * scale));
      const slice = document.createElement('canvas');
      slice.width = full.width;
      slice.height = sh;
      const ctx = slice.getContext('2d');
      ctx.drawImage(full, 0, sy, full.width, sh, 0, 0, full.width, sh);
      const yPt = i === 0 ? 0 : MARGIN_TOP;
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, yPt, 595.28, (b - a) * PT_PER_PX);
      // voetregel met paginanummer in de ondermarge
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(122, 114, 104);
      pdf.text('Werk van Waarde | Universiteit Groningen | Alle gegevens lokaal verwerkt', 34, PAGE_H - 11);
      pdf.text(`Pagina ${i + 1} van ${pages.length}`, 595.28 - 34, PAGE_H - 11, { align: 'right' });
    });
    pdf.save(filename);
    return pages.length;
  } finally {
    iframe.remove();
  }
}
