/* =========================================================
   CRITICAL MINERALS DASHBOARD — Application Logic
   All state lives in AppState. Functions are named clearly.
   Chart.js handles radar charts; pure SVG for bubble chart.
   ========================================================= */

'use strict';

/* ── App State ─────────────────────────────────────────── */
const AppState = {
  currentPage: 'overview',
  activeSector: 'all',
  explorerSort: 'composite',
  selectedMineral: null,       // currently open in modal
  compareMineral: null,        // mineral queued from modal "Add to Compare"
  compareSelections: { a: '', b: '', c: '' },
  weights: { ...window.WEIGHT_PRESETS.indiaFocus.weights },
  activePreset: 'indiaFocus',
  radarChartModal: null,       // Chart.js instance
  radarChartCompare: null,     // Chart.js instance
  weightedScores: {},          // mineral name → weighted score
  rafPending: false,           // requestAnimationFrame gate for sliders
};

/* ── Constants ─────────────────────────────────────────── */
const RISK_TIERS = [
  { min: 55, label: 'critical', color: 'var(--risk-critical)' },
  { min: 50, label: 'high',     color: 'var(--risk-high)' },
  { min: 44, label: 'moderate', color: 'var(--risk-moderate)' },
  { min: 0,  label: 'low',      color: 'var(--risk-low)' },
];

const WEIGHT_KEYS = [
  { key: 'demand',     label: 'Current Demand' },
  { key: 'growth',     label: 'Demand Growth' },
  { key: 'supplyConc', label: 'Supply Concentration' },
  { key: 'reserveRisk',label: 'Reserve Risk' },
  { key: 'endUseComp', label: 'End-Use Criticality' },
  { key: 'subRisk',    label: 'Substitution & Recycling' },
  { key: 'extraction', label: 'Processing Complexity' },
  { key: 'projects',   label: 'Pipeline (Projects)' },
  { key: 'indiaVuln',  label: 'India Vulnerability' },
  { key: 'volatility', label: 'Price Volatility' },
];

// Map weight keys → mineral score keys for computing weighted score
const WEIGHT_TO_DIMS = {
  demand:      ['demand'],
  growth:      ['growth'],
  supplyConc:  ['miningDiv', 'refiningDiv'],
  reserveRisk: ['resTime', 'resDiv'],
  endUseComp:  ['endUseComp'],
  subRisk:     ['substitutability', 'recyclability'],
  extraction:  ['extraction'],
  projects:    ['projects'],
  indiaVuln:   ['importDep', 'strategic'],
  volatility:  ['volatility'],
};

// Radar axes definition (mirrors RADAR_AXES in data.js)
const RADAR_AXIS_KEYS = [
  { key: 'supplyConc',  label: 'Supply\nConc.',  dims: ['miningDiv','refiningDiv'],             max: 5 },
  { key: 'demandPress', label: 'Demand\nPress.',  dims: ['demand','growth'],                     max: 5 },
  { key: 'reserveRisk', label: 'Reserve\nRisk',   dims: ['resTime','resDiv'],                    max: 5 },
  { key: 'subRisk',     label: 'Sub. &\nRecycle', dims: ['substitutability','recyclability'],    max: 5 },
  { key: 'indiaExp',    label: 'India\nExposure', dims: ['importDep','strategic'],               max: 5 },
  { key: 'priceRisk',   label: 'Price\nRisk',     dims: ['volatility','extraction'],             max: 5 },
];

/* ── Utility Functions ─────────────────────────────────── */

function getRiskTier(score) {
  for (const tier of RISK_TIERS) {
    if (score >= tier.min) return tier;
  }
  return RISK_TIERS[RISK_TIERS.length - 1];
}

function chinaColor(pct) {
  if (pct >= 70) return 'var(--china-high)';
  if (pct >= 30) return 'var(--china-med)';
  return 'var(--china-low)';
}

function lerp(a, b, t) { return a + (b - a) * t; }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

/** Normalise a raw score to 0-5 for radar display */
function normScore(val, max) {
  return clamp((val / max) * 5, 0, 5);
}

/** Compute average of dimension values from mineral scores */
function avgDims(scores, dims) {
  const vals = dims.map(d => scores[d] || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Get 6 radar values for a mineral (normalised 0–5) */
function getRadarValues(mineral) {
  const s = mineral.scores;
  return RADAR_AXIS_KEYS.map(ax => {
    const avg = avgDims(s, ax.dims);
    return normScore(avg, ax.max);
  });
}

/** Compute weighted score for a mineral given current AppState.weights */
function computeWeightedScore(mineral) {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const { key } of WEIGHT_KEYS) {
    const w = (AppState.weights[key] || 0) / 100;
    const dims = WEIGHT_TO_DIMS[key];
    const avg = avgDims(mineral.scores, dims);
    // Normalise avg to 0–1 range using max=5 (endUseComp uses 0-10 so cap at 10→5)
    const dimMax = key === 'endUseComp' ? 10 : 5;
    const norm = avg / dimMax;
    weightedSum += w * norm;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  // Scale to 0–70 range to be comparable with composite
  return (weightedSum / totalWeight) * 70;
}

/** Recompute all weighted scores and cache in AppState */
function recomputeWeightedScores() {
  for (const m of window.MINERALS) {
    AppState.weightedScores[m.name] = computeWeightedScore(m);
  }
}

/** Get the current display score for a mineral (weighted if customized, else composite) */
function getDisplayScore(mineral) {
  // If user has touched weights (not equal preset), show weighted score
  return AppState.weightedScores[mineral.name] ?? mineral.scores.composite;
}

/* ── Page Navigation ───────────────────────────────────── */

function navigate(page) {
  AppState.currentPage = page;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Show/hide pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  // Init page-specific content
  if (page === 'overview')  renderOverview();
  if (page === 'explorer')  renderExplorer();
  if (page === 'compare')   renderComparePage();
  if (page === 'about')     renderAboutPage();
}

/* ── Hero Stats ────────────────────────────────────────── */

function renderHeroStats() {
  const critical = window.MINERALS.filter(m => m.scores.composite > 55).length;
  const chinaHigh = window.MINERALS.filter(m => m.meta.chinaShare >= 70).length;
  const avgComposite = (window.MINERALS.reduce((s, m) => s + m.scores.composite, 0) / window.MINERALS.length).toFixed(1);

  document.getElementById('hero-stats').innerHTML = `
    <div class="hero-stat">
      <span class="hero-stat-value">${window.MINERALS.length}</span>
      <span class="hero-stat-label">Minerals Tracked</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value" style="color:var(--risk-critical)">${critical}</span>
      <span class="hero-stat-label">Critical Risk Tier</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value" style="color:var(--china-high)">${chinaHigh}</span>
      <span class="hero-stat-label">China &gt;70% Share</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value" style="color:var(--accent-2)">${avgComposite}</span>
      <span class="hero-stat-label">Avg Composite Score</span>
    </div>
  `;
}

/* ── Weight Sliders ────────────────────────────────────── */

function renderWeightSliders() {
  const container = document.getElementById('weight-sliders');
  container.innerHTML = WEIGHT_KEYS.map(({ key, label }) => {
    const val = AppState.weights[key] ?? 50;
    const pct = val + '%';
    return `
      <div class="slider-row">
        <div class="slider-label-row">
          <span class="slider-label">${label}</span>
          <span class="slider-value" id="wval-${key}">${val}</span>
        </div>
        <input type="range" min="0" max="100" value="${val}"
               id="wslider-${key}" data-key="${key}"
               style="--pct:${pct}"
               aria-label="${label} weight" />
      </div>
    `;
  }).join('');

  // Attach events
  container.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', onSliderInput);
  });
}

function onSliderInput(e) {
  const key = e.target.dataset.key;
  const val = parseInt(e.target.value, 10);
  AppState.weights[key] = val;
  AppState.activePreset = null;

  // Update displayed value and CSS gradient
  document.getElementById(`wval-${key}`).textContent = val;
  e.target.style.setProperty('--pct', val + '%');

  // Deactivate preset buttons
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

  // Throttle rerender with requestAnimationFrame
  if (!AppState.rafPending) {
    AppState.rafPending = true;
    requestAnimationFrame(() => {
      recomputeWeightedScores();
      renderRankedChart();
      AppState.rafPending = false;
    });
  }
}

function applyPreset(presetKey) {
  const preset = window.WEIGHT_PRESETS[presetKey];
  if (!preset) return;
  AppState.weights = { ...preset.weights };
  AppState.activePreset = presetKey;

  // Update sliders
  WEIGHT_KEYS.forEach(({ key }) => {
    const val = AppState.weights[key] ?? 50;
    const slider = document.getElementById(`wslider-${key}`);
    const valEl  = document.getElementById(`wval-${key}`);
    if (slider) { slider.value = val; slider.style.setProperty('--pct', val + '%'); }
    if (valEl)  valEl.textContent = val;
  });

  // Update preset button states
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === presetKey);
  });

  recomputeWeightedScores();
  renderRankedChart();
}

/* ── Ranked Bar Chart ──────────────────────────────────── */

function renderRankedChart() {
  const container = document.getElementById('ranked-chart');
  if (!container) return;

  // Sort minerals by weighted score descending
  const sorted = [...window.MINERALS].sort((a, b) => getDisplayScore(b) - getDisplayScore(a));
  const maxScore = Math.max(...sorted.map(m => getDisplayScore(m)));

  container.innerHTML = sorted.map(mineral => {
    const score = getDisplayScore(mineral);
    const pct   = (score / maxScore) * 100;
    const tier  = getRiskTier(score);

    return `
      <div class="rank-row" data-mineral="${mineral.name}" role="button" tabindex="0"
           aria-label="Open ${mineral.name} details">
        <div class="rank-name" title="${mineral.name}">${mineral.name}</div>
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${pct}%;background:${tier.color}"></div>
        </div>
        <div class="rank-score" style="color:${tier.color}">${score.toFixed(1)}</div>
      </div>
    `;
  }).join('');

  // Click handlers
  container.querySelectorAll('.rank-row').forEach(row => {
    row.addEventListener('click', () => openMineralModal(row.dataset.mineral));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openMineralModal(row.dataset.mineral); });
  });
}

/* ── Bubble Chart (SVG) ────────────────────────────────── */

function renderBubbleChart() {
  const svg = document.getElementById('bubble-chart-svg');
  if (!svg) return;

  const W = svg.parentElement.clientWidth || 700;
  const H = Math.min(420, W * 0.58);
  const PAD = { top: 20, right: 20, bottom: 48, left: 48 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);

  // Scales
  // X: supply concentration = avg(miningDiv, refiningDiv) — 1 to 5
  // Y: demand growth — 1 to 5
  // Size: log(annual demand) — rough proxy using demand score 1-5 + chinaShare

  const xScale = v => PAD.left + ((v - 1) / 4) * PW;
  const yScale = v => PAD.top + PH - ((v - 1) / 4) * PH;

  // Bubble size based on demand score (log-ish)
  const sizeScale = v => Math.max(6, Math.min(28, v * 5.5));

  // Grid lines
  let gridHTML = '';
  for (let i = 1; i <= 5; i++) {
    const x = xScale(i);
    const y = yScale(i);
    gridHTML += `<line class="bubble-grid-line" x1="${x}" y1="${PAD.top}" x2="${x}" y2="${PAD.top + PH}" />`;
    gridHTML += `<line class="bubble-grid-line" x1="${PAD.left}" y1="${y}" x2="${PAD.left + PW}" y2="${y}" />`;
    gridHTML += `<text class="bubble-axis-label" x="${x}" y="${PAD.top + PH + 16}" text-anchor="middle">${i}</text>`;
    gridHTML += `<text class="bubble-axis-label" x="${PAD.left - 10}" y="${y + 4}" text-anchor="end">${i}</text>`;
  }

  // Axis labels
  gridHTML += `<text class="bubble-axis-label" x="${PAD.left + PW / 2}" y="${H - 4}" text-anchor="middle" font-size="11">← Less Concentrated  |  Supply Concentration (avg mining+refining)  |  More Concentrated →</text>`;
  gridHTML += `<text class="bubble-axis-label" x="13" y="${PAD.top + PH / 2}" text-anchor="middle" transform="rotate(-90,13,${PAD.top + PH / 2})" font-size="11">Demand Growth →</text>`;

  // Bubbles
  let bubblesHTML = '';
  for (const m of window.MINERALS) {
    const sc = m.scores;
    const xVal  = (sc.miningDiv + sc.refiningDiv) / 2;
    const yVal  = sc.growth;
    const size  = sizeScale(sc.demand);
    const color = chinaColorRaw(m.meta.chinaShare);
    const cx = xScale(xVal);
    const cy = yScale(yVal);

    bubblesHTML += `
      <g class="bubble" data-mineral="${m.name}"
         transform="translate(${cx},${cy})">
        <circle r="${size}" fill="${color}" fill-opacity="0.7"
                stroke="${color}" stroke-width="1.5" stroke-opacity="0.9" />
        <text y="${size + 11}" text-anchor="middle" font-size="9"
              font-family="Inter,sans-serif" fill="var(--text-muted)"
              paint-order="stroke" stroke="var(--bg)" stroke-width="3">
          ${m.symbol}
        </text>
      </g>
    `;
  }

  svg.innerHTML = gridHTML + bubblesHTML;

  // Tooltip interactions
  svg.querySelectorAll('.bubble').forEach(el => {
    el.addEventListener('mouseenter', e => showBubbleTooltip(e, el.dataset.mineral));
    el.addEventListener('mouseleave', hideBubbleTooltip);
    el.addEventListener('click',      () => openMineralModal(el.dataset.mineral));
  });
}

function chinaColorRaw(pct) {
  if (pct >= 70) return '#ff4757';
  if (pct >= 30) return '#ffa502';
  return '#2ed573';
}

function showBubbleTooltip(e, name) {
  const mineral = window.MINERALS.find(m => m.name === name);
  if (!mineral) return;
  const tt = document.getElementById('tooltip');
  const score = getDisplayScore(mineral);
  const tier  = getRiskTier(score);
  tt.innerHTML = `
    <div class="tooltip-name">${mineral.name} <span style="font-weight:400;color:var(--text-muted);font-family:monospace">${mineral.symbol}</span></div>
    <div class="tooltip-row"><span>Composite</span><span style="color:${tier.color}">${score.toFixed(1)}</span></div>
    <div class="tooltip-row"><span>China Share</span><span style="color:${chinaColorRaw(mineral.meta.chinaShare)}">${mineral.meta.chinaShare}%</span></div>
    <div class="tooltip-row"><span>Demand Growth</span><span>${mineral.scores.growth}/5</span></div>
    <div class="tooltip-row"><span>Supply Conc.</span><span>${((mineral.scores.miningDiv + mineral.scores.refiningDiv)/2).toFixed(1)}/5</span></div>
    <div class="tooltip-row"><span>Top Supplier</span><span>${mineral.meta.topSupplier}</span></div>
  `;
  positionTooltip(e);
  tt.classList.add('visible');
}

function hideBubbleTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

function positionTooltip(e) {
  const tt  = document.getElementById('tooltip');
  const x   = e.clientX + 14;
  const y   = e.clientY - 10;
  const ttW = 240;
  const ttH = 140;
  const left = x + ttW > window.innerWidth  ? e.clientX - ttW - 14 : x;
  const top  = y + ttH > window.innerHeight ? e.clientY - ttH - 10 : y;
  tt.style.left = left + 'px';
  tt.style.top  = top  + 'px';
}

/* ── Overview Render ───────────────────────────────────── */

function renderOverview() {
  recomputeWeightedScores();
  renderHeroStats();
  renderWeightSliders();
  renderRankedChart();
  renderBubbleChart();
  initPresetButtons();
}

function initPresetButtons() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });
  // Apply default preset on first load
  applyPreset(AppState.activePreset || 'indiaFocus');
}

/* ── Explorer Page ─────────────────────────────────────── */

function renderExplorer() {
  renderMineralGrid();
  initFilterChips();
  initExplorerSort();
}

function initFilterChips() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.activeSector = chip.dataset.sector;
      renderMineralGrid();
    });
  });
}

function initExplorerSort() {
  const sel = document.getElementById('explorer-sort');
  if (sel) {
    sel.value = AppState.explorerSort;
    sel.addEventListener('change', e => {
      AppState.explorerSort = e.target.value;
      renderMineralGrid();
    });
  }
}

function filterAndSortMinerals() {
  let list = [...window.MINERALS];

  // Filter by sector
  if (AppState.activeSector !== 'all') {
    list = list.filter(m => m.meta.sectors.includes(AppState.activeSector));
  }

  // Sort
  switch (AppState.explorerSort) {
    case 'composite':
      list.sort((a, b) => getDisplayScore(b) - getDisplayScore(a));
      break;
    case 'growth':
      list.sort((a, b) => b.scores.growth - a.scores.growth);
      break;
    case 'china':
      list.sort((a, b) => b.meta.chinaShare - a.meta.chinaShare);
      break;
    case 'importDep':
      list.sort((a, b) => b.scores.importDep - a.scores.importDep);
      break;
  }

  return list;
}

function renderMineralGrid() {
  const grid = document.getElementById('minerals-grid');
  if (!grid) return;

  const minerals = filterAndSortMinerals();

  if (minerals.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-text">No minerals found for this filter</div>
    </div>`;
    return;
  }

  grid.innerHTML = minerals.map(m => buildMineralCard(m)).join('');

  // Mini radars
  grid.querySelectorAll('.mineral-card').forEach(card => {
    const name    = card.dataset.mineral;
    const mineral = window.MINERALS.find(m => m.name === name);
    if (mineral) {
      drawMiniRadar(card.querySelector('.mini-radar'), getRadarValues(mineral));
      card.addEventListener('click', () => openMineralModal(name));
    }
  });
}

function buildMineralCard(mineral) {
  const score = getDisplayScore(mineral);
  const tier  = getRiskTier(score);
  const topSectors = mineral.meta.sectors.slice(0, 3);
  const chinaColor_ = chinaColorRaw(mineral.meta.chinaShare);

  return `
    <div class="mineral-card risk-${tier.label}" data-mineral="${mineral.name}" role="button" tabindex="0"
         aria-label="Open ${mineral.name} details">
      <div class="card-header">
        <div>
          <div class="card-name">${mineral.name}</div>
          <div class="card-symbol">${mineral.symbol}</div>
        </div>
        <div class="score-badge">
          <div class="score-num score-${tier.label}">${score.toFixed(1)}</div>
          <div class="score-label">score</div>
        </div>
      </div>

      <canvas class="mini-radar" width="120" height="90"></canvas>

      <div class="sector-chips">
        ${topSectors.map(s => `<span class="sector-chip ${s}">${s}</span>`).join('')}
      </div>

      <div class="china-bar-wrap">
        <span class="china-bar-label">China</span>
        <div class="china-bar-track">
          <div class="china-bar-fill" style="width:${mineral.meta.chinaShare}%;background:${chinaColor_}"></div>
        </div>
        <span class="china-val" style="color:${chinaColor_}">${mineral.meta.chinaShare}%</span>
      </div>
    </div>
  `;
}

/* ── Mini Radar (Canvas) ───────────────────────────────── */

function drawMiniRadar(canvas, values) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R  = Math.min(W, H) * 0.38;
  const N  = values.length;
  const step = (Math.PI * 2) / N;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  // Background rings
  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = startAngle + i * step;
      const r = (ring / 5) * R;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 5 ? 'rgba(79,156,249,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Spokes
  for (let i = 0; i < N; i++) {
    const angle = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const angle = startAngle + i * step;
    const r = (values[i] / 5) * R;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle   = 'rgba(79,156,249,0.22)';
  ctx.strokeStyle = '#4f9cf9';
  ctx.lineWidth   = 1.5;
  ctx.fill();
  ctx.stroke();

  // Data points
  for (let i = 0; i < N; i++) {
    const angle = startAngle + i * step;
    const r = (values[i] / 5) * R;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#4f9cf9';
    ctx.fill();
  }
}

/* ── Mineral Detail Modal ──────────────────────────────── */

function openMineralModal(name) {
  const mineral = window.MINERALS.find(m => m.name === name);
  if (!mineral) return;
  AppState.selectedMineral = name;

  const score = mineral.scores.composite;
  const tier  = getRiskTier(score);

  // Header
  document.getElementById('modal-mineral-name').textContent = mineral.name;
  document.getElementById('modal-mineral-symbol').textContent = `${mineral.symbol} · ${mineral.meta.annualDemand}`;
  document.getElementById('modal-score').textContent = score.toFixed(1);
  document.getElementById('modal-score').style.color = tier.color;

  // Sectors
  document.getElementById('modal-sectors').innerHTML =
    mineral.meta.sectors.map(s => `<span class="sector-chip ${s}">${s}</span>`).join('');

  // Key facts
  document.getElementById('kf-demand').textContent   = mineral.meta.annualDemand;
  document.getElementById('kf-supplier').textContent = mineral.meta.topSupplier;
  document.getElementById('kf-china').textContent    = `${mineral.meta.chinaShare}%`;
  document.getElementById('kf-china').style.color    = chinaColorRaw(mineral.meta.chinaShare);
  document.getElementById('kf-narrative').textContent = mineral.meta.keyFact;

  // Radar chart
  renderModalRadar(mineral);

  // India quadrant
  renderIndiaQuadrant(mineral);

  // Open modal
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // "Add to Compare" button
  const addBtn = document.getElementById('modal-add-compare');
  addBtn.onclick = () => addToCompare(name);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  // Destroy radar chart to avoid Canvas reuse error
  if (AppState.radarChartModal) {
    AppState.radarChartModal.destroy();
    AppState.radarChartModal = null;
  }
}

function renderModalRadar(mineral) {
  if (AppState.radarChartModal) {
    AppState.radarChartModal.destroy();
    AppState.radarChartModal = null;
  }

  const ctx = document.getElementById('modal-radar-canvas').getContext('2d');
  const values = getRadarValues(mineral);
  const labels = RADAR_AXIS_KEYS.map(a => a.label.replace('\n', ' '));
  const tier   = getRiskTier(mineral.scores.composite);

  AppState.radarChartModal = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: mineral.name,
        data: values,
        backgroundColor: hexToRgba(tier.color, 0.18),
        borderColor: tier.color,
        borderWidth: 2,
        pointBackgroundColor: tier.color,
        pointBorderColor: 'var(--bg)',
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1, display: false },
          grid:  { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: {
            color: '#6b6b8a',
            font: { size: 10, family: 'Inter, sans-serif' },
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw.toFixed(2)} / 5`,
          },
          backgroundColor: 'rgba(22,22,42,0.95)',
          titleColor: '#e8e8f0',
          bodyColor: '#a0a0c0',
          borderColor: '#2e2e50',
          borderWidth: 1,
        }
      }
    }
  });
}

/** India Exposure Quadrant — scatter plot with all minerals, current highlighted */
function renderIndiaQuadrant(currentMineral) {
  const svg = document.getElementById('modal-quadrant-svg');
  const W = 280, H = 240;
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;

  const xScale = v => PAD.left + ((v - 1) / 4) * PW;  // importDep 1-5
  const yScale = v => PAD.top + PH - ((v - 1) / 2) * PH; // strategic 1-3

  let html = `
    <!-- Quadrant divider lines -->
    <line x1="${xScale(3)}" y1="${PAD.top}" x2="${xScale(3)}" y2="${PAD.top + PH}"
          stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4,4"/>
    <line x1="${PAD.left}" y1="${yScale(2)}" x2="${PAD.left + PW}" y2="${yScale(2)}"
          stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4,4"/>

    <!-- Quadrant labels -->
    <text x="${xScale(1.5)}" y="${PAD.top + 14}" font-size="7" fill="rgba(255,255,255,0.2)" font-family="Inter,sans-serif">Low Risk</text>
    <text x="${xScale(3.5)}" y="${PAD.top + 14}" font-size="7" fill="rgba(255,71,87,0.35)" font-family="Inter,sans-serif">High Import</text>
    <text x="${xScale(1.5)}" y="${yScale(2) - 6}" font-size="7" fill="rgba(255,71,87,0.35)" font-family="Inter,sans-serif">High Geopolit.</text>
    <text x="${xScale(3.5)}" y="${yScale(2) - 6}" font-size="7" fill="rgba(255,71,87,0.5)" font-family="Inter,sans-serif">Critical Zone</text>

    <!-- Axis labels -->
    <text x="${PAD.left + PW / 2}" y="${H - 5}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.3)" font-family="Inter,sans-serif">India Import Dependence →</text>
    <text x="10" y="${PAD.top + PH / 2}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.3)" font-family="Inter,sans-serif" transform="rotate(-90,10,${PAD.top + PH / 2})">Geopolitical Risk →</text>
  `;

  // All background dots
  for (const m of window.MINERALS) {
    if (m.name === currentMineral.name) continue;
    const x = xScale(m.scores.importDep);
    const y = yScale(m.scores.strategic);
    html += `<circle cx="${x}" cy="${y}" r="3" fill="rgba(255,255,255,0.1)" />`;
  }

  // Highlighted dot
  const mx = xScale(currentMineral.scores.importDep);
  const my = yScale(currentMineral.scores.strategic);
  html += `
    <circle cx="${mx}" cy="${my}" r="8" fill="${chinaColorRaw(currentMineral.meta.chinaShare)}"
            fill-opacity="0.3" stroke="${chinaColorRaw(currentMineral.meta.chinaShare)}" stroke-width="2"/>
    <text cx="${mx}" cy="${my}" x="${mx}" y="${my + 4}" text-anchor="middle"
          font-size="8" font-weight="700" fill="white" font-family="Inter,sans-serif">
      ${currentMineral.symbol}
    </text>
  `;

  // Tick marks
  for (let i = 1; i <= 5; i++) {
    html += `<text x="${xScale(i)}" y="${PAD.top + PH + 12}" text-anchor="middle" font-size="7" fill="rgba(255,255,255,0.2)" font-family="Inter,sans-serif">${i}</text>`;
  }
  for (let i = 1; i <= 3; i++) {
    html += `<text x="${PAD.left - 6}" y="${yScale(i) + 3}" text-anchor="end" font-size="7" fill="rgba(255,255,255,0.2)" font-family="Inter,sans-serif">${i}</text>`;
  }

  svg.innerHTML = html;
}

function addToCompare(name) {
  // Populate Compare page selectors
  const sel = ['a', 'b', 'c'];
  let placed = false;
  for (const k of sel) {
    if (!AppState.compareSelections[k]) {
      AppState.compareSelections[k] = name;
      placed = true;
      break;
    }
  }
  if (!placed) {
    // Overwrite C
    AppState.compareSelections.c = name;
  }
  closeModal();
  navigate('compare');
}

/* ── Compare Page ──────────────────────────────────────── */

function renderComparePage() {
  initCompareSelects();
  updateCompareView();
}

function initCompareSelects() {
  ['a', 'b', 'c'].forEach(k => {
    const sel = document.getElementById(`compare-${k}`);
    if (!sel) return;

    // Populate options once
    if (sel.options.length <= 1) {
      window.MINERALS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.scores.composite})`;
        sel.appendChild(opt);
      });
    }

    // Restore state
    if (AppState.compareSelections[k]) {
      sel.value = AppState.compareSelections[k];
    }

    sel.addEventListener('change', e => {
      AppState.compareSelections[k] = e.target.value;
      updateCompareView();
    });
  });
}

function updateCompareView() {
  const { a, b, c } = AppState.compareSelections;
  const selected = [a, b, c].filter(Boolean).map(n => window.MINERALS.find(m => m.name === n)).filter(Boolean);

  const emptyEl   = document.getElementById('compare-empty');
  const contentEl = document.getElementById('compare-content');

  if (selected.length < 2) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  renderCompareRadar(selected);
  renderCompareTable(selected);
  renderCompareSectors(selected);
}

function renderCompareRadar(minerals) {
  if (AppState.radarChartCompare) {
    AppState.radarChartCompare.destroy();
    AppState.radarChartCompare = null;
  }

  const ctx = document.getElementById('compare-radar-canvas').getContext('2d');
  const labels = RADAR_AXIS_KEYS.map(a => a.label.replace('\n', ' '));

  const COLORS = ['#4f9cf9', '#ffa502', '#2ed573'];

  const datasets = minerals.map((m, i) => ({
    label: m.name,
    data: getRadarValues(m),
    backgroundColor: hexToRgba(COLORS[i], 0.12),
    borderColor: COLORS[i],
    borderWidth: 2,
    pointBackgroundColor: COLORS[i],
    pointBorderColor: '#080813',
    pointRadius: 4,
    pointHoverRadius: 6,
  }));

  AppState.radarChartCompare = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { stepSize: 1, display: false },
          grid:  { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: {
            color: '#6b6b8a',
            font: { size: 10, family: 'Inter, sans-serif' },
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#a0a0c0',
            font: { size: 11, family: 'Inter, sans-serif' },
            boxWidth: 12,
            padding: 16,
          }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)} / 5` },
          backgroundColor: 'rgba(22,22,42,0.95)',
          titleColor: '#e8e8f0',
          bodyColor: '#a0a0c0',
          borderColor: '#2e2e50',
          borderWidth: 1,
        }
      }
    }
  });
}

function renderCompareTable(minerals) {
  const table = document.getElementById('compare-table');

  const rows = [
    { label: 'Composite Score', fn: m => m.scores.composite.toFixed(1),           higherWorse: true  },
    { label: 'China Share',     fn: m => m.meta.chinaShare + '%',                  higherWorse: true  },
    { label: 'Annual Demand',   fn: m => m.meta.annualDemand,                      higherWorse: null  },
    { label: 'Top Supplier',    fn: m => m.meta.topSupplier,                       higherWorse: null  },
    { label: 'Demand Growth',   fn: m => m.scores.growth + ' / 5',                 higherWorse: true  },
    { label: 'Supply Conc.',    fn: m => ((m.scores.miningDiv+m.scores.refiningDiv)/2).toFixed(1)+' / 5', higherWorse: true },
    { label: 'India Import Dep',fn: m => m.scores.importDep + ' / 5',              higherWorse: true  },
    { label: 'Price Volatility',fn: m => m.scores.volatility + ' / 5',             higherWorse: true  },
    { label: 'Substitutability',fn: m => m.scores.substitutability + ' / 5',       higherWorse: true  },
  ];

  const headerCells = ['Dimension', ...minerals.map(m => m.name)].map(h => `<th>${h}</th>`).join('');

  const bodyRows = rows.map(row => {
    const vals = minerals.map(m => row.fn(m));
    // Find best/worst for numeric-comparable rows
    let bestIdx = -1, worstIdx = -1;
    if (row.higherWorse !== null) {
      const numVals = vals.map(v => parseFloat(v));
      if (!numVals.some(isNaN)) {
        worstIdx = numVals.indexOf(Math.max(...numVals));
        bestIdx  = numVals.indexOf(Math.min(...numVals));
      }
    }
    const cells = vals.map((v, i) => {
      let cls = '';
      if (row.higherWorse === true)  { if (i === worstIdx) cls = 'worst'; else if (i === bestIdx) cls = 'best'; }
      if (row.higherWorse === false) { if (i === worstIdx) cls = 'best';  else if (i === bestIdx) cls = 'worst'; }
      return `<td class="${cls}">${v}</td>`;
    }).join('');
    return `<tr><td>${row.label}</td>${cells}</tr>`;
  }).join('');

  table.innerHTML = `<thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody>`;
}

function renderCompareSectors(minerals) {
  const container = document.getElementById('compare-sectors');
  container.innerHTML = minerals.map(m => `
    <div class="overlap-mineral">
      <span class="overlap-name">${m.name}</span>
      <div class="sector-chips">
        ${m.meta.sectors.map(s => `<span class="sector-chip ${s}">${s}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* ── About Page ────────────────────────────────────────── */

function renderAboutPage() {
  const table = document.getElementById('about-dim-table');
  if (!table || table.innerHTML.trim()) return; // only render once

  table.innerHTML = `
    <thead>
      <tr><th>Dimension</th><th>Scale</th><th>Higher = ?</th></tr>
    </thead>
    <tbody>
      ${Object.entries(window.DIMENSIONS)
        .filter(([k]) => k !== 'composite')
        .map(([k, d]) => `
          <tr>
            <td>${d.label}</td>
            <td style="white-space:nowrap;">${d.min}–${d.max}</td>
            <td>${d.higherMeans}</td>
          </tr>
        `).join('')}
    </tbody>
  `;
}

/* ── Helper: hex/var to rgba ───────────────────────────── */

function hexToRgba(color, alpha) {
  // Handle CSS variable colors by falling back
  const map = {
    'var(--risk-critical)': `rgba(255,71,87,${alpha})`,
    'var(--risk-high)':     `rgba(255,107,53,${alpha})`,
    'var(--risk-moderate)': `rgba(255,165,2,${alpha})`,
    'var(--risk-low)':      `rgba(46,213,115,${alpha})`,
  };
  if (map[color]) return map[color];

  // Real hex
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(79,156,249,${alpha})`; // fallback
}

/* ── Window Resize ─────────────────────────────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (AppState.currentPage === 'overview') renderBubbleChart();
  }, 200);
});

/* ── Keyboard & Click Handlers ─────────────────────────── */

// Close modal on overlay click or Escape
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('modal-close').addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Mouse move for tooltip position tracking
document.addEventListener('mousemove', e => {
  const tt = document.getElementById('tooltip');
  if (tt.classList.contains('visible')) {
    positionTooltip(e);
  }
});

// Navigation
document.getElementById('main-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (btn && btn.dataset.page) navigate(btn.dataset.page);
});

/* ── Init ──────────────────────────────────────────────── */

function init() {
  recomputeWeightedScores();
  renderOverview();
  renderAboutPage();

  // Pre-render explorer grid in background
  // (will be re-rendered properly when user navigates)
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
