// Isla del Diablo — ui/manage.js
// Estratto da 24_ui_manage.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_MANAGE
// ═══════════════════════════════════════
function apriGestioneNave(id){
  const n=G.navi.find(x=>x.id===id);
  if(!n) return;

  const danno=n.hpMax-n.hp;
  const costoRipar=Math.max(0,Math.floor(danno*1.2));
  const hpPct=Math.round(n.hp/n.hpMax*100);
  const usuraPct=Math.round(n.usura);
  const colHp=hpPct>60?'var(--verde-ch)':hpPct>30?'var(--oro)':'var(--rum-chiaro)';

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
  document.getElementById('r-oro').textContent=Math.floor(G.oro);
  document.getElementById('r-cibo').textContent=Math.floor(G.cibo);
  document.getElementById('r-legno').textContent=Math.floor(G.legno);
  document.getElementById('r-rum').textContent=Math.floor(G.rum);
  document.getElementById('r-ric').textContent=Math.floor(G.ricerca.punti);
  document.getElementById('r-pop').textContent=G.pirati.length;
  document.getElementById('num-giorno').textContent=G.giorno;
  document.getElementById('rep-reale').textContent=`👑 ${Math.floor(G.fazioni.reale.rep)}`;
  document.getElementById('rep-mercante').textContent=`🤝 ${Math.floor(G.fazioni.mercante.rep)}`;
  document.getElementById('rep-corsaro').textContent=`☠ ${Math.floor(G.fazioni.corsaro.rep)}`;
  renderPannello();
}
