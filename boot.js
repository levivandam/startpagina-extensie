'use strict';
/* Draait vóór de pagina getekend wordt: zet meteen de achtergrond en
   kleuren van de vorige keer neer, zodat een nieuw tabblad niet eerst
   leeg of zwart flitst. (app.js werkt dit bij na elke wijziging.) */
try {
  const b = JSON.parse(localStorage.getItem('sp_boot') || 'null');
  if (b) {
    const s = document.documentElement.style;
    for (const k in b.vars) s.setProperty(k, b.vars[k]);
    if (b.photo) document.documentElement.classList.add('boot-photo');
  }
} catch { /* geen probleem: dan gewoon de standaardachtergrond */ }
