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

function renderBisogni(){
  const B=G.bisogni;
  const defs=[
    {k:'divertimento', nome:'Divertimento', icona:'💋',
     edifici:['bordello','arena','cantastorie'],
     nota:'Bordello, Arena, Teatro'},
    {k:'spirito',      nome:'Spirito',      icona:'⛪',
     edifici:['cappella'],
     nota:'Cappella — riduce diserzione'},
    {k:'salute',       nome:'Salute',       icona:'🏥',
     edifici:['infermeria','bagni'],
     nota:'Infermeria, Bagni Pubblici'},
    {k:'sicurezza',    nome:'Sicurezza',    icona:'🗼',
     edifici:['guardia','fortezza'],
     nota:'Torre di Guardia, Fortezza'},
    {k:'lusso',        nome:'Lusso',        icona:'🧵',
     edifici:['sarto','mercatonero'],
     nota:'Sarto, Mercato Nero'},
  ];

  const soddMedia=Math.floor((B.divertimento+B.spirito+B.salute+B.sicurezza+B.lusso)/5);
  const soddColor=soddMedia>65?'var(--verde-ch)':soddMedia>35?'var(--oro)':'var(--rum-chiaro)';

  let h=`<div class="titolo-sez">❤ Bisogni della Ciurma</div>
  <div style="text-align:center;margin-bottom:10px;background:rgba(255,255,255,.05);
    border-radius:6px;padding:8px;border:1px solid var(--bordo)">
    <div style="font-family:'Cinzel',serif;font-size:1.5rem;color:${soddColor}">${soddMedia}</div>
    <div style="font-size:.65rem;color:var(--sabbia)">Soddisfazione Media</div>
    <div style="font-size:.62rem;color:${soddColor};margin-top:2px">${
      soddMedia>80?'🌟 Ciurma felicissima!':
      soddMedia>60?'😊 Ben contenti':
      soddMedia>40?'😐 Accettabile':
      soddMedia>20?'😠 Scontenti':
      '💀 Rivolta imminente!'
    }</div>
  </div>
  <div class="bisogni-grid">`;

  for(const d of defs){
    const val=Math.floor(B[d.k]);
    const col=val>65?'var(--verde-ch)':val>35?'var(--oro)':'var(--rum-chiaro)';
    const haEdificio=d.edifici.some(e=>G.edifici.find(b=>b.tipo===e));
    h+=`<div class="bisogno-riga" style="${val<25?'border-color:var(--rum-chiaro)':''}">
      <div class="bisogno-header">
        <span class="bisogno-nome">${d.icona} ${d.nome}</span>
        <span class="bisogno-val" style="color:${col}">${val}</span>
      </div>
      <div class="bisogno-barra">
        <div class="bisogno-riempi" style="width:${val}%;background:${col}"></div>
      </div>
      <div class="bisogno-nota">${haEdificio?'✓ '+d.nota:'⚠ '+d.nota+' — non costruito'}</div>
    </div>`;
  }
  h+=`</div>`;

  // effetti in corso
  h+=`<div style="font-size:.7rem;color:var(--sabbia);font-style:italic;margin-top:4px">
    Effetti morale: <span style="color:${soddMedia>50?'var(--verde-ch)':'var(--rum-chiaro)'}">
    ${soddMedia>50?'+':''} ${Math.floor((soddMedia-50)/10)} per pirata/tick</span>
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
