(function () {
  const state = {
    scanType: null,        // "employee" | "employer"
    file: null,
    rows: null,            // all parsed rows from workbook
    orgCode: null,
    dashboardData: null,
    compareEmployeeData: null,
  };

  const steps = ["type", "upload", "code", "dashboard"];
  function showStep(name) {
    steps.forEach(s => document.getElementById(`step-${s}`).classList.toggle("active", s === name));
    document.getElementById("dashboard-shell").style.display = name === "dashboard" ? "block" : "none";
    document.querySelector(".shell").style.display = name === "dashboard" ? "none" : "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── STEP 1: scan type ──
  document.querySelectorAll(".type-card").forEach(card => {
    card.addEventListener("click", () => {
      state.scanType = card.dataset.type;
      resetUpload();
      const isEmp = state.scanType === "employee";
      document.getElementById("upload-title").textContent = isEmp ? "Upload de medewerkersscan" : "Upload de werkgeversscan";
      document.getElementById("upload-sub").textContent = isEmp
        ? "Exporteer de resultaten van de Medewerkerscan vanuit Qualtrics als .xlsx bestand."
        : "Exporteer de resultaten van de Werkgeverscan vanuit Qualtrics als .xlsx bestand.";
      showStep("upload");
    });
  });

  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showStep(btn.dataset.back));
  });

  // ── STEP 2: upload ──
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileChip = document.getElementById("file-chip");
  const uploadContinueBtn = document.getElementById("upload-continue");
  const uploadError = document.getElementById("upload-error");

  function resetUpload() {
    state.file = null;
    state.rows = null;
    fileInput.value = "";
    fileChip.style.display = "none";
    dropzone.style.display = "block";
    uploadContinueBtn.disabled = true;
    uploadError.textContent = "";
  }

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  async function handleFile(file) {
    uploadError.textContent = "";
    if (!/\.xlsx$/i.test(file.name)) {
      uploadError.textContent = "Upload een .xlsx bestand (Excel-export vanuit Qualtrics).";
      return;
    }
    try {
      const { rows } = await readWorkbookRows(file);
      state.file = file;
      state.rows = rows;
      document.getElementById("fc-name").textContent = file.name;
      fileChip.style.display = "flex";
      dropzone.style.display = "none";
      uploadContinueBtn.disabled = false;
    } catch (err) {
      console.error(err);
      uploadError.textContent = "Kon het bestand niet lezen. Controleer of dit een geldige Qualtrics .xlsx-export is.";
    }
  }

  document.getElementById("fc-remove").addEventListener("click", resetUpload);

  uploadContinueBtn.addEventListener("click", () => {
    const codeCol = state.scanType === "employee" ? "OrgaCode" : "PersCode";
    if (!state.rows.some(r => r[codeCol] !== undefined)) {
      uploadError.textContent = "Dit bestand lijkt niet op een geldige Werk van Waarde export (organisatiecode-kolom ontbreekt).";
      return;
    }
    document.getElementById("code-input").value = "";
    document.getElementById("code-error").textContent = "";
    showStep("code");
    document.getElementById("code-input").focus();
  });

  // ── STEP 3: org code ──
  const codeInput = document.getElementById("code-input");
  const codeError = document.getElementById("code-error");
  const codeSubmit = document.getElementById("code-submit");

  codeInput.addEventListener("keydown", e => { if (e.key === "Enter") codeSubmit.click(); });

  codeSubmit.addEventListener("click", () => {
    const code = codeInput.value.trim();
    if (!code) { codeError.textContent = "Vul een organisatiecode in."; return; }

    const codeCol = state.scanType === "employee" ? "OrgaCode" : "PersCode";
    const matched = filterByOrgCode(state.rows, codeCol, code);

    if (!matched.length) {
      codeError.textContent = "Onbekende organisatiecode. Controleer de code en probeer opnieuw.";
      return;
    }
    codeError.textContent = "";
    state.orgCode = code.toUpperCase();

    if (state.scanType === "employee") {
      state.dashboardData = buildEmployeeData(matched);
    } else {
      state.dashboardData = buildEmployerData(matched);
    }
    renderDashboard();
    showStep("dashboard");
  });

  // ── STEP 4: dashboard ──
  const dashContainer = document.getElementById("dashboard-container");
  const compareBox = document.getElementById("compare-box");

  function renderDashboard() {
    const meta = { orgCode: state.orgCode };
    if (state.scanType === "employee") {
      compareBox.style.display = "none";
      renderEmployeeDashboard(dashContainer, state.dashboardData, meta);
    } else {
      const lookup = buildEmployeeLookup(state.compareEmployeeData);
      renderEmployerDashboard(dashContainer, state.dashboardData, meta, lookup);
      compareBox.style.display = state.compareEmployeeData ? "none" : "block";
    }
  }

  document.getElementById("new-file-btn").addEventListener("click", () => {
    resetUpload();
    state.compareEmployeeData = null;
    showStep("upload");
  });
  document.getElementById("new-code-btn").addEventListener("click", () => {
    document.getElementById("code-input").value = "";
    document.getElementById("code-error").textContent = "";
    showStep("code");
  });

  // Optional: compare-with-employee-scan upload for employer dashboard
  const compareInput = document.getElementById("compare-file-input");
  compareInput.addEventListener("change", async () => {
    if (!compareInput.files.length) return;
    const file = compareInput.files[0];
    const compareStatus = document.getElementById("compare-status");
    compareStatus.textContent = "Bestand wordt verwerkt…";
    try {
      const { rows } = await readWorkbookRows(file);
      const matched = filterByOrgCode(rows, "OrgaCode", state.orgCode);
      if (!matched.length) {
        compareStatus.textContent = `Geen respondenten gevonden met bedrijfscode ${state.orgCode} in dit bestand.`;
        return;
      }
      state.compareEmployeeData = buildEmployeeData(matched);
      renderDashboard();
      compareStatus.textContent = "";
    } catch (err) {
      console.error(err);
      compareStatus.textContent = "Kon het bestand niet lezen.";
    }
  });

  // ── PDF EXPORT ──
  document.getElementById("pdf-btn").addEventListener("click", async () => {
    const btn = document.getElementById("pdf-btn");
    const original = btn.textContent;
    btn.textContent = "Bezig…";
    btn.disabled = true;
    try {
      await exportDashboardPdf(
        dashContainer.firstElementChild,
        `WvW-${state.scanType === "employee" ? "Medewerkersscan" : "Werkgeversscan"}-${state.orgCode}.pdf`
      );
    } catch (err) {
      console.error("PDF-export mislukt:", err);
      alert("Het maken van de PDF is niet gelukt. Probeer het opnieuw of gebruik een andere browser.");
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  showStep("type");
})();
