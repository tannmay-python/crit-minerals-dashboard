/* =========================================================
   CRITICAL MINERALS DASHBOARD — Application Logic v2
   Risk Index (0-10 normalized weighted score) everywhere.
   14-axis radar charts. SVG bubble + geopolitical charts.
   ========================================================= */

'use strict';

/* ── App State ─────────────────────────────────────────── */
const AppState = {
  currentPage: 'overview',
  activeSector: 'all',
  explorerSort: 'china',
  selectedMineral: null,
  compareSelections: { a: '', b: '', c: '' },
  radarChartMineral: null,
  radarChartCompare: null,
  heatmapSortDim: null,
  heatmapSortDir: -1,
};

/* ── Constants ─────────────────────────────────────────── */


const SECTOR_COLORS = {
  defense:        '#f85149',
  energy:         '#f0a500',
  semiconductors: '#58a6ff',
  electrification:'#3fb950',
  healthcare:     '#bc8cff',
  agriculture:    '#79c0ff',
  construction:   '#848d97',
};

/* ── Chart Builder ─────────────────────────────────────── */

const CB_AXES = [
  { key: 'chinaShare',   label: 'China Supply Share (%)',         getValue: m => m.meta.chinaShare,                             min: 0,  max: 100 },
  { key: 'demandLog',    label: 'Annual Demand (log scale)',       getValue: m => Math.log10((m.annualDemandTons||1)+1),         min: 0,  max: 8   },
  { key: 'demand',       label: 'Current Demand (1–5)',           getValue: m => m.scores.demand,                               min: 1,  max: 5   },
  { key: 'growth',       label: 'Demand Growth (1–5)',            getValue: m => m.scores.growth,                               min: 1,  max: 5   },
  { key: 'supplyConc',   label: 'Supply Concentration (avg 1–5)', getValue: m => (m.scores.miningDiv+m.scores.refiningDiv)/2,  min: 1,  max: 5   },
  { key: 'miningDiv',    label: 'Mining Concentration (1–5)',     getValue: m => m.scores.miningDiv,                            min: 1,  max: 5   },
  { key: 'refiningDiv',  label: 'Refining Concentration (1–5)',   getValue: m => m.scores.refiningDiv,                          min: 1,  max: 5   },
  { key: 'resTime',      label: 'Reserve Lifetime Risk (1–6)',    getValue: m => m.scores.resTime,                              min: 1,  max: 6   },
  { key: 'resDiv',       label: 'Reserve Geographic Div. (1–5)',  getValue: m => m.scores.resDiv,                               min: 1,  max: 5   },
  { key: 'endUseComp',   label: 'End-Use Scope (0–10)',           getValue: m => m.scores.endUseComp,                           min: 0,  max: 10  },
  { key: 'subst',        label: 'Substitution Risk (1–5)',        getValue: m => m.scores.substitutability,                     min: 1,  max: 5   },
  { key: 'recycl',       label: 'Recycling Gap (1–5)',            getValue: m => m.scores.recyclability,                        min: 1,  max: 5   },
  { key: 'extraction',   label: 'Processing Complexity (1–5)',    getValue: m => m.scores.extraction,                           min: 1,  max: 5   },
  { key: 'projects',     label: 'Pipeline Gap (1–5)',             getValue: m => m.scores.projects,                             min: 1,  max: 5   },
  { key: 'importDep',    label: 'India Import Dependence (1–5)',  getValue: m => m.scores.importDep,                            min: 1,  max: 5   },
  { key: 'strategic',    label: 'India Strategic Posture (1–5)',  getValue: m => m.scores.strategic,                            min: 1,  max: 5   },
  { key: 'volatility',   label: 'Price Volatility (1–5)',         getValue: m => m.scores.volatility,                           min: 1,  max: 5   },
];

const CBState = {
  type:    'scatter',
  xKey:    'supplyConc',
  yKey:    'growth',
  colorBy: 'sector',
  sizeBy:  'equal',
  sector:  'all',
};

const RADAR_LABELS = window.RADAR_14.map(d => d.label);

/* ── Utility ───────────────────────────────────────────── */

function getRiskTier() { return { label: 'moderate', color: '#f1a222' }; }

function chinaColor(pct) {
  if (pct >= 70) return '#f85149';
  if (pct >= 30) return '#e3693a';
  return '#3fb950';
}

function normalize14(val, max) {
  return Math.min((val / max) * 5, 5);
}

function get14Values(mineral) {
  return window.RADAR_14.map(d => normalize14(mineral.scores[d.key] || 0, d.max));
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function showToast(msg, dur = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  if (h.length === 6) {
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(88,166,255,${alpha})`;
}

function heatmapColor(score, max) {
  // Green (hsl 120) → Amber (hsl 40) → Red (hsl 0), lightness 42%
  const t = clamp((score - 1) / (max - 1), 0, 1);
  const hue = lerp(120, 0, t);
  return `hsl(${hue.toFixed(0)},65%,42%)`;
}

/* ── Risk Index Computation ────────────────────────────── */

function computeRiskIndex(mineral) {
  const s = mineral.scores;
  const dims = [
    [s.demand,5],[s.growth,5],[s.miningDiv,5],[s.refiningDiv,5],
    [s.resTime,6],[s.resDiv,5],[s.endUseComp,10],
    [s.substitutability,5],[s.recyclability,5],[s.extraction,5],
    [s.projects,5],[s.importDep,5],[s.strategic,5],[s.volatility,5]
  ];
  return (dims.reduce((sum,[v,max]) => sum + Math.min((v||0)/max,1), 0) / dims.length) * 10;
}

function getRiskIndex(mineral) { return computeRiskIndex(mineral); }

/* ── Navigation ────────────────────────────────────────── */

function navigate(page) {
  AppState.currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  if (page === 'overview') renderOverview();
  if (page === 'explorer') renderExplorer();
  if (page === 'criteria') renderCriteria();
  if (page === 'compare')  renderComparePage();
  if (page === 'builder')  renderBuilderPage();
  if (page === 'mineral')  renderMineralPage(window.MINERALS.find(m => m.name === AppState.selectedMineral));
  if (AppState.radarChartMineral && page !== 'mineral') {
    AppState.radarChartMineral.destroy();
    AppState.radarChartMineral = null;
  }
}

/* ── Ranked Bar Chart ──────────────────────────────────── */

function renderRankedChart() {
  const container = document.getElementById('ranked-chart');
  if (!container) return;
  const sorted = [...window.MINERALS].sort((a, b) => b.scores.importDep - a.scores.importDep);
  container.innerHTML = sorted.map(mineral => {
    const pct = (mineral.scores.importDep / 5) * 100;
    const cc  = chinaColor(mineral.meta.chinaShare);
    return `
      <div class="rank-row" data-mineral="${mineral.name}" role="button" tabindex="0">
        <div class="rank-name" title="${mineral.name}">${mineral.name}</div>
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${pct}%;background:${cc}"></div>
        </div>
        <div class="rank-score" style="color:${cc}">${mineral.scores.importDep}/5</div>
      </div>`;
  }).join('');
  container.querySelectorAll('.rank-row').forEach(row => {
    row.addEventListener('click', () => openMineralPage(row.dataset.mineral));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openMineralPage(row.dataset.mineral); });
  });
}

/* ── Bubble Chart (SVG) ────────────────────────────────── */

function renderBubbleChart() {
  const svg = document.getElementById('bubble-chart-svg');
  if (!svg) return;
  const W = svg.parentElement.clientWidth || 700;
  const H = 420;
  const M = { top: 30, right: 50, bottom: 60, left: 60 };
  const PW = W - M.left - M.right;
  const PH = H - M.top - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);

  const xS = v => M.left + ((v - 1) / 4) * PW;
  const yS = v => M.top  + PH - ((v - 1) / 4) * PH;

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#f6f8fa"/>`;

  // Grid lines + ticks
  for (let i = 1; i <= 5; i++) {
    html += `<line x1="${xS(i)}" y1="${M.top}" x2="${xS(i)}" y2="${M.top+PH}" class="bubble-grid-line"/>`;
    html += `<line x1="${M.left}" y1="${yS(i)}" x2="${M.left+PW}" y2="${yS(i)}" class="bubble-grid-line"/>`;
    html += `<text class="bubble-axis-label" x="${xS(i)}" y="${M.top+PH+16}" text-anchor="middle">${i}</text>`;
    html += `<text class="bubble-axis-label" x="${M.left-8}" y="${yS(i)+4}" text-anchor="end">${i}</text>`;
  }
  // Axis lines
  html += `<line x1="${M.left}" y1="${M.top}" x2="${M.left}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1"/>`;
  html += `<line x1="${M.left}" y1="${M.top+PH}" x2="${M.left+PW}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1"/>`;
  // Axis titles
  html += `<text class="bubble-axis-label" x="${M.left+PW/2}" y="${H-8}" text-anchor="middle" font-size="10">← Less Concentrated | Supply Concentration | More Concentrated →</text>`;
  html += `<text class="bubble-axis-label" x="14" y="${M.top+PH/2}" text-anchor="middle" font-size="10" transform="rotate(-90,14,${M.top+PH/2})">Demand Growth</text>`;

  // Bubbles
  window.MINERALS.forEach((m, idx) => {
    const sc    = m.scores;
    const xVal  = (sc.miningDiv + sc.refiningDiv) / 2 + ((idx * 7919 % 11) - 5) * 0.04;
    const yVal  = sc.growth + ((idx * 6271 % 11) - 5) * 0.04;
    const size  = Math.max(12, Math.min(40, Math.log10((m.meta.annualDemandTons || 1) + 1) * 9));
    const color = chinaColor(m.meta.chinaShare);
    const cx    = xS(clamp(xVal, 1, 5));
    const cy    = yS(clamp(yVal, 1, 5));

    html += `<g class="bubble" data-mineral="${m.name}">`;
    html += `<circle cx="${cx}" cy="${cy}" r="${size}" fill="${color}" fill-opacity="0.6" stroke="${color}" stroke-width="1.5"/>`;
    // Label: symbol below circle if small, inside if large
    const labelY = size >= 18 ? cy + 4 : cy + size + 12;
    html += `<text x="${cx}" y="${labelY}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="rgba(31,35,40,0.85)" font-weight="600">${m.symbol}</text>`;
    html += `</g>`;
  });

  svg.innerHTML = html;

  svg.querySelectorAll('.bubble').forEach(el => {
    el.addEventListener('mouseenter', e => showBubbleTooltip(e, el.dataset.mineral));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
  });
}

/* ── Geopolitical 2×2 Chart ────────────────────────────── */

function renderGeopoliticalChart() {
  const svg = document.getElementById('geopolitical-svg');
  if (!svg) return;
  const W = svg.parentElement.clientWidth || 700;
  const H = 400;
  const M = { top: 30, right: 50, bottom: 60, left: 60 };
  const PW = W - M.left - M.right;
  const PH = H - M.top - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);

  // X: chinaShare 0-100, Y: preparedness = 6 - strategic (higher = better prepared, range ~3-5)
  const xS = v => M.left + (v / 100) * PW;
  const yS = p => M.top  + PH - ((p - 1) / 4) * PH;

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#f6f8fa"/>`;

  // Q4 background (critical: high china, low prep = low y on our scale)
  const qDivX = xS(50);
  const qDivY = yS(3);
  // Critical zone Q4: right + bottom
  html += `<rect x="${qDivX}" y="${qDivY}" width="${M.left+PW-qDivX}" height="${M.top+PH-qDivY}" fill="rgba(207,34,46,0.05)"/>`;

  // Quadrant dividers
  html += `<line x1="${qDivX}" y1="${M.top}" x2="${qDivX}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.12)" stroke-width="1" stroke-dasharray="5,4"/>`;
  html += `<line x1="${M.left}" y1="${qDivY}" x2="${M.left+PW}" y2="${qDivY}" stroke="rgba(31,35,40,0.12)" stroke-width="1" stroke-dasharray="5,4"/>`;

  // Quadrant labels
  html += `<text x="${M.left+14}" y="${M.top+18}" font-size="9" fill="rgba(63,185,80,0.5)" font-family="Inter,sans-serif" font-weight="600">MANAGEABLE</text>`;
  html += `<text x="${qDivX+8}" y="${M.top+18}" font-size="9" fill="rgba(210,153,34,0.5)" font-family="Inter,sans-serif" font-weight="600">ACTIVE RISK</text>`;
  html += `<text x="${M.left+14}" y="${qDivY-8}" font-size="9" fill="rgba(227,105,58,0.5)" font-family="Inter,sans-serif" font-weight="600">WATCH LIST</text>`;
  html += `<text x="${qDivX+8}" y="${qDivY-8}" font-size="9" fill="rgba(248,81,73,0.75)" font-family="Inter,sans-serif" font-weight="700">CRITICAL EXPOSURE</text>`;

  // Grid lines x
  [0,25,50,75,100].forEach(v => {
    html += `<line x1="${xS(v)}" y1="${M.top}" x2="${xS(v)}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.06)" stroke-width="1"/>`;
    html += `<text class="bubble-axis-label" x="${xS(v)}" y="${M.top+PH+16}" text-anchor="middle">${v}%</text>`;
  });
  // Grid lines y
  [1,2,3,4,5].forEach(p => {
    html += `<line x1="${M.left}" y1="${yS(p)}" x2="${M.left+PW}" y2="${yS(p)}" stroke="rgba(31,35,40,0.06)" stroke-width="1"/>`;
  });
  // Axis lines
  html += `<line x1="${M.left}" y1="${M.top}" x2="${M.left}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1"/>`;
  html += `<line x1="${M.left}" y1="${M.top+PH}" x2="${M.left+PW}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1"/>`;
  // Axis titles
  html += `<text class="bubble-axis-label" x="${M.left+PW/2}" y="${H-8}" text-anchor="middle" font-size="10">China Supply Dominance (%)</text>`;
  html += `<text class="bubble-axis-label" x="14" y="${M.top+PH/2}" text-anchor="middle" font-size="10" transform="rotate(-90,14,${M.top+PH/2})">India Preparedness →</text>`;

  // Dots
  window.MINERALS.forEach((m, idx) => {
    const preparedness = clamp(6 - m.scores.strategic, 1, 5);
    const xVal = m.meta.chinaShare + ((idx * 6271 % 7) - 3) * 0.5;
    const yVal = preparedness + ((idx * 7919 % 7) - 3) * 0.03;
    const cx  = xS(clamp(xVal, 0, 100));
    const cy  = yS(clamp(yVal, 1, 5));
    const col = chinaColor(m.meta.chinaShare);

    html += `<g class="bubble" data-mineral="${m.name}">`;
    html += `<circle cx="${cx}" cy="${cy}" r="8" fill="${col}" fill-opacity="0.7" stroke="${col}" stroke-width="1.5"/>`;
    html += `<text x="${cx}" y="${cy+3.5}" text-anchor="middle" font-size="8" font-family="Inter,sans-serif" fill="white" font-weight="700">${m.symbol}</text>`;
    html += `</g>`;
  });

  svg.innerHTML = html;

  svg.querySelectorAll('.bubble').forEach(el => {
    el.addEventListener('mouseenter', e => showGeoTooltip(e, el.dataset.mineral));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
  });
}

/* ── Chart Builder ─────────────────────────────────────── */

function initChartBuilder() {
  const xSel  = document.getElementById('cb-x-axis');
  const ySel  = document.getElementById('cb-y-axis');
  if (!xSel || !ySel) return;

  if (!xSel.options.length) {
    CB_AXES.forEach(ax => {
      xSel.add(new Option(ax.label, ax.key));
      ySel.add(new Option(ax.label, ax.key));
    });
  }
  xSel.value = CBState.xKey;
  ySel.value = CBState.yKey;
  document.getElementById('cb-color-by').value  = CBState.colorBy;
  document.getElementById('cb-size-by').value   = CBState.sizeBy;
  document.getElementById('cb-sector-filter').value = CBState.sector;

  const onChange = () => {
    CBState.xKey    = document.getElementById('cb-x-axis').value;
    CBState.yKey    = document.getElementById('cb-y-axis').value;
    CBState.colorBy = document.getElementById('cb-color-by').value;
    CBState.sizeBy  = document.getElementById('cb-size-by').value;
    CBState.sector  = document.getElementById('cb-sector-filter').value;
    updateCBSizeVisibility();
    renderCBChart();
  };

  ['cb-x-axis','cb-y-axis','cb-color-by','cb-size-by','cb-sector-filter'].forEach(id => {
    document.getElementById(id).addEventListener('change', onChange);
  });

  document.querySelectorAll('.cb-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cb-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CBState.type = btn.dataset.type;
      updateCBSizeVisibility();
      renderCBChart();
    });
  });

  updateCBSizeVisibility();
  renderCBChart();
}

function updateCBSizeVisibility() {
  const wrap = document.getElementById('cb-size-wrap');
  const yWrap = document.getElementById('cb-y-wrap');
  if (wrap) wrap.style.display = CBState.type === 'bar' ? 'none' : '';
  if (yWrap) yWrap.style.display = CBState.type === 'bar' ? 'none' : '';
}

function renderCBChart() {
  const svg = document.getElementById('cb-chart-svg');
  if (!svg) return;

  let minerals = [...window.MINERALS];
  if (CBState.sector !== 'all') minerals = minerals.filter(m => m.meta.sectors.includes(CBState.sector));

  if (CBState.type === 'bar') {
    renderCBBar(svg, minerals);
  } else {
    renderCBScatter(svg, minerals, CBState.type === '2x2');
  }
}

function cbGetColor(m, colorBy) {
  if (colorBy === 'riskTier') return getRiskTier(getRiskIndex(m)).color;
  if (colorBy === 'chinaShare') return chinaColor(m.meta.chinaShare);
  if (colorBy === 'sector') return SECTOR_COLORS[m.meta.sectors[0]] || '#8c959f';
  return '#0969da';
}

function renderCBScatter(svg, minerals, is2x2) {
  const W = svg.parentElement.clientWidth || 800;
  const H = 440;
  const M = { top: 30, right: 40, bottom: 64, left: 64 };
  const PW = W - M.left - M.right;
  const PH = H - M.top  - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);

  const xAx = CB_AXES.find(a => a.key === CBState.xKey) || CB_AXES[0];
  const yAx = CB_AXES.find(a => a.key === CBState.yKey) || CB_AXES[1];

  const xVals = minerals.map(m => xAx.getValue(m));
  const yVals = minerals.map(m => yAx.getValue(m));
  const xMin = Math.min(...xVals, xAx.min);
  const xMax = Math.max(...xVals, xAx.max);
  const yMin = Math.min(...yVals, yAx.min);
  const yMax = Math.max(...yVals, yAx.max);
  const xPad = (xMax - xMin) * 0.06;
  const yPad = (yMax - yMin) * 0.06;

  const xS = v => M.left + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * PW;
  const yS = v => M.top  + PH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * PH;

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#f6f8fa" rx="8"/>`;

  // Grid
  const xTicks = 5, yTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const v = xMin + (i / xTicks) * (xMax - xMin);
    const x = xS(v);
    html += `<line x1="${x}" y1="${M.top}" x2="${x}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.07)" stroke-width="1"/>`;
    html += `<text x="${x}" y="${M.top+PH+18}" text-anchor="middle" font-size="9" fill="#8c959f" font-family="Inter,sans-serif">${v.toFixed(v < 10 ? 1 : 0)}</text>`;
  }
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (i / yTicks) * (yMax - yMin);
    const y = yS(v);
    html += `<line x1="${M.left}" y1="${y}" x2="${M.left+PW}" y2="${y}" stroke="rgba(31,35,40,0.07)" stroke-width="1"/>`;
    html += `<text x="${M.left-8}" y="${y+3.5}" text-anchor="end" font-size="9" fill="#8c959f" font-family="Inter,sans-serif">${v.toFixed(v < 10 ? 1 : 0)}</text>`;
  }

  // Axis lines
  html += `<line x1="${M.left}" y1="${M.top}" x2="${M.left}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1.5"/>`;
  html += `<line x1="${M.left}" y1="${M.top+PH}" x2="${M.left+PW}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.18)" stroke-width="1.5"/>`;

  // 2x2 quadrant lines
  if (is2x2) {
    const midX = (xMin + xMax) / 2;
    const midY = (yMin + yMax) / 2;
    html += `<line x1="${xS(midX)}" y1="${M.top}" x2="${xS(midX)}" y2="${M.top+PH}" stroke="rgba(31,35,40,0.15)" stroke-width="1" stroke-dasharray="6,4"/>`;
    html += `<line x1="${M.left}" y1="${yS(midY)}" x2="${M.left+PW}" y2="${yS(midY)}" stroke="rgba(31,35,40,0.15)" stroke-width="1" stroke-dasharray="6,4"/>`;
  }

  // Axis labels
  html += `<text x="${M.left+PW/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="#57606a" font-family="Inter,sans-serif" font-weight="500">${xAx.label}</text>`;
  html += `<text x="14" y="${M.top+PH/2}" text-anchor="middle" font-size="11" fill="#57606a" font-family="Inter,sans-serif" font-weight="500" transform="rotate(-90,14,${M.top+PH/2})">${yAx.label}</text>`;

  // Dots
  minerals.forEach((m, idx) => {
    const xVal = xAx.getValue(m);
    const yVal = yAx.getValue(m);
    const cx   = xS(xVal);
    const cy   = yS(yVal);
    const col  = cbGetColor(m, CBState.colorBy);

    let r = 8;
    if (CBState.sizeBy === 'demand') {
      r = Math.max(6, Math.min(16, Math.log10((m.annualDemandTons||1)+1) * 3.2));
    } else if (CBState.sizeBy === 'riskIndex') {
      r = Math.max(6, Math.min(16, getRiskIndex(m) * 1.4));
    }

    html += `<g class="cb-dot" data-mineral="${m.name}">`;
    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" fill-opacity="0.75" stroke="${col}" stroke-width="1.5" stroke-opacity="0.9"/>`;
    html += `<text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="${r >= 9 ? 7 : 6}" font-family="Inter,sans-serif" fill="white" font-weight="700" pointer-events="none">${m.symbol}</text>`;
    html += `</g>`;
  });

  svg.innerHTML = html;

  svg.querySelectorAll('.cb-dot').forEach(el => {
    el.addEventListener('mouseenter', e => showCBTooltip(e, el.dataset.mineral, xAx, yAx));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
    el.style.cursor = 'pointer';
  });
}

function renderCBBar(svg, minerals) {
  const xAx = CB_AXES.find(a => a.key === CBState.xKey) || CB_AXES[0];
  const sorted = [...minerals].sort((a, b) => xAx.getValue(b) - xAx.getValue(a));

  const rowH = 22;
  const nameW = 110;
  const valW = 44;
  const M = { top: 16, right: valW + 8, bottom: 24, left: nameW };
  const W = svg.parentElement.clientWidth || 800;
  const H = M.top + sorted.length * rowH + M.bottom;
  const PW = W - M.left - M.right;
  const maxVal = Math.max(...sorted.map(m => xAx.getValue(m)));

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', Math.min(H, 480));
  svg.style.overflowY = 'auto';

  let html2 = `<rect x="0" y="0" width="${W}" height="${H}" fill="#f6f8fa"/>`;
  html2 += `<text x="${M.left + PW/2}" y="${H-6}" text-anchor="middle" font-size="10" fill="#57606a" font-family="Inter,sans-serif">${xAx.label}</text>`;

  sorted.forEach((m, i) => {
    const val  = xAx.getValue(m);
    const barW = (val / maxVal) * PW;
    const y    = M.top + i * rowH;
    const col  = cbGetColor(m, CBState.colorBy);
    if (i % 2 === 0) html2 += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="rgba(31,35,40,0.025)" rx="0"/>`;
    html2 += `<g class="cb-dot" data-mineral="${m.name}">`;
    html2 += `<rect x="${M.left}" y="${y+4}" width="${Math.max(2,barW)}" height="${rowH-8}" fill="${col}" fill-opacity="0.8" rx="3"/>`;
    html2 += `<text x="${M.left-6}" y="${y+rowH/2+4}" text-anchor="end" font-size="9.5" fill="#1f2328" font-family="Inter,sans-serif" font-weight="500">${m.name}</text>`;
    html2 += `<text x="${M.left + Math.max(2,barW) + 5}" y="${y+rowH/2+4}" font-size="9.5" fill="${col}" font-family="Inter,sans-serif" font-weight="700">${val.toFixed(1)}</text>`;
    html2 += `</g>`;
  });

  svg.innerHTML = html2;

  svg.querySelectorAll('.cb-dot').forEach(el => {
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
    el.addEventListener('mouseenter', e => showCBBarTooltip(e, el.dataset.mineral, xAx));
    el.addEventListener('mouseleave', hideTooltip);
    el.style.cursor = 'pointer';
  });
}

function showCBTooltip(e, name, xAx, yAx) {
  const m = window.MINERALS.find(x => x.name === name);
  if (!m) return;
  document.getElementById('tooltip').innerHTML = `
    <div class="tooltip-name">${m.name} <span style="font-weight:400;color:var(--text-muted)">${m.symbol}</span></div>
    <div class="tooltip-row"><span>${xAx.label.split('(')[0].trim()}</span><span>${xAx.getValue(m).toFixed(2)}</span></div>
    <div class="tooltip-row"><span>${yAx.label.split('(')[0].trim()}</span><span>${yAx.getValue(m).toFixed(2)}</span></div>
    <div class="tooltip-row"><span>China Share</span><span style="color:${chinaColor(m.meta.chinaShare)}">${m.meta.chinaShare}%</span></div>`;
  positionTooltip(e);
  document.getElementById('tooltip').classList.add('visible');
}

function showCBBarTooltip(e, name, xAx) {
  const m = window.MINERALS.find(x => x.name === name);
  if (!m) return;
  document.getElementById('tooltip').innerHTML = `
    <div class="tooltip-name">${m.name}</div>
    <div class="tooltip-row"><span>${xAx.label.split('(')[0].trim()}</span><span>${xAx.getValue(m).toFixed(2)}</span></div>
    <div class="tooltip-row"><span>China Share</span><span style="color:${chinaColor(m.meta.chinaShare)}">${m.meta.chinaShare}%</span></div>`;
  positionTooltip(e);
  document.getElementById('tooltip').classList.add('visible');
}

/* ── Tooltip helpers ───────────────────────────────────── */

function showBubbleTooltip(e, name) {
  const m = window.MINERALS.find(x => x.name === name);
  if (!m) return;
  const conc = ((m.scores.miningDiv + m.scores.refiningDiv) / 2).toFixed(1);
  document.getElementById('tooltip').innerHTML = `
    <div class="tooltip-name">${m.name} <span style="font-weight:400;color:var(--text-muted);font-family:monospace">${m.symbol}</span></div>
    <div class="tooltip-row"><span>China Share</span><span style="color:${chinaColor(m.meta.chinaShare)}">${m.meta.chinaShare}%</span></div>
    <div class="tooltip-row"><span>Demand Growth</span><span>${m.scores.growth}/5</span></div>
    <div class="tooltip-row"><span>Supply Conc.</span><span>${conc}/5</span></div>
    <div class="tooltip-row"><span>Annual Demand</span><span>${m.meta.annualDemand}</span></div>`;
  positionTooltip(e);
  document.getElementById('tooltip').classList.add('visible');
}

function showGeoTooltip(e, name) {
  const m = window.MINERALS.find(x => x.name === name);
  if (!m) return;
  const prep = clamp(6 - m.scores.strategic, 1, 5);
  const prepLabel = ['','Very Prepared','Prepared','Moderate','Low','Very Low'][prep] || prep;
  document.getElementById('tooltip').innerHTML = `
    <div class="tooltip-name">${m.name} <span style="font-weight:400;color:var(--text-muted);font-family:monospace">${m.symbol}</span></div>
    <div class="tooltip-row"><span>China Share</span><span style="color:${chinaColor(m.meta.chinaShare)}">${m.meta.chinaShare}%</span></div>
    <div class="tooltip-row"><span>Import Dependence</span><span>${m.scores.importDep}/5</span></div>
    <div class="tooltip-row"><span>India Preparedness</span><span>${prepLabel}</span></div>`;
  positionTooltip(e);
  document.getElementById('tooltip').classList.add('visible');
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

function positionTooltip(e) {
  const tt  = document.getElementById('tooltip');
  const x   = e.clientX + 14;
  const y   = e.clientY - 10;
  const ttW = 260;
  const ttH = 130;
  tt.style.left = (x + ttW > window.innerWidth  ? e.clientX - ttW - 14 : x) + 'px';
  tt.style.top  = (y + ttH > window.innerHeight ? e.clientY - ttH - 10 : y) + 'px';
}

/* ── Overview ──────────────────────────────────────────── */

function renderOverview() {}

/* ── Explorer ──────────────────────────────────────────── */

function renderExplorer() {
  renderMineralGrid();
  initFilterChips();
  initExplorerSort();
  renderSectorMatrix();
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
  if (AppState.activeSector !== 'all') {
    list = list.filter(m => m.meta.sectors.includes(AppState.activeSector));
  }
  switch (AppState.explorerSort) {
    case 'growth':    list.sort((a, b) => b.scores.growth - a.scores.growth); break;
    case 'china':     list.sort((a, b) => b.meta.chinaShare - a.meta.chinaShare); break;
    case 'importDep': list.sort((a, b) => b.scores.importDep - a.scores.importDep); break;
  }
  return list;
}

function renderMineralGrid() {
  const grid = document.getElementById('minerals-grid');
  if (!grid) return;
  const minerals = filterAndSortMinerals();
  if (!minerals.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-text">No minerals for this filter</div></div>`;
    return;
  }
  grid.innerHTML = minerals.map(m => buildMineralCard(m)).join('');
  grid.querySelectorAll('.mineral-card').forEach(card => {
    const name = card.dataset.mineral;
    const m    = window.MINERALS.find(x => x.name === name);
    if (m) {
      drawMiniRadar(card.querySelector('.mini-radar'), m.scores);
      card.addEventListener('click', () => openMineralPage(name));
    }
  });
}

function buildMineralCard(mineral) {
  const cc = chinaColor(mineral.meta.chinaShare);
  return `
    <div class="mineral-card" data-mineral="${mineral.name}" role="button" tabindex="0">
      <div class="card-header">
        <div>
          <div class="card-name">${mineral.name}</div>
          <div class="card-symbol">${mineral.symbol}</div>
        </div>
        <div class="card-china-badge" style="color:${cc}">
          <div class="card-china-pct">${mineral.meta.chinaShare}%</div>
          <div class="card-china-lbl">China</div>
        </div>
      </div>
      <canvas class="mini-radar" width="120" height="120"></canvas>
      <div class="sector-chips">
        ${mineral.meta.sectors.slice(0,4).map(s => `<span class="sector-chip ${s}">${s}</span>`).join('')}
      </div>
      <div class="china-bar-wrap">
        <span class="china-bar-label">China Supply</span>
        <div class="china-bar-track"><div class="china-bar-fill" style="width:${mineral.meta.chinaShare}%;background:${cc}"></div></div>
        <span class="china-val" style="color:${cc}">${mineral.meta.chinaShare}%</span>
      </div>
      <div class="card-stats-row">
        <div class="card-stat">
          <span class="card-stat-label">Demand</span>
          <span class="card-stat-val">${mineral.meta.annualDemand}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">Top Supplier</span>
          <span class="card-stat-val" title="${mineral.meta.topSupplier}">${mineral.meta.topSupplier.split('(')[0].trim()}</span>
        </div>
      </div>
    </div>`;
}

/* ── Mini Radar (pure canvas, 14 axes) ─────────────────── */

function drawMiniRadar(canvas, scores) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx  = canvas.width / 2;
  const cy  = canvas.height / 2;
  const r   = Math.min(cx, cy) - 16;
  const n   = window.RADAR_14.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const rr    = (ring / 5) * r;
      const x = cx + rr * Math.cos(angle);
      const y = cy + rr * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(98,13,60,0.08)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(98,13,60,0.06)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  window.RADAR_14.forEach((dim, i) => {
    const val   = normalize14(scores[dim.key] || 0, dim.max);
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr    = (val / 5) * r;
    const x = cx + rr * Math.cos(angle);
    const y = cy + rr * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle   = 'rgba(98,13,60,0.10)';
  ctx.fill();
  ctx.strokeStyle = '#620d3c';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}

/* ── Sector Dependency Matrix ──────────────────────────── */

function renderSectorMatrix() {
  const container = document.getElementById('sector-matrix-content');
  if (!container) return;

  container.innerHTML = window.ALL_SECTORS.map(sector => {
    const minerals = window.MINERALS
      .filter(m => m.meta.sectors.includes(sector))
      .sort((a, b) => b.meta.chinaShare - a.meta.chinaShare);

    const chips = minerals.map(m => {
      const cc = chinaColor(m.meta.chinaShare);
      return `<span class="sector-mineral-chip" data-mineral="${m.name}" title="${m.name} — China: ${m.meta.chinaShare}%" style="border-color:${cc}30;color:${cc}">${m.symbol}</span>`;
    }).join('');

    const color = SECTOR_COLORS[sector] || '#848d97';
    return `
      <div class="sector-row">
        <div class="sector-row-label">
          <div class="sector-dot" style="background:${color}"></div>
          ${sector.charAt(0).toUpperCase() + sector.slice(1)}
        </div>
        <div class="sector-mineral-chips">${chips}</div>
      </div>`;
  }).join('');

  container.querySelectorAll('.sector-mineral-chip').forEach(chip => {
    chip.addEventListener('click', () => openMineralPage(chip.dataset.mineral));
  });
}

/* ── Mineral Page ──────────────────────────────────────── */

function openMineralPage(name) {
  AppState.selectedMineral = name;
  navigate('mineral');
}

// Strip trailing PDF score artifacts from justification text
// e.g. "annually.3", "growth. 3 4 7", "China46.5", "supply.3 4"
function cleanJust(text) {
  if (!text) return '';
  return text
    .replace(/\s+\d+(\s+\d+)*\s*$/g, '')   // trailing digit sequences like " 3 4 7"
    .replace(/(\.)(\d+(\s+\d+)*)\s*$/g, '$1') // "annually.3" or "annually.3 4"
    .replace(/([a-zA-Z])(\d+\.?\d*)\s*$/g, '$1') // "China46.5" style
    .trim();
}

const MP_GROUPS = [
  { title: 'Demand Dynamics',     dims: ['demand', 'growth'],                 groups: ['demand', 'growth'] },
  { title: 'Supply Chain',        dims: ['miningDiv', 'refiningDiv'],          groups: ['diversity'] },
  { title: 'Reserves',            dims: ['resTime', 'resDiv'],                 groups: ['reserves'] },
  { title: 'End-Use Criticality', dims: ['endUseComp'],                        groups: ['enduse'] },
  { title: 'Substitutability',    dims: ['substitutability', 'recyclability'], groups: ['subst'] },
  { title: 'Processing',          dims: ['extraction'],                        groups: ['extraction'] },
  { title: 'Pipeline',            dims: ['projects'],                          groups: ['projects'] },
  { title: "India's Position",    dims: ['importDep', 'strategic'],            groups: ['india'] },
  { title: 'Price Volatility',    dims: ['volatility'],                        groups: ['volatility'] },
];

function renderMineralPage(mineral) {
  if (!mineral) return;

  // Header
  document.getElementById('mp-symbol').textContent  = mineral.symbol;
  document.getElementById('mp-name').textContent    = mineral.name;
  document.getElementById('mp-sub').textContent     = mineral.meta.annualDemand + ' · Top supplier: ' + mineral.meta.topSupplier;
  document.getElementById('mp-sectors').innerHTML   =
    mineral.meta.sectors.map(s => `<span class="sector-chip ${s}">${s}</span>`).join('');

  // Facts card
  const cc = chinaColor(mineral.meta.chinaShare);
  document.getElementById('mp-china').textContent    = mineral.meta.chinaShare + '%';
  document.getElementById('mp-china').style.color    = cc;
  document.getElementById('mp-narrative').textContent = mineral.meta.keyFact;

  // Add-to-compare button
  document.getElementById('mp-add-compare').onclick = () => addToCompare(mineral.name);

  // Radar chart
  if (AppState.radarChartMineral) {
    AppState.radarChartMineral.destroy();
    AppState.radarChartMineral = null;
  }
  const ctx    = document.getElementById('mp-radar-canvas').getContext('2d');
  const values = get14Values(mineral);
  AppState.radarChartMineral = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: RADAR_LABELS,
      datasets: [{
        label: mineral.name,
        data: values,
        backgroundColor: hexToRgba(cc, 0.12),
        borderColor: cc,
        borderWidth: 1.5,
        pointBackgroundColor: cc,
        pointRadius: 2.5,
        pointHoverRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { display: false, stepSize: 1 },
          grid: { color: 'rgba(98,13,60,0.08)', lineWidth: 1 },
          pointLabels: { color: '#6b4020', font: { size: 9, family: 'Inter' } },
          angleLines: { color: 'rgba(98,13,60,0.06)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#ffffff', titleColor: '#1a0804',
          bodyColor: '#6b4020', borderColor: '#e4d49c', borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.raw.toFixed(2)} / 5` }
        }
      }
    }
  });

  // Scorecard
  const scorecard = document.getElementById('mp-scorecard');
  if (!scorecard) return;
  const s = mineral.scores;

  renderPolicyPane(mineral);

  scorecard.innerHTML = MP_GROUPS.map(grp => {
    const justs = (grp.groups || [grp.group || '']).map(g =>
      cleanJust((window.MINERAL_JUSTIFICATIONS?.[mineral.name]?.[g]) || '')
    ).filter(Boolean);
    const justFull = justs.join(' ');

    const dimRows = grp.dims.map(key => {
      const dim = window.RADAR_14.find(d => d.key === key);
      if (!dim) return '';
      const val      = s[key] || 0;
      const pct      = (val / dim.max) * 100;
      const t        = val / dim.max;
      const barColor = `hsl(${(120 - t * 120).toFixed(0)},65%,50%)`;
      const rubric   = RUBRIC_DEFS.find(r => r.key === key);
      let rubricLine = '';
      if (rubric) {
        const numVal = parseFloat(val);
        let best = rubric.rows[rubric.rows.length - 1];
        for (const row of rubric.rows) {
          if (!isNaN(parseFloat(row[0])) && numVal <= parseFloat(row[0]) + 0.5) { best = row; break; }
        }
        if (best) rubricLine = `<span class="mp-rubric-hint">${best[1]}</span>`;
      }
      return `
        <div class="mp-dim-row">
          <div class="mp-dim-label">${dim.label}</div>
          <div class="mp-dim-bar-wrap">
            <div class="mp-dim-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
          <div class="mp-dim-score" style="color:${barColor}">${val}<span class="mp-dim-max">/${dim.max}</span></div>
          ${rubricLine}
        </div>`;
    }).join('');

    return `
      <div class="mp-group">
        <div class="mp-group-title">${grp.title}</div>
        ${dimRows}
        ${justFull ? `<div class="mp-just-text">${justFull}</div>` : ''}
      </div>`;
  }).join('');
}

function renderPolicyPane(mineral) {
  const pane = document.getElementById('mp-policy');
  if (!pane) return;

  const levers = [
    {
      tag:   'Supply Security',
      title: 'Strategic Partner & Import Diversification',
      desc:  `Bilateral agreements and import diversification strategies to reduce concentration risk for ${mineral.name}. Frameworks with resource-rich partner nations are yet to be defined.`,
    },
    {
      tag:   'Domestic Development',
      title: 'Exploration, Mining & Processing Investment',
      desc:  `Domestic deposit identification and mining promotion policies specific to ${mineral.name} supply chains. Investment frameworks and production targets are pending formulation.`,
    },
    {
      tag:   'Demand Management',
      title: 'Efficiency Standards & Substitution R&D',
      desc:  `Efficiency standards and substitution research programmes to moderate ${mineral.name} demand intensity. Technology roadmaps and subsidy structures are under deliberation.`,
    },
    {
      tag:   'Stockpiling',
      title: 'Strategic Reserve & Buffer Stock Policy',
      desc:  `National strategic stockpile targets and buffer stock norms for ${mineral.name}. Reserve levels, financing mechanisms, and release protocols are to be defined.`,
    },
    {
      tag:   'Circularity',
      title: 'Recycling Infrastructure & EPR Norms',
      desc:  `Extended producer responsibility rules and end-of-life recovery systems to improve ${mineral.name} circularity. Collection targets and processing standards are not yet specified.`,
    },
  ];

  pane.innerHTML = `
    <div class="mp-policy-header">
      <span class="mp-card-title">Policy Alternatives</span>
      <span class="mp-tbc-global">All entries TBC — indicative only</span>
    </div>
    <div class="mp-policy-grid">
      ${levers.map(l => `
        <div class="mp-policy-card">
          <div class="mp-policy-top">
            <span class="mp-policy-tag">${l.tag}</span>
            <span class="mp-tbc-badge">TBC</span>
          </div>
          <div class="mp-policy-title">${l.title}</div>
          <div class="mp-policy-desc">${l.desc}</div>
        </div>`).join('')}
    </div>`;
}

function addToCompare(name) {
  const sel = ['a','b','c'];
  let placed = false;
  for (const k of sel) {
    if (!AppState.compareSelections[k]) { AppState.compareSelections[k] = name; placed = true; break; }
  }
  if (!placed) AppState.compareSelections.c = name;
  navigate('compare');
}

/* ── Criteria Page ─────────────────────────────────────── */

const CRITERIA_DEFS = [
  { n:1,  name: 'Current Global Demand',      desc: 'Scale of existing consumption across all end uses.',     anchor: 'demand' },
  { n:2,  name: 'Projected Demand Growth',    desc: 'Trajectory of demand to 2030, driven by energy transition and tech.', anchor: 'growth' },
  { n:3,  name: 'Supply Diversity',           desc: 'Geographic concentration of mining and refining operations.', anchor: 'miningDiv' },
  { n:4,  name: 'Reserves & Resources',       desc: 'Reserve lifetime risk and geographic spread of known deposits.', anchor: 'resTime' },
  { n:5,  name: 'End-Use Applications',       desc: 'Sectoral importance, number of critical sectors served, and substitution breadth.', anchor: 'endUseComp' },
  { n:6,  name: 'Substitutability',           desc: 'Technical difficulty of replacing the mineral in key applications.', anchor: 'substitutability' },
  { n:7,  name: 'Recyclability',              desc: 'Potential for circular supply and end-of-life recovery.', anchor: 'recyclability' },
  { n:8,  name: 'Extraction Complexity',      desc: 'Technical barrier to processing — from open-pit to nuclear-grade.', anchor: 'extraction' },
  { n:9,  name: "India's Position",           desc: "India's import dependence and strategic policy response quality.", anchor: 'importDep' },
  { n:10, name: 'Price Volatility',           desc: 'Market stability, historical swings, and weaponization risk.', anchor: 'volatility' },
];

const RUBRIC_DEFS = [
  {
    key: 'demand', title: 'Current Global Demand', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Negligible (≤500 t/yr)'],
      ['2', 'Modest (500–10,000 t/yr)'],
      ['3', 'Moderate (10k–100k t/yr)'],
      ['4', 'High (100k–1M t/yr)'],
      ['5', 'Extremely high (1M+ t/yr)'],
    ]
  },
  {
    key: 'growth', title: 'Demand Growth', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Declining or near-zero'],
      ['2', 'Flat / stagnant'],
      ['3', 'Low growth 1–5% CAGR'],
      ['4', 'Moderate 6–12% CAGR'],
      ['5', 'High growth 12%+ CAGR (EV-driven)'],
    ]
  },
  {
    key: 'miningDiv', title: 'Mining Concentration', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'No country >30%'],
      ['2', 'Largest producer 30–50%'],
      ['3', 'Largest producer 50–65%'],
      ['4', 'Largest producer 65–85%'],
      ['5', 'Largest producer >85%'],
    ]
  },
  {
    key: 'refiningDiv', title: 'Refining Concentration', subtitle: 'Scale 1–5 (same as mining)',
    rows: [
      ['1', 'No refiner >30%'],
      ['2', 'Largest refiner 30–50%'],
      ['3', 'Largest refiner 50–65%'],
      ['4', 'Largest refiner 65–85%'],
      ['5', 'Largest refiner >85%'],
    ]
  },
  {
    key: 'resTime', title: 'Reserve Lifetime Risk', subtitle: 'Scale 1–6',
    rows: [
      ['1', 'Limitless (100+ years)'],
      ['2', 'Abundant (50–100 years)'],
      ['3', 'Substantial (30–50 years)'],
      ['4', 'Significant (15–30 years)'],
      ['5', 'Limited (<15 years)'],
      ['6', 'Very limited + byproduct constraints'],
    ]
  },
  {
    key: 'resDiv', title: 'Reserve Diversity (HHI-based)', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'HHI <0.15 — highly distributed'],
      ['2', 'HHI 0.15–0.25'],
      ['3', 'HHI 0.25–0.40'],
      ['4', 'HHI 0.40–0.60'],
      ['5', 'HHI >0.60 — near-monopoly'],
    ]
  },
  {
    key: 'endUseComp', title: 'End-Use Scope', subtitle: 'Scale 0–10 (composite)',
    rows: [
      ['Sector pts', 'Defense/Energy/Agriculture = +1.5 each; Healthcare/Semiconductors/Electrification = +1 each; Construction = +0.5'],
      ['Breadth bonus', '+0.5 per additional sector beyond 1st (up to +3)'],
    ]
  },
  {
    key: 'substitutability', title: 'Substitution Risk', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Drop-in substitute in wide commercial use'],
      ['2', 'Substitutes with moderate trade-offs'],
      ['3', 'Substitutes with significant trade-offs'],
      ['4', 'Lab-proven only, no commercial scale'],
      ['5', 'No known substitute'],
    ]
  },
  {
    key: 'recyclability', title: 'Recycling Gap', subtitle: 'Scale 1–5',
    rows: [
      ['1', '>40% supply from secondary sources'],
      ['2', '20–40% secondary supply'],
      ['3', '5–20% secondary supply'],
      ['4', '<5% (technology exists but uneconomic)'],
      ['5', 'Effectively zero — technically impossible'],
    ]
  },
  {
    key: 'extraction', title: 'Processing Complexity', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Simple open-pit + physical separation'],
      ['2', 'Moderately complex multi-stage'],
      ['3', 'Complex, specialized hydromet/pyromet'],
      ['4', 'Highly complex, 10–15 facilities globally'],
      ['5', 'Nation-state level (nuclear-grade separation)'],
    ]
  },
  {
    key: 'projects', title: 'Pipeline Gap', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Strong — construction underway, 2–3 yr to production'],
      ['2', 'Adequate — feasibility done, 3–5 yr'],
      ['3', 'Thin — pre-feasibility stage, 5–7 yr'],
      ['4', 'Minimal — only exploratory work'],
      ['5', 'Structural constraint — no realistic new pathway'],
    ]
  },
  {
    key: 'importDep', title: 'India Import Dependence', subtitle: 'Scale 1–5',
    rows: [
      ['1', '≥60% domestic production'],
      ['2', '40–60% domestic'],
      ['3', '20–40% domestic'],
      ['4', '<20% domestic'],
      ['5', 'Zero domestic production'],
    ]
  },
  {
    key: 'strategic', title: 'India Strategic Posture', subtitle: 'Scale 1–5',
    rows: [
      ['1', 'Binding offtake agreements, equity stakes, operational JVs — active control of supply'],
      ['2', 'Advanced plans: exploration blocks awarded, KABIL mandates active, bilateral deals signed'],
      ['3', 'Moderate action: MOUs signed, customs duty exemptions, MMDR reforms, no equity stakes'],
      ['4', 'Early-stage: intent declared, one-off diplomatic mentions, no concrete program'],
      ['5', 'Passive or absent — no policy action, no diplomatic engagement, 100% spot-market dependent'],
    ]
  },
  {
    key: 'volatility', title: 'Price Volatility', subtitle: 'Scale 1–5',
    rows: [
      ['1', '±20% band, long-term contracts available'],
      ['2', '±20–50%, gradual moves'],
      ['3', '±50–100%, occasional spikes'],
      ['4', '>100% moves, thin market'],
      ['5', '>200% in short period, active export bans'],
    ]
  },
];

function renderCriteria() {
  renderCriteriaGrid();
  renderRubricAccordion();
  renderHeatmap();
}

function renderCriteriaGrid() {
  const container = document.getElementById('criteria-grid');
  if (!container || container.innerHTML.trim()) return;
  container.innerHTML = CRITERIA_DEFS.map(c => `
    <div class="criteria-card">
      <div class="criteria-num">${c.n}</div>
      <div class="criteria-info">
        <div class="criteria-name">${c.name}</div>
        <div class="criteria-desc">${c.desc}</div>
        <a class="criteria-link" href="#rubric-${c.anchor}">→ View rubric</a>
      </div>
    </div>`).join('');
}

function renderRubricAccordion() {
  const container = document.getElementById('rubric-accordion');
  if (!container || container.innerHTML.trim()) return;

  container.innerHTML = RUBRIC_DEFS.map(def => {
    const dim = window.DIMENSIONS[def.key];
    const max = dim ? dim.max : 5;

    // Find minerals with high and low scores
    const highMins = window.MINERALS.filter(m => (m.scores[def.key] || 0) >= (max * 0.7));
    const lowMins  = window.MINERALS.filter(m => (m.scores[def.key] || 0) <= (max * 0.35));

    const rubricRows = def.rows.map(([score, desc]) =>
      `<tr><td>${score}</td><td>${desc}</td></tr>`
    ).join('');

    const highChips = highMins.map(m =>
      `<span class="rubric-chip high-risk" data-mineral="${m.name}">${m.name} (${m.scores[def.key]})</span>`
    ).join('');
    const lowChips  = lowMins.map(m =>
      `<span class="rubric-chip low-risk" data-mineral="${m.name}">${m.name} (${m.scores[def.key]})</span>`
    ).join('');

    return `
      <div class="rubric-item" id="rubric-${def.key}">
        <div class="rubric-header" data-key="${def.key}">
          <span class="rubric-title">${def.title} <span style="color:var(--text-dim);font-weight:400;font-size:0.75rem">${def.subtitle}</span></span>
          <span class="rubric-toggle">▼</span>
        </div>
        <div class="rubric-body">
          <table class="rubric-table">
            <thead><tr><th>Score</th><th>Description</th></tr></thead>
            <tbody>${rubricRows}</tbody>
          </table>
          ${highChips ? `<div class="rubric-mineral-row"><div class="rubric-mineral-label">High risk (&ge;${(max*0.7).toFixed(1)}):</div><div class="rubric-chips">${highChips}</div></div>` : ''}
          ${lowChips  ? `<div class="rubric-mineral-row" style="margin-top:6px;"><div class="rubric-mineral-label">Low risk (&le;${(max*0.35).toFixed(1)}):</div><div class="rubric-chips">${lowChips}</div></div>` : ''}
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.rubric-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.rubric-item');
      item.classList.toggle('open');
    });
  });

  container.querySelectorAll('.rubric-chip').forEach(chip => {
    chip.addEventListener('click', () => openMineralPage(chip.dataset.mineral));
  });
}

/* ── Heatmap ───────────────────────────────────────────── */

function renderHeatmap() {
  const table = document.getElementById('heatmap-table');
  if (!table) return;

  const dims = window.RADAR_14;
  let minerals = AppState.heatmapSortDim
    ? [...window.MINERALS].sort((a, b) =>
        AppState.heatmapSortDir * ((b.scores[AppState.heatmapSortDim] || 0) - (a.scores[AppState.heatmapSortDim] || 0)))
    : [...window.MINERALS].sort((a, b) => b.meta.chinaShare - a.meta.chinaShare);

  // Short labels for column headers
  const shortLabels = {
    demand: 'Demand', growth: 'Growth', miningDiv: 'Mining', refiningDiv: 'Refining',
    resTime: 'Res.Life', resDiv: 'Res.Geo', endUseComp: 'End-Use', substitutability: 'Subst.',
    recyclability: 'Recycl.', extraction: 'Extract.', projects: 'Pipeline', importDep: 'Import',
    strategic: 'Strategic', volatility: 'Volatility'
  };

  const headerCells = dims.map(d => `
    <th class="sortable" data-dim="${d.key}" title="${window.DIMENSIONS[d.key]?.label}">
      <span class="col-label">${shortLabels[d.key] || d.key}</span>
    </th>`).join('');

  const bodyRows = minerals.map(m => {
    const cells = dims.map(d => {
      const val   = m.scores[d.key] || 0;
      const color = heatmapColor(val, d.max);
      return `<td><span class="hm-cell" style="background:${color}" data-mineral="${m.name}" data-dim="${d.key}" data-val="${val}" data-max="${d.max}" title="${m.name} · ${window.DIMENSIONS[d.key]?.label}: ${val}/${d.max}"></span></td>`;
    }).join('');
    return `<tr>
      <td data-mineral="${m.name}" style="cursor:pointer;">${m.name}</td>${cells}
    </tr>`;
  }).join('');

  table.innerHTML = `
    <thead><tr>
      <th style="min-width:100px;">Mineral</th>
      ${headerCells}
    </tr></thead>
    <tbody>${bodyRows}</tbody>`;

  // Column sort
  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const dim = th.dataset.dim;
      if (AppState.heatmapSortDim === dim) {
        AppState.heatmapSortDir *= -1;
      } else {
        AppState.heatmapSortDim = dim;
        AppState.heatmapSortDir = -1;
      }
      renderHeatmap();
    });
  });

  // Click mineral name → open mineral page
  table.querySelectorAll('td[data-mineral]').forEach(td => {
    if (!td.dataset.mineral) return;
    td.addEventListener('click', () => openMineralPage(td.dataset.mineral));
  });

  // Cell hover tooltip
  table.querySelectorAll('.hm-cell').forEach(cell => {
    cell.addEventListener('mouseenter', e => {
      const tt = document.getElementById('tooltip');
      tt.innerHTML = `<div class="tooltip-name">${cell.dataset.mineral}</div>
        <div class="tooltip-row"><span>${window.DIMENSIONS[cell.dataset.dim]?.label}</span><span>${cell.dataset.val} / ${cell.dataset.max}</span></div>`;
      positionTooltip(e);
      tt.classList.add('visible');
    });
    cell.addEventListener('mouseleave', hideTooltip);
    cell.addEventListener('click', () => openMineralPage(cell.dataset.mineral));
  });
}

/* ── Compare Page ──────────────────────────────────────── */

function renderComparePage() {
  initCompareSelects();
  updateCompareView();
}

function initCompareSelects() {
  ['a','b','c'].forEach(k => {
    const sel = document.getElementById(`compare-${k}`);
    if (!sel) return;
    if (sel.options.length <= 1) {
      window.MINERALS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.symbol})`;
        sel.appendChild(opt);
      });
    }
    if (AppState.compareSelections[k]) sel.value = AppState.compareSelections[k];
    sel.addEventListener('change', e => { AppState.compareSelections[k] = e.target.value; updateCompareView(); });
  });
}

function updateCompareView() {
  const { a, b, c } = AppState.compareSelections;
  const selected = [a,b,c].filter(Boolean).map(n => window.MINERALS.find(m => m.name === n)).filter(Boolean);
  const emptyEl   = document.getElementById('compare-empty');
  const contentEl = document.getElementById('compare-content');
  if (selected.length < 2) { emptyEl.classList.remove('hidden'); contentEl.classList.add('hidden'); return; }
  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
  renderCompareRadar(selected);
  renderCompareTable(selected);
  renderCompareSectors(selected);
}

function renderCompareRadar(minerals) {
  if (AppState.radarChartCompare) { AppState.radarChartCompare.destroy(); AppState.radarChartCompare = null; }
  const ctx    = document.getElementById('compare-radar-canvas').getContext('2d');
  const COLORS = ['#58a6ff','#f0a500','#3fb950'];

  const datasets = minerals.map((m, i) => ({
    label: m.name,
    data: get14Values(m),
    backgroundColor: hexToRgba(COLORS[i], 0.12),
    borderColor: COLORS[i],
    borderWidth: 1.5,
    pointBackgroundColor: COLORS[i],
    pointRadius: 2.5,
    pointHoverRadius: 4,
  }));

  AppState.radarChartCompare = new Chart(ctx, {
    type: 'radar',
    data: { labels: RADAR_LABELS, datasets },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { display: false, stepSize: 1 },
          grid: { color: 'rgba(98,13,60,0.08)', lineWidth: 1 },
          pointLabels: { color: '#6b4020', font: { size: 9, family: 'Inter' } },
          angleLines: { color: 'rgba(98,13,60,0.06)' }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#1a0804', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 14 }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1a0804',
          bodyColor: '#6b4020',
          borderColor: '#e4d49c',
          borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)} / 5` }
        }
      }
    }
  });
}

function renderCompareTable(minerals) {
  const table = document.getElementById('compare-table');
  const rows = [
    { label: 'China Share',     fn: m => m.meta.chinaShare + '%',                             higherWorse: true  },
    { label: 'Annual Demand',   fn: m => m.meta.annualDemand,                                 higherWorse: null  },
    { label: 'Top Supplier',    fn: m => m.meta.topSupplier,                                  higherWorse: null  },
    { label: 'Demand Growth',   fn: m => m.scores.growth + ' / 5',                            higherWorse: true  },
    { label: 'Supply Conc.',    fn: m => ((m.scores.miningDiv+m.scores.refiningDiv)/2).toFixed(1)+'/5', higherWorse: true },
    { label: 'India Import Dep',fn: m => m.scores.importDep + ' / 5',                         higherWorse: true  },
    { label: 'Substitution',    fn: m => m.scores.substitutability + ' / 5',                  higherWorse: true  },
    { label: 'Price Volatility',fn: m => m.scores.volatility + ' / 5',                        higherWorse: true  },
    { label: 'Reserve Life',    fn: m => m.scores.resTime + ' / 6',                           higherWorse: true  },
  ];

  const headerCells = ['Dimension', ...minerals.map(m => m.name)].map(h => `<th>${h}</th>`).join('');
  const bodyRows = rows.map(row => {
    const vals = minerals.map(m => row.fn(m));
    let bestIdx = -1, worstIdx = -1;
    if (row.higherWorse !== null) {
      const nums = vals.map(v => parseFloat(v));
      if (!nums.some(isNaN)) {
        worstIdx = nums.indexOf(Math.max(...nums));
        bestIdx  = nums.indexOf(Math.min(...nums));
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
  document.getElementById('compare-sectors').innerHTML = minerals.map(m => `
    <div class="overlap-mineral">
      <span class="overlap-name">${m.name}</span>
      <div class="sector-chips">${m.meta.sectors.map(s => `<span class="sector-chip ${s}">${s}</span>`).join('')}</div>
    </div>`).join('');
}

/* ── About Page ────────────────────────────────────────── */

function renderAboutPage() {
  const table = document.getElementById('about-dim-table');
  if (!table || table.innerHTML.trim()) return;
  table.innerHTML = `
    <thead><tr><th>Dimension</th><th>Scale</th><th>Higher Means</th></tr></thead>
    <tbody>
      ${Object.entries(window.DIMENSIONS).map(([k, d]) => `
        <tr>
          <td>${d.label}</td>
          <td style="white-space:nowrap;">${d.min}–${d.max}</td>
          <td>${d.higherMeans}</td>
        </tr>`).join('')}
    </tbody>`;
}

/* ── Builder Page State ────────────────────────────────── */
const BuilderState = {
  type:    'scatter',
  xKey:    'supplyConc',
  yKey:    'growth',
  colorBy: 'sector',
  search:  '',
  preset:  0,
};

const BUILDER_PRESETS = [
  {
    title: 'Supply vs. Growth',
    sub: 'Where concentration meets rising demand',
    tag: 'Classic Risk',
    xKey: 'supplyConc', yKey: 'growth',
  },
  {
    title: "India's Exposure",
    sub: 'Import dependence vs. China supply share',
    tag: 'India Risk',
    xKey: 'importDep', yKey: 'chinaShare',
  },
  {
    title: 'Hard to Replace',
    sub: 'Substitution difficulty vs. demand volume',
    tag: 'Future Risk',
    xKey: 'subst', yKey: 'demandLog',
  },
  {
    title: 'Price Weaponization',
    sub: 'Price volatility vs. supply concentration',
    tag: 'Market Risk',
    xKey: 'volatility', yKey: 'supplyConc',
  },
  {
    title: 'Strategic Horizon',
    sub: 'End-use criticality vs. reserve lifetime',
    tag: 'Long-Term',
    xKey: 'endUseComp', yKey: 'resTime',
  },
];

/* ── Builder Page ──────────────────────────────────────── */

function renderBuilderPage() {
  renderBuilderPresets();
  initBuilderControls();
  renderBuilderChart();
}

function renderBuilderPresets() {
  const container = document.getElementById('builder-presets');
  if (!container) return;
  container.innerHTML = BUILDER_PRESETS.map((p, i) => `
    <div class="builder-preset-card ${i === BuilderState.preset ? 'active' : ''}" data-preset="${i}">
      <div class="bp-tag">${p.tag}</div>
      <div class="bp-title">${p.title}</div>
      <div class="bp-sub">${p.sub}</div>
    </div>`).join('');

  container.querySelectorAll('.builder-preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const i = parseInt(card.dataset.preset, 10);
      const p = BUILDER_PRESETS[i];
      BuilderState.preset = i;
      BuilderState.xKey   = p.xKey;
      BuilderState.yKey   = p.yKey;
      BuilderState.type   = 'scatter';
      container.querySelectorAll('.builder-preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const xSel = document.getElementById('builder-x-axis');
      const ySel = document.getElementById('builder-y-axis');
      if (xSel) xSel.value = BuilderState.xKey;
      if (ySel) ySel.value = BuilderState.yKey;
      document.querySelectorAll('.builder-type-btn').forEach(b => b.classList.toggle('active', b.dataset.btype === 'scatter'));
      renderBuilderChart();
    });
  });
}

function initBuilderControls() {
  const xSel = document.getElementById('builder-x-axis');
  const ySel = document.getElementById('builder-y-axis');
  if (!xSel || !ySel) return;

  if (!xSel.options.length) {
    const grouped = [
      { label: '── Computed ──',   axes: ['chinaShare','demandLog'] },
      { label: '── Demand ──',      axes: ['demand','growth','endUseComp'] },
      { label: '── Supply ──',      axes: ['supplyConc','miningDiv','refiningDiv','resTime','resDiv'] },
      { label: '── Risk Factors ──',axes: ['subst','recycl','extraction','projects','volatility'] },
      { label: '── India ──',       axes: ['importDep','strategic'] },
    ];
    grouped.forEach(g => {
      const xGrp = document.createElement('optgroup');
      xGrp.label = g.label;
      const yGrp = document.createElement('optgroup');
      yGrp.label = g.label;
      g.axes.forEach(key => {
        const ax = CB_AXES.find(a => a.key === key);
        if (!ax) return;
        xGrp.appendChild(new Option(ax.label, ax.key));
        yGrp.appendChild(new Option(ax.label, ax.key));
      });
      xSel.appendChild(xGrp);
      ySel.appendChild(yGrp);
    });
  }

  xSel.value = BuilderState.xKey;
  ySel.value = BuilderState.yKey;

  const onAxisChange = () => {
    BuilderState.xKey = xSel.value;
    BuilderState.yKey = ySel.value;
    BuilderState.preset = -1;
    document.querySelectorAll('.builder-preset-card').forEach(c => c.classList.remove('active'));
    renderBuilderChart();
  };
  xSel.addEventListener('change', onAxisChange);
  ySel.addEventListener('change', onAxisChange);

  document.querySelectorAll('.builder-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.builder-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      BuilderState.type = btn.dataset.btype;
      const yField = document.getElementById('builder-y-field');
      if (yField) yField.style.display = BuilderState.type === 'bar' ? 'none' : '';
      renderBuilderChart();
    });
  });

  document.querySelectorAll('.builder-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.builder-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      BuilderState.colorBy = btn.dataset.bcolor;
      renderBuilderChart();
    });
  });

  const searchEl = document.getElementById('builder-search');
  if (searchEl) {
    searchEl.value = BuilderState.search;
    searchEl.addEventListener('input', () => {
      BuilderState.search = searchEl.value.toLowerCase().trim();
      renderBuilderChart();
    });
  }
}

function renderBuilderChart() {
  const svg = document.getElementById('builder-chart-svg');
  if (!svg) return;
  const minerals = [...window.MINERALS];
  if (BuilderState.type === 'bar') {
    renderBuilderBar(svg, minerals);
  } else {
    renderBuilderScatter(svg, minerals);
  }
}

function renderBuilderScatter(svg, minerals) {
  const W = svg.parentElement.clientWidth || 900;
  const H = 520;
  const M = { top: 36, right: 60, bottom: 72, left: 72 };
  const PW = W - M.left - M.right;
  const PH = H - M.top  - M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);

  const xAx = CB_AXES.find(a => a.key === BuilderState.xKey) || CB_AXES[0];
  const yAx = CB_AXES.find(a => a.key === BuilderState.yKey) || CB_AXES[1];

  const allX = minerals.map(m => xAx.getValue(m));
  const allY = minerals.map(m => yAx.getValue(m));
  const rawXMin = Math.min(...allX), rawXMax = Math.max(...allX);
  const rawYMin = Math.min(...allY), rawYMax = Math.max(...allY);
  const xRange = rawXMax - rawXMin || 1;
  const yRange = rawYMax - rawYMin || 1;
  const xPad = xRange * 0.08, yPad = yRange * 0.10;
  const xMin = rawXMin - xPad, xMax = rawXMax + xPad;
  const yMin = rawYMin - yPad, yMax = rawYMax + yPad;

  const xS = v => M.left + ((v - xMin) / (xMax - xMin)) * PW;
  const yS = v => M.top  + PH - ((v - yMin) / (yMax - yMin)) * PH;

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fdf4d0" rx="0"/>`;
  html += `<rect x="${M.left}" y="${M.top}" width="${PW}" height="${PH}" fill="rgba(241,162,34,0.02)" rx="4"/>`;

  const xTicks = 6, yTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const v = rawXMin + (i / xTicks) * xRange;
    const x = xS(v);
    html += `<line x1="${x}" y1="${M.top}" x2="${x}" y2="${M.top+PH}" stroke="rgba(26,8,4,0.07)" stroke-width="1"/>`;
    html += `<text x="${x}" y="${M.top+PH+20}" text-anchor="middle" font-size="10" fill="#9a7040" font-family="Inter,sans-serif">${v.toFixed(xRange > 20 ? 0 : 1)}</text>`;
  }
  for (let i = 0; i <= yTicks; i++) {
    const v = rawYMin + (i / yTicks) * yRange;
    const y = yS(v);
    html += `<line x1="${M.left}" y1="${y}" x2="${M.left+PW}" y2="${y}" stroke="rgba(26,8,4,0.07)" stroke-width="1"/>`;
    html += `<text x="${M.left-10}" y="${y+4}" text-anchor="end" font-size="10" fill="#9a7040" font-family="Inter,sans-serif">${v.toFixed(yRange > 20 ? 0 : 1)}</text>`;
  }

  html += `<line x1="${M.left}" y1="${M.top}" x2="${M.left}" y2="${M.top+PH}" stroke="rgba(26,8,4,0.18)" stroke-width="1.5"/>`;
  html += `<line x1="${M.left}" y1="${M.top+PH}" x2="${M.left+PW}" y2="${M.top+PH}" stroke="rgba(26,8,4,0.18)" stroke-width="1.5"/>`;

  html += `<text x="${M.left+PW/2}" y="${H-10}" text-anchor="middle" font-size="12" fill="#6b4020" font-family="Inter,sans-serif" font-weight="500">${xAx.label}</text>`;
  html += `<text x="16" y="${M.top+PH/2}" text-anchor="middle" font-size="12" fill="#6b4020" font-family="Inter,sans-serif" font-weight="500" transform="rotate(-90,16,${M.top+PH/2})">${yAx.label}</text>`;

  const search = BuilderState.search;
  minerals.forEach((m) => {
    const xVal  = xAx.getValue(m);
    const yVal  = yAx.getValue(m);
    const cx    = xS(xVal);
    const cy    = yS(yVal);
    const col   = cbGetColor(m, BuilderState.colorBy);
    const isHit = search && m.name.toLowerCase().includes(search);
    const isDim = search && !isHit;

    html += `<g class="builder-dot" data-mineral="${m.name}" style="cursor:pointer;">`;
    if (isDim) {
      html += `<circle cx="${cx}" cy="${cy}" r="7" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="1" stroke-opacity="0.25"/>`;
      html += `<text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="6" fill="rgba(255,255,255,0.2)" font-weight="700" pointer-events="none">${m.symbol}</text>`;
    } else if (isHit) {
      html += `<circle cx="${cx}" cy="${cy}" r="13" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="2"/>`;
      html += `<circle cx="${cx}" cy="${cy}" r="9" fill="${col}" fill-opacity="0.85"/>`;
      html += `<text x="${cx}" y="${cy+3.5}" text-anchor="middle" font-size="8" fill="white" font-weight="800" pointer-events="none">${m.symbol}</text>`;
      html += `<text x="${cx}" y="${cy+22}" text-anchor="middle" font-size="9" fill="${col}" font-weight="600" pointer-events="none">${m.name}</text>`;
    } else {
      html += `<circle cx="${cx}" cy="${cy}" r="9" fill="${col}" fill-opacity="0.78" stroke="${col}" stroke-width="1.5" stroke-opacity="0.9"/>`;
      html += `<text x="${cx}" y="${cy+3.5}" text-anchor="middle" font-size="7" fill="white" font-weight="700" pointer-events="none">${m.symbol}</text>`;
    }
    html += `</g>`;
  });

  svg.innerHTML = html;

  svg.querySelectorAll('.builder-dot').forEach(el => {
    el.addEventListener('mouseenter', e => showCBTooltip(e, el.dataset.mineral, xAx, yAx));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
  });
}

function renderBuilderBar(svg, minerals) {
  const xAx = CB_AXES.find(a => a.key === BuilderState.xKey) || CB_AXES[0];
  const sorted = [...minerals].sort((a, b) => xAx.getValue(b) - xAx.getValue(a));
  const search = BuilderState.search;

  const rowH = 24;
  const nameW = 120;
  const W = svg.parentElement.clientWidth || 900;
  const M = { top: 20, right: 60, bottom: 36, left: nameW };
  const PW = W - M.left - M.right;
  const H = M.top + sorted.length * rowH + M.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', Math.min(H, 560));

  const maxVal = Math.max(...sorted.map(m => xAx.getValue(m)));

  let html = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fdf4d0"/>`;
  html += `<text x="${M.left+PW/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="#9a7040" font-family="Inter,sans-serif">${xAx.label}</text>`;

  [0.25,0.5,0.75,1].forEach(t => {
    const x = M.left + t * PW;
    html += `<line x1="${x}" y1="${M.top}" x2="${x}" y2="${M.top+sorted.length*rowH}" stroke="rgba(26,8,4,0.07)" stroke-width="1"/>`;
    html += `<text x="${x}" y="${M.top+sorted.length*rowH+16}" text-anchor="middle" font-size="9" fill="#9a7040" font-family="Inter,sans-serif">${(maxVal*t).toFixed(1)}</text>`;
  });

  sorted.forEach((m, i) => {
    const val   = xAx.getValue(m);
    const barW  = (val / maxVal) * PW;
    const y     = M.top + i * rowH;
    const col   = cbGetColor(m, BuilderState.colorBy);
    const isHit = search && m.name.toLowerCase().includes(search);
    const isDim = search && !isHit;
    const opacity = isDim ? 0.25 : 0.85;

    if (i % 2 === 0) html += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="rgba(241,162,34,0.06)"/>`;
    html += `<g class="builder-dot" data-mineral="${m.name}" style="cursor:pointer;">`;
    html += `<rect x="${M.left}" y="${y+5}" width="${Math.max(3,barW)}" height="${rowH-10}" fill="${col}" fill-opacity="${opacity}" rx="3"/>`;
    html += `<text x="${M.left-6}" y="${y+rowH/2+4}" text-anchor="end" font-size="10" fill="${isHit ? col : '#6b4020'}" font-family="Inter,sans-serif" font-weight="${isHit?700:400}">${m.name}</text>`;
    html += `<text x="${M.left+Math.max(3,barW)+6}" y="${y+rowH/2+4}" font-size="9.5" fill="${col}" font-family="Inter,sans-serif" font-weight="700">${val.toFixed(1)}</text>`;
    html += `</g>`;
  });

  svg.innerHTML = html;

  svg.querySelectorAll('.builder-dot').forEach(el => {
    el.addEventListener('click', () => openMineralPage(el.dataset.mineral));
    el.addEventListener('mouseenter', e => showCBBarTooltip(e, el.dataset.mineral, xAx));
    el.addEventListener('mouseleave', hideTooltip);
  });
}

/* ── Event Wiring ──────────────────────────────────────── */

document.addEventListener('mousemove', e => {
  if (document.getElementById('tooltip').classList.contains('visible')) positionTooltip(e);
});

document.getElementById('main-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (btn && btn.dataset.page) navigate(btn.dataset.page);
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (AppState.currentPage === 'overview') renderCBChart();
    if (AppState.currentPage === 'builder')  renderBuilderChart();
  }, 200);
});

/* ── Init ──────────────────────────────────────────────── */

function init() {
  renderOverview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
