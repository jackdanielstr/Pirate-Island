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


function naveDaClient(x,y){
  if(!G || !Array.isArray(G.navi) || !canvas) return null;
  const rect=canvas.getBoundingClientRect();
  const cx=x-rect.left, cy=y-rect.top;
  let best=null, bestD=Infinity;
  for(const n of G.navi){
    if(!isFinite(n._screenX)||!isFinite(n._screenY)) continue;
    const r=n._screenR||28;
    const d=Math.hypot(cx-n._screenX, cy-n._screenY);
    if(d<r*1.35 && d<bestD){ best=n; bestD=d; }
  }
  return best;
}

function unitàDaClient(x,y){
  if(!G || !canvas || typeof isoProj!=='function') return null;
  const rect=canvas.getBoundingClientRect();
  const cx=x-rect.left, cy=y-rect.top;
  const sc=G.ISO_SCALE||1, IW=G.ISO_W*sc, IH=G.ISO_H*sc;
  let best=null, bestD=Infinity;
  // Priorità Tropico 2: pirati, poi schiavi/prigionieri, poi edifici.
  for(const pirata of (G.pirati||[])){
    if(pirata.inRaid || !isFinite(pirata.mc)||!isFinite(pirata.mr)) continue;
    const p=isoProj(pirata.mc,pirata.mr);
    const ux=p.x, uy=p.y+IH/2;
    const d=Math.hypot(cx-ux,cy-uy);
    const r=Math.max(18,IW*.34);
    if(d<r && d<bestD){ best={tipo:'pirata',data:pirata}; bestD=d; }
  }
  for(const schiavo of (G.schiavi||[])){
    if(!isFinite(schiavo.mc)||!isFinite(schiavo.mr)) continue;
    const p=isoProj(schiavo.mc,schiavo.mr);
    const ux=p.x, uy=p.y+IH/2;
    const d=Math.hypot(cx-ux,cy-uy);
    const r=Math.max(16,IW*.30);
    if(d<r && d<bestD){ best={tipo:'schiavo',data:schiavo}; bestD=d; }
  }
  return best;
}

function impostaInput(){
  if(!canvas) return;
  if(canvas.__islaInputInizializzato) return;
  canvas.__islaInputInizializzato=true;

  const wrap=document.getElementById('mappa-wrap') || canvas;
  const target=wrap || canvas;
  canvas.style.touchAction='none';
  canvas.style.webkitUserSelect='none';
  if(wrap){
    wrap.style.touchAction='none';
    wrap.style.webkitUserSelect='none';
  }

  function canvasRect(){ return canvas.getBoundingClientRect(); }
  function zoomCanvas(delta, x, y){
    delta=Number(delta);
    if(!isFinite(delta)||delta<=0||!canvas||!G) return false;
    const rect=canvasRect();
    const px=isFinite(x)?x:rect.width/2;
    const py=isFinite(y)?y:rect.height/2;
    const oldScale=(isFinite(G.ISO_SCALE)&&G.ISO_SCALE>0)?G.ISO_SCALE:1;
    const min=G.ZOOM_MIN||0.35, max=G.ZOOM_MAX||2.5;
    const newScale=Math.max(min,Math.min(max,oldScale*delta));
    if(Math.abs(newScale-oldScale)<0.0001) return false;
    const ratio=newScale/oldScale;
    G.ISO_SCALE=newScale;
    G.zoom=newScale;
    G.camX=px-(px-G.camX)*ratio;
    G.camY=py-(py-G.camY)*ratio;
    limiteCamera();
    if(typeof _tileCache!=='undefined') _tileCache=null;
    return false;
  }

  window.zoomMobile=function(delta){
    const rect=canvasRect();
    zoomCanvas(delta,rect.width/2,rect.height/2);
    return false;
  };

  function tileDaClientBase(x,y){
    const rect=canvasRect();
    const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
    const lx=(x-rect.left)-G.camX;
    const ly=(y-rect.top)-G.camY;
    return {
      r:Math.floor((ly/IH*2-lx/IW*2)/2+.5),
      c:Math.floor((lx/IW*2+ly/IH*2)/2-.5),
    };
  }

  function tileSentieroValido(r,c){
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
    const occupato=(typeof edificioInTile==='function') ? edificioInTile(r,c) : (G.edifici && G.edifici.find(b=>b.r===r&&b.c===c));
    if(occupato) return false;
    const t=G.mappa[r] ? G.mappa[r][c] : undefined;
    return t!==undefined && t!==T.OCEANO && t!==T.BASSO && t!==T.ROCCIA;
  }

  // Picking speciale per il sentiero: in isometrico gli edifici sono alti e
  // spesso coprono visivamente il tile dietro. Il vecchio picking inverso prendeva
  // quasi sempre il tile dell'edificio, impedendo di costruire la strada dietro.
  // Qui, se il tile base è occupato, scegliamo prima il vicino nella direzione
  // visiva del tap/click rispetto al centro dell'edificio, poi facciamo fallback
  // sui vicini validi più vicini al puntatore.
  function tileSentieroDaClient(x,y){
    // In modalità sentiero vogliamo conoscere il tile geometrico reale sotto il dito.
    // Se è occupato da un edificio, NON proviamo più a indovinare qui: il resolver
    // in piazzaSentiero sceglierà in modo coerente il vicino libero usando il puntatore.
    return tileDaClientBase(x,y);
  }

  function tileDaClient(x,y){
    return G.modalitaCostruzione==='sentiero' ? tileSentieroDaClient(x,y) : tileDaClientBase(x,y);
  }
  function setHoverDaClient(x,y){
    // Conserva il puntatore reale: il piazzamento sentiero lo usa per scegliere
    // un tile adiacente quando la sagoma alta di un edificio copre il tile dietro.
    G.__roadPointerClient = { x, y, t: Date.now() };
    const tc=tileDaClient(x,y);
    // Per i sentieri, l'anteprima deve mostrare il tile realmente piazzabile.
    // Se il cursore cade sulla sagoma di un edificio, risolviTileSentiero può restituire
    // il tile libero dietro/laterale, evitando anteprima verde ma piazzamento rifiutato.
    if(G.modalitaCostruzione==='sentiero' && typeof risolviTileSentiero==='function') {
      const resolved=risolviTileSentiero(tc.r,tc.c);
      if(resolved){ G.hoverR=resolved.r; G.hoverC=resolved.c; return resolved; }
    }
    G.hoverR=tc.r; G.hoverC=tc.c;
    return tc;
  }
  function azioneTapMappa(x,y){
    const tc=setHoverDaClient(x,y);
    if(G.modalitaCostruzione==='sentiero'){
      if(typeof piazzaSentiero==='function') piazzaSentiero(tc.r,tc.c);
      return;
    }
    if(G.modalitaCostruzione){
      if(typeof piazzaEdificio==='function') piazzaEdificio(tc.r,tc.c);
      return;
    }
    const unitClick=(typeof unitàDaClient==='function') ? unitàDaClient(x,y) : null;
    if(unitClick){
      if(unitClick.tipo==='pirata' && typeof apriProfiloPirata==='function') apriProfiloPirata(unitClick.data.id);
      else if(unitClick.tipo==='schiavo' && typeof apriProfiloSchiavo==='function') apriProfiloSchiavo(unitClick.data.id);
      return;
    }
    const naveClick=(typeof naveDaClient==='function') ? naveDaClient(x,y) : null;
    if(naveClick && typeof apriSchedaNavePorto==='function'){
      apriSchedaNavePorto(naveClick.id,'mappa');
      return;
    }
    const b=(typeof edificioInTile==='function') ? edificioInTile(tc.r,tc.c) : G.edifici.find(ed=>ed.r===tc.r&&ed.c===tc.c);
    if(b){ if(typeof apriPopupEdificio==='function') apriPopupEdificio(b); return; }
    const tt=(G.mappa[tc.r]!==undefined)?G.mappa[tc.r][tc.c]:undefined;
    if(tt!==undefined){
      const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
      aggMsg('📍 '+(nomi[tt]||'?'));
    }
  }

  // Pointer Events: un solo sistema per mouse + touch. Evita il vecchio conflitto
  // touchend/click che bloccava il piazzamento edifici dopo lo strumento sentiero.
  const pointers=new Map();
  let gesture={pinch:false,dist:0,midX:0,midY:0};
  const drag={active:false,id:null,startX:0,startY:0,camX:0,camY:0,moved:false,roadTimer:null,roadDraw:false,lastRoad:''};
  const LONG_PRESS_MS=320;
  const TAP_SLOP=12;

  function clearRoadTimer(){ if(drag.roadTimer){ clearTimeout(drag.roadTimer); drag.roadTimer=null; } }
  function resetDrag(){ clearRoadTimer(); drag.active=false; drag.id=null; drag.moved=false; drag.roadDraw=false; drag.lastRoad=''; }
  function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
  function midpoint(a,b){ const rect=canvasRect(); return {x:(a.x+b.x)/2-rect.left,y:(a.y+b.y)/2-rect.top}; }
  function paintRoadAt(x,y){
    const tc=setHoverDaClient(x,y);
    const k=tc.r+','+tc.c;
    if(k!==drag.lastRoad){
      drag.lastRoad=k;
      if(typeof piazzaSentiero==='function') piazzaSentiero(tc.r,tc.c);
    }
  }

  target.addEventListener('pointerdown',e=>{
    if(e.button!==undefined && e.button!==0 && e.pointerType==='mouse') return;
    e.preventDefault();
    target.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});

    if(pointers.size===2){
      clearRoadTimer();
      drag.active=false;
      const [a,b]=[...pointers.values()];
      gesture.pinch=true;
      gesture.dist=distance(a,b);
      const m=midpoint(a,b); gesture.midX=m.x; gesture.midY=m.y;
      canvas.__islaSuppressClickUntil=Date.now()+450;
      return;
    }

    if(pointers.size===1){
      gesture.pinch=false;
      drag.active=true;
      drag.id=e.pointerId;
      drag.startX=e.clientX; drag.startY=e.clientY;
      drag.camX=G.camX; drag.camY=G.camY;
      drag.moved=false; drag.roadDraw=false; drag.lastRoad='';
      setHoverDaClient(e.clientX,e.clientY);

      // Mobile: sentiero con tap o long-press+drag. Mouse: drag sentiero immediato.
      if(G.modalitaCostruzione==='sentiero'){
        if(e.pointerType==='mouse'){
          drag.roadDraw=true;
          paintRoadAt(e.clientX,e.clientY);
        }else{
          drag.roadTimer=setTimeout(()=>{
            drag.roadDraw=true;
            drag.moved=true;
            paintRoadAt(drag.startX,drag.startY);
            aggMsg('🛤 Disegno sentiero: trascina sul percorso','info');
          },LONG_PRESS_MS);
        }
      }
    }
  },{passive:false});

  target.addEventListener('pointermove',e=>{
    // Hover/anteprima costruzione desktop: deve aggiornarsi anche senza trascinare.
    // La v20.30 aggiornava G.hoverR/G.hoverC solo a pointer premuto, quindi
    // l'anteprima edificio non compariva passando il mouse sulla mappa.
    if(!pointers.has(e.pointerId)){
      if(e.pointerType==='mouse' && G.modalitaCostruzione){
        setHoverDaClient(e.clientX,e.clientY);
      }
      return;
    }
    e.preventDefault();
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});

    if(gesture.pinch && pointers.size>=2){
      const [a,b]=[...pointers.values()];
      const d=distance(a,b);
      if(d>8 && gesture.dist>0){
        const m=midpoint(a,b);
        zoomCanvas(d/gesture.dist,m.x,m.y);
        const dx=m.x-gesture.midX, dy=m.y-gesture.midY;
        if(Math.abs(dx)>0.1||Math.abs(dy)>0.1){ G.camX+=dx; G.camY+=dy; limiteCamera(); }
        gesture.dist=d; gesture.midX=m.x; gesture.midY=m.y;
        canvas.__islaSuppressClickUntil=Date.now()+450;
      }
      return;
    }

    if(!drag.active || drag.id!==e.pointerId) return;
    setHoverDaClient(e.clientX,e.clientY);
    const dx=e.clientX-drag.startX, dy=e.clientY-drag.startY;
    const moved=Math.abs(dx)>TAP_SLOP||Math.abs(dy)>TAP_SLOP;

    if(G.modalitaCostruzione==='sentiero' && drag.roadDraw){
      drag.moved=true;
      paintRoadAt(e.clientX,e.clientY);
      canvas.__islaSuppressClickUntil=Date.now()+250;
      return;
    }

    if(moved){
      clearRoadTimer();
      drag.moved=true;
      G.camX=drag.camX+dx;
      G.camY=drag.camY+dy;
      limiteCamera();
    }
  },{passive:false});

  function endPointer(e){
    if(pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    if(gesture.pinch){
      canvas.__islaSuppressClickUntil=Date.now()+450;
      if(pointers.size<2){ gesture.pinch=false; gesture.dist=0; }
      resetDrag();
      return;
    }
    if(drag.active && drag.id===e.pointerId){
      clearRoadTimer();
      // Tap = azione. Drag = solo pan. Long-press sentiero ha già disegnato.
      if(!drag.moved && !drag.roadDraw){
        azioneTapMappa(e.clientX,e.clientY);
        canvas.__islaSuppressClickUntil=Date.now()+120;
      }
      resetDrag();
    }
  }
  target.addEventListener('pointerup',endPointer,{passive:false});
  target.addEventListener('pointercancel',e=>{ if(pointers.has(e.pointerId)) pointers.delete(e.pointerId); resetDrag(); gesture.pinch=false; },{passive:false});
  target.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse' && drag.active) endPointer(e); },{passive:false});

  // Fallback click solo per desktop senza PointerEvent pieno: non deve mai doppiare il tap touch.
  canvas.addEventListener('click',e=>{
    if(Date.now()<(canvas.__islaSuppressClickUntil||0)) return;
    if('PointerEvent' in window) return;
    azioneTapMappa(e.clientX,e.clientY);
  });

  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvasRect();
    zoomCanvas(e.deltaY<0?1.1:0.91,e.clientX-rect.left,e.clientY-rect.top);
  },{passive:false});

  // iOS Safari GestureEvent fallback.
  let gestureZoom0=1;
  target.addEventListener('gesturestart',e=>{
    e.preventDefault(); gestureZoom0=G.ISO_SCALE||1;
    canvas.__islaSuppressClickUntil=Date.now()+450;
  },{passive:false});
  target.addEventListener('gesturechange',e=>{
    e.preventDefault();
    const rect=canvasRect();
    const px=isFinite(e.clientX)?e.clientX-rect.left:rect.width/2;
    const py=isFinite(e.clientY)?e.clientY-rect.top:rect.height/2;
    const targetScale=Math.max(G.ZOOM_MIN||0.35,Math.min(G.ZOOM_MAX||2.5,gestureZoom0*(e.scale||1)));
    zoomCanvas(targetScale/(G.ISO_SCALE||1),px,py);
  },{passive:false});
  target.addEventListener('gestureend',e=>{ e.preventDefault(); canvas.__islaSuppressClickUntil=Date.now()+450; },{passive:false});

  window.addEventListener('resize',()=>{ ridimensionaCanvas(); impostaMobile(); });
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

  const unitClick=(typeof unitàDaClient==='function') ? unitàDaClient(e.clientX,e.clientY) : null;
  if(unitClick){
    if(unitClick.tipo==='pirata' && typeof apriProfiloPirata==='function') apriProfiloPirata(unitClick.data.id);
    else if(unitClick.tipo==='schiavo' && typeof apriProfiloSchiavo==='function') apriProfiloSchiavo(unitClick.data.id);
    return;
  }

  // 1. Edificio sul tile cliccato
  const b=(typeof edificioInTile==='function') ? edificioInTile(r,c) : G.edifici.find(x=>x.r===r&&x.c===c);
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
  { val:2,   label:'▶▶',      title:'Veloce'  },
  { val:3,   label:'▶▶▶',     title:'Max'     },
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
