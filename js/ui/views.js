// Isla del Diablo — ui/views.js
// Estratto da 23_ui_views.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_VIEWS
// ═══════════════════════════════════════
function renderFlotta(){
  let h=`<div class="titolo-sez">⛵ Flotta (${G.navi.length})</div>`;
  for(const n of G.navi){
    const pct=Math.max(0,n.hp/n.hpMax*100);
    const col=pct>60?'var(--verde-ch)':pct>30?'var(--oro)':'var(--rum-chiaro)';
    const usura=Math.round(n.usura||0);
    const stelle=c=>'★'.repeat(c)+'☆'.repeat(3-c);
    const danni=n.hpMax-n.hp>0;
    h+=`<div class="carta-nave" onclick="apriGestioneNave(${n.id})" style="cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="nome-n">⛵ ${n.nome}</div>
          <div class="stato-n">${n.inMare?`⚓ In mare — ${n.timerRaid}g`:'🏠 In porto'}</div>
        </div>
        ${danni&&!n.inMare?`<span style="font-size:.65rem;color:var(--rum-chiaro);border:1px solid var(--rum-chiaro);padding:1px 5px;border-radius:3px">DANNI</span>`:''}
        ${usura>60?`<span style="font-size:.65rem;color:#e07060;border:1px solid #e07060;padding:1px 5px;border-radius:3px">USURA</span>`:''}
      </div>
      <div style="display:flex;gap:6px;margin-top:5px;font-size:.62rem;color:var(--sabbia)">
        <span title="Scafo">🛡${n.hp}/${n.hpMax}</span>
        <span title="Cannoni">💣${stelle(n.livCannoni||0)}</span>
        <span title="Velocità">💨${stelle(n.livVelocita||0)}</span>
        <span title="Stiva">📦${stelle(n.livStiva||0)}</span>
      </div>
      <div class="barra-umore" style="margin-top:4px">
        <div class="riempi-umore" style="width:${pct}%;background:${col}"></div></div>
      <div style="font-size:.62rem;color:rgba(240,192,64,.5);margin-top:4px;text-align:right">
        tocca per gestire →</div>
    </div>`;
  }
  h+=`<button class="btn-costruisci" onclick="costruisciNave()"
    ${G.oro<150||G.legno<80||!G.edifici.find(b=>b.tipo==='cantiere')?'disabled':''}>
    <span>🛠 Costruisci Sciabecco</span><span class="costo">150o 80l</span></button>`;
  return h;
}

function renderRicerca(){
  let h=`<div class="titolo-sez">🔭 Ricerca <span style="font-size:.75rem;color:var(--sabbia);font-family:'Cinzel'">${Math.floor(G.ricerca.punti)} pt</span></div>`;
  h+=`<p style="font-size:.65rem;color:var(--sabbia);font-style:italic;margin-bottom:8px">Costruisci un Osservatorio per guadagnare punti ricerca.</p>`;
  for(const t of TECH){
    const fatto=G.ricerca.completate.has(t.id);
    const disp=puoRicercare(t);
    h+=`<div class="nodo-tech ${fatto?'ricercato':disp?'disponibile':'bloccato'}" ${disp?`onclick="faiRicerca('${t.id}')"`:''}">
      <div class="nome-t">${t.icona} ${t.nome}</div>
      <div class="desc-t">${t.desc}</div>
      ${t.req.length?`<div style="font-size:.6rem;color:#888;margin-top:2px">Richiede: ${t.req.join(', ')}</div>`:''}
      ${!fatto?`<div class="costo-t">${t.costo} pt${disp?' — clicca per ricercare':''}</div>`:''}
    </div>`;
  }
  return h;
}

function renderFazioni(){
  let h=`<div class="titolo-sez">🌐 Fazioni</div>`;
  for(const[k,f] of Object.entries(G.fazioni)){
    const pct=Math.min(100,Math.max(0,(f.rep+100)/2));
    const col=pct>60?'var(--verde-ch)':pct>40?'var(--oro)':'var(--rum-chiaro)';
    h+=`<div class="riga-fazione">
      <div class="fazione-icon">${f.icona}</div>
      <div class="fazione-info">
        <div style="font-size:.78rem;font-weight:bold">${f.nome}</div>
        <div style="font-size:.63rem;color:var(--sabbia)">${etichetteRep(f.rep)}</div>
        <div class="barra-fazione"><div class="riempi-fazione" style="width:${pct}%;background:${col}"></div></div>
      </div>
      <div style="font-size:.7rem;color:${col};font-family:'Cinzel'">${Math.floor(f.rep)}</div>
    </div>`;
  }
  h+=`<div style="font-size:.65rem;color:var(--sabbia);font-style:italic;margin-top:8px">
    Alta rep. Mercanti = prezzi migliori.<br>
    Alta rep. Corsari = meno attacchi.<br>
    Bassa rep. Reale = battaglie navali.
  </div>`;
  return h;
}

function renderRegistroGovernatore(){
  const econ=G.economia||{};
  const sc=G.scorte||{};
  const rete=typeof reteSentieriPercentuale==='function' ? reteSentieriPercentuale() : (econ.rete||100);
  const produttivita=econ.produttivita||100;
  const reteCol=rete>75?'var(--verde-ch)':rete>45?'var(--oro)':'var(--rum-chiaro)';
  const prodCol=produttivita>75?'var(--verde-ch)':produttivita>45?'var(--oro)':'var(--rum-chiaro)';
  const scorte=[
    ['canna','Canna',sc.canna||0],['tabacco','Tabacco',sc.tabacco||0],
    ['ferro','Ferro',sc.ferro||0],['metallo','Metallo',sc.metallo||0],
    ['tavole','Tavole',sc.tavole||0],['razioni','Razioni',sc.razioni||0],
    ['sigari','Sigari',sc.sigari||0],['armi','Armi',sc.armi||0],['cannoni','Cannoni',sc.cannoni||0],
  ];
  const turno=(econ.turno||[]).slice(-6);
  let h=`<div class="registro-governatore">
    <div class="registro-titolo">Registro del Governatore</div>
    <div class="registro-metriche">
      <div><span>Rete sentieri</span><strong style="color:${reteCol}">${Math.round(rete)}%</strong></div>
      <div><span>Produttivita</span><strong style="color:${prodCol}">${Math.round(produttivita)}%</strong></div>
    </div>
    <div class="registro-sottotitolo">Filiere e scorte</div>
    <div class="registro-scorte">`;
  for(const [,nome,val] of scorte){
    h+=`<div class="registro-chip"><span>${nome}</span><b>${Math.floor(val)}</b></div>`;
  }
  h+=`</div>`;
  if(turno.length){
    h+=`<div class="registro-sottotitolo">Ultimo giorno</div><div class="registro-turno">`;
    for(const p of turno) h+=`<span>+${p.val} ${p.nome}</span>`;
    h+=`</div>`;
  }
  if(econ.avvisi&&econ.avvisi.length){
    h+=`<div class="registro-avvisi">`;
    for(const a of econ.avvisi) h+=`<div>${a}</div>`;
    h+=`</div>`;
  }
  h+=`</div>`;
  return h;
}

function renderBisogni(){
  const B=G.bisogni||{};
  const core=[
    {k:'fame', nome:'Fame', icona:'🍖', edifici:['fattoria','banane','papaia','forno','mensa_economica','locanda'], nota:'Fattorie, Forno, Tavola Economica, Locanda'},
    {k:'rum', nome:'Rum', icona:'🍺', edifici:['distilleria','birrificio','taverna','bettola_contrabbandieri'], nota:'Distilleria, Birrificio, Taverna'},
    {k:'divertimento', nome:'Divertimento', icona:'🎲', edifici:['taverna','bordello','arena','cantastorie','casino'], nota:'Taverna, Sala da Gioco, Bordello, Arena'},
    {k:'salute', nome:'Salute', icona:'🏥', edifici:['infermeria','bagni','speziale'], nota:'Chirurgia, Speziale, Bagni'},
    {k:'alloggio', nome:'Alloggio', icona:'🛖', edifici:['casapirata','locanda'], nota:'Casa del Pirata, Locanda, navi in porto'},
  ];
  const secondari=[
    {k:'spirito', nome:'Spirito', icona:'⛪', edifici:['cappella'], nota:'Cappella'},
    {k:'sicurezza', nome:'Sicurezza', icona:'🗼', edifici:['guardia','fortezza'], nota:'Torre, Fortezza'},
    {k:'lusso', nome:'Lusso', icona:'🎩', edifici:['sarto','mercatonero'], nota:'Bottega dei Cappelli, Mercato Nero'},
  ];
  const val=k=>Math.max(0,Math.min(100,Math.floor(B[k]??50)));
  const mediaCore=Math.floor(core.reduce((a,d)=>a+val(d.k),0)/core.length);
  const soddColor=mediaCore>65?'var(--verde-ch)':mediaCore>35?'var(--oro)':'var(--rum-chiaro)';
  const stato=mediaCore>80?'🌟 Ciurma felicissima!':mediaCore>60?'😊 Cala stabile':mediaCore>40?'😐 Sopportabile':mediaCore>20?'😠 Scontenti':'💀 Ammutinamento nell\'aria!';

  const bloccoBisogno=d=>{
    const v=val(d.k);
    const col=v>65?'var(--verde-ch)':v>35?'var(--oro)':'var(--rum-chiaro)';
    const haEdificio=d.edifici.some(e=>G.edifici.find(b=>b.tipo===e));
    return `<div class="bisogno-riga" style="${v<25?'border-color:var(--rum-chiaro);box-shadow:0 0 8px rgba(160,50,35,.25)':''}">
      <div class="bisogno-header">
        <span class="bisogno-nome">${d.icona} ${d.nome}</span>
        <span class="bisogno-val" style="color:${col}">${v}</span>
      </div>
      <div class="bisogno-barra"><div class="bisogno-riempi" style="width:${v}%;background:${col}"></div></div>
      <div class="bisogno-nota">${haEdificio?'✓':'⚠'} ${d.nota}</div>
    </div>`;
  };

  let h=`<div class="titolo-sez">❤ Bisogni della Ciurma</div>
  <div style="text-align:center;margin-bottom:10px;background:rgba(255,255,255,.05);border-radius:6px;padding:8px;border:1px solid var(--bordo)">
    <div style="font-family:'Cinzel',serif;font-size:1.5rem;color:${soddColor}">${mediaCore}</div>
    <div style="font-size:.65rem;color:var(--sabbia)">Soddisfazione pirata media</div>
    <div style="font-size:.62rem;color:${soddColor};margin-top:2px">${stato}</div>
  </div>`;

  h+=`${renderRegistroGovernatore()}
  <div class="registro-sottotitolo">Bisogni principali stile Tropico 2</div>
  <div class="bisogni-grid">`;
  for(const d of core) h+=bloccoBisogno(d);
  h+=`</div><div class="registro-sottotitolo" style="margin-top:8px">Bisogni secondari della cala</div><div class="bisogni-grid bisogni-secondari">`;
  for(const d of secondari) h+=bloccoBisogno(d);
  h+=`</div>`;

  const peggiori=core.map(d=>({nome:d.nome,v:val(d.k)})).sort((a,b)=>a.v-b.v).slice(0,2);
  h+=`<div style="font-size:.68rem;color:var(--sabbia);font-style:italic;margin-top:6px">
    Priorità: <span style="color:var(--oro)">${peggiori.map(p=>`${p.nome} ${p.v}`).join(' · ')}</span><br>
    In questa fase fame, rum, divertimento, salute e alloggio influenzano direttamente l'umore dei pirati.
  </div>`;
  return h;
}

function renderMissioni(){
  // Obiettivi vittoria in cima
  let h=`<div class="titolo-sez">🏆 Obiettivi Vittoria</div>`;
  for(const ob of OBIETTIVI_VITTORIA){
    const done=ob.check();
    const pct=Math.min(100,Math.round(ob.progresso()/ob.totale*100));
    const col=done?'var(--verde-ch)':'var(--oro)';
    h+=`<div style="margin-bottom:7px;opacity:${done?.7:1}">
      <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:2px">
        <span style="color:${done?'var(--verde-ch)':'var(--pergamena)'}">${done?'✓ ':''}${ob.desc}</span>
        <span style="color:${col}">${ob.fmt(ob.progresso())}</span>
      </div>
      <div class="barra-umore"><div class="riempi-umore" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }
  h+=`<div style="border-top:1px solid var(--bordo);margin:8px 0 8px"></div>`;
  h+=`<div class="titolo-sez">📜 Missioni</div>`;
  for(const m of G.missioniAttive){
    const pct=Math.min(100,Math.floor(m.progresso/m.obiettivo*100));
    const rs=Object.entries(m.ricompensa).map(([k,v])=>`${v} ${k}`).join(', ');
    h+=`<div class="carta-missione">
      <div class="titolo-missione">${m.completata?'✓ ':''} ${m.titolo}</div>
      <div class="desc-missione">${m.desc}</div>
      <div class="barra-umore"><div class="riempi-umore" style="width:${pct}%;background:${m.completata?'var(--verde-ch)':'var(--oro)'}"></div></div>
      <div style="font-size:.62rem;color:var(--sabbia);margin-top:2px">${Math.min(m.progresso,m.obiettivo)} / ${m.obiettivo}</div>
      <div class="ricompensa-missione">🏆 ${rs}</div>
    </div>`;
  }
  return h;
}

function etichetteRep(r){
  if(r>60) return 'Alleata';if(r>30) return 'Amica';if(r>-10) return 'Neutrale';
  if(r>-40) return 'Ostile';return 'In Guerra';
}
function selPirata(id){apriProfiloPirata(id);}
function riparaNave(id){
  apriGestioneNave(id);
}


// ═══════════════════════════════════════
// PATCH 8D — viste plancia più compatte e leggibili
// ═══════════════════════════════════════
function renderFlotta(){
  let h=`<div class="titolo-sez">⛵ Flotta (${G.navi.length})</div><div class="panel-grid">`;
  const stelle=c=>'★'.repeat(c)+'☆'.repeat(3-c);
  for(const n of G.navi){
    const pct=Math.max(0,n.hp/n.hpMax*100);
    const col=pct>60?'var(--verde-ch)':pct>30?'var(--oro)':'var(--rum-chiaro)';
    const usura=Math.round(n.usura||0);
    h+=`<div class="panel-card clickable" onclick="apriGestioneNave(${n.id})">
      <div class="panel-card-row"><div style="min-width:0"><div class="panel-card-title">⛵ ${n.nome}</div><div class="panel-card-sub">${n.inMare?`In mare — ${n.timerRaid}g`:'In porto'}${usura>60?' · usura alta':''}</div></div><div style="font-size:.62rem;color:${col};flex-shrink:0">${Math.floor(pct)}%</div></div>
      <div class="panel-stat-row"><span class="panel-chip">🛡 ${n.hp}/${n.hpMax}</span><span class="panel-chip">💣 ${stelle(n.livCannoni||0)}</span><span class="panel-chip">💨 ${stelle(n.livVelocita||0)}</span><span class="panel-chip">📦 ${stelle(n.livStiva||0)}</span></div>
      <div class="barra-umore" style="margin-top:5px"><div class="riempi-umore" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }
  h+=`</div><button class="btn-costruisci" onclick="costruisciNave()" ${G.oro<150||G.legno<80||!G.edifici.find(b=>b.tipo==='cantiere')?'disabled':''}><span>🛠 Costruisci Sciabecco</span><span class="costo">150o 80l</span></button>`;
  return h;
}

function renderRicerca(){
  let h=`<div class="titolo-sez">🔭 Ricerca — ${Math.floor(G.ricerca.punti)} pt</div><div class="panel-grid">`;
  for(const t of TECH){
    const fatto=G.ricerca.completate.has(t.id);
    const disp=puoRicercare(t);
    h+=`<div class="panel-card ${disp?'clickable':''} ${fatto?'ricercato':disp?'disponibile':'bloccato'}" ${disp?`onclick="faiRicerca('${t.id}')"`:''}>
      <div class="panel-card-title">${fatto?'✓ ':''}${t.icona} ${t.nome}</div>
      <div class="panel-card-sub">${t.desc}</div>
      <div class="panel-stat-row"><span class="panel-chip">${!fatto?`${t.costo} pt`:'Completata'}</span>${t.req.length?`<span class="panel-chip">Req: ${t.req.join(', ')}</span>`:''}</div>
    </div>`;
  }
  return h+`</div>`;
}

function renderFazioni(){
  let h=`<div class="titolo-sez">🌐 Fazioni</div><div class="panel-grid">`;
  for(const[k,f] of Object.entries(G.fazioni)){
    const pct=Math.min(100,Math.max(0,(f.rep+100)/2));
    const col=pct>60?'var(--verde-ch)':pct>40?'var(--oro)':'var(--rum-chiaro)';
    h+=`<div class="panel-card compact">
      <div class="panel-card-row"><div><div class="panel-card-title">${f.icona} ${f.nome}</div><div class="panel-card-sub">${etichetteRep(f.rep)}</div></div><div style="color:${col};font-family:var(--font-label)">${Math.floor(f.rep)}</div></div>
      <div class="barra-fazione" style="margin-top:5px"><div class="riempi-fazione" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }
  return h+`</div>`;
}

function renderMissioni(){
  let h=`<div class="titolo-sez">🏆 Obiettivi e Missioni</div><div class="panel-grid">`;
  for(const ob of OBIETTIVI_VITTORIA){
    const done=ob.check();
    const pct=Math.min(100,Math.round(ob.progresso()/ob.totale*100));
    const col=done?'var(--verde-ch)':'var(--oro)';
    h+=`<div class="panel-card compact" style="opacity:${done?.72:1}"><div class="panel-card-row"><div class="panel-card-title">${done?'✓ ':''}${ob.desc}</div><div style="color:${col};font-size:.62rem">${ob.fmt(ob.progresso())}</div></div><div class="barra-umore"><div class="riempi-umore" style="width:${pct}%;background:${col}"></div></div></div>`;
  }
  for(const m of G.missioniAttive){
    const pct=Math.min(100,Math.floor(m.progresso/m.obiettivo*100));
    const rs=Object.entries(m.ricompensa).map(([k,v])=>`${v} ${k}`).join(', ');
    h+=`<div class="panel-card"><div class="panel-card-title">📜 ${m.completata?'✓ ':''}${m.titolo}</div><div class="panel-card-sub">${m.desc}</div><div class="barra-umore" style="margin-top:5px"><div class="riempi-umore" style="width:${pct}%;background:${m.completata?'var(--verde-ch)':'var(--oro)'}"></div></div><div class="panel-card-sub">${Math.min(m.progresso,m.obiettivo)} / ${m.obiettivo} · 🏆 ${rs}</div></div>`;
  }
  return h+`</div>`;
}

function renderBisogni(){
  const B=G.bisogni;
  const defs=[
    {k:'divertimento',nome:'Divertimento',icona:'💋',edifici:['bordello','arena','cantastorie'],nota:'Brothel, arena, gioco'},
    {k:'spirito',nome:'Spirito',icona:'⛪',edifici:['cappella'],nota:'Cappella e ordine'},
    {k:'salute',nome:'Salute',icona:'🏥',edifici:['infermeria','bagni'],nota:'Infermeria e bagni'},
    {k:'sicurezza',nome:'Sicurezza',icona:'🗼',edifici:['guardia','fortezza'],nota:'Guardie e forti'},
    {k:'lusso',nome:'Lusso',icona:'🧵',edifici:['sarto','mercatonero'],nota:'Sarto e mercato nero'},
  ];
  const soddMedia=Math.floor((B.divertimento+B.spirito+B.salute+B.sicurezza+B.lusso)/5);
  const soddColor=soddMedia>65?'var(--verde-ch)':soddMedia>35?'var(--oro)':'var(--rum-chiaro)';
  let h=`<div class="titolo-sez">❤ Bisogni ciurma — <span style="color:${soddColor}">${soddMedia}</span></div><div class="panel-grid">`;
  for(const d of defs){
    const val=Math.floor(B[d.k]);
    const col=val>65?'var(--verde-ch)':val>35?'var(--oro)':'var(--rum-chiaro)';
    const haEdificio=d.edifici.some(e=>G.edifici.find(b=>b.tipo===e));
    h+=`<div class="panel-card compact"><div class="panel-card-row"><div class="panel-card-title">${d.icona} ${d.nome}</div><div style="color:${col}">${val}</div></div><div class="bisogno-barra"><div class="bisogno-riempi" style="width:${val}%;background:${col}"></div></div><div class="panel-card-sub">${haEdificio?'✓':'⚠'} ${d.nota}</div></div>`;
  }
  h+=`</div>${renderRegistroGovernatore()}`;
  return h;
}
