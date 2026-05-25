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
  if(!G.edifici||G.edifici.length===0) return;
  const IH=G.ISO_H*s, IW=G.ISO_W*s;
  const alture={fortezza:2.2,guardia:2.8,osservatorio:2.5,cantiere:1.8,cappella:2.3,caserma:1.6};

  for(const b of G.edifici){
    const p=isoProj(b.c,b.r);
    const cx=p.x, cy=p.y+IH*0.5;
    const altH=(alture[b.tipo]||1.2)*IH;
    const ix=cx, iy=cy-altH;
    const prod=EDIFICIO_PRODUZIONE[b.tipo];
    const schiaviQui=(G.schiavi||[]).filter(sv=>sv.edificioR===b.r&&sv.edificioC===b.c).length;

    ctx.save();
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

    // Indicatore rete sentieri: verde = collegato a porto/palazzo, giallo = strada vicina,
    // rosso = isolato. Piccolo, ma rende chiaro che i sentieri contano davvero.
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
}

function apriPopupEdificio(edificio){
  const def=ED[edificio.tipo];
  if(!def) return;
  const prod=EDIFICIO_PRODUZIONE[edificio.tipo];
  const schiaviQui=(G.schiavi||[]).filter(s=>s.edificioR===edificio.r&&s.edificioC===edificio.c);
  const accettaSchiavi=typeof LAVORO_SCHIAVI!=='undefined'&&!!LAVORO_SCHIAVI[edificio.tipo];
  const lav=accettaSchiavi?LAVORO_SCHIAVI[edificio.tipo]:null;

  let h='<div style="text-align:center;margin-bottom:12px">';
  h+='<div style="font-size:2.5rem">'+def.icona+'</div>';
  h+='<div style="font-family:\'Pirata One\',cursive;color:var(--oro);font-size:1.2rem">'+def.nome+'</div>';
  h+='<div style="font-size:.72rem;color:var(--sabbia);font-style:italic;margin-top:3px">'+def.effetto+'</div>';
  h+='</div>';

  if(typeof efficienzaStradaEdificio==='function' && edificio.tipo!=='governatore'){
    const eff=efficienzaStradaEdificio(edificio);
    const stato=eff>=1?'Collegato al porto/palazzo':eff>=0.7?'Sentiero vicino, ma rete incompleta':'Isolato: produzione ridotta';
    const colore=eff>=1?'#4fc04f':eff>=0.7?'#f0c040':'#c0392b';
    h+='<div style="background:rgba(255,255,255,.05);border:1px solid '+colore+'66;';
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

  h+='<div style="display:flex;gap:6px;margin-top:10px">';
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

const PORTO_PROPS_TIPI = ['cassa','botte','rete','palo','corda','lanterna','barile'];
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
  if(porto) return {r:porto.r,c:porto.c,tipo:porto.tipo};
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

function slotAttracco(nave){
  const porto=puntoPortoVivo();
  const acqua=tileAcquaVicino(porto.r,porto.c);
  const i=(nave.id||0)%4;
  const offsets=[
    {dc:-.15,dr:.05},{dc:.35,dr:.15},{dc:-.45,dr:.35},{dc:.15,dr:.55}
  ][i];
  return {
    r:acqua.r+0.5+offsets.dr,
    c:acqua.c+0.5+offsets.dc,
    portoR:porto.r,
    portoC:porto.c,
  };
}

function rigeneraPortoVivo(){
  G.portoProps = [];
  const basi = G.edifici.filter(b=>b.tipo==='porto'||b.tipo==='cantiere');
  if(basi.length===0){
    const p=puntoPortoVivo();
    basi.push({r:p.r,c:p.c,tipo:p.tipo||'spiaggia'});
  }

  let id=1;
  for(const b of basi){
    const quantita = b.tipo==='porto' ? 18 : 10;
    for(let i=0;i<quantita;i++){
      const ang = i*1.77 + hashPorto(b.r*31+b.c*17+i)*.7;
      const rad = .35 + hashPorto(i*13+b.r)*1.25;
      const rr = b.r + 0.5 + Math.sin(ang)*rad*.72;
      const cc = b.c + 0.5 + Math.cos(ang)*rad;
      const tr=Math.max(0,Math.min(G.RIGHE-1,Math.floor(rr)));
      const tc=Math.max(0,Math.min(G.COLS-1,Math.floor(cc)));
      const t=G.mappa[tr]&&G.mappa[tr][tc];
      if(t===T.OCEANO||t===T.BASSO||t===T.FIUME) continue;
      G.portoProps.push({
        id:id++,
        tipo:PORTO_PROPS_TIPI[(i + b.r + b.c) % PORTO_PROPS_TIPI.length],
        r:rr,c:cc,
        scala:.75+hashPorto(i*19+b.c)*.55,
        rot:hashPorto(i*23+b.r)*Math.PI,
        vicino:b.tipo
      });
    }

    // Paletti e lanterne lungo il lato mare
    const acqua=tileAcquaVicino(b.r,b.c);
    for(let j=0;j<4;j++){
      G.portoProps.push({
        id:id++,
        tipo:j%2===0?'palo':'lanterna',
        r:b.r+0.2+j*.18,
        c:b.c+0.15+(acqua.c>b.c?.7:-.7),
        scala:1,
        rot:0,
        vicino:'molo'
      });
    }
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

function disegnaNaviMare(s){
  if(!G.navi||!canvas) return;
  assicuraPortoVivo();

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

    if(s>0.5){
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.65)';
      const lw=94*s,lx=nm.x-lw/2,ly=nm.y+onda+28*s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(lx,ly,lw,16*s,3*s); else ctx.rect(lx,ly,lw,16*s);
      ctx.fill();
      ctx.fillStyle='#f0c040'; ctx.font='bold '+(7*s)+'px Cinzel,serif'; ctx.textAlign='center';
      ctx.fillText(nave.nome.substring(0,12),nm.x,ly+7*s);
      ctx.fillStyle=nave.inMare?'#aaddff':'#c8a96e'; ctx.font=(6*s)+'px sans-serif';
      ctx.fillText(label,nm.x,ly+13*s);
      ctx.restore();
    }
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

function creaSentieroScenario(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME) return;
  G.mappa[r][c]=T.SENTIERO;
  G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
  G.rocce=G.rocce.filter(x=>!(x.r===r&&x.c===c));
}

function collegaSentieroScenario(a,b){
  let r=a.r,c=a.c;
  const guard=80;
  for(let i=0;i<guard;i++){
    creaSentieroScenario(r,c);
    if(r===b.r && c===b.c) break;
    const dr=b.r-r, dc=b.c-c;
    // sentiero coloniale leggibile: prima diagonale, poi assi cardinali
    if(Math.abs(dc)>0 && Math.abs(dr)>0 && Math.random()<0.58){
      c += dc>0?1:-1;
      r += dr>0?1:-1;
    } else if(Math.abs(dc)>=Math.abs(dr)) c += dc>0?1:-1;
    else r += dr>0?1:-1;
    if(r<1||c<1||r>=G.RIGHE-1||c>=G.COLS-1) break;
  }
}

function trovaPostoEdificioVicino(base, offsets){
  for(const [dr,dc] of offsets){
    const r=base.r+dr,c=base.c+dc;
    if(!tileValidoInsediamento(r,c)) continue;
    if(G.edifici.some(b=>b.r===r&&b.c===c)) continue;
    liberaTileInsediamento(r,c);
    return {r,c};
  }
  // fallback a spirale
  for(let rad=1;rad<=5;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const r=base.r+dr,c=base.c+dc;
      if(!tileValidoInsediamento(r,c)) continue;
      if(G.edifici.some(b=>b.r===r&&b.c===c)) continue;
      liberaTileInsediamento(r,c);
      return {r,c};
    }
  }
  return {r:base.r,c:base.c};
}

function aggiungiEdificioScenario(tipo,pos){
  if(!ED[tipo]||!pos) return null;
  const esiste=G.edifici.some(b=>b.tipo===tipo && b.r===pos.r && b.c===pos.c);
  if(esiste) return null;
  liberaTileInsediamento(pos.r,pos.c);
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

  const palazzo=trovaPostoEdificioVicino(palazzoBase, [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]);
  const porto=trovaPostoEdificioVicino(portoPos, [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1]]);

  aggiungiEdificioScenario('porto', porto);
  aggiungiEdificioScenario('governatore', palazzo);

  // piazza centrale e strada porto → palazzo
  collegaSentieroScenario(porto,palazzo);
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(Math.abs(dr)+Math.abs(dc)<=1) creaSentieroScenario(palazzo.r+dr,palazzo.c+dc);
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
    const pos=trovaPostoEdificioVicino(palazzo,offs);
    const b=aggiungiEdificioScenario(tipo,pos);
    if(b) collegaSentieroScenario(palazzo,pos);
  }

  // molo e piazza più leggibili: il sentiero deve essere il tessuto connettivo dell'insediamento.
  for(const [dr,dc] of [[0,0],[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]) creaSentieroScenario(porto.r+dr,porto.c+dc);
  for(const b of G.edifici.filter(x=>x.scenario)) collegaEdificioAlSentiero(b);

  // posiziona la ciurma iniziale intorno al palazzo, non nel centro astratto della mappa
  G._spawnScenario={r:palazzo.r,c:palazzo.c};
}
