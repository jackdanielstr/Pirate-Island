// Isla del Diablo — rendering/tiles.js
// Estratto da 03_renderer_tiles.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_TILES
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// RENDERER TILES — Proiezione Isometrica 2:1
//
// Sistema di coordinate:
//   Griglia (col, row) → Schermo (sx, sy) con:
//   sx = (col - row) * ISO_W/2  + offsetX
//   sy = (col + row) * ISO_H/2  + offsetY
//
// Ogni tile è un rombo (diamond) ISO_W × ISO_H.
// Luce da nord-ovest: faccia N-W illuminata, S-E in ombra.
// ═══════════════════════════════════════════════════

let canvas, ctx;
let frame = 0;
let _tileCache = null;

// ── Converti griglia → schermo (centro del tile) ──
function isoProj(col, row) {
  const s = G.ISO_SCALE;
  const W = G.ISO_W * s, H = G.ISO_H * s;
  return {
    x: G.camX + (col - row) * W / 2,
    y: G.camY + (col + row) * H / 2,
  };
}

// ── Zoom con pivot ──
function applicaZoom(delta, pivotX, pivotY) {
  const oldScale = G.ISO_SCALE;
  G.ISO_SCALE = Math.max(G.ZOOM_MIN||0.35, Math.min(G.ZOOM_MAX||2.5, G.ISO_SCALE * delta));
  if (G.ISO_SCALE === oldScale) return;
  G.zoom = G.ISO_SCALE; // compatibilità con input touch e vecchi riferimenti
  const r = G.ISO_SCALE / oldScale;
  G.camX = pivotX - (pivotX - G.camX) * r;
  G.camY = pivotY - (pivotY - G.camY) * r;
  limiteCamera();
}

// ── Centra la camera sulla mappa ──
function ridimensionaCanvas() {
  const wrap = document.getElementById('mappa-wrap');
  // Fallback se il DOM non è ancora stato ridimensionato (primo frame)
  const w = wrap.clientWidth  || window.innerWidth;
  const h = wrap.clientHeight || window.innerHeight - 90;
  canvas.width  = w;
  canvas.height = h;
  const W = G.ISO_W * G.ISO_SCALE;
  const H = G.ISO_H * G.ISO_SCALE;
  // Centro della griglia in coordinate iso
  const mapCX = (G.COLS - G.RIGHE) * W / 2;
  const mapCY = (G.COLS + G.RIGHE) * H / 2;
  G.camX = canvas.width  / 2 - mapCX / 2;
  G.camY = canvas.height / 2 - mapCY / 2 - H * 2;
  limiteCamera();
  _tileCache = null;
}

// Hash deterministico per variazioni per-tile
function hash(r, c, salt) {
  let v = (r * 2749 + c * 1597 + salt * 3571) & 0xffff;
  v = ((v ^ (v >>> 7)) * 0x45d9f3b) & 0xffff;
  return (v & 0xffff) / 0xffff;
}

// Nota tecnica: la vecchia implementazione di disegnaTileIso/disegnaTransizioni
// e stata rimossa per evitare doppie definizioni. La versione attiva, piu
// pittorica e vicina a Tropico 2, inizia sotto con gli helper del terreno.

// Pass grafico piu vicino a Tropico 2: terreno pittorico, niente griglia visibile,
// sentieri stretti di ghiaia invece di tile interi marroni.
function tilePathIso(cx,cy,W,H){
  const hw=W/2+.75, hh=H/2+.4;
  ctx.beginPath();
  ctx.moveTo(cx,cy-.4);
  ctx.lineTo(cx+hw,cy+hh);
  ctx.lineTo(cx,cy+H+.4);
  ctx.lineTo(cx-hw,cy+hh);
  ctx.closePath();
}

function tileVicino(r,c,tipi){
  for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]){
    const t=G.mappa[r+dr]&&G.mappa[r+dr][c+dc];
    if(tipi.includes(t)) return true;
  }
  return false;
}

function riempiRomboIso(cx,cy,W,H,fill){
  tilePathIso(cx,cy,W,H);
  ctx.fillStyle=fill;
  ctx.fill();
}

function granelliIso(cx,cy,W,H,r,c,s,baseSalt,colore,quantita,alpha=.16){
  const hw=W/2, hh=H/2;
  for(let i=0;i<quantita;i++){
    const a=hash(r,c,baseSalt+i);
    const b=hash(r,c,baseSalt+100+i);
    const x=cx+(a-.5)*W*.78;
    const y=cy+hh*.2+b*hh*1.45;
    ctx.fillStyle=colore(alpha*(.55+hash(r,c,baseSalt+200+i)*.9));
    ctx.beginPath();
    ctx.arc(x,y,(.55+hash(r,c,baseSalt+300+i)*1.25)*s,0,Math.PI*2);
    ctx.fill();
  }
}

function disegnaSentieroOrganico(cx,cy,r,c,W,H,s){
  const hw=W/2, hh=H/2;
  const costa=tileVicino(r,c,[T.SABBIA,T.BASSO,T.OCEANO]);
  const verde=tileVicino(r,c,[T.ERBA,T.FORESTA,T.PALUDE]);
  const base=costa&&!verde
    ? `hsl(${42+hash(r,c,410)*8},42%,${58+hash(r,c,411)*8}%)`
    : `hsl(${88+hash(r,c,412)*13},${32+hash(r,c,413)*12}%,${30+hash(r,c,414)*8}%)`;
  riempiRomboIso(cx,cy,W,H,base);
  granelliIso(cx,cy,W,H,r,c,s,2200,a=>`rgba(50,70,25,${a})`,8,.10);

  const centro={x:cx,y:cy+hh};
  const punti=[
    {dr:-1,dc:0,x:cx+hw*.78,y:cy+hh*.18},
    {dr:1,dc:0,x:cx-hw*.78,y:cy+hh*1.82},
    {dr:0,dc:-1,x:cx-hw*.78,y:cy+hh*.18},
    {dr:0,dc:1,x:cx+hw*.78,y:cy+hh*1.82},
  ];
  const conns=punti.filter(p=>G.mappa[r+p.dr]&&G.mappa[r+p.dr][c+p.dc]===T.SENTIERO);
  const targets=conns.length?conns:punti.slice(0,2);
  ctx.save();
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.strokeStyle=`rgba(${132+hash(r,c,2300)*28|0},${129+hash(r,c,2301)*24|0},${112+hash(r,c,2302)*22|0},.9)`;
  ctx.lineWidth=Math.max(6.5,9.5*s);
  for(const p of targets){
    const j=(hash(r,c,2303+p.dr*9+p.dc*11)-.5)*5*s;
    ctx.beginPath();
    ctx.moveTo(centro.x,centro.y);
    ctx.quadraticCurveTo((centro.x+p.x)/2+j,(centro.y+p.y)/2-j*.35,p.x,p.y);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(228,224,188,.34)';
  ctx.lineWidth=Math.max(2.4,3.1*s);
  for(const p of targets){
    ctx.beginPath();
    ctx.moveTo(centro.x,centro.y);
    ctx.quadraticCurveTo((centro.x+p.x)/2,(centro.y+p.y)/2,p.x,p.y);
    ctx.stroke();
  }
  ctx.restore();

  granelliIso(cx,cy,W,H,r,c,s,2400,a=>`rgba(55,50,38,${a*.85})`,7,.18);
}

function disegnaTileIso(t, cx, cy, r, c) {
  const s=G.ISO_SCALE;
  const W=G.ISO_W*s, H=G.ISO_H*s;
  const hw=W/2, hh=H/2;
  const v=hash(r,c,1);

  switch(t){
    case T.OCEANO:{
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${190+v*1.5},62%,${28+v*1.5}%)`);
      g.addColorStop(.55,`hsl(${196+v*1.5},70%,${23+v*1.5}%)`);
      g.addColorStop(1,`hsl(${204+v*1.5},68%,${16+v}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      ctx.strokeStyle=`rgba(170,230,235,${.08+Math.sin(frame*.017+r*.4+c*.3)*.03})`;
      ctx.lineWidth=Math.max(.6,1*s);
      ctx.beginPath();
      ctx.moveTo(cx-hw*.62,cy+hh*.55);
      ctx.bezierCurveTo(cx-hw*.25,cy+hh*.44,cx+hw*.22,cy+hh*.64,cx+hw*.62,cy+hh*.52);
      ctx.stroke();
      break;
    }
    case T.BASSO:{
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${174+v*2},70%,${48+v*2}%)`);
      g.addColorStop(.65,`hsl(${184+v*2},67%,${40+v*2}%)`);
      g.addColorStop(1,`hsl(${192+v*2},62%,${32+v*1.5}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      granelliIso(cx,cy,W,H,r,c,s,3100,a=>`rgba(230,215,145,${a})`,5,.11);
      break;
    }
    case T.SABBIA:{
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${44+v*1.5},54%,${70+v*1.5}%)`);
      g.addColorStop(.8,`hsl(${39+v*1.5},42%,${60+v*1.6}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      granelliIso(cx,cy,W,H,r,c,s,3200,a=>`rgba(125,95,48,${a})`,9,.13);
      break;
    }
    case T.ERBA:{
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${102+v*2.5},46%,${36+v*1.6}%)`);
      g.addColorStop(.7,`hsl(${112+v*2},50%,${29+v*1.5}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      granelliIso(cx,cy,W,H,r,c,s,3300,a=>`rgba(180,210,95,${a})`,6,.11);
      granelliIso(cx,cy,W,H,r,c,s,3350,a=>`rgba(18,65,22,${a})`,5,.13);
      break;
    }
    case T.FORESTA:{
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${116+v*2},48%,${25+v*1.5}%)`);
      g.addColorStop(.72,`hsl(${126+v*2},46%,${14+v*1.5}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      for(let i=0;i<4;i++){
        ctx.fillStyle=`rgba(20,75,22,${.18+hash(r,c,3400+i)*.16})`;
        ctx.beginPath();
        ctx.ellipse(cx+(hash(r,c,3410+i)-.5)*W*.66,cy+hh*.35+hash(r,c,3420+i)*hh,6*s,3.5*s,hash(r,c,3430+i)*Math.PI,0,Math.PI*2);
        ctx.fill();
      }
      break;
    }
    case T.ROCCIA:
    case T.COLLINA:{
      const rocky=t===T.ROCCIA;
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,rocky?`hsl(38,12%,${46+v*9}%)`:`hsl(38,28%,${48+v*8}%)`);
      g.addColorStop(1,rocky?`hsl(34,16%,${27+v*7}%)`:`hsl(35,24%,${34+v*7}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      granelliIso(cx,cy,W,H,r,c,s,3500,a=>`rgba(45,35,28,${a})`,10,.16);
      break;
    }
    case T.FIUME:{
      riempiRomboIso(cx,cy,W,H,`hsl(138,32%,24%)`);
      ctx.fillStyle=`rgba(35,135,175,.78)`;
      ctx.beginPath();
      ctx.moveTo(cx,cy+hh*.15);ctx.lineTo(cx+hw*.48,cy+hh);ctx.lineTo(cx,cy+hh*1.85);ctx.lineTo(cx-hw*.48,cy+hh);ctx.closePath();
      ctx.fill();
      break;
    }
    case T.SENTIERO:{
      disegnaSentieroOrganico(cx,cy,r,c,W,H,s);
      break;
    }
    case T.PALUDE:{
      riempiRomboIso(cx,cy,W,H,`hsl(${92+v*10},34%,${22+v*5}%)`);
      ctx.fillStyle=`rgba(20,55,45,${.28+v*.12})`;
      ctx.beginPath();ctx.ellipse(cx+(v-.5)*W*.3,cy+hh*.85,W*.16,H*.12,.2,0,Math.PI*2);ctx.fill();
      break;
    }
    default:
      riempiRomboIso(cx,cy,W,H,'#223');
  }
}

function disegnaTransizioni(){
  const s=G.ISO_SCALE, W=G.ISO_W*s, H=G.ISO_H*s, hw=W/2, hh=H/2;
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const tile=G.mappa[r][c];
    const terra=tile!==T.OCEANO&&tile!==T.BASSO&&tile!==T.FIUME;
    if(!terra) continue;
    const p=isoProj(c,r), cx=p.x, cy=p.y;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nt=G.mappa[r+dr]&&G.mappa[r+dr][c+dc];
      if(nt!==T.OCEANO&&nt!==T.BASSO) continue;
      const t=frame*.022+r*.44+c*.29+dr*.8+dc*.55;
      ctx.save();
      ctx.strokeStyle=`rgba(248,244,220,${.20+Math.sin(t)*.05})`;
      ctx.lineWidth=Math.max(1.2,2.2*s);
      ctx.beginPath();
      if(dr===-1){ ctx.moveTo(cx-hw*.48,cy+hh*.47); ctx.quadraticCurveTo(cx,cy+hh*.1,cx+hw*.48,cy+hh*.47); }
      else if(dr===1){ ctx.moveTo(cx-hw*.48,cy+hh*1.53); ctx.quadraticCurveTo(cx,cy+hh*1.9,cx+hw*.48,cy+hh*1.53); }
      else if(dc===-1){ ctx.moveTo(cx-hw*.9,cy+hh); ctx.quadraticCurveTo(cx-hw*.46,cy+hh*.36,cx,cy+hh*.08); }
      else { ctx.moveTo(cx+hw*.9,cy+hh); ctx.quadraticCurveTo(cx+hw*.46,cy+hh*.36,cx,cy+hh*.08); }
      ctx.stroke();
      ctx.restore();
    }
  }
}

function disegnaVelatureTerreno(){
  const s=G.ISO_SCALE, W=G.ISO_W*s, H=G.ISO_H*s, hh=H/2;
  ctx.save();
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const tile=G.mappa[r][c];
    const v=hash(r,c,5100);
    if(v<.36) continue;
    const p=isoProj(c,r);
    const cx=p.x+(hash(r,c,5101)-.5)*W*.45;
    const cy=p.y+hh+(hash(r,c,5102)-.5)*H*.55;
    let fill=null;
    let rx=W*(.42+hash(r,c,5103)*.28);
    let ry=H*(.18+hash(r,c,5104)*.12);
    if(tile===T.ERBA) fill=v>.7?'rgba(112,150,55,.11)':'rgba(32,92,32,.10)';
    else if(tile===T.FORESTA) fill='rgba(18,70,28,.14)';
    else if(tile===T.SABBIA) fill=v>.68?'rgba(238,220,158,.10)':'rgba(172,130,70,.09)';
    else if(tile===T.COLLINA||tile===T.ROCCIA) fill='rgba(96,82,60,.10)';
    else if(tile===T.OCEANO||tile===T.BASSO){
      fill=tile===T.BASSO?'rgba(120,230,210,.08)':'rgba(14,90,130,.10)';
      rx*=1.25; ry*=.9;
    }
    if(!fill) continue;
    ctx.fillStyle=fill;
    ctx.beginPath();
    ctx.ellipse(cx,cy,rx,ry,(hash(r,c,5105)-.5)*.8,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}
