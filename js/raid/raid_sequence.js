// Isla del Diablo — raid/raid_sequence.js
// Estratto da 14_raid_sequence.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RAID_SEQUENCE
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// SEQUENZA RAID — stile Tropico 2
//
// Flusso:
//   1. Pianifica (modale) → lanciaRaidTattico()
//   2. Chiudi modale → campana suona come notifica in-game NON bloccante
//   3. Pirati marciano verso il porto mentre il gioco continua
//   4. Quando abbastanza pirati sono arrivati, la nave parte (inMare=true)
//      I dati del raid vengono salvati su nave.raidData
//   5. Il tick fa scorrere i giorni normalmente
//   6. Al rientro (timerRaid === 0) si calcola l'esito
//      e si mostra la notifica con il risultato
// ═══════════════════════════════════════════════════


function trovaPortoRaid(){
  // Priorità: Porto dei Pirati -> Cantiere Navale -> prima spiaggia disponibile
  const porto=G.edifici.find(b=>b.tipo==='porto');
  if(porto) return (typeof cellaRiferimentoEdificio==='function') ? cellaRiferimentoEdificio(porto,true) : {r:porto.r,c:porto.c,tipo:'porto'};
  const cantiere=G.edifici.find(b=>b.tipo==='cantiere');
  if(cantiere) return (typeof cellaRiferimentoEdificio==='function') ? cellaRiferimentoEdificio(cantiere,true) : {r:cantiere.r,c:cantiere.c,tipo:'cantiere'};
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]===T.SABBIA) return {r,c,tipo:'spiaggia'};
  }
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2),tipo:'centro'};
}

function piratiPerRaid(nave){
  // Tropico 2 style: non parte tutta la colonia.
  // Priorità: pirati assegnati alla nave dal pannello ciurma.
  // Fallback: migliore squadra disponibile, entro capienza nave.
  const disponibili=G.pirati.filter(p=>!p.inRaid && isFinite(p.mr) && isFinite(p.mc));
  const assegnati=disponibili.filter(p=>p.naveId===nave.id);
  const capienza=nave.capienza||6;
  const pool=(assegnati.length>=2 ? assegnati : disponibili)
    .slice()
    .sort((a,b)=>{
      const sb=(b.combattimento||0)*1.15+(b.navigazione||0)+(b.umore||50)*.25+(b.capitano?35:0);
      const sa=(a.combattimento||0)*1.15+(a.navigazione||0)+(a.umore||50)*.25+(a.capitano?35:0);
      return sb-sa;
    });
  return pool.slice(0,Math.max(2,capienza));
}

function puntoImbarcoRaid(){
  const porto=trovaPortoRaid();
  const ed=(typeof edificioInTile==='function' ? edificioInTile(porto.r,porto.c) : G.edifici.find(b=>b.r===porto.r&&b.c===porto.c)) || {r:porto.r,c:porto.c,tipo:porto.tipo||'porto'};
  if(typeof accessoMiglioreEdificio==='function'){
    const acc=accessoMiglioreEdificio(ed,porto.r,porto.c);
    if(acc) return {r:acc.r,c:acc.c,tipo:porto.tipo||'porto'};
  }
  return porto;
}

function distanzaTile(a,b){
  return Math.abs((a.mr||0)-(b.r+.5))+Math.abs((a.mc||0)-(b.c+.5));
}

function forzaEquipaggioRaid(nave, crew){
  const c=crew&&crew.length?crew:[];
  const n=Math.max(1,c.length);
  const comb=c.reduce((a,p)=>a+(p.combattimento||0),0)/n;
  const nav=c.reduce((a,p)=>a+(p.navigazione||0),0)/n;
  const morale=c.reduce((a,p)=>a+(p.umore||50),0)/n;
  const capitano=c.find(p=>p.capitano)||null;
  return {
    comb:Math.max(0,Math.min(100,comb+(capitano?6:-4))),
    nav:Math.max(0,Math.min(100,nav+(capitano?8:-5))),
    morale:Math.max(0,Math.min(100,morale+(capitano?4:-3))),
    capitano,
    count:c.length
  };
}

function avviaSequenzaRaid(nave, bersaglio, tattica){
  const puntoPorto=puntoImbarcoRaid();
  const destR=puntoPorto.r, destC=puntoPorto.c;
  const equipaggioRaid=piratiPerRaid(nave);

  if(equipaggioRaid.length<2){
    aggMsg('Servono almeno 2 pirati disponibili per imbarcarsi.','male');
    return;
  }

  nave.crewRaidIds=equipaggioRaid.map(p=>p.id);
  nave._raidTarget={r:destR,c:destC};
  nave._faseRaid='raduno';

  // Manda davvero i pirati al punto d'imbarco. Il raid parte quando sono arrivati
  // oppure dopo un timeout di sicurezza: su mobile/pathfinding non deve bloccarsi.
  for(const p of equipaggioRaid){
    try{
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.round(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.round(p.mc)));
      const path=astar(sr, sc, destR, destC);
      p.percorso = path && path.length>0 ? path : [{r:destR,c:destC}];
    } catch(e){
      p.percorso=[{r:destR,c:destC}];
    }
    p._stato='raduno_raid';
    p.percorsoIdx=0;
    p.dest={r:destR,c:destC};
    p._raidBoarding=true;
  }

  // Campana non bloccante: niente overlay a schermo intero.
  // Il gioco continua, il giocatore può costruire/pannare/gestire mentre la ciurma corre al porto.
  const ov=document.getElementById('overlay-campana');
  if(ov) ov.classList.remove('aperto');
  notifica('🔔 Campana del Porto', (bersaglio.missione?.icona||'⚔')+' '+bersaglio.nome+' — la ciurma si imbarca.');
  if(typeof creaEffettoPortoRaid==='function') creaEffettoPortoRaid('campana',nave,{crew:equipaggioRaid.length});
  aggMsg('🔔 La campana suona: '+nave.nome+' prepara il raid.','info');

  const durata=Math.max(1, bersaglio.durataBase - (nave.livVelocita||0));
  const startTs=performance.now();
  const maxDur=8500;
  let completato=false;
  let ultimoMsg=-1;

  function completaImbarco(){
    if(completato) return;
    completato=true;
    aggMsg('⛵ '+nave.nome+' molla gli ormeggi!','bene');
    salpaNave(nave,bersaglio,tattica,durata,equipaggioRaid);
  }

  function animaRaduno(ts){
    if(completato) return;
    const elapsed=ts-startTs;
    const arrivati=equipaggioRaid.filter(p=>distanzaTile(p,{r:destR,c:destC})<1.25).length;
    const quota=arrivati/Math.max(1,equipaggioRaid.length);

    // Messaggi radi, non overlay: non blocchiamo il gameplay e non spammiamo il log.
    const fase = quota<.35 ? 0 : quota<.85 ? 1 : 2;
    if(fase!==ultimoMsg){
      ultimoMsg=fase;
      if(fase===0)      aggMsg('🏃 La ciurma corre al porto... '+arrivati+'/'+equipaggioRaid.length,'info');
      else if(fase===1){
        if(typeof creaEffettoPortoRaid==='function') creaEffettoPortoRaid('imbarco',nave,{crew:equipaggioRaid.length,quanti:equipaggioRaid.length});
        aggMsg('🪵 Caricamento di rum, polvere e provviste su '+nave.nome+'...','info');
      }
      else              aggMsg('⛵ Gli ultimi pirati salgono a bordo...','info');
    }

    if(quota>=.82 || elapsed>=maxDur) completaImbarco();
    else requestAnimationFrame(animaRaduno);
  }
  requestAnimationFrame(animaRaduno);
}

// Nave parte: salva i dati del raid, attiva il timer
function salpaNave(nave, bersaglio, tattica, durata, equipaggioRaid){
  const crew=equipaggioRaid&&equipaggioRaid.length ? equipaggioRaid : G.pirati.filter(p=>(nave.crewRaidIds||[]).includes(p.id));
  const forza=forzaEquipaggioRaid(nave,crew);
  nave.inMare    = true;
  nave.timerRaid = durata;
  nave.raidData  = {
    bersaglio,
    tattica,
    crewIds:(nave.crewRaidIds||[]).slice(),
    forza,
    preparazione:bersaglio.preparazione||null,
    capitanoId:bersaglio.capitanoId||forza.capitano?.id||null,
    giornoPartenza:G.giorno,
    log:['La nave lascia il molo con '+crew.length+' pirati a bordo.']
  };
  nave._faseRaid='salpando';
  nave._faseRaidTick=0;
  if(typeof _naviMare!=='undefined' && _naviMare[nave.id]){
    _naviMare[nave.id]._dockInit=false;
    _naviMare[nave.id]._raidWater=null;
  }
  if(typeof creaEffettoPortoRaid==='function') creaEffettoPortoRaid('salpa',nave,{crew:crew.length});

  G.cooldownRaid  = 4;
  G.contatori.raid++;

  const crewIds=new Set(nave.crewRaidIds||[]);
  for(const p of G.pirati){
    if(crewIds.has(p.id)){
      p.inRaid=true;
      p.inRaidNaveId=nave.id;
      p._stato='in_raid';
      p._raidBoarding=false;
      p.dest=null; p.percorso=null; p.percorsoIdx=0;
    }
  }

  aggMsg('⛵ '+nave.nome+' salpa con '+crew.length+' pirati. Rientro tra '+durata+' giorni.','bene');
  controllaMissione('raid', G.contatori.raid);
  aggiornaUI();
}


// ═══════════════════════════════════════════════════
// EVENTI DI SPEDIZIONE — Tropico 2 style
// Chiamati dal tick mentre la nave è in mare. Non aprono popup:
// solo log/notifiche leggere, così il raid sembra una spedizione viva.
// ═══════════════════════════════════════════════════
function tickEventiSpedizioneRaid(nave){
  if(!nave || !nave.inMare || !nave.raidData || nave.timerRaid<=0) return;
  const rd=nave.raidData;
  rd._giorniEvento = (rd._giorniEvento||0) + 1;
  rd.extraBottino = rd.extraBottino || {oro:0,cibo:0,legno:0,rum:0,ricerca:0};

  // Non tutti i giorni succede qualcosa: deve dare sapore, non spam.
  const pattuglia = rd.bersaglio?.pattuglia || 0;
  const pericolo = (rd.bersaglio?.difficolta || 1) + Math.floor(pattuglia/3);
  const chance = Math.min(.58, .24 + pericolo*.07);
  if(Math.random()>chance) return;

  const crewIds = new Set(rd.crewIds||[]);
  const crew = G.pirati.filter(p=>crewIds.has(p.id));
  const morale = crew.reduce((a,p)=>a+(p.umore||50),0)/Math.max(1,crew.length);
  const nav = crew.reduce((a,p)=>a+(p.navigazione||0),0)/Math.max(1,crew.length);
  const tag = rd.bersaglio?.territorio?.nome || rd.bersaglio?.nome || 'mare aperto';

  const eventi = [
    {
      id:'vento_favorevole', peso:nav>55?3:1,
      fn:()=>{
        if(nave.timerRaid>1 && Math.random()<.55){ nave.timerRaid=Math.max(1,nave.timerRaid-1); }
        const msg='🌬 Vento favorevole verso '+tag+': la nave guadagna tempo.';
        rd.log?.push(msg); aggMsg(msg,'bene');
      }
    },
    {
      id:'bonaccia', peso:nav<55?3:1,
      fn:()=>{
        if(Math.random()<.55) nave.timerRaid++;
        nave.usura=Math.min(100,(nave.usura||0)+3);
        const msg='🌫 Bonaccia in mare: vele molli, ciurma nervosa.';
        rd.log?.push(msg); aggMsg(msg,'info');
      }
    },
    {
      id:'preda_minore', peso:2,
      fn:()=>{
        const oro=20+Math.floor(Math.random()*55);
        const rum=Math.random()<.35 ? 5+Math.floor(Math.random()*12) : 0;
        rd.extraBottino.oro += oro;
        rd.extraBottino.rum += rum;
        const msg='🚢 Preda minore intercettata: +'+oro+' oro'+(rum?' e +'+rum+' rum':'')+' nel carico.';
        rd.log?.push(msg); aggMsg(msg,'bene');
      }
    },
    {
      id:'razioni', peso:2,
      fn:()=>{
        const consumo=Math.min(G.cibo, Math.max(2, crew.length*2));
        G.cibo=Math.max(0,G.cibo-consumo);
        for(const p of crew) p.umore=Math.min(100,(p.umore||50)+2);
        const msg='🍖 Razioni caricate dalla stiva: -'+consumo+' cibo, ciurma più calma.';
        rd.log?.push(msg); aggMsg(msg,'info');
      }
    },
    {
      id:'disciplina', peso:morale<45?3:1,
      fn:()=>{
        const p=crew[Math.floor(Math.random()*crew.length)];
        if(p) p.umore=Math.max(5,(p.umore||50)-6);
        const msg='🗡 Lite a bordo: la disciplina cala durante la spedizione.';
        rd.log?.push(msg); aggMsg(msg,'male');
      }
    },
    {
      id:'pattuglia', peso:pericolo>=3?3+pattuglia:1,
      fn:()=>{
        const dmg=3+Math.floor(Math.random()*(4+pericolo*3));
        nave.hp=Math.max(5,(nave.hp||nave.hpMax)-dmg);
        const pot=rd.bersaglio?.potenza;
        const msg=(pot?.icona||'👑')+' Pattuglia '+(pot?.nome||'nemica')+' avvistata: '+nave.nome+' subisce -'+dmg+' HP.';
        rd.log?.push(msg); aggMsg(msg,'male');
      }
    },
  ];

  const tot=eventi.reduce((a,e)=>a+Math.max(0,e.peso),0);
  let roll=Math.random()*tot;
  for(const e of eventi){
    roll-=Math.max(0,e.peso);
    if(roll<=0){ e.fn(); break; }
  }
}

function registraStoriaRaid(nave, bersaglio, vinto, bottino, scoperta){
  if(!G.raid) G.raid={};
  if(!Array.isArray(G.raid.storia)) G.raid.storia=[];
  G.raid.storia.unshift({
    giorno:G.giorno,
    nave:nave.nome,
    missione:bersaglio?.missione?.nome||'Raid',
    territorio:bersaglio?.territorio?.nome||bersaglio?.nome||'Mare aperto',
    potenza:bersaglio?.potenza?.nome||null,
    vinto:!!vinto,
    bottino:bottino||{},
    scoperta:scoperta||null,
  });
  G.raid.storia=G.raid.storia.slice(0,10);
}

function primaRottaNonScopertaRaid(){
  if(typeof raidTerritoriDisponibili!=='function'||typeof territorioScoperto!=='function') return null;
  return raidTerritoriDisponibili().find(t=>!territorioScoperto(t.id))||null;
}

// Chiamata dal tick quando timerRaid arriva a 0
function rientroNave(nave){
  nave.inMare=false;
  nave._faseRaid='scarico';
  nave._faseRaidTick=90;
  if(typeof _naviMare!=='undefined' && _naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;
  if(typeof creaEffettoPortoRaid==='function') creaEffettoPortoRaid('rientro',nave);

  // Al rientro la ciurma riappare al porto insieme alla nave.
  const puntoPorto=trovaPortoRaid();
  const crewIds=new Set(nave.crewRaidIds||[]);
  for(const p of G.pirati){
    if(crewIds.has(p.id)||p.inRaidNaveId===nave.id){
      p.inRaid=false;
      p.inRaidNaveId=null;
      p.mc=puntoPorto.c+0.5+(Math.random()-.5)*0.4;
      p.mr=puntoPorto.r+0.5+(Math.random()-.5)*0.4;
      p._stato='pausa';
      p._pausaSec=2+Math.random()*3;
      p.dest=null; p.percorso=null; p.percorsoIdx=0;
    }
  }
  nave.crewRaidIds=[];

  const rd=nave.raidData||null;
  nave.raidData=null;

  if(!rd){
    // Raid legacy senza dati salvati: bottino generico
    const bottino=Math.floor(80+Math.random()*100);
    const cibo=Math.floor(20+Math.random()*40);
    G.oro+=bottino; G.cibo+=cibo;
    nave.hp=Math.min(nave.hpMax, nave.hp+10);
    notifica('💰 Raid Completato!', nave.nome+' porta '+bottino+' oro.');
    for(const p of G.pirati) p.umore=Math.min(100,p.umore+12);
    return;
  }

  const {bersaglio, tattica}=rd;

  // Calcola esito usando SOLO la ciurma imbarcata, non tutta l'isola.
  const crew=G.pirati.filter(p=>(rd.crewIds||[]).includes(p.id));
  const f=rd.forza||forzaEquipaggioRaid(nave,crew);
  const mediaCombo=f.comb||50;
  const mediaNav=f.nav||50;
  const mediaMorale=f.morale||50;
  const forzaAtk=Math.floor(
    8
    + mediaCombo*.12
    + mediaNav*.035
    + (mediaMorale-50)*.04
    + (nave.livCannoni||0)*4
    + (tattica.bonus.atk||0)
    + (G.ricerca.completate.has('cannoni')?8:0)
    + (G.ricerca.completate.has('bordata')&&tattica.id==='bordata'?12:0)
  );
  const nemDif=bersaglio.nemico.difesa + bersaglio.nemico.atk*.3;
  const chVitt=Math.min(92, Math.max(12, 55+(forzaAtk-nemDif)*3));
  const vinto=Math.random()*100<chVitt;

  // Danno alla nave
  const dannoBase=vinto
    ? nave.hpMax*(0.04+Math.random()*.1)
    : nave.hpMax*(0.18+Math.random()*.28);
  const dannoMod= tattica.id==='manovra_evasiva' ? 0.55
                : tattica.id==='speronamento'     ? 1.35
                : 1.0;
  const dannoNave=Math.max(2, Math.floor(dannoBase*dannoMod));
  nave.hp=Math.max(5, nave.hp-dannoNave);
  nave.hp=Math.min(nave.hpMax, nave.hp+8); // riparo minimo al rientro

  if(vinto){
    const b=bersaglio.bottino;
    const oro   = b.oro    ? b.oro[0]   +Math.floor(Math.random()*(b.oro[1]   -b.oro[0]))   : 0;
    const cibo  = b.cibo   ? b.cibo[0]  +Math.floor(Math.random()*(b.cibo[1]  -b.cibo[0]))  : 0;
    const legno = b.legno  ? b.legno[0] +Math.floor(Math.random()*(b.legno[1] -b.legno[0])) : 0;
    const rum   = b.rum    ? b.rum[0]   +Math.floor(Math.random()*(b.rum[1]   -b.rum[0]))   : 0;
    const ric   = b.ricerca? b.ricerca[0]+Math.floor(Math.random()*(b.ricerca[1]-b.ricerca[0])): 0;

    const multCan  = 1 + (nave.livCannoni||0)*.15;
    const multSti  = 1 + (nave.livStiva||0)*.2;
    const multRic  = G.ricerca.completate.has('cannoni') ? 1.3 : 1;
    const barbanera= G.pirati.find(p=>p.id==='cap_blackbeard'&&p.naveId===nave.id);
    const multBB   = barbanera ? 1.5 : 1;
    const multAbbo = (tattica.id==='abbordaggio') ? 1+(mediaCombo*.005) : 1;

    const extra=rd.extraBottino||{};
    const oroFinale  = Math.floor(oro   * multCan * multRic * multBB * multAbbo) + (extra.oro||0);
    const cibFinale  = Math.floor(cibo  * multSti) + (extra.cibo||0);
    const legFinale  = Math.floor(legno * multSti) + (extra.legno||0);
    const rumFinale  = Math.floor(rum) + (extra.rum||0);
    const ricFinale  = ric + (extra.ricerca||0);

    G.oro           += oroFinale;
    G.cibo          += cibFinale;
    G.legno         += legFinale;
    G.rum           += rumFinale;
    G.ricerca.punti += ricFinale;

    let rottaScoperta=null;
    if(bersaglio.missione?.id==='esplorazione'){
      if(bersaglio.esplorazioneNuova && typeof scopriTerritorioRaid==='function'){
        rottaScoperta=scopriTerritorioRaid(bersaglio.territorio?.id) ? bersaglio.territorio : null;
      }
      if(!rottaScoperta){
        const prossima=primaRottaNonScopertaRaid();
        if(prossima && typeof scopriTerritorioRaid==='function'){
          rottaScoperta=scopriTerritorioRaid(prossima.id) ? prossima : null;
        }
      }
      if(rottaScoperta) aggMsg('🧭 Carte nautiche aggiornate: '+rottaScoperta.nome+' e ora raggiungibile.','bene');
      else aggMsg('🧭 Esplorazione completata: nessuna nuova rotta, ma le carte migliorano.','info');
    }

    // Reputazioni
    for(const[k,v] of Object.entries(bersaglio.rep))
      if(v && G.fazioni[k]) G.fazioni[k].rep=Math.max(-100,Math.min(100,G.fazioni[k].rep+v));

    const potId=bersaglio.potenza?.id||bersaglio.territorio?.potenza;
    if(potId && typeof modificaAllertaRaid==='function'){
      const mid=bersaglio.missione?.id||'raid';
      const deltaAllerta=mid==='esplorazione' ? 1 : mid==='falsa_bandiera' ? 2 : 6+(bersaglio.pattuglia||0)*2+(bersaglio.difficolta||1);
      const nuovaAllerta=modificaAllertaRaid(potId,deltaAllerta);
      if(deltaAllerta>1) aggMsg((bersaglio.potenza?.icona||'⚓')+' Allerta '+(bersaglio.potenza?.nome||'nemica')+' sale a '+nuovaAllerta+'.','info');
    }

    if(bersaglio.missione?.falsaBandiera)
      aggMsg('🏳 Falsa bandiera riuscita: la Corona sospetta altri corsari, non la tua cala.','bene');

    if(barbanera) G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);

    const grazia=G.pirati.find(p=>p.id==='cap_grazia'&&p.naveId===nave.id);
    if(grazia){ const extra=Math.floor(oroFinale*.15); G.oro+=extra; }

    // XP e morale
    for(const p of crew){
      p.umore=Math.min(100,p.umore+16);
      if(true){
        p.xp=(p.xp||0)+20;
        const xpN=(p.livello||1)*100;
        if(p.xp>=xpN){
          p.xp-=xpN; p.livello=(p.livello||1)+1;
          p.combattimento=Math.min(100,p.combattimento+5);
          p.navigazione=Math.min(100,p.navigazione+5);
          notifica('⬆ '+p.nome+' sale di livello!','Lv'+p.livello+' — stats +5');
        }
      }
    }

    // Cattura prigionieri — numero basato su difficoltà e tipo missione
    const _faz=bersaglio.rep.reale<0?'Marina Reale':'Mercante';
    const _nMin=bersaglio.difficolta<=2?1:2;
    const _nMax=bersaglio.difficolta<=2?3:5;
    const _baseCat=_nMin+Math.floor(Math.random()*(_nMax-_nMin+1))+(bersaglio.prigionieriBonus||0);
    const _missioneId=bersaglio.missione?.id||'raid';
    if(_missioneId==='rapimento_specialisti'){
      const _spec=Math.max(1,Math.min(3,Math.ceil(_baseCat/2)));
      for(let _i=0;_i<_spec;_i++){
        if(typeof catturaSpecialistaRaid==='function') catturaSpecialistaRaid();
        else catturaPrigioniero(_faz);
      }
      if(Math.random()<.45) catturaPrigioniero(_faz);
    } else if(_missioneId==='raid_insediamento'){
      for(let _i=0;_i<_baseCat;_i++){ if(Math.random()<0.78) catturaPrigioniero(_faz); }
    } else if(_missioneId==='crociera'){
      if(Math.random()<0.45) catturaPrigioniero('Mercante');
    } else if(_missioneId==='falsa_bandiera'){
      if(Math.random()<0.25) catturaPrigioniero(_faz);
    }
    const baseId=bersaglio.baseId||bersaglio.id;
    if(baseId==='galeone_reale'||baseId==='porto_coloniale'){
      catturaPrigioniero('Marina Reale'); catturaPrigioniero('Mercante');
    }

    // Evento speciale porto coloniale
    if(baseId==='porto_coloniale'){
      const ts=['cannoni','velocita','stiva'];
      const tt=ts[Math.floor(Math.random()*ts.length)];
      const kk='liv'+tt.charAt(0).toUpperCase()+tt.slice(1);
      if(nave[kk]<3){ nave[kk]++; aggMsg('⬆ Upgrade gratuito: '+tt+' su '+nave.nome,'bene'); }
    }
    if(baseId==='galeone_reale')
      G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+20);

    const bottinoStr=[
      oroFinale && `+${oroFinale}💰`,
      cibFinale && `+${cibFinale}🍖`,
      legFinale && `+${legFinale}🪵`,
      rumFinale && `+${rumFinale}🍺`,
      ricFinale && `+${ricFinale}🔭`,
    ].filter(Boolean).join(' ');

    registraStoriaRaid(nave,bersaglio,true,{oro:oroFinale,cibo:cibFinale,legno:legFinale,rum:rumFinale,ricerca:ricFinale},rottaScoperta?.nome||null);
    notifica('⚔ Raid Riuscito!', bersaglio.icona+' '+bersaglio.nome+' saccheggiata! '+bottinoStr);
    aggMsg('💰 '+nave.nome+' rientra: '+bottinoStr+' (danno -'+dannoNave+'hp)','bene');
    if(typeof creaScaricoRaidPorto==='function') creaScaricoRaidPorto(nave,{oro:oroFinale,cibo:cibFinale,legno:legFinale,rum:rumFinale,ricerca:ricFinale});
    if(typeof creaEffettoPortoRaid==='function') creaEffettoPortoRaid('scarico',nave,{bottino:{oro:oroFinale,cibo:cibFinale,legno:legFinale,rum:rumFinale,ricerca:ricFinale}});

  } else {
    for(const p of crew) p.umore=Math.max(5,p.umore-18);
    if(Math.random()<0.35) catturaPrigioniero(bersaglio.rep.reale<0?'Marina Reale':'Mercante');
    const potId=bersaglio.potenza?.id||bersaglio.territorio?.potenza;
    if(potId && typeof modificaAllertaRaid==='function'){
      const nuovaAllerta=modificaAllertaRaid(potId,3+Math.floor((bersaglio.pattuglia||0)/2));
      aggMsg((bersaglio.potenza?.icona||'⚓')+' Le difese di '+(bersaglio.potenza?.nome||'quella potenza')+' restano in allerta: '+nuovaAllerta+'.','info');
    }
    registraStoriaRaid(nave,bersaglio,false,{danno:dannoNave},null);
    notifica('💀 Raid Fallito',
      bersaglio.icona+' '+bersaglio.nome+' ha respinto l\'attacco. '+nave.nome+' rientra danneggiata.','male');
    aggMsg('💀 Raid fallito — nave -'+dannoNave+' HP','male');
  }
}

// Compatibilità
function lanciaRaid(nave){
  nave.inMare=true;
  nave._faseRaid='salpando';
  const durata=Math.max(1,2+Math.floor(Math.random()*2)-(nave.livVelocita||0));
  nave.timerRaid=durata;
  nave.raidData=null;
  G.cooldownRaid=4; G.contatori.raid++;
  G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+3);
  aggMsg(nave.nome+' salpa!','bene');
  controllaMissione('raid',G.contatori.raid);
  aggiornaUI();
}
function iniziaBattegliaTattica(nave,bersaglio,tattica){ avviaSequenzaRaid(nave,bersaglio,tattica); }
function chiudiBattegliaTattica(){ const ov=document.getElementById('overlay-campana'); if(ov) ov.classList.remove('aperto'); }
function chiudiBattaglia(){ chiudiBattegliaTattica(); }
function iniziaBattaglia(nave,em){ avviaSequenzaRaid(nave,BERSAGLI_RAID[em?0:2],TATTICHE_RAID[0]); }

// ── PRIGIONIERI ──
