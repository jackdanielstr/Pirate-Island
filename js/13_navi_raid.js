// ═══════════════════════════════════════
// MODULO: NAVI_RAID
// ═══════════════════════════════════════
// ── NAVI & PIANIFICAZIONE RAID ──
function creaNave(id, nome){
  const nomi=['Serpente di Ferro','Burrasca Nera','Scia del Diavolo','Orizzonte Insanguinato','Mietitore dei Mari','Crimson Dawn'];
  const n = nome || nomi[id % nomi.length];
  const hpBase = 80 + (G.ricerca.completate.has('armatura')?20:0);
  return {
    id, nome:n, tipo:'sciabecco',
    hp:hpBase, hpMax:hpBase,
    // upgrade livelli (0-3 ciascuno)
    livCannoni:0,   // +15% bottino raid per livello
    livVelocita:0,  // -1 giorno raid per livello (min 1)
    livStiva:0,     // +20% bottino cibo/risorse per livello
    inMare:false, timerRaid:0,
    usura:0,        // 0-100, aumenta in mare, riduce hpMax
  };
}

function costruisciNave(){
  if(G.oro<150||G.legno<80){aggMsg('Servono 150 oro e 80 legno.','male');return;}
  if(!G.edifici.find(b=>b.tipo==='cantiere')){aggMsg('Costruisci prima un Cantiere Navale!','male');return;}
  G.oro-=150; G.legno-=80;
  G.navi.push(creaNave(G.navi.length));
  notifica('⛵ Nave Costruita!','La flotta cresce.');
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// RAID & BATTAGLIA
// ═══════════════════════════════════════════════════
function inviaRaid(){
  if(G.navi.filter(n=>!n.inMare).length===0){aggMsg('Nessuna nave disponibile!','male');return;}
  if(G.cooldownRaid>0){aggMsg('Attendi ancora '+G.cooldownRaid+' giorni prima del prossimo raid.','male');return;}
  if(G.pirati.length<2){aggMsg('Servono almeno 2 pirati!','male');return;}
  if(G.battagliaAttiva){aggMsg('Una battaglia è già in corso!','male');return;}
  apriPianificazioneRaid();
}

// ═══════════════════════════════════════════════════
// PIANIFICAZIONE RAID — stile Tropico 2
// ═══════════════════════════════════════════════════

const BERSAGLI_RAID=[
  {id:'convoglio_mercante', nome:'Convoglio Mercantile', icona:'🚢',
   desc:'Tre navi cariche di spezie e seta. Scarsamente armate, ma la Marina le scorta.',
   difficolta:1, durataBase:2,
   bottino:{oro:[80,160], cibo:[30,80], rum:[10,30]},
   nemico:{nome:'Scorta Reale', hp:55, atk:8, difesa:2, icona:'⚓'},
   rep:{mercante:-20, reale:-8, corsaro:+8},
   evento_speciale:'Ogni round: 20% di catturare un prigioniero'},
  {id:'porto_coloniale', nome:'Porto Coloniale', icona:'🏛',
   desc:'Un ricco porto sotto bandiera reale. Difese moderate, bottino enorme.',
   difficolta:2, durataBase:3,
   bottino:{oro:[150,280], legno:[40,80]},
   nemico:{nome:'Guarnigione del Porto', hp:80, atk:14, difesa:4, icona:'🏰'},
   rep:{mercante:-10, reale:-25, corsaro:+15},
   evento_speciale:'Successo: ottieni un upgrade gratuito per la nave'},
  {id:'nave_corsara', nome:'Nave Corsara Rivale', icona:'🏴',
   desc:'Un corsaro solitario con una nave veloce e armata. Rischio alto, onore alto.',
   difficolta:3, durataBase:2,
   bottino:{oro:[100,200], rum:[20,50]},
   nemico:{nome:'Corsaro Rivale', hp:90, atk:18, difesa:6, icona:'💀'},
   rep:{corsaro:+25, reale:0, mercante:0},
   evento_speciale:'Vittoria: il nemico diventa un potenziale alleato'},
  {id:'galeone_reale', nome:'Galeone Reale', icona:'⚓',
   desc:'Il galeone ammiraglia della Corona. Pericolosissimo, bottino leggendario.',
   difficolta:4, durataBase:3,
   bottino:{oro:[300,500], cibo:[50,100]},
   nemico:{nome:'HMS Indefatigable', hp:130, atk:22, difesa:8, icona:'👑'},
   rep:{reale:-40, corsaro:+30, mercante:-5},
   evento_speciale:'Solo con 3+ navi in flotta. Successo: +50 rep Corsari bonus'},
  {id:'isola_tesoro', nome:'Isola del Tesoro Perduto', icona:'🏝',
   desc:'Leggende parlano di un tesoro nascosto. Pirati solitari presidiano l\'isola.',
   difficolta:2, durataBase:4,
   bottino:{oro:[200,350], ricerca:[20,40]},
   nemico:{nome:'Guardiani del Tesoro', hp:65, atk:12, difesa:3, icona:'☠'},
   rep:{corsaro:+5},
   evento_speciale:'Rischio tempesta: 30% di perdere un punto usura nave'},
];

const TATTICHE_RAID=[
  {id:'bordata', nome:'Bordata Completa', icona:'💣',
   desc:'Fuoco massimo. Alto danno, alto rischio.', bonus:{atk:+8, difesa:-3}, cost_rum:0},
  {id:'speronamento', nome:'Speronamento', icona:'⚓',
   desc:'Colpisci lo scafo nemico direttamente. Danno garantito ma danneggi anche te.', bonus:{atk:+12, selfDmg:8}, cost_rum:0},
  {id:'manovra_evasiva', nome:'Manovra Evasiva', icona:'💨',
   desc:'Riduci i danni subiti. Meno danno offensivo.', bonus:{atk:-4, difesa:+10}, cost_rum:0},
  {id:'incendio', nome:'Bombarde Incendiarie', icona:'🔥',
   desc:'Fuoco a ogni round successivo. Richiede rum.', bonus:{atk:+5, dot:6}, cost_rum:15},
  {id:'abbordaggio', nome:'Abbordaggio', icona:'🗡',
   desc:'Usa il combattimento dei pirati. Più efficace con ciurma forte.', bonus:{usesCrew:true}, cost_rum:0},
  {id:'diplomazia', nome:'Bandiera Falsa', icona:'🏳',
   desc:'Tenti di avvicinarti senza combattere. Può fallire clamorosamente.', bonus:{evasion:true}, cost_rum:0},
];

let statoPianificazione={nave:null, bersaglio:null, tattica:null, equipaggio:[]};

function apriPianificazioneRaid(){
  const naviDisponibili=G.navi.filter(n=>!n.inMare);
  statoPianificazione={nave:naviDisponibili[0]||null, bersaglio:null, tattica:null, equipaggio:[]};

  const html=`
  <div id="piano-raid" style="font-family:'IM Fell English',serif">

    <!-- STEP 1: Nave -->
    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.7;margin-bottom:6px">1 — Scegli la Nave</div>
      <div style="display:flex;flex-direction:column;gap:5px" id="piano-navi">
        ${naviDisponibili.map(n=>{
          const pct=Math.round(n.hp/n.hpMax*100);
          const col=pct>60?'var(--verde-ch)':pct>30?'var(--oro)':'var(--rum-chiaro)';
          return `<div class="piano-card${statoPianificazione.nave?.id===n.id?' sel':''}"
            onclick="selNaveRaid(${n.id})" id="pnave-${n.id}"
            style="background:rgba(255,255,255,.06);border:1px solid ${statoPianificazione.nave?.id===n.id?'var(--oro)':'var(--bordo)'};
            border-radius:6px;padding:8px 10px;cursor:pointer;transition:all .15s">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:.82rem;color:var(--pergamena)">⛵ ${n.nome}</span>
              <span style="font-size:.68rem;color:${col}">⚔${n.livCannoni||0}★ 🛡${pct}%</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- STEP 2: Bersaglio -->
    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.7;margin-bottom:6px">2 — Scegli il Bersaglio</div>
      <div style="display:flex;flex-direction:column;gap:5px" id="piano-bersagli">
        ${BERSAGLI_RAID.filter(b=>b.id!=='galeone_reale'||G.navi.length>=3).map(b=>{
          const diffCol=['','var(--verde-ch)','var(--oro)','#ff9900','var(--rum-chiaro)','#ff4444'];
          const stelle='⚔'.repeat(b.difficolta)+'·'.repeat(4-b.difficolta);
          return `<div onclick="selBersaglioRaid('${b.id}')" id="pb-${b.id}"
            style="background:rgba(255,255,255,.06);border:1px solid var(--bordo);
            border-radius:6px;padding:8px 10px;cursor:pointer;transition:all .15s">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
              <span style="font-size:.82rem;color:var(--pergamena)">${b.icona} ${b.nome}</span>
              <span style="font-size:.68rem;color:${diffCol[b.difficolta]}">${stelle}</span>
            </div>
            <div style="font-size:.68rem;color:var(--sabbia);font-style:italic;margin-bottom:3px">${b.desc}</div>
            <div style="font-size:.62rem;color:#888">${b.evento_speciale}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- STEP 3: Tattica -->
    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.7;margin-bottom:6px">3 — Tattica Iniziale</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px" id="piano-tattiche">
        ${TATTICHE_RAID.map(t=>`
          <div onclick="selTatticaRaid('${t.id}')" id="pt-${t.id}"
            style="background:rgba(255,255,255,.06);border:1px solid var(--bordo);
            border-radius:6px;padding:7px 9px;cursor:pointer;transition:all .15s">
            <div style="font-size:.8rem;color:var(--pergamena);margin-bottom:2px">${t.icona} ${t.nome}</div>
            <div style="font-size:.62rem;color:var(--sabbia);font-style:italic">${t.desc}</div>
            ${t.cost_rum>0?`<div style="font-size:.6rem;color:#6af;margin-top:2px">Costo: ${t.cost_rum} rum</div>`:''}
          </div>`).join('')}
      </div>
    </div>

    <!-- RIEPILOGO & LANCIA -->
    <div id="piano-riepilogo" style="background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);
      border-radius:6px;padding:10px;margin-bottom:12px;display:none">
      <div id="piano-riepilogo-testo" style="font-size:.75rem;color:var(--sabbia)"></div>
    </div>

    <button id="btn-lancia-raid" onclick="lanciaRaidTattico()" disabled
      style="width:100%;font-family:'Pirata One',cursive;font-size:1.1rem;
      background:linear-gradient(135deg,var(--oro-scuro),var(--oro));color:var(--inchiostro);
      border:none;padding:10px;border-radius:5px;cursor:pointer;opacity:.4;transition:all .2s">
      ⚔ Salpa!
    </button>
  </div>
  `;

  apriModale('⚔ Pianifica il Raid', html);
}

function selNaveRaid(id){
  statoPianificazione.nave=G.navi.find(n=>n.id===id)||null;
  document.querySelectorAll('[id^="pnave-"]').forEach(el=>{
    const nid=parseInt(el.id.replace('pnave-',''));
    el.style.borderColor=nid===id?'var(--oro)':'var(--bordo)';
    el.style.background=nid===id?'rgba(240,192,64,.1)':'rgba(255,255,255,.06)';
  });
  aggiornaPianoRiepilogo();
}

function selBersaglioRaid(id){
  statoPianificazione.bersaglio=BERSAGLI_RAID.find(b=>b.id===id)||null;
  document.querySelectorAll('[id^="pb-"]').forEach(el=>{
    const bid=el.id.replace('pb-','');
    el.style.borderColor=bid===id?'var(--oro)':'var(--bordo)';
    el.style.background=bid===id?'rgba(240,192,64,.1)':'rgba(255,255,255,.06)';
  });
  aggiornaPianoRiepilogo();
}

function selTatticaRaid(id){
  statoPianificazione.tattica=TATTICHE_RAID.find(t=>t.id===id)||null;
  document.querySelectorAll('[id^="pt-"]').forEach(el=>{
    const tid=el.id.replace('pt-','');
    el.style.borderColor=tid===id?'var(--oro)':'var(--bordo)';
    el.style.background=tid===id?'rgba(240,192,64,.1)':'rgba(255,255,255,.06)';
  });
  aggiornaPianoRiepilogo();
}

function aggiornaPianoRiepilogo(){
  const {nave, bersaglio, tattica}=statoPianificazione;
  const riep=document.getElementById('piano-riepilogo');
  const btn=document.getElementById('btn-lancia-raid');
  if(!riep||!btn) return;

  if(nave&&bersaglio&&tattica){
    // Calcola forza stimata
    const mediaCombo=G.pirati.reduce((a,p)=>a+p.combattimento,0)/Math.max(G.pirati.length,1);
    const forzaAtk=Math.floor(8+(mediaCombo*.12)+(nave.livCannoni||0)*4+(tattica.bonus.atk||0));
    const nemHp=bersaglio.nemico.hp;
    const nemAtk=bersaglio.nemico.atk-(nave.livVelocita||0)*2;
    const chVitt=Math.min(95,Math.max(15,Math.round(55+(forzaAtk-nemAtk)*2.5)));

    const repStr=Object.entries(bersaglio.rep).filter(([,v])=>v!==0)
      .map(([k,v])=>`${G.fazioni[k].nome} ${v>0?'+':''}${v}`).join(', ');

    riep.style.display='block';
    document.getElementById('piano-riepilogo-testo').innerHTML=`
      <div style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--oro);margin-bottom:5px">Riepilogo Missione</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:.7rem">
        <span>🎯 Bersaglio:</span><span style="color:var(--pergamena)">${bersaglio.icona} ${bersaglio.nome}</span>
        <span>⛵ Nave:</span><span style="color:var(--pergamena)">${nave.nome}</span>
        <span>⚔ Tattica:</span><span style="color:var(--pergamena)">${tattica.icona} ${tattica.nome}</span>
        <span>📊 Vitt. stimata:</span><span style="color:${chVitt>60?'var(--verde-ch)':chVitt>40?'var(--oro)':'var(--rum-chiaro)'}">${chVitt}%</span>
        <span>🌐 Rep.:</span><span style="color:var(--sabbia);font-size:.62rem">${repStr||'nessuna'}</span>
        <span>⏱ Durata:</span><span style="color:var(--sabbia)">${bersaglio.durataBase} giorni</span>
      </div>`;
    btn.disabled=false;
    btn.style.opacity='1';
  } else {
    riep.style.display='none';
    btn.disabled=true;
    btn.style.opacity='.4';
  }
}

function lanciaRaidTattico(){
  const {nave, bersaglio, tattica}=statoPianificazione;
  if(!nave||!bersaglio||!tattica) return;

  if(tattica.cost_rum>0&&G.rum<tattica.cost_rum){
    aggMsg(`Servono ${tattica.cost_rum} rum per questa tattica!`,'male'); return;
  }
  if(tattica.cost_rum>0) G.rum-=tattica.cost_rum;

  chiudiModale();
  avviaSequenzaRaid(nave, bersaglio, tattica);
}

// ═══════════════════════════════════════════════════
// SEQUENZA RAID CINEMATICA — stile Tropico 2
// ═══════════════════════════════════════════════════
