// TO ADD A MINERAL: copy a block below and edit the values.
// Each mineral object has:
//   name, symbol, scores (14 dimensions + composite), meta (sectors, chinaShare, etc.)
//
// DIMENSION KEYS (all scored 1–5 unless noted; higher = more risky/critical):
//   demand         – current demand level
//   growth         – demand growth trajectory
//   miningDiv      – mining concentration (lack of diversity)
//   refiningDiv    – refining concentration (lack of diversity)
//   resTime        – reserve lifetime risk (shorter = higher score)
//   resDiv         – reserve geographic diversity (lower = more concentrated)
//   endUseComp     – end-use criticality (scale 1-10 here)
//   substitutability – how hard to substitute (higher = harder)
//   recyclability  – recycling difficulty (higher = harder)
//   extraction     – extraction complexity
//   projects       – pipeline scarcity (lack of upcoming projects)
//   importDep      – India import dependence
//   strategic      – strategic posture / geopolitical risk
//   volatility     – price volatility
//   composite      – weighted composite score (from research framework)

window.DIMENSIONS = {
  demand:           { label: 'Current Demand',         description: 'Scale of existing global demand', min: 1, max: 5, higherMeans: 'Higher demand volume' },
  growth:           { label: 'Demand Growth',           description: 'Rate of future demand increase', min: 1, max: 5, higherMeans: 'Faster demand growth' },
  miningDiv:        { label: 'Mining Concentration',    description: 'Geographic concentration of mining', min: 1, max: 5, higherMeans: 'More concentrated mining' },
  refiningDiv:      { label: 'Refining Concentration',  description: 'Geographic concentration of refining', min: 1, max: 5, higherMeans: 'More concentrated refining' },
  resTime:          { label: 'Reserve Lifetime Risk',   description: 'Risk from limited reserve lifetime', min: 1, max: 6, higherMeans: 'Shorter reserves' },
  resDiv:           { label: 'Reserve Diversity',       description: 'Concentration of world reserves', min: 1, max: 5, higherMeans: 'More concentrated reserves' },
  endUseComp:       { label: 'End-Use Criticality',     description: 'Importance across critical applications', min: 1, max: 10, higherMeans: 'More critical end uses' },
  substitutability: { label: 'Substitution Risk',       description: 'Difficulty of substitution', min: 1, max: 5, higherMeans: 'Harder to substitute' },
  recyclability:    { label: 'Recycling Difficulty',    description: 'Difficulty of recycling/circular supply', min: 1, max: 5, higherMeans: 'Harder to recycle' },
  extraction:       { label: 'Processing Complexity',   description: 'Technical difficulty of extraction/processing', min: 1, max: 5, higherMeans: 'More complex processing' },
  projects:         { label: 'Pipeline Scarcity',       description: 'Lack of upcoming supply projects', min: 1, max: 5, higherMeans: 'Fewer new projects' },
  importDep:        { label: 'India Import Dependence', description: "India's reliance on imports", min: 1, max: 5, higherMeans: 'More import dependent' },
  strategic:        { label: 'Geopolitical Risk',       description: 'Strategic/geopolitical exposure', min: 1, max: 3, higherMeans: 'Higher geopolitical risk' },
  volatility:       { label: 'Price Volatility',        description: 'Historical and expected price swings', min: 1, max: 5, higherMeans: 'More volatile prices' },
  composite:        { label: 'Composite Risk Score',    description: 'Overall criticality score from research framework', min: 1, max: 70, higherMeans: 'More critical overall' },
};

// RADAR CHART groupings (6 axes for the hexagonal radar)
window.RADAR_AXES = [
  { key: 'supplyConc',   label: 'Supply Concentration',  dims: ['miningDiv', 'refiningDiv'],              scale: 5 },
  { key: 'demandPress',  label: 'Demand Pressure',        dims: ['demand', 'growth'],                      scale: 5 },
  { key: 'reserveRisk',  label: 'Reserve Security',       dims: ['resTime', 'resDiv'],                     scale: 6 },
  { key: 'subRisk',      label: 'Substitution Risk',      dims: ['substitutability', 'recyclability'],     scale: 5 },
  { key: 'indiaExp',     label: 'India Exposure',         dims: ['importDep', 'strategic'],                scale: 5 },
  { key: 'priceRisk',    label: 'Price Risk',             dims: ['volatility', 'extraction'],              scale: 5 },
];

window.MINERALS = [
  {
    name: 'Beryllium',
    symbol: 'Be',
    scores: {
      demand: 1, growth: 3, miningDiv: 3, refiningDiv: 4,
      resTime: 6, resDiv: 2.5, endUseComp: 6, substitutability: 4,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 50.5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'healthcare'],
      chinaShare: 21,
      topSupplier: 'USA (Materion)',
      annualDemand: '~430 t',
      keyFact: 'Only 3 countries can process. Materion is sole Western integrated producer.',
    }
  },
  {
    name: 'Indium',
    symbol: 'In',
    scores: {
      demand: 2, growth: 4, miningDiv: 4, refiningDiv: 4,
      resTime: 5.5, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 3, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 4, composite: 51.5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'healthcare', 'construction'],
      chinaShare: 70,
      topSupplier: 'China (70%)',
      annualDemand: '~1,080 t',
      keyFact: 'No primary mines — 100% byproduct of zinc smelting. China imposed export controls.',
    }
  },
  {
    name: 'Niobium',
    symbol: 'Nb',
    scores: {
      demand: 4, growth: 3, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 6, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 2, importDep: 5,
      strategic: 3, volatility: 1, composite: 49.5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction'],
      chinaShare: 0,
      topSupplier: 'Brazil/CBMM (92%)',
      annualDemand: '~110,000 t',
      keyFact: 'CBMM (Brazil) operates world\'s largest mine and dominates global supply. Prices managed as near-monopoly.',
    }
  },
  {
    name: 'Titanium',
    symbol: 'Ti',
    scores: {
      demand: 5, growth: 3, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 1, extraction: 2, projects: 2, importDep: 2,
      strategic: 3, volatility: 2, composite: 42.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction', 'healthcare'],
      chinaShare: 35,
      topSupplier: 'China (sponge ~65%)',
      annualDemand: '~6–7 million t',
      keyFact: 'India owns 21% of world ilmenite reserves but imports 50%+ of processed titanium from China.',
    }
  },
  {
    name: 'Graphite',
    symbol: 'C',
    scores: {
      demand: 5, growth: 5, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 2, endUseComp: 7, substitutability: 3,
      recyclability: 4, extraction: 2, projects: 3, importDep: 2,
      strategic: 3, volatility: 3, composite: 50.5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction'],
      chinaShare: 78,
      topSupplier: 'China (78% mining, 90% refining)',
      annualDemand: '~1.6 million t',
      keyFact: 'China imposed export controls. Battery-grade spherical graphite: China controls ~90% of refining.',
    }
  },
  {
    name: 'Tellurium',
    symbol: 'Te',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 4,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 4,
      recyclability: 5, extraction: 4, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 58
    },
    meta: {
      sectors: ['energy', 'defense', 'semiconductors', 'construction'],
      chinaShare: 75,
      topSupplier: 'China (75–80%)',
      annualDemand: '~640 t',
      keyFact: 'Byproduct of copper refining. China\'s Feb 2025 export controls caused 84% price rise in Europe.',
    }
  },
  {
    name: 'Strontium',
    symbol: 'Sr',
    scores: {
      demand: 4, growth: 2, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 1, endUseComp: 7, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 3, importDep: 2,
      strategic: 3, volatility: 2, composite: 39.5
    },
    meta: {
      sectors: ['defense', 'healthcare', 'construction'],
      chinaShare: 35,
      topSupplier: 'China & Mexico (~65%)',
      annualDemand: '~500,000 t',
      keyFact: 'Reserves could last thousands of years. Challenge is processing concentration, not scarcity.',
    }
  },
  {
    name: 'Silicon',
    symbol: 'Si',
    scores: {
      demand: 5, growth: 5, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 1, endUseComp: 8, substitutability: 4,
      recyclability: 5, extraction: 2, projects: 3, importDep: 4,
      strategic: 2, volatility: 5, composite: 56
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction', 'healthcare', 'agriculture'],
      chinaShare: 80,
      topSupplier: 'China (~80%)',
      annualDemand: '~9.7 million t',
      keyFact: 'China explicitly listed as national security concern. 85–90% of semiconductor/solar grade polysilicon is Chinese.',
    }
  },
  {
    name: 'Tungsten',
    symbol: 'W',
    scores: {
      demand: 3, growth: 3, miningDiv: 5, refiningDiv: 5,
      resTime: 3, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 2, projects: 2, importDep: 3,
      strategic: 3, volatility: 4, composite: 47.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction', 'healthcare'],
      chinaShare: 83,
      topSupplier: 'China (83%)',
      annualDemand: '~81,000 t',
      keyFact: 'China imposed export restrictions. Among highest production concentration of any strategic mineral.',
    }
  },
  {
    name: 'Antimony',
    symbol: 'Sb',
    scores: {
      demand: 3, growth: 4, miningDiv: 4, refiningDiv: 3,
      resTime: 4, resDiv: 1.5, endUseComp: 4, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 3, importDep: 5,
      strategic: 3, volatility: 5, composite: 46.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction'],
      chinaShare: 60,
      topSupplier: 'China (60% mining, 70–80% refining)',
      annualDemand: '~110,000 t',
      keyFact: 'China banned all antimony exports to the USA in December 2024. Prices nearly doubled in 4 months.',
    }
  },
  {
    name: 'Zirconium',
    symbol: 'Zr',
    scores: {
      demand: 5, growth: 3, miningDiv: 1, refiningDiv: 5,
      resTime: 2, resDiv: 5, endUseComp: 6, substitutability: 4,
      recyclability: 5, extraction: 2, projects: 2, importDep: 3,
      strategic: 3, volatility: 4, composite: 45.5
    },
    meta: {
      sectors: ['energy', 'defense', 'semiconductors', 'construction', 'healthcare'],
      chinaShare: 8,
      topSupplier: 'Australia (33%)',
      annualDemand: '~1.6 million t',
      keyFact: 'India paradox: 21% of world ilmenite reserves but 80% import-dependent for processed zirconium.',
    }
  },
  {
    name: 'Bismuth',
    symbol: 'Bi',
    scores: {
      demand: 2, growth: 3, miningDiv: 4, refiningDiv: 4,
      resTime: 4, resDiv: 1.5, endUseComp: 6, substitutability: 2,
      recyclability: 4, extraction: 2, projects: 3, importDep: 5,
      strategic: 3, volatility: 4, composite: 48.5
    },
    meta: {
      sectors: ['healthcare', 'defense', 'construction', 'semiconductors'],
      chinaShare: 81,
      topSupplier: 'China (81% refining)',
      annualDemand: '~20,000 t',
      keyFact: 'India has 85.6% Chinese import dependency. Only 2 mines globally ever produced bismuth as a primary product.',
    }
  },
  {
    name: 'Cobalt',
    symbol: 'Co',
    scores: {
      demand: 4, growth: 4, miningDiv: 5, refiningDiv: 3,
      resTime: 3, resDiv: 1.5, endUseComp: 4, substitutability: 2,
      recyclability: 2, extraction: 3, projects: 2, importDep: 5,
      strategic: 2, volatility: 5, composite: 46.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 80,
      topSupplier: 'DRC (76% mining) + China (80% refining)',
      annualDemand: '~200,000 t',
      keyFact: 'DRC initiated export ban Feb 2025. KABIL has mandate. DoD stockpiling $500M in cobalt.',
    }
  },
  {
    name: 'Copper',
    symbol: 'Cu',
    scores: {
      demand: 5, growth: 5, miningDiv: 1, refiningDiv: 2,
      resTime: 4, resDiv: 1, endUseComp: 8, substitutability: 1,
      recyclability: 1, extraction: 1, projects: 4, importDep: 5,
      strategic: 2, volatility: 5, composite: 46
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction', 'healthcare', 'agriculture'],
      chinaShare: 44,
      topSupplier: 'Chile (23% mining) + China (44% refining)',
      annualDemand: '~26 million t',
      keyFact: 'S&P Global projects 50% demand increase by 2040. Mine supply projected to peak in 2030.',
    }
  },
  {
    name: 'Germanium',
    symbol: 'Ge',
    scores: {
      demand: 1, growth: 4, miningDiv: 4, refiningDiv: 5,
      resTime: 1, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 51
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70–80%)',
      annualDemand: '~30–40 t',
      keyFact: 'China banned ALL germanium exports to the US in December 2024. Prices nearly doubled post-export licensing.',
    }
  },
  {
    name: 'Rhenium',
    symbol: 'Re',
    scores: {
      demand: 1, growth: 4, miningDiv: 2, refiningDiv: 2,
      resTime: 3.5, resDiv: 1, endUseComp: 6, substitutability: 3,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 3, composite: 42.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'semiconductors'],
      chinaShare: 9,
      topSupplier: 'Chile (47%)',
      annualDemand: '~50–60 t',
      keyFact: 'Only ~15–20 facilities globally can produce it. No dedicated rhenium mines — 100% byproduct of copper-molybdenum smelting.',
    }
  },
  {
    name: 'Tantalum',
    symbol: 'Ta',
    scores: {
      demand: 2, growth: 4, miningDiv: 1, refiningDiv: 3,
      resTime: 4.5, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 2, projects: 5, importDep: 5,
      strategic: 3, volatility: 2, composite: 43
    },
    meta: {
      sectors: ['semiconductors', 'defense', 'electrification', 'healthcare'],
      chinaShare: 43,
      topSupplier: 'DRC (42%)',
      annualDemand: '~2,100 t',
      keyFact: 'DRC+Rwanda together at ~59% of mining — conflict minerals zone. US DoD stockpiling $100M in tantalum.',
    }
  },
  {
    name: 'Phosphorous',
    symbol: 'P',
    scores: {
      demand: 5, growth: 4, miningDiv: 1, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 10, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 2, importDep: 5,
      strategic: 3, volatility: 3, composite: 50
    },
    meta: {
      sectors: ['agriculture', 'energy', 'defense', 'electrification', 'healthcare'],
      chinaShare: 46,
      topSupplier: 'China (46%) + Morocco (67% of reserves)',
      annualDemand: '~47 million t',
      keyFact: 'Morocco holds 67.6% of world phosphate reserves. Phosphorus is the ONLY major nutrient that cannot be synthetically created.',
    }
  },
  {
    name: 'Potash',
    symbol: 'K',
    scores: {
      demand: 5, growth: 4, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 2, endUseComp: 10, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 3, importDep: 5,
      strategic: 3, volatility: 3, composite: 46.5
    },
    meta: {
      sectors: ['agriculture', 'energy', 'defense', 'healthcare'],
      chinaShare: 13,
      topSupplier: 'Canada (31%)',
      annualDemand: '~45 million t',
      keyFact: 'India is 100% import-dependent with no domestic reserves. Russia+Belarus together = ~34% of supply.',
    }
  },
  {
    name: 'Gallium',
    symbol: 'Ga',
    scores: {
      demand: 2, growth: 5, miningDiv: 5, refiningDiv: 3,
      resTime: 1, resDiv: 2.5, endUseComp: 6, substitutability: 4,
      recyclability: 4, extraction: 2, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 53.5
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'electrification', 'healthcare'],
      chinaShare: 99,
      topSupplier: 'China (~99%)',
      annualDemand: '~800 t',
      keyFact: 'China banned ALL gallium exports to the USA in December 2024. China controls 99% of primary production.',
    }
  },
  {
    name: 'Molybdenum',
    symbol: 'Mo',
    scores: {
      demand: 4, growth: 3, miningDiv: 2, refiningDiv: 2,
      resTime: 3, resDiv: 2, endUseComp: 5, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 2, importDep: 5,
      strategic: 3, volatility: 4, composite: 43.5
    },
    meta: {
      sectors: ['defense', 'energy', 'construction', 'electrification', 'healthcare', 'semiconductors'],
      chinaShare: 42,
      topSupplier: 'China (42%)',
      annualDemand: '~260,000 t',
      keyFact: 'MOFCOM explicitly banned molybdenum exports to US. Mo-99 medical isotope (most used in nuclear medicine) depends on it.',
    }
  },
  {
    name: 'Tin',
    symbol: 'Sn',
    scores: {
      demand: 4, growth: 4, miningDiv: 5, refiningDiv: 1,
      resTime: 5, resDiv: 2, endUseComp: 5, substitutability: 2,
      recyclability: 2, extraction: 1, projects: 3, importDep: 5,
      strategic: 3, volatility: 5, composite: 44
    },
    meta: {
      sectors: ['semiconductors', 'construction', 'electrification', 'defense', 'healthcare'],
      chinaShare: 50,
      topSupplier: 'China (23% mining, 50% smelting)',
      annualDemand: '~380,000 t',
      keyFact: 'Myanmar supply halt in 2023 caused 46% LME price spike. Only 14 years of known reserves at current consumption.',
    }
  },
  {
    name: 'Nickel',
    symbol: 'Ni',
    scores: {
      demand: 5, growth: 3, miningDiv: 3, refiningDiv: 2,
      resTime: 3, resDiv: 2, endUseComp: 3, substitutability: 4,
      recyclability: 1, extraction: 2, projects: 5, importDep: 4,
      strategic: 2, volatility: 5, composite: 46.5
    },
    meta: {
      sectors: ['construction', 'defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 3,
      topSupplier: 'Indonesia (59.5%)',
      annualDemand: '~3.2 million t',
      keyFact: 'Chinese firms control ~75% of Indonesian nickel refining. LFP batteries (zero nickel) now >50% of Chinese EV market.',
    }
  },
  {
    name: 'Vanadium',
    symbol: 'V',
    scores: {
      demand: 3, growth: 4, miningDiv: 5, refiningDiv: 3,
      resTime: 1, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 3, extraction: 2, projects: 3, importDep: 3,
      strategic: 3, volatility: 3, composite: 45
    },
    meta: {
      sectors: ['defense', 'energy', 'construction', 'electrification'],
      chinaShare: 70,
      topSupplier: 'China (70%)',
      annualDemand: '~100,000 t',
      keyFact: 'Vanadium redox flow batteries could be transformative for grid storage. Price fell 27% in 2024 due to weak Chinese steel demand.',
    }
  },
  {
    name: 'Lithium',
    symbol: 'Li',
    scores: {
      demand: 4, growth: 5, miningDiv: 2, refiningDiv: 4,
      resTime: 1, resDiv: 1.5, endUseComp: 6, substitutability: 3,
      recyclability: 4, extraction: 2, projects: 5, importDep: 5,
      strategic: 2, volatility: 5, composite: 50.5
    },
    meta: {
      sectors: ['energy', 'electrification', 'defense', 'healthcare'],
      chinaShare: 17,
      topSupplier: 'Australia (36.7% mining) + China (65–75% refining)',
      annualDemand: '~170,000 t',
      keyFact: 'Price went +604% (2020→2022 peak) then -82% (2022→2024). KABIL signed $24M Argentina exploration deal.',
    }
  },
  {
    name: 'Terbium',
    symbol: 'Tb',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 5,
      resTime: 5, resDiv: 1.5, endUseComp: 8, substitutability: 5,
      recyclability: 5, extraction: 5, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 61.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70% mining, >90% HREE refining)',
      annualDemand: '~400–600 t',
      keyFact: 'April 2025 Chinese export controls triggered emergency response. Western market prices tripled within weeks. No non-Chinese commercial HREE separation exists.',
    }
  },
  {
    name: 'Yttrium',
    symbol: 'Y',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 4,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 5,
      recyclability: 5, extraction: 4, projects: 4, importDep: 5,
      strategic: 3, volatility: 5, composite: 56
    },
    meta: {
      sectors: ['energy', 'defense', 'healthcare', 'construction'],
      chinaShare: 94,
      topSupplier: 'China (94%)',
      annualDemand: '~15,000 t',
      keyFact: '97–94% of US yttrium imports from China. April 2025 export controls caused Western prices to triple. YSZ thermal barrier coatings in all jet engines.',
    }
  },
  {
    name: 'Dysprosium',
    symbol: 'Dy',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 5,
      resTime: 5, resDiv: 1.5, endUseComp: 8, substitutability: 5,
      recyclability: 5, extraction: 4, projects: 5, importDep: 5,
      strategic: 3, volatility: 5, composite: 61.5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70% mining, >90% HREE refining)',
      annualDemand: '~2,500 t',
      keyFact: 'April 2025 Chinese export controls caused Western dysprosium prices to triple. No commercial recycling exists today.',
    }
  },
  {
    name: 'Hafnium',
    symbol: 'Hf',
    scores: {
      demand: 1, growth: 3, miningDiv: 1, refiningDiv: 5,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 3,
      recyclability: 4, extraction: 5, projects: 3, importDep: 5,
      strategic: 3, volatility: 5, composite: 38.5
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'construction'],
      chinaShare: 21,
      topSupplier: 'France (Framatome ~50%)',
      annualDemand: '~100 t',
      keyFact: 'Every Intel/TSMC/Samsung chip since 45nm uses hafnium oxide. Zr:Hf separation is one of the hardest separations in metallurgy.',
    }
  },
  {
    name: 'Selenium',
    symbol: 'Se',
    scores: {
      demand: 2, growth: 3, miningDiv: 1, refiningDiv: 2,
      resTime: 4.5, resDiv: 1.5, endUseComp: 6, substitutability: 2,
      recyclability: 4, extraction: 3, projects: 3, importDep: 4,
      strategic: 3, volatility: 3, composite: 41
    },
    meta: {
      sectors: ['energy', 'healthcare', 'agriculture', 'construction'],
      chinaShare: 49,
      topSupplier: 'China (49%)',
      annualDemand: '~3,600 t',
      keyFact: 'India\'s sole producer is Hindalco at Dahej (14 t/year). No exchange trading; market is opaque.',
    }
  },
  {
    name: 'PGMs',
    symbol: 'Pt/Pd',
    scores: {
      demand: 1, growth: 1, miningDiv: 2, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 5, substitutability: 3,
      recyclability: 1, extraction: 4, projects: 2, importDep: 5,
      strategic: 3, volatility: 5, composite: 35.8
    },
    meta: {
      sectors: ['electrification', 'energy', 'semiconductors', 'healthcare', 'defense', 'construction'],
      chinaShare: 5,
      topSupplier: 'South Africa (53%)',
      annualDemand: '~400 t (Pt+Pd)',
      keyFact: 'Palladium and rhodium saw >500% price swings. Russia (Nornickel) supplies ~26% of global PGMs.',
    }
  },
  {
    name: 'Cadmium',
    symbol: 'Cd',
    scores: {
      demand: 2, growth: 2, miningDiv: 4, refiningDiv: 4,
      resTime: 4.5, resDiv: 2, endUseComp: 4, substitutability: 2,
      recyclability: 2, extraction: 1, projects: 4, importDep: 5,
      strategic: 3, volatility: 3, composite: 39
    },
    meta: {
      sectors: ['energy', 'semiconductors', 'defense', 'construction'],
      chinaShare: 35,
      topSupplier: 'China (~35%)',
      annualDemand: '~27,000 t',
      keyFact: 'CdTe solar cells are driving new demand. India imports ~11,400 tons/year — massive global hub for cadmium consumption.',
    }
  },
  {
    name: 'Cerium',
    symbol: 'Ce',
    scores: {
      demand: 4, growth: 2, miningDiv: 1, refiningDiv: 1,
      resTime: 1, resDiv: 1, endUseComp: 4, substitutability: 2,
      recyclability: 5, extraction: 1, projects: 2, importDep: 2,
      strategic: 3, volatility: 1, composite: 30.8
    },
    meta: {
      sectors: ['construction', 'electrification', 'healthcare', 'semiconductors'],
      chinaShare: 70,
      topSupplier: 'China (~70%)',
      annualDemand: '~75,000 t',
      keyFact: 'Chronic oversupply because cerium makes up ~50% of all rare earth ore. India has world\'s 3rd largest rare earth reserves.',
    }
  },
  {
    name: 'Lanthanum',
    symbol: 'La',
    scores: {
      demand: 3, growth: 2, miningDiv: 1, refiningDiv: 1,
      resTime: 1, resDiv: 1, endUseComp: 5, substitutability: 2,
      recyclability: 5, extraction: 2, projects: 2, importDep: 2,
      strategic: 3, volatility: 1, composite: 32
    },
    meta: {
      sectors: ['energy', 'electrification', 'healthcare', 'construction', 'semiconductors'],
      chinaShare: 70,
      topSupplier: 'China (~70%)',
      annualDemand: '~40,000 t',
      keyFact: 'Used in oil refinery catalysts (50% of demand) and NiMH batteries. Structural oversupply from co-mining with more valuable REEs.',
    }
  },
];

// Sector definitions for filtering
window.ALL_SECTORS = ['defense', 'energy', 'semiconductors', 'electrification', 'healthcare', 'agriculture', 'construction'];

// Preset weight configurations for the weight customizer
window.WEIGHT_PRESETS = {
  equal: {
    label: 'Equal Weight',
    weights: { demand: 50, growth: 50, supplyConc: 50, reserveRisk: 50, endUseComp: 50, subRisk: 50, extraction: 50, projects: 50, indiaVuln: 50, volatility: 50 }
  },
  indiaFocus: {
    label: 'India Focus',
    weights: { demand: 40, growth: 60, supplyConc: 70, reserveRisk: 50, endUseComp: 80, subRisk: 60, extraction: 40, projects: 70, indiaVuln: 100, volatility: 50 }
  },
  supplySecure: {
    label: 'Supply Security',
    weights: { demand: 30, growth: 50, supplyConc: 100, reserveRisk: 80, endUseComp: 60, subRisk: 70, extraction: 50, projects: 80, indiaVuln: 60, volatility: 40 }
  },
  demandShock: {
    label: 'Demand Shock',
    weights: { demand: 80, growth: 100, supplyConc: 50, reserveRisk: 40, endUseComp: 90, subRisk: 60, extraction: 30, projects: 70, indiaVuln: 50, volatility: 80 }
  }
};
