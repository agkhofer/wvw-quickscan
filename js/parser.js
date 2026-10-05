/* Reads a Qualtrics .xlsx export (3 header rows: variable names / question text / ImportId
   is NOT present in these exports — row0 = variable names, row1 = question text, row2+ = data)
   and returns { headers, rows } where rows are objects keyed by variable name. */

async function readWorkbookRows(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  if (grid.length < 2) throw new Error("Leeg of onleesbaar bestand.");

  const headers = grid[0].map(h => (h === null ? "" : String(h).trim()));
  // Row 1 (index 1) is Qualtrics question text — skip it if it looks like a text row
  // (not data). Heuristic: data starts either at index 1 or index 2 depending on export
  // settings, so detect by checking whether index1's "Finished" column looks boolean-ish.
  const finishedIdx = headers.indexOf("Finished");
  let dataStart = 2;
  if (finishedIdx >= 0) {
    const v1 = grid[1] ? grid[1][finishedIdx] : null;
    const looksLikeData = v1 === true || v1 === false ||
      (typeof v1 === "string" && ["true", "false"].includes(v1.trim().toLowerCase()));
    if (looksLikeData) dataStart = 1;
  }

  const rows = [];
  for (let r = dataStart; r < grid.length; r++) {
    const rowArr = grid[r];
    if (!rowArr || rowArr.every(c => c === null || c === "")) continue;
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = rowArr[i] !== undefined ? rowArr[i] : null; });
    rows.push(obj);
  }
  return { headers, rows };
}

function isFinished(row) {
  const v = row.Finished;
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return true; // unknown -> don't exclude
}

function filterByOrgCode(rows, codeColumn, code) {
  const target = String(code).trim().toLowerCase();
  return rows.filter(r => {
    const raw = r[codeColumn];
    if (raw === null || raw === undefined) return false;
    return String(raw).trim().toLowerCase() === target && isFinished(r);
  });
}

// Oudere exports kunnen minder constructen bevatten: alleen kolommen die bestaan tonen
function hasColumn(rows, col) { return rows.some(r => Object.prototype.hasOwnProperty.call(r, col)); }

function avgOf(values) {
  const nums = values.filter(v => typeof v === "number" && !isNaN(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function round1(v) { return v === null ? null : Math.round(v * 10) / 10; }

/* ── EMPLOYEE SCAN ── */
function pct(part, total) { return total ? Math.round((part / total) * 100) : 0; }

function buildEmployeeData(rows) {
  const n = rows.length;

  const constructs = EMPLOYEE_CONSTRUCTS.filter(def => hasColumn(rows, `wvw_c${def.id}`)).map(def => {
    const fits = rows.map(r => categorizeEmployeeFit(r[`wvw_c${def.id}`]));
    const goed = fits.filter(f => f === "goed").length;
    const meer = fits.filter(f => f === "meer").length;
    const minder = fits.filter(f => f === "minder").length;
    const not_fit = meer + minder;

    // Vertrekintentie wordt alleen gevraagd aan wie aangaf dat het niet past
    const vertrek = rows.filter((r, i) =>
      (fits[i] === "meer" || fits[i] === "minder") &&
      categorizeLeave(r[`leave_c${def.id}`]) === "vertrek").length;

    const imps = rows.map(r => {
      const raw = r[`lk_lk${def.id}`];
      const num = typeof raw === "number" ? raw : parseFloat(raw);
      return isNaN(num) ? null : num;
    });
    const avg_imp = avgOf(imps);

    return {
      id: def.id, name: def.name, cat: def.cat, bidir: def.bidir, desc: def.desc,
      goed, meer, minder, not_fit, vertrek,
      goed_pct: pct(goed, n),
      meer_pct: pct(meer, n),
      minder_pct: pct(minder, n),
      not_fit_pct: pct(not_fit, n),
      vertrek_of_notfit_pct: pct(vertrek, not_fit),
      vertrek_pct: pct(vertrek, n),
      avg_imp: round1(avg_imp) ?? 0,
    };
  });

  const avg_sat = round1(avgOf(rows.map(r => scaleLookup(SAT_SCALE, r.JobSat_1)))) ?? 0;
  const avg_hap = round1(avgOf(rows.map(r => scaleLookup(HAP_SCALE, r.JobHap_1)))) ?? 0;
  const searchYes = rows.filter(r => String(r.JobSearch || "").trim().toLowerCase() === "ja").length;
  const leaveYes = rows.filter(r => String(r.Leave || "").trim().toLowerCase() === "ja").length;

  const cleanOpen = col => rows.map(r => r[col]).filter(v => typeof v === "string" && v.trim().length > 0).map(v => v.trim());

  return {
    n,
    avg_sat, avg_hap,
    search_n: searchYes, search_pct: pct(searchYes, n),
    leave_n: leaveYes, leave_pct: pct(leaveYes, n),
    constructs,
    open_goed: cleanOpen("MissConOpen1"),
    open_beter: cleanOpen("MissConOpen2"),
    open_niet: cleanOpen("MissConOpen3"),
  };
}

/* ── EMPLOYER SCAN ── */
function splitMulti(raw) {
  if (!raw) return [];
  return String(raw).split(",").map(s => s.trim()).filter(Boolean);
}
function tally(list) {
  const out = {};
  list.forEach(v => { out[v] = (out[v] || 0) + 1; });
  return out;
}

function buildEmployerData(rows) {
  const n = rows.length;

  const constructs = EMPLOYER_CONSTRUCTS.filter(def => hasColumn(rows, `wvw_c${def.id}`)).map(def => {
    const fits = rows.map(r => categorizeEmployerFit(r[`wvw_c${def.id}`]));
    const goed = fits.filter(f => f === "goed").length;
    const beter = fits.filter(f => f === "beter").length;
    const knelpunt = fits.filter(f => f === "knelpunt").length;

    const imps = rows.map(r => {
      const raw = r[`lk_lk${def.id}`];
      const num = typeof raw === "number" ? raw : parseFloat(raw);
      return isNaN(num) ? null : num;
    });
    const avg_imp = avgOf(imps);

    return {
      id: def.id, name: def.name, cat: def.cat, emp_id: def.emp_id, desc: def.desc,
      goed, beter, knelpunt,
      goed_pct: n ? Math.round((goed / n) * 100) : 0,
      beter_pct: n ? Math.round((beter / n) * 100) : 0,
      knelpunt_pct: n ? Math.round((knelpunt / n) * 100) : 0,
      avg_imp: round1(avg_imp) ?? 0,
    };
  });

  const avg_werkgeluk = round1(avgOf(rows.map(r => scaleLookup(MATE_SCALE, r.JobOutcomes_1)))) ?? 0;
  const avg_zinvolheid = round1(avgOf(rows.map(r => scaleLookup(MATE_SCALE, r.JobOutcomes_2)))) ?? 0;
  const avg_tevredenheid = round1(avgOf(rows.map(r => scaleLookup(MATE_SCALE, r.JobOutcomes_3)))) ?? 0;
  const avg_sat_pct = Math.round(avgOf(rows.map(r => {
    const num = typeof r.JobSat_1 === "number" ? r.JobSat_1 : parseFloat(r.JobSat_1);
    return isNaN(num) ? null : num;
  })) ?? 0);
  const avg_orgsat = round1(avgOf(rows.map(r => scaleLookup(SAT_SCALE, r.JobHap_1)))) ?? 0;

  const reasons = tally(rows.flatMap(r => splitMulti(r.PartRea)));
  const sizes = tally(rows.map(r => r.OrgaSize).filter(Boolean));
  const sectors = tally(rows.map(r => r.AvwSector).filter(Boolean));

  return {
    n, avg_werkgeluk, avg_zinvolheid, avg_tevredenheid, avg_sat_pct, avg_orgsat,
    constructs, reasons, sizes, sectors,
  };
}

/* Opzoektabel voor de vergelijking in het werkgevers-dashboard:
   medewerker-construct-id -> { goed_pct, avg_imp }. */
function buildEmployeeLookup(employeeData) {
  const lookup = {};
  if (!employeeData) return lookup;
  employeeData.constructs.forEach(c => {
    lookup[c.id] = { goed_pct: c.goed_pct, avg_imp: c.avg_imp };
  });
  Object.defineProperty(lookup, '__stats', {
    value: { avg_sat: employeeData.avg_sat, avg_hap: employeeData.avg_hap, n: employeeData.n },
    enumerable: false,
  });
  return lookup;
}
