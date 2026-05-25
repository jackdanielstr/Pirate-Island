// Isla del Diablo — events/events_logic.js
// Estratto da 20_events_logic.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: EVENTS_LOGIC
// ═══════════════════════════════════════
function eventoRandom(){
  // ogni 7 tick: 55% narrativo, 45% silenzioso
  if(G.cooldownEvento>0){ G.cooldownEvento--; eventoSilenzioso(); return; }
  if(Math.random()<0.55 && !G.eventoAttivo){
    const disponibili=EVENTI_NARRATIVI.filter(e=>e.peso>0);
    const tot=disponibili.reduce((a,e)=>a+e.peso,0);
    let r=Math.random()*tot;
    for(const ev of disponibili){ r-=ev.peso; if(r<=0){ mostraEvento(ev); return; } }
  }
  eventoSilenzioso();
}

function eventoSilenzioso(){
  const eventi=[
    {p:2,fn:()=>{const g=20+Math.floor(Math.random()*40);G.oro+=g;aggMsg('💰 Un tributo anonimo arriva al porto. Nessuno firma. +'+g+' oro','bene');}},
    {p:2,fn:()=>{const f=15+Math.floor(Math.random()*30);G.cibo+=f;const frasi=['Pesca miracolosa. Il cuoco è sospettosamente soddisfatto.','Qualcuno ha pescato qualcosa di enorme. Non chiedete cosa fosse.','Rete piena. Persino il navigatore ha aiutato. Malvolentieri.'];aggMsg('🐟 '+frasi[Math.floor(Math.random()*frasi.length)]+' +'+f+' cibo','bene');}},
    {p:2,fn:()=>{G.rum+=20+Math.floor(Math.random()*15);const frasi=['Un barilotto di rum galleggia verso riva. Qualcuno lo ha perso. Loro: perdita. Voi: guadagno.','Ritrovato rum nascosto da un pirata che non ricorda di averlo nascosto.','Il cuoco aveva rum "di riserva personale". Non più.'];aggMsg('🍺 '+frasi[Math.floor(Math.random()*frasi.length)]+' +rum','bene');}},
    {p:1,fn:()=>{G.ricerca.punti+=12;const frasi=['Trovato un libro di navigazione tra i rottami. Qualcuno lo aveva letto e sottolineato tutto.','Un vecchio marinaio lascia i suoi appunti prima di andarsene. Scrittura illeggibile ma illuminante.','I rottami dell\'ultima tempesta contenevano schizzi tecnici. Rarissimi.'];aggMsg('📚 '+frasi[Math.floor(Math.random()*frasi.length)],'info');}},
    {p:2,fn:()=>{const g=15+Math.floor(Math.random()*35);G.oro=Math.max(0,G.oro-g);const frasi=['Furto notturno nei magazzini. Professionista. Non ha lasciato tracce.','Qualcuno ha "prestato" oro dalla cassa comune. Non ha lasciato nota.','Il tesoriere giura di aver contato bene ieri. I numeri dissentono.'];aggMsg('🔓 '+frasi[Math.floor(Math.random()*frasi.length)]+' -'+g+' oro','male');}},
    {p:1,fn:()=>{const f=10+Math.floor(Math.random()*20);G.cibo=Math.max(0,G.cibo-f);const frasi=['I topi hanno razziato le dispense. Organizzati, efficienti, impuniti.','Il cuoco giura di non aver lasciato il magazzino aperto. Il cibo la pensa diversamente.','Un nido di topi scoperto nelle scorte. Il cuoco li ha descritti come "grossi come gatti". Nessuno lo contraddice.'];aggMsg('🐀 '+frasi[Math.floor(Math.random()*frasi.length)]+' -'+f+' cibo','male');}},
    {p:2,fn:()=>{const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];if(p){p.combattimento=Math.min(100,p.combattimento+6);const frasi=['si allena all\'alba con serietà inquietante.','ha sfidato a duello un albero. Ha vinto.','ha trascorso la notte ad affilare la spada. Per precauzione, dice.'];aggMsg('⚔ '+p.nome+' '+frasi[Math.floor(Math.random()*frasi.length)]+' +6 combattimento','bene');}}},
    {p:1,fn:()=>{const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];if(p){p.navigazione=Math.min(100,p.navigazione+5);aggMsg('🧭 '+p.nome+' ha studiato le stelle tutta la notte. Le stelle lo ignorano ma lui sa navigare meglio. +5 navigazione','bene');}}},
    {p:1,fn:()=>{const k=['reale','mercante','corsaro'][Math.floor(Math.random()*3)];const v=(Math.random()<.5?1:-1)*(4+Math.floor(Math.random()*8));G.fazioni[k].rep=Math.max(-100,Math.min(100,G.fazioni[k].rep+v));const nome=G.fazioni[k].nome;aggMsg('🌐 '+nome+': qualcuno ha detto qualcosa da qualche parte. Rep '+(v>0?'+':'')+v,'info');}},
    {p:1,fn:()=>{G.legno+=20+Math.floor(Math.random()*20);aggMsg('🪵 Trovato un relitto ricco di legname sulla spiaggia nord. Il mare è generoso quando vuole.','bene');}},
    {p:1,fn:()=>{G.legno=Math.max(0,G.legno-15);aggMsg('🔥 Il falegname ha bruciato del legname per sbaglio. Stava "testando la resistenza al fuoco". Risultato: basso.','male');}},
    {p:1,fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);aggMsg('🌅 Alba insolitamente bella. Persino i pirati più cinici si fermano a guardarla. Un momento di pace.','bene');}},
    {p:1,fn:()=>{const g=10+Math.floor(Math.random()*25);G.oro+=g;aggMsg('💸 Un debitore di vecchia data ha pagato. Nessuno ricordava il debito. Lui sì.','bene');}},
    {p:1,fn:()=>{for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);aggMsg('😡 La ciurma ha litigato sul chi prende il letto migliore nella nuova capanna. Nessun ferito, ma l\'atmosfera è pesante.','male');}},
  ];
  const tot=eventi.reduce((a,e)=>a+e.p,0);
  let r=Math.random()*tot;
  for(const e of eventi){r-=e.p;if(r<=0){e.fn();break;}}
}

function mostraEvento(ev){
  G.eventoAttivo=true;
  G.cooldownEvento=COOLDOWN_EVENTO_MIN;

  const banner=document.getElementById('ev-banner');
  banner.style.background=ev.sfondo||'#0a1a2a';
  // icona nel banner (prima del ::after quindi z-index 0)
  banner.innerHTML='<span class="evento-tag" id="ev-tag">'+ev.tag+'</span><span style="position:relative;z-index:2;filter:drop-shadow(0 2px 8px rgba(0,0,0,.8))">'+ev.icona+'</span>';

  document.getElementById('ev-titolo').textContent=ev.titolo;
  const testo=typeof ev.testo==='function'?ev.testo():ev.testo;
  document.getElementById('ev-testo').textContent=testo;

  const contenitoreScelte=document.getElementById('ev-scelte');
  contenitoreScelte.innerHTML='';
  const esito=document.getElementById('ev-esito');
  esito.className='esito-evento';
  esito.style.display='none';
  const btnChiudi=document.getElementById('btn-chiudi-evento');
  btnChiudi.className='';
  btnChiudi.style.display='none';

  ev.scelte.forEach((sc,i)=>{
    const btn=document.createElement('button');
    btn.className='btn-scelta'+(sc.colore?' '+sc.colore:'');
    btn.innerHTML='<span class="scelta-etich">'+sc.etich+'</span>'+sc.testo;
    btn.onclick=()=>eseguiScelta(ev,sc,contenitoreScelte,esito,btnChiudi);
    contenitoreScelte.appendChild(btn);
  });

  document.getElementById('overlay-evento').classList.add('aperto');
}

function eseguiScelta(ev,sc,contenitoreScelte,esitoEl,btnChiudi){
  // esegui conseguenza
  if(sc.fn) sc.fn();
  aggiornaUI();

  // mostra esito
  const testoEsito=typeof sc.esito==='function'?sc.esito():sc.esito;
  esitoEl.textContent=testoEsito;
  esitoEl.className='esito-evento mostra'+(sc.tipo==='male'?' male':sc.tipo==='bene'?' bene':'');
  esitoEl.style.display='block';

  // nascondi scelte
  contenitoreScelte.style.display='none';

  // mostra tasto chiudi
  btnChiudi.className='mostra';
  btnChiudi.style.display='block';
}

function chiudiEvento(){
  G.eventoAttivo=false;
  document.getElementById('overlay-evento').classList.remove('aperto');
  document.getElementById('ev-scelte').style.display='flex';
}

function reclutaPirata(){
  if(G.oro<50){aggMsg('Servono 50 oro!','male');return;}
  G.oro-=50; creaaPirata();
  aggMsg('Nuovo pirata reclutato!','bene');aggiornaUI();
}

// ── MISSIONI ──
function assegnaMissioni(){
  G.missioniAttive=POOL_MISSIONI.slice(0,3).map(q=>({...q,progresso:0,completata:false}));
}
function controllaMissione(tipo,val){
  for(const m of G.missioniAttive){
    if(m.completata) continue;
    if(m.tipo===tipo){
      if(tipo==='raid'||tipo==='riscatti'||tipo==='ricerca') m.progresso+=val;
      else m.progresso=Math.max(m.progresso,val);
      if(m.progresso>=m.obiettivo){
        m.completata=true;
        for(const[k,v] of Object.entries(m.ricompensa)){
          if(k==='oro') G.oro+=v;
          else if(k==='legno') G.legno+=v;
          else if(k==='rum') G.rum+=v;
          else if(k==='ricerca') G.ricerca.punti+=v;
        }
        const rs=Object.entries(m.ricompensa).map(([k,v])=>`${v} ${k}`).join(', ');
        notifica('📜 Missione Completata!',`"${m.titolo}" — Ricompensa: ${rs}`,'missione');
        const nuove=POOL_MISSIONI.filter(q2=>!G.missioniAttive.find(a=>a.id===q2.id));
        if(nuove.length>0){
          const nm={...nuove[Math.floor(Math.random()*nuove.length)],progresso:0,completata:false};
          G.missioniAttive=G.missioniAttive.map(x=>x.id===m.id?nm:x);
        }
        aggiornaUI();
      }
    }
    if(m.tipo==='oro'&&G.oro>=m.obiettivo&&!m.completata){
      m.progresso=G.oro;
      if(m.progresso>=m.obiettivo){
        m.completata=true; G.ricerca.punti+=m.ricompensa.ricerca||0;
        notifica('📜 Missione Completata!',`"${m.titolo}"!`,'missione');
        aggiornaUI();
      }
    }
  }
}

// ═══════════════════════════════════════════════════
// RENDER PANNELLO
// ═══════════════════════════════════════════════════
