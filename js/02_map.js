// ═══════════════════════════════════════
// MODULO: MAP
// ═══════════════════════════════════════
function generaHeightmap(rows, cols, cx, cy){
  const h=[];
  for(let r=0;r<rows;r++){
    h.push([]);
    for(let c=0;c<cols;c++){
      const dx=c-cx, dy=r-cy;
      const dist=Math.sqrt(dx*dx+dy*dy*1.15);
      // noise multi-ottava
      const n1=(Math.sin(c*.65+r*.3)*.5+Math.cos(c*1.1-r*.8)*.5)*2.8;
      const n2=(Math.sin(c*1.3-r*.7)*.3+Math.cos(c*.5+r*1.2)*.3)*1.2;
      const n3=Math.sin(c*2.1+r*1.8)*.4;
      h[r].push(dist - n1 - n2 - n3);
    }
  }
  return h;
}

function generaMappa(){
  const cx=G.COLS/2, cy=G.RIGHE/2;
  const hm=generaHeightmap(G.RIGHE,G.COLS,cx,cy);
  G.altezza=hm; // salva per uso nel renderer (ombreggiatura colline)

  G.mappa=Array.from({length:G.RIGHE},()=>Array(G.COLS).fill(T.OCEANO));

  // biomi base da heightmap
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const d=hm[r][c];
    if(d<2.8)       G.mappa[r][c]=T.COLLINA;   // cime
    else if(d<4.5)  G.mappa[r][c]=T.FORESTA;
    else if(d<6.8)  G.mappa[r][c]=T.ERBA;
    else if(d<8.5)  G.mappa[r][c]=T.SABBIA;
    else if(d<10.2) G.mappa[r][c]=T.BASSO;
    // else OCEANO
  }

  // ── FIUME: scende dalla collina verso il mare ──
  // trova un punto di partenza sulle colline
  let fsr=-1, fsc=-1;
  for(let r=2;r<G.RIGHE-2;r++) for(let c=2;c<G.COLS-2;c++){
    if(G.mappa[r][c]===T.COLLINA && fsr===-1){
      // prende il primo punto collinare non troppo al centro
      const dx=c-cx, dy=r-cy;
      if(Math.abs(dx)>2||Math.abs(dy)>2){ fsr=r; fsc=c; }
    }
  }
  G.fiume=[]; // array di {r,c} per il percorso
  if(fsr>0){
    let r=fsr, c=fsc;
    const visited=new Set();
    for(let step=0;step<60;step++){
      const k=r+','+c;
      if(visited.has(k)) break;
      visited.add(k);
      if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) break;
      const t=G.mappa[r][c];
      if(t===T.OCEANO||t===T.BASSO) break;
      G.fiume.push({r,c});
      G.mappa[r][c]=T.FIUME;
      // scende verso il punto più basso (più alto hm = più vicino all'oceano)
      const dirs=[[r-1,c],[r+1,c],[r,c-1],[r,c+1],[r-1,c-1],[r+1,c+1],[r-1,c+1],[r+1,c-1]];
      let best=null, bestH=-Infinity;
      for(const[nr,nc] of dirs){
        if(nr<0||nr>=G.RIGHE||nc<0||nc>=G.COLS) continue;
        if(visited.has(nr+','+nc)) continue;
        const nh=hm[nr][nc];
        if(nh>bestH){ bestH=nh; best=[nr,nc]; }
      }
      if(!best) break;
      r=best[0]; c=best[1];
    }
  }

  // ── SENTIERO: dalla spiaggia verso il centro ──
  G.sentieri=[];
  // trova un tile di sabbia sul bordo est
  let psr=-1, psc=-1;
  for(let r=Math.floor(cy)-2;r<Math.floor(cy)+3;r++){
    for(let c=G.COLS-2;c>G.COLS-6;c--){
      if(G.mappa[r] && G.mappa[r][c]===T.SABBIA){ psr=r; psc=c; break; }
    }
    if(psr>0) break;
  }
  if(psr>0){
    // percorso greedy verso il centro
    let r=psr, c=psc;
    const visited=new Set();
    for(let step=0;step<50;step++){
      const k=r+','+c;
      if(visited.has(k)) break;
      visited.add(k);
      if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) break;
      const t=G.mappa[r][c];
      if(t===T.COLLINA||t===T.FIUME||t===T.OCEANO||t===T.BASSO) break;
      G.sentieri.push({r,c});
      G.mappa[r][c]=T.SENTIERO;
      // muoviti verso il centro
      const dc=cx-c, dr=cy-r;
      const dirs=[];
      if(Math.abs(dc)>Math.abs(dr)) dirs.push([r,c+(dc>0?1:-1)],[r+(dr>0?1:-1),c]);
      else dirs.push([r+(dr>0?1:-1),c],[r,c+(dc>0?1:-1)]);
      dirs.push([r+(dr>0?1:-1),c+(dc>0?1:-1)]);
      let moved=false;
      for(const[nr,nc] of dirs){
        if(nr<0||nr>=G.RIGHE||nc<0||nc>=G.COLS) continue;
        if(visited.has(nr+','+nc)) continue;
        const nt=G.mappa[nr][nc];
        if(nt===T.OCEANO||nt===T.BASSO||nt===T.FIUME) continue;
        r=nr; c=nc; moved=true; break;
      }
      if(!moved) break;
    }
  }

  // ── PALUDE: zona umida vicino al fiume/acqua bassa ──
  for(let r=1;r<G.RIGHE-1;r++) for(let c=1;c<G.COLS-1;c++){
    if(G.mappa[r][c]!==T.ERBA) continue;
    // vicino a BASSO o FIUME?
    let vicino=false;
    for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nt=G.mappa[r+dr]&&G.mappa[r+dr][c+dc];
      if(nt===T.BASSO||nt===T.FIUME){ vicino=true; break; }
    }
    if(vicino && Math.random()<0.45) G.mappa[r][c]=T.PALUDE;
  }

  // ── rocce sulle colline ──
  G.rocce=[];
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]===T.COLLINA && Math.random()<0.25){
      G.rocce.push({r,c,scala:0.5+Math.random()*.6});
    }
    if((G.mappa[r][c]===T.ERBA||G.mappa[r][c]===T.FORESTA) && Math.random()<0.04){
      G.rocce.push({r,c,scala:0.4+Math.random()*.4});
    }
  }

  // ── alberi ──
  G.alberi=[];
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const t=G.mappa[r][c];
    if(t===T.FORESTA && Math.random()<0.72){
      G.alberi.push({r,c,ox:(Math.random()-.5)*.8,oy:(Math.random()-.5)*.8,
        scala:0.55+Math.random()*.42,tinta:Math.random()});
    }
    if(t===T.PALUDE && Math.random()<0.3){
      // alberi di palude più bassi/pallidi
      G.alberi.push({r,c,ox:(Math.random()-.5)*.6,oy:(Math.random()-.5)*.6,
        scala:0.35+Math.random()*.25,tinta:0.2+Math.random()*.2,palude:true});
    }
  }

  G.pois=[
    {etich:'Rotta Commerciale',icona:'🚢',c:G.COLS-3,r:2,tipo:'mercante'},
    {etich:'Pattuglia Reale',  icona:'⚓',c:1,r:2,tipo:'reale'},
    {etich:'Cala dei Corsari', icona:'💀',c:G.COLS-4,r:G.RIGHE-3,tipo:'corsaro'},
    {etich:'Rovine Antiche',   icona:'🏛',c:2,r:G.RIGHE-4,tipo:'rovine'},
  ];
}

// ═══════════════════════════════════════════════════
// CANVAS RENDERER  —  top-down dettagliato
// ═══════════════════════════════════════════════════
