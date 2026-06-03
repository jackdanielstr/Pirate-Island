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

function clamp100(v){ return Math.max(0,Math.min(100,Number.isFinite(v)?v:50)); }

function bisogniPiratiDefault(){
  return {cibo:60,grog:55,gioco:50,compagnia:45,riposo:50,bottino:40,difesa:50,anarchia:45};
}

function normalizzaBisogniPirata(p){
  if(!p.bisogni) p.bisogni={};
  // Migrazione salvataggi Fase 9A -> 9B.
  if(Number.isFinite(p.bisogni.fame) && !Number.isFinite(p.bisogni.cibo)) p.bisogni.cibo=p.bisogni.fame;
  if(Number.isFinite(p.bisogni.rum) && !Number.isFinite(p.bisogni.grog)) p.bisogni.grog=p.bisogni.rum;
  if(Number.isFinite(p.bisogni.divertimento)){
    if(!Number.isFinite(p.bisogni.gioco)) p.bisogni.gioco=p.bisogni.divertimento;
    if(!Number.isFinite(p.bisogni.anarchia)) p.bisogni.anarchia=Math.max(35,p.bisogni.divertimento-5);
  }
  if(Number.isFinite(p.bisogni.alloggio) && !Number.isFinite(p.bisogni.riposo)) p.bisogni.riposo=p.bisogni.alloggio;
  const d=bisogniPiratiDefault();
  for(const [k,v] of Object.entries(d)) if(!Number.isFinite(p.bisogni[k])) p.bisogni[k]=v;
  return p.bisogni;
}

function mediaBisognoPirati(k, fallback=50){
  if(!G.pirati||!G.pirati.length) return fallback;
  let somma=0;
  for(const p of G.pirati){
    const b=normalizzaBisogniPirata(p);
    if(!Number.isFinite(b[k])) b[k]=fallback;
    somma+=b[k];
  }
  return Math.round(somma/G.pirati.length);
}

function aggiornaBisogniPirati9A(ctx){
  // Nome funzione conservato per compatibilità, ma il modello ora è 9B.
  const B=G.bisogni||(G.bisogni={});
  const pirati=G.pirati||[];
  const n=pirati.length||1;
  const bil=G.bilanciamento?.consumo||{};

  const costoCibo=Math.ceil(n*(bil.ciboPerPirata??1.25));
  const ciboOk=G.cibo>=costoCibo;
  G.cibo=Math.max(0,G.cibo-costoCibo);

  const costoRum=Math.ceil(n*(bil.rumPerPirata??.45));
  const grogOk=G.rum>=costoRum;
  if(grogOk) G.rum-=costoRum;

  const capRiposo=Math.floor(
    ctx.nCasa*(bil.coperturaCasa??3) +
    ctx.nGrotta*2 +
    ctx.nLocanda*2 +
    G.navi.length*(bil.coperturaNave??1)
  );
  const riposoRatio=Math.min(1,capRiposo/n);

  const ciboServizi=ctx.nMensaEco*11 + ctx.nLocanda*8 + ctx.nForno*5 + ctx.nFattor*2;
  const grogServizi=(ctx.haTaverna?14:0) + ctx.nBettola*11 + ctx.nLocanda*6;
  const giocoServizi=ctx.nCanta*15 + ctx.nCasino*20 + ctx.nArena*7 + (ctx.haTaverna?4:0);
  const compagniaServizi=ctx.nBordello*18 + ctx.nMassaggiatrici*14 + ctx.nBagni*10;
  const bottinoServizi=ctx.nCasa*9 + ctx.nGrotta*8 + ctx.nMercatoNero*10;
  const difesaServizi=ctx.nGuardia*14 + ctx.nFortezza*18;
  const anarchiaServizi=(ctx.haTaverna?9:0) + ctx.nBettola*13 + ctx.nArena*16 + ctx.nBordello*4;

  for(const p of pirati){
    const b=normalizzaBisogniPirata(p);
    b.cibo=clamp100((b.cibo??60) + (ciboOk?3:-12) + ciboServizi/n - 2);
    b.grog=clamp100((b.grog??55) + (grogOk?3:-10) + grogServizi/n - 3);
    b.gioco=clamp100((b.gioco??50) + giocoServizi/n - 6);
    b.compagnia=clamp100((b.compagnia??45) + compagniaServizi/n - 6);
    b.riposo=clamp100((b.riposo??50) + (riposoRatio>=1?5:riposoRatio>.5?0:-8));
    b.bottino=clamp100((b.bottino??40) + bottinoServizi/n - 5);
    b.difesa=clamp100((b.difesa??50) + difesaServizi/n - 4);
    b.anarchia=clamp100((b.anarchia??45) + anarchiaServizi/n - 5);

    const media=(b.cibo+b.grog+b.gioco+b.compagnia+b.riposo+b.bottino+b.difesa+b.anarchia)/8;
    p.umore=clamp100((p.umore??50) + Math.floor((media-50)/13));
    if(b.cibo<15 || b.grog<12) p.umore=clamp100(p.umore-5);
  }

  for(const k of ['cibo','grog','gioco','compagnia','riposo','bottino','difesa','anarchia']){
    B[k]=mediaBisognoPirati(k,B[k]??50);
  }
  // Alias non distruttivi per vecchie viste/salvataggi.
  B.fame=B.cibo; B.rum=B.grog; B.divertimento=Math.round((B.gioco+B.compagnia+B.anarchia)/3); B.alloggio=B.riposo; B.sicurezza=B.difesa;

  const mediaCore=Math.round((B.cibo+B.grog+B.gioco+B.compagnia+B.riposo+B.bottino+B.difesa+B.anarchia)/8);

  if(G.tick%5===0){
    if(!ciboOk) aggMsg('🍖 La ciurma vuole grub: servono cibo, fattorie o tavola economica.','male');
    if(!grogOk) aggMsg('🍺 La ciurma reclama grog: servono canna, distilleria e taverna.','male');
    if(B.gioco<25) aggMsg('🎲 I pirati vogliono scommesse: costruisci sala da gioco o casinò.','male');
    if(B.compagnia<25) aggMsg('💋 I pirati chiedono compagnia: servono bordello, massaggiatrici o bagni.','male');
    if(B.riposo<25) aggMsg('🛌 La ciurma non riposa: costruisci case pirata, grotte o locande.','male');
    if(B.bottino<20) aggMsg('🏴 La ciurma vuole nascondere il bottino: servono case pirata, grotte o mercato nero.','male');
    if(B.difesa<20) aggMsg('🛡️ La ciurma si sente indifesa: costruisci torre, guardie o fortezza.','male');
    if(B.anarchia<20) aggMsg('🔥 Troppo ordine: i pirati vogliono più anarchia, taverne e arena.','male');
  }

  G.economia.bisogniCore=mediaCore;
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
  const nLocanda = effTipoEdifici('locanda');
  const nBettola = effTipoEdifici('bettola_contrabbandieri');
  const nMensaEco= effTipoEdifici('mensa_economica');
  const nInferm  = effTipoEdifici('infermeria');
  const nBagni   = effTipoEdifici('bagni');
  const nGuardia = effTipoEdifici('guardia');
  const nSarto   = effTipoEdifici('sarto');
  const nGrotta  = effTipoEdifici('grotta_pirati');
  const nCasino  = effTipoEdifici('casino');
  const nMassaggiatrici = effTipoEdifici('massaggiatrici');
  const nMercatoNero = effTipoEdifici('mercatonero');
  const nFortezza = effTipoEdifici('fortezza');
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

  aggiornaBisogniPirati9A({
    nFattor,nForno,nCasa,nBordello,nArena,nCanta,nLocanda,nBettola,nMensaEco,
    nInferm,nBagni,nGuardia,nSarto,nGrotta,nCasino,nMassaggiatrici,nMercatoNero,nFortezza,haTaverna
  });

  if(nArena>0&&G.tick%4===0){
    const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
    if(p) p.combattimento=Math.min(100,p.combattimento+2);
  }
  if(nInferm>0){
    for(const p of G.pirati) if(p.umore<40) p.umore=Math.min(100,p.umore+8);
  }
  const sogliaDiserzione=(G.bisogni?.difesa||50)>55?8:12;

  const bil=G.bilanciamento?.consumo||{};
  const coperturaPaga=Math.floor(nCasa*(bil.coperturaCasa??3) + G.navi.length*(bil.coperturaNave??1) + nLocanda*2);
  const pagaTotale=G.pirati.reduce((a,p)=>a+p.paga,0);
  const pagaFinale=Math.max(0, Math.ceil(pagaTotale*(bil.pagaFattore??.55))-coperturaPaga);
  G.oro-=pagaFinale;
  if(G.oro<0){G.oro=0;for(const p of G.pirati) p.umore=clamp100((p.umore??50)-8);}

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
