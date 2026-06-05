/* ============================================================
   CRITICAL MINERALS DASHBOARD — Application Logic
   Takshashila Institution · India Critical Minerals Analysis

   DATA EDITING GUIDE:
   ─ Add / remove a mineral : edit data/minerals_data.json AND data/group_assignments.json
   ─ Change a score          : find the mineral in minerals_data.json → edit vector score/composite
   ─ Edit justification text : find the mineral in minerals_data.json → edit vector "reason"
   ─ Update criteria bands   : edit data/criteria_data.json (the "bands" array per vector)
   ─ Change group assignment : edit data/group_assignments.json
   ─ Change colors / theme   : edit :root variables in style.css
   ============================================================ */

'use strict';

/* ── App Data (populated by loadData()) ────────────────────── */
const AppData = {
  minerals:         [],   // array of mineral objects from minerals_data.json
  criteriaVectors:  [],   // array of vector defs from criteria_data.json
  groups:           [],   // array of group defs from criteria_data.json
  groupAssignments: {},   // { "Beryllium": 4, ... } from group_assignments.json
};

/* ── App State ─────────────────────────────────────────────── */
const AppState = {
  currentPage:        'overview',
  selectedMineral:    null,
  compareSelections:  { a: '', b: '', c: '' },
  explorerSearch:     '',
  explorerGroupFilter:'all',
  explorerSort:       '',
  builderXKey:        'supplier_concentration',
  builderYKey:        'price_volatility',
  builderSearch:      '',
  builderGroupVisible:{},   // { groupId: true/false }
  radarChartMineral:  null, // Chart.js instance
  radarChartCompare:  null, // Chart.js instance
};

/* ── Compare series colors ─────────────────────────────────── */
const COMPARE_COLORS = ['#620d3c', '#f1a222', '#3d6b7d'];

/* ════════════════════════════════════════════════════════════
   DATA LOADING
   ════════════════════════════════════════════════════════════ */

async function loadData() {
  try {
    const [mRes, cRes, gRes] = await Promise.all([
      fetch('./data/minerals_data.json'),
      fetch('./data/criteria_data.json'),
      fetch('./data/group_assignments.json'),
    ]);
    const mData = await mRes.json();
    const cData = await cRes.json();
    const gData = await gRes.json();

    AppData.minerals         = mData.minerals;
    AppData.criteriaVectors  = cData.vectors;
    AppData.groups           = cData.groups;
    AppData.groupAssignments = gData;

    // All groups visible by default in builder
    AppData.groups.forEach(g => { AppState.builderGroupVisible[g.id] = true; });

    init();
  } catch (err) {
    document.querySelector('main').innerHTML =
      `<div style="padding:60px 24px;max-width:600px;margin:0 auto;">
         <h2 style="color:#c42b1e;margin-bottom:12px;">Data failed to load</h2>
         <p style="color:#6b4020;line-height:1.7;">If you are opening <code>index.html</code> directly from your filesystem,
         browsers block local <code>fetch()</code> calls. Run a local server instead:<br><br>
         <code style="background:#f5e8b8;padding:4px 8px;border-radius:4px;">python3 -m http.server 8099</code><br><br>
         then open <a href="http://localhost:8099" style="color:#620d3c;">http://localhost:8099</a></p>
         <p style="margin-top:16px;font-size:0.8rem;color:#9a7040;">Error: ${err.message}</p>
       </div>`;
  }
}

/* ════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ════════════════════════════════════════════════════════════ */

/** Returns the vector's raw score (score or composite). Null if not found. */
function getVectorValue(mineral, key) {
  const v = mineral.vectors[key];
  if (!v) return null;
  return v.composite !== undefined ? v.composite : (v.score !== undefined ? v.score : null);
}

/** Returns the vector's max from criteria_data. */
function getVectorMax(key) {
  const v = AppData.criteriaVectors.find(cv => cv.key === key);
  return v ? v.max : 5;
}

/** Normalizes mineral's vector value to a 0-5 display scale. */
function normalizeToFive(mineral, key) {
  const val = getVectorValue(mineral, key);
  const max = getVectorMax(key);
  if (val === null || isNaN(val)) return 0;
  return Math.min((val / max) * 5, 5);
}

/** Normalizes to 0-1. */
function normalizeToOne(mineral, key) {
  const val = getVectorValue(mineral, key);
  const max = getVectorMax(key);
  if (val === null || isNaN(val)) return 0;
  return Math.min(val / max, 1);
}

function getGroup(mineralName) {
  const id = AppData.groupAssignments[mineralName];
  return id !== undefined ? id : 0;
}

function groupColor(id) {
  const g = AppData.groups.find(g => g.id === Number(id));
  return g ? g.color : '#999999';
}

function groupName(id) {
  const g = AppData.groups.find(g => g.id === Number(id));
  return g ? g.name : 'Outlier';
}

function getMineralByName(name) {
  return AppData.minerals.find(m => m.mineral === name);
}

/** Heatmap cell background: pale yellow → Llama (#620d3c) */
function heatmapColor(norm) {
  const r = Math.round(255 + (98  - 255) * norm);
  const g = Math.round(251 + (13  - 251) * norm);
  const b = Math.round(226 + (60  - 226) * norm);
  return `rgb(${r},${g},${b})`;
}

/** Text color for heatmap cell so it remains readable. */
function heatmapTextColor(norm) {
  return norm > 0.55 ? 'rgba(255,255,255,0.92)' : '#1a0804';
}

function showToast(msg, dur = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function buildGroupChipHTML(mineralName) {
  const gid = getGroup(mineralName);
  const col  = groupColor(gid);
  return `<span class="group-chip" style="background:${col}1a;color:${col};border-color:${col}44;">${groupName(gid)}</span>`;
}

function buildGroupLegendHTML(clickable = false) {
  return AppData.groups.map(g =>
    `<span class="group-legend-item" ${clickable ? `data-gid="${g.id}"` : ''}>
       <span class="group-legend-dot" style="background:${g.color}"></span>
       ${g.name}
     </span>`
  ).join('');
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════════════════════ */

function navigate(page, mineralName) {
  if (page === 'mineral' && mineralName) {
    AppState.selectedMineral = mineralName;
  }
  AppState.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const pageEl  = document.getElementById(`page-${page}`);
  const navBtn  = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (pageEl) pageEl.classList.add('active');
  if (navBtn) navBtn.classList.add('active');

  switch (page) {
    case 'overview': renderOverview();  break;
    case 'explorer': renderExplorer();  break;
    case 'mineral':  renderMineralPage(AppState.selectedMineral); break;
    case 'criteria': renderCriteria();  break;
    case 'compare':  renderCompare();   break;
    case 'builder':  renderBuilder();   break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */

function init() {
  // Nav clicks
  document.getElementById('main-nav').addEventListener('click', e => {
    const btn = e.target.closest('.nav-btn');
    if (btn?.dataset.page) navigate(btn.dataset.page);
  });

  // Mineral page back button
  document.getElementById('mp-back-btn').addEventListener('click', () => navigate('explorer'));

  // Add-to-compare button
  document.getElementById('mp-add-compare').addEventListener('click', () => {
    const name = AppState.selectedMineral;
    if (!name) return;
    const s = AppState.compareSelections;
    if      (!s.a) s.a = name;
    else if (!s.b) s.b = name;
    else           s.c = name;
    showToast(`${name} added to compare`);
    navigate('compare');
  });

  // Explorer search & sort
  document.getElementById('explorer-search').addEventListener('input', e => {
    AppState.explorerSearch = e.target.value.toLowerCase();
    renderExplorer();
  });
  document.getElementById('explorer-sort').addEventListener('change', e => {
    AppState.explorerSort = e.target.value;
    renderExplorer();
  });

  // Populate compare selects
  const allNames = AppData.minerals.map(m => m.mineral).sort();
  ['a', 'b', 'c'].forEach(slot => {
    const sel = document.getElementById(`compare-${slot}`);
    allNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => {
      AppState.compareSelections[slot] = e.target.value;
      renderCompare();
    });
  });

  // Builder axis selects
  const vecOptions = AppData.criteriaVectors
    .map(v => `<option value="${v.key}">${v.name} (/${v.max})</option>`)
    .join('');
  ['builder-x-axis', 'builder-y-axis'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = vecOptions;
  });
  document.getElementById('builder-x-axis').value = 'supplier_concentration';
  document.getElementById('builder-y-axis').value = 'price_volatility';

  document.getElementById('builder-x-axis').addEventListener('change', e => {
    AppState.builderXKey = e.target.value;
    renderBuilderChart();
  });
  document.getElementById('builder-y-axis').addEventListener('change', e => {
    AppState.builderYKey = e.target.value;
    renderBuilderChart();
  });
  document.getElementById('builder-search').addEventListener('input', e => {
    AppState.builderSearch = e.target.value.toLowerCase();
    renderBuilderChart();
  });

  navigate('overview');
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW PAGE
   ════════════════════════════════════════════════════════════ */

function renderOverview() {
  document.getElementById('overview-group-legend').innerHTML = buildGroupLegendHTML();
  renderOverviewScatter();
  renderHeatmap();
}

function renderOverviewScatter() {
  const svg = document.getElementById('overview-scatter-svg');
  if (!svg) return;
  const W  = svg.parentElement.clientWidth || 900;
  const H  = 420;
  const M  = { top: 20, right: 20, bottom: 46, left: 46 };
  const PW = W - M.left - M.right;
  const PH = H - M.top  - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fffbe2"/>`;
  html += `<rect x="${M.left}" y="${M.top}" width="${PW}" height="${PH}" fill="rgba(241,162,34,0.02)" rx="4"/>`;

  // Grid + tick labels
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    const gx = M.left + t * PW;
    const gy = M.top + (1 - t) * PH;
    html += `<line x1="${gx}" y1="${M.top}" x2="${gx}" y2="${M.top + PH}" stroke="rgba(26,8,4,0.06)" stroke-width="1"/>`;
    html += `<line x1="${M.left}" y1="${gy}" x2="${M.left + PW}" y2="${gy}" stroke="rgba(26,8,4,0.06)" stroke-width="1"/>`;
    html += `<text x="${gx}" y="${M.top + PH + 14}" text-anchor="middle" font-size="8.5" fill="#9a7040" font-family="Inter,sans-serif">${(t * 10).toFixed(0)}</text>`;
    html += `<text x="${M.left - 6}" y="${gy + 3}" text-anchor="end" font-size="8.5" fill="#9a7040" font-family="Inter,sans-serif">${(t * 5).toFixed(0)}</text>`;
  });

  // Axis labels
  html += `<text x="${M.left + PW / 2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="#6b4020" font-family="Inter,sans-serif" font-weight="600">Supply Concentration (0–10)</text>`;
  html += `<text x="13" y="${M.top + PH / 2}" text-anchor="middle" font-size="10" fill="#6b4020" font-family="Inter,sans-serif" font-weight="600" transform="rotate(-90,13,${M.top + PH / 2})">Price Volatility (0–5)</text>`;

  // Dots
  AppData.minerals.forEach(m => {
    const xN   = normalizeToOne(m, 'supplier_concentration');
    const yN   = normalizeToOne(m, 'price_volatility');
    const cx   = M.left + xN * PW;
    const cy   = M.top  + (1 - yN) * PH;
    const gid  = getGroup(m.mineral);
    const col  = groupColor(gid);
    const xVal = getVectorValue(m, 'supplier_concentration') ?? '—';
    const yVal = getVectorValue(m, 'price_volatility') ?? '—';

    html += `<g class="scatter-dot" data-mineral="${m.mineral}" style="cursor:pointer;">
      <circle cx="${cx}" cy="${cy}" r="5" fill="${col}" fill-opacity="0.82" stroke="#fffbe2" stroke-width="1.2"/>
      <title>${m.mineral} (${groupName(gid)})
Supply Conc: ${xVal}/10  ·  Volatility: ${yVal}/5</title>
    </g>`;
  });

  svg.innerHTML = html;
  svg.querySelectorAll('.scatter-dot').forEach(el =>
    el.addEventListener('click', () => navigate('mineral', el.dataset.mineral))
  );
}

/* ── Heatmap ───────────────────────────────────────────────── */

function renderHeatmap() {
  const table = document.getElementById('heatmap-table');
  if (!table) return;
  const vecs = AppData.criteriaVectors;

  // Short column labels
  const SHORT = {
    demand: 'Demand', growth: 'Growth', supplier_concentration: 'Supply\nConc.',
    reserves: 'Reserves', end_use: 'End-use',
    substitutability_recyclability: 'Subst. &\nRecycl.', extraction_refining: 'Extraction',
    upcoming_projects: 'Pipeline', india_position: 'India', price_volatility: 'Volatility',
  };

  // Sort minerals: by group id then alphabetically
  const sorted = [...AppData.minerals].sort((a, b) => {
    const ga = getGroup(a.mineral), gb = getGroup(b.mineral);
    return ga !== gb ? ga - gb : a.mineral.localeCompare(b.mineral);
  });

  // Header
  let html = `<thead><tr>
    <th class="heatmap-mineral-col">Mineral</th>
    <th class="heatmap-group-col">Grp</th>
    ${vecs.map(v => `<th class="heatmap-vector-th" title="${v.name} (max ${v.max})">${SHORT[v.key] || v.name}</th>`).join('')}
  </tr></thead><tbody>`;

  let lastGroup = null;
  sorted.forEach(m => {
    const gid = getGroup(m.mineral);
    const col  = groupColor(gid);
    if (gid !== lastGroup) {
      html += `<tr class="heatmap-group-row">
        <td colspan="${vecs.length + 2}" style="background:${col}15;color:${col};font-weight:700;font-size:0.68rem;padding:4px 8px;letter-spacing:0.06em;text-transform:uppercase;">${groupName(gid)}</td>
      </tr>`;
      lastGroup = gid;
    }
    html += `<tr class="heatmap-row" data-mineral="${m.mineral}">
      <td class="heatmap-mineral-name">${m.mineral}</td>
      <td><span class="group-chip" style="background:${col}15;color:${col};border-color:${col}40;font-size:0.55rem;padding:1px 5px;">${gid}</span></td>
      ${vecs.map(v => {
        const val  = getVectorValue(m, v.key);
        const norm = val !== null ? val / v.max : 0;
        const bg   = heatmapColor(norm);
        const tc   = heatmapTextColor(norm);
        const disp = val !== null ? val : '—';
        return `<td class="heatmap-cell" style="background:${bg};color:${tc};" title="${m.mineral} — ${v.name}: ${val !== null ? val + '/' + v.max : 'n/a'}">${disp}</td>`;
      }).join('')}
    </tr>`;
  });
  html += '</tbody>';
  table.innerHTML = html;

  table.querySelectorAll('.heatmap-row').forEach(row =>
    row.addEventListener('click', () => navigate('mineral', row.dataset.mineral))
  );
}

/* ════════════════════════════════════════════════════════════
   EXPLORER PAGE
   ════════════════════════════════════════════════════════════ */

function renderExplorer() {
  // Build group filter chips once
  const chipWrap = document.getElementById('explorer-group-chips');
  if (!chipWrap.hasChildNodes()) {
    chipWrap.innerHTML = `<button class="filter-chip active" data-group="all">All</button>`
      + AppData.groups.map(g =>
          `<button class="filter-chip" data-group="${g.id}">${g.name}</button>`
        ).join('');
    chipWrap.addEventListener('click', e => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      chipWrap.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.explorerGroupFilter = btn.dataset.group;
      renderExplorer();
    });
  }

  let minerals = AppData.minerals.filter(m => {
    if (AppState.explorerGroupFilter !== 'all' && getGroup(m.mineral) !== Number(AppState.explorerGroupFilter)) return false;
    if (AppState.explorerSearch && !m.mineral.toLowerCase().includes(AppState.explorerSearch)) return false;
    return true;
  });

  if (AppState.explorerSort) {
    minerals = [...minerals].sort((a, b) =>
      (getVectorValue(b, AppState.explorerSort) ?? -1) - (getVectorValue(a, AppState.explorerSort) ?? -1)
    );
  }

  const grid = document.getElementById('minerals-grid');
  grid.innerHTML = minerals.map(m => buildMineralCard(m)).join('');

  grid.querySelectorAll('.mineral-card').forEach(card => {
    card.addEventListener('click', () => navigate('mineral', card.dataset.mineral));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') navigate('mineral', card.dataset.mineral); });
    const canvas = card.querySelector('.mini-10-radar');
    if (canvas) drawMiniRadar10(canvas, card.dataset.mineral);
  });
}

function buildMineralCard(m) {
  const gid  = getGroup(m.mineral);
  const col  = groupColor(gid);
  const gname = groupName(gid);
  const sc   = getVectorValue(m, 'supplier_concentration');
  const ip   = getVectorValue(m, 'india_position');
  const pv   = getVectorValue(m, 'price_volatility');

  return `
    <div class="mineral-card" data-mineral="${m.mineral}" role="button" tabindex="0">
      <div class="card-header">
        <div class="card-name">${m.mineral}</div>
        <span class="group-chip" style="background:${col}18;color:${col};border-color:${col}40;">${gname}</span>
      </div>
      <canvas class="mini-10-radar" width="120" height="120"></canvas>
      <div class="card-vector-row">
        <div class="card-vec"><span class="card-vec-label">Supply</span><span class="card-vec-val">${sc ?? '—'}/10</span></div>
        <div class="card-vec"><span class="card-vec-label">India</span><span class="card-vec-val">${ip ?? '—'}/10</span></div>
        <div class="card-vec"><span class="card-vec-label">Volatility</span><span class="card-vec-val">${pv ?? '—'}/5</span></div>
      </div>
    </div>`;
}

/* ── Mini 10-spoke canvas radar ────────────────────────────── */
function drawMiniRadar10(canvas, mineralName) {
  const m = getMineralByName(mineralName);
  if (!m || !canvas) return;
  const ctx = canvas.getContext('2d');
  const cx  = canvas.width  / 2;
  const cy  = canvas.height / 2;
  const r   = Math.min(cx, cy) - 12;
  const n   = AppData.criteriaVectors.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a  = (i / n) * Math.PI * 2 - Math.PI / 2;
      const rr = (ring / 5) * r;
      i === 0 ? ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a))
              : ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(98,13,60,0.09)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(98,13,60,0.06)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // Data polygon — colored by group
  const col = groupColor(getGroup(mineralName));
  ctx.beginPath();
  AppData.criteriaVectors.forEach((v, i) => {
    const norm = normalizeToFive(m, v.key) / 5;
    const a    = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr   = norm * r;
    i === 0 ? ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a))
            : ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  });
  ctx.closePath();
  ctx.fillStyle   = col + '28';
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}

/* ════════════════════════════════════════════════════════════
   MINERAL DETAIL PAGE
   ════════════════════════════════════════════════════════════ */

function renderMineralPage(mineralName) {
  if (!mineralName) return;
  const m = getMineralByName(mineralName);
  if (!m) return;

  const gid  = getGroup(mineralName);
  const col  = groupColor(gid);

  // Header
  const sym = document.getElementById('mp-symbol');
  sym.textContent  = mineralName.slice(0, 2).toUpperCase();
  sym.style.background = col + '22';
  sym.style.color      = col;
  document.getElementById('mp-name').textContent  = mineralName;
  document.getElementById('mp-group-chip').innerHTML = buildGroupChipHTML(mineralName);

  // Destroy old chart if any
  if (AppState.radarChartMineral) { AppState.radarChartMineral.destroy(); AppState.radarChartMineral = null; }

  // Radar chart — all 10 vectors normalized to 0-5
  const radarLabels = AppData.criteriaVectors.map(v => v.name.split(' ').slice(0, 2).join(' '));
  const radarData   = AppData.criteriaVectors.map(v => normalizeToFive(m, v.key));

  AppState.radarChartMineral = new Chart(
    document.getElementById('mp-radar-canvas').getContext('2d'),
    {
      type: 'radar',
      data: {
        labels: radarLabels,
        datasets: [{
          label: mineralName,
          data: radarData,
          backgroundColor: col + '1e',
          borderColor: col,
          borderWidth: 1.5,
          pointBackgroundColor: col,
          pointRadius: 2.5,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { display: false, stepSize: 1 },
            grid: { color: 'rgba(98,13,60,0.08)' },
            pointLabels: { color: '#6b4020', font: { size: 8, family: 'Inter' } },
            angleLines: { color: 'rgba(98,13,60,0.06)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff', titleColor: '#1a0804',
            bodyColor: '#6b4020', borderColor: '#e4d49c', borderWidth: 1,
            callbacks: {
              label: ctx => {
                const v   = AppData.criteriaVectors[ctx.dataIndex];
                const raw = getVectorValue(m, v.key);
                return ` ${raw !== null ? raw : 'n/a'} / ${v.max}`;
              }
            }
          }
        }
      }
    }
  );

  // Scorecard
  renderMineralScorecard(m);

  // Policy pane
  renderPolicyPane(mineralName);
}

function renderMineralScorecard(m) {
  const container = document.getElementById('mp-scorecard');
  container.innerHTML = AppData.criteriaVectors.map(v => {
    const val  = getVectorValue(m, v.key);
    const pct  = val !== null ? (val / v.max) * 100 : 0;
    const norm = val !== null ? val / v.max : 0;
    const barColor = `hsl(${Math.round((1 - norm) * 90)},60%,42%)`;

    // Sub-score HTML (inside accordion)
    let subHTML = '';
    if (v.sub && m.vectors[v.key]?.sub) {
      const subs = m.vectors[v.key].sub;
      subHTML = `<div class="scorecard-subs">${v.sub.map(s => {
        const sv = subs[s.key];
        return `<div class="scorecard-sub-row">
          <span class="scorecard-sub-label">${s.name}</span>
          <span class="scorecard-sub-val">${sv !== undefined ? sv : '—'} / ${s.max}</span>
        </div>`;
      }).join('')}</div>`;
    }

    const reason = m.vectors[v.key]?.reason || '';

    return `
      <div class="scorecard-row" data-key="${v.key}">
        <div class="scorecard-row-header">
          <span class="scorecard-vec-name">${v.name}</span>
          <div class="scorecard-right">
            <div class="scorecard-bar-wrap">
              <div class="scorecard-bar" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
            </div>
            <span class="scorecard-val" style="color:${barColor}">${val !== null ? val : 'n/a'}<span class="scorecard-max">/${v.max}</span></span>
            <span class="scorecard-expand-icon">▸</span>
          </div>
        </div>
        <div class="scorecard-accord hidden">
          ${subHTML}
          ${reason ? `<div class="scorecard-reason">${reason}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  // Wire accordion toggles
  container.querySelectorAll('.scorecard-row-header').forEach(header => {
    header.addEventListener('click', () => {
      const accord = header.closest('.scorecard-row').querySelector('.scorecard-accord');
      const icon   = header.querySelector('.scorecard-expand-icon');
      const open   = !accord.classList.contains('hidden');
      accord.classList.toggle('hidden');
      icon.textContent = open ? '▸' : '▾';
    });
  });
}

/* ── Policy pane (TBC) ─────────────────────────────────────── */
function renderPolicyPane(mineralName) {
  const pane = document.getElementById('mp-policy');
  if (!pane) return;
  const levers = [
    { tag: 'Supply Security',       title: 'Strategic Partner & Import Diversification',   desc: `Bilateral agreements and diversification strategies to reduce concentration risk for ${mineralName}. Frameworks with resource-rich partner nations are yet to be defined.` },
    { tag: 'Domestic Development',  title: 'Exploration, Mining & Processing Investment',  desc: `Deposit identification and mining promotion specific to ${mineralName} supply chains. Investment frameworks and production targets pending formulation.` },
    { tag: 'Demand Management',     title: 'Efficiency Standards & Substitution R&D',      desc: `Efficiency standards and substitution research to moderate ${mineralName} demand intensity. Technology roadmaps and subsidy structures under deliberation.` },
    { tag: 'Stockpiling',           title: 'Strategic Reserve & Buffer Stock Policy',       desc: `National stockpile targets and buffer stock norms for ${mineralName}. Reserve levels, financing mechanisms, and release protocols yet to be defined.` },
    { tag: 'Circularity',           title: 'Recycling Infrastructure & EPR Norms',          desc: `Extended producer responsibility rules and end-of-life recovery to improve ${mineralName} circularity. Collection targets and processing standards not yet specified.` },
  ];
  pane.innerHTML = `
    <div class="mp-policy-header">
      <span class="mp-card-title">Policy Alternatives</span>
      <span class="mp-tbc-global">All entries TBC — indicative only</span>
    </div>
    <div class="mp-policy-grid">
      ${levers.map(l => `
        <div class="mp-policy-card">
          <div class="mp-policy-top"><span class="mp-policy-tag">${l.tag}</span><span class="mp-tbc-badge">TBC</span></div>
          <div class="mp-policy-title">${l.title}</div>
          <div class="mp-policy-desc">${l.desc}</div>
        </div>`).join('')}
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   CRITERIA PAGE
   ════════════════════════════════════════════════════════════ */

function renderCriteria() {
  const container = document.getElementById('criteria-vectors-list');
  if (container.dataset.rendered) return; // render once
  container.dataset.rendered = 'true';

  container.innerHTML = AppData.criteriaVectors.map((v, idx) => {
    // Bands (interactive pills)
    const bandsHTML = v.bands ? `
      <div class="criteria-bands">
        ${v.bands.map(b => `<button class="criteria-band-pill" data-label="${escapeHtml(b.label)}" data-score="${b.score}">Score ${b.score}</button>`).join('')}
        <div class="criteria-band-callout hidden"></div>
      </div>` : '';

    // Sub-scores
    const subsHTML = v.sub ? `
      <div class="criteria-subs">
        ${v.sub.map(s => `
          <div class="criteria-sub-item">
            <span class="criteria-sub-name">${s.name} <em>/${s.max}</em></span>
            ${s.note ? `<div class="criteria-sub-note">${s.note}</div>` : ''}
          </div>`).join('')}
      </div>` : '';

    return `
      <div class="criteria-vector-card card">
        <div class="criteria-vector-top">
          <span class="criteria-index">${idx + 1}</span>
          <div class="criteria-vector-header">
            <div class="criteria-vector-name">${v.name}</div>
            <span class="criteria-family-tag">${v.family}</span>
          </div>
          <span class="criteria-max-badge">/${v.max}</span>
        </div>
        <p class="criteria-vector-what">${v.what}</p>
        ${subsHTML}
        ${bandsHTML}
      </div>`;
  }).join('');

  // Band pill click → show/hide callout
  container.querySelectorAll('.criteria-band-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const bandsDiv = pill.closest('.criteria-bands');
      const callout  = bandsDiv.querySelector('.criteria-band-callout');
      const label    = pill.dataset.label;
      const alreadyOpen = !callout.classList.contains('hidden') && callout.textContent === `Score ${pill.dataset.score}: ${label}`;
      bandsDiv.querySelectorAll('.criteria-band-pill').forEach(p => p.classList.remove('active'));
      if (alreadyOpen) {
        callout.classList.add('hidden');
      } else {
        pill.classList.add('active');
        callout.textContent = `Score ${pill.dataset.score}: ${label}`;
        callout.classList.remove('hidden');
      }
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════════════════════════════
   COMPARE PAGE
   ════════════════════════════════════════════════════════════ */

function renderCompare() {
  const sel = AppState.compareSelections;

  // Sync select values
  ['a', 'b', 'c'].forEach(slot => {
    const el = document.getElementById(`compare-${slot}`);
    if (el.value !== (sel[slot] || '')) el.value = sel[slot] || '';
  });

  const selected = ['a', 'b', 'c']
    .map(k => sel[k])
    .filter(Boolean)
    .map(getMineralByName)
    .filter(Boolean);

  const empty   = document.getElementById('compare-empty');
  const content = document.getElementById('compare-content');

  if (selected.length < 2) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  content.classList.remove('hidden');

  // Radar
  if (AppState.radarChartCompare) { AppState.radarChartCompare.destroy(); AppState.radarChartCompare = null; }

  const labels   = AppData.criteriaVectors.map(v => v.name.split(' ').slice(0, 2).join(' '));
  const datasets = selected.map((m, i) => {
    const col = COMPARE_COLORS[i] || groupColor(getGroup(m.mineral));
    return {
      label: m.mineral,
      data: AppData.criteriaVectors.map(v => normalizeToFive(m, v.key)),
      backgroundColor: col + '1e',
      borderColor: col,
      borderWidth: 1.5,
      pointBackgroundColor: col,
      pointRadius: 2.5, pointHoverRadius: 4,
    };
  });

  AppState.radarChartCompare = new Chart(
    document.getElementById('compare-radar-canvas').getContext('2d'),
    {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { display: false },
            grid: { color: 'rgba(98,13,60,0.08)' },
            pointLabels: { color: '#6b4020', font: { size: 8, family: 'Inter' } },
            angleLines: { color: 'rgba(98,13,60,0.06)' }
          }
        },
        plugins: {
          legend: { labels: { color: '#1a0804', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 14 } },
          tooltip: {
            backgroundColor: '#fff', titleColor: '#1a0804',
            bodyColor: '#6b4020', borderColor: '#e4d49c', borderWidth: 1,
            callbacks: { label: ctx => {
              const v   = AppData.criteriaVectors[ctx.dataIndex];
              const raw = getVectorValue(selected[ctx.datasetIndex], v.key);
              return ` ${selected[ctx.datasetIndex].mineral}: ${raw ?? 'n/a'} / ${v.max}`;
            }}
          }
        }
      }
    }
  );

  // Table
  const table = document.getElementById('compare-table');
  let tableHTML = `<thead><tr><th>Vector</th>${selected.map(m => `<th style="text-align:center">${m.mineral}</th>`).join('')}</tr></thead><tbody>`;
  AppData.criteriaVectors.forEach(v => {
    const vals  = selected.map(m => getVectorValue(m, v.key));
    const normed = vals.map(val => val !== null ? val / v.max : 0);
    tableHTML += `<tr><td class="compare-vec-label">${v.name} <span class="compare-max">/${v.max}</span></td>`;
    vals.forEach((val, i) => {
      const col = `hsl(${Math.round((1 - normed[i]) * 90)},60%,42%)`;
      tableHTML += `<td style="color:${col};font-weight:600;text-align:center;">${val ?? '—'}</td>`;
    });
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody>';
  table.innerHTML = tableHTML;
}

/* ════════════════════════════════════════════════════════════
   CHART BUILDER PAGE
   ════════════════════════════════════════════════════════════ */

function renderBuilder() {
  renderBuilderGroupToggles();
  renderBuilderChart();
}

function renderBuilderGroupToggles() {
  const wrap = document.getElementById('builder-group-toggles');
  if (wrap.dataset.rendered) return;
  wrap.dataset.rendered = 'true';

  wrap.innerHTML = AppData.groups.map(g =>
    `<button class="builder-group-toggle active" data-gid="${g.id}">
       <span class="toggle-dot" style="background:${g.color}"></span>
       ${g.name}
     </button>`
  ).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.builder-group-toggle');
    if (!btn) return;
    const gid = Number(btn.dataset.gid);
    AppState.builderGroupVisible[gid] = !AppState.builderGroupVisible[gid];
    btn.classList.toggle('active', AppState.builderGroupVisible[gid]);
    renderBuilderChart();
  });
}

function renderBuilderChart() {
  const svg  = document.getElementById('builder-chart-svg');
  if (!svg) return;
  const xKey = AppState.builderXKey;
  const yKey = AppState.builderYKey;
  const xVec = AppData.criteriaVectors.find(v => v.key === xKey);
  const yVec = AppData.criteriaVectors.find(v => v.key === yKey);
  const srch = AppState.builderSearch;

  const W  = svg.parentElement.clientWidth || 900;
  const H  = 520;
  const M  = { top: 24, right: 24, bottom: 54, left: 54 };
  const PW = W - M.left - M.right;
  const PH = H - M.top  - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fdf4d0"/>`;
  html += `<rect x="${M.left}" y="${M.top}" width="${PW}" height="${PH}" fill="rgba(241,162,34,0.02)" rx="4"/>`;

  // Grid
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    const gx = M.left + t * PW;
    const gy = M.top  + (1 - t) * PH;
    html += `<line x1="${gx}" y1="${M.top}" x2="${gx}" y2="${M.top+PH}" stroke="rgba(26,8,4,0.07)" stroke-width="1"/>`;
    html += `<line x1="${M.left}" y1="${gy}" x2="${M.left+PW}" y2="${gy}" stroke="rgba(26,8,4,0.07)" stroke-width="1"/>`;
    if (xVec) html += `<text x="${gx}" y="${M.top+PH+16}" text-anchor="middle" font-size="8.5" fill="#9a7040" font-family="Inter">${(t*xVec.max).toFixed(1)}</text>`;
    if (yVec) html += `<text x="${M.left-6}" y="${gy+3}" text-anchor="end" font-size="8.5" fill="#9a7040" font-family="Inter">${((1-t)*yVec.max).toFixed(1)}</text>`;
  });

  // Axis labels
  if (xVec) html += `<text x="${M.left+PW/2}" y="${H-8}" text-anchor="middle" font-size="10" fill="#6b4020" font-family="Inter,sans-serif" font-weight="600">${xVec.name} (/${xVec.max})</text>`;
  if (yVec) html += `<text x="14" y="${M.top+PH/2}" text-anchor="middle" font-size="10" fill="#6b4020" font-family="Inter,sans-serif" font-weight="600" transform="rotate(-90,14,${M.top+PH/2})">${yVec.name} (/${yVec.max})</text>`;

  // Dots
  AppData.minerals.forEach(m => {
    const gid = getGroup(m.mineral);
    if (!AppState.builderGroupVisible[gid]) return;
    const xVal = getVectorValue(m, xKey);
    const yVal = getVectorValue(m, yKey);
    if (xVal === null || yVal === null) return;

    const xN    = xVec ? xVal / xVec.max : 0;
    const yN    = yVec ? yVal / yVec.max : 0;
    const cx    = M.left + xN * PW;
    const cy    = M.top  + (1 - yN) * PH;
    const col   = groupColor(gid);
    const isHit = srch && m.mineral.toLowerCase().includes(srch);
    const isDim = srch && !isHit;
    const op    = isDim ? 0.12 : 0.85;
    const rad   = isHit ? 7 : 5;

    html += `<g class="builder-dot" data-mineral="${m.mineral}" style="cursor:pointer;">
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}" fill-opacity="${op}" stroke="${isHit ? '#1a0804':'#fdf4d0'}" stroke-width="${isHit?1.5:0.8}"/>
      ${isHit ? `<text x="${cx}" y="${cy-rad-3}" text-anchor="middle" font-size="9" fill="#1a0804" font-family="Inter" font-weight="700">${m.mineral}</text>` : ''}
      <title>${m.mineral} (${groupName(gid)})
${xVec?.name}: ${xVal}/${xVec?.max}  ·  ${yVec?.name}: ${yVal}/${yVec?.max}</title>
    </g>`;
  });

  svg.innerHTML = html;
  svg.querySelectorAll('.builder-dot').forEach(el =>
    el.addEventListener('click', () => navigate('mineral', el.dataset.mineral))
  );
}

/* ════════════════════════════════════════════════════════════
   RESIZE HANDLING
   ════════════════════════════════════════════════════════════ */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (AppState.currentPage === 'overview') renderOverviewScatter();
    if (AppState.currentPage === 'builder')  renderBuilderChart();
  }, 180);
});

/* ════════════════════════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', loadData);
