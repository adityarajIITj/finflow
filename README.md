#  FinFlow — Personal Finance Dashboard

A production-grade personal finance web app built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step — open `login.html` in any browser and you're live.

![Dashboard Preview](https://raw.githubusercontent.com/adityarajIITj/finflow/main/preview.png)

---

## ✨ Features

| Feature | Description |
|---|---|
|  **Auth System** | Sign up / sign in / demo account — multi-user, localStorage-based |
|  **Dashboard** | KPI cards, 6-month cash flow chart, spending donut, recent transactions |
|  **Transactions** | Full CRUD, real-time search & filter, edit/delete inline |
|  **CSV Import** | Drag & drop any bank export — column mapping modal + preview before import |
|  **CSV Export** | Download all your transactions in one click |
|  **Analytics** | Income vs expense trends, top category bar chart, savings rate over time |
|  **Budgets** | Auto-calculated per-category progress bars with overspend alerts |
|  **AI Advisor** | Gemini-powered savings advice — analyzes your real data, streams response |
|  **Settings** | Profile, API key management, data export, account wipe |

---

##  Getting Started

No installation required.

```bash
git clone https://github.com/adityarajIITj/finflow.git
cd finflow
# Then open in browser:
open login.html        # macOS
xdg-open login.html   # Linux
start login.html       # Windows
```

Or just double-click `login.html`.

> **Try it instantly** — click **"Continue with Demo Account"** on the login page to explore with pre-loaded sample data.

---

##  AI Advisor Setup

The AI Advisor uses the **Gemini 1.5 Flash** API (free tier).

1. Get a free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Go to **Settings → AI Configuration** and paste your key
3. Navigate to **AI Advisor** and click **"Analyze My Finances"**

> Your API key and all financial data are stored only in your browser's `localStorage`. Nothing is ever sent to any server except the AI analysis prompt to Google's API.

---

##  Project Structure

```
finflow/
├── login.html                 # Auth page (sign in / register)
├── app.html                   # Main SPA (all pages)
├── app.css                    # Design system & component styles
├── app.js                     # App logic (DataStore, Router, Charts, CSV, AI)
├── auth.js                    # Auth module (multi-user localStorage)
├── sample-transactions.csv    # Sample CSV to test the import feature
└── README.md
```

---

## CSV Import

FinFlow can import transaction exports from any bank. Supported formats:

- Comma-separated (`.csv`)
- Tab-separated (`.tsv` renamed to `.csv`)
- Quoted fields

**How it works:**
1. Go to **Transactions → Import CSV**
2. Drag & drop your file (or click to browse)
3. Map your CSV columns to the required fields (auto-detected where possible)
4. Preview the first 5 rows, then click **Import**

A `sample-transactions.csv` is included in the repo for testing.

---

##  Design System

- **Colors**: near-black `#08080f` base + electric indigo `#635bff` accent
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (headings) + [Inter](https://fonts.google.com/specimen/Inter) (body)
- **Aesthetic**: Linear/Vercel-inspired — minimal, data-dense, no rainbow gradients
- Responsive down to 375px (mobile sidebar)

---

##  Privacy

- **No backend, no database, no tracking.**
- All data lives in `localStorage` — scoped per user account.
- The only external requests are: Google Fonts (CSS), Chart.js CDN, and Gemini API (only when you click "Analyze").

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Vanilla CSS (custom design system) |
| Logic | Vanilla JavaScript (ES2020+) |
| Charts | [Chart.js 4](https://www.chartjs.org/) |
| AI | [Gemini 1.5 Flash](https://ai.google.dev/) (via REST API) |
| Fonts | Google Fonts |
| Storage | `localStorage` |

---

##  License

MIT — feel free to use, fork, and build on this.

---


