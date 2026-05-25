// Isla del Diablo — core/stability.js
// Estratto da 30_stability.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: STABILITY / BUG GUARDS v20.14
// ═══════════════════════════════════════
// Scopo: ridurre i crash runtime e intercettare bug visivi senza aggiungere
// nuove feature. Attivare log dettagliati con: localStorage.setItem('isla_debug','1')
(function(){
  const VERSIONE_STABILITA = '20.14-stability';
  let ultimoErroreMostrato = 0;
  let ultimoSanity = 0;

  function debugAttivo(){
    try { return localStorage.getItem('isla_debug') === '1'; } catch(e){ return false; }
  }
  function dbg(...args){ if(debugAttivo()) console.log('[Isla Debug]', ...args); }
  function safeMsg(msg,tipo){
    const now = Date.now();
    if(now - ultimoErroreMostrato < 3500) return;
    ultimoErroreMostrato = now;
    try{
      if(typeof aggMsg === 'function') aggMsg(msg,tipo||'info');
    }catch(e){}
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function isMappaPronta(){ return !!(window.G && Array.isArray(G.mappa) && G.mappa.length && window.T); }
  function tileOK(r,c){
    if(!isMappaPronta()) return false;
    r=Math.floor(r); c=Math.floor(c);
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
    try{
      if(typeof tileCamminabile === 'function') return tileCamminabile(r,c);
      const t = G.mappa[r] && G.mappa[r][c];
      return t!==T.OCEANO && t!==T.BASSO && t!==T.FIUME && t!==T.ROCCIA && t!==undefined;
    }catch(e){ return false; }
  }
  function acquaOK(r,c){
    if(!isMappaPronta()) return false;
    r=Math.floor(r); c=Math.floor(c);
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
    const t=G.mappa[r] && G.mappa[r][c];
    return t===T.OCEANO || t===T.BASSO;
  }
  function trovaTerraVicina(r,c,raggio){
    r=Math.round(r); c=Math.round(c); raggio=raggio||8;
    if(tileOK(r,c)) return {r,c};
    if(typeof trovaTileCamminabileVicino === 'function'){
      try{ return trovaTileCamminabileVicino(r,c,raggio); }catch(e){}
    }
    for(let rad=1; rad<=raggio; rad++){
      for(let dr=-rad; dr<=rad; dr++) for(let dc=-rad; dc<=rad; dc++){
        if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
        const nr=r+dr,nc=c+dc;
        if(tileOK(nr,nc)) return {r:nr,c:nc};
      }
    }
    return {r:Math.floor((G&&G.RIGHE||20)/2), c:Math.floor((G&&G.COLS||26)/2)};
  }
  function trovaAcquaVicina(r,c,raggio){
    r=Math.round(r); c=Math.round(c); raggio=raggio||10;
    if(acquaOK(r,c)) return {r,c};
    if(typeof trovaAcquaVicinoIso === 'function'){
      try{ const a=trovaAcquaVicinoIso(r,c,raggio); if(a) return a; }catch(e){}
    }
    for(let rad=1; rad<=raggio; rad++){
      for(let dr=-rad; dr<=rad; dr++) for(let dc=-rad; dc<=rad; dc++){
        if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
        const nr=r+dr,nc=c+dc;
        if(acquaOK(nr,nc)) return {r:nr,c:nc};
      }
    }
    return null;
  }

  // Errori runtime: non crashano silenziosamente su mobile.
  window.addEventListener('error', e=>{
    console.error('[Isla Runtime]', e.error || e.message, e.filename, e.lineno);
    safeMsg('⚠ Errore runtime intercettato. Guarda la console per dettagli.', 'male');
  });
  window.addEventListener('unhandledrejection', e=>{
    console.error('[Isla Promise]', e.reason);
    safeMsg('⚠ Errore asincrono intercettato.', 'male');
  });

  // Evita doppi avvii/loop se il pulsante viene premuto due volte su mobile.
  const _avviaGioco = window.avviaGioco;
  if(typeof _avviaGioco === 'function'){
    window.avviaGioco = function(){
      if(window.G && G._gameStarted){
        dbg('avviaGioco ignorato: partita già avviata');
        return;
      }
      if(window.G) G._gameStarted = true;
      return _avviaGioco.apply(this, arguments);
    };
  }

  // Zoom sempre coerente: G.zoom e G.ISO_SCALE non devono divergere.
  const _applicaZoom = window.applicaZoom;
  if(typeof _applicaZoom === 'function'){
    window.applicaZoom = function(delta, pivotX, pivotY){
      if(!window.G) return;
      if(!isFinite(delta) || delta<=0) return;
      const ret = _applicaZoom.apply(this, arguments);
      if(isFinite(G.ISO_SCALE)) G.zoom = G.ISO_SCALE;
      if(typeof _tileCache !== 'undefined') _tileCache = null;
      return ret;
    };
  }

  // Click/tap fuori mappa: non deve mai generare eccezioni.
  const _cliccaMappa = window.cliccaMappa;
  if(typeof _cliccaMappa === 'function'){
    window.cliccaMappa = function(e){
      try{
        if(!window.canvas || !window.G || !G.mappa) return;
        return _cliccaMappa.apply(this, arguments);
      }catch(err){
        console.warn('[Isla Guard] cliccaMappa bloccato:', err);
      }
    };
  }

  function normalizzaUnita(){
    if(!isMappaPronta()) return;
    let riposizionati=0;
    for(const p of (G.pirati||[])){
      if(p && p.inRaid) continue;
      if(!p || !isFinite(p.mr) || !isFinite(p.mc) || !tileOK(p.mr,p.mc)){
        const safe=trovaTerraVicina(p&&p.mr, p&&p.mc, 10);
        if(p){
          p.mr=safe.r+.5; p.mc=safe.c+.5;
          p._stato='vaga'; p.percorso=null; p.percorsoIdx=0; p.dest=null;
          riposizionati++;
        }
      }
    }
    for(const s of (G.schiavi||[])){
      if(!s || !isFinite(s.mr) || !isFinite(s.mc) || !tileOK(s.mr,s.mc)){
        const base={r:(s&&s.edificioR)||Math.floor(G.RIGHE/2), c:(s&&s.edificioC)||Math.floor(G.COLS/2)};
        const safe=trovaTerraVicina(base.r, base.c, 10);
        if(s){
          s.mr=safe.r+.5; s.mc=safe.c+.5;
          s.percorso=null; s.percorsoIdx=0; s._targetKey=null;
          riposizionati++;
        }
      }
    }
    if(riposizionati) dbg('unità riposizionate su terreno valido:', riposizionati);
  }

  function normalizzaNavi(){
    if(!isMappaPronta() || typeof _naviMare === 'undefined') return;
    for(const nave of (G.navi||[])){
      const nm=_naviMare[nave.id];
      if(!nm) continue;
      if(!isFinite(nm.x) || !isFinite(nm.y)){
        const porto = (typeof puntoPortoVivo==='function') ? puntoPortoVivo() : {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2)};
        const acqua=trovaAcquaVicina(porto.r, porto.c, 12);
        if(acqua && typeof isoProj==='function'){
          const p=isoProj(acqua.c, acqua.r);
          nm.x=p.x; nm.y=p.y + G.ISO_H*G.ISO_SCALE*.7;
          nm._raidWater=acqua;
        }
      }
    }
  }

  function verificaStatoLeggero(){
    if(!window.G) return;
    if(!Array.isArray(G.pirati)) G.pirati=[];
    if(!Array.isArray(G.schiavi)) G.schiavi=[];
    if(!Array.isArray(G.navi)) G.navi=[];
    if(!Array.isArray(G.edifici)) G.edifici=[];
    if(!G.fazioni) G.fazioni={reale:{rep:0},mercante:{rep:20},corsaro:{rep:50}};
    if(!G.ricerca) G.ricerca={completate:new Set(),punti:0};
    if(!(G.ricerca.completate instanceof Set)) G.ricerca.completate=new Set(G.ricerca.completate||[]);
    if(!isFinite(G.ISO_SCALE) || G.ISO_SCALE<=0) G.ISO_SCALE=1;
    G.ISO_SCALE=clamp(G.ISO_SCALE, G.ZOOM_MIN||0.35, G.ZOOM_MAX||2.5);
    G.zoom=G.ISO_SCALE;
    normalizzaUnita();
    normalizzaNavi();
  }

  // Wrapper tick/render: una singola eccezione non blocca la simulazione.
  const _tick = window.tick;
  if(typeof _tick === 'function'){
    window.tick = function(){
      try{
        verificaStatoLeggero();
        return _tick.apply(this, arguments);
      }catch(err){
        console.error('[Isla Guard] tick:', err);
        safeMsg('⚠ Tick corretto da guardia anti-crash.', 'male');
      }
    };
  }
  const _disegnaScena = window.disegnaScena;
  if(typeof _disegnaScena === 'function'){
    window.disegnaScena = function(dt){
      try{
        const now=performance.now();
        if(now-ultimoSanity>2000){ ultimoSanity=now; verificaStatoLeggero(); }
        return _disegnaScena.apply(this, arguments);
      }catch(err){
        console.error('[Isla Guard] render:', err);
      }
    };
  }

  // API manuale da console per test rapido.
  window.ISLA_DEBUG = {
    version: VERSIONE_STABILITA,
    sanity: verificaStatoLeggero,
    units: normalizzaUnita,
    ships: normalizzaNavi,
    enable(){ try{ localStorage.setItem('isla_debug','1'); }catch(e){} console.log('Isla debug ON'); },
    disable(){ try{ localStorage.removeItem('isla_debug'); }catch(e){} console.log('Isla debug OFF'); },
  };
  dbg('stability module loaded', VERSIONE_STABILITA);
})();
