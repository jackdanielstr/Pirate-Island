// Isla del Diablo — rendering/atmosphere.js
// Fase 7 — effetti atmosferici puramente grafici: fumo, torce, scintille,
// gabbiani, schiuma portuale e bagliori caldi. Non modifica gameplay/salvataggi.

function _atmoHash(a,b,salt){
  let x = Math.sin((a*127.1 + b*311.7 + salt*74.7)) * 43758.5453;
  return x - Math.floor(x);
}

function _atmoCentroEdificio(b){
  return (typeof centroEdificioGriglia === 'function') ? centroEdificioGriglia(b) : {r:b.r, c:b.c};
}

function _atmoSchermoEdificio(b, s){
  const centro = _atmoCentroEdificio(b);
  const p = isoProj(centro.c, centro.r);
  return {x:p.x, y:p.y + (G.ISO_H*s)/2, centro};
}

function _atmoTipoFumo(tipo){
  return ['forno','fabbro','carpentiere','fonderia','fonderia_cannoni','fabbrica_armi','birrificio','distilleria','segheria','sawmill','taverna','locanda','bettola_contrabbandieri'].includes(tipo);
}

function _atmoTipoScintille(tipo){
  return ['fabbro','fonderia','fonderia_cannoni','fabbrica_armi'].includes(tipo);
}

function _atmoTipoLuce(tipo){
  return ['taverna','locanda','bettola_contrabbandieri','governatore','dormitorio','cappella','prigione','caserma','mercatonero','bordello','infermeria','sarto','bagni'].includes(tipo);
}

function _disegnaFumoAtmosferico(x,y,s,b){
  const seed = (b.r+1)*13 + (b.c+1)*17;
  const phase = frame*.018 + seed;
  const base = G.ISO_H * s;
  const ox = (b.tipo==='fabbro'||b.tipo==='fonderia'||b.tipo==='fonderia_cannoni'||b.tipo==='fabbrica_armi') ? base*.20 : -base*.05;
  const oy = -base*(b.tipo==='governatore'?1.2:.72);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for(let i=0;i<5;i++){
    const t = (phase + i*.27) % 1;
    const px = x + ox + Math.sin(phase*4+i)*base*(.025+i*.01);
    const py = y + oy - t*base*.62 - i*base*.025;
    const r = base*(.055 + t*.08 + i*.006);
    ctx.globalAlpha = Math.max(0, .22*(1-t));
    const gr = ctx.createRadialGradient(px,py,0,px,py,r);
    gr.addColorStop(0,'rgba(230,225,205,.72)');
    gr.addColorStop(.65,'rgba(160,150,130,.28)');
    gr.addColorStop(1,'rgba(160,150,130,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(px,py,r*1.15,r*.75,-.25,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function _disegnaScintilleAtmosferiche(x,y,s,b){
  const base = G.ISO_H*s;
  const seed = b.r*19 + b.c*23;
  ctx.save();
  ctx.lineCap='round';
  for(let i=0;i<6;i++){
    const h = _atmoHash(seed,i,9100);
    const blink = Math.sin(frame*.13 + h*10);
    if(blink < .18) continue;
    const px = x + base*(.08 + h*.22);
    const py = y - base*(.28 + _atmoHash(seed,i,9101)*.25);
    const len = base*(.025 + _atmoHash(seed,i,9102)*.035);
    ctx.globalAlpha = .35 + blink*.45;
    ctx.strokeStyle = i%2 ? 'rgba(255,210,90,.9)' : 'rgba(255,125,45,.9)';
    ctx.lineWidth = Math.max(1, 1.3*s);
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+len, py-len*.45); ctx.stroke();
  }
  ctx.restore();
}

function _disegnaBaglioreEdificio(x,y,s,b){
  const base=G.ISO_H*s;
  const pulse=.74+Math.sin(frame*.035 + b.r*2+b.c)*.10;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.10*pulse;
  const gr=ctx.createRadialGradient(x,y-base*.18,0,x,y-base*.18,base*.75);
  gr.addColorStop(0,'rgba(255,170,70,.65)');
  gr.addColorStop(.52,'rgba(255,120,35,.18)');
  gr.addColorStop(1,'rgba(255,120,35,0)');
  ctx.fillStyle=gr;
  ctx.beginPath(); ctx.ellipse(x,y-base*.18,base*.58,base*.30,-.1,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function _disegnaSchiumaPortuale(x,y,s,b){
  const base=G.ISO_H*s;
  const seed=b.r*31+b.c*37;
  ctx.save();
  ctx.strokeStyle='rgba(220,250,245,.45)';
  ctx.lineWidth=Math.max(1,1.2*s);
  ctx.lineCap='round';
  for(let i=0;i<4;i++){
    const h=_atmoHash(seed,i,9300);
    const wave=Math.sin(frame*.035+i+seed)*base*.018;
    const px=x-base*(.48-h*.96);
    const py=y+base*(.22+i*.055)+wave;
    ctx.globalAlpha=.22+h*.26;
    ctx.beginPath();
    ctx.moveTo(px-base*.18,py);
    ctx.quadraticCurveTo(px,py-base*.035,px+base*.18,py+base*.01);
    ctx.stroke();
  }
  ctx.restore();
}

function _disegnaGabbianiPorto(s){
  const porti=(G.edifici||[]).filter(b=>['porto','cantiere','shipyard'].includes(b.tipo));
  if(!porti.length) return;
  const base=G.ISO_H*s;
  ctx.save();
  ctx.strokeStyle='rgba(245,245,230,.78)';
  ctx.lineWidth=Math.max(1,1.15*s);
  ctx.lineCap='round';
  for(let pidx=0;pidx<porti.length;pidx++){
    const b=porti[pidx];
    const p=_atmoSchermoEdificio(b,s);
    for(let i=0;i<3;i++){
      const t=frame*.006 + i*.33 + pidx*.17;
      const radius=base*(1.05+i*.22);
      const gx=p.x + Math.cos(t*Math.PI*2 + i)*radius;
      const gy=p.y - base*(1.15+i*.12) + Math.sin(t*Math.PI*2*1.3)*base*.16;
      const flap=Math.sin(frame*.18+i)*base*.035;
      ctx.globalAlpha=.45+i*.12;
      ctx.beginPath();
      ctx.moveTo(gx-base*.075,gy+flap);
      ctx.quadraticCurveTo(gx,gy-base*.045,gx+base*.075,gy-flap);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function _disegnaPulviscoloCaldo(s){
  // Leggerissimo pulviscolo luminoso vicino alla zona abitata, quasi invisibile ma dà vita.
  if(!G.edifici || G.edifici.length<3) return;
  const base=G.ISO_H*s;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(255,210,120,.22)';
  const max=Math.min(32, G.edifici.length*2);
  for(let i=0;i<max;i++){
    const b=G.edifici[i%G.edifici.length];
    const p=_atmoSchermoEdificio(b,s);
    const seed=b.r*41+b.c*43+i*7;
    const drift=frame*.004 + _atmoHash(seed,i,9400);
    const px=p.x + (_atmoHash(seed,i,9401)-.5)*base*1.5 + Math.sin(drift*7)*base*.06;
    const py=p.y - base*.15 + (_atmoHash(seed,i,9402)-.5)*base*.9 - (drift%1)*base*.35;
    ctx.globalAlpha=.08 + _atmoHash(seed,i,9403)*.08;
    ctx.beginPath(); ctx.arc(px,py,Math.max(.55,base*.012),0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function disegnaAtmosferaTropico(s){
  if(!ctx || !G || !G.edifici || typeof isoProj!=='function') return;

  for(const b of G.edifici){
    const p=_atmoSchermoEdificio(b,s);
    if(_atmoTipoLuce(b.tipo)) _disegnaBaglioreEdificio(p.x,p.y,s,b);
    if(_atmoTipoFumo(b.tipo)) _disegnaFumoAtmosferico(p.x,p.y,s,b);
    if(_atmoTipoScintille(b.tipo)) _disegnaScintilleAtmosferiche(p.x,p.y,s,b);
    if(['porto','cantiere','shipyard'].includes(b.tipo)) _disegnaSchiumaPortuale(p.x,p.y,s,b);
  }
  _disegnaGabbianiPorto(s);
  _disegnaPulviscoloCaldo(s);
}
