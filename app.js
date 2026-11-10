'use strict';

/* =====================================================================
   Mijn Startpagina — v5 (slank)
   Opslag:
   - chrome.storage.sync  : instellingen, begroetingen en apps (synct
                            via je Google-account)
   - chrome.storage.local : eigen foto's en kopieën van iconen
   - localStorage         : klein "opstartplaatje" voor boot.js
   Buiten een Chrome-extensie valt alles terug op localStorage (om te testen).
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const IS_EXT = typeof chrome !== 'undefined' && !!chrome.storage?.sync;
const DASH_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/';
const VERSION = 5;

/* ---------- Opslag ---------- */
const Store = {
  _ls(a) { try { return JSON.parse(localStorage.getItem('sp_' + a) || '{}'); } catch { return {}; } },
  async get(a, keys = null) {
    if (IS_EXT) return chrome.storage[a].get(keys);
    const all = this._ls(a);
    if (keys === null) return all;
    return Object.fromEntries([].concat(keys).filter((k) => k in all).map((k) => [k, all[k]]));
  },
  async set(a, obj) {
    if (IS_EXT) return chrome.storage[a].set(obj);
    try { localStorage.setItem('sp_' + a, JSON.stringify(Object.assign(this._ls(a), obj))); } catch (e) { console.warn(e); }
  },
  async remove(a, keys) {
    if (IS_EXT) return chrome.storage[a].remove(keys);
    const all = this._ls(a);
    for (const k of [].concat(keys)) delete all[k];
    localStorage.setItem('sp_' + a, JSON.stringify(all));
  },
  async clear(a) { if (IS_EXT) return chrome.storage[a].clear(); localStorage.removeItem('sp_' + a); },
};

/* ---------- Standaardinstellingen (de "beste" startstand) ---------- */
const DEFAULTS = {
  grid: { cols: 6, rows: 3, iconSize: 72, gap: 28, radius: 24, showLabels: true, labelSize: 13, newTab: false },
  icons: { style: 'standard', shape: 'rounded', shadow: 'soft', hover: 'lift' },
  clock: { show: true, style: 'minimal', hour12: false, seconds: false, size: 88, position: 'center', showDate: true, dateStyle: 'long', dateLook: 'match', greeting: true, name: '', glass: false },
  search: { show: true, engine: 'google', style: 'glass', width: 620, suggest: true },
  bg: { type: 'gallery', theme: 'mist', photo: 'photo-1524959725226-f4deb958e979', rotate: 'off', rotateFrom: 'themes', rotateThemes: [], favorites: [], gradient: 'forest', color: '#1f2a2e', dim: 0.25, blur: 0 },
  appearance: { textColor: '#ffffff', liquid: false, lgDepth: 45, lgDark: 0 },
  greet: { mode: 'auto', lines: [] },
  rotOut: [], // foto's die je uit de wisseling hebt gehaald (aparte opslagsleutel)
};

/* Toegestane waarden: oude instellingen uit v1–v4 die niet meer bestaan,
   worden netjes teruggezet naar de standaard. */
const ALLOWED = {
  'clock.style': ['minimal', 'bold', 'mono', 'elegant', 'glass'],
  'clock.position': ['center', 'left'],
  'clock.dateStyle': ['long', 'week', 'short', 'numeric'],
  'clock.dateLook': ['match', 'caps', 'subtle'],
  'icons.style': ['standard', 'glass', 'dark', 'liquid'],
  'icons.shape': ['rounded', 'circle', 'square'],
  'icons.shadow': ['soft', 'float', 'none'],
  'icons.hover': ['lift', 'dock', 'none'],
  'search.style': ['glass', 'solid', 'dark', 'liquid'],
  'search.engine': ['google', 'duckduckgo', 'bing', 'ecosia'],
  'bg.type': ['gallery', 'gradient', 'color', 'image'],
  'bg.rotate': ['off', 'tab', 'day'],
  'bg.rotateFrom': ['themes', 'fav'],
  'greet.mode': ['auto', 'mix', 'own'],
};
const MIGRATE = { 'clock.style': { digital: 'mono', outline: 'bold', poster: 'bold', stacked: 'bold', analog: 'minimal', hand: 'elegant' }, 'icons.style': { fill: 'standard', float: 'standard', mono: 'glass', neon: 'dark', outline: 'glass' }, 'bg.type': { url: 'gallery' }, 'bg.rotate': { hour: 'day' }, 'icons.shadow': { strong: 'float' }, 'clock.position': { right: 'left', free: 'center' } };

const CLOCK_STYLES = [['minimal', 'Minimaal'], ['bold', 'Vet'], ['mono', 'Mono'], ['elegant', 'Elegant'], ['glass', 'Glaskaart']];
const ICON_STYLES = [['standard', 'Standaard'], ['glass', 'Glas'], ['dark', 'Donker'], ['liquid', 'Liquid glass']];
const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  ecosia: { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=' },
};
const LETTER_COLORS = ['#e8505b', '#f08a4b', '#e9b949', '#5fb36b', '#2fa39b', '#3a8ee6', '#5d6ee8', '#9b5de5', '#d65db1', '#6c7a89'];

const mkApp = (name, url) => ({ id: uid(), name, url, icon: { type: 'auto' } });
const defaultPages = () => [
  [mkApp('Gmail', 'https://mail.google.com/'), mkApp('Canvas', 'https://canvas.eur.nl/'), mkApp('Wetten', 'https://wetten.overheid.nl/'),
    mkApp('Rechtspraak', 'https://uitspraken.rechtspraak.nl/'), mkApp('Google Drive', 'https://drive.google.com/'), mkApp('Claude', 'https://claude.ai/'),
    mkApp('Google Translate', 'https://translate.google.com/'), mkApp('WhatsApp', 'https://web.whatsapp.com/'), mkApp('YouTube', 'https://www.youtube.com/'),
    mkApp('Instagram', 'https://www.instagram.com/')],
  [mkApp('Netflix', 'https://www.netflix.com/'), mkApp('Disney+', 'https://www.disneyplus.com/'), mkApp('HBO Max', 'https://www.hbomax.com/'),
    mkApp('Prime Video', 'https://www.primevideo.com/'), mkApp('Spotify', 'https://open.spotify.com/'), mkApp('X', 'https://x.com/'),
    mkApp('Albert Heijn', 'https://www.ah.nl/')],
];

/* ---------- Toestand ---------- */
let settings = structuredClone(DEFAULTS);
let pages = [];
let localIcons = {}; // id → zelf geüploade iconen
let localBg = null;  // eigen achtergrondfoto
let imgCache = {};   // url → opgeslagen kopie van een galerij-icoon
let autoCache = {};  // automatische iconen
let siPaths = { __demo: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14.5v-9l7 4.5-7 4.5z' };
let rotState = {};
let cur = 0;
let editing = false;
let lastWrite = 0;

/* ---------- Hulpfuncties ---------- */
function uid() { return Math.random().toString(36).slice(2, 10); }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; }
function deepMerge(base, extra) {
  for (const k in extra) {
    if (!(k in base)) continue; // onbekende (oude) instellingen weggooien
    if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], extra[k]);
    else if (typeof extra[k] === typeof base[k]) base[k] = extra[k];
  }
  return base;
}
function sanitize() {
  // De oude glazen klokstijlen worden: dezelfde klok, met glazen cijfers aan
  if (['liquid', 'glassdigits'].includes(settings.clock.style)) { settings.clock.style = 'bold'; settings.clock.glass = true; }
  // Oude keuze "dit thema" / "alle thema's" omzetten naar de nieuwe thema-selectie
  const b = settings.bg, themes = Object.keys(BG_GALLERIES);
  if (b.rotateFrom === 'all') b.rotateThemes = themes;
  if (b.rotateFrom === 'theme' || b.rotateFrom === 'all') b.rotateFrom = 'themes';
  b.rotateThemes = (b.rotateThemes || []).filter((k) => themes.includes(k));
  if (!b.rotateThemes.length) b.rotateThemes = [themes.includes(b.theme) ? b.theme : themes[0]];
  const known = new Set(allPhotos());
  settings.rotOut = (settings.rotOut || []).filter((p) => known.has(p)).slice(0, 300);
  for (const [p, ok] of Object.entries(ALLOWED)) {
    let v = getPath(settings, p);
    if (MIGRATE[p]?.[v]) v = MIGRATE[p][v];
    setPath(settings, p, ok.includes(v) ? v : getPath(DEFAULTS, p));
  }
  const g = settings.grid;
  g.cols = Math.min(10, Math.max(3, g.cols)); g.rows = Math.min(5, Math.max(1, g.rows));
  g.iconSize = Math.min(112, Math.max(44, g.iconSize));
  settings.clock.size = Math.min(160, Math.max(40, settings.clock.size));
  settings.greet.lines = (settings.greet.lines || []).filter((l) => typeof l === 'string').map((l) => l.slice(0, 120)).slice(0, 30);
}
const cap = () => settings.grid.cols * settings.grid.rows;
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
const colorFor = (name) => LETTER_COLORS[parseInt(hash(name || '?'), 36) % LETTER_COLORS.length];
function initials(name) {
  const w = (name || '?').trim().split(/\s+/);
  const first = [...w[0]][0] || '?';
  return (w.length > 1 ? first + ([...w[1]][0] || '') : first).toUpperCase();
}
function normUrl(u) {
  u = (u || '').trim();
  if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try {
    const x = new URL(u);
    if (!['http:', 'https:', 'mailto:'].includes(x.protocol)) return null;
    if (x.protocol !== 'mailto:' && !x.hostname.includes('.') && x.hostname !== 'localhost') return null;
    return x.href;
  } catch { return null; }
}
function hostOf(u) { try { return new URL(u).hostname; } catch { return ''; } }
function cssUrl(u) { return 'url("' + String(u).replace(/["\\\n\r]/g, encodeURIComponent) + '")'; }
function slugify(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\+/g, '-plus').replace(/&/g, '-and-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}
function scoreMatch(q, ...fields) {
  let best = 0;
  for (const f of fields) {
    if (!f) continue;
    if (f === q) best = Math.max(best, 100);
    else if (f.startsWith(q)) best = Math.max(best, 70 - Math.min(20, f.length - q.length));
    else if (f.includes(q)) best = Math.max(best, 40 - Math.min(20, f.length - q.length));
  }
  return best;
}
let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}
async function imageToDataURL(file, maxSide, mime, quality) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL(mime, quality);
}
/* Heeft een plaatje een doorzichtige achtergrond (logo) en is het licht van kleur? */
async function analyseImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, 48, 48);
  const d = g.getImageData(0, 0, 48, 48).data;
  let clear = 0, n = 0, lum = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 20) { clear++; continue; }
    n++; lum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  }
  const transparent = clear / (d.length / 4) > 0.05;
  return transparent ? { fit: 'contain', light: n > 0 && lum / n > 190 } : { fit: 'cover' };
}
const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function fetchImage(url, minSize = 0) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const b = await r.blob();
  if (!/^image\//.test(b.type) || b.size > 600000) throw new Error('geen bruikbaar plaatje');
  if (minSize && !b.type.includes('svg')) { const bmp = await createImageBitmap(b); if (bmp.width < minSize) throw new Error('te klein'); }
  return blobToDataURL(b);
}

/* ---------- Laden & opslaan ---------- */
async function loadSync() {
  const s = await Store.get('sync', null);
  settings = deepMerge(structuredClone(DEFAULTS), { ...(s.settings || {}), greet: s.greet || {}, rotOut: s.rotOut || [] });
  sanitize();
  if (typeof s.pageCount === 'number' && s.pageCount > 0) {
    pages = [];
    for (let i = 0; i < s.pageCount; i++) pages.push(Array.isArray(s['page_' + i]) ? s['page_' + i] : []);
  } else pages = defaultPages();
  if (!pages.length) pages = [[]];
}
async function loadLocal() {
  const l = await Store.get('local', null);
  localIcons = {}; imgCache = {}; autoCache = {};
  for (const k in l) {
    if (k.startsWith('icon_')) localIcons[k.slice(5)] = l[k];
    else if (k.startsWith('img_')) imgCache[l[k].url] = l[k].data;
    else if (k.startsWith('auto_')) autoCache[k] = l[k];
    else if (k.startsWith('si_')) siPaths[k.slice(3)] = l[k];
  }
  localBg = l.bgImage || null;
  rotState = l.rot || {};
  // Eenmalig opruimen wat oudere versies achterlieten (widgets, spelletjes)
  if (l.v !== VERSION) {
    const junk = Object.keys(l).filter((k) => /^(w_|game_best|snake_best|memory_best)/.test(k));
    if (junk.length) Store.remove('local', junk);
    Store.set('local', { v: VERSION });
  }
}

let saveTimer;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
async function saveNow() {
  const { greet, rotOut, ...rest } = settings;
  const obj = { settings: rest, greet, rotOut, pageCount: pages.length };
  pages.forEach((p, i) => (obj['page_' + i] = p));
  try {
    lastWrite = Date.now();
    await Store.set('sync', obj);
    const all = await Store.get('sync', null);
    const stale = Object.keys(all).filter((k) => /^page_\d+$/.test(k) && +k.slice(5) >= pages.length);
    if (stale.length) await Store.remove('sync', stale);
  } catch (e) {
    console.error(e);
    toast('Opslaan mislukt: ' + (e.message || e));
  }
}

/* ---------- Icoonindexen (alleen geladen als de galerij opengaat) ---------- */
let dashIndexP = null;
function loadDashIndex() {
  dashIndexP ??= fetch('data/dashboard-icons.json').then((r) => r.json()).then((list) => {
    const names = new Map(), alias = new Map();
    for (const [n, al = [], v = ''] of list) { names.set(n, v); for (const a of al) alias.set(slugify(a), n); }
    return { names, alias, list: [...names.keys()] };
  }).catch(() => ({ names: new Map(), alias: new Map(), list: [] }));
  return dashIndexP;
}
let siIndexP = null;
function loadSiIndex() {
  siIndexP ??= fetch('data/simple-icons.json').then((r) => r.json()).then((list) => ({ list, bySlug: new Map(list.map((x) => [x[0], x])) }))
    .catch(() => ({ list: [], bySlug: new Map() }));
  return siIndexP;
}
const caching = new Set();
async function cacheRemote(url) {
  if (!url || imgCache[url] || caching.has(url)) return;
  caching.add(url);
  try { const data = await fetchImage(url); imgCache[url] = data; await Store.set('local', { ['img_' + hash(url)]: { url, data } }); } catch { /* laadt dan via internet */ }
  caching.delete(url);
}
async function ensureSiPath(slug) {
  if (siPaths[slug]) return siPaths[slug];
  const e = (await loadSiIndex()).bySlug.get(slug);
  if (!e) return null;
  siPaths[slug] = e[3];
  Store.set('local', { ['si_' + slug]: e[3] });
  return e[3];
}

/* Automatisch icoon: app-icoon uit de collectie → favicon via Google →
   favicon die Chrome zelf bewaart → lettertegel. Wordt lokaal bewaard. */
const autoKey = (a) => 'auto_' + hash((a.name || '') + '|' + (a.url || ''));
const resolving = new Map();
function resolveAuto(a) {
  const key = autoKey(a);
  if (resolving.has(key)) return resolving.get(key);
  const p = (async () => {
    const host = hostOf(a.url), cands = [];
    const idx = await loadDashIndex();
    const tries = new Set([slugify(a.name), slugify(a.name).replace(/-/g, '')]);
    const parts = host.replace(/^www\./, '').split('.');
    if (parts.length === 2) tries.add(parts[0]);
    for (const t of tries) { const n = idx.names.has(t) ? t : idx.alias.get(t); if (n) { cands.push([DASH_CDN + n + '.png', 0]); break; } }
    if (host) cands.push([`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`, 32]);
    if (IS_EXT && host) cands.push([chrome.runtime.getURL('/_favicon/') + '?pageUrl=' + encodeURIComponent(a.url) + '&size=64', 0]);
    let result = 'letter';
    for (const [url, min] of cands) { try { result = { data: await fetchImage(url, min), src: url }; break; } catch { /* volgende */ } }
    autoCache[key] = result;
    await Store.set('local', { [key]: result });
    resolving.delete(key);
    return result;
  })();
  resolving.set(key, p);
  return p;
}

/* ---------- Icoon tekenen ---------- */
function siSvg(path) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}
function iconEl(a, opts = {}) {
  const d = el('div', 'icon');
  const ic = a.icon || { type: 'auto' };
  // Bij later bijwerken (icoon geladen) de glaslaag laten staan
  const clear = () => { for (const n of [...d.childNodes]) if (!n.classList?.contains('lg-refract')) n.remove(); };
  const kind = (k) => { const lg = d.classList.contains('lg'); d.className = 'icon ' + k; if (lg) d.classList.add('lg'); };
  if (ic.bg) d.style.setProperty('--tile', ic.bg);
  const letter = () => {
    kind('letter'); clear();
    d.append(initials(a.name));
    d.style.setProperty('--tile', ic.bg || colorFor(a.name));
  };
  const showImg = (src, cls = 'img') => {
    kind(cls); clear();
    if (!ic.bg) d.style.removeProperty('--tile');
    const img = new Image();
    img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onerror = letter;
    img.src = src;
    d.append(img);
    return img;
  };
  switch (ic.type) {
    case 'letter': letter(); break;
    case 'emoji':
      kind('emoji'); d.append(ic.value || '⭐');
      if (!ic.bg) d.style.setProperty('--tile', 'rgba(255,255,255,0.18)');
      break;
    case 'image': {
      const src = opts.imgOverride || localIcons[a.id];
      const meta = opts.imgMeta || ic;
      if (!src) { letter(); break; }
      // Logo met doorzichtige achtergrond: met marge, en licht logo → donkere tegel
      showImg(src, meta.fit === 'contain' ? 'img logo' : 'full');
      if (meta.fit === 'contain' && meta.light && !ic.bg) d.style.setProperty('--tile', 'rgba(0, 0, 0, 0.3)');
      break;
    }
    case 'si': {
      const brand = '#' + (ic.hex || '000000');
      d.style.setProperty('--si', ic.color === 'white' ? '#ffffff' : brand);
      d.style.setProperty('--si-dark', luminance(brand) < 0.3 ? '#ffffff' : brand);
      const draw = (path) => { kind('si'); clear(); d.append(siSvg(path)); };
      if (siPaths[ic.slug]) draw(siPaths[ic.slug]); else { letter(); ensureSiPath(ic.slug).then((p) => p && draw(p)); }
      break;
    }
    case 'url':
      if (!ic.value) { letter(); break; }
      showImg(imgCache[ic.value] || ic.value, ic.full ? 'full' : 'img');
      if (!opts.preview) cacheRemote(ic.value);
      break;
    default: {
      const c = autoCache[autoKey(a)];
      if (c === 'letter') letter();
      else if (c?.data) showImg(c.data);
      else { letter(); if (a.url) resolveAuto(a).then((r) => r?.data && showImg(r.data)); }
    }
  }
  return d;
}

/* ---------- Stijlen toepassen ---------- */
function styleNodes() { return [$('#main'), $('#app-preview'), $('#gal-body'), $('#suggest')]; }
function applyVars() {
  const g = settings.grid, c = settings.clock, ic = settings.icons, r = document.documentElement.style;
  r.setProperty('--cols', g.cols);
  r.setProperty('--rows', g.rows);
  r.setProperty('--icon', g.iconSize + 'px');
  r.setProperty('--gap', Math.round(g.iconSize * 0.39) + 'px');
  r.setProperty('--radius', g.radius + '%');
  r.setProperty('--label', g.labelSize + 'px');
  r.setProperty('--labelspace', g.showLabels ? `${Math.round(g.labelSize * 1.3 + 10)}px` : '0px');
  r.setProperty('--clock', c.size + 'px');
  r.setProperty('--text', settings.appearance.textColor);
  r.setProperty('--searchw', settings.search.width + 'px');
  document.body.classList.toggle('clock-left', c.position === 'left');
  document.body.classList.toggle('liquid', settings.appearance.liquid);
  document.body.classList.toggle('clock-glass', c.glass && c.show);
  $('#clock-styles').classList.toggle('glassy', c.glass);
  document.body.dataset.search = settings.search.style;
  for (const n of styleNodes()) Object.assign(n.dataset, { istyle: ic.style, ishape: ic.shape, ishadow: ic.shadow, ihover: ic.hover });
  $('#clock-wrap').dataset.clock = c.style;
  $('#clock-wrap').dataset.date = c.dateLook;
  Liquid.setOptions({ depth: settings.appearance.lgDepth, dark: settings.appearance.lgDark });
  Liquid.scan();
}

/* ---------- Achtergrond ---------- */
function photoUrl(p) {
  const w = Math.min(3840, Math.ceil((Math.max(screen.width, screen.height) * (devicePixelRatio || 1)) / 640) * 640);
  return `https://images.unsplash.com/${p}?auto=format&fit=crop&w=${w}&q=80`;
}
const thumbUrl = (p) => `https://images.unsplash.com/${p}?auto=format&fit=crop&w=360&h=225&q=60`;
const allPhotos = () => Object.values(BG_GALLERIES).flatMap((g) => g.photos);
/* Foto's waaruit gewisseld wordt: je favorieten, of de gekozen thema's
   min de foto's die je hebt uitgezet. */
function rotationList() {
  const b = settings.bg;
  if (b.rotateFrom === 'fav') return b.favorites;
  const out = new Set(settings.rotOut);
  return [...new Set(b.rotateThemes.flatMap((k) => BG_GALLERIES[k]?.photos || []))].filter((p) => !out.has(p));
}
const rotating = () => settings.bg.rotate !== 'off' && settings.bg.rotateFrom === 'themes';
function pickRandom(list, not) { if (list.length < 2) return list[0]; let p; do { p = list[Math.floor(Math.random() * list.length)]; } while (p === not); return p; }

let sessionPhoto = null;
function currentPhoto() {
  const b = settings.bg;
  if (b.rotate === 'off') return b.photo;
  const list = rotationList();
  if (!list.length) return b.photo;
  const sig = [b.rotate, b.rotateFrom, b.rotateThemes.join(), settings.rotOut.length, list.length].join('|');
  if (sessionPhoto?.sig === sig) return sessionPhoto.path;
  let path;
  if (b.rotate === 'tab') {
    // Gebruik de foto die het vorige tabblad al voorlaadde → verschijnt meteen
    path = list.includes(rotState.next) ? rotState.next : pickRandom(list);
    const next = pickRandom(list, path);
    rotState = { next };
    setTimeout(() => { new Image().src = photoUrl(next); }, 1500);
  } else {
    const key = new Date().toDateString();
    if (rotState.key === key && list.includes(rotState.path)) path = rotState.path;
    else { path = pickRandom(list, rotState.path); rotState = { key, sig, path }; }
  }
  Store.set('local', { rot: rotState });
  sessionPhoto = { sig, path };
  return path;
}

let shownSrc = null, photoSize = { natW: 0, natH: 0, src: null }, localBgUrl = null;
function bgBlobUrl() {
  if (!localBg) return null;
  if (!localBgUrl) {
    const [meta, data] = localBg.split(',');
    const bin = atob(data), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    localBgUrl = URL.createObjectURL(new Blob([arr], { type: meta.slice(5).split(';')[0] }));
  }
  return localBgUrl;
}
function setPhoto(src) {
  const ph = $('#bg-photo');
  if (src === shownSrc) return;
  shownSrc = src;
  if (!src) { ph.classList.remove('on', 'set'); ph.style.backgroundImage = ''; document.documentElement.classList.remove('boot-photo'); liquidBg(); return; }
  const img = new Image();
  img.onload = () => {
    if (shownSrc !== src) return;
    ph.style.backgroundImage = cssUrl(src);
    ph.classList.add('on', 'set');
    photoSize = { natW: img.naturalWidth, natH: img.naturalHeight, src };
    liquidBg();
    GlassClock.invalidate();
  };
  img.onerror = () => { if (shownSrc === src) { ph.classList.remove('on'); document.documentElement.classList.remove('boot-photo'); } };
  img.src = src;
}
function liquidBg() {
  const b = settings.bg;
  const layers = [{ kind: 'flat', css: `linear-gradient(rgba(0,0,0,${b.dim}), rgba(0,0,0,${b.dim}))` }];
  if (shownSrc && photoSize.src === shownSrc) layers.push({ kind: 'photo', css: cssUrl(shownSrc) });
  if (b.type !== 'color') layers.push({ kind: 'flat', css: shownSrc ? GRADIENTS.ink.css : (GRADIENTS[b.gradient] || GRADIENTS.forest).css });
  Liquid.setBackground({ layers, color: b.type === 'color' ? b.color : '#101214', blur: b.blur, natW: photoSize.natW, natH: photoSize.natH });
}
function renderBg() {
  const b = settings.bg, base = $('#bg');
  let baseCss = (GRADIENTS[b.gradient] || GRADIENTS.forest).css, src = null;
  if (b.type === 'color') baseCss = b.color;
  else if (b.type === 'image') src = bgBlobUrl();
  else if (b.type === 'gallery') { const p = currentPhoto(); src = p ? photoUrl(p) : null; }
  if (src) baseCss = GRADIENTS.ink.css;
  base.style.background = baseCss;
  setPhoto(src);
  const blur = b.blur ? `blur(${b.blur}px)` : '';
  base.style.filter = blur;
  $('#bg-photo').style.filter = blur;
  $('#bg-dim').style.opacity = b.dim;
  liquidBg();
  GlassClock.invalidate();
  // Opstartplaatje voor het volgende tabblad (eigen upload is te groot; die laadt daarna)
  try {
    const vars = { '--boot-bg': baseCss, '--boot-dim': String(b.dim), '--text': settings.appearance.textColor };
    const photo = b.type === 'gallery' && src && b.rotate !== 'tab' ? src : null;
    if (photo) vars['--boot-photo'] = cssUrl(photo);
    localStorage.setItem('sp_boot', JSON.stringify({ vars, photo }));
  } catch { /* niet erg */ }
}
function renderSearch() {
  const s = settings.search;
  $('#search').hidden = !s.show;
  $('#q').placeholder = `Zoeken met ${ENGINES[s.engine].name} of adres typen`;
}

/* ---------- Klok, datum, begroeting ---------- */
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
function formatDate(now, style) {
  const opts = { long: { weekday: 'long', day: 'numeric', month: 'long' }, week: { weekday: 'long', day: 'numeric', month: 'long' },
    short: { weekday: 'short', day: 'numeric', month: 'short' }, numeric: { day: '2-digit', month: '2-digit', year: 'numeric' } }[style];
  let d = now.toLocaleDateString('nl-NL', opts).replace(/\./g, '');
  if (style === 'week') d += ' · week ' + isoWeek(now);
  return d.charAt(0).toUpperCase() + d.slice(1);
}
const setText = (n, t) => { if (n.textContent !== t) n.textContent = t; };
function tick() {
  const c = settings.clock, now = new Date();
  $('#clock-wrap').hidden = !c.show && !c.showDate && !c.greeting;
  $('#clock').hidden = !c.show;
  if (c.show) setText($('#clock'), now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: c.seconds ? '2-digit' : undefined, hour12: c.hour12 }));
  if (c.glass && c.show) GlassClock.render(); else GlassClock.hide();
  setText($('#date'), c.showDate ? formatDate(now, c.dateStyle) : '');
  setText($('#greeting'), c.greeting ? Greetings.get(now, c.name.trim(), settings.greet) : '');
}
/* Zuinig: zonder seconden één keer per minuut bijwerken, precies op de
   minuutgrens; in een tabblad op de achtergrond helemaal niet. */
let tickTimer;
function scheduleTick() {
  clearTimeout(tickTimer);
  if (document.hidden) return;
  const step = settings.clock.seconds ? 1000 : 60000;
  tickTimer = setTimeout(() => { tick(); scheduleTick(); }, step - (Date.now() % step) + 20);
}

/* ---------- Raster & pagina's ---------- */
function reflow() {
  const c = cap();
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].length > c) { const extra = pages[i].splice(c); if (!pages[i + 1]) pages.push([]); pages[i + 1].unshift(...extra); }
  }
}
function removeEmptyPages() { pages = pages.filter((p) => p.length); if (!pages.length) pages = [[]]; cur = Math.min(cur, pages.length - 1); }
function findApp(id) {
  for (let pi = 0; pi < pages.length; pi++) { const ai = pages[pi].findIndex((a) => a.id === id); if (ai > -1) return { pi, ai }; }
  return null;
}
function moveApp(id, toPage, toIndex) {
  const from = findApp(id);
  if (!from) return;
  const [a] = pages[from.pi].splice(from.ai, 1);
  if (from.pi === toPage && from.ai < toIndex) toIndex--;
  while (pages.length <= toPage) pages.push([]);
  pages[toPage].splice(Math.max(0, Math.min(toIndex, pages[toPage].length)), 0, a);
  reflow(); save(); renderPages();
}
async function deleteApp(id) {
  const f = findApp(id);
  if (!f) return;
  pages[f.pi].splice(f.ai, 1);
  if (localIcons[id]) { delete localIcons[id]; await Store.remove('local', 'icon_' + id); }
  if (!editing) removeEmptyPages();
  save(); renderPages();
}
function openApp(a) { if (settings.grid.newTab) window.open(a.url, '_blank', 'noopener'); else location.href = a.url; }

function tile(a) {
  const t = el('a', 'app');
  t.href = a.url;
  t.dataset.id = a.id;
  t.title = a.name;
  t.draggable = false; // slepen doen we zelf (zie Drag hieronder)
  if (settings.grid.newTab && !editing) { t.target = '_blank'; t.rel = 'noopener'; }
  t.append(iconEl(a));
  if (settings.grid.showLabels) t.append(el('span', 'label', a.name));
  if (editing) {
    const del = el('button', 'del', '✕');
    del.type = 'button';
    del.setAttribute('aria-label', `${a.name} verwijderen`);
    del.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); deleteApp(a.id); });
    t.append(del);
  }
  t.addEventListener('click', (e) => {
    if (!editing) return;
    e.preventDefault();
    if (!Drag.justDropped()) openDialog(a);
  });
  t.addEventListener('contextmenu', (e) => { e.preventDefault(); showCtx(e, a); });
  return t;
}
function addTile(pi) {
  const t = el('a', 'app add-tile');
  t.href = '#';
  t.draggable = false;
  t.append(el('div', 'icon', '+'));
  if (settings.grid.showLabels) t.append(el('span', 'label', 'Toevoegen'));
  t.addEventListener('click', (e) => { e.preventDefault(); openDialog(null, pi); });
  return t;
}
function renderPages() {
  const frag = document.createDocumentFragment();
  pages.forEach((page, pi) => {
    const pg = el('div', 'page');
    pg.dataset.page = pi;
    page.forEach((a) => pg.append(tile(a)));
    if (editing && page.length < cap()) pg.append(addTile(pi));
    frag.append(pg);
  });
  $('#track').replaceChildren(frag);
  cur = Math.min(cur, pages.length - 1);
  $('#track').style.transform = `translateX(${-cur * 100}%)`;
  renderDots();
  $('#empty-hint').hidden = pages.some((p) => p.length) || editing;
  dockRects = null;
  Liquid.scan();
}
function renderDots() {
  const dots = $('#dots');
  dots.replaceChildren();
  pages.forEach((_, i) => {
    const d = el('button', 'dot' + (i === cur ? ' active' : ''));
    d.type = 'button';
    d.dataset.page = i;
    d.setAttribute('aria-label', `Pagina ${i + 1}`);
    d.addEventListener('click', () => goTo(i));
    dots.append(d);
  });
  if (editing) {
    const add = el('button', 'dot add', '+');
    add.type = 'button';
    add.dataset.page = 'new';
    add.title = 'Pagina toevoegen';
    add.addEventListener('click', addPage);
    dots.append(add);
  }
  dots.classList.toggle('single', pages.length <= 1 && !editing);
}

/* =====================================================================
   Slepen in de bewerkmodus, zoals op een iPhone:
   - het icoon hangt aan je muis, de andere schuiven vloeiend opzij
   - loslaten op een paginabolletje → app naar die pagina (+ = nieuwe pagina)
   - even bij de linker- of rechterrand houden → naar de vorige/volgende pagina
   ===================================================================== */
const Drag = (() => {
  let st = null, droppedAt = 0;
  const THRESHOLD = 6;

  /* Elementen in een pagina vloeiend naar hun nieuwe plek laten schuiven (FLIP). */
  function flip(page, mutate) {
    const items = [...page.querySelectorAll('.app:not(.placeholder)')];
    const before = new Map(items.map((n) => [n, n.getBoundingClientRect()]));
    mutate();
    for (const n of items) {
      const a = before.get(n), b = n.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      n.style.transition = 'none';
      n.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => { n.style.transition = 'transform 0.32s var(--spring)'; n.style.transform = ''; });
    }
  }

  function pageEl(i) { return $(`#track .page[data-page="${i}"]`); }

  function start(e, t) {
    const r = t.getBoundingClientRect();
    const ghost = t.cloneNode(true);
    ghost.querySelector('.del')?.remove();
    ghost.classList.add('drag-ghost');
    ghost.style.width = r.width + 'px';
    ghost.style.left = r.left + 'px';
    ghost.style.top = r.top + 'px';
    document.body.append(ghost);
    t.classList.add('placeholder');
    document.body.classList.add('dragging-app');
    st.ghost = ghost;
    st.ox = e.clientX - r.left; st.oy = e.clientY - r.top;
    st.left = r.left; st.top = r.top;
    st.started = true;
  }

  function reorder(x, y) {
    const page = pageEl(cur);
    if (!page) return;
    // placeholder naar de huidige pagina verhuizen als je bent doorgebladerd
    if (st.tile.parentElement !== page) {
      const full = page.querySelectorAll('.app:not(.add-tile):not(.placeholder)').length >= cap();
      if (full) return;
      flip(page, () => page.insertBefore(st.tile, page.querySelector('.add-tile')));
    }
    const tiles = [...page.querySelectorAll('.app:not(.add-tile)')];
    let best = null, bestD = Infinity;
    for (const n of tiles) {
      const r = n.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, (y - cy) * 1.2);
      if (d < bestD) { bestD = d; best = { n, cx }; }
    }
    if (!best || best.n === st.tile) return;
    const iSrc = tiles.indexOf(st.tile), iDst = tiles.indexOf(best.n);
    // pas wisselen als je echt over de helft van het andere icoon bent
    if ((iDst > iSrc && x < best.cx - 4) || (iDst < iSrc && x > best.cx + 4)) return;
    flip(page, () => page.insertBefore(st.tile, iDst > iSrc ? best.n.nextSibling : best.n));
  }

  function edge(x) {
    const zone = 48;
    const dir = x < zone ? -1 : x > innerWidth - zone ? 1 : 0;
    if (dir === st.edgeDir) return;
    st.edgeDir = dir;
    clearTimeout(st.edgeT);
    if (!dir) return;
    st.edgeT = setTimeout(function flipPage() {
      const to = cur + dir;
      if (to >= 0 && to < pages.length) { goTo(to); st.edgeT = setTimeout(flipPage, 900); }
    }, 650);
  }

  function hoverDot(x, y) {
    const d = document.elementFromPoint(x, y)?.closest('.dot');
    if (d === st.dot) return;
    st.dot?.classList.remove('drop-hover');
    clearTimeout(st.dotT);
    st.dot = d;
    if (!d) return;
    d.classList.add('drop-hover');
    if (d.dataset.page !== 'new') st.dotT = setTimeout(() => goTo(+d.dataset.page), 600);
  }

  function move(e) {
    if (!st) return;
    if (!st.started) {
      if (Math.hypot(e.clientX - st.x0, e.clientY - st.y0) < THRESHOLD) return;
      start(e, st.tile);
    }
    st.lx = e.clientX; st.ly = e.clientY;
    if (st.raf) return;
    st.raf = requestAnimationFrame(() => {
      st.raf = 0;
      const { lx: x, ly: y } = st;
      st.ghost.style.transform = `translate(${x - st.ox - st.left}px, ${y - st.oy - st.top}px) scale(1.1)`;
      hoverDot(x, y);
      if (!st.dot) { edge(x); reorder(x, y); }
    });
  }

  function end() {
    if (!st) return;
    const s = st;
    st = null;
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', end);
    removeEventListener('pointercancel', end);
    clearTimeout(s.edgeT); clearTimeout(s.dotT);
    if (s.raf) cancelAnimationFrame(s.raf);
    if (!s.started) return;
    droppedAt = Date.now();
    document.body.classList.remove('dragging-app');
    s.dot?.classList.remove('drop-hover');
    const id = s.tile.dataset.id;
    // het zwevende icoon landt op zijn nieuwe plek
    const target = s.dot ? s.dot.getBoundingClientRect() : s.tile.getBoundingClientRect();
    s.ghost.style.transition = 'transform 0.28s var(--spring), opacity 0.2s';
    s.ghost.style.transform = `translate(${target.left - s.left}px, ${target.top - s.top}px) scale(${s.dot ? 0.2 : 1})`;
    if (s.dot) s.ghost.style.opacity = '0';
    setTimeout(() => {
      s.ghost.remove();
      if (s.dot) {
        const to = s.dot.dataset.page === 'new' ? pages.length : +s.dot.dataset.page;
        if (to >= pages.length) pages.push([]);
        moveApp(id, to, pages[to].length);
        goTo(to);
      } else {
        // nieuwe volgorde uitlezen uit de pagina waar het icoon nu staat
        const page = s.tile.parentElement;
        const pi = +page.dataset.page;
        const order = [...page.querySelectorAll('.app:not(.add-tile)')].map((n) => n.dataset.id);
        moveApp(id, pi, order.indexOf(id) + (findApp(id)?.pi === pi && findApp(id).ai < order.indexOf(id) ? 1 : 0));
      }
    }, 260);
  }

  function bind() {
    $('#track').addEventListener('pointerdown', (e) => {
      if (!editing || e.button !== 0 || st) return;
      const t = e.target.closest('.app:not(.add-tile)');
      if (!t || e.target.closest('.del')) return;
      e.preventDefault(); // geen tekstselectie of plaatje-slepen van de browser
      st = { tile: t, x0: e.clientX, y0: e.clientY, started: false, edgeDir: 0 };
      addEventListener('pointermove', move);
      addEventListener('pointerup', end);
      addEventListener('pointercancel', end);
    });
  }
  return { bind, justDropped: () => Date.now() - droppedAt < 350 };
})();

function goTo(i) {
  cur = Math.max(0, Math.min(i, pages.length - 1));
  $('#track').style.transform = `translateX(${-cur * 100}%)`;
  $$('.dot:not(.add)').forEach((d, k) => d.classList.toggle('active', k === cur));
  dockRects = null;
  Liquid.follow();
}
function addPage() { pages.push([]); save(); renderPages(); goTo(pages.length - 1); }
function setEditing(on) {
  editing = on;
  document.body.classList.toggle('editing', on);
  $('#editbar').hidden = !on;
  if (!on) { removeEmptyPages(); save(); }
  hideCtx();
  renderPages();
}

/* Dock-vergroting: berekend per beeldje (niet per muisbeweging), met
   onthouden posities zodat de browser niet steeds hoeft te meten. */
let dockRects = null, dockRaf = 0, dockEv = null;
function dockMove(e) {
  if (settings.icons.hover !== 'dock' || editing) return;
  dockEv = e;
  if (dockRaf) return;
  dockRaf = requestAnimationFrame(() => {
    dockRaf = 0;
    const page = $$('#track .page')[cur];
    if (!page) return;
    if (!dockRects) dockRects = [...page.querySelectorAll('.icon')].map((ic) => { const r = ic.getBoundingClientRect(); return [ic, r.left + r.width / 2, r.top + r.height / 2]; });
    const sigma = settings.grid.iconSize * 1.25;
    for (const [ic, x, y] of dockRects) {
      const dx = dockEv.clientX - x, dy = dockEv.clientY - y;
      ic.style.setProperty('--dock', (1 + 0.4 * Math.exp(-(dx * dx + dy * dy * 1.6) / (2 * sigma * sigma))).toFixed(3));
    }
  });
}

/* ---------- Snelmenu ---------- */
function showCtx(e, a) {
  const m = $('#ctx');
  m.replaceChildren();
  const item = (label, fn, cls) => { const b = el('button', cls || '', label); b.addEventListener('click', () => { hideCtx(); fn(); }); m.append(b); };
  item('Openen in nieuw tabblad', () => window.open(a.url, '_blank', 'noopener'));
  item('Bewerken…', () => openDialog(a));
  item('Ander icoon zoeken…', () => { openDialog(a); openGallery(); });
  item(editing ? 'Klaar met ordenen' : 'Apps ordenen', () => setEditing(!editing));
  item('Verwijderen', () => deleteApp(a.id), 'danger');
  m.hidden = false;
  m.style.left = Math.min(e.clientX, innerWidth - m.offsetWidth - 8) + 'px';
  m.style.top = Math.min(e.clientY, innerHeight - m.offsetHeight - 8) + 'px';
}
function hideCtx() { $('#ctx').hidden = true; }

/* ---------- Dialoog: app toevoegen / bewerken ---------- */
let dlg = { app: null, pendingImg: null, picked: null };
function dialogDraft() {
  const type = $('input[name="itype"]:checked').value;
  let icon;
  if (type === 'pick' && dlg.picked) icon = { ...dlg.picked };
  else {
    icon = { type: type === 'pick' ? 'auto' : type };
    if (type === 'emoji') icon.value = $('#f-emoji').value.trim() || '⭐';
    if (type === 'image') {
      const m = dlg.pendingMeta || (dlg.app?.icon?.type === 'image' ? dlg.app.icon : {});
      if (m.fit) icon.fit = m.fit;
      if (m.light) icon.light = true;
    }
  }
  delete icon.bg;
  if (!$('#f-bg-auto').checked) icon.bg = $('#f-bg').value;
  return { id: dlg.app?.id || 'preview', name: $('#f-name').value.trim() || 'App', url: normUrl($('#f-url').value) || '', icon };
}
function updatePreview() {
  const type = $('input[name="itype"]:checked').value;
  $$('.itype-opt').forEach((o) => o.classList.toggle('on', o.dataset.itype.split(' ').includes(type)));
  $('.pick-only').hidden = !dlg.picked;
  $('#f-bg').disabled = $('#f-bg-auto').checked;
  const imgOverride = type === 'image' ? dlg.pendingImg || localIcons[dlg.app?.id] : null;
  $('#app-preview').replaceChildren(iconEl(dialogDraft(), { preview: true, imgOverride, imgMeta: dlg.pendingMeta }));
  Liquid.scan();
}
function openDialog(a = null, pageIndex = cur) {
  hideCtx();
  const ic = a?.icon || { type: 'auto' };
  const fromGallery = ic.type === 'si' || ic.type === 'url';
  dlg = { app: a, pendingImg: null, pendingMeta: null, picked: fromGallery ? { ...ic } : null };
  $('#app-dialog-title').textContent = a ? 'App bewerken' : 'App toevoegen';
  $('#f-name').value = a?.name || '';
  $('#f-url').value = a?.url || '';
  $(`input[name="itype"][value="${fromGallery ? 'pick' : ic.type}"]`).checked = true;
  $('#f-emoji').value = ic.type === 'emoji' ? ic.value || '' : '';
  $('#f-bg-auto').checked = !ic.bg;
  $('#f-bg').value = ic.bg?.startsWith('#') ? ic.bg : '#ffffff';
  $('#f-delete').hidden = !a;
  const sel = $('#f-page');
  sel.replaceChildren();
  const where = a ? findApp(a.id).pi : pageIndex;
  pages.forEach((p, i) => { const o = el('option', '', `Pagina ${i + 1}${p.length >= cap() && i !== where ? ' (vol)' : ''}`); o.value = i; sel.append(o); });
  const o = el('option', '', 'Nieuwe pagina'); o.value = 'new'; sel.append(o);
  sel.value = String(where);
  updatePreview();
  if (!$('#app-dialog').open) $('#app-dialog').showModal();
  $('#f-name').focus();
}
async function submitDialog(e) {
  e.preventDefault();
  const name = $('#f-name').value.trim(), url = normUrl($('#f-url').value);
  if (!name) return toast('Geef de app een naam.');
  if (!url) return toast('Dat adres klopt niet. Probeer bijv. "mail.google.com".');
  const id = dlg.app?.id || uid();
  const a = { id, name, url, icon: dialogDraft().icon };
  if (a.icon.type === 'image') {
    if (dlg.pendingImg) { localIcons[id] = dlg.pendingImg; await Store.set('local', { ['icon_' + id]: dlg.pendingImg }); }
    else if (!localIcons[id]) return toast('Kies eerst een afbeelding, of een ander icoontype.');
  } else if (localIcons[id]) { delete localIcons[id]; await Store.remove('local', 'icon_' + id); }
  if (a.icon.type === 'url') cacheRemote(a.icon.value);
  if (a.icon.type === 'si') ensureSiPath(a.icon.slug);
  const target = $('#f-page').value === 'new' ? pages.length : +$('#f-page').value;
  if (target >= pages.length) pages.push([]);
  const existing = dlg.app && findApp(id);
  if (existing) { pages[existing.pi][existing.ai] = a; if (existing.pi !== target) moveApp(id, target, pages[target].length); }
  else pages[target].push(a);
  reflow(); save(); renderPages();
  const now = findApp(id);
  if (now) goTo(now.pi);
  $('#app-dialog').close();
}

/* ---------- Icoongalerij ---------- */
function galCandidate(icon, caption, name, onPick) {
  const b = el('button', 'cand');
  b.type = 'button';
  const ic = iconEl({ name: name || caption, url: '', icon }, { preview: true });
  b.append(ic, el('span', 'cap', caption));
  const img = ic.querySelector('img');
  if (img) { img.onerror = () => b.remove(); img.addEventListener('load', () => { if (img.naturalWidth < 24) b.remove(); }); }
  b.addEventListener('click', () => onPick(icon));
  return b;
}
function galSection(title, note) {
  const s = el('section', 'gal-sec');
  s.append(el('h4', '', title));
  if (note) s.append(el('p', '', note));
  const g = el('div', 'gal-grid');
  s.append(g);
  $('#gal-body').append(s);
  return g;
}
let galToken = 0;
async function renderGallery(q) {
  const token = ++galToken;
  $('#gal-body').replaceChildren();
  const qs = slugify(q);
  const name = $('#f-name').value.trim() || q;
  const pick = (icon) => {
    dlg.picked = { ...icon };
    $('input[name="itype"][value="pick"]').checked = true;
    if (icon.bg) { $('#f-bg-auto').checked = false; $('#f-bg').value = icon.bg; } else $('#f-bg-auto').checked = true;
    delete dlg.picked.bg;
    $('#icon-gallery').close();
    updatePreview();
  };
  const url = normUrl($('#f-url').value), host = url && hostOf(url);
  if (host) {
    const g = galSection('Van de website zelf', host);
    const opts = [[`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`, 'Google'], [`https://icons.duckduckgo.com/ip3/${host}.ico`, 'DuckDuckGo'],
      [`https://icon.horse/icon/${host}`, 'icon.horse'], [`${new URL(url).origin}/apple-touch-icon.png`, 'App-icoon site']];
    for (const [src, c] of opts) g.append(galCandidate({ type: 'url', value: src }, c, name, pick));
  }
  if (!qs) return;
  const dash = await loadDashIndex();
  if (token !== galToken) return;
  const dHits = [];
  for (const n of dash.list) { const s = scoreMatch(qs, n); if (s) dHits.push([s, n]); }
  for (const [al, n] of dash.alias) { const s = scoreMatch(qs, al); if (s && !dHits.some((h) => h[1] === n)) dHits.push([s - 5, n]); }
  dHits.sort((a, b) => b[0] - a[0]);
  const g2 = galSection('App-iconen', 'Kleurrijke iconen zoals op een telefoon.');
  for (const [, n] of dHits.slice(0, 18)) {
    const v = dash.names.get(n) || '';
    g2.append(galCandidate({ type: 'url', value: DASH_CDN + n + '.png' }, n, name, pick));
    if (v.includes('l')) g2.append(galCandidate({ type: 'url', value: DASH_CDN + n + '-light.png' }, n + ' (licht)', name, pick));
    if (v.includes('d')) g2.append(galCandidate({ type: 'url', value: DASH_CDN + n + '-dark.png' }, n + ' (donker)', name, pick));
  }
  if (!dHits.length) g2.parentElement.append(el('p', 'gal-empty', 'Niets gevonden in deze collectie.'));
  const si = await loadSiIndex();
  if (token !== galToken) return;
  const sHits = [];
  for (const e of si.list) { const s = scoreMatch(qs, e[0], slugify(e[1])); if (s) sHits.push([s, e]); }
  sHits.sort((a, b) => b[0] - a[0]);
  const g3 = galSection("Merklogo's", 'Strakke logo\'s in de merkkleur of wit. Werken ook offline.');
  for (const [, [slug, title, hex, path]] of sHits.slice(0, 12)) {
    siPaths[slug] ??= path;
    g3.append(galCandidate({ type: 'si', slug, hex, color: 'brand' }, title, name, pick));
    g3.append(galCandidate({ type: 'si', slug, hex, color: 'white', bg: '#' + hex }, title + ' (wit)', name, pick));
    g3.append(galCandidate({ type: 'si', slug, hex, color: 'white', bg: '#111318' }, title + ' (donker)', name, pick));
  }
  if (!sHits.length) g3.parentElement.append(el('p', 'gal-empty', 'Niets gevonden. Probeer een kortere of Engelse naam.'));
  Liquid.scan();
}
function openGallery() {
  const host = hostOf(normUrl($('#f-url').value) || '');
  const q = $('#f-name').value.trim() || host.replace(/^www\./, '').split('.')[0] || '';
  $('#gal-q').value = q;
  $('#icon-gallery').showModal();
  renderGallery(q);
  $('#gal-q').focus();
}

/* ---------- App-suggesties in de zoekbalk ---------- */
let sgList = [], sgSel = -1;
function renderSuggest() {
  const box = $('#suggest'), q = slugify($('#q').value.trim());
  if (!settings.search.suggest || !q) { box.hidden = true; sgList = []; sgSel = -1; return; }
  const hits = [];
  for (const p of pages) for (const a of p) { const s = scoreMatch(q, slugify(a.name), slugify(hostOf(a.url).replace(/^www\./, ''))); if (s) hits.push([s, a]); }
  hits.sort((x, y) => y[0] - x[0]);
  sgList = hits.slice(0, 5).map((h) => h[1]);
  sgSel = Math.min(sgSel, sgList.length - 1);
  box.replaceChildren();
  if (!sgList.length) { box.hidden = true; return; }
  sgList.forEach((a, i) => {
    const b = el('button', 'sg' + (i === sgSel ? ' sel' : ''));
    b.type = 'button';
    b.append(iconEl(a, { preview: true }), el('span', '', a.name), el('span', 'host', hostOf(a.url).replace(/^www\./, '')));
    b.addEventListener('mousedown', (e) => { e.preventDefault(); openApp(a); });
    box.append(b);
  });
  box.append(el('div', 'hint', sgSel < 0 ? '↓ om een app te kiezen · Enter zoekt op het web' : 'Enter om te openen'));
  box.hidden = false;
}

/* ---------- Instellingen ---------- */
function showCond(expr) {
  const neg = expr.includes('!=');
  const [p, val] = expr.split(neg ? '!=' : '=');
  const eq = String(getPath(settings, p)) === val;
  return neg ? !eq : eq;
}
function syncSettingsUI() {
  $$('#settings [data-path]').forEach((inp) => {
    const v = getPath(settings, inp.dataset.path);
    if (inp.type === 'checkbox') inp.checked = !!v;
    else if (document.activeElement !== inp) inp.value = String(v ?? '');
  });
  $$('[data-out]').forEach((o) => { const v = getPath(settings, o.dataset.out); o.textContent = (o.dataset.scale ? Math.round(v * o.dataset.scale) : v) + (o.dataset.unit || ''); });
  $$('[data-show]').forEach((n) => (n.hidden = !showCond(n.dataset.show)));
  $$('[data-chips] button').forEach((b) => b.classList.toggle('on', String(getPath(settings, b.parentElement.dataset.chips)) === b.dataset.v));
  $$('#clock-styles .card').forEach((c) => c.classList.toggle('on', c.dataset.clock === settings.clock.style));
  $$('#icon-styles .card').forEach((c) => { c.classList.toggle('on', c.dataset.istyle === settings.icons.style); c.dataset.ishape = settings.icons.shape; });
  $$('#gradient-swatches .swatch').forEach((s) => s.classList.toggle('on', s.dataset.g === settings.bg.gradient));
  $('#liquid-all').checked = isLiquidAll();
  if (document.activeElement !== $('#greet-lines')) $('#greet-lines').value = settings.greet.lines.join('\n');
  renderThemeChips();
  renderRotThemes();
  renderThumbs();
  greetPreview();
}
function setSetting(p, v) {
  const oldCap = cap();
  setPath(settings, p, v);
  if (cap() !== oldCap) reflow();
  if (['bg.rotate', 'bg.rotateFrom', 'bg.theme', 'bg.type', 'bg.rotateThemes'].includes(p)) sessionPhoto = null;
  onSettingsChanged(p.startsWith('grid') || p.startsWith('icons'));
}
function onSettingsChanged(gridChanged) {
  applyVars(); renderBg(); renderSearch(); tick(); scheduleTick();
  if (gridChanged) renderPages();
  syncSettingsUI();
  save();
}
function bindSettings() {
  $$('#settings [data-path]').forEach((inp) => {
    const isText = inp.type === 'text';
    inp.addEventListener(isText ? 'change' : 'input', () => {
      let v;
      if (inp.type === 'checkbox') v = inp.checked;
      else if (inp.type === 'range') v = +inp.value;
      else v = inp.value;
      setSetting(inp.dataset.path, v);
    });
    if (isText) inp.addEventListener('input', () => { setPath(settings, inp.dataset.path, inp.value); tick(); greetPreview(); save(); });
  });
  $$('[data-chips]').forEach((wrap) => wrap.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    if (wrap.dataset.chips === 'bg.type' && b.dataset.v === 'image' && !localBg) return $('#bg-file').click();
    setSetting(wrap.dataset.chips, b.dataset.v);
  }));
  // Eigen begroetingen
  let gT;
  $('#greet-lines').addEventListener('input', (e) => {
    clearTimeout(gT);
    gT = setTimeout(() => {
      settings.greet.lines = e.target.value.split('\n').map((l) => l.slice(0, 120)).slice(0, 30);
      tick(); greetPreview(); save();
    }, 250);
  });
  $('#greet-shuffle').addEventListener('click', () => {
    const t = Greetings.get(new Date(), settings.clock.name.trim(), settings.greet, true);
    $('#greet-prev').textContent = t;
    setText($('#greeting'), t);
  });
  $('#liquid-all').addEventListener('change', (e) => toggleLiquidAll(e.target.checked));
}
function greetPreview() { if (settings.clock.greeting) $('#greet-prev').textContent = $('#greeting').textContent || '—'; }

function buildSettingsWidgets() {
  for (const [k, name] of CLOCK_STYLES) {
    const c = el('button', 'card');
    c.type = 'button';
    c.dataset.clock = k;
    c.append(el('div', 'clock-text', '12:30'), el('span', 'cap', name));
    c.addEventListener('click', () => setSetting('clock.style', k));
    $('#clock-styles').append(c);
  }
  const demo = [{ name: 'A', icon: { type: 'letter', bg: '#e8505b' } }, { name: 'P', icon: { type: 'si', slug: '__demo', hex: '1DB954', color: 'brand' } }, { name: 'B', icon: { type: 'emoji', value: '📚' } }];
  for (const [k, name] of ICON_STYLES) {
    const c = el('button', 'card');
    c.type = 'button';
    c.dataset.istyle = k;
    const row = el('div', 'row-ic');
    demo.forEach((d) => row.append(iconEl(d, { preview: true })));
    c.append(row, el('span', 'cap', name));
    c.addEventListener('click', () => setSetting('icons.style', k));
    $('#icon-styles').append(c);
  }
  for (const [k, g] of Object.entries(GRADIENTS)) {
    const s = el('button', 'swatch');
    s.type = 'button';
    s.dataset.g = k;
    s.style.background = g.css;
    s.append(el('span', '', g.name));
    s.addEventListener('click', () => setSetting('bg.gradient', k));
    $('#gradient-swatches').append(s);
  }
}
let galView = null;
function renderThemeChips() {
  const wrap = $('#theme-chips');
  galView ??= settings.bg.theme;
  wrap.replaceChildren();
  const chip = (k, label) => {
    const b = el('button', galView === k ? 'on' : '', label);
    b.type = 'button';
    b.addEventListener('click', () => { galView = k; if (k !== 'fav') { settings.bg.theme = k; save(); } sessionPhoto = null; renderThemeChips(); renderThumbs(); });
    wrap.append(b);
  };
  for (const [k, g] of Object.entries(BG_GALLERIES)) chip(k, g.name);
  chip('fav', `♥ ${settings.bg.favorites.length}`);
}
let thumbsKey = '';
function renderThumbs() {
  if (!$('#settings').classList.contains('open') || settings.bg.type !== 'gallery') return;
  const list = galView === 'fav' ? settings.bg.favorites : BG_GALLERIES[galView]?.photos || [];
  const key = [galView, list.length, settings.bg.photo, settings.bg.rotate, settings.bg.rotateFrom, settings.bg.favorites.join(), settings.rotOut.join()].join('|');
  if (key === thumbsKey) return;
  thumbsKey = key;
  const wrap = $('#bg-thumbs');
  wrap.replaceChildren();
  const rot = rotating();
  $('#thumbs-note').textContent = rot
    ? 'Klik op een foto om hem uit of weer in de wisseling te zetten. ♡ = favoriet.'
    : 'Klik op een foto om hem als achtergrond te gebruiken. ♡ = favoriet.';
  if (galView === 'fav' && !list.length) wrap.append(el('p', 'note', 'Nog geen favorieten. Klik op het hartje bij een foto.'));
  const out = new Set(settings.rotOut);
  for (const p of list) {
    const b = el('button', 'thumb' + (settings.bg.photo === p && settings.bg.rotate === 'off' ? ' on' : '') + (rot && out.has(p) ? ' out' : ''));
    if (rot) b.title = out.has(p) ? 'Staat uit · klik om weer mee te laten wisselen' : 'Klik om uit de wisseling te halen';
    b.type = 'button';
    const img = new Image();
    img.loading = 'lazy'; img.alt = ''; img.src = thumbUrl(p);
    img.onerror = () => b.remove();
    const fav = settings.bg.favorites.includes(p);
    const h = el('span', 'heart' + (fav ? ' fav' : ''), fav ? '♥' : '♡');
    h.addEventListener('click', (e) => {
      e.stopPropagation();
      const f = settings.bg.favorites, i = f.indexOf(p);
      if (i > -1) f.splice(i, 1); else if (f.length < 60) f.push(p); else return toast('Maximaal 60 favorieten.');
      sessionPhoto = null; save(); renderThemeChips(); renderThumbs();
    });
    b.append(img, h);
    if (rot) b.append(el('span', 'rot-badge', out.has(p) ? 'Uit' : '✓'));
    b.addEventListener('click', () => {
      if (rot) return toggleRotOut(p);
      settings.bg.photo = p;
      if (galView !== 'fav') settings.bg.theme = galView;
      settings.bg.rotate = 'off';
      setSetting('bg.type', 'gallery');
    });
    wrap.append(b);
  }
}
function toggleRotOut(p) {
  const o = settings.rotOut, i = o.indexOf(p);
  if (i > -1) o.splice(i, 1); else o.push(p);
  sessionPhoto = null;
  save(); renderBg(); renderRotThemes(); renderThumbs();
}
/* "Wissel tussen": thema's aan- en uitvinken. */
function renderRotThemes() {
  const wrap = $('#rot-themes');
  wrap.replaceChildren();
  const b = settings.bg, out = new Set(settings.rotOut);
  for (const [k, g] of Object.entries(BG_GALLERIES)) {
    const on = b.rotateThemes.includes(k);
    const off = g.photos.filter((p) => out.has(p)).length;
    const chip = el('button', on ? 'on' : '', (on ? '✓ ' : '') + g.name + (on && off ? ` (${g.photos.length - off}/${g.photos.length})` : ''));
    chip.type = 'button';
    chip.addEventListener('click', () => {
      const list = b.rotateThemes.includes(k) ? b.rotateThemes.filter((x) => x !== k) : [...b.rotateThemes, k];
      if (!list.length) return toast('Kies minstens één thema.');
      galView = k; // laat meteen de foto's van dit thema zien
      setSetting('bg.rotateThemes', list);
    });
    wrap.append(chip);
  }
  const n = rotationList().length;
  const offInSel = b.rotateThemes.reduce((t, k) => t + BG_GALLERIES[k].photos.filter((p) => out.has(p)).length, 0);
  const cnt = $('#rot-count');
  cnt.replaceChildren(n ? `${n} foto's in de wisseling${offInSel ? ` · ${offInSel} uitgezet` : ''}.` : 'Alle foto\'s staan uit. Tot je er een aanzet, blijft je vaste foto staan.');
  if (offInSel) {
    const reset = el('button', 'link-btn', 'Alles weer aanzetten');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      const inSel = new Set(b.rotateThemes.flatMap((k) => BG_GALLERIES[k].photos));
      settings.rotOut = settings.rotOut.filter((p) => !inSel.has(p));
      sessionPhoto = null; save(); renderBg(); renderRotThemes(); renderThumbs();
    });
    cnt.append(' ', reset);
  }
}
function openSettings(open) {
  $('#settings').classList.toggle('open', open);
  if (open) { galView = settings.bg.theme; thumbsKey = ''; syncSettingsUI(); Liquid.scan(); }
}

/* ---------- Liquid glass ---------- */
function liquidTargets() {
  const t = [...$$('.card[data-istyle="liquid"] .icon')];
  if (settings.icons.style === 'liquid') t.push(...$$('#track .app:not(.add-tile) .icon'), ...$$('#app-preview .icon'), ...$$('#gal-body .icon'));
  if (settings.search.style === 'liquid' && settings.search.show) t.push($('#search'));
  if (settings.appearance.liquid) t.push(...$$('#topbar .round'), $('#editbar'));
  return t.filter((n) => n && !n.closest('[hidden]'));
}
const isLiquidAll = () => settings.icons.style === 'liquid' && settings.search.style === 'liquid' && settings.appearance.liquid;
function toggleLiquidAll(on) {
  const s = settings;
  if (on) {
    s.icons.style = 'liquid'; s.search.style = 'liquid'; s.appearance.liquid = true; s.clock.glass = true;
  } else {
    if (s.icons.style === 'liquid') s.icons.style = 'standard';
    if (s.search.style === 'liquid') s.search.style = 'glass';
    s.clock.glass = false;
    s.appearance.liquid = false;
  }
  onSettingsChanged(true);
}

/* ---------- Back-up ---------- */
function exportData() {
  const data = { app: 'mijn-startpagina', version: VERSION, exported: new Date().toISOString(), settings, pages, icons: localIcons, bgImage: localBg };
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = `startpagina-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.pages) || typeof data.settings !== 'object') throw new Error('geen geldige back-up');
    settings = deepMerge(structuredClone(DEFAULTS), data.settings);
    sanitize();
    pages = data.pages.filter(Array.isArray).map((p) => p.filter((a) => a?.name && normUrl(a.url)).map((a) => ({ ...a, id: a.id || uid(), url: normUrl(a.url) })));
    if (!pages.length) pages = [[]];
    const loc = { v: VERSION };
    localIcons = {};
    for (const [id, src] of Object.entries(data.icons || {})) if (typeof src === 'string' && src.startsWith('data:image/')) { localIcons[id] = src; loc['icon_' + id] = src; }
    if (typeof data.bgImage === 'string' && data.bgImage.startsWith('data:image/')) { localBg = data.bgImage; loc.bgImage = localBg; }
    await Store.clear('local');
    await Store.set('local', loc);
    imgCache = {}; autoCache = {}; localBgUrl = null; shownSrc = null;
    reflow(); cur = 0; renderAll();
    await saveNow();
    toast('Back-up teruggezet.');
  } catch (e) { toast('Terugzetten mislukt: ' + e.message); }
}
async function refreshAutoIcons() {
  const keys = Object.keys(autoCache);
  autoCache = {};
  if (keys.length) await Store.remove('local', keys);
  renderPages();
  toast('Iconen worden opnieuw gezocht…');
}
async function resetAll() {
  if (!confirm('Alle apps en instellingen terugzetten naar standaard? Dit kun je niet ongedaan maken (tenzij je een back-up hebt).')) return;
  await Store.clear('sync'); await Store.clear('local');
  localIcons = {}; localBg = null; imgCache = {}; autoCache = {}; rotState = {}; shownSrc = null;
  settings = structuredClone(DEFAULTS);
  pages = defaultPages(); cur = 0; sessionPhoto = null;
  renderAll();
  await saveNow();
  toast('Teruggezet naar standaard.');
}

function renderAll() { applyVars(); renderBg(); renderSearch(); tick(); scheduleTick(); renderPages(); syncSettingsUI(); }

/* ---------- Gebeurtenissen ---------- */
function bindEvents() {
  $('#btn-edit').addEventListener('click', () => setEditing(!editing));
  $('#btn-settings').addEventListener('click', () => openSettings(!$('#settings').classList.contains('open')));
  $('#settings-close').addEventListener('click', () => openSettings(false));
  $('#eb-add').addEventListener('click', () => openDialog(null, cur));
  $('#eb-page').addEventListener('click', addPage);
  $('#eb-done').addEventListener('click', () => setEditing(false));
  Drag.bind();

  // Zoeken: lijkt het op een adres, dan ga je er direct heen
  $('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    if (sgSel >= 0 && sgList[sgSel]) return openApp(sgList[sgSel]);
    const q = $('#q').value.trim();
    if (!q) return;
    const looksLikeUrl = !/\s/.test(q) && /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(q);
    location.href = (looksLikeUrl && normUrl(q)) || ENGINES[settings.search.engine].url + encodeURIComponent(q);
  });
  const q = $('#q');
  q.addEventListener('input', () => { sgSel = -1; renderSuggest(); });
  q.addEventListener('keydown', (e) => {
    if ($('#suggest').hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sgSel = Math.min(sgList.length - 1, sgSel + 1); renderSuggest(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sgSel = Math.max(-1, sgSel - 1); renderSuggest(); }
    else if (e.key === 'Escape') $('#suggest').hidden = true;
  });
  q.addEventListener('blur', () => setTimeout(() => ($('#suggest').hidden = true), 120));
  q.addEventListener('focus', renderSuggest);

  // App-dialoog
  $('#app-form').addEventListener('submit', submitDialog);
  $('#f-cancel').addEventListener('click', () => $('#app-dialog').close());
  $('#f-delete').addEventListener('click', () => { if (dlg.app) deleteApp(dlg.app.id); $('#app-dialog').close(); });
  ['#f-name', '#f-emoji', '#f-bg', '#f-bg-auto'].forEach((s) => $(s).addEventListener('input', updatePreview));
  $('#f-url').addEventListener('change', updatePreview);
  $$('input[name="itype"]').forEach((r) => r.addEventListener('change', () => {
    updatePreview();
    if (r.value === 'image' && r.checked && !dlg.pendingImg && !localIcons[dlg.app?.id]) $('#f-img').click();
  }));
  $('#f-img-btn').addEventListener('click', () => $('#f-img').click());
  $('#f-img').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      dlg.pendingImg = await imageToDataURL(f, 256, 'image/png');
      dlg.pendingMeta = await analyseImage(dlg.pendingImg);
      $('input[name="itype"][value="image"]').checked = true;
      updatePreview();
    }
    catch { toast('Deze afbeelding kan ik niet lezen.'); }
  });
  $('#f-gallery-btn').addEventListener('click', openGallery);
  $('#gal-close').addEventListener('click', () => $('#icon-gallery').close());
  $('#gal-search').addEventListener('submit', (e) => { e.preventDefault(); renderGallery($('#gal-q').value); });
  let galTimer;
  $('#gal-q').addEventListener('input', () => { clearTimeout(galTimer); galTimer = setTimeout(() => renderGallery($('#gal-q').value), 250); });

  // Eigen achtergrond
  $('#bg-upload-btn').addEventListener('click', () => $('#bg-file').click());
  $('#bg-file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      toast('Afbeelding verwerken…');
      localBg = await imageToDataURL(f, 2560, 'image/jpeg', 0.88);
      if (localBgUrl) URL.revokeObjectURL(localBgUrl);
      localBgUrl = null; shownSrc = null;
      await Store.set('local', { bgImage: localBg });
      setSetting('bg.type', 'image');
      toast('Achtergrond ingesteld.');
    } catch { toast('Uploaden mislukt. Probeer een JPG of PNG.'); }
  });

  // Back-up en hulp
  $('#export-btn').addEventListener('click', exportData);
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importData(f); });
  $('#refresh-icons').addEventListener('click', refreshAutoIcons);
  $('#reset-btn').addEventListener('click', resetAll);
  $('#show-help').addEventListener('click', () => $('#help').showModal());
  $('#help-close').addEventListener('click', () => $('#help').close());

  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#ctx')) hideCtx(); });
  const pager = $('#pager');
  pager.addEventListener('pointermove', dockMove, { passive: true });
  pager.addEventListener('pointerleave', () => { $$('#pager .icon').forEach((ic) => ic.style.removeProperty('--dock')); dockRects = null; });
  let rzT;
  addEventListener('resize', () => { dockRects = null; clearTimeout(rzT); rzT = setTimeout(() => GlassClock.invalidate(), 150); }, { passive: true });

  // Bladeren met scrollwiel / trackpad
  let wheelLock = 0;
  addEventListener('wheel', (e) => {
    if (e.target.closest('#settings, dialog, .ctx, #suggest')) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 25 || Date.now() < wheelLock) return;
    wheelLock = Date.now() + 650;
    goTo(cur + (d > 0 ? 1 : -1));
  }, { passive: true });

  // Sneltoetsen
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest('input, select, textarea');
    if (e.key === 'Escape') {
      if ($$('dialog[open]').length) return;
      if ($('#settings').classList.contains('open')) openSettings(false); else if (editing) setEditing(false);
      hideCtx();
      return;
    }
    if (typing || $$('dialog[open]').length || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight') goTo(cur + 1);
    else if (e.key === 'ArrowLeft') goTo(cur - 1);
    else if (e.key === '/' && settings.search.show) { e.preventDefault(); $('#q').focus(); }
    else if (/^[1-9]$/.test(e.key)) { const a = pages[cur]?.[+e.key - 1]; if (a) openApp(a); }
    else if (k === 'e') setEditing(!editing);
    else if (k === 's' || e.key === ',') openSettings(!$('#settings').classList.contains('open'));
    else if (e.key === '?') $('#help').showModal();
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); scheduleTick(); });

  // Wijzigingen vanaf je andere apparaat
  if (IS_EXT) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== 'sync' || Date.now() - lastWrite < 1500) return;
      await loadSync();
      if (!editing && !$$('dialog[open]').length && !$('#settings').classList.contains('open')) renderAll();
    });
  }
}

/* ---------- Start ---------- */
(async function init() {
  Liquid.init(liquidTargets);
  await Promise.all([loadSync(), loadLocal()]);
  reflow();
  buildSettingsWidgets();
  bindSettings();
  bindEvents();
  renderAll();
  requestAnimationFrame(() => document.body.classList.add('ready'));
  const s = await Store.get('sync', ['pageCount', 'greet']);
  if (typeof s.pageCount !== 'number' || !s.greet) saveNow(); // eerste keer of net bijgewerkt
})();
