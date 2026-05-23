// ═══════════════════════════════════════
// MODULO: PATHFINDING
// ═══════════════════════════════════════
function heuristica(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2); }

function costoTile(r,c){
  const t=G.mappa[r]&&G.mappa[r][c];
  if(t===undefined) return Infinity;
  // FASE 2C: i sentieri diventano la vera rete dell'isola.
  // Molto più convenienti rispetto al terreno naturale, così pirati e schiavi
  // preferiscono le strade invece di tagliare per spiagge/foreste.
  if(t===T.SENTIERO) return 0.45;
  if(t===T.SABBIA||t===T.ERBA) return 6;
  if(t===T.PALUDE) return 9;
  if(t===T.COLLINA) return 10;
  if(t===T.FORESTA) return 14;
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME||t===T.ROCCIA) return Infinity;
  return 8;
}

function tileCamminabile(r,c){
  return costoTile(Math.floor(r),Math.floor(c))<Infinity;
}

function trovaTileCamminabileVicino(r,c,raggio=6){
  r=Math.round(r); c=Math.round(c);
  if(tileCamminabile(r,c)) return {r,c};
  for(let rad=1;rad<=raggio;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if(tileCamminabile(nr,nc)) return {r:nr,c:nc};
    }
  }
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2)};
}

function bonusSentieroPer(r,c){
  const rr=Math.floor(r), cc=Math.floor(c);
  const t=G.mappa[rr]&&G.mappa[rr][cc];
  return t===T.SENTIERO ? 1.45 : 0.72;
}

function astar(sr,sc,er,ec){
  if(sr===er&&sc===ec) return [];
  const key=(r,c)=>r*1000+c;
  const open=new Map();
  const g=new Map(); const f=new Map(); const parent=new Map();
  g.set(key(sr,sc),0);
  f.set(key(sr,sc),heuristica(sr,sc,er,ec));
  open.set(key(sr,sc),{r:sr,c:sc});
  const closed=new Set();
  let iter=0;
  while(open.size>0&&iter++<800){
    let bestK=null,bestF=Infinity;
    for(const[k,_] of open){ const fv=f.get(k)||Infinity; if(fv<bestF){bestF=fv;bestK=k;} }
    const cur=open.get(bestK);
    open.delete(bestK); closed.add(bestK);
    if(cur.r===er&&cur.c===ec){
      const path=[];
      let k=key(er,ec);
      while(parent.has(k)){ const n=parent.get(k); path.unshift({r:n.r,c:n.c}); k=key(n.r,n.c); }
      path.push({r:er,c:ec});
      return path;
    }
    const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for(const[dr,dc] of dirs){
      const nr=cur.r+dr,nc=cur.c+dc;
      const nk=key(nr,nc);
      if(closed.has(nk)) continue;
      const cost=costoTile(nr,nc); if(cost===Infinity) continue;
      const diag=dr!==0&&dc!==0;
      const ng=(g.get(bestK)||0)+cost*(diag?1.4:1);
      if(!open.has(nk)||ng<(g.get(nk)||Infinity)){
        g.set(nk,ng);
        f.set(nk,ng+heuristica(nr,nc,er,ec));
        parent.set(nk,{r:cur.r,c:cur.c});
        open.set(nk,{r:nr,c:nc});
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════
// MOVIMENTO PIRATI — stile Tropico 2
//
// Velocità di camminata: ~1.5 tile/secondo alla velocità normale.
// muoviPirata(p, dt) riceve il delta time in secondi dall'ultimo frame,
// già moltiplicato per G.velocita → se G.velocita=0 i pirati si fermano.
//
// aggiornaPirata(p) è chiamato dal tick (ogni ~8 secondi reali / velocita)
// e decide il prossimo obiettivo. I timer interni sono in secondi reali
// per essere indipendenti dall'fps.
// ═══════════════════════════════════════════════════

// Velocità di camminata base in tile/secondo
const PIRATA_SPEED = 1.4;

function aggiornaPirata(p){
  // Pausa all'edificio: decrementa timer in secondi
  if(p._stato==='pausa'){
    // la pausa viene gestita in muoviPirata con _pausaSec
    return;
  }

  // Se sta camminando e ha finito il percorso → pausa
  if(p._stato==='cammina' && p.percorso && p.percorsoIdx>=(p.percorso.length||0)){
    p._stato='pausa';
    p._pausaSec = 3 + Math.random()*5; // 3-8 secondi reali di pausa
    return;
  }

  // Se vaga, ogni tanto cerca una nuova destinazione
  if(p._stato!=='cammina'){
    p._vagaSec = (p._vagaSec||0) - (G.tickMs/1000/G.velocita||8);
    if(p._vagaSec > 0) return;
    p._vagaSec = 6 + Math.random()*10; // nuova scelta ogni 6-16 secondi reali

    if(G.edifici.length>0 && Math.random()<0.7){
      const candidati=G.edifici.filter(b=>!p.dest||(b.r!==p.dest.r||b.c!==p.dest.c));
      const pool=candidati.length>0 ? candidati : G.edifici;
      const target=pool[Math.floor(Math.random()*pool.length)];
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.round(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.round(p.mc)));
      const path=astar(sr,sc,target.r,target.c);
      if(path && path.length>0){
        p.dest={r:target.r,c:target.c};
        p.percorso=path;
        p.percorsoIdx=0;
        p._stato='cammina';
      }
    }
  }
}

// dt = delta time in secondi, già scalato per velocita (=0 se in pausa)
function muoviPirata(p, dt){
  // In pausa: decrementa timer, poi torna a vagare
  if(p._stato==='pausa'){
    if(dt>0){
      p._pausaSec=(p._pausaSec||0)-dt;
      if(p._pausaSec<=0){
        p._stato='vaga';
        p._vagaSec=0; // riparte subito a cercare dest
        p.dest=null; p.percorso=null; p.percorsoIdx=0;
      }
    }
    return;
  }

  if(dt===0) return; // gioco in pausa

  // NaN guard: resetta coordinate se corrotte
  if(!isFinite(p.mc)||!isFinite(p.mr)){
    p.mc=G.COLS/2; p.mr=G.RIGHE/2;
    p._stato='vaga'; p.percorso=null; p.percorsoIdx=0;
    return;
  }

  if(p._stato==='cammina' && p.percorso && p.percorsoIdx<p.percorso.length){
    const target=p.percorso[p.percorsoIdx];
    const tx=target.c+.5, ty=target.r+.5;
    const dx=tx-p.mc, dy=ty-p.mr;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const step=PIRATA_SPEED*dt*bonusSentieroPer(p.mr,p.mc);
    if(dist<step+0.01 || dist===0){  // dist===0 evita NaN da 0/0
      p.mc=tx; p.mr=ty;
      p.percorsoIdx++;
    } else {
      p.mc+=dx/dist*step;
      p.mr+=dy/dist*step;
    }
  } else {
    // Vaga: piccolo movimento casuale nel tile corrente
    if(!p._vagaDx || Math.random()<0.01){
      const a=Math.random()*Math.PI*2;
      const v=0.15+Math.random()*0.2; // 0.15-0.35 tile/sec quando vaga
      p._vagaDx=Math.cos(a)*v;
      p._vagaDy=Math.sin(a)*v;
    }
    const dvx = isFinite(p._vagaDx) ? p._vagaDx : 0;
    const dvy = isFinite(p._vagaDy) ? p._vagaDy : 0;
    const oldC=p.mc, oldR=p.mr;
    p.mc+=dvx*dt;
    p.mr+=dvy*dt;
    // Bug visivo: mai far vagare i pirati su mare/fiume. Se la deriva casuale
    // li porta fuori dai tile camminabili, annulla il passo e scegli nuova direzione.
    if(!tileCamminabile(p.mr,p.mc)){
      p.mc=oldC; p.mr=oldR;
      p._vagaDx=0; p._vagaDy=0;
    }
  }

  // Bounds + sicurezza terreno
  const margin=1.5;
  p.mc=Math.max(margin,Math.min(G.COLS-margin,p.mc));
  p.mr=Math.max(margin,Math.min(G.RIGHE-margin,p.mr));
  if(!tileCamminabile(p.mr,p.mc)){
    const safe=trovaTileCamminabileVicino(p.mr,p.mc,8);
    p.mr=safe.r+.5; p.mc=safe.c+.5;
    p._stato='vaga'; p.percorso=null; p.percorsoIdx=0;
  }
}

// ── COSTRUZIONE SENTIERO ──
let sentieroDrag=false;
function iniziaSentieroDrag(r,c){ sentieroDrag=true; piazzaSentiero(r,c); }
function fineSentieroDrag(){ sentieroDrag=false; }
function piazzaSentiero(r,c){
  if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) return;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.ROCCIA) return;
  if(G.edifici.find(b=>b.r===r&&b.c===c)) return;
  if(t!==T.SENTIERO){
    if(G.oro<2){ aggMsg('Servono 2 oro per ogni tile sentiero','male'); return; }
    G.oro-=2;
    G.mappa[r][c]=T.SENTIERO;
    _tileCache=null;
    for(const p of G.pirati){ p.percorso=null; p.percorsoIdx=0; }
    aggiornaUI();
  }
}
function rimuoviSentiero(r,c){
  if(G.mappa[r]&&G.mappa[r][c]===T.SENTIERO){
    G.mappa[r][c]=T.ERBA;
    _tileCache=null;
    for(const p of G.pirati){ p.percorso=null; p.percorsoIdx=0; }
  }
}
