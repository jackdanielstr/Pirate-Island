// Isla del Diablo — world/building_placement.js
// Estratto da 12_costruzione.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: COSTRUZIONE
// ═══════════════════════════════════════
// ── COSTRUZIONE EDIFICI & SENTIERI ──
function resetInputCostruzione(){
  if(typeof window.__islaResetTouchInputState==='function') window.__islaResetTouchInputState();
  if(typeof pan!=='undefined'){ pan.attivo=false; pan.mosso=false; }
  const c=window.canvas||document.getElementById('mappa-canvas');
  if(c) c.__islaSuppressClickUntil=0;
}

function selezionaSentiero(){
  resetInputCostruzione();
  G.modalitaCostruzione='sentiero';
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  const btn=document.getElementById('b-sentiero');
  if(btn) btn.classList.add('attivo-strumento');
  document.getElementById('btn-annulla').classList.add('mostra');
  document.getElementById('mappa-wrap').classList.add('modalita-costruzione');
  aggMsg(isMobile()&&!isLandscapeMobile()?'Sentiero: tap = 1 tile, tieni premuto e trascina = strada continua, trascina normale = muovi mappa':'Trascina sulla mappa per costruire sentieri (2 oro/tile)','info');
  if(isMobile()&&!isLandscapeMobile()) chiudiPannelloMobile();
}

function selezionaCostruzione(tipo){
  resetInputCostruzione();
  // Cambio strumento esplicito: chiude sempre lo stato speciale del sentiero
  // prima di armare il piazzamento edificio.
  G.modalitaCostruzione=tipo;
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  const btn=document.getElementById('b-'+tipo);
  if(btn) btn.classList.add('attivo-strumento');
  document.getElementById('btn-annulla').classList.add('mostra');
  document.getElementById('mappa-wrap').classList.add('modalita-costruzione');
  aggMsg(`Seleziona un tile di terra per costruire ${ED[tipo].nome}.`,'info');
  // Su mobile chiudi il drawer e porta il giocatore sulla mappa
  if(isMobile() && !isLandscapeMobile()) chiudiPannelloMobile();
  setTimeout(()=>resetInputCostruzione(),0);
}
function annullaCostruzione(){
  resetInputCostruzione();
  G.modalitaCostruzione=null;
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  document.getElementById('btn-annulla').classList.remove('mostra');
  document.getElementById('mappa-wrap').classList.remove('modalita-costruzione');
}
function terrenoCostruibileEdificio(t){
  return t===T.SABBIA||t===T.ERBA||t===T.COLLINA||t===T.SENTIERO;
}

function puoCostruire(r,c,tipo=G.modalitaCostruzione){
  if(!tipo || !ED[tipo]) return false;
  const origine=(typeof origineEdificioDaCentro==='function') ? origineEdificioDaCentro(tipo,r,c) : {r,c};
  const celle=(typeof celleEdificio==='function') ? celleEdificio(tipo,origine.r,origine.c) : [{r,c}];
  for(const cell of celle){
    if(cell.r<0||cell.c<0||cell.r>=G.RIGHE||cell.c>=G.COLS) return false;
    const t=G.mappa[cell.r]&&G.mappa[cell.r][cell.c];
    if(!terrenoCostruibileEdificio(t)) return false;
    const occupato=(typeof edificioInTile==='function')
      ? edificioInTile(cell.r,cell.c)
      : G.edifici.find(b=>b.r===cell.r&&b.c===cell.c);
    if(occupato) return false;
  }
  // cantiere/porto: almeno una cella dell'impronta deve toccare spiaggia/acque basse.
  if(tipo==='cantiere'||tipo==='porto'||tipo==='shipyard'){
    const vicini=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
    const hasSpiaggia=celle.some(cell=>vicini.some(([dr,dc])=>{
      const nr=cell.r+dr,nc=cell.c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) return false;
      return G.mappa[nr][nc]===T.SABBIA||G.mappa[nr][nc]===T.BASSO;
    }));
    if(!hasSpiaggia) return false;
  }
  return true;
}
function piazzaEdificio(r,c){
  const tipo=G.modalitaCostruzione;
  if(!tipo || tipo==='sentiero' || !ED[tipo]){
    aggMsg('Seleziona prima un edificio da costruire.','male');
    return;
  }
  const def=ED[tipo];
  if(!puoCostruire(r,c,tipo)){aggMsg('Non puoi costruire qui!','male');return;}
  if(G.oro<def.costo.oro||G.legno<def.costo.legno){
    aggMsg(`Servono ${def.costo.oro} oro e ${def.costo.legno} legno.`,'male');return;
  }
  G.oro-=def.costo.oro; G.legno-=def.costo.legno;
  const origine=(typeof origineEdificioDaCentro==='function') ? origineEdificioDaCentro(tipo,r,c) : {r,c};
  const celle=(typeof celleEdificio==='function') ? celleEdificio(tipo,origine.r,origine.c) : [{r:origine.r,c:origine.c}];
  G.edifici.push({tipo,r:origine.r,c:origine.c});
  // v20.31: non creare più sentieri automaticamente quando si piazza un edificio.
  // Prima l'edificio generava strada insieme a lui, creando confusione e bug visivi.
  // Il collegamento resta una scelta del giocatore: i sentieri sono importanti, ma manuali.
  if((tipo==='porto'||tipo==='cantiere') && typeof rigeneraPortoVivo==='function') rigeneraPortoVivo();
  // rimuovi alberi/rocce in quel tile
  const occupati=new Set(celle.map(cell=>cell.r+','+cell.c));
  G.alberi=G.alberi.filter(a=>!occupati.has(Math.floor(a.r)+','+Math.floor(a.c)));
  G.rocce=G.rocce.filter(rc=>!occupati.has(Math.floor(rc.r)+','+Math.floor(rc.c)));
  annullaCostruzione();
  notifica(`${def.icona} ${def.nome} Costruito!`,def.effetto);
  controllaMissione('edifici',G.edifici.length);
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// NAVI
// ═══════════════════════════════════════════════════
// factory con tutti i campi
