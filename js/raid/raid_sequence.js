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
  // Se ci sono pirati assegnati alla nave, parte solo quell'equipaggio.
  // Se nessuno è assegnato, mantiene il comportamento precedente: si raduna tutta la ciurma.
  const assegnati=G.pirati.filter(p=>p.naveId===nave.id && !p.inRaid);
  return assegnati.length>0 ? assegnati : G.pirati.filter(p=>!p.inRaid);
}

function avviaSequenzaRaid(nave, bersaglio, tattica){
  // 1. Trova punto di imbarco: Porto dei Pirati, Cantiere o spiaggia.
  const puntoPorto=trovaPortoRaid();
  const destR=puntoPorto.r, destC=puntoPorto.c;
  const equipaggioRaid=piratiPerRaid(nave);
  nave.crewRaidIds=equipaggioRaid.map(p=>p.id);

  // 2. Manda i pirati verso il porto (con fallback se astar fallisce)
  for(const p of equipaggioRaid){
    try{
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.round(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.round(p.mc)));
      const path=astar(sr, sc, destR, destC);
      p.percorso = path && path.length>0 ? path : [{r:destR,c:destC}];
    } catch(e){
      p.percorso=[{r:destR,c:destC}];
    }
    p._stato="cammina"; p.percorsoIdx=0; p.dest={r:destR,c:destC};
  }

  // 3. Mostra overlay campana
  const ov=document.getElementById('overlay-campana');
  document.getElementById('campana-icona').textContent='🔔';
  document.getElementById('campana-titolo').textContent='⚔ '+bersaglio.icona+' '+bersaglio.nome;
  document.getElementById('campana-msg').textContent='La ciurma si raduna al porto...';
  document.getElementById('campana-barra').style.width='0%';
  ov.classList.add('aperto');

  // 4. Anima marcia (3 secondi) — con timeout di sicurezza
  const totalDur=3000;
  const startTs=performance.now();
  const barEl=document.getElementById('campana-barra');
  const msgEl=document.getElementById('campana-msg');
  const durata=Math.max(1, bersaglio.durataBase - (nave.livVelocita||0));
  let completato=false;

  // Sicurezza: se l'animazione non completa entro 5s, forza il completamento
  const safetyTimer=setTimeout(()=>{
    if(!completato){ completato=true; ov.classList.remove('aperto'); salpaNave(nave,bersaglio,tattica,durata); }
  }, 5000);

  function animaMarcia(ts){
    if(completato) return;
    const progress=Math.min(100,(ts-startTs)/totalDur*100);
    barEl.style.width=progress+'%';

    if(progress<33)       msgEl.textContent='🏃 La ciurma marcia verso il porto...';
    else if(progress<66)  msgEl.textContent='⛵ I pirati salgono a bordo di '+nave.nome+'...';
    else                  msgEl.textContent='🌊 Salpa verso '+bersaglio.nome+' ('+durata+' giorni)...';

    if(progress<100){
      requestAnimationFrame(animaMarcia);
    } else {
      completato=true;
      clearTimeout(safetyTimer);
      setTimeout(()=>{ ov.classList.remove('aperto'); salpaNave(nave,bersaglio,tattica,durata); }, 300);
    }
  }
  requestAnimationFrame(animaMarcia);
}

// Nave parte: salva i dati del raid, attiva il timer
function salpaNave(nave, bersaglio, tattica, durata){
  nave.inMare    = true;
  nave.timerRaid = durata;
  nave.raidData  = { bersaglio, tattica };
  if(_naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;

  G.cooldownRaid  = 4;
  G.contatori.raid++;

  // I pirati imbarcati spariscono dalla mappa finché la nave è in mare.
  const crewIds=new Set(nave.crewRaidIds||[]);
  for(const p of G.pirati){
    if(crewIds.has(p.id)){
      p.inRaid=true;
      p.inRaidNaveId=nave.id;
      p._stato='in_raid';
      p.dest=null; p.percorso=null; p.percorsoIdx=0;
    }
  }

  aggMsg('⛵ '+nave.nome+' salpa dal porto! Rientro tra '+durata+' giorni.','bene');
  controllaMissione('raid', G.contatori.raid);
  aggiornaUI();
}

// Chiamata dal tick quando timerRaid arriva a 0
function rientroNave(nave){
  nave.inMare=false;
  if(_naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;

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

  // Calcola esito
  const mediaCombo=G.pirati.reduce((a,p)=>a+p.combattimento,0)/Math.max(G.pirati.length,1);
  const forzaAtk=Math.floor(
    8
    + mediaCombo*.12
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
    for(const p of G.pirati){
      p.umore=Math.min(100,p.umore+16);
      if(p.naveId===nave.id){
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
    const _nCat=_nMin+Math.floor(Math.random()*(_nMax-_nMin+1));
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

  } else {
    for(const p of G.pirati) p.umore=Math.max(5,p.umore-18);
    if(Math.random()<0.35) catturaPrigioniero(bersaglio.rep.reale<0?'Marina Reale':'Mercante');
    notifica('💀 Raid Fallito',
      bersaglio.icona+' '+bersaglio.nome+' ha respinto l\'attacco. '+nave.nome+' rientra danneggiata.','male');
    aggMsg('💀 Raid fallito — nave -'+dannoNave+' HP','male');
  }
}

// Compatibilità
function lanciaRaid(nave){
  nave.inMare=true;
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
