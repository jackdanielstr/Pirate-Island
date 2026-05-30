// Isla del Diablo — ui/panel.js
// Estratto da 21_ui_panel.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_PANEL
// ═══════════════════════════════════════
function mostraTab(tab){
  G.tabCorrente=tab;
  document.body.classList.toggle('tab-costruisci', tab==='costruisci');
  // Patch 8D: cambio scheda immediato, senza resize canvas/flicker.
  document.querySelectorAll('.ptab').forEach((b,i)=>{
    const tabs=['costruisci','ciurma','flotta','ricerca','fazioni','missioni','bisogni'];
    b.classList.toggle('attivo',tabs[i]===tab);
  });
  renderPannello();
}
function renderPannello(){
  const c=document.getElementById('contenuto-pannello');
  switch(G.tabCorrente){
    case 'costruisci': c.innerHTML=renderCostruisci(); break;
    case 'ciurma':     c.innerHTML=renderCiurma(); break;
    case 'flotta':     c.innerHTML=renderFlotta(); break;
    case 'ricerca':    c.innerHTML=renderRicerca(); break;
    case 'fazioni':    c.innerHTML=renderFazioni(); break;
    case 'missioni':   c.innerHTML=renderMissioni(); break;
    case 'bisogni':    c.innerHTML=renderBisogni(); break;
  }
}

function selezionaCategoriaCostruzione(cat){
  window.UI_BUILD_CAT=cat;
  renderPannello();
}

function categoriaCostruzioneAttiva(){
  const cats=['infrastrutture','nautica','risorse','produzione','intrattenimento','controllo','addestramento','difesa','accessori'];
  if(!window.UI_BUILD_CAT || !cats.includes(window.UI_BUILD_CAT)) window.UI_BUILD_CAT='infrastrutture';
  return window.UI_BUILD_CAT;
}

function renderCostruisci(){
  const sentieroCosto=2;
  const puoiSentiero=G.oro>=sentieroCosto;
  const gruppi=[
    ['infrastrutture','🪨','Sentieri'],
    ['nautica','⚓','Porto'],
    ['risorse','🌿','Risorse'],
    ['produzione','⚒','Produzione'],
    ['intrattenimento','🍺','Svago'],
    ['controllo','⛓','Prigionieri'],
    ['addestramento','⚔','Addestra'],
    ['difesa','💣','Difesa'],
    ['accessori','🎩','Accessori'],
  ];
  const catAttiva=categoriaCostruzioneAttiva();
  let h=`<div class="build-dock">`;
  h+=`<div class="build-dock-head">
    <div class="build-title">🏗 Costruzioni</div>
    <div class="build-hint">Scegli categoria, poi edificio. Serve un sentiero sul perimetro.</div>
  </div>`;
  h+=`<div class="build-cat-row">`;
  for(const [cat,ico,label] of gruppi){
    const count=Object.entries(ED).filter(([tipo,def])=>!def.inizialeOnly && def.buildable!==false && (def.categoria||'produzione')===cat).length;
    const active=cat===catAttiva?' attiva':'';
    h+=`<button class="build-cat${active}" onclick="selezionaCategoriaCostruzione('${cat}')" ${count===0?'disabled':''}>
      <span class="build-cat-ico">${ico}</span><span>${label}</span>
    </button>`;
  }
  h+=`</div>`;

  h+=`<div class="build-shelf">`;
  if(catAttiva==='infrastrutture'){
    h+=`<button class="build-card build-road${G.modalitaCostruzione==='sentiero'?' attivo-strumento':''}"
      id="b-sentiero" onclick="selezionaSentiero()" ${!puoiSentiero?'disabled':''} title="Trascina sulla mappa per disegnare sentieri" data-tip="Sentiero — collega edifici, porto e palazzo. I pirati camminano solo qui.">
      <span class="build-card-icon">🪨</span>
      <span class="build-card-main"><b>Sentiero</b><small>Trascina sulla mappa</small></span>
      <span class="build-card-cost">2o/tile</span>
    </button>`;
  }
  const entries=Object.entries(ED).filter(([tipo,def])=>!def.inizialeOnly && def.buildable!==false && (def.categoria||'produzione')===catAttiva);
  for(const[tipo,def] of entries){
    const costo=def.costo||{oro:0,legno:0};
    const puoi=G.oro>=costo.oro&&G.legno>=costo.legno;
    const n=G.edifici.filter(b=>b.tipo===tipo).length;
    h+=`<button class="build-card btn-costruisci${G.modalitaCostruzione===tipo?' attivo-strumento':''}" id="b-${tipo}"
      onclick="selezionaCostruzione('${tipo}')" ${!puoi?'disabled':''} title="${def.nome}: ${costo.oro} oro, ${costo.legno} legno" data-tip="${def.nome} — ${def.effetto||'Edificio della colonia'} · Costo: ${costo.oro} oro, ${costo.legno} legno">
      <span class="build-card-icon">${def.icona}</span>
      <span class="build-card-main"><b>${def.nome}</b><small>${n>0?`Costruiti: ${n}`:'Pronto da piazzare'}</small></span>
      <span class="build-card-cost">${costo.oro}o ${costo.legno}l</span>
    </button>`;
  }
  if(!entries.length && catAttiva!=='infrastrutture'){
    h+=`<div class="build-empty">Nessun edificio disponibile in questa categoria.</div>`;
  }
  h+=`</div></div>`;
  return h;
}

function renderCiurma(){
  let h=`<div class="titolo-sez">☠ Ciurma (${G.pirati.length})</div>`;
  // Capitani in cima
  const capitani=G.pirati.filter(p=>p.capitano);
  const ciurma=G.pirati.filter(p=>!p.capitano);
  if(capitani.length){
    h+=`<div style="font-size:.63rem;font-family:'Cinzel',serif;color:var(--oro);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;opacity:.8">Capitani</div>`;
    for(const p of capitani) h+=cartaPirata(p);
    h+=`<div style="font-size:.63rem;font-family:'Cinzel',serif;color:var(--sabbia);letter-spacing:1px;text-transform:uppercase;margin:6px 0 4px;opacity:.6">Ciurma</div>`;
  }
  for(const p of ciurma) h+=cartaPirata(p);
  h+=`<div style="display:flex;gap:4px;margin-top:4px">
    <button class="btn-costruisci" style="flex:1" onclick="reclutaPirata()" ${G.oro<50?'disabled':''}>
      <span>⚔ Recluta</span><span class="costo">50o</span></button>
    <button class="btn-costruisci" style="flex:1" onclick="apriCapitani()">
      <span>⭐ Capitani</span></button>
  </div>`;
  return h;
}

function cartaPirata(p){
  const mc=coloreUmore(p.umore);
  const nave=p.naveId!=null?G.navi.find(n=>n.id===p.naveId):null;
  const tratto=p.tratto;
  const lv=p.livello||1;
  return `<div class="carta-pirata${G.pirataSelezionato===p.id?' sel':''}"
    onclick="apriProfiloPirata('${p.id}')">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="nome-p">${p.icona||''}${p.capitano?'<span style="color:var(--oro)"> ★</span>':''} ${p.nome}</div>
        <div class="ruolo-p">${p.ruolo}${p.titolo?' · '+p.titolo:''}</div>
      </div>
      <div style="text-align:right;font-size:.6rem;color:var(--sabbia)">
        ${p.inRaid?'<div style="color:#6af">🌊 in raid</div>':(nave?`<div style="color:#6af">⛵${nave.nome.split(' ')[0]}</div>`:'<div style="color:#666">• a terra</div>')}
        <div style="color:var(--oro)">Lv${lv}</div>
      </div>
    </div>
    <div class="stat-p" style="margin-top:3px">
      <div class="sp">⚔<span>${statEffettiva(p,'combattimento')}</span></div>
      <div class="sp">⛵<span>${statEffettiva(p,'navigazione')}</span></div>
      <div class="sp">😊<span>${Math.floor(p.umore)}</span></div>
      ${tratto?`<div class="sp" style="color:var(--sabbia)">${tratto.icona||''}${tratto.label||''}</div>`:''}
      ${p.oggetto?`<div class="sp">${p.oggetto.icona}</div>`:''}
    </div>
    <div class="barra-umore"><div class="riempi-umore" style="width:${p.umore}%;background:${mc}"></div></div>
  </div>`;
}

// stat effettiva inclusi bonus tratto e oggetto
function statEffettiva(p, stat){
  let val=p[stat]||0;
  if(p.tratto&&p.tratto.bonus&&p.tratto.bonus[stat]) val+=p.tratto.bonus[stat];
  if(p.oggetto&&p.oggetto.bonus&&p.oggetto.bonus[stat]) val+=p.oggetto.bonus[stat];
  return Math.max(1,Math.min(100,Math.floor(val)));
}


// ═══════════════════════════════════════
// PATCH 8D — schede plancia più leggibili
// Sovrascrive il rendering ciurma con card compatte orizzontali.
// ═══════════════════════════════════════
function renderCiurma(){
  const capitani=G.pirati.filter(p=>p.capitano);
  const ciurma=G.pirati.filter(p=>!p.capitano);
  let h=`<div class="titolo-sez">☠ Ciurma (${G.pirati.length})</div>`;
  h+=`<div class="panel-grid">`;
  const renderCard=(p)=>{
    const nave=p.naveId!=null?G.navi.find(n=>n.id===p.naveId):null;
    const lv=p.livello||1;
    const mc=coloreUmore(p.umore);
    return `<div class="panel-card clickable${G.pirataSelezionato===p.id?' sel':''}" onclick="apriProfiloPirata('${p.id}')">
      <div class="panel-card-row">
        <div style="min-width:0">
          <div class="panel-card-title">${p.icona||'☠'} ${p.nome}${p.capitano?' ★':''}</div>
          <div class="panel-card-sub">${p.capitano?'Capitano · ':''}${p.ruolo}${p.titolo?' · '+p.titolo:''}</div>
        </div>
        <div style="text-align:right;font-size:.62rem;color:var(--oro);flex-shrink:0">Lv${lv}<br><span style="color:var(--sabbia)">${Math.floor(p.umore)}😊</span></div>
      </div>
      <div class="panel-stat-row">
        <span class="panel-chip">⚔ ${statEffettiva(p,'combattimento')}</span>
        <span class="panel-chip">⛵ ${statEffettiva(p,'navigazione')}</span>
        <span class="panel-chip">${p.inRaid?'🌊 Raid':(nave?'⛵ '+nave.nome.split(' ')[0]:'🏝 Terra')}</span>
      </div>
      <div class="barra-umore" style="margin-top:5px"><div class="riempi-umore" style="width:${p.umore}%;background:${mc}"></div></div>
    </div>`;
  };
  for(const p of capitani) h+=renderCard(p);
  for(const p of ciurma) h+=renderCard(p);
  h+=`</div>`;
  h+=`<div style="display:flex;gap:6px;margin-top:6px">
    <button class="btn-costruisci" style="flex:1" onclick="reclutaPirata()" ${G.oro<50?'disabled':''}><span>⚔ Recluta</span><span class="costo">50o</span></button>
    <button class="btn-costruisci" style="flex:1" onclick="apriCapitani()"><span>⭐ Capitani</span></button>
  </div>`;
  return h;
}
