// ═══════════════════════════════════════
// MODULO: MAIN
// ═══════════════════════════════════════
const OBIETTIVI_VITTORIA=[
  {
    id:'flotta',
    desc:'Flotta da 4 navi',
    check:()=>G.navi.length>=4,
    progresso:()=>Math.min(G.navi.length,4),
    totale:4,
    fmt:v=>v+'/4 navi',
  },
  {
    id:'oro',
    desc:'1500 oro in cassa',
    check:()=>G.oro>=1500,
    progresso:()=>Math.min(G.oro,1500),
    totale:1500,
    fmt:v=>v+'/1500 oro',
  },
  {
    id:'pirati',
    desc:'Ciurma di 10 pirati',
    check:()=>G.pirati.length>=10,
    progresso:()=>Math.min(G.pirati.length,10),
    totale:10,
    fmt:v=>v+'/10 pirati',
  },
  {
    id:'ricerca',
    desc:'5 tecnologie studiate',
    check:()=>G.ricerca.completate.size>=5,
    progresso:()=>Math.min(G.ricerca.completate.size,5),
    totale:5,
    fmt:v=>v+'/5 tecnologie',
  },
  {
    id:'corsari',
    desc:'Alleanza con i Corsari (rep 60+)',
    check:()=>G.fazioni.corsaro.rep>=60,
    progresso:()=>Math.min(Math.max(0,G.fazioni.corsaro.rep+100),160),
    totale:160,
    fmt:()=>Math.floor(G.fazioni.corsaro.rep)+'/60 rep',
  },
];

// Condizioni sconfitta
const CONDIZIONI_SCONFITTA=[
  {
    id:'bancarotta',
    check:()=>G.oro<=0&&G.pirati.length<=1,
    desc:'Senza oro e senza ciurma',
  },
  {
    id:'deserto',
    check:()=>G.pirati.length===0,
    desc:'Tutta la ciurma ha abbandonato l\'isola',
  },
  {
    id:'fame',
    desc:'Tre giorni di fame e miseria totale',
    check:()=>G.giorniSenzaRisorse>=3,
  },
];

function controllaFineGioco(){
  // aggiorna counter miseria
  if(G.oro<=0&&G.cibo<=0&&G.pirati.length<=2) G.giorniSenzaRisorse++;
  else G.giorniSenzaRisorse=0;

  // check sconfitta
  for(const cond of CONDIZIONI_SCONFITTA){
    if(cond.check()){
      mostraFineGioco(false, cond.desc);
      return;
    }
  }

  // check vittoria — tutti gli obiettivi
  if(OBIETTIVI_VITTORIA.every(ob=>ob.check())){
    mostraFineGioco(true, '');
  }
}

function mostraFineGioco(vittoria, motivoSconfitta){
  G.fineGioco=true;

  const overlay=document.getElementById('overlay-fine');
  const box=document.getElementById('box-fine');
  box.className=vittoria?'vittoria':'sconfitta';

  document.getElementById('fine-banner').textContent=vittoria?'🏆':'💀';
  document.getElementById('fine-titolo').textContent=vittoria
    ?`La Leggenda è Compiuta!`
    :`L'Isola è Perduta`;
  document.getElementById('fine-sottotitolo').textContent=vittoria
    ?"Capitano dei Mari — Giorno "+G.giorno
    :motivoSconfitta+" — Giorno "+G.giorno;

  document.getElementById('fine-testo').textContent=vittoria
    ?`La vostra fama risuona da un capo all'altro dei Caraibi. Mercanti, corsari e persino la Marina mormorano il vostro nome con rispetto e terrore. L'Isla del Diablo è diventata la più temuta fortezza pirata dei sette mari.`
    :"Le fiamme divorano le ultime capanne. La ciurma si è dispersa, l'oro è finito, il rum è secco. L'Isla del Diablo torna al silenzio del mare, aspettando un nuovo capitano abbastanza pazzo da tentare di nuovo.";

  // statistiche
  document.getElementById('fine-statistiche').innerHTML=`
    <div class="stat-fine"><div class="sv">${G.giorno}</div><div class="sk">Giorni Regnati</div></div>
    <div class="stat-fine"><div class="sv">${Math.floor(G.oro)}</div><div class="sk">Oro in Cassa</div></div>
    <div class="stat-fine"><div class="sv">${G.contatori.raid}</div><div class="sk">Raid Effettuati</div></div>
    <div class="stat-fine"><div class="sv">${G.edifici.length}</div><div class="sk">Edifici Costruiti</div></div>
    <div class="stat-fine"><div class="sv">${G.navi.length}</div><div class="sk">Navi in Flotta</div></div>
    <div class="stat-fine"><div class="sv">${G.ricerca.completate.size}</div><div class="sk">Tecnologie</div></div>
  `;

  // obiettivi con progress bar
  let obHtml='<div class="ob-titolo">Obiettivi Vittoria</div>';
  for(const ob of OBIETTIVI_VITTORIA){
    const done=ob.check();
    const pct=Math.min(100,Math.round(ob.progresso()/ob.totale*100));
    obHtml+=`<div class="ob-riga">
      <span class="ob-check">${done?'✅':'⬜'}</span>
      <span style="flex:1;font-size:.78rem">${ob.desc}</span>
      <span style="font-size:.7rem;color:#8a7a60;min-width:70px;text-align:right">${ob.fmt(ob.progresso())}</span>
    </div>
    <div style="padding:0 0 6px 28px"><div class="ob-barra"><div class="ob-riempi" style="width:${pct}%"></div></div></div>`;
  }
  document.getElementById('fine-obiettivi').innerHTML=obHtml;

  document.getElementById('fine-btn').textContent=vittoria?'⚓ Nuova Partita':'🔄 Riprova';
  overlay.classList.add('aperto');
}

function riavviaGioco(){
  location.reload();
}

let ultimoTick=0;
let ultimoFrame=0;

function cicloGioco(ts=0){
  requestAnimationFrame(cicloGioco);

  // Delta time in secondi (cappato a 100ms per evitare salti dopo tab inattiva)
  const dt = Math.min((ts - ultimoFrame) / 1000, 0.1);
  ultimoFrame = ts;

  // Render sempre (anche in pausa, per UI reattiva)
  try{ disegnaScena(dt); }catch(e){ console.error('disegnaScena:',e); }
  try{ tickPortrait();   }catch(e){ console.error('tickPortrait:',e); }

  // Tick giornaliero: si ferma se velocita=0 (pausa)
  if(G.velocita > 0){
    const intervallo = G.tickMs / G.velocita;
    if(ts - ultimoTick >= intervallo){
      ultimoTick = ts;
      try{ tick(); }catch(e){ console.error('tick:',e); }
    }
  }
}
