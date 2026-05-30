// Isla del Diablo — rendering/iso_helpers.js
// Estratto da 05_renderer_iso.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_ISO
// ═══════════════════════════════════════
// ══════════════════════════════════════════════════════
// HELPER ISOMETRICO — prospettiva stile Tropico 2
// Luce da nord-ovest (alto-sinistra)
// Facciata SUD = più chiara, lato EST = in ombra
// ══════════════════════════════════════════════════════

// Disegna un parallelepipedo isometrico (base + facciata sud + lato est)
// bx,by = angolo in basso al centro del tile (punto di ancoraggio)
// w = larghezza, d = profondità, h = altezza (in pixel)
// colTop, colFront, colSide = colori delle tre facce
function isoBoxLegacy(bx,by,w,d,h,colTop,colFront,colSide){
  // Proiezione isometrica semplificata (2:1)
  // angolo base in basso-centro
  const ox=w/2, oz=d/2;
  // 4 vertici della base
  const pts={
    //      x                    y
    nw:[bx-ox,          by-oz*.5-h],   // angolo nord-ovest in alto
    ne:[bx+ox,          by-oz*.5-h],   // angolo nord-est in alto
    se:[bx+ox,          by+oz*.5-h],   // angolo sud-est in alto
    sw:[bx-ox,          by+oz*.5-h],   // angolo sud-ovest in alto
    // basso (y += h)
    bnw:[bx-ox,         by-oz*.5],
    bne:[bx+ox,         by-oz*.5],
    bse:[bx+ox,         by+oz*.5],
    bsw:[bx-ox,         by+oz*.5],
  };

  // Tetto (top)
  ctx.fillStyle=colTop;
  ctx.beginPath();
  ctx.moveTo(pts.nw[0],pts.nw[1]);
  ctx.lineTo(pts.ne[0],pts.ne[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.sw[0],pts.sw[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.6;ctx.stroke();

  // Facciata sud (fronte — più chiara)
  ctx.fillStyle=colFront;
  ctx.beginPath();
  ctx.moveTo(pts.sw[0],pts.sw[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.bse[0],pts.bse[1]);
  ctx.lineTo(pts.bsw[0],pts.bsw[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.7;ctx.stroke();

  // Lato est (in ombra — più scuro)
  ctx.fillStyle=colSide;
  ctx.beginPath();
  ctx.moveTo(pts.ne[0],pts.ne[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.bse[0],pts.bse[1]);
  ctx.lineTo(pts.bne[0],pts.bne[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=.7;ctx.stroke();
}

// Ombra proiettata a terra verso sud-est
function isoShadow(bx,by,w,d){
  ctx.save();
  ctx.globalAlpha=.18;
  ctx.fillStyle='#000';
  ctx.beginPath();
  ctx.ellipse(bx+w*.18,by+d*.28,w*.45,d*.22,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// Tetto a spiovente isometrico (triangolare)
function isoRoof(bx,by,w,d,hBase,hPeak,colLeft,colRight,colFront){
  const ox=w/2, oz=d/2;
  const baseY=by-hBase;
  // Ridge (cresta) al centro
  const rx=bx, ry=baseY-hPeak;
  // Falda sinistra (nord-ovest → ridge)
  ctx.fillStyle=colLeft;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY-oz*.5);
  ctx.lineTo(bx+ox,baseY-oz*.5);
  ctx.lineTo(rx,ry-oz*.5);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=.6;ctx.stroke();
  // Falda destra (sud-est → ridge)
  ctx.fillStyle=colRight;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY+oz*.5);
  ctx.lineTo(bx+ox,baseY+oz*.5);
  ctx.lineTo(rx,ry+oz*.5);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=.6;ctx.stroke();
  // Frontone sud
  ctx.fillStyle=colFront;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY+oz*.5);
  ctx.lineTo(bx+ox,baseY+oz*.5);
  ctx.lineTo(rx,ry+oz*.5);
  ctx.closePath();ctx.fill();

  ctx.save();
  ctx.lineWidth=Math.max(.45,w*.012);
  ctx.strokeStyle='rgba(45,24,10,.34)';
  ctx.beginPath();
  ctx.moveTo(rx,ry-oz*.5);
  ctx.lineTo(rx,ry+oz*.5);
  ctx.stroke();
  for(let i=1;i<=5;i++){
    const t=i/6;
    const lx=bx-ox+w*t;
    ctx.strokeStyle=i%2?'rgba(255,225,150,.16)':'rgba(45,24,10,.22)';
    ctx.beginPath();
    ctx.moveTo(lx,baseY-oz*.5);
    ctx.lineTo(rx+(lx-rx)*.18,ry-oz*.5+hPeak*.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx,baseY+oz*.5);
    ctx.lineTo(rx+(lx-rx)*.18,ry+oz*.5+hPeak*.18);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,230,170,.16)';
  for(let j=1;j<=2;j++){
    const y=baseY+oz*(j*.28-.5);
    ctx.beginPath();
    ctx.moveTo(bx-ox*.75,y);
    ctx.lineTo(bx+ox*.75,y);
    ctx.stroke();
  }
  ctx.restore();
}

// Finestra isometrica su facciata sud
function isoWindow(bx,by,lit,sz){
  sz=sz||8; // dimensione finestra scalabile
  const w=sz,h=sz*.88;
  ctx.fillStyle=lit?'rgba(255,220,100,.9)':'rgba(80,100,120,.6)';
  ctx.fillRect(bx-w/2,by-h,w,h);
  ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.8;ctx.strokeRect(bx-w/2,by-h,w,h);
  if(lit){
    ctx.fillStyle='rgba(255,200,60,.15)';
    ctx.fillRect(bx-w/2-2,by-h-2,w+4,h+3);
    ctx.strokeStyle='rgba(100,60,0,.5)';ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(bx,by-h);ctx.lineTo(bx,by);ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx-w/2,by-h/2);ctx.lineTo(bx+w/2,by-h/2);ctx.stroke();
  }
}

// Override piu isometrico: evita l'effetto "facciata frontale" degli edifici.
function isoBox(bx,by,w,d,h,colTop,colFront,colSide){
  const hw=w/2, hd=d/2;
  const pts={
    topBack:[bx,       by-h-hd],
    topRight:[bx+hw,   by-h-hd*.5],
    topFront:[bx,      by-h],
    topLeft:[bx-hw,    by-h-hd*.5],
    botBack:[bx,       by-hd],
    botRight:[bx+hw,   by-hd*.5],
    botFront:[bx,      by],
    botLeft:[bx-hw,    by-hd*.5],
  };

  ctx.fillStyle=colFront;
  ctx.beginPath();
  ctx.moveTo(pts.topLeft[0],pts.topLeft[1]);
  ctx.lineTo(pts.topFront[0],pts.topFront[1]);
  ctx.lineTo(pts.botFront[0],pts.botFront[1]);
  ctx.lineTo(pts.botLeft[0],pts.botLeft[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.7;ctx.stroke();

  ctx.fillStyle=colSide;
  ctx.beginPath();
  ctx.moveTo(pts.topFront[0],pts.topFront[1]);
  ctx.lineTo(pts.topRight[0],pts.topRight[1]);
  ctx.lineTo(pts.botRight[0],pts.botRight[1]);
  ctx.lineTo(pts.botFront[0],pts.botFront[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=.7;ctx.stroke();

  ctx.fillStyle=colTop;
  ctx.beginPath();
  ctx.moveTo(pts.topBack[0],pts.topBack[1]);
  ctx.lineTo(pts.topRight[0],pts.topRight[1]);
  ctx.lineTo(pts.topFront[0],pts.topFront[1]);
  ctx.lineTo(pts.topLeft[0],pts.topLeft[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.6;ctx.stroke();
}
