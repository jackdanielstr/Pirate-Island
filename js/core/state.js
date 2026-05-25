// Isla del Diablo — core/state.js
// Estratto da 01_state.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: STATE
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// STATO
// ═══════════════════════════════════════════════════
const G={
  giorno:1, oro:250, cibo:100, legno:150, rum:50,
  pirati:[], navi:[], edifici:[], prigionieri:[], schiavi:[],
  missioniAttive:[],
  mappa:[], COLS:26, RIGHE:20, TILE:52,
  zoom:1, ZOOM_MIN:.45, ZOOM_MAX:2.2,
  camX:0, camY:0,
  // Proiezione isometrica 2:1
  ISO_W:64, ISO_H:32, ISO_SCALE:1,
  velocita:1, tickMs:8000,  // 1 giorno = 8s normale, /velocita in cicloGioco
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
  fineGioco:false,
  giorniSenzaRisorse:0,  // counter for game over
  // rendering
  alberi:[], rocce:[],
};

const T={OCEANO:0,SABBIA:1,ERBA:2,FORESTA:3,ROCCIA:4,BASSO:5,COLLINA:6,FIUME:7,SENTIERO:8,PALUDE:9};

// ── EDIFICI ──
const ED={
  taverna:    {icona:'🍺',nome:'Taverna',         costo:{oro:80,legno:20},  effetto:'Morale +5/g, consuma rum'},
  cantiere:   {icona:'⚓',nome:'Cantiere Navale',  costo:{oro:120,legno:50}, effetto:'Permette costruzione navi'},
  porto:      {icona:'🛥',nome:'Porto dei Pirati', costo:{oro:90,legno:70},  effetto:'Punto di partenza e rientro per raid e navi'},
  governatore:{icona:'🏛',nome:'Palazzo del Governatore', costo:{oro:0,legno:0}, effetto:'Cuore della colonia pirata — edificio iniziale', inizialeOnly:true},
  fortezza:   {icona:'🏰',nome:'Fortezza',         costo:{oro:180,legno:80}, effetto:'+difesa contro attacchi'},
  fattoria:   {icona:'🌿',nome:'Fattoria',          costo:{oro:60,legno:30},  effetto:'+9 cibo/giorno'},
  distilleria:{icona:'🏭',nome:'Distilleria',       costo:{oro:90,legno:40},  effetto:'+6 rum/giorno'},
  segheria:   {icona:'🪓',nome:'Segheria',          costo:{oro:50,legno:20},  effetto:'+7 legno/giorno'},
  caserma:    {icona:'⚔', nome:'Caserma',           costo:{oro:100,legno:60}, effetto:'+addestramento combattimento'},
  osservatorio:{icona:'🔭',nome:'Osservatorio',     costo:{oro:150,legno:50}, effetto:'+3 ricerca/giorno'},
  prigione:   {icona:'⛓', nome:'Prigione',          costo:{oro:80,legno:40},  effetto:'Trattieni prigionieri'},
  mercatonero:{icona:'🛒',nome:'Mercato Nero',       costo:{oro:200,legno:30}, effetto:'+20% entrate commercio'},
  casapirata:  {icona:'🏠',nome:'Casa del Pirata',    costo:{oro:40,legno:30},  effetto:'+8 oro/g, riduce paga pirata'},
  // EDIFICI BISOGNI
  bordello:    {icona:'💋',nome:'Bordello',           costo:{oro:120,legno:40}, effetto:'Divertimento +20/g, morale +8, costa rum'},
  arena:       {icona:'⚔',nome:'Arena dei Duelli',   costo:{oro:100,legno:60}, effetto:'Divertimento +12/g, addestra combattimento'},
  cantastorie: {icona:'🎭',nome:'Teatro del Porto',   costo:{oro:80,legno:30},  effetto:'Divertimento +8/g, morale +5'},
  cappella:    {icona:'⛪',nome:'Cappella del Pirata', costo:{oro:90,legno:40},  effetto:'Spirito +18/g, riduce diserzione'},
  infermeria:  {icona:'🏥',nome:'Infermeria',          costo:{oro:110,legno:50}, effetto:'Salute +20/g, pirati guariscono'},
  bagni:       {icona:'🛁',nome:'Bagni Pubblici',      costo:{oro:70,legno:30},  effetto:'Salute +12/g, morale +4'},
  guardia:     {icona:'🗼',nome:'Torre di Guardia',    costo:{oro:80,legno:50},  effetto:'Sicurezza +15/g, avvisa attacchi'},
  sarto:       {icona:'🧵',nome:'Sarto & Mercante',    costo:{oro:130,legno:20}, effetto:'Lusso +15/g, oro +10/g'},
};

// ── TECNOLOGIE ──
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
  {id:'m_ciurma8',titolo:'Ciurma al Completo', desc:'Recluta 8 pirati',             obiettivo:8,   tipo:'pirati',  ricompensa:{oro:150,rum:30}},
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
