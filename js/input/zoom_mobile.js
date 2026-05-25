// Isla del Diablo — input/zoom_mobile.js
// v20.20: gestione zoom mobile separata e caricata per ultima.
// Non dipende da window.G/window.canvas: usa i global lexical bindings classici del gioco.
(function(){
  'use strict';
  if(window.__ISLA_ZOOM_MOBILE_V2020__) return;
  window.__ISLA_ZOOM_MOBILE_V2020__ = true;

  function getCanvas(){ return document.getElementById('mappa-canvas'); }
  function getWrap(){ return document.getElementById('mappa-wrap') || getCanvas(); }
  function hasGameState(){ try { return typeof G !== 'undefined' && G && isFinite(G.ISO_SCALE); } catch(e){ return false; } }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function syncCanvasGlobals(){
    const c=getCanvas();
    if(!c) return null;
    try { if(typeof canvas !== 'undefined' && !canvas) canvas=c; } catch(e){}
    try { if(typeof ctx !== 'undefined' && !ctx) ctx=c.getContext('2d'); } catch(e){}
    return c;
  }

  function applyZoom(delta, clientX, clientY){
    const c=syncCanvasGlobals();
    if(!c || !hasGameState()) return false;
    delta = Number(delta);
    if(!isFinite(delta) || delta<=0) return false;

    const rect=c.getBoundingClientRect();
    const px=isFinite(clientX) ? clientX-rect.left : rect.width/2;
    const py=isFinite(clientY) ? clientY-rect.top  : rect.height/2;

    const oldScale=(isFinite(G.ISO_SCALE) && G.ISO_SCALE>0) ? G.ISO_SCALE : 1;
    const min=G.ZOOM_MIN || 0.35;
    const max=G.ZOOM_MAX || 2.5;
    const newScale=clamp(oldScale*delta,min,max);
    if(Math.abs(newScale-oldScale)<0.0001) return false;

    const ratio=newScale/oldScale;
    G.ISO_SCALE=newScale;
    G.zoom=newScale;
    G.camX = px - (px - G.camX) * ratio;
    G.camY = py - (py - G.camY) * ratio;
    try { if(typeof limiteCamera === 'function') limiteCamera(); } catch(e){}
    try { if(typeof _tileCache !== 'undefined') _tileCache=null; } catch(e){}
    return false;
  }

  // API usata dai bottoni inline in index.html.
  window.zoomMobile=function(delta){
    const c=getCanvas();
    const rect=c ? c.getBoundingClientRect() : {left:0,top:0,width:window.innerWidth,height:window.innerHeight};
    applyZoom(delta, rect.left+rect.width/2, rect.top+rect.height/2);
    return false;
  };

  function ensureControls(){
    let box=document.getElementById('zoom-mobile');
    if(!box){
      box=document.createElement('div');
      box.id='zoom-mobile';
      box.innerHTML='<button type="button" id="zoom-plus" aria-label="Zoom avanti">＋</button><button type="button" id="zoom-minus" aria-label="Zoom indietro">－</button>';
      document.body.appendChild(box);
    }
    const plus=document.getElementById('zoom-plus');
    const minus=document.getElementById('zoom-minus');
    const bind=(btn,delta)=>{
      if(!btn) return;
      btn.type='button';
      btn.onclick=function(ev){ if(ev){ev.preventDefault();ev.stopPropagation();} return window.zoomMobile(delta); };
      if(btn.__islaZoom2020) return;
      btn.__islaZoom2020=true;
      const h=function(ev){ ev.preventDefault(); ev.stopPropagation(); return window.zoomMobile(delta); };
      btn.addEventListener('touchstart',h,{passive:false});
      btn.addEventListener('pointerdown',h,{passive:false});
      btn.addEventListener('mousedown',h,{passive:false});
    };
    bind(plus,1.18);
    bind(minus,0.85);
  }

  let pinchActive=false;
  let lastDist=0;
  let lastMid=null;
  let suppressTapUntil=0;
  function dist(t){ return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY); }
  function mid(t){ return {x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2}; }

  function bindPinch(){
    const target=getWrap();
    const c=getCanvas();
    if(!target || target.__islaPinch2020) return;
    target.__islaPinch2020=true;
    try{ target.style.touchAction='none'; }catch(e){}
    try{ if(c) c.style.touchAction='none'; }catch(e){}

    target.addEventListener('touchstart',function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('#zoom-mobile')) return;
      if(!ev.touches || ev.touches.length<2) return;
      ev.preventDefault(); ev.stopPropagation();
      pinchActive=true;
      lastDist=dist(ev.touches);
      lastMid=mid(ev.touches);
      suppressTapUntil=Date.now()+350;
    },{passive:false,capture:true});

    target.addEventListener('touchmove',function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('#zoom-mobile')) return;
      if(!ev.touches || ev.touches.length<2) return;
      ev.preventDefault(); ev.stopPropagation();
      const d=dist(ev.touches);
      if(!pinchActive || !lastDist){ pinchActive=true; lastDist=d; lastMid=mid(ev.touches); return; }
      if(d<8) return;
      const m=mid(ev.touches);
      applyZoom(d/lastDist,m.x,m.y);
      // pan del baricentro durante pinch
      if(lastMid && hasGameState()){
        const dx=m.x-lastMid.x, dy=m.y-lastMid.y;
        if(Math.abs(dx)>0.1 || Math.abs(dy)>0.1){
          G.camX += dx; G.camY += dy;
          try{ if(typeof limiteCamera==='function') limiteCamera(); }catch(e){}
        }
      }
      lastDist=d; lastMid=m; suppressTapUntil=Date.now()+350;
    },{passive:false,capture:true});

    target.addEventListener('touchend',function(ev){
      if(pinchActive){ ev.preventDefault(); ev.stopPropagation(); }
      if(!ev.touches || ev.touches.length<2){ pinchActive=false; lastDist=0; lastMid=null; }
    },{passive:false,capture:true});

    target.addEventListener('touchcancel',function(ev){
      pinchActive=false; lastDist=0; lastMid=null; suppressTapUntil=Date.now()+250;
    },{passive:false,capture:true});

    // iOS Safari legacy GestureEvent
    let gestureStartScale=1;
    target.addEventListener('gesturestart',function(ev){
      ev.preventDefault(); ev.stopPropagation();
      gestureStartScale=hasGameState()?G.ISO_SCALE:1;
      suppressTapUntil=Date.now()+350;
    },{passive:false,capture:true});
    target.addEventListener('gesturechange',function(ev){
      ev.preventDefault(); ev.stopPropagation();
      if(!hasGameState()) return;
      const wanted=clamp(gestureStartScale*(ev.scale||1),G.ZOOM_MIN||0.35,G.ZOOM_MAX||2.5);
      applyZoom(wanted/G.ISO_SCALE, ev.clientX||window.innerWidth/2, ev.clientY||window.innerHeight/2);
      suppressTapUntil=Date.now()+350;
    },{passive:false,capture:true});
  }

  function bindAll(){ ensureControls(); syncCanvasGlobals(); bindPinch(); }

  // Se avviaGioco esiste, lo wrappiamo: così lo zoom viene agganciato dopo canvas/ridimensionamento.
  function wrapStartWhenReady(){
    if(typeof avviaGioco === 'function' && !avviaGioco.__islaZoomWrapped2020){
      const old=avviaGioco;
      avviaGioco=function(){
        const ret=old.apply(this,arguments);
        setTimeout(bindAll,0);
        setTimeout(bindAll,120);
        setTimeout(bindAll,500);
        return ret;
      };
      avviaGioco.__islaZoomWrapped2020=true;
    }
  }

  document.addEventListener('DOMContentLoaded',function(){ bindAll(); wrapStartWhenReady(); });
  window.addEventListener('load',function(){ bindAll(); wrapStartWhenReady(); setTimeout(bindAll,300); });
  window.addEventListener('resize',function(){ setTimeout(bindAll,50); });
  window.addEventListener('orientationchange',function(){ setTimeout(bindAll,250); });
  // Anche subito, perché lo script è defer e il DOM di norma è già pronto.
  bindAll(); wrapStartWhenReady();
})();
