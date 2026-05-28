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

// ── Disegna un tile a rombo isometrico ──
// (cx,cy) = centro in alto del rombo (punto più alto)
function disegnaTileIso(t, cx, cy, r, c) {
  const s  = G.ISO_SCALE;
  const W  = G.ISO_W * s;   // larghezza rombo
  const H  = G.ISO_H * s;   // altezza rombo
  const hw = W / 2, hh = H / 2;

  // Percorso rombo: top → right → bottom → left
  ctx.beginPath();
  ctx.moveTo(cx,      cy);       // top
  ctx.lineTo(cx + hw, cy + hh);  // right
  ctx.lineTo(cx,      cy + H);   // bottom
  ctx.lineTo(cx - hw, cy + hh);  // left
  ctx.closePath();

  switch (t) {

    case T.OCEANO: {
      // Acqua caraibica più leggibile: profondità, onde morbide e riflessi.
      const v = hash(r, c, 1);
      const f1 = frame * .018 + c * .58 + r * .34;
      const f2 = frame * .011 + c * .21 - r * .47;
      const hue = 194 + v * 10;
      const light = 22 + v * 7 + Math.sin(f1) * 2.4;
      ctx.fillStyle = `hsl(${hue}, 76%, ${light}%)`;
      ctx.fill();

      // Velatura turchese centrale per effetto mare tropicale non piatto.
      const grad = ctx.createLinearGradient(cx - hw, cy, cx + hw, cy + H);
      grad.addColorStop(0, `rgba(85,210,225,${.10 + v*.04})`);
      grad.addColorStop(.45, `rgba(30,145,190,${.08 + v*.035})`);
      grad.addColorStop(1, `rgba(0,40,80,${.12 + v*.05})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();

      // Riflesso a rombo, più sottile e variabile.
      const shimmer = .045 + Math.sin(f2) * .025;
      ctx.fillStyle = `rgba(205,255,245,${shimmer})`;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .46, cy + hh * .46);
      ctx.lineTo(cx - hw * .06, cy + hh * .22);
      ctx.lineTo(cx + hw * .34, cy + hh * .55);
      ctx.lineTo(cx - hw * .16, cy + hh * .82);
      ctx.closePath(); ctx.fill();

      // Due piccole increspature animate, in stile Tropico 2/HD leggero.
      ctx.lineWidth = Math.max(.75, 1.05 * s);
      ctx.strokeStyle = `rgba(185,245,255,${.13 + Math.sin(f1) * .045})`;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .72, cy + hh * .55 + Math.sin(f1) * 1.8 * s);
      ctx.bezierCurveTo(
        cx - hw * .28, cy + hh * .43 + Math.sin(f1+1)*2.2*s,
        cx + hw * .18, cy + hh * .48 - Math.sin(f1+2)*2.2*s,
        cx + hw * .68, cy + hh * .57 + Math.sin(f1+3)*1.8*s
      );
      ctx.stroke();
      if (v > .43) {
        ctx.strokeStyle = `rgba(220,255,255,${.08 + Math.sin(f2) * .035})`;
        ctx.beginPath();
        ctx.moveTo(cx - hw * .44, cy + hh * 1.18 + Math.sin(f2)*1.4*s);
        ctx.bezierCurveTo(cx - hw*.12, cy+hh*1.05, cx+hw*.15, cy+hh*1.25, cx+hw*.48, cy+hh*1.12);
        ctx.stroke();
      }
      break;
    }

    case T.BASSO: {
      // Acqua bassa più luminosa: laguna, coralli e sabbia visibile sotto.
      const sv = hash(r, c, 9);
      const fb = frame*.016 + c*.48 + r*.28;
      ctx.fillStyle = `hsl(${176+sv*12}, ${70+sv*12}%, ${38+sv*9}%)`;
      ctx.fill();

      const lagoon = ctx.createLinearGradient(cx-hw, cy, cx+hw, cy+H);
      lagoon.addColorStop(0, `rgba(170,255,225,${.18+sv*.07})`);
      lagoon.addColorStop(.55, `rgba(65,205,205,${.20+sv*.06})`);
      lagoon.addColorStop(1, `rgba(20,95,135,${.18+sv*.05})`);
      ctx.fillStyle = lagoon;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();

      // Chiazze sabbiose sott'acqua.
      for (let i = 0; i < 2; i++) {
        const sx = cx + (hash(r,c,i+880)-.5)*W*.58;
        const sy = cy + hh*.55 + hash(r,c,i+890)*hh*.85;
        ctx.fillStyle = `rgba(235,210,145,${.11+hash(r,c,i+900)*.07})`;
        ctx.beginPath();
        ctx.ellipse(sx, sy, (5+hash(r,c,i+901)*8)*s, (2.5+hash(r,c,i+902)*4)*s, .25, 0, Math.PI*2);
        ctx.fill();
      }

      // Coralli più piccoli, meno rumorosi.
      for (let i = 0; i < 3; i++) {
        const hx = cx + (hash(r,c,i+300)-.5)*W*.62;
        const hy = cy + hh * .45 + hash(r,c,i+310)*hh*.82;
        const col = hash(r,c,i+320);
        ctx.fillStyle = col>.62 ? `rgba(242,155,90,${.13+col*.08})`
                                : `rgba(170,70,90,${.10+col*.07})`;
        ctx.beginPath();
        ctx.arc(hx, hy, (1.4+col*2.4)*s, 0, Math.PI*2);
        ctx.fill();
      }

      // Increspature chiare.
      ctx.strokeStyle = `rgba(220,255,242,${.18+Math.sin(fb)*.07})`;
      ctx.lineWidth = Math.max(.7, s);
      ctx.beginPath();
      ctx.moveTo(cx-hw*.6, cy+hh*.6+Math.sin(fb)*1.8*s);
      ctx.bezierCurveTo(cx-hw*.2,cy+hh*.5, cx+hw*.2,cy+hh*.6, cx+hw*.6,cy+hh*.6+Math.sin(fb+2)*1.8*s);
      ctx.stroke();
      break;
    }

    case T.SABBIA: {
      const sv = hash(r, c, 2);
      const r1=215+sv*25|0, g1=190+sv*20|0, b1=130+sv*20|0;
      ctx.fillStyle = `rgb(${r1},${g1},${b1})`;
      ctx.fill();
      // illuminazione NW (top face più chiara)
      ctx.fillStyle = `rgba(255,250,220,${.12+sv*.06})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.8, cy+hh*.8);
      ctx.lineTo(cx, cy+H*.6);
      ctx.lineTo(cx+hw*.2, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      // granuli
      for (let i=0; i<6; i++) {
        const gx=cx+(hash(r,c,i+10)-.5)*W*.8;
        const gy=cy+hh*.3+hash(r,c,i+20)*hh*1.2;
        const gv=hash(r,c,i+30);
        ctx.fillStyle=`rgba(${160+gv*60|0},${130+gv*40|0},${80+gv*40|0},${.12+gv*.1})`;
        ctx.beginPath(); ctx.arc(gx,gy,(0.8+gv*1.5)*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }

    case T.ERBA: {
      const ev = hash(r, c, 3);
      const hue = 108 + ev*12;
      ctx.fillStyle = `hsl(${hue},${52+ev*18}%,${30+ev*10}%)`;
      ctx.fill();
      // NW highlight
      ctx.fillStyle = `hsla(${hue+10},60%,${50+ev*10}%,${.12+ev*.06})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.9, cy+hh*.9);
      ctx.lineTo(cx-hw*.1, cy+H*.85);
      ctx.lineTo(cx+hw*.4, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      // ciuffi
      ctx.lineWidth = s * .9;
      for (let i=0; i<5; i++) {
        const gx=cx+(hash(r,c,i+50)-.5)*W*.7;
        const gy=cy+hh*.3+hash(r,c,i+60)*hh*1.3;
        const gh=(4+hash(r,c,i+70)*5)*s;
        ctx.strokeStyle=`hsla(${hue+15},${50+ev*20}%,${44+ev*12}%,.55)`;
        ctx.beginPath();
        ctx.moveTo(gx,gy);
        ctx.lineTo(gx+(hash(r,c,i+80)-.5)*3*s, gy-gh);
        ctx.stroke();
      }
      break;
    }

    case T.FORESTA: {
      const fv = hash(r, c, 4);
      ctx.fillStyle = `hsl(${118+fv*10},${58+fv*14}%,${14+fv*8}%)`;
      ctx.fill();
      // sottobosco scuro
      ctx.fillStyle = `rgba(0,15,5,${.15+fv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      // chiazze
      for (let i=0; i<3; i++) {
        const bv=hash(r,c,i+100);
        ctx.fillStyle=`hsla(${115+bv*20},${50+bv*20}%,${12+bv*14}%,${.25+bv*.18})`;
        ctx.beginPath();
        ctx.arc(cx+(hash(r,c,i+90)-.5)*W*.6, cy+hh*.4+hash(r,c,i+95)*hh, (4+bv*7)*s, 0,Math.PI*2);
        ctx.fill();
      }
      break;
    }

    case T.ROCCIA: {
      const rv = hash(r, c, 5);
      ctx.fillStyle = `rgb(${70+rv*22|0},${60+rv*18|0},${50+rv*14|0})`;
      ctx.fill();
      // highlight NW
      ctx.fillStyle = `rgba(160,140,110,${.1+rv*.07})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.8, cy+hh*.8);
      ctx.lineTo(cx, cy+H*.5);
      ctx.closePath(); ctx.fill();
      break;
    }

    case T.COLLINA: {
      const cv = hash(r, c, 6);
      ctx.fillStyle = `rgb(${118+cv*22|0},${100+cv*18|0},${72+cv*14|0})`;
      ctx.fill();
      // luce forte NW
      ctx.fillStyle = `rgba(255,240,180,${.18+cv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.85, cy+hh*.85);
      ctx.lineTo(cx-hw*.1, cy+H*.8);
      ctx.lineTo(cx+hw*.3, cy+hh*.35);
      ctx.closePath(); ctx.fill();
      // ombra SE
      ctx.fillStyle = `rgba(0,0,20,${.2+cv*.1})`;
      ctx.beginPath();
      ctx.moveTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H);
      ctx.lineTo(cx-hw*.2, cy+H*.9);
      ctx.lineTo(cx+hw*.7, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      break;
    }

    case T.FIUME: {
      ctx.fillStyle = '#2a6040';
      ctx.fill();
      const ff = frame*.022 + c*.45 + r*.32;
      ctx.fillStyle = `rgba(40,140,200,${.84+Math.sin(ff)*.06})`;
      ctx.beginPath();
      const fw=hw*.72, fh=hh*.72;
      ctx.moveTo(cx,      cy+hh-fh);
      ctx.lineTo(cx+fw,   cy+hh);
      ctx.lineTo(cx,      cy+hh+fh);
      ctx.lineTo(cx-fw,   cy+hh);
      ctx.closePath(); ctx.fill();
      // corrente
      ctx.strokeStyle=`rgba(200,240,255,${.2+Math.sin(ff*1.4)*.1})`;
      ctx.lineWidth=1.2*s;
      ctx.beginPath();
      ctx.moveTo(cx-fw*.7, cy+hh+Math.sin(ff)*2*s);
      ctx.bezierCurveTo(cx-fw*.2,cy+hh*.8, cx+fw*.2,cy+hh+.5, cx+fw*.7,cy+hh+Math.sin(ff+2)*2*s);
      ctx.stroke();
      break;
    }

    case T.SENTIERO: {
      const pv = hash(r, c, 7);
      // Strada più importante e leggibile: base battuta + bordi consumati.
      ctx.fillStyle = `rgb(${158+pv*18|0},${122+pv*12|0},${68+pv*8|0})`;
      ctx.fill();
      ctx.fillStyle = `rgba(230,190,105,${.28+pv*.1})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy+hh*.16);
      ctx.lineTo(cx+hw*.42, cy+hh);
      ctx.lineTo(cx, cy+hh*1.84);
      ctx.lineTo(cx-hw*.42, cy+hh);
      ctx.closePath(); ctx.fill();
      // solchi paralleli da carro / piedi: più visibili in stile Tropico 2
      ctx.strokeStyle=`rgba(80,52,22,${.42+pv*.16})`; ctx.lineWidth=Math.max(.8,1.25*s);
      ctx.beginPath(); ctx.moveTo(cx-hw*.22,cy+hh*.28); ctx.lineTo(cx-hw*.22,cy+hh*1.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+hw*.22,cy+hh*.28); ctx.lineTo(cx+hw*.22,cy+hh*1.72); ctx.stroke();
      // ghiaia/pietruzze
      for(let i=0;i<4;i++){
        const gx=cx+(hash(r,c,i+700)-.5)*W*.55;
        const gy=cy+hh*.35+hash(r,c,i+710)*hh*1.25;
        ctx.fillStyle=`rgba(75,55,35,${.18+hash(r,c,i+720)*.18})`;
        ctx.beginPath(); ctx.arc(gx,gy,(.7+hash(r,c,i+730)*1.2)*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }

    case T.PALUDE: {
      const mv = hash(r, c, 8);
      ctx.fillStyle = `rgb(${45+mv*15|0},${65+mv*18|0},${35+mv*12|0})`;
      ctx.fill();
      // pozza scura
      const wx=cx+(hash(r,c,200)-.5)*W*.5, wy=cy+hh*.6+hash(r,c,210)*hh*.8;
      ctx.fillStyle=`rgba(20,50,40,${.55+hash(r,c,220)*.2})`;
      ctx.beginPath(); ctx.ellipse(wx,wy,(5+hash(r,c,221)*8)*s,(3+hash(r,c,222)*4)*s,0,0,Math.PI*2); ctx.fill();
      // nebbia
      ctx.fillStyle=`rgba(120,180,120,${.06+mv*.03})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      break;
    }

    default:
      ctx.fillStyle = '#222'; ctx.fill();
  }

  // Bordo tile sottile (solo terra/isola)
  if (t !== T.OCEANO && t !== T.BASSO) {
    ctx.strokeStyle = 'rgba(0,0,0,.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

// ── Transizioni biomi (sfumature ai bordi) ──
// Nel sistema iso le transizioni sono gestite direttamente nelle texture del tile.
// Questa funzione è mantenuta per compatibilità ma fa poco in iso vero.
function disegnaTransizioni() {
  // Foam costiero più evidente: acqua bassa/oceano vicino alla spiaggia.
  const s = G.ISO_SCALE;
  const W = G.ISO_W * s, H = G.ISO_H * s;
  const hw = W/2, hh = H/2;

  for (let r=0; r<G.RIGHE; r++) for (let c=0; c<G.COLS; c++) {
    const tile = G.mappa[r][c];
    if (tile !== T.SABBIA && tile !== T.SENTIERO) continue;

    const p = isoProj(c, r);
    const cx = p.x, cy = p.y;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      const nt = G.mappa[nr][nc];
      if (nt !== T.OCEANO && nt !== T.BASSO) continue;

      const t = frame*.025 + r*.45 + c*.37 + dr*.9 + dc*.6;
      const foam = nt===T.BASSO ? .13 : .19;

      // Piccola linea ondulata sul bordo del rombo verso l'acqua.
      ctx.save();
      ctx.strokeStyle = `rgba(245,255,235,${foam + Math.sin(t)*.055})`;
      ctx.lineWidth = Math.max(.9, 1.45*s);
      ctx.beginPath();

      if (dr === -1) { // lato nord
        ctx.moveTo(cx, cy + Math.sin(t)*1.2*s);
        ctx.quadraticCurveTo(cx-hw*.22, cy+hh*.22, cx-hw*.5, cy+hh*.5);
      } else if (dr === 1) { // lato sud
        ctx.moveTo(cx, cy+H + Math.sin(t)*1.2*s);
        ctx.quadraticCurveTo(cx+hw*.22, cy+hh*1.78, cx+hw*.5, cy+hh*1.5);
      } else if (dc === -1) { // lato ovest
        ctx.moveTo(cx-hw, cy+hh + Math.sin(t)*1.2*s);
        ctx.quadraticCurveTo(cx-hw*.62, cy+hh*.75, cx, cy);
      } else { // lato est
        ctx.moveTo(cx+hw, cy+hh + Math.sin(t)*1.2*s);
        ctx.quadraticCurveTo(cx+hw*.62, cy+hh*.75, cx, cy);
      }
      ctx.stroke();

      // Schiuma interna molto leggera, per costa più morbida.
      ctx.globalAlpha = .16 + Math.sin(t+1.5)*.04;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(
        cx + dc*hw*.48 - dr*hw*.08,
        cy + hh + dr*hh*.46 + dc*hh*.05,
        W*.10, H*.045,
        dc ? .55 : -.55,
        0, Math.PI*2
      );
      ctx.fill();
      ctx.restore();
    }
  }
}
