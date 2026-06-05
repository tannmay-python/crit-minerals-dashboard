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

/* ── Group descriptions (from paper) ──────────────────────── */
const GROUP_DESCRIPTIONS = {
  1: {
    tagline: 'Scale defines their criticality, not monopoly leverage.',
    body: `Every mineral here is consumed in hundreds of thousands to millions of tonnes annually. Supply is comparatively diffuse — no single country monopolises mining, and while China dominates refining for some, none approaches the leverage it holds over rare earths. The binding risk is sheer volume: these minerals power construction, energy, transport, and agriculture so broadly that a sustained shortfall would transmit immediately across the entire economy.\n\nCobalt and lithium sit here despite their high import dependence and price volatility because their defining feature is the same as the others — the criticality arises from the scale of demand, not from a chokepoint that one supplier controls. The policy question for this group is not who controls them but whether India has sufficient industrial processing capacity and strategic reserves to absorb a price spike or temporary disruption.`,
  },
  2: {
    tagline: 'No single dominant bottleneck — risk is mild and diffuse.',
    body: `These metals are produced as by-products of larger mining and smelting operations — zinc, copper, lead — and consumed in modest volumes. The profile that holds them together is the absence of any extreme: demand is moderate, supply concentration is low to middling, reserves are adequate, and extraction is undemanding. None presents a single sharp bottleneck that would justify urgent strategic intervention.\n\nTheir availability is governed less by dedicated supply chains than by the economics of the host metals they accompany. If zinc production falls, so does germanium output — not because germanium is scarce but because it rides along. This is the most internally heterogeneous group, bound together by what is absent rather than what is shared. Targeted attention is warranted only for specific minerals with a niche strategic use and no alternative source — rhenium in fighter engine superalloys, germanium in infrared optics — not for the group as a whole.`,
  },
  3: {
    tagline: 'Reserves locked. Refining locked. No exit through substitution.',
    body: `This is the tightest group in the dataset, and the one where India's exposure is most acute and its options fewest. Every member scores at or near the maximum on three vectors simultaneously: refining concentration, reserve concentration, and extraction complexity. Reserves are locked in ion-adsorption clay deposits in southern China and Myanmar. The refining process — multi-stage solvent extraction of chemically near-identical elements — requires capability that no Western or Indian facility possesses at commercial scale. Substitution is either technically impossible or requires a fundamental product redesign that takes years.\n\nChina has demonstrated twice in fifteen years that it is willing to restrict supply. Export quota cuts in 2010–11 drove dysprosium above $2,000/kg. The April 2025 export controls caused Western market prices to triple within weeks, and Indian automotive and EV manufacturers were among the first firms denied licenses. Tellurium is not a rare earth, but it belongs here: its refining is monopolised, its recycling negligible, and its substitution limited — a profile the clustering reads as identical.`,
  },
  4: {
    tagline: 'The geology is not the problem. The refinery is.',
    body: `Every mineral here shares one decisive feature: the constraint is not in the ground but at the processing stage. Reserves are abundant — for silicon, effectively limitless; for hafnium, tied to practically inexhaustible zircon deposits; for gallium, embedded in the vast global bauxite supply. Yet refining is technically demanding, requires integration with large-scale industrial operations, and is highly concentrated.\n\nIndia illustrates the gap acutely. It is the world's fourth-largest bauxite producer but has never recovered a commercial gram of gallium, because gallium extraction requires integration into Bayer-process alumina plants with dedicated recovery circuits that do not yet exist here. No amount of mining investment can fix a processing bottleneck. The platinum group metals appear in this cluster alongside gallium and hafnium not because they share chemistry but because the framework is reading the same structural pattern: abundant geology, captured refining, maximum import dependence. The intervention point is midstream, not upstream.`,
  },
  5: {
    tagline: 'High concentration. Low volatility. The monopoly not being exercised.',
    body: `This group is a direct corrective to the assumption that concentration automatically signals danger. Every member here is dominated by a single country or producer, yet this group records the lowest price volatility and weakest demand growth of any of the six. The monopoly is real; it is simply not being exercised — at least not yet.\n\nThe reasons differ by mineral. Brazil's CBMM manages niobium supply with deliberate discipline, holding prices stable at around $26/kg over years. Lanthanum and cerium are in chronic structural oversupply because they are co-produced with more commercially valuable rare earths; the market is flooded by the economics of mining neodymium. Vanadium prices fell 27% in 2024 on weak Chinese steel demand. What matters for policy is that these minerals are concentrated enough to become dangerous if geopolitical conditions change, but are not currently behaving as critical minerals. A flat list cannot draw this distinction. Monitoring rather than urgent intervention is the appropriate posture.`,
  },
  6: {
    tagline: 'Available geology, captured refining, and demand that is growing fast.',
    body: `This group resembles Group 4 in structure — refining concentrated, reserves not the constraint — but it differs in two ways the data separates clearly. First, reserves are well distributed across multiple countries rather than locked to one. Second, demand is large and accelerating: several members score at the maximum on the growth vector, driven by EV batteries, solar panels, and semiconductor fabs.\n\nThe midstream gap is not static here — it is widening. Graphite: China controls 90% of battery-grade processing while India targets 150 GW of new battery capacity. Silicon: prices spiked 273% in 2022 when Chinese power rationing shut domestic plants, then collapsed equally fast. Neodymium and praseodymium: every EV motor and wind turbine generator depends on them, and the April 2025 export controls hit this supply chain directly. Phosphorus is the only major plant nutrient that cannot be synthesised. The raw resource is globally available in each case; the processing chokepoint is actively weaponisable. Scandium belongs here rather than with the heavy rare earths because its reserve distribution is the most geographically diverse in the entire dataset — the constraint is purely processing.`,
  },
  0: {
    tagline: 'Not a commercial mineral. A genuine singleton.',
    body: `When the clustering separates minerals more finely, promethium is the only element that splits off entirely on its own — and the reason explains itself. Promethium is not a commercial mineral. It is radioactive, has no stable isotope, does not occur naturally in extractable quantities, and is produced in gram-scale quantities as a fission by-product in nuclear reactors. The US Department of Energy's Isotope Program is the sole global commercial supplier. There is no commodity market, no price index, and no supply chain in the conventional sense.\n\nIts scores reflect an element that is technically concentrated and difficult to handle but barely used — a combination no standard policy instrument is designed for. Its presence on India's critical minerals list, and on most others, is an artefact of completeness rather than of strategic concern. The data records it as what it is.`,
  },
};

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
    case 'groups':   renderGroups();    break;
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

  // Group modal close
  document.getElementById('gm-close').addEventListener('click', closeGroupModal);
  document.getElementById('gm-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('gm-overlay')) closeGroupModal();
  });
  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGroupModal();
  });

  // Scorecard accordion: handled by window.toggleScRow (inline onclick)

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
  renderOverviewGroupCards();
  renderHeatmap();
}

function renderOverviewGroupCards() {
  const container = document.getElementById('overview-groups-grid');
  if (!container) return;

  // Order: groups 1-6 first, then outlier (0)
  const orderedGroups = [...AppData.groups].sort((a, b) => {
    if (a.id === 0) return 1;
    if (b.id === 0) return -1;
    return a.id - b.id;
  });

  container.innerHTML = orderedGroups.map(g => {
    const members = AppData.minerals.filter(m => getGroup(m.mineral) === g.id);
    const desc = GROUP_DESCRIPTIONS[g.id] || {};

    return `
      <div class="overview-group-card" data-gid="${g.id}" style="--gcolor:${g.color}">
        <div class="ogc-left">
          <canvas class="ogc-radar" width="130" height="130"></canvas>
        </div>
        <div class="ogc-right">
          <div class="ogc-header">
            <span class="ogc-badge" style="background:${g.color}22;color:${g.color};border-color:${g.color}44;">${g.id === 0 ? 'Outlier' : `Group ${g.id}`}</span>
            <span class="ogc-name" style="color:${g.color}">${g.name}</span>
          </div>
          ${desc.tagline ? `<div class="ogc-tagline">${desc.tagline}</div>` : ''}
          <div class="ogc-members">${members.map(m => `<span class="ogc-member-chip" data-mineral="${m.mineral}">${m.mineral}</span>`).join('')}</div>
        </div>
      </div>`;
  }).join('');

  // Draw average-profile mini radars
  container.querySelectorAll('.overview-group-card').forEach(card => {
    const gid     = Number(card.dataset.gid);
    const col     = groupColor(gid);
    const members = AppData.minerals.filter(m => getGroup(m.mineral) === gid);
    const canvas  = card.querySelector('.ogc-radar');
    if (canvas && members.length) drawGroupAvgRadar(canvas, members, col);

    card.addEventListener('click', e => {
      const chip = e.target.closest('.ogc-member-chip');
      if (chip) {
        navigate('mineral', chip.dataset.mineral);
        return;
      }
      openGroupModal(gid);
    });
  });
}

/* ── Group modal drawer ──────────────────────────────────────── */

function openGroupModal(gid) {
  const g = AppData.groups.find(gg => gg.id === Number(gid));
  if (!g) return;
  const members = AppData.minerals.filter(m => getGroup(m.mineral) === Number(gid));
  const desc = GROUP_DESCRIPTIONS[Number(gid)] || {};
  const isOut = Number(gid) === 0;

  // Reset scroll
  document.getElementById('gm-panel').scrollTop = 0;

  // Header
  const header = document.getElementById('gm-header');
  header.style.borderLeftColor = g.color;

  const badge = document.getElementById('gm-badge');
  badge.textContent = isOut ? 'Outlier' : `Group ${g.id}`;
  badge.style.cssText = `background:${g.color}18;color:${g.color};border-color:${g.color}44`;

  const nameEl = document.getElementById('gm-name');
  nameEl.textContent = g.name;
  nameEl.style.color = g.color;

  document.getElementById('gm-tagline').textContent = desc.tagline || '';

  // Body — render newlines as paragraphs
  const bodyEl = document.getElementById('gm-body');
  bodyEl.innerHTML = (desc.body || '').split('\n\n').map(p => `<p>${p}</p>`).join('');

  // Radar
  const canvas = document.getElementById('gm-radar');
  if (canvas && members.length) drawGroupAvgRadar(canvas, members, g.color);

  // Mineral chips
  const chipsEl = document.getElementById('gm-chips');
  chipsEl.innerHTML = members.map(m =>
    `<span class="gm-chip" data-mineral="${m.mineral}" style="color:${g.color};border-color:${g.color}">${m.mineral}</span>`
  ).join('');
  chipsEl.querySelectorAll('.gm-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      closeGroupModal();
      navigate('mineral', chip.dataset.mineral);
    });
  });

  document.getElementById('gm-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGroupModal() {
  document.getElementById('gm-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/** Draws an average-profile radar for a set of minerals, colored by group. */
function drawGroupAvgRadar(canvas, members, color) {
  const ctx = canvas.getContext('2d');
  const cx  = canvas.width  / 2;
  const cy  = canvas.height / 2;
  const r   = Math.min(cx, cy) - 10;
  const n   = AppData.criteriaVectors.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Average normalized values per vector
  const avgs = AppData.criteriaVectors.map(v => {
    const vals = members.map(m => normalizeToFive(m, v.key)).filter(v => !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length / 5 : 0;
  });

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
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  // Axes
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(98,13,60,0.06)'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  // Filled polygon
  ctx.beginPath();
  avgs.forEach((norm, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr = norm * r;
    i === 0 ? ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a))
            : ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  });
  ctx.closePath();
  ctx.fillStyle   = color + '30';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.stroke();
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

  // Sync chip active state to AppState (in case filter was set programmatically)
  const chipWrap2 = document.getElementById('explorer-group-chips');
  chipWrap2.querySelectorAll('.filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.group === AppState.explorerGroupFilter);
  });

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
}

function renderMineralScorecard(m) {
  const container = document.getElementById('mp-scorecard');

  container.innerHTML = AppData.criteriaVectors.map(v => {
    const val  = getVectorValue(m, v.key);
    const pct  = val !== null ? Math.min((val / v.max) * 100, 100) : 0;
    const norm = val !== null ? val / v.max : 0;
    // Green (low risk) → red (high risk) colour
    const hue      = Math.round((1 - norm) * 110);
    const barColor = `hsl(${hue},58%,40%)`;
    const valDisplay = val !== null ? val : '—';

    // Sub-scores (shown inside accordion)
    let subHTML = '';
    if (v.sub && m.vectors[v.key]?.sub) {
      const subs = m.vectors[v.key].sub;
      subHTML = `<div class="sc-subs">${v.sub.map(s => {
        const sv = subs[s.key];
        return `<div class="sc-sub-row">
          <span class="sc-sub-label">${s.name}</span>
          <span class="sc-sub-val">${sv !== undefined ? sv : '—'}<span class="sc-sub-max"> / ${s.max}</span></span>
        </div>`;
      }).join('')}</div>`;
    }

    const rawReason = (m.vectors[v.key]?.reason || '').trim();
    const reasonParas = rawReason
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
    const reasonHTML = reasonParas.length
      ? `<div class="sc-reason">${reasonParas.map(p => `<p>${p}</p>`).join('')}</div>`
      : '';

    return `
      <div class="sc-row">
        <div class="sc-head" role="button" tabindex="0" onclick="toggleScRow(this)">
          <span class="sc-name">${v.name}</span>
          <span class="sc-score" style="color:${barColor}">${valDisplay}<span class="sc-max"> / ${v.max}</span></span>
          <span class="sc-arrow">▸</span>
        </div>
        <div class="sc-bar-track">
          <div class="sc-bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
        </div>
        <div class="sc-body" style="display:none">
          ${subHTML}
          ${reasonHTML}
        </div>
      </div>`;
  }).join('');

  // Listener is attached once in init() via scorecard delegation — nothing to do here
}


/** Toggle a scorecard accordion row. Uses style.display directly — no CSS class conflict possible. */
window.toggleScRow = function(head) {
  const row  = head.closest('.sc-row');
  const body = row && row.querySelector('.sc-body');
  const arr  = head.querySelector('.sc-arrow');
  if (!body) return;
  const isHidden = body.style.display === 'none' || body.style.display === '';
  body.style.display = isHidden ? 'block' : 'none';
  if (arr) arr.textContent = isHidden ? '▾' : '▸';
  row.classList.toggle('sc-row--open', isHidden);
};

/* ════════════════════════════════════════════════════════════
   CRITERIA PAGE
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   CRITERIA — complete band data from framework document
   ════════════════════════════════════════════════════════════ */

/* Band colours: Score 1 (low risk/green) → Score 5 (high risk/plum) */
const BAND_BG = ['#edf7ee','#f9f6e3','#fdf3db','#fce6de','#f4e6f0'];
const BAND_FG = ['#1a6b2a','#7a5f00','#b05400','#b91c1c','#620d3c'];

const FAMILY_COLOR = {
  'How much it matters':  '#620d3c',
  'How exposed supply is':'#3d6b7d',
  'Where India stands':   '#2e8b57',
};

/* Complete 5-band definitions for every scoreable dimension */
const COMPLETE_BANDS = {
  demand: [
    {score:1, label:'≤ 500 t/yr', note:'Negligible absolute demand'},
    {score:2, label:'500 – 10,000 t/yr', note:'Modest demand'},
    {score:3, label:'10,000 – 100,000 t/yr', note:'Moderate demand'},
    {score:4, label:'100,000 – 1,000,000 t/yr', note:'High demand'},
    {score:5, label:'> 1,000,000 t/yr', note:'Extremely high demand'},
  ],
  growth: [
    {score:1, label:'Declining', note:'Demand falling — replaced by other materials'},
    {score:2, label:'Flat / stagnant', note:'No growth expected'},
    {score:3, label:'Low growth (1–5% CAGR)', note:'Steady mature industrial uses'},
    {score:4, label:'Moderate growth (6–12% CAGR)', note:'Driven by emerging sectors'},
    {score:5, label:'High growth (>12% CAGR)', note:'Rapid expansion — e.g. EVs'},
  ],
  /* Shared scale for mining and refining sub-scores */
  supplier_sub: [
    {score:1, label:'No country > 30%', note:'Well distributed globally'},
    {score:2, label:'Largest country 30–50%', note:'Moderate concentration'},
    {score:3, label:'Largest country 50–65%', note:'Significant concentration'},
    {score:4, label:'Largest country 65–85%', note:'Highly concentrated'},
    {score:5, label:'Largest country > 85%', note:'Near-monopoly supply'},
  ],
  timeframe: [
    {score:1, label:'> 100 years', note:'Effectively limitless at current consumption'},
    {score:2, label:'50 – 100 years', note:'Abundant; long-term runway'},
    {score:3, label:'30 – 50 years', note:'Substantial but finite'},
    {score:4, label:'15 – 30 years', note:'Significant scarcity pressure emerging'},
    {score:5, label:'< 15 years', note:'Near-term scarcity risk'},
  ],
  diversification: [
    {score:1, label:'HHI < 0.15', note:'Highly distributed — no country > ~25% of reserves'},
    {score:2, label:'HHI 0.15–0.25', note:'Well distributed — top country typically < 35%'},
    {score:3, label:'HHI 0.25–0.40', note:'Moderately concentrated — one country 35–55%'},
    {score:4, label:'HHI 0.40–0.60', note:'Concentrated — one country holds 55–75%'},
    {score:5, label:'HHI > 0.60', note:'Near-monopoly reserve base — one country > 75%'},
  ],
  substitutability: [
    {score:1, label:'Drop-in substitute', note:'Already > 20% market share; commercially deployed by multiple manufacturers'},
    {score:2, label:'10–30% cost/performance penalty', note:'Industry can adapt within 1–2 years; at least one major manufacturer has deployed'},
    {score:3, label:'Significant trade-offs (> 50% cost premium)', note:'3–5 year adaptation; only at pilot scale or limited commercial use'},
    {score:4, label:'Lab-proven only', note:'No commercial-scale alternative; switching requires fundamental product redesign'},
    {score:5, label:'No substitute at any cost', note:'Unique physical/chemical property — no known workaround for primary application'},
  ],
  recyclability: [
    {score:1, label:'> 40% from secondary supply', note:'Mature collection infrastructure; recovery cost competitive with primary'},
    {score:2, label:'20–40% secondary supply', note:'Proven technology for high-concentration scrap; end-of-life limited by logistics'},
    {score:3, label:'5–20% recycled', note:'Technology exists for manufacturing scrap; end-of-life economically marginal'},
    {score:4, label:'< 5% recycled', note:'Technology exists but uneconomic — concentrations too low for cost recovery'},
    {score:5, label:'Effectively 0% recovered', note:'No viable technology, or mineral is chemically consumed/dissipated in use'},
  ],
  extraction_refining: [
    {score:1, label:'Simple, widely accessible', note:'Standard open-pit or dredge mining + physical separation; any industrialised nation can operate'},
    {score:2, label:'Moderately complex', note:'Multi-stage chemical refining; mature technology requiring trained engineers'},
    {score:3, label:'Complex, specialised', note:'Multi-stage hydrometallurgy or solvent extraction; < 20 companies globally have expertise'},
    {score:4, label:'Highly complex (< 15 facilities)', note:'Proprietary/restricted tech; must co-locate with other large-scale operations; near-identical element separation'},
    {score:5, label:'Nation-state level capability', note:'Nuclear-grade separation or equivalent; $100M+ facilities; decade-long licensing barriers'},
  ],
  upcoming_projects: [
    {score:1, label:'Strong pipeline (> 20% new supply)', note:'Major project under construction; first output within 2–3 years; geographically diversified'},
    {score:2, label:'Adequate (10–20%)', note:'Lead projects financed, feasibility complete; first output 3–5 years'},
    {score:3, label:'Thin (5–10%)', note:'Projects at pre-feasibility; realistic output 5–7 years away; execution risk'},
    {score:4, label:'Minimal (< 5%)', note:'Only exploratory-stage projects; any supply 7–10+ years out'},
    {score:5, label:'No pipeline + structural constraint', note:'No projects at any stage AND structural reason supply cannot scale even if prices rise'},
  ],
  import_dependence: [
    {score:1, label:'Self-sufficient (≥ 60% domestic)', note:'Operating mines and/or refineries at commercial scale'},
    {score:2, label:'40–60% domestic', note:'Mostly self-sufficient; imports supplement but don\'t define supply'},
    {score:3, label:'20–40% domestic', note:'Significant base but majority imported; assets undersized relative to demand'},
    {score:4, label:'< 20% domestic', note:'Marginal production; some resources or operations but token relative to demand'},
    {score:5, label:'Zero domestic production', note:'100% import-dependent'},
  ],
  strategic_posture: [
    {score:1, label:'Active secured position', note:'Binding offtakes, equity stakes in foreign assets, or operational JVs delivering material'},
    {score:2, label:'Concrete plans in motion', note:'Exploration blocks auctioned; MOUs/framework agreements signed; KABIL active due diligence; output 3–7 yrs'},
    {score:3, label:'Strategic intent declared', note:'On official critical minerals list; mentioned in policy documents; no specific projects or agreements yet'},
    {score:4, label:'Passive awareness', note:'Acknowledged as important; no KABIL mandate, no exploration blocks, no foreign outreach'},
    {score:5, label:'No awareness or relevance', note:'Not identified as strategic; India is a passive importer of finished goods'},
  ],
  price_volatility: [
    {score:1, label:'Stable (within ± 20% over 5 yrs)', note:'Dominated by long-term contracts; often managed by a single producer; no exchange trading'},
    {score:2, label:'Low (± 20–50%)', note:'Gradual movements driven by transparent factors; mix of contract and spot; liquid market'},
    {score:3, label:'Moderate (± 50–100%)', note:'At least one notable spike or correction; partially opaque market; active procurement management needed'},
    {score:4, label:'High (> ± 100%)', note:'Thin and opaque market; sensitive to single-actor decisions; genuine procurement uncertainty'},
    {score:5, label:'Extreme (> 200% or market breakdown)', note:'Export bans or weaponised supply; price can double overnight; supply cannot be reliably secured'},
  ],
};

/* Sector weights for End-use Applications */
const ENDUSE_SECTORS = [
  {name:'Defence & National Security',         weight:'+1.5', color:'#c42b1e'},
  {name:'Energy Generation & Grid',            weight:'+1.5', color:'#c05b00'},
  {name:'Agriculture & Food Security',         weight:'+1.5', color:'#1e7a2e'},
  {name:'Advanced Semiconductors & Computing', weight:'+1',   color:'#620d3c'},
  {name:'Electrification & Transport',         weight:'+1',   color:'#3d6b7d'},
  {name:'Healthcare & Biomedical',             weight:'+1',   color:'#7d6b9e'},
  {name:'Construction & Heavy Industry',       weight:'+0.5', color:'#6b4020'},
];

const ENDUSE_BREADTH = [
  {n:1,bonus:'+0'},{n:2,bonus:'+0.5'},{n:3,bonus:'+1'},
  {n:4,bonus:'+1.5'},{n:5,bonus:'+2'},{n:6,bonus:'+2.5'},{n:7,bonus:'+3'},
];

function buildScaleHTML(bands) {
  if (!bands?.length) return '';
  return `<div class="crit-scale" style="grid-template-columns:repeat(${bands.length},1fr)">
    ${bands.map((b, i) => {
      const ci = Math.min(i, BAND_BG.length - 1);
      return `<div class="crit-scale-cell" style="background:${BAND_BG[ci]};border-color:${BAND_FG[ci]}28">
        <div class="crit-scale-num" style="color:${BAND_FG[ci]}">${b.score}</div>
        <div class="crit-scale-label" style="color:${BAND_FG[ci]}">${b.label}</div>
        ${b.note ? `<div class="crit-scale-note" style="color:${BAND_FG[ci]}bb">${b.note}</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function buildEndUseHTML(fc) {
  const breadthColors = ENDUSE_BREADTH.map((b, i) => ({
    bg: BAND_BG[Math.min(Math.round(i*4/6), BAND_BG.length-1)],
    fg: BAND_FG[Math.min(Math.round(i*4/6), BAND_FG.length-1)],
    ...b
  }));
  return `<div class="crit-subscales">
    <div class="crit-subscale">
      <div class="crit-subscale-label">
        <span class="crit-subscale-name">Sector presence</span>
        <span class="crit-subscale-max" style="color:${fc}">/ 7 points additive</span>
      </div>
      <div class="crit-sector-grid">
        ${ENDUSE_SECTORS.map(s => `
          <div class="crit-sector-card" style="border-color:${s.color}28;background:${s.color}08">
            <span class="crit-sector-weight" style="color:${s.color}">${s.weight}</span>
            <span class="crit-sector-name">${s.name}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="crit-subscale">
      <div class="crit-subscale-label">
        <span class="crit-subscale-name">Breadth bonus</span>
        <span class="crit-subscale-max" style="color:${fc}">/ 3 points — rewards cross-sector dependency</span>
      </div>
      <div class="crit-scale" style="grid-template-columns:repeat(7,1fr)">
        ${breadthColors.map(b => `
          <div class="crit-scale-cell" style="background:${b.bg};border-color:${b.fg}28">
            <div class="crit-scale-num" style="color:${b.fg};font-size:0.85rem">${b.n} sector${b.n>1?'s':''}</div>
            <div class="crit-scale-label" style="font-size:0.75rem;font-weight:700;color:${b.fg}">${b.bonus}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderCriteria() {
  const container = document.getElementById('criteria-vectors-list');
  if (container.dataset.rendered) return;
  container.dataset.rendered = 'true';

  container.innerHTML = AppData.criteriaVectors.map((v, idx) => {
    const fc = FAMILY_COLOR[v.family] || '#620d3c';
    let scoringHTML = '';

    switch (v.key) {
      case 'demand':
        scoringHTML = buildScaleHTML(COMPLETE_BANDS.demand); break;
      case 'growth':
        scoringHTML = buildScaleHTML(COMPLETE_BANDS.growth); break;

      case 'supplier_concentration':
        // Split: Mining /5 + Refining /5, both use same band scale
        scoringHTML = `<div class="crit-subscales">
          ${['Mining concentration','Refining concentration'].map(name => `
            <div class="crit-subscale">
              <div class="crit-subscale-label">
                <span class="crit-subscale-name">${name}</span>
                <span class="crit-subscale-max" style="color:${fc}">/5</span>
              </div>
              ${buildScaleHTML(COMPLETE_BANDS.supplier_sub)}
            </div>`).join('')}
        </div>`; break;

      case 'reserves':
        scoringHTML = `<div class="crit-subscales">
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Reserve time-frame</span>
              <span class="crit-subscale-max" style="color:${fc}">/5</span>
            </div>
            ${buildScaleHTML(COMPLETE_BANDS.timeframe)}
          </div>
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Reserve diversification</span>
              <span class="crit-subscale-max" style="color:${fc}">/5 — scored by HHI (Herfindahl–Hirschman Index)</span>
            </div>
            <p class="crit-hhi-note">HHI = sum of squared country shares of global reserves. HHI = 1.0 if one country holds 100%; HHI = 0.10 if ten countries each hold 10%. Higher HHI = more concentrated.</p>
            ${buildScaleHTML(COMPLETE_BANDS.diversification)}
          </div>
        </div>`; break;

      case 'end_use':
        scoringHTML = buildEndUseHTML(fc); break;

      case 'substitutability_recyclability':
        scoringHTML = `<div class="crit-subscales">
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Substitutability</span>
              <span class="crit-subscale-max" style="color:${fc}">/5</span>
            </div>
            ${buildScaleHTML(COMPLETE_BANDS.substitutability)}
          </div>
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Recyclability</span>
              <span class="crit-subscale-max" style="color:${fc}">/5</span>
            </div>
            ${buildScaleHTML(COMPLETE_BANDS.recyclability)}
          </div>
        </div>`; break;

      case 'extraction_refining':
        scoringHTML = buildScaleHTML(COMPLETE_BANDS.extraction_refining); break;
      case 'upcoming_projects':
        scoringHTML = buildScaleHTML(COMPLETE_BANDS.upcoming_projects); break;

      case 'india_position':
        scoringHTML = `<div class="crit-subscales">
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Import dependence</span>
              <span class="crit-subscale-max" style="color:${fc}">/5</span>
            </div>
            ${buildScaleHTML(COMPLETE_BANDS.import_dependence)}
          </div>
          <div class="crit-subscale">
            <div class="crit-subscale-label">
              <span class="crit-subscale-name">Strategic posture</span>
              <span class="crit-subscale-max" style="color:${fc}">/5</span>
            </div>
            ${buildScaleHTML(COMPLETE_BANDS.strategic_posture)}
          </div>
        </div>`; break;

      case 'price_volatility':
        scoringHTML = buildScaleHTML(COMPLETE_BANDS.price_volatility); break;
    }

    return `
      <div class="crit-card card">
        <div class="crit-card-top">
          <div class="crit-num-wrap" style="background:${fc}"><span class="crit-num">${idx + 1}</span></div>
          <div class="crit-card-meta">
            <h3 class="crit-name" style="color:${fc}">${v.name}</h3>
            <span class="crit-family" style="color:${fc};background:${fc}12;border-color:${fc}30">${v.family}</span>
          </div>
          <span class="crit-max" style="color:${fc}">/${v.max}</span>
        </div>
        <p class="crit-what">${v.what}</p>
        ${scoringHTML}
      </div>`;
  }).join('') + `
  <div class="crit-methodology card">
    <h3 class="crit-meth-title">Methodology note</h3>
    <p>Eight of the ten vectors are tied to published quantitative thresholds: tonnes, CAGR bands, market-share percentages, HHI bands, reserve-years, secondary-supply shares, and price-movement percentages. The two qualitative vectors — extraction complexity and strategic posture — are anchored to observable facts (e.g. whether a solvent-extraction cascade is required, or whether an offtake has been signed).</p>
    <p>The scores are not beyond dispute, but the basis for each is stated, which allows others to challenge a score or substitute their own.</p>
    <p><strong>No cumulative score is produced.</strong> The vectors are correlated — summing them counts the same underlying risk condition more than once, and any weighting scheme embeds one analyst's priorities while appearing objective.</p>
  </div>`;
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

/** Deterministic jitter so overlapping discrete-score points separate slightly. */
function dJitter(mineralName, axis) {
  let h = 0;
  for (let i = 0; i < mineralName.length; i++) h = Math.imul(31, h) + mineralName.charCodeAt(i) | 0;
  const v = ((h >> (axis === 'x' ? 0 : 8)) & 0xff) / 255;
  return (v - 0.5) * 0.022; // ±1.1% of axis range
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

    const xN    = (xVec ? xVal / xVec.max : 0) + dJitter(m.mineral, 'x');
    const yN    = (yVec ? yVal / yVec.max : 0) + dJitter(m.mineral, 'y');
    const cx    = M.left + Math.max(0, Math.min(1, xN)) * PW;
    const cy    = M.top  + (1 - Math.max(0, Math.min(1, yN))) * PH;
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
   GROUPS PAGE
   ════════════════════════════════════════════════════════════ */

function renderGroups() {
  const list = document.getElementById('groups-detail-list');
  if (list.dataset.rendered) return;
  list.dataset.rendered = 'true';

  // Order: 1-6 then 0
  const ordered = [...AppData.groups].sort((a, b) => {
    if (a.id === 0) return 1; if (b.id === 0) return -1; return a.id - b.id;
  });

  list.innerHTML = ordered.map(g => {
    const members = AppData.minerals.filter(m => getGroup(m.mineral) === g.id);
    const desc    = GROUP_DESCRIPTIONS[g.id] || {};
    const isOut   = g.id === 0;

    return `
      <div class="group-detail-card card" style="--gcolor:${g.color}">
        <div class="gdc-top">
          <div class="gdc-radar-wrap">
            <canvas class="gdc-radar" width="160" height="160" data-gid="${g.id}"></canvas>
            <div class="gdc-radar-label" style="color:${g.color}">Avg. profile</div>
          </div>
          <div class="gdc-info">
            <div class="gdc-badge-row">
              <span class="gdc-badge" style="background:${g.color}18;color:${g.color};border-color:${g.color}40;">${isOut ? 'Outlier' : `Group ${g.id}`}</span>
              <h2 class="gdc-name" style="color:${g.color}">${g.name}</h2>
            </div>
            ${desc.tagline ? `<p class="gdc-tagline">${desc.tagline}</p>` : ''}
            <div class="gdc-members">${members.map(m =>
              `<span class="gdc-member" data-mineral="${m.mineral}">${m.mineral}</span>`
            ).join('')}</div>
          </div>
        </div>
        ${desc.body ? `<p class="gdc-body">${desc.body}</p>` : ''}
      </div>`;
  }).join('');

  // Draw radars
  list.querySelectorAll('.gdc-radar').forEach(canvas => {
    const gid     = Number(canvas.dataset.gid);
    const col     = groupColor(gid);
    const members = AppData.minerals.filter(m => getGroup(m.mineral) === gid);
    if (members.length) drawGroupAvgRadar(canvas, members, col);
  });

  // Member chip clicks
  list.querySelectorAll('.gdc-member').forEach(el =>
    el.addEventListener('click', () => navigate('mineral', el.dataset.mineral))
  );

  // "Why distinct" section
  const why = document.getElementById('groups-why');
  why.innerHTML = `
    <div class="card groups-prose-card">
      <h2 class="groups-section-title">Why the Groups Are Distinct</h2>
      <p>The six groups are not arbitrary slices of a spectrum — they are separated by a specific combination of answers to three structural questions. It is the combination, rather than any single vector, that makes them mutually exclusive.</p>
      <p>The <strong>first question</strong> is whether the binding constraint is <em>volume or vulnerability</em> — whether a mineral matters because of how much is consumed or because of how exposed its supply is. Group 1 answers volume. Every other group answers vulnerability, consisting of minerals consumed in far smaller quantities.</p>
      <p>The <strong>second question</strong> is where in the supply chain the constraint sits. For Group 2 it sits nowhere in particular — the vulnerability is diffuse. For Groups 3, 4, 5 and 6 it sits at the refining stage, but for different reasons: in Group 3 the reserves are also concentrated; in Groups 4 and 6 the reserves are not the problem; in Group 5 the refining is concentrated but the constraint is dormant rather than active.</p>
      <p>The <strong>third question</strong> is whether the constraint is currently active. Groups 4 and 6 are both abundant-reserve, captured-refining minerals — but Group 6's demand is large and rising while Group 4's is small and flat. Similarly Groups 3 and 5 both contain heavily concentrated minerals, but Group 3's are volatile and exit-less while Group 5's are calm and oversupplied.</p>
      <p>Minerals that a summed score would place side by side — niobium and dysprosium both appear severe, copper and cerium both total 44 — separate cleanly once the <em>shape</em> of their criticality is read rather than its height.</p>
    </div>`;

  // Outlier section
  const outEl = document.getElementById('groups-outlier');
  outEl.innerHTML = `
    <div class="card groups-outlier-card">
      <div class="groups-outlier-header">
        <span class="groups-outlier-badge">Outlier</span>
        <h2 class="groups-section-title" style="margin:0">Promethium</h2>
      </div>
      <p>When the clustering is pushed to separate minerals more finely, Promethium is the first and only mineral to split off entirely on its own — the k=7 cut isolates it as a singleton. The reason is that it is not a commercial mineral: it is radioactive, has no stable isotope, exists in only trace quantities, and has effectively no market. Rather than force it into the heavy rare earths it nominally resembles, the data records it as what it is: a genuine outlier whose presence on any critical minerals list is an artefact of completeness rather than of strategic concern.</p>
    </div>`;

  // Methodology section
  const meth = document.getElementById('groups-methodology');
  meth.innerHTML = `
    <div class="card groups-prose-card">
      <h2 class="groups-section-title">Grouping Methodology</h2>
      <h3 class="groups-sub-title">Inputs</h3>
      <p>Each mineral is represented by the fourteen scored sub-vectors. Composite roll-ups are not used as inputs, since they would double-count their constituents. Because the vectors are measured on different scales, each was standardised to zero mean and unit variance before any distance was computed, so that no vector influences the grouping merely by having a wider range.</p>
      <h3 class="groups-sub-title">Clustering</h3>
      <p>Minerals were grouped using agglomerative hierarchical clustering with Ward's linkage and Euclidean distance on the standardised profiles. Ward's method builds a tree by repeatedly merging the two clusters whose combination increases total within-cluster variance the least, producing compact, comparably sized groups. Hierarchical clustering was preferred over methods requiring the number of groups to be fixed in advance, because it allows the structure to be examined at every level of granularity.</p>
      <h3 class="groups-sub-title">How Many Groups</h3>
      <p>The number of groups was not assumed. The clustering tree was examined at cuts from three to nine groups. Two diagnostics informed the choice. <strong>Stability:</strong> the six-group solution is robust — the same groups persist when the tree is cut at five, six and seven, with only edge members reassigned. <strong>Interpretability:</strong> at six groups, every cluster corresponds to a profile that can be described in supply-chain terms. The one substantive change between six and seven groups is that Promethium separates as a singleton — the basis for treating it as an outlier.</p>
      <h3 class="groups-sub-title">An Honest Limitation</h3>
      <p>Standard measures of cluster quality — the silhouette score (all approximately 0.15–0.20) and cophenetic correlation (0.55) — indicate that these groups are imposed on a continuous distribution rather than discovered as naturally separated clouds. A principal-component analysis explains why: a single dominant axis accounts for more than 28% of all variation and runs continuously from high-volume, easily-processed minerals at one end to small-volume, concentrated, hard-to-process ones at the other. The minerals form a spectrum, not a set of islands. This does not invalidate the groups, but they should be understood as a useful partition of a continuum, not as natural kinds.</p>
      <h3 class="groups-sub-title">Manual Adjustment</h3>
      <p>The statistical output was treated as a strong prior rather than a verdict. A small number of placements were settled on reasoning where a mineral sat near a boundary. These judgement calls are flagged in the group descriptions above: the inclusion of Tellurium with the heavy rare earths, the placement of Scandium with the rising-demand processing group rather than with the other rare earths, and the treatment of Promethium as an outlier. In each case the statistical assignment and the reasoning agreed.</p>
    </div>`;
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
