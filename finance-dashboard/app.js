/**
 * FinFlow — Production App Logic
 * ─────────────────────────────────────────────────────
 * Modules: DataStore · Router · ChartManager · CSVParser
 *          AIAdvisor · Toast · UI Controllers
 */

'use strict';

/* ═══════════════════════════════════════════════════
   Guard — redirect to login if not authenticated
   ═══════════════════════════════════════════════════ */
(function () {
  if (!Auth.currentUser()) window.location.href = 'login.html';
})();

/* ═══════════════════════════════════════════════════
   Toast Module
   ═══════════════════════════════════════════════════ */
const Toast = (() => {
  const root = document.getElementById('toast-root');
  function show(msg, type = 'info', duration = 3200) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-fade');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }
  return {
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    info:    (m, d) => show(m, 'info', d),
  };
})();

/* ═══════════════════════════════════════════════════
   DataStore — localStorage persistence per user
   ═══════════════════════════════════════════════════ */
const DataStore = (() => {
  const user = Auth.currentUser();
  const uid  = user.userId;
  const key  = k => `ff_${uid}_${k}`;

  const DEMO_TRANSACTIONS = [
    { id: 't1',  desc: 'Monthly Salary',        amount: 85000, type: 'income',  category: 'Salary',        date: '2026-03-01', notes: '' },
    { id: 't2',  desc: 'Freelance Project',      amount: 22000, type: 'income',  category: 'Freelance',     date: '2026-03-05', notes: 'Website redesign' },
    { id: 't3',  desc: 'Apartment Rent',          amount: 18000, type: 'expense', category: 'Rent',          date: '2026-03-02', notes: '' },
    { id: 't4',  desc: 'Grocery Shopping',        amount:  4200, type: 'expense', category: 'Food',          date: '2026-03-06', notes: 'BigBasket' },
    { id: 't5',  desc: 'Zomato Orders',           amount:  2800, type: 'expense', category: 'Food',          date: '2026-03-10', notes: '' },
    { id: 't6',  desc: 'Uber Rides',             amount:  1500, type: 'expense', category: 'Transport',     date: '2026-03-12', notes: '' },
    { id: 't7',  desc: 'Netflix + Spotify',       amount:   850, type: 'expense', category: 'Entertainment', date: '2026-03-01', notes: '' },
    { id: 't8',  desc: 'Amazon Shopping',         amount:  6300, type: 'expense', category: 'Shopping',      date: '2026-03-15', notes: 'Electronics' },
    { id: 't9',  desc: 'Gym Membership',          amount:  3000, type: 'expense', category: 'Health',        date: '2026-03-01', notes: '' },
    { id: 't10', desc: 'Electricity Bill',        amount:  1800, type: 'expense', category: 'Utilities',     date: '2026-03-08', notes: '' },
    { id: 't11', desc: 'Movie Night',             amount:   700, type: 'expense', category: 'Entertainment', date: '2026-03-18', notes: '' },
    { id: 't12', desc: 'Performance Bonus',       amount: 15000, type: 'income',  category: 'Salary',        date: '2026-03-20', notes: '' },
    { id: 't13', desc: 'Monthly Salary',          amount: 85000, type: 'income',  category: 'Salary',        date: '2026-02-01', notes: '' },
    { id: 't14', desc: 'Apartment Rent',          amount: 18000, type: 'expense', category: 'Rent',          date: '2026-02-02', notes: '' },
    { id: 't15', desc: 'Grocery Shopping',        amount:  5100, type: 'expense', category: 'Food',          date: '2026-02-08', notes: '' },
    { id: 't16', desc: 'Restaurant',             amount:  3200, type: 'expense', category: 'Food',          date: '2026-02-14', notes: 'Valentine dinner' },
    { id: 't17', desc: 'Freelance Project',       amount: 18000, type: 'income',  category: 'Freelance',     date: '2026-02-20', notes: 'Logo design' },
    { id: 't18', desc: 'Monthly Salary',          amount: 85000, type: 'income',  category: 'Salary',        date: '2026-01-01', notes: '' },
    { id: 't19', desc: 'Apartment Rent',          amount: 18000, type: 'expense', category: 'Rent',          date: '2026-01-02', notes: '' },
    { id: 't20', desc: 'Shopping - Myntra',       amount:  4500, type: 'expense', category: 'Shopping',      date: '2026-01-18', notes: '' },
  ];

  function getRaw() {
    const raw = localStorage.getItem(key('txns'));
    if (raw) return JSON.parse(raw);
    if (uid === 'demo') { save(DEMO_TRANSACTIONS); return DEMO_TRANSACTIONS; }
    return [];
  }

  function save(txns) { localStorage.setItem(key('txns'), JSON.stringify(txns)); }

  function getAll() { return getRaw(); }

  function add(txn) {
    const txns = getRaw();
    txn.id = 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    txns.unshift(txn);
    save(txns);
    return txn;
  }

  function update(id, patch) {
    const txns = getRaw().map(t => t.id === id ? { ...t, ...patch } : t);
    save(txns);
  }

  function remove(id) { save(getRaw().filter(t => t.id !== id)); }

  function clear() {
    localStorage.removeItem(key('txns'));
    localStorage.removeItem(key('gemini_key'));
  }

  function getGeminiKey() { return localStorage.getItem(key('gemini_key')) || ''; }
  function setGeminiKey(k) { localStorage.setItem(key('gemini_key'), k); }

  function exportCSV() {
    const txns = getAll();
    const rows = [['Date','Description','Category','Type','Amount','Notes'],
      ...txns.map(t => [t.date, `"${t.desc.replace(/"/g,'""')}"`, t.category, t.type, t.amount, `"${(t.notes||'').replace(/"/g,'""')}"`])
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'finflow-export.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  }

  return { getAll, add, update, remove, clear, getGeminiKey, setGeminiKey, exportCSV };
})();

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */
const CAT_EMOJI = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Utilities: '💡',
  Rent: '🏠', Education: '📚', Salary: '💼',
  Freelance: '🧑‍💻', Investment: '📈', Other: '📦',
};

const CHART_COLORS = ['#635bff','#22c55e','#f59e0b','#3b82f6','#ec4899','#14b8a6','#a78bfa','#fb923c','#f43f5e'];

let _selectedMonth = '';

function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFilteredTxns() {
  const all = DataStore.getAll();
  if (!_selectedMonth) return all;
  return all.filter(t => t.date && t.date.startsWith(_selectedMonth));
}

/* ── Month selector ── */
function initMonthFilter() {
  const sel = document.getElementById('month-select');
  const txns = DataStore.getAll();
  const months = [...new Set(txns.map(t => t.date.slice(0, 7)).filter(Boolean))].sort().reverse();
  sel.innerHTML = '<option value="">All Time</option>' + months.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return `<option value="${m}">${label}</option>`;
  }).join('');
  // Default to first (latest) month
  if (months.length) { sel.value = months[0]; _selectedMonth = months[0]; }
  sel.addEventListener('change', () => {
    _selectedMonth = sel.value;
    refreshAllPages();
  });
}

function refreshMonthSelector() {
  const sel = document.getElementById('month-select');
  const txns = DataStore.getAll();
  const months = [...new Set(txns.map(t => t.date.slice(0, 7)).filter(Boolean))].sort().reverse();
  const current = sel.value;
  sel.innerHTML = '<option value="">All Time</option>' + months.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return `<option value="${m}">${label}</option>`;
  }).join('');
  if (months.includes(current)) sel.value = current;
}

/* ═══════════════════════════════════════════════════
   KPI Cards
   ═══════════════════════════════════════════════════ */
function renderKPIs() {
  const txns    = getFilteredTxns();
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savRate = income ? Math.round((savings / income) * 100) : 0;

  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label"><span class="kpi-icon">💰</span> Total Income</div>
      <div class="kpi-value">${fmt(income)}</div>
      <div class="kpi-sub pos">↑ From all sources</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label"><span class="kpi-icon">💸</span> Total Expenses</div>
      <div class="kpi-value">${fmt(expense)}</div>
      <div class="kpi-sub neg">${txns.filter(t => t.type === 'expense').length} transactions</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label"><span class="kpi-icon">🏦</span> Net Savings</div>
      <div class="kpi-value" style="color:${savings >= 0 ? 'var(--success)' : 'var(--danger)'}">${savings < 0 ? '−' : ''}${fmt(savings)}</div>
      <div class="kpi-sub ${savings >= 0 ? 'pos' : 'neg'}">${savings >= 0 ? 'On track' : 'Over budget'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label"><span class="kpi-icon">📊</span> Savings Rate</div>
      <div class="kpi-value" style="color:${savRate >= 20 ? 'var(--success)' : savRate >= 10 ? 'var(--warning)' : 'var(--danger)'}">${savRate}%</div>
      <div class="kpi-sub ${savRate >= 20 ? 'pos' : ''}">${savRate >= 20 ? 'Healthy rate' : savRate >= 10 ? 'Could improve' : 'Needs attention'}</div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════
   Charts
   ═══════════════════════════════════════════════════ */
const ChartStore = {};

function destroyChart(id) {
  if (ChartStore[id]) { ChartStore[id].destroy(); delete ChartStore[id]; }
}

const CHART_DEFAULTS = {
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#e8e8f2',
      bodyColor: '#6b6b82',
      padding: 12,
      cornerRadius: 8,
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#6b6b82', font: { family: 'Inter', size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#6b6b82', font: { family: 'Inter', size: 11 }, callback: v => '₹' + (v / 1000) + 'K' },
    }
  }
};

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) });
  }
  return months;
}

function renderCashflowChart() {
  destroyChart('cashflow');
  const all    = DataStore.getAll();
  const months = getLast6Months();
  const income  = months.map(m => all.filter(t => t.type === 'income'  && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));
  const expense = months.map(m => all.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));

  const ctx = document.getElementById('cashflow-chart').getContext('2d');
  ChartStore.cashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Income',   data: income,  backgroundColor: 'rgba(34,197,94,0.75)',  borderRadius: 6, borderSkipped: false },
        { label: 'Expense',  data: expense, backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 6, borderSkipped: false },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      ...CHART_DEFAULTS,
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: c => ' ' + fmt(c.raw) } } },
    }
  });
}

function renderDonutChart() {
  destroyChart('donut');
  const txns = getFilteredTxns().filter(t => t.type === 'expense');
  const catMap = {};
  txns.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const labels = Object.keys(catMap);
  const data   = Object.values(catMap);

  const ctx = document.getElementById('donut-chart').getContext('2d');
  ChartStore.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#13131f', hoverOffset: 6 }]
    },
    options: {
      responsive: true, cutout: '72%',
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: c => ' ' + fmt(c.raw) } } }
    }
  });

  const legend = document.getElementById('donut-legend');
  legend.innerHTML = labels.map((l, i) => `
    <div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${CHART_COLORS[i]}"></span>
      <span class="donut-legend-label">${l}</span>
      <span class="donut-legend-value">${fmt(data[i])}</span>
    </div>
  `).join('');
}

function renderTrendChart() {
  destroyChart('trend');
  const all    = DataStore.getAll();
  const months = getLast6Months();
  const income  = months.map(m => all.filter(t => t.type === 'income'  && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));
  const expense = months.map(m => all.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));

  const ctx = document.getElementById('trend-chart').getContext('2d');
  ChartStore.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Income',  data: income,  borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#22c55e' },
        { label: 'Expense', data: expense, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#ef4444' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      ...CHART_DEFAULTS,
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: c => ' ' + fmt(c.raw) } } }
    }
  });
}

function renderCatBarChart() {
  destroyChart('catbar');
  const txns   = getFilteredTxns().filter(t => t.type === 'expense');
  const catMap = {};
  txns.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const sorted  = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

  const ctx = document.getElementById('cat-bar-chart').getContext('2d');
  ChartStore.catbar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(([k]) => k),
      datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: CHART_COLORS, borderRadius: 6, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: c => ' ' + fmt(c.raw) } } },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x },
        y: { grid: { display: false }, ticks: { color: '#6b6b82', font: { family: 'Inter', size: 12 } } }
      }
    }
  });
}

function renderSavingsChart() {
  destroyChart('savings');
  const all    = DataStore.getAll();
  const months = getLast6Months();
  const rates  = months.map(m => {
    const inc = all.filter(t => t.type === 'income'  && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0);
    const exp = all.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0);
    return inc ? Math.round(((inc - exp) / inc) * 100) : 0;
  });

  // Overall savings rate
  const txns   = getFilteredTxns();
  const inc    = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp    = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const ovRate = inc ? Math.round(((inc - exp) / inc) * 100) : 0;
  document.getElementById('savings-stat').textContent = ovRate + '%';

  const ctx = document.getElementById('savings-chart').getContext('2d');
  ChartStore.savings = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{ data: rates, borderColor: '#635bff', backgroundColor: 'rgba(99,91,255,0.1)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#635bff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...CHART_DEFAULTS.plugins },
      scales: {
        x: CHART_DEFAULTS.scales.x,
        y: {
          grid: CHART_DEFAULTS.scales.y.grid,
          ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v + '%' }
        }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════
   Transaction Table Rendering
   ═══════════════════════════════════════════════════ */
function txnRow(t, showActions = true) {
  const sign = t.type === 'income' ? '+' : '−';
  return `
    <tr>
      <td>
        <div class="txn-desc-cell">
          <div class="txn-cat-icon">${CAT_EMOJI[t.category] || '📦'}</div>
          <div>
            <div class="txn-desc-name">${t.desc}</div>
            ${t.notes ? `<div class="txn-desc-note">${t.notes}</div>` : ''}
          </div>
        </div>
      </td>
      ${showActions ? `<td><span class="cat-chip">${t.category}</span></td>` : ''}
      <td style="color:var(--text-muted);white-space:nowrap">${fmtDate(t.date)}</td>
      ${showActions ? `<td><span class="type-badge ${t.type}">${t.type}</span></td>` : ''}
      <td class="amount-cell ${t.type}">${sign}${fmt(t.amount)}</td>
      ${showActions ? `
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit" onclick="openEditModal('${t.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" title="Delete" onclick="confirmDelete('${t.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>` : ''}
    </tr>
  `;
}

function renderDashboardTxns() {
  const txns = getFilteredTxns().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const tbody = document.getElementById('dash-txn-body');
  tbody.innerHTML = txns.length
    ? txns.map(t => txnRow(t, false)).join('')
    : `<tr><td colspan="3" style="padding:32px;text-align:center;color:var(--text-muted)">No transactions for this period</td></tr>`;
}

/* ── All Transactions ── */
let txnFilterState = { search: '', type: 'all', cat: 'all' };

function renderAllTxns() {
  let txns = getFilteredTxns();
  const { search, type, cat } = txnFilterState;
  if (search) txns = txns.filter(t => t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search) || (t.notes || '').toLowerCase().includes(search));
  if (type !== 'all') txns = txns.filter(t => t.type === type);
  if (cat  !== 'all') txns = txns.filter(t => t.category === cat);
  txns.sort((a, b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById('all-txn-body');
  const empty = document.getElementById('txn-empty');
  document.getElementById('txn-count-badge').textContent = txns.length;

  if (!txns.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = txns.map(t => txnRow(t, true)).join('');
  }

  // Populate category filter
  const all  = DataStore.getAll();
  const cats = [...new Set(all.map(t => t.category))].sort();
  const catSel = document.getElementById('txn-cat-filter');
  const curCat = catSel.value;
  catSel.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  if (cats.includes(curCat)) catSel.value = curCat;
}

/* ═══════════════════════════════════════════════════
   Budget Rendering
   ═══════════════════════════════════════════════════ */
const BUDGET_LIMITS = { Food: 10000, Transport: 4000, Shopping: 10000, Entertainment: 3000, Health: 5000, Utilities: 22000, Rent: 20000, Education: 5000, Other: 5000 };
const BUDGET_COLORS = { Food: '#22c55e', Transport: '#f59e0b', Shopping: '#635bff', Entertainment: '#ec4899', Health: '#3b82f6', Utilities: '#14b8a6', Rent: '#a78bfa', Education: '#fb923c', Other: '#6b6b82' };

function renderBudgets() {
  const txns = getFilteredTxns().filter(t => t.type === 'expense');
  const catMap = {};
  txns.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });

  const cats = Object.keys({ ...BUDGET_LIMITS, ...catMap });
  const grid = document.getElementById('budget-grid');

  const cards = [...new Set(cats)].map(cat => {
    const spent = catMap[cat] || 0;
    const limit = BUDGET_LIMITS[cat] || 5000;
    const pct   = Math.min(Math.round((spent / limit) * 100), 100);
    const color = BUDGET_COLORS[cat] || '#6b6b82';
    const over  = pct >= 100;
    const warn  = pct >= 80 && !over;
    const barColor = over ? '#ef4444' : warn ? '#f59e0b' : color;

    return `
      <div class="budget-card">
        <div class="budget-card-top">
          <div class="budget-card-name">
            <span>${CAT_EMOJI[cat] || '📦'}</span>
            ${cat}
          </div>
          <div class="budget-amounts">
            <div class="budget-spent" style="color:${over ? 'var(--danger)' : 'var(--text)'}">${fmt(spent)}</div>
            <div class="budget-limit">of ${fmt(limit)}</div>
          </div>
        </div>
        <div class="budget-bar-bg">
          <div class="budget-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <div class="budget-footer">
          <span class="${over ? 'over' : warn ? 'warn' : ''}">
            ${over ? '⚠ Over budget' : warn ? `⚠ ${pct}% used` : `${pct}% used`}
          </span>
          <span>${fmt(limit - spent)} left</span>
        </div>
      </div>
    `;
  });

  grid.innerHTML = cards.join('');
}

/* ═══════════════════════════════════════════════════
   Transaction Modal
   ═══════════════════════════════════════════════════ */
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('modal-submit').textContent = 'Add Transaction';
  document.getElementById('txn-form').reset();
  document.getElementById('f-edit-id').value = '';
  document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('txn-modal').classList.add('open');
}

function openEditModal(id) {
  const t = DataStore.getAll().find(x => x.id === id);
  if (!t) return;
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('modal-submit').textContent = 'Save Changes';
  document.getElementById('f-desc').value     = t.desc;
  document.getElementById('f-amount').value   = t.amount;
  document.getElementById('f-type').value     = t.type;
  document.getElementById('f-category').value = t.category;
  document.getElementById('f-date').value     = t.date;
  document.getElementById('f-notes').value    = t.notes || '';
  document.getElementById('f-edit-id').value  = id;
  document.getElementById('txn-modal').classList.add('open');
}

function closeTxnModal() { document.getElementById('txn-modal').classList.remove('open'); }

/* ═══════════════════════════════════════════════════
   Delete Confirmation
   ═══════════════════════════════════════════════════ */
let _pendingDelete = null;

function confirmDelete(id) {
  const t = DataStore.getAll().find(x => x.id === id);
  if (!t) return;
  _pendingDelete = id;
  document.getElementById('confirm-title').textContent = 'Delete Transaction';
  document.getElementById('confirm-body').textContent  = `Delete "${t.desc}" (${fmt(t.amount)})? This cannot be undone.`;
  document.getElementById('confirm-modal').classList.add('open');
}

function confirmClear(title, body, onOk) {
  _pendingDelete = null;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent  = body;
  document.getElementById('confirm-ok').onclick = () => {
    document.getElementById('confirm-modal').classList.remove('open');
    onOk();
  };
  document.getElementById('confirm-modal').classList.add('open');
}

/* ═══════════════════════════════════════════════════
   CSV Parser & Import Flow
   ═══════════════════════════════════════════════════ */
let _csvData = [];

const CSVParser = (() => {
  function parse(text) {
    const rows = text.split(/\r?\n/).filter(r => r.trim());
    if (!rows.length) return { headers: [], data: [] };
    // Detect delimiter
    const delim = (rows[0].split('\t').length > rows[0].split(',').length) ? '\t' : ',';
    const parseRow = row => {
      const cols = []; let cur = ''; let inQ = false;
      for (let c of row) {
        if (c === '"') { inQ = !inQ; continue; }
        if (c === delim && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      cols.push(cur.trim());
      return cols;
    };
    const headers = parseRow(rows[0]);
    const data    = rows.slice(1).map(r => {
      const vals = parseRow(r);
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { headers, data };
  }

  function autoMap(headers) {
    const map = { date: '', description: '', amount: '', type: '', category: '' };
    const hl  = headers.map(h => h.toLowerCase());
    const find = (...kws) => headers[hl.findIndex(h => kws.some(kw => h.includes(kw)))] || '';
    map.date        = find('date', 'time', 'value date');
    map.description = find('description', 'narration', 'particulars', 'details', 'name', 'memo');
    map.amount      = find('amount', 'debit', 'credit', 'transaction amount', 'inr');
    map.type        = find('type', 'dr/cr', 'dr cr', 'transaction type', 'credit/debit');
    map.category    = find('category', 'cat');
    return map;
  }

  return { parse, autoMap };
})();

function showCSVModal(headers, rawData) {
  _csvData = rawData;
  const autoMap = CSVParser.autoMap(headers);
  const fieldLabels = { date: 'Date', description: 'Description', amount: 'Amount', type: 'Type (income/expense)', category: 'Category' };
  const mapEl = document.getElementById('csv-column-map');
  mapEl.innerHTML = Object.entries(fieldLabels).map(([field, label]) => `
    <div class="csv-map-row">
      <label>${label}</label>
      <select id="map-${field}">
        <option value="">— ignore —</option>
        ${headers.map(h => `<option value="${h}" ${autoMap[field] === h ? 'selected' : ''}>${h}</option>`).join('')}
      </select>
    </div>
  `).join('');

  // Preview table
  const preview = rawData.slice(0, 5);
  document.getElementById('csv-preview-table').innerHTML = `
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${preview.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
  `;

  document.getElementById('csv-count').textContent = rawData.length;
  document.getElementById('csv-modal').classList.add('open');
}

function importFromCSVModal() {
  const getMap = f => document.getElementById(`map-${f}`)?.value;
  const dateCol = getMap('date'), descCol = getMap('description'), amtCol = getMap('amount');
  if (!descCol || !amtCol) {
    Toast.error('Please map at least Description and Amount columns.');
    return;
  }

  let imported = 0;
  _csvData.forEach(row => {
    const rawAmt  = parseFloat((row[amtCol] || '0').replace(/[₹,\s]/g, ''));
    if (isNaN(rawAmt) || rawAmt === 0) return;

    const typeCol = getMap('type');
    let type = 'expense';
    if (typeCol && row[typeCol]) {
      const v = row[typeCol].toLowerCase();
      if (v.includes('cr') || v.includes('income') || v.includes('credit')) type = 'income';
    } else if (rawAmt > 0) {
      type = 'expense';
    }

    const catCol = getMap('category');
    const category = (catCol && row[catCol]) ? row[catCol] : 'Other';

    const rawDate = dateCol ? row[dateCol] : '';
    let date = new Date().toISOString().slice(0, 10);
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
    }

    DataStore.add({ desc: row[descCol] || 'Imported', amount: Math.abs(rawAmt), type, category, date, notes: 'Imported from CSV' });
    imported++;
  });

  document.getElementById('csv-modal').classList.remove('open');
  Toast.success(`Imported ${imported} transaction${imported !== 1 ? 's' : ''} successfully.`);
  refreshMonthSelector();
  refreshAllPages();
}

function handleCSVFile(file) {
  if (!file || !file.name.endsWith('.csv')) { Toast.error('Please upload a .csv file.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const { headers, data } = CSVParser.parse(e.target.result);
    if (!data.length) { Toast.error('The CSV file appears to be empty.'); return; }
    showCSVModal(headers, data);
  };
  reader.readAsText(file);
}

/* ═══════════════════════════════════════════════════
   AI Advisor (Gemini)
   ═══════════════════════════════════════════════════ */
const AIAdvisor = (() => {
  function buildPrompt() {
    const txns   = DataStore.getAll();
    const months = getLast6Months();
    const recent = txns.filter(t => months.some(m => t.date.startsWith(m.key)));

    const income  = recent.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = recent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const catMap  = {};
    recent.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const cats    = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    return `You are a highly skilled personal finance advisor. Analyze the following 6-month financial data and provide highly specific, actionable savings advice. Use a professional but conversational tone.

## Financial Summary (Last 6 Months)
- Total Income: ₹${income.toLocaleString('en-IN')}
- Total Expenses: ₹${expense.toLocaleString('en-IN')}
- Net Savings: ₹${(income - expense).toLocaleString('en-IN')}
- Savings Rate: ${income ? Math.round(((income - expense) / income) * 100) : 0}%

## Spending by Category
${cats.map(([c, a]) => `- ${c}: ₹${a.toLocaleString('en-IN')} (${income ? Math.round((a / income) * 100) : 0}% of income)`).join('\n')}

Please provide:
1. **Overall Financial Health Assessment** — brief, data-driven (2-3 sentences)
2. **Top 3 Savings Opportunities** — specific categories where I'm overspending, with exact amounts and realistic targets
3. **Actionable 30-Day Plan** — 5 concrete actions I can take this month with expected savings amounts in ₹
4. **Savings Goal Recommendation** — what savings rate I should target and how to get there
5. **One Positive Insight** — something I'm doing well financially

Format your response with clear markdown headers (##) and bullet points. Be specific with rupee amounts. Do not use generic advice.`;
  }

  async function analyze(apiKey, outputEl) {
    const prompt = buildPrompt();
    const url    = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

    outputEl.innerHTML = '<div class="streaming-cursor">Analyzing your finances</div>';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    let fullText = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    outputEl.innerHTML = '<div class="streaming-cursor" id="ai-stream-target"></div>';
    const target = document.getElementById('ai-stream-target');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const json  = JSON.parse(line.slice(6));
          const piece = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          fullText += piece;
          target.innerHTML = markdownToHTML(fullText) + '<span class="streaming-cursor"></span>';
          outputEl.scrollTop = outputEl.scrollHeight;
        } catch {}
      }
    }
    // Final render without cursor
    outputEl.innerHTML = markdownToHTML(fullText);
  }

  function markdownToHTML(md) {
    return md
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>(\n|$))+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/---/g, '<hr/>');
  }

  return { analyze };
})();

/* ═══════════════════════════════════════════════════
   Settings Page
   ═══════════════════════════════════════════════════ */
function renderSettings() {
  const user = Auth.currentUser();
  document.getElementById('settings-avatar').textContent = user.avatar;
  document.getElementById('settings-name').textContent   = user.name;
  document.getElementById('settings-email').textContent  = user.email;
  document.getElementById('settings-since').textContent  = 'Member since ' + (user.joined || 'recently');

  const apiKeyInput = document.getElementById('settings-api-key');
  const savedKey    = DataStore.getGeminiKey();
  apiKeyInput.value = savedKey ? '••••••••••••••••' : '';
  apiKeyInput.placeholder = savedKey ? 'Key saved — click to update' : 'AIza…';
}

/* ═══════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════ */
const PAGE_TITLES = { dashboard: 'Dashboard', transactions: 'Transactions', analytics: 'Analytics', budgets: 'Budgets', advisor: 'AI Advisor', settings: 'Settings' };

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  const navEl  = document.querySelector(`[data-page="${page}"]`);
  if (!pageEl) return;
  pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  window.location.hash = page;

  // Lazy render
  if (page === 'dashboard')    renderDashboard();
  if (page === 'transactions') renderAllTxns();
  if (page === 'analytics')    renderAnalytics();
  if (page === 'budgets')      renderBudgets();
  if (page === 'settings')     renderSettings();

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function renderDashboard() {
  renderKPIs();
  renderCashflowChart();
  renderDonutChart();
  renderDashboardTxns();
}

function renderAnalytics() {
  renderTrendChart();
  renderCatBarChart();
  renderSavingsChart();
}

function refreshAllPages() {
  const active = document.querySelector('.nav-link.active')?.dataset.page || 'dashboard';
  navigateTo(active);
}

/* ═══════════════════════════════════════════════════
   Event Bindings
   ═══════════════════════════════════════════════════ */
function initEventBindings() {
  // Sidebar navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.page); });
  });

  // "View all" buttons
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.goto));
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.signOut(); window.location.href = 'login.html';
  });

  // Add transaction
  document.getElementById('topbar-add-btn').addEventListener('click', openAddModal);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeTxnModal);
  document.getElementById('modal-cancel').addEventListener('click', closeTxnModal);
  document.getElementById('txn-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeTxnModal(); });

  // Tx form submit
  document.getElementById('txn-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('f-edit-id').value;
    const data   = {
      desc:     document.getElementById('f-desc').value.trim(),
      amount:   parseFloat(document.getElementById('f-amount').value),
      type:     document.getElementById('f-type').value,
      category: document.getElementById('f-category').value,
      date:     document.getElementById('f-date').value,
      notes:    document.getElementById('f-notes').value.trim(),
    };
    if (!data.desc || !data.amount || !data.date) { Toast.error('Please fill in required fields.'); return; }

    if (editId) {
      DataStore.update(editId, data);
      Toast.success('Transaction updated.');
    } else {
      DataStore.add(data);
      Toast.success('Transaction added.');
    }
    closeTxnModal();
    refreshMonthSelector();
    refreshAllPages();
  });

  // Transaction filters
  document.getElementById('txn-search').addEventListener('input', e => {
    txnFilterState.search = e.target.value.toLowerCase();
    renderAllTxns();
  });
  document.getElementById('txn-type-filter').addEventListener('change', e => {
    txnFilterState.type = e.target.value;
    renderAllTxns();
  });
  document.getElementById('txn-cat-filter').addEventListener('change', e => {
    txnFilterState.cat = e.target.value;
    renderAllTxns();
  });

  // CSV buttons
  document.getElementById('import-csv-btn').addEventListener('click', () => {
    const dz = document.getElementById('drop-zone');
    dz.classList.toggle('visible');
  });
  document.getElementById('export-csv-btn').addEventListener('click', () => { DataStore.exportCSV(); Toast.success('Export started.'); });

  // Drop zone
  const dz     = document.getElementById('drop-zone');
  const fileIn = document.getElementById('csv-file-input');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); handleCSVFile(e.dataTransfer.files[0]); });
  dz.addEventListener('click', e => { if (e.target !== fileIn && !e.target.classList.contains('csv-link')) fileIn.click(); });
  fileIn.addEventListener('change', e => handleCSVFile(e.target.files[0]));

  // CSV modal
  document.getElementById('csv-modal-close').addEventListener('click', () => document.getElementById('csv-modal').classList.remove('open'));
  document.getElementById('csv-cancel').addEventListener('click', () => document.getElementById('csv-modal').classList.remove('open'));
  document.getElementById('csv-import-btn').addEventListener('click', importFromCSVModal);

  // Delete confirm
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    _pendingDelete = null;
    document.getElementById('confirm-modal').classList.remove('open');
  });
  document.getElementById('confirm-ok').addEventListener('click', () => {
    if (_pendingDelete) { DataStore.remove(_pendingDelete); _pendingDelete = null; Toast.success('Transaction deleted.'); refreshAllPages(); }
    document.getElementById('confirm-modal').classList.remove('open');
  });

  // AI Advisor
  document.getElementById('analyze-btn').addEventListener('click', async () => {
    const apiKey = DataStore.getGeminiKey() || document.getElementById('gemini-key-input')?.value.trim();
    if (!apiKey) { Toast.error('Please enter your Gemini API key in the input below or in Settings.'); return; }
    const btn    = document.getElementById('analyze-btn');
    btn.textContent = 'Analyzing…'; btn.disabled = true;
    try {
      await AIAdvisor.analyze(apiKey, document.getElementById('advisor-output'));
    } catch (err) {
      Toast.error('AI Error: ' + err.message);
      document.getElementById('advisor-output').innerHTML = `<div class="advisor-placeholder"><div class="advisor-placeholder-icon">⚠</div><h3>Something went wrong</h3><p>${err.message}</p></div>`;
    }
    btn.textContent = 'Analyze My Finances'; btn.disabled = false;
  });

  // API Key save (in Advisor sidebar)
  document.getElementById('save-key-btn')?.addEventListener('click', () => {
    const k = document.getElementById('gemini-key-input').value.trim();
    if (!k) { Toast.error('Please enter an API key.'); return; }
    DataStore.setGeminiKey(k);
    Toast.success('API key saved.');
    renderSettings();
  });

  // Settings
  document.getElementById('settings-save-key').addEventListener('click', () => {
    const k = document.getElementById('settings-api-key').value.trim();
    if (!k || k.startsWith('••')) { Toast.info('No changes made.'); return; }
    DataStore.setGeminiKey(k);
    Toast.success('API key saved.');
    renderSettings();
  });
  document.getElementById('settings-export').addEventListener('click', () => { DataStore.exportCSV(); Toast.success('Export started.'); });
  document.getElementById('settings-logout').addEventListener('click', () => { Auth.signOut(); window.location.href = 'login.html'; });
  document.getElementById('settings-clear').addEventListener('click', () => {
    confirmClear('Delete All Data', 'This will permanently delete all your transactions and settings. This cannot be undone.', () => {
      DataStore.clear();
      Toast.success('All data deleted.');
      refreshAllPages();
    });
  });

  // Hamburger (mobile)
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

/* ═══════════════════════════════════════════════════
   User Info in Sidebar
   ═══════════════════════════════════════════════════ */
function renderUserInfo() {
  const user = Auth.currentUser();
  document.getElementById('user-avatar').textContent = user.avatar || '?';
  document.getElementById('user-name').textContent   = user.name;
  document.getElementById('user-email').textContent  = user.email;
}

/* ═══════════════════════════════════════════════════
   Boot
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderUserInfo();
  initMonthFilter();
  initEventBindings();

  // Route on load
  const hash = window.location.hash.slice(1);
  navigateTo(hash || 'dashboard');
});
