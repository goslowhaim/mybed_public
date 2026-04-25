const state = {
  payload: null,
  filter: "all",
  selectedPipelineId: null,
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toneClass(value) {
  const lowered = String(value || "").toLowerCase();
  if (["green", "good", "active"].some((item) => lowered.includes(item))) return "good";
  if (["yellow", "warn", "legacy", "planned", "ready"].some((item) => lowered.includes(item))) return "warn";
  if (["red", "failed", "bad"].some((item) => lowered.includes(item))) return "bad";
  return "neutral";
}

async function loadPayload() {
  const response = await fetch("./dashboard-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`dashboard-data.json ${response.status}`);
  state.payload = await response.json();
}

function renderOverview() {
  const payload = state.payload || {};
  $("generatedAt").textContent = payload.generatedAt || "-";
  $("pipelineCount").textContent = `${(payload.pipelines || []).length} pipelines`;
  $("boardMode").textContent = payload.mode || "public";
  $("kpiGrid").innerHTML = (payload.overview?.kpis || []).map((item) => `
    <article class="kpi-card">
      <span class="label">${escapeHtml(item.label)}</span>
      <strong class="value">${escapeHtml(item.value)}</strong>
      <span class="pill ${toneClass(item.status)}">${escapeHtml(item.status)}</span>
    </article>
  `).join("");
  $("topSignals").innerHTML = (payload.overview?.topSignals || []).map((item) => `
    <li>${escapeHtml(item)}</li>
  `).join("") || `<li>표시할 signal이 없습니다.</li>`;
}

function categoryList() {
  const categories = new Set((state.payload?.pipelines || []).map((item) => item.category).filter(Boolean));
  return ["all", ...Array.from(categories).sort()];
}

function renderFilters() {
  $("categoryFilters").innerHTML = categoryList().map((category) => `
    <button class="filter ${state.filter === category ? "is-active" : ""}" type="button" data-filter="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join("");
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      renderFilters();
      renderPipelineGrid();
    });
  });
}

function pipelineMatchesFilter(item) {
  return state.filter === "all" || item.category === state.filter;
}

function selectPipeline(pipelineId) {
  state.selectedPipelineId = pipelineId;
  renderPipelineGrid();
  renderSelectedPipeline();
}

function renderPipelineGrid() {
  const pipelines = (state.payload?.pipelines || []).filter(pipelineMatchesFilter);
  if (!state.selectedPipelineId && pipelines[0]) state.selectedPipelineId = pipelines[0].pipeline_id;
  $("pipelineGrid").innerHTML = pipelines.map((item) => `
    <button class="pipeline-card ${state.selectedPipelineId === item.pipeline_id ? "is-selected" : ""}" type="button" data-pipeline-id="${escapeHtml(item.pipeline_id)}">
      <div class="row-between">
        <strong>${escapeHtml(item.display_name)}</strong>
        <span class="pill ${toneClass(item.health || item.status)}">${escapeHtml(item.health)}</span>
      </div>
      <div class="meta">${escapeHtml(item.category)} · ${escapeHtml(item.status)}</div>
      <div class="cycle">${escapeHtml(item.current_cycle || "-")}</div>
      <p class="summary">${escapeHtml(item.summary || "-")}</p>
    </button>
  `).join("");
  document.querySelectorAll(".pipeline-card").forEach((button) => {
    button.addEventListener("click", () => selectPipeline(button.dataset.pipelineId));
  });
}

function renderSelectedPipeline() {
  const selected = (state.payload?.pipelines || []).find((item) => item.pipeline_id === state.selectedPipelineId);
  $("selectedPipeline").innerHTML = selected ? `
    <article class="stack-card">
      <div class="row-between">
        <strong>${escapeHtml(selected.display_name)}</strong>
        <span class="pill ${toneClass(selected.status)}">${escapeHtml(selected.status)}</span>
      </div>
      <div class="meta">${escapeHtml(selected.pipeline_id)} · ${escapeHtml(selected.category)}</div>
      <div class="pill-row">
        <span class="pill ${toneClass(selected.health)}">${escapeHtml(selected.health)}</span>
        <span class="pill neutral">${escapeHtml(selected.current_cycle || "-")}</span>
      </div>
      <p class="summary">${escapeHtml(selected.summary || "-")}</p>
    </article>
  ` : `<p class="muted">선택된 파이프라인이 없습니다.</p>`;
}

async function init() {
  await loadPayload();
  renderOverview();
  renderFilters();
  renderPipelineGrid();
  renderSelectedPipeline();
}

init().catch((error) => {
  document.body.innerHTML = `<main class="shell"><article class="panel"><h1>Dashboard Load Error</h1><p>${escapeHtml(error.message)}</p></article></main>`;
});
