// Isla del Diablo — world/building_placement.js
// Estratto da 12_costruzione.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: COSTRUZIONE
// ═══════════════════════════════════════
// ── COSTRUZIONE EDIFICI & SENTIERI ──
function resetInputCostruzione(){
  if(typeof window.__islaResetTouchInputState==='function') window.__islaResetTouchInputState();
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
}
function annullaCostruzione(){
  resetInputCostruzione();
  G.modalitaCostruzione=null;
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  document.getElementById('btn-annulla').classList.remove('mostra');
  document.getElementById('mappa-wrap').classList.remove('modalita-costruzione');
}
function puoCostruire(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  const t=G.mappa[r][c];
  if(t!==T.SABBIA&&t!==T.ERBA&&t!==T.COLLINA&&t!==T.SENTIERO) return false;
  if(G.edifici.find(b=>b.r===r&&b.c===c)) return false;
  // cantiere/porto: devono essere adiacenti (anche diagonale) a spiaggia o acque basse
  if(G.modalitaCostruzione==='cantiere'||G.modalitaCostruzione==='porto'){
    const vicini=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
    const hasSpiaggia=vicini.some(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) return false;
      return G.mappa[nr][nc]===T.SABBIA||G.mappa[nr][nc]===T.BASSO;
    });
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
  if(!puoCostruire(r,c)){aggMsg('Non puoi costruire qui!','male');return;}
  if(G.oro<def.costo.oro||G.legno<def.costo.legno){
    aggMsg(`Servono ${def.costo.oro} oro e ${def.costo.legno} legno.`,'male');return;
  }
  G.oro-=def.costo.oro; G.legno-=def.costo.legno;
  G.edifici.push({tipo,r,c});
  // FASE 2C: ogni edificio nuovo prova a collegarsi al sentiero più vicino.
  // Il sentiero diventa infrastruttura centrale, non solo decorazione.
  if(typeof collegaEdificioAlSentiero==='function') collegaEdificioAlSentiero({r,c});
  if((tipo==='porto'||tipo==='cantiere') && typeof rigeneraPortoVivo==='function') rigeneraPortoVivo();
  // rimuovi alberi/rocce in quel tile
  G.alberi=G.alberi.filter(a=>!(a.r===r&&a.c===c));
  G.rocce=G.rocce.filter(rc=>!(rc.r===r&&rc.c===c));
  annullaCostruzione();
  notifica(`${def.icona} ${def.nome} Costruito!`,def.effetto);
  controllaMissione('edifici',G.edifici.length);
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// NAVI
// ═══════════════════════════════════════════════════
// factory con tutti i campi
