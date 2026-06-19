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
    tagline: 'Reserves locked. Refining locked. No exit through substitution.',
    body: `This is the tightest group in the dataset, and the one where India's exposure is most acute and its options fewest. Every member scores at or near the maximum on three vectors simultaneously: refining concentration, reserve concentration, and extraction complexity. Reserves are locked in ion-adsorption clay deposits in southern China and Myanmar. The refining process — multi-stage solvent extraction of chemically near-identical elements — requires capability that no Western or Indian facility possesses at commercial scale. Substitution is either technically impossible or requires a fundamental product redesign that takes years.\n\nChina has demonstrated twice in fifteen years that it is willing to restrict supply. Export quota cuts in 2010–11 drove dysprosium above $2,000/kg. The April 2025 export controls caused Western market prices to triple within weeks, and Indian automotive and EV manufacturers were among the first firms denied licenses. Tellurium is not a rare earth, but it belongs here: its refining is monopolised, its recycling negligible, and its substitution limited — a profile the clustering reads as identical.`,
  },
  3: {
    tagline: 'High recycling rates and high-value applications define this group.',
    body: `The commonality in this group lies in high recycling. Reserves for minerals here tend to be concentrated, but are also long-lived relative to demand. This group largely consists of platinum group elements (PGEs) alongside indium, beryllium, and hafnium, all of which follow similar characterisations: technically demanding to produce, expensive, and consumed in small volumes for high-value applications.\n\nBecause they are expensive and widely deployed in industrial catalysts, electronics, and medical devices, secondary recovery is commercially viable in a way it is not for cheaper, more widely dispersed minerals. This does not make them without risk — reserves are concentrated and extraction barriers are high — but the closed-loop dynamic gives the supply chain a resilience that the heavy rare earths group lacks entirely. The intervention point for this group is maintaining and deepening recycling infrastructure rather than upstream mining investment.`,
  },
  4: {
    tagline: 'High concentration. Low volatility. The monopoly not being exercised.',
    body: `This group is a direct corrective to the assumption that concentration automatically signals danger. Every member here is dominated by a single country or producer, yet this group records the lowest price volatility and weakest demand growth of any of the six. The monopoly is real; it is simply not being exercised — at least not yet.\n\nThe reasons differ by mineral. Brazil's CBMM manages niobium supply with deliberate discipline, holding prices stable at around $26/kg over years. Lanthanum and cerium are in chronic structural oversupply because they are co-produced with more commercially valuable rare earths; the market is flooded by the economics of mining neodymium. Vanadium prices fell 27% in 2024 on weak Chinese steel demand. Europium is so niche that the market barely registers. What matters for policy is that these minerals are concentrated enough to become dangerous if geopolitical conditions change, but are not currently behaving as critical minerals. A flat list cannot draw this distinction. Monitoring rather than urgent intervention is the appropriate posture.`,
  },
  5: {
    tagline: 'Available geology, captured refining, and demand that is growing fast.',
    body: `This group is characterised by extreme refining concentration paired with rapid demand growth and a diversified reserve base. The reserves are well distributed across multiple countries — so the geological base is not the constraint. Demand is large and accelerating, driven by EV batteries, solar panels, and semiconductor fabs. Several members score at the maximum on the growth vector.\n\nThe midstream gap is not static here — it is widening. Graphite: China controls 90% of battery-grade processing while India targets 150 GW of new battery capacity. Silicon: prices spiked 273% in 2022 when Chinese power rationing shut domestic plants, then collapsed equally fast. Neodymium and praseodymium: every EV motor and wind turbine generator depends on them, and the April 2025 export controls hit this supply chain directly. Gallium: India is the world's fourth-largest bauxite producer but has never recovered a commercial gram of gallium, because the extraction requires dedicated recovery circuits in Bayer-process alumina plants. Phosphorus is the only major plant nutrient that cannot be synthesised. The raw resource is globally available in each case; the processing chokepoint is the problem, and it is actively widening.`,
  },
  6: {
    tagline: 'The least constrained group — risk is mild and diffuse.',
    body: `These are the least concentrated minerals supply-wise, and also have the lowest scores on the end-use criticality vector. The profile that holds them together is the absence of any extreme: demand is moderate, supply concentration is low to middling, reserves are adequate, and extraction is comparatively undemanding. None presents a single sharp bottleneck that would justify urgent strategic intervention.\n\nSome minerals in this group do have isolated extreme features — antimony and germanium have high price volatility scores, and rhenium has no substitute in fighter engine superalloys — but they still share the defining feature of low overall constraint. Interestingly, a majority are mined as by-products of other major minerals: bismuth, germanium, and cadmium are by-products of lead and zinc; selenium and rhenium are by-products of copper. Their availability is governed less by dedicated supply chains than by the economics of the host metals they accompany. Targeted attention is warranted for specific niche uses within this group, but not for the group as a whole.`,
  },
  0: {
    tagline: 'Not a commercial mineral. A genuine singleton.',
    body: `When the clustering separates minerals more finely, promethium is the only element that splits off entirely on its own — and the reason explains itself. Promethium is not a commercial mineral. It is radioactive, has no stable isotope, does not occur naturally in extractable quantities, and is produced in gram-scale quantities as a fission by-product in nuclear reactors. The US Department of Energy's Isotope Program is the sole global commercial supplier. There is no commodity market, no price index, and no supply chain in the conventional sense.\n\nIts presence on India's critical minerals list, and on most others, is an artefact of completeness rather than of strategic concern. The data records it as what it is.`,
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

/* Heatmap colours every cell on a common 0–10 domain (not per-vector max),
   so a displayed 7 always reads darker than a 5 — even across vectors scored
   /5 and /10. Pale parchment → deep plum (#620d3c), monotonic in the score. */
const HEATMAP_DOMAIN = 10;

/** Heatmap cell background from a raw score. */
function heatmapColor(value) {
  const t = Math.max(0, Math.min(1, (value ?? 0) / HEATMAP_DOMAIN));
  const r = Math.round(255 + (98  - 255) * t);
  const g = Math.round(251 + (13  - 251) * t);
  const b = Math.round(226 + (60  - 226) * t);
  return `rgb(${r},${g},${b})`;
}

/** Text color for heatmap cell so it remains readable. */
function heatmapTextColor(value) {
  return ((value ?? 0) / HEATMAP_DOMAIN) > 0.55 ? 'rgba(255,255,255,0.92)' : '#1a0804';
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
    case 'overview':    renderOverview();    break;
    case 'explorer':    renderExplorer();    break;
    case 'mineral':     renderMineralPage(AppState.selectedMineral); break;
    case 'methodology': renderMethodology(); break;
    case 'groups':      renderGroups();      break;
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

  // Add-to-compare button (mineral detail) — folds into the Explorer compare tray
  document.getElementById('mp-add-compare').addEventListener('click', () => {
    const name = AppState.selectedMineral;
    if (!name) return;
    const s = AppState.compareSelections;
    if (s.a === name || s.b === name || s.c === name) {
      showToast(`${name} is already in compare`);
    } else if (!s.a) { s.a = name; showToast(`${name} added to compare`); }
    else if (!s.b)   { s.b = name; showToast(`${name} added to compare`); }
    else if (!s.c)   { s.c = name; showToast(`${name} added to compare`); }
    else             { showToast('Compare is full — clear one to add another'); return; }
    openCompareTray();
    navigate('explorer');
    setTimeout(() => {
      document.getElementById('explorer-compare')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
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

  // Populate compare selects (compare tray now lives inside Explorer)
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
      updateCompareTray();
    });
  });

  // Compare tray toggle (in Explorer controls)
  document.getElementById('ec-toggle').addEventListener('click', () => {
    const tray = document.getElementById('explorer-compare');
    const willOpen = tray.classList.contains('hidden');
    if (willOpen) openCompareTray(); else tray.classList.add('hidden');
    document.getElementById('ec-toggle').setAttribute('aria-expanded', String(willOpen));
  });

  // Compare tray "Clear all"
  document.getElementById('ec-clear').addEventListener('click', () => {
    AppState.compareSelections = { a: '', b: '', c: '' };
    renderCompare();
    updateCompareTray();
  });

  navigate('overview');
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW PAGE
   ════════════════════════════════════════════════════════════ */

function renderOverview() {
  renderPeriodicTable();
}

/* Methodology page = scoring framework (criteria) + heatmap. */
function renderMethodology() {
  renderCriteria();
  renderHeatmap();
}

/* ── Interactive periodic table ───────────────────────────────
   Walks the reduction from 118 known elements down to the ~76 that
   are actually mined for commercial use, then highlights the 51 that
   India designates critical. Element rows: [Z, symbol, name, gridRow,
   gridCol, category, isCritical]. Categories: com (commercial),
   syn (synthetic, Z95–118), rad (non-commercial radioactive),
   gas (atmospheric gas), hhe (hydrogen/helium).
   ───────────────────────────────────────────────────────────── */
const PT_ELEMENTS = [
  [1,"H","Hydrogen",1,1,"hhe",0],[2,"He","Helium",1,18,"hhe",0],[3,"Li","Lithium",2,1,"com",1],[4,"Be","Beryllium",2,2,"com",1],[5,"B","Boron",2,13,"com",0],[6,"C","Carbon",2,14,"com",1],
  [7,"N","Nitrogen",2,15,"gas",0],[8,"O","Oxygen",2,16,"gas",0],[9,"F","Fluorine",2,17,"gas",0],[10,"Ne","Neon",2,18,"gas",0],[11,"Na","Sodium",3,1,"com",0],[12,"Mg","Magnesium",3,2,"com",0],
  [13,"Al","Aluminium",3,13,"com",0],[14,"Si","Silicon",3,14,"com",1],[15,"P","Phosphorus",3,15,"com",1],[16,"S","Sulfur",3,16,"com",0],[17,"Cl","Chlorine",3,17,"gas",0],[18,"Ar","Argon",3,18,"gas",0],
  [19,"K","Potassium",4,1,"com",1],[20,"Ca","Calcium",4,2,"com",0],[21,"Sc","Scandium",4,3,"com",1],[22,"Ti","Titanium",4,4,"com",1],[23,"V","Vanadium",4,5,"com",1],[24,"Cr","Chromium",4,6,"com",0],
  [25,"Mn","Manganese",4,7,"com",0],[26,"Fe","Iron",4,8,"com",0],[27,"Co","Cobalt",4,9,"com",1],[28,"Ni","Nickel",4,10,"com",1],[29,"Cu","Copper",4,11,"com",1],[30,"Zn","Zinc",4,12,"com",0],
  [31,"Ga","Gallium",4,13,"com",1],[32,"Ge","Germanium",4,14,"com",1],[33,"As","Arsenic",4,15,"com",0],[34,"Se","Selenium",4,16,"com",1],[35,"Br","Bromine",4,17,"com",0],[36,"Kr","Krypton",4,18,"gas",0],
  [37,"Rb","Rubidium",5,1,"com",0],[38,"Sr","Strontium",5,2,"com",1],[39,"Y","Yttrium",5,3,"com",1],[40,"Zr","Zirconium",5,4,"com",1],[41,"Nb","Niobium",5,5,"com",1],[42,"Mo","Molybdenum",5,6,"com",1],
  [43,"Tc","Technetium",5,7,"rad",0],[44,"Ru","Ruthenium",5,8,"com",1],[45,"Rh","Rhodium",5,9,"com",1],[46,"Pd","Palladium",5,10,"com",1],[47,"Ag","Silver",5,11,"com",0],[48,"Cd","Cadmium",5,12,"com",1],
  [49,"In","Indium",5,13,"com",1],[50,"Sn","Tin",5,14,"com",1],[51,"Sb","Antimony",5,15,"com",1],[52,"Te","Tellurium",5,16,"com",1],[53,"I","Iodine",5,17,"com",0],[54,"Xe","Xenon",5,18,"com",0],
  [55,"Cs","Caesium",6,1,"com",0],[56,"Ba","Barium",6,2,"com",0],[57,"La","Lanthanum",9,3,"com",1],[58,"Ce","Cerium",9,4,"com",1],[59,"Pr","Praseodymium",9,5,"com",1],[60,"Nd","Neodymium",9,6,"com",1],
  [61,"Pm","Promethium",9,7,"com",1],[62,"Sm","Samarium",9,8,"com",1],[63,"Eu","Europium",9,9,"com",1],[64,"Gd","Gadolinium",9,10,"com",1],[65,"Tb","Terbium",9,11,"com",1],[66,"Dy","Dysprosium",9,12,"com",1],
  [67,"Ho","Holmium",9,13,"com",1],[68,"Er","Erbium",9,14,"com",1],[69,"Tm","Thulium",9,15,"com",1],[70,"Yb","Ytterbium",9,16,"com",1],[71,"Lu","Lutetium",9,17,"com",1],[72,"Hf","Hafnium",6,4,"com",1],
  [73,"Ta","Tantalum",6,5,"com",1],[74,"W","Tungsten",6,6,"com",1],[75,"Re","Rhenium",6,7,"com",1],[76,"Os","Osmium",6,8,"com",1],[77,"Ir","Iridium",6,9,"com",1],[78,"Pt","Platinum",6,10,"com",1],
  [79,"Au","Gold",6,11,"com",0],[80,"Hg","Mercury",6,12,"com",0],[81,"Tl","Thallium",6,13,"com",0],[82,"Pb","Lead",6,14,"com",0],[83,"Bi","Bismuth",6,15,"com",1],[84,"Po","Polonium",6,16,"rad",0],
  [85,"At","Astatine",6,17,"rad",0],[86,"Rn","Radon",6,18,"rad",0],[87,"Fr","Francium",7,1,"rad",0],[88,"Ra","Radium",7,2,"rad",0],[89,"Ac","Actinium",10,3,"rad",0],[90,"Th","Thorium",10,4,"com",0],
  [91,"Pa","Protactinium",10,5,"rad",0],[92,"U","Uranium",10,6,"com",0],[93,"Np","Neptunium",10,7,"com",0],[94,"Pu","Plutonium",10,8,"rad",0],[95,"Am","Americium",10,9,"syn",0],[96,"Cm","Curium",10,10,"syn",0],
  [97,"Bk","Berkelium",10,11,"syn",0],[98,"Cf","Californium",10,12,"syn",0],[99,"Es","Einsteinium",10,13,"syn",0],[100,"Fm","Fermium",10,14,"syn",0],[101,"Md","Mendelevium",10,15,"syn",0],[102,"No","Nobelium",10,16,"syn",0],
  [103,"Lr","Lawrencium",10,17,"syn",0],[104,"Rf","Rutherfordium",7,4,"syn",0],[105,"Db","Dubnium",7,5,"syn",0],[106,"Sg","Seaborgium",7,6,"syn",0],[107,"Bh","Bohrium",7,7,"syn",0],[108,"Hs","Hassium",7,8,"syn",0],
  [109,"Mt","Meitnerium",7,9,"syn",0],[110,"Ds","Darmstadtium",7,10,"syn",0],[111,"Rg","Roentgenium",7,11,"syn",0],[112,"Cn","Copernicium",7,12,"syn",0],[113,"Nh","Nihonium",7,13,"syn",0],[114,"Fl","Flerovium",7,14,"syn",0],
  [115,"Mc","Moscovium",7,15,"syn",0],[116,"Lv","Livermorium",7,16,"syn",0],[117,"Ts","Tennessine",7,17,"syn",0],[118,"Og","Oganesson",7,18,"syn",0],
];

/* The category removed at each step, the running count, and the caption. */
const PT_STEPS = [
  { num: 118, label: 'known elements', pill: '118 elements',
    caption: 'The periodic table holds 118 known elements. Only a fraction are even candidates for a minerals strategy.' },
  { num: 94, label: 'occur in nature', pill: '−24 synthetic', removes: 'syn',
    caption: 'Elements 95–118 are synthetic — created in particle accelerators, never mined. Set them aside and 94 occur in nature.' },
  { num: 85, label: 'non-radioactive', pill: '−9 radioactive', removes: 'rad',
    caption: 'Nine more are radioactive with no commercial supply chain — technetium, polonium, plutonium and the like. That leaves 85.' },
  { num: 78, label: 'solids & metals', pill: '−7 gases', removes: 'gas',
    caption: 'Seven are atmospheric gases — nitrogen, oxygen, the noble gases — not mined as ores. Down to 78.' },
  { num: 76, label: 'commercially mined', pill: '−2 H, He', removes: 'hhe',
    caption: 'Set aside hydrogen and helium, and roughly 76 elements are actually mined for commercial use — the usable periodic table.' },
  { num: 51, label: 'designated critical', pill: '51 critical', highlightCritical: true,
    caption: 'India designates 51 of these 76 as critical — two-thirds. When the label covers that much of what we mine, it can no longer tell policymakers where to act first.' },
];

let ptStep = 0;

function renderPeriodicTable() {
  const grid = document.getElementById('pt-grid');
  if (!grid) return;

  // Build the cells once
  if (!grid.dataset.built) {
    grid.innerHTML = PT_ELEMENTS.map(([z, sym, name, row, col, cat, crit]) =>
      `<div class="pt-cell" data-cat="${cat}" data-crit="${crit}"
            style="grid-row:${row};grid-column:${col}"
            title="${name} (${sym}, ${z})">
         <span class="pt-z">${z}</span>
         <span class="pt-sym">${sym}</span>
       </div>`
    ).join('');

    // f-block connector labels + a thin spacer row between the main table and the f-block
    grid.insertAdjacentHTML('beforeend',
      `<div class="pt-fnote" style="grid-row:6;grid-column:3">57–71</div>
       <div class="pt-fnote" style="grid-row:7;grid-column:3">89–103</div>
       <div class="pt-spacer" style="grid-row:8;grid-column:1 / -1"></div>`);

    grid.dataset.built = 'true';
  }

  // Build step pills once
  const stepsEl = document.getElementById('pt-steps');
  if (stepsEl && !stepsEl.dataset.built) {
    stepsEl.innerHTML = PT_STEPS.map((s, i) =>
      `<button class="pt-step-pill" data-step="${i}">${s.pill}</button>`
    ).join('');
    stepsEl.querySelectorAll('.pt-step-pill').forEach(btn =>
      btn.addEventListener('click', () => setPtStep(Number(btn.dataset.step)))
    );
    document.getElementById('pt-prev').addEventListener('click', () => setPtStep(ptStep - 1));
    document.getElementById('pt-next').addEventListener('click', () => setPtStep(ptStep + 1));
    stepsEl.dataset.built = 'true';
  }

  setPtStep(ptStep);
}

function setPtStep(step) {
  ptStep = Math.max(0, Math.min(PT_STEPS.length - 1, step));

  // A category is "removed" once we've passed the step that removes it.
  const removedCats = new Set();
  for (let i = 1; i <= ptStep; i++) {
    if (PT_STEPS[i].removes) removedCats.add(PT_STEPS[i].removes);
  }
  const showCritical = PT_STEPS[ptStep].highlightCritical;

  document.querySelectorAll('#pt-grid .pt-cell').forEach(cell => {
    const cat  = cell.dataset.cat;
    const crit = cell.dataset.crit === '1';
    let state;
    if (removedCats.has(cat))      state = 'removed';
    else if (showCritical && crit) state = 'critical';
    else if (showCritical)         state = 'mined';      // commercial, not listed
    else                           state = 'neutral';
    cell.dataset.state = state;
  });

  // Readout + caption
  const s = PT_STEPS[ptStep];
  document.getElementById('pt-num').textContent   = s.num;
  document.getElementById('pt-label').textContent = s.label;
  document.getElementById('pt-caption').innerHTML =
    ptStep === PT_STEPS.length - 1
      ? `<strong>51 of 76 — about 67%.</strong> ${s.caption}`
      : s.caption;

  // Pill active states (mark current + completed)
  document.querySelectorAll('#pt-steps .pt-step-pill').forEach((btn, i) => {
    btn.classList.toggle('active', i === ptStep);
    btn.classList.toggle('done', i < ptStep);
  });

  // Arrow disabled states
  document.getElementById('pt-prev').disabled = ptStep === 0;
  document.getElementById('pt-next').disabled = ptStep === PT_STEPS.length - 1;
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
        const bg   = heatmapColor(val);
        const tc   = heatmapTextColor(val);
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

  // Keep the compare tray in sync whenever Explorer renders.
  // Un-hide the tray first so the radar canvas has real dimensions before Chart.js draws.
  updateCompareTray();
  renderCompare();
}

/* ── Compare tray (Explorer) ─────────────────────────────────── */

/** Count selected, update the toggle badge, and auto-open the tray if non-empty. */
function updateCompareTray() {
  const s = AppState.compareSelections;
  const n = ['a', 'b', 'c'].filter(k => s[k]).length;

  const countEl = document.getElementById('ec-count');
  if (countEl) countEl.textContent = n ? ` (${n})` : '';

  // If something is selected, make sure the tray is visible.
  if (n > 0) {
    const tray = document.getElementById('explorer-compare');
    if (tray) tray.classList.remove('hidden');
    document.getElementById('ec-toggle')?.setAttribute('aria-expanded', 'true');
  }
}

/** Force the compare tray open (used by the mineral-page Add-to-Compare button). */
function openCompareTray() {
  document.getElementById('explorer-compare')?.classList.remove('hidden');
  document.getElementById('ec-toggle')?.setAttribute('aria-expanded', 'true');
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
            pointLabels: { color: '#6b4020', font: { size: 8, family: 'Hanken Grotesk' } },
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
            pointLabels: { color: '#6b4020', font: { size: 8, family: 'Hanken Grotesk' } },
            angleLines: { color: 'rgba(98,13,60,0.06)' }
          }
        },
        plugins: {
          legend: { labels: { color: '#1a0804', font: { size: 11, family: 'Hanken Grotesk' }, boxWidth: 12, padding: 14 } },
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
    // Canvas radars redraw on navigation; nothing layout-critical depends on resize.
  }, 180);
});

/* ════════════════════════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', loadData);
