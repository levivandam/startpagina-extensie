'use strict';

/* =====================================================================
   Liquid glass-cijfers — dezelfde klok, maar de cijfers zijn van glas.
   Werkt met elke klokstijl: lettertype, dikte en grootte komen van de klok
   zelf. Per pixel wordt bepaald hoe dicht je bij de rand van een cijfer zit;
   daar buigt de achtergrond af (lens), met licht van linksboven en een
   donkerdere rand onderin. Alleen opnieuw berekend als de tijd, maat,
   plek of achtergrond verandert (zonder seconden: één keer per minuut).
   ===================================================================== */

const GlassClock = (() => {
  let canvas = null, key = '', photo = null, photoSrc = null, busy = false, again = false;

  function ensure() {
    if (canvas?.isConnected) return canvas;
    canvas = document.createElement('canvas');
    canvas.id = 'glass-clock';
    canvas.setAttribute('aria-hidden', 'true');
    $('#clock-wrap').append(canvas);
    return canvas;
  }
  function hide() { if (canvas) canvas.hidden = true; key = ''; }

  function loadPhoto(src) {
    if (src === photoSrc) return;
    photoSrc = src; photo = null;
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { if (photoSrc === src) { photo = img; invalidate(); } };
    img.src = src;
  }
  const hexes = (css) => css.match(/#[0-9a-f]{6}/gi) || ['#2a2c30', '#101214'];

  /* De achtergrond van de pagina, voor het stuk scherm onder de klok. */
  function paintBackground(g, rect, W, H, dpr) {
    const b = settings.bg, VW = innerWidth + 80, VH = innerHeight + 80;
    g.save();
    g.scale(dpr, dpr);
    g.translate(-rect.left, -rect.top);
    if (b.blur) g.filter = `blur(${b.blur}px)`;
    if (b.type === 'color') g.fillStyle = b.color;
    else {
      const cs = hexes((photo ? GRADIENTS.ink : GRADIENTS[b.gradient] || GRADIENTS.forest).css);
      const lg = g.createLinearGradient(0, -40, 0, VH - 40);
      cs.forEach((c, i) => lg.addColorStop(cs.length === 1 ? 0 : i / (cs.length - 1), c));
      g.fillStyle = lg;
    }
    g.fillRect(rect.left - 40, rect.top - 40, W + 80, H + 80);
    if (photo) {
      const s = Math.max(VW / photo.naturalWidth, VH / photo.naturalHeight);
      const sw = photo.naturalWidth * s, sh = photo.naturalHeight * s;
      g.drawImage(photo, (VW - sw) / 2 - 40, (VH - sh) / 2 - 40, sw, sh);
    }
    g.filter = 'none';
    g.fillStyle = `rgba(0,0,0,${b.dim})`;
    g.fillRect(rect.left - 40, rect.top - 40, W + 80, H + 80);
    g.restore();
  }

  async function render() {
    if (busy) { again = true; return; }
    busy = true;
    try { await draw(); } catch (e) { console.warn('Glazen klok:', e); }
    busy = false;
    if (again) { again = false; render(); }
  }

  async function draw() {
    const clock = $('#clock');
    if (clock.hidden || !clock.textContent) return hide();
    const c = ensure();
    c.hidden = false;
    loadPhoto(settings.bg.type === 'gallery' || settings.bg.type === 'image' ? shownSrc : null);

    const cs = getComputedStyle(clock);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    await document.fonts.load(font, clock.textContent).catch(() => {});
    const size = parseFloat(cs.fontSize);
    const pad = Math.round(size * 0.18);
    const W = clock.offsetWidth + pad * 2, H = clock.offsetHeight + pad * 2;
    Object.assign(c.style, { left: clock.offsetLeft - pad + 'px', top: clock.offsetTop - pad + 'px', width: W + 'px', height: H + 'px' });
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const b = settings.bg;
    const k = [clock.textContent, font, cs.letterSpacing, W, H, Math.round(rect.left), Math.round(rect.top), b.type, b.gradient, b.color, b.dim, b.blur, photo ? photoSrc : '-', settings.appearance.lgDepth, dpr].join('|');
    if (k === key) return;
    key = k;

    const PW = Math.round(W * dpr), PH = Math.round(H * dpr);
    const off = () => { const o = document.createElement('canvas'); o.width = PW; o.height = PH; return [o, o.getContext('2d', { willReadFrequently: true })]; };

    // 1. de vorm van de cijfers, precies zoals de klok ze tekent
    const [m, mctx] = off();
    mctx.scale(dpr, dpr);
    mctx.font = font;
    if ('letterSpacing' in mctx) mctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillStyle = '#fff';
    mctx.fillText(clock.textContent, W / 2, H / 2 + size * 0.04);

    // 2. vervaagde vorm → per pixel de richting naar de rand
    const [bl, bctx] = off();
    // smalle vervaging → alleen een dunne rand buigt af (plat glas)
    bctx.filter = `blur(${Math.max(1.2, size * 0.022 * dpr)}px)`;
    bctx.drawImage(m, 0, 0);

    // 3. de achtergrond eronder
    const [g, gctx] = off();
    paintBackground(gctx, rect, W, H, dpr);
    let G;
    try { G = gctx.getImageData(0, 0, PW, PH).data; }
    catch { photo = null; gctx.clearRect(0, 0, PW, PH); paintBackground(gctx, rect, W, H, dpr); G = gctx.getImageData(0, 0, PW, PH).data; }
    const M = mctx.getImageData(0, 0, PW, PH).data;
    const B = bctx.getImageData(0, 0, PW, PH).data;

    const ctx = c.getContext('2d');
    c.width = PW; c.height = PH;
    const out = ctx.createImageData(PW, PH), O = out.data;
    const depth = (3 + settings.appearance.lgDepth * 0.12) * dpr * Math.min(1.6, size / 90);
    const Lx = -0.45, Ly = -0.89; // licht van linksboven
    const row = PW * 4;
    for (let y = 1; y < PH - 1; y++) {
      for (let x = 1; x < PW - 1; x++) {
        const i = (y * PW + x) * 4;
        const a = M[i + 3];
        if (!a) continue;
        const gx = (B[i + 7] - B[i - 1]) / 510, gy = (B[i + 3 + row] - B[i + 3 - row]) / 510;
        const len = Math.hypot(gx, gy) || 1;
        const nx = -gx / len, ny = -gy / len;                       // naar buiten
        const edge = Math.min(1, Math.max(0, 1 - B[i + 3] / 255) * 2); // 0 midden → 1 rand
        const e2 = edge * edge * edge;                               // effect alleen vlak bij de rand
        const d = depth * Math.pow(edge, 2.2);
        const sx = Math.min(PW - 1, Math.max(0, Math.round(x + nx * d)));
        const sy = Math.min(PH - 1, Math.max(0, Math.round(y + ny * d)));
        const j = (sy * PW + sx) * 4;
        const dot = nx * Lx + ny * Ly;
        const spec = Math.pow(Math.max(0, dot), 2) * e2 * 200;
        const dark = 1 - Math.max(0, -dot) * e2 * 0.25;
        const tint = 22;                                            // vlak: overal even licht
        O[i] = Math.min(255, (G[j] * 1.06 + tint) * dark + spec);
        O[i + 1] = Math.min(255, (G[j + 1] * 1.06 + tint) * dark + spec);
        O[i + 2] = Math.min(255, (G[j + 2] * 1.06 + tint) * dark + spec);
        O[i + 3] = a;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  function invalidate() { key = ''; if (canvas && !canvas.hidden) render(); }
  return { render, hide, invalidate };
})();
