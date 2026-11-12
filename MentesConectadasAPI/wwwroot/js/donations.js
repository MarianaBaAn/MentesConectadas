// Donaciones
import { logDonation } from './state.js';
import { DONATION_AMOUNTS, DONATION_CURRENCY, DONATION_LINKS, DONATION_CUSTOM_LINK, DONATION_MIN, DONATION_MAX } from './config.js';

let selectedAmount = null; 
let customText = '';       

const isCustom = () => selectedAmount !== null && !DONATION_AMOUNTS.includes(selectedAmount);
const validCustom = (n) => Number.isInteger(n) && n >= DONATION_MIN && n <= DONATION_MAX;

function linkFor(amount) {
  if (DONATION_AMOUNTS.includes(amount)) {
    const url = DONATION_LINKS[amount];
    return typeof url === 'string' && url.startsWith('https://') ? url : '';
  }
  return typeof DONATION_CUSTOM_LINK === 'string' && DONATION_CUSTOM_LINK.startsWith('https://')
    ? DONATION_CUSTOM_LINK.replace('{amount}', String(amount)) : '';
}
const paymentsReady = () => DONATION_AMOUNTS.some(a => linkFor(a)) || Boolean(linkFor(DONATION_MIN));

export function donationSection() {
  const buttons = DONATION_AMOUNTS.map(a => `<button type="button" class="donation-amount ${a === selectedAmount ? 'selected' : ''}" role="radio" aria-checked="${a === selectedAmount}" data-amount="${a}" onclick="selectDonationAmount(${a})">$${a}<small>${DONATION_CURRENCY}</small></button>`).join('');
  return `<section class="donation-section" aria-labelledby="donation-title"><div class="donation-copy"><h2 id="donation-title">Apoya Mentes Conectadas</h2><p>Mentes Conectadas es un proyecto educativo. Si te resulta útil, puedes hacer una pequeña aportación voluntaria para ayudar a mantenerlo y a seguir creando guías.</p></div><div class="donation-options"><div class="donation-amounts" role="radiogroup" aria-label="Cantidad a donar">${buttons}</div><div class="donation-custom ${isCustom() ? 'selected' : ''}"><label for="donation-custom-input">Otra cantidad</label><div class="donation-custom-row"><span aria-hidden="true">$</span><input id="donation-custom-input" class="donation-custom-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="Escribe tu aportación" value="${customText}" oninput="setCustomDonation(this)" onkeydown="blockNonDigits(event)" onpaste="pasteDigits(event)"><span class="donation-currency" aria-hidden="true">${DONATION_CURRENCY}</span></div><small class="donation-error" id="donation-custom-error" role="alert"></small></div><button type="button" class="btn btn-pink donation-continue" ${selectedAmount ? '' : 'disabled'} onclick="startDonation()">Continuar con la donación</button>${paymentsReady() ? '' : '<small class="donation-note">El pago en línea aún no está habilitado.</small>'}</div></section>`;
}

function refreshSelection() {
  document.querySelectorAll('.donation-amount').forEach(btn => {
    const active = Number(btn.dataset.amount) === selectedAmount;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-checked', String(active));
  });
  document.querySelectorAll('.donation-custom').forEach(box => box.classList.toggle('selected', isCustom()));
  document.querySelectorAll('.donation-continue').forEach(btn => { btn.disabled = !selectedAmount; });
}

export function selectDonationAmount(amount) {
  if (!DONATION_AMOUNTS.includes(amount)) return;
  selectedAmount = amount;
  customText = '';
  document.querySelectorAll('.donation-custom-input').forEach(i => { i.value = ''; });
  document.querySelectorAll('.donation-error').forEach(e => { e.textContent = ''; });
  refreshSelection();
}


export function setCustomDonation(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 6);
  if (input.value !== digits) input.value = digits;
  customText = digits;
  const n = digits === '' ? NaN : Number(digits);
  const err = document.getElementById('donation-custom-error');
  if (digits === '') { selectedAmount = null; if (err) err.textContent = ''; }
  else if (validCustom(n)) { selectedAmount = n; if (err) err.textContent = ''; }
  else { selectedAmount = null; if (err) err.textContent = n > DONATION_MAX ? `La cantidad máxima es $${DONATION_MAX.toLocaleString('es-MX')} ${DONATION_CURRENCY}.` : `La cantidad mínima es $${DONATION_MIN} ${DONATION_CURRENCY}.`; }
  refreshSelection();
}

export function blockNonDigits(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

export function pasteDigits(e) {
  e.preventDefault();
  const digits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
  const input = e.target;
  const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? input.value.length;
  input.value = (input.value.slice(0, start) + digits + input.value.slice(end)).slice(0, 6);
  setCustomDonation(input);
}

export function startDonation() {
  if (!selectedAmount) return;
  logDonation(selectedAmount, isCustom()); // queda registrada la intención de donar 
  const url = linkFor(selectedAmount);
  if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
  document.getElementById('modal')?.remove();
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.id = 'modal';
  el.innerHTML = `<section class="modal center"><h2>Donaciones próximamente</h2><p style="color:var(--muted)">Gracias por querer apoyar Mentes Conectadas. Elegiste $${selectedAmount} ${DONATION_CURRENCY}, pero el pago en línea todavía no está habilitado, así que no se realizó ningún cargo. Solo registramos tu interés en apoyar para saber cuánta gente quiere colaborar.</p><div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Entendido</button></div></section>`;
  document.body.appendChild(el);
}
