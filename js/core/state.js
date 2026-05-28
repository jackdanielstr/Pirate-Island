// Isla del Diablo — core/state.js
// Estratto da 01_state.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: STATE
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// STATO
// ═══════════════════════════════════════════════════
const G={
  giorno:1, oro:320, cibo:180, legno:180, rum:90,
  pirati:[], navi:[], edifici:[], prigionieri:[], schiavi:[],
  missioniAttive:[],
  mappa:[], COLS:32, RIGHE:24, TILE:52,
  zoom:1, ZOOM_MIN:.45, ZOOM_MAX:2.2,
  camX:0, camY:0,
  // Proiezione isometrica 2:1
  ISO_W:64, ISO_H:32, ISO_SCALE:1,
  velocita:1, tickMs:10000,  // 1 giorno = 10s normale, /velocita in cicloGioco
  modalitaCostruzione:null, pirataSelezionato:null,
  cooldownRaid:0, tick:0,
  tabCorrente:'costruisci',
  hoverR:-1, hoverC:-1,
  fazioni:{
    reale:{rep:0,   nome:'Marina Reale',   icona:'👑'},
    mercante:{rep:20,nome:'Mercanti',       icona:'🤝'},
    corsaro:{rep:50, nome:'Corsari',        icona:'☠'},
  },
  ricerca:{completate:new Set(), punti:0},
  battagliaAttiva:false,
  contatori:{raid:0, riscatti:0},
  bisogni:{
    divertimento:50,  // bordello, arena, cantastorie
    spirito:40,       // cappella, stregone
    salute:60,        // infermeria, bagni
    sicurezza:50,     // guardia, fortezza
    lusso:20,         // mercante lusso, sarto
  },
  scorte:{
    canna:0, tabacco:0, ferro:0, metallo:0,
    tavole:0, razioni:0, sigari:0, armi:0, cannoni:0,
  },
  economia:{
    rete:100, produttivita:100, turno:[], avvisi:[],
  },
  bilanciamento:{
    piratiIniziali:8,
    consumo:{ciboPerPirata:1.25, rumPerPirata:.45, pagaFattore:.55, coperturaCasa:3, coperturaNave:1},
    movimento:{normale:.92, veloce:1.08, max:1.24},
  },
  raid:{
    scoperti:['rotta_nord','baia_zucchero','isola_ossa'],
    storia:[],
  },
  fineGioco:false,
  giorniSenzaRisorse:0,  // counter for game over
  // rendering
  alberi:[], rocce:[],
};

const T={OCEANO:0,SABBIA:1,ERBA:2,FORESTA:3,ROCCIA:4,BASSO:5,COLLINA:6,FIUME:7,SENTIERO:8,PALUDE:9};

// ── EDIFICI ──
// Pass Tropico 2: teniamo gli ID interni per compatibilità, ma il menu mostra solo
// edifici coerenti con una cala pirata. Quelli non canonici restano nascosti
// per non rompere salvataggi, rendering o vecchie funzioni.
const ED={
  // Infrastrutture — Tropico 2
  governatore:{icona:'🏛',nome:'Palazzo del Pirata', costo:{oro:0,legno:0}, effetto:'Cuore politico della cala: editti, reputazione e controllo dell’isola.', inizialeOnly:true, categoria:'infrastrutture'},
  mercatonero:{icona:'🛒',nome:'Mercato Nero', costo:{oro:200,legno:30}, effetto:'Contrabbando e merci illegali: +20% entrate commerciali.', categoria:'infrastrutture'},
  dormitorio:{icona:'🛖',nome:'Dormitorio dei Prigionieri', costo:{oro:45,legno:35}, effetto:'Alloggio essenziale per schiavi/captive workers; riduce fughe.', categoria:'infrastrutture'},
  mensa:{icona:'🍲',nome:'Tenda Mensa', costo:{oro:35,legno:25}, effetto:'Distribuisce razioni ai lavoratori prigionieri; migliora ordine e salute.', categoria:'infrastrutture'},
  campo_costruzione:{icona:'⛺',nome:'Campo Costruzione', costo:{oro:55,legno:40}, effetto:'Base dei costruttori: riduce inefficienza degli edifici lontani.', categoria:'infrastrutture'},
  grotta_pirati:{icona:'🕳',nome:'Grotta dei Pirati', costo:{oro:70,legno:35}, effetto:'Rifugio rozzo per bucanieri senza casa; aumenta presenza pirata.', categoria:'infrastrutture'},
  casapirata:{icona:'🏚',nome:'Casa del Pirata', costo:{oro:40,legno:30}, effetto:'Alloggio personale dei pirati; riduce malcontento e richiesta di paga.', categoria:'infrastrutture'},
  prigione:{icona:'⛓',nome:'Gabbia dei Prigionieri', costo:{oro:80,legno:40}, effetto:'Trattiene prigionieri e lavoratori catturati.', categoria:'infrastrutture'},

  // Nautica — Tropico 2
  porto:{icona:'⚓',nome:'Molo', costo:{oro:90,legno:70}, effetto:'Attracco, partenza raid, carico/scarico bottino e merci.', categoria:'nautica'},
  covo_contrabbandieri:{icona:'🏴',nome:'Covo dei Contrabbandieri', costo:{oro:140,legno:60}, effetto:'Punto commerciale clandestino: migliora scambi e bottino venduto.', categoria:'nautica'},
  razioni_mare:{icona:'🥫',nome:'Fabbrica Razioni di Mare', costo:{oro:95,legno:45}, effetto:'Prepara razioni per le spedizioni: riduce rischi nei raid lunghi.', categoria:'nautica'},
  cantiere:{icona:'🛶',nome:'Cantiere Barche', costo:{oro:120,legno:50}, effetto:'Costruisce e ripara piccole navi pirata.', categoria:'nautica'},
  shipyard:{icona:'🚢',nome:'Cantiere Navale', costo:{oro:260,legno:120}, effetto:'Permette navi più grandi e raid più ambiziosi.', categoria:'nautica'},

  // Risorse — Tropico 2
  fattoria:{icona:'🌽',nome:'Campo di Mais', costo:{oro:60,legno:30}, effetto:'+9 cibo/giorno. Lavoro dei prigionieri, efficienza dai sentieri.', categoria:'risorse'},
  banane:{icona:'🍌',nome:'Piantagione di Banane', costo:{oro:65,legno:30}, effetto:'Produce cibo tropicale; utile per mensa e razioni.', categoria:'risorse'},
  papaia:{icona:'🥭',nome:'Piantagione di Papaia', costo:{oro:70,legno:30}, effetto:'Cibo e merci leggere per commercio locale.', categoria:'risorse'},
  canna_zucchero:{icona:'🎋',nome:'Piantagione di Canna da Zucchero', costo:{oro:75,legno:35}, effetto:'Materia prima per rum e commercio.', categoria:'risorse'},
  tabacco:{icona:'🚬',nome:'Piantagione di Tabacco', costo:{oro:80,legno:35}, effetto:'Materia prima per sigari e beni di lusso pirata.', categoria:'risorse'},
  miniera_ferro:{icona:'⛏',nome:'Miniera di Ferro', costo:{oro:120,legno:60}, effetto:'Materia prima per armi, cannoni e ferramenta.', categoria:'risorse'},
  segheria:{icona:'🪓',nome:'Campo Legname', costo:{oro:50,legno:20}, effetto:'+7 legno/giorno. Materia prima per moli, case e navi.', categoria:'risorse'},

  // Produzione — Tropico 2
  forno:{icona:'🍞',nome:'Forno', costo:{oro:80,legno:35}, effetto:'Trasforma mais in cibo migliore per ciurma e prigionieri.', categoria:'produzione'},
  fabbro:{icona:'🔨',nome:'Fabbro', costo:{oro:110,legno:45}, effetto:'Produce utensili e supporto alla costruzione.', categoria:'produzione'},
  fonderia:{icona:'🏭',nome:'Fonderia', costo:{oro:170,legno:70}, effetto:'Lavora ferro per industria bellica e cannoni.', categoria:'produzione'},
  birrificio:{icona:'🍺',nome:'Birrificio', costo:{oro:90,legno:40}, effetto:'Produce bevande per divertimento e morale.', categoria:'produzione'},
  distilleria:{icona:'🍹',nome:'Distilleria di Rum', costo:{oro:90,legno:40}, effetto:'+6 rum/giorno. Mantiene felici i pirati.', categoria:'produzione'},
  fonderia_cannoni:{icona:'💣',nome:'Fonderia Cannoni', costo:{oro:220,legno:90}, effetto:'Produzione cannoni per fortezze e navi.', categoria:'produzione'},
  fabbrica_armi:{icona:'🔫',nome:'Armeria', costo:{oro:190,legno:70}, effetto:'Produce armi leggere: migliora abbordaggi e difesa.', categoria:'produzione'},
  fabbrica_sigari:{icona:'🚬',nome:'Fabbrica Sigari', costo:{oro:150,legno:50}, effetto:'Trasforma tabacco in bene di lusso e commercio.', categoria:'produzione'},
  sawmill:{icona:'🪚',nome:'Segheria', costo:{oro:100,legno:45}, effetto:'Trasforma legname grezzo in tavole per navi ed edifici.', categoria:'produzione'},

  // Divertimento — Tropico 2
  taverna:{icona:'🍺',nome:'Taverna', costo:{oro:80,legno:20}, effetto:'Bere: morale pirati +5/giorno, consuma rum.', categoria:'intrattenimento'},
  locanda:{icona:'🏨',nome:'Locanda', costo:{oro:120,legno:45}, effetto:'Cibo, bevute e riposo per pirati di passaggio.', categoria:'intrattenimento'},
  bettola_contrabbandieri:{icona:'🍻',nome:'Bettola dei Contrabbandieri', costo:{oro:130,legno:35}, effetto:'Ritrovo sporco per pirati e mercanti illegali.', categoria:'intrattenimento'},
  mensa_economica:{icona:'🍗',nome:'Tavola Economica', costo:{oro:65,legno:25}, effetto:'Cibo economico per ciurma e lavoratori.', categoria:'intrattenimento'},
  bordello:{icona:'💋',nome:'Bordello e Salone', costo:{oro:120,legno:40}, effetto:'Compagnia: divertimento +20/giorno, morale +8.', categoria:'intrattenimento'},
  massaggiatrici:{icona:'💆',nome:'Massaggiatrici e Cameriere', costo:{oro:110,legno:35}, effetto:'Servizio ricreativo per pirati stanchi dai raid.', categoria:'intrattenimento'},
  bagni:{icona:'🛁',nome:'Cortigiane e Bagni', costo:{oro:70,legno:30}, effetto:'Servizio di lusso per pirati e prigionieri ricchi.', categoria:'intrattenimento'},
  cantastorie:{icona:'🎲',nome:'Sala da Gioco', costo:{oro:80,legno:30}, effetto:'Dadi, carte e scommesse per pirati.', categoria:'intrattenimento'},
  casino:{icona:'🎰',nome:'Casinò', costo:{oro:220,legno:70}, effetto:'Grande intrattenimento e forte consumo d’oro pirata.', categoria:'intrattenimento'},
  arena:{icona:'🐗',nome:'Fossa degli Animali', costo:{oro:100,legno:60}, effetto:'Anarchia e divertimento brutale per la ciurma.', categoria:'intrattenimento'},

  // Controllo prigionieri — Tropico 2
  cappella:{icona:'⛪',nome:'Chiesa', costo:{oro:90,legno:40}, effetto:'Ordine/religione per lavoratori catturati; riduce fughe.', categoria:'controllo'},
  speziale:{icona:'⚗',nome:'Speziale', costo:{oro:80,legno:30}, effetto:'Cure semplici per prigionieri e ciurma.', categoria:'controllo'},
  infermeria:{icona:'🏥',nome:'Chirurgia', costo:{oro:110,legno:50}, effetto:'Cura ferite, malattie e pirati reduci dai raid.', categoria:'controllo'},
  forca:{icona:'🪦',nome:'Forca', costo:{oro:70,legno:45}, effetto:'Paura e controllo: riduce rivolte ma peggiora umore dei prigionieri.', categoria:'controllo'},
  hotel:{icona:'🏨',nome:'Hotel dei Prigionieri Illustri', costo:{oro:180,legno:70}, effetto:'Trattiene ostaggi importanti per riscatti più alti.', categoria:'controllo'},
  camera_interrogatori:{icona:'🕯',nome:'Camera degli Interrogatori', costo:{oro:150,legno:60}, effetto:'Estrae mappe e informazioni dai prigionieri.', categoria:'controllo'},
  guardia:{icona:'🗼',nome:'Torre di Guardia', costo:{oro:80,legno:50}, effetto:'Paura/difesa: controlla prigionieri e avvisa attacchi.', categoria:'controllo'},

  // Addestramento — Tropico 2
  caserma:{icona:'⚔',nome:'Scuola di Scherma', costo:{oro:100,legno:60}, effetto:'Addestra pirati al combattimento e all’abbordaggio.', categoria:'addestramento'},
  scuola_tiro:{icona:'🎯',nome:'Scuola di Tiro', costo:{oro:120,legno:60}, effetto:'Migliora armi da fuoco e attacchi a distanza.', categoria:'addestramento'},
  scuola_cannoni:{icona:'💣',nome:'Scuola Cannonieri', costo:{oro:140,legno:70}, effetto:'Migliora cannoni di nave e fortezza.', categoria:'addestramento'},
  scuola_navigazione:{icona:'🧭',nome:'Scuola di Navigazione', costo:{oro:130,legno:60}, effetto:'Riduce durata e rischio dei raid.', categoria:'addestramento'},
  scuola_marina:{icona:'⛵',nome:'Scuola di Marineria', costo:{oro:120,legno:55}, effetto:'Migliora equipaggio e manovra delle navi.', categoria:'addestramento'},

  // Difesa — Tropico 2
  fortezza:{icona:'🏰',nome:'Forte', costo:{oro:180,legno:80}, effetto:'Difesa costiera contro flotte e incursioni.', categoria:'difesa'},
  osservatorio:{icona:'🔭',nome:'Osservatorio', costo:{oro:150,legno:50}, effetto:'Avvista rotte e flotte; +3 ricerca/giorno.', categoria:'difesa'},
  cannone_costiero:{icona:'💥',nome:'Cannone Costiero', costo:{oro:130,legno:40}, effetto:'Difesa leggera del porto e deterrente contro pattuglie.', categoria:'difesa'},

  // Accessori — Tropico 2
  carpentiere:{icona:'🪚',nome:'Carpentiere', costo:{oro:100,legno:45}, effetto:'Riparazioni e arredi: supporta case e navi.', categoria:'accessori'},
  cimitero:{icona:'⚰',nome:'Cimitero', costo:{oro:60,legno:30}, effetto:'Gestisce morti e superstizione della ciurma.', categoria:'accessori'},
  sarto:{icona:'🎩',nome:'Bottega dei Cappelli', costo:{oro:130,legno:20}, effetto:'Accessori pirata: lusso e oro +10/giorno.', categoria:'accessori'},
  voliera_pappagalli:{icona:'🦜',nome:'Voliera dei Pappagalli', costo:{oro:90,legno:35}, effetto:'Accessori esotici e prestigio pirata.', categoria:'accessori'},
};
// ── TECNOLOGIE ──
const EDIFICI_INGOMBRI={
  governatore:{w:3,h:2}, porto:{w:3,h:2}, cantiere:{w:2,h:2}, shipyard:{w:3,h:2},
  mercatonero:{w:2,h:1}, dormitorio:{w:2,h:1}, mensa:{w:2,h:1}, prigione:{w:2,h:1},
  campo_costruzione:{w:2,h:1}, grotta_pirati:{w:2,h:1},
  fattoria:{w:2,h:2}, banane:{w:2,h:2}, papaia:{w:2,h:2}, canna_zucchero:{w:2,h:2},
  tabacco:{w:2,h:2}, miniera_ferro:{w:2,h:2}, segheria:{w:2,h:1},
  forno:{w:2,h:1}, fabbro:{w:2,h:1}, distilleria:{w:2,h:1}, birrificio:{w:2,h:1},
  arena:{w:2,h:2}, casino:{w:2,h:2}, bordello:{w:2,h:1}, massaggiatrici:{w:2,h:1},
  bagni:{w:2,h:1}, cantastorie:{w:2,h:1},
  fortezza:{w:2,h:2}, fonderia:{w:2,h:2}, fonderia_cannoni:{w:2,h:2},
  cappella:{w:2,h:1}, infermeria:{w:2,h:1}, hotel:{w:2,h:2},
  camera_interrogatori:{w:2,h:1}, guardia:{w:1,h:1}, caserma:{w:2,h:1},
  scuola_tiro:{w:2,h:1}, scuola_cannoni:{w:2,h:1}, scuola_navigazione:{w:2,h:1},
  scuola_marina:{w:2,h:1}, fabbrica_armi:{w:2,h:1}, fabbrica_sigari:{w:2,h:1},
  sawmill:{w:2,h:1}, razioni_mare:{w:2,h:1}, covo_contrabbandieri:{w:2,h:1},
  taverna:{w:2,h:1}, locanda:{w:2,h:1}, bettola_contrabbandieri:{w:2,h:1},
  cannone_costiero:{w:1,h:1}, carpentiere:{w:2,h:1}, cimitero:{w:2,h:1},
  sarto:{w:2,h:1}, voliera_pappagalli:{w:2,h:1},
};

function ingombroEdificio(tipo){
  const fp=EDIFICI_INGOMBRI[tipo]||{};
  return {w:Math.max(1,fp.w||1),h:Math.max(1,fp.h||1)};
}
function origineEdificioDaCentro(tipo,r,c){
  const fp=ingombroEdificio(tipo);
  return {r:Math.floor(r-Math.floor(fp.h/2)),c:Math.floor(c-Math.floor(fp.w/2))};
}
function celleEdificio(tipo,r,c){
  const fp=ingombroEdificio(tipo), out=[];
  for(let dr=0;dr<fp.h;dr++) for(let dc=0;dc<fp.w;dc++) out.push({r:r+dr,c:c+dc});
  return out;
}
function centroEdificioGriglia(ed){
  const fp=ingombroEdificio(ed.tipo);
  return {r:ed.r+(fp.h-1)/2,c:ed.c+(fp.w-1)/2};
}
function edificioOccupaTile(ed,r,c){
  const fp=ingombroEdificio(ed.tipo);
  return r>=ed.r && c>=ed.c && r<ed.r+fp.h && c<ed.c+fp.w;
}
function edificioInTile(r,c){
  return (G.edifici||[]).find(ed=>edificioOccupaTile(ed,r,c));
}
function anelloEdificio(ed){
  const fp=ingombroEdificio(ed.tipo), out=[];
  const seen=new Set();
  for(let r=ed.r-1;r<=ed.r+fp.h;r++){
    for(let c=ed.c-1;c<=ed.c+fp.w;c++){
      const dentro=r>=ed.r && c>=ed.c && r<ed.r+fp.h && c<ed.c+fp.w;
      if(dentro) continue;
      const k=r+','+c;
      if(!seen.has(k)){seen.add(k);out.push({r,c});}
    }
  }
  return out;
}
function cellaRiferimentoEdificio(ed,preferisciAcqua=false){
  const celle=celleEdificio(ed.tipo,ed.r,ed.c);
  if(preferisciAcqua){
    for(const gruppo of [[T.BASSO,T.OCEANO],[T.SABBIA]]){
      for(const cell of celle){
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
          const nr=cell.r+dr,nc=cell.c+dc;
          const t=G.mappa[nr]&&G.mappa[nr][nc];
          if(gruppo.includes(t)) return {r:cell.r,c:cell.c,tipo:ed.tipo};
        }
      }
    }
  }
  const centro=centroEdificioGriglia(ed);
  let best=celle[0], bestD=Infinity;
  for(const cell of celle){
    const d=Math.abs(cell.r-centro.r)+Math.abs(cell.c-centro.c);
    if(d<bestD){bestD=d;best=cell;}
  }
  return {r:best.r,c:best.c,tipo:ed.tipo};
}

if(typeof window!=='undefined'){
  window.G=G;
  window.T=T;
  window.ED=ED;
}

const TECH=[
  {id:'cannoni',    nome:'Cannoni Pesanti',   desc:'Bottino raid +30%',          costo:40, req:[],              icona:'💣'},
  {id:'mappe',      nome:'Carte Nautiche',    desc:'Durata raid -1 giorno',       costo:35, req:[],              icona:'🗺'},
  {id:'medicina',   nome:'Chirurgia di Bordo',desc:'I pirati disertano meno',     costo:50, req:[],              icona:'⚕'},
  {id:'armatura',   nome:'Scafo Rinforzato',  desc:'+20 HP in battaglia',         costo:60, req:['cannoni'],     icona:'🛡'},
  {id:'diplomazia', nome:'Lettera di Corsa',  desc:'Rep mercanti più rapida',     costo:45, req:['mappe'],       icona:'📜'},
  {id:'alchimia',   nome:'Alchimia del Rum',  desc:'Il rum cura in battaglia',    costo:55, req:['medicina'],    icona:'⚗'},
  {id:'bordata',    nome:'Doppia Bordata',     desc:'Doppio colpo di cannone',     costo:80, req:['armatura','cannoni'],icona:'🔥'},
  {id:'leggenda',   nome:'Leggenda Pirata',   desc:'Tutti i pirati +15 morale',   costo:100,req:['diplomazia','alchimia'],icona:'💀'},
];

const NOMI_PIRATI=[
  'Giacomo il Rosso','Maria la Nera','Pietro Scorbutico','Occhio di Vetro',
  'Diego il Pazzo','Anna la Sanguinaria','Calabrone','Salato Billo','Rosa del Rum',
  'Karl Cannone','Delia il Pugnale','Lo Squalo','Bernacolo','Nora la Tempesta',
  'Lingua d\'Argento','Ferro di Notte','Ciclone','Il Gobbo','Mano d\'Osso',
  'Ursula la Grigia','Tito Tempesta','Cosimo Squalo','Rino Senza Orecchio',
];
const RUOLI_PIRATI=['Bucaniere','Navigatore','Cannoniere','Chirurgo','Cuoco','Nostromo','Spia','Quartier Mastro'];
const TRATTI=[
  {id:'coraggioso', label:'Coraggioso',    icona:'🦁', bonus:{combattimento:8}},
  {id:'scaltro',    label:'Scaltro',       icona:'🦊', bonus:{navigazione:8}},
  {id:'robusto',    label:'Robusto',       icona:'💪', bonus:{hpMorale:15}},
  {id:'ubriaco',    label:'Sempre ubriaco',icona:'🍺', bonus:{umore:15, navigazione:-5}},
  {id:'avaro',      label:'Avaro',         icona:'💰', bonus:{paga:-1}},
  {id:'devoto',     label:'Devoto',        icona:'✝',  bonus:{umore:10}},
  {id:'veterano',   label:'Veterano',      icona:'⚔',  bonus:{combattimento:12, navigazione:8}},
  {id:'codardo',    label:'Codardo',       icona:'🐔', bonus:{combattimento:-8, umore:-5}},
];
const OGGETTI=[
  {id:'spada',    nome:'Spada Damascata',      icona:'⚔', bonus:{combattimento:12}, costo:60},
  {id:'bussola',  nome:'Bussola d\'Oro',       icona:'🧭', bonus:{navigazione:15},  costo:80},
  {id:'talisma',  nome:'Talismano Vudù',        icona:'🪬', bonus:{umore:20},         costo:50},
  {id:'cappello', nome:'Cappello del Capitano', icona:'🎩', bonus:{combattimento:8,navigazione:8}, costo:100},
  {id:'ancora',   nome:'Ciondolo Ancora',       icona:'⚓', bonus:{navigazione:10,umore:10}, costo:70},
  {id:'rum_ind',  nome:'Rum delle Indie',       icona:'🍾', bonus:{umore:25},         costo:40},
];

// CAPITANI FAMOSI
const CAPITANI=[
  {
    id:'blackbeard', nome:'Barbanera', titolo:'Il Terrore dei Mari', icona:'🏴\u200d☠️',
    desc:'Il più temuto pirata del Mediterraneo. La sua sola presenza fa scappare i mercanti.',
    combattimento:95, navigazione:75, umore:70,
    tratto:'Leggendario ☠',
    abilita:'Raid con lui a bordo: +50% bottino, rep corsari +5/raid.',
    costo:{oro:300, rum:50}, reclutato:false,
  },
  {
    id:'grazia', nome:'Grazia O\'Malley', titolo:'La Regina dei Pirati', icona:'👸',
    desc:'Comandante di flotte e negoziante di pace. Nessuno conosce le rotte come lei.',
    combattimento:65, navigazione:98, umore:80,
    tratto:'Ammiraglio ⚓',
    abilita:'Raid -2 giorni. Commercio +15% se assegnata al mercato.',
    costo:{oro:250, rum:30}, reclutato:false,
  },
  {
    id:'jack', nome:'Calico Jack', titolo:'Il Pirata Elegante', icona:'🃏',
    desc:'Maestro del bluff. Riesce a ottenere riscatti doppi e convincere nemici ad arrendersi.',
    combattimento:55, navigazione:70, umore:95,
    tratto:'Diplomatico 🤝',
    abilita:'Riscatti prigionieri +80%. Morale ciurma +8/giorno.',
    costo:{oro:200, legno:20}, reclutato:false,
  },
  {
    id:'anne', nome:'Anne Bonny', titolo:'La Furia Rossa', icona:'🔥',
    desc:'Combattente senza pari. Si dice abbia affrontato da sola dieci soldati della Marina.',
    combattimento:99, navigazione:60, umore:65,
    tratto:'Furia in Battaglia ⚡',
    abilita:'In battaglia: nave +30 HP, danni nemici -20%.',
    costo:{oro:280, cibo:40}, reclutato:false,
  },
  {
    id:'bellamy', nome:'Samuel Bellamy', titolo:'Il Pirata Robin Hood', icona:'🏹',
    desc:'Condivide il bottino con i poveri. La sua ciurma lo adora.',
    combattimento:72, navigazione:80, umore:100,
    tratto:'Generoso 💝',
    abilita:'Tutta la ciurma +5 morale/giorno. Paga ridotta del 30%.',
    costo:{oro:220}, reclutato:false,
  },
  {
    id:'ching', nome:'Ching Shih', titolo:'L\'Imperatrice dei Pirati', icona:'👑',
    desc:'Comandò oltre 1800 navi. La più grande ammiraglio pirata della storia.',
    combattimento:80, navigazione:99, umore:85,
    tratto:'Imperatrice 🌊',
    abilita:'Tutte le navi +20 hpMax. Bonus flotta permanente.',
    costo:{oro:400, rum:80}, reclutato:false,
  },
];

const POOL_MISSIONI=[
  {id:'m_raid3',  titolo:'Tre Razzie',         desc:'Invia 3 raid',                 obiettivo:3,   tipo:'raid',    ricompensa:{oro:200}},
  {id:'m_ciurma12',titolo:'Ciurma in Espansione', desc:'Raggiungi 12 pirati',       obiettivo:12,  tipo:'pirati',  ricompensa:{oro:180,rum:35}},
  {id:'m_build5', titolo:'Costruttore',         desc:'Costruisci 5 edifici',         obiettivo:5,   tipo:'edifici', ricompensa:{oro:250,legno:50}},
  {id:'m_oro1k',  titolo:'Tesoro del Diavolo',  desc:'Accumula 1000 oro',            obiettivo:1000,tipo:'oro',     ricompensa:{ricerca:30}},
  {id:'m_ric3',   titolo:'Pirata Erudito',      desc:'Ricerca 3 tecnologie',         obiettivo:3,   tipo:'ricerca', ricompensa:{oro:200,ricerca:20}},
  {id:'m_prig3',  titolo:'Maestro del Riscatto',desc:'Riscatta 3 prigionieri',       obiettivo:3,   tipo:'riscatti',ricompensa:{oro:300}},
];

const NOMI_PRIGIONIERI=['Ten. Belfair','Cap. Sterling','Gov. Blackwell','Amm. Graves',
  'Mercante Hans','Lady Rosalind','Fra Navarro','Duca Alderman','Sgt. Colby'];

// ═══════════════════════════════════════════════════
// GENERAZIONE MAPPA
// ═══════════════════════════════════════════════════

// heightmap semplice con noise
