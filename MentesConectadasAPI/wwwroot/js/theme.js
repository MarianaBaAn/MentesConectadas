// Tema claro / oscuro
import { getSavedTheme, saveTheme } from './state.js';

const META_COLORS = { dark: '#172333', light: '#f6f4fb' };
const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[t]);
  
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    const toLight = t === 'dark';
    b.setAttribute('aria-label', toLight ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    b.setAttribute('title', toLight ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    const icon = b.querySelector('.theme-icon'); if (icon) icon.innerHTML = toLight ? SUN : MOON;
    const label = b.querySelector('.theme-label'); if (label) label.textContent = toLight ? 'Tema claro' : 'Tema oscuro';
  });
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  applyTheme(next);
}


export function themeButton(extraClass = 'icon-btn', withLabel = false) {
  const toLight = currentTheme() === 'dark';
  return `<button type="button" class="${extraClass} theme-toggle" data-theme-toggle onclick="toggleTheme()" aria-label="${toLight ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}" title="${toLight ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}"><span class="theme-icon" aria-hidden="true">${toLight ? SUN : MOON}</span>${withLabel ? `<span class="theme-label">${toLight ? 'Tema claro' : 'Tema oscuro'}</span>` : ''}</button>`;
}

export function initTheme() {
  applyTheme(getSavedTheme());
}
