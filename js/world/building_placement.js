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
  // Gli edifici devono stare AI LATI dei sentieri, non sopra.
  // In stile Tropico 2 la strada è una rete libera: il footprint dell'edificio
  // non può occupare tile sentiero, ma deve averne almeno uno adiacente.
  return t===T.SABBIA||t===T.ERBA||t===T.COLLINA;
}

function edificioSuSentiero(cell){
  return G.mappa[cell.r] && G.mappa[cell.r][cell.c]===T.SENTIERO;
}

function edificioRichiedeSentiero(tipo){
  // Regola stile Tropico 2: gli edifici normali possono nascere solo sulla rete
  // viaria. Eccezioni: strutture portuali/costiere e il palazzo iniziale.
  return !['porto','cantiere','shipyard','governatore'].includes(tipo);
}

function edificioHaSentieroAdiacente(tipo,r,c){
  const ed={tipo,r,c};
  const perimetro=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [{r:r-1,c},{r:r+1,c},{r,c:c-1},{r,c:c+1}];
  return perimetro.some(cell=>G.mappa[cell.r] && G.mappa[cell.r][cell.c]===T.SENTIERO);
}

function statoCostruzioneEdificio(r,c,tipo=G.modalitaCostruzione){
  if(!tipo || !ED[tipo]) return {ok:false,motivo:'no-tipo'};
  const origine=(typeof origineEdificioDaCentro==='function') ? origineEdificioDaCentro(tipo,r,c) : {r,c};
  const celle=(typeof celleEdificio==='function') ? celleEdificio(tipo,origine.r,origine.c) : [{r,c}];
  for(const cell of celle){
    if(cell.r<0||cell.c<0||cell.r>=G.RIGHE||cell.c>=G.COLS) return {ok:false,motivo:'fuori-mappa',origine,celle};
    const t=G.mappa[cell.r]&&G.mappa[cell.r][cell.c];
    if(edificioSuSentiero(cell)) return {ok:false,motivo:'sopra-sentiero',origine,celle};
    if(!terrenoCostruibileEdificio(t)) return {ok:false,motivo:'terreno',origine,celle};
    const occupato=(typeof edificioInTile==='function')
      ? edificioInTile(cell.r,cell.c)
      : G.edifici.find(b=>b.r===cell.r&&b.c===cell.c);
    if(occupato) return {ok:false,motivo:'occupato',origine,celle};
  }
  // cantiere/porto: almeno una cella dell'impronta deve toccare spiaggia/acque basse.
  if(tipo==='cantiere'||tipo==='porto'||tipo==='shipyard'){
    const vicini=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
    const hasSpiaggia=celle.some(cell=>vicini.some(([dr,dc])=>{
      const nr=cell.r+dr,nc=cell.c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) return false;
      return G.mappa[nr][nc]===T.SABBIA||G.mappa[nr][nc]===T.BASSO;
    }));
    if(!hasSpiaggia) return {ok:false,motivo:'costa',origine,celle};
  }
  if(edificioRichiedeSentiero(tipo) && !edificioHaSentieroAdiacente(tipo,origine.r,origine.c)){
    return {ok:false,motivo:'manca-sentiero',origine,celle};
  }
  return {ok:true,motivo:'ok',origine,celle};
}

function puoCostruire(r,c,tipo=G.modalitaCostruzione){
  return statoCostruzioneEdificio(r,c,tipo).ok;
}
function piazzaEdificio(r,c){
  const tipo=G.modalitaCostruzione;
  if(!tipo || tipo==='sentiero' || !ED[tipo]){
    aggMsg('Seleziona prima un edificio da costruire.','male');
    return;
  }
  const def=ED[tipo];
  const stato=statoCostruzioneEdificio(r,c,tipo);
  if(!stato.ok){
    const messaggi={
      'manca-sentiero':'Serve un sentiero adiacente al perimetro dell’edificio.',
      'sopra-sentiero':'Gli edifici vanno costruiti ai lati dei sentieri, non sopra.',
      'costa':'Questo edificio deve stare vicino alla costa.',
      'occupato':'Uno o più tile sono già occupati.',
      'terreno':'Terreno non adatto alla costruzione.',
      'fuori-mappa':'Fuori dalla mappa.'
    };
    aggMsg(messaggi[stato.motivo]||'Non puoi costruire qui!','male');
    return;
  }
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
