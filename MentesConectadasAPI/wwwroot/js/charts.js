// Gráficos 
import { esc } from './ui.js';

const PALETTE = ['var(--purple)', 'var(--blue)', 'var(--green)', 'var(--pink)', 'var(--purple2)'];

// Barras horizontales
export function hBars(items, { suffix = '', empty = 'Todavía no hay datos.' } = {}) {
  if (!items.length || items.every(i => !i.value)) return `<p class="chart-empty">${empty}</p>`;
  const max = Math.max(...items.map(i => i.value), 1);
  return `<div class="hbars">${items.map((i, n) => `<div class="hbar"><span class="hbar-label" title="${esc(i.label)}">${esc(i.label)}${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span><div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(2, (i.value / max) * 100)}%;background:${PALETTE[n % PALETTE.length]}"></div></div><b>${i.value}${suffix}</b></div>`).join('')}</div>`;
}

// Columnas verticales
export function columns(items, { empty = 'Todavía no hay datos.', fmt = (v) => v } = {}) {
  if (!items.length || items.every(i => !i.value)) return `<p class="chart-empty">${empty}</p>`;
  const max = Math.max(...items.map(i => i.value), 1);
  return `<div class="cols">${items.map(i => `<div class="col"><b>${i.value ? fmt(i.value) : ''}</b><div class="col-bar" style="height:${i.value ? Math.max(4, (i.value / max) * 100) : 0}%"></div><span>${esc(i.label)}</span></div>`).join('')}</div>`;
}

// Líneas
export function lineChart(labels, series, { empty = 'Todavía no hay datos.' } = {}) {
  const all = series.flatMap(s => s.values);
  if (!labels.length || all.every(v => !v)) return `<p class="chart-empty">${empty}</p>`;
  const W = 640, H = 230, L = 34, R = 12, T = 14, B = 34;
  const max = Math.max(4, ...all);
  const x = (i) => L + (labels.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (labels.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const grid = [0, .25, .5, .75, 1].map(f => { const v = Math.round(max * f); return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }).join('');
  const step = Math.ceil(labels.length / 7);
  const xl = labels.map((l, i) => (i % step === 0 || i === labels.length - 1) ? `<text x="${x(i)}" y="${H - 12}" text-anchor="middle">${esc(l)}</text>` : '').join('');
  const lines = series.map(s => `<polyline points="${s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="${s.color}"><title>${esc(s.name)} · ${esc(labels[i])}: ${v}</title></circle>`).join('')}`).join('');
  const legend = series.map(s => `<span class="legend-item"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de líneas">${grid}${xl}${lines}</svg><div class="legend">${legend}</div>`;
}

// Dona
export function donut(items, { empty = 'Todavía no hay datos.' } = {}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return `<p class="chart-empty">${empty}</p>`;
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = items.map((i, n) => {
    const len = (i.value / total) * c;
    const el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${PALETTE[n % PALETTE.length]}" stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${esc(i.label)}: ${i.value}</title></circle>`;
    acc += len; return el;
  }).join('');
  const legend = items.map((i, n) => `<span class="legend-item"><i style="background:${PALETTE[n % PALETTE.length]}"></i>${esc(i.label)} · <b>${i.value}</b> (${Math.round((i.value / total) * 100)}%)</span>`).join('');
  return `<div class="donut-wrap"><svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Gráfica de dona"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--line)" stroke-width="22" opacity=".35"/>${arcs}<text x="70" y="68" text-anchor="middle" class="donut-total">${total}</text><text x="70" y="84" text-anchor="middle" class="donut-sub">total</text></svg><div class="legend legend-col">${legend}</div></div>`;
}


const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dayKey = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : key(d); };
export function lastDays(n = 14) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push({ key: key(d), label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '') }); }
  return out;
}
export function countByDay(days, dates) {
  const m = {}; dates.forEach(d => { const k = dayKey(d); if (k) m[k] = (m[k] || 0) + 1; });
  return days.map(d => m[d.key] || 0);
}
export function sumByDay(days, rows) { 
  const m = {}; rows.forEach(r => { const k = dayKey(r.date); if (k) m[k] = (m[k] || 0) + r.value; });
  return days.map(d => m[d.key] || 0);
}
