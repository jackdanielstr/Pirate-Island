// Isla del Diablo — world/buildings_hud.js
// Estratto da 10_edifici_hud.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: EDIFICI_HUD
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// EDIFICI HUD — stile Tropico 2
// ═══════════════════════════════════════════════════

const EDIFICIO_PRODUZIONE = {
  fattoria:    { icona:'🍖', risorsa:'cibo',    valore:9,  colore:'#4fc04f' },
  distilleria: { icona:'🍺', risorsa:'rum',     valore:6,  colore:'#c07830' },
  segheria:    { icona:'🪵', risorsa:'legno',   valore:7,  colore:'#8b5e3c' },
  osservatorio:{ icona:'🔭', risorsa:'ricerca', valore:3,  colore:'#6ab4ff' },
  casapirata:  { icona:'💰', risorsa:'oro',     valore:6,  colore:'#f0c040' },
  sarto:       { icona:'💰', risorsa:'oro',     valore:10, colore:'#f0c040' },
  taverna:     { icona:'😊', risorsa:'morale',  valore:5,  colore:'#ff8888' },
  bordello:    { icona:'💋', risorsa:'diverte', valore:20, colore:'#ff69b4' },
  arena:       { icona:'⚔',  risorsa:'diverte', valore:12, colore:'#ff6644' },
  infermeria:  { icona:'❤',  risorsa:'salute',  valore:20, colore:'#ff4444' },
  cappella:    { icona:'✝',  risorsa:'spirito', valore:18, colore:'#ffffaa' },
  guardia:     { icona:'🛡',  risorsa:'sicur.',  valore:15, colore:'#88ccff' },
  caserma:     { icona:'⚔',  risorsa:'combatt.',valore:1,  colore:'#ff8844' },
  cantiere:    { icona:'⚓',  risorsa:'navi',    valore:0,  colore:'#8888ff' },
  fortezza:    { icona:'🏰', risorsa:'difesa',  valore:0,  colore:'#aaaaaa' },
  prigione:    { icona:'⛓',  risorsa:'riscatti',valore:0,  colore:'#888888' },
  mercatonero: { icona:'🛒', risorsa:'+20%',    valore:0,  colore:'#ffaa00' },
  bagni:       { icona:'🛁', risorsa:'salute',  valore:12, colore:'#88ddff' },
  cantastorie: { icona:'🎭', risorsa:'diverte', valore:8,  colore:'#dd88ff' },
};

function disegnaIndicatoriEdifici(s){
  // v20.38: le finestrelle bonus sopra gli edifici non restano più persistenti.
  // Mostra al massimo l'indicatore dell'edificio sotto l'ultimo hover/touch,
  // poi lo chiude automaticamente dopo pochi secondi.
  if(!G.edifici||G.edifici.length===0) return;
  if(G.modalitaCostruzione) return;
  const modale=document.getElementById('overlay-modale');
  if(modale && modale.classList.contains('aperto')) return;

  const hoverR=Number.isFinite(G.hoverR)?G.hoverR:-1;
  const hoverC=Number.isFinite(G.hoverC)?G.hoverC:-1;
  const b=(typeof edificioInTile==='function') ? edificioInTile(hoverR,hoverC) : G.edifici.find(ed=>ed.r===hoverR&&ed.c===hoverC);
  if(!b){
    disegnaIndicatoriEdifici._key='';
    return;
  }

  const key=b.r+','+b.c+','+b.tipo;
  const now=(typeof performance!=='undefined' && performance.now) ? performance.now() : Date.now();
  const DURATA_INDICATORE_MS=2600;
  if(disegnaIndicatoriEdifici._key!==key){
    disegnaIndicatoriEdifici._key=key;
    disegnaIndicatoriEdifici._until=now+DURATA_INDICATORE_MS;
  }
  if(now>(disegnaIndicatoriEdifici._until||0)) return;

  // Fade leggero nell'ultimo mezzo secondo: meno brusco e più pulito su mobile.
  const remain=(disegnaIndicatoriEdifici._until||0)-now;
  const alpha=Math.max(0,Math.min(1,remain<500 ? remain/500 : 1));

  const IH=G.ISO_H*s;
  const alture={fortezza:2.2,guardia:2.8,osservatorio:2.5,cantiere:1.8,cappella:2.3,caserma:1.6};
  const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(b) : {r:b.r,c:b.c};
  const p=isoProj(centro.c,centro.r);
  const cx=p.x, cy=p.y+IH*0.5;
  const altH=(alture[b.tipo]||1.2)*IH;
  const ix=cx, iy=cy-altH;
  const prod=EDIFICIO_PRODUZIONE[b.tipo];
  const schiaviQui=(G.schiavi||[]).filter(sv=>sv.edificioR===b.r&&sv.edificioC===b.c).length;

  ctx.save();
  ctx.globalAlpha=alpha;
  const bw=54*s, bh=18*s, bx=ix-bw/2, by=iy-bh-4*s;

  ctx.fillStyle='rgba(0,0,0,0.75)';
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(bx,by,bw,bh,4*s); else ctx.rect(bx,by,bw,bh);
  ctx.fill();

  if(prod){ ctx.strokeStyle=prod.colore+'99'; ctx.lineWidth=1*s; ctx.stroke(); }

  ctx.font=(10*s)+'px serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillStyle='white';
  ctx.fillText(ED[b.tipo]?.icona||'🏠', bx+3*s, by+bh/2);

  if(prod&&prod.valore>0){
    ctx.fillStyle=prod.colore; ctx.font='bold '+(8*s)+'px sans-serif';
    ctx.fillText('+'+prod.valore, bx+16*s, by+bh/2-2*s);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font=(6*s)+'px sans-serif';
    ctx.fillText(prod.risorsa, bx+16*s, by+bh/2+5*s);
  } else if(prod){
    ctx.fillStyle=prod.colore; ctx.font=(7*s)+'px sans-serif'; ctx.textAlign='center';
    ctx.fillText(prod.risorsa, bx+bw/2+4*s, by+bh/2);
  }

  if(schiaviQui>0){
    ctx.fillStyle='#ffbbbb'; ctx.font='bold '+(7*s)+'px sans-serif'; ctx.textAlign='right';
    ctx.fillText('⛏'+schiaviQui, bx+bw-2*s, by+bh/2);
  }

  if(typeof efficienzaStradaEdificio==='function' && b.tipo!=='governatore'){
    const eff=efficienzaStradaEdificio(b);
    ctx.fillStyle=eff>=1?'#4fc04f':eff>=0.7?'#f0c040':'#c0392b';
    ctx.font='bold '+(7*s)+'px sans-serif'; ctx.textAlign='right';
    ctx.fillText('🛤', bx+bw-3*s, by+5*s);
  }

  ctx.fillStyle='rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.moveTo(ix-3*s,by+bh); ctx.lineTo(ix+3*s,by+bh); ctx.lineTo(ix,by+bh+4*s);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function apriPopupEdificio(edificio){
  const def=ED[edificio.tipo];
  if(!def) return;
  if(edificio.tipo==='porto' && typeof apriPortoPirata==='function'){
    apriPortoPirata(edificio);
    return;
  }
  const prod=EDIFICIO_PRODUZIONE[edificio.tipo];
  const schiaviQui=(G.schiavi||[]).filter(s=>s.edificioR===edificio.r&&s.edificioC===edificio.c);
  const accettaSchiavi=typeof LAVORO_SCHIAVI!=='undefined'&&!!LAVORO_SCHIAVI[edificio.tipo];
  const lav=accettaSchiavi?LAVORO_SCHIAVI[edificio.tipo]:null;

  let h='<div class="scheda-edificio-head">';
  h+='<div class="scheda-edificio-icona">'+def.icona+'</div>';
  h+='<div class="scheda-edificio-nome">'+def.nome+'</div>';
  h+='<div class="scheda-edificio-effetto">'+def.effetto+'</div>';
  h+='</div>';

  if(typeof efficienzaStradaEdificio==='function' && edificio.tipo!=='governatore'){
    const eff=efficienzaStradaEdificio(edificio);
    const stato=eff>=1?'Collegato al porto/palazzo':eff>=0.7?'Sentiero vicino, ma rete incompleta':'Isolato: produzione ridotta';
    const colore=eff>=1?'#4fc04f':eff>=0.7?'#f0c040':'#c0392b';
    h+='<div class="scheda-edificio-box" style="border-color:'+colore+'66;';
    h+='border-radius:6px;padding:7px 9px;margin-bottom:10px;font-size:.72rem;color:var(--sabbia)">';
    h+='<strong style="color:'+colore+'">🛤 Rete sentieri: '+Math.round(eff*100)+'%</strong><br>'+stato+'</div>';
  }

  if(prod&&prod.valore>0){
    h+='<div style="display:flex;justify-content:center;gap:16px;background:rgba(255,255,255,.05);';
    h+='border-radius:6px;padding:8px;margin-bottom:10px;border:1px solid var(--bordo)">';
    h+='<div style="text-align:center">';
    h+='<div style="font-size:1.4rem">'+prod.icona+'</div>';
    h+='<div style="font-family:\'Cinzel\',serif;font-size:1rem;color:'+prod.colore+'">+'+prod.valore+'</div>';
    h+='<div style="font-size:.62rem;color:var(--sabbia)">'+prod.risorsa+'/giorno</div>';
    h+='</div></div>';
  }

  if(accettaSchiavi&&lav){
    h+='<div style="background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);';
    h+='border-radius:5px;padding:8px 10px;margin-bottom:10px">';
    h+='<div style="font-size:.7rem;color:#ffbbbb;margin-bottom:5px">';
    h+='⛏ Schiavi: <strong>'+schiaviQui.length+'</strong> / 3 max</div>';

    for(const sv of schiaviQui){
      const fc=sv.felicita>60?'#4fc04f':sv.felicita>30?'#f0c040':'#c0392b';
      const pe=Math.floor((lav.base||0)*(0.2+sv.felicita/100));
      h+='<div style="display:flex;justify-content:space-between;font-size:.68rem;';
      h+='color:var(--sabbia);margin-bottom:2px">';
      h+='<span>⛓ '+sv.nome+'</span>';
      h+='<span style="color:'+fc+'">😊'+sv.felicita+'% '+(lav.icona||'')+pe+'/g</span></div>';
      h+='<div style="height:3px;background:#1a2a1a;border-radius:2px;margin-bottom:3px">';
      h+='<div style="height:100%;width:'+sv.felicita+'%;background:'+fc+';border-radius:2px"></div></div>';
    }
    if(schiaviQui.length===0)
      h+='<div style="font-size:.68rem;color:#666;font-style:italic">Nessuno schiavo assegnato</div>';
    if((G.prigionieri||[]).length>0&&schiaviQui.length<3)
      h+='<button class="btn-piccolo" style="margin-top:5px" onclick="chiudiModale();apriGestioneSchiavi()">+ Assegna schiavo</button>';
    h+='</div>';
  }

  h+='<div class="scheda-edificio-azioni">';
  h+='<button class="mbtn pericolo" onclick="demolisciEdificio('+edificio.r+','+edificio.c+')">🔨 Demolisci</button>';
  h+='<button class="mbtn secondario" onclick="chiudiModale()">Chiudi</button>';
  h+='</div>';

  apriModale(def.icona+' '+def.nome, h);
}

function demolisciEdificio(r,c){
  G.edifici=G.edifici.filter(b=>!(b.r===r&&b.c===c));
  if(G.schiavi) G.schiavi=G.schiavi.filter(s=>!(s.edificioR===r&&s.edificioC===c));
  chiudiModale();
  aggMsg('🔨 Edificio demolito','male');
  aggiornaUI();
}

// ── NAVI ANIMATE ──
const _naviMare={};

function inizializzaNaveMare(nave){
  if(_naviMare[nave.id]) return;
  const puntoPorto=typeof trovaPortoRaid==='function'?trovaPortoRaid():null;
  let sx=canvas?canvas.width*0.1:100, sy=canvas?canvas.height*0.3:200;
  if(puntoPorto&&canvas){ const p=isoProj(puntoPorto.c,puntoPorto.r); sx=p.x; sy=p.y; }
  _naviMare[nave.id]={x:sx,y:sy,ondaOffset:Math.random()*Math.PI*2,angolo:0};
}


// ═══════════════════════════════════════
// FASE 2 — PORTO VIVO / DENSITÀ TROPICO 2
// ═══════════════════════════════════════
// Obiettivo: rendere il porto il cuore visivo della simulazione.
// Navi visibili da attraccate, clutter scenico, merci e schiavi trasportatori.

const PORTO_PROPS_TIPI = ['cassa','botte','rete','palo','corda','lanterna','barile','catasta','ancora','bandiera','fuoco','gru','telo'];
const RISORSE_PORTO = [
  {k:'cibo',  icona:'🍖', nome:'cibo'},
  {k:'legno', icona:'🪵', nome:'legno'},
  {k:'rum',   icona:'🍺', nome:'rum'},
  {k:'oro',   icona:'💰', nome:'oro'},
];

function hashPorto(v){
  let x = Math.sin(v * 999.731) * 43758.5453;
  return x - Math.floor(x);
}

function puntoPortoVivo(){
  if(typeof trovaPortoRaid==='function') return trovaPortoRaid();
  const porto=G.edifici.find(b=>b.tipo==='porto')||G.edifici.find(b=>b.tipo==='cantiere');
  if(porto) return (typeof cellaRiferimentoEdificio==='function') ? cellaRiferimentoEdificio(porto,true) : {r:porto.r,c:porto.c,tipo:porto.tipo};
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2),tipo:'centro'};
}

function tileAcquaVicino(r,c){
  const dirs=[
    [-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],
    [-2,0],[2,0],[0,-2],[0,2],[-2,-1],[-2,1],[2,-1],[2,1]
  ];
  for(const [dr,dc] of dirs){
    const nr=r+dr,nc=c+dc;
    if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
    const t=G.mappa[nr][nc];
    if(t===T.BASSO||t===T.OCEANO) return {r:nr,c:nc};
  }
  return {r,c};
}

function latoMarePorto(r,c){
  const acqua=tileAcquaVicino(r,c);
  const dc=Math.max(-1,Math.min(1,acqua.c-c));
  const dr=Math.max(-1,Math.min(1,acqua.r-r));
  return {acqua,dc,dr};
}

function slotAttracco(nave){
  const porto=puntoPortoVivo();
  const lato=latoMarePorto(porto.r,porto.c);
  const acqua=lato.acqua;
  const i=(nave.id||0)%4;
  // Attracchi più larghi e sfalsati: la nave sembra legata al molo, non appoggiata a caso.
  const lungo=[-.38,.12,.46,-.08][i];
  const fuori=[.16,.26,.08,.42][i];
  const tangC = lato.dr || 0;
  const tangR = -(lato.dc || 0);
  return {
    r:acqua.r+0.5 + tangR*lungo + lato.dr*fuori,
    c:acqua.c+0.5 + tangC*lungo + lato.dc*fuori,
    portoR:porto.r,
    portoC:porto.c,
  };
}
function propPorto(id,tipo,r,c,scala=1,rot=0,vicino='porto',extra={}){
  return Object.assign({id,tipo,r,c,scala,rot,vicino}, extra);
}

function tilePropValido(r,c,ancheAcqua=false){
  const tr=Math.max(0,Math.min(G.RIGHE-1,Math.floor(r)));
  const tc=Math.max(0,Math.min(G.COLS-1,Math.floor(c)));
  const t=G.mappa[tr]&&G.mappa[tr][tc];
  if(ancheAcqua) return t===T.BASSO||t===T.OCEANO;
  return t!==T.OCEANO && t!==T.BASSO && t!==T.FIUME;
}

function rigeneraPortoVivo(){
  G.portoProps = [];
  const basi = G.edifici.filter(b=>b.tipo==='porto'||b.tipo==='cantiere');
  if(basi.length===0){
    const p=puntoPortoVivo();
    basi.push({r:p.r,c:p.c,tipo:p.tipo||'spiaggia'});
  }

  let id=1;
  for(const base of basi){
    const b=(typeof cellaRiferimentoEdificio==='function') ? cellaRiferimentoEdificio(base,true) : base;
    const lato=latoMarePorto(b.r,b.c);
    const dirC=lato.dc||1, dirR=lato.dr||0;
    const tangC=dirR, tangR=-dirC;

    // Molo principale: passerelle parallele alla costa e paletti verso l'acqua.
    const moloLen=b.tipo==='porto'?5:3;
    for(let j=-moloLen;j<=moloLen;j++){
      const rr=b.r+0.55+tangR*j*.24+dirR*.34;
      const cc=b.c+0.55+tangC*j*.24+dirC*.34;
      G.portoProps.push(propPorto(id++,'passerella',rr,cc,1.05,Math.atan2(tangR,tangC),'molo',{asse:j}));
      if(j%2===0){
        G.portoProps.push(propPorto(id++,'palo',rr+dirR*.32,cc+dirC*.32,1.05,0,'molo'));
      }
      if(j%4===0){
        G.portoProps.push(propPorto(id++,'lanterna',rr-dirR*.08,cc-dirC*.08,.95,0,'molo'));
      }
    }

    // Piccoli moli secondari per rendere il porto più leggibile e meno “tile singolo”.
    for(let j=-2;j<=2;j+=2){
      for(let k=1;k<=3;k++){
        const rr=b.r+0.5+tangR*j*.32+dirR*(.42+k*.22);
        const cc=b.c+0.5+tangC*j*.32+dirC*(.42+k*.22);
        if(tilePropValido(rr,cc,true)) G.portoProps.push(propPorto(id++,'pontile_corto',rr,cc,.92,Math.atan2(dirR,dirC),'molo'));
      }
    }

    // Clutter vicino al porto: sporco, caotico, ma deterministico.
    const quantita = b.tipo==='porto' ? 34 : 20;
    for(let i=0;i<quantita;i++){
      const rnd=hashPorto(b.r*83+b.c*47+i*13);
      const ang = i*1.77 + rnd*.9;
      const rad = .35 + hashPorto(i*13+b.r)*1.85;
      const rr = b.r + 0.5 + Math.sin(ang)*rad*.78 - dirR*.18;
      const cc = b.c + 0.5 + Math.cos(ang)*rad - dirC*.18;
      if(!tilePropValido(rr,cc,false)) continue;
      const stockPeso=(G.oro+G.legno+G.rum+G.cibo)/900;
      const tipi=[...PORTO_PROPS_TIPI];
      if(stockPeso>.65) tipi.push('stock_merci','stock_merci','catasta');
      if(i%9===0) tipi.push('facchino');
      const tipo=tipi[(i + b.r + b.c) % tipi.length];
      G.portoProps.push(propPorto(
        id++, tipo, rr, cc,
        .68+hashPorto(i*19+b.c)*.62,
        hashPorto(i*23+b.r)*Math.PI,
        b.tipo,
        {merce:RISORSE_PORTO[(i+b.r+b.c)%RISORSE_PORTO.length]}
      ));
    }

    // Gru e bandiera: elementi verticali che danno silhouette “Tropico 2”.
    const gruR=b.r+0.48-dirR*.28+tangR*.44;
    const gruC=b.c+0.48-dirC*.28+tangC*.44;
    if(tilePropValido(gruR,gruC,false)) G.portoProps.push(propPorto(id++,'gru',gruR,gruC,1.15,0,'molo'));
    const bandR=b.r+0.18-dirR*.18-tangR*.44;
    const bandC=b.c+0.18-dirC*.18-tangC*.44;
    if(tilePropValido(bandR,bandC,false)) G.portoProps.push(propPorto(id++,'bandiera',bandR,bandC,1.1,0,'molo'));
  }
}
function assicuraPortoVivo(){
  if(!G.portoProps) rigeneraPortoVivo();
}

function disegnaPropPorto(prop,cx,cy,s){
  const sc=G.ISO_H*s*(prop.scala||1);
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate((prop.rot||0)*0.08);

  // ombra
  ctx.globalAlpha=.25;
  ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(sc*.15,sc*.16,sc*.22,sc*.07,.2,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  switch(prop.tipo){
    case 'cassa':
      isoBox(0,0,sc*.34,sc*.22,sc*.22,'#9a6a2a','#b88436','#6b461a');
      ctx.strokeStyle='rgba(60,35,10,.7)'; ctx.lineWidth=Math.max(.6,s);
      ctx.beginPath(); ctx.moveTo(-sc*.14,-sc*.08); ctx.lineTo(sc*.14,sc*.06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sc*.14,-sc*.08); ctx.lineTo(-sc*.14,sc*.06); ctx.stroke();
      break;
    case 'botte':
    case 'barile':
      ctx.fillStyle='#7a4a18';
      ctx.beginPath(); ctx.ellipse(0,-sc*.08,sc*.18,sc*.13,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#9a6228'; ctx.fillRect(-sc*.18,-sc*.08,sc*.36,sc*.24);
      ctx.fillStyle='#5a3210';
      ctx.beginPath(); ctx.ellipse(0,sc*.16,sc*.18,sc*.13,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#3a2008'; ctx.lineWidth=s;
      ctx.beginPath(); ctx.moveTo(-sc*.14,-sc*.02); ctx.lineTo(sc*.14,-sc*.02); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-sc*.14,sc*.08); ctx.lineTo(sc*.14,sc*.08); ctx.stroke();
      break;
    case 'rete':
      ctx.strokeStyle='rgba(205,190,140,.65)'; ctx.lineWidth=Math.max(.7,s*.7);
      for(let i=-2;i<=2;i++){
        ctx.beginPath(); ctx.moveTo(-sc*.24,i*sc*.045); ctx.lineTo(sc*.24,i*sc*.045+sc*.1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i*sc*.06,-sc*.12); ctx.lineTo(i*sc*.06+sc*.1,sc*.16); ctx.stroke();
      }
      break;
    case 'corda':
      ctx.strokeStyle='#c0a060'; ctx.lineWidth=Math.max(1.2,s*1.5);
      ctx.beginPath(); ctx.ellipse(0,0,sc*.22,sc*.1,.2,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(sc*.05,sc*.02,sc*.13,sc*.06,.2,0,Math.PI*2); ctx.stroke();
      break;
    case 'lanterna':
      ctx.strokeStyle='#5a3a10'; ctx.lineWidth=2*s;
      ctx.beginPath(); ctx.moveTo(0,sc*.1); ctx.lineTo(0,-sc*.42); ctx.stroke();
      ctx.fillStyle=`rgba(255,190,70,${.45+Math.sin(frame*.08+prop.id)*.18})`;
      ctx.beginPath(); ctx.arc(0,-sc*.5,sc*.1,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#8a6020'; ctx.lineWidth=s;
      ctx.strokeRect(-sc*.08,-sc*.58,sc*.16,sc*.16);
      break;
    case 'passerella':
    case 'pontile_corto': {
      const w=prop.tipo==='passerella'?sc*.56:sc*.42;
      const h=prop.tipo==='passerella'?sc*.16:sc*.13;
      ctx.fillStyle='#6a4318';
      ctx.fillRect(-w*.5,-h*.5,w,h);
      ctx.fillStyle='rgba(205,150,70,.45)';
      ctx.fillRect(-w*.5,-h*.5,w,h*.36);
      ctx.strokeStyle='rgba(45,25,8,.65)'; ctx.lineWidth=Math.max(.7,s*.75);
      for(let k=-2;k<=2;k++){
        ctx.beginPath(); ctx.moveTo(k*w*.16,-h*.55); ctx.lineTo(k*w*.16,h*.55); ctx.stroke();
      }
      break;
    }
    case 'catasta':
    case 'stock_merci': {
      for(let k=0;k<3;k++){
        const ox=(k-1)*sc*.18, oy=(k%2)*sc*.08;
        isoBox(ox,oy,sc*.24,sc*.16,sc*.16,'#9a6a2a','#b88436','#6b461a');
      }
      const merce=prop.merce||RISORSE_PORTO[0];
      ctx.font=`${Math.max(8,9*s)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(merce.icona,0,-sc*.18);
      break;
    }
    case 'ancora':
      ctx.strokeStyle='#2f3538'; ctx.lineWidth=Math.max(1.5,s*2.2);
      ctx.beginPath(); ctx.moveTo(0,-sc*.25); ctx.lineTo(0,sc*.18); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-sc*.32,sc*.08,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(-sc*.14,sc*.12,sc*.16,0,Math.PI*.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(sc*.14,sc*.12,sc*.16,Math.PI*.1,Math.PI); ctx.stroke();
      break;
    case 'bandiera': {
      ctx.strokeStyle='#5a3a10'; ctx.lineWidth=2*s;
      ctx.beginPath(); ctx.moveTo(0,sc*.18); ctx.lineTo(0,-sc*.72); ctx.stroke();
      const flap=Math.sin(frame*.08+prop.id)*sc*.06;
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.moveTo(0,-sc*.68); ctx.lineTo(sc*.38,-sc*.6+flap); ctx.lineTo(sc*.34,-sc*.42+flap*.4); ctx.lineTo(0,-sc*.48); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`${Math.max(8,10*s)}px serif`; ctx.textAlign='center';
      ctx.fillText('☠',sc*.19,-sc*.51+flap*.45);
      break;
    }
    case 'fuoco': {
      ctx.fillStyle='#3a2410';
      ctx.beginPath(); ctx.ellipse(0,sc*.08,sc*.22,sc*.09,0,0,Math.PI*2); ctx.fill();
      const a=.65+Math.sin(frame*.16+prop.id)*.18;
      ctx.fillStyle=`rgba(255,90,20,${a})`;
      ctx.beginPath(); ctx.moveTo(-sc*.09,sc*.03); ctx.quadraticCurveTo(0,-sc*.38,sc*.1,sc*.03); ctx.closePath(); ctx.fill();
      ctx.fillStyle=`rgba(255,210,70,${a})`;
      ctx.beginPath(); ctx.moveTo(-sc*.04,sc*.03); ctx.quadraticCurveTo(sc*.02,-sc*.25,sc*.06,sc*.03); ctx.closePath(); ctx.fill();
      break;
    }
    case 'gru': {
      isoBox(0,0,sc*.18,sc*.12,sc*.58,'#8a6028','#a07838','#5a3814');
      ctx.strokeStyle='#6a4318'; ctx.lineWidth=2*s;
      ctx.beginPath(); ctx.moveTo(0,-sc*.58); ctx.lineTo(sc*.52,-sc*.82); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sc*.52,-sc*.82); ctx.lineTo(sc*.48,-sc*.46); ctx.stroke();
      ctx.fillStyle='#8a6028'; ctx.beginPath(); ctx.arc(sc*.48,-sc*.43,sc*.055,0,Math.PI*2); ctx.fill();
      break;
    }
    case 'telo': {
      ctx.fillStyle='rgba(150,35,25,.82)';
      ctx.beginPath(); ctx.moveTo(-sc*.28,-sc*.08); ctx.lineTo(sc*.28,-sc*.12); ctx.lineTo(sc*.2,sc*.16); ctx.lineTo(-sc*.22,sc*.18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(80,20,10,.65)'; ctx.lineWidth=s; ctx.stroke();
      break;
    }
    case 'facchino': {
      const bob=Math.sin(frame*.09+prop.id)*sc*.035;
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sc*.04,sc*.14,sc*.16,sc*.05,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#8a4a20'; ctx.fillRect(-sc*.05,-sc*.08+bob,sc*.1,sc*.18);
      ctx.fillStyle='#c89a60'; ctx.beginPath(); ctx.arc(0,-sc*.15+bob,sc*.08,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#9a6a2a'; ctx.fillRect(sc*.07,-sc*.12+bob,sc*.18,sc*.14);
      break;
    }
    case 'palo':
    default:
      ctx.strokeStyle='#6a4318'; ctx.lineWidth=3*s;
      ctx.beginPath(); ctx.moveTo(0,sc*.14); ctx.lineTo(0,-sc*.5); ctx.stroke();
      ctx.fillStyle='#8a6020'; ctx.beginPath(); ctx.arc(0,-sc*.52,sc*.045,0,Math.PI*2); ctx.fill();
      break;
  }
  ctx.restore();
}

function disegnaCaricoSchiavo(sv,cx,cy,s){
  if(!sv._trasporto || !sv._trasporto.carry) return;
  const merce=sv._trasporto.risorsa||RISORSE_PORTO[0];
  const sc=G.ISO_H*s*.16;
  ctx.save();
  ctx.translate(cx+sc*.55, cy-G.ISO_H*s*.35);
  ctx.fillStyle='rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(sc*.1,sc*.18,sc*.22,sc*.07,.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#9a6a2a';
  ctx.fillRect(-sc*.14,-sc*.08,sc*.32,sc*.22);
  ctx.strokeStyle='#5a3210'; ctx.lineWidth=s;
  ctx.strokeRect(-sc*.14,-sc*.08,sc*.32,sc*.22);
  ctx.font=`${Math.max(8,10*s)}px serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(merce.icona,sc*.02,sc*.03);
  ctx.restore();
}

function aggiornaTargetTrasportoSchiavo(sv){
  const porto=puntoPortoVivo();
  const edificio=G.edifici.find(b=>b.r===sv.edificioR&&b.c===sv.edificioC) || {r:sv.edificioR,c:sv.edificioC,tipo:sv.edificioTipo};
  const portoEd=G.edifici.find(b=>b.r===porto.r&&b.c===porto.c) || {r:porto.r,c:porto.c,tipo:porto.tipo||'porto'};
  if(!sv._trasporto){
    sv._trasporto={
      fase:'a_edificio',
      carry:false,
      risorsa:RISORSE_PORTO[Math.floor(Math.random()*RISORSE_PORTO.length)],
      attesa:Math.random()*2
    };
  }
  const tr=sv._trasporto;
  if(tr.attesa>0) return null;

  // FASE 2E: anche gli schiavi puntano agli ingressi su sentiero, non al centro dell'edificio.
  if(tr.fase==='a_edificio'){
    const acc=(typeof accessoMiglioreEdificio==='function') ? accessoMiglioreEdificio(edificio,Math.floor(sv.mr),Math.floor(sv.mc)) : null;
    return acc ? {r:acc.r+.5,c:acc.c+.5} : {r:edificio.r+.5,c:edificio.c+.5};
  }
  if(tr.fase==='a_porto'){
    const acc=(typeof accessoMiglioreEdificio==='function') ? accessoMiglioreEdificio(portoEd,Math.floor(sv.mr),Math.floor(sv.mc)) : null;
    if(acc) return {r:acc.r+.5+(Math.random()-.5)*.12,c:acc.c+.5+(Math.random()-.5)*.12};
    return {r:porto.r+.5+(Math.random()-.5)*.25,c:porto.c+.5+(Math.random()-.5)*.25};
  }
  return null;
}


function screenToIsoApprox(x,y){
  const W=G.ISO_W*G.ISO_SCALE, H=G.ISO_H*G.ISO_SCALE;
  const yy=y-G.camY, xx=x-G.camX;
  const col=(yy/H)+(xx/W);
  const row=(yy/H)-(xx/W);
  return {r:Math.round(row),c:Math.round(col)};
}
function tileAcqua(r,c){
  const t=G.mappa[r]&&G.mappa[r][c];
  return t===T.OCEANO||t===T.BASSO;
}
function trovaAcquaVicinoIso(r,c,raggio=7){
  if(tileAcqua(r,c)) return {r,c};
  for(let rad=1;rad<=raggio;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if(tileAcqua(nr,nc)) return {r:nr,c:nc};
    }
  }
  return null;
}
function correggiNaveSuAcqua(nm,forza=0.12){
  if(!canvas||!G.mappa) return;
  const g=screenToIsoApprox(nm.x,nm.y);
  if(tileAcqua(g.r,g.c)) return;
  const a=trovaAcquaVicinoIso(g.r,g.c,8);
  if(!a) return;
  const p=isoProj(a.c,a.r);
  const tx=p.x, ty=p.y+G.ISO_H*G.ISO_SCALE*.7;
  nm.x+=(tx-nm.x)*forza;
  nm.y+=(ty-nm.y)*forza;
}



// ═══════════════════════════════════════
// FASE 4B LIGHT — PORTO DINAMICO VISIVO
// ═══════════════════════════════════════
// Effetti solo grafici collegati ai raid: campana, imbarco, salpata,
// rientro e scarico merci. Non modifica economia, pathfinding o salvataggi.

function assicuraEffettiPorto(){
  if(!Array.isArray(G.portoFx)) G.portoFx=[];
}

function creaEffettoPortoRaid(tipo,nave,extra={}){
  try{
    assicuraEffettiPorto();
    const porto=puntoPortoVivo();
    const slot=nave ? slotAttracco(nave) : {r:porto.r+.5,c:porto.c+.5};
    const durata={campana:160,imbarco:210,salpa:180,rientro:210,scarico:260,vela:120}[tipo]||150;
    G.portoFx.push(Object.assign({
      id:'fx_'+Date.now()+'_'+Math.floor(Math.random()*99999),
      tipo,
      naveId:nave?.id||null,
      nome:nave?.nome||'',
      r:slot.r,
      c:slot.c,
      portoR:porto.r,
      portoC:porto.c,
      vita:durata,
      maxVita:durata,
      seed:hashPorto((nave?.id||1)*71+G.giorno*13+durata)
    },extra));
    // Limite morbido per evitare accumuli se il player lancia molti raid.
    if(G.portoFx.length>28) G.portoFx.splice(0,G.portoFx.length-28);
  }catch(e){ /* effetto opzionale: mai bloccare il raid */ }
}

function posizioneFxPorto(fx,s){
  const base=isoProj(fx.c,fx.r);
  return {x:base.x,y:base.y+G.ISO_H*s*.55};
}

function disegnaFumoPorto(x,y,t,sc,seed){
  for(let i=0;i<5;i++){
    const p=(t+i*.17)%1;
    const ox=(Math.sin(seed*9+i)*12 + Math.sin(frame*.025+i)*8)*sc*p;
    const oy=-(14+36*p+i*4)*sc;
    ctx.globalAlpha=(1-p)*.22;
    ctx.fillStyle='#d8d0b8';
    ctx.beginPath(); ctx.ellipse(x+ox,y+oy,sc*(5+i*1.5+p*9),sc*(3+i+p*6),0,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}

function disegnaCiurmaImbarco(fx,x,y,s,progress){
  const sc=G.ISO_H*s*.13;
  const n=fx.quanti||Math.max(3,Math.min(8,(fx.crew||5)));
  for(let i=0;i<n;i++){
    const lane=(i-(n-1)/2)*sc*.95;
    const advance=Math.min(1,Math.max(0,progress*1.25-i*.045));
    const px=x-sc*5+advance*sc*7+lane*.28;
    const py=y+lane*.34-Math.sin((frame+i*13)*.16)*sc*.08;
    ctx.save();
    ctx.globalAlpha=.22; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(px,py+sc*.38,sc*.28,sc*.09,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=.95;
    ctx.fillStyle=i%3===0?'#7f1b18':i%3===1?'#2d4f7a':'#5a3a1a';
    ctx.fillRect(px-sc*.12,py-sc*.48,sc*.24,sc*.62);
    ctx.fillStyle='#c89a60'; ctx.beginPath(); ctx.arc(px,py-sc*.66,sc*.16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.ellipse(px,py-sc*.82,sc*.33,sc*.10,0,0,Math.PI*2); ctx.fill();
    // casse o barili portati a bordo
    if(i%2===0 && advance>.25){
      ctx.fillStyle='#9a6a2a'; ctx.fillRect(px+sc*.18,py-sc*.5,sc*.32,sc*.26);
      ctx.strokeStyle='#5a3210'; ctx.lineWidth=Math.max(.5,s*.7); ctx.strokeRect(px+sc*.18,py-sc*.5,sc*.32,sc*.26);
    }
    ctx.restore();
  }
}

function disegnaScaricoMerci(fx,x,y,s,progress){
  const sc=G.ISO_H*s*.16;
  const merci=['💰','🍺','🪵','🍖'];
  for(let i=0;i<8;i++){
    const p=Math.min(1,Math.max(0,progress*1.35-i*.06));
    const ox=(i%4-1.5)*sc*.9;
    const oy=Math.floor(i/4)*sc*.45;
    const px=x+sc*3*(1-p)+ox;
    const py=y+sc*.35+oy-sc*.55*p;
    ctx.save();
    ctx.globalAlpha=.25; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(px,py+sc*.18,sc*.24,sc*.07,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=.98;
    isoBox(px-x,py-y,sc*.32,sc*.22,sc*.2,'#9a6a2a','#b88436','#6b461a');
    ctx.font=`${Math.max(8,9*s)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(merci[i%merci.length],px,py-sc*.05);
    ctx.restore();
  }
}

function disegnaOndeSalpata(x,y,s,intensita=1){
  ctx.save();
  ctx.globalAlpha=.18*intensita;
  ctx.strokeStyle='#d7ffff';
  ctx.lineWidth=Math.max(1,2.2*s);
  for(let i=0;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x-18*s-i*10*s,y+10*s+i*3*s);
    ctx.quadraticCurveTo(x-45*s-i*13*s,y+2*s+i*4*s,x-78*s-i*14*s,y+13*s+i*2*s);
    ctx.stroke();
  }
  ctx.restore();
}

function aggiornaDisegnaEffettiPorto(s){
  assicuraEffettiPorto();
  if(!G.portoFx.length) return;
  const vivi=[];
  for(const fx of G.portoFx){
    fx.vita--;
    if(fx.vita<=0) continue;
    vivi.push(fx);
    const t=1-(fx.vita/fx.maxVita);
    const pos=posizioneFxPorto(fx,s);
    const x=pos.x, y=pos.y;
    const fade=Math.min(1,fx.vita/35)*Math.min(1,t*8);

    ctx.save();
    ctx.globalAlpha=fade;
    if(fx.tipo==='campana'){
      const sc=G.ISO_H*s*.35;
      ctx.fillStyle='rgba(40,25,8,.55)';
      ctx.beginPath(); ctx.ellipse(x,y+sc*.42,sc*.72,sc*.2,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#d4a43a';
      ctx.font=`bold ${Math.max(12,18*s)}px serif`; ctx.textAlign='center';
      ctx.fillText('🔔',x,y-sc*.35-Math.sin(frame*.25)*sc*.08);
      ctx.strokeStyle='rgba(240,192,64,.45)'; ctx.lineWidth=Math.max(1,2*s);
      ctx.beginPath(); ctx.arc(x,y-sc*.33,sc*(.55+t*.9),0,Math.PI*2); ctx.stroke();
    } else if(fx.tipo==='imbarco'){
      disegnaCiurmaImbarco(fx,x,y,s,t);
      disegnaFumoPorto(x+18*s,y-10*s,(t+fx.seed)%1,s,fx.seed);
    } else if(fx.tipo==='salpa'){
      disegnaOndeSalpata(x,y,s,1-t*.45);
      disegnaFumoPorto(x-12*s,y-6*s,(t+fx.seed)%1,s,fx.seed);
      ctx.fillStyle='rgba(240,192,64,.85)'; ctx.font=`bold ${Math.max(8,10*s)}px Cinzel,serif`; ctx.textAlign='center';
      ctx.fillText('Molla gli ormeggi!',x,y-34*s-18*s*t);
    } else if(fx.tipo==='rientro'){
      disegnaOndeSalpata(x,y,s,.9);
      ctx.fillStyle='rgba(170,230,255,.9)'; ctx.font=`bold ${Math.max(8,10*s)}px Cinzel,serif`; ctx.textAlign='center';
      ctx.fillText('Rientro al porto',x,y-32*s-14*s*t);
    } else if(fx.tipo==='scarico'){
      disegnaScaricoMerci(fx,x,y,s,t);
      disegnaFumoPorto(x+10*s,y-8*s,(t+fx.seed)%1,s,fx.seed);
    }
    ctx.restore();
  }
  G.portoFx=vivi;
}

function disegnaStatoRaidPorto(nave,nm,s){
  if(!nave || !nm) return;
  if(nave._faseRaid==='raduno'){
    ctx.save();
    ctx.globalAlpha=.8;
    ctx.fillStyle='rgba(0,0,0,.55)';
    const w=88*s,h=18*s,x=nm.x-w/2,y=nm.y-54*s;
    if(ctx.roundRect) ctx.roundRect(x,y,w,h,4*s); else ctx.rect(x,y,w,h);
    ctx.fill();
    ctx.fillStyle='#f0c040'; ctx.font=`bold ${Math.max(7,8*s)}px Cinzel,serif`; ctx.textAlign='center';
    ctx.fillText('CIURMA AL MOLO',nm.x,y+12*s);
    ctx.restore();
  }
}

function disegnaNaviMare(s){
  if(!G.navi||!canvas) return;
  assicuraPortoVivo();
  aggiornaDisegnaEffettiPorto(s);

  for(const nave of G.navi){
    inizializzaNaveMare(nave);
    const nm=_naviMare[nave.id];

    let targetX, targetY, label='';
    if(nave.inMare){
      // Navi in raid: restano su acqua. Usiamo un tile di oceano vicino al bordo
      // invece di una coordinata schermo generica, così non attraversano l'isola.
      if(!nm._raidWater || frame%180===0){
        const porto=puntoPortoVivo();
        const candidates=[];
        for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
          if(tileAcqua(r,c) && (r<3||c<3||r>G.RIGHE-4||c>G.COLS-4)) candidates.push({r,c});
        }
        candidates.sort((a,b)=>heuristica(a.r,a.c,porto.r,porto.c)-heuristica(b.r,b.c,porto.r,porto.c));
        nm._raidWater=candidates[(nave.id*3)%Math.max(1,Math.min(candidates.length,12))] || tileAcquaVicino(porto.r,porto.c);
      }
      const wp=isoProj(nm._raidWater.c,nm._raidWater.r);
      targetX=wp.x; targetY=wp.y+G.ISO_H*s*.7;
      label='⚓ rientra in '+nave.timerRaid+'g';
      nm.x+=(targetX-nm.x)*0.012;
      nm.y+=(targetY-nm.y)*0.012;
      correggiNaveSuAcqua(nm,0.09);
    } else {
      // Navi disponibili: restano fisicamente attraccate al porto/cantiere.
      const slot=slotAttracco(nave);
      const p=isoProj(slot.c,slot.r);
      targetX=p.x;
      targetY=p.y+G.ISO_H*s*.55;
      label='⚓ attraccata';
      if(!nm._dockInit){
        nm.x=targetX+(Math.random()-.5)*30*s;
        nm.y=targetY+(Math.random()-.5)*18*s;
        nm._dockInit=true;
      }
      nm.x+=(targetX-nm.x)*0.045;
      nm.y+=(targetY-nm.y)*0.045;
    }

    if(!nave.inMare) correggiNaveSuAcqua(nm,0.18);

    const onda=Math.sin(frame*0.02+nm.ondaOffset)*5*s;
    const ondaH=Math.cos(frame*0.015+nm.ondaOffset)*3*s;
    const dx=targetX-nm.x, dy=targetY-nm.y, dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>2) nm.angolo=Math.atan2(dy,dx)*0.18+nm.angolo*0.82;

    // Scia solo se in mare o in movimento verso il porto
    if(nave.inMare || dist>12*s){
      ctx.save();
      ctx.globalAlpha=0.18; ctx.strokeStyle='#aaddff'; ctx.lineWidth=3*s;
      ctx.beginPath();
      ctx.moveTo(nm.x,nm.y+onda);
      ctx.quadraticCurveTo(nm.x-40*s,nm.y+onda+8*s,nm.x-80*s,nm.y+onda+4*s);
      ctx.stroke(); ctx.restore();
    } else {
      // Piccolo riflesso da nave ormeggiata
      ctx.save();
      ctx.globalAlpha=.12; ctx.fillStyle='#d6ffff';
      ctx.beginPath(); ctx.ellipse(nm.x+18*s,nm.y+18*s,45*s,8*s,.1,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(nm.x,nm.y+onda);
    ctx.rotate((nave.inMare?nm.angolo*.3:0.05)+Math.sin(frame*0.025+nm.ondaOffset)*0.035);
    disegnaNav(0,ondaH,nave.livCannoni>0?'#5c3e2a':'#5c3a1a',s);
    ctx.restore();

    // Coordinate schermo per picking click/tap nave.
    nave._screenX=nm.x; nave._screenY=nm.y+onda; nave._screenR=Math.max(18,28*s);

    if(s>0.5){
      ctx.save();
      const stato=(typeof statoOperativoNave==='function') ? statoOperativoNave(nave) : null;
      ctx.fillStyle='rgba(0,0,0,0.65)';
      const lw=104*s,lx=nm.x-lw/2,ly=nm.y+onda+28*s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(lx,ly,lw,19*s,3*s); else ctx.rect(lx,ly,lw,19*s);
      ctx.fill();
      ctx.fillStyle='#f0c040'; ctx.font='bold '+(7*s)+'px Cinzel,serif'; ctx.textAlign='center';
      ctx.fillText(nave.nome.substring(0,13),nm.x,ly+7*s);
      ctx.fillStyle=nave.inMare?'#aaddff':'#c8a96e'; ctx.font=(6*s)+'px sans-serif';
      ctx.fillText(stato?`${stato.icona} ${stato.breve}`:label,nm.x,ly+14*s);
      ctx.restore();
    }
    disegnaStatoRaidPorto(nave,nm,s);
  }
}



// ═══════════════════════════════════════
// FASE 2B — SETUP INIZIALE STILE TROPICO 2
// ═══════════════════════════════════════
// Avvio partita: porto + nave attraccata + palazzo del governatore
// collegato da sentieri ad alcuni edifici iniziali.

function tileValidoInsediamento(r,c){
  if(r<1||c<1||r>=G.RIGHE-1||c>=G.COLS-1) return false;
  const t=G.mappa[r]&&G.mappa[r][c];
  return t===T.SABBIA||t===T.ERBA||t===T.FORESTA||t===T.SENTIERO||t===T.PALUDE;
}

function liberaTileInsediamento(r,c){
  if(!tileValidoInsediamento(r,c)) return false;
  G.mappa[r][c] = (G.mappa[r][c]===T.SABBIA) ? T.SABBIA : T.ERBA;
  G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
  G.rocce=G.rocce.filter(x=>!(x.r===r&&x.c===c));
  return true;
}

function improntaLiberaInsediamento(tipo,r,c){
  const celle=(typeof celleEdificio==='function') ? celleEdificio(tipo,r,c) : [{r,c}];
  for(const cell of celle){
    if(!tileValidoInsediamento(cell.r,cell.c)) return false;
    const occupato=(typeof edificioInTile==='function')
      ? edificioInTile(cell.r,cell.c)
      : G.edifici.some(b=>b.r===cell.r&&b.c===cell.c);
    if(occupato) return false;
  }
  return true;
}

function liberaImprontaInsediamento(tipo,r,c){
  const celle=(typeof celleEdificio==='function') ? celleEdificio(tipo,r,c) : [{r,c}];
  for(const cell of celle) liberaTileInsediamento(cell.r,cell.c);
}

function accessoScenarioEdificio(ed,verso=null){
  const celle=(typeof anelloEdificio==='function') ? anelloEdificio(ed) : [{r:ed.r,c:ed.c+1},{r:ed.r+1,c:ed.c}];
  const validi=celle.filter(p=>tileValidoInsediamento(p.r,p.c) && !(typeof edificioInTile==='function' ? edificioInTile(p.r,p.c) : false));
  if(!validi.length) return {r:ed.r,c:ed.c};
  if(verso){
    const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(verso) : verso;
    validi.sort((a,b)=>heuristica(a.r,a.c,centro.r,centro.c)-heuristica(b.r,b.c,centro.r,centro.c));
  }
  return validi[0];
}

function creaSentieroScenario(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  if(typeof edificioInTile==='function' && edificioInTile(r,c)) return false;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME) return false;
  G.mappa[r][c]=T.SENTIERO;
  if(!G.sentieri) G.sentieri=[];
  if(!G.sentieri.some(p=>p.r===r&&p.c===c)) G.sentieri.push({r,c});
  G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
  G.rocce=G.rocce.filter(x=>!(x.r===r&&x.c===c));
  return true;
}

function collegaSentieroScenario(a,b){
  if(!a||!b) return;
  let r=a.r,c=a.c;
  const guard=120;
  for(let i=0;i<guard;i++){
    creaSentieroScenario(r,c);
    if(r===b.r && c===b.c) break;
    const dr=b.r-r, dc=b.c-c;
    // Patch leggibilita: percorso deterministico, completo e senza casualita.
    // Prima il tratto poteva risultare spezzato o poco chiaro fra edifici iniziali.
    if(Math.abs(dc)>=Math.abs(dr) && dc!==0) c += dc>0?1:-1;
    else if(dr!==0) r += dr>0?1:-1;
    else if(dc!==0) c += dc>0?1:-1;
    if(r<1||c<1||r>=G.RIGHE-1||c>=G.COLS-1) break;
  }
  creaSentieroScenario(b.r,b.c);
}

function collegaScenarioTuttiGliEdifici(){
  const scenario=(G.edifici||[]).filter(b=>b.scenario);
  const hub=scenario.find(b=>b.tipo==='governatore') || scenario[0];
  if(!hub) return;
  // Anello/piazzetta attorno a ogni edificio iniziale, così il footprint resta leggibile
  // e i pirati trovano sempre un accesso su sentiero.
  for(const b of scenario){
    const anello=(typeof anelloEdificio==='function') ? anelloEdificio(b) : [{r:b.r,c:b.c+1},{r:b.r+1,c:b.c}];
    for(const p of anello){
      const t=G.mappa[p.r]&&G.mappa[p.r][p.c];
      if(t!==T.OCEANO && t!==T.BASSO && t!==T.FIUME) creaSentieroScenario(p.r,p.c);
    }
  }
  for(const b of scenario){
    if(b===hub) continue;
    collegaSentieroScenario(accessoScenarioEdificio(hub,b), accessoScenarioEdificio(b,hub));
  }
}

function trovaPostoEdificioVicino(base, offsets, tipo='casapirata'){
  for(const [dr,dc] of offsets){
    const r=base.r+dr,c=base.c+dc;
    if(!improntaLiberaInsediamento(tipo,r,c)) continue;
    liberaImprontaInsediamento(tipo,r,c);
    return {r,c};
  }
  // fallback a spirale
  for(let rad=1;rad<=5;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const r=base.r+dr,c=base.c+dc;
      if(!improntaLiberaInsediamento(tipo,r,c)) continue;
      liberaImprontaInsediamento(tipo,r,c);
      return {r,c};
    }
  }
  return {r:base.r,c:base.c};
}

function aggiungiEdificioScenario(tipo,pos){
  if(!ED[tipo]||!pos) return null;
  const esiste=G.edifici.some(b=>b.tipo===tipo && b.r===pos.r && b.c===pos.c);
  if(esiste) return null;
  if(!improntaLiberaInsediamento(tipo,pos.r,pos.c)) return null;
  liberaImprontaInsediamento(tipo,pos.r,pos.c);
  const b={tipo,r:pos.r,c:pos.c,scenario:true};
  G.edifici.push(b);
  return b;
}

function inizializzaScenarioTropico2(){
  // usa il sentiero generato dalla spiaggia verso il centro come spina dorsale iniziale
  const path=(G.sentieri&&G.sentieri.length)?G.sentieri.slice():[];
  const portoPos = path.length ? path[0] : {r:Math.floor(G.RIGHE/2),c:G.COLS-4};
  const palazzoBase = path.length ? path[Math.max(0,Math.floor(path.length*.78))] : {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2)};

  // crea spazio leggibile attorno al palazzo
  for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){
    const r=palazzoBase.r+dr,c=palazzoBase.c+dc;
    if(tileValidoInsediamento(r,c)) liberaTileInsediamento(r,c);
  }

  const palazzo=trovaPostoEdificioVicino(palazzoBase, [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]], 'governatore');
  const porto=trovaPostoEdificioVicino(portoPos, [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1]], 'porto');

  const portoB=aggiungiEdificioScenario('porto', porto);
  const palazzoB=aggiungiEdificioScenario('governatore', palazzo);

  // piazza centrale e strada porto → palazzo
  const accessoPorto=portoB ? accessoScenarioEdificio(portoB,palazzoB) : porto;
  const accessoPalazzo=palazzoB ? accessoScenarioEdificio(palazzoB,portoB) : palazzo;
  collegaSentieroScenario(accessoPorto,accessoPalazzo);
  const piazzaPalazzo=palazzoB && typeof anelloEdificio==='function' ? anelloEdificio(palazzoB) : [];
  if(piazzaPalazzo.length){
    for(const p of piazzaPalazzo) creaSentieroScenario(p.r,p.c);
  }else{
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      if(Math.abs(dr)+Math.abs(dc)<=1) creaSentieroScenario(palazzo.r+dr,palazzo.c+dc);
    }
  }

  // piccolo insediamento già presente, come in Tropico 2: servizi base e produzione iniziale
  const defs=[
    ['taverna',     [[0,-2],[1,-2],[-1,-2],[2,-1],[-2,-1]]],
    ['casapirata',  [[-2,0],[-2,1],[-1,2],[1,2]]],
    ['fattoria',    [[2,0],[2,1],[3,0],[1,2]]],
    ['segheria',    [[0,2],[1,2],[-1,2],[2,2]]],
    ['prigione',    [[-2,-1],[-2,-2],[-1,-2]]],
  ];
  for(const [tipo,offs] of defs){
    const pos=trovaPostoEdificioVicino(palazzo,offs,tipo);
    const b=aggiungiEdificioScenario(tipo,pos);
    if(b) collegaSentieroScenario(
      accessoScenarioEdificio(palazzoB||{tipo:'governatore',r:palazzo.r,c:palazzo.c},b),
      accessoScenarioEdificio(b,palazzoB||{r:palazzo.r,c:palazzo.c})
    );
  }

  // molo e piazza più leggibili: il sentiero deve essere il tessuto connettivo dell'insediamento.
  if(portoB && typeof anelloEdificio==='function'){
    for(const p of anelloEdificio(portoB)) creaSentieroScenario(p.r,p.c);
  }else{
    for(const [dr,dc] of [[0,0],[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]) creaSentieroScenario(porto.r+dr,porto.c+dc);
  }
  for(const b of G.edifici.filter(x=>x.scenario)) collegaEdificioAlSentiero(b);
  collegaScenarioTuttiGliEdifici();

  // posiziona la ciurma iniziale intorno al palazzo, non nel centro astratto della mappa
  G._spawnScenario=(palazzoB && typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(palazzoB) : {r:palazzo.r,c:palazzo.c};
}
