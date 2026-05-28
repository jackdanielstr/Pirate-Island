// Isla del Diablo — core/tick.js
// Estratto da 16_tick.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: TICK
// ═══════════════════════════════════════
// ── TICK — avanzamento tempo ──
function assicuraEconomia(){
  if(!G.scorte) G.scorte={};
  for(const k of ['canna','tabacco','ferro','metallo','tavole','razioni','sigari','armi','cannoni']){
    if(!isFinite(G.scorte[k])) G.scorte[k]=0;
  }
  if(!G.economia) G.economia={rete:100,produttivita:100,turno:[],avvisi:[]};
  G.economia.turno=[];
  G.economia.avvisi=[];
}

function effTipoEdifici(tipo){
  return typeof moltiplicatoreReteEdifici==='function'
    ? moltiplicatoreReteEdifici(tipo)
    : G.edifici.filter(b=>b.tipo===tipo).length;
}

function aggiungiScorta(k,v){
  if(!v || v<=0) return 0;
  const q=Math.floor(v);
  G.scorte[k]=Math.min(999,Math.max(0,(G.scorte[k]||0)+q));
  return q;
}

function consumaScorta(k,v){
  const q=Math.min(Math.floor(v),Math.floor(G.scorte[k]||0));
  if(q>0) G.scorte[k]-=q;
  return q;
}

function registraTurno(nome,val,icona){
  if(!val) return;
  G.economia.turno.push({nome,val:Math.floor(val),icona:icona||''});
}

function aggiornaIndicatoriEconomia(avvisi){
  const edifici=G.edifici.filter(b=>b.tipo!=='governatore');
  if(!edifici.length){
    G.economia.rete=100;
    G.economia.produttivita=100;
  }else{
    const totale=edifici.reduce((a,b)=>a+(typeof efficienzaStradaEdificio==='function'?efficienzaStradaEdificio(b):1),0);
    G.economia.produttivita=Math.round(totale/edifici.length*100);
    G.economia.rete=typeof reteSentieriPercentuale==='function' ? reteSentieriPercentuale() : G.economia.produttivita;
  }
  G.economia.avvisi=avvisi.slice(0,4);
}

function tick(){
  assicuraEconomia();
  G.tick++; G.giorno++;

  for(const p of G.pirati) aggiornaPirata(p);

  // FASE 2D: produzione pesata dalla rete dei sentieri.
  // Edifici collegati al palazzo/porto lavorano al 100%; isolati rendono meno.
  const nFattor  = effTipoEdifici('fattoria');
  const nBanane  = effTipoEdifici('banane');
  const nPapaia  = effTipoEdifici('papaia');
  const nCanna   = effTipoEdifici('canna_zucchero');
  const nTabacco = effTipoEdifici('tabacco');
  const nMiniera = effTipoEdifici('miniera_ferro');
  const nForno   = effTipoEdifici('forno');
  const nDistil  = effTipoEdifici('distilleria');
  const nBirra   = effTipoEdifici('birrificio');
  const nSigari  = effTipoEdifici('fabbrica_sigari');
  const nFonderia= effTipoEdifici('fonderia');
  const nArmi    = effTipoEdifici('fabbrica_armi');
  const nCannoni = effTipoEdifici('fonderia_cannoni');
  const nRazioni = effTipoEdifici('razioni_mare');
  const nSegh    = effTipoEdifici('segheria');
  const nSawmill = effTipoEdifici('sawmill');
  const nOsserv  = effTipoEdifici('osservatorio');
  const nCasa    = effTipoEdifici('casapirata');
  const nBordello= effTipoEdifici('bordello');
  const nArena   = effTipoEdifici('arena');
  const nCanta   = effTipoEdifici('cantastorie');
  const nCappella= effTipoEdifici('cappella');
  const nInferm  = effTipoEdifici('infermeria');
  const nBagni   = effTipoEdifici('bagni');
  const nGuardia = effTipoEdifici('guardia');
  const nSarto   = effTipoEdifici('sarto');
  const haTaverna= G.edifici.find(b=>b.tipo==='taverna');
  const haCaserma= G.edifici.find(b=>b.tipo==='caserma');

  const avvisiEconomia=[];
  const ciboProd=5 + Math.floor(nFattor*9 + nBanane*6 + nPapaia*5 + nForno*4);
  const legnoProd=3 + Math.floor(nSegh*7);
  G.cibo += ciboProd;
  G.legno += legnoProd;
  registraTurno('cibo',ciboProd,'c');
  registraTurno('legno',legnoProd,'l');

  registraTurno('canna',aggiungiScorta('canna',nCanna*7),'z');
  registraTurno('tabacco',aggiungiScorta('tabacco',nTabacco*6),'t');
  registraTurno('ferro',aggiungiScorta('ferro',nMiniera*5),'f');

  const tavoleCap=Math.floor(nSawmill*4);
  const legnoUsato=Math.min(Math.floor(G.legno/5),tavoleCap);
  if(legnoUsato>0){
    G.legno-=legnoUsato*5;
    registraTurno('tavole',aggiungiScorta('tavole',legnoUsato*3),'T');
  }else if(tavoleCap>0) avvisiEconomia.push('La Segheria aspetta legno grezzo.');

  const rumCap=Math.floor(nDistil*6);
  const cannaUsata=consumaScorta('canna',rumCap*2);
  const rumProd=Math.floor(cannaUsata/2) + Math.floor(nBirra*2);
  G.rum += rumProd;
  registraTurno('rum',rumProd,'r');
  if(nDistil>0 && cannaUsata<rumCap*2) avvisiEconomia.push('Distilleria senza abbastanza canna da zucchero.');

  const tabaccoRichiesto=Math.floor(nSigari*3);
  const tabaccoUsato=consumaScorta('tabacco',tabaccoRichiesto);
  const sigariProd=aggiungiScorta('sigari',tabaccoUsato);
  G.oro+=sigariProd*4;
  registraTurno('sigari',sigariProd,'S');
  if(nSigari>0 && tabaccoUsato<tabaccoRichiesto) avvisiEconomia.push('Fabbrica Sigari senza tabacco.');

  const ferroRichiesto=Math.floor(nFonderia*4);
  const ferroUsato=consumaScorta('ferro',ferroRichiesto);
  registraTurno('metallo',aggiungiScorta('metallo',ferroUsato),'M');
  if(nFonderia>0 && ferroUsato<ferroRichiesto) avvisiEconomia.push('Fonderia senza ferro.');

  const metalloArmi=consumaScorta('metallo',Math.floor(nArmi*2));
  registraTurno('armi',aggiungiScorta('armi',metalloArmi),'A');
  const metalloCannoni=consumaScorta('metallo',Math.floor(nCannoni*3));
  registraTurno('cannoni',aggiungiScorta('cannoni',Math.floor(metalloCannoni/3)),'K');

  const ciboRazioni=Math.min(Math.floor(G.cibo/6),Math.floor(nRazioni*4));
  if(ciboRazioni>0){
    G.cibo-=ciboRazioni*6;
    registraTurno('razioni',aggiungiScorta('razioni',ciboRazioni*3),'R');
  }else if(nRazioni>0) avvisiEconomia.push('Fabbrica Razioni senza cibo in eccesso.');

  G.oro           += 12 + Math.floor(nCasa*6) + Math.floor(nSarto*10);
  G.ricerca.punti += Math.floor(nOsserv*3);
  aggiornaIndicatoriEconomia(avvisiEconomia);
  if(typeof avvisaReteSentieri==='function') avvisaReteSentieri();

  if(nBordello>0){
    const cr=nBordello*2;
    if(G.rum>=cr) G.rum-=cr;
    else G.bisogni.divertimento=Math.max(0,G.bisogni.divertimento-10);
  }

  const B=G.bisogni;
  B.divertimento=Math.max(0,Math.min(100, B.divertimento + nBordello*20 + nArena*12 + nCanta*8 + (haTaverna?6:0) - 8));
  B.spirito     =Math.max(0,Math.min(100, B.spirito      + nCappella*18 - 5));
  B.salute      =Math.max(0,Math.min(100, B.salute       + nInferm*20 + nBagni*12 - 6));
  B.sicurezza   =Math.max(0,Math.min(100, B.sicurezza    + nGuardia*15 + (G.edifici.find(b=>b.tipo==='fortezza')?10:0) - 4));
  B.lusso       =Math.max(0,Math.min(100, B.lusso        + nSarto*15 + (G.edifici.find(b=>b.tipo==='mercatonero')?10:0) - 6));

  const soddMedia=(B.divertimento+B.spirito+B.salute+B.sicurezza+B.lusso)/5;
  const bonusSodd=Math.floor((soddMedia-50)/10);
  for(const p of G.pirati) p.umore=Math.min(100,Math.max(5,p.umore+bonusSodd));

  if(G.tick%5===0){
    if(B.divertimento<20) aggMsg('😤 La ciurma si annoia! Costruisci un Bordello o Arena.','male');
    if(B.salute<20)       aggMsg('🤒 I pirati si ammalano! Serve un\'Infermeria.','male');
    if(B.spirito<20)      aggMsg('😔 Gli uomini perdono fede. Costruisci una Cappella.','male');
    if(B.sicurezza<20)    aggMsg('😱 La ciurma si sente in pericolo! Costruisci una Torre.','male');
    if(B.lusso<15&&G.pirati.length>6) aggMsg('😒 La ciurma vuole lussi. Assumi un Sarto.','male');
  }

  if(nArena>0&&G.tick%4===0){
    const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
    if(p) p.combattimento=Math.min(100,p.combattimento+2);
  }
  if(nInferm>0){
    for(const p of G.pirati) if(p.umore<40) p.umore=Math.min(100,p.umore+8);
  }
  const sogliaDiserzione=nCappella>0?8:12;

  const bil=G.bilanciamento?.consumo||{};
  const costoCibo=Math.ceil(G.pirati.length*(bil.ciboPerPirata??1.25));
  G.cibo-=costoCibo;
  if(G.cibo<0){G.cibo=0;for(const p of G.pirati) p.umore-=10;aggMsg('⚠ I pirati stanno morendo di fame!','male');}

  const costoRum=Math.ceil(G.pirati.length*(bil.rumPerPirata??.45));
  if(G.rum>=costoRum){G.rum-=costoRum;for(const p of G.pirati) p.umore=Math.min(100,p.umore+3);}
  else for(const p of G.pirati) p.umore-=6;
  if(haTaverna) for(const p of G.pirati) p.umore=Math.min(100,p.umore+5);

  const pirateCoperti=Math.min(G.pirati.length, Math.floor(nCasa*(bil.coperturaCasa??3) + G.navi.length*(bil.coperturaNave??1)));
  const pagaTotale=G.pirati.reduce((a,p)=>a+p.paga,0);
  const pagaFinale=Math.max(0, Math.ceil(pagaTotale*(bil.pagaFattore??.55))-pirateCoperti);
  G.oro-=pagaFinale;
  if(G.oro<0){G.oro=0;for(const p of G.pirati) p.umore-=8;}

  for(const p of G.pirati){
    if(!p.capitano) continue;
    if(p.id==='cap_bellamy') for(const q of G.pirati) q.umore=Math.min(100,q.umore+5);
    if(p.id==='cap_jack')    for(const q of G.pirati) q.umore=Math.min(100,q.umore+8);
    if(p.id==='cap_ching'&&!G._chingApplicata){
      G._chingApplicata=true;
      for(const n of G.navi) n.hpMax+=20;
    }
  }

  if(haCaserma&&G.tick%3===0){
    const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
    if(p){p.combattimento=Math.min(100,p.combattimento+1);p.navigazione=Math.min(100,p.navigazione+1);}
  }

  // Deriva umore (casuale) — lista separata per la diserzione
  const daRimuovere=[];
  for(const p of G.pirati){
    p.umore=Math.max(5,Math.min(100,p.umore+(Math.random()-.5)*3));
    if(p.umore<sogliaDiserzione&&Math.random()<.2&&!G.ricerca.completate.has('medicina')){
      aggMsg(`☠ ${p.nome} è disertato!`,'male');
      daRimuovere.push(p.id);
    }
  }
  if(daRimuovere.length>0)
    G.pirati=G.pirati.filter(p=>!daRimuovere.includes(p.id));

  for(const n of G.navi){
    if(n.inMare){
      n.usura=Math.min(100,(n.usura||0)+2);
      if(n.usura>50){
        const penalita=Math.floor((n.usura-50)*.4);
        const base=80+(G.ricerca.completate.has('armatura')?20:0)+(n.livCannoni||0)*5;
        n.hpMax=Math.max(20,base-penalita);
        n.hp=Math.min(n.hp,n.hpMax);
      }
    }
  }

  // Rientro navi — esito calcolato qui, al ritorno reale.
  // Prima del countdown, ogni nave può generare piccoli eventi di spedizione:
  // vento, bonaccia, pattuglie, prede minori. È non bloccante e stile Tropico 2.
  for(const n of G.navi){
    if(n.inMare && n.timerRaid>0){
      if(typeof tickEventiSpedizioneRaid==='function') tickEventiSpedizioneRaid(n);
      n.timerRaid--;
      if(n.timerRaid<=0) rientroNave(n);
    }
  }

  for(const p of G.prigionieri){p.giorni++;G.cibo=Math.max(0,G.cibo-1);}
  // Schiavi al lavoro
  if(typeof tickSchiavi==='function') tickSchiavi();

  if(G.cooldownRaid>0) G.cooldownRaid--;
  G.fazioni.reale.rep  =Math.max(-100,Math.min(100,G.fazioni.reale.rep+.5));
  G.fazioni.mercante.rep=Math.max(-100,Math.min(100,G.fazioni.mercante.rep+.2));
  if(G.tick%7===0) eventoRandom();
  controllaMissione('oro',G.oro);
  ['cibo','legno','rum'].forEach(k=>G[k]=Math.max(0,Math.min(999,G[k])));
  G.oro=Math.max(0,G.oro);
  if(!G.fineGioco) controllaFineGioco();
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// EVENTI NARRATIVI
// ═══════════════════════════════════════════════════
