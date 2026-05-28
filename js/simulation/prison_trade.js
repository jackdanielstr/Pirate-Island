// Isla del Diablo — simulation/prison_trade.js
// Estratto da 15_prigione_commercio.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: PRIGIONE_COMMERCIO
// ═══════════════════════════════════════
// ── PRIGIONIERI, RICERCA, COMMERCIO, EDITTI ──
const SPECIALISTI_RAID=[
  {mestiere:'Cartografo', ruolo:'Navigatore', icona:'🧭', bonus:{combattimento:4,navigazione:22}, riscatto:260},
  {mestiere:'Mastro Cannoniere', ruolo:'Cannoniere', icona:'💣', bonus:{combattimento:24,navigazione:6}, riscatto:240},
  {mestiere:'Carpentiere Navale', ruolo:'Carpentiere', icona:'🪚', bonus:{combattimento:8,navigazione:16}, riscatto:220},
  {mestiere:'Medico di Bordo', ruolo:'Chirurgo', icona:'⚕', bonus:{combattimento:5,navigazione:14,umore:12}, riscatto:230},
];

function catturaSpecialistaRaid(){
  const prof=SPECIALISTI_RAID[Math.floor(Math.random()*SPECIALISTI_RAID.length)];
  const base=NOMI_PRIGIONIERI[Math.floor(Math.random()*NOMI_PRIGIONIERI.length)];
  const nome=prof.mestiere+' '+base.replace(/^(Ten\.|Cap\.|Gov\.|Amm\.|Sgt\.)\s*/,'');
  const riscatto=prof.riscatto+Math.floor(Math.random()*120);
  const prigioniero={
    id:nuovoIdPrigioniero(),
    nome,
    fazione:'Specialista',
    riscatto,
    giorni:0,
    specialista:true,
    mestiere:prof.mestiere,
    ruolo:prof.ruolo,
    icona:prof.icona,
    bonus:{...prof.bonus},
  };
  G.prigionieri.push(prigioniero);
  aggMsg(`${prof.icona} Specialista catturato: ${nome}!`,'bene');
  return prigioniero;
}

function catturaPrigioniero(fazione){
  const nome=NOMI_PRIGIONIERI[Math.floor(Math.random()*NOMI_PRIGIONIERI.length)];
  const riscatto=100+Math.floor(Math.random()*200);
  G.prigionieri.push({id:nuovoIdPrigioniero(),nome,fazione,riscatto,giorni:0});
  aggMsg(`⛓ Catturato: ${nome} (${fazione})!`,'info');
}
function riscattaPrigioniero(id){
  const p=G.prigionieri.find(x=>x.id===id);
  if(!p) return;
  if(!G.edifici.find(b=>b.tipo==='prigione')){aggMsg('Costruisci prima una Prigione!','male');return;}
  G.oro+=p.riscatto;
  rimuoviUnPrigioniero(id);
  G.contatori.riscatti++;
  if(p.fazione==='Marina Reale') G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+8);
  if(p.fazione==='Mercante') G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+10);
  aggMsg(`💰 Riscattato ${p.nome} per ${p.riscatto} oro!`,'bene');
  controllaMissione('riscatti',G.contatori.riscatti);
  aggiornaUI();
}
function reclutaPrigioniero(id){
  const p=G.prigionieri.find(x=>x.id===id);
  if(!p) return;
  rimuoviUnPrigioniero(id);
  if(p.specialista){
    const b=p.bonus||{};
    creaaPirata({
      nome:p.nome,
      ruolo:p.ruolo||p.mestiere||'Specialista',
      combattimento:Math.min(100,36+(b.combattimento||0)+Math.floor(Math.random()*18)),
      navigazione:Math.min(100,38+(b.navigazione||0)+Math.floor(Math.random()*18)),
      umore:Math.min(100,52+(b.umore||0)+Math.floor(Math.random()*18)),
      paga:6,
      tratto:{id:'specialista',label:p.mestiere||'Specialista',icona:p.icona||'★'},
    });
    aggMsg(`${p.icona||'★'} ${p.nome} ora serve la ciurma come ${p.mestiere}.`,'bene');
  } else {
    creaaPirata({nome:p.nome});
    aggMsg(`⚔ ${p.nome} si unisce alla ciurma!`,'bene');
  }
  aggiornaUI();
}
function apriPrigione(){
  const haPrigione=G.edifici.find(b=>b.tipo==='prigione');
  let html=`<p>I prigionieri catturati possono essere riscattati per oro o reclutati come pirati.</p>`;
  if(!haPrigione) html+=`<p style="color:#ffaaaa">⚠ Costruisci una Prigione per tenere i prigionieri!</p>`;
  if(G.prigionieri.length===0){html+=`<p>Nessun prigioniero al momento.</p>`;}
  else for(const p of G.prigionieri){
    const tag=p.specialista
      ? `<span style="display:inline-block;margin-left:5px;padding:1px 5px;border:1px solid rgba(240,192,64,.45);border-radius:4px;color:var(--oro);font-size:.62rem">${p.icona||'★'} ${p.mestiere}</span>`
      : '';
    html+=`<div style="background:rgba(139,26,26,.2);border:1px solid rgba(192,57,43,.4);border-radius:4px;padding:8px;margin:6px 0">
      <strong style="color:#ffbbbb">${p.nome}</strong> <span style="font-size:.75rem;color:var(--sabbia)">(${p.fazione})</span>${tag}<br>
      ${p.specialista?`<span style="font-size:.7rem;color:var(--sabbia)">Reclutato: ${p.ruolo} esperto per navi e raid.</span><br>`:''}
      <span style="font-size:.75rem">Riscatto: <span style="color:var(--oro)">${p.riscatto} oro</span></span><br>
      <button class="mbtn primario" onclick="riscattaPrigioniero(${p.id});chiudiModale()">💰 Riscatta</button>
      <button class="mbtn secondario" onclick="reclutaPrigioniero(${p.id});chiudiModale()">${p.specialista?'★ Recluta specialista':'⚔ Recluta'}</button>
    </div>`;
  }
  apriModale('⛓ Prigione',html);
}

// ── RICERCA ──
function puoRicercare(tech){return !G.ricerca.completate.has(tech.id)&&tech.req.every(r=>G.ricerca.completate.has(r));}
function faiRicerca(techId){
  const tech=TECH.find(t=>t.id===techId);
  if(!tech||!puoRicercare(tech)) return;
  if(G.ricerca.punti<tech.costo){aggMsg(`Servono ${tech.costo} punti ricerca!`,'male');return;}
  G.ricerca.punti-=tech.costo;
  G.ricerca.completate.add(techId);
  if(techId==='leggenda') for(const p of G.pirati) p.umore=Math.min(100,p.umore+15);
  notifica(`${tech.icona} ${tech.nome} Studiata!`,tech.desc);
  controllaMissione('ricerca',G.ricerca.completate.size);
  mostraTab('ricerca');aggiornaUI();
}

// ── COMMERCIO ──
function apriCommercio(){
  const haMercato=G.edifici.find(b=>b.tipo==='mercatonero');
  apriModale('🤝 Commercio',`
    <p>Una nave mercantile si ancora nelle vicinanze.</p>
    <p style="color:var(--oro);margin:8px 0">Prezzi correnti:</p>
    <p>• 10 Cibo → 15 Oro ${G.fazioni.mercante.rep>30?'<em style="color:#aaffaa">(+fidato)</em>':''}</p>
    <p>• 10 Legno → 12 Oro</p>
    <p>• 5 Rum → 22 Oro</p>
    ${haMercato?`<p style="color:#aaffaa;margin-top:6px">🛒 Mercato Nero: +20% prezzi attivo</p>`:''}
    <div style="margin-top:12px">
      <button class="mbtn primario" onclick="commercia('cibo')">Vendi Cibo (${Math.min(50,G.cibo)})</button>
      <button class="mbtn primario" onclick="commercia('legno')">Vendi Legno (${Math.min(50,G.legno)})</button>
      <button class="mbtn primario" onclick="commercia('rum')">Vendi Rum (${Math.min(25,G.rum)})</button>
    </div>
  `);
}
function commercia(risorsa){
  const quantita={cibo:Math.min(50,G.cibo),legno:Math.min(50,G.legno),rum:Math.min(25,G.rum)};
  let prezzi={cibo:1.5,legno:1.2,rum:4.4};
  if(G.edifici.find(b=>b.tipo==='mercatonero')) for(const k in prezzi) prezzi[k]*=1.2;
  if(G.fazioni.mercante.rep>30) for(const k in prezzi) prezzi[k]*=1.1;
  const q=quantita[risorsa];
  if(q<=0){aggMsg('Niente da vendere!','male');chiudiModale();return;}
  const oro=Math.floor(q*prezzi[risorsa]);
  G[risorsa]-=q; G.oro+=oro;
  G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+2);
  aggMsg(`Venduti ${q} ${risorsa} per ${oro} oro!`,'bene');
  chiudiModale();aggiornaUI();
}

// ── EDITTI ──
function apriEditti(){
  apriModale('📜 Editti del Capitano',`
    <p>La tua parola è legge sull'isola.</p>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
      <button class="mbtn primario" onclick="editto('banchetto')">🍖 Grande Banchetto — 60 cibo, morale +35</button>
      <button class="mbtn primario" onclick="editto('bonus')">💰 Paga Straordinaria — 120 oro, morale +25</button>
      <button class="mbtn primario" onclick="editto('leva')">⚔ Leva Forzata — Pirata gratis, morale -15</button>
      <button class="mbtn primario" onclick="editto('rum')">🍺 Razione di Rum — 30 rum, morale +20</button>
      <button class="mbtn pericolo" onclick="editto('chiglia')">💀 Carena — Morale -30, +disciplina</button>
    </div>
  `);
}
function editto(tipo){
  chiudiModale();
  if(tipo==='banchetto'){
    if(G.cibo<60){aggMsg('Cibo insufficiente!','male');return;}
    G.cibo-=60; for(const p of G.pirati) p.umore=Math.min(100,p.umore+35);
    notifica('🍖 Grande Banchetto!','La ciurma festeggia!');
  } else if(tipo==='bonus'){
    if(G.oro<120){aggMsg('Oro insufficiente!','male');return;}
    G.oro-=120; for(const p of G.pirati) p.umore=Math.min(100,p.umore+25);
    notifica('💰 Paga Distribuita!','Tre urrà per il Capitano!');
  } else if(tipo==='leva'){
    creaaPirata(); for(const p of G.pirati) p.umore=Math.max(5,p.umore-15);
    notifica('⚔ Leva Forzata!','Un nuovo pirata, piuttosto riluttante.');
  } else if(tipo==='rum'){
    if(G.rum<30){aggMsg('Rum insufficiente!','male');return;}
    G.rum-=30; for(const p of G.pirati) p.umore=Math.min(100,p.umore+20);
    notifica('🍺 Razione di Rum!','La ciurma beve con gioia!');
  } else if(tipo==='chiglia'){
    for(const p of G.pirati) p.umore=Math.max(5,p.umore-30);
    aggMsg('⚓ Un pirata è stato passato sotto la chiglia. Terrore silenzioso.','male');
  }
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// TICK — avanzamento tempo
// ═══════════════════════════════════════════════════
