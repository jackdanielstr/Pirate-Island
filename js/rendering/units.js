// Isla del Diablo — rendering/units.js
// Estratto da 07_renderer_units.js nella modularizzazione v20.18.

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


function _pirateVisualProfile(ruolo){
  const r=String(ruolo||'').toLowerCase();
  if(r.includes('quartier')||r.includes('capitano')) return {
    type:'captain', label:'Capitano', coat:['#6b1710','#2a0d09'], pants:'#2a1c16', hat:'#090909', trim:'#d6a937', sash:'#d9a326', skin:'#c8945a', weapon:'sabre', stance:.9
  };
  if(r.includes('navigatore')||r.includes('nostromo')) return {
    type:'officer', label:'Ufficiale', coat:['#1f5a90','#0c274a'], pants:'#1d2636', hat:'#17202a', trim:'#d6b04c', sash:'#c0392b', skin:'#c8a878', weapon:'sabre', stance:.55
  };
  if(r.includes('bucaniere')||r.includes('cannoniere')) return {
    type:'buccaneer', label:'Bucaniere', coat:['#9b2d19','#4a1209'], pants:'#3b2518', hat:'#7a1d18', trim:'#e0b44c', sash:'#e0b44c', skin:'#b9824c', weapon:'pistol', stance:.25
  };
  if(r.includes('spia')) return {
    type:'rogue', label:'Canaglia', coat:['#24241f','#0c0c0a'], pants:'#171713', hat:'#111', trim:'#767676', sash:'#3d3d3d', skin:'#b88a58', weapon:'dagger', stance:.1
  };
  if(r.includes('chirurgo')||r.includes('cuoco')) return {
    type:'sailor', label:'Marinaio', coat:['#d0c0a0','#8a7650'], pants:'#5b4a34', hat:'#d8c080', trim:'#7a5020', sash:'#8a2d18', skin:'#d0a878', weapon:'none', stance:.0
  };
  return {type:'sailor', label:'Marinaio', coat:['#6a4a28','#3a2810'], pants:'#3a2a1a', hat:'#3b2313', trim:'#c8a020', sash:'#9a3018', skin:'#c8a878', weapon:'knife', stance:.0};
}
function _drawPirateHat(cx,cy,sc,profile,phase){
  ctx.save();
  const flap=Math.sin(phase)*sc*.22;
  if(profile.type==='buccaneer' || profile.type==='rogue'){
    // Bandana bucaniere: larga e bassa, più leggibile rispetto al vecchio cappello.
    ctx.fillStyle=profile.hat;
    ctx.beginPath();ctx.ellipse(cx,cy-sc*13.75+flap,sc*4.6,sc*1.35,0,Math.PI,0,true);ctx.fill();
    ctx.fillRect(cx-sc*4.2,cy-sc*13.75+flap,sc*8.4,sc*1.55);
    ctx.fillStyle=profile.trim;
    ctx.beginPath();ctx.moveTo(cx+sc*2.8,cy-sc*13.6);ctx.lineTo(cx+sc*6.1,cy-sc*12.1+flap*.4);ctx.lineTo(cx+sc*3.1,cy-sc*11.65);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=Math.max(.5, sc*.22);
    ctx.beginPath(); ctx.moveTo(cx-sc*3.8,cy-sc*13.25); ctx.lineTo(cx+sc*3.8,cy-sc*13.25); ctx.stroke();
  }else if(profile.type==='sailor'){
    ctx.fillStyle=profile.hat;
    ctx.beginPath();ctx.ellipse(cx,cy-sc*14.0+flap,sc*4.35,sc*1.45,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(cx-sc*3.25,cy-sc*14.25+flap,sc*6.5,sc*.48);
    ctx.fillStyle=profile.trim; ctx.fillRect(cx-sc*2.2,cy-sc*13.55+flap,sc*4.4,sc*.55);
  }else{
    // Tricorno / cappello da ufficiale.
    ctx.fillStyle=profile.hat;
    const brimW = profile.type==='captain'?8.4:6.6;
    ctx.beginPath(); ctx.ellipse(cx,cy-sc*14.45+flap,sc*brimW,sc*2.45,0,0,Math.PI*2); ctx.fill();
    const hatG=ctx.createLinearGradient(cx-sc*4.5,cy-sc*20,cx+sc*3,cy-sc*14.5);
    hatG.addColorStop(0,profile.type==='captain'?'#3a2c20':'#2a2a2a'); hatG.addColorStop(1,'#0a0a0a');
    ctx.fillStyle=hatG;
    ctx.beginPath();
    ctx.moveTo(cx-sc*4.8,cy-sc*14.4+flap);
    ctx.bezierCurveTo(cx-sc*4.2,cy-sc*19,cx-sc*2,cy-sc*21.5,cx,cy-sc*(profile.type==='captain'?22.9:21.4));
    ctx.bezierCurveTo(cx+sc*2,cy-sc*21.5,cx+sc*4.2,cy-sc*19,cx+sc*4.8,cy-sc*14.4+flap);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=profile.trim; ctx.fillRect(cx-sc*4.7,cy-sc*16.2+flap*.25,sc*9.4,sc*1.05);
    ctx.fillStyle='#f0c040'; ctx.beginPath(); ctx.arc(cx-sc*2.8,cy-sc*15.55,sc*.78,0,Math.PI*2); ctx.fill();
    if(profile.type==='captain'){
      ctx.fillStyle='rgba(245,230,170,.9)';
      ctx.beginPath(); ctx.ellipse(cx+sc*5.7,cy-sc*17.2+flap,sc*.8,sc*3.2,.45,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}
function _drawPirateCoatTail(cx,cy,sc,profile,phase){
  if(profile.type!=='captain' && profile.type!=='officer') return;
  ctx.save();
  const sway=Math.sin(phase*.85)*sc*.35;
  const g=ctx.createLinearGradient(cx-sc*3,cy-sc*2,cx+sc*3,cy+sc*5);
  g.addColorStop(0,profile.coat[0]); g.addColorStop(1,profile.coat[1]);
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.7,cy-sc*1.5);
  ctx.lineTo(cx-sc*3.2+sway,cy+sc*(profile.type==='captain'?5.0:3.6));
  ctx.lineTo(cx-sc*.35,cy+sc*2.4);
  ctx.lineTo(cx+sc*.35,cy+sc*2.4);
  ctx.lineTo(cx+sc*3.2+sway*.4,cy+sc*(profile.type==='captain'?5.0:3.6));
  ctx.lineTo(cx+sc*2.7,cy-sc*1.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=Math.max(.5,sc*.22); ctx.stroke();
  ctx.restore();
}
function _drawPirateWeapon(cx,cy,sc,profile,side,phase){
  ctx.save();
  if(profile.weapon==='sabre'){
    ctx.strokeStyle='#d6d8dc'; ctx.lineWidth=Math.max(1,sc*.5);
    ctx.beginPath(); ctx.moveTo(cx+sc*5.3,cy-sc*.5); ctx.quadraticCurveTo(cx+sc*7.2,cy+sc*1.0,cx+sc*8.8,cy+sc*3.8); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=Math.max(.6,sc*.18);
    ctx.beginPath(); ctx.moveTo(cx+sc*5.7,cy-sc*.35); ctx.lineTo(cx+sc*8.1,cy+sc*3.0); ctx.stroke();
    ctx.fillStyle='#c4940c'; ctx.beginPath(); ctx.ellipse(cx+sc*5.35,cy-sc*.55,sc*1.5,sc*.58,-.3,0,Math.PI*2); ctx.fill();
  }else if(profile.weapon==='pistol'){
    ctx.fillStyle='#2a2020'; ctx.strokeStyle='#9b8a6a'; ctx.lineWidth=Math.max(.7,sc*.22);
    ctx.save(); ctx.translate(cx-sc*5.8,cy-sc*1.3); ctx.rotate(-.08);
    ctx.fillRect(-sc*1.7,-sc*.45,sc*4.1,sc*.9); ctx.strokeRect(-sc*1.7,-sc*.45,sc*4.1,sc*.9);
    ctx.fillStyle='#7a4a20'; ctx.fillRect(sc*.9,sc*.35,sc*1.2,sc*1.1);
    ctx.restore();
  }else if(profile.weapon==='dagger' || profile.weapon==='knife'){
    ctx.strokeStyle='#c8c8c8'; ctx.lineWidth=Math.max(.8,sc*.35);
    ctx.beginPath(); ctx.moveTo(cx+sc*4.8,cy-sc*1.1); ctx.lineTo(cx+sc*6.2,cy+sc*.8); ctx.stroke();
    ctx.fillStyle='#8a5a22'; ctx.fillRect(cx+sc*4.25,cy-sc*1.5,sc*1.2,sc*.7);
  }
  ctx.restore();
}
// ── PIRATA ISO — stile Tropico 2, vista 3/4 ──
function disegnaPirataIso(cx, cy, selezionato, umore, ruolo, s){
  s = s || G.ISO_SCALE;
  const mc = coloreUmore(umore);
  const sc = G.ISO_H * s * .027; // leggermente più piccolo: pirati presenti ma non dominanti sugli edifici
  const profile = _pirateVisualProfile(ruolo);
  const vhash = _hashUnitVariant((ruolo || 'pirata') + ':' + Math.round(cx) + ':' + Math.round(cy));
  const t = (typeof frame!=='undefined'?frame:0);
  const phase = t*0.085 + vhash*.13;
  const walk = Math.sin(t*0.16 + vhash*.21);
  const bob = Math.abs(walk) * sc*.45;
  const idle = Math.sin(phase) * sc*.18;
  const lean = (profile.stance || 0) * sc*.28;
  cy += idle;

  // Cerchio selezione più pulito, proporzionato alla scala nuova.
  if (selezionato){
    ctx.save(); ctx.globalAlpha=.28; ctx.fillStyle='#f0c040';
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7.2,sc*2.55,.1,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(240,192,64,.9)'; ctx.lineWidth=Math.max(1,1.2*s);
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7.2,sc*2.55,.1,0,Math.PI*2); ctx.stroke();
  }

  // Ombra a terra, più morbida e stretta.
  ctx.save(); ctx.globalAlpha=.20; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3.2,sc*5.3,sc*1.45,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  const bc = profile.coat;
  const pants = profile.pants || '#2a1a08';
  const skin = profile.skin || '#c8a878';
  const legSwing = walk * sc*.9;

  // Coda giacca dietro al corpo per capitano/ufficiale.
  _drawPirateCoatTail(cx,cy,sc,profile,phase);

  // GAMBE animate: passo leggero, non modifica hitbox né pathfinding.
  ctx.fillStyle=pants;
  ctx.save(); ctx.translate(lean*.15,bob*.15);
  ctx.fillRect(cx-sc*1.65, cy-sc*0.6+legSwing*.28, sc*1.9, sc*3.9);
  ctx.fillRect(cx+sc*0.45, cy-sc*0.6-legSwing*.28, sc*1.9, sc*3.9);
  ctx.fillStyle='#241406';
  ctx.fillRect(cx-sc*2.0, cy+sc*2.8+legSwing*.28, sc*2.4, sc*1.05);
  ctx.fillRect(cx+sc*0.15, cy+sc*2.8-legSwing*.28, sc*2.4, sc*1.05);
  ctx.restore();

  // CORPO / giacca per ruolo.
  const bodyG=ctx.createLinearGradient(cx-sc*3.8,cy-sc*7.4,cx+sc*3.6,cy+sc*.8);
  bodyG.addColorStop(0,bc[0]); bodyG.addColorStop(1,bc[1]);
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*3.0+lean*.1,cy);
  ctx.bezierCurveTo(cx-sc*4.05,cy-sc*3.2,cx-sc*3.65,cy-sc*6.2,cx-sc*2.25+lean*.08,cy-sc*7.7);
  ctx.lineTo(cx+sc*2.25+lean*.08,cy-sc*7.7);
  ctx.bezierCurveTo(cx+sc*3.65,cy-sc*6.2,cx+sc*4.05,cy-sc*3.2,cx+sc*3.0+lean*.1,cy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.20)'; ctx.lineWidth=Math.max(.55,sc*.2); ctx.stroke();

  // Risvolti e bottoni: danno silhouette più piratesca anche da lontano.
  ctx.strokeStyle=profile.trim || '#c8a020'; ctx.lineWidth=Math.max(.55,sc*.22);
  ctx.beginPath();
  ctx.moveTo(cx-sc*1.9,cy-sc*7.0); ctx.lineTo(cx-sc*.35,cy-sc*2.3);
  ctx.moveTo(cx+sc*1.9,cy-sc*7.0); ctx.lineTo(cx+sc*.35,cy-sc*2.3);
  ctx.stroke();
  ctx.fillStyle='rgba(230,190,90,.75)';
  for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(cx+sc*.55, cy-sc*(5.7-i*1.35), sc*.33,0,Math.PI*2); ctx.fill(); }

  // Cintura + fibbia.
  ctx.fillStyle='#4d2e14';
  ctx.fillRect(cx-sc*3.1,cy-sc*2.25,sc*6.4,sc*1.45);
  ctx.fillStyle='#c4940c';
  ctx.fillRect(cx-sc*.9,cy-sc*2.12,sc*1.8,sc*1.18);

  // Fascia diagonale diversa per ruolo.
  ctx.fillStyle=profile.sash || '#9a3018';
  ctx.save();ctx.translate(cx+lean*.12,cy-sc*4.0);ctx.rotate(-.20);ctx.fillRect(-sc*.62,-sc*3.5,sc*1.25,sc*7.3);ctx.restore();

  // BRACCIA: posa diversa tra ufficiali/capitani e bucaniere.
  ctx.fillStyle=bc[0];
  const armBob = Math.sin(phase*.9)*sc*.2;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.7,cy-sc*7.1);
  ctx.bezierCurveTo(cx-sc*5.4,cy-sc*5.3+armBob,cx-sc*6.2,cy-sc*2.5,cx-sc*5.2,cy-sc*1.0);
  ctx.lineTo(cx-sc*3.45,cy-sc*1.45);
  ctx.bezierCurveTo(cx-sc*3.7,cy-sc*3.5,cx-sc*2.45,cy-sc*6.1,cx-sc*1.8,cy-sc*7.05);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.7,cy-sc*7.1);
  ctx.bezierCurveTo(cx+sc*5.4,cy-sc*5.25-armBob,cx+sc*6.1,cy-sc*2.2,cx+sc*5.25,cy-sc*.55);
  ctx.lineTo(cx+sc*3.45,cy-sc*1.0);
  ctx.bezierCurveTo(cx+sc*3.45,cy-sc*3.05,cx+sc*2.2,cy-sc*6.1,cx+sc*1.8,cy-sc*7.05);
  ctx.closePath(); ctx.fill();

  _drawPirateWeapon(cx,cy,sc,profile,1,phase);

  // TESTA + COLLO.
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*9.0,sc*1.75,sc*.95,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.45,sc*3.55,sc*3.8,0,0,Math.PI*2); ctx.fill();

  // Ombra viso.
  const fG=ctx.createRadialGradient(cx-sc,cy-sc*12,0,cx,cy-sc*11.45,sc*4);
  fG.addColorStop(0,'rgba(0,0,0,0)'); fG.addColorStop(1,'rgba(80,40,10,.30)');
  ctx.fillStyle=fG;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.45,sc*3.55,sc*3.8,0,0,Math.PI*2); ctx.fill();

  // Barba/baffi per capitano e bucaniere.
  if(profile.type==='captain' || profile.type==='buccaneer'){
    ctx.fillStyle=profile.type==='captain'?'#2a1608':'#4b2412';
    ctx.beginPath(); ctx.ellipse(cx,cy-sc*10.15,sc*2.2,sc*.95,0,0,Math.PI); ctx.fill();
    ctx.fillRect(cx-sc*.55,cy-sc*10.35,sc*1.1,sc*1.55);
  }

  // Occhi / benda per canaglia.
  ctx.fillStyle='#1a0a00';
  if(profile.type==='rogue'){
    ctx.strokeStyle='#111'; ctx.lineWidth=Math.max(.6,sc*.22);
    ctx.beginPath(); ctx.moveTo(cx-sc*3.0,cy-sc*12.3); ctx.lineTo(cx+sc*2.6,cy-sc*11.2); ctx.stroke();
    ctx.fillStyle='#050505'; ctx.beginPath(); ctx.ellipse(cx-sc*1.2,cy-sc*11.75,sc*.95,sc*.58,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a0a00'; ctx.beginPath(); ctx.arc(cx+sc*1.25,cy-sc*11.75,sc*.65,0,Math.PI*2); ctx.fill();
  }else{
    ctx.beginPath(); ctx.arc(cx-sc*1.15,cy-sc*11.75,sc*.65,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+sc*1.15,cy-sc*11.75,sc*.65,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.arc(cx-sc*.85,cy-sc*12.0,sc*.25,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+sc*1.45,cy-sc*12.0,sc*.25,0,Math.PI*2); ctx.fill();
  }

  // Bocca da umore.
  ctx.strokeStyle='rgba(90,35,18,.78)'; ctx.lineWidth=Math.max(.6,sc*.22);
  ctx.beginPath();
  if(umore>65)      ctx.arc(cx,cy-sc*10.1,sc*1.25,.15,Math.PI-.15,false);
  else if(umore>35){ ctx.moveTo(cx-sc*1.2,cy-sc*10.05); ctx.lineTo(cx+sc*1.2,cy-sc*10.05); }
  else              ctx.arc(cx,cy-sc*9.2,sc*1.25,Math.PI+.15,-.15,false);
  ctx.stroke();

  _drawPirateHat(cx,cy,sc,profile,phase);

  // Piccoli accessori extra: orecchino / piuma già nel cappello capitano / toppa.
  if(profile.type==='buccaneer' || profile.type==='captain'){
    ctx.strokeStyle='#d6a937'; ctx.lineWidth=Math.max(.55,sc*.18);
    ctx.beginPath(); ctx.arc(cx+sc*3.2,cy-sc*10.7,sc*.55,.2,Math.PI*1.4); ctx.stroke();
  }

  // Indicatore umore ancora più discreto, per non far sembrare i pirati enormi.
  ctx.fillStyle='rgba(0,0,0,.48)';
  ctx.beginPath(); ctx.arc(cx+sc*4.8,cy-sc*18.6,sc*2.15,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=mc;
  ctx.beginPath(); ctx.arc(cx+sc*4.8,cy-sc*18.6,sc*1.55,0,Math.PI*2); ctx.fill();
}

// ── Helpers personaggi — Fase 5B: silhouette, carichi, animazione leggera ──
function _hashUnitVariant(v){
  const str = String(v ?? '0');
  let h = 0;
  for(let i=0;i<str.length;i++) h = ((h<<5)-h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function _slaveProfile(schiavo){
  const tipo = schiavo?.edificioTipo || '';
  if(tipo==='fattoria')    return { role:'contadino', shirt:['#8a7448','#5f4d2f'], pants:'#594832', tool:'zappa', load:'sacco' };
  if(tipo==='segheria')    return { role:'boscaiolo', shirt:['#7f6a50','#554434'], pants:'#4d3b28', tool:'accetta', load:'legna' };
  if(tipo==='miniera')     return { role:'minatore', shirt:['#6f6a5d','#48443c'], pants:'#3f3b34', tool:'piccone', load:'sacco_oro' };
  if(tipo==='distilleria') return { role:'bottaio', shirt:['#7a5f3a','#4d3922'], pants:'#504232', tool:'mestolo', load:'barile' };
  if(tipo==='cantiere')    return { role:'carpentiere', shirt:['#8b6a3d','#5c4224'], pants:'#57422a', tool:'martello', load:'asse' };
  return { role:'facchino', shirt:['#8a7860','#5a4838'], pants:'#5a5040', tool:'cassa', load:'cassa' };
}
function _drawSlaveLoad(cx, cy, sc, schiavo, bob){
  const prof = _slaveProfile(schiavo);
  ctx.save();
  ctx.translate(cx + sc*4.6, cy - sc*5.2 + bob*.35);
  ctx.rotate(-0.18);
  ctx.lineWidth = Math.max(.6, sc*.35);
  if(prof.load==='barile'){
    ctx.fillStyle='#7a4e22'; ctx.beginPath(); ctx.ellipse(0,0,sc*2.2,sc*3.0,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#3a2010'; ctx.stroke();
    ctx.strokeStyle='rgba(210,170,80,.75)';
    ctx.beginPath(); ctx.moveTo(-sc*2, -sc*1.1); ctx.lineTo(sc*2, -sc*1.1); ctx.moveTo(-sc*2, sc*1.1); ctx.lineTo(sc*2, sc*1.1); ctx.stroke();
  }else if(prof.load==='legna' || prof.load==='asse'){
    ctx.strokeStyle='#6b431f'; ctx.lineWidth=Math.max(1, sc*.65);
    for(let i=-1;i<=1;i++){
      ctx.beginPath(); ctx.moveTo(-sc*2.4, sc*i*.7); ctx.lineTo(sc*2.7, sc*i*.7-sc*.25); ctx.stroke();
    }
    ctx.strokeStyle='rgba(35,20,8,.45)'; ctx.lineWidth=Math.max(.7, sc*.25);
    ctx.beginPath(); ctx.moveTo(-sc*2.2,-sc*1); ctx.lineTo(-sc*1.6,sc*1.2); ctx.moveTo(sc*1.5,-sc*1.2); ctx.lineTo(sc*2.2,sc*1); ctx.stroke();
  }else if(prof.load==='sacco' || prof.load==='sacco_oro'){
    const g=ctx.createLinearGradient(-sc*2,-sc*2,sc*2,sc*2);
    g.addColorStop(0, prof.load==='sacco_oro'?'#b59752':'#b79a68');
    g.addColorStop(1, prof.load==='sacco_oro'?'#74551f':'#7b633f');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(0,0,sc*2.3,sc*3.0,.15,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(55,35,15,.7)'; ctx.stroke();
    ctx.fillStyle='rgba(60,35,12,.5)'; ctx.fillRect(-sc*.8,-sc*3.1,sc*1.6,sc*.8);
  }else{
    const g=ctx.createLinearGradient(-sc*2.5,-sc*2.2,sc*2.5,sc*2.2);
    g.addColorStop(0,'#9b6934'); g.addColorStop(1,'#5c3418');
    ctx.fillStyle=g; ctx.fillRect(-sc*2.5,-sc*2.0,sc*5.0,sc*4.0);
    ctx.strokeStyle='#3a1c0c'; ctx.strokeRect(-sc*2.5,-sc*2.0,sc*5.0,sc*4.0);
    ctx.strokeStyle='rgba(230,180,90,.5)';
    ctx.beginPath(); ctx.moveTo(-sc*2.3,0); ctx.lineTo(sc*2.3,0); ctx.moveTo(0,-sc*1.8); ctx.lineTo(0,sc*1.8); ctx.stroke();
  }
  ctx.restore();
}
function _drawSlaveTool(cx, cy, sc, schiavo, swing){
  const prof=_slaveProfile(schiavo);
  ctx.save();
  ctx.translate(cx-sc*4.5, cy-sc*2.8);
  ctx.rotate(.35 + swing*.05);
  ctx.strokeStyle='#6a431f'; ctx.lineWidth=Math.max(1,sc*.55);
  ctx.beginPath(); ctx.moveTo(0,-sc*3.5); ctx.lineTo(0,sc*3.0); ctx.stroke();
  if(prof.tool==='piccone'){
    ctx.strokeStyle='#8b8f8f'; ctx.lineWidth=Math.max(1,sc*.45);
    ctx.beginPath(); ctx.moveTo(-sc*2.5,-sc*3.3); ctx.quadraticCurveTo(0,-sc*4.2,sc*2.8,-sc*3.2); ctx.stroke();
  }else if(prof.tool==='zappa'){
    ctx.strokeStyle='#7f7f73'; ctx.lineWidth=Math.max(1,sc*.45);
    ctx.beginPath(); ctx.moveTo(0,-sc*3.3); ctx.lineTo(sc*2.1,-sc*2.4); ctx.stroke();
  }else if(prof.tool==='accetta'){
    ctx.fillStyle='#8e9294'; ctx.beginPath(); ctx.moveTo(-sc*.2,-sc*3.5); ctx.lineTo(sc*2.0,-sc*2.4); ctx.lineTo(sc*.4,-sc*1.5); ctx.closePath(); ctx.fill();
  }else if(prof.tool==='martello'){
    ctx.fillStyle='#79746a'; ctx.fillRect(-sc*1.5,-sc*3.9,sc*3,sc*.9);
  }
  ctx.restore();
}

// ── SCHIAVO ISO — Fase 5B: più piccolo, con ruolo, carico e camminata leggera ──
function disegnaSchiavoIso(cx, cy, felicita, s, schiavo, selected){
  s = s || G.ISO_SCALE;
  const sc = G.ISO_H * s * .022;  // scala ridotta: più minuto del pirata e più coerente con edifici Tropico 2
  const felCol = felicita>60?'#4fc04f':felicita>30?'#f0c040':'#c0392b';
  const prof = _slaveProfile(schiavo);
  const h = _hashUnitVariant(schiavo?.id ?? (cx+','+cy));
  const walk = Math.sin((typeof frame!=='undefined'?frame:0)*0.16 + h*.37);
  const bob = Math.abs(walk) * sc*.9;
  const sway = walk * sc*.55;
  const skinTones=['#c8a060','#a06030','#7a4020','#d4a870'];
  const skin=skinTones[h%skinTones.length];

  // Ombra / selezione
  ctx.save();
  if(selected){
    ctx.globalAlpha=.78; ctx.strokeStyle='rgba(255,220,90,.95)'; ctx.lineWidth=Math.max(1.3,sc*.45);
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3.2,sc*6.2,sc*2.0,.12,0,Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha=.17; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3.2,sc*4.4,sc*1.25,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Oggetto trasportato dietro/al fianco: rende chiaro il lavoro senza cambiare gameplay.
  _drawSlaveLoad(cx, cy, sc, schiavo, bob);

  // Gambe animate
  ctx.fillStyle=prof.pants;
  ctx.save();
  ctx.translate(0,bob*.18);
  ctx.fillRect(cx-sc*1.55, cy-sc*0.5+sway*.35, sc*1.7, sc*3.8);
  ctx.fillRect(cx+sc*.45,  cy-sc*0.5-sway*.35, sc*1.7, sc*3.8);
  ctx.fillStyle='#2f251c';
  ctx.fillRect(cx-sc*1.8, cy+sc*2.8+sway*.35, sc*2.0, sc*.75);
  ctx.fillRect(cx+sc*.25, cy+sc*2.8-sway*.35, sc*2.0, sc*.75);
  ctx.restore();

  // Corpo (camicia logora, varia per mestiere)
  const bodyG=ctx.createLinearGradient(cx-sc*3,cy-sc*7-bob,cx+sc*3,cy);
  bodyG.addColorStop(0,prof.shirt[0]); bodyG.addColorStop(1,prof.shirt[1]);
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.35,cy-bob*.45);
  ctx.bezierCurveTo(cx-sc*3.25,cy-sc*3-bob,cx-sc*2.8,cy-sc*6-bob,cx-sc*1.9,cy-sc*7.2-bob);
  ctx.lineTo(cx+sc*1.9,cy-sc*7.2-bob);
  ctx.bezierCurveTo(cx+sc*2.8,cy-sc*6-bob,cx+sc*3.25,cy-sc*3-bob,cx+sc*2.35,cy-bob*.45);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.16)'; ctx.lineWidth=Math.max(.5,sc*.2); ctx.stroke();

  // Strappi/cintura
  ctx.strokeStyle='rgba(240,220,170,.35)'; ctx.lineWidth=Math.max(.5,sc*.25);
  ctx.beginPath(); ctx.moveTo(cx-sc*1.7,cy-sc*5.5-bob); ctx.lineTo(cx-sc*.2,cy-sc*4.8-bob); ctx.moveTo(cx+sc*.6,cy-sc*3.8-bob); ctx.lineTo(cx+sc*1.8,cy-sc*4.4-bob); ctx.stroke();
  ctx.fillStyle='#4a2e18'; ctx.fillRect(cx-sc*2.2,cy-sc*2.1-bob*.4,sc*4.5,sc*.75);

  // Braccia animate: una regge il carico, una porta l'attrezzo
  ctx.fillStyle=prof.shirt[0];
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.0,cy-sc*6.6-bob); ctx.quadraticCurveTo(cx-sc*4.4,cy-sc*4.7-bob+sway*.25,cx-sc*4.0,cy-sc*1.6-bob*.2); ctx.lineTo(cx-sc*2.5,cy-sc*1.7); ctx.quadraticCurveTo(cx-sc*2.6,cy-sc*4.1-bob,cx-sc*1.3,cy-sc*6.4-bob); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.0,cy-sc*6.6-bob); ctx.quadraticCurveTo(cx+sc*4.4,cy-sc*5.0-bob-sway*.2,cx+sc*4.7,cy-sc*3.0-bob*.2); ctx.lineTo(cx+sc*3.2,cy-sc*2.6); ctx.quadraticCurveTo(cx+sc*2.9,cy-sc*4.6-bob,cx+sc*1.3,cy-sc*6.4-bob); ctx.fill();
  _drawSlaveTool(cx, cy, sc, schiavo, walk);

  // Testa + collo
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*8.1-bob,sc*1.25,sc*.75,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*10.2-bob,sc*2.55,sc*2.8,0,0,Math.PI*2); ctx.fill();

  // Ombra viso
  const fG=ctx.createRadialGradient(cx-sc*.8,cy-sc*10.8-bob,0,cx,cy-sc*10.2-bob,sc*3.0);
  fG.addColorStop(0,'rgba(0,0,0,0)'); fG.addColorStop(1,'rgba(70,35,12,.26)');
  ctx.fillStyle=fG; ctx.beginPath(); ctx.ellipse(cx,cy-sc*10.2-bob,sc*2.55,sc*2.8,0,0,Math.PI*2); ctx.fill();

  // Occhi stanchi
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(cx-sc*.8,cy-sc*10.5-bob,sc*.48,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*.8,cy-sc*10.5-bob,sc*.48,0,Math.PI*2); ctx.fill();

  // Bocca
  ctx.strokeStyle='rgba(100,40,20,.75)'; ctx.lineWidth=Math.max(.6,sc*.22);
  ctx.beginPath();
  if(felicita>60){ ctx.arc(cx,cy-sc*9.2-bob,sc*.9,.15,Math.PI-.15,false); }
  else { ctx.arc(cx,cy-sc*8.7-bob,sc*.9,Math.PI+.2,-.2,false); }
  ctx.stroke();

  // Bandana/cappello lavoro
  ctx.fillStyle=felCol;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*12.1-bob,sc*2.7,sc*.95,0,Math.PI,0,true); ctx.fill();
  ctx.fillRect(cx-sc*2.7,cy-sc*12.1-bob,sc*5.4,sc*1.1);
  if(prof.role==='minatore'){
    ctx.fillStyle='rgba(80,70,55,.9)'; ctx.fillRect(cx-sc*1.6,cy-sc*13.3-bob,sc*3.2,sc*.65);
    ctx.fillStyle='rgba(255,220,130,.8)'; ctx.beginPath(); ctx.arc(cx,cy-sc*13.0-bob,sc*.55,0,Math.PI*2); ctx.fill();
  }

  // Indicatore felicità più piccolo e meno invasivo
  ctx.fillStyle='rgba(0,0,0,.45)';
  ctx.beginPath(); ctx.arc(cx,cy-sc*15.0-bob,sc*1.55,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=felCol;
  ctx.beginPath(); ctx.arc(cx,cy-sc*15.0-bob,sc*1.12,0,Math.PI*2); ctx.fill();
}

