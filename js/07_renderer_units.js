// ═══════════════════════════════════════
// MODULO: RENDERER_UNITS
// ═══════════════════════════════════════
// ── NAVE ISO — sciabecco piratesco ──
function disegnaNav(sx, sy, colore, s){
  s = s || G.ISO_SCALE;
  ctx.save();
  ctx.translate(sx, sy);
  const sc = G.ISO_H * s * .055;  // unità di scala nave

  // Ombra a mare
  ctx.globalAlpha=.15; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(sc*4,sc*5,sc*14,sc*3.5,.12,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  // Scafo iso (vista 3/4)
  const scG=ctx.createLinearGradient(-sc*12,0,sc*12,sc*7);
  scG.addColorStop(0,colore||'#6a3e1a'); scG.addColorStop(1,'#3a1e08');
  ctx.fillStyle=scG;
  ctx.beginPath();
  ctx.moveTo(-sc*14,sc*2);
  ctx.quadraticCurveTo(-sc*5,sc*9,sc*5,sc*9);
  ctx.quadraticCurveTo(sc*16,sc*9,sc*17,sc*3);
  ctx.quadraticCurveTo(sc*12,-sc*1,0,-sc*2.5);
  ctx.quadraticCurveTo(-sc*9,-sc*2.5,-sc*14,sc*2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2a1008'; ctx.lineWidth=1.5*s; ctx.stroke();

  // Fascia dorata
  ctx.strokeStyle='rgba(200,160,60,.55)'; ctx.lineWidth=s;
  ctx.beginPath(); ctx.moveTo(-sc*13,sc*3); ctx.quadraticCurveTo(sc*2,sc*7.5,sc*15,sc*2); ctx.stroke();

  // Cannoni
  ctx.fillStyle='#3a3028';
  for(let i=0;i<3;i++) ctx.fillRect(-sc*9+i*sc*6.5,sc*3,sc*4,sc*2);

  // Coperta
  const dG=ctx.createLinearGradient(-sc*11,0,sc*11,0);
  dG.addColorStop(0,'#8a6030'); dG.addColorStop(1,'#6a4820');
  ctx.fillStyle=dG;
  ctx.beginPath(); ctx.ellipse(sc*1.5,sc*.5,sc*11.5,sc*5,0,0,Math.PI*2); ctx.fill();

  // Albero maestro
  ctx.strokeStyle='#7a5020'; ctx.lineWidth=sc*1.8;
  ctx.beginPath(); ctx.moveTo(sc*1.5,sc*.5); ctx.lineTo(sc*1.5,-sc*24); ctx.stroke();
  // Pennoni
  ctx.lineWidth=sc*1;
  ctx.beginPath(); ctx.moveTo(-sc*11,-sc*18); ctx.lineTo(sc*14,-sc*18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-sc*7,-sc*11); ctx.lineTo(sc*10,-sc*11); ctx.stroke();

  // Vela principale
  const sailG=ctx.createLinearGradient(-sc*9,-sc*24,sc*12,-sc*7);
  sailG.addColorStop(0,'rgba(248,235,195,.96)'); sailG.addColorStop(1,'rgba(210,190,140,.86)');
  ctx.fillStyle=sailG;
  ctx.beginPath();
  ctx.moveTo(sc*1.5,-sc*24); ctx.lineTo(sc*14,-sc*18);
  ctx.lineTo(sc*10,-sc*11); ctx.lineTo(-sc*7,-sc*11); ctx.lineTo(-sc*11,-sc*18);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=.8*s; ctx.stroke();

  // Vela di trinchetto
  ctx.fillStyle='rgba(240,225,180,.82)';
  ctx.beginPath();
  ctx.moveTo(-sc*10,-sc*9); ctx.lineTo(-sc*2,-sc*18); ctx.lineTo(sc*3,-sc*9);
  ctx.closePath(); ctx.fill();

  // Bandiera Jolly Roger (animata)
  const fw=Math.sin(frame*.08)*sc*2;
  ctx.fillStyle='#080808';
  ctx.beginPath();
  ctx.moveTo(sc*1.5,-sc*24); ctx.lineTo(sc*11,-sc*22+fw);
  ctx.lineTo(sc*10,-sc*18+fw*.5); ctx.lineTo(sc*1.5,-sc*21);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.75)'; ctx.font=`${sc*5}px serif`;
  ctx.textAlign='center'; ctx.fillText('☠',sc*7,-sc*20+fw*.6);

  ctx.restore();
}

// ── PIRATA ISO — stile Tropico 2, vista 3/4 ──
function disegnaPirataIso(cx, cy, selezionato, umore, ruolo, s){
  s = s || G.ISO_SCALE;
  const mc = coloreUmore(umore);
  const sc = G.ISO_H * s * .038;  // unità di scala pirata (~1px per unità = ~25px totali)

  // Cerchio selezione
  if (selezionato){
    ctx.save(); ctx.globalAlpha=.3; ctx.fillStyle='#f0c040';
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7,sc*2.5,.1,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(240,192,64,.85)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7,sc*2.5,.1,0,Math.PI*2); ctx.stroke();
  }

  // Ombra a terra
  ctx.save(); ctx.globalAlpha=.22; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3,sc*5,sc*1.5,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Colori per ruolo
  const bodyColors={
    'Bucaniere':     ['#9a2818','#5a1808'],
    'Navigatore':    ['#1a4a8a','#0e2a5a'],
    'Cannoniere':    ['#3a3028','#1a1818'],
    'Chirurgo':      ['#e0e0d8','#b0b0a8'],
    'Cuoco':         ['#d8c090','#b09870'],
    'Nostromo':      ['#2a6a28','#1a4a18'],
    'Spia':          ['#1e1e18','#101010'],
    'Quartier Mastro':['#8a7828','#5a5010'],
  };
  const bc = bodyColors[ruolo]||['#6a4a28','#3a2810'];

  // GAMBE (stivali)
  ctx.fillStyle='#2a1a08';
  // gamba sx (più indietro = più corta in iso)
  ctx.fillRect(cx-sc*1.5, cy-sc*0.5, sc*2.2, sc*3.8);
  // gamba dx
  ctx.fillRect(cx+sc*0.5, cy-sc*0.5, sc*2.2, sc*3.8);
  // risvolti
  ctx.fillStyle='#3a2510';
  ctx.fillRect(cx-sc*2, cy+sc*2.8, sc*2.5, sc*1.2);
  ctx.fillRect(cx+sc*0.2, cy+sc*2.8, sc*2.5, sc*1.2);

  // CORPO
  const bodyG=ctx.createLinearGradient(cx-sc*3.5,cy-sc*7,cx+sc*3.5,cy);
  bodyG.addColorStop(0,bc[0]); bodyG.addColorStop(1,bc[1]);
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.8,cy);
  ctx.bezierCurveTo(cx-sc*4,cy-sc*3,cx-sc*3.5,cy-sc*6,cx-sc*2.2,cy-sc*7.5);
  ctx.lineTo(cx+sc*2.2,cy-sc*7.5);
  ctx.bezierCurveTo(cx+sc*3.5,cy-sc*6,cx+sc*4,cy-sc*3,cx+sc*2.8,cy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=.6; ctx.stroke();

  // Cintura
  ctx.fillStyle='#5a3818';
  ctx.fillRect(cx-sc*3,cy-sc*2.2,sc*6.2,sc*1.6);
  ctx.fillStyle='#c4940c';
  ctx.fillRect(cx-sc*1,cy-sc*2.1,sc*2,sc*1.4);

  // BRACCIO SX (con pistola)
  ctx.fillStyle=bc[0];
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.8,cy-sc*7);
  ctx.bezierCurveTo(cx-sc*5.5,cy-sc*5,cx-sc*6.5,cy-sc*2.5,cx-sc*5.5,cy-sc*1);
  ctx.lineTo(cx-sc*3.5,cy-sc*1.5);
  ctx.bezierCurveTo(cx-sc*3.8,cy-sc*3.5,cx-sc*2.5,cy-sc*6,cx-sc*1.8,cy-sc*7);
  ctx.closePath(); ctx.fill();
  // Pistola
  ctx.fillStyle='#2a2020'; ctx.strokeStyle='#888'; ctx.lineWidth=.8;
  ctx.fillRect(cx-sc*7,cy-sc*1.5,sc*3.5,sc*1); ctx.strokeRect(cx-sc*7,cy-sc*1.5,sc*3.5,sc*1);

  // BRACCIO DX (con spada)
  ctx.fillStyle=bc[0];
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.8,cy-sc*7);
  ctx.bezierCurveTo(cx+sc*5.5,cy-sc*5,cx+sc*6.2,cy-sc*2,cx+sc*5.5,cy-sc*.5);
  ctx.lineTo(cx+sc*3.5,cy-sc*1);
  ctx.bezierCurveTo(cx+sc*3.5,cy-sc*3,cx+sc*2.2,cy-sc*6,cx+sc*1.8,cy-sc*7);
  ctx.closePath(); ctx.fill();
  // Spada
  ctx.strokeStyle='#c0c0c8'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(cx+sc*5.5,cy-sc*.5); ctx.lineTo(cx+sc*8.5,cy+sc*3.5); ctx.stroke();
  ctx.fillStyle='#c4940c';
  ctx.beginPath(); ctx.ellipse(cx+sc*5.5,cy-sc*.5,sc*1.5,sc*.6,-.3,0,Math.PI*2); ctx.fill();

  // TESTA + COLLO
  const skinCol='#c8a878';
  ctx.fillStyle=skinCol;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*9,sc*1.8,sc*1,0,0,Math.PI*2); ctx.fill(); // collo
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.5,sc*3.8,sc*4,0,0,Math.PI*2); ctx.fill(); // testa

  // Ombra viso
  const fG=ctx.createRadialGradient(cx-sc,cy-sc*12,0,cx,cy-sc*11.5,sc*4);
  fG.addColorStop(0,'rgba(0,0,0,0)'); fG.addColorStop(1,'rgba(80,40,10,.3)');
  ctx.fillStyle=fG;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.5,sc*3.8,sc*4,0,0,Math.PI*2); ctx.fill();

  // Occhi
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(cx-sc*1.2,cy-sc*11.8,sc*.75,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1.2,cy-sc*11.8,sc*.75,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.45)';
  ctx.beginPath(); ctx.arc(cx-sc*.8,cy-sc*12.1,sc*.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1.6,cy-sc*12.1,sc*.3,0,Math.PI*2); ctx.fill();

  // Bocca (espressione da umore)
  ctx.strokeStyle='rgba(100,40,20,.75)'; ctx.lineWidth=.8;
  ctx.beginPath();
  if(umore>65)      ctx.arc(cx,cy-sc*10.2,sc*1.4,.15,Math.PI-.15,false);  // sorriso
  else if(umore>35){ ctx.moveTo(cx-sc*1.4,cy-sc*10.2); ctx.lineTo(cx+sc*1.4,cy-sc*10.2); } // neutro
  else              ctx.arc(cx,cy-sc*9.3,sc*1.4,Math.PI+.15,-.15,false);  // triste
  ctx.stroke();

  // CAPPELLO TRICORNO
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*14.5,sc*7.2,sc*2.8,0,0,Math.PI*2); ctx.fill(); // tesa
  const hatG=ctx.createLinearGradient(cx-sc*4.5,cy-sc*20,cx+sc*3,cy-sc*14.5);
  hatG.addColorStop(0,'#2a2a2a'); hatG.addColorStop(1,'#0a0a0a');
  ctx.fillStyle=hatG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*4.5,cy-sc*14.5);
  ctx.bezierCurveTo(cx-sc*4,cy-sc*19,cx-sc*2,cy-sc*21.5,cx,cy-sc*21.5);
  ctx.bezierCurveTo(cx+sc*2,cy-sc*21.5,cx+sc*4,cy-sc*19,cx+sc*4.5,cy-sc*14.5);
  ctx.closePath(); ctx.fill();
  // Fascia dorata
  ctx.fillStyle='#c8a020';
  ctx.fillRect(cx-sc*4.5,cy-sc*16.2,sc*9.2,sc*1.4);
  // Spilla
  ctx.fillStyle='#f0c040'; ctx.beginPath(); ctx.arc(cx-sc*2.8,cy-sc*15.5,sc*1,0,Math.PI*2); ctx.fill();

  // Indicatore umore
  ctx.fillStyle='rgba(0,0,0,.55)';
  ctx.beginPath(); ctx.arc(cx+sc*5,cy-sc*19,sc*2.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=mc;
  ctx.beginPath(); ctx.arc(cx+sc*5,cy-sc*19,sc*2.2,0,Math.PI*2); ctx.fill();
}

// ── SCHIAVO ISO — più piccolo del pirata, aspetto dimesso ──
function disegnaSchiavoIso(cx, cy, felicita, s){
  s = s || G.ISO_SCALE;
  const sc = G.ISO_H * s * .030;  // più piccolo del pirata (.038)
  const felCol = felicita>60?'#4fc04f':felicita>30?'#f0c040':'#c0392b';

  // Ombra
  ctx.save(); ctx.globalAlpha=.18; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3,sc*4,sc*1.2,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Gambe (pantaloni grigi/logori)
  ctx.fillStyle='#5a5040';
  ctx.fillRect(cx-sc*1.5, cy-sc*0.5, sc*2, sc*4);
  ctx.fillRect(cx+sc*.5,  cy-sc*0.5, sc*2, sc*4);

  // Corpo (camicia strappata, colore neutro)
  const bodyG=ctx.createLinearGradient(cx-sc*3,cy-sc*7,cx+sc*3,cy);
  bodyG.addColorStop(0,'#8a7860'); bodyG.addColorStop(1,'#5a4838');
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.5,cy);
  ctx.bezierCurveTo(cx-sc*3.5,cy-sc*3,cx-sc*3,cy-sc*6,cx-sc*2,cy-sc*7);
  ctx.lineTo(cx+sc*2,cy-sc*7);
  ctx.bezierCurveTo(cx+sc*3,cy-sc*6,cx+sc*3.5,cy-sc*3,cx+sc*2.5,cy);
  ctx.closePath(); ctx.fill();

  // Braccia con attrezzo (piccone/vanga)
  ctx.fillStyle='#8a7860';
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.5,cy-sc*6.5);
  ctx.bezierCurveTo(cx+sc*5,cy-sc*4,cx+sc*5.5,cy-sc*1.5,cx+sc*4.5,cy);
  ctx.lineTo(cx+sc*3,cy-.5);
  ctx.bezierCurveTo(cx+sc*3.2,cy-sc*2,cx+sc*2,cy-sc*5.5,cx+sc*1.5,cy-sc*6.5);
  ctx.closePath(); ctx.fill();
  // Attrezzo (piccone)
  ctx.strokeStyle='#8a6030'; ctx.lineWidth=sc*1.5;
  ctx.beginPath(); ctx.moveTo(cx+sc*4.5,cy); ctx.lineTo(cx+sc*7,cy+sc*4); ctx.stroke();
  ctx.fillStyle='#aaa';
  ctx.beginPath(); ctx.ellipse(cx+sc*7,cy+sc*4,sc*1.8,sc*.7,-.4,0,Math.PI*2); ctx.fill();

  // Testa (pelle diversa)
  const skinTones=['#c8a060','#a06030','#7a4020','#d4a870'];
  ctx.fillStyle=skinTones[Math.floor(Math.abs(cx+cy))%skinTones.length];
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*9,sc*3.2,sc*3.5,0,0,Math.PI*2); ctx.fill();

  // Occhi stanchi
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(cx-sc*1,cy-sc*9.5,sc*.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1,cy-sc*9.5,sc*.6,0,Math.PI*2); ctx.fill();

  // Bocca (triste o neutra)
  ctx.strokeStyle='rgba(100,40,20,.75)'; ctx.lineWidth=.8;
  ctx.beginPath();
  if(felicita>60){ ctx.arc(cx,cy-sc*8,sc*1.2,.15,Math.PI-.15,false); }
  else { ctx.arc(cx,cy-sc*7.2,sc*1.2,Math.PI+.2,-.2,false); }
  ctx.stroke();

  // Bandana in testa (colore felicità)
  ctx.fillStyle=felCol;
  ctx.beginPath();
  ctx.ellipse(cx,cy-sc*11.5,sc*3.4,sc*1.2,0,Math.PI,0,true); ctx.fill();
  ctx.fillRect(cx-sc*3.4,cy-sc*11.5,sc*6.8,sc*1.5);

  // Indicatore felicità (pallino sopra la testa)
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.beginPath(); ctx.arc(cx,cy-sc*14,sc*2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=felCol;
  ctx.beginPath(); ctx.arc(cx,cy-sc*14,sc*1.5,0,Math.PI*2); ctx.fill();
}
