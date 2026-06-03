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
      // Beta 3.1 — mare tropicale più uniforme: la griglia resta isometrica,
      // ma il colore non deve più sembrare una scacchiera.
      const oceanPatch=hash(Math.floor(r/4),Math.floor(c/4),7600);
      const slow=hash(Math.floor((r+c)/5),Math.floor((c-r)/5),7601);
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${195+oceanPatch*1.4},56%,${31+slow*1.2}%)`);
      g.addColorStop(.62,`hsl(${200+oceanPatch},58%,${25+slow*.9}%)`);
      g.addColorStop(1,`hsl(${206+oceanPatch},60%,${19+slow*.7}%)`);
      riempiRomboIso(cx,cy,W,H,g);

      // Onde larghe e morbide, spezzate su più tile: meno pattern per-cella.
      const swell=Math.sin(frame*.006 + r*.13 + c*.09);
      if(hash(Math.floor(r/2),Math.floor(c/2),7610)>.18){
        ctx.fillStyle=`rgba(100,198,210,${.028+swell*.008})`;
        ctx.beginPath();
        ctx.ellipse(
          cx+(hash(r,c,7611)-.5)*W*.42,
          cy+hh+(hash(r,c,7612)-.5)*H*.24,
          W*(.46+hash(r,c,7613)*.20),
          H*(.13+hash(r,c,7614)*.04),
          (hash(r,c,7615)-.5)*.55,
          0,Math.PI*2
        );
        ctx.fill();
      }

      // Riflessi sottili, non contorni di tile.
      if(hash(r,c,7620)>.72){
        ctx.strokeStyle=`rgba(188,232,225,${.030+Math.max(0,swell)*.018})`;
        ctx.lineWidth=Math.max(.35,.55*s);
        ctx.beginPath();
        ctx.moveTo(cx-hw*.40,cy+hh*.62);
        ctx.bezierCurveTo(cx-hw*.12,cy+hh*.54,cx+hw*.12,cy+hh*.66,cx+hw*.40,cy+hh*.58);
        ctx.stroke();
      }
      break;
    }
    case T.BASSO:{
      // Acqua bassa caraibica: più chiara vicino alla riva e più sabbiosa.
      const lag=hash(Math.floor(r/3),Math.floor(c/3),7700);
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${178+lag*1.4},64%,${53+lag*1.0}%)`);
      g.addColorStop(.56,`hsl(${185+lag},62%,${45+lag*.9}%)`);
      g.addColorStop(1,`hsl(${194+lag},57%,${36+lag*.8}%)`);
      riempiRomboIso(cx,cy,W,H,g);

      // Sabbia vista attraverso l'acqua bassa.
      ctx.fillStyle=`rgba(238,218,145,${.070+hash(r,c,7710)*.045})`;
      ctx.beginPath();
      ctx.ellipse(cx+(hash(r,c,7711)-.5)*W*.44,cy+hh*1.03,W*.30,H*.10,(hash(r,c,7712)-.5)*.7,0,Math.PI*2);
      ctx.fill();

      // Piccole increspature chiare.
      if(hash(r,c,7720)>.48){
        ctx.strokeStyle=`rgba(229,251,239,${.055+Math.sin(frame*.012+r*.2+c*.11)*.018})`;
        ctx.lineWidth=Math.max(.45,.70*s);
        ctx.beginPath();
        ctx.moveTo(cx-hw*.36,cy+hh*.72);
        ctx.quadraticCurveTo(cx,cy+hh*.63,cx+hw*.36,cy+hh*.72);
        ctx.stroke();
      }
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
      // Prato tropicale con variazioni morbide, non quadrato uniforme.
      const patch=hash(Math.floor(r/2),Math.floor(c/2),1800);
      const g=ctx.createLinearGradient(cx-hw,cy,cx+hw,cy+H);
      g.addColorStop(0,`hsl(${101+patch*4},45%,${35+patch*3}%)`);
      g.addColorStop(.55,`hsl(${110+patch*4},48%,${30+patch*3}%)`);
      g.addColorStop(1,`hsl(${116+patch*3},45%,${25+patch*2}%)`);
      riempiRomboIso(cx,cy,W,H,g);
      // Macchie di giungla bassa/felci per dare la sensazione di isola caraibica.
      if(hash(r,c,1810)>.34){
        ctx.fillStyle=`rgba(24,84,28,${.10+hash(r,c,1811)*.09})`;
        ctx.beginPath();
        ctx.ellipse(cx+(hash(r,c,1812)-.5)*W*.52,cy+hh+(hash(r,c,1813)-.5)*H*.52,W*(.16+hash(r,c,1814)*.18),H*(.07+hash(r,c,1815)*.08),(hash(r,c,1816)-.5)*1.2,0,Math.PI*2);
        ctx.fill();
      }
      granelliIso(cx,cy,W,H,r,c,s,3300,a=>`rgba(190,220,105,${a})`,7,.10);
      granelliIso(cx,cy,W,H,r,c,s,3350,a=>`rgba(12,58,20,${a})`,7,.12);
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
      const t=frame*.018+r*.37+c*.23+dr*.8+dc*.55;
      ctx.save();

      // Fascia chiara di acqua bassa/sabbia bagnata prima della schiuma.
      ctx.strokeStyle=`rgba(132,226,210,${nt===T.BASSO?.10:.075})`;
      ctx.lineWidth=Math.max(3.0,5.0*s);
      ctx.lineCap='round';
      ctx.beginPath();
      if(dr===-1){ ctx.moveTo(cx-hw*.54,cy+hh*.45); ctx.quadraticCurveTo(cx,cy+hh*.04,cx+hw*.54,cy+hh*.45); }
      else if(dr===1){ ctx.moveTo(cx-hw*.54,cy+hh*1.55); ctx.quadraticCurveTo(cx,cy+hh*1.96,cx+hw*.54,cy+hh*1.55); }
      else if(dc===-1){ ctx.moveTo(cx-hw*.92,cy+hh); ctx.quadraticCurveTo(cx-hw*.46,cy+hh*.34,cx,cy+hh*.06); }
      else { ctx.moveTo(cx+hw*.92,cy+hh); ctx.quadraticCurveTo(cx+hw*.46,cy+hh*.34,cx,cy+hh*.06); }
      ctx.stroke();

      // Schiuma irregolare e meno geometrica.
      ctx.strokeStyle=`rgba(250,246,220,${.18+Math.sin(t)*.045})`;
      ctx.lineWidth=Math.max(1.15,2.25*s);
      ctx.beginPath();
      const wob=Math.sin(t*1.7)*hh*.08;
      if(dr===-1){ ctx.moveTo(cx-hw*.46,cy+hh*.47+wob*.2); ctx.bezierCurveTo(cx-hw*.18,cy+hh*.22-wob,cx+hw*.14,cy+hh*.34+wob,cx+hw*.46,cy+hh*.47-wob*.15); }
      else if(dr===1){ ctx.moveTo(cx-hw*.46,cy+hh*1.53-wob*.2); ctx.bezierCurveTo(cx-hw*.16,cy+hh*1.78+wob,cx+hw*.16,cy+hh*1.66-wob,cx+hw*.46,cy+hh*1.53+wob*.15); }
      else if(dc===-1){ ctx.moveTo(cx-hw*.88,cy+hh+wob*.1); ctx.bezierCurveTo(cx-hw*.58,cy+hh*.55,cx-hw*.28,cy+hh*.30+wob,cx-hw*.02,cy+hh*.10); }
      else { ctx.moveTo(cx+hw*.88,cy+hh-wob*.1); ctx.bezierCurveTo(cx+hw*.58,cy+hh*.55,cx+hw*.28,cy+hh*.30-wob,cx+hw*.02,cy+hh*.10); }
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
    if(tile===T.ERBA) fill=v>.68?'rgba(132,168,58,.13)':'rgba(22,86,28,.13)';
    else if(tile===T.FORESTA) fill='rgba(10,62,24,.18)';
    else if(tile===T.SABBIA) fill=v>.68?'rgba(238,220,158,.12)':'rgba(164,126,66,.11)';
    else if(tile===T.COLLINA||tile===T.ROCCIA) fill='rgba(96,82,60,.10)';
    else if(tile===T.OCEANO||tile===T.BASSO){
      fill=tile===T.BASSO?'rgba(146,232,210,.09)':'rgba(30,116,145,.055)';
      rx*=1.95; ry*=1.18;
    }
    if(!fill) continue;
    ctx.fillStyle=fill;
    ctx.beginPath();
    ctx.ellipse(cx,cy,rx,ry,(hash(r,c,5105)-.5)*.8,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}
