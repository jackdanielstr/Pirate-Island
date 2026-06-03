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
  // Beta 3.2 — categorie più leggibili in stile Tropico 2.
  // Non cambia gli ID edifici: raggruppa solo le categorie UI.
  const cats=['roads','navy','production','pirates','captives','defense'];
  if(!window.UI_BUILD_CAT || !cats.includes(window.UI_BUILD_CAT)) window.UI_BUILD_CAT='roads';
  return window.UI_BUILD_CAT;
}

function categorieEdificiPerGruppo(cat){
  const map={
    roads:['infrastrutture'],
    navy:['nautica'],
    production:['risorse','produzione'],
    pirates:['intrattenimento','addestramento','accessori'],
    captives:['controllo'],
    defense:['difesa']
  };
  return map[cat] || ['infrastrutture'];
}

function testoFunzioneEdificio(def){
  const raw=(def.effetto||'Supports the pirate colony.').replace(/<[^>]+>/g,'').trim();
  if(!raw) return 'Supports the pirate colony.';
  return raw.length>72 ? raw.slice(0,69)+'…' : raw;
}


function buildSelectedInfo(catAttiva, entries){
  const current = G.modalitaCostruzione;
  if(current==='sentiero'){
    return {
      icon:'🪨',
      name:'Path',
      desc:'Pirates move along paths. Buildings must be placed beside them.',
      cost:'2 gold / tile',
      count:'Road network'
    };
  }
  const found = current && ED[current] ? current : (entries && entries.length ? entries[0][0] : null);
  if(found && ED[found]){
    const def=ED[found];
    const costo=def.costo||{oro:0,legno:0};
    const count=G.edifici.filter(b=>b.tipo===found).length;
    return {
      icon:def.icona||'🏚',
      name:def.nome||found,
      desc:testoFunzioneEdificio(def),
      cost:`${costo.oro||0} gold · ${costo.legno||0} lumber`,
      count:count>0?`${count} built`:'Not built yet'
    };
  }
  return {
    icon:'🏗',
    name:'Build',
    desc:'Choose a category, then choose a building to place beside a path.',
    cost:'',
    count:''
  };
}

function renderCostruisci(){
  const sentieroCosto=2;
  const puoiSentiero=G.oro>=sentieroCosto;
  const gruppi=[
    ['roads','🪨','Roads','Paths and basic access'],
    ['navy','⚓','Navy','Dock, ships and sea work'],
    ['production','⚒','Production','Food, lumber, rum and goods'],
    ['pirates','☠','Pirates','Housing, grog and entertainment'],
    ['captives','⛓','Captives','Prisoners and forced labor'],
    ['defense','💣','Defense','Towers, guns and forts'],
  ];
  const catAttiva=categoriaCostruzioneAttiva();
  const catsAttive=categorieEdificiPerGruppo(catAttiva);

  let h=`<div class="build-dock tropico2-build">`;
  h+=`<div class="build-dock-head">
    <div class="build-title">Build</div>
    <div class="build-hint">Tropico 2 style: choose a group, then place beside a path.</div>
  </div>`;

  h+=`<div class="build-cat-row tropico2-cat-row">`;
  for(const [cat,ico,label,desc] of gruppi){
    const count=Object.entries(ED).filter(([tipo,def])=>{
      const categoria=def.categoria||'produzione';
      return !def.inizialeOnly && def.buildable!==false && categorieEdificiPerGruppo(cat).includes(categoria);
    }).length + (cat==='roads'?1:0);
    const active=cat===catAttiva?' attiva':'';
    h+=`<button class="build-cat${active}" onclick="selezionaCategoriaCostruzione('${cat}')" ${count===0?'disabled':''} title="${desc}">
      <span class="build-cat-ico">${ico}</span><span class="build-cat-label">${label}</span>
    </button>`;
  }
  h+=`</div>`;

  const entries=Object.entries(ED).filter(([tipo,def])=>{
    const categoria=def.categoria||'produzione';
    return !def.inizialeOnly && def.buildable!==false && catsAttive.includes(categoria);
  });

  const info=buildSelectedInfo(catAttiva, entries);
  h+=`<div class="build-main-row">
    <div class="build-info-card">
      <div class="build-info-icon">${info.icon}</div>
      <div class="build-info-text">
        <b>${info.name}</b>
        <small>${info.desc}</small>
      </div>
      <div class="build-info-cost">
        <span>${info.cost}</span>
        <em>${info.count}</em>
      </div>
    </div>
    <div class="build-shelf tropico2-build-shelf">`;

  if(catAttiva==='roads'){
    h+=`<button class="build-card build-road${G.modalitaCostruzione==='sentiero'?' attivo-strumento':''}"
      id="b-sentiero" onclick="selezionaSentiero()" ${!puoiSentiero?'disabled':''}
      title="Path — Pirates move along paths. Buildings must be placed beside them."
      data-tip="Path — connects buildings, dock and palace. Pirates walk only here.">
      <span class="build-card-icon">🪨</span>
      <span class="build-card-main"><b>Path</b><small>Roads</small></span>
      <span class="build-card-cost">2g/tile</span>
      <span class="build-card-built">Draw</span>
    </button>`;
  }

  for(const [tipo,def] of entries){
    const costo=def.costo||{oro:0,legno:0};
    const puoi=G.oro>=costo.oro&&G.legno>=costo.legno;
    const n=G.edifici.filter(b=>b.tipo===tipo).length;
    const funzione=testoFunzioneEdificio(def);
    h+=`<button class="build-card btn-costruisci${G.modalitaCostruzione===tipo?' attivo-strumento':''}" id="b-${tipo}"
      onclick="selezionaCostruzione('${tipo}')" ${!puoi?'disabled':''}
      title="${def.nome}: ${costo.oro} oro, ${costo.legno} legno"
      data-tip="${def.nome} — ${funzione} · Cost: ${costo.oro} gold, ${costo.legno} lumber">
      <span class="build-card-icon">${def.icona}</span>
      <span class="build-card-main"><b>${def.nome}</b><small>${(def.categoria||'Building').replace(/_/g,' ')}</small></span>
      <span class="build-card-cost">${costo.oro}g ${costo.legno}l</span>
      <span class="build-card-built">${n>0?`x${n}`:'Ready'}</span>
    </button>`;
  }

  if(!entries.length && catAttiva!=='roads'){
    h+=`<div class="build-empty">No buildings available in this group.</div>`;
  }
  h+=`</div></div></div>`;
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
