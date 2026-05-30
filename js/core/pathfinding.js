// Isla del Diablo — core/pathfinding.js
// Estratto da 26_pathfinding.js nella modularizzazione v20.18.

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

function tileSentieroLibero(r,c){
  r=Math.floor(r); c=Math.floor(c);
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  if(G.mappa[r][c]!==T.SENTIERO) return false;
  return !(typeof edificioInTile==='function' ? edificioInTile(r,c) : false);
}

function trovaSentieroVicino(r,c,raggio=8){
  r=Math.round(r); c=Math.round(c);
  if(tileSentieroLibero(r,c)) return {r,c};
  for(let rad=1;rad<=raggio;rad++){
    let best=null, bestD=Infinity;
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const nr=r+dr,nc=c+dc;
      if(!tileSentieroLibero(nr,nc)) continue;
      const d=Math.abs(dr)+Math.abs(dc);
      if(d<bestD){ best={r:nr,c:nc}; bestD=d; }
    }
    if(best) return best;
  }
  return trovaTileCamminabileVicino(r,c,raggio);
}

function accessiSentieroEdificioPirata(ed){
  if(!ed) return [];
  const celle=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dr,dc])=>({r:ed.r+dr,c:ed.c+dc}));
  return celle.filter(p=>tileSentieroLibero(p.r,p.c));
}

function accessoPirataEdificio(ed, daR=null, daC=null){
  const acc=accessiSentieroEdificioPirata(ed);
  if(!acc.length) return null;
  if(daR!==null){
    acc.sort((a,b)=>heuristica(a.r,a.c,daR,daC)-heuristica(b.r,b.c,daR,daC));
  }
  return acc[0];
}

function astarSentieri(sr,sc,er,ec){
  sr=Math.floor(sr); sc=Math.floor(sc); er=Math.floor(er); ec=Math.floor(ec);
  if(sr===er&&sc===ec) return [];
  const key=(r,c)=>r*1000+c;
  const open=new Map([[key(sr,sc),{r:sr,c:sc}]]);
  const g=new Map([[key(sr,sc),0]]);
  const f=new Map([[key(sr,sc),heuristica(sr,sc,er,ec)]]);
  const parent=new Map();
  const closed=new Set();
  let iter=0;
  while(open.size && iter++<900){
    let bestK=null,bestF=Infinity;
    for(const[k] of open){ const fv=f.get(k)||Infinity; if(fv<bestF){bestF=fv;bestK=k;} }
    const cur=open.get(bestK); open.delete(bestK); closed.add(bestK);
    if(cur.r===er && cur.c===ec){
      const path=[]; let k=key(er,ec);
      while(parent.has(k)){ const n=parent.get(k); path.unshift({r:n.r,c:n.c}); k=key(n.r,n.c); }
      path.push({r:er,c:ec}); return path;
    }
    for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=cur.r+dr,nc=cur.c+dc,nk=key(nr,nc);
      if(closed.has(nk)||!tileSentieroLibero(nr,nc)) continue;
      const ng=(g.get(bestK)||0)+1;
      if(!open.has(nk)||ng<(g.get(nk)||Infinity)){
        g.set(nk,ng); f.set(nk,ng+heuristica(nr,nc,er,ec));
        parent.set(nk,{r:cur.r,c:cur.c}); open.set(nk,{r:nr,c:nc});
      }
    }
  }
  return null;
}

function trovaPercorsoPirataVersoEdificio(sr,sc,ed){
  if(!ed) return null;
  const start=trovaSentieroVicino(sr,sc,8);
  const end=accessoPirataEdificio(ed,start.r,start.c);
  if(!end) return null;
  const path=astarSentieri(start.r,start.c,end.r,end.c);
  return path && path.length ? {path,dest:end} : null;
}

function bonusSentieroPer(r,c){
  const rr=Math.floor(r), cc=Math.floor(c);
  const t=G.mappa[rr]&&G.mappa[rr][cc];
  return t===T.SENTIERO ? 1.35 : 0.55;
}

// ═══════════════════════════════════════════════════
// FASE 2E — NPC sui sentieri
// I personaggi non puntano più al centro degli edifici: cercano l'accesso
// su sentiero più vicino, così il traffico visibile passa dalla rete viaria.
// ═══════════════════════════════════════════════════
const EDIFICI_SOCIALI_PIRATI = ['taverna','bordello','arena','cantastorie','porto','governatore','casapirata'];

function edificioA(r,c){
  return (typeof edificioInTile==='function')
    ? edificioInTile(Math.floor(r),Math.floor(c))
    : (G.edifici && G.edifici.find(b=>b.r===r && b.c===c));
}
function tileCamminabilePersona(r,c){
  if(!tileCamminabile(r,c)) return false;
  // Evita di attraversare gli edifici: gli NPC devono fermarsi all'ingresso.
  return !edificioA(Math.floor(r),Math.floor(c));
}
function accessiCamminabiliEdificio(ed){
  if(!ed) return [];
  const out=[];
  const celle=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dr,dc])=>({r:ed.r+dr,c:ed.c+dc}));
  for(const cell of celle){
    const r=cell.r,c=cell.c;
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) continue;
    if(tileCamminabilePersona(r,c)) out.push({r,c,sentiero:G.mappa[r][c]===T.SENTIERO});
  }
  out.sort((a,b)=>(b.sentiero?1:0)-(a.sentiero?1:0));
  return out;
}
function accessoMiglioreEdificio(ed, daR=null, daC=null){
  const acc=accessiCamminabiliEdificio(ed);
  if(!acc.length) return ed ? {r:ed.r,c:ed.c} : null;
  if(daR===null) return acc[0];
  acc.sort((a,b)=>{
    const sa=(a.sentiero?0:8)+heuristica(a.r,a.c,daR,daC);
    const sb=(b.sentiero?0:8)+heuristica(b.r,b.c,daR,daC);
    return sa-sb;
  });
  return acc[0];
}
function trovaPercorsoVersoEdificio(sr,sc,ed){
  if(!ed) return null;
  const start=tileCamminabilePersona(sr,sc) ? {r:sr,c:sc} : trovaTileCamminabileVicino(sr,sc,6);
  const end=accessoMiglioreEdificio(ed,start.r,start.c);
  if(!end) return null;
  const path=astar(start.r,start.c,end.r,end.c);
  return path && path.length ? {path,dest:end} : null;
}
function edificiPerTipo(tipi){
  return (G.edifici||[]).filter(b=>tipi.includes(b.tipo));
}
function scegliDestinazioneSocialePirata(p){
  const candidati=[];
  const add=(tipo,peso)=>{
    for(const b of G.edifici.filter(x=>x.tipo===tipo)){
      const eff=typeof efficienzaStradaEdificio==='function' ? efficienzaStradaEdificio(b) : 1;
      candidati.push({b,peso:peso*(0.45+eff)});
    }
  };
  // Bisogni chiave: umore basso => servizi, umore alto => porto/palazzo/casa.
  const u=p.umore||50;
  add('taverna', u<65 ? 5 : 2);
  add('bordello', G.bisogni?.divertimento<60 ? 4 : 1.5);
  add('arena', p.combattimento<55 ? 3 : 1.2);
  add('cantastorie', 2.5);
  add('porto', 3.2);
  add('governatore', 1.4);
  add('casapirata', 1.8);
  // Fallback: qualsiasi edificio scenario collegato.
  if(!candidati.length) for(const b of G.edifici||[]) candidati.push({b,peso:1});
  if(!candidati.length) return null;
  let tot=candidati.reduce((a,x)=>a+x.peso,0);
  let r=Math.random()*tot;
  for(const x of candidati){ r-=x.peso; if(r<=0) return x.b; }
  return candidati[candidati.length-1].b;
}
function applicaEffettoSostaPirata(p){
  const ed=p._destEdificio ? G.edifici.find(b=>b.r===p._destEdificio.r&&b.c===p._destEdificio.c) : null;
  if(!ed) return;
  if(ed.tipo==='taverna' && G.rum>0){ G.rum=Math.max(0,G.rum-1); p.umore=Math.min(100,(p.umore||50)+7); }
  else if(['bordello','arena','cantastorie'].includes(ed.tipo)){ p.umore=Math.min(100,(p.umore||50)+4); }
  else if(ed.tipo==='porto'){ p.umore=Math.min(100,(p.umore||50)+1); }
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
      if(edificioA(nr,nc)) continue;
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
// Velocità di camminata: lenta e leggibile, più vicina a Tropico 2.
// muoviPirata(p, dt) riceve il delta time visivo, non il moltiplicatore
// pieno del calendario: "Max" accelera i giorni, ma non fa correre i pirati.
//
// aggiornaPirata(p) è chiamato dal tick (ogni ~8 secondi reali / velocita)
// e decide il prossimo obiettivo. I timer interni sono in secondi reali
// per essere indipendenti dall'fps.
// ═══════════════════════════════════════════════════

// Velocità di camminata base in tile/secondo
const PIRATA_SPEED = 0.62;

function scalaMovimentoMondo(){
  const v=G.velocita||0;
  if(v<=0) return 0;
  const m=G.bilanciamento?.movimento||{};
  if(v<=1) return m.normale??.92;
  if(v<=2.1) return m.veloce??1.08;
  return m.max??1.24;
}

function aggiornaPirata(p){
  if(p.inRaid || p._stato==='in_raid') return;
  // Pausa all'edificio: la durata viene gestita in muoviPirata.
  if(p._stato==='pausa') return;

  // Se ha raggiunto l'accesso dell'edificio, sosta e applica micro-effetto sociale.
  if(p._stato==='cammina' && p.percorso && p.percorsoIdx>=(p.percorso.length||0)){
    p._stato='pausa';
    p._pausaSec = 7 + Math.random()*12;
    applicaEffettoSostaPirata(p);
    return;
  }

  if(p._stato!=='cammina'){
    p._vagaSec = (p._vagaSec||0) - Math.max(1,(G.tickMs/1000)/(G.velocita||1));
    if(p._vagaSec > 0) return;
    p._vagaSec = 9 + Math.random()*14;

    const target=scegliDestinazioneSocialePirata(p);
    if(target){
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.floor(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.floor(p.mc)));
      const res=(typeof trovaPercorsoPirataVersoEdificio==='function') ? trovaPercorsoPirataVersoEdificio(sr,sc,target) : trovaPercorsoVersoEdificio(sr,sc,target);
      if(res && res.path && res.path.length>0){
        p.dest={r:res.dest.r,c:res.dest.c};
        p._destEdificio={tipo:target.tipo,r:target.r,c:target.c};
        p.percorso=res.path;
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
      const v=0.07+Math.random()*0.09; // 0.07-0.16 tile/sec: idle lento, più gestionale/Tropico 2
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
    if(!tileSentieroLibero(Math.floor(p.mr),Math.floor(p.mc))){
      p.mc=oldC; p.mr=oldR;
      p._vagaDx=0; p._vagaDy=0;
    }
  }

  // Bounds + sicurezza terreno
  const margin=1.5;
  p.mc=Math.max(margin,Math.min(G.COLS-margin,p.mc));
  p.mr=Math.max(margin,Math.min(G.RIGHE-margin,p.mr));
  if(!tileSentieroLibero(Math.floor(p.mr),Math.floor(p.mc))){
    const safe=trovaSentieroVicino(p.mr,p.mc,10);
    p.mr=safe.r+.5; p.mc=safe.c+.5;
    p._stato='vaga'; p.percorso=null; p.percorsoIdx=0;
  }
}

// ── COSTRUZIONE SENTIERO ──
let sentieroDrag=false;
function iniziaSentieroDrag(r,c){ sentieroDrag=true; piazzaSentiero(r,c); }
function fineSentieroDrag(){ sentieroDrag=false; }
function terrenoConvertibileInSentiero(t){
  // Coerente con Tropico 2: il sentiero può tagliare erba, sabbia, colline basse,
  // foresta/palude ripulite e tile già stradali. Non attraversa acqua, fiumi o edifici.
  return t===T.SABBIA || t===T.ERBA || t===T.COLLINA ||
         t===T.FORESTA || t===T.PALUDE || t===T.SENTIERO;
}

function tileValidoPerSentiero(r,c){
  r=Math.floor(Number(r)); c=Math.floor(Number(c));
  if(!isFinite(r)||!isFinite(c)||r<0||r>=G.RIGHE||c<0||c>=G.COLS) return false;
  const t=G.mappa[r] ? G.mappa[r][c] : undefined;
  if(t===undefined || !terrenoConvertibileInSentiero(t)) return false;
  const occupato=(typeof edificioInTile==='function') ? edificioInTile(r,c) : (G.edifici && G.edifici.find(b=>b.r===r&&b.c===c));
  if(occupato) return false;
  return true;
}

function centroTileSchermoSentiero(r,c){
  if(typeof isoProj!=='function') return null;
  const s=(G&&G.ISO_SCALE)||1;
  const IH=((G&&G.ISO_H)||32)*s;
  const p=isoProj(c,r);
  return {x:p.x,y:p.y+IH/2};
}

function risolviTileSentiero(r,c){
  r=Math.floor(Number(r)); c=Math.floor(Number(c));

  // Se il tile sotto il puntatore è già libero, usalo normalmente.
  // Eccezione: se è già sentiero e il puntatore arriva da una sagoma edificio,
  // non vogliamo fermarci su una strada già esistente: l'utente sta cercando di
  // costruire il tile nascosto dietro/lato edificio.
  if(tileValidoPerSentiero(r,c) && G.mappa[r][c]!==T.SENTIERO) return {r,c};

  const edificioOccupato=(typeof edificioInTile==='function') ? edificioInTile(r,c) : (G.edifici && G.edifici.find(b=>b.r===r&&b.c===c));
  const occupato = !!edificioOccupato;
  if(tileValidoPerSentiero(r,c) && !occupato) return {r,c};
  if(!occupato) return null;

  const ptr = G.__roadPointerClient;
  const canvasEl = window.canvas || document.getElementById('mappa-canvas');
  const rect = canvasEl ? canvasEl.getBoundingClientRect() : null;
  let px=null, py=null;
  if(ptr && rect && Date.now()-ptr.t < 1500){
    px = ptr.x - rect.left;
    py = ptr.y - rect.top;
  }

  // Candidati attorno all'edificio. Il punto chiave del fix:
  // preferiamo SEMPRE un tile nuovo da convertire a sentiero rispetto a una
  // strada già esistente. Prima il vecchio resolver sceglieva spesso una strada
  // vicina, quindi il click sembrava non fare nulla.
  const baseCandidates = [];
  if(edificioOccupato && typeof anelloEdificio==='function'){
    const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(edificioOccupato) : {r,c};
    for(const cell of anelloEdificio(edificioOccupato)){
      baseCandidates.push({r:cell.r,c:cell.c,bias:(cell.r+cell.c<centro.r+centro.c ? -25 : 8)});
    }
  }else{
    baseCandidates.push(
      {r:r-1,c:c, bias:-60}, {r:r,c:c-1, bias:-60}, {r:r-1,c:c-1, bias:-45},
      {r:r-1,c:c+1, bias:-25}, {r:r+1,c:c-1, bias:-25},
      {r:r,c:c+1, bias:0}, {r:r+1,c:c, bias:0}, {r:r+1,c:c+1, bias:15}
    );
    for(let rr=r-2; rr<=r+2; rr++){
      for(let cc=c-2; cc<=c+2; cc++){
        if(Math.max(Math.abs(rr-r),Math.abs(cc-c))!==2) continue;
        baseCandidates.push({r:rr,c:cc,bias:(rr+cc<r+c ? -20 : 20)});
      }
    }
  }

  function scoreCandidate(cand){
    let score=0;
    if(px!==null && py!==null){
      const center=centroTileSchermoSentiero(cand.r,cand.c);
      if(center) score=Math.hypot(px-center.x,py-center.y);
      else score=9999;
    }else{
      score=Math.abs(cand.r-r)+Math.abs(cand.c-c)*1.05;
    }
    score += cand.bias || 0;
    // Bonus leggero per continuare una rete esistente, ma NON abbastanza da
    // preferire una strada già costruita a un tile nuovo.
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=cand.r+dr,nc=cand.c+dc;
      if(G.mappa[nr] && G.mappa[nr][nc]===T.SENTIERO) score -= 8;
    }
    return score;
  }

  // Primo passaggio: solo tile validi NON ancora sentiero.
  let best=null, bestScore=Infinity;
  for(const cand of baseCandidates){
    if(!tileValidoPerSentiero(cand.r,cand.c)) continue;
    if(G.mappa[cand.r][cand.c]===T.SENTIERO) continue;
    const score=scoreCandidate(cand);
    if(score<bestScore){ bestScore=score; best={r:cand.r,c:cand.c}; }
  }
  if(best) return best;

  // Fallback: se tutti i tile intorno sono già sentiero, consenti il vecchio comportamento.
  best=null; bestScore=Infinity;
  for(const cand of baseCandidates){
    if(!tileValidoPerSentiero(cand.r,cand.c)) continue;
    const score=scoreCandidate(cand);
    if(score<bestScore){ bestScore=score; best={r:cand.r,c:cand.c}; }
  }
  return best;
}

function piazzaSentiero(r,c){
  // Resolver separato dalla validazione: se il click cade sulla sagoma/altezza di un edificio,
  // risolviTileSentiero sceglie un tile libero adiacente. Qui validiamo SOLO il tile finale.
  const target=risolviTileSentiero(Math.floor(Number(r)),Math.floor(Number(c)));
  if(!target){
    if(typeof aggMsg==='function') aggMsg('🛤 Qui il sentiero non può passare.','male');
    return;
  }
  r=Math.floor(Number(target.r)); c=Math.floor(Number(target.c));
  if(!tileValidoPerSentiero(r,c)){
    if(typeof aggMsg==='function') aggMsg('🛤 Tile bloccato: serve terra libera, non acqua o edificio.','male');
    return;
  }
  const t=G.mappa[r][c];
  if(t!==T.SENTIERO){
    if(G.oro<2){ aggMsg('Servono 2 oro per ogni tile sentiero','male'); return; }
    G.oro-=2;
    // Ripulisce elementi naturali sul tile convertito, evitando rocce/alberi disegnati sopra la strada.
    if(Array.isArray(G.alberi)) G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
    if(Array.isArray(G.rocce)) G.rocce=G.rocce.filter(rc=>!(Math.floor(rc.r)===r&&Math.floor(rc.c)===c));
    G.mappa[r][c]=T.SENTIERO;
    if(typeof _tileCache!=='undefined') _tileCache=null;
    for(const p of (G.pirati||[])){ p.percorso=null; p.percorsoIdx=0; }
    for(const s of (G.schiavi||[])){ s.percorso=null; s.percorsoIdx=0; }
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
