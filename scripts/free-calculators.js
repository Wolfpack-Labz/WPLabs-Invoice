(function (root) {
  'use strict';
  const MAX_INPUT = 1e12;
  class InputError extends Error {
    constructor(message, field) { super(message); this.name = 'InputError'; this.field = field; }
  }
  function number(values, key, label, options = {}) {
    const value = values[key];
    const min = options.min ?? 0, max = options.max ?? MAX_INPUT;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new InputError(`Enter a number for ${label}.`, key);
    if (value < min || value > max) throw new InputError(`Enter ${label} between ${min.toLocaleString('en-US')} and ${max.toLocaleString('en-US')}.`, key);
    if (options.integer && !Number.isInteger(value)) throw new InputError(`Enter a whole number for ${label}.`, key);
    return value;
  }
  const row = (label, value, format = 'money') => ({ label, value, format });
  const roundMoney = value => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;
  const result = (label, value, rows, format = 'money') => {
    for (const n of [value, ...rows.map(r => r.value)]) {
      if (typeof n === 'number' && (!Number.isFinite(n) || Math.abs(n) > 1e15)) throw new InputError('These numbers are too large to calculate reliably. Use smaller values.');
    }
    return { label, value, rows, format };
  };
  function dateOnly(iso, key = 'invoice_date') {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new InputError('Choose a valid invoice date.', key);
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(0); date.setUTCHours(12, 0, 0, 0); date.setUTCFullYear(year, month - 1, day);
    if (year < 1 || year > 9999 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new InputError('Choose a valid invoice date.', key);
    return date;
  }
  const isoDate = date => `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  function calculate(type, v) {
    if (type === 'pricing') {
      const labor = number(v, 'hours', 'labor hours') * number(v, 'rate', 'labor cost per hour');
      const materials = number(v, 'materials', 'materials'), other = number(v, 'travel', 'other job costs'), overhead = number(v, 'overhead', 'allocated overhead');
      const costs = labor + materials + other + overhead;
      const margin = number(v, 'margin', 'target margin', { max: 99.99 }) / 100;
      if (costs === 0) throw new InputError('Enter at least one job cost greater than zero.', 'materials');
      const price = costs / (1 - margin);
      return result('Estimated price before sales tax', price, [row('Labor cost', labor), row('Materials', materials), row('Other job costs', other), row('Allocated overhead', overhead), row('Total included costs', costs), row('Profit on included costs', price - costs), row('Target margin', margin * 100, 'percent')]);
    }
    if (type === 'profit') {
      const revenue = number(v, 'revenue', 'selling price / revenue', { min: 0.01 }), cost = number(v, 'cost', 'total costs');
      const profit = revenue - cost;
      return result(profit < 0 ? 'Loss on included costs' : 'Profit on included costs', profit, [row('Margin', profit / revenue * 100, 'percent'), row('Markup', cost === 0 ? 'Undefined with zero cost' : profit / cost * 100, cost === 0 ? 'text' : 'percent'), row('Selling price / revenue', revenue), row('Included costs', cost)]);
    }
    if (type === 'late') {
      const balance = number(v, 'balance', 'outstanding balance'), rate = number(v, 'fee', 'fee rate') / 100;
      const days = number(v, 'days', 'days late', { integer: true });
      const methods = { monthly: ['Monthly, prorated over 30 days', days / 30], annual: ['Annual, prorated over 365 days', days / 365], daily: ['Daily, simple', days], once: ['One-time percentage', days > 0 ? 1 : 0] };
      if (!Object.hasOwn(methods, v.method)) throw new InputError('Choose a calculation method.', 'method');
      const [description, periods] = methods[v.method];
      const fee = roundMoney(balance * rate * periods);
      return result('Estimated late fee', fee, [row('Original outstanding balance', balance), row('Balance plus fee', balance + fee), row('Days late', days, 'number'), row('Rate for selected method', rate * 100, 'percent'), row('Method', description, 'text'), row('Calculation', 'Simple fee; no compounding', 'text')]);
    }
    if (type === 'hourly') {
      const income = number(v, 'income', 'annual owner pay goal'), expenses = number(v, 'expenses', 'annual business overhead');
      const weeks = number(v, 'weeks', 'working weeks', { min: 0.01, max: 52 });
      const hours = number(v, 'hours', 'billable hours per week', { min: 0.01, max: 168 });
      const margin = number(v, 'margin', 'target business margin', { max: 99.99 }) / 100;
      const annualHours = weeks * hours, costs = income + expenses;
      if (costs === 0) throw new InputError('Enter an owner pay goal or business overhead greater than zero.', 'income');
      const revenue = costs / (1 - margin), hourly = revenue / annualHours;
      return result('Target hourly rate before sales tax', hourly, [row('Break-even hourly rate', costs / annualHours), row('Annual billable hours', annualHours, 'number'), row('Annual owner pay goal', income), row('Annual business overhead', expenses), row('Target annual revenue', revenue), row('Business profit after owner pay and overhead', revenue - costs), row('Target business margin', margin * 100, 'percent')]);
    }
    if (type === 'markup') {
      const cost = number(v, 'cost', 'cost', { min: 0.01 }), target = number(v, 'percent', 'target percentage');
      if (!['markup', 'margin'].includes(v.basis)) throw new InputError('Choose markup or margin.', 'basis');
      if (v.basis === 'margin' && target >= 100) throw new InputError('A target profit margin must be below 100%.', 'percent');
      const price = v.basis === 'markup' ? cost * (1 + target / 100) : cost / (1 - target / 100);
      const profit = price - cost;
      return result('Selling price before sales tax', price, [row('Cost', cost), row('Profit on included cost', profit), row('Markup on cost', profit / cost * 100, 'percent'), row('Margin on selling price', profit / price * 100, 'percent'), row('You set', v.basis === 'markup' ? 'Markup on cost' : 'Margin on selling price', 'text')]);
    }
    if (type === 'due') {
      const invoice = dateOnly(v.invoice_date);
      let days;
      if (v.term === 'custom') days = number(v, 'custom_days', 'custom calendar days', { integer: true, max: 3650 });
      else if (['0', '7', '15', '30', '45', '60', '90'].includes(v.term)) days = Number(v.term);
      else throw new InputError('Choose valid payment terms.', 'term');
      if (!['none', 'monday'].includes(v.weekend)) throw new InputError('Choose how to handle weekends.', 'weekend');
      const due = new Date(invoice); due.setUTCDate(due.getUTCDate() + days);
      const original = isoDate(due);
      if (v.weekend === 'monday') {
        const weekday = due.getUTCDay();
        if (weekday === 6) due.setUTCDate(due.getUTCDate() + 2);
        if (weekday === 0) due.setUTCDate(due.getUTCDate() + 1);
      }
      if (due.getUTCFullYear() > 9999) throw new InputError('The due date is beyond year 9999. Choose an earlier invoice date or shorter terms.', 'invoice_date');
      const iso = isoDate(due), shifted = original !== iso;
      return result(shifted ? 'Due date moved to Monday' : 'Invoice due date', iso, [row('Invoice date', v.invoice_date, 'date'), row('Payment terms', days === 0 ? 'Due on invoice date' : `${days} calendar days`, 'text'), row('Calendar due date', original, 'date'), row('Weekend handling', v.weekend === 'monday' ? 'Saturday / Sunday move to Monday; holidays excluded' : 'No adjustment', 'text')], 'date');
    }
    throw new InputError('This calculator is unavailable.');
  }
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const count = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const dates = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  function format(value, type) {
    if (type === 'money') return money.format(value === 0 ? 0 : value);
    if (type === 'percent') return `${(Math.abs(value) < 0.0000001 ? 0 : value).toFixed(2)}%`;
    if (type === 'number') return count.format(value);
    if (type === 'date') return dates.format(dateOnly(value));
    return String(value);
  }
  const api = { calculate, format, InputError };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root.document) return;
  root.WolfpackCalculators = api;
  root.document.querySelectorAll('[data-free-calculator]').forEach(calculator => {
    const form = calculator.querySelector('form'), label = calculator.querySelector('.result-label');
    const value = calculator.querySelector('.result-value'), detail = calculator.querySelector('.result-breakdown');
    const error = calculator.querySelector('.calc-error'), printButton = calculator.querySelector('[data-print-result]');
    const controls = [...form.querySelectorAll('input, select')];
    const status = root.document.createElement('p'); status.className = 'sr-only'; status.setAttribute('role', 'status'); calculator.append(status);
    if (calculator.dataset.freeCalculator === 'due') {
      const today = new Date();
      const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      form.elements.invoice_date.value = localToday; form.elements.invoice_date.defaultValue = localToday;
    }
    function syncOptions() {
      if (calculator.dataset.freeCalculator !== 'due') return;
      const custom = form.elements.term.value === 'custom';
      calculator.querySelector('[data-custom-days]').hidden = !custom;
      form.elements.custom_days.disabled = !custom;
    }
    function run(announce = false) {
      syncOptions();
      controls.forEach(input => input.removeAttribute('aria-invalid'));
      error.hidden = true; status.textContent = '';
      const values = {};
      try {
        for (const input of controls) {
          if (input.disabled) continue;
          if (!input.validity.valid || (input.required && input.value.trim() === '')) {
            const name = input.labels?.[0]?.textContent || input.name;
            const message = input.validity.stepMismatch ? (input.step === '1' ? `Use a whole number for ${name.toLowerCase()}.` : `Use increments of ${input.step} for ${name.toLowerCase()}.`) : `Enter a valid value for ${name.toLowerCase()}.`;
            throw new InputError(message, input.name);
          }
          values[input.name] = input.type === 'number' ? (input.value.trim() === '' ? NaN : Number(input.value)) : input.value;
        }
        const answer = calculate(calculator.dataset.freeCalculator, values);
        label.textContent = answer.label; value.textContent = format(answer.value, answer.format);
        detail.replaceChildren(...answer.rows.map(item => {
          const node = root.document.createElement('div'); node.textContent = `${item.label}: ${format(item.value, item.format)}`; return node;
        }));
        printButton.hidden = false;
        if (announce) status.textContent = `Calculation complete. ${answer.label}: ${value.textContent}.`;
      } catch (failure) {
        label.textContent = 'Complete your inputs'; value.textContent = '—'; detail.replaceChildren(); printButton.hidden = true;
        error.textContent = failure instanceof InputError ? failure.message : 'The calculation could not be completed. Check your inputs.'; error.hidden = false;
        const input = failure.field && form.elements[failure.field];
        if (input) { input.setAttribute('aria-invalid', 'true'); if (announce) input.focus(); }
      }
    }
    form.addEventListener('submit', event => { event.preventDefault(); run(true); });
    form.addEventListener('input', () => run());
    form.addEventListener('change', () => run());
    form.addEventListener('reset', () => root.setTimeout(() => run(true), 0));
    printButton.addEventListener('click', () => root.print());
    run();
  });
})(typeof window !== 'undefined' ? window : globalThis);
