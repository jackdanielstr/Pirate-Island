// Isla del Diablo — core/core.js
// Estratto da 28_core.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: CORE
// ═══════════════════════════════════════
function limiteCamera(){
  // Limiti per proiezione isometrica
  const s   = G.ISO_SCALE;
  const IW  = G.ISO_W * s, IH = G.ISO_H * s;
  // Estensione della mappa iso in coordinate schermo
  const mapW = (G.COLS + G.RIGHE) * IW / 2;
  const mapH = (G.COLS + G.RIGHE) * IH / 2;
  const pad  = 80;
  G.camX = Math.max(-mapW + pad, Math.min(canvas.width - pad, G.camX));
  G.camY = Math.max(-mapH + pad, Math.min(canvas.height - pad, G.camY));
}


// Zoom mobile globale: deve esistere anche se il canvas/input non è ancora stato inizializzato.
// Usato dai pulsanti + / - su mobile. Ritorna false per evitare tap/click fantasma.
window.zoomMobile = function(delta){
  try{
    if(!isFinite(delta) || delta<=0) return false;
    const c = window.canvas || document.getElementById('mappa-canvas');
    if(!c || !window.G || typeof applicaZoom !== 'function') return false;
    if(!window.canvas) window.canvas = c;
    const rect = c.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    applicaZoom(delta, px, py);
    if(isFinite(G.ISO_SCALE)) G.zoom = G.ISO_SCALE;
    if(typeof _tileCache !== 'undefined') _tileCache = null;
    return false;
  }catch(err){
    console.warn('[Isla] zoomMobile bloccato:', err);
    return false;
  }
};

function impostaInput(){
  if(!canvas) return;

  const wrap = document.getElementById('mappa-wrap') || canvas;
  const zoomPlus = document.getElementById('zoom-plus');
  const zoomMinus = document.getElementById('zoom-minus');

  // Evita doppia inizializzazione, ma consente di ripristinare i bottoni se il DOM cambia.
  if(canvas.__islaInputInizializzato){
    collegaBottoniZoomMobile();
    return;
  }
  canvas.__islaInputInizializzato=true;

  canvas.style.touchAction='none';
  wrap.style.touchAction='none';
  canvas.style.webkitUserSelect='none';
  wrap.style.webkitUserSelect='none';
  canvas.style.userSelect='none';
  wrap.style.userSelect='none';

  function clampZoom(v){
    const min = G.ZOOM_MIN || 0.35;
    const max = G.ZOOM_MAX || 2.5;
    return Math.max(min, Math.min(max, v));
  }

  function zoomCanvas(delta, x, y){
    if(!isFinite(delta) || delta<=0) return false;
    if(!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    const px = isFinite(x) ? x : rect.width/2;
    const py = isFinite(y) ? y : rect.height/2;
    const oldScale = (isFinite(G.ISO_SCALE) && G.ISO_SCALE>0) ? G.ISO_SCALE : 1;
    const targetScale = clampZoom(oldScale * delta);
    if(Math.abs(targetScale-oldScale) < 0.0001) return false;

    // Pivot zoom robusto. Preferisce applicaZoom se presente, altrimenti fa il calcolo qui.
    if(typeof applicaZoom === 'function'){
      applicaZoom(targetScale / oldScale, px, py);
    }else{
      G.ISO_SCALE = targetScale;
      const ratio = targetScale / oldScale;
      G.camX = px - (px - G.camX) * ratio;
      G.camY = py - (py - G.camY) * ratio;
      if(typeof limiteCamera === 'function') limiteCamera();
    }

    G.zoom = G.ISO_SCALE;
    if(typeof _tileCache !== 'undefined') _tileCache = null;
    return false;
  }

  // Funzione globale usata anche dall'HTML inline: ritorna sempre false per bloccare tap/click fantasma.
  window.zoomMobile = function(delta){
    const rect = canvas.getBoundingClientRect();
    zoomCanvas(delta, rect.width/2, rect.height/2);
    return false;
  };

  function collegaBottoniZoomMobile(){
    const bind = (btn, delta) => {
      if(!btn || btn.__islaZoomBound) return;
      btn.__islaZoomBound = true;
      const handler = (ev) => {
        if(ev){ ev.preventDefault(); ev.stopPropagation(); }
        window.zoomMobile(delta);
        return false;
      };
      btn.addEventListener('click', handler, {passive:false});
      btn.addEventListener('touchstart', handler, {passive:false});
      btn.addEventListener('pointerdown', handler, {passive:false});
    };
    bind(zoomPlus, 1.18);
    bind(zoomMinus, 0.85);
  }
  collegaBottoniZoomMobile();

  // Mouse pan
  canvas.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    pan.attivo=true; pan.mosso=false;
    pan.startX=e.clientX; pan.startY=e.clientY;
    pan.camStartX=G.camX; pan.camStartY=G.camY;
    canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
    const lx=mx-G.camX, ly=my-G.camY;
    G.hoverC=Math.floor((lx/IW*2+ly/IH*2)/2-.5);
    G.hoverR=Math.floor((ly/IH*2-lx/IW*2)/2+.5);
    if(pan.attivo && G.modalitaCostruzione==='sentiero'){
      piazzaSentiero(G.hoverR,G.hoverC); return;
    }
    if(!pan.attivo) return;
    const dx=e.clientX-pan.startX, dy=e.clientY-pan.startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4) pan.mosso=true;
    if(pan.mosso){ G.camX=pan.camStartX+dx; G.camY=pan.camStartY+dy; limiteCamera(); }
  });
  window.addEventListener('mouseup',()=>{
    if(pan.attivo){ pan.attivo=false; canvas.style.cursor=''; if(typeof sentieroDrag!=='undefined') sentieroDrag=false; }
  });
  canvas.addEventListener('click',e=>{
    if(pan.mosso) return;
    cliccaMappa(e);
  });

  // Scroll wheel zoom desktop
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    zoomCanvas(e.deltaY<0?1.1:0.91, mx, my);
  },{passive:false});

  // TOUCH/PINCH robusto su wrapper + canvas. Usiamo changedTouches solo per tap, touches per pan/pinch.
  let pinch={attivo:false, wasPinching:false, dist:0, midX:0, midY:0};

  function touchRect(){ return canvas.getBoundingClientRect(); }
  function distTocchi(t){ return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }
  function midTocchi(t,rect){ return {x:(t[0].clientX+t[1].clientX)/2-rect.left, y:(t[0].clientY+t[1].clientY)/2-rect.top}; }
  function aggiornaHoverDaClient(clientX, clientY){
    const rect=touchRect();
    const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
    const lx=(clientX-rect.left)-G.camX, ly=(clientY-rect.top)-G.camY;
    G.hoverC=Math.floor((lx/IW*2+ly/IH*2)/2-.5);
    G.hoverR=Math.floor((ly/IH*2-lx/IW*2)/2+.5);
  }

  function onTouchStart(e){
    if(!e.touches || e.touches.length===0) return;
    e.preventDefault();
    e.stopPropagation();

    if(e.touches.length>=2){
      pan.attivo=false;
      const rect=touchRect();
      pinch.attivo=true;
      pinch.wasPinching=true;
      pinch.dist=distTocchi(e.touches);
      const mid=midTocchi(e.touches,rect);
      pinch.midX=mid.x; pinch.midY=mid.y;
      return;
    }

    pinch.attivo=false;
    const t=e.touches[0];
    if(G.modalitaCostruzione){
      pan.attivo=false;
      pan.mosso=false;
    }else{
      pan.attivo=true;
      pan.mosso=false;
      pan.startX=t.clientX;
      pan.startY=t.clientY;
      pan.camStartX=G.camX;
      pan.camStartY=G.camY;
    }
  }

  function onTouchMove(e){
    if(!e.touches || e.touches.length===0) return;
    e.preventDefault();
    e.stopPropagation();

    if(e.touches.length>=2){
      const rect=touchRect();
      const dist=distTocchi(e.touches);
      if(!pinch.attivo || !pinch.dist){
        pinch.attivo=true;
        pinch.wasPinching=true;
        pinch.dist=dist;
        const mid0=midTocchi(e.touches,rect);
        pinch.midX=mid0.x; pinch.midY=mid0.y;
        return;
      }
      if(dist<8) return;
      const mid=midTocchi(e.touches,rect);
      const scale=dist/pinch.dist;
      zoomCanvas(scale, mid.x, mid.y);

      // Consenti anche trascinamento del baricentro durante il pinch.
      const dxPan=mid.x-pinch.midX, dyPan=mid.y-pinch.midY;
      if(Math.abs(dxPan)>0.1 || Math.abs(dyPan)>0.1){
        G.camX+=dxPan; G.camY+=dyPan; limiteCamera();
      }
      pinch.midX=mid.x; pinch.midY=mid.y; pinch.dist=dist;
      return;
    }

    if(pan.attivo && e.touches.length===1){
      const t=e.touches[0];
      aggiornaHoverDaClient(t.clientX,t.clientY);
      if(G.modalitaCostruzione==='sentiero'){
        piazzaSentiero(G.hoverR,G.hoverC); return;
      }
      const dx=t.clientX-pan.startX, dy=t.clientY-pan.startY;
      if(Math.abs(dx)>12||Math.abs(dy)>12) pan.mosso=true;
      if(pan.mosso){ G.camX=pan.camStartX+dx; G.camY=pan.camStartY+dy; limiteCamera(); }
    }
  }

  function onTouchEnd(e){
    e.preventDefault();
    e.stopPropagation();

    if(e.touches && e.touches.length>=2) return;
    if(pinch.attivo || pinch.wasPinching){
      pinch.attivo=false;
      pan.attivo=false;
      if(!e.touches || e.touches.length===0){ setTimeout(()=>{pinch.wasPinching=false;},120); }
      return;
    }

    if(!pan.mosso && e.changedTouches && e.changedTouches.length>0){
      const t=e.changedTouches[0];
      aggiornaHoverDaClient(t.clientX,t.clientY);
      const r=G.hoverR, c=G.hoverC;
      if(G.modalitaCostruzione==='sentiero') piazzaSentiero(r,c);
      else if(G.modalitaCostruzione){ piazzaEdificio(r,c); }
      else{
        const b=G.edifici.find(x=>x.r===r&&x.c===c);
        if(b){ if(typeof apriPopupEdificio==='function') apriPopupEdificio(b); pan.attivo=false; return; }
        const tt=(G.mappa[r]!==undefined)?G.mappa[r][c]:undefined;
        if(tt!==undefined){
          const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
          aggMsg('📍 '+(nomi[tt]||'?'));
        }
      }
    }
    if(!e.touches || e.touches.length===0){ pan.attivo=false; pinch.attivo=false; }
  }

  const touchTarget = wrap || canvas;
  touchTarget.addEventListener('touchstart',onTouchStart,{passive:false});
  touchTarget.addEventListener('touchmove',onTouchMove,{passive:false});
  touchTarget.addEventListener('touchend',onTouchEnd,{passive:false});
  touchTarget.addEventListener('touchcancel',onTouchEnd,{passive:false});

  // iOS Safari fallback GestureEvent
  let gestureZoom0=1;
  touchTarget.addEventListener('gesturestart', e=>{
    e.preventDefault(); e.stopPropagation();
    gestureZoom0=G.ISO_SCALE||1;
    pinch.wasPinching=true;
  }, {passive:false});
  touchTarget.addEventListener('gesturechange', e=>{
    e.preventDefault(); e.stopPropagation();
    const rect=touchRect();
    const px=(isFinite(e.clientX)?e.clientX-rect.left:rect.width/2);
    const py=(isFinite(e.clientY)?e.clientY-rect.top:rect.height/2);
    const target=clampZoom(gestureZoom0*(e.scale||1));
    zoomCanvas(target/(G.ISO_SCALE||1), px, py);
  }, {passive:false});
  touchTarget.addEventListener('gestureend', e=>{
    e.preventDefault(); e.stopPropagation();
    setTimeout(()=>{pinch.wasPinching=false;},160);
  }, {passive:false});

  window.addEventListener('resize', ()=>{ ridimensionaCanvas(); impostaMobile(); });
}

function getTile(e){
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left - G.camX;
  const my = e.clientY - rect.top  - G.camY;
  const s  = G.ISO_SCALE;
  const IW = G.ISO_W * s, IH = G.ISO_H * s;
  // Inverso proiezione iso: (mx,my) → (col,row)
  const col = Math.floor((mx/IW*2 + my/IH*2) / 2 - .5);
  const row = Math.floor((my/IH*2 - mx/IW*2) / 2 + .5);
  return { r:row, c:col };
}
function cliccaMappa(e){
  const{r,c}=getTile(e);
  if(G.modalitaCostruzione==='sentiero'){piazzaSentiero(r,c);return;}
  if(G.modalitaCostruzione){piazzaEdificio(r,c);return;}

  // 1. Edificio sul tile cliccato — priorità massima
  const b=G.edifici.find(x=>x.r===r&&x.c===c);
  if(b){
    if(typeof apriPopupEdificio==='function') apriPopupEdificio(b);
    return;
  }

  // 2. Pirata vicino al punto cliccato (coordinate schermo iso)
  const rect=canvas.getBoundingClientRect();
  const clickX=e.clientX-rect.left;
  const clickY=e.clientY-rect.top;
  const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
  for(const p of G.pirati){
    const proj=isoProj(p.mc,p.mr);
    const px=proj.x, py=proj.y+IH/2;
    if(Math.abs(clickX-px)<IW*0.5&&Math.abs(clickY-py)<IH*1.5){
      apriProfiloPirata(p.id);
      return;
    }
  }

  // 3. Info tile
  const t=(G.mappa[r]!==undefined)?G.mappa[r][c]:undefined;
  if(t===undefined) return;
  const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
  aggMsg('📍 '+(nomi[t]||'?'));
}

// ── MODALE ──
function apriModale(titolo,html){
  document.getElementById('titolo-modale').textContent=titolo;
  document.getElementById('corpo-modale').innerHTML=html;
  document.getElementById('overlay-modale').classList.add('aperto');
}
function chiudiModale(){document.getElementById('overlay-modale').classList.remove('aperto');}
document.getElementById('overlay-modale').addEventListener('click',e=>{
  if(e.target===document.getElementById('overlay-modale')) chiudiModale();
});

// ── MESSAGGI & NOTIFICHE ──
function aggMsg(testo,tipo=''){
  const log=document.getElementById('log-msg');
  const d=document.createElement('div');
  d.className='msg'+(tipo?' '+tipo:'');
  d.textContent=testo;
  log.appendChild(d);
  while(log.children.length>4) log.removeChild(log.firstChild);
}
function notifica(titolo,corpo,tipo=''){
  const a=document.getElementById('area-notifiche');
  const d=document.createElement('div');
  d.className='notifica'+(tipo?' '+tipo:'');
  d.innerHTML=`<div class="titolo-notifica">${titolo}</div><div>${corpo}</div>`;
  a.appendChild(d);
  setTimeout(()=>{if(d.parentNode)d.remove();},5000);
}

// ── VELOCITÀ ──
// ── VELOCITÀ — stile Tropico 2: ⏸ Pausa / ▶ Normale / ▶▶ Veloce / ▶▶▶ Max ──
const VELOCITA_LIVELLI = [
  { val:0,   label:'⏸',       title:'Pausa'  },
  { val:1,   label:'▶',       title:'Normale' },
  { val:2.5, label:'▶▶',      title:'Veloce'  },
  { val:6,   label:'▶▶▶',     title:'Max'     },
];
let _velIdx = 1; // parte in Normale

function cambiaVelocita(){
  _velIdx = (_velIdx + 1) % VELOCITA_LIVELLI.length;
  const lv = VELOCITA_LIVELLI[_velIdx];
  G.velocita = lv.val;
  const btn = document.getElementById('btn-velocita');
  if(btn){ btn.textContent = lv.label; btn.title = lv.title; }
  // Musica: mantieni ritmo costante indipendentemente dalla velocità
  if(typeof MUSIC !== 'undefined'){
    if(G.velocita === 0) { /* pausa: musica continua ma il tick si ferma */ }
  }
}

function impostaVelocitaUI(){
  const lv = VELOCITA_LIVELLI[_velIdx];
  const btn = document.getElementById('btn-velocita');
  if(btn){ btn.textContent = lv.label; btn.title = lv.title; }
}

// ── CICLO GIOCO ──
// ═══════════════════════════════════════════════════
// CONDIZIONI VITTORIA / SCONFITTA
// ═══════════════════════════════════════════════════

// Obiettivi vittoria — tutti devono essere soddisfatti

// ── MUSICA ──
function toggleMusica(){
  const on = MUSIC.toggle();
  const btn = document.getElementById('btn-musica');
  if(btn) btn.textContent = on ? '🔊' : '🎵';
}

// Avvia musica al primo click utente (policy browser)
function avviaMusicaAlPrimoClick(){
  if(MUSIC.isRunning()) return;
  MUSIC.start();
  const btn = document.getElementById('btn-musica');
  if(btn) btn.textContent = '🔊';
  document.removeEventListener('click', avviaMusicaAlPrimoClick);
}
