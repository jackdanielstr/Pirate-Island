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
//   2. Chiudi modale → campana appare
//   3. Pirati marciano verso il cantiere (3 sec)
//   4. Fine marcia → campana sparisce, nave parte (inMare=true)
//      I dati del raid vengono salvati su nave.raidData
//   5. Il tick fa scorrere i giorni normalmente
//   6. Al rientro (timerRaid === 0) si calcola l'esito
//      e si mostra la notifica con il risultato
// ═══════════════════════════════════════════════════


function trovaPortoRaid(){
  // Priorità: Porto dei Pirati -> Cantiere Navale -> prima spiaggia disponibile
  const porto=G.edifici.find(b=>b.tipo==='porto');
  if(porto) return {r:porto.r,c:porto.c,tipo:'porto'};
  const cantiere=G.edifici.find(b=>b.tipo==='cantiere');
  if(cantiere) return {r:cantiere.r,c:cantiere.c,tipo:'cantiere'};
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
  const ed=G.edifici.find(b=>b.r===porto.r&&b.c===porto.c) || {r:porto.r,c:porto.c,tipo:porto.tipo||'porto'};
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
  return {comb,nav,morale,capitano,count:c.length};
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

  const ov=document.getElementById('overlay-campana');
  const barEl=document.getElementById('campana-barra');
  const msgEl=document.getElementById('campana-msg');
  document.getElementById('campana-icona').textContent='🔔';
  document.getElementById('campana-titolo').textContent='🔔 '+(bersaglio.missione?.icona||'⚔')+' '+bersaglio.nome;
  msgEl.textContent='La campana suona: la ciurma corre al porto seguendo i sentieri...';
  barEl.style.width='0%';
  ov.classList.add('aperto');

  const durata=Math.max(1, bersaglio.durataBase - (nave.livVelocita||0));
  const startTs=performance.now();
  const maxDur=8500;
  let completato=false;

  function completaImbarco(){
    if(completato) return;
    completato=true;
    barEl.style.width='100%';
    msgEl.textContent='⛵ '+nave.nome+' molla gli ormeggi!';
    setTimeout(()=>{
      ov.classList.remove('aperto');
      salpaNave(nave,bersaglio,tattica,durata,equipaggioRaid);
    },350);
  }

  function animaRaduno(ts){
    if(completato) return;
    const elapsed=ts-startTs;
    const arrivati=equipaggioRaid.filter(p=>distanzaTile(p,{r:destR,c:destC})<1.25).length;
    const quota=arrivati/Math.max(1,equipaggioRaid.length);
    const timeQuota=Math.min(1,elapsed/maxDur);
    const progress=Math.max(timeQuota*.65,quota*.95)*100;
    barEl.style.width=Math.min(99,progress)+'%';

    if(quota<.35)      msgEl.textContent='🏃 La ciurma si raduna al porto... '+arrivati+'/'+equipaggioRaid.length;
    else if(quota<.85) msgEl.textContent='🪵 Casse, rum e polvere da sparo vengono caricati a bordo...';
    else               msgEl.textContent='⛵ Gli ultimi pirati salgono su '+nave.nome+'...';

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
    giornoPartenza:G.giorno,
    log:['La nave lascia il molo con '+crew.length+' pirati a bordo.']
  };
  nave._faseRaid='salpando';
  nave._faseRaidTick=0;
  if(typeof _naviMare!=='undefined' && _naviMare[nave.id]){
    _naviMare[nave.id]._dockInit=false;
    _naviMare[nave.id]._raidWater=null;
  }

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

// Chiamata dal tick quando timerRaid arriva a 0
function rientroNave(nave){
  nave.inMare=false;
  nave._faseRaid='scarico';
  nave._faseRaidTick=90;
  if(typeof _naviMare!=='undefined' && _naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;

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

    const oroFinale  = Math.floor(oro   * multCan * multRic * multBB * multAbbo);
    const cibFinale  = Math.floor(cibo  * multSti);
    const legFinale  = Math.floor(legno * multSti);
    const rumFinale  = Math.floor(rum);

    G.oro           += oroFinale;
    G.cibo          += cibFinale;
    G.legno         += legFinale;
    G.rum           += rumFinale;
    G.ricerca.punti += ric;

    // Reputazioni
    for(const[k,v] of Object.entries(bersaglio.rep))
      if(v && G.fazioni[k]) G.fazioni[k].rep=Math.max(-100,Math.min(100,G.fazioni[k].rep+v));

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

    // Cattura prigionieri — numero basato su difficoltà
    const _faz=bersaglio.rep.reale<0?'Marina Reale':'Mercante';
    const _nMin=bersaglio.difficolta<=2?1:2;
    const _nMax=bersaglio.difficolta<=2?3:5;
    const _nCat=_nMin+Math.floor(Math.random()*(_nMax-_nMin+1))+(bersaglio.prigionieriBonus||0);
    for(let _i=0;_i<_nCat;_i++){ if(Math.random()<0.75) catturaPrigioniero(_faz); }
    if(bersaglio.id==='galeone_reale'||bersaglio.id==='porto_coloniale'){
      catturaPrigioniero('Marina Reale'); catturaPrigioniero('Mercante');
    }

    // Evento speciale porto coloniale
    if(bersaglio.id==='porto_coloniale'){
      const ts=['cannoni','velocita','stiva'];
      const tt=ts[Math.floor(Math.random()*ts.length)];
      const kk='liv'+tt.charAt(0).toUpperCase()+tt.slice(1);
      if(nave[kk]<3){ nave[kk]++; aggMsg('⬆ Upgrade gratuito: '+tt+' su '+nave.nome,'bene'); }
    }
    if(bersaglio.id==='galeone_reale')
      G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+20);

    const bottinoStr=[
      oroFinale && `+${oroFinale}💰`,
      cibFinale && `+${cibFinale}🍖`,
      legFinale && `+${legFinale}🪵`,
      rumFinale && `+${rumFinale}🍺`,
      ric       && `+${ric}🔭`,
    ].filter(Boolean).join(' ');

    notifica('⚔ Raid Riuscito!', bersaglio.icona+' '+bersaglio.nome+' saccheggiata! '+bottinoStr);
    aggMsg('💰 '+nave.nome+' rientra: '+bottinoStr+' (danno -'+dannoNave+'hp)','bene');
    if(typeof creaScaricoRaidPorto==='function') creaScaricoRaidPorto(nave,{oro:oroFinale,cibo:cibFinale,legno:legFinale,rum:rumFinale,ricerca:ric});

  } else {
    for(const p of crew) p.umore=Math.max(5,p.umore-18);
    if(Math.random()<0.35) catturaPrigioniero(bersaglio.rep.reale<0?'Marina Reale':'Mercante');
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
function chiudiBattegliaTattica(){ document.getElementById('overlay-campana').classList.remove('aperto'); }
function chiudiBattaglia(){ chiudiBattegliaTattica(); }
function iniziaBattaglia(nave,em){ avviaSequenzaRaid(nave,BERSAGLI_RAID[em?0:2],TATTICHE_RAID[0]); }

// ── PRIGIONIERI ──
