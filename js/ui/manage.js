// Isla del Diablo — ui/manage.js
// Estratto da 24_ui_manage.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_MANAGE
// ═══════════════════════════════════════
function apriOfficinaNave(id){
  if(typeof window!=='undefined') window.__apriOfficinaNave=true;
  try{ apriGestioneNave(id); }
  finally{ if(typeof window!=='undefined') window.__apriOfficinaNave=false; }
}

function apriGestioneNave(id){
  if(typeof apriSchedaNavePorto==='function' && !(typeof window!=='undefined' && window.__apriOfficinaNave)){
    apriSchedaNavePorto(id,'flotta');
    return;
  }
  const n=G.navi.find(x=>x.id===id);
  if(!n) return;

  const danno=n.hpMax-n.hp;
  const costoRipar=Math.max(0,Math.floor(danno*1.2));
  const hpPct=Math.round(n.hp/n.hpMax*100);
  const usuraPct=Math.round(n.usura);
  const colHp=hpPct>60?'var(--verde-ch)':hpPct>30?'var(--oro)':'var(--rum-chiaro)';
  const cap=(typeof assicuraCapitanoNave==='function') ? assicuraCapitanoNave(n) : n.capitano;
  const xpNext=(typeof xpProssimoCapitano==='function') ? xpProssimoCapitano(cap) : ((cap?.livello||1)*90);
  const xpPct=cap ? Math.max(0,Math.min(100,((cap.esperienza||0)/Math.max(1,xpNext))*100)) : 0;

  // upgrade costs (scale with level)
  const costiUpg={
    cannoni:[80,140,220],
    velocita:[100,180,280],
    stiva:[70,130,200],
  };
  const nomiUpg={
    cannoni:['Cannoni Leggeri','Cannoni Medi','Cannoni Pesanti'],
    velocita:['Vele Rinforzate','Scafo Affusolato','Motore a Vento'],
    stiva:['Stiva Allargata','Doppia Stiva','Stiva Blindata'],
  };
  const effettiUpg={
    cannoni:['Bottino raid +15%','Bottino raid +30%','Bottino raid +50%'],
    velocita:['Raid -1 giorno','Raid -2 giorni','Raid -3 giorni'],
    stiva:['Risorse +20%','Risorse +40%','Prigionieri +1'],
  };

  function rigaUpgrade(tipo, icona){
    const lv=n['liv'+tipo.charAt(0).toUpperCase()+tipo.slice(1)];
    const maxLv=3;
    if(lv>=maxLv) return `
      <div class="upg-riga">
        <span class="upg-icona">${icona}</span>
        <div class="upg-info">
          <div class="upg-nome">${nomiUpg[tipo][maxLv-1]} <span style="color:var(--verde-ch)">★★★</span></div>
          <div class="upg-desc">Completamente potenziato</div>
        </div>
        <button class="btn-piccolo" disabled>MAX</button>
      </div>`;
    const costo=costiUpg[tipo][lv];
    const puoi=G.oro>=costo&&!n.inMare;
    const stelle='★'.repeat(lv)+'☆'.repeat(maxLv-lv);
    return `
      <div class="upg-riga">
        <span class="upg-icona">${icona}</span>
        <div class="upg-info">
          <div class="upg-nome">${lv>0?nomiUpg[tipo][lv-1]:'Nessun upgrade'} <span style="color:var(--oro);font-size:.7rem">${stelle}</span></div>
          <div class="upg-desc">Prossimo: ${effettiUpg[tipo][lv]}</div>
        </div>
        <button class="btn-piccolo${puoi?'':''}" onclick="upgradeNave(${id},'${tipo}')"
          ${!puoi?'disabled':''} style="white-space:nowrap">${costo}💰</button>
      </div>`;
  }

  const html=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:2.5rem;margin-bottom:4px">⛵</div>
      <div style="font-family:'Pirata One',cursive;font-size:1.2rem;color:var(--oro)">${n.nome}</div>
      <div style="font-size:.72rem;color:var(--sabbia);font-style:italic">${n.tipo} ${n.inMare?'· In mare':'· In porto'}</div>
    </div>

    ${cap?`
    <div style="background:rgba(120,70,25,.24);border:1px solid rgba(240,192,64,.35);border-radius:8px;padding:9px;margin-bottom:12px">
      <div style="font-family:'Cinzel',serif;color:var(--oro);font-size:.82rem;margin-bottom:5px">🎩 ${cap.titolo} ${cap.nome}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:.66rem;color:var(--sabbia)">
        <span class="panel-chip">Lv ${cap.livello}</span>
        <span class="panel-chip">🧭 ${cap.navigazione}</span>
        <span class="panel-chip">⚔ ${cap.combattimento}</span>
        <span class="panel-chip">🍻 ${cap.carisma}</span>
        <span class="panel-chip">Raid ${cap.raid||0}</span>
      </div>
      <div style="height:4px;background:#1a2a1a;border-radius:2px;margin-top:7px">
        <div style="height:100%;width:${xpPct}%;background:var(--oro);border-radius:2px"></div>
      </div>
      <div style="font-size:.62rem;color:rgba(245,221,160,.65);margin-top:4px">Esperienza capitano ${Math.floor(cap.esperienza||0)}/${xpNext}</div>
    </div>`:''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:rgba(255,255,255,.05);border-radius:6px;padding:8px;text-align:center">
        <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:${colHp}">${n.hp}/${n.hpMax}</div>
        <div style="font-size:.65rem;color:var(--sabbia)">Scafo</div>
        <div style="height:4px;background:#1a2a1a;border-radius:2px;margin-top:4px">
          <div style="height:100%;width:${hpPct}%;background:${colHp};border-radius:2px"></div></div>
      </div>
      <div style="background:rgba(255,255,255,.05);border-radius:6px;padding:8px;text-align:center">
        <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:${usuraPct>60?'var(--rum-chiaro)':'var(--sabbia)'}">${usuraPct}%</div>
        <div style="font-size:.65rem;color:var(--sabbia)">Usura</div>
        <div style="height:4px;background:#1a2a1a;border-radius:2px;margin-top:4px">
          <div style="height:100%;width:${usuraPct}%;background:${usuraPct>60?'var(--rum-chiaro)':'#666'};border-radius:2px"></div></div>
      </div>
    </div>

    ${danno>0&&!n.inMare?`
    <div style="margin-bottom:12px">
      <p style="font-size:.8rem;margin-bottom:6px">Lo scafo ha subito <strong style="color:var(--rum-chiaro)">${danno} danni</strong>. Costo riparazione completa:</p>
      <button class="mbtn primario" onclick="eseguiRiparazione(${id});chiudiModale()"
        ${G.oro<costoRipar?'disabled':''} style="width:100%">
        🔧 Ripara tutto — ${costoRipar} oro
      </button>
      ${costoRipar>30?`<button class="mbtn secondario" onclick="eseguiRiparazioneP(${id});chiudiModale()"
        ${G.oro<Math.floor(costoRipar*.4)?'disabled':''} style="margin-top:6px;width:100%">
        🔨 Riparazione parziale (+30hp) — ${Math.floor(costoRipar*.4)} oro
      </button>`:''}
    </div>`:''}

    ${usuraPct>40&&!n.inMare?`
    <div style="margin-bottom:12px">
      <p style="font-size:.8rem;color:var(--rum-chiaro);margin-bottom:6px">⚠ Usura elevata — riduce HP massimi</p>
      <button class="mbtn secondario" onclick="revisionaNave(${id});chiudiModale()"
        ${G.oro<120||G.legno<40?'disabled':''}>
        🛠 Revisione completa — 120 oro, 40 legno
      </button>
    </div>`:''}

    <p style="font-family:'Cinzel',serif;font-size:.7rem;letter-spacing:1px;
      color:var(--sabbia);text-transform:uppercase;margin-bottom:8px;opacity:.7">Potenziamenti</p>
    <div class="upg-lista">
      ${rigaUpgrade('cannoni','💣')}
      ${rigaUpgrade('velocita','💨')}
      ${rigaUpgrade('stiva','📦')}
    </div>

    ${n.inMare?'<p style="font-size:.75rem;color:var(--sabbia);font-style:italic;margin-top:10px;text-align:center">La nave deve essere in porto per riparazioni e upgrade.</p>':''}
  `;

  apriModale('⛵ Gestione Nave', html);
}

function eseguiRiparazione(id){
  const n=G.navi.find(x=>x.id===id);
  if(!n) return;
  const danno=n.hpMax-n.hp;
  const costo=Math.max(0,Math.floor(danno*1.2));
  if(G.oro<costo){aggMsg('Oro insufficiente!','male');return;}
  G.oro-=costo;
  n.hp=n.hpMax;
  aggMsg(`${n.nome}: scafo riparato al 100%!`,'bene');
  aggiornaUI();
}

function eseguiRiparazioneP(id){
  const n=G.navi.find(x=>x.id===id);
  if(!n) return;
  const danno=n.hpMax-n.hp;
  const costo=Math.floor(danno*1.2*.4);
  if(G.oro<costo){aggMsg('Oro insufficiente!','male');return;}
  G.oro-=costo;
  n.hp=Math.min(n.hpMax,n.hp+30);
  aggMsg(`${n.nome}: riparazione parziale.`,'bene');
  aggiornaUI();
}

function revisionaNave(id){
  const n=G.navi.find(x=>x.id===id);
  if(!n||G.oro<120||G.legno<40){aggMsg('Risorse insufficienti!','male');return;}
  G.oro-=120; G.legno-=40;
  n.usura=0;
  // ripristina hpMax ridotto dall'usura
  const base=80+(G.ricerca.completate.has('armatura')?20:0)+(n.livCannoni*5);
  n.hpMax=base;
  n.hp=Math.min(n.hp,n.hpMax);
  notifica('🛠 Revisione Completata!',`${n.nome} è come nuova.`);
  aggiornaUI();
}

function upgradeNave(id, tipo){
  const n=G.navi.find(x=>x.id===id);
  if(!n||n.inMare) return;
  const costiUpg={cannoni:[80,140,220],velocita:[100,180,280],stiva:[70,130,200]};
  const chiave='liv'+tipo.charAt(0).toUpperCase()+tipo.slice(1);
  const lv=n[chiave];
  if(lv>=3){aggMsg('Upgrade già al massimo!','male');return;}
  const costo=costiUpg[tipo][lv];
  if(G.oro<costo){aggMsg(`Servono ${costo} oro!`,'male');return;}
  G.oro-=costo;
  n[chiave]++;
  // applica effetto immediato
  if(tipo==='cannoni'){n.hpMax+=5;n.hp=Math.min(n.hp+5,n.hpMax);}
  const nomiUpg={cannoni:['Cannoni Leggeri','Cannoni Medi','Cannoni Pesanti'],velocita:['Vele Rinforzate','Scafo Affusolato','Motore a Vento'],stiva:['Stiva Allargata','Doppia Stiva','Stiva Blindata']};
  notifica('⬆ Upgrade Installato!',nomiUpg[tipo][n[chiave]-1]+' su '+n.nome);
  chiudiModale();
  aggiornaUI();
}

// ── UI SUPERIORE ──
function aggiornaUI(){
  const setRes=(id,val,soglia=25)=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.textContent=Math.floor(val);
    const box=el.closest('.res');
    if(box){
      box.classList.toggle('basso', val<soglia);
      box.classList.toggle('abbondante', val>=soglia*6);
    }
  };
  setRes('r-oro',G.oro,60);
  setRes('r-cibo',G.cibo,30);
  setRes('r-legno',G.legno,25);
  setRes('r-rum',G.rum,20);
  setRes('r-ric',G.ricerca.punti,5);
  setRes('r-pop',G.pirati.length,4);
  document.getElementById('num-giorno').textContent=G.giorno;
  document.getElementById('rep-reale').textContent=`👑 ${Math.floor(G.fazioni.reale.rep)}`;
  document.getElementById('rep-mercante').textContent=`🤝 ${Math.floor(G.fazioni.mercante.rep)}`;
  document.getElementById('rep-corsaro').textContent=`☠ ${Math.floor(G.fazioni.corsaro.rep)}`;
  aggiornaConsiglioUI();
  renderPannello();
}

function aggiornaConsiglioUI(){
  const el=document.getElementById('consiglio-ui');
  if(!el) return;
  let testo='🏴 Seleziona una categoria in basso o tocca un edificio per aprire la scheda.';
  let stato='normale';
  if(G.modalitaCostruzione==='sentiero'){
    testo='🪨 Trascina sulla mappa per disegnare sentieri. I pirati useranno solo questi percorsi.';
    stato='costruzione';
  }else if(G.modalitaCostruzione){
    const nome=ED[G.modalitaCostruzione]?.nome||'edificio';
    testo=`🏗 Piazzamento: ${nome}. Verde valido, arancione serve sentiero, rosso bloccato.`;
    stato='costruzione';
  }else if((G.cibo||0)<20){
    testo='🍖 Scorte di cibo basse: costruisci o assegna schiavi alle fattorie.';
    stato='avviso';
  }else if((G.legno||0)<15){
    testo='🪵 Legno basso: potenzia segheria o raid/commercio.';
    stato='avviso';
  }else if((G.pirati||[]).some(p=>p.umore<25)){
    testo='☠ Alcuni pirati sono scontenti: servono rum, svago o edifici di servizio.';
    stato='avviso';
  }
  el.textContent=testo;
  el.className=stato;
}
