'use strict';

/* =====================================================================
   Liquid glass (naar Apple's ontwerpregels)
   - Lens: aan de randen buigt de achtergrond af, het midden blijft helder.
     Elke glaslaag tekent een precies uitgelijnde kopie van de achtergrond
     en buigt die met een SVG-verplaatsingskaart in de vorm van het element.
   - Licht: dunne heldere randen en een glans die met je muis meebeweegt.
   - Zuinig: doet niets zolang je geen Liquid glass gebruikt; kaarten
     worden per maat maar één keer berekend en daarna hergebruikt.
   ===================================================================== */

const Liquid = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const built = new Set();
  const attached = new Set();
  const opts = { depth: 45, frost: 1, dark: 0 };
  let bg = { layers: [], color: '#101214', blur: 0, natW: 0, natH: 0 };
  let targetsFn = () => [];
  let pointerBound = false;

  /* Kaart op schermresolutie (2× op retina): anders zie je trapjes aan ronde
     randen. P = extra marge rondom, zodat de rand beeld van net buiten het
     glas naar binnen kan buigen, zoals echt glas. */
  function lensMap(w, h, r, bezel, P, S) {
    const W = w + 2 * P, H = h + 2 * P;
    const c = document.createElement('canvas');
    c.width = Math.round(W * S); c.height = Math.round(H * S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(c.width, c.height);
    const cx = W / 2, cy = H / 2;
    r = Math.min(r, w / 2, h / 2);
    for (let yy = 0; yy < c.height; yy++) {
      for (let xx = 0; xx < c.width; xx++) {
        const px = (xx + 0.5) / S - cx, py = (yy + 0.5) / S - cy;
        const qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const out = Math.hypot(ox, oy);
        const depth = -(out + Math.min(Math.max(qx, qy), 0) - r); // > 0 = binnen de vorm
        let nx = 0, ny = 0;
        if (qx > 0 && qy > 0) { nx = ox / (out || 1); ny = oy / (out || 1); } else if (qx > qy) nx = 1; else ny = 1;
        nx *= Math.sign(px) || 1; ny *= Math.sign(py) || 1;
        let m = 0;
        // Plat glas zoals bij Apple: alleen een smalle rand buigt af,
        // het midden blijft vlak (geen vergrootglas-effect).
        if (depth > -1 && depth < bezel) m = Math.pow(1 - Math.max(0, depth) / bezel, 2.5);
        const k = (yy * c.width + xx) * 4;
        img.data[k] = 128 + nx * m * 127;
        img.data[k + 1] = 128 + ny * m * 127;
        img.data[k + 2] = 128;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    e.setAttribute('color-interpolation-filters', 'sRGB');
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function filterFor(w, h, r) {
    w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h)); r = Math.round(r);
    const depth = Math.round(opts.depth * Math.min(1, Math.min(w, h) / 70) * 0.6 + 3);
    const S = Math.min(2, Math.max(1, Math.round((devicePixelRatio || 1) * 2) / 2));
    const P = Math.ceil(depth / 2) + 2;
    const id = `lg-${w}x${h}-${r}-${depth}-${S}`;
    if (built.has(id)) return [id, P];
    built.add(id);
    const W = w + 2 * P, H = h + 2 * P;
    const f = svgEl('filter', { id, x: 0, y: 0, width: W, height: H, filterUnits: 'userSpaceOnUse' });
    f.append(svgEl('feImage', { href: lensMap(w, h, r, Math.max(4, Math.min(12, Math.min(w, h) * 0.14)), P, S), x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'none', result: 'map' }));
    f.append(svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: depth, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }));
    f.append(svgEl('feGaussianBlur', { in: 'd', stdDeviation: 0.35 }));
    document.getElementById('lg-defs').append(f);
    return [id, P];
  }

  function radiusOf(node, w, h) {
    const v = getComputedStyle(node).borderTopLeftRadius || '0';
    const n = parseFloat(v) || 0;
    return v.includes('%') ? (n / 100) * Math.min(w, h) : Math.min(n, Math.min(w, h) / 2);
  }

  function syncOne(node) {
    const wrap = node.firstElementChild;
    if (!wrap || !wrap.classList.contains('lg-refract')) return;
    const layer = wrap.firstElementChild; // de gebogen kopie van de achtergrond
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const rad = radiusOf(node, box.width, box.height);
    const [id, P] = filterFor(box.width, box.height, rad);
    const left = box.left - P, top = box.top - P;
    const VW = innerWidth + 80, VH = innerHeight + 80; // #bg loopt 40px buiten beeld
    const sizes = [], pos = [];
    for (const L of bg.layers) {
      if (L.kind === 'photo' && bg.natW) {
        const s = Math.max(VW / bg.natW, VH / bg.natH);
        const sw = bg.natW * s, sh = bg.natH * s;
        sizes.push(`${sw}px ${sh}px`);
        pos.push(`${(VW - sw) / 2 - 40 - left}px ${(VH - sh) / 2 - 40 - top}px`);
      } else {
        sizes.push(`${VW}px ${VH}px`);
        pos.push(`${-40 - left}px ${-40 - top}px`);
      }
    }
    const blur = (opts.frost || 0) + (bg.blur || 0);
    Object.assign(layer.style, {
      inset: `${-P}px`,
      backgroundImage: bg.layers.map((L) => L.css).join(', ') || 'none',
      backgroundSize: sizes.join(', '),
      backgroundPosition: pos.join(', '),
      backgroundColor: bg.color,
      filter: `url(#${id})${blur ? ` blur(${blur}px)` : ''} saturate(1.4) brightness(${(1.04 * (1 - opts.dark)).toFixed(3)})`,
    });
  }

  function sync() { for (const n of attached) { if (n.isConnected) syncOne(n); else attached.delete(n); } }

  /* Tijdens animaties (pagina wisselen) kort elk frame bijwerken. */
  let followUntil = 0, following = false;
  function follow(ms = 600) {
    if (!attached.size) return;
    followUntil = Math.max(followUntil, performance.now() + ms);
    if (following) return;
    following = true;
    const step = () => { sync(); if (performance.now() < followUntil) requestAnimationFrame(step); else following = false; };
    requestAnimationFrame(step);
  }

  function attach(node) {
    if (!node.firstElementChild?.classList.contains('lg-refract')) {
      // Buitenste laag knipt glad af in de vorm van het element (afgeronde
      // hoeken met overflow: die strijkt Chrome wél glad, clip-path niet).
      const l = document.createElement('div');
      l.className = 'lg-refract';
      l.append(Object.assign(document.createElement('div'), { className: 'lg-src' }));
      node.prepend(l);
    }
    node.classList.add('lg');
    attached.add(node);
  }
  function detach(node) {
    if (node.firstElementChild?.classList.contains('lg-refract')) node.firstElementChild.remove();
    node.classList.remove('lg');
    attached.delete(node);
  }

  function bindPointer() {
    if (pointerBound) return;
    pointerBound = true;
    let last = null, raf = 0, ev = null;
    document.addEventListener('pointermove', (e) => {
      ev = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const t = ev.target.closest?.('.lg');
        if (last && last !== t) { last.style.removeProperty('--mx'); last.style.removeProperty('--my'); }
        last = t;
        if (!t) return;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        t.style.setProperty('--my', (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  /* Zoekt opnieuw welke elementen glas moeten zijn (gebundeld per frame). */
  let queued = false;
  function scan() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const want = new Set(targetsFn());
      for (const n of [...attached]) if (!want.has(n)) detach(n);
      for (const n of want) attach(n);
      if (want.size) bindPointer();
      sync();
    });
  }

  function init(fn) {
    targetsFn = fn;
    addEventListener('resize', () => attached.size && sync(), { passive: true });
  }
  const setBackground = (b) => { bg = { ...bg, ...b }; if (attached.size) sync(); };
  const setOptions = (o) => { Object.assign(opts, o); if (attached.size) sync(); };

  return { init, scan, sync, follow, setBackground, setOptions };
})();
