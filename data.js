// CRITICAL MINERALS DATA
// Each mineral has: name, symbol, scores (14 dimensions), meta, description
//
// DIMENSION KEYS (higher = more risky):
//   demand         – current demand level (1-5)
//   growth         – demand growth trajectory (1-5)
//   miningDiv      – mining concentration (1-5)
//   refiningDiv    – refining concentration (1-5)
//   resTime        – reserve lifetime risk (1-6, shorter life = higher score)
//   resDiv         – reserve geographic concentration (1-5)
//   endUseComp     – end-use criticality (1-10)
//   substitutability – how hard to substitute (1-5)
//   recyclability  – recycling difficulty (1-5)
//   extraction     – extraction/processing complexity (1-5)
//   projects       – pipeline scarcity (1-5)
//   importDep      – India import dependence (1-5)
//   strategic      – India strategic posture risk (1-3)
//   volatility     – price volatility (1-5)

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
  strategic:        { label: 'India Strategic Posture', description: 'India strategic response quality', min: 1, max: 5, higherMeans: 'Weaker strategic posture' },
  volatility:       { label: 'Price Volatility',        description: 'Historical and expected price swings', min: 1, max: 5, higherMeans: 'More volatile prices' },
};

// 14-vector radar definition — normalized to 0-5 for display
window.RADAR_14 = [
  { key: 'demand',           label: 'Current\nDemand',    max: 5  },
  { key: 'growth',           label: 'Demand\nGrowth',     max: 5  },
  { key: 'miningDiv',        label: 'Mining\nConc.',      max: 5  },
  { key: 'refiningDiv',      label: 'Refining\nConc.',    max: 5  },
  { key: 'resTime',          label: 'Reserve\nLife Risk', max: 6  },
  { key: 'resDiv',           label: 'Reserve\nGeog.',     max: 5  },
  { key: 'endUseComp',       label: 'End-Use\nScope',     max: 10 },
  { key: 'substitutability', label: 'Substitution\nRisk', max: 5  },
  { key: 'recyclability',    label: 'Recycling\nGap',     max: 5  },
  { key: 'extraction',       label: 'Process\nComplex.',  max: 5  },
  { key: 'projects',         label: 'Pipeline\nGap',      max: 5  },
  { key: 'importDep',        label: 'Import\nDepend.',    max: 5  },
  { key: 'strategic',        label: 'Strategic\nRisk',    max: 5  },
  { key: 'volatility',       label: 'Price\nVolatility',  max: 5  },
];

window.MINERALS = [
  {
    name: 'Beryllium',
    symbol: 'Be',
    scores: {
      demand: 1, growth: 3, miningDiv: 3, refiningDiv: 4,
      resTime: 6, resDiv: 2.5, endUseComp: 6, substitutability: 4,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'healthcare'],
      chinaShare: 21,
      topSupplier: 'USA (Materion)',
      annualDemandTons: 430,
      annualDemand: '~430 t',
      keyFact: 'Only 3 countries can process. Materion is sole Western integrated producer.',
    },
    description: {
      supply: "USA's Materion is the sole Western integrated producer, controlling ~50-70% of global refining. China (21% mining) and Kazakhstan are the only other processors.",
      reserves: "Reserves exceed 100,000 metric tons, enough for 230+ years at current consumption. 60% of identified resources are in the United States.",
      india: "India has zero domestic production and is 100% import-dependent. Beryllium is on India's 30 Critical Minerals list and flagged for strategic stockpiling.",
      priceContext: "Price rose 140% in 4 years (2020–2024). Market is extremely thin with no exchange trading — all bilateral contracts through Materion."
    }
  },
  {
    name: 'Indium',
    symbol: 'In',
    scores: {
      demand: 2, growth: 4, miningDiv: 4, refiningDiv: 4,
      resTime: 5.5, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 3, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 4
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'healthcare', 'construction'],
      chinaShare: 70,
      topSupplier: 'China (70%)',
      annualDemandTons: 1080,
      annualDemand: '~1,080 t',
      keyFact: 'No primary mines — 100% byproduct of zinc smelting. China imposed export controls.',
    },
    description: {
      supply: "China produces ~70% of global refined indium, exclusively as a byproduct of zinc smelting. China imposed export controls; no dedicated indium mines exist globally.",
      reserves: "Reserves are functionally tied to zinc deposits. Effective supply constrained by zinc smelter infrastructure, not geology. 30–50 year runway at current rates.",
      india: "India has no commercial indium production. The Semiconductor Mission implicitly depends on indium (InP substrates) but no supply security action taken.",
      priceContext: "US price jumped from $265/kg to $420/kg within 6 months of 2024 (+58% intra-year). Chinese export controls tightened feedstock availability."
    }
  },
  {
    name: 'Niobium',
    symbol: 'Nb',
    scores: {
      demand: 4, growth: 3, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 6, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 2, importDep: 5,
      strategic: 3, volatility: 1
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction'],
      chinaShare: 0,
      topSupplier: 'Brazil/CBMM (92%)',
      annualDemandTons: 110000,
      annualDemand: '~110,000 t',
      keyFact: "CBMM (Brazil) operates world's largest mine and dominates global supply. Prices managed as near-monopoly.",
    },
    description: {
      supply: "Brazil's CBMM controls ~92% of global mining from a single mine at Araxá. Canada is a distant second at 6.5%. No other country exceeds 2%.",
      reserves: "Reserves exceed 19 million tonnes — over 200 years of supply. Brazil holds 94% of known reserves, an extreme geographic concentration.",
      india: "India has no niobium resources or production. Niobium-bearing minerals were recently delisted from atomic minerals to allow private exploration, but no KABIL mandate exists.",
      priceContext: "CBMM manages supply as a near-monopoly, keeping prices stable (~$26/kg in 2024, up only 24% over 4 years). Unusual stability for a critical mineral."
    }
  },
  {
    name: 'Titanium',
    symbol: 'Ti',
    scores: {
      demand: 5, growth: 3, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 1, extraction: 2, projects: 2, importDep: 2,
      strategic: 3, volatility: 2
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction', 'healthcare'],
      chinaShare: 35,
      topSupplier: 'China (sponge ~65%)',
      annualDemandTons: 6500000,
      annualDemand: '~6–7 million t',
      keyFact: 'India owns 21% of world ilmenite reserves but imports 50%+ of processed titanium from China.',
    },
    description: {
      supply: "Mining is moderately diversified (China ~33%, Mozambique, South Africa, Australia). However, for titanium metal sponge — the strategic aerospace product — China controls 60–70%.",
      reserves: "Reserves exceed 750 million tonnes TiO₂ — effectively inexhaustible at 100+ years. Well-distributed across Australia (31%), India (21%), China (28%).",
      india: "India paradox: holds 21% of world ilmenite reserves yet imports 50%+ of processed titanium from China. Small KMML sponge plant serves ISRO but commercial-scale production is absent.",
      priceContext: "TiO₂ pigment prices are stable. Titanium metal (sponge) is more volatile, tied to aerospace cycles and China's Kroll process dominance."
    }
  },
  {
    name: 'Graphite',
    symbol: 'C',
    scores: {
      demand: 5, growth: 5, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 2, endUseComp: 7, substitutability: 3,
      recyclability: 4, extraction: 2, projects: 3, importDep: 2,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction'],
      chinaShare: 78,
      topSupplier: 'China (78% mining, 90% refining)',
      annualDemandTons: 1600000,
      annualDemand: '~1.6 million t',
      keyFact: 'China imposed export controls. Battery-grade spherical graphite: China controls ~90% of refining.',
    },
    description: {
      supply: "China produces 78% of global graphite and controls ~90% of battery-grade spherical graphite refining. Even African mines ship concentrate to China for processing.",
      reserves: "Reserves of 330 million tonnes — ~178 years at current production. Reserves moderately distributed: China (28%), Brazil (26%), Mozambique (9%), Madagascar (9%).",
      india: "India ranks 6th globally (27,800 t in 2024) with 8.6 million t in reserves, but no commercial-scale battery-grade processing. 42.4% import dependency on Chinese graphite.",
      priceContext: "China's export controls and the EV battery boom drove demand. Synthetic graphite from China competes, dampening natural graphite prices somewhat."
    }
  },
  {
    name: 'Tellurium',
    symbol: 'Te',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 4,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 4,
      recyclability: 5, extraction: 4, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['energy', 'defense', 'semiconductors', 'construction'],
      chinaShare: 75,
      topSupplier: 'China (75–80%)',
      annualDemandTons: 640,
      annualDemand: '~640 t',
      keyFact: "Byproduct of copper refining. China's Feb 2025 export controls caused 84% price rise in Europe.",
    },
    description: {
      supply: "Tellurium has no primary mines — 100% byproduct of copper refining. China controls ~75–80% of global refined output. February 2025 export controls caused 84% price jump in Europe.",
      reserves: "Known reserves: ~38,000 tonnes, about 50 years at current rates. Supply growth entirely dependent on copper refinery expansion with tellurium recovery circuits.",
      india: "India has zero domestic tellurium production. 48.8% average import dependency on China specifically. India's 500 GW solar target creates urgent CdTe solar supply concern.",
      priceContext: "Prices rose 60% in US and 84% in Europe in 2025 alone after China's February 2025 export licensing. Classic example of supply weaponization causing immediate price shock."
    }
  },
  {
    name: 'Strontium',
    symbol: 'Sr',
    scores: {
      demand: 4, growth: 2, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 1, endUseComp: 7, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 3, importDep: 2,
      strategic: 3, volatility: 2
    },
    meta: {
      sectors: ['defense', 'healthcare', 'construction'],
      chinaShare: 35,
      topSupplier: 'China & Mexico (~65%)',
      annualDemandTons: 500000,
      annualDemand: '~500,000 t',
      keyFact: 'Reserves could last thousands of years. Challenge is processing concentration, not scarcity.',
    },
    description: {
      supply: "China (~35%) and Mexico (~30–35%) together account for ~65% of global celestite production. Germany dominates strontium carbonate processing for the EU market.",
      reserves: "World resources may exceed 1 billion tons — thousands of years of supply. The challenge is processing concentration (China+Germany), not geological scarcity.",
      india: "India has no commercial strontium production. Imports carbonate and nitrate compounds from Germany and Mexico for pyrotechnics and ferrite magnets.",
      priceContext: "Celestine traded at $82/tonne in 2023, rising to ~$390/tonne in 2024 due to temporary supply tightness. Generally a low-value bulk commodity."
    }
  },
  {
    name: 'Silicon',
    symbol: 'Si',
    scores: {
      demand: 5, growth: 5, miningDiv: 5, refiningDiv: 5,
      resTime: 1, resDiv: 1, endUseComp: 8, substitutability: 4,
      recyclability: 5, extraction: 2, projects: 3, importDep: 4,
      strategic: 2, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction', 'healthcare', 'agriculture'],
      chinaShare: 80,
      topSupplier: 'China (~80%)',
      annualDemandTons: 9700000,
      annualDemand: '~9.7 million t',
      keyFact: 'China explicitly listed as national security concern. 85–90% of semiconductor/solar grade polysilicon is Chinese.',
    },
    description: {
      supply: "China produces ~80% of total global silicon (metals + ferrosilicon). For semiconductor and solar polysilicon, China's share reaches 85–90%. Explicitly listed as a US national security concern.",
      reserves: "Silica is the second most abundant element in the Earth's crust — effectively limitless geological supply. The constraint is energy for processing, not geology.",
      india: "India produces metallurgical silicon (~59 kt ferrosilicon) but is essentially 100% import-dependent for strategic polysilicon (~76% from China). No commercial polysilicon production.",
      priceContext: "Silicon metal prices went from 97 cents/lb (2020) to 361 cents/lb (2022, +273%) then crashed to ~180 cents/lb (2024). Driven by Chinese energy rationing in 2022."
    }
  },
  {
    name: 'Tungsten',
    symbol: 'W',
    scores: {
      demand: 3, growth: 3, miningDiv: 5, refiningDiv: 5,
      resTime: 3, resDiv: 2, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 2, projects: 2, importDep: 3,
      strategic: 3, volatility: 4
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction', 'healthcare'],
      chinaShare: 83,
      topSupplier: 'China (83%)',
      annualDemandTons: 81000,
      annualDemand: '~81,000 t',
      keyFact: 'China imposed export restrictions. Among highest production concentration of any strategic mineral.',
    },
    description: {
      supply: "China produces 83% of global tungsten — among the highest mining concentration of any strategic mineral. China also dominates ammonium paratungstate (APT) processing.",
      reserves: "China holds ~52% of 4.6 million tonne global reserves. At 81,000 t/year consumption, reserves last ~57 years. Resources are much larger and geographically widespread.",
      india: "India has limited resources in Rajasthan and Andhra Pradesh but is essentially 100% import-dependent. No KABIL mandate; no domestic APT refinery planned.",
      priceContext: "APT price rose 48% year-on-year in early 2025. US imposed 25% tariffs on Chinese tungsten carbides in September 2024. No LME listing; opaque bilateral pricing."
    }
  },
  {
    name: 'Antimony',
    symbol: 'Sb',
    scores: {
      demand: 3, growth: 4, miningDiv: 4, refiningDiv: 3,
      resTime: 4, resDiv: 1.5, endUseComp: 4, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 3, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'construction'],
      chinaShare: 60,
      topSupplier: 'China (60% mining, 70–80% refining)',
      annualDemandTons: 110000,
      annualDemand: '~110,000 t',
      keyFact: 'China banned all antimony exports to the USA in December 2024. Prices nearly doubled in 4 months.',
    },
    description: {
      supply: "China produced 60% of global antimony mining in 2024 but controls 70–80% of refining. China banned all antimony exports to the USA in December 2024.",
      reserves: "World reserves >2 million tonnes — 20 years from current reserves, 50–100 years including resources in Australia, Bolivia, Russia, and the US.",
      india: "India appears as a US import source (10% of US ore/concentrate), suggesting some processing capacity. No major domestic mines. Listed on 30 Critical Minerals list.",
      priceContext: "Antimony metal nearly doubled from $8.91/lb to $17.50/lb in 4 months (Jul–Nov 2024) after China's export licensing. Then full export ban to the US in December 2024."
    }
  },
  {
    name: 'Zirconium',
    symbol: 'Zr',
    scores: {
      demand: 5, growth: 3, miningDiv: 1, refiningDiv: 5,
      resTime: 2, resDiv: 5, endUseComp: 6, substitutability: 4,
      recyclability: 5, extraction: 2, projects: 2, importDep: 3,
      strategic: 3, volatility: 4
    },
    meta: {
      sectors: ['energy', 'defense', 'semiconductors', 'construction', 'healthcare'],
      chinaShare: 8,
      topSupplier: 'Australia (33%)',
      annualDemandTons: 1600000,
      annualDemand: '~1.6 million t',
      keyFact: 'India paradox: 21% of world ilmenite reserves but 80% import-dependent for processed zirconium.',
    },
    description: {
      supply: "Mining is well-diversified: Australia (33%), South Africa (20%), Mozambique (11%). However, for nuclear-grade Zircaloy, China supplied 88% of US unwrought zirconium imports (2020–23).",
      reserves: "World reserves exceed 70 million tonnes ZrO₂ — ~72 years at current production. Australia holds 79% of known reserves, a significant geographic concentration.",
      india: "India has significant zircon resources in coastal sands (IREL operations) and produces some Zircaloy for nuclear reactors at NFC/DAE. But 80% of processed zirconium is still imported.",
      priceContext: "Zircon price more than doubled to over $2,000/tonne in 2022–23 due to supply deficit. The Zr/Hf separation is one of the hardest separations in metallurgy, limiting processors."
    }
  },
  {
    name: 'Bismuth',
    symbol: 'Bi',
    scores: {
      demand: 2, growth: 3, miningDiv: 4, refiningDiv: 4,
      resTime: 4, resDiv: 1.5, endUseComp: 6, substitutability: 2,
      recyclability: 4, extraction: 2, projects: 3, importDep: 5,
      strategic: 3, volatility: 4
    },
    meta: {
      sectors: ['healthcare', 'defense', 'construction', 'semiconductors'],
      chinaShare: 81,
      topSupplier: 'China (81% refining)',
      annualDemandTons: 20000,
      annualDemand: '~20,000 t',
      keyFact: 'India has 85.6% Chinese import dependency. Only 2 mines globally ever produced bismuth as a primary product.',
    },
    description: {
      supply: "China produces 81% of global refined bismuth, as a byproduct of lead and tungsten processing. Only 2 mines globally have ever produced bismuth as a primary product.",
      reserves: "World reserves ~320,000–350,000 tonnes. At 21,000 t/year consumption, fewer than 20 years from current reserves. Entirely a byproduct of lead and tungsten mining.",
      india: "India has 85.6% Chinese import dependency for bismuth. No domestic production. Listed on 30 Critical Minerals list primarily due to pharmaceutical use (Pepto-Bismol equivalent).",
      priceContext: "Bismuth prices spiked above $10/lb in late 2024 on Chinese export restriction news — highest in a decade. Price had been $2.50–3.50/lb in 2018–2020."
    }
  },
  {
    name: 'Cobalt',
    symbol: 'Co',
    scores: {
      demand: 4, growth: 4, miningDiv: 5, refiningDiv: 3,
      resTime: 3, resDiv: 1.5, endUseComp: 4, substitutability: 2,
      recyclability: 2, extraction: 3, projects: 2, importDep: 5,
      strategic: 2, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 80,
      topSupplier: 'DRC (76% mining) + China (80% refining)',
      annualDemandTons: 200000,
      annualDemand: '~200,000 t',
      keyFact: 'DRC initiated export ban Feb 2025. KABIL has mandate. DoD stockpiling $500M in cobalt.',
    },
    description: {
      supply: "DRC produced 76% of global cobalt in 2024. China's CMOC is a key DRC operator, and China processes ~80% of global refined cobalt. DRC initiated an export ban in February 2025.",
      reserves: "World cobalt reserves ~11 million tonnes; DRC holds 55%. At ~290,000 t/year, reserves last ~38 years. Indonesia is rapidly growing as a secondary source via HPAL.",
      india: "India is 100% import-dependent. KABIL explicitly mandates cobalt alongside lithium and REEs. KABIL Australia MoU (2022) includes cobalt. DoD stockpiling $500M in cobalt.",
      priceContext: "Cobalt prices extremely volatile — boomed above $90,000/tonne then crashed below $30,000/tonne. LFP batteries (zero cobalt) are structurally reducing demand growth expectations."
    }
  },
  {
    name: 'Copper',
    symbol: 'Cu',
    scores: {
      demand: 5, growth: 5, miningDiv: 1, refiningDiv: 2,
      resTime: 4, resDiv: 1, endUseComp: 8, substitutability: 1,
      recyclability: 1, extraction: 1, projects: 4, importDep: 5,
      strategic: 2, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'semiconductors', 'electrification', 'construction', 'healthcare', 'agriculture'],
      chinaShare: 44,
      topSupplier: 'Chile (23% mining) + China (44% refining)',
      annualDemandTons: 26000000,
      annualDemand: '~26 million t',
      keyFact: 'S&P Global projects 50% demand increase by 2040. Mine supply projected to peak in 2030.',
    },
    description: {
      supply: "Mining is relatively diversified: Chile (23%), DRC (14%), Peru (11%). However, China smelts ~44% of global refined copper, rising toward 50%. UNCTAD: China imports 60% of global copper ore.",
      reserves: "1 billion tonnes in known reserves at 38-year runway, with ~4 billion tonnes in total resources. Supply gap is real — S&P Global projects mine supply peaks in 2030 then declines.",
      india: "India imports >90% of copper concentrates. Vedanta's Sterlite closure in 2018 eliminated 40% of India's refining capacity. JSW and Adani building new capacity; HCL tripling mine output.",
      priceContext: "Copper hit an all-time high of $13,240/tonne on LME in January 2026 (+40% in 2025). Trump's 50% copper tariff threat in 2025 created the largest-ever CME-LME price spread."
    }
  },
  {
    name: 'Germanium',
    symbol: 'Ge',
    scores: {
      demand: 1, growth: 4, miningDiv: 4, refiningDiv: 5,
      resTime: 1, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70–80%)',
      annualDemandTons: 35,
      annualDemand: '~30–40 t',
      keyFact: 'China banned ALL germanium exports to the US in December 2024. Prices nearly doubled post-export licensing.',
    },
    description: {
      supply: "China produces 70–80% of global refined germanium. In December 2024, China banned ALL germanium exports to the USA — the most severe export control for any mineral.",
      reserves: "Germanium doesn't form standalone deposits; it occurs at <0.1% in zinc and coal ores. Identified resources within zinc deposits alone are estimated at 250+ years at current consumption.",
      india: "India has zero domestic germanium production. No zinc smelter with germanium recovery circuits. Semiconductor Mission and Gaganyaan space programme both require germanium but no supply agreements.",
      priceContext: "Prices nearly doubled post-export licensing — from ~$1,290/kg to $2,800–3,000/kg in early 2024. Then the December 2024 complete ban to the US represents an unprecedented supply action."
    }
  },
  {
    name: 'Rhenium',
    symbol: 'Re',
    scores: {
      demand: 1, growth: 4, miningDiv: 2, refiningDiv: 2,
      resTime: 3.5, resDiv: 1, endUseComp: 6, substitutability: 3,
      recyclability: 2, extraction: 3, projects: 5, importDep: 5,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'semiconductors'],
      chinaShare: 9,
      topSupplier: 'Chile (47%)',
      annualDemandTons: 55,
      annualDemand: '~50–60 t',
      keyFact: 'Only ~15–20 facilities globally can produce it. No dedicated rhenium mines — 100% byproduct of copper-molybdenum smelting.',
    },
    description: {
      supply: "Chile produces ~47% of global rhenium, exclusively as a byproduct of molybdenum roasting at copper-molybdenum mines. USA (15%), Poland (15%), and Uzbekistan (8%) are other major sources.",
      reserves: "World reserves are large, lasting 25–100+ years. Geographic distribution is better than most critical minerals: Chile (46%), USA (14%), Russia (11%), Kazakhstan (7%). No Chinese dominance.",
      india: "India is 100% import-dependent with no copper-molybdenum mines. Rhenium is critical for Tejas/Kaveri fighter jet engine superalloys but no KABIL mandate exists.",
      priceContext: "Rhenium is relatively stable vs. other critical minerals (no Chinese dominance). Price rose from $1,030/kg (2020) to $1,370/kg (2024, +33%). Within 2024, APR price jumped 38% year-on-year."
    }
  },
  {
    name: 'Tantalum',
    symbol: 'Ta',
    scores: {
      demand: 2, growth: 4, miningDiv: 1, refiningDiv: 3,
      resTime: 4.5, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 2, extraction: 2, projects: 5, importDep: 5,
      strategic: 3, volatility: 2
    },
    meta: {
      sectors: ['semiconductors', 'defense', 'electrification', 'healthcare'],
      chinaShare: 43,
      topSupplier: 'DRC (42%)',
      annualDemandTons: 2100,
      annualDemand: '~2,100 t',
      keyFact: 'DRC+Rwanda together at ~59% of mining — conflict minerals zone. US DoD stockpiling $100M in tantalum.',
    },
    description: {
      supply: "DRC (42%) and Rwanda (17%) together account for ~59% of mining — a conflict minerals zone. China processes 43% of metal/powder imports to the US, Germany 27%, Kazakhstan 15%.",
      reserves: "Identified reserves last 200+ years. China holds 57% of reported reserves; Australia 26%, Brazil 10%. Supply is tight due to ongoing conflict mineral issues in DRC/Rwanda.",
      india: "India is 100% import-dependent. Tantalum was delisted from atomic minerals in MMDR 2023. India's semiconductor fab buildout (Micron, Tata) requires tantalum sputtering targets.",
      priceContext: "Tantalum ore price was ~$170/kg Ta₂O₅ in 2024, essentially flat. However, US apparent consumption jumped 75% year-on-year in 2024. Market is opaque with no exchange pricing."
    }
  },
  {
    name: 'Phosphorous',
    symbol: 'P',
    scores: {
      demand: 5, growth: 4, miningDiv: 1, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 10, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 2, importDep: 5,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['agriculture', 'energy', 'defense', 'electrification', 'healthcare'],
      chinaShare: 46,
      topSupplier: 'China (46%) + Morocco (67% of reserves)',
      annualDemandTons: 47000000,
      annualDemand: '~47 million t',
      keyFact: "Morocco holds 67.6% of world phosphate reserves. Phosphorus is the ONLY major nutrient that cannot be synthetically created.",
    },
    description: {
      supply: "China produces 46% of global phosphate rock. Morocco holds 67.6% of world reserves and the OCP Group effectively controls global phosphate pricing. Russia is a top-4 producer.",
      reserves: "World reserves: 74 billion tonnes — over 300 years of supply. Morocco alone holds 50 billion tonnes (68%). Effectively limitless geologically, but Morocco's reserve dominance creates pricing power.",
      india: "India produces only 0.7% of global phosphate (1.6 million tonnes) but is the world's 3rd-largest consumer. ~90% import-dependent. Low-grade domestic reserves require expensive beneficiation.",
      priceContext: "Price averaged $100/tonne in 2024, down from $300/tonne highs in 2022 (Russia-Ukraine spike). Phosphorus is unique: it cannot be synthetically created and once dispersed is effectively lost."
    }
  },
  {
    name: 'Potash',
    symbol: 'K',
    scores: {
      demand: 5, growth: 4, miningDiv: 1, refiningDiv: 2,
      resTime: 1, resDiv: 2, endUseComp: 10, substitutability: 1,
      recyclability: 5, extraction: 1, projects: 3, importDep: 5,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['agriculture', 'energy', 'defense', 'healthcare'],
      chinaShare: 13,
      topSupplier: 'Canada (31%)',
      annualDemandTons: 45000000,
      annualDemand: '~45 million t',
      keyFact: 'India is 100% import-dependent with no domestic reserves. Russia+Belarus together = ~34% of supply.',
    },
    description: {
      supply: "Canada (31%), Russia (19%), and Belarus (15%) together produce ~65% of global potash. Belarus sanctions and Russia's geopolitical status make ~34% of global supply geopolitically sensitive.",
      reserves: "World reserves >4.8 billion tonnes — 100 years from known reserves; total resources last thousands of years. Reasonably distributed: Canada (23%), Laos (21%), Russia (19%), Belarus (16%).",
      india: "India has no domestic potash reserves — 100% import-dependent (~3–4 million tonnes/year MOP). Budget 2024 subsidy exceeded ₹18,000 crore. Signed 3-year MoU with Canpotex for 15 lakh t/year.",
      priceContext: "US MOP reached ~$1,000–1,300/tonne in late 2022 amid Belarus sanctions. Eased to $300–400/tonne in 2023–24. Belarusian sanctions partially eased in December 2025."
    }
  },
  {
    name: 'Gallium',
    symbol: 'Ga',
    scores: {
      demand: 2, growth: 5, miningDiv: 5, refiningDiv: 3,
      resTime: 1, resDiv: 2.5, endUseComp: 6, substitutability: 4,
      recyclability: 4, extraction: 2, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'electrification', 'healthcare'],
      chinaShare: 99,
      topSupplier: 'China (~99%)',
      annualDemandTons: 800,
      annualDemand: '~800 t',
      keyFact: 'China banned ALL gallium exports to the USA in December 2024. China controls 99% of primary production.',
    },
    description: {
      supply: "China produces ~99% of primary low-purity gallium. In December 2024, China banned ALL gallium exports to the United States. Russia, Japan, and Korea ceased primary production years ago.",
      reserves: "Gallium doesn't have discrete reserves — it's diffused at ~50 ppm in bauxite and zinc ores. Theoretical recoverable reserves >100,000 tonnes, 130+ years at current production. Practical supply is almost entirely in China's bauxite-alumina infrastructure.",
      india: "India is 100% import-dependent. India has significant domestic bauxite reserves (4th globally) and a large alumina industry — a technically feasible gallium recovery pathway that does not yet exist operationally.",
      priceContext: "Post-export restrictions, gallium prices soared ~70%, reaching $450–600/kg in late 2023, peaking near $1,000/kg in mid-2024. The complete US export ban in December 2024 represents maximum weaponization."
    }
  },
  {
    name: 'Molybdenum',
    symbol: 'Mo',
    scores: {
      demand: 4, growth: 3, miningDiv: 2, refiningDiv: 2,
      resTime: 3, resDiv: 2, endUseComp: 5, substitutability: 2,
      recyclability: 3, extraction: 2, projects: 2, importDep: 5,
      strategic: 3, volatility: 4
    },
    meta: {
      sectors: ['defense', 'energy', 'construction', 'electrification', 'healthcare', 'semiconductors'],
      chinaShare: 42,
      topSupplier: 'China (42%)',
      annualDemandTons: 260000,
      annualDemand: '~260,000 t',
      keyFact: 'MOFCOM explicitly banned molybdenum exports to US. Mo-99 medical isotope (most used in nuclear medicine) depends on it.',
    },
    description: {
      supply: "China produces 42% of global molybdenum; Peru 16%, Chile 15%, USA 13%. China has explicitly imposed export restrictions to the US (MOFCOM ban). US imports ferromolybdenum primarily from Chile (77%) and Korea.",
      reserves: "World reserves: 15 million tonnes, about 58 years at current production. China holds 39%, USA 23%, Peru 13%. Reasonably distributed.",
      india: "India is >90% import-dependent for processed molybdenum forms. The Mo-99/Tc-99m medical isotope chain at BARC makes molybdenum a nuclear medicine security concern.",
      priceContext: "Molybdenum prices highly cyclical — spiked above $100/kg in 2005, then crashed. Rose from $19.90/kg (2020) to $55.60/kg (2023) then fell 14% to $47/kg in 2024. Active Chinese export restrictions add upside risk."
    }
  },
  {
    name: 'Tin',
    symbol: 'Sn',
    scores: {
      demand: 4, growth: 4, miningDiv: 5, refiningDiv: 1,
      resTime: 5, resDiv: 2, endUseComp: 5, substitutability: 2,
      recyclability: 2, extraction: 1, projects: 3, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['semiconductors', 'construction', 'electrification', 'defense', 'healthcare'],
      chinaShare: 50,
      topSupplier: 'China (23% mining, 50% smelting)',
      annualDemandTons: 380000,
      annualDemand: '~380,000 t',
      keyFact: 'Myanmar supply halt in 2023 caused 46% LME price spike. Only 14 years of known reserves at current consumption.',
    },
    description: {
      supply: "Mining is diversified: China (23%), Indonesia (17%), Burma (11%), DRC (8%), Brazil (10%). However, China's smelting share rises to ~50%. A single Myanmar militia halting mining in 2023 caused 46% LME price spike.",
      reserves: "Only 4.3 million tonnes of known economic reserves — just 14 years at current consumption (Score 5). China (24%), Burma (17%), Australia (15%), Brazil (10%) hold the largest reserves.",
      india: "India is overwhelmingly import-dependent for refined tin (major suppliers: Indonesia, Peru, Bolivia). Small domestic production in Jharkhand and Tamil Nadu covers 10–20% of needs.",
      priceContext: "LME tin hit record $48,000/tonne in 2022, collapsed to $20,000, then spiked 46% in 2023 on Myanmar mine halt. Total range 2020–2024: $15,000 to $48,000/tonne — extreme volatility."
    }
  },
  {
    name: 'Nickel',
    symbol: 'Ni',
    scores: {
      demand: 5, growth: 3, miningDiv: 3, refiningDiv: 2,
      resTime: 3, resDiv: 2, endUseComp: 3, substitutability: 4,
      recyclability: 1, extraction: 2, projects: 5, importDep: 4,
      strategic: 2, volatility: 5
    },
    meta: {
      sectors: ['construction', 'defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 3,
      topSupplier: 'Indonesia (59.5%)',
      annualDemandTons: 3200000,
      annualDemand: '~3.2 million t',
      keyFact: 'Chinese firms control ~75% of Indonesian nickel refining. LFP batteries (zero nickel) now >50% of Chinese EV market.',
    },
    description: {
      supply: "Indonesia produces 59.5% of global nickel (mostly Class II). Chinese firms control ~75% of refining capacity in Indonesia. For battery-grade nickel specifically, China processes the vast majority of Indonesian output.",
      reserves: "World reserves >130 million tonnes — 35 years at current production. Indonesia holds 42%, Australia 18%, Brazil 12%. Relatively well-distributed.",
      india: "India is essentially 100% import-dependent for primary nickel. KABIL explicitly includes nickel; Australia CMIP specifically covers nickel assets. India's MoU with Indonesia covers critical minerals cooperation.",
      priceContext: "Nickel price spiked to a record in 2022 before crashing >60% due to massive Indonesian supply expansion. Demonstrates extreme sensitivity to single-country production decisions."
    }
  },
  {
    name: 'Vanadium',
    symbol: 'V',
    scores: {
      demand: 3, growth: 4, miningDiv: 5, refiningDiv: 3,
      resTime: 1, resDiv: 1.5, endUseComp: 5, substitutability: 3,
      recyclability: 3, extraction: 2, projects: 3, importDep: 3,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['defense', 'energy', 'construction', 'electrification'],
      chinaShare: 70,
      topSupplier: 'China (70%)',
      annualDemandTons: 100000,
      annualDemand: '~100,000 t',
      keyFact: 'Vanadium redox flow batteries could be transformative for grid storage. Price fell 27% in 2024 due to weak Chinese steel demand.',
    },
    description: {
      supply: "China produces 70% of global vanadium, Russia 21%, South Africa 8%. China has implemented trade restrictions. The high-value form for VRFBs — high-purity V₂O₅ — is almost exclusively produced in China.",
      reserves: "World reserves: 18 million tonnes — 180 years at current production. Russia (28%), China (23%), Australia (17%) lead. Reasonably distributed, but processing concentration is extreme.",
      india: "India produces ~20–30% of vanadium consumption from secondary domestic sources (SAIL Bhilai steel slag, NALCO petcoke). Majority imported from China and Brazil. VRFB opportunity identified by NITI Aayog.",
      priceContext: "Vanadium V₂O₅ price fell 27% in 2024 to $5.45/lb — below 2020 levels — due to weak Chinese steel demand. 5-year range $5.45–$9.29/lb. VRFB demand could transform the market by 2030."
    }
  },
  {
    name: 'Lithium',
    symbol: 'Li',
    scores: {
      demand: 4, growth: 5, miningDiv: 2, refiningDiv: 4,
      resTime: 1, resDiv: 1.5, endUseComp: 6, substitutability: 3,
      recyclability: 4, extraction: 2, projects: 5, importDep: 5,
      strategic: 2, volatility: 5
    },
    meta: {
      sectors: ['energy', 'electrification', 'defense', 'healthcare'],
      chinaShare: 17,
      topSupplier: 'Australia (36.7% mining) + China (65–75% refining)',
      annualDemandTons: 170000,
      annualDemand: '~170,000 t',
      keyFact: 'Price went +604% (2020→2022 peak) then -82% (2022→2024). KABIL signed $24M Argentina exploration deal.',
    },
    description: {
      supply: "Mining is diversified: Australia (37%), Chile (20%), China (17%), Zimbabwe (9%). However, China refines 65–75% of all lithium into battery-grade chemicals. The processing chokepoint is in China.",
      reserves: "World reserves: 30 million tonnes lithium content — 125 years at current production. Australia holds 71% of declared reserves — extremely concentrated but geopolitically safe.",
      india: "India produces zero commercial lithium. A 5.9 million tonne J&K discovery (2023) is 10–15 years from production. KABIL signed $24M Argentina exploration deal. 100% import-dependent currently.",
      priceContext: "Lithium prices: +604% from 2020 to 2022 peak, then -82% by 2024. This exceptional cycle (7× up, 5× down in 3 years) reflects EV demand uncertainty and the 5–10 year mine development lag."
    }
  },
  {
    name: 'Terbium',
    symbol: 'Tb',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 5,
      resTime: 5, resDiv: 1.5, endUseComp: 8, substitutability: 5,
      recyclability: 5, extraction: 5, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70% mining, >90% HREE refining)',
      annualDemandTons: 500,
      annualDemand: '~400–600 t',
      keyFact: 'April 2025 Chinese export controls triggered emergency response. Western market prices tripled within weeks. No non-Chinese commercial HREE separation exists.',
    },
    description: {
      supply: "China dominates ~70% of mining and >90% of heavy rare earth refining. Myanmar feeds raw ore directly to Chinese processors. No Western facility possesses commercial HREE separation capability.",
      reserves: "HREE ion-adsorption clay deposits (the main source) are depleting rapidly. Effectively 100% of commercially productive terbium reserves are in China/Myanmar. 25–40 year runway at best.",
      india: "India's monazite deposits contain only trace terbium (~0.1–0.3% of REO). IREL produces negligible commercial HREE quantities. The April 2025 Chinese export controls immediately impacted India's nascent NdFeB magnet industry.",
      priceContext: "Terbium oxide prices surged 38%+ in early 2024. April 2025 Chinese export controls caused Western market prices to triple within weeks. The market is opaque, thin, and entirely policy-sensitive."
    }
  },
  {
    name: 'Yttrium',
    symbol: 'Y',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 4,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 5,
      recyclability: 5, extraction: 4, projects: 4, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['energy', 'defense', 'healthcare', 'construction'],
      chinaShare: 94,
      topSupplier: 'China (94%)',
      annualDemandTons: 15000,
      annualDemand: '~15,000 t',
      keyFact: '97–94% of US yttrium imports from China. April 2025 export controls caused Western prices to triple. YSZ thermal barrier coatings in all jet engines.',
    },
    description: {
      supply: "China produces 94–97% of global yttrium. All yttrium separation occurs in China. No commercial yttrium separation facility exists in the US, EU, Australia, Japan, or India.",
      reserves: "Ion-adsorption clay deposits — the economical source — are facing medium-term depletion warnings from USGS. Broader reserves exist in xenotime/bastnaesite deposits globally but require expensive HREE separation.",
      india: "India's IREL processes monazite at OSCOM, producing small yttrium quantities. Xenotime deposits in Kerala and Odisha represent a real geological source. But India probably produces <10% of its yttrium consumption.",
      priceContext: "Yttrium baseline $5–7/kg (2024). April 2025 Chinese export controls caused Western prices to triple to $15–20+/kg within weeks — identical weaponization pattern to other HREEs."
    }
  },
  {
    name: 'Dysprosium',
    symbol: 'Dy',
    scores: {
      demand: 2, growth: 5, miningDiv: 3, refiningDiv: 5,
      resTime: 5, resDiv: 1.5, endUseComp: 8, substitutability: 5,
      recyclability: 5, extraction: 4, projects: 5, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'energy', 'electrification', 'healthcare'],
      chinaShare: 70,
      topSupplier: 'China (70% mining, >90% HREE refining)',
      annualDemandTons: 2500,
      annualDemand: '~2,500 t',
      keyFact: 'April 2025 Chinese export controls caused Western dysprosium prices to triple. No commercial recycling exists today.',
    },
    description: {
      supply: "China controls >90% of HREE refining. Myanmar feeds Chinese processors directly. April 2025 export controls caused Western dysprosium prices to triple. No commercial alternative supply exists anywhere.",
      reserves: "Ion-adsorption clay HREE deposits hosting dysprosium are essentially entirely in China/Myanmar. Historically demonstrated extreme price spikes — peaked at $2,000+/kg in 2011 after China's export quota cuts.",
      india: "India is 100% import-dependent. The April 2025 Chinese export controls immediately hit India's nascent NdFeB magnet and EV motor industry. Industry associations filed emergency government representations.",
      priceContext: "2024 baseline: $260/kg. Post-April 2025 export controls: tripled in Western markets. Historical peak: $2,000+/kg in 2011. The weaponization potential has been demonstrated twice in 15 years."
    }
  },
  {
    name: 'Hafnium',
    symbol: 'Hf',
    scores: {
      demand: 1, growth: 3, miningDiv: 1, refiningDiv: 5,
      resTime: 4.5, resDiv: 1.5, endUseComp: 7, substitutability: 3,
      recyclability: 4, extraction: 5, projects: 3, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['defense', 'semiconductors', 'energy', 'construction'],
      chinaShare: 21,
      topSupplier: 'France (Framatome ~50%)',
      annualDemandTons: 100,
      annualDemand: '~100 t',
      keyFact: 'Every Intel/TSMC/Samsung chip since 45nm uses hafnium oxide. Zr:Hf separation is one of the hardest separations in metallurgy.',
    },
    description: {
      supply: "No dedicated hafnium mining — exclusively co-extracted from zircon. Framatome (France) supplies ~50% of US imports, China 21%, France 18%. Three major refiners globally: Framatome, ATI (USA), Chinese producers.",
      reserves: "Hafnium resources are tied to zircon — effectively inexhaustible on any planning horizon. Australia holds ~79% of known zircon reserves (and thus hafnium), but geopolitically safe.",
      india: "India's NFC produces nuclear-grade zirconium and must remove hafnium in the process. IREL successfully developed a hafnium oxide recovery flowsheet in 2019. Small quantities produced but not commercially quantified.",
      priceContext: "Hafnium price was stable at $700–800/kg in 2018–2021, then doubled to $1,590/kg in 2022, then surged to $6,150/kg in 2023 (3.9× increase). The market is tiny — ~100 tonnes/year — any supply disruption causes extreme price movement."
    }
  },
  {
    name: 'Selenium',
    symbol: 'Se',
    scores: {
      demand: 2, growth: 3, miningDiv: 1, refiningDiv: 2,
      resTime: 4.5, resDiv: 1.5, endUseComp: 6, substitutability: 2,
      recyclability: 4, extraction: 3, projects: 3, importDep: 4,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['energy', 'healthcare', 'agriculture', 'construction'],
      chinaShare: 49,
      topSupplier: 'China (49%)',
      annualDemandTons: 3600,
      annualDemand: '~3,600 t',
      keyFact: "India's sole producer is Hindalco at Dahej (14 t/year). No exchange trading; market is opaque.",
    },
    description: {
      supply: "China produces ~49% of refined selenium. Japan (~710 t), Russia, and Belgium are secondary producers. All supply is a byproduct of copper electrolytic refining — not all copper smelters have selenium recovery circuits.",
      reserves: "World reserves: ~92,000 tonnes in copper deposits — about 25 years. However, the true resource base (including lead, nickel, zinc, and coal sources) is much larger.",
      india: "India's sole producer is Hindalco at Dahej (14 tonnes/year via copper refining). HCL at Ghatsila has not produced since 2006–07. 14 t domestic vs. several hundred tonnes of demand — under 20% self-sufficiency.",
      priceContext: "US warehouse price rose 65% over 5 years (2020–2024). Quarterly spikes of 22% recorded in Q3 2024. No exchange trading; opaque broker-based market."
    }
  },
  {
    name: 'PGMs',
    symbol: 'Pt/Pd',
    scores: {
      demand: 1, growth: 1, miningDiv: 2, refiningDiv: 5,
      resTime: 1, resDiv: 5, endUseComp: 5, substitutability: 3,
      recyclability: 1, extraction: 4, projects: 2, importDep: 5,
      strategic: 3, volatility: 5
    },
    meta: {
      sectors: ['electrification', 'energy', 'semiconductors', 'healthcare', 'defense', 'construction'],
      chinaShare: 5,
      topSupplier: 'South Africa (53%)',
      annualDemandTons: 400,
      annualDemand: '~400 t (Pt+Pd)',
      keyFact: 'Palladium and rhodium saw >500% price swings. Russia (Nornickel) supplies ~26% of global PGMs.',
    },
    description: {
      supply: "South Africa mines 53% of global platinum and palladium. Russia (Nornickel) supplies 26%. Zimbabwe adds 9%. South Africa and Russia together control ~80% of supply — a high geopolitical concentration.",
      reserves: "World PGM reserves: 71,000 tonnes — ~175 years. South Africa holds 78% of known reserves, Russia 20%. The geographic concentration in two countries (one under sanctions) is a key risk.",
      india: "India has PGM occurrences at Baula-Nuasahi (Odisha) and Sukinda chromite belt but no commercial production. Hindustan Platinum's Navi Mumbai refinery is LPPM Good-Delivery listed. First end-of-life catalyst recycling plant opened 2025.",
      priceContext: "Palladium and rhodium saw >500% price swings in recent years — among the most volatile metals. Palladium peaked above $3,000/oz then crashed. Structural demand decline from EV transition (fewer catalytic converters) is reshaping the market."
    }
  },
  {
    name: 'Cadmium',
    symbol: 'Cd',
    scores: {
      demand: 2, growth: 2, miningDiv: 4, refiningDiv: 4,
      resTime: 4.5, resDiv: 2, endUseComp: 4, substitutability: 2,
      recyclability: 2, extraction: 1, projects: 4, importDep: 5,
      strategic: 3, volatility: 3
    },
    meta: {
      sectors: ['energy', 'semiconductors', 'defense', 'construction'],
      chinaShare: 35,
      topSupplier: 'China (~35%)',
      annualDemandTons: 27000,
      annualDemand: '~27,000 t',
      keyFact: 'CdTe solar cells are driving new demand. India imports ~11,400 tons/year — massive global hub for cadmium consumption.',
    },
    description: {
      supply: "China is the leading refined cadmium producer (~35%), with significant capacity in South Korea (Korea Zinc), Japan, and Canada. Tracking the global zinc industry concentration.",
      reserves: "Estimated at ~500,000 tonnes in zinc ores — 20–30 years. Entirely a byproduct of zinc mining; availability is elastic to zinc production growth.",
      india: "India imports ~11,400 tonnes/year of cadmium — a massive global hub for consumption (batteries, CdTe solar). Hindustan Zinc produces some intermediate sponge domestically but refined production is low.",
      priceContext: "Prices rose from ~$2.50/kg to over $4.00/kg recently due to zinc smelter disruptions and CdTe solar manufacturing growth (First Solar expanding to India)."
    }
  },
  {
    name: 'Cerium',
    symbol: 'Ce',
    scores: {
      demand: 4, growth: 2, miningDiv: 1, refiningDiv: 1,
      resTime: 1, resDiv: 1, endUseComp: 4, substitutability: 2,
      recyclability: 5, extraction: 1, projects: 2, importDep: 2,
      strategic: 3, volatility: 1
    },
    meta: {
      sectors: ['construction', 'electrification', 'healthcare', 'semiconductors'],
      chinaShare: 70,
      topSupplier: 'China (~70%)',
      annualDemandTons: 75000,
      annualDemand: '~75,000 t',
      keyFact: "Chronic oversupply because cerium makes up ~50% of all rare earth ore. India has world's 3rd largest rare earth reserves.",
    },
    description: {
      supply: "China dominates refining (~85–90% of separation capacity) but Western capacity is expanding: Lynas (Malaysia) and MP Materials (California) are ramping separated cerium products.",
      reserves: "Cerium is the most abundant rare earth — reserves effectively limitless at current consumption. The challenge is structural oversupply, not scarcity, as it's co-produced with more valuable rare earths.",
      india: "India has vast domestic resources — world's 3rd largest rare earth reserves (6.9 million tonnes), rich in cerium (~45% of REO). IREL produces cerium oxide but at fraction of India's potential.",
      priceContext: "Prices are stable and low — often near production cost due to chronic oversupply. Cerium is effectively produced as a 'waste' byproduct of mining for neodymium. No economic incentive to develop recycling."
    }
  },
  {
    name: 'Lanthanum',
    symbol: 'La',
    scores: {
      demand: 3, growth: 2, miningDiv: 1, refiningDiv: 1,
      resTime: 1, resDiv: 1, endUseComp: 5, substitutability: 2,
      recyclability: 5, extraction: 2, projects: 2, importDep: 2,
      strategic: 3, volatility: 1
    },
    meta: {
      sectors: ['energy', 'electrification', 'healthcare', 'construction', 'semiconductors'],
      chinaShare: 70,
      topSupplier: 'China (~70%)',
      annualDemandTons: 40000,
      annualDemand: '~40,000 t',
      keyFact: 'Used in oil refinery catalysts (50% of demand) and NiMH batteries. Structural oversupply from co-mining with more valuable REEs.',
    },
    description: {
      supply: "China dominates refining (~85% of capacity) but Lynas (Malaysia) and MP Materials (USA) are scaling separated lanthanum. LREE processing chain has more Western alternatives than HREEs.",
      reserves: "Effectively limitless relative to demand. Lanthanum is highly abundant in bastnaesite and monazite ores globally. Found in USA, Australia, China, and India in large quantities.",
      india: "India has vast domestic monazite resources (3rd largest REE reserves globally). IREL produces lanthanum oxide but at a fraction of potential. The MMDR/DAE thorium restrictions historically suppressed commercialization.",
      priceContext: "Prices stable at ~$2–4/kg — near production cost due to structural oversupply. Lanthanum is produced as a byproduct of mining more valuable magnet metals (Nd, Pr), keeping supply chronically abundant."
    }
  },
];

// Sector definitions for filtering
window.ALL_SECTORS = ['defense', 'energy', 'semiconductors', 'electrification', 'healthcare', 'agriculture', 'construction'];

// Preset weight configurations
window.WEIGHT_PRESETS = {
  equal: {
    label: 'Equal',
    weights: { demand: 50, growth: 50, supplyConc: 50, reserveRisk: 50, endUseComp: 50, subRisk: 50, extraction: 50, projects: 50, indiaVuln: 50, volatility: 50 }
  },
  indiaFocus: {
    label: 'India Focus',
    weights: { demand: 40, growth: 60, supplyConc: 70, reserveRisk: 40, endUseComp: 60, subRisk: 50, extraction: 40, projects: 60, indiaVuln: 100, volatility: 70 }
  },
  supplySecure: {
    label: 'Supply Security',
    weights: { demand: 30, growth: 50, supplyConc: 100, reserveRisk: 80, endUseComp: 40, subRisk: 70, extraction: 60, projects: 80, indiaVuln: 50, volatility: 50 }
  },
  demandShock: {
    label: 'Demand Shock',
    weights: { demand: 70, growth: 100, supplyConc: 50, reserveRisk: 30, endUseComp: 80, subRisk: 40, extraction: 30, projects: 40, indiaVuln: 40, volatility: 80 }
  },
};
