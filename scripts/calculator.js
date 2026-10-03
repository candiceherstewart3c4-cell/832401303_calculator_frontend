/* Input and rendering only; all results come from the backend. */
(() => {
  'use strict';
  const input = document.querySelector('#expressionInput');
  const display = document.querySelector('#display');
  const status = document.querySelector('#expression');
  const list = document.querySelector('#historyList');
  const panel = document.querySelector('#historyPanel');
  let records = [];
  let activeMode = 'calculate';
  let historyPage = 1;
  let historyMeta = { total: 0, allTotal: 0, pages: 1 };
  let historyTimer;
  let busy = false;
  let timer;
  let lastResult = null;
  let previousInput = input.value;
  const edits = [];
  const search = document.querySelector('#historySearch');
  const copyButton = document.querySelector('#copyButton');
  const favoritesOnly = document.querySelector('#favoritesOnly');
  const conversionValue = document.querySelector('#conversionValue');
  const convertFrom = document.querySelector('#convertFrom');
  const convertTo = document.querySelector('#convertTo');
  const unitCategory = document.querySelector('#unitCategory');
  const conversionStatus = document.querySelector('#conversionStatus');
  const conversionOutput = document.querySelector('#conversionOutput');
  const numberFormat = document.querySelector('#numberFormat');
  const decimalPlaces = document.querySelector('#decimalPlaces');
  const copyConversion = document.querySelector('#copyConversion');
  let displayedResult = null;
  let conversionResult = null;
  let conversionKind = 'unit';
  const formatted = (value, kind = 'calculate') => window.CloverNumberFormat.formatResult(value, { full: numberFormat.value === 'full', kind, decimalPlaces: decimalPlaces.value === 'auto' ? 'auto' : Number(decimalPlaces.value) });
  function renderResults() {
    if (displayedResult !== null) {
      display.textContent = formatted(displayedResult);
      display.classList.toggle('compact', display.textContent.length > 10);
    }
    if (conversionResult !== null) conversionOutput.textContent = formatted(conversionResult, conversionKind);
  }
  function updateNumberDisplay() {
    decimalPlaces.disabled = numberFormat.value === 'full';
    renderResults();
    renderHistory();
  }
  numberFormat.addEventListener('change', updateNumberDisplay);
  decimalPlaces.addEventListener('change', updateNumberDisplay);
  // Labels only: conversion factors and arithmetic are exclusively on the server.
  const unitLabels = {
    length: { mm: 'Millimetres (mm)', cm: 'Centimetres (cm)', m: 'Metres (m)', km: 'Kilometres (km)' },
    mass: { mg: 'Milligrams (mg)', g: 'Grams (g)', kg: 'Kilograms (kg)' },
    temperature: { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' }
  };
  function conversionChanged() {
    conversionResult = null;
    copyConversion.disabled = true;
    conversionOutput.textContent = '—';
    conversionStatus.textContent = 'Press Convert & save to calculate.';
    conversionValue.removeAttribute('aria-invalid');
  }
  function populateUnits() {
    const labels = activeMode === 'base' ? { 2: 'Binary (2)', 8: 'Octal (8)', 10: 'Decimal (10)', 16: 'Hexadecimal (16)' } : unitLabels[unitCategory.value];
    for (const select of [convertFrom, convertTo]) {
      select.replaceChildren(...Object.entries(labels).map(([value, label]) => new Option(label, value)));
    }
    [convertFrom.value, convertTo.value] = activeMode === 'base' ? ['10', '16'] : unitCategory.value === 'length' ? ['km', 'm'] : unitCategory.value === 'mass' ? ['kg', 'g'] : ['C', 'F'];
    conversionChanged();
  }
  function setMode(mode) {
    if (busy) return;
    activeMode = mode;
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    document.querySelector('#calculatorPane').hidden = mode !== 'calculate';
    document.querySelector('#conversionPane').hidden = mode === 'calculate';
    if (mode === 'calculate') return;
    document.querySelector('#categoryField').hidden = mode === 'base';
    document.querySelector('#conversionTitle').textContent = mode === 'base' ? 'Number bases' : 'Unit converter';
    document.querySelector('#conversionHelp').hidden = mode !== 'base';
    document.querySelector('#conversionHelp').textContent = mode === 'base' ? 'Signed integers, up to 128 digits. No fractions or prefixes such as 0x.' : '';
    conversionValue.value = mode === 'base' ? '255' : '1';
    populateUnits();
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  unitCategory.addEventListener('change', populateUnits);
  [conversionValue, convertFrom, convertTo].forEach(element => element.addEventListener('input', conversionChanged));
  document.querySelector('#conversionForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const request = { kind: activeMode, value: conversionValue.value, from: activeMode === 'base' ? Number(convertFrom.value) : convertFrom.value, to: activeMode === 'base' ? Number(convertTo.value) : convertTo.value };
    if (activeMode === 'unit') request.category = unitCategory.value;
    busy = true;
    document.querySelector('#conversionFields').disabled = true;
    conversionResult = null;
    copyConversion.disabled = true;
    conversionOutput.textContent = '—';
    conversionStatus.textContent = 'Converting…';
    try {
      const data = await api('/convert', { method: 'POST', body: JSON.stringify(request) });
      conversionResult = data.resultLabel;
      conversionKind = request.kind;
      renderResults();
      copyConversion.disabled = false;
      conversionStatus.textContent = `${data.expression} · Saved to history`;
      conversionValue.removeAttribute('aria-invalid');
      historyPage = 1;
      try { await loadHistory(); } catch (error) { notify(`Conversion saved; history refresh failed: ${error.message}`); }
    } catch (error) {
      conversionValue.setAttribute('aria-invalid', 'true');
      conversionStatus.textContent = error.message;
      conversionOutput.textContent = 'Error';
    } finally {
      busy = false;
      document.querySelector('#conversionFields').disabled = false;
    }
  });
  const shell = document.querySelector('.app-shell');
  const historyToggle = document.querySelector('#historyToggle');
  const scienceToggle = document.querySelector('#scienceToggle');
  const wideLayout = window.matchMedia('(min-width: 1000px)');
  function setHistoryOpen(open) {
    panel.hidden = !open;
    shell.classList.toggle('history-open', open);
    historyToggle.setAttribute('aria-expanded', String(open));
  }
  function setScienceOpen(open) {
    document.querySelector('#scienceKeys').hidden = !open;
    scienceToggle.setAttribute('aria-expanded', String(open));
    if (!open) setShift(false);
  }
  let historyRequest = 0;
  let shifted = false;
  const functionLabels = {
    sin: ['sin', 'Sine'], cos: ['cos', 'Cosine'], tan: ['tan', 'Tangent'],
    asin: ['sin⁻¹', 'Inverse sine'], acos: ['cos⁻¹', 'Inverse cosine'], atan: ['tan⁻¹', 'Inverse tangent'],
    log: ['log', 'Base 10 logarithm'], ln: ['ln', 'Natural logarithm'],
    exp10: ['10ˣ', '10 to the power'], exp: ['eˣ', 'Exponential'], pi: ['π', 'Pi'], e: ['e', 'Euler constant']
  };
  function setShift(enabled) {
    shifted = enabled;
    document.querySelector('#shiftToggle').setAttribute('aria-pressed', String(enabled));
    document.querySelectorAll('#scienceKeys [data-primary]').forEach(button => {
      const active = functionLabels[enabled ? button.dataset.secondary : button.dataset.primary];
      const alternate = functionLabels[enabled ? button.dataset.primary : button.dataset.secondary];
      button.querySelector('span').textContent = active[0];
      button.querySelector('small').textContent = alternate[0];
      button.setAttribute('aria-label', active[1]);
    });
  }
  const angleInputs = [...document.querySelectorAll('[name="angleMode"]')];
  const angleMode = () => angleInputs.find(radio => radio.checked).value;
  function setAngleMode(mode) {
    angleInputs.forEach(radio => { radio.checked = radio.value === mode; });
    document.querySelector('#angleHint').textContent = mode === 'deg' ? 'Degrees · sin(30) = 0.5' : 'Radians · sin(pi/6) = 0.5';
  }
  angleInputs.forEach(radio => radio.addEventListener('change', () => { setAngleMode(radio.value); changed(); }));
  scienceToggle.addEventListener('click', () => setScienceOpen(document.querySelector('#scienceKeys').hidden));
  function adaptLayout() {
    setHistoryOpen(wideLayout.matches);
    setScienceOpen(wideLayout.matches);
  }
  wideLayout.addEventListener('change', adaptLayout);
  adaptLayout();
  function remember(value) {
    edits.push(value);
    if (edits.length > 60) edits.shift();
  }
  function changed() {
    previousInput = input.value;
    input.removeAttribute('aria-invalid');
    document.querySelector('.display').classList.remove('has-error');
    status.textContent = input.value ? 'Press Enter or = to calculate' : 'Enter an expression';
  }
  function replaceSelection(value, start = input.selectionStart, end = input.selectionEnd) {
    const next = input.value.slice(0, start) + value + input.value.slice(end);
    if (next.length > 200) { notify('Keep expressions within 200 characters.'); return false; }
    remember(input.value);
    input.value = next;
    input.setSelectionRange(start + value.length, start + value.length);
    changed();
    return true;
  }
  input.addEventListener('input', () => { remember(previousInput); changed(); });
  const focusToggle = document.querySelector('#focusToggle');
  function setFocus(enabled) {
    document.body.classList.toggle('focus-mode', enabled);
    focusToggle.setAttribute('aria-pressed', String(enabled));
    focusToggle.textContent = enabled ? 'Scenic mode' : 'Focus mode';
  }
  try { setFocus(localStorage.getItem('clover-focus') === 'true'); } catch { /* Preference storage is optional. */ }
  focusToggle.addEventListener('click', () => {
    const enabled = !document.body.classList.contains('focus-mode');
    setFocus(enabled);
    try { localStorage.setItem('clover-focus', String(enabled)); } catch { /* Keep the toggle usable. */ }
  });
  function notify(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 4000);
  }
  async function api(path, options = {}) {
    try {
      const response = await fetch(window.CALCULATOR_API_URL + path, {
        ...options,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json();
      document.querySelector('#connectionStatus').textContent = 'Service connected';
      document.querySelector('#connectionStatus').dataset.state = 'online';
      if (!response.ok) throw new Error(data.message || 'Request failed.');
      return data;
    } catch (error) {
      if (error instanceof TypeError || error.name === 'TimeoutError') {
        document.querySelector('#connectionStatus').textContent = 'Service unavailable';
        document.querySelector('#connectionStatus').dataset.state = 'offline';
        throw new Error('Backend unavailable. Check the API service and configuration.');
      }
      throw error;
    }
  }
  async function loadHistory() {
    const requestId = ++historyRequest;
    const params = new URLSearchParams({ page: historyPage, pageSize: 10, q: search.value.trim(), favorites: favoritesOnly.checked });
    document.querySelector('#historyPrevious').disabled = true;
    document.querySelector('#historyNext').disabled = true;
    list.setAttribute('aria-busy', 'true');
    document.querySelector('#historySummary').textContent = 'Loading history…';
    try {
      const data = await api(`/history?${params}`);
      if (requestId !== historyRequest) return;
      records = data.history;
      historyMeta = data;
      historyPage = data.page;
      renderHistory();
    } catch (error) {
      if (requestId !== historyRequest) return;
      list.replaceChildren();
      document.querySelector('#historySummary').textContent = `History unavailable: ${error.message}`;
      throw error;
    } finally {
      if (requestId === historyRequest) list.setAttribute('aria-busy', 'false');
    }
  }
  function renderHistory() {
    list.replaceChildren();
    document.querySelector('#historyCount').textContent = historyMeta.allTotal;
    document.querySelector('#clearHistory').disabled = !historyMeta.allTotal;
    document.querySelector('#historySummary').textContent = `${historyMeta.total} matching · ${historyMeta.allTotal} saved`;
    document.querySelector('#historyPage').textContent = `${historyPage} / ${historyMeta.pages}`;
    document.querySelector('#historyPrevious').disabled = historyPage <= 1;
    document.querySelector('#historyNext').disabled = historyPage >= historyMeta.pages;
    if (!records.length) {
      const empty = document.createElement('li');
      empty.textContent = search.value.trim() || favoritesOnly.checked ? 'No matches. Try changing the search or favorites filter.' : 'Your first calculation will appear here.';
      empty.className = 'empty-history';
      list.append(empty);
    }
    for (const record of records) {
      const row = document.createElement('li');
      row.className = 'history-item';
      const recall = document.createElement('button');
      recall.type = 'button';
      recall.className = 'history-recall';
      recall.setAttribute('aria-label', `Reuse ${record.expression}`);
      const equation = document.createElement('span');
      equation.textContent = record.expression;
      const result = document.createElement('strong');
      result.textContent = `= ${formatted(record.result, record.kind)}`;
      result.title = String(record.result);
      recall.append(equation, result);
      recall.addEventListener('click', () => {
        if (busy) return;
        if (record.kind !== 'calculate' && record.details) {
          setMode(record.kind);
          if (record.kind === 'unit') { unitCategory.value = record.details.category; populateUnits(); }
          conversionValue.value = record.details.value;
          convertFrom.value = record.details.from;
          convertTo.value = record.details.to;
          conversionChanged();
          conversionValue.focus();
        } else {
          setMode('calculate'); setAngleMode(record.angleMode || 'deg'); replaceSelection(record.expression, 0, input.value.length); input.focus();
        }
      });
      const time = document.createElement('small');
      time.textContent = `${record.kind === 'calculate' ? (record.angleMode || 'deg').toUpperCase() : record.kind === 'base' ? 'BASE' : 'UNIT'} · ${new Date(record.createdAt.replace(' ', 'T') + 'Z').toLocaleString()}`;
      const favorite = document.createElement('button');
      favorite.type = 'button';
      favorite.className = 'history-favorite';
      favorite.textContent = record.favorite ? '★' : '☆';
      favorite.setAttribute('aria-label', `Favorite calculation ${record.id}`);
      favorite.setAttribute('aria-pressed', String(record.favorite));
      favorite.addEventListener('click', async () => {
        favorite.disabled = true;
        try {
          await api(`/history/${record.id}/favorite`, { method: 'PATCH', body: JSON.stringify({ favorite: !record.favorite }) });
          await loadHistory();
        } catch (error) { notify(error.message); favorite.disabled = false; }
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'history-delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete calculation ${record.id}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try {
          await api(`/history/${record.id}`, { method: 'DELETE' });
          await loadHistory();
        } catch (error) { notify(error.message); remove.disabled = false; }
      });
      row.append(recall, time, favorite, remove);
      list.append(row);
    }
  }
  async function calculate() {
    if (busy || !input.value.trim()) return;
    busy = true;
    document.querySelector('.display').setAttribute('aria-busy', 'true');
    document.querySelector('.display').classList.remove('has-error');
    copyButton.disabled = true;
    displayedResult = null;
    input.disabled = true;
    document.querySelectorAll('#keypad button, #scienceKeys button, #editKeys button, [name="angleMode"]').forEach(button => { button.disabled = true; });
    status.textContent = 'Calculating…';
    try {
      const data = await api('/calculate', {
        method: 'POST', body: JSON.stringify({ expression: input.value, angleMode: angleMode() })
      });
      displayedResult = String(data.result);
      lastResult = String(data.result);
      renderResults();
      copyButton.disabled = false;
      input.removeAttribute('aria-invalid');
      status.textContent = `${data.expression} = · ${data.angleMode.toUpperCase()}`;
      historyPage = 1;
      try { await loadHistory(); } catch (error) { notify(`Result saved; history refresh failed: ${error.message}`); }
    } catch (error) {
      display.textContent = 'Error';
      input.setAttribute('aria-invalid', 'true');
      document.querySelector('.display').classList.add('has-error');
      status.textContent = error.message;
      notify(error.message);
    } finally {
      busy = false;
      document.querySelector('.display').setAttribute('aria-busy', 'false');
      input.disabled = false;
      document.querySelectorAll('#keypad button, #scienceKeys button, #editKeys button, [name="angleMode"]').forEach(button => { button.disabled = false; });
      document.querySelector('[data-action="answer"]').disabled = lastResult === null;
    }
  }
  function action(name, value) {
    if (busy) return;
    if (name === 'equals') return calculate();
    if (name === 'clear') { setShift(false); replaceSelection('', 0, input.value.length); displayedResult = null; display.textContent = '0'; copyButton.disabled = true; }
    else if (name === 'undo') {
      if (!edits.length) return;
      input.value = edits.pop();
      changed();
    } else if (name === 'backspace') {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      replaceSelection('', start === end ? Math.max(0, start - 1) : start, end);
    } else if (name === 'answer') {
      if (lastResult === null) return;
      // Text formatting only: the backend parser accepts decimal notation.
      const [mantissa, exponent] = lastResult.split(/e/i);
      let raw = mantissa;
      if (exponent !== undefined) {
        const negative = mantissa.startsWith('-');
        const unsigned = negative ? mantissa.slice(1) : mantissa;
        const digits = unsigned.replace('.', '');
        const point = (unsigned.includes('.') ? unsigned.indexOf('.') : unsigned.length) + Number(exponent);
        raw = point <= 0 ? '0.' + '0'.repeat(-point) + digits : point >= digits.length ? digits + '0'.repeat(point - digits.length) : digits.slice(0, point) + '.' + digits.slice(point);
        if (negative) raw = '-' + raw;
      }
      replaceSelection(`(${raw})`);
    } else if (name === 'power') {
      const selected = input.selectionStart !== input.selectionEnd;
      if (!input.value) {
        replaceSelection('()^()');
        input.setSelectionRange(1, 1);
        input.focus();
        return;
      }
      if (selected) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (!replaceSelection(`(${input.value.slice(start, end)})^()`, start, end)) return;
      } else if (!replaceSelection('^()')) return;
      input.setSelectionRange(input.selectionStart - 1, input.selectionStart - 1);
      input.focus();
    } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'exp10'].includes(name)) {
      const selected = input.selectionStart !== input.selectionEnd;
      const insert = !selected && (!input.value || /[+*/^(\-]\s*$/.test(input.value.slice(0, input.selectionStart)));
      const start = selected || insert ? input.selectionStart : 0;
      const end = selected || insert ? input.selectionEnd : input.value.length;
      const part = input.value.slice(start, end);
      if (!replaceSelection(`${name}(${part})`, start, end)) return;
      if (!part) input.setSelectionRange(start + name.length + 1, start + name.length + 1);
      input.focus();
    } else if (['sign', 'square', 'sqrt', 'reciprocal', 'percent'].includes(name)) {
      const selected = input.selectionStart !== input.selectionEnd;
      const start = selected ? input.selectionStart : 0;
      const end = selected ? input.selectionEnd : input.value.length;
      const part = input.value.slice(start, end) || '0';
      const wrappers = { sign: `-(${part})`, square: `(${part})*(${part})`, sqrt: `sqrt(${part})`, reciprocal: `1/(${part})`, percent: `(${part})/100` };
      replaceSelection(wrappers[name], start, end);
    } else replaceSelection(value);
  }
  function onKeyClick(event) {
    const button = event.target.closest('button');
    if (!button || busy) return;
    if (button.id === 'shiftToggle') { setShift(!shifted); return; }
    if (button.dataset.primary) {
      const name = shifted ? button.dataset.secondary : button.dataset.primary;
      action(button.dataset.action === 'constant' ? 'append' : name, name);
      setShift(false);
      return;
    }
    action(button.dataset.action || 'append', button.dataset.number ?? button.dataset.operator ?? '.');
  }
  document.querySelector('#keypad').addEventListener('click', onKeyClick);
  document.querySelector('#scienceKeys').addEventListener('click', onKeyClick);
  document.querySelector('#editKeys').addEventListener('click', onKeyClick);
  document.addEventListener('keydown', event => {
    if (activeMode !== 'calculate') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (event.target !== input && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'Escape') { event.preventDefault(); action('clear'); }
    else if (event.key === 'Enter' && (event.target === input || event.target === document.body)) {
      event.preventDefault(); calculate();
    } else if (event.target !== input && !event.target.closest('button, a, summary')) {
      if (/^[0-9.+*/^()\-]$/.test(event.key)) { event.preventDefault(); action('append', event.key); }
      else if (event.key === 'Backspace') { event.preventDefault(); action('backspace'); }
    }
  });
  historyToggle.addEventListener('click', () => {
    setHistoryOpen(panel.hidden);
    if (!panel.hidden) loadHistory().catch(error => notify(error.message));
  });
  document.querySelector('#clearHistory').addEventListener('click', async () => {
    if (!confirm('Delete ALL saved calculations and conversions, including favorites? This also deletes records outside the current filter.')) return;
    try { await api('/history', { method: 'DELETE' }); await loadHistory(); }
    catch (error) { notify(error.message); }
  });
  document.querySelector('#copyButton').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(window.CloverNumberFormat.formatResult(lastResult, { full: true })); notify('Full result copied.'); }
    catch { notify('Clipboard unavailable. Choose Full values, then select the result to copy.'); }
  });
  copyConversion.addEventListener('click', async () => {
    if (conversionResult === null) return;
    try { await navigator.clipboard.writeText(window.CloverNumberFormat.formatResult(conversionResult, { full: true, kind: conversionKind })); notify('Full result copied.'); }
    catch { notify('Clipboard unavailable. Choose Full values, then select the result to copy.'); }
  });
  function refreshFilter() {
    clearTimeout(historyTimer);
    ++historyRequest; // Invalidate an in-flight response before the debounce expires.
    historyPage = 1;
    list.replaceChildren();
    document.querySelector('#historyPrevious').disabled = true;
    document.querySelector('#historyNext').disabled = true;
    document.querySelector('#historySummary').textContent = 'Searching…';
    historyTimer = setTimeout(() => loadHistory().catch(error => notify(error.message)), 250);
  }
  search.addEventListener('input', refreshFilter);
  favoritesOnly.addEventListener('change', refreshFilter);
  for (const [id, delta] of [['historyPrevious', -1], ['historyNext', 1]]) {
    document.querySelector(`#${id}`).addEventListener('click', () => {
      historyPage += delta;
      loadHistory().catch(error => notify(error.message));
    });
  }
  loadHistory().catch(error => { status.textContent = error.message; });
})();
