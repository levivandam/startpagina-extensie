'use strict';

/* =====================================================================
   Begroetingen
   - Ingebouwd: wisselt per tabblad, afhankelijk van tijdstip, dag,
     seizoen en feestdagen.
   - Eigen: één per regel. {naam} = je naam, {dag} = de dag van vandaag.
     Zet "ochtend:", "middag:", "avond:" of "nacht:" ervoor om een regel
     alleen op dat moment te tonen.
   ===================================================================== */

const Greetings = (() => {
  const BUILTIN = {
    nacht: ['Nog wakker, {naam}?', 'Nachtbraker, {naam}', 'Het is laat, {naam}', 'Stille uurtjes, {naam}', 'Goedenacht, {naam}', 'De rest slaapt al, {naam}'],
    vroeg: ['Vroege vogel, {naam}', 'Goedemorgen, {naam}. Koffie al gehad?', 'Lekker vroeg, {naam}', 'De dag is nog van jou, {naam}'],
    ochtend: ['Goedemorgen, {naam}', 'Fijne ochtend, {naam}', 'Klaar voor vandaag, {naam}?', 'Morgen, {naam}! Waar beginnen we mee?', 'Een frisse start, {naam}'],
    lunch: ['Smakelijk, {naam}', 'Tijd voor lunch, {naam}?', 'Even pauze, {naam}?', 'Goedemiddag, {naam}'],
    middag: ['Goedemiddag, {naam}', 'Hoe gaat je middag, {naam}?', 'Nog even doorpakken, {naam}', 'Fijne middag, {naam}'],
    avond: ['Goedenavond, {naam}', 'Fijne avond, {naam}', 'Lekker bezig vandaag, {naam}?', 'Rustig aan vanavond, {naam}'],
    laat: ['Laat op de avond, {naam}', 'Nog één ding en dan slapen, {naam}?', 'Avondsessie, {naam}?'],
  };
  const DAYS = {
    1: ['Fijne maandag, {naam}', 'Nieuwe week, nieuwe kansen, {naam}'],
    3: ['Halverwege de week, {naam}', 'Woensdag, {naam}. Over de bult'],
    5: ['Bijna weekend, {naam}!', 'Fijne vrijdag, {naam}'],
    6: ['Fijne zaterdag, {naam}', 'Weekend, {naam}!'],
    0: ['Fijne zondag, {naam}', 'Rustige zondag, {naam}?'],
  };
  const SEASON = {
    winter: ['Warm aankleden, {naam}'], lente: ['Het wordt weer lichter, {naam}'],
    zomer: ['Genieten van de zomer, {naam}?'], herfst: ['Herfstige groet, {naam}. Thee erbij?'],
  };
  const SPECIAL = [ // [maand, dag, tekst]
    [1, 1, 'Gelukkig nieuwjaar, {naam}!'], [2, 14, 'Fijne Valentijnsdag, {naam}'], [4, 27, 'Fijne Koningsdag, {naam}! 🧡'],
    [5, 5, 'Fijne Bevrijdingsdag, {naam}'], [12, 5, 'Fijne pakjesavond, {naam}!'], [12, 24, 'Fijne kerstavond, {naam}'],
    [12, 25, 'Vrolijk kerstfeest, {naam}! 🎄'], [12, 26, 'Fijne tweede kerstdag, {naam}'], [12, 31, 'Fijne oudejaarsavond, {naam}! 🎆'],
  ];
  const TAGS = ['nacht', 'ochtend', 'middag', 'avond'];

  const builtinBucket = (h) => (h < 5 ? 'nacht' : h < 7 ? 'vroeg' : h < 12 ? 'ochtend' : h < 14 ? 'lunch' : h < 18 ? 'middag' : h < 23 ? 'avond' : 'laat');
  const tagOf = (h) => (h < 6 ? 'nacht' : h < 12 ? 'ochtend' : h < 18 ? 'middag' : 'avond');
  const season = (m) => (m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'lente' : m <= 8 ? 'zomer' : 'herfst');

  function fill(t, name, now) {
    const dag = now.toLocaleDateString('nl-NL', { weekday: 'long' });
    // Zonder naam: ", {naam}" netjes weglaten ("Goedemorgen, {naam}!" → "Goedemorgen!")
    let s = name ? t.replace(/\{naam\}/gi, name) : t.replace(/[,\s]*\{naam\}/gi, '');
    return s.replace(/\{dag\}/gi, dag).replace(/\s+([!?.])/g, '$1').trim();
  }

  /* Eigen regels die nu mogen verschijnen. */
  function ownFor(lines, now) {
    const tag = tagOf(now.getHours());
    const out = [];
    for (const raw of lines || []) {
      const line = raw.trim();
      if (!line) continue;
      const m = /^(nacht|ochtend|middag|avond)\s*:\s*(.+)$/i.exec(line);
      if (!m) out.push(line);
      else if (m[1].toLowerCase() === tag) out.push(m[2]);
    }
    return out;
  }

  function builtinFor(now) {
    const special = SPECIAL.find(([m, d]) => now.getMonth() + 1 === m && now.getDate() === d);
    if (special && Math.random() < 0.7) return [special[2]];
    const b = builtinBucket(now.getHours());
    const pool = [...BUILTIN[b], ...BUILTIN[b]]; // tijdstip weegt het zwaarst
    if (b !== 'nacht' && b !== 'laat') pool.push(...(DAYS[now.getDay()] || []));
    if (Math.random() < 0.3) pool.push(...SEASON[season(now.getMonth() + 1)]);
    return pool;
  }

  let chosen = null; // { key, text } — één begroeting per tabblad en dagdeel
  /* cfg = { mode: 'auto' | 'mix' | 'own', lines: [] } */
  function get(now, name, cfg = {}, force = false) {
    const key = [tagOf(now.getHours()), name, cfg.mode, (cfg.lines || []).join('\n')].join('|');
    if (!force && chosen && chosen.key === key) return chosen.text;
    const own = cfg.mode === 'auto' ? [] : ownFor(cfg.lines, now);
    let pool;
    if (cfg.mode === 'own' && own.length) pool = own;
    else if (cfg.mode === 'mix') pool = [...own, ...own, ...builtinFor(now)]; // eigen regels vaker
    else pool = builtinFor(now);
    let text;
    for (let i = 0; i < 6; i++) { // bij "andere" niet dezelfde nog eens kiezen
      text = fill(pool[Math.floor(Math.random() * pool.length)], name, now);
      if (!force || !chosen || text !== chosen.text) break;
    }
    chosen = { key, text };
    return text;
  }

  return { get, TAGS };
})();
