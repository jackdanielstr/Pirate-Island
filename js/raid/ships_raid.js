// Isla del Diablo — raid/ships_raid.js
// Estratto da 13_navi_raid.js nella modularizzazione v20.18.

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
    capienza:6,       // Tropico 2 style: ogni nave porta una ciurma limitata
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
  apriPortoPirata();
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

const POTENZE_CARAIBI={
  spagna:{id:'spagna',nome:'Corona Spagnola',icona:'👑',colore:'#b93722',repKey:'reale',allerta:+1.1,bottino:{oro:1.15,rum:.85,cibo:.9},nota:'Porti ricchi, guarnigioni severe.'},
  inghilterra:{id:'inghilterra',nome:'Marina Inglese',icona:'⚓',colore:'#244f9e',repKey:'reale',allerta:+1.0,bottino:{oro:1.0,legno:1.15,cibo:1.0},nota:'Rotte militari e navi robuste.'},
  francia:{id:'francia',nome:'Colonie Francesi',icona:'⚜',colore:'#5b67c8',repKey:'reale',allerta:+.9,bottino:{oro:.95,rum:1.2,cibo:1.05},nota:'Porti vivaci, scorte di rum e viveri.'},
  olanda:{id:'olanda',nome:'Compagnia Olandese',icona:'🟧',colore:'#c46a1f',repKey:'mercante',allerta:+.8,bottino:{oro:1.05,legno:1.05,ricerca:1.1},nota:'Mercanti ben organizzati, mappe e merci.'},
  mercanti:{id:'mercanti',nome:'Leghe Mercantili',icona:'🤝',colore:'#b8860b',repKey:'mercante',allerta:+.55,bottino:{oro:1.0,rum:1.1,cibo:1.05},nota:'Bottino regolare, scorte leggere.'},
  corsari:{id:'corsari',nome:'Corsari Rivali',icona:'☠',colore:'#5f4b8b',repKey:'corsaro',allerta:+.65,bottino:{oro:.95,rum:1.15},nota:'Rivali sporchi, ma pieni di informazioni.'},
  selvaggia:{id:'selvaggia',nome:'Acque Libere',icona:'🧭',colore:'#4b8b7a',repKey:null,allerta:0,bottino:{ricerca:1.25,oro:.9},nota:'Misteri, rovine e brutte sorprese.'},
};

// ═══════════════════════════════════════════════════
// PIANIFICAZIONE RAID — modello Tropico 2
// Flusso: scegli nave → scegli missione → scegli territorio sulla mappa.
// La tattica non è più una scelta separata: deriva dalla missione.
// ═══════════════════════════════════════════════════

const MISSIONI_RAID=[
  {id:'saccheggio', nome:'Saccheggio', icona:'🔥',
   desc:'Assalta un porto o una città costiera. Bottino alto, reputazione reale peggiora.',
   tatticaId:'bordata', mod:{oro:1.18, legno:1.0, cibo:.85, rum:.9, prigionieri:1}},
  {id:'caccia_mercantile', nome:'Caccia Mercantile', icona:'🚢',
   desc:'Intercetta convogli e mercanti. Meno rischioso, ottimo per oro e rum.',
   tatticaId:'diplomazia', mod:{oro:1.0, cibo:1.1, rum:1.25, prigionieri:0}},
  {id:'cattura_prigionieri', nome:'Cattura Prigionieri', icona:'⛓',
   desc:'Raid mirato per prendere ostaggi e futura forza lavoro. Bottino minore, più prigionieri.',
   tatticaId:'abbordaggio', mod:{oro:.75, cibo:.85, legno:.75, rum:.75, prigionieri:2}},
  {id:'tesoro', nome:'Caccia al Tesoro', icona:'🏝',
   desc:'Segui mappe e leggende. Durata lunga, rischio variabile, ricerca e oro.',
   tatticaId:'manovra_evasiva', mod:{oro:1.25, ricerca:1.6, prigionieri:0}},
];

MISSIONI_RAID.splice(0, MISSIONI_RAID.length,
  {id:'crociera', nome:'Crociera', icona:'⛵',
   desc:'Pattuglia una rotta e intercetta mercanti. Poco controllo, bottino regolare.',
   tatticaId:'diplomazia', mod:{oro:1.0, cibo:1.0, rum:1.25, prigionieri:0},
   prep:{cibo:1.0, rum:.6, razioni:0, armi:0}, tag:'Rotta'},
  {id:'raid_insediamento', nome:'Raid Insediamento', icona:'🔥',
   desc:'Assalta un porto o una colonia costiera. Molto bottino, molta ostilita reale.',
   tatticaId:'bordata', mod:{oro:1.2, legno:1.1, cibo:.9, rum:.85, prigionieri:1},
   prep:{cibo:1.4, rum:.8, razioni:0, armi:1}, tag:'Assalto'},
  {id:'rapimento_specialisti', nome:'Rapimento Specialisti', icona:'⛓',
   desc:'Cattura artigiani, marinai e ufficiali utili alla cala. Bottino ridotto, prigionieri migliori.',
   tatticaId:'abbordaggio', mod:{oro:.7, cibo:.8, legno:.75, rum:.75, prigionieri:2},
   prep:{cibo:1.2, rum:.7, razioni:0, armi:1}, specialisti:1, tag:'Cattura'},
  {id:'esplorazione', nome:'Esplorazione', icona:'🧭',
   desc:'Cerca nuove rotte e bersagli sulle carte nautiche. Rischio basso, ricompensa strategica.',
   tatticaId:'manovra_evasiva', mod:{oro:.65, ricerca:1.8, prigionieri:0},
   prep:{cibo:1.5, rum:.25, razioni:1, armi:0}, esplora:true, tag:'Scoperta'},
  {id:'falsa_bandiera', nome:'Falsa Bandiera', icona:'🏳',
   desc:'Colpisci sotto insegne altrui per fomentare guerra e confusione tra potenze.',
   tatticaId:'diplomazia', mod:{oro:.85, cibo:.8, rum:1.0, prigionieri:0},
   prep:{cibo:1.0, rum:1.1, razioni:0, armi:0}, falsaBandiera:true, tag:'Intrigo'}
);

const TERRITORI_RAID=[
  {id:'rotta_nord', nome:'Rotta del Nord', icona:'🧭', x:18, y:26,
   tipo:'convoglio_mercante', potenza:'mercanti', merci:['oro','rum','cibo'], pattuglia:1,
   pericolo:1, durata:+0, rep:{mercante:-10,reale:-4,corsaro:+4},
   nota:'Convogli piccoli, buoni per iniziare.'},
  {id:'baia_zucchero', nome:'Baia dello Zucchero', icona:'🌴', x:38, y:48,
   tipo:'porto_coloniale', potenza:'spagna', merci:['cibo','rum','prigionieri'], pattuglia:2,
   pericolo:2, durata:+1, rep:{mercante:-8,reale:-14,corsaro:+8},
   nota:'Piantagioni, viveri e molti prigionieri.'},
  {id:'canale_olandese', nome:'Canale Olandese', icona:'🟧', x:31, y:67,
   tipo:'convoglio_mercante', potenza:'olanda', merci:['oro','legno','mappe'], pattuglia:2,
   pericolo:2, durata:+1, rep:{mercante:-18,reale:-6,corsaro:+8},
   nota:'Navi della Compagnia cariche di mappe, tavole e merci.'},
  {id:'porto_oro', nome:'Puerto del Oro', icona:'🏛', x:62, y:35,
   tipo:'porto_coloniale', potenza:'spagna', merci:['oro','prigionieri','armi'], pattuglia:3,
   pericolo:3, durata:+1, rep:{mercante:-12,reale:-24,corsaro:+14},
   nota:'Porto ricco con guarnigione seria.'},
  {id:'martinica', nome:'Martinica Francese', icona:'⚜', x:68, y:73,
   tipo:'porto_coloniale', potenza:'francia', merci:['rum','cibo','specialisti'], pattuglia:2,
   pericolo:3, durata:+2, rep:{mercante:-10,reale:-18,corsaro:+12},
   nota:'Colonia francese piena di rum, ufficiali e artigiani.'},
  {id:'passo_inglese', nome:'Passo Inglese', icona:'⚓', x:80, y:46,
   tipo:'convoglio_mercante', potenza:'inghilterra', merci:['legno','cannoni','oro'], pattuglia:3,
   pericolo:3, durata:+1, rep:{mercante:-8,reale:-22,corsaro:+12},
   nota:'Rotta navale controllata da fregate inglesi.'},
  {id:'costa_nebbia', nome:'Costa della Nebbia', icona:'🌫', x:78, y:62,
   tipo:'nave_corsara', potenza:'corsari', merci:['rum','mappe','onore'], pattuglia:2,
   pericolo:3, durata:+0, rep:{corsaro:+18,reale:0,mercante:0},
   nota:'Corsari rivali e rotte nascoste.'},
  {id:'isola_ossa', nome:'Isola delle Ossa', icona:'💀', x:46, y:76,
   tipo:'isola_tesoro', potenza:'selvaggia', merci:['ricerca','tesoro'], pattuglia:0,
   pericolo:2, durata:+2, rep:{corsaro:+5},
   nota:'Mappe antiche e brutte sorprese.'},
  {id:'galeone_corona', nome:'Rotta del Galeone Reale', icona:'👑', x:86, y:22,
   tipo:'galeone_reale', potenza:'spagna', merci:['oro','cibo','gloria'], pattuglia:4,
   pericolo:4, durata:+1, req:()=>G.navi.length>=3,
   rep:{reale:-45,corsaro:+25,mercante:-5},
   nota:'Serve una flotta degna. Ricompensa leggendaria.'},
];

let statoPianificazione={nave:null, missione:null, territorio:null};

function assicuraRaidTropico2(){
  if(!G.raid) G.raid={};
  if(!Array.isArray(G.raid.scoperti)) G.raid.scoperti=['rotta_nord','baia_zucchero','isola_ossa'];
  if(!Array.isArray(G.raid.storia)) G.raid.storia=[];
  if(!G.raid.allerta) G.raid.allerta={};
  for(const id of Object.keys(POTENZE_CARAIBI)){
    if(!isFinite(G.raid.allerta[id])) G.raid.allerta[id]=id==='spagna'?8:id==='mercanti'?2:0;
  }
}
function potenzaRaid(id){ return POTENZE_CARAIBI[id]||POTENZE_CARAIBI.selvaggia; }
function potenzaTerritorioRaid(t){ return potenzaRaid(t?.potenza||'selvaggia'); }
function allertaPotenzaRaid(id){
  assicuraRaidTropico2();
  return Math.max(0,Math.min(100,Math.floor(G.raid.allerta[id]||0)));
}
function modificaAllertaRaid(id, delta){
  assicuraRaidTropico2();
  if(!id || !POTENZE_CARAIBI[id]) return 0;
  G.raid.allerta[id]=Math.max(0,Math.min(100,Math.floor((G.raid.allerta[id]||0)+delta)));
  return G.raid.allerta[id];
}
function pattugliaTerritorioRaid(t){
  if(!t) return 0;
  const pot=potenzaTerritorioRaid(t);
  const allerta=allertaPotenzaRaid(pot.id);
  return Math.max(0,Math.min(6,Math.floor((t.pattuglia||0)+(allerta/25)*(pot.allerta||1))));
}
function testoPattugliaRaid(t){
  const p=pattugliaTerritorioRaid(t);
  return p<=0?'nessuna':'⚓'.repeat(Math.max(1,p));
}
function merciTerritorioRaid(t){
  return (t?.merci||[]).map(x=>({
    oro:'oro', rum:'rum', cibo:'cibo', legno:'legno', prigionieri:'prigionieri',
    specialisti:'specialisti', armi:'armi', cannoni:'cannoni', mappe:'mappe',
    ricerca:'ricerca', tesoro:'tesoro', gloria:'gloria', onore:'onore'
  }[x]||x)).join(', ');
}
function intelTerritorioRaid(t, scoperto=territorioScoperto(t?.id)){
  if(!t) return '';
  if(!scoperto) return 'Potenza ignota · pattuglie ignote · merci sconosciute';
  const pot=potenzaTerritorioRaid(t);
  return `${pot.icona} ${pot.nome} · Pattuglie ${testoPattugliaRaid(t)} · Merci: ${merciTerritorioRaid(t)||'varie'}`;
}
function atlanteRaidHtml(){
  assicuraRaidTropico2();
  const visibili=raidTerritoriDisponibili();
  const scoperti=visibili.filter(t=>territorioScoperto(t.id)).length;
  const chips=Object.values(POTENZE_CARAIBI)
    .filter(p=>p.id!=='selvaggia')
    .map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 6px;border:1px solid ${p.colore};border-radius:5px;background:rgba(255,255,255,.16);font-size:.62rem;color:var(--sabbia)">
      ${p.icona} ${p.nome.split(' ')[0]} <b style="color:var(--oro)">${allertaPotenzaRaid(p.id)}</b>
    </span>`).join('');
  return `<div style="margin:-4px 0 14px;padding:8px 10px;border:1px solid rgba(90,50,20,.28);border-radius:7px;background:rgba(255,248,218,.32)">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px">
      <b style="font-family:'Cinzel',serif;color:var(--oro);font-size:.72rem">Atlante dei Caraibi</b>
      <span style="font-size:.62rem;color:var(--sabbia)">Rotte ${scoperti}/${visibili.length}</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div>
  </div>`;
}
function territorioScoperto(id){
  assicuraRaidTropico2();
  return G.raid.scoperti.includes(id);
}
function scopriTerritorioRaid(id){
  assicuraRaidTropico2();
  if(!id || G.raid.scoperti.includes(id)) return false;
  G.raid.scoperti.push(id);
  const t=TERRITORI_RAID.find(x=>x.id===id);
  if(t) notifica('🧭 Nuova rotta scoperta!', t.icona+' '+t.nome+' ora appare sulle carte.');
  return true;
}
function missionePianificata(){
  return statoPianificazione.missione || MISSIONI_RAID[0];
}
function territorioSelezionabileRaid(t){
  if(!t) return false;
  const m=missionePianificata();
  return territorioScoperto(t.id) || m.id==='esplorazione';
}
function capitanoNaveRaid(nave){
  if(!nave) return null;
  return G.pirati.find(p=>p.naveId===nave.id && p.capitano && !p.inRaid) || null;
}
function durataStimataRaid(nave, missione, territorio){
  const base=baseBersaglioDaTerritorio(territorio);
  return Math.max(1,(base.durataBase||2)+(territorio?.durata||0)+(missione?.id==='esplorazione'?1:0)-(nave?.livVelocita||0));
}
function costoPreparazioneRaid(nave, missione, territorio, crew){
  const m=missione||MISSIONI_RAID[0], t=territorio||TERRITORI_RAID[0];
  const c=crew&&crew.length?crew:[];
  const prep=m.prep||{};
  const durata=durataStimataRaid(nave,m,t);
  const pericolo=Math.max(t.pericolo||1,pattugliaTerritorioRaid(t)||0);
  return {
    cibo:Math.max(4,Math.ceil(c.length*(prep.cibo||1)+durata*2)),
    rum:Math.max(0,Math.ceil(c.length*(prep.rum||0)+pericolo*.8)),
    razioni:Math.max(0,Math.ceil((prep.razioni||0)*durata)),
    armi:Math.max(0,Math.ceil((prep.armi||0)*Math.max(1,pericolo-1))),
  };
}
function risorsePreparazioneRaid(costo){
  const razioni=G.scorte?.razioni||0;
  const mancantiRazioni=Math.max(0,(costo.razioni||0)-razioni);
  return {
    cibo:(G.cibo||0)>=(costo.cibo||0)+mancantiRazioni*5,
    rum:(G.rum||0)>=(costo.rum||0),
    armi:(G.scorte?.armi||0)>=(costo.armi||0),
    ok:((G.cibo||0)>=(costo.cibo||0)+mancantiRazioni*5) && ((G.rum||0)>=(costo.rum||0)) && ((G.scorte?.armi||0)>=(costo.armi||0)),
    extraCibo:mancantiRazioni*5,
  };
}
function consumaPreparazioneRaid(costo){
  const stato=risorsePreparazioneRaid(costo);
  if(!stato.ok) return false;
  G.cibo=Math.max(0,G.cibo-(costo.cibo||0)-stato.extraCibo);
  G.rum=Math.max(0,G.rum-(costo.rum||0));
  if(G.scorte){
    const raz=Math.min(G.scorte.razioni||0,costo.razioni||0);
    G.scorte.razioni=Math.max(0,(G.scorte.razioni||0)-raz);
    G.scorte.armi=Math.max(0,(G.scorte.armi||0)-(costo.armi||0));
  }
  return true;
}
function testoCostoPreparazione(costo){
  const parti=[`🍖 ${costo.cibo}`];
  if(costo.rum>0) parti.push(`🍺 ${costo.rum}`);
  if(costo.razioni>0) parti.push(`🥫 ${costo.razioni}`);
  if(costo.armi>0) parti.push(`⚔ ${costo.armi}`);
  return parti.join(' · ');
}
function territorioButtonRaid(t){
  const scoperto=territorioScoperto(t.id);
  const sel=statoPianificazione.territorio?.id===t.id;
  const abilitato=territorioSelezionabileRaid(t);
  const pot=potenzaTerritorioRaid(t);
  return `<button type="button" onclick="selTerritorioRaid('${t.id}')" id="ptx-${t.id}"
    title="${scoperto?t.nome+' · '+pot.nome:'Acque sconosciute'}"
    style="position:absolute;left:${t.x}%;top:${t.y}%;transform:translate(-50%,-50%)${sel?' scale(1.16)':''};min-width:44px;min-height:38px;border-radius:999px;
    border:2px solid ${sel?'var(--oro)':scoperto?pot.colore:abilitato?'var(--bordo)':'rgba(120,120,120,.35)'};background:${sel?'rgba(240,192,64,.28)':abilitato?'rgba(0,0,0,.55)':'rgba(0,0,0,.35)'};
    color:${abilitato?'var(--pergamena)':'#777'};font-size:1.2rem;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.45)">
    ${scoperto?t.icona:'?'}
  </button>`;
}
function aggiornaMappaTerritoriRaid(){
  for(const t of TERRITORI_RAID){
    const el=document.getElementById('ptx-'+t.id);
    if(!el) continue;
    const scoperto=territorioScoperto(t.id);
    const sel=statoPianificazione.territorio?.id===t.id;
    const abilitato=territorioSelezionabileRaid(t);
    const pot=potenzaTerritorioRaid(t);
    el.textContent=scoperto?t.icona:'?';
    el.title=scoperto?t.nome+' · '+pot.nome:'Acque sconosciute';
    el.style.borderColor=sel?'var(--oro)':scoperto?pot.colore:abilitato?'var(--bordo)':'rgba(120,120,120,.35)';
    el.style.background=sel?'rgba(240,192,64,.28)':abilitato?'rgba(0,0,0,.55)':'rgba(0,0,0,.35)';
    el.style.color=abilitato?'var(--pergamena)':'#777';
    el.style.transform=sel?'translate(-50%,-50%) scale(1.16)':'translate(-50%,-50%)';
  }
}
function storicoRaidHtml(){
  assicuraRaidTropico2();
  const righe=(G.raid.storia||[]).slice(0,3);
  if(!righe.length) return '';
  return `<div style="margin:-4px 0 14px;padding:8px 10px;border:1px solid rgba(240,192,64,.18);border-radius:6px;background:rgba(0,0,0,.18)">
    <div style="font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:1px;text-transform:uppercase;color:var(--oro);margin-bottom:5px">Ultime spedizioni</div>
    ${righe.map(r=>`<div style="display:flex;justify-content:space-between;gap:8px;font-size:.62rem;color:var(--sabbia);margin-top:3px">
      <span>${r.vinto?'✓':'×'} G${r.giorno} · ${r.missione}${r.potenza?' · '+r.potenza:''}</span>
      <span style="color:${r.scoperta?'var(--oro)':'var(--pergamena)'}">${r.scoperta?'Nuova rotta: '+r.scoperta:r.territorio}</span>
    </div>`).join('')}
  </div>`;
}

function raidTerritoriDisponibili(){
  assicuraRaidTropico2();
  return TERRITORI_RAID.filter(t=>!t.req || t.req());
}
function missioneRaidById(id){ return MISSIONI_RAID.find(m=>m.id===id)||MISSIONI_RAID[0]; }
function territorioRaidById(id){ return TERRITORI_RAID.find(t=>t.id===id)||TERRITORI_RAID[0]; }
function tatticaDaMissione(missione){
  return TATTICHE_RAID.find(t=>t.id===(missione?.tatticaId||'bordata')) || TATTICHE_RAID[0];
}
function baseBersaglioDaTerritorio(territorio){
  return BERSAGLI_RAID.find(b=>b.id===territorio.tipo) || BERSAGLI_RAID[0];
}
function modificaRange(range, mult){
  if(!range) return null;
  return [Math.max(0,Math.floor(range[0]*mult)), Math.max(1,Math.floor(range[1]*mult))];
}
function sommaRep(a,b){
  const out={...(a||{})};
  for(const [k,v] of Object.entries(b||{})) out[k]=(out[k]||0)+v;
  return out;
}
function creaBersaglioDaPiano(){
  const missione=statoPianificazione.missione;
  const territorio=statoPianificazione.territorio;
  if(!missione||!territorio) return null;
  assicuraRaidTropico2();
  const giaScoperto=territorioScoperto(territorio.id);
  const pot=potenzaTerritorioRaid(territorio);
  const pattuglia=pattugliaTerritorioRaid(territorio);
  const allerta=allertaPotenzaRaid(pot.id);
  const base=baseBersaglioDaTerritorio(territorio);
  const mod=missione.mod||{};
  const pericoloBase=territorio.pericolo||base.difficolta||1;
  const pericolo=Math.max(1,Math.min(5,pericoloBase+Math.floor(pattuglia/3)));
  const bottino={};
  for(const [k,r] of Object.entries(base.bottino||{})){
    const potMult=pot.bottino?.[k]||1;
    const terrMult=territorio.bottinoMod?.[k]||1;
    bottino[k]=modificaRange(r, (mod[k]||1)*potMult*terrMult);
  }
  if(missione.id==='tesoro' && !bottino.ricerca) bottino.ricerca=[18,40];
  const nemico={...(base.nemico||{})};
  const allertaMod=1+Math.min(.35,allerta/260);
  nemico.hp=Math.floor((nemico.hp||60)*(0.86+pericolo*.12)*allertaMod);
  nemico.atk=Math.floor((nemico.atk||8)*(0.85+pericolo*.1)*(1+Math.min(.25,allerta/300)));
  nemico.difesa=Math.floor((nemico.difesa||2)+(pericolo-1));
  let rep=sommaRep(base.rep, territorio.rep);
  if(missione.falsaBandiera){
    rep={...rep};
    rep.reale=Math.min(0,Math.floor((rep.reale||0)*.35));
    rep.mercante=Math.floor((rep.mercante||0)*.45);
    rep.corsaro=(rep.corsaro||0)+6;
  }
  const bersaglio={
    ...base,
    id: territorio.id+'_'+missione.id,
    baseId: base.id,
    nome: missione.nome+' — '+territorio.nome,
    icona: giaScoperto?territorio.icona:'🧭',
    territorio,
    missione,
    potenza:pot,
    pattuglia,
    allertaPotenza:allerta,
    merci:territorio.merci||[],
    esplorazioneNuova:missione.id==='esplorazione'&&!giaScoperto,
    difficolta: Math.max(1,Math.min(5,pericolo)),
    durataBase: Math.max(1,(base.durataBase||2)+(territorio.durata||0)+(missione.id==='esplorazione'?1:0)),
    bottino,
    nemico,
    rep,
    evento_speciale: territorio.nota,
    prigionieriBonus: mod.prigionieri||0,
  };
  bersaglio.nome=missione.nome+' — '+(giaScoperto?territorio.nome:'Acque Sconosciute');
  if(missione.id==='esplorazione'){
    bersaglio.difficolta=Math.max(1,territorio.pericolo-1);
    bersaglio.pattuglia=Math.max(0,pattuglia-1);
    bersaglio.nemico={nome:'Mare Incerto',hp:45+territorio.pericolo*12,atk:6+territorio.pericolo*2,difesa:1+territorio.pericolo,icona:'🧭'};
    bersaglio.bottino={oro:modificaRange(base.bottino.oro||[40,90],.45), ricerca:[18,38]};
    bersaglio.rep={corsaro:+3};
  }
  return bersaglio;
}

function naviAttraccateRaid(){
  return (G.navi||[]).filter(n=>!n.inMare && n._faseRaid!=='salpando');
}
function statoNavePortoHtml(n){
  if(!n) return '';
  if(n.inMare){
    const rd=n.raidData;
    return `<div style="font-size:.72rem;color:var(--sabbia);line-height:1.45">
      <b style="color:var(--oro)">In mare</b><br>
      ${rd?.bersaglio?.missione?.icona||'⚓'} ${rd?.bersaglio?.nome||'Spedizione in corso'}<br>
      Rientro previsto tra ${n.timerRaid||1} giorni.
    </div>`;
  }
  const crew=equipaggioStimatoRaid(n);
  const capitano=capitanoNaveRaid(n);
  const hpPct=Math.round((n.hp||0)/Math.max(1,n.hpMax||1)*100);
  const scorte=G.scorte||{};
  return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px">
    <div style="background:rgba(255,255,255,.08);border:1px solid rgba(90,50,20,.18);border-radius:6px;padding:7px">
      <span style="display:block;font-size:.58rem;color:var(--sabbia);text-transform:uppercase;letter-spacing:.8px">Scafo</span>
      <b style="font-family:'Cinzel',serif;color:${hpPct>60?'var(--verde-ch)':hpPct>30?'var(--oro)':'var(--rum-chiaro)'}">${n.hp}/${n.hpMax}</b>
    </div>
    <div style="background:rgba(255,255,255,.08);border:1px solid rgba(90,50,20,.18);border-radius:6px;padding:7px">
      <span style="display:block;font-size:.58rem;color:var(--sabbia);text-transform:uppercase;letter-spacing:.8px">Equipaggio</span>
      <b style="font-family:'Cinzel',serif;color:var(--pergamena)">${crew.length}/${n.capienza||6}</b>
    </div>
    <div style="background:rgba(255,255,255,.08);border:1px solid rgba(90,50,20,.18);border-radius:6px;padding:7px">
      <span style="display:block;font-size:.58rem;color:var(--sabbia);text-transform:uppercase;letter-spacing:.8px">Capitano</span>
      <b style="font-family:'Cinzel',serif;color:${capitano?'var(--oro)':'var(--rum-chiaro)'}">${capitano?capitano.nome.split(' ')[0]:'assente'}</b>
    </div>
    <div style="background:rgba(255,255,255,.08);border:1px solid rgba(90,50,20,.18);border-radius:6px;padding:7px">
      <span style="display:block;font-size:.58rem;color:var(--sabbia);text-transform:uppercase;letter-spacing:.8px">Stiva</span>
      <b style="font-family:'Cinzel',serif;color:var(--pergamena)">🥫 ${scorte.razioni||0} · ⚔ ${scorte.armi||0}</b>
    </div>
  </div>`;
}
function missioniNavePortoHtml(){
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="piano-missioni">
    ${MISSIONI_RAID.map(m=>`
      <button type="button" onclick="selMissioneRaid('${m.id}')" id="pm-${m.id}"
        style="text-align:left;background:${statoPianificazione.missione?.id===m.id?'rgba(240,192,64,.16)':'rgba(255,255,255,.09)'};border:1px solid ${statoPianificazione.missione?.id===m.id?'var(--oro)':'rgba(90,50,20,.22)'};
        border-radius:6px;padding:8px 9px;cursor:pointer;transition:all .15s;color:var(--pergamena);font-family:Georgia,'Times New Roman',serif">
        <span style="display:block;font-size:.78rem;font-weight:700;margin-bottom:2px">${m.icona} ${m.nome}</span>
        <span style="display:block;font-size:.62rem;color:var(--sabbia);line-height:1.3">${m.desc}</span>
      </button>`).join('')}
  </div>`;
}
function mappaStrategicaNaveHtml(){
  return `<div id="mappa-raid-caraibi" style="position:relative;height:220px;border:1px solid rgba(90,50,20,.35);border-radius:8px;overflow:hidden;
    background:radial-gradient(ellipse at 40% 45%,rgba(80,160,170,.38),rgba(10,45,70,.92) 58%,rgba(5,18,35,.98));box-shadow:inset 0 0 50px rgba(0,0,0,.35);margin-top:6px">
    <div style="position:absolute;inset:0;opacity:.18;background-image:linear-gradient(30deg,transparent 46%,rgba(240,192,64,.25) 49%,transparent 52%),linear-gradient(120deg,transparent 47%,rgba(240,192,64,.18) 50%,transparent 53%);background-size:58px 58px"></div>
    ${raidTerritoriDisponibili().map(t=>territorioButtonRaid(t)).join('')}
    <div id="territorio-info" style="position:absolute;left:8px;right:8px;bottom:8px;padding:8px 10px;border-radius:6px;background:rgba(0,0,0,.58);border:1px solid rgba(240,192,64,.18);font-size:.68rem;color:var(--sabbia)">
      Scegli una rotta o manda la nave in esplorazione.
    </div>
  </div>`;
}
function apriPortoPirata(edificio=null, forzaLista=false){
  assicuraRaidTropico2();
  const attraccate=naviAttraccateRaid();
  const inMare=(G.navi||[]).filter(n=>n.inMare);
  if(attraccate.length===1 && !forzaLista){
    apriSchedaNavePorto(attraccate[0].id,'porto');
    return;
  }
  const portoNome=edificio&&ED[edificio.tipo]?ED[edificio.tipo].nome:'Porto dei Pirati';
  const html=`
    <div style="font-family:Georgia,'Times New Roman',serif">
      <div style="display:grid;grid-template-columns:82px 1fr;gap:12px;align-items:center;margin-bottom:12px">
        <div style="height:78px;border:1px solid rgba(90,50,20,.35);border-radius:7px;background:linear-gradient(180deg,rgba(30,85,105,.35),rgba(20,45,55,.75));display:flex;align-items:center;justify-content:center;font-size:2.4rem">⚓</div>
        <div>
          <div style="font-family:'Cinzel',serif;color:var(--oro);font-size:.95rem">${portoNome}</div>
          <div style="font-size:.72rem;color:var(--sabbia);line-height:1.45">Le navi attraccate ricevono ordini qui: missione, bersaglio, rifornimenti e partenza.</div>
        </div>
      </div>
      ${atlanteRaidHtml()}
      ${storicoRaidHtml()}
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:1.6px;text-transform:uppercase;color:var(--sabbia);margin-bottom:7px">Navi attraccate</div>
      ${attraccate.length?attraccate.map(n=>{
        const pct=Math.round(n.hp/Math.max(1,n.hpMax)*100);
        const capitano=capitanoNaveRaid(n);
        return `<button type="button" onclick="apriSchedaNavePorto(${n.id},'porto')" style="width:100%;text-align:left;background:rgba(255,255,255,.08);border:1px solid rgba(90,50,20,.24);border-radius:7px;padding:9px 10px;margin-bottom:6px;cursor:pointer;color:var(--pergamena);font-family:Georgia,'Times New Roman',serif">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <b style="font-family:'Cinzel',serif;color:var(--oro)">⛵ ${n.nome}</b>
            <span style="font-size:.66rem;color:${pct>60?'var(--verde-ch)':pct>30?'var(--oro)':'var(--rum-chiaro)'}">Scafo ${pct}%</span>
          </div>
          <div style="font-size:.66rem;color:var(--sabbia);margin-top:3px">Ciurma ${testoEquipaggioRaid(n)} · Capitano ${capitano?capitano.nome:'assente'}</div>
        </button>`;
      }).join(''):`<div style="font-size:.75rem;color:var(--rum-chiaro);margin-bottom:8px">Nessuna nave pronta in porto.</div>`}
      ${inMare.length?`<div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:1.6px;text-transform:uppercase;color:var(--sabbia);margin:11px 0 7px">In mare</div>
        ${inMare.map(n=>`<div style="font-size:.68rem;color:var(--sabbia);display:flex;justify-content:space-between;margin-bottom:3px"><span>⚓ ${n.nome}</span><span>${n.timerRaid||1}g</span></div>`).join('')}`:''}
    </div>`;
  apriModale('⚓ Porto dei Pirati',html);
}
function apriSchedaNavePorto(id, origine='porto'){
  const n=G.navi.find(x=>x.id===id);
  if(!n) return;
  if(n.inMare){
    const log=n.raidData?.log||[];
    apriModale('⛵ '+n.nome,`
      <div style="font-family:Georgia,'Times New Roman',serif">
        ${statoNavePortoHtml(n)}
        ${log.length?`<div style="margin-top:10px;font-family:'Cinzel',serif;font-size:.68rem;color:var(--oro)">Diario di bordo</div>
          ${log.slice(-5).map(x=>`<div style="font-size:.68rem;color:var(--sabbia);border-bottom:1px solid rgba(90,50,20,.12);padding:4px 0">${x}</div>`).join('')}`:''}
        <button class="mbtn secondario" style="width:100%;margin-top:12px" onclick="apriPortoPirata(null,true)">Torna al porto</button>
      </div>`);
    return;
  }

  const missione=n.ordineMissione ? missioneRaidById(n.ordineMissione) : MISSIONI_RAID[0];
  const territorio=n.ordineTerritorio ? territorioRaidById(n.ordineTerritorio) : null;
  statoPianificazione={nave:n, missione, territorio};
  const equipaggio=testoEquipaggioRaid(n);
  const html=`
    <div id="piano-raid" style="font-family:Georgia,'Times New Roman',serif">
      <div style="display:grid;grid-template-columns:98px 1fr;gap:12px;align-items:center;margin-bottom:12px">
        <div style="height:88px;border:1px solid rgba(90,50,20,.35);border-radius:7px;background:linear-gradient(180deg,rgba(40,95,120,.32),rgba(16,38,50,.78));display:flex;align-items:center;justify-content:center;font-size:2.6rem;box-shadow:inset 0 -18px 30px rgba(0,0,0,.25)">⛵</div>
        <div>
          <div style="font-family:'Pirata One',cursive;font-size:1.25rem;color:var(--oro);line-height:1.05">${n.nome}</div>
          <div style="font-size:.72rem;color:var(--sabbia);margin-top:3px">${n.tipo} · attraccata al molo</div>
          <div style="font-size:.68rem;color:var(--sabbia);margin-top:5px">Ciurma pronta: ${equipaggio}</div>
        </div>
      </div>
      ${statoNavePortoHtml(n)}
      <div style="display:flex;gap:6px;margin:10px 0 14px">
        <button class="mbtn secondario" style="flex:1" onclick="apriPortoPirata(null,true)">⚓ Porto</button>
        <button class="mbtn secondario" style="flex:1" onclick="apriOfficinaNave(${n.id})">🛠 Officina</button>
      </div>
      ${atlanteRaidHtml()}
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:1.6px;text-transform:uppercase;color:var(--sabbia);margin-bottom:7px">Ordine missione</div>
      ${missioniNavePortoHtml()}
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:1.6px;text-transform:uppercase;color:var(--sabbia);margin:13px 0 3px">Mappa strategica</div>
      ${mappaStrategicaNaveHtml()}
      <div id="piano-riepilogo" style="background:rgba(240,192,64,.08);border:1px solid rgba(90,50,20,.26);border-radius:6px;padding:10px;margin:12px 0;display:none">
        <div id="piano-riepilogo-testo" style="font-size:.75rem;color:var(--sabbia)"></div>
      </div>
      <button id="btn-lancia-raid" onclick="lanciaRaidTattico()" disabled
        style="width:100%;font-family:'Pirata One',cursive;font-size:1.08rem;background:linear-gradient(135deg,var(--oro-scuro),var(--oro));color:var(--inchiostro);border:none;padding:10px;border-radius:5px;cursor:pointer;opacity:.4;transition:all .2s">
        ⚓ Molla gli ormeggi
      </button>
    </div>`;
  apriModale('⛵ Ordini della Nave',html);
  aggiornaMappaTerritoriRaid();
  aggiornaPianoRiepilogo();
}

function apriPianificazioneRaid(){
  apriPortoPirata();
  return;
  const naviDisponibili=G.navi.filter(n=>!n.inMare && n._faseRaid!=='salpando');
  statoPianificazione={
    nave:naviDisponibili[0]||null,
    missione:MISSIONI_RAID[0],
    territorio:null,
  };

  const html=`
  <div id="piano-raid" style="font-family:'IM Fell English',serif">
    <div style="margin-bottom:12px;padding:9px 10px;border:1px solid rgba(240,192,64,.25);border-radius:7px;background:rgba(240,192,64,.06);font-size:.72rem;color:var(--sabbia);line-height:1.45">
      <b style="color:var(--oro);font-family:'Cinzel',serif">Raid stile Tropico 2</b><br>
      Scegli la nave, scegli la missione, poi clicca un territorio sulla mappa. Dopo la conferma suona la campana e la ciurma corre al porto.
    </div>
    ${atlanteRaidHtml()}
    ${storicoRaidHtml()}

    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.8;margin-bottom:6px">1 — Nave</div>
      <div style="display:flex;flex-direction:column;gap:5px" id="piano-navi">
        ${naviDisponibili.map(n=>{
          const pct=Math.round(n.hp/n.hpMax*100);
          const col=pct>60?'var(--verde-ch)':pct>30?'var(--oro)':'var(--rum-chiaro)';
          return `<div class="piano-card${statoPianificazione.nave?.id===n.id?' sel':''}"
            onclick="selNaveRaid(${n.id})" id="pnave-${n.id}"
            style="background:${statoPianificazione.nave?.id===n.id?'rgba(240,192,64,.12)':'rgba(255,255,255,.06)'};border:1px solid ${statoPianificazione.nave?.id===n.id?'var(--oro)':'var(--bordo)'};
            border-radius:6px;padding:8px 10px;cursor:pointer;transition:all .15s">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:.82rem;color:var(--pergamena)">⛵ ${n.nome}</span>
              <span style="font-size:.68rem;color:${col}">👥 ${testoEquipaggioRaid(n)} · 🛡${pct}%</span>
            </div>
          </div>`;
        }).join('') || `<div style="font-size:.75rem;color:var(--rum-chiaro)">Nessuna nave disponibile.</div>`}
      </div>
    </div>

    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.8;margin-bottom:6px">2 — Missione</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="piano-missioni">
        ${MISSIONI_RAID.map(m=>`
          <div onclick="selMissioneRaid('${m.id}')" id="pm-${m.id}"
            style="background:${statoPianificazione.missione?.id===m.id?'rgba(240,192,64,.12)':'rgba(255,255,255,.06)'};border:1px solid ${statoPianificazione.missione?.id===m.id?'var(--oro)':'var(--bordo)'};
            border-radius:6px;padding:8px 9px;cursor:pointer;transition:all .15s">
            <div style="font-size:.8rem;color:var(--pergamena);margin-bottom:2px">${m.icona} ${m.nome}</div>
            <div style="font-size:.62rem;color:var(--sabbia);font-style:italic;line-height:1.35">${m.desc}</div>
          </div>`).join('')}
      </div>
    </div>

    <div style="margin-bottom:14px">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--sabbia);opacity:.8;margin-bottom:6px">3 — Territorio sulla Mappa</div>
      <div id="mappa-raid-caraibi" style="position:relative;height:210px;border:1px solid rgba(240,192,64,.35);border-radius:8px;overflow:hidden;
        background:radial-gradient(ellipse at 40% 45%,rgba(80,160,170,.38),rgba(10,45,70,.92) 58%,rgba(5,18,35,.98));box-shadow:inset 0 0 50px rgba(0,0,0,.35)">
        <div style="position:absolute;inset:0;opacity:.18;background-image:linear-gradient(30deg,transparent 46%,rgba(240,192,64,.25) 49%,transparent 52%),linear-gradient(120deg,transparent 47%,rgba(240,192,64,.18) 50%,transparent 53%);background-size:58px 58px"></div>
        ${raidTerritoriDisponibili().map(t=>territorioButtonRaid(t)).join('')}
        <div id="territorio-info" style="position:absolute;left:8px;right:8px;bottom:8px;padding:8px 10px;border-radius:6px;background:rgba(0,0,0,.58);border:1px solid rgba(240,192,64,.18);font-size:.68rem;color:var(--sabbia)">
          Tocca un territorio per scegliere la destinazione del raid.
        </div>
      </div>
    </div>

    <div id="piano-riepilogo" style="background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);
      border-radius:6px;padding:10px;margin-bottom:12px;display:none">
      <div id="piano-riepilogo-testo" style="font-size:.75rem;color:var(--sabbia)"></div>
    </div>

    <button id="btn-lancia-raid" onclick="lanciaRaidTattico()" disabled
      style="width:100%;font-family:'Pirata One',cursive;font-size:1.1rem;background:linear-gradient(135deg,var(--oro-scuro),var(--oro));color:var(--inchiostro);border:none;padding:10px;border-radius:5px;cursor:pointer;opacity:.4;transition:all .2s">
      🔔 Suona la campana e salpa
    </button>
  </div>`;

  apriModale('🗺 Spedizione Pirata', html);
  aggiornaPianoRiepilogo();
}

function selNaveRaid(id){
  statoPianificazione.nave=G.navi.find(n=>n.id===id)||null;
  document.querySelectorAll('[id^="pnave-"]').forEach(el=>{
    const nid=parseInt(el.id.replace('pnave-',''));
    const sel=nid===id;
    el.style.borderColor=sel?'var(--oro)':'var(--bordo)';
    el.style.background=sel?'rgba(240,192,64,.12)':'rgba(255,255,255,.06)';
  });
  aggiornaPianoRiepilogo();
}

function selMissioneRaid(id){
  statoPianificazione.missione=missioneRaidById(id);
  if(statoPianificazione.nave) statoPianificazione.nave.ordineMissione=id;
  if(statoPianificazione.territorio && !territorioSelezionabileRaid(statoPianificazione.territorio)) statoPianificazione.territorio=null;
  document.querySelectorAll('[id^="pm-"]').forEach(el=>{
    const mid=el.id.replace('pm-','');
    const sel=mid===id;
    el.style.borderColor=sel?'var(--oro)':'var(--bordo)';
    el.style.background=sel?'rgba(240,192,64,.12)':'rgba(255,255,255,.06)';
  });
  aggiornaMappaTerritoriRaid();
  aggiornaPianoRiepilogo();
}

function selTerritorioRaid(id){
  statoPianificazione.territorio=territorioRaidById(id);
  if(!territorioSelezionabileRaid(statoPianificazione.territorio)){
    statoPianificazione.territorio=null;
    aggiornaMappaTerritoriRaid();
    aggMsg('Serve una missione di Esplorazione per tracciare questa rotta.','male');
    aggiornaPianoRiepilogo();
    return;
  }
  if(statoPianificazione.nave) statoPianificazione.nave.ordineTerritorio=id;
  document.querySelectorAll('[id^="ptx-"]').forEach(el=>{
    const tid=el.id.replace('ptx-','');
    const sel=tid===id;
    el.style.borderColor=sel?'var(--oro)':'var(--bordo)';
    el.style.background=sel?'rgba(240,192,64,.28)':'rgba(0,0,0,.55)';
    el.style.transform=sel?'translate(-50%,-50%) scale(1.16)':'translate(-50%,-50%)';
  });
  aggiornaMappaTerritoriRaid();
  const info=document.getElementById('territorio-info');
  const t=statoPianificazione.territorio;
  if(info&&t){
    const diff='⚔'.repeat(t.pericolo)+'·'.repeat(Math.max(0,4-t.pericolo));
    const scoperto=territorioScoperto(t.id);
    const intel=intelTerritorioRaid(t,scoperto);
    const nome=scoperto?t.nome:'Acque Sconosciute';
    const icona=scoperto?t.icona:'?';
    const nota=scoperto?t.nota:'La rotta non e ancora sulle carte: serve una spedizione di esplorazione.';
    info.innerHTML=`<b style="color:var(--oro);font-family:'Cinzel',serif">${icona} ${nome}</b><br>${nota}<br><span style="color:var(--pergamena)">${intel}</span><br><span style="color:${t.pericolo>2?'var(--rum-chiaro)':t.pericolo>1?'var(--oro)':'var(--verde-ch)'}">Pericolo ${diff}</span>`;
  }
  aggiornaPianoRiepilogo();
}

function equipaggioStimatoRaid(nave){
  if(!nave) return [];
  if(typeof piratiPerRaid==='function') return piratiPerRaid(nave);
  return G.pirati.filter(p=>!p.inRaid).slice(0,nave.capienza||6);
}
function testoEquipaggioRaid(nave){
  const crew=equipaggioStimatoRaid(nave);
  if(crew.length===0) return 'nessun pirata';
  const nomi=crew.slice(0,3).map(p=>(p.nome||'Pirata').split(' ')[0]).join(', ');
  return `${crew.length}/${nave.capienza||6} ${nomi}${crew.length>3?'…':''}`;
}

function aggiornaPianoRiepilogo(){
  const {nave, missione, territorio}=statoPianificazione;
  const riep=document.getElementById('piano-riepilogo');
  const btn=document.getElementById('btn-lancia-raid');
  if(!riep||!btn) return;

  if(nave&&missione&&territorio){
    const bersaglio=creaBersaglioDaPiano();
    const tattica=tatticaDaMissione(missione);
    const crew=equipaggioStimatoRaid(nave);
    const mediaCombo=crew.reduce((a,p)=>a+(p.combattimento||0),0)/Math.max(crew.length,1);
    const mediaNav=crew.reduce((a,p)=>a+(p.navigazione||0),0)/Math.max(crew.length,1);
    const mediaMorale=crew.reduce((a,p)=>a+(p.umore||50),0)/Math.max(crew.length,1);
    const capitano=capitanoNaveRaid(nave);
    const costoPrep=costoPreparazioneRaid(nave,missione,territorio,crew);
    const prepOk=risorsePreparazioneRaid(costoPrep);
    const bonusCap=capitano ? 8 : -8;
    const terrScoperto=territorioScoperto(territorio.id);
    const terrLabel=(terrScoperto?territorio.icona:'?')+' '+(terrScoperto?territorio.nome:'Acque Sconosciute');
    const potenza=potenzaTerritorioRaid(territorio);
    const potenzaLabel=terrScoperto ? potenza.icona+' '+potenza.nome : '? ignota';
    const pattuglia=terrScoperto ? testoPattugliaRaid(territorio) : 'ignote';
    const merci=terrScoperto ? (merciTerritorioRaid(territorio)||'varie') : 'sconosciute';
    const forzaAtk=Math.floor(8+(mediaCombo*.12)+(mediaNav*.035)+(mediaMorale-50)*.04+(nave.livCannoni||0)*4+(tattica.bonus.atk||0)+bonusCap);
    const nemDif=(bersaglio.nemico.difesa||0)+(bersaglio.nemico.atk||8)*.3;
    const chVitt=Math.min(92,Math.max(12,Math.round(55+(forzaAtk-nemDif)*3)));
    const repStr=Object.entries(bersaglio.rep||{}).filter(([,v])=>v!==0&&isFinite(v))
      .map(([k,v])=>`${G.fazioni[k]?.nome||k} ${v>0?'+':''}${v}`).join(', ');

    riep.style.display='block';
    document.getElementById('piano-riepilogo-testo').innerHTML=`
      <div style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--oro);margin-bottom:5px">Ordini del Capitano</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:.7rem">
        <span>⛵ Nave:</span><span style="color:var(--pergamena)">${nave.nome}</span>
        <span>📜 Missione:</span><span style="color:var(--pergamena)">${missione.icona} ${missione.nome}</span>
        <span>🗺 Territorio:</span><span style="color:var(--pergamena)">${terrLabel}</span>
        <span>🏴 Potenza:</span><span style="color:var(--pergamena);font-size:.62rem">${potenzaLabel}</span>
        <span>⚓ Pattuglie:</span><span style="color:${terrScoperto&&pattuglia!=='nessuna'?'var(--oro)':'var(--sabbia)'};font-size:.62rem">${pattuglia}</span>
        <span>📦 Merci:</span><span style="color:var(--sabbia);font-size:.62rem">${merci}</span>
        <span>☠ Ciurma:</span><span style="color:var(--pergamena);font-size:.62rem">${testoEquipaggioRaid(nave)}</span>
        <span>★ Capitano:</span><span style="color:${capitano?'var(--oro)':'var(--rum-chiaro)'};font-size:.62rem">${capitano?capitano.nome:'nessun capitano assegnato'}</span>
        <span>🥫 Rifornimenti:</span><span style="color:${prepOk.ok?'var(--pergamena)':'var(--rum-chiaro)'};font-size:.62rem">${testoCostoPreparazione(costoPrep)}</span>
        <span>⚔ Approccio:</span><span style="color:var(--pergamena)">${tattica.icona} ${tattica.nome}</span>
        <span>📊 Successo:</span><span style="color:${chVitt>60?'var(--verde-ch)':chVitt>40?'var(--oro)':'var(--rum-chiaro)'}">${chVitt}%</span>
        <span>⏱ Durata:</span><span style="color:var(--sabbia)">${bersaglio.durataBase} giorni</span>
        <span>🌐 Rep.:</span><span style="color:var(--sabbia);font-size:.62rem">${repStr||'nessuna'}</span>
      </div>`;
    btn.disabled=crew.length<2 || !prepOk.ok;
    btn.style.opacity=(crew.length<2 || !prepOk.ok)?'.4':'1';
  } else {
    riep.style.display='none';
    btn.disabled=true;
    btn.style.opacity='.4';
  }
}

function lanciaRaidTattico(){
  const {nave, missione, territorio}=statoPianificazione;
  if(!nave||!missione||!territorio){
    aggMsg('Scegli nave, missione e territorio.','male');
    return;
  }
  const crew=equipaggioStimatoRaid(nave);
  if(crew.length<2){
    aggMsg('Servono almeno 2 pirati disponibili per imbarcarsi.','male');
    return;
  }
  if(!territorioSelezionabileRaid(territorio)){
    aggMsg('Questa rotta non e ancora tracciata: manda prima una Esplorazione.','male');
    return;
  }
  const costoPrep=costoPreparazioneRaid(nave,missione,territorio,crew);
  if(!consumaPreparazioneRaid(costoPrep)){
    aggMsg('Rifornimenti insufficienti per questa spedizione.','male');
    return;
  }
  const tattica=tatticaDaMissione(missione);
  if(tattica.cost_rum>0&&G.rum<tattica.cost_rum){
    aggMsg(`Servono ${tattica.cost_rum} rum per questa missione!`,'male'); return;
  }
  if(tattica.cost_rum>0) G.rum-=tattica.cost_rum;

  const bersaglio=creaBersaglioDaPiano();
  nave.ordineMissione=missione.id;
  nave.ordineTerritorio=territorio.id;
  bersaglio.preparazione=costoPrep;
  bersaglio.capitanoId=capitanoNaveRaid(nave)?.id || null;
  chiudiModale();
  avviaSequenzaRaid(nave, bersaglio, tattica);
}

// ═══════════════════════════════════════════════════
// SEQUENZA RAID CINEMATICA — stile Tropico 2
// ═══════════════════════════════════════════════════
