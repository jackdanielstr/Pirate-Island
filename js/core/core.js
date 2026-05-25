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
  if(canvas.__islaInputInizializzato) return;
  canvas.__islaInputInizializzato=true;

  const wrap=document.getElementById('mappa-wrap') || canvas;
  canvas.style.touchAction='none';
  canvas.style.webkitUserSelect='none';
  if(wrap){ wrap.style.touchAction='none'; wrap.style.webkitUserSelect='none'; }

  function canvasRect(){ return canvas.getBoundingClientRect(); }
  function normalizzaPivot(x,y){
    const rect=canvasRect();
    return {
      x:isFinite(x)?x:(rect.width/2),
      y:isFinite(y)?y:(rect.height/2),
    };
  }
  function zoomCanvas(delta, x, y){
    delta=Number(delta);
    if(!isFinite(delta)||delta<=0||!canvas||!G) return false;
    const p=normalizzaPivot(x,y);
    // Applica direttamente la trasformazione per non dipendere da wrapper esterni.
    const oldScale=(isFinite(G.ISO_SCALE)&&G.ISO_SCALE>0)?G.ISO_SCALE:1;
    const min=G.ZOOM_MIN||0.35, max=G.ZOOM_MAX||2.5;
    const newScale=Math.max(min,Math.min(max,oldScale*delta));
    if(Math.abs(newScale-oldScale)<0.0001) return false;
    const ratio=newScale/oldScale;
    G.ISO_SCALE=newScale;
    G.zoom=newScale;
    G.camX=p.x-(p.x-G.camX)*ratio;
    G.camY=p.y-(p.y-G.camY)*ratio;
    limiteCamera();
    if(typeof _tileCache!=='undefined') _tileCache=null;
    return false;
  }

  // API globale per i pulsanti + / - in index.html.
  window.zoomMobile=function(delta){
    const rect=canvasRect();
    zoomCanvas(delta,rect.width/2,rect.height/2);
    return false;
  };

  // Collega i tasti anche via JS, così non dipendiamo solo dagli onclick inline.

  // Mouse pan
  canvas.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    pan.attivo=true; pan.mosso=false;
    pan.startX=e.clientX; pan.startY=e.clientY;
    pan.camStartX=G.camX; pan.camStartY=G.camY;
    canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('mousemove',e=>{
    const rect=canvasRect();
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
    if(Date.now()<(canvas.__islaSuppressClickUntil||0)) return;
    if(pan.mosso) return;
    cliccaMappa(e);
  });
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvasRect();
    zoomCanvas(e.deltaY<0?1.1:0.91,e.clientX-rect.left,e.clientY-rect.top);
  },{passive:false});

  // TOUCH: pan + pinch-to-zoom. Gestito sul wrapper perché su mobile il canvas può non ricevere
  // tutti gli eventi quando ci sono overlay/HUD sopra la mappa.
  const touchTarget=wrap||canvas;
  let pinch={attivo:false,wasPinching:false,dist0:0,midX:0,midY:0};
  // Mobile road tool: tap = 1 tile, normal drag = pan, long-press + drag = paint road.
  let roadTouch={timer:null,draw:false,lastKey:'',startX:0,startY:0};
  const LONG_PRESS_MS=320;
  const PAN_SLOP=10;
  function clearRoadTimer(){ if(roadTouch.timer){ clearTimeout(roadTouch.timer); roadTouch.timer=null; } }
  function resetRoadTouch(){ clearRoadTimer(); roadTouch.draw=false; roadTouch.lastKey=''; }

  // Reset pubblico usato quando si cambia strumento dal pannello costruzioni.
  // Fix v20.27: dopo il disegno dei sentieri su mobile restavano stati touch
  // interni (long press / draw / pan.mosso) che potevano bloccare il piazzamento
  // dell'edificio selezionato subito dopo.
  window.__islaResetTouchInputState=function(){
    try{
      resetRoadTouch();
      pan.attivo=false;
      pan.mosso=false;
      pinch.attivo=false;
      pinch.wasPinching=false;
      if(canvas){
        canvas.__islaSuppressClickUntil=0;
        canvas.style.cursor='';
      }
    }catch(err){
      console.warn('[Isla] reset input touch non riuscito:', err);
    }
  };

  function distTocchi(t){ return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY); }
  function midTocchi(t){
    const rect=canvasRect();
    return {x:(t[0].clientX+t[1].clientX)/2-rect.left,y:(t[0].clientY+t[1].clientY)/2-rect.top};
  }
  function tileDaClient(x,y){
    const rect=canvasRect();
    const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
    const lx=(x-rect.left)-G.camX, ly=(y-rect.top)-G.camY;
    return {
      r:Math.floor((ly/IH*2-lx/IW*2)/2+.5),
      c:Math.floor((lx/IW*2+ly/IH*2)/2-.5),
    };
  }
  function setHoverDaTouch(t){
    const tc=tileDaClient(t.clientX,t.clientY);
    G.hoverR=tc.r; G.hoverC=tc.c;
    return tc;
  }
  function paintSentieroDaTouch(t){
    const tc=setHoverDaTouch(t);
    const key=tc.r+','+tc.c;
    if(key!==roadTouch.lastKey){
      roadTouch.lastKey=key;
      if(typeof piazzaSentiero==='function') piazzaSentiero(tc.r,tc.c);
    }
  }

  touchTarget.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      e.preventDefault();
      resetRoadTouch();
      pan.attivo=false;
      pinch.attivo=true; pinch.wasPinching=true;
      pinch.dist0=distTocchi(e.touches);
      const m=midTocchi(e.touches); pinch.midX=m.x; pinch.midY=m.y;
      canvas.__islaSuppressClickUntil=Date.now()+400;
      return;
    }
    if(e.touches.length!==1) return;
    e.preventDefault();
    pinch.attivo=false;
    resetRoadTouch();
    const t=e.touches[0];
    pan.attivo=true; pan.mosso=false;
    pan.startX=t.clientX; pan.startY=t.clientY;
    pan.camStartX=G.camX; pan.camStartY=G.camY;
    roadTouch.startX=t.clientX; roadTouch.startY=t.clientY;
    setHoverDaTouch(t);
    if(G.modalitaCostruzione==='sentiero'){
      roadTouch.timer=setTimeout(()=>{
        roadTouch.draw=true;
        pan.mosso=true; // evita che il touchend piazzi due volte lo stesso tile
        const fake={clientX:roadTouch.startX,clientY:roadTouch.startY};
        paintSentieroDaTouch(fake);
        aggMsg('🛤 Disegno sentiero: trascina sul percorso','info');
      },LONG_PRESS_MS);
    }
  },{passive:false});

  touchTarget.addEventListener('touchmove',e=>{
    if(e.touches.length===2){
      e.preventDefault();
      resetRoadTouch();
      const d=distTocchi(e.touches);
      if(!pinch.attivo||!pinch.dist0){ pinch.attivo=true; pinch.dist0=d; const m=midTocchi(e.touches); pinch.midX=m.x; pinch.midY=m.y; return; }
      if(d<8) return;
      const m=midTocchi(e.touches);
      zoomCanvas(d/pinch.dist0,m.x,m.y);
      const dx=m.x-pinch.midX, dy=m.y-pinch.midY;
      if(Math.abs(dx)>0.1||Math.abs(dy)>0.1){ G.camX+=dx; G.camY+=dy; limiteCamera(); }
      pinch.dist0=d; pinch.midX=m.x; pinch.midY=m.y;
      canvas.__islaSuppressClickUntil=Date.now()+400;
      return;
    }
    if(e.touches.length!==1||!pan.attivo) return;
    e.preventDefault();
    const t=e.touches[0];
    const dx=t.clientX-pan.startX, dy=t.clientY-pan.startY;
    const moved=Math.abs(dx)>PAN_SLOP||Math.abs(dy)>PAN_SLOP;
    setHoverDaTouch(t);

    if(G.modalitaCostruzione!=='sentiero' && roadTouch.draw){
      // Cambio strumento mentre un long-press sentiero era attivo: annulla il draw.
      resetRoadTouch();
    }

    if(G.modalitaCostruzione==='sentiero' && roadTouch.draw){
      paintSentieroDaTouch(t);
      canvas.__islaSuppressClickUntil=Date.now()+250;
      return;
    }

    // Se l'utente trascina prima del long-press, è pan della mappa, non costruzione.
    if(moved){
      clearRoadTimer();
      pan.mosso=true;
      G.camX=pan.camStartX+dx;
      G.camY=pan.camStartY+dy;
      limiteCamera();
    }
  },{passive:false});

  touchTarget.addEventListener('touchend',e=>{
    if(pinch.attivo&&e.touches.length<2){ pinch.attivo=false; }
    clearRoadTimer();
    if(pinch.wasPinching){
      e.preventDefault();
      resetRoadTouch();
      canvas.__islaSuppressClickUntil=Date.now()+400;
      if(e.touches.length===0){ pan.attivo=false; setTimeout(()=>{pinch.wasPinching=false;},120); }
      return;
    }
    if(e.changedTouches.length>0){
      e.preventDefault();
      const t=e.changedTouches[0];
      const tc=tileDaClient(t.clientX,t.clientY);
      G.hoverR=tc.r; G.hoverC=tc.c;
      const r=tc.r,c=tc.c;
      if(G.modalitaCostruzione!=='sentiero' && roadTouch.draw){
        resetRoadTouch();
      }
      if(G.modalitaCostruzione==='sentiero'){
        // Tap breve = un solo tile. Drag normale = pan. Long-press aveva già disegnato.
        if(!pan.mosso && !roadTouch.draw) piazzaSentiero(r,c);
      }
      else if(G.modalitaCostruzione){
        if(!pan.mosso) piazzaEdificio(r,c);
      }
      else if(!pan.mosso){
        const b=G.edifici.find(x=>x.r===r&&x.c===c);
        if(b){ if(typeof apriPopupEdificio==='function') apriPopupEdificio(b); }
        else{
          const tt=(G.mappa[r]!==undefined)?G.mappa[r][c]:undefined;
          if(tt!==undefined){
            const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
            aggMsg('📍 '+(nomi[tt]||'?'));
          }
        }
      }
    }
    if(e.touches.length===0){ pan.attivo=false; pinch.attivo=false; resetRoadTouch(); }
  },{passive:false});

  touchTarget.addEventListener('touchcancel',()=>{
    pan.attivo=false; pinch.attivo=false; pinch.wasPinching=false;
    canvas.__islaSuppressClickUntil=Date.now()+300;
  },{passive:false});

  // iOS Safari fallback: alcuni dispositivi emettono GestureEvent oltre ai touch event.
  let gestureZoom0=1;
  touchTarget.addEventListener('gesturestart',e=>{
    e.preventDefault(); gestureZoom0=G.ISO_SCALE||1; pinch.wasPinching=true;
    canvas.__islaSuppressClickUntil=Date.now()+400;
  },{passive:false});
  touchTarget.addEventListener('gesturechange',e=>{
    e.preventDefault();
    const rect=canvasRect();
    const px=isFinite(e.clientX)?e.clientX-rect.left:rect.width/2;
    const py=isFinite(e.clientY)?e.clientY-rect.top:rect.height/2;
    const target=Math.max(G.ZOOM_MIN||0.35,Math.min(G.ZOOM_MAX||2.5,gestureZoom0*(e.scale||1)));
    zoomCanvas(target/(G.ISO_SCALE||1),px,py);
  },{passive:false});
  touchTarget.addEventListener('gestureend',e=>{
    e.preventDefault(); setTimeout(()=>{pinch.wasPinching=false;},140);
  },{passive:false});

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
