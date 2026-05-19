# India Critical Minerals Risk Dashboard

**Live demo:** `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## Deploying to GitHub Pages

### Step 1: Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it (e.g., `crit-minerals-dashboard`)
3. Set it to **Public**
4. Click **Create repository**

### Step 2: Push the files

```bash
cd /path/to/critMineralsDashboardProj
git init
git add index.html data.js style.css app.js README.md
git commit -m "Initial: Critical Minerals Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. In your repository, go to **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Set branch to `main` and folder to `/ (root)`
4. Click **Save**

Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/` within 1–2 minutes.

---

## Editing the Data

### Adding a new mineral

Open `data.js` and copy any existing mineral block:

```js
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
    keyFact: 'Key risk narrative here.',
  },
  description: {
    supply: 'Supply chain narrative.',
    reserves: 'Reserve situation.',
    india: "India's position.",
    priceContext: 'Price history and outlook.',
  }
},
```

Valid sectors: `defense`, `energy`, `semiconductors`, `electrification`, `healthcare`, `agriculture`, `construction`

### Updating scores

All dimension scores are in the `scores` object inside each mineral entry in `data.js`. Edit the value and refresh — no build step required.

### Score dimensions (higher = more risky)

| Key | Description | Scale |
|-----|-------------|-------|
| `demand` | Current demand level | 1–5 |
| `growth` | Demand growth trajectory | 1–5 |
| `miningDiv` | Mining geographic concentration | 1–5 |
| `refiningDiv` | Refining geographic concentration | 1–5 |
| `resTime` | Reserve lifetime risk | 1–6 |
| `resDiv` | Reserve geographic diversity | 1–5 |
| `endUseComp` | End-use criticality | 1–10 |
| `substitutability` | Difficulty of substitution | 1–5 |
| `recyclability` | Recycling difficulty | 1–5 |
| `extraction` | Processing complexity | 1–5 |
| `projects` | Pipeline scarcity | 1–5 |
| `importDep` | India import dependence | 1–5 |
| `strategic` | India strategic posture (1=best) | 1–3 |
| `volatility` | Price volatility | 1–5 |

---

## Local Development

No build step or server required. Simply open `index.html` in a browser:

```bash
# macOS
open index.html

# Or use a simple local server:
python3 -m http.server 8080
# Then open http://localhost:8080
```

---

## Tech Stack

- **Pure HTML/CSS/JS** — no framework, no build step
- **Chart.js 4** (CDN) — 14-axis radar charts on modal and compare page
- **SVG** — bubble chart, geopolitical 2×2, India quadrant
- **Canvas API** — mini radar charts on explorer cards (no Chart.js)
- **Google Fonts** — Inter typeface

---

## License

MIT — free to use, adapt, and redistribute with attribution.
