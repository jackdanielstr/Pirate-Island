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
