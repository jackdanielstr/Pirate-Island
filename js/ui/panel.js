// Isla del Diablo — ui/panel.js
// Estratto da 21_ui_panel.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_PANEL
// ═══════════════════════════════════════
function mostraTab(tab){
  G.tabCorrente=tab;
  document.querySelectorAll('.ptab').forEach((b,i)=>{
    const tabs=['costruisci','ciurma','flotta','ricerca','fazioni','missioni'];
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

function renderCostruisci(){
  const sentieroCosto=2;
  const puoiSentiero=G.oro>=sentieroCosto;
  let h=`<div class="titolo-sez">🏗 Costruisci</div>`;
  // Sentiero — strumento speciale sopra agli edifici
  h+=`<button class="btn-costruisci${G.modalitaCostruzione==='sentiero'?' attivo-strumento':''}"
    id="b-sentiero" onclick="selezionaSentiero()" ${!puoiSentiero?'disabled':''} title="Trascina sulla mappa per disegnare sentieri">
    <span>🪨 Sentiero <small style="color:var(--sabbia);font-style:italic">trascina</small></span>
    <span class="costo">2o/tile</span>
  </button>`;
  h+=`<div style="border-top:1px solid var(--bordo);margin:6px 0 5px;opacity:.4"></div>`;
  for(const[tipo,def] of Object.entries(ED)){
    if(def.inizialeOnly) continue;
    const puoi=G.oro>=def.costo.oro&&G.legno>=def.costo.legno;
    const n=G.edifici.filter(b=>b.tipo===tipo).length;
    h+=`<button class="btn-costruisci${G.modalitaCostruzione===tipo?' attivo-strumento':''}" id="b-${tipo}"
      onclick="selezionaCostruzione('${tipo}')" ${!puoi?'disabled':''}>
      <span>${def.icona} ${def.nome}${n>0?` <small style="color:var(--verde-ch)">(${n})</small>`:''}</span>
      <span class="costo">${def.costo.oro}o ${def.costo.legno}l</span>
    </button>`;
  }
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
