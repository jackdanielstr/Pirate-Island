// Isla del Diablo — rendering/nature.js
// Estratto da 04_renderer_nature.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_NATURE
// ═══════════════════════════════════════
// ── ALBERO ISO — palma tropicale con coordinate iso 2:1 ──
// cx,cy = centro tile, s = ISO_SCALE
function disegnaAlberoIso(cx, cy, scala, tinta, palude, s){
  const h = G.ISO_H * scala * s * 2.2; // altezza visiva
  const tx = cx + h*.08;    // base tronco (leggermente a dx per prospettiva)
  const ty = cy;             // base al centro tile

  // Ombra a terra verso SE (stile Tropico 2)
  ctx.save();
  ctx.globalAlpha = .28;
  ctx.fillStyle = '#001a08';
  ctx.beginPath();
  ctx.ellipse(tx + h*.45, ty + h*.2, h*.42, h*.1, .22, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  if (palude){
    ctx.strokeStyle='#5a7040'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx+h*.04, ty-h*.55); ctx.stroke();
    ctx.fillStyle = `rgba(80,120,60,${.55+tinta*.2})`;
    ctx.beginPath(); ctx.ellipse(tx+h*.04, ty-h*.6, h*.2, h*.12, -.2, 0, Math.PI*2); ctx.fill();
    return;
  }

  const hue = 105 + tinta*25;

  // Tronco — curvo verso dx (prospettiva iso)
  const tg = ctx.createLinearGradient(tx-h*.04, ty, tx+h*.06, ty-h*.4);
  tg.addColorStop(0,'#6b4a1e'); tg.addColorStop(.5,'#8a6228'); tg.addColorStop(1,'#5a3810');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(tx - h*.04, ty);
  ctx.quadraticCurveTo(tx+h*.04, ty-h*.2, tx+h*.06, ty-h*.35);
  ctx.quadraticCurveTo(tx+h*.09, ty-h*.35, tx+h*.07, ty-h*.28);
  ctx.quadraticCurveTo(tx+h*.03, ty-h*.1, tx+h*.03, ty);
  ctx.closePath(); ctx.fill();

  // Anelli tronco
  ctx.strokeStyle='rgba(60,35,8,.3)'; ctx.lineWidth=.7*s;
  for (let i=0; i<4; i++){
    const ay = ty - h*(.06+i*.07);
    ctx.beginPath(); ctx.moveTo(tx+h*.02, ay); ctx.lineTo(tx+h*.08, ay+1*s); ctx.stroke();
  }

  // Fronde — 6 foglie proiettate in iso
  const foglie = [
    {a:-0.3, l:h*.72, w:h*.11, dr:-.22},
    {a:0.55,  l:h*.68, w:h*.1,  dr:.18},
    {a:-1.1,  l:h*.6,  w:h*.09, dr:-.14},
    {a:1.3,   l:h*.62, w:h*.09, dr:.16},
    {a:-1.8,  l:h*.54, w:h*.08, dr:-.09},
    {a:2.1,   l:h*.5,  w:h*.08, dr:.11},
  ];
  const frx = tx+h*.07, fry = ty-h*.33;
  for (const f of foglie){
    const ex = frx + Math.cos(f.a)*f.l;
    const ey = fry + Math.sin(f.a)*f.l*.45; // schiacciato in Y per iso
    const lc = ctx.createLinearGradient(frx,fry,ex,ey);
    lc.addColorStop(0,`hsla(${hue+10},72%,${22+tinta*8}%,1)`);
    lc.addColorStop(.5,`hsla(${hue},68%,${28+tinta*10}%,1)`);
    lc.addColorStop(1,`hsla(${hue-8},60%,${20+tinta*6}%,.7)`);
    ctx.fillStyle = lc;
    const wx = Math.cos(f.a+Math.PI/2)*f.w;
    const wy = Math.sin(f.a+Math.PI/2)*f.w*.45;
    const mx = frx+Math.cos(f.a+f.dr)*f.l*.52;
    const my = fry+Math.sin(f.a+f.dr)*f.l*.24;
    ctx.beginPath();
    ctx.moveTo(frx, fry);
    ctx.quadraticCurveTo(mx+wx, my+wy, ex, ey);
    ctx.quadraticCurveTo(mx-wx*.3, my-wy*.3, frx, fry);
    ctx.fill();
    // nervatura
    ctx.strokeStyle=`rgba(${20+tinta*30|0},${80+tinta*20|0},${15+tinta*10|0},.35)`;
    ctx.lineWidth=.6*s;
    ctx.beginPath(); ctx.moveTo(frx,fry); ctx.quadraticCurveTo(mx,my,ex,ey); ctx.stroke();
  }
  // Noce di cocco
  if (tinta>.55){
    ctx.fillStyle='#5a3a10';
    ctx.beginPath(); ctx.arc(frx+2*s,fry+2*s, h*.05, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#7a5020';
    ctx.beginPath(); ctx.arc(frx+s,fry+s, h*.035, 0, Math.PI*2); ctx.fill();
  }
}

// ── ROCCIA ISO ──
function disegnaRocciaIso(cx, cy, scala, s){
  const w = G.ISO_W * scala * s * .45;
  const h = w * .55;
  const rx = cx + w*.15;  // offset verso destra per prospettiva
  const ry = cy - h*.3;

  // Ombra
  ctx.save(); ctx.globalAlpha=.28; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(rx+w*.35, ry+h*.7, w*.62, h*.18, .15, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Corpo principale — 3 facce iso
  // Tetto
  const gr = ctx.createRadialGradient(rx-w*.2,ry-h*.25,h*.04,rx,ry,w);
  gr.addColorStop(0,'#a09070'); gr.addColorStop(.4,'#756550'); gr.addColorStop(.8,'#504535'); gr.addColorStop(1,'#302820');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(rx, ry, w, h*.55, -.15, 0, Math.PI*2); ctx.fill();

  // Faccia S (più chiara)
  ctx.fillStyle='rgba(180,160,120,.25)';
  ctx.beginPath();
  ctx.moveTo(rx-w*.5, ry+h*.2);
  ctx.lineTo(rx+w*.5, ry+h*.2);
  ctx.lineTo(rx+w*.4, ry+h*.55);
  ctx.lineTo(rx-w*.4, ry+h*.55);
  ctx.closePath(); ctx.fill();

  // Highlight NW
  ctx.strokeStyle='rgba(255,240,200,.18)'; ctx.lineWidth=s;
  ctx.beginPath(); ctx.moveTo(rx-w*.4,ry-h*.2); ctx.quadraticCurveTo(rx-w*.1,ry-h*.4,rx+w*.1,ry-h*.18); ctx.stroke();

  // Bordo scuro base
  ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1.2*s;
  ctx.beginPath(); ctx.ellipse(rx, ry, w, h*.55, -.15, Math.PI*.1, Math.PI*.9); ctx.stroke();
}

// ── AMBIENTE VIVO — piccoli props procedurali su coste, sentieri e vicino agli edifici ──
// Generato in modo deterministico dalla mappa, così non modifica salvataggi né gameplay.
function ambienteKey(){
  const edifici=(G.edifici||[]).map(b=>`${b.tipo}:${b.r},${b.c}`).join('|');
  let m=0;
  for(let r=0;r<G.RIGHE;r+=3){
    for(let c=0;c<G.COLS;c+=3){
      m=(m*31+(G.mappa[r]&&G.mappa[r][c]||0)+r*7+c*11)%1000003;
    }
  }
  return `${G.RIGHE}x${G.COLS}:${m}:${edifici}`;
}

function tileAmbienteLibero(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME||t===T.ROCCIA) return false;
  for(const b of G.edifici||[]){
    const celle=(typeof celleEdificio==='function') ? celleEdificio(b.tipo,b.r,b.c) : [{r:b.r,c:b.c}];
    if(celle.some(x=>x.r===r&&x.c===c)) return false;
  }
  return true;
}

function vicinoATile(r,c,tipi){
  for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const t=G.mappa[r+dr]&&G.mappa[r+dr][c+dc];
    if(tipi.includes(t)) return true;
  }
  return false;
}

function propAmbiente(id,tipo,r,c,scala=1,rot=0,z=0){
  return {id,tipo,r,c,scala,rot,z};
}

function rigeneraAmbienteVivo(){
  G.ambienteProps=[];
  G._ambienteKey=ambienteKey();
  let id=1;

  // Spiagge: relitti minori, conchiglie, alghe, tronchi e casse portate dal mare.
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const t=G.mappa[r][c];
    const h=(salt)=>hash(r,c,salt);
    if(t===T.SABBIA && vicinoATile(r,c,[T.BASSO,T.OCEANO])){
      const n=h(7100)>.66 ? 1+(h(7101)>.86?1:0) : 0;
      for(let i=0;i<n;i++){
        const tipi=['conchiglia','alghe','ciottoli','legno_spiaggia','cassa_rotta'];
        const tipo=tipi[Math.floor(h(7110+i)*tipi.length)%tipi.length];
        G.ambienteProps.push(propAmbiente(id++,tipo,r+(h(7120+i)-.5)*.56,c+(h(7130+i)-.5)*.72,.72+h(7140+i)*.45,h(7150+i)*Math.PI,0.2));
      }
    }

    // Sentieri: sassolini, ciuffi d'erba e tracce irregolari sui bordi.
    if(t===T.SENTIERO && h(7200)>.45){
      const tipi=['erba_bordo','pietre_sentiero','solco_carro'];
      const tipo=tipi[Math.floor(h(7210)*tipi.length)%tipi.length];
      G.ambienteProps.push(propAmbiente(id++,tipo,r+(h(7220)-.5)*.45,c+(h(7230)-.5)*.55,.65+h(7240)*.35,h(7250)*Math.PI,0.15));
    }

    // Erba/foresta/palude: vegetazione bassa per togliere l'effetto griglia vuota.
    if((t===T.ERBA||t===T.FORESTA||t===T.PALUDE) && tileAmbienteLibero(r,c)){
      const chance=t===T.FORESTA?.42:(t===T.PALUDE?.34:.18);
      if(h(7300)<chance){
        const tipi=t===T.PALUDE?['canne','felce','erba_alta']:['cespuglio','felce','erba_alta','bananino'];
        const tipo=tipi[Math.floor(h(7310)*tipi.length)%tipi.length];
        G.ambienteProps.push(propAmbiente(id++,tipo,r+(h(7320)-.5)*.62,c+(h(7330)-.5)*.62,.6+h(7340)*.55,h(7350)*Math.PI,0.1));
      }
    }
  }

  // Clutter vicino agli edifici: casse, sacchi, legna, corde, torce.
  for(const b of G.edifici||[]){
    const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(b) : {r:b.r,c:b.c};
    const quanti=(b.tipo==='porto'||b.tipo==='cantiere')?2:3;
    for(let i=0;i<quanti;i++){
      const h=(salt)=>hash(Math.floor(centro.r*3+i),Math.floor(centro.c*5+i),salt);
      const ang=i*2.15+h(7400)*1.2;
      const rr=Math.round(centro.r+Math.sin(ang)*(1+h(7401)*.9));
      const cc=Math.round(centro.c+Math.cos(ang)*(1+h(7402)*.9));
      if(!tileAmbienteLibero(rr,cc)) continue;
      const tipi=['cassa','barile_piccolo','sacco','legna','corde','torcia'];
      const tipo=tipi[(i+b.r+b.c)%tipi.length];
      G.ambienteProps.push(propAmbiente(id++,tipo,rr+(h(7410)-.5)*.45,cc+(h(7411)-.5)*.45,.62+h(7412)*.45,h(7413)*Math.PI,0.35));
    }
  }
}

function assicuraAmbienteVivo(){
  const k=ambienteKey();
  if(!G.ambienteProps || G._ambienteKey!==k) rigeneraAmbienteVivo();
}

function disegnaPropAmbiente(prop,cx,cy,s){
  const sc=G.ISO_H*s*(prop.scala||1);
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate((prop.rot||0)*0.04);
  ctx.globalAlpha=.2; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(sc*.08,sc*.12,sc*.18,sc*.055,.18,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  switch(prop.tipo){
    case 'conchiglia':
      ctx.fillStyle='#f0dfbb'; ctx.beginPath(); ctx.ellipse(0,-sc*.03,sc*.09,sc*.055,.3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(120,90,55,.35)'; ctx.lineWidth=Math.max(.5,.7*s);
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(0,-sc*.03);ctx.lineTo(i*sc*.055,sc*.015);ctx.stroke();}
      break;
    case 'alghe':
      ctx.strokeStyle='rgba(52,92,42,.75)'; ctx.lineWidth=Math.max(1,1.2*s); ctx.lineCap='round';
      for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo((i-1.5)*sc*.035,sc*.04);ctx.quadraticCurveTo((i-1.2)*sc*.04,-sc*.05,(i-1.7)*sc*.06,-sc*.12);ctx.stroke();}
      break;
    case 'ciottoli':
    case 'pietre_sentiero':
      for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#75684f':'#9a8a6a';ctx.beginPath();ctx.ellipse((i-1.5)*sc*.055,(i%2)*sc*.035,sc*.045,sc*.028,.2,0,Math.PI*2);ctx.fill();}
      break;
    case 'legno_spiaggia':
    case 'legna':
      ctx.fillStyle='#6d451d'; ctx.fillRect(-sc*.18,-sc*.035,sc*.36,sc*.07);
      ctx.fillStyle='#9a6b32'; ctx.fillRect(-sc*.14,-sc*.09,sc*.32,sc*.055);
      ctx.strokeStyle='rgba(45,25,8,.5)'; ctx.strokeRect(-sc*.18,-sc*.035,sc*.36,sc*.07);
      break;
    case 'cassa_rotta':
    case 'cassa':
      ctx.fillStyle='#8a5a25'; ctx.fillRect(-sc*.13,-sc*.12,sc*.26,sc*.22);
      ctx.strokeStyle='#4a2b10'; ctx.lineWidth=Math.max(.6,s); ctx.strokeRect(-sc*.13,-sc*.12,sc*.26,sc*.22);
      ctx.beginPath(); ctx.moveTo(-sc*.12,-sc*.08); ctx.lineTo(sc*.12,sc*.06); ctx.stroke();
      break;
    case 'erba_bordo':
    case 'erba_alta':
      ctx.strokeStyle='rgba(68,120,42,.85)'; ctx.lineWidth=Math.max(1,1.3*s); ctx.lineCap='round';
      for(let i=0;i<7;i++){const x=(i-3)*sc*.032;ctx.beginPath();ctx.moveTo(x,sc*.08);ctx.quadraticCurveTo(x+((i%2)-.5)*sc*.08,-sc*.02,x+((i%3)-1)*sc*.045,-sc*.16);ctx.stroke();}
      break;
    case 'solco_carro':
      ctx.strokeStyle='rgba(65,48,30,.35)'; ctx.lineWidth=Math.max(1.1,1.6*s); ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-sc*.22,-sc*.04);ctx.lineTo(sc*.22,sc*.08);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-sc*.19,sc*.05);ctx.lineTo(sc*.25,sc*.17);ctx.stroke();
      break;
    case 'cespuglio':
    case 'felce':
    case 'canne':
    case 'bananino':{
      const base=prop.tipo==='canne'?'#6f8a42':(prop.tipo==='bananino'?'#4d9a35':'#2f7c2c');
      ctx.fillStyle=base;
      for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse((i-2)*sc*.045,-sc*(.02+i%2*.035),sc*.07,sc*.035,(i-2)*.35,0,Math.PI*2);ctx.fill();}
      if(prop.tipo==='bananino'){
        ctx.strokeStyle='#5c3c16';ctx.lineWidth=Math.max(1,1.2*s);ctx.beginPath();ctx.moveTo(0,sc*.08);ctx.lineTo(0,-sc*.25);ctx.stroke();
      }
      break;
    }
    case 'barile_piccolo':
      ctx.fillStyle='#7a491c';ctx.beginPath();ctx.ellipse(0,-sc*.05,sc*.11,sc*.08,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#9b6429';ctx.fillRect(-sc*.11,-sc*.05,sc*.22,sc*.16);
      ctx.strokeStyle='#3d220c';ctx.strokeRect(-sc*.11,-sc*.05,sc*.22,sc*.16);
      break;
    case 'sacco':
      ctx.fillStyle='#b39b66';ctx.beginPath();ctx.ellipse(0,0,sc*.14,sc*.105,.15,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(65,45,20,.5)';ctx.beginPath();ctx.moveTo(-sc*.06,-sc*.07);ctx.lineTo(sc*.06,-sc*.04);ctx.stroke();
      break;
    case 'corde':
      ctx.strokeStyle='#b6924d';ctx.lineWidth=Math.max(1.2,1.7*s);
      for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,0,sc*(.11+i*.035),sc*(.06+i*.02),.2,0,Math.PI*2);ctx.stroke();}
      break;
    case 'torcia':
      ctx.strokeStyle='#4a2b10';ctx.lineWidth=Math.max(1.2,1.8*s);ctx.beginPath();ctx.moveTo(0,sc*.12);ctx.lineTo(0,-sc*.18);ctx.stroke();
      ctx.fillStyle=`rgba(255,${145+Math.sin(frame*.13+prop.id)*40|0},35,.85)`;ctx.beginPath();ctx.ellipse(0,-sc*.24,sc*.055,sc*.09,0,0,Math.PI*2);ctx.fill();
      break;
  }
  ctx.restore();
}
