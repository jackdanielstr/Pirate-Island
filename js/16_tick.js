// ═══════════════════════════════════════
// MODULO: TICK
// ═══════════════════════════════════════
// ── TICK — avanzamento tempo ──
function tick(){
  G.tick++; G.giorno++;

  for(const p of G.pirati) aggiornaPirata(p);

  // FASE 2D: produzione pesata dalla rete dei sentieri.
  // Edifici collegati al palazzo/porto lavorano al 100%; isolati rendono meno.
  const nFattor  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('fattoria') : G.edifici.filter(b=>b.tipo==='fattoria').length;
  const nDistil  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('distilleria') : G.edifici.filter(b=>b.tipo==='distilleria').length;
  const nSegh    = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('segheria') : G.edifici.filter(b=>b.tipo==='segheria').length;
  const nOsserv  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('osservatorio') : G.edifici.filter(b=>b.tipo==='osservatorio').length;
  const nCasa    = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('casapirata') : G.edifici.filter(b=>b.tipo==='casapirata').length;
  const nBordello= typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('bordello') : G.edifici.filter(b=>b.tipo==='bordello').length;
  const nArena   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('arena') : G.edifici.filter(b=>b.tipo==='arena').length;
  const nCanta   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('cantastorie') : G.edifici.filter(b=>b.tipo==='cantastorie').length;
  const nCappella= typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('cappella') : G.edifici.filter(b=>b.tipo==='cappella').length;
  const nInferm  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('infermeria') : G.edifici.filter(b=>b.tipo==='infermeria').length;
  const nBagni   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('bagni') : G.edifici.filter(b=>b.tipo==='bagni').length;
  const nGuardia = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('guardia') : G.edifici.filter(b=>b.tipo==='guardia').length;
  const nSarto   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('sarto') : G.edifici.filter(b=>b.tipo==='sarto').length;
  const haTaverna= G.edifici.find(b=>b.tipo==='taverna');
  const haCaserma= G.edifici.find(b=>b.tipo==='caserma');

  // produzione risorse: Math.floor evita decimali visibili, ma mantiene il peso dei sentieri.
  G.cibo          += 5 + Math.floor(nFattor*9);
  G.legno         += 3 + Math.floor(nSegh*7);
  G.rum           += Math.floor(nDistil*6);
  G.oro           += 12 + Math.floor(nCasa*6) + Math.floor(nSarto*10);
  G.ricerca.punti += Math.floor(nOsserv*3);
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

  const costoCibo=G.pirati.length*2;
  G.cibo-=costoCibo;
  if(G.cibo<0){G.cibo=0;for(const p of G.pirati) p.umore-=10;aggMsg('⚠ I pirati stanno morendo di fame!','male');}

  const costoRum=G.pirati.length;
  if(G.rum>=costoRum){G.rum-=costoRum;for(const p of G.pirati) p.umore=Math.min(100,p.umore+3);}
  else for(const p of G.pirati) p.umore-=6;
  if(haTaverna) for(const p of G.pirati) p.umore=Math.min(100,p.umore+5);

  const pirateCoperti=Math.min(G.pirati.length, nCasa*2);
  const pagaTotale=G.pirati.reduce((a,p)=>a+p.paga,0);
  const pagaFinale=Math.max(0, pagaTotale-pirateCoperti);
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

  // Rientro navi — esito calcolato qui, al ritorno reale
  for(const n of G.navi){
    if(n.inMare && n.timerRaid>0){
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
