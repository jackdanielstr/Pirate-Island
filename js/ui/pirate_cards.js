// Isla del Diablo — ui/pirate_cards.js
// Estratto da 22_ui_pirate.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: UI_PIRATE
// ═══════════════════════════════════════
function apriProfiloPirata(id){
  const p=G.pirati.find(x=>String(x.id)===String(id));
  if(!p) return;
  G.pirataSelezionato=p.id;
  // Apri portrait HUD
  apriPortrait(p);
  // Apri anche modale profilo completo

  const nave=p.naveId!=null?G.navi.find(n=>n.id===p.naveId):null;
  const naviDisp=G.navi.filter(n=>!n.inMare);
  const cEff=statEffettiva(p,'combattimento');
  const nEff=statEffettiva(p,'navigazione');
  const xpNext=(p.livello||1)*100;

  let opzioniNave=`<option value="">• A terra</option>`;
  for(const n of naviDisp){
    opzioniNave+=`<option value="${n.id}" ${p.naveId===n.id?'selected':''}>${n.nome}</option>`;
  }

  let oggettiHtml=`<div style="font-size:.72rem;color:var(--sabbia);margin-bottom:6px">Oggetto equipaggiato:</div>`;
  if(p.oggetto){
    oggettiHtml+=`<div style="display:flex;justify-content:space-between;align-items:center;
      background:rgba(240,192,64,.1);border:1px solid var(--bordo);border-radius:5px;padding:7px 9px;margin-bottom:6px">
      <span>${p.oggetto.icona} ${p.oggetto.nome}</span>
      <button class="btn-piccolo" onclick="rimuoviOggetto('${p.id}');apriProfiloPirata('${p.id}')">Rimuovi</button>
    </div>`;
  } else {
    oggettiHtml+=`<div style="color:#555;font-size:.75rem;font-style:italic;margin-bottom:6px">Nessun oggetto</div>`;
    // mostra oggetti acquistabili
    oggettiHtml+=`<div style="font-size:.68rem;color:var(--sabbia);margin-bottom:4px">Acquista:</div>`;
    for(const og of OGGETTI){
      const puoi=G.oro>=og.costo;
      oggettiHtml+=`<button class="btn-costruisci" onclick="acquistaOggetto('${p.id}','${og.id}');apriProfiloPirata('${p.id}')"
        ${!puoi?'disabled':''} style="margin-bottom:3px">
        <span>${og.icona} ${og.nome}</span><span class="costo">${og.costo}o</span>
      </button>`;
    }
  }

  const html=`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:2.8rem">${p.icona||'☠'}</div>
      <div style="font-family:'Pirata One',cursive;font-size:1.3rem;color:var(--oro);margin-top:4px">
        ${p.nome} ${p.capitano?'★':''}
      </div>
      <div style="font-size:.72rem;color:var(--sabbia);font-style:italic">
        ${p.ruolo}${p.titolo?' · '+p.titolo:''}
      </div>
      ${p.abilita?`<div style="font-size:.7rem;color:#aaffaa;margin-top:4px;font-style:italic">${p.abilita}</div>`:''}
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">
      ${[['⚔','Combattimento',cEff],['⛵','Navigazione',nEff],['😊','Umore',Math.floor(p.umore)]].map(([ic,lb,v])=>`
        <div style="text-align:center;background:rgba(255,255,255,.05);border-radius:5px;padding:7px 4px">
          <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:var(--oro)">${v}</div>
          <div style="font-size:.6rem;color:var(--sabbia)">${ic} ${lb}</div>
        </div>`).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;font-size:.72rem;
      color:var(--sabbia);background:rgba(255,255,255,.04);border-radius:5px;padding:7px 10px;margin-bottom:12px">
      <span>Livello <strong style="color:var(--oro)">${p.livello||1}</strong></span>
      <span>XP: <strong style="color:var(--oro)">${p.xp||0}</strong>/${xpNext}</span>
      <span>Paga: <strong style="color:var(--oro)">${p.paga}💰/g</strong></span>
      ${p.tratto?`<span>${p.tratto.icona||''} ${p.tratto.label||''}</span>`:''}
    </div>

    <div style="margin-bottom:12px">
      <div style="font-size:.72rem;color:var(--sabbia);margin-bottom:5px">Assegna a nave:</div>
      <select onchange="assegnaNave('${p.id}',this.value)"
        style="width:100%;background:#0a1520;border:1px solid var(--bordo);
          color:var(--pergamena);padding:6px 8px;border-radius:5px;font-family:'IM Fell English',serif;font-size:.78rem">
        ${opzioniNave}
      </select>
    </div>

    <div style="margin-bottom:14px">${oggettiHtml}</div>

    ${!p.capitano?`<div style="display:flex;gap:6px">
      <button class="mbtn secondario" style="flex:1" onclick="promuoviPirata('${p.id}')">
        ⬆ Addestra (+10 xp, 30 oro)
      </button>
      <button class="mbtn pericolo" onclick="licenziaPirata('${p.id}')">
        ✕ Licenzia
      </button>
    </div>`:`<div style="font-size:.72rem;color:var(--sabbia);font-style:italic;text-align:center">
      I capitani famosi non possono essere licenziati.
    </div>`}
  `;
  apriModale(p.icona||'☠'+' '+p.nome, html);
}

function assegnaNave(pirataId, naveIdStr){
  const p=G.pirati.find(x=>String(x.id)===String(pirataId));
  if(!p) return;
  const naveId=naveIdStr===''?null:parseInt(naveIdStr);
  p.naveId=naveId;
  const nave=naveId!=null?G.navi.find(n=>n.id===naveId):null;
  aggMsg(nave?`${p.nome} imbarcato su ${nave.nome}.`:`${p.nome} torna a terra.`,'bene');
  aggiornaUI();
}

function acquistaOggetto(pirataId, oggettoId){
  const p=G.pirati.find(x=>String(x.id)===String(pirataId));
  const og=OGGETTI.find(o=>o.id===oggettoId);
  if(!p||!og) return;
  if(G.oro<og.costo){aggMsg('Oro insufficiente!','male');return;}
  if(p.oggetto){aggMsg('Rimuovi prima l\'oggetto attuale.','male');return;}
  G.oro-=og.costo;
  p.oggetto=og;
  aggMsg(`${p.nome} equipaggia ${og.nome}!`,'bene');
  aggiornaUI();
}

function rimuoviOggetto(pirataId){
  const p=G.pirati.find(x=>String(x.id)===String(pirataId));
  if(!p||!p.oggetto) return;
  aggMsg(`${p.nome}: ${p.oggetto.nome} rimosso.`);
  p.oggetto=null;
  aggiornaUI();
}

function promuoviPirata(pirataId){
  const p=G.pirati.find(x=>String(x.id)===String(pirataId));
  if(!p) return;
  if(G.oro<30){aggMsg('Servono 30 oro!','male');return;}
  G.oro-=30;
  p.xp=(p.xp||0)+10;
  const xpNext=(p.livello||1)*100;
  if(p.xp>=xpNext){
    p.xp-=xpNext;
    p.livello=(p.livello||1)+1;
    p.combattimento=Math.min(100,p.combattimento+5);
    p.navigazione=Math.min(100,p.navigazione+5);
    notifica('⬆ Livello!',p.nome+' sale al livello '+p.livello+'!');
  } else {
    aggMsg(p.nome+': +10 XP');
  }
  chiudiModale();
  aggiornaUI();
}

function licenziaPirata(pirataId){
  const p=G.pirati.find(x=>String(x.id)===String(pirataId));
  if(!p||p.capitano) return;
  if(!confirm('Licenziare '+p.nome+'? Non tornerà.')) return;
  G.pirati=G.pirati.filter(x=>String(x.id)!==String(pirataId));
  chiudiModale();
  aggMsg(p.nome+' ha lasciato l\'isola.','male');
  aggiornaUI();
}

function apriCapitani(){
  let html=`<p style="font-size:.8rem;color:var(--sabbia);margin-bottom:12px;font-style:italic">
    I capitani famosi sono eroi unici con abilità speciali. Possono essere reclutati una sola volta.</p>`;
  for(const cap of CAPITANI){
    const gia=cap.reclutato;
    const costoStr=Object.entries(cap.costo).map(([k,v])=>v+' '+k).join(', ');
    const puoi=!gia&&Object.entries(cap.costo).every(([k,v])=>(G[k]||0)>=v);
    html+=`<div style="background:rgba(255,255,255,.05);border:1px solid ${gia?'var(--verde-ch)':puoi?'var(--bordo)':'rgba(100,100,100,.3)'};
      border-radius:8px;padding:10px 12px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="font-size:2rem">${cap.icona}</span>
        <div>
          <div style="font-family:'Pirata One',cursive;color:${gia?'var(--verde-ch)':'var(--oro)'};font-size:1rem">
            ${cap.nome} ${gia?'✓ (in ciurma)':''}
          </div>
          <div style="font-size:.68rem;color:var(--sabbia);font-style:italic">${cap.titolo}</div>
        </div>
      </div>
      <div style="font-size:.75rem;color:var(--sabbia);margin-bottom:4px">${cap.desc}</div>
      <div style="font-size:.7rem;color:#aaffaa;margin-bottom:8px">⭐ ${cap.abilita}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.7rem;color:var(--oro)">Costo: ${costoStr}</span>
        <button class="btn-piccolo" onclick="reclutaCapitano('${cap.id}')"
          ${!puoi||gia?'disabled':''}>
          ${gia?'Reclutato':'Arruola'}
        </button>
      </div>
    </div>`;
  }
  apriModale('⭐ Capitani Famosi', html);
}
