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
  G.ISO_SCALE = Math.max(0.35, Math.min(2.5, G.ISO_SCALE * delta));
  if (G.ISO_SCALE === oldScale) return;
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
      const v   = hash(r, c, 1);
      const hue = 195 + v * 14;
      const wave = Math.sin(frame * .018 + c * .55 + r * .3) * .04;
      ctx.fillStyle = `hsl(${hue}, 72%, ${20 + v*6 + wave*8}%)`;
      ctx.fill();
      // riflesso solare
      const shim = .06 + Math.sin(frame * .025 + c * .7) * .025;
      ctx.fillStyle = `rgba(180,255,255,${shim})`;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .5, cy + hh * .4);
      ctx.lineTo(cx,           cy + hh * .1);
      ctx.lineTo(cx + hw * .3, cy + hh * .5);
      ctx.lineTo(cx - hw * .2, cy + hh * .8);
      ctx.closePath();
      ctx.fill();
      // onda animata
      const f1 = frame * .018 + c * .55 + r * .3;
      ctx.strokeStyle = `rgba(160,240,255,${.12 + Math.sin(f1) * .05})`;
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .7, cy + hh * .55 + Math.sin(f1) * 2 * s);
      ctx.bezierCurveTo(
        cx - hw * .2, cy + hh * .45 + Math.sin(f1+1)*3*s,
        cx + hw * .2, cy + hh * .5  - Math.sin(f1+2)*3*s,
        cx + hw * .7, cy + hh * .55 + Math.sin(f1+3)*2*s
      );
      ctx.stroke();
      break;
    }

    case T.BASSO: {
      const sv = hash(r, c, 9);
      ctx.fillStyle = `hsl(${175+sv*15}, ${65+sv*15}%, ${34+sv*10}%)`;
      ctx.fill();
      // corallo
      for (let i = 0; i < 3; i++) {
        const hx = cx + (hash(r,c,i+300)-.5)*W*.7;
        const hy = cy + hh * .4 + hash(r,c,i+310)*hh*.8;
        const col = hash(r,c,i+320);
        ctx.fillStyle = col>.6 ? `rgba(240,160,80,${.15+col*.1})`
                                : `rgba(180,80,80,${.1+col*.08})`;
        ctx.beginPath();
        ctx.arc(hx, hy, (2+col*3)*s, 0, Math.PI*2);
        ctx.fill();
      }
      // trasparenza acqua
      ctx.fillStyle = `rgba(100,220,200,${.2+sv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      // increspature
      const fb = frame*.016 + c*.48 + r*.28;
      ctx.strokeStyle = `rgba(200,255,240,${.18+Math.sin(fb)*.07})`;
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(cx-hw*.6, cy+hh*.6+Math.sin(fb)*2*s);
      ctx.bezierCurveTo(cx-hw*.2,cy+hh*.5, cx+hw*.2,cy+hh*.6, cx+hw*.6,cy+hh*.6+Math.sin(fb+2)*2*s);
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
  // Nell'iso 2:1 le transizioni di bordo sono già nel tile stesso.
  // Per le spiagge aggiungiamo una striscia foam sull'oceano adiacente.
  const s = G.ISO_SCALE;
  const W = G.ISO_W * s, H = G.ISO_H * s;
  for (let r=0; r<G.RIGHE; r++) for (let c=0; c<G.COLS; c++) {
    if (G.mappa[r][c] !== T.SABBIA) continue;
    // Controlla vicini oceano
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if (G.mappa[nr][nc] !== T.OCEANO) continue;
      // Foam sulla spiaggia verso oceano
      const p = isoProj(c, r);
      const cx = p.x, cy = p.y + H/2; // centro tile
      const foam = .15 + Math.sin(frame*.015 + c*.4 + r*.3) * .08;
      ctx.fillStyle = `rgba(255,255,255,${foam})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy+H*.4);
      ctx.lineTo(cx+W*.3*dr, cy+H*.4+H*.2*dc);
      ctx.lineTo(cx, cy+H*.6);
      ctx.closePath(); ctx.fill();
    }
  }
}
