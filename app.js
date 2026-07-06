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

const BALANCE_FILTER_KEY = 'pjs.balance.filters.v3';
const MTTO_CACHE_KEY = 'pjs.mtto.local.v2';
const CSV_CACHE_PREFIX = 'pjs.csv.';
let store = {};
let currentCategory = '';

const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

window.addEventListener('DOMContentLoaded', async () => {
  bindNavigation();
  renderCategoryGrid();
  renderTableSelector();
  fillVillaFilter();
  restoreBalanceFilters();
  loadMttoFromLocalFirst();
  setupBalanceFilters();
  renderBalanceQuery();
  await ensureMttoReady(false);
  renderBalanceQuery();
  registerServiceWorker();
});

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.view)));
  $('#refreshBtn').addEventListener('click', async () => {
    if ($('#query-balance').classList.contains('active')) {
      await ensureMttoReady(true);
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
  ['villaFilter', 'yearFilter', 'quickPeriod', 'periodFrom', 'periodTo'].forEach(id => {
    $('#' + id).addEventListener('change', () => { saveBalanceFilters(); renderBalanceQuery(); });
  });
  $('#monthFilter').addEventListener('change', () => { keepAllMonthOptionExclusive(); saveBalanceFilters(); renderBalanceQuery(); });
  $('#clearBalanceFilters').addEventListener('click', clearBalanceFilters);
  $('#tableSelector').addEventListener('change', async () => { await renderSelectedTable(); });
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
    card.addEventListener('click', () => renderModules(card.dataset.category));
  });
}

function renderModules(category) {
  currentCategory = category;
  const cards = MODULES[category].map(key => ({ key, ...(CSV_SOURCES[key] || SPECIAL_MODULES[key]) }));
  $('#moduleGrid').hidden = false;
  $('#moduleGrid').innerHTML = `
    <div class="module-title"><span>${category}</span><button class="mini-btn" id="closeModules">Ocultar</button></div>
    ${cards.map(card => `
      <article class="folder-card small-card" data-card="${card.key}" data-type="${card.type}">
        <div class="folder-icon">${card.icon}</div>
        <h4>${card.label}</h4>
        <p>${card.type.toUpperCase()}</p>
      </article>
    `).join('')}
  `;
  $('#closeModules').addEventListener('click', () => { $('#moduleGrid').hidden = true; currentCategory = ''; });
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

function fillVillaFilter() {
  $('#villaFilter').innerHTML = '<option value="all">Todas</option>' + Array.from({ length: 66 }, (_, i) => {
    const villa = i + 1;
    return `<option value="${villa}">Villa ${String(villa).padStart(2, '0')}</option>`;
  }).join('');
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
    if (key === 'mtto') setupBalanceFilters();
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
  const saved = readSavedBalanceFilters();
  const mtto = store.mtto || [];
  const years = [...new Set(mtto.map(row => row['Año']).filter(Boolean))].sort();
  const months = [...new Set(mtto.map(row => row['Mes']).filter(Boolean))].sort((a,b) => Number(a) - Number(b));
  $('#yearFilter').innerHTML = '<option value="all">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  $('#monthFilter').innerHTML = '<option value="all">Todos</option>' + months.map(m => `<option value="${m}">${monthName(m)}</option>`).join('');
  applyBalanceFilters(saved);
}

function renderBalanceQuery() {
  let rows = [...(store.mtto || [])];
  const villa = $('#villaFilter').value;
  const year = $('#yearFilter').value;
  const months = getSelectedMonths();
  const quick = $('#quickPeriod').value;
  const periodFrom = $('#periodFrom').value;
  const periodTo = $('#periodTo').value;

  document.querySelector('.balance-filters').classList.toggle('custom-period-active', quick === 'custom');

  if (villa !== 'all') rows = rows.filter(row => normalizeVilla(row['Villa']) === villa);
  if (year !== 'all') rows = rows.filter(row => String(row['Año']) === year);
  if (!months.includes('all')) rows = rows.filter(row => months.includes(String(row['Mes'])));
  if (quick === 'last6') rows = getLastSixMonths(rows);
  if (quick === 'custom') rows = filterCustomPeriod(rows, periodFrom, periodTo);

  const totalPago = rows.reduce((sum, row) => sum + parseMoney(row['Pago']), 0);
  const totalCargos = rows.reduce((sum, row) => sum + parseMoney(row['Anticipada']) + parseMoney(row['Normal']), 0);
  const saldoCalculado = totalCargos - totalPago;

  $('#kpiPago').textContent = money.format(totalPago);
  $('#kpiCargos').textContent = money.format(totalCargos);
  $('#kpiSaldo').textContent = money.format(saldoCalculado);
  $('#kpiRows').textContent = rows.length;
  $('#balanceCount').textContent = `${rows.length} registro${rows.length === 1 ? '' : 's'}`;

  const singleVilla = villa !== 'all';
  renderVillaSummary(singleVilla, villa, rows);

  const columns = singleVilla
    ? ['Año', 'Mes', 'Anticipada', 'Normal', 'Dia Pago', 'Pago', 'Fuente', 'Banco/Cta', 'Saldo']
    : ['Año', 'Mes', 'Villa', 'Nombre', 'Anticipada', 'Normal', 'Dia Pago', 'Pago', 'Fuente', 'Banco/Cta', 'Saldo'];
  renderTable('#balanceTable', rows, columns);
}

function renderVillaSummary(singleVilla, villa, rows) {
  const summary = $('#villaSummary');
  if (!singleVilla) { summary.hidden = true; summary.innerHTML = ''; return; }
  const first = rows[0] || {};
  const name = first['Nombre'] || rows.find(row => row['Nombre'])?.['Nombre'] || 'Sin nombre disponible';
  summary.hidden = false;
  summary.innerHTML = `
    <article class="villa-info-card"><span>Villa</span><strong>Villa ${String(villa).padStart(2, '0')}</strong></article>
    <article class="villa-info-card"><span>Nombre</span><strong>${escapeHtml(name)}</strong></article>
    <article class="villa-info-card"><span>Status</span><strong>Verde</strong></article>
    <article class="villa-info-card"><span>Observaciones</span><strong>Falta Cerco</strong></article>
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
    <thead><tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${escapeHtml(row[col] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>
  `;
}

function keepAllMonthOptionExclusive() {
  const monthFilter = $('#monthFilter');
  const selected = [...monthFilter.selectedOptions].map(option => option.value);
  if (selected.includes('all') && selected.length > 1) {
    [...monthFilter.options].forEach(option => option.selected = option.value !== 'all' && option.selected);
  }
}

function getSelectedMonths() {
  const values = [...$('#monthFilter').selectedOptions].map(option => option.value);
  return values.length ? values : ['all'];
}

function setMultiSelectValues(selector, values) {
  const el = $(selector);
  if (!el) return;
  const list = Array.isArray(values) ? values : [values];
  [...el.options].forEach(option => option.selected = list.includes(option.value));
  if (![...el.selectedOptions].length && el.options.length) el.options[0].selected = true;
}

function saveBalanceFilters() {
  const filters = { villa: $('#villaFilter').value, year: $('#yearFilter').value, months: getSelectedMonths(), quick: $('#quickPeriod').value, from: $('#periodFrom').value, to: $('#periodTo').value };
  localStorage.setItem(BALANCE_FILTER_KEY, JSON.stringify(filters));
}

function readSavedBalanceFilters() {
  try { return JSON.parse(localStorage.getItem(BALANCE_FILTER_KEY) || '{}'); }
  catch { return {}; }
}

function restoreBalanceFilters() { applyBalanceFilters(readSavedBalanceFilters()); }

function applyBalanceFilters(filters = {}) {
  setSelectValue('#villaFilter', filters.villa || 'all');
  setSelectValue('#yearFilter', filters.year || 'all');
  setMultiSelectValues('#monthFilter', filters.months || filters.month || ['all']);
  setSelectValue('#quickPeriod', filters.quick || 'all');
  $('#periodFrom').value = filters.from || '';
  $('#periodTo').value = filters.to || '';
  document.querySelector('.balance-filters')?.classList.toggle('custom-period-active', $('#quickPeriod').value === 'custom');
}

function clearBalanceFilters() {
  localStorage.removeItem(BALANCE_FILTER_KEY);
  applyBalanceFilters({ villa: 'all', year: 'all', months: ['all'], quick: 'all', from: '', to: '' });
  renderBalanceQuery();
  toast('Filtros reiniciados');
}

function setSelectValue(selector, value) {
  const el = $(selector);
  if (!el) return;
  const hasValue = [...el.options].some(option => option.value === value);
  el.value = hasValue ? value : 'all';
}

function parseMoney(value = '') {
  const clean = String(value).replace(/[$,\s]/g, '').replace(/[()]/g, '-');
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function normalizeVilla(value = '') {
  const match = String(value).match(/\d+/);
  return match ? String(Number(match[0])) : '';
}

function monthName(month) {
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return names[Number(month) - 1] || month;
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
