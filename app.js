const CSV_SOURCES = {
  mtto: { label: 'Mtto', type: 'csv', group: 'Privada', icon: '🧾', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=1976463821&single=true&output=csv' },
  toldo: { label: 'Toldo', type: 'csv', group: 'Privada', icon: '⛱️', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=1819162206&single=true&output=csv' },
  multas: { label: 'Multas', type: 'csv', group: 'Privada', icon: '⚠️', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=1019219324&single=true&output=csv' },
  vecinos: { label: 'Vecinos', type: 'csv', group: 'Directorio', icon: '🏘️', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=794820885&single=true&output=csv' },
  correos: { label: 'Correos', type: 'csv', group: 'Directorio', icon: '📬', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=620418862&single=true&output=csv' },
  inquilinos: { label: 'Inquilinos', type: 'csv', group: 'Directorio', icon: '🔑', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=355721770&single=true&output=csv' },
  abonos: { label: 'Abonos', type: 'csv', group: 'Finanzas', icon: '💳', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=2055302723&single=true&output=csv' },
  egresos: { label: 'Egresos', type: 'csv', group: 'Finanzas', icon: '📉', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=1661499044&single=true&output=csv' },
  cifs: { label: 'CIFs', type: 'csv', group: 'Fiscal', icon: '🗂️', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlnwsqrzhirDQNLArGj3tLiQOT5QmFZy-IXNJEL9eo6XXSE-jyKkAR1XNe2zQfocI_IfXJ6Ok6ZxKH/pub?gid=1103588265&single=true&output=csv' },
};

const MODULES = {
  Privada: ['mtto', 'toldo', 'multas'],
  Directorio: ['vecinos', 'correos', 'inquilinos'],
  Finanzas: ['balance', 'abonos', 'egresos'],
  Fiscal: ['timbrados', 'estadosCuenta', 'cifs'],
};

const SPECIAL_MODULES = {
  balance: { label: 'Balances', type: 'query', group: 'Finanzas', icon: '📊' },
  timbrados: { label: 'Timbrados', type: 'query', group: 'Fiscal', icon: '🧾' },
  estadosCuenta: { label: 'Estados de Cuenta', type: 'pdfs', group: 'Fiscal', icon: '📄' },
};

const BALANCE_FILTER_KEY = 'pjs.balance.filters.v6';
const MTTO_CACHE_KEY = 'pjs.mtto.local.v3';
const CSV_CACHE_PREFIX = 'pjs.csv.';
const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const VILLA_RANGES = [
  { label: '01-19', start: 1, end: 19 },
  { label: '20-29', start: 20, end: 29 },
  { label: '30-39', start: 30, end: 39 },
  { label: '40-49', start: 40, end: 49 },
  { label: '50-59', start: 50, end: 59 },
  { label: '60-66', start: 60, end: 66 },
];
let store = {};
let currentCategory = '';
let balanceState = { villa: 'all', villaRange: '', year: 'all', months: ['all'], quick: 'all', from: '', to: '' };
let lastBalanceRows = [];
let lastBalanceColumns = [];

const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

window.addEventListener('DOMContentLoaded', async () => {
  bindNavigation();
  renderCategoryGrid();
  renderTableSelector();
  balanceState = { ...balanceState, ...readSavedBalanceFilters() };
  loadMttoFromLocalFirst();
  setupBalanceFilters();
  renderBalanceQuery();
  await ensureMttoReady(false);
  setupBalanceFilters();
  renderBalanceQuery();
  registerServiceWorker();
});

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.view)));
  $('#refreshBtn').addEventListener('click', async () => {
    if ($('#query-balance').classList.contains('active')) {
      await ensureMttoReady(true);
      setupBalanceFilters();
      renderBalanceQuery();
      toast('Mtto actualizado');
      return;
    }
    if ($('#tables').classList.contains('active')) {
      await loadCsv($('#tableSelector').value, true);
      renderSelectedTable();
      toast('Hoja actualizada');
      return;
    }
    await ensureMttoReady(true);
    toast('Datos actualizados');
  });
  $('#clearBalanceFilters').addEventListener('click', clearBalanceFilters);
  $('#periodFrom').addEventListener('change', () => updateBalanceState({ from: $('#periodFrom').value }));
  $('#periodTo').addEventListener('change', () => updateBalanceState({ to: $('#periodTo').value }));
  $('#tableSelector').addEventListener('change', async () => { await renderSelectedTable(); });
  $('#exportBalancePdf').addEventListener('click', exportBalancePdf);
}

function openView(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
  $('#' + viewId).classList.add('active');
  $('#view-title').textContent = viewId === 'home' ? 'Bienvenida' : viewId === 'query-balance' ? 'Balances' : 'Hojas publicadas';
  if (viewId === 'query-balance') {
    loadMttoFromLocalFirst();
    setupBalanceFilters();
    renderBalanceQuery();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCategoryGrid() {
  const descriptions = {
    Privada: 'Mtto, toldo y multas',
    Directorio: 'Vecinos, correos e inquilinos',
    Finanzas: 'Balances, abonos y egresos',
    Fiscal: 'Timbrados, estados y CIFs',
  };
  $('#categoryGrid').innerHTML = Object.keys(MODULES).map(name => `
    <article class="category-card" data-category="${name}">
      <div class="folder-icon">${categoryIcon(name)}</div>
      <h4>${name}</h4>
      <p>${descriptions[name]}</p>
    </article>
  `).join('');
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(item => item.classList.toggle('active', item === card));
      renderModules(card.dataset.category);
      setTimeout(() => $('#moduleGrid').scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
    });
  });
}

function renderModules(category) {
  currentCategory = category;
  const cards = MODULES[category].map(key => ({ key, ...(CSV_SOURCES[key] || SPECIAL_MODULES[key]) }));
  $('#moduleGrid').hidden = false;
  $('#moduleGrid').innerHTML = `
    <div class="module-title active-${category.toLowerCase()}"><span>${category}</span><button class="mini-btn" id="closeModules">Ocultar</button></div>
    ${cards.map(card => `
      <article class="folder-card small-card" data-card="${card.key}" data-type="${card.type}">
        <div class="folder-icon">${card.icon}</div>
        <h4>${card.label}</h4>
        <p>${card.type.toUpperCase()}</p>
      </article>
    `).join('')}
  `;
  $('#closeModules').addEventListener('click', () => {
    $('#moduleGrid').hidden = true;
    currentCategory = '';
    document.querySelectorAll('.category-card').forEach(item => item.classList.remove('active'));
    $('.topbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.querySelectorAll('.folder-card').forEach(card => {
    card.addEventListener('click', async () => {
      if (card.dataset.card === 'balance') return openView('query-balance');
      if (CSV_SOURCES[card.dataset.card]) {
        $('#tableSelector').value = card.dataset.card;
        await renderSelectedTable();
        openView('tables');
        return;
      }
      toast('Módulo preparado para siguiente fase. Aún no le ponemos turbo.');
    });
  });
}

function categoryIcon(name) {
  return { Privada: '🏡', Directorio: '👥', Finanzas: '💰', Fiscal: '📁' }[name] || '📂';
}

function renderTableSelector() {
  $('#tableSelector').innerHTML = Object.entries(CSV_SOURCES).map(([key, item]) => `<option value="${key}">${item.label}</option>`).join('');
}

function loadMttoFromLocalFirst() {
  const cached = readCache(MTTO_CACHE_KEY);
  if (cached.length) store.mtto = cached;
}

async function ensureMttoReady(force = false) {
  if (!force && store.mtto?.length) return store.mtto;
  return loadCsv('mtto', force);
}

async function loadCsv(key, force = false) {
  const source = CSV_SOURCES[key];
  if (!source) return [];
  const cacheKey = key === 'mtto' ? MTTO_CACHE_KEY : `${CSV_CACHE_PREFIX}${key}`;
  if (!force) {
    const cached = readCache(cacheKey);
    if (cached.length) {
      store[key] = cached;
      return cached;
    }
  }
  try {
    toast(force ? 'Actualizando...' : 'Cargando...');
    const bust = `&t=${Date.now()}`;
    const response = await fetch(source.url + bust, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const parsed = parseCsv(text);
    store[key] = parsed;
    saveCache(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error cargando ${source.label}:`, error);
    const fallback = readCache(cacheKey);
    store[key] = fallback;
    toast(fallback.length ? 'Usando datos locales' : 'No se pudo cargar la hoja');
    return fallback;
  }
}

function readCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(cached) ? cached : [];
  } catch { return []; }
}

function saveCache(key, rows) {
  try { localStorage.setItem(key, JSON.stringify(rows)); }
  catch (error) { console.warn('No se pudo guardar en Local Storage:', error); }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && insideQuotes && next === '"') { value += '"'; i++; }
    else if (char === '"') insideQuotes = !insideQuotes;
    else if (char === ',' && !insideQuotes) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (value || row.length) { row.push(value); rows.push(row); row = []; value = ''; }
      if (char === '\r' && next === '\n') i++;
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift()?.map(h => h.trim()) || [];
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
}

function setupBalanceFilters() {
  renderVillaRanges();
  renderVillaButtons();
  renderYearButtons();
  renderMonthButtons();
  renderQuickPeriodButtons();
  syncBalanceControls();
}

function renderVillaRanges() {
  $('#villaRangeButtons').innerHTML = [
    `<button class="filter-chip" type="button" data-range="all">Todas</button>`,
    ...VILLA_RANGES.map(r => `<button class="filter-chip" type="button" data-range="${r.label}">${r.label}</button>`)
  ].join('');
  $('#villaRangeButtons').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const range = btn.dataset.range;
      if (range === 'all') updateBalanceState({ villaRange: '', villa: 'all' });
      else updateBalanceState({ villaRange: range, villa: 'all' });
    });
  });
}

function renderVillaButtons() {
  const range = VILLA_RANGES.find(r => r.label === balanceState.villaRange);
  if (!range) { $('#villaButtons').hidden = true; $('#villaButtons').innerHTML = ''; return; }
  const buttons = [];
  for (let villa = range.start; villa <= range.end; villa++) {
    buttons.push(`<button class="filter-chip mini-chip" type="button" data-villa="${villa}">${String(villa).padStart(2, '0')}</button>`);
  }
  $('#villaButtons').hidden = false;
  $('#villaButtons').innerHTML = buttons.join('');
  $('#villaButtons').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => updateBalanceState({ villa: btn.dataset.villa }));
  });
}

function renderYearButtons() {
  const mttoYears = [...new Set((store.mtto || []).map(row => row['Año']).filter(Boolean))].sort();
  const baseYears = ['2021','2022','2023','2024','2025','2026'];
  const years = [...new Set([...baseYears, ...mttoYears])].sort();
  $('#yearButtons').innerHTML = [`<button class="filter-chip" type="button" data-year="all">Todos</button>`, ...years.map(y => `<button class="filter-chip" type="button" data-year="${y}">${y}</button>`)].join('');
  $('#yearButtons').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => updateBalanceState({ year: btn.dataset.year }));
  });
}

function renderMonthButtons() {
  $('#monthButtons').innerHTML = [`<button class="filter-chip" type="button" data-month="all">Todos</button>`, ...MONTHS.map(m => `<button class="filter-chip mini-chip" type="button" data-month="${m}">${String(m).padStart(2, '0')}</button>`)].join('');
  $('#monthButtons').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => toggleMonth(btn.dataset.month));
  });
}

function renderQuickPeriodButtons() {
  const periods = [
    { value: 'all', label: 'Todo' },
    { value: 'last6', label: '6 Meses' },
    { value: 'custom', label: 'Específico' },
  ];
  $('#quickPeriodButtons').innerHTML = periods.map(p => `<button class="filter-chip" type="button" data-quick="${p.value}">${p.label}</button>`).join('');
  $('#quickPeriodButtons').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => updateBalanceState({ quick: btn.dataset.quick }));
  });
}

function updateBalanceState(patch) {
  balanceState = { ...balanceState, ...patch };
  if (!Array.isArray(balanceState.months) || !balanceState.months.length) balanceState.months = ['all'];
  saveBalanceFilters();
  setupBalanceFilters();
  renderBalanceQuery();
}

function toggleMonth(month) {
  let months = Array.isArray(balanceState.months) ? [...balanceState.months] : ['all'];
  if (month === 'all') months = ['all'];
  else {
    months = months.filter(m => m !== 'all');
    if (months.includes(month)) months = months.filter(m => m !== month);
    else months.push(month);
    if (!months.length) months = ['all'];
  }
  updateBalanceState({ months: months.sort((a,b) => Number(a) - Number(b)) });
}

function syncBalanceControls() {
  $('#periodFrom').value = balanceState.from || '';
  $('#periodTo').value = balanceState.to || '';
  $('#customPeriodFields').hidden = balanceState.quick !== 'custom';
  document.querySelectorAll('[data-range]').forEach(btn => btn.classList.toggle('active', (btn.dataset.range === 'all' && !balanceState.villaRange && balanceState.villa === 'all') || btn.dataset.range === balanceState.villaRange));
  document.querySelectorAll('[data-villa]').forEach(btn => btn.classList.toggle('active', btn.dataset.villa === balanceState.villa));
  document.querySelectorAll('[data-year]').forEach(btn => btn.classList.toggle('active', btn.dataset.year === balanceState.year));
  document.querySelectorAll('[data-month]').forEach(btn => btn.classList.toggle('active', balanceState.months.includes(btn.dataset.month)));
  document.querySelectorAll('[data-quick]').forEach(btn => btn.classList.toggle('active', btn.dataset.quick === balanceState.quick));
}

function renderBalanceQuery() {
  let rows = [...(store.mtto || [])];
  const { villa, year, months, quick, from, to } = balanceState;

  if (villa !== 'all') rows = rows.filter(row => normalizeVilla(row['Villa']) === villa);
  if (year !== 'all') rows = rows.filter(row => String(row['Año']) === year);
  if (!months.includes('all')) rows = rows.filter(row => months.includes(String(Number(row['Mes']))));
  if (quick === 'last6') rows = getLastSixMonths(rows);
  if (quick === 'custom') rows = filterCustomPeriod(rows, from, to);

  const totalPago = rows.reduce((sum, row) => sum + parseMoney(row['Pago']), 0);
  const totalCargos = rows.reduce((sum, row) => sum + parseMoney(row['Anticipada']) + parseMoney(row['Normal']), 0);
  const saldoCalculado = totalCargos - totalPago;

  $('#kpiPago').textContent = formatMoney(totalPago);
  $('#kpiCargos').textContent = formatMoney(totalCargos);
  $('#kpiSaldo').innerHTML = formatMoneyHtml(saldoCalculado);
  $('#kpiRows').textContent = rows.length;
  $('#balanceCount').textContent = `${rows.length} registro${rows.length === 1 ? '' : 's'}`;

  const singleVilla = villa !== 'all';
  renderVillaSummary(singleVilla, villa, rows);

  const columns = singleVilla
    ? ['Año', 'Mes', 'Anticipada', 'Normal', 'Dia Pago', 'Pago', 'Fuente', 'Banco/Cta', 'Saldo']
    : ['Año', 'Mes', 'Villa', 'Nombre', 'Anticipada', 'Normal', 'Dia Pago', 'Pago', 'Fuente', 'Banco/Cta', 'Saldo'];
  lastBalanceRows = rows;
  lastBalanceColumns = columns;
  renderTable('#balanceTable', rows, columns);
}

function renderVillaSummary(singleVilla, villa, rows) {
  const summary = $('#villaSummary');
  if (!singleVilla) { summary.hidden = true; summary.innerHTML = ''; return; }
  const first = rows[0] || {};
  const name = first['Nombre'] || rows.find(row => row['Nombre'])?.['Nombre'] || 'Sin nombre disponible';
  const status = first['Status'] || 'Verde';
  summary.hidden = false;
  summary.innerHTML = `
    <div class="villa-lines">
      <div><span>Villa</span><strong>Villa ${String(villa).padStart(2, '0')}</strong></div>
      <div><span>Nombre</span><strong>${escapeHtml(name)}</strong></div>
      <div class="status-line status-${normalizeStatus(status)}"><span>Status</span><strong>${escapeHtml(status)}</strong></div>
    </div>
    <article class="villa-info-card observations-card"><span>Observaciones</span><strong>Falta Cerco</strong></article>
  `;
}

function filterCustomPeriod(rows, from, to) {
  if (!from && !to) return rows;
  return rows.filter(row => {
    const period = getRowPeriod(row);
    if (!period) return false;
    if (from && period < from) return false;
    if (to && period > to) return false;
    return true;
  });
}

function getLastSixMonths(rows) {
  const sortedPeriods = [...new Set(rows.map(getRowPeriod))].filter(Boolean).sort().slice(-6);
  return rows.filter(row => sortedPeriods.includes(getRowPeriod(row)));
}

function getRowPeriod(row) {
  const year = row['Año'];
  const month = row['Mes'];
  if (!year || !month) return '';
  return `${year}-${String(month).padStart(2, '0')}`;
}

async function renderSelectedTable() {
  const key = $('#tableSelector').value;
  if (!store[key]?.length) await loadCsv(key, false);
  const rows = store[key] || [];
  renderTable('#csvTable', rows.slice(0, 300));
}

function renderTable(selector, rows, preferredColumns = null) {
  const table = $(selector);
  if (!rows.length) { table.innerHTML = '<tbody><tr><td>No hay datos para mostrar.</td></tr></tbody>'; return; }
  const columns = preferredColumns || Object.keys(rows[0]).filter(col => !['x'].includes(col));
  table.innerHTML = `
    <thead><tr>${columns.map(col => `<th class="${columnClass(col)}">${escapeHtml(col)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${columns.map(col => renderCell(col, row[col] ?? '')).join('')}</tr>`).join('')}</tbody>
  `;
}

function renderCell(column, value) {
  const cls = columnClass(column);
  const display = formatCellValue(column, value);
  return `<td class="${cls}">${display}</td>`;
}

function formatCellValue(column, value) {
  if (isMoneyColumn(column)) return formatMoneyHtml(parseMoney(value));
  if (isDateColumn(column)) return escapeHtml(formatDateShort(value));
  return escapeHtml(value);
}

function columnClass(column) {
  if (isMoneyColumn(column) || isNumericColumn(column)) return 'align-right';
  if (isDateColumn(column) || ['Año', 'Mes'].includes(column)) return 'align-center';
  return 'align-right';
}

function isMoneyColumn(column) {
  return ['Mora','Anticipada','Normal','Pegar','Pago','Abono','Saldo','Monto'].includes(column);
}

function isNumericColumn(column) {
  return ['Villa','Casa','Pax'].includes(column);
}

function isDateColumn(column) {
  return ['Fecha','Dia Pago','dia pago','Día Pago'].includes(column);
}

function formatDateShort(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const monthNames = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const dd = slash[1].padStart(2, '0');
    const mm = monthNames[Number(slash[2]) - 1] || slash[2];
    const yy = slash[3].slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
  const dash = raw.toLowerCase().match(/^(\d{1,2})[-\/ ]([a-záéíóúñ]{3,})[-\/ ](\d{2,4})$/i);
  if (dash) return `${dash[1].padStart(2,'0')}/${dash[2].slice(0,3)}/${dash[3].slice(-2)}`;
  return raw;
}

function saveBalanceFilters() {
  localStorage.setItem(BALANCE_FILTER_KEY, JSON.stringify(balanceState));
}

function readSavedBalanceFilters() {
  try { return JSON.parse(localStorage.getItem(BALANCE_FILTER_KEY) || '{}'); }
  catch { return {}; }
}

function clearBalanceFilters() {
  localStorage.removeItem(BALANCE_FILTER_KEY);
  balanceState = { villa: 'all', villaRange: '', year: 'all', months: ['all'], quick: 'all', from: '', to: '' };
  setupBalanceFilters();
  renderBalanceQuery();
  toast('Filtros reiniciados');
}

function parseMoney(value = '') {
  const text = String(value).trim();
  const isParenNegative = /^\(.*\)$/.test(text);
  const clean = text.replace(/[$,\s()]/g, '');
  const number = Number(clean);
  if (!Number.isFinite(number)) return 0;
  return isParenNegative ? -Math.abs(number) : number;
}

function formatMoney(value) {
  return money.format(value || 0);
}

function formatMoneyHtml(value) {
  const numeric = Number(value) || 0;
  if (numeric < 0) return `<span class="money-negative">(${money.format(Math.abs(numeric))})</span>`;
  return escapeHtml(money.format(numeric));
}

function normalizeVilla(value = '') {
  const match = String(value).match(/\d+/);
  return match ? String(Number(match[0])) : '';
}

function normalizeStatus(value = '') {
  const clean = String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('amarillo')) return 'amarillo';
  if (clean.includes('rojo')) return 'rojo';
  if (clean.includes('naranja')) return 'naranja';
  if (clean.includes('negro')) return 'negro';
  return 'verde';
}

function exportBalancePdf() {
  if (!lastBalanceRows.length) { toast('No hay registros para exportar'); return; }
  const rowsHtml = lastBalanceRows.map(row => `<tr>${lastBalanceColumns.map(col => `<td>${formatCellValue(col, row[col] ?? '')}</td>`).join('')}</tr>`).join('');
  const tableHtml = `<table><thead><tr>${lastBalanceColumns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
  const summaryHtml = $('#villaSummary').hidden ? '' : $('#villaSummary').innerHTML;
  const printWindow = window.open('', '_blank');
  if (!printWindow) { toast('Permite ventanas emergentes para exportar'); return; }
  printWindow.document.write(`
    <!doctype html><html lang="es"><head><meta charset="utf-8"><title>Balance PJS</title>
    <style>
      body{font-family:Montserrat,Arial,sans-serif;color:#18302f;padding:24px}h1{margin:0 0 8px}p{margin:0 0 18px;color:#566}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #dce6e1;padding:7px;text-align:right}th{background:#e4f4ee;color:#0f3d3e}.money-negative{color:#c62828;font-weight:800}.villa-lines,.observations-card{margin:10px 0;padding:10px;border:1px solid #dce6e1;border-radius:10px}.villa-lines div{margin:4px 0}.villa-lines span,.observations-card span{font-weight:800;margin-right:8px}@media print{button{display:none}}
    </style></head><body>
      <h1>Balance PJS</h1><p>Exportación de balance filtrado · ${new Date().toLocaleDateString('es-MX')}</p>
      ${summaryHtml}<button onclick="window.print()">Guardar / imprimir PDF</button>${tableHtml}
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>
  `);
  printWindow.document.close();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function toast(message) {
  const toastEl = $('#toast');
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('SW error:', error));
  }
}
