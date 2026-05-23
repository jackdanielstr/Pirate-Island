// ═══════════════════════════════════════
// MODULO: MUSIC
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// MUSICA PROCEDURALE — stile Tropico 2
// Web Audio API pura, zero file esterni.
//
// Struttura: intro → loop principale (A+B) → variazioni
// Strumenti: chitarra classica, fisarmonica, percussioni caraibiche,
//            basso, flauto (melody ornamentale)
// Tonalità: Am (Minore Armonica) — tipico dei Caraibi / piratesco
// Tempo: 92 BPM
// ═══════════════════════════════════════════════════



// ═══════════════════════════════════════
// FASE 1 — Atmosfera viva stile Tropico 2
// Pirati non lavorano: gli schiavi trasportano merci
// ═══════════════════════════════════════

window.FASE1 = {
  merci: [],
  raidAttivi: []
};

const MUSIC = (() => {

  let ctx = null;         // AudioContext
  let masterGain = null;  // volume master
  let running = false;
  let startTime = 0;
  let schedulerTimer = null;
  let currentBeat = 0;
  let currentBar = 0;
  let volume = 0.45;      // volume default

  // ── COSTANTI ──
  const BPM = 92;
  const BEAT = 60 / BPM;           // durata di un beat in secondi
  const BAR  = BEAT * 4;           // durata di una misura (4/4)
  const LOOKAHEAD   = 0.15;        // scheduler lookahead (sec)
  const SCHEDULE_MS = 60;          // intervallo scheduler (ms)

  // ── SCALA Am Armonica ──
  // Note in Hz: A3=220, B3=247, C4=261, D4=294, E4=330, F4=349, G#4=415, A4=440
  const NOTES = {
    A2:110, E3:165, A3:220, B3:247, C4:261, D4:294, E4:330,
    F4:349, G4:392, Gs4:415, A4:440, B4:494, C5:523, D5:587,
    E5:659, F5:698, Gs5:831, A5:880,
  };

  // Accordi principali
  const CHORDS = {
    Am:  [NOTES.A3, NOTES.E4, NOTES.A4],
    Dm:  [NOTES.D4, NOTES.F4, NOTES.A4],
    E7:  [NOTES.E4, NOTES.Gs4, NOTES.B4],
    F:   [NOTES.F4, NOTES.A4, NOTES.C5],
    G:   [NOTES.G4, NOTES.B4, NOTES.D5],
    Am2: [NOTES.A2, NOTES.E3, NOTES.A3],
  };

  // ── INIZIALIZZA AUDIO ──
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }

  // ── GENERATORI DI TIMBRI ──

  // Chitarra classica: additive synthesis con envelope a pizzico
  function playGuitar(freq, time, dur, gainVal=0.18) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth'; osc1.frequency.value = freq;
    osc2.type = 'triangle'; osc2.frequency.value = freq * 2.005; // leggero detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + dur * 0.6);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(gainVal * 0.4, time + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(masterGain);
    osc1.start(time); osc2.start(time);
    osc1.stop(time + dur + 0.05); osc2.stop(time + dur + 0.05);
  }

  // Fisarmonica: onda quadra con vibrato — timbro nasale caraibico
  function playAccordion(freq, time, dur, gainVal=0.09) {
    const osc  = ctx.createOscillator();
    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square'; osc.frequency.value = freq;
    lfo.type = 'sine';   lfo.frequency.value = 5.5;
    lfoG.gain.value = freq * 0.006; // vibrato depth
    lfo.connect(lfoG); lfoG.connect(osc.frequency);

    filter.type = 'bandpass'; filter.frequency.value = freq * 1.8; filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.04);
    gain.gain.setValueAtTime(gainVal, time + dur - 0.06);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(filter); filter.connect(gain); gain.connect(masterGain);
    lfo.start(time); osc.start(time);
    lfo.stop(time + dur + 0.05); osc.stop(time + dur + 0.05);
  }

  // Basso (pizzicato basso): sinusoide con sub-attack morbido
  function playBass(freq, time, dur, gainVal=0.28) {
    const osc  = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle'; osc.frequency.value = freq;
    osc2.type = 'sine';    osc2.frequency.value = freq * 0.5; // sub

    filter.type = 'lowpass'; filter.frequency.value = 350;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(gainVal * 0.5, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(masterGain);
    osc.start(time); osc2.start(time);
    osc.stop(time + dur + 0.05); osc2.stop(time + dur + 0.05);
  }

  // Flauto (melodia): onda sinusoidale con attacco morbido
  function playFlute(freq, time, dur, gainVal=0.07) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.06);
    gain.gain.setValueAtTime(gainVal, time + dur - 0.08);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(gain); gain.connect(masterGain);
    osc.start(time); osc.stop(time + dur + 0.05);
  }

  // ── PERCUSSIONI ──

  // Conga/tamburo basso caraibico
  function playConga(time, isAccent=false) {
    const noise = ctx.createBufferSource();
    const buf   = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const data  = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 3);

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const ngain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 180 : 130, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.12);

    filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 2;
    ngain.gain.value = 0.04;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(isAccent ? 0.22 : 0.14, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    noise.buffer = buf;
    noise.connect(filter); filter.connect(ngain); ngain.connect(masterGain);
    osc.connect(gain); gain.connect(masterGain);
    noise.start(time); osc.start(time);
    noise.stop(time + 0.2); osc.stop(time + 0.2);
  }

  // Shaker (maracas) — rumore filtrato highpass
  function playShaker(time, gainVal=0.06) {
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 2);

    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();

    filter.type = 'highpass'; filter.frequency.value = 5000;
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    src.buffer = buf;
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start(time); src.stop(time + 0.06);
  }

  // Piatto (crash leggero)
  function playCymbal(time, gainVal=0.04) {
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 1.2);

    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();

    filter.type = 'bandpass'; filter.frequency.value = 8000; filter.Q.value = 0.8;
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    src.buffer = buf;
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start(time); src.stop(time + 0.45);
  }

  // ── PATTERN MUSICALI ──

  // Arpeggio di chitarra su accordo
  function guitarArpeggio(chord, barTime, pattern) {
    // pattern: array di {beat, noteIdx, dur}
    pattern.forEach(({beat, noteIdx, dur}) => {
      const noteFreq = chord[noteIdx % chord.length];
      playGuitar(noteFreq, barTime + beat * BEAT, dur * BEAT);
    });
  }

  // Basso: una nota per beat con il pattern
  function bassLine(notes, barTime) {
    notes.forEach(([beat, freq, dur]) => {
      if (freq) playBass(freq, barTime + beat * BEAT, dur * BEAT);
    });
  }

  // ── SEZIONE A — Am principale ──
  // (misure 0-3): intro piratesca, ritmo staccato chitarra + basso + conga
  function scheduleBarA(barTime) {
    // Basso
    bassLine([
      [0, NOTES.A2, 0.9], [2, NOTES.E3, 0.45], [2.5, NOTES.A2, 0.45],
      [3, NOTES.D4*0.5, 0.5], // D2 (bassa)
    ], barTime);

    // Chitarra arpeggio Am
    guitarArpeggio(CHORDS.Am, barTime, [
      {beat:0,    noteIdx:0, dur:0.4},
      {beat:0.5,  noteIdx:1, dur:0.35},
      {beat:1,    noteIdx:2, dur:0.55},
      {beat:1.5,  noteIdx:1, dur:0.3},
      {beat:2,    noteIdx:0, dur:0.4},
      {beat:2.5,  noteIdx:2, dur:0.35},
      {beat:3,    noteIdx:1, dur:0.5},
      {beat:3.5,  noteIdx:0, dur:0.4},
    ]);

    // Conga pattern caraibico: 1 - & 3 - &
    playConga(barTime + 0 * BEAT, true);
    playConga(barTime + 0.5 * BEAT);
    playConga(barTime + 1.5 * BEAT);
    playConga(barTime + 2 * BEAT, true);
    playConga(barTime + 2.75 * BEAT);
    playConga(barTime + 3.5 * BEAT);

    // Shaker su ogni ottavo
    for (let i = 0; i < 8; i++) playShaker(barTime + i * BEAT * 0.5);
  }

  // ── SEZIONE B — modulazione Dm/E7 ──
  function scheduleBarB(barTime) {
    // Basso
    bassLine([
      [0, NOTES.D4*0.5, 0.9], [1.5, NOTES.A2, 0.5],
      [2, NOTES.E3*0.5*0.5, 0.9], [3.5, NOTES.A2, 0.4],
    ], barTime);

    // Chitarra Dm → E7
    guitarArpeggio(CHORDS.Dm, barTime, [
      {beat:0, noteIdx:0, dur:0.5}, {beat:0.5, noteIdx:1, dur:0.4},
      {beat:1, noteIdx:2, dur:0.6}, {beat:1.5, noteIdx:1, dur:0.35},
    ]);
    guitarArpeggio(CHORDS.E7, barTime, [
      {beat:2, noteIdx:0, dur:0.5}, {beat:2.5, noteIdx:1, dur:0.4},
      {beat:3, noteIdx:2, dur:0.7}, {beat:3.5, noteIdx:0, dur:0.4},
    ]);

    // Conga variazione
    playConga(barTime + 0 * BEAT, true);
    playConga(barTime + 0.75 * BEAT);
    playConga(barTime + 1.5 * BEAT, true);
    playConga(barTime + 2 * BEAT);
    playConga(barTime + 2.5 * BEAT);
    playConga(barTime + 3 * BEAT, true);
    playConga(barTime + 3.75 * BEAT);

    for (let i = 0; i < 8; i++) playShaker(barTime + i * BEAT * 0.5, 0.05);
  }

  // ── SEZIONE C — fisarmonica melody + piatto ──
  function scheduleBarC(barTime) {
    // Basso
    bassLine([
      [0, NOTES.A2, 0.9], [2, NOTES.F4*0.5, 0.9],
    ], barTime);

    // Fisarmonica melodia in Am: frase ispirata al tema Tropico 2
    const melody = [
      [0,   NOTES.E5,  0.9],
      [1,   NOTES.D5,  0.5],
      [1.5, NOTES.C5,  0.4],
      [2,   NOTES.A4,  0.6],
      [2.5, NOTES.B4,  0.4],
      [3,   NOTES.C5,  0.5],
      [3.5, NOTES.B4,  0.4],
    ];
    melody.forEach(([beat, freq, dur]) =>
      playAccordion(freq, barTime + beat * BEAT, dur * BEAT));

    // Chitarra sostegno
    guitarArpeggio(CHORDS.Am, barTime, [
      {beat:0, noteIdx:0, dur:0.8}, {beat:1, noteIdx:1, dur:0.8},
      {beat:2, noteIdx:2, dur:0.8}, {beat:3, noteIdx:1, dur:0.8},
    ]);

    // Conga + piatto
    playConga(barTime + 0 * BEAT, true);
    playConga(barTime + 1 * BEAT);
    playConga(barTime + 2 * BEAT, true);
    playConga(barTime + 3 * BEAT);
    playCymbal(barTime);
    for (let i = 0; i < 8; i++) playShaker(barTime + i * BEAT * 0.5);
  }

  // ── SEZIONE D — risoluzione con flauto ──
  function scheduleBarD(barTime) {
    // Basso risoluzione
    bassLine([
      [0, NOTES.E3, 0.9], [1, NOTES.A2, 0.5],
      [2, NOTES.A2, 0.9], [3, NOTES.E3, 0.9],
    ], barTime);

    // Flauto: variazione melodica acuta
    const fluteM = [
      [0,   NOTES.A5,  0.6],
      [0.75,NOTES.Gs5, 0.4],
      [1.5, NOTES.A5,  0.5],
      [2,   NOTES.E5,  0.8],
      [3,   NOTES.D5,  0.5],
      [3.5, NOTES.E5,  0.4],
    ];
    fluteM.forEach(([beat, freq, dur]) =>
      playFlute(freq, barTime + beat * BEAT, dur * BEAT));

    // Chitarra E7 → Am (cadenza)
    guitarArpeggio(CHORDS.E7, barTime, [
      {beat:0, noteIdx:0, dur:0.5},{beat:0.5, noteIdx:2, dur:0.4},
      {beat:1, noteIdx:1, dur:0.7},{beat:1.5, noteIdx:0, dur:0.4},
    ]);
    guitarArpeggio(CHORDS.Am, barTime, [
      {beat:2, noteIdx:2, dur:0.6},{beat:2.5, noteIdx:1, dur:0.4},
      {beat:3, noteIdx:0, dur:0.8},{beat:3.5, noteIdx:2, dur:0.5},
    ]);

    playCymbal(barTime);
    playConga(barTime + 0 * BEAT, true);
    playConga(barTime + 1 * BEAT);
    playConga(barTime + 2 * BEAT, true);
    playConga(barTime + 3.5 * BEAT);
    for (let i = 0; i < 8; i++) playShaker(barTime + i * BEAT * 0.5);
  }

  // ── PATTERN LOOP (8 misure) ──
  // A A B A  C D A B
  const LOOP_PATTERN = ['A','A','B','A','C','D','A','B'];

  function scheduleBar(barIndex, barTime) {
    const section = LOOP_PATTERN[barIndex % LOOP_PATTERN.length];
    if      (section === 'A') scheduleBarA(barTime);
    else if (section === 'B') scheduleBarB(barTime);
    else if (section === 'C') scheduleBarC(barTime);
    else if (section === 'D') scheduleBarD(barTime);
  }

  // ── SCHEDULER ──
  // Programma le misure in anticipo per evitare glitch audio
  function scheduler() {
    const now = ctx.currentTime;
    const scheduleUntil = now + LOOKAHEAD;

    while (startTime + currentBar * BAR < scheduleUntil) {
      scheduleBar(currentBar, startTime + currentBar * BAR);
      currentBar++;
    }
    schedulerTimer = setTimeout(scheduler, SCHEDULE_MS);
  }

  // ── API PUBBLICA ──

  function start() {
    if (running) return;
    init();
    if (ctx.state === 'suspended') ctx.resume();
    running = true;
    currentBar = 0;
    startTime = ctx.currentTime + 0.1;
    // Fade in
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);
    scheduler();
  }

  function stop() {
    if (!running) return;
    running = false;
    clearTimeout(schedulerTimer);
    // Fade out
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    }
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain && running) {
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.3);
    }
  }

  function toggle() {
    running ? stop() : start();
    return running;
  }

  function isRunning() { return running; }

  return { start, stop, toggle, setVolume, isRunning };

})();
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
// ═══════════════════════════════════════
// MODULO: MAP
// ═══════════════════════════════════════
function generaHeightmap(rows, cols, cx, cy){
  const h=[];
  for(let r=0;r<rows;r++){
    h.push([]);
    for(let c=0;c<cols;c++){
      const dx=c-cx, dy=r-cy;
      const dist=Math.sqrt(dx*dx+dy*dy*1.15);
      // noise multi-ottava
      const n1=(Math.sin(c*.65+r*.3)*.5+Math.cos(c*1.1-r*.8)*.5)*2.8;
      const n2=(Math.sin(c*1.3-r*.7)*.3+Math.cos(c*.5+r*1.2)*.3)*1.2;
      const n3=Math.sin(c*2.1+r*1.8)*.4;
      h[r].push(dist - n1 - n2 - n3);
    }
  }
  return h;
}

function generaMappa(){
  const cx=G.COLS/2, cy=G.RIGHE/2;
  const hm=generaHeightmap(G.RIGHE,G.COLS,cx,cy);
  G.altezza=hm; // salva per uso nel renderer (ombreggiatura colline)

  G.mappa=Array.from({length:G.RIGHE},()=>Array(G.COLS).fill(T.OCEANO));

  // biomi base da heightmap
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const d=hm[r][c];
    if(d<2.8)       G.mappa[r][c]=T.COLLINA;   // cime
    else if(d<4.5)  G.mappa[r][c]=T.FORESTA;
    else if(d<6.8)  G.mappa[r][c]=T.ERBA;
    else if(d<8.5)  G.mappa[r][c]=T.SABBIA;
    else if(d<10.2) G.mappa[r][c]=T.BASSO;
    // else OCEANO
  }

  // ── FIUME: scende dalla collina verso il mare ──
  // trova un punto di partenza sulle colline
  let fsr=-1, fsc=-1;
  for(let r=2;r<G.RIGHE-2;r++) for(let c=2;c<G.COLS-2;c++){
    if(G.mappa[r][c]===T.COLLINA && fsr===-1){
      // prende il primo punto collinare non troppo al centro
      const dx=c-cx, dy=r-cy;
      if(Math.abs(dx)>2||Math.abs(dy)>2){ fsr=r; fsc=c; }
    }
  }
  G.fiume=[]; // array di {r,c} per il percorso
  if(fsr>0){
    let r=fsr, c=fsc;
    const visited=new Set();
    for(let step=0;step<60;step++){
      const k=r+','+c;
      if(visited.has(k)) break;
      visited.add(k);
      if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) break;
      const t=G.mappa[r][c];
      if(t===T.OCEANO||t===T.BASSO) break;
      G.fiume.push({r,c});
      G.mappa[r][c]=T.FIUME;
      // scende verso il punto più basso (più alto hm = più vicino all'oceano)
      const dirs=[[r-1,c],[r+1,c],[r,c-1],[r,c+1],[r-1,c-1],[r+1,c+1],[r-1,c+1],[r+1,c-1]];
      let best=null, bestH=-Infinity;
      for(const[nr,nc] of dirs){
        if(nr<0||nr>=G.RIGHE||nc<0||nc>=G.COLS) continue;
        if(visited.has(nr+','+nc)) continue;
        const nh=hm[nr][nc];
        if(nh>bestH){ bestH=nh; best=[nr,nc]; }
      }
      if(!best) break;
      r=best[0]; c=best[1];
    }
  }

  // ── SENTIERO: dalla spiaggia verso il centro ──
  G.sentieri=[];
  // trova un tile di sabbia sul bordo est
  let psr=-1, psc=-1;
  for(let r=Math.floor(cy)-2;r<Math.floor(cy)+3;r++){
    for(let c=G.COLS-2;c>G.COLS-6;c--){
      if(G.mappa[r] && G.mappa[r][c]===T.SABBIA){ psr=r; psc=c; break; }
    }
    if(psr>0) break;
  }
  if(psr>0){
    // percorso greedy verso il centro
    let r=psr, c=psc;
    const visited=new Set();
    for(let step=0;step<50;step++){
      const k=r+','+c;
      if(visited.has(k)) break;
      visited.add(k);
      if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) break;
      const t=G.mappa[r][c];
      if(t===T.COLLINA||t===T.FIUME||t===T.OCEANO||t===T.BASSO) break;
      G.sentieri.push({r,c});
      G.mappa[r][c]=T.SENTIERO;
      // muoviti verso il centro
      const dc=cx-c, dr=cy-r;
      const dirs=[];
      if(Math.abs(dc)>Math.abs(dr)) dirs.push([r,c+(dc>0?1:-1)],[r+(dr>0?1:-1),c]);
      else dirs.push([r+(dr>0?1:-1),c],[r,c+(dc>0?1:-1)]);
      dirs.push([r+(dr>0?1:-1),c+(dc>0?1:-1)]);
      let moved=false;
      for(const[nr,nc] of dirs){
        if(nr<0||nr>=G.RIGHE||nc<0||nc>=G.COLS) continue;
        if(visited.has(nr+','+nc)) continue;
        const nt=G.mappa[nr][nc];
        if(nt===T.OCEANO||nt===T.BASSO||nt===T.FIUME) continue;
        r=nr; c=nc; moved=true; break;
      }
      if(!moved) break;
    }
  }

  // ── PALUDE: zona umida vicino al fiume/acqua bassa ──
  for(let r=1;r<G.RIGHE-1;r++) for(let c=1;c<G.COLS-1;c++){
    if(G.mappa[r][c]!==T.ERBA) continue;
    // vicino a BASSO o FIUME?
    let vicino=false;
    for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nt=G.mappa[r+dr]&&G.mappa[r+dr][c+dc];
      if(nt===T.BASSO||nt===T.FIUME){ vicino=true; break; }
    }
    if(vicino && Math.random()<0.45) G.mappa[r][c]=T.PALUDE;
  }

  // ── rocce sulle colline ──
  G.rocce=[];
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]===T.COLLINA && Math.random()<0.25){
      G.rocce.push({r,c,scala:0.5+Math.random()*.6});
    }
    if((G.mappa[r][c]===T.ERBA||G.mappa[r][c]===T.FORESTA) && Math.random()<0.04){
      G.rocce.push({r,c,scala:0.4+Math.random()*.4});
    }
  }

  // ── alberi ──
  G.alberi=[];
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    const t=G.mappa[r][c];
    if(t===T.FORESTA && Math.random()<0.72){
      G.alberi.push({r,c,ox:(Math.random()-.5)*.8,oy:(Math.random()-.5)*.8,
        scala:0.55+Math.random()*.42,tinta:Math.random()});
    }
    if(t===T.PALUDE && Math.random()<0.3){
      // alberi di palude più bassi/pallidi
      G.alberi.push({r,c,ox:(Math.random()-.5)*.6,oy:(Math.random()-.5)*.6,
        scala:0.35+Math.random()*.25,tinta:0.2+Math.random()*.2,palude:true});
    }
  }

  G.pois=[
    {etich:'Rotta Commerciale',icona:'🚢',c:G.COLS-3,r:2,tipo:'mercante'},
    {etich:'Pattuglia Reale',  icona:'⚓',c:1,r:2,tipo:'reale'},
    {etich:'Cala dei Corsari', icona:'💀',c:G.COLS-4,r:G.RIGHE-3,tipo:'corsaro'},
    {etich:'Rovine Antiche',   icona:'🏛',c:2,r:G.RIGHE-4,tipo:'rovine'},
  ];
}

// ═══════════════════════════════════════════════════
// CANVAS RENDERER  —  top-down dettagliato
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════
// MODULO: RENDERER_TILES
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// RENDERER TILES — Proiezione Isometrica 2:1
//
// Sistema di coordinate:
//   Griglia (col, row) → Schermo (sx, sy) con:
//   sx = (col - row) * ISO_W/2  + offsetX
//   sy = (col + row) * ISO_H/2  + offsetY
//
// Ogni tile è un rombo (diamond) ISO_W × ISO_H.
// Luce da nord-ovest: faccia N-W illuminata, S-E in ombra.
// ═══════════════════════════════════════════════════

let canvas, ctx;
let frame = 0;
let _tileCache = null;

// ── Converti griglia → schermo (centro del tile) ──
function isoProj(col, row) {
  const s = G.ISO_SCALE;
  const W = G.ISO_W * s, H = G.ISO_H * s;
  return {
    x: G.camX + (col - row) * W / 2,
    y: G.camY + (col + row) * H / 2,
  };
}

// ── Zoom con pivot ──
function applicaZoom(delta, pivotX, pivotY) {
  const oldScale = G.ISO_SCALE;
  G.ISO_SCALE = Math.max(0.35, Math.min(2.5, G.ISO_SCALE * delta));
  if (G.ISO_SCALE === oldScale) return;
  const r = G.ISO_SCALE / oldScale;
  G.camX = pivotX - (pivotX - G.camX) * r;
  G.camY = pivotY - (pivotY - G.camY) * r;
  limiteCamera();
}

// ── Centra la camera sulla mappa ──
function ridimensionaCanvas() {
  const wrap = document.getElementById('mappa-wrap');
  // Fallback se il DOM non è ancora stato ridimensionato (primo frame)
  const w = wrap.clientWidth  || window.innerWidth;
  const h = wrap.clientHeight || window.innerHeight - 90;
  canvas.width  = w;
  canvas.height = h;
  const W = G.ISO_W * G.ISO_SCALE;
  const H = G.ISO_H * G.ISO_SCALE;
  // Centro della griglia in coordinate iso
  const mapCX = (G.COLS - G.RIGHE) * W / 2;
  const mapCY = (G.COLS + G.RIGHE) * H / 2;
  G.camX = canvas.width  / 2 - mapCX / 2;
  G.camY = canvas.height / 2 - mapCY / 2 - H * 2;
  limiteCamera();
  _tileCache = null;
}

// Hash deterministico per variazioni per-tile
function hash(r, c, salt) {
  let v = (r * 2749 + c * 1597 + salt * 3571) & 0xffff;
  v = ((v ^ (v >>> 7)) * 0x45d9f3b) & 0xffff;
  return (v & 0xffff) / 0xffff;
}

// ── Disegna un tile a rombo isometrico ──
// (cx,cy) = centro in alto del rombo (punto più alto)
function disegnaTileIso(t, cx, cy, r, c) {
  const s  = G.ISO_SCALE;
  const W  = G.ISO_W * s;   // larghezza rombo
  const H  = G.ISO_H * s;   // altezza rombo
  const hw = W / 2, hh = H / 2;

  // Percorso rombo: top → right → bottom → left
  ctx.beginPath();
  ctx.moveTo(cx,      cy);       // top
  ctx.lineTo(cx + hw, cy + hh);  // right
  ctx.lineTo(cx,      cy + H);   // bottom
  ctx.lineTo(cx - hw, cy + hh);  // left
  ctx.closePath();

  switch (t) {

    case T.OCEANO: {
      const v   = hash(r, c, 1);
      const hue = 195 + v * 14;
      const wave = Math.sin(frame * .018 + c * .55 + r * .3) * .04;
      ctx.fillStyle = `hsl(${hue}, 72%, ${20 + v*6 + wave*8}%)`;
      ctx.fill();
      // riflesso solare
      const shim = .06 + Math.sin(frame * .025 + c * .7) * .025;
      ctx.fillStyle = `rgba(180,255,255,${shim})`;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .5, cy + hh * .4);
      ctx.lineTo(cx,           cy + hh * .1);
      ctx.lineTo(cx + hw * .3, cy + hh * .5);
      ctx.lineTo(cx - hw * .2, cy + hh * .8);
      ctx.closePath();
      ctx.fill();
      // onda animata
      const f1 = frame * .018 + c * .55 + r * .3;
      ctx.strokeStyle = `rgba(160,240,255,${.12 + Math.sin(f1) * .05})`;
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - hw * .7, cy + hh * .55 + Math.sin(f1) * 2 * s);
      ctx.bezierCurveTo(
        cx - hw * .2, cy + hh * .45 + Math.sin(f1+1)*3*s,
        cx + hw * .2, cy + hh * .5  - Math.sin(f1+2)*3*s,
        cx + hw * .7, cy + hh * .55 + Math.sin(f1+3)*2*s
      );
      ctx.stroke();
      break;
    }

    case T.BASSO: {
      const sv = hash(r, c, 9);
      ctx.fillStyle = `hsl(${175+sv*15}, ${65+sv*15}%, ${34+sv*10}%)`;
      ctx.fill();
      // corallo
      for (let i = 0; i < 3; i++) {
        const hx = cx + (hash(r,c,i+300)-.5)*W*.7;
        const hy = cy + hh * .4 + hash(r,c,i+310)*hh*.8;
        const col = hash(r,c,i+320);
        ctx.fillStyle = col>.6 ? `rgba(240,160,80,${.15+col*.1})`
                                : `rgba(180,80,80,${.1+col*.08})`;
        ctx.beginPath();
        ctx.arc(hx, hy, (2+col*3)*s, 0, Math.PI*2);
        ctx.fill();
      }
      // trasparenza acqua
      ctx.fillStyle = `rgba(100,220,200,${.2+sv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      // increspature
      const fb = frame*.016 + c*.48 + r*.28;
      ctx.strokeStyle = `rgba(200,255,240,${.18+Math.sin(fb)*.07})`;
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(cx-hw*.6, cy+hh*.6+Math.sin(fb)*2*s);
      ctx.bezierCurveTo(cx-hw*.2,cy+hh*.5, cx+hw*.2,cy+hh*.6, cx+hw*.6,cy+hh*.6+Math.sin(fb+2)*2*s);
      ctx.stroke();
      break;
    }

    case T.SABBIA: {
      const sv = hash(r, c, 2);
      const r1=215+sv*25|0, g1=190+sv*20|0, b1=130+sv*20|0;
      ctx.fillStyle = `rgb(${r1},${g1},${b1})`;
      ctx.fill();
      // illuminazione NW (top face più chiara)
      ctx.fillStyle = `rgba(255,250,220,${.12+sv*.06})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.8, cy+hh*.8);
      ctx.lineTo(cx, cy+H*.6);
      ctx.lineTo(cx+hw*.2, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      // granuli
      for (let i=0; i<6; i++) {
        const gx=cx+(hash(r,c,i+10)-.5)*W*.8;
        const gy=cy+hh*.3+hash(r,c,i+20)*hh*1.2;
        const gv=hash(r,c,i+30);
        ctx.fillStyle=`rgba(${160+gv*60|0},${130+gv*40|0},${80+gv*40|0},${.12+gv*.1})`;
        ctx.beginPath(); ctx.arc(gx,gy,(0.8+gv*1.5)*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }

    case T.ERBA: {
      const ev = hash(r, c, 3);
      const hue = 108 + ev*12;
      ctx.fillStyle = `hsl(${hue},${52+ev*18}%,${30+ev*10}%)`;
      ctx.fill();
      // NW highlight
      ctx.fillStyle = `hsla(${hue+10},60%,${50+ev*10}%,${.12+ev*.06})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.9, cy+hh*.9);
      ctx.lineTo(cx-hw*.1, cy+H*.85);
      ctx.lineTo(cx+hw*.4, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      // ciuffi
      ctx.lineWidth = s * .9;
      for (let i=0; i<5; i++) {
        const gx=cx+(hash(r,c,i+50)-.5)*W*.7;
        const gy=cy+hh*.3+hash(r,c,i+60)*hh*1.3;
        const gh=(4+hash(r,c,i+70)*5)*s;
        ctx.strokeStyle=`hsla(${hue+15},${50+ev*20}%,${44+ev*12}%,.55)`;
        ctx.beginPath();
        ctx.moveTo(gx,gy);
        ctx.lineTo(gx+(hash(r,c,i+80)-.5)*3*s, gy-gh);
        ctx.stroke();
      }
      break;
    }

    case T.FORESTA: {
      const fv = hash(r, c, 4);
      ctx.fillStyle = `hsl(${118+fv*10},${58+fv*14}%,${14+fv*8}%)`;
      ctx.fill();
      // sottobosco scuro
      ctx.fillStyle = `rgba(0,15,5,${.15+fv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      // chiazze
      for (let i=0; i<3; i++) {
        const bv=hash(r,c,i+100);
        ctx.fillStyle=`hsla(${115+bv*20},${50+bv*20}%,${12+bv*14}%,${.25+bv*.18})`;
        ctx.beginPath();
        ctx.arc(cx+(hash(r,c,i+90)-.5)*W*.6, cy+hh*.4+hash(r,c,i+95)*hh, (4+bv*7)*s, 0,Math.PI*2);
        ctx.fill();
      }
      break;
    }

    case T.ROCCIA: {
      const rv = hash(r, c, 5);
      ctx.fillStyle = `rgb(${70+rv*22|0},${60+rv*18|0},${50+rv*14|0})`;
      ctx.fill();
      // highlight NW
      ctx.fillStyle = `rgba(160,140,110,${.1+rv*.07})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.8, cy+hh*.8);
      ctx.lineTo(cx, cy+H*.5);
      ctx.closePath(); ctx.fill();
      break;
    }

    case T.COLLINA: {
      const cv = hash(r, c, 6);
      ctx.fillStyle = `rgb(${118+cv*22|0},${100+cv*18|0},${72+cv*14|0})`;
      ctx.fill();
      // luce forte NW
      ctx.fillStyle = `rgba(255,240,180,${.18+cv*.08})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-hw*.85, cy+hh*.85);
      ctx.lineTo(cx-hw*.1, cy+H*.8);
      ctx.lineTo(cx+hw*.3, cy+hh*.35);
      ctx.closePath(); ctx.fill();
      // ombra SE
      ctx.fillStyle = `rgba(0,0,20,${.2+cv*.1})`;
      ctx.beginPath();
      ctx.moveTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H);
      ctx.lineTo(cx-hw*.2, cy+H*.9);
      ctx.lineTo(cx+hw*.7, cy+hh*.4);
      ctx.closePath(); ctx.fill();
      break;
    }

    case T.FIUME: {
      ctx.fillStyle = '#2a6040';
      ctx.fill();
      const ff = frame*.022 + c*.45 + r*.32;
      ctx.fillStyle = `rgba(40,140,200,${.84+Math.sin(ff)*.06})`;
      ctx.beginPath();
      const fw=hw*.72, fh=hh*.72;
      ctx.moveTo(cx,      cy+hh-fh);
      ctx.lineTo(cx+fw,   cy+hh);
      ctx.lineTo(cx,      cy+hh+fh);
      ctx.lineTo(cx-fw,   cy+hh);
      ctx.closePath(); ctx.fill();
      // corrente
      ctx.strokeStyle=`rgba(200,240,255,${.2+Math.sin(ff*1.4)*.1})`;
      ctx.lineWidth=1.2*s;
      ctx.beginPath();
      ctx.moveTo(cx-fw*.7, cy+hh+Math.sin(ff)*2*s);
      ctx.bezierCurveTo(cx-fw*.2,cy+hh*.8, cx+fw*.2,cy+hh+.5, cx+fw*.7,cy+hh+Math.sin(ff+2)*2*s);
      ctx.stroke();
      break;
    }

    case T.SENTIERO: {
      const pv = hash(r, c, 7);
      // Strada più importante e leggibile: base battuta + bordi consumati.
      ctx.fillStyle = `rgb(${158+pv*18|0},${122+pv*12|0},${68+pv*8|0})`;
      ctx.fill();
      ctx.fillStyle = `rgba(230,190,105,${.28+pv*.1})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy+hh*.16);
      ctx.lineTo(cx+hw*.42, cy+hh);
      ctx.lineTo(cx, cy+hh*1.84);
      ctx.lineTo(cx-hw*.42, cy+hh);
      ctx.closePath(); ctx.fill();
      // solchi paralleli da carro / piedi: più visibili in stile Tropico 2
      ctx.strokeStyle=`rgba(80,52,22,${.42+pv*.16})`; ctx.lineWidth=Math.max(.8,1.25*s);
      ctx.beginPath(); ctx.moveTo(cx-hw*.22,cy+hh*.28); ctx.lineTo(cx-hw*.22,cy+hh*1.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+hw*.22,cy+hh*.28); ctx.lineTo(cx+hw*.22,cy+hh*1.72); ctx.stroke();
      // ghiaia/pietruzze
      for(let i=0;i<4;i++){
        const gx=cx+(hash(r,c,i+700)-.5)*W*.55;
        const gy=cy+hh*.35+hash(r,c,i+710)*hh*1.25;
        ctx.fillStyle=`rgba(75,55,35,${.18+hash(r,c,i+720)*.18})`;
        ctx.beginPath(); ctx.arc(gx,gy,(.7+hash(r,c,i+730)*1.2)*s,0,Math.PI*2); ctx.fill();
      }
      break;
    }

    case T.PALUDE: {
      const mv = hash(r, c, 8);
      ctx.fillStyle = `rgb(${45+mv*15|0},${65+mv*18|0},${35+mv*12|0})`;
      ctx.fill();
      // pozza scura
      const wx=cx+(hash(r,c,200)-.5)*W*.5, wy=cy+hh*.6+hash(r,c,210)*hh*.8;
      ctx.fillStyle=`rgba(20,50,40,${.55+hash(r,c,220)*.2})`;
      ctx.beginPath(); ctx.ellipse(wx,wy,(5+hash(r,c,221)*8)*s,(3+hash(r,c,222)*4)*s,0,0,Math.PI*2); ctx.fill();
      // nebbia
      ctx.fillStyle=`rgba(120,180,120,${.06+mv*.03})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
      ctx.lineTo(cx, cy+H); ctx.lineTo(cx-hw, cy+hh);
      ctx.closePath(); ctx.fill();
      break;
    }

    default:
      ctx.fillStyle = '#222'; ctx.fill();
  }

  // Bordo tile sottile (solo terra/isola)
  if (t !== T.OCEANO && t !== T.BASSO) {
    ctx.strokeStyle = 'rgba(0,0,0,.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

// ── Transizioni biomi (sfumature ai bordi) ──
// Nel sistema iso le transizioni sono gestite direttamente nelle texture del tile.
// Questa funzione è mantenuta per compatibilità ma fa poco in iso vero.
function disegnaTransizioni() {
  // Nell'iso 2:1 le transizioni di bordo sono già nel tile stesso.
  // Per le spiagge aggiungiamo una striscia foam sull'oceano adiacente.
  const s = G.ISO_SCALE;
  const W = G.ISO_W * s, H = G.ISO_H * s;
  for (let r=0; r<G.RIGHE; r++) for (let c=0; c<G.COLS; c++) {
    if (G.mappa[r][c] !== T.SABBIA) continue;
    // Controlla vicini oceano
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if (G.mappa[nr][nc] !== T.OCEANO) continue;
      // Foam sulla spiaggia verso oceano
      const p = isoProj(c, r);
      const cx = p.x, cy = p.y + H/2; // centro tile
      const foam = .15 + Math.sin(frame*.015 + c*.4 + r*.3) * .08;
      ctx.fillStyle = `rgba(255,255,255,${foam})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy+H*.4);
      ctx.lineTo(cx+W*.3*dr, cy+H*.4+H*.2*dc);
      ctx.lineTo(cx, cy+H*.6);
      ctx.closePath(); ctx.fill();
    }
  }
}
// ═══════════════════════════════════════
// MODULO: RENDERER_NATURE
// ═══════════════════════════════════════
// ── ALBERO ISO — palma tropicale con coordinate iso 2:1 ──
// cx,cy = centro tile, s = ISO_SCALE
function disegnaAlberoIso(cx, cy, scala, tinta, palude, s){
  const h = G.ISO_H * scala * s * 2.2; // altezza visiva
  const tx = cx + h*.08;    // base tronco (leggermente a dx per prospettiva)
  const ty = cy;             // base al centro tile

  // Ombra a terra verso SE (stile Tropico 2)
  ctx.save();
  ctx.globalAlpha = .28;
  ctx.fillStyle = '#001a08';
  ctx.beginPath();
  ctx.ellipse(tx + h*.45, ty + h*.2, h*.42, h*.1, .22, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  if (palude){
    ctx.strokeStyle='#5a7040'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx+h*.04, ty-h*.55); ctx.stroke();
    ctx.fillStyle = `rgba(80,120,60,${.55+tinta*.2})`;
    ctx.beginPath(); ctx.ellipse(tx+h*.04, ty-h*.6, h*.2, h*.12, -.2, 0, Math.PI*2); ctx.fill();
    return;
  }

  const hue = 105 + tinta*25;

  // Tronco — curvo verso dx (prospettiva iso)
  const tg = ctx.createLinearGradient(tx-h*.04, ty, tx+h*.06, ty-h*.4);
  tg.addColorStop(0,'#6b4a1e'); tg.addColorStop(.5,'#8a6228'); tg.addColorStop(1,'#5a3810');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(tx - h*.04, ty);
  ctx.quadraticCurveTo(tx+h*.04, ty-h*.2, tx+h*.06, ty-h*.35);
  ctx.quadraticCurveTo(tx+h*.09, ty-h*.35, tx+h*.07, ty-h*.28);
  ctx.quadraticCurveTo(tx+h*.03, ty-h*.1, tx+h*.03, ty);
  ctx.closePath(); ctx.fill();

  // Anelli tronco
  ctx.strokeStyle='rgba(60,35,8,.3)'; ctx.lineWidth=.7*s;
  for (let i=0; i<4; i++){
    const ay = ty - h*(.06+i*.07);
    ctx.beginPath(); ctx.moveTo(tx+h*.02, ay); ctx.lineTo(tx+h*.08, ay+1*s); ctx.stroke();
  }

  // Fronde — 6 foglie proiettate in iso
  const foglie = [
    {a:-0.3, l:h*.72, w:h*.11, dr:-.22},
    {a:0.55,  l:h*.68, w:h*.1,  dr:.18},
    {a:-1.1,  l:h*.6,  w:h*.09, dr:-.14},
    {a:1.3,   l:h*.62, w:h*.09, dr:.16},
    {a:-1.8,  l:h*.54, w:h*.08, dr:-.09},
    {a:2.1,   l:h*.5,  w:h*.08, dr:.11},
  ];
  const frx = tx+h*.07, fry = ty-h*.33;
  for (const f of foglie){
    const ex = frx + Math.cos(f.a)*f.l;
    const ey = fry + Math.sin(f.a)*f.l*.45; // schiacciato in Y per iso
    const lc = ctx.createLinearGradient(frx,fry,ex,ey);
    lc.addColorStop(0,`hsla(${hue+10},72%,${22+tinta*8}%,1)`);
    lc.addColorStop(.5,`hsla(${hue},68%,${28+tinta*10}%,1)`);
    lc.addColorStop(1,`hsla(${hue-8},60%,${20+tinta*6}%,.7)`);
    ctx.fillStyle = lc;
    const wx = Math.cos(f.a+Math.PI/2)*f.w;
    const wy = Math.sin(f.a+Math.PI/2)*f.w*.45;
    const mx = frx+Math.cos(f.a+f.dr)*f.l*.52;
    const my = fry+Math.sin(f.a+f.dr)*f.l*.24;
    ctx.beginPath();
    ctx.moveTo(frx, fry);
    ctx.quadraticCurveTo(mx+wx, my+wy, ex, ey);
    ctx.quadraticCurveTo(mx-wx*.3, my-wy*.3, frx, fry);
    ctx.fill();
    // nervatura
    ctx.strokeStyle=`rgba(${20+tinta*30|0},${80+tinta*20|0},${15+tinta*10|0},.35)`;
    ctx.lineWidth=.6*s;
    ctx.beginPath(); ctx.moveTo(frx,fry); ctx.quadraticCurveTo(mx,my,ex,ey); ctx.stroke();
  }
  // Noce di cocco
  if (tinta>.55){
    ctx.fillStyle='#5a3a10';
    ctx.beginPath(); ctx.arc(frx+2*s,fry+2*s, h*.05, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#7a5020';
    ctx.beginPath(); ctx.arc(frx+s,fry+s, h*.035, 0, Math.PI*2); ctx.fill();
  }
}

// ── ROCCIA ISO ──
function disegnaRocciaIso(cx, cy, scala, s){
  const w = G.ISO_W * scala * s * .45;
  const h = w * .55;
  const rx = cx + w*.15;  // offset verso destra per prospettiva
  const ry = cy - h*.3;

  // Ombra
  ctx.save(); ctx.globalAlpha=.28; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(rx+w*.35, ry+h*.7, w*.62, h*.18, .15, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Corpo principale — 3 facce iso
  // Tetto
  const gr = ctx.createRadialGradient(rx-w*.2,ry-h*.25,h*.04,rx,ry,w);
  gr.addColorStop(0,'#a09070'); gr.addColorStop(.4,'#756550'); gr.addColorStop(.8,'#504535'); gr.addColorStop(1,'#302820');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(rx, ry, w, h*.55, -.15, 0, Math.PI*2); ctx.fill();

  // Faccia S (più chiara)
  ctx.fillStyle='rgba(180,160,120,.25)';
  ctx.beginPath();
  ctx.moveTo(rx-w*.5, ry+h*.2);
  ctx.lineTo(rx+w*.5, ry+h*.2);
  ctx.lineTo(rx+w*.4, ry+h*.55);
  ctx.lineTo(rx-w*.4, ry+h*.55);
  ctx.closePath(); ctx.fill();

  // Highlight NW
  ctx.strokeStyle='rgba(255,240,200,.18)'; ctx.lineWidth=s;
  ctx.beginPath(); ctx.moveTo(rx-w*.4,ry-h*.2); ctx.quadraticCurveTo(rx-w*.1,ry-h*.4,rx+w*.1,ry-h*.18); ctx.stroke();

  // Bordo scuro base
  ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1.2*s;
  ctx.beginPath(); ctx.ellipse(rx, ry, w, h*.55, -.15, Math.PI*.1, Math.PI*.9); ctx.stroke();
}
// ═══════════════════════════════════════
// MODULO: RENDERER_ISO
// ═══════════════════════════════════════
// ══════════════════════════════════════════════════════
// HELPER ISOMETRICO — prospettiva stile Tropico 2
// Luce da nord-ovest (alto-sinistra)
// Facciata SUD = più chiara, lato EST = in ombra
// ══════════════════════════════════════════════════════

// Disegna un parallelepipedo isometrico (base + facciata sud + lato est)
// bx,by = angolo in basso al centro del tile (punto di ancoraggio)
// w = larghezza, d = profondità, h = altezza (in pixel)
// colTop, colFront, colSide = colori delle tre facce
function isoBox(bx,by,w,d,h,colTop,colFront,colSide){
  // Proiezione isometrica semplificata (2:1)
  // angolo base in basso-centro
  const ox=w/2, oz=d/2;
  // 4 vertici della base
  const pts={
    //      x                    y
    nw:[bx-ox,          by-oz*.5-h],   // angolo nord-ovest in alto
    ne:[bx+ox,          by-oz*.5-h],   // angolo nord-est in alto
    se:[bx+ox,          by+oz*.5-h],   // angolo sud-est in alto
    sw:[bx-ox,          by+oz*.5-h],   // angolo sud-ovest in alto
    // basso (y += h)
    bnw:[bx-ox,         by-oz*.5],
    bne:[bx+ox,         by-oz*.5],
    bse:[bx+ox,         by+oz*.5],
    bsw:[bx-ox,         by+oz*.5],
  };

  // Tetto (top)
  ctx.fillStyle=colTop;
  ctx.beginPath();
  ctx.moveTo(pts.nw[0],pts.nw[1]);
  ctx.lineTo(pts.ne[0],pts.ne[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.sw[0],pts.sw[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.6;ctx.stroke();

  // Facciata sud (fronte — più chiara)
  ctx.fillStyle=colFront;
  ctx.beginPath();
  ctx.moveTo(pts.sw[0],pts.sw[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.bse[0],pts.bse[1]);
  ctx.lineTo(pts.bsw[0],pts.bsw[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.7;ctx.stroke();

  // Lato est (in ombra — più scuro)
  ctx.fillStyle=colSide;
  ctx.beginPath();
  ctx.moveTo(pts.ne[0],pts.ne[1]);
  ctx.lineTo(pts.se[0],pts.se[1]);
  ctx.lineTo(pts.bse[0],pts.bse[1]);
  ctx.lineTo(pts.bne[0],pts.bne[1]);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=.7;ctx.stroke();
}

// Ombra proiettata a terra verso sud-est
function isoShadow(bx,by,w,d){
  ctx.save();
  ctx.globalAlpha=.18;
  ctx.fillStyle='#000';
  ctx.beginPath();
  ctx.ellipse(bx+w*.18,by+d*.28,w*.45,d*.22,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// Tetto a spiovente isometrico (triangolare)
function isoRoof(bx,by,w,d,hBase,hPeak,colLeft,colRight,colFront){
  const ox=w/2, oz=d/2;
  const baseY=by-hBase;
  // Ridge (cresta) al centro
  const rx=bx, ry=baseY-hPeak;
  // Falda sinistra (nord-ovest → ridge)
  ctx.fillStyle=colLeft;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY-oz*.5);
  ctx.lineTo(bx+ox,baseY-oz*.5);
  ctx.lineTo(rx,ry-oz*.5);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=.6;ctx.stroke();
  // Falda destra (sud-est → ridge)
  ctx.fillStyle=colRight;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY+oz*.5);
  ctx.lineTo(bx+ox,baseY+oz*.5);
  ctx.lineTo(rx,ry+oz*.5);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=.6;ctx.stroke();
  // Frontone sud
  ctx.fillStyle=colFront;
  ctx.beginPath();
  ctx.moveTo(bx-ox,baseY+oz*.5);
  ctx.lineTo(bx+ox,baseY+oz*.5);
  ctx.lineTo(rx,ry+oz*.5);
  ctx.closePath();ctx.fill();
}

// Finestra isometrica su facciata sud
function isoWindow(bx,by,lit,sz){
  sz=sz||8; // dimensione finestra scalabile
  const w=sz,h=sz*.88;
  ctx.fillStyle=lit?'rgba(255,220,100,.9)':'rgba(80,100,120,.6)';
  ctx.fillRect(bx-w/2,by-h,w,h);
  ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.8;ctx.strokeRect(bx-w/2,by-h,w,h);
  if(lit){
    ctx.fillStyle='rgba(255,200,60,.15)';
    ctx.fillRect(bx-w/2-2,by-h-2,w+4,h+3);
    ctx.strokeStyle='rgba(100,60,0,.5)';ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(bx,by-h);ctx.lineTo(bx,by);ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx-w/2,by-h/2);ctx.lineTo(bx+w/2,by-h/2);ctx.stroke();
  }
}
// ═══════════════════════════════════════
// MODULO: RENDERER_BUILDINGS
// ═══════════════════════════════════════
// ── disegna edificio — isometrico stile Tropico 2 ──
// cx,cy = centro tile iso (da isoProj), s = ISO_SCALE
function disegnaEdificio(tipo,cx,cy,s){
  s = s || G.ISO_SCALE;
  const S = G.ISO_H * s * 1.8;  // unità di scala edificio
  // Punto di ancoraggio: centro-basso del tile iso
  const bx = cx;
  const by = cy + G.ISO_H * s * .5;
  ctx.save();
  isoShadow(bx,by,S*.55,S*.28);

  switch(tipo){

    case 'governatore':{
      // Palazzo del Governatore: punto di partenza stile Tropico 2
      const w=S*.68,d=S*.42,h=S*.42;
      // basamento e scalinata
      isoBox(bx,by+S*.05,S*.76,S*.48,S*.10,'#8a7050','#a88a60','#6a5038');
      for(let i=0;i<3;i++){
        isoBox(bx,by+S*(.11+i*.045),S*(.58-i*.08),S*.08,S*.035,'#9a8058','#c0a070','#6a5038');
      }
      // corpo principale
      isoBox(bx,by-S*.02,w,d,h,'#d8c090','#ead6a2','#9f8358');
      // ali laterali
      isoBox(bx-S*.42,by+S*.02,S*.28,S*.28,S*.28,'#c8a870','#e0c48a','#8a7048');
      isoBox(bx+S*.42,by+S*.02,S*.28,S*.28,S*.28,'#c8a870','#e0c48a','#8a7048');
      // tetti rossi coloniali
      isoRoof(bx,by-S*.44,w,d,0,S*.22,'#9a3018','#7a2010','#b84420');
      isoRoof(bx-S*.42,by-S*.26,S*.28,S*.28,0,S*.16,'#8a2816','#6a180c','#a03820');
      isoRoof(bx+S*.42,by-S*.26,S*.28,S*.28,0,S*.16,'#8a2816','#6a180c','#a03820');
      // colonne
      for(let i=-2;i<=2;i++){
        const x=bx+i*S*.105;
        ctx.fillStyle='#f0e2b8';
        ctx.fillRect(x-S*.018,by-S*.35,S*.036,S*.32);
        ctx.strokeStyle='rgba(90,60,25,.35)';ctx.lineWidth=.7;ctx.strokeRect(x-S*.018,by-S*.35,S*.036,S*.32);
      }
      // balcone e porta
      ctx.fillStyle='#5a3010';
      ctx.fillRect(bx-S*.08,by-S*.18,S*.16,S*.19);
      ctx.beginPath();ctx.arc(bx,by-S*.18,S*.08,Math.PI,0,false);ctx.fill();
      ctx.fillStyle='#3a2008';
      ctx.fillRect(bx-S*.18,by-S*.42,S*.36,S*.06);
      ctx.strokeStyle='#c8a040';ctx.lineWidth=1.2;
      for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(bx+i*S*.05,by-S*.42);ctx.lineTo(bx+i*S*.05,by-S*.35);ctx.stroke();}
      // finestre
      isoWindow(bx-S*.24,by-S*.25,true,S*.11);
      isoWindow(bx+S*.24,by-S*.25,true,S*.11);
      isoWindow(bx-S*.42,by-S*.16,true,S*.09);
      isoWindow(bx+S*.42,by-S*.16,true,S*.09);
      // bandiera pirata sopra il palazzo
      ctx.strokeStyle='#6a4010';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(bx,by-S*.72);ctx.lineTo(bx,by-S*.48);ctx.stroke();
      ctx.fillStyle='#0a0a0a';
      ctx.beginPath();ctx.moveTo(bx,by-S*.72);ctx.lineTo(bx+S*.18,by-S*.66+Math.sin(frame*.08)*S*.025);ctx.lineTo(bx,by-S*.60);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.85)';ctx.font=`${S*.09}px serif`;ctx.textAlign='center';ctx.fillText('☠',bx+S*.08,by-S*.64);
      break;
    }

    case 'taverna':{
      const w=S*.56,d=S*.32,h=S*.28;
      // corpo
      isoBox(bx,by,w,d,h,'#7a4a1a','#b87030','#7a4218');
      // tetto spiovente rosso mattone
      isoRoof(bx,by-h,w,d,0,S*.22,'#8a3010','#6a2008','#9a3818');
      // finestre sulla facciata
      isoWindow(bx-S*.1,by-h-S*.02,true);
      isoWindow(bx+S*.1,by-h-S*.02,true);
      // porta
      ctx.fillStyle='#2a1008';
      ctx.fillRect(bx-S*.07,by-h+1,S*.14,S*.12);
      ctx.beginPath();ctx.arc(bx,by-h+1,S*.07,Math.PI,0,false);ctx.fill();
      // insegna
      ctx.fillStyle='#c87820';
      ctx.fillRect(bx-S*.12,by-h-S*.18,S*.24,S*.08);
      ctx.strokeStyle='#8a4a00';ctx.lineWidth=1;ctx.strokeRect(bx-S*.12,by-h-S*.18,S*.24,S*.08);
      ctx.fillStyle='var(--oro)';ctx.font=`bold ${S*.1}px serif`;
      ctx.textAlign='center';ctx.fillText('🍺',bx,by-h-S*.12);
      break;
    }

    case 'porto':
    case 'cantiere':{
      // molo in legno
      ctx.fillStyle='#6a4a1a';
      ctx.beginPath();
      ctx.moveTo(bx-S*.4,by);ctx.lineTo(bx+S*.4,by);
      ctx.lineTo(bx+S*.4,by-S*.08);ctx.lineTo(bx-S*.4,by-S*.08);
      ctx.closePath();ctx.fill();
      // acqua nel bacino
      ctx.fillStyle=`hsl(195,65%,${30+Math.sin(frame*.04)*3}%)`;
      ctx.fillRect(bx-S*.3,by-S*.32,S*.6,S*.26);
      // scafo nave nel bacino (vista iso)
      ctx.fillStyle='#5c3a1a';
      ctx.beginPath();ctx.ellipse(bx,by-S*.22,S*.22,S*.07,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3a2008';ctx.lineWidth=1.5;ctx.stroke();
      // albero maestro
      ctx.strokeStyle='#8a6020';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(bx,by-S*.22);ctx.lineTo(bx,by-S*.62);ctx.stroke();
      // vela ammainata
      ctx.fillStyle='rgba(240,220,170,.8)';
      ctx.beginPath();ctx.moveTo(bx,by-S*.58);ctx.lineTo(bx+S*.18,by-S*.42);ctx.lineTo(bx,by-S*.28);ctx.fill();
      // gru/argano
      isoBox(bx+S*.3,by-S*.06,S*.12,S*.1,S*.36,'#9a7030','#c89040','#7a5018');
      ctx.strokeStyle='#6a4010';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(bx+S*.3,by-S*.42);ctx.lineTo(bx+S*.05,by-S*.25);ctx.stroke();
      break;
    }

    case 'fortezza':{
      // torre centrale
      isoBox(bx,by,S*.42,S*.28,S*.52,'#8a7a5a','#a09060','#6a5a3a');
      // merlature
      for(let i=-1;i<=1;i++){
        isoBox(bx+i*S*.12,by-S*.52,S*.09,S*.08,S*.1,'#9a8a68','#b0a078','#7a6a48');
      }
      // torri angolari
      isoBox(bx-S*.28,by-S*.04,S*.18,S*.14,S*.4,'#7a6a4a','#948a5a','#6a5a38');
      isoBox(bx+S*.28,by-S*.04,S*.18,S*.14,S*.4,'#7a6a4a','#948a5a','#6a5a38');
      // portone ad arco
      ctx.fillStyle='#1a0e06';
      ctx.beginPath();ctx.arc(bx,by-S*.18,S*.09,Math.PI,0,false);
      ctx.lineTo(bx+S*.09,by+2);ctx.lineTo(bx-S*.09,by+2);ctx.closePath();ctx.fill();
      // bandiera
      ctx.strokeStyle='#8a6020';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(bx,by-S*.62);ctx.lineTo(bx,by-S*.52);ctx.stroke();
      ctx.fillStyle='var(--rum-chiaro)';
      ctx.beginPath();ctx.moveTo(bx,by-S*.62);ctx.lineTo(bx+S*.12,by-S*.58);ctx.lineTo(bx,by-S*.54);ctx.fill();
      break;
    }

    case 'fattoria':{
      // campi coltivati (strisce iso intorno alla capanna)
      for(let i=0;i<4;i++){
        ctx.fillStyle=i%2===0?'#5a8a28':'#4a7a1e';
        ctx.fillRect(bx-S*.5+i*S*.25,by-S*.1,S*.24,S*.18);
      }
      // capanna
      isoBox(bx-S*.12,by-S*.28,S*.32,S*.2,S*.2,'#8a6a2a','#a07e36','#6a4e18');
      isoRoof(bx-S*.12,by-S*.28-S*.2,S*.32,S*.2,0,S*.15,'#a04a10','#7a3208','#b05018');
      // spaventapasseri
      ctx.strokeStyle='#7a5020';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(bx+S*.2,by-S*.12);ctx.lineTo(bx+S*.2,by-S*.38);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx+S*.08,by-S*.3);ctx.lineTo(bx+S*.32,by-S*.3);ctx.stroke();
      ctx.fillStyle='#c8a060';ctx.beginPath();ctx.arc(bx+S*.2,by-S*.42,S*.06,0,Math.PI*2);ctx.fill();
      break;
    }

    case 'distilleria':{
      isoBox(bx,by,S*.44,S*.28,S*.32,'#6a5838','#8a7248','#5a4828');
      // ciminiera fumante
      isoBox(bx+S*.12,by-S*.32,S*.1,S*.08,S*.28,'#3a3028','#4a4038','#2a2820');
      for(let i=0;i<3;i++){
        const fy=by-S*.62-i*S*.08-Math.sin(frame*.05+i*1.2)*S*.03;
        ctx.globalAlpha=.3-i*.08;
        ctx.fillStyle='#c8c0b0';
        ctx.beginPath();ctx.arc(bx+S*.12,fy,S*(.04+i*.025),0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      isoRoof(bx,by-S*.32,S*.44,S*.28,0,S*.16,'#4a3820','#3a2810','#5a4828');
      // botti ISO
      for(let i=0;i<3;i++){
        isoBox(bx-S*.28+i*S*.18,by+S*.02,S*.14,S*.1,S*.14,'#7a4a18','#9a6228','#5a3210');
        ctx.strokeStyle='#4a2808';ctx.lineWidth=1;
        ctx.strokeRect(bx-S*.28+i*S*.18-S*.07,by-S*.14+S*.02,S*.14,S*.04);
      }
      break;
    }

    case 'segheria':{
      // tronchi impilati (ISO)
      for(let i=0;i<3;i++){
        const logX=bx-S*.22+i*S*.18;
        isoBox(logX,by-i*S*.06,S*.16,S*.12,S*.1+i*.02,'#9a6828','#b07e38','#7a4e18');
        // anello tronco
        ctx.strokeStyle='#5a3010';ctx.lineWidth=.8;
        ctx.beginPath();ctx.ellipse(logX-S*.08,by-i*S*.06-S*.05,S*.04,S*.04*.5,0,0,Math.PI*2);ctx.stroke();
      }
      // capannone
      isoBox(bx+S*.14,by-S*.06,S*.28,S*.2,S*.3,'#a07840','#c09050','#7a5828');
      isoRoof(bx+S*.14,by-S*.06-S*.3,S*.28,S*.2,0,S*.16,'#6a4820','#4a3010','#7a5828');
      // lama sega (lucida)
      ctx.fillStyle='#d0d0d8';
      ctx.fillRect(bx-S*.02,by-S*.18,S*.22,S*.04);
      ctx.fillStyle='rgba(200,220,255,.4)';
      ctx.fillRect(bx-S*.02,by-S*.18,S*.22,S*.02);
      break;
    }

    case 'caserma':{
      // edificio militare
      isoBox(bx,by,S*.5,S*.3,S*.34,'#7a7050','#9a9068','#5a5038');
      // tetto piatto con parapetto
      isoBox(bx,by-S*.34,S*.52,S*.32,S*.06,'#5a5438','#6a6448','#4a4428');
      // merlature
      for(let i=-2;i<=2;i++){
        isoBox(bx+i*S*.1,by-S*.4,S*.07,S*.05,S*.07,'#6a6448','#7a7458','#5a5438');
      }
      // portone
      ctx.fillStyle='#1a1208';
      ctx.fillRect(bx-S*.09,by-S*.18,S*.18,S*.19);
      ctx.beginPath();ctx.arc(bx,by-S*.18,S*.09,Math.PI,0,false);ctx.fill();
      // finestre con sbarre
      isoWindow(bx-S*.18,by-S*.26,false);
      isoWindow(bx+S*.18,by-S*.26,false);
      ctx.strokeStyle='#888';ctx.lineWidth=.8;
      for(let b=0;b<3;b++){
        ctx.beginPath();ctx.moveTo(bx-S*.22+b*S*.04,by-S*.32);ctx.lineTo(bx-S*.22+b*S*.04,by-S*.2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(bx+S*.14+b*S*.04,by-S*.32);ctx.lineTo(bx+S*.14+b*S*.04,by-S*.2);ctx.stroke();
      }
      // bandiera militare
      ctx.strokeStyle='#6a5020';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(bx,by-S*.48);ctx.lineTo(bx,by-S*.4);ctx.stroke();
      ctx.fillStyle='#c83020';
      ctx.beginPath();ctx.moveTo(bx,by-S*.48);ctx.lineTo(bx+S*.1,by-S*.44);ctx.lineTo(bx,by-S*.4);ctx.fill();
      break;
    }

    case 'osservatorio':{
      // base cilindrica
      ctx.fillStyle='#8a7858';
      ctx.beginPath();ctx.ellipse(bx,by-S*.06,S*.22,S*.1,0,0,Math.PI*2);ctx.fill();
      // torre rotonda (iso approssimata)
      isoBox(bx,by-S*.06,S*.3,S*.22,S*.44,'#9a8868','#b8a478','#7a6848');
      // cupola blu
      ctx.fillStyle='#2a5080';
      ctx.beginPath();ctx.ellipse(bx,by-S*.5,S*.18,S*.09,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(bx-S*.04,by-S*.56,S*.16,S*.14,0,Math.PI,Math.PI*2,true);ctx.fill();
      ctx.strokeStyle='#1a3a60';ctx.lineWidth=1.2;ctx.stroke();
      // riflesso cupola
      ctx.fillStyle='rgba(180,220,255,.2)';
      ctx.beginPath();ctx.ellipse(bx-S*.06,by-S*.6,S*.06,S*.08,-.3,0,Math.PI);ctx.fill();
      // cannocchiale
      ctx.strokeStyle='#8a7050';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(bx-S*.06,by-S*.5);ctx.lineTo(bx+S*.24,by-S*.62);ctx.stroke();
      ctx.fillStyle='#6a5038';ctx.beginPath();ctx.arc(bx+S*.24,by-S*.62,S*.04,0,Math.PI*2);ctx.fill();
      // stelle animate
      const starA=.5+Math.sin(frame*.06)*.4;
      ctx.fillStyle=`rgba(200,220,255,${starA})`;
      ctx.beginPath();ctx.arc(bx-S*.14,by-S*.08,S*.025,0,Math.PI*2);ctx.fill();
      break;
    }

    case 'prigione':{
      // edificio basso oppressivo
      isoBox(bx,by,S*.48,S*.3,S*.28,'#4a4438','#5e5848','#3a3428');
      isoBox(bx,by-S*.28,S*.5,S*.32,S*.05,'#3a3428','#4a4438','#2a2820');
      // celle con sbarre (3)
      for(let c=-1;c<=1;c++){
        const cx2=bx+c*S*.14;
        ctx.fillStyle='rgba(0,0,0,.6)';
        ctx.fillRect(cx2-S*.04,by-S*.28,S*.08,S*.22);
        ctx.strokeStyle='#9a9888';ctx.lineWidth=1.5;
        for(let b=0;b<3;b++){
          ctx.beginPath();
          ctx.moveTo(cx2-S*.04+b*S*.04,by-S*.28);
          ctx.lineTo(cx2-S*.04+b*S*.04,by-S*.06);ctx.stroke();
        }
      }
      // portone pesante
      ctx.fillStyle='#1a1510';
      ctx.fillRect(bx-S*.09,by-S*.22,S*.18,S*.23);
      // catena
      ctx.strokeStyle='#888878';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(bx,by-S*.14,S*.04,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx-S*.04,by-S*.1);ctx.lineTo(bx+S*.04,by-S*.1);ctx.stroke();
      break;
    }

    case 'mercatonero':{
      // tenda principale colorata
      ctx.fillStyle='#8a1818';
      ctx.beginPath();
      ctx.moveTo(bx-S*.3,by-S*.04);
      ctx.lineTo(bx,by-S*.44);
      ctx.lineTo(bx+S*.3,by-S*.04);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle='#c02020';ctx.lineWidth=1;ctx.stroke();
      // ombra tenda sinistra
      ctx.fillStyle='#6a0808';
      ctx.beginPath();
      ctx.moveTo(bx-S*.3,by-S*.04);
      ctx.lineTo(bx,by-S*.44);
      ctx.lineTo(bx,by-S*.04);
      ctx.closePath();ctx.fill();
      // bandierine
      ctx.strokeStyle='#f0c040';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx-S*.26,by-S*.12);ctx.lineTo(bx+S*.26,by-S*.12);ctx.stroke();
      for(let i=0;i<5;i++){
        ctx.fillStyle=i%2===0?'#f0c040':'#c03030';
        ctx.beginPath();
        ctx.moveTo(bx-S*.26+i*S*.13,by-S*.12);
        ctx.lineTo(bx-S*.2+i*S*.13,by-S*.04);
        ctx.lineTo(bx-S*.14+i*S*.13,by-S*.12);
        ctx.closePath();ctx.fill();
      }
      // bancarelle sotto
      isoBox(bx-S*.2,by+S*.02,S*.2,S*.14,S*.1,'#9a7228','#b88a38','#7a5218');
      isoBox(bx+S*.2,by+S*.02,S*.2,S*.14,S*.1,'#7a5a18','#9a7028','#5a3e10');
      // monete
      ctx.fillStyle='#f0c040';ctx.beginPath();ctx.arc(bx-S*.2,by-S*.1,S*.04,0,Math.PI*2);ctx.fill();
      break;
    }

    case 'casapirata':{
      isoBox(bx,by,S*.38,S*.24,S*.22,'#9a7040','#c09050','#7a5020');
      isoRoof(bx,by-S*.22,S*.38,S*.24,0,S*.18,'#8a2020','#6a1010','#9a2828');
      isoWindow(bx-S*.1,by-S*.18,true);
      // porta
      ctx.fillStyle='#3a1e08';
      ctx.fillRect(bx-S*.06,by-S*.12,S*.12,S*.13);
      ctx.beginPath();ctx.arc(bx,by-S*.12,S*.06,Math.PI,0,false);ctx.fill();
      // amaca fuori
      ctx.strokeStyle='#c8a060';ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(bx+S*.18,by-S*.12);
      ctx.quadraticCurveTo(bx+S*.28,by-S*.04,bx+S*.36,by-S*.12);
      ctx.stroke();
      ctx.fillStyle='rgba(200,160,80,.6)';ctx.fill();
      break;
    }

    case 'bordello':{
      isoBox(bx,by,S*.44,S*.28,S*.28,'#6a1a3a','#9a2858','#4a1028');
      isoRoof(bx,by-S*.28,S*.44,S*.28,0,S*.18,'#8a1848','#6a1030','#a82060');
      // finestre illuminate rosa
      isoWindow(bx-S*.12,by-S*.24,true);
      isoWindow(bx+S*.12,by-S*.24,true);
      // tendaggi colorati
      ctx.fillStyle='rgba(200,80,140,.5)';
      ctx.fillRect(bx-S*.16,by-S*.28,S*.1,S*.08);
      ctx.fillRect(bx+S*.06,by-S*.28,S*.1,S*.08);
      // insegna cuore
      ctx.fillStyle='#ff4488';ctx.font=`${S*.18}px serif`;
      ctx.textAlign='center';ctx.fillText('♥',bx,by-S*.38);
      // porta
      ctx.fillStyle='#2a0818';
      ctx.fillRect(bx-S*.07,by-S*.14,S*.14,S*.15);
      ctx.beginPath();ctx.arc(bx,by-S*.14,S*.07,Math.PI,0,false);ctx.fill();
      break;
    }

    case 'arena':{
      // struttura circolare/ovale
      ctx.fillStyle='#8a7a50';
      ctx.beginPath();ctx.ellipse(bx,by-S*.06,S*.36,S*.2,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#6a5a38';ctx.lineWidth=2;ctx.stroke();
      // sabbia interna
      ctx.fillStyle='#c8a060';
      ctx.beginPath();ctx.ellipse(bx,by-S*.08,S*.26,S*.14,0,0,Math.PI*2);ctx.fill();
      // gradinate (anelli)
      for(let i=1;i<=3;i++){
        ctx.strokeStyle=`rgba(100,80,40,${.3+i*.1})`;ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(bx,by-S*.06,S*(.28+i*.04),S*(.15+i*.02),0,0,Math.PI*2);ctx.stroke();
      }
      // spade incrociate al centro
      ctx.strokeStyle='#c0c0c8';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(bx-S*.08,by-S*.16);ctx.lineTo(bx+S*.08,by-S*.0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx+S*.08,by-S*.16);ctx.lineTo(bx-S*.08,by-S*.0);ctx.stroke();
      // muri perimetrali (iso)
      isoBox(bx,by-S*.18,S*.68,S*.04,S*.12,'#7a6a40','#9a8a58','#5a4e28');
      break;
    }

    case 'cantastorie':{
      // palco con sipari
      isoBox(bx,by+S*.02,S*.46,S*.28,S*.12,'#7a5a20','#9a7230','#5a4010');
      // montanti sipario
      isoBox(bx-S*.26,by-S*.1,S*.08,S*.06,S*.38,'#5a3a10','#7a5020','#3a2008');
      isoBox(bx+S*.26,by-S*.1,S*.08,S*.06,S*.38,'#5a3a10','#7a5020','#3a2008');
      // sipari rossi
      ctx.fillStyle='#8a1a1a';
      ctx.beginPath();ctx.moveTo(bx-S*.26,by-S*.48);ctx.lineTo(bx-S*.04,by-S*.48);ctx.lineTo(bx-S*.1,by-S*.1);ctx.lineTo(bx-S*.26,by-S*.1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#8a1a1a';
      ctx.beginPath();ctx.moveTo(bx+S*.26,by-S*.48);ctx.lineTo(bx+S*.04,by-S*.48);ctx.lineTo(bx+S*.1,by-S*.1);ctx.lineTo(bx+S*.26,by-S*.1);ctx.closePath();ctx.fill();
      // frange oro
      ctx.strokeStyle='#f0c040';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(bx-S*.28,by-S*.48);ctx.lineTo(bx+S*.28,by-S*.48);ctx.stroke();
      // figurina
      ctx.fillStyle='#c8a06e';ctx.beginPath();ctx.arc(bx,by-S*.22,S*.07,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2a1a0a';ctx.beginPath();ctx.ellipse(bx,by-S*.12,S*.05,S*.08,0,0,Math.PI*2);ctx.fill();
      // note musicali flottanti
      ctx.fillStyle='rgba(240,192,64,.75)';ctx.font=`${S*.18}px serif`;
      ctx.textAlign='center';
      ctx.fillText('♪',bx-S*.18,by-S*.32+Math.sin(frame*.06)*3);
      ctx.fillText('♫',bx+S*.18,by-S*.38+Math.sin(frame*.06+1)*3);
      break;
    }

    case 'cappella':{
      // corpo bianco
      isoBox(bx,by,S*.34,S*.22,S*.3,'#e0d8c8','#f0e8d8','#c0b8a8');
      // tetto triangolare
      isoRoof(bx,by-S*.3,S*.34,S*.22,0,S*.22,'#9a8a60','#7a6a48','#b09870');
      // campanile
      isoBox(bx,by-S*.3,S*.14,S*.1,S*.26,'#d8d0c0','#e8e0d0','#b8b0a0');
      isoRoof(bx,by-S*.56,S*.14,S*.1,0,S*.16,'#9a8a60','#7a6a48','#b09870');
      // croce dorata
      ctx.strokeStyle='#c8a020';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(bx,by-S*.72);ctx.lineTo(bx,by-S*.56);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx-S*.06,by-S*.66);ctx.lineTo(bx+S*.06,by-S*.66);ctx.stroke();
      // vetrata
      ctx.fillStyle='rgba(100,150,255,.55)';
      ctx.beginPath();ctx.arc(bx,by-S*.18,S*.07,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,220,80,.7)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,by-S*.25);ctx.lineTo(bx,by-S*.11);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx-S*.07,by-S*.18);ctx.lineTo(bx+S*.07,by-S*.18);ctx.stroke();
      // porta ad arco
      ctx.fillStyle='#5c3a1a';
      ctx.fillRect(bx-S*.06,by-S*.12,S*.12,S*.13);
      ctx.beginPath();ctx.arc(bx,by-S*.12,S*.06,Math.PI,0,false);ctx.fill();
      break;
    }

    case 'infermeria':{
      isoBox(bx,by,S*.42,S*.26,S*.28,'#e8e8e8','#f5f5f5','#d0d0d0');
      isoBox(bx,by-S*.28,S*.44,S*.28,S*.06,'#5a6a7a','#6a7a8a','#4a5a6a');
      // croce rossa grande
      ctx.fillStyle='#cc2222';
      ctx.fillRect(bx-S*.05,by-S*.34,S*.1,S*.24);
      ctx.fillRect(bx-S*.14,by-S*.28,S*.28,S*.1);
      // finestre
      isoWindow(bx-S*.14,by-S*.2,true);
      isoWindow(bx+S*.14,by-S*.2,true);
      // porta
      ctx.fillStyle='#4a3a2a';ctx.fillRect(bx-S*.07,by-S*.14,S*.14,S*.15);
      // barella fuori
      ctx.strokeStyle='#9a8a60';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(bx-S*.26,by-S*.06);ctx.lineTo(bx-S*.12,by-S*.06);ctx.stroke();
      ctx.fillStyle='#e8d8b8';ctx.fillRect(bx-S*.25,by-S*.1,S*.13,S*.07);
      break;
    }

    case 'bagni':{
      isoBox(bx,by,S*.4,S*.26,S*.24,'#4a6a8a','#5a7a9a','#3a5a7a');
      isoRoof(bx,by-S*.24,S*.4,S*.26,0,S*.1,'#3a4a6a','#2a3a5a','#4a5a7a');
      // vasche (2 ellissi azzurre in prospettiva)
      ctx.fillStyle=`rgba(80,180,220,${.7+Math.sin(frame*.04)*.08})`;
      ctx.beginPath();ctx.ellipse(bx-S*.1,by-S*.1,S*.12,S*.06,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(bx+S*.1,by-S*.1,S*.12,S*.06,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(200,240,255,.8)';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(bx-S*.1,by-S*.1,S*.08,S*.04,0,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.ellipse(bx+S*.1,by-S*.1,S*.08,S*.04,0,0,Math.PI*2);ctx.stroke();
      // vapore animato
      for(let i=0;i<3;i++){
        const vx=bx-S*.15+i*S*.15;
        const vy=by-S*.18-Math.sin(frame*.05+i)*S*.04;
        ctx.fillStyle=`rgba(200,240,255,${.15+Math.sin(frame*.04+i)*.05})`;
        ctx.beginPath();ctx.arc(vx,vy,S*.04,0,Math.PI*2);ctx.fill();
      }
      break;
    }

    case 'guardia':{
      // base larga
      isoBox(bx,by,S*.28,S*.2,S*.14,'#6a6050','#8a7a60','#4a4838');
      // torre alta
      isoBox(bx,by-S*.14,S*.2,S*.14,S*.52,'#7a7060','#9a9078','#5a5848');
      // merlature
      for(let i=-1;i<=1;i++){
        isoBox(bx+i*S*.07,by-S*.66,S*.05,S*.04,S*.08,'#8a8068','#a09880','#6a6858');
      }
      // ballatoio
      isoBox(bx,by-S*.44,S*.26,S*.18,S*.04,'#7a7060','#8a8070','#5a5848');
      // luce faro rotante
      const luceA=.5+Math.sin(frame*.08)*.45;
      ctx.fillStyle=`rgba(255,220,100,${luceA})`;
      ctx.beginPath();ctx.arc(bx,by-S*.68,S*.07,0,Math.PI*2);ctx.fill();
      // raggio faro
      const ang=(frame*.03)%(Math.PI*2);
      ctx.save();ctx.globalAlpha=luceA*.25;
      ctx.strokeStyle='rgba(255,220,100,1)';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(bx,by-S*.68);
      ctx.lineTo(bx+Math.cos(ang)*S*.9,by-S*.68+Math.sin(ang)*S*.4);ctx.stroke();
      ctx.restore();
      // feritoie
      ctx.fillStyle='rgba(0,0,0,.7)';
      ctx.fillRect(bx-S*.04,by-S*.4,S*.08,S*.12);
      ctx.fillRect(bx-S*.1,by-S*.36,S*.2,S*.04);
      break;
    }

    case 'sarto':{
      isoBox(bx,by,S*.36,S*.22,S*.26,'#9a7a4a','#c09860','#7a5a28');
      isoRoof(bx,by-S*.26,S*.36,S*.22,0,S*.18,'#3a2a10','#2a1a08','#4a3818');
      ctx.strokeStyle='#f0c040';ctx.lineWidth=1;
      // vetrina con manichino
      ctx.fillStyle='rgba(200,220,240,.35)';
      ctx.fillRect(bx-S*.16,by-S*.28,S*.14,S*.2);
      ctx.strokeStyle='#8a6a30';ctx.lineWidth=1.2;ctx.strokeRect(bx-S*.16,by-S*.28,S*.14,S*.2);
      // manichino
      ctx.fillStyle='#c8a060';ctx.beginPath();ctx.arc(bx-S*.09,by-S*.28,S*.05,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a3a8a';ctx.beginPath();ctx.ellipse(bx-S*.09,by-S*.2,S*.06,S*.08,0,0,Math.PI*2);ctx.fill();
      // stoffe colorate
      ctx.fillStyle='#c03050';ctx.fillRect(bx+S*.02,by-S*.28,S*.06,S*.2);
      ctx.fillStyle='#20608a';ctx.fillRect(bx+S*.1,by-S*.28,S*.06,S*.2);
      // porta
      ctx.fillStyle='#2a1a08';ctx.fillRect(bx-S*.06,by-S*.12,S*.12,S*.13);
      ctx.beginPath();ctx.arc(bx,by-S*.12,S*.06,Math.PI,0,false);ctx.fill();
      // insegna forbici
      ctx.fillStyle='#f0c040';ctx.font=`${S*.16}px serif`;
      ctx.textAlign='center';ctx.fillText('✂',bx+S*.14,by-S*.36);
      break;
    }

    case 'osservatorio': // già gestito sopra ma fallback
    default:{
      // edificio generico iso
      isoBox(bx,by,S*.36,S*.22,S*.22,'#6b5530','#8a7040','#4a3818');
      isoRoof(bx,by-S*.22,S*.36,S*.22,0,S*.14,'#4a3010','#3a2008','#5a3c18');
      isoWindow(bx,by-S*.18,true);
      ctx.fillStyle='rgba(240,192,64,.5)';ctx.font=`${S*.22}px serif`;
      ctx.textAlign='center';ctx.fillText(ED[tipo]?.icona||'🏠',bx,by-S*.36);
    }
  }
  ctx.restore();
}
// ═══════════════════════════════════════
// MODULO: RENDERER_UNITS
// ═══════════════════════════════════════
// ── NAVE ISO — sciabecco piratesco ──
function disegnaNav(sx, sy, colore, s){
  s = s || G.ISO_SCALE;
  ctx.save();
  ctx.translate(sx, sy);
  const sc = G.ISO_H * s * .055;  // unità di scala nave

  // Ombra a mare
  ctx.globalAlpha=.15; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(sc*4,sc*5,sc*14,sc*3.5,.12,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  // Scafo iso (vista 3/4)
  const scG=ctx.createLinearGradient(-sc*12,0,sc*12,sc*7);
  scG.addColorStop(0,colore||'#6a3e1a'); scG.addColorStop(1,'#3a1e08');
  ctx.fillStyle=scG;
  ctx.beginPath();
  ctx.moveTo(-sc*14,sc*2);
  ctx.quadraticCurveTo(-sc*5,sc*9,sc*5,sc*9);
  ctx.quadraticCurveTo(sc*16,sc*9,sc*17,sc*3);
  ctx.quadraticCurveTo(sc*12,-sc*1,0,-sc*2.5);
  ctx.quadraticCurveTo(-sc*9,-sc*2.5,-sc*14,sc*2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2a1008'; ctx.lineWidth=1.5*s; ctx.stroke();

  // Fascia dorata
  ctx.strokeStyle='rgba(200,160,60,.55)'; ctx.lineWidth=s;
  ctx.beginPath(); ctx.moveTo(-sc*13,sc*3); ctx.quadraticCurveTo(sc*2,sc*7.5,sc*15,sc*2); ctx.stroke();

  // Cannoni
  ctx.fillStyle='#3a3028';
  for(let i=0;i<3;i++) ctx.fillRect(-sc*9+i*sc*6.5,sc*3,sc*4,sc*2);

  // Coperta
  const dG=ctx.createLinearGradient(-sc*11,0,sc*11,0);
  dG.addColorStop(0,'#8a6030'); dG.addColorStop(1,'#6a4820');
  ctx.fillStyle=dG;
  ctx.beginPath(); ctx.ellipse(sc*1.5,sc*.5,sc*11.5,sc*5,0,0,Math.PI*2); ctx.fill();

  // Albero maestro
  ctx.strokeStyle='#7a5020'; ctx.lineWidth=sc*1.8;
  ctx.beginPath(); ctx.moveTo(sc*1.5,sc*.5); ctx.lineTo(sc*1.5,-sc*24); ctx.stroke();
  // Pennoni
  ctx.lineWidth=sc*1;
  ctx.beginPath(); ctx.moveTo(-sc*11,-sc*18); ctx.lineTo(sc*14,-sc*18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-sc*7,-sc*11); ctx.lineTo(sc*10,-sc*11); ctx.stroke();

  // Vela principale
  const sailG=ctx.createLinearGradient(-sc*9,-sc*24,sc*12,-sc*7);
  sailG.addColorStop(0,'rgba(248,235,195,.96)'); sailG.addColorStop(1,'rgba(210,190,140,.86)');
  ctx.fillStyle=sailG;
  ctx.beginPath();
  ctx.moveTo(sc*1.5,-sc*24); ctx.lineTo(sc*14,-sc*18);
  ctx.lineTo(sc*10,-sc*11); ctx.lineTo(-sc*7,-sc*11); ctx.lineTo(-sc*11,-sc*18);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=.8*s; ctx.stroke();

  // Vela di trinchetto
  ctx.fillStyle='rgba(240,225,180,.82)';
  ctx.beginPath();
  ctx.moveTo(-sc*10,-sc*9); ctx.lineTo(-sc*2,-sc*18); ctx.lineTo(sc*3,-sc*9);
  ctx.closePath(); ctx.fill();

  // Bandiera Jolly Roger (animata)
  const fw=Math.sin(frame*.08)*sc*2;
  ctx.fillStyle='#080808';
  ctx.beginPath();
  ctx.moveTo(sc*1.5,-sc*24); ctx.lineTo(sc*11,-sc*22+fw);
  ctx.lineTo(sc*10,-sc*18+fw*.5); ctx.lineTo(sc*1.5,-sc*21);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.75)'; ctx.font=`${sc*5}px serif`;
  ctx.textAlign='center'; ctx.fillText('☠',sc*7,-sc*20+fw*.6);

  ctx.restore();
}

// ── PIRATA ISO — stile Tropico 2, vista 3/4 ──
function disegnaPirataIso(cx, cy, selezionato, umore, ruolo, s){
  s = s || G.ISO_SCALE;
  const mc = coloreUmore(umore);
  const sc = G.ISO_H * s * .038;  // unità di scala pirata (~1px per unità = ~25px totali)

  // Cerchio selezione
  if (selezionato){
    ctx.save(); ctx.globalAlpha=.3; ctx.fillStyle='#f0c040';
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7,sc*2.5,.1,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(240,192,64,.85)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*2.5,sc*7,sc*2.5,.1,0,Math.PI*2); ctx.stroke();
  }

  // Ombra a terra
  ctx.save(); ctx.globalAlpha=.22; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3,sc*5,sc*1.5,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Colori per ruolo
  const bodyColors={
    'Bucaniere':     ['#9a2818','#5a1808'],
    'Navigatore':    ['#1a4a8a','#0e2a5a'],
    'Cannoniere':    ['#3a3028','#1a1818'],
    'Chirurgo':      ['#e0e0d8','#b0b0a8'],
    'Cuoco':         ['#d8c090','#b09870'],
    'Nostromo':      ['#2a6a28','#1a4a18'],
    'Spia':          ['#1e1e18','#101010'],
    'Quartier Mastro':['#8a7828','#5a5010'],
  };
  const bc = bodyColors[ruolo]||['#6a4a28','#3a2810'];

  // GAMBE (stivali)
  ctx.fillStyle='#2a1a08';
  // gamba sx (più indietro = più corta in iso)
  ctx.fillRect(cx-sc*1.5, cy-sc*0.5, sc*2.2, sc*3.8);
  // gamba dx
  ctx.fillRect(cx+sc*0.5, cy-sc*0.5, sc*2.2, sc*3.8);
  // risvolti
  ctx.fillStyle='#3a2510';
  ctx.fillRect(cx-sc*2, cy+sc*2.8, sc*2.5, sc*1.2);
  ctx.fillRect(cx+sc*0.2, cy+sc*2.8, sc*2.5, sc*1.2);

  // CORPO
  const bodyG=ctx.createLinearGradient(cx-sc*3.5,cy-sc*7,cx+sc*3.5,cy);
  bodyG.addColorStop(0,bc[0]); bodyG.addColorStop(1,bc[1]);
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.8,cy);
  ctx.bezierCurveTo(cx-sc*4,cy-sc*3,cx-sc*3.5,cy-sc*6,cx-sc*2.2,cy-sc*7.5);
  ctx.lineTo(cx+sc*2.2,cy-sc*7.5);
  ctx.bezierCurveTo(cx+sc*3.5,cy-sc*6,cx+sc*4,cy-sc*3,cx+sc*2.8,cy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=.6; ctx.stroke();

  // Cintura
  ctx.fillStyle='#5a3818';
  ctx.fillRect(cx-sc*3,cy-sc*2.2,sc*6.2,sc*1.6);
  ctx.fillStyle='#c4940c';
  ctx.fillRect(cx-sc*1,cy-sc*2.1,sc*2,sc*1.4);

  // BRACCIO SX (con pistola)
  ctx.fillStyle=bc[0];
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.8,cy-sc*7);
  ctx.bezierCurveTo(cx-sc*5.5,cy-sc*5,cx-sc*6.5,cy-sc*2.5,cx-sc*5.5,cy-sc*1);
  ctx.lineTo(cx-sc*3.5,cy-sc*1.5);
  ctx.bezierCurveTo(cx-sc*3.8,cy-sc*3.5,cx-sc*2.5,cy-sc*6,cx-sc*1.8,cy-sc*7);
  ctx.closePath(); ctx.fill();
  // Pistola
  ctx.fillStyle='#2a2020'; ctx.strokeStyle='#888'; ctx.lineWidth=.8;
  ctx.fillRect(cx-sc*7,cy-sc*1.5,sc*3.5,sc*1); ctx.strokeRect(cx-sc*7,cy-sc*1.5,sc*3.5,sc*1);

  // BRACCIO DX (con spada)
  ctx.fillStyle=bc[0];
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.8,cy-sc*7);
  ctx.bezierCurveTo(cx+sc*5.5,cy-sc*5,cx+sc*6.2,cy-sc*2,cx+sc*5.5,cy-sc*.5);
  ctx.lineTo(cx+sc*3.5,cy-sc*1);
  ctx.bezierCurveTo(cx+sc*3.5,cy-sc*3,cx+sc*2.2,cy-sc*6,cx+sc*1.8,cy-sc*7);
  ctx.closePath(); ctx.fill();
  // Spada
  ctx.strokeStyle='#c0c0c8'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(cx+sc*5.5,cy-sc*.5); ctx.lineTo(cx+sc*8.5,cy+sc*3.5); ctx.stroke();
  ctx.fillStyle='#c4940c';
  ctx.beginPath(); ctx.ellipse(cx+sc*5.5,cy-sc*.5,sc*1.5,sc*.6,-.3,0,Math.PI*2); ctx.fill();

  // TESTA + COLLO
  const skinCol='#c8a878';
  ctx.fillStyle=skinCol;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*9,sc*1.8,sc*1,0,0,Math.PI*2); ctx.fill(); // collo
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.5,sc*3.8,sc*4,0,0,Math.PI*2); ctx.fill(); // testa

  // Ombra viso
  const fG=ctx.createRadialGradient(cx-sc,cy-sc*12,0,cx,cy-sc*11.5,sc*4);
  fG.addColorStop(0,'rgba(0,0,0,0)'); fG.addColorStop(1,'rgba(80,40,10,.3)');
  ctx.fillStyle=fG;
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*11.5,sc*3.8,sc*4,0,0,Math.PI*2); ctx.fill();

  // Occhi
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(cx-sc*1.2,cy-sc*11.8,sc*.75,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1.2,cy-sc*11.8,sc*.75,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.45)';
  ctx.beginPath(); ctx.arc(cx-sc*.8,cy-sc*12.1,sc*.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1.6,cy-sc*12.1,sc*.3,0,Math.PI*2); ctx.fill();

  // Bocca (espressione da umore)
  ctx.strokeStyle='rgba(100,40,20,.75)'; ctx.lineWidth=.8;
  ctx.beginPath();
  if(umore>65)      ctx.arc(cx,cy-sc*10.2,sc*1.4,.15,Math.PI-.15,false);  // sorriso
  else if(umore>35){ ctx.moveTo(cx-sc*1.4,cy-sc*10.2); ctx.lineTo(cx+sc*1.4,cy-sc*10.2); } // neutro
  else              ctx.arc(cx,cy-sc*9.3,sc*1.4,Math.PI+.15,-.15,false);  // triste
  ctx.stroke();

  // CAPPELLO TRICORNO
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*14.5,sc*7.2,sc*2.8,0,0,Math.PI*2); ctx.fill(); // tesa
  const hatG=ctx.createLinearGradient(cx-sc*4.5,cy-sc*20,cx+sc*3,cy-sc*14.5);
  hatG.addColorStop(0,'#2a2a2a'); hatG.addColorStop(1,'#0a0a0a');
  ctx.fillStyle=hatG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*4.5,cy-sc*14.5);
  ctx.bezierCurveTo(cx-sc*4,cy-sc*19,cx-sc*2,cy-sc*21.5,cx,cy-sc*21.5);
  ctx.bezierCurveTo(cx+sc*2,cy-sc*21.5,cx+sc*4,cy-sc*19,cx+sc*4.5,cy-sc*14.5);
  ctx.closePath(); ctx.fill();
  // Fascia dorata
  ctx.fillStyle='#c8a020';
  ctx.fillRect(cx-sc*4.5,cy-sc*16.2,sc*9.2,sc*1.4);
  // Spilla
  ctx.fillStyle='#f0c040'; ctx.beginPath(); ctx.arc(cx-sc*2.8,cy-sc*15.5,sc*1,0,Math.PI*2); ctx.fill();

  // Indicatore umore
  ctx.fillStyle='rgba(0,0,0,.55)';
  ctx.beginPath(); ctx.arc(cx+sc*5,cy-sc*19,sc*2.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=mc;
  ctx.beginPath(); ctx.arc(cx+sc*5,cy-sc*19,sc*2.2,0,Math.PI*2); ctx.fill();
}

// ── SCHIAVO ISO — più piccolo del pirata, aspetto dimesso ──
function disegnaSchiavoIso(cx, cy, felicita, s){
  s = s || G.ISO_SCALE;
  const sc = G.ISO_H * s * .030;  // più piccolo del pirata (.038)
  const felCol = felicita>60?'#4fc04f':felicita>30?'#f0c040':'#c0392b';

  // Ombra
  ctx.save(); ctx.globalAlpha=.18; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx+sc*2,cy+sc*3,sc*4,sc*1.2,.12,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Gambe (pantaloni grigi/logori)
  ctx.fillStyle='#5a5040';
  ctx.fillRect(cx-sc*1.5, cy-sc*0.5, sc*2, sc*4);
  ctx.fillRect(cx+sc*.5,  cy-sc*0.5, sc*2, sc*4);

  // Corpo (camicia strappata, colore neutro)
  const bodyG=ctx.createLinearGradient(cx-sc*3,cy-sc*7,cx+sc*3,cy);
  bodyG.addColorStop(0,'#8a7860'); bodyG.addColorStop(1,'#5a4838');
  ctx.fillStyle=bodyG;
  ctx.beginPath();
  ctx.moveTo(cx-sc*2.5,cy);
  ctx.bezierCurveTo(cx-sc*3.5,cy-sc*3,cx-sc*3,cy-sc*6,cx-sc*2,cy-sc*7);
  ctx.lineTo(cx+sc*2,cy-sc*7);
  ctx.bezierCurveTo(cx+sc*3,cy-sc*6,cx+sc*3.5,cy-sc*3,cx+sc*2.5,cy);
  ctx.closePath(); ctx.fill();

  // Braccia con attrezzo (piccone/vanga)
  ctx.fillStyle='#8a7860';
  ctx.beginPath();
  ctx.moveTo(cx+sc*2.5,cy-sc*6.5);
  ctx.bezierCurveTo(cx+sc*5,cy-sc*4,cx+sc*5.5,cy-sc*1.5,cx+sc*4.5,cy);
  ctx.lineTo(cx+sc*3,cy-.5);
  ctx.bezierCurveTo(cx+sc*3.2,cy-sc*2,cx+sc*2,cy-sc*5.5,cx+sc*1.5,cy-sc*6.5);
  ctx.closePath(); ctx.fill();
  // Attrezzo (piccone)
  ctx.strokeStyle='#8a6030'; ctx.lineWidth=sc*1.5;
  ctx.beginPath(); ctx.moveTo(cx+sc*4.5,cy); ctx.lineTo(cx+sc*7,cy+sc*4); ctx.stroke();
  ctx.fillStyle='#aaa';
  ctx.beginPath(); ctx.ellipse(cx+sc*7,cy+sc*4,sc*1.8,sc*.7,-.4,0,Math.PI*2); ctx.fill();

  // Testa (pelle diversa)
  const skinTones=['#c8a060','#a06030','#7a4020','#d4a870'];
  ctx.fillStyle=skinTones[Math.floor(Math.abs(cx+cy))%skinTones.length];
  ctx.beginPath(); ctx.ellipse(cx,cy-sc*9,sc*3.2,sc*3.5,0,0,Math.PI*2); ctx.fill();

  // Occhi stanchi
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(cx-sc*1,cy-sc*9.5,sc*.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+sc*1,cy-sc*9.5,sc*.6,0,Math.PI*2); ctx.fill();

  // Bocca (triste o neutra)
  ctx.strokeStyle='rgba(100,40,20,.75)'; ctx.lineWidth=.8;
  ctx.beginPath();
  if(felicita>60){ ctx.arc(cx,cy-sc*8,sc*1.2,.15,Math.PI-.15,false); }
  else { ctx.arc(cx,cy-sc*7.2,sc*1.2,Math.PI+.2,-.2,false); }
  ctx.stroke();

  // Bandana in testa (colore felicità)
  ctx.fillStyle=felCol;
  ctx.beginPath();
  ctx.ellipse(cx,cy-sc*11.5,sc*3.4,sc*1.2,0,Math.PI,0,true); ctx.fill();
  ctx.fillRect(cx-sc*3.4,cy-sc*11.5,sc*6.8,sc*1.5);

  // Indicatore felicità (pallino sopra la testa)
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.beginPath(); ctx.arc(cx,cy-sc*14,sc*2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=felCol;
  ctx.beginPath(); ctx.arc(cx,cy-sc*14,sc*1.5,0,Math.PI*2); ctx.fill();
}
// ═══════════════════════════════════════
// MODULO: RENDERER_SCENE
// ═══════════════════════════════════════
// ── DRAW PRINCIPALE — Isometrico 2:1 con depth sorting ──
function disegnaScena(dt=0.016){
  frame++;
  // Guard: canvas o ISO non ancora inizializzati
  if (!canvas || !canvas.width || !canvas.height) return;
  if (!G.ISO_SCALE || !G.ISO_W || !G.ISO_H) return;

  const s   = G.ISO_SCALE;
  const IW  = G.ISO_W * s;   // larghezza tile schermo
  const IH  = G.ISO_H * s;   // altezza tile schermo

  // ── SFONDO oceano profondo ──
  const bg = ctx.createRadialGradient(canvas.width*.5,canvas.height*.5,0,canvas.width*.5,canvas.height*.5,canvas.width*.7);
  bg.addColorStop(0,'#0d3855'); bg.addColorStop(.5,'#082840'); bg.addColorStop(1,'#040f1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);

  // ── Frustum culling: tile visibili ──
  function visible(col, row){
    const p = isoProj(col, row);
    return p.x+IW >= 0 && p.x-IW <= canvas.width &&
           p.y+IH*3 >= 0 && p.y-IH <= canvas.height;
  }

  // ── 1. TILE TERRENO — ordine iso (row+col crescente = painter's algorithm) ──
  for (let sum=0; sum<G.RIGHE+G.COLS-1; sum++){
    const rMin = Math.max(0, sum-G.COLS+1);
    const rMax = Math.min(G.RIGHE-1, sum);
    for (let r=rMin; r<=rMax; r++){
      const c = sum - r;
      if (!visible(c,r)) continue;
      const p = isoProj(c, r);
      const cx = p.x;       // centro-sinistra del rombo
      const cy = p.y;       // bordo superiore del rombo
      disegnaTileIso(G.mappa[r][c], cx, cy, r, c);
    }
  }

  // ── 2. FOAM/TRANSIZIONI spiaggia ──
  disegnaTransizioni();

  // ── 3. Raccoglie tutti gli oggetti da disegnare con depth key ──
  // depth = row*2 + col*2 (con tie-breaking per altezza)
  const oggetti = [];

  // Rocce
  for (const rc of G.rocce){
    const p = isoProj(rc.c, rc.r);
    oggetti.push({ depth: rc.r*2+rc.c*2, tipo:'roccia', data:rc, px:p.x, py:p.y });
  }
  // Alberi
  for (const a of G.alberi){
    const p = isoProj(a.c, a.r);
    oggetti.push({ depth: a.r*2+a.c*2, tipo:'albero', data:a, px:p.x, py:p.y });
  }
  // Props porto vivo / clutter scenico
  if(typeof assicuraPortoVivo==='function') assicuraPortoVivo();
  for (const pr of (G.portoProps||[])){
    const p = isoProj(pr.c, pr.r);
    oggetti.push({ depth: pr.r*2+pr.c*2+0.85, tipo:'portoProp', data:pr, px:p.x, py:p.y });
  }

  // Edifici (depth +1 per stare sopra alberi dello stesso tile)
  for (const b of G.edifici){
    const p = isoProj(b.c, b.r);
    oggetti.push({ depth: b.r*2+b.c*2+1, tipo:'edificio', data:b, px:p.x, py:p.y });
  }
  // Pirati (depth = posizione float, +2 per stare sopra gli edifici)
  for (const p of G.pirati){
    if(p.inRaid) continue;
    const col = p.mc, row = p.mr;
    const proj = isoProj(col, row);
    oggetti.push({ depth: row*2+col*2+0.5, tipo:'pirata', data:p, px:proj.x, py:proj.y });
  }
  // Schiavi (stessa logica pirati, taglia più piccola)
  // Schiavi (vagano vicino agli edifici — con NaN guard)
  for (const sv of G.schiavi||[]){
    if(!isFinite(sv.mc)||!isFinite(sv.mr)) continue;
    const proj=isoProj(sv.mc,sv.mr);
    oggetti.push({depth:sv.mr*2+sv.mc*2+1.4,tipo:"schiavo",data:sv,px:proj.x,py:proj.y});
  }
  // POI
  for (const poi of G.pois||[]){
    const p = isoProj(poi.c, poi.r);
    oggetti.push({ depth: poi.r*2+poi.c*2+3, tipo:'poi', data:poi, px:p.x, py:p.y });
  }

  // ── 4. DEPTH SORT (painter's algorithm iso) ──
  // Filtra oggetti con coordinate invalide prima del sort
  const oggettiValidi = oggetti.filter(o => isFinite(o.px) && isFinite(o.py) && isFinite(o.depth));
  oggettiValidi.sort((a,b) => a.depth - b.depth);

  // ── 5. DISEGNA tutti in ordine ──
  for (const obj of oggettiValidi){
    const { px, py, tipo, data } = obj;
    const cx = px;                    // centro-sinistra rombo
    const cy = py + IH / 2;          // centro verticale del tile

    switch(tipo){
      case 'roccia':
        disegnaRocciaIso(cx, cy, data.scala, s); break;
      case 'albero':
        disegnaAlberoIso(cx, cy, data.scala, data.tinta, data.palude, s); break;
      case 'portoProp':
        if(typeof disegnaPropPorto==='function') disegnaPropPorto(data, cx, cy, s); break;
      case 'edificio':
        disegnaEdificio(data.tipo, cx, cy, s); break;
      case 'pirata':
        disegnaPirataIso(cx,cy,G.pirataSelezionato===data.id,data.umore,data.ruolo,s);
        if(!G.battagliaAttiva) muoviPirata(data,dt*G.velocita);
        break;
      case 'schiavo':
        if(typeof disegnaSchiavoIso==='function') disegnaSchiavoIso(cx,cy,data.felicita,s);
        if(typeof disegnaCaricoSchiavo==='function') disegnaCaricoSchiavo(data,cx,cy,s);
        break;
      case 'poi':
        disegnaPOI(data, cx, cy, s); break;
    }
  }

  // ── 6. Navi: vedi disegnaNaviMare() ──

  // ── 7. Hover costruzione ──
  if (G.modalitaCostruzione && G.modalitaCostruzione!=='sentiero' && G.hoverC>=0 && G.hoverR>=0){
    const p = isoProj(G.hoverC, G.hoverR);
    const cx = p.x, cy = p.y;
    const hw = IW/2, hh = IH/2;
    const ok = puoCostruire(G.hoverR, G.hoverC);
    ctx.fillStyle   = ok ? 'rgba(80,220,80,.3)' : 'rgba(220,60,60,.3)';
    ctx.strokeStyle = ok ? '#4f4' : '#f44';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx+hw, cy+hh);
    ctx.lineTo(cx, cy+IH); ctx.lineTo(cx-hw, cy+hh);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (ok){
      ctx.globalAlpha = .45;
      disegnaEdificio(G.modalitaCostruzione, cx, cy+hh, s);
      ctx.globalAlpha = 1;
    }
  }


  // ── 7a. Movimento schiavi (una volta per frame) ──
  if(typeof muoviSchiavi==="function") muoviSchiavi(dt*G.velocita);
  // ── 7b. Indicatori edifici ──
  if(typeof disegnaIndicatoriEdifici==="function") disegnaIndicatoriEdifici(s);
  // ── 7c. Navi animate ──
  if(typeof disegnaNaviMare==="function") disegnaNaviMare(s);

  // ── 8. Ombra globale drammatica (sole NW a ~45°) ──
  // Disegnata come ellisse allungata verso SE per ogni oggetto alto
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#506040';
  const shadowAlts = {fortezza:.55,guardia:.65,osservatorio:.6,cantiere:.3,cappella:.5,caserma:.38,taverna:.42,cantastorie:.48};
  ctx.globalAlpha = .22;
  for (const b of G.edifici){
    const p = isoProj(b.c, b.r);
    const bx = p.x, by = p.y + IH/2;
    const altH = (shadowAlts[b.tipo]||.35) * G.ISO_H * s * 1.8;
    ctx.beginPath();
    ctx.ellipse(bx + altH*.6, by + altH*.32, altH*.65, altH*.18, .25, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = .3;
  for (const a of G.alberi){
    const p = isoProj(a.c, a.r);
    const bx = p.x + (a.ox||0)*G.ISO_W*s, by = p.y + IH/2 + (a.oy||0)*G.ISO_H*s;
    const altH = G.ISO_H * a.scala * s * 1.4;
    ctx.beginPath();
    ctx.ellipse(bx + altH*.55, by + altH*.28, altH*.5, altH*.14, .2, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // ── 9. Vignetta caraibica ──
  const vign = ctx.createRadialGradient(canvas.width*.5,canvas.height*.35,canvas.width*.22,canvas.width*.5,canvas.height*.5,canvas.width*.75);
  vign.addColorStop(0,'rgba(255,220,120,0)');
  vign.addColorStop(.6,'rgba(255,180,60,.025)');
  vign.addColorStop(1,'rgba(20,5,0,.28)');
  ctx.fillStyle = vign;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

// ── Disegna un POI (icona animata) ──
function disegnaPOI(poi, cx, cy, s){
  const pulse = Math.sin(frame*.04)*3*s;
  ctx.beginPath(); ctx.arc(cx, cy, (9+pulse), 0, Math.PI*2);
  ctx.fillStyle='rgba(240,192,64,.15)'; ctx.fill();
  ctx.strokeStyle='rgba(240,192,64,.55)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font=`${G.ISO_W*.6*s}px serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(poi.icona, cx, cy-4*s);
}

function coloreUmore(u){ return u>70?'#4fc04f':u>40?'#f0c040':'#c0392b'; }
// ═══════════════════════════════════════
// MODULO: SCHIAVI
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// SISTEMA SCHIAVI — stile Tropico 2
//
// In Tropico 2 i PIRATI sono i padroni: bevono, combattono,
// si divertono. Sono gli SCHIAVI (prigionieri catturati e
// messi a lavorare) che producono risorse negli edifici.
//
// Struttura:
//   G.schiavi[] — lista schiavi attivi
//   Ogni schiavo: { id, nome, fazione, edificio, produzione,
//                   felicita(0-100), giorni, mr, mc, _stato }
//
// Flusso:
//   1. Cattura → prigioniero
//   2. "Metti al lavoro" → diventa schiavo assegnato a edificio
//   3. Ogni tick → produce risorse in base all'edificio
//   4. Felicità scende → produzione cala → può ribellarsi
//   5. Opzioni: riscatta, recluta come pirata, libera
// ═══════════════════════════════════════════════════

// Edifici che possono usare schiavi e cosa producono
const LAVORO_SCHIAVI = {
  fattoria:    { risorsa:'cibo',   base:12, icona:'🍖' },
  segheria:    { risorsa:'legno',  base:10, icona:'🪵' },
  distilleria: { risorsa:'rum',    base:8,  icona:'🍺' },
  miniera:     { risorsa:'oro',    base:8,  icona:'💰' },
  cantiere:    { risorsa:'legno',  base:6,  icona:'🪵' },
  casapirata:  { risorsa:'oro',    base:5,  icona:'💰' },
};

const NOMI_SCHIAVI_M = ['Thomas','William','James','Robert','Edward','Henry',
  'George','Charles','Richard','John','Miguel','Pedro','Hans','François'];
const NOMI_SCHIAVI_F = ['Mary','Anne','Elizabeth','Catherine','Margaret',
  'Isabella','Sofia','Clara','Maria','Rose'];

// ── Inizializza array schiavi se non esiste ──
if(!G.schiavi) G.schiavi=[];

// ID prigionieri robusti: Date.now() da solo può duplicare più catture
// nello stesso millisecondo, facendo sparire più prigionieri/schiavi insieme.
let __seqPrigionieri = 1;
function nuovoIdPrigioniero(){
  return Date.now() * 1000 + (__seqPrigionieri++);
}
function rimuoviUnPrigioniero(id){
  const idx = G.prigionieri.findIndex(x=>x.id===id);
  if(idx>=0) G.prigionieri.splice(idx,1);
}

// ── Crea uno schiavo da un prigioniero ──
function mettiAlLavoro(prigionieroId, edificioR, edificioC){
  const p = G.prigionieri.find(x=>x.id===prigionieroId);
  if(!p){ aggMsg('Prigioniero non trovato!','male'); return; }

  const edificio = G.edifici.find(b=>b.r===edificioR&&b.c===edificioC);
  if(!edificio){ aggMsg('Edificio non trovato!','male'); return; }

  if(!LAVORO_SCHIAVI[edificio.tipo]){
    aggMsg('Questo edificio non usa schiavi!','male'); return;
  }

  // Quanti schiavi già lavorano in questo edificio?
  const giaPresenti = G.schiavi.filter(s=>s.edificioR===edificioR&&s.edificioC===edificioC).length;
  const maxPerEdificio = 3;
  if(giaPresenti>=maxPerEdificio){
    aggMsg(`Max ${maxPerEdificio} schiavi per edificio!`,'male'); return;
  }

  // Rimuove dal carcere e crea schiavo
  rimuoviUnPrigioniero(prigionieroId);

  const lavoro = LAVORO_SCHIAVI[edificio.tipo];
  const schiavo = {
    id: p.id,
    nome: p.nome,
    fazione: p.fazione,
    edificioR: edificioR,
    edificioC: edificioC,
    edificioTipo: edificio.tipo,
    produzione: lavoro,
    felicita: 50,  // parte neutro
    giorni: 0,
    // posizione visiva: parte dall'edificio
    mc: edificioC + 0.5,
    mr: edificioR + 0.5,
    _stato: 'lavora',
    _vagaDx: 0, _vagaDy: 0,
  };

  G.schiavi.push(schiavo);

  // Chiude il menu assegnazione per evitare stati UI bloccati
  // su mobile e forza il refresh immediato della mappa.
  chiudiModale();

  aggMsg(`⛏ ${schiavo.nome} messo al lavoro in ${ED[edificio.tipo].nome}!`,'bene');

  // Refresh UI senza alterare le coordinate originali
  // degli altri schiavi presenti sulla mappa.
  aggiornaUI();
}

// ── Tick schiavi: produzione + calo felicità ──
function tickSchiavi(){
  if(!G.schiavi || G.schiavi.length===0) return;

  const daRimuovere = [];

  for(const s of G.schiavi){
    s.giorni++;

    // Produzione in base a felicità (50% = piena, 0% = niente)
    const lav = LAVORO_SCHIAVI[s.edificioTipo];
    if(!lav) continue;

    // Verifica che l'edificio esista ancora
    const edificioEsiste = G.edifici.find(b=>b.r===s.edificioR&&b.c===s.edificioC);
    if(!edificioEsiste){
      daRimuovere.push(s.id);
      continue;
    }

    // Moltiplicatore felicità: da 0.2 (infelice) a 1.2 (felice)
    const multFel = 0.2 + (s.felicita/100)*1.0;
    // FASE 2D: il rendimento degli schiavi dipende anche dalla strada.
    // Se il luogo di lavoro non è collegato al porto/palazzo, le merci arrivano lente.
    const multStrada = typeof efficienzaStradaEdificio==='function' ? efficienzaStradaEdificio(edificioEsiste) : 1;

    // Effetti taverna/rum sulla felicità schiavi
    const haTaverna = G.edifici.find(b=>b.tipo==='taverna');
    const felBon = haTaverna ? 2 : 0;
    const felCost = 3; // cala ogni tick

    // Produzione
    const produzione = Math.floor(lav.base * multFel * multStrada);
    if(produzione > 0){
      if(lav.risorsa==='cibo')  G.cibo  = Math.min(999, G.cibo  + produzione);
      if(lav.risorsa==='legno') G.legno = Math.min(999, G.legno + produzione);
      if(lav.risorsa==='rum')   G.rum   = Math.min(999, G.rum   + produzione);
      if(lav.risorsa==='oro')   G.oro   = Math.min(9999,G.oro   + produzione);
    }

    // Felicità: cala nel tempo, migliorata da edifici bisogni
    s.felicita = Math.max(0, Math.min(100,
      s.felicita
      - felCost
      + felBon
      + (G.bisogni.salute>60 ? 1 : 0)  // infermeria aiuta
    ));

    // Rivolta: felicità a 0 → fuga o sabotaggio
    if(s.felicita<=0 && Math.random()<0.15){
      aggMsg(`💢 ${s.nome} si è ribellato e fuggito!`,'male');
      // Sabotaggio: distrugge un po' di risorse
      G.cibo  = Math.max(0, G.cibo  - Math.floor(Math.random()*20));
      G.legno = Math.max(0, G.legno - Math.floor(Math.random()*15));
      daRimuovere.push(s.id);

      // Rep: se era Marina Reale, la Marina approva la fuga
      if(s.fazione==='Marina Reale')
        G.fazioni.reale.rep = Math.min(100, G.fazioni.reale.rep+3);
    }
  }

  if(daRimuovere.length>0)
    G.schiavi = G.schiavi.filter(s=>!daRimuovere.includes(s.id));
}

// ── Libera uno schiavo (guadagno rep, perdi produzione) ──
function liberaSchiavo(id){
  const s = G.schiavi.find(x=>x.id===id);
  if(!s) return;
  G.schiavi = G.schiavi.filter(x=>x.id!==id);

  // Guadagno reputazione
  if(s.fazione==='Marina Reale') G.fazioni.reale.rep = Math.min(100, G.fazioni.reale.rep+15);
  if(s.fazione==='Mercante')     G.fazioni.mercante.rep = Math.min(100, G.fazioni.mercante.rep+10);

  notifica('⛓ Schiavo Liberato', s.nome+' è libero. La tua reputazione migliora.','bene');
  chiudiModale();
  aggiornaUI();
}

// ── Riscatta schiavo (tornano ad essere prigionieri → riscatto) ──
function riscattaSchiavo(id){
  const s = G.schiavi.find(x=>x.id===id);
  if(!s) return;
  const riscatto = 80 + Math.floor(Math.random()*120);
  G.schiavi = G.schiavi.filter(x=>x.id!==id);
  G.oro += riscatto;
  aggMsg(`💰 ${s.nome} riscattato per ${riscatto} oro!`,'bene');
  chiudiModale();
  aggiornaUI();
}

// ── Recluta schiavo come pirata (se morale pirata è alto) ──
function reclutaSchiavo(id){
  const s = G.schiavi.find(x=>x.id===id);
  if(!s) return;
  G.schiavi = G.schiavi.filter(x=>x.id!==id);
  creaaPirata({ nome: s.nome });
  aggMsg(`⚔ ${s.nome} si unisce alla ciurma!`,'bene');
  chiudiModale();
  aggiornaUI();
}

// ── UI: pannello schiavi ──
function apriGestioneSchiavi(){
  const haPrigione = G.edifici.find(b=>b.tipo==='prigione');
  const edificiLavoro = G.edifici.filter(b=>LAVORO_SCHIAVI[b.tipo]);

  let html = `
    <p style="font-size:.8rem;color:var(--sabbia);margin-bottom:10px">
      Gli schiavi lavorano negli edifici produttivi. Più sono felici, più producono.
      La felicità cala nel tempo — costruisci edifici di benessere per mantenerla alta.
    </p>`;

  // Prigionieri disponibili da mettere al lavoro
  if(G.prigionieri.length>0){
    html += `<div style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--oro);
      letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">
      Prigionieri disponibili (${G.prigionieri.length})</div>`;

    for(const p of G.prigionieri){
      html += `<div style="background:rgba(139,26,26,.15);border:1px solid rgba(192,57,43,.3);
        border-radius:5px;padding:7px 10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:#ffbbbb;font-size:.8rem">⛓ ${p.nome}
            <span style="color:var(--sabbia);font-size:.68rem">(${p.fazione})</span></span>
          <span style="font-size:.68rem;color:var(--oro)">${p.riscatto}💰</span>
        </div>
        <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
          ${edificiLavoro.map(b=>`
            <button class="btn-piccolo" onclick="mettiAlLavoro(${p.id},${b.r},${b.c})">
              ${ED[b.tipo].icona} ${ED[b.tipo].nome}
            </button>`).join('')}
          <button class="mbtn primario" style="padding:3px 8px;font-size:.65rem;margin:0"
            onclick="riscattaPrigioniero(${p.id});chiudiModale()">💰 Riscatta</button>
        </div>
      </div>`;
    }
  }

  // Schiavi al lavoro
  if(G.schiavi.length>0){
    html += `<div style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--oro);
      letter-spacing:1px;text-transform:uppercase;margin:10px 0 6px">
      Al lavoro (${G.schiavi.length})</div>`;

    for(const s of G.schiavi){
      const felCol = s.felicita>60?'var(--verde-ch)':s.felicita>30?'var(--oro)':'var(--rum-chiaro)';
      const lav = LAVORO_SCHIAVI[s.edificioTipo]||{};
      const multFel = 0.2 + (s.felicita/100)*1.0;
      const prodEff = Math.floor((lav.base||0)*multFel);

      html += `<div style="background:rgba(255,255,255,.05);border:1px solid var(--bordo);
        border-radius:5px;padding:7px 10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:.8rem;color:var(--pergamena)">⛏ ${s.nome}</div>
            <div style="font-size:.65rem;color:var(--sabbia)">${ED[s.edificioTipo]?.icona} ${ED[s.edificioTipo]?.nome}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.7rem;color:${felCol}">😊 ${s.felicita}%</div>
            <div style="font-size:.65rem;color:${lav.icona?'#aaffaa':'#666'}">
              ${lav.icona||''} +${prodEff}/${lav.risorsa||''} /g</div>
          </div>
        </div>
        <div style="height:3px;background:#1a2a1a;border-radius:2px;margin:4px 0">
          <div style="height:100%;width:${s.felicita}%;background:${felCol};border-radius:2px;transition:width .5s"></div>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn-piccolo" onclick="liberaSchiavo(${s.id})">🕊 Libera</button>
          <button class="btn-piccolo" onclick="riscattaSchiavo(${s.id})">💰 Riscatta</button>
          <button class="btn-piccolo" onclick="reclutaSchiavo(${s.id})">⚔ Recluta</button>
        </div>
      </div>`;
    }
  }

  if(G.prigionieri.length===0 && G.schiavi.length===0){
    html += `<p style="color:#666;font-style:italic;text-align:center;margin-top:10px">
      Nessun prigioniero o schiavo. Fai un raid per catturarne!</p>`;
  }

  if(edificiLavoro.length===0){
    html += `<p style="color:#ffaaaa;margin-top:8px">
      ⚠ Costruisci fattorie, segherie o distillerie per usare gli schiavi.</p>`;
  }

  apriModale('⛓ Schiavi & Trasporto & Lavoro', html);
}

// ── Movimento visivo schiavi: vagano vicino all'edificio ──
function muoviSchiavi(dt){
  if(dt===0) return;
  assicuraPortoVivo();

  for(const s of G.schiavi){
    if(!isFinite(s.mc)||!isFinite(s.mr)){
      s.mc=(s.edificioC||G.COLS/2)+0.5; s.mr=(s.edificioR||G.RIGHE/2)+0.5; continue;
    }

    // Se esiste un porto/cantiere/spiaggia, alcuni schiavi diventano trasportatori visibili.
    if(s._trasporto && s._trasporto.attesa>0) s._trasporto.attesa=Math.max(0,s._trasporto.attesa-dt);
    const target=aggiornaTargetTrasportoSchiavo(s);
    if(target){
      // FASE 2D: gli schiavi seguono davvero la rete dei sentieri, invece di
      // tagliare in linea retta attraverso foreste o acqua.
      const targetKey=Math.floor(target.r)+','+Math.floor(target.c)+','+(s._trasporto?s._trasporto.fase:'');
      if(s._targetKey!==targetKey || !s.percorso || s.percorsoIdx>=s.percorso.length){
        const sr=Math.max(0,Math.min(G.RIGHE-1,Math.floor(s.mr)));
        const sc=Math.max(0,Math.min(G.COLS-1,Math.floor(s.mc)));
        const er=Math.max(0,Math.min(G.RIGHE-1,Math.floor(target.r)));
        const ec=Math.max(0,Math.min(G.COLS-1,Math.floor(target.c)));
        const path=astar(sr,sc,er,ec);
        s.percorso=path&&path.length?path:[{r:er,c:ec}];
        s.percorsoIdx=0;
        s._targetKey=targetKey;
      }
      const stepTarget=s.percorso && s.percorso[s.percorsoIdx] ? s.percorso[s.percorsoIdx] : {r:Math.floor(target.r),c:Math.floor(target.c)};
      const tx=stepTarget.c+.5, ty=stepTarget.r+.5;
      const dx=tx-s.mc, dy=ty-s.mr;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const speed=(0.46+(s.felicita||50)/210)*dt;
      if(dist>0.04){
        const oldC=s.mc, oldR=s.mr;
        const roadBoost=bonusSentieroPer(s.mr,s.mc);
        s.mc+=dx/dist*speed*roadBoost;
        s.mr+=dy/dist*speed*roadBoost;
        if(!tileCamminabile(s.mr,s.mc)){
          s.mc=oldC; s.mr=oldR;
          const safe=trovaTileCamminabileVicino(s.mr,s.mc,5);
          s.mr=safe.r+.5; s.mc=safe.c+.5;
          s.percorso=null; s.percorsoIdx=0; s._targetKey=null;
        }
        s._stato='trasporta';
      } else {
        if(s.percorso && s.percorsoIdx<s.percorso.length-1){
          s.percorsoIdx++;
        } else {
          const tr=s._trasporto;
          if(tr.fase==='a_edificio'){
            tr.fase='a_porto';
            tr.carry=true;
            tr.risorsa=RISORSE_PORTO[Math.floor(Math.random()*RISORSE_PORTO.length)];
            tr.attesa=.25+Math.random()*.5;
          } else {
            tr.fase='a_edificio';
            tr.carry=false;
            tr.attesa=.4+Math.random()*1.2;
          }
          s.percorso=null; s.percorsoIdx=0; s._targetKey=null;
        }
      }
      if(s._trasporto && s._trasporto.attesa>0) s._trasporto.attesa=Math.max(0,s._trasporto.attesa-dt);
    } else {
      // Fallback: piccolo movimento intorno all'edificio.
      if(!s._vagaDx || Math.random()<0.005){
        const a = Math.random()*Math.PI*2;
        const r = 0.3 + Math.random()*0.5;
        s._targetC = s.edificioC + 0.5 + Math.cos(a)*r;
        s._targetR = s.edificioR + 0.5 + Math.sin(a)*r*0.5;
        s._vagaDx = 1;
      }
      if(s._targetC!==undefined){
        const dx = s._targetC - s.mc;
        const dy = s._targetR - s.mr;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if(dist>0.05){
          const speed = 0.4*dt;
          const oldC=s.mc, oldR=s.mr;
          s.mc += dx/dist*speed*bonusSentieroPer(s.mr,s.mc);
          s.mr += dy/dist*speed*bonusSentieroPer(s.mr,s.mc);
          if(!tileCamminabile(s.mr,s.mc)){ s.mc=oldC; s.mr=oldR; s._vagaDx=0; }
        }
      }
    }

    // Bounds globali: evita corruzione coordinate e NaN
    s.mc = Math.max(1, Math.min(G.COLS-1, s.mc));
    s.mr = Math.max(1, Math.min(G.RIGHE-1, s.mr));
  }
}
// ═══════════════════════════════════════
// MODULO: EDIFICI_HUD
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// EDIFICI HUD — stile Tropico 2
// ═══════════════════════════════════════════════════

const EDIFICIO_PRODUZIONE = {
  fattoria:    { icona:'🍖', risorsa:'cibo',    valore:9,  colore:'#4fc04f' },
  distilleria: { icona:'🍺', risorsa:'rum',     valore:6,  colore:'#c07830' },
  segheria:    { icona:'🪵', risorsa:'legno',   valore:7,  colore:'#8b5e3c' },
  osservatorio:{ icona:'🔭', risorsa:'ricerca', valore:3,  colore:'#6ab4ff' },
  casapirata:  { icona:'💰', risorsa:'oro',     valore:6,  colore:'#f0c040' },
  sarto:       { icona:'💰', risorsa:'oro',     valore:10, colore:'#f0c040' },
  taverna:     { icona:'😊', risorsa:'morale',  valore:5,  colore:'#ff8888' },
  bordello:    { icona:'💋', risorsa:'diverte', valore:20, colore:'#ff69b4' },
  arena:       { icona:'⚔',  risorsa:'diverte', valore:12, colore:'#ff6644' },
  infermeria:  { icona:'❤',  risorsa:'salute',  valore:20, colore:'#ff4444' },
  cappella:    { icona:'✝',  risorsa:'spirito', valore:18, colore:'#ffffaa' },
  guardia:     { icona:'🛡',  risorsa:'sicur.',  valore:15, colore:'#88ccff' },
  caserma:     { icona:'⚔',  risorsa:'combatt.',valore:1,  colore:'#ff8844' },
  cantiere:    { icona:'⚓',  risorsa:'navi',    valore:0,  colore:'#8888ff' },
  fortezza:    { icona:'🏰', risorsa:'difesa',  valore:0,  colore:'#aaaaaa' },
  prigione:    { icona:'⛓',  risorsa:'riscatti',valore:0,  colore:'#888888' },
  mercatonero: { icona:'🛒', risorsa:'+20%',    valore:0,  colore:'#ffaa00' },
  bagni:       { icona:'🛁', risorsa:'salute',  valore:12, colore:'#88ddff' },
  cantastorie: { icona:'🎭', risorsa:'diverte', valore:8,  colore:'#dd88ff' },
};

function disegnaIndicatoriEdifici(s){
  if(!G.edifici||G.edifici.length===0) return;
  const IH=G.ISO_H*s, IW=G.ISO_W*s;
  const alture={fortezza:2.2,guardia:2.8,osservatorio:2.5,cantiere:1.8,cappella:2.3,caserma:1.6};

  for(const b of G.edifici){
    const p=isoProj(b.c,b.r);
    const cx=p.x, cy=p.y+IH*0.5;
    const altH=(alture[b.tipo]||1.2)*IH;
    const ix=cx, iy=cy-altH;
    const prod=EDIFICIO_PRODUZIONE[b.tipo];
    const schiaviQui=(G.schiavi||[]).filter(sv=>sv.edificioR===b.r&&sv.edificioC===b.c).length;

    ctx.save();
    const bw=54*s, bh=18*s, bx=ix-bw/2, by=iy-bh-4*s;

    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(bx,by,bw,bh,4*s); else ctx.rect(bx,by,bw,bh);
    ctx.fill();

    if(prod){ ctx.strokeStyle=prod.colore+'99'; ctx.lineWidth=1*s; ctx.stroke(); }

    ctx.font=(10*s)+'px serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillStyle='white';
    ctx.fillText(ED[b.tipo]?.icona||'🏠', bx+3*s, by+bh/2);

    if(prod&&prod.valore>0){
      ctx.fillStyle=prod.colore; ctx.font='bold '+(8*s)+'px sans-serif';
      ctx.fillText('+'+prod.valore, bx+16*s, by+bh/2-2*s);
      ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font=(6*s)+'px sans-serif';
      ctx.fillText(prod.risorsa, bx+16*s, by+bh/2+5*s);
    } else if(prod){
      ctx.fillStyle=prod.colore; ctx.font=(7*s)+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText(prod.risorsa, bx+bw/2+4*s, by+bh/2);
    }

    if(schiaviQui>0){
      ctx.fillStyle='#ffbbbb'; ctx.font='bold '+(7*s)+'px sans-serif'; ctx.textAlign='right';
      ctx.fillText('⛏'+schiaviQui, bx+bw-2*s, by+bh/2);
    }

    // Indicatore rete sentieri: verde = collegato a porto/palazzo, giallo = strada vicina,
    // rosso = isolato. Piccolo, ma rende chiaro che i sentieri contano davvero.
    if(typeof efficienzaStradaEdificio==='function' && b.tipo!=='governatore'){
      const eff=efficienzaStradaEdificio(b);
      ctx.fillStyle=eff>=1?'#4fc04f':eff>=0.7?'#f0c040':'#c0392b';
      ctx.font='bold '+(7*s)+'px sans-serif'; ctx.textAlign='right';
      ctx.fillText('🛤', bx+bw-3*s, by+5*s);
    }

    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.moveTo(ix-3*s,by+bh); ctx.lineTo(ix+3*s,by+bh); ctx.lineTo(ix,by+bh+4*s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function apriPopupEdificio(edificio){
  const def=ED[edificio.tipo];
  if(!def) return;
  const prod=EDIFICIO_PRODUZIONE[edificio.tipo];
  const schiaviQui=(G.schiavi||[]).filter(s=>s.edificioR===edificio.r&&s.edificioC===edificio.c);
  const accettaSchiavi=typeof LAVORO_SCHIAVI!=='undefined'&&!!LAVORO_SCHIAVI[edificio.tipo];
  const lav=accettaSchiavi?LAVORO_SCHIAVI[edificio.tipo]:null;

  let h='<div style="text-align:center;margin-bottom:12px">';
  h+='<div style="font-size:2.5rem">'+def.icona+'</div>';
  h+='<div style="font-family:\'Pirata One\',cursive;color:var(--oro);font-size:1.2rem">'+def.nome+'</div>';
  h+='<div style="font-size:.72rem;color:var(--sabbia);font-style:italic;margin-top:3px">'+def.effetto+'</div>';
  h+='</div>';

  if(typeof efficienzaStradaEdificio==='function' && edificio.tipo!=='governatore'){
    const eff=efficienzaStradaEdificio(edificio);
    const stato=eff>=1?'Collegato al porto/palazzo':eff>=0.7?'Sentiero vicino, ma rete incompleta':'Isolato: produzione ridotta';
    const colore=eff>=1?'#4fc04f':eff>=0.7?'#f0c040':'#c0392b';
    h+='<div style="background:rgba(255,255,255,.05);border:1px solid '+colore+'66;';
    h+='border-radius:6px;padding:7px 9px;margin-bottom:10px;font-size:.72rem;color:var(--sabbia)">';
    h+='<strong style="color:'+colore+'">🛤 Rete sentieri: '+Math.round(eff*100)+'%</strong><br>'+stato+'</div>';
  }

  if(prod&&prod.valore>0){
    h+='<div style="display:flex;justify-content:center;gap:16px;background:rgba(255,255,255,.05);';
    h+='border-radius:6px;padding:8px;margin-bottom:10px;border:1px solid var(--bordo)">';
    h+='<div style="text-align:center">';
    h+='<div style="font-size:1.4rem">'+prod.icona+'</div>';
    h+='<div style="font-family:\'Cinzel\',serif;font-size:1rem;color:'+prod.colore+'">+'+prod.valore+'</div>';
    h+='<div style="font-size:.62rem;color:var(--sabbia)">'+prod.risorsa+'/giorno</div>';
    h+='</div></div>';
  }

  if(accettaSchiavi&&lav){
    h+='<div style="background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);';
    h+='border-radius:5px;padding:8px 10px;margin-bottom:10px">';
    h+='<div style="font-size:.7rem;color:#ffbbbb;margin-bottom:5px">';
    h+='⛏ Schiavi: <strong>'+schiaviQui.length+'</strong> / 3 max</div>';

    for(const sv of schiaviQui){
      const fc=sv.felicita>60?'#4fc04f':sv.felicita>30?'#f0c040':'#c0392b';
      const pe=Math.floor((lav.base||0)*(0.2+sv.felicita/100));
      h+='<div style="display:flex;justify-content:space-between;font-size:.68rem;';
      h+='color:var(--sabbia);margin-bottom:2px">';
      h+='<span>⛓ '+sv.nome+'</span>';
      h+='<span style="color:'+fc+'">😊'+sv.felicita+'% '+(lav.icona||'')+pe+'/g</span></div>';
      h+='<div style="height:3px;background:#1a2a1a;border-radius:2px;margin-bottom:3px">';
      h+='<div style="height:100%;width:'+sv.felicita+'%;background:'+fc+';border-radius:2px"></div></div>';
    }
    if(schiaviQui.length===0)
      h+='<div style="font-size:.68rem;color:#666;font-style:italic">Nessuno schiavo assegnato</div>';
    if((G.prigionieri||[]).length>0&&schiaviQui.length<3)
      h+='<button class="btn-piccolo" style="margin-top:5px" onclick="chiudiModale();apriGestioneSchiavi()">+ Assegna schiavo</button>';
    h+='</div>';
  }

  h+='<div style="display:flex;gap:6px;margin-top:10px">';
  h+='<button class="mbtn pericolo" onclick="demolisciEdificio('+edificio.r+','+edificio.c+')">🔨 Demolisci</button>';
  h+='<button class="mbtn secondario" onclick="chiudiModale()">Chiudi</button>';
  h+='</div>';

  apriModale(def.icona+' '+def.nome, h);
}

function demolisciEdificio(r,c){
  G.edifici=G.edifici.filter(b=>!(b.r===r&&b.c===c));
  if(G.schiavi) G.schiavi=G.schiavi.filter(s=>!(s.edificioR===r&&s.edificioC===c));
  chiudiModale();
  aggMsg('🔨 Edificio demolito','male');
  aggiornaUI();
}

// ── NAVI ANIMATE ──
const _naviMare={};

function inizializzaNaveMare(nave){
  if(_naviMare[nave.id]) return;
  const puntoPorto=typeof trovaPortoRaid==='function'?trovaPortoRaid():null;
  let sx=canvas?canvas.width*0.1:100, sy=canvas?canvas.height*0.3:200;
  if(puntoPorto&&canvas){ const p=isoProj(puntoPorto.c,puntoPorto.r); sx=p.x; sy=p.y; }
  _naviMare[nave.id]={x:sx,y:sy,ondaOffset:Math.random()*Math.PI*2,angolo:0};
}


// ═══════════════════════════════════════
// FASE 2 — PORTO VIVO / DENSITÀ TROPICO 2
// ═══════════════════════════════════════
// Obiettivo: rendere il porto il cuore visivo della simulazione.
// Navi visibili da attraccate, clutter scenico, merci e schiavi trasportatori.

const PORTO_PROPS_TIPI = ['cassa','botte','rete','palo','corda','lanterna','barile'];
const RISORSE_PORTO = [
  {k:'cibo',  icona:'🍖', nome:'cibo'},
  {k:'legno', icona:'🪵', nome:'legno'},
  {k:'rum',   icona:'🍺', nome:'rum'},
  {k:'oro',   icona:'💰', nome:'oro'},
];

function hashPorto(v){
  let x = Math.sin(v * 999.731) * 43758.5453;
  return x - Math.floor(x);
}

function puntoPortoVivo(){
  if(typeof trovaPortoRaid==='function') return trovaPortoRaid();
  const porto=G.edifici.find(b=>b.tipo==='porto')||G.edifici.find(b=>b.tipo==='cantiere');
  if(porto) return {r:porto.r,c:porto.c,tipo:porto.tipo};
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2),tipo:'centro'};
}

function tileAcquaVicino(r,c){
  const dirs=[
    [-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],
    [-2,0],[2,0],[0,-2],[0,2],[-2,-1],[-2,1],[2,-1],[2,1]
  ];
  for(const [dr,dc] of dirs){
    const nr=r+dr,nc=c+dc;
    if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
    const t=G.mappa[nr][nc];
    if(t===T.BASSO||t===T.OCEANO) return {r:nr,c:nc};
  }
  return {r,c};
}

function slotAttracco(nave){
  const porto=puntoPortoVivo();
  const acqua=tileAcquaVicino(porto.r,porto.c);
  const i=(nave.id||0)%4;
  const offsets=[
    {dc:-.15,dr:.05},{dc:.35,dr:.15},{dc:-.45,dr:.35},{dc:.15,dr:.55}
  ][i];
  return {
    r:acqua.r+0.5+offsets.dr,
    c:acqua.c+0.5+offsets.dc,
    portoR:porto.r,
    portoC:porto.c,
  };
}

function rigeneraPortoVivo(){
  G.portoProps = [];
  const basi = G.edifici.filter(b=>b.tipo==='porto'||b.tipo==='cantiere');
  if(basi.length===0){
    const p=puntoPortoVivo();
    basi.push({r:p.r,c:p.c,tipo:p.tipo||'spiaggia'});
  }

  let id=1;
  for(const b of basi){
    const quantita = b.tipo==='porto' ? 18 : 10;
    for(let i=0;i<quantita;i++){
      const ang = i*1.77 + hashPorto(b.r*31+b.c*17+i)*.7;
      const rad = .35 + hashPorto(i*13+b.r)*1.25;
      const rr = b.r + 0.5 + Math.sin(ang)*rad*.72;
      const cc = b.c + 0.5 + Math.cos(ang)*rad;
      const tr=Math.max(0,Math.min(G.RIGHE-1,Math.floor(rr)));
      const tc=Math.max(0,Math.min(G.COLS-1,Math.floor(cc)));
      const t=G.mappa[tr]&&G.mappa[tr][tc];
      if(t===T.OCEANO||t===T.BASSO||t===T.FIUME) continue;
      G.portoProps.push({
        id:id++,
        tipo:PORTO_PROPS_TIPI[(i + b.r + b.c) % PORTO_PROPS_TIPI.length],
        r:rr,c:cc,
        scala:.75+hashPorto(i*19+b.c)*.55,
        rot:hashPorto(i*23+b.r)*Math.PI,
        vicino:b.tipo
      });
    }

    // Paletti e lanterne lungo il lato mare
    const acqua=tileAcquaVicino(b.r,b.c);
    for(let j=0;j<4;j++){
      G.portoProps.push({
        id:id++,
        tipo:j%2===0?'palo':'lanterna',
        r:b.r+0.2+j*.18,
        c:b.c+0.15+(acqua.c>b.c?.7:-.7),
        scala:1,
        rot:0,
        vicino:'molo'
      });
    }
  }
}

function assicuraPortoVivo(){
  if(!G.portoProps) rigeneraPortoVivo();
}

function disegnaPropPorto(prop,cx,cy,s){
  const sc=G.ISO_H*s*(prop.scala||1);
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate((prop.rot||0)*0.08);

  // ombra
  ctx.globalAlpha=.25;
  ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(sc*.15,sc*.16,sc*.22,sc*.07,.2,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  switch(prop.tipo){
    case 'cassa':
      isoBox(0,0,sc*.34,sc*.22,sc*.22,'#9a6a2a','#b88436','#6b461a');
      ctx.strokeStyle='rgba(60,35,10,.7)'; ctx.lineWidth=Math.max(.6,s);
      ctx.beginPath(); ctx.moveTo(-sc*.14,-sc*.08); ctx.lineTo(sc*.14,sc*.06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sc*.14,-sc*.08); ctx.lineTo(-sc*.14,sc*.06); ctx.stroke();
      break;
    case 'botte':
    case 'barile':
      ctx.fillStyle='#7a4a18';
      ctx.beginPath(); ctx.ellipse(0,-sc*.08,sc*.18,sc*.13,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#9a6228'; ctx.fillRect(-sc*.18,-sc*.08,sc*.36,sc*.24);
      ctx.fillStyle='#5a3210';
      ctx.beginPath(); ctx.ellipse(0,sc*.16,sc*.18,sc*.13,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#3a2008'; ctx.lineWidth=s;
      ctx.beginPath(); ctx.moveTo(-sc*.14,-sc*.02); ctx.lineTo(sc*.14,-sc*.02); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-sc*.14,sc*.08); ctx.lineTo(sc*.14,sc*.08); ctx.stroke();
      break;
    case 'rete':
      ctx.strokeStyle='rgba(205,190,140,.65)'; ctx.lineWidth=Math.max(.7,s*.7);
      for(let i=-2;i<=2;i++){
        ctx.beginPath(); ctx.moveTo(-sc*.24,i*sc*.045); ctx.lineTo(sc*.24,i*sc*.045+sc*.1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i*sc*.06,-sc*.12); ctx.lineTo(i*sc*.06+sc*.1,sc*.16); ctx.stroke();
      }
      break;
    case 'corda':
      ctx.strokeStyle='#c0a060'; ctx.lineWidth=Math.max(1.2,s*1.5);
      ctx.beginPath(); ctx.ellipse(0,0,sc*.22,sc*.1,.2,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(sc*.05,sc*.02,sc*.13,sc*.06,.2,0,Math.PI*2); ctx.stroke();
      break;
    case 'lanterna':
      ctx.strokeStyle='#5a3a10'; ctx.lineWidth=2*s;
      ctx.beginPath(); ctx.moveTo(0,sc*.1); ctx.lineTo(0,-sc*.42); ctx.stroke();
      ctx.fillStyle=`rgba(255,190,70,${.45+Math.sin(frame*.08+prop.id)*.18})`;
      ctx.beginPath(); ctx.arc(0,-sc*.5,sc*.1,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#8a6020'; ctx.lineWidth=s;
      ctx.strokeRect(-sc*.08,-sc*.58,sc*.16,sc*.16);
      break;
    case 'palo':
    default:
      ctx.strokeStyle='#6a4318'; ctx.lineWidth=3*s;
      ctx.beginPath(); ctx.moveTo(0,sc*.14); ctx.lineTo(0,-sc*.5); ctx.stroke();
      ctx.fillStyle='#8a6020'; ctx.beginPath(); ctx.arc(0,-sc*.52,sc*.045,0,Math.PI*2); ctx.fill();
      break;
  }
  ctx.restore();
}

function disegnaCaricoSchiavo(sv,cx,cy,s){
  if(!sv._trasporto || !sv._trasporto.carry) return;
  const merce=sv._trasporto.risorsa||RISORSE_PORTO[0];
  const sc=G.ISO_H*s*.16;
  ctx.save();
  ctx.translate(cx+sc*.55, cy-G.ISO_H*s*.35);
  ctx.fillStyle='rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(sc*.1,sc*.18,sc*.22,sc*.07,.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#9a6a2a';
  ctx.fillRect(-sc*.14,-sc*.08,sc*.32,sc*.22);
  ctx.strokeStyle='#5a3210'; ctx.lineWidth=s;
  ctx.strokeRect(-sc*.14,-sc*.08,sc*.32,sc*.22);
  ctx.font=`${Math.max(8,10*s)}px serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(merce.icona,sc*.02,sc*.03);
  ctx.restore();
}

function aggiornaTargetTrasportoSchiavo(sv){
  const porto=puntoPortoVivo();
  const edificio={r:sv.edificioR,c:sv.edificioC};
  if(!sv._trasporto){
    sv._trasporto={
      fase:'a_edificio',
      carry:false,
      risorsa:RISORSE_PORTO[Math.floor(Math.random()*RISORSE_PORTO.length)],
      attesa:Math.random()*2
    };
  }
  const tr=sv._trasporto;
  if(tr.attesa>0) return null;

  if(tr.fase==='a_edificio') return {r:edificio.r+.5,c:edificio.c+.5};
  if(tr.fase==='a_porto') return {r:porto.r+.5+(Math.random()-.5)*.25,c:porto.c+.5+(Math.random()-.5)*.25};
  return null;
}


function screenToIsoApprox(x,y){
  const W=G.ISO_W*G.ISO_SCALE, H=G.ISO_H*G.ISO_SCALE;
  const yy=y-G.camY, xx=x-G.camX;
  const col=(yy/H)+(xx/W);
  const row=(yy/H)-(xx/W);
  return {r:Math.round(row),c:Math.round(col)};
}
function tileAcqua(r,c){
  const t=G.mappa[r]&&G.mappa[r][c];
  return t===T.OCEANO||t===T.BASSO;
}
function trovaAcquaVicinoIso(r,c,raggio=7){
  if(tileAcqua(r,c)) return {r,c};
  for(let rad=1;rad<=raggio;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if(tileAcqua(nr,nc)) return {r:nr,c:nc};
    }
  }
  return null;
}
function correggiNaveSuAcqua(nm,forza=0.12){
  if(!canvas||!G.mappa) return;
  const g=screenToIsoApprox(nm.x,nm.y);
  if(tileAcqua(g.r,g.c)) return;
  const a=trovaAcquaVicinoIso(g.r,g.c,8);
  if(!a) return;
  const p=isoProj(a.c,a.r);
  const tx=p.x, ty=p.y+G.ISO_H*G.ISO_SCALE*.7;
  nm.x+=(tx-nm.x)*forza;
  nm.y+=(ty-nm.y)*forza;
}

function disegnaNaviMare(s){
  if(!G.navi||!canvas) return;
  assicuraPortoVivo();

  for(const nave of G.navi){
    inizializzaNaveMare(nave);
    const nm=_naviMare[nave.id];

    let targetX, targetY, label='';
    if(nave.inMare){
      // Navi in raid: restano su acqua. Usiamo un tile di oceano vicino al bordo
      // invece di una coordinata schermo generica, così non attraversano l'isola.
      if(!nm._raidWater || frame%180===0){
        const porto=puntoPortoVivo();
        const candidates=[];
        for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
          if(tileAcqua(r,c) && (r<3||c<3||r>G.RIGHE-4||c>G.COLS-4)) candidates.push({r,c});
        }
        candidates.sort((a,b)=>heuristica(a.r,a.c,porto.r,porto.c)-heuristica(b.r,b.c,porto.r,porto.c));
        nm._raidWater=candidates[(nave.id*3)%Math.max(1,Math.min(candidates.length,12))] || tileAcquaVicino(porto.r,porto.c);
      }
      const wp=isoProj(nm._raidWater.c,nm._raidWater.r);
      targetX=wp.x; targetY=wp.y+G.ISO_H*s*.7;
      label='⚓ rientra in '+nave.timerRaid+'g';
      nm.x+=(targetX-nm.x)*0.012;
      nm.y+=(targetY-nm.y)*0.012;
      correggiNaveSuAcqua(nm,0.09);
    } else {
      // Navi disponibili: restano fisicamente attraccate al porto/cantiere.
      const slot=slotAttracco(nave);
      const p=isoProj(slot.c,slot.r);
      targetX=p.x;
      targetY=p.y+G.ISO_H*s*.55;
      label='⚓ attraccata';
      if(!nm._dockInit){
        nm.x=targetX+(Math.random()-.5)*30*s;
        nm.y=targetY+(Math.random()-.5)*18*s;
        nm._dockInit=true;
      }
      nm.x+=(targetX-nm.x)*0.045;
      nm.y+=(targetY-nm.y)*0.045;
    }

    if(!nave.inMare) correggiNaveSuAcqua(nm,0.18);

    const onda=Math.sin(frame*0.02+nm.ondaOffset)*5*s;
    const ondaH=Math.cos(frame*0.015+nm.ondaOffset)*3*s;
    const dx=targetX-nm.x, dy=targetY-nm.y, dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>2) nm.angolo=Math.atan2(dy,dx)*0.18+nm.angolo*0.82;

    // Scia solo se in mare o in movimento verso il porto
    if(nave.inMare || dist>12*s){
      ctx.save();
      ctx.globalAlpha=0.18; ctx.strokeStyle='#aaddff'; ctx.lineWidth=3*s;
      ctx.beginPath();
      ctx.moveTo(nm.x,nm.y+onda);
      ctx.quadraticCurveTo(nm.x-40*s,nm.y+onda+8*s,nm.x-80*s,nm.y+onda+4*s);
      ctx.stroke(); ctx.restore();
    } else {
      // Piccolo riflesso da nave ormeggiata
      ctx.save();
      ctx.globalAlpha=.12; ctx.fillStyle='#d6ffff';
      ctx.beginPath(); ctx.ellipse(nm.x+18*s,nm.y+18*s,45*s,8*s,.1,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(nm.x,nm.y+onda);
    ctx.rotate((nave.inMare?nm.angolo*.3:0.05)+Math.sin(frame*0.025+nm.ondaOffset)*0.035);
    disegnaNav(0,ondaH,nave.livCannoni>0?'#5c3e2a':'#5c3a1a',s);
    ctx.restore();

    if(s>0.5){
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.65)';
      const lw=94*s,lx=nm.x-lw/2,ly=nm.y+onda+28*s;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(lx,ly,lw,16*s,3*s); else ctx.rect(lx,ly,lw,16*s);
      ctx.fill();
      ctx.fillStyle='#f0c040'; ctx.font='bold '+(7*s)+'px Cinzel,serif'; ctx.textAlign='center';
      ctx.fillText(nave.nome.substring(0,12),nm.x,ly+7*s);
      ctx.fillStyle=nave.inMare?'#aaddff':'#c8a96e'; ctx.font=(6*s)+'px sans-serif';
      ctx.fillText(label,nm.x,ly+13*s);
      ctx.restore();
    }
  }
}



// ═══════════════════════════════════════
// FASE 2B — SETUP INIZIALE STILE TROPICO 2
// ═══════════════════════════════════════
// Avvio partita: porto + nave attraccata + palazzo del governatore
// collegato da sentieri ad alcuni edifici iniziali.

function tileValidoInsediamento(r,c){
  if(r<1||c<1||r>=G.RIGHE-1||c>=G.COLS-1) return false;
  const t=G.mappa[r]&&G.mappa[r][c];
  return t===T.SABBIA||t===T.ERBA||t===T.FORESTA||t===T.SENTIERO||t===T.PALUDE;
}

function liberaTileInsediamento(r,c){
  if(!tileValidoInsediamento(r,c)) return false;
  G.mappa[r][c] = (G.mappa[r][c]===T.SABBIA) ? T.SABBIA : T.ERBA;
  G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
  G.rocce=G.rocce.filter(x=>!(x.r===r&&x.c===c));
  return true;
}

function creaSentieroScenario(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME) return;
  G.mappa[r][c]=T.SENTIERO;
  G.alberi=G.alberi.filter(a=>!(Math.floor(a.r)===r&&Math.floor(a.c)===c));
  G.rocce=G.rocce.filter(x=>!(x.r===r&&x.c===c));
}

function collegaSentieroScenario(a,b){
  let r=a.r,c=a.c;
  const guard=80;
  for(let i=0;i<guard;i++){
    creaSentieroScenario(r,c);
    if(r===b.r && c===b.c) break;
    const dr=b.r-r, dc=b.c-c;
    // sentiero coloniale leggibile: prima diagonale, poi assi cardinali
    if(Math.abs(dc)>0 && Math.abs(dr)>0 && Math.random()<0.58){
      c += dc>0?1:-1;
      r += dr>0?1:-1;
    } else if(Math.abs(dc)>=Math.abs(dr)) c += dc>0?1:-1;
    else r += dr>0?1:-1;
    if(r<1||c<1||r>=G.RIGHE-1||c>=G.COLS-1) break;
  }
}

function trovaPostoEdificioVicino(base, offsets){
  for(const [dr,dc] of offsets){
    const r=base.r+dr,c=base.c+dc;
    if(!tileValidoInsediamento(r,c)) continue;
    if(G.edifici.some(b=>b.r===r&&b.c===c)) continue;
    liberaTileInsediamento(r,c);
    return {r,c};
  }
  // fallback a spirale
  for(let rad=1;rad<=5;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const r=base.r+dr,c=base.c+dc;
      if(!tileValidoInsediamento(r,c)) continue;
      if(G.edifici.some(b=>b.r===r&&b.c===c)) continue;
      liberaTileInsediamento(r,c);
      return {r,c};
    }
  }
  return {r:base.r,c:base.c};
}

function aggiungiEdificioScenario(tipo,pos){
  if(!ED[tipo]||!pos) return null;
  const esiste=G.edifici.some(b=>b.tipo===tipo && b.r===pos.r && b.c===pos.c);
  if(esiste) return null;
  liberaTileInsediamento(pos.r,pos.c);
  const b={tipo,r:pos.r,c:pos.c,scenario:true};
  G.edifici.push(b);
  return b;
}

function inizializzaScenarioTropico2(){
  // usa il sentiero generato dalla spiaggia verso il centro come spina dorsale iniziale
  const path=(G.sentieri&&G.sentieri.length)?G.sentieri.slice():[];
  const portoPos = path.length ? path[0] : {r:Math.floor(G.RIGHE/2),c:G.COLS-4};
  const palazzoBase = path.length ? path[Math.max(0,Math.floor(path.length*.78))] : {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2)};

  // crea spazio leggibile attorno al palazzo
  for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){
    const r=palazzoBase.r+dr,c=palazzoBase.c+dc;
    if(tileValidoInsediamento(r,c)) liberaTileInsediamento(r,c);
  }

  const palazzo=trovaPostoEdificioVicino(palazzoBase, [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]);
  const porto=trovaPostoEdificioVicino(portoPos, [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1]]);

  aggiungiEdificioScenario('porto', porto);
  aggiungiEdificioScenario('governatore', palazzo);

  // piazza centrale e strada porto → palazzo
  collegaSentieroScenario(porto,palazzo);
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(Math.abs(dr)+Math.abs(dc)<=1) creaSentieroScenario(palazzo.r+dr,palazzo.c+dc);
  }

  // piccolo insediamento già presente, come in Tropico 2: servizi base e produzione iniziale
  const defs=[
    ['taverna',     [[0,-2],[1,-2],[-1,-2],[2,-1],[-2,-1]]],
    ['casapirata',  [[-2,0],[-2,1],[-1,2],[1,2]]],
    ['fattoria',    [[2,0],[2,1],[3,0],[1,2]]],
    ['segheria',    [[0,2],[1,2],[-1,2],[2,2]]],
    ['prigione',    [[-2,-1],[-2,-2],[-1,-2]]],
  ];
  for(const [tipo,offs] of defs){
    const pos=trovaPostoEdificioVicino(palazzo,offs);
    const b=aggiungiEdificioScenario(tipo,pos);
    if(b) collegaSentieroScenario(palazzo,pos);
  }

  // molo e piazza più leggibili: il sentiero deve essere il tessuto connettivo dell'insediamento.
  for(const [dr,dc] of [[0,0],[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]) creaSentieroScenario(porto.r+dr,porto.c+dc);
  for(const b of G.edifici.filter(x=>x.scenario)) collegaEdificioAlSentiero(b);

  // posiziona la ciurma iniziale intorno al palazzo, non nel centro astratto della mappa
  G._spawnScenario={r:palazzo.r,c:palazzo.c};
}
// ═══════════════════════════════════════
// MODULO: AVVIO_GIOCO
// ═══════════════════════════════════════
// ── AVVIO GIOCO, PIRATI, CAPITANI ──
function avviaGioco(){
  document.getElementById('schermata-titolo').style.display='none';
  document.getElementById('barra-sup').style.display='flex';
  document.getElementById('principale').style.display='flex';
  document.getElementById('barra-inf').style.display='flex';
  canvas = document.getElementById('mappa-canvas');
  ctx = canvas.getContext('2d');
  generaMappa();
  inizializzaScenarioTropico2();
  ridimensionaCanvas();
  window.addEventListener('orientationchange',()=>setTimeout(()=>{ridimensionaCanvas();impostaMobile();},100));
  for(let i=0;i<4;i++){
    const p=creaaPirata();
    if(G._spawnScenario){ p.mr=G._spawnScenario.r+(Math.random()-.5)*1.8; p.mc=G._spawnScenario.c+(Math.random()-.5)*1.8; }
  }
  G.navi.push(creaNave(0,'La Marea Maledetta'));
  if(typeof rigeneraPortoVivo==='function') rigeneraPortoVivo();
  assegnaMissioni();
  impostaInput();
  impostaMobile();
  notifica('⚓ Benvenuto, Governatore Pirata!','Il porto, il palazzo e il primo villaggio sono pronti. Ora fai prosperare la cala.');
  aggiornaUI();
  cicloGioco();
  // Musica: parte al primo click (policy autoplay browser)
  document.addEventListener("click", avviaMusicaAlPrimoClick, {once:true});
  impostaVelocitaUI();
}

function creaaPirata(override={}){
  const n=override.nome||NOMI_PIRATI[Math.floor(Math.random()*NOMI_PIRATI.length)];
  const r=override.ruolo||RUOLI_PIRATI[Math.floor(Math.random()*RUOLI_PIRATI.length)];
  const cx=G.COLS/2, cy=G.RIGHE/2;
  // tratto casuale
  const tratto=TRATTI[Math.floor(Math.random()*TRATTI.length)];
  const p={
    id:override.id||Date.now()+Math.random(),
    nome:n, ruolo:r,
    combattimento:override.combattimento||(20+Math.floor(Math.random()*60)),
    navigazione:override.navigazione||(20+Math.floor(Math.random()*60)),
    umore:override.umore||(40+Math.floor(Math.random()*40)),
    mc:override.mc ?? (cx-2+Math.random()*4),
    mr:override.mr ?? (cy-2+Math.random()*4),
    naveId:null, paga:override.paga||4,
    tratto:override.tratto||tratto,
    oggetto:override.oggetto||null,  // {id, nome, icona, bonus}
    xp:override.xp||0,
    livello:override.livello||1,
    capitano:override.capitano||false,  // è un capitano famoso?
    titolo:override.titolo||null,
    icona:override.icona||null,
    abilita:override.abilita||null,
    // stato movimento pirati
    _stato:'vaga', _vagaTimer:Math.floor(Math.random()*40),
    _vagaDx:0, _vagaDy:0, _pausaTimer:0,
    dest:null, percorso:null, percorsoIdx:0,
  };
  G.pirati.push(p);
  controllaMissione('pirati',G.pirati.length);
  return p;
}

function reclutaCapitano(id){
  const cap=CAPITANI.find(c=>c.id===id);
  if(!cap||cap.reclutato){aggMsg('Capitano non disponibile!','male');return;}
  // check costo
  for(const[k,v] of Object.entries(cap.costo)){
    if((G[k]||0)<v){aggMsg('Risorse insufficienti per '+cap.nome+'!','male');chiudiModale();return;}
  }
  for(const[k,v] of Object.entries(cap.costo)) G[k]-=v;
  cap.reclutato=true;
  creaaPirata({
    id:'cap_'+cap.id,
    nome:cap.nome, ruolo:'Capitano',
    combattimento:cap.combattimento,
    navigazione:cap.navigazione,
    umore:cap.umore,
    paga:8,
    tratto:{id:cap.id, label:cap.tratto, icona:cap.icona},
    capitano:true,
    titolo:cap.titolo,
    icona:cap.icona,
    abilita:cap.abilita,
  });
  notifica(cap.icona+' '+cap.nome+' Reclutato!',cap.abilita);
  chiudiModale();
  aggiornaUI();
}


function trovaSentieroVicino(base,raggio=8){
  let best=null,bestD=Infinity;
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]!==T.SENTIERO) continue;
    const d=heuristica(base.r,base.c,r,c);
    if(d<bestD && d<=raggio){bestD=d; best={r,c};}
  }
  return best;
}
function collegaEdificioAlSentiero(ed){
  const vicino=(typeof trovaSentieroVicinoRaggiungibile==='function')
    ? trovaSentieroVicinoRaggiungibile(ed,14)
    : trovaSentieroVicino(ed,9);
  if(!vicino) return;
  // Collega dal tile adiacente all'edificio, evitando acqua e il tile occupato.
  let start={r:ed.r,c:ed.c};
  const adiacenti=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
  for(const [dr,dc] of adiacenti){
    const r=ed.r+dr,c=ed.c+dc;
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) continue;
    if(G.edifici.some(b=>b.r===r&&b.c===c)) continue;
    if(costoTile(r,c)<Infinity){ start={r,c}; break; }
  }
  if(typeof collegaConSentieroDrittoSicuro==='function') collegaConSentieroDrittoSicuro(start,vicino);
  else collegaSentieroScenario(start,vicino);
  creaSentieroScenario(start.r,start.c);
}



// ═══════════════════════════════════════════════════
// FASE 2D — RETE SENTIERI CENTRALE
// ═══════════════════════════════════════════════════
// In stile Tropico 2, il sentiero non è decorazione: collega porto,
// palazzo ed edifici. Gli edifici isolati producono meno e gli NPC
// preferiscono sempre muoversi sulla rete viaria.

function isTileSentiero(r,c){ return !!(G.mappa[r] && G.mappa[r][c]===T.SENTIERO); }
function isTileTerraStrada(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  const t=G.mappa[r][c];
  return t===T.SABBIA||t===T.ERBA||t===T.FORESTA||t===T.PALUDE||t===T.COLLINA||t===T.SENTIERO;
}
function tileSentieroAdiacente(ed){
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
  for(const [dr,dc] of dirs){
    const r=ed.r+dr,c=ed.c+dc;
    if(isTileSentiero(r,c)) return {r,c};
  }
  return null;
}
function accessiSentieroEdificio(ed){
  const out=[];
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
  for(const [dr,dc] of dirs){
    const r=ed.r+dr,c=ed.c+dc;
    if(isTileSentiero(r,c)) out.push({r,c});
  }
  return out;
}
function trovaHubSentieri(){
  const hubs=G.edifici.filter(b=>b.tipo==='governatore'||b.tipo==='porto'||b.tipo==='cantiere');
  const acc=[];
  for(const h of hubs) acc.push(...accessiSentieroEdificio(h));
  if(acc.length) return acc;
  return (G.sentieri||[]).slice(0,1);
}
function reteSentieriConnessa(ed){
  const start=accessiSentieroEdificio(ed);
  if(!start.length) return false;
  const hubs=trovaHubSentieri();
  if(!hubs.length) return true;
  const target=new Set(hubs.map(p=>p.r+','+p.c));
  const q=start.slice();
  const seen=new Set(q.map(p=>p.r+','+p.c));
  let guard=0;
  while(q.length && guard++<900){
    const cur=q.shift();
    if(target.has(cur.r+','+cur.c)) return true;
    for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){
      const nr=cur.r+dr,nc=cur.c+dc,k=nr+','+nc;
      if(seen.has(k)||!isTileSentiero(nr,nc)) continue;
      seen.add(k); q.push({r:nr,c:nc});
    }
  }
  return false;
}
function efficienzaStradaEdificio(ed){
  if(!ed) return 0.35;
  if(ed.tipo==='governatore') return 1;
  if(reteSentieriConnessa(ed)) return 1;
  if(tileSentieroAdiacente(ed)) return 0.70;
  return 0.40;
}
function moltiplicatoreReteEdifici(tipo){
  const edifici=G.edifici.filter(b=>b.tipo===tipo);
  if(!edifici.length) return 0;
  return edifici.reduce((a,b)=>a+efficienzaStradaEdificio(b),0);
}
function reteSentieriPercentuale(){
  const rilevanti=G.edifici.filter(b=>!['governatore'].includes(b.tipo));
  if(!rilevanti.length) return 100;
  const score=rilevanti.reduce((a,b)=>a+(reteSentieriConnessa(b)?1:0),0);
  return Math.round(score/rilevanti.length*100);
}
function avvisaReteSentieri(){
  if(G.tick%4!==0) return;
  const perc=reteSentieriPercentuale();
  if(perc<70) aggMsg('🛤 La rete dei sentieri è debole: edifici isolati producono meno.','male');
}
function trovaSentieroVicinoRaggiungibile(base,raggio=14){
  let best=null,bestD=Infinity;
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]!==T.SENTIERO) continue;
    const d=heuristica(base.r,base.c,r,c);
    if(d>raggio||d>=bestD) continue;
    bestD=d; best={r,c};
  }
  return best;
}
function collegaConSentieroDrittoSicuro(a,b){
  let r=a.r,c=a.c;
  const guard=100;
  for(let i=0;i<guard;i++){
    creaSentieroScenario(r,c);
    if(r===b.r && c===b.c) break;
    const poss=[];
    const dr=b.r-r, dc=b.c-c;
    if(dc!==0) poss.push({r,c:c+(dc>0?1:-1)});
    if(dr!==0) poss.push({r:r+(dr>0?1:-1),c});
    if(dc!==0&&dr!==0) poss.push({r:r+(dr>0?1:-1),c:c+(dc>0?1:-1)});
    poss.sort((x,y)=>heuristica(x.r,x.c,b.r,b.c)-heuristica(y.r,y.c,b.r,b.c));
    const next=poss.find(p=>isTileTerraStrada(p.r,p.c) && !G.edifici.some(e=>e.r===p.r&&e.c===p.c));
    if(!next) break;
    r=next.r; c=next.c;
  }
}

// ═══════════════════════════════════════════════════
// COSTRUZIONE
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════
// MODULO: COSTRUZIONE
// ═══════════════════════════════════════
// ── COSTRUZIONE EDIFICI & SENTIERI ──
function selezionaSentiero(){
  G.modalitaCostruzione='sentiero';
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  const btn=document.getElementById('b-sentiero');
  if(btn) btn.classList.add('attivo-strumento');
  document.getElementById('btn-annulla').classList.add('mostra');
  document.getElementById('mappa-wrap').classList.add('modalita-costruzione');
  aggMsg('Trascina sulla mappa per costruire sentieri (2 oro/tile)','info');
  if(isMobile()&&!isLandscapeMobile()) chiudiPannelloMobile();
}

function selezionaCostruzione(tipo){
  G.modalitaCostruzione=tipo;
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  const btn=document.getElementById('b-'+tipo);
  if(btn) btn.classList.add('attivo-strumento');
  document.getElementById('btn-annulla').classList.add('mostra');
  document.getElementById('mappa-wrap').classList.add('modalita-costruzione');
  aggMsg(`Seleziona un tile di terra per costruire ${ED[tipo].nome}.`,'info');
  // Su mobile chiudi il drawer e porta il giocatore sulla mappa
  if(isMobile() && !isLandscapeMobile()) chiudiPannelloMobile();
}
function annullaCostruzione(){
  G.modalitaCostruzione=null;
  document.querySelectorAll('.btn-costruisci').forEach(b=>b.classList.remove('attivo-strumento'));
  document.getElementById('btn-annulla').classList.remove('mostra');
  document.getElementById('mappa-wrap').classList.remove('modalita-costruzione');
}
function puoCostruire(r,c){
  if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) return false;
  const t=G.mappa[r][c];
  if(t!==T.SABBIA&&t!==T.ERBA&&t!==T.COLLINA&&t!==T.SENTIERO) return false;
  if(G.edifici.find(b=>b.r===r&&b.c===c)) return false;
  // cantiere/porto: devono essere adiacenti (anche diagonale) a spiaggia o acque basse
  if(G.modalitaCostruzione==='cantiere'||G.modalitaCostruzione==='porto'){
    const vicini=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
    const hasSpiaggia=vicini.some(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) return false;
      return G.mappa[nr][nc]===T.SABBIA||G.mappa[nr][nc]===T.BASSO;
    });
    if(!hasSpiaggia) return false;
  }
  return true;
}
function piazzaEdificio(r,c){
  const tipo=G.modalitaCostruzione, def=ED[tipo];
  if(!puoCostruire(r,c)){aggMsg('Non puoi costruire qui!','male');return;}
  if(G.oro<def.costo.oro||G.legno<def.costo.legno){
    aggMsg(`Servono ${def.costo.oro} oro e ${def.costo.legno} legno.`,'male');return;
  }
  G.oro-=def.costo.oro; G.legno-=def.costo.legno;
  G.edifici.push({tipo,r,c});
  // FASE 2C: ogni edificio nuovo prova a collegarsi al sentiero più vicino.
  // Il sentiero diventa infrastruttura centrale, non solo decorazione.
  if(typeof collegaEdificioAlSentiero==='function') collegaEdificioAlSentiero({r,c});
  if((tipo==='porto'||tipo==='cantiere') && typeof rigeneraPortoVivo==='function') rigeneraPortoVivo();
  // rimuovi alberi/rocce in quel tile
  G.alberi=G.alberi.filter(a=>!(a.r===r&&a.c===c));
  G.rocce=G.rocce.filter(rc=>!(rc.r===r&&rc.c===c));
  annullaCostruzione();
  notifica(`${def.icona} ${def.nome} Costruito!`,def.effetto);
  controllaMissione('edifici',G.edifici.length);
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// NAVI
// ═══════════════════════════════════════════════════
// factory con tutti i campi
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
// ═══════════════════════════════════════
// MODULO: RAID_SEQUENCE
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// SEQUENZA RAID — stile Tropico 2
//
// Flusso:
//   1. Pianifica (modale) → lanciaRaidTattico()
//   2. Chiudi modale → campana appare
//   3. Pirati marciano verso il cantiere (3 sec)
//   4. Fine marcia → campana sparisce, nave parte (inMare=true)
//      I dati del raid vengono salvati su nave.raidData
//   5. Il tick fa scorrere i giorni normalmente
//   6. Al rientro (timerRaid === 0) si calcola l'esito
//      e si mostra la notifica con il risultato
// ═══════════════════════════════════════════════════


function trovaPortoRaid(){
  // Priorità: Porto dei Pirati -> Cantiere Navale -> prima spiaggia disponibile
  const porto=G.edifici.find(b=>b.tipo==='porto');
  if(porto) return {r:porto.r,c:porto.c,tipo:'porto'};
  const cantiere=G.edifici.find(b=>b.tipo==='cantiere');
  if(cantiere) return {r:cantiere.r,c:cantiere.c,tipo:'cantiere'};
  for(let r=0;r<G.RIGHE;r++) for(let c=0;c<G.COLS;c++){
    if(G.mappa[r][c]===T.SABBIA) return {r,c,tipo:'spiaggia'};
  }
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2),tipo:'centro'};
}

function piratiPerRaid(nave){
  // Se ci sono pirati assegnati alla nave, parte solo quell'equipaggio.
  // Se nessuno è assegnato, mantiene il comportamento precedente: si raduna tutta la ciurma.
  const assegnati=G.pirati.filter(p=>p.naveId===nave.id && !p.inRaid);
  return assegnati.length>0 ? assegnati : G.pirati.filter(p=>!p.inRaid);
}

function avviaSequenzaRaid(nave, bersaglio, tattica){
  // 1. Trova punto di imbarco: Porto dei Pirati, Cantiere o spiaggia.
  const puntoPorto=trovaPortoRaid();
  const destR=puntoPorto.r, destC=puntoPorto.c;
  const equipaggioRaid=piratiPerRaid(nave);
  nave.crewRaidIds=equipaggioRaid.map(p=>p.id);

  // 2. Manda i pirati verso il porto (con fallback se astar fallisce)
  for(const p of equipaggioRaid){
    try{
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.round(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.round(p.mc)));
      const path=astar(sr, sc, destR, destC);
      p.percorso = path && path.length>0 ? path : [{r:destR,c:destC}];
    } catch(e){
      p.percorso=[{r:destR,c:destC}];
    }
    p._stato="cammina"; p.percorsoIdx=0; p.dest={r:destR,c:destC};
  }

  // 3. Mostra overlay campana
  const ov=document.getElementById('overlay-campana');
  document.getElementById('campana-icona').textContent='🔔';
  document.getElementById('campana-titolo').textContent='⚔ '+bersaglio.icona+' '+bersaglio.nome;
  document.getElementById('campana-msg').textContent='La ciurma si raduna al porto...';
  document.getElementById('campana-barra').style.width='0%';
  ov.classList.add('aperto');

  // 4. Anima marcia (3 secondi) — con timeout di sicurezza
  const totalDur=3000;
  const startTs=performance.now();
  const barEl=document.getElementById('campana-barra');
  const msgEl=document.getElementById('campana-msg');
  const durata=Math.max(1, bersaglio.durataBase - (nave.livVelocita||0));
  let completato=false;

  // Sicurezza: se l'animazione non completa entro 5s, forza il completamento
  const safetyTimer=setTimeout(()=>{
    if(!completato){ completato=true; ov.classList.remove('aperto'); salpaNave(nave,bersaglio,tattica,durata); }
  }, 5000);

  function animaMarcia(ts){
    if(completato) return;
    const progress=Math.min(100,(ts-startTs)/totalDur*100);
    barEl.style.width=progress+'%';

    if(progress<33)       msgEl.textContent='🏃 La ciurma marcia verso il porto...';
    else if(progress<66)  msgEl.textContent='⛵ I pirati salgono a bordo di '+nave.nome+'...';
    else                  msgEl.textContent='🌊 Salpa verso '+bersaglio.nome+' ('+durata+' giorni)...';

    if(progress<100){
      requestAnimationFrame(animaMarcia);
    } else {
      completato=true;
      clearTimeout(safetyTimer);
      setTimeout(()=>{ ov.classList.remove('aperto'); salpaNave(nave,bersaglio,tattica,durata); }, 300);
    }
  }
  requestAnimationFrame(animaMarcia);
}

// Nave parte: salva i dati del raid, attiva il timer
function salpaNave(nave, bersaglio, tattica, durata){
  nave.inMare    = true;
  nave.timerRaid = durata;
  nave.raidData  = { bersaglio, tattica };
  if(_naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;

  G.cooldownRaid  = 4;
  G.contatori.raid++;

  // I pirati imbarcati spariscono dalla mappa finché la nave è in mare.
  const crewIds=new Set(nave.crewRaidIds||[]);
  for(const p of G.pirati){
    if(crewIds.has(p.id)){
      p.inRaid=true;
      p.inRaidNaveId=nave.id;
      p._stato='in_raid';
      p.dest=null; p.percorso=null; p.percorsoIdx=0;
    }
  }

  aggMsg('⛵ '+nave.nome+' salpa dal porto! Rientro tra '+durata+' giorni.','bene');
  controllaMissione('raid', G.contatori.raid);
  aggiornaUI();
}

// Chiamata dal tick quando timerRaid arriva a 0
function rientroNave(nave){
  nave.inMare=false;
  if(_naviMare[nave.id]) _naviMare[nave.id]._dockInit=false;

  // Al rientro la ciurma riappare al porto insieme alla nave.
  const puntoPorto=trovaPortoRaid();
  const crewIds=new Set(nave.crewRaidIds||[]);
  for(const p of G.pirati){
    if(crewIds.has(p.id)||p.inRaidNaveId===nave.id){
      p.inRaid=false;
      p.inRaidNaveId=null;
      p.mc=puntoPorto.c+0.5+(Math.random()-.5)*0.4;
      p.mr=puntoPorto.r+0.5+(Math.random()-.5)*0.4;
      p._stato='pausa';
      p._pausaSec=2+Math.random()*3;
      p.dest=null; p.percorso=null; p.percorsoIdx=0;
    }
  }
  nave.crewRaidIds=[];

  const rd=nave.raidData||null;
  nave.raidData=null;

  if(!rd){
    // Raid legacy senza dati salvati: bottino generico
    const bottino=Math.floor(80+Math.random()*100);
    const cibo=Math.floor(20+Math.random()*40);
    G.oro+=bottino; G.cibo+=cibo;
    nave.hp=Math.min(nave.hpMax, nave.hp+10);
    notifica('💰 Raid Completato!', nave.nome+' porta '+bottino+' oro.');
    for(const p of G.pirati) p.umore=Math.min(100,p.umore+12);
    return;
  }

  const {bersaglio, tattica}=rd;

  // Calcola esito
  const mediaCombo=G.pirati.reduce((a,p)=>a+p.combattimento,0)/Math.max(G.pirati.length,1);
  const forzaAtk=Math.floor(
    8
    + mediaCombo*.12
    + (nave.livCannoni||0)*4
    + (tattica.bonus.atk||0)
    + (G.ricerca.completate.has('cannoni')?8:0)
    + (G.ricerca.completate.has('bordata')&&tattica.id==='bordata'?12:0)
  );
  const nemDif=bersaglio.nemico.difesa + bersaglio.nemico.atk*.3;
  const chVitt=Math.min(92, Math.max(12, 55+(forzaAtk-nemDif)*3));
  const vinto=Math.random()*100<chVitt;

  // Danno alla nave
  const dannoBase=vinto
    ? nave.hpMax*(0.04+Math.random()*.1)
    : nave.hpMax*(0.18+Math.random()*.28);
  const dannoMod= tattica.id==='manovra_evasiva' ? 0.55
                : tattica.id==='speronamento'     ? 1.35
                : 1.0;
  const dannoNave=Math.max(2, Math.floor(dannoBase*dannoMod));
  nave.hp=Math.max(5, nave.hp-dannoNave);
  nave.hp=Math.min(nave.hpMax, nave.hp+8); // riparo minimo al rientro

  if(vinto){
    const b=bersaglio.bottino;
    const oro   = b.oro    ? b.oro[0]   +Math.floor(Math.random()*(b.oro[1]   -b.oro[0]))   : 0;
    const cibo  = b.cibo   ? b.cibo[0]  +Math.floor(Math.random()*(b.cibo[1]  -b.cibo[0]))  : 0;
    const legno = b.legno  ? b.legno[0] +Math.floor(Math.random()*(b.legno[1] -b.legno[0])) : 0;
    const rum   = b.rum    ? b.rum[0]   +Math.floor(Math.random()*(b.rum[1]   -b.rum[0]))   : 0;
    const ric   = b.ricerca? b.ricerca[0]+Math.floor(Math.random()*(b.ricerca[1]-b.ricerca[0])): 0;

    const multCan  = 1 + (nave.livCannoni||0)*.15;
    const multSti  = 1 + (nave.livStiva||0)*.2;
    const multRic  = G.ricerca.completate.has('cannoni') ? 1.3 : 1;
    const barbanera= G.pirati.find(p=>p.id==='cap_blackbeard'&&p.naveId===nave.id);
    const multBB   = barbanera ? 1.5 : 1;
    const multAbbo = (tattica.id==='abbordaggio') ? 1+(mediaCombo*.005) : 1;

    const oroFinale  = Math.floor(oro   * multCan * multRic * multBB * multAbbo);
    const cibFinale  = Math.floor(cibo  * multSti);
    const legFinale  = Math.floor(legno * multSti);
    const rumFinale  = Math.floor(rum);

    G.oro           += oroFinale;
    G.cibo          += cibFinale;
    G.legno         += legFinale;
    G.rum           += rumFinale;
    G.ricerca.punti += ric;

    // Reputazioni
    for(const[k,v] of Object.entries(bersaglio.rep))
      if(v && G.fazioni[k]) G.fazioni[k].rep=Math.max(-100,Math.min(100,G.fazioni[k].rep+v));

    if(barbanera) G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);

    const grazia=G.pirati.find(p=>p.id==='cap_grazia'&&p.naveId===nave.id);
    if(grazia){ const extra=Math.floor(oroFinale*.15); G.oro+=extra; }

    // XP e morale
    for(const p of G.pirati){
      p.umore=Math.min(100,p.umore+16);
      if(p.naveId===nave.id){
        p.xp=(p.xp||0)+20;
        const xpN=(p.livello||1)*100;
        if(p.xp>=xpN){
          p.xp-=xpN; p.livello=(p.livello||1)+1;
          p.combattimento=Math.min(100,p.combattimento+5);
          p.navigazione=Math.min(100,p.navigazione+5);
          notifica('⬆ '+p.nome+' sale di livello!','Lv'+p.livello+' — stats +5');
        }
      }
    }

    // Cattura prigionieri — numero basato su difficoltà
    const _faz=bersaglio.rep.reale<0?'Marina Reale':'Mercante';
    const _nMin=bersaglio.difficolta<=2?1:2;
    const _nMax=bersaglio.difficolta<=2?3:5;
    const _nCat=_nMin+Math.floor(Math.random()*(_nMax-_nMin+1));
    for(let _i=0;_i<_nCat;_i++){ if(Math.random()<0.75) catturaPrigioniero(_faz); }
    if(bersaglio.id==='galeone_reale'||bersaglio.id==='porto_coloniale'){
      catturaPrigioniero('Marina Reale'); catturaPrigioniero('Mercante');
    }

    // Evento speciale porto coloniale
    if(bersaglio.id==='porto_coloniale'){
      const ts=['cannoni','velocita','stiva'];
      const tt=ts[Math.floor(Math.random()*ts.length)];
      const kk='liv'+tt.charAt(0).toUpperCase()+tt.slice(1);
      if(nave[kk]<3){ nave[kk]++; aggMsg('⬆ Upgrade gratuito: '+tt+' su '+nave.nome,'bene'); }
    }
    if(bersaglio.id==='galeone_reale')
      G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+20);

    const bottinoStr=[
      oroFinale && `+${oroFinale}💰`,
      cibFinale && `+${cibFinale}🍖`,
      legFinale && `+${legFinale}🪵`,
      rumFinale && `+${rumFinale}🍺`,
      ric       && `+${ric}🔭`,
    ].filter(Boolean).join(' ');

    notifica('⚔ Raid Riuscito!', bersaglio.icona+' '+bersaglio.nome+' saccheggiata! '+bottinoStr);
    aggMsg('💰 '+nave.nome+' rientra: '+bottinoStr+' (danno -'+dannoNave+'hp)','bene');

  } else {
    for(const p of G.pirati) p.umore=Math.max(5,p.umore-18);
    if(Math.random()<0.35) catturaPrigioniero(bersaglio.rep.reale<0?'Marina Reale':'Mercante');
    notifica('💀 Raid Fallito',
      bersaglio.icona+' '+bersaglio.nome+' ha respinto l\'attacco. '+nave.nome+' rientra danneggiata.','male');
    aggMsg('💀 Raid fallito — nave -'+dannoNave+' HP','male');
  }
}

// Compatibilità
function lanciaRaid(nave){
  nave.inMare=true;
  const durata=Math.max(1,2+Math.floor(Math.random()*2)-(nave.livVelocita||0));
  nave.timerRaid=durata;
  nave.raidData=null;
  G.cooldownRaid=4; G.contatori.raid++;
  G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+3);
  aggMsg(nave.nome+' salpa!','bene');
  controllaMissione('raid',G.contatori.raid);
  aggiornaUI();
}
function iniziaBattegliaTattica(nave,bersaglio,tattica){ avviaSequenzaRaid(nave,bersaglio,tattica); }
function chiudiBattegliaTattica(){ document.getElementById('overlay-campana').classList.remove('aperto'); }
function chiudiBattaglia(){ chiudiBattegliaTattica(); }
function iniziaBattaglia(nave,em){ avviaSequenzaRaid(nave,BERSAGLI_RAID[em?0:2],TATTICHE_RAID[0]); }

// ── PRIGIONIERI ──
// ═══════════════════════════════════════
// MODULO: PRIGIONE_COMMERCIO
// ═══════════════════════════════════════
// ── PRIGIONIERI, RICERCA, COMMERCIO, EDITTI ──
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
  creaaPirata();
  aggMsg(`⚔ ${p.nome} si unisce alla ciurma!`,'bene');
  aggiornaUI();
}
function apriPrigione(){
  const haPrigione=G.edifici.find(b=>b.tipo==='prigione');
  let html=`<p>I prigionieri catturati possono essere riscattati per oro o reclutati come pirati.</p>`;
  if(!haPrigione) html+=`<p style="color:#ffaaaa">⚠ Costruisci una Prigione per tenere i prigionieri!</p>`;
  if(G.prigionieri.length===0){html+=`<p>Nessun prigioniero al momento.</p>`;}
  else for(const p of G.prigionieri){
    html+=`<div style="background:rgba(139,26,26,.2);border:1px solid rgba(192,57,43,.4);border-radius:4px;padding:8px;margin:6px 0">
      <strong style="color:#ffbbbb">${p.nome}</strong> <span style="font-size:.75rem;color:var(--sabbia)">(${p.fazione})</span><br>
      <span style="font-size:.75rem">Riscatto: <span style="color:var(--oro)">${p.riscatto} oro</span></span><br>
      <button class="mbtn primario" onclick="riscattaPrigioniero(${p.id});chiudiModale()">💰 Riscatta</button>
      <button class="mbtn secondario" onclick="reclutaPrigioniero(${p.id});chiudiModale()">⚔ Recluta</button>
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
// ═══════════════════════════════════════
// MODULO: TICK
// ═══════════════════════════════════════
// ── TICK — avanzamento tempo ──
function tick(){
  G.tick++; G.giorno++;

  for(const p of G.pirati) aggiornaPirata(p);

  // FASE 2D: produzione pesata dalla rete dei sentieri.
  // Edifici collegati al palazzo/porto lavorano al 100%; isolati rendono meno.
  const nFattor  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('fattoria') : G.edifici.filter(b=>b.tipo==='fattoria').length;
  const nDistil  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('distilleria') : G.edifici.filter(b=>b.tipo==='distilleria').length;
  const nSegh    = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('segheria') : G.edifici.filter(b=>b.tipo==='segheria').length;
  const nOsserv  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('osservatorio') : G.edifici.filter(b=>b.tipo==='osservatorio').length;
  const nCasa    = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('casapirata') : G.edifici.filter(b=>b.tipo==='casapirata').length;
  const nBordello= typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('bordello') : G.edifici.filter(b=>b.tipo==='bordello').length;
  const nArena   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('arena') : G.edifici.filter(b=>b.tipo==='arena').length;
  const nCanta   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('cantastorie') : G.edifici.filter(b=>b.tipo==='cantastorie').length;
  const nCappella= typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('cappella') : G.edifici.filter(b=>b.tipo==='cappella').length;
  const nInferm  = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('infermeria') : G.edifici.filter(b=>b.tipo==='infermeria').length;
  const nBagni   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('bagni') : G.edifici.filter(b=>b.tipo==='bagni').length;
  const nGuardia = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('guardia') : G.edifici.filter(b=>b.tipo==='guardia').length;
  const nSarto   = typeof moltiplicatoreReteEdifici==='function' ? moltiplicatoreReteEdifici('sarto') : G.edifici.filter(b=>b.tipo==='sarto').length;
  const haTaverna= G.edifici.find(b=>b.tipo==='taverna');
  const haCaserma= G.edifici.find(b=>b.tipo==='caserma');

  // produzione risorse: Math.floor evita decimali visibili, ma mantiene il peso dei sentieri.
  G.cibo          += 5 + Math.floor(nFattor*9);
  G.legno         += 3 + Math.floor(nSegh*7);
  G.rum           += Math.floor(nDistil*6);
  G.oro           += 12 + Math.floor(nCasa*6) + Math.floor(nSarto*10);
  G.ricerca.punti += Math.floor(nOsserv*3);
  if(typeof avvisaReteSentieri==='function') avvisaReteSentieri();

  if(nBordello>0){
    const cr=nBordello*2;
    if(G.rum>=cr) G.rum-=cr;
    else G.bisogni.divertimento=Math.max(0,G.bisogni.divertimento-10);
  }

  const B=G.bisogni;
  B.divertimento=Math.max(0,Math.min(100, B.divertimento + nBordello*20 + nArena*12 + nCanta*8 + (haTaverna?6:0) - 8));
  B.spirito     =Math.max(0,Math.min(100, B.spirito      + nCappella*18 - 5));
  B.salute      =Math.max(0,Math.min(100, B.salute       + nInferm*20 + nBagni*12 - 6));
  B.sicurezza   =Math.max(0,Math.min(100, B.sicurezza    + nGuardia*15 + (G.edifici.find(b=>b.tipo==='fortezza')?10:0) - 4));
  B.lusso       =Math.max(0,Math.min(100, B.lusso        + nSarto*15 + (G.edifici.find(b=>b.tipo==='mercatonero')?10:0) - 6));

  const soddMedia=(B.divertimento+B.spirito+B.salute+B.sicurezza+B.lusso)/5;
  const bonusSodd=Math.floor((soddMedia-50)/10);
  for(const p of G.pirati) p.umore=Math.min(100,Math.max(5,p.umore+bonusSodd));

  if(G.tick%5===0){
    if(B.divertimento<20) aggMsg('😤 La ciurma si annoia! Costruisci un Bordello o Arena.','male');
    if(B.salute<20)       aggMsg('🤒 I pirati si ammalano! Serve un\'Infermeria.','male');
    if(B.spirito<20)      aggMsg('😔 Gli uomini perdono fede. Costruisci una Cappella.','male');
    if(B.sicurezza<20)    aggMsg('😱 La ciurma si sente in pericolo! Costruisci una Torre.','male');
    if(B.lusso<15&&G.pirati.length>6) aggMsg('😒 La ciurma vuole lussi. Assumi un Sarto.','male');
  }

  if(nArena>0&&G.tick%4===0){
    const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
    if(p) p.combattimento=Math.min(100,p.combattimento+2);
  }
  if(nInferm>0){
    for(const p of G.pirati) if(p.umore<40) p.umore=Math.min(100,p.umore+8);
  }
  const sogliaDiserzione=nCappella>0?8:12;

  const costoCibo=G.pirati.length*2;
  G.cibo-=costoCibo;
  if(G.cibo<0){G.cibo=0;for(const p of G.pirati) p.umore-=10;aggMsg('⚠ I pirati stanno morendo di fame!','male');}

  const costoRum=G.pirati.length;
  if(G.rum>=costoRum){G.rum-=costoRum;for(const p of G.pirati) p.umore=Math.min(100,p.umore+3);}
  else for(const p of G.pirati) p.umore-=6;
  if(haTaverna) for(const p of G.pirati) p.umore=Math.min(100,p.umore+5);

  const pirateCoperti=Math.min(G.pirati.length, nCasa*2);
  const pagaTotale=G.pirati.reduce((a,p)=>a+p.paga,0);
  const pagaFinale=Math.max(0, pagaTotale-pirateCoperti);
  G.oro-=pagaFinale;
  if(G.oro<0){G.oro=0;for(const p of G.pirati) p.umore-=8;}

  for(const p of G.pirati){
    if(!p.capitano) continue;
    if(p.id==='cap_bellamy') for(const q of G.pirati) q.umore=Math.min(100,q.umore+5);
    if(p.id==='cap_jack')    for(const q of G.pirati) q.umore=Math.min(100,q.umore+8);
    if(p.id==='cap_ching'&&!G._chingApplicata){
      G._chingApplicata=true;
      for(const n of G.navi) n.hpMax+=20;
    }
  }

  if(haCaserma&&G.tick%3===0){
    const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
    if(p){p.combattimento=Math.min(100,p.combattimento+1);p.navigazione=Math.min(100,p.navigazione+1);}
  }

  // Deriva umore (casuale) — lista separata per la diserzione
  const daRimuovere=[];
  for(const p of G.pirati){
    p.umore=Math.max(5,Math.min(100,p.umore+(Math.random()-.5)*3));
    if(p.umore<sogliaDiserzione&&Math.random()<.2&&!G.ricerca.completate.has('medicina')){
      aggMsg(`☠ ${p.nome} è disertato!`,'male');
      daRimuovere.push(p.id);
    }
  }
  if(daRimuovere.length>0)
    G.pirati=G.pirati.filter(p=>!daRimuovere.includes(p.id));

  for(const n of G.navi){
    if(n.inMare){
      n.usura=Math.min(100,(n.usura||0)+2);
      if(n.usura>50){
        const penalita=Math.floor((n.usura-50)*.4);
        const base=80+(G.ricerca.completate.has('armatura')?20:0)+(n.livCannoni||0)*5;
        n.hpMax=Math.max(20,base-penalita);
        n.hp=Math.min(n.hp,n.hpMax);
      }
    }
  }

  // Rientro navi — esito calcolato qui, al ritorno reale
  for(const n of G.navi){
    if(n.inMare && n.timerRaid>0){
      n.timerRaid--;
      if(n.timerRaid<=0) rientroNave(n);
    }
  }

  for(const p of G.prigionieri){p.giorni++;G.cibo=Math.max(0,G.cibo-1);}
  // Schiavi al lavoro
  if(typeof tickSchiavi==='function') tickSchiavi();

  if(G.cooldownRaid>0) G.cooldownRaid--;
  G.fazioni.reale.rep  =Math.max(-100,Math.min(100,G.fazioni.reale.rep+.5));
  G.fazioni.mercante.rep=Math.max(-100,Math.min(100,G.fazioni.mercante.rep+.2));
  if(G.tick%7===0) eventoRandom();
  controllaMissione('oro',G.oro);
  ['cibo','legno','rum'].forEach(k=>G[k]=Math.max(0,Math.min(999,G[k])));
  G.oro=Math.max(0,G.oro);
  if(!G.fineGioco) controllaFineGioco();
  aggiornaUI();
}

// ═══════════════════════════════════════════════════
// EVENTI NARRATIVI
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════
// MODULO: EVENTS_MARE
// ═══════════════════════════════════════
G.eventoAttivo=false;
G.cooldownEvento=0;

const EVENTI_NARRATIVI=[

  // ── MARE ──
  {
    id:'mercante_rifugio', tag:'Mare', peso:3,
    icona:'🚢', sfondo:'#0a2540',
    titolo:'Il Mercante in Difficoltà',
    testo:'Una nave mercantile batte bandiera di soccorso al largo. Il capitano — un ometto sudaticcio con una parrucca storta — chiede rifugio, promettendo compenso. Aggiunge, sottovoce, che ha anche un\'ottima ricetta per la torta di rum. Come se questo cambiasse qualcosa.',
    scelte:[
      {etich:'Generosità',testo:'Accordate rifugio e rifornimenti',colore:'verde',
        esito:'Il mercante, commosso fino alle lacrime, vi abbraccia. Vi lasciate abbracciare per cortesia. Vi lascia oro e spezie. La torta di rum, per fortuna, se la tiene.',
        tipo:'bene', fn:()=>{G.oro+=80;G.cibo+=30;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+18);}},
      {etich:'Opportunismo',testo:'Rifugio sì... ma ad un prezzo',colore:'',
        esito:'Il capitano stringe i denti e paga. Mentre salpa, vi urla qualcosa. Probabilmente non era un complimento.',
        tipo:'bene', fn:()=>{G.oro+=150;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+5);}},
      {etich:'Pirateria',testo:'Catturate nave e equipaggio',colore:'rosso',
        esito:'La nave è vostra! Il parrucchino del capitano galleggia ancora sul mare. Poetico. Un superstite però è fuggito a nuoto. La Marina saprà.',
        tipo:'male', fn:()=>{G.oro+=220;G.legno+=40;G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-20);G.fazioni.mercante.rep=Math.max(-100,G.fazioni.mercante.rep-25);if(Math.random()<.5)catturaPrigioniero('Mercante');}},
    ]
  },

  {
    id:'relitto', tag:'Mare', peso:2,
    icona:'⚓', sfondo:'#0c2030',
    titolo:'Il Relitto della Tempesta',
    testo:'I vostri uomini avvistano un relitto che deriva verso la riva. Tra le tavole rotte si scorgono casse, un baule chiuso a chiave e... una gallina. Viva. Che vi fissa con assoluta calma, come se stesse aspettando.',
    scelte:[
      {etich:'Salvataggio',testo:'Mettete a mare una scialuppa',colore:'verde',
        esito:'Recuperate un sopravvissuto mezzo morto di sete. E la gallina. Il sopravvissuto vi rivela una rotta commerciale segreta. La gallina non dice niente, ma sembra approvare.',
        tipo:'bene', fn:()=>{creaaPirata();G.ricerca.punti+=20;G.cibo+=15;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+12);}},
      {etich:'Razzia',testo:'Portate a riva solo le casse',colore:'',
        esito:'Nelle casse trovate oro, spezie e una lettera d\'amore destinata a qualcuno che probabilmente non la riceverà mai. La lasciate lì. Siete pirati, non mostri.',
        tipo:'bene', fn:()=>{G.oro+=120;G.rum+=30;G.ricerca.punti+=15;}},
    ]
  },

  {
    id:'corsaro_alleato', tag:'Mare', peso:2,
    icona:'🏴‍☠️', sfondo:'#1a0a0a',
    titolo:'Lupa di Mare',
    testo:'Un brigantino senza insegne affianca l\'isola. Il capitano — una donna con una cicatrice sul mento e un pappagallo che insulta in tre lingue — chiede di parlare. Il pappagallo urla qualcosa di imbarazzante sulla vostra madre.',
    scelte:[
      {etich:'Alleanza',testo:'Patto di mutua difesa. Il pappagallo può restare.',colore:'verde',
        esito:'"Capitano contro capitano." Lupa sorride. Il pappagallo smette di insultare. Quasi un rispetto.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+25);G.oro+=60;}},
      {etich:'Commercio',testo:'Rum contro bottino. Affari senza sentimenti.',colore:'',
        esito:'Scambio equo. Il pappagallo commenta "affare onesto" in olandese. Incredibilmente, qualcuno capisce.',
        tipo:'bene', fn:()=>{G.oro+=100;G.rum+=20;G.cibo=Math.max(0,G.cibo-30);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+10);}},
      {etich:'Diffidenza',testo:'Rifiutate. Cannoni puntati.',colore:'rosso',
        esito:'"Come volete." Lupa salpa. Il pappagallo vi dedica una parola finale. Non la ripetono nemmeno i pirati più sboccati.',
        tipo:'male', fn:()=>{G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-8);}},
    ]
  },

  {
    id:'nave_fantasma', tag:'Mare', peso:1,
    icona:'👻', sfondo:'#080820',
    titolo:'La Nave Senza Equipaggio',
    testo:'Una brigantino alla deriva entra in porto da solo, vele ammainate, timone libero. A bordo: nessuno. Solo un tavolo apparecchiato per sei, cibo ancora caldo, e un biglietto che dice "Torneremo presto". Nessuno firma.',
    scelte:[
      {etich:'Razzia',testo:'È abbandonata. Prendete tutto.',colore:'verde',
        esito:'Carica di rum e spezie pregiate. Mentre portate via l\'ultimo barile, sentite ridere qualcuno. Probabilmente il vento.',
        tipo:'bene', fn:()=>{G.oro+=90;G.rum+=50;G.ricerca.punti+=10;}},
      {etich:'Prudenza',testo:'Lasciatela andare. Certe cose non si toccano.',colore:'',
        esito:'La nave riparte da sola con la marea. La ciurma la guarda andare in silenzio. Per tre giorni nessuno parla di fantasmi. Poi ci pensano tutto il tempo.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Abitatela',testo:'Fate salire la ciurma. È una nave gratis.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'Tutto bene. Era solo abbandonata. Siete i nuovi proprietari. Qualcuno trova ancora caldo il minestrone sul fuoco.';return 'La nave riparte da sola alle tre di notte, con metà ciurma ancora a bordo. Li rivedrete fra una settimana, stranamente silenziosi.';},
        tipo:'', fn:()=>{if(Math.random()<.5){const n=G.navi[0];if(n){n.hp=Math.min(n.hpMax,n.hp+30);G.oro+=60;}}else{if(G.pirati.length>2)G.pirati.splice(0,Math.min(2,G.pirati.length-1));for(const p of G.pirati)p.umore=Math.max(10,p.umore-20);}}},
    ]
  },

  {
    id:'gabbiano_oracolo', tag:'Mare', peso:1,
    icona:'🕊', sfondo:'#0a1a30',
    titolo:'Il Gabbiano Profeta',
    testo:'Un gabbiano si posa sulla prua e non se ne va. Da tre giorni. I marinai giurano che predica sventure. Il cuoco vuole cucinarlo. Il navigatore dice che porta fortuna. Il gabbiano non esprime opinioni, ma ha mangiato le mappe della settimana scorsa.',
    scelte:[
      {etich:'Oracolo',testo:'Assecondate la superstizione: il gabbiano resta.',colore:'verde',
        esito:'Il gabbiano gracchia, torna in mare e ritorna con un pesce. Inspiegabilmente, i pirati trovano questo profetico. Il morale sale.',
        tipo:'bene', fn:()=>{G.cibo+=25;for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);}},
      {etich:'Pragmatismo',testo:'Cacciatelo. Le mappe non si mangiano.',colore:'rosso',
        esito:'Il gabbiano parte offeso. Quella notte, una tempestina modesta danneggia il tetto del magazzino. Coincidenza, sicuramente.',
        tipo:'male', fn:()=>{G.legno=Math.max(0,G.legno-20);for(const p of G.pirati)p.umore=Math.max(10,p.umore-10);}},
      {etich:'Gastronomia',testo:'Il cuoco aveva ragione. È la cena di stasera.',colore:'',
        esito:'Era sorprendentemente buono. Nessuno lo ammetterà mai. La ciurma è stranamente a disagio per una settimana.',
        tipo:'bene', fn:()=>{G.cibo+=15;for(const p of G.pirati)p.umore=Math.max(15,p.umore-5);}},
    ]
  },

];
const COOLDOWN_EVENTO_MIN=8;
// ═══════════════════════════════════════
// MODULO: EVENTS_CIURMA
// ═══════════════════════════════════════
// ── EVENTI CIURMA & ISOLA ──
EVENTI_NARRATIVI.push(
  // ── CIURMA ──
  {
    id:'rivolta_ciurma', tag:'Ciurma', peso:2,
    icona:'⚔', sfondo:'#1a0808',
    titolo:'La Rivolta della Ciurma',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un vecchio bucaniere';
      return nome+' si fa avanti con un\'espressione che non promette niente di buono. "Capitano, tre settimane senza bottino. Gli uomini parlano. Alcuni parlano anche di voi. Non è gentile."';
    },
    scelte:[
      {etich:'Autorità',testo:'"Chi comanda qui lo decido io. Chiunque non sia d\'accordo può nuotare."',colore:'rosso',
        esito:'Silenzio assoluto. Poi qualcuno tossisce. Poi tutti fingono di dover fare qualcosa di molto urgente altrove. Funziona.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(15,p.umore-10);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);}},
      {etich:'Diplomazia',testo:'Promettete una razzia entro tre giorni',colore:'verde',
        esito:'Le facce si distendono. "Tre giorni, Capitano." Qualcuno al fondo mormora: "Lo diceva anche il capitano precedente." Ignorate.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.cooldownRaid=0;}},
      {etich:'Generosità',testo:'Distribuite 100 oro. Comprate l\'amore.',colore:'',
        esito:'Occhi che brillano. Per questa notte la taverna risuona di canti in vostro onore. Domani torneranno a lamentarsi, ma oggi va bene.',
        tipo:'bene', fn:()=>{if(G.oro>=100){G.oro-=100;for(const p of G.pirati)p.umore=Math.min(100,p.umore+30);}else{for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}}},
    ]
  },

  {
    id:'pirata_ferito', tag:'Ciurma', peso:2,
    icona:'🩹', sfondo:'#1a1000',
    titolo:'Il Compagno Ferito',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un pirata';
      return nome+' è stato trovato a terra, febbricitante. Morso di serpente, dicono. Il chirurgo scuote la testa, poi aggiunge: "O forse è il cibo di ieri sera." Il cuoco protesta. Nessuno gli crede.';
    },
    scelte:[
      {etich:'Sacrificio',testo:'Spendete 60 oro per medicine rare',colore:'verde',
        esito:()=>{const p=G.pirati[0];return (p?p.nome:'Il pirata')+' si riprende lentamente. "Grazie, Capitano." Vi tende la mano. Ha ancora la febbre alta ma il gesto è commovente.';},
        tipo:'bene', fn:()=>{if(G.oro>=60){G.oro-=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}else aggMsg('Oro insufficiente. Il pirata aspetta con rassegnazione.','male');}},
      {etich:'Medicina alternativa',testo:'Il cuoco ha una ricetta della nonna: rum e aglio.',colore:'',
        esito:()=>{if(Math.random()<.5)return 'Miracolosamente, funziona. O forse era solo un\'indigestione. Comunque, il pirata è in piedi.';return 'Non funziona. Ma il pirata sopravvive lo stesso, con grande disappunto del cuoco che ci teneva alla sua reputazione.';},
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Fatalismo',testo:'"Il mare dà, il mare toglie. Il cuoco dà, il cuoco toglie."',colore:'rosso',
        esito:'Il pirata si riprende da solo, per dispetto. Però non dimentica. Non dimentica mai.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(5,p.umore-12);}},
    ]
  },

  {
    id:'duello', tag:'Ciurma', peso:2,
    icona:'🗡', sfondo:'#0a1020',
    titolo:'Il Duello all\'Alba',
    testo:()=>{
      const a=G.pirati[0], b=G.pirati[1];
      const n1=a?a.nome:'Due pirati', n2=b?b.nome:'litigano';
      return n1+' e '+n2+' si sono sfidati a duello. Motivo ufficiale: una questione d\'onore. Motivo reale, che tutti sanno: una scommessa su chi bevesse più rum. Entrambi ricordano a malapena di aver scommesso.';
    },
    scelte:[
      {etich:'Lascia fare',testo:'Il duello faccia il suo corso',colore:'',
        esito:'Lame che tintinnano nell\'alba. È più commedia che tragedia. Il vincitore non ricorda nemmeno cosa stesse difendendo. La ciurma applaude uguale.',
        tipo:'bene', fn:()=>{if(G.pirati.length>2)G.pirati.splice(Math.floor(Math.random()*Math.min(2,G.pirati.length)),1);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Autorità',testo:'Vietate il duello. Li fate abbracciare.',colore:'rosso',
        esito:'Brontolio nella folla. I due si stringono la mano con evidente disagio. La pace regna. Brevemente.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(5,p.umore-8);}},
      {etich:'Spettacolo',testo:'Organizzatelo ufficialmente. Scommesse aperte.',colore:'verde',
        esito:'Tifo, rum, lacrime di gioia e di dolore. Qualcuno vince una fortuna. Qualcuno perde i pantaloni letteralmente. La tensione sparisce in una nuvola di festa.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+22);}},
    ]
  },

  // ── ISOLA ──
  {
    id:'naufraghi', tag:'Isola', peso:2,
    icona:'🏝', sfondo:'#0a1a10',
    titolo:'I Naufraghi sulla Riva',
    testo:'Una decina di uomini e donne stremati raggiungono la spiaggia su una zattera. Sono i sopravvissuti di un galeone reale. Guardano la vostra bandiera con terrore. Il più alto di loro tira fuori un foglietto e dice: "Abbiamo preparato un discorso."',
    scelte:[
      {etich:'Clemenza',testo:'Accoglieteli come uomini liberi. Saltate il discorso.',colore:'verde',
        esito:'Alcuni restano, diventando lavoratori preziosi. Uno di loro, si scopre, era pasticcere di corte. Il morale raggiunge vette storiche.',
        tipo:'bene', fn:()=>{creaaPirata();creaaPirata();G.cibo=Math.max(0,G.cibo-20);G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);}},
      {etich:'Leva forzata',testo:'Arruolateli. Il discorso è vietato.',colore:'',
        esito:'Protestano, poi cedono. Nuove braccia, spiriti poco convinti, ma il pasticcere sforna comunque delle crostate eccellenti.',
        tipo:'bene', fn:()=>{creaaPirata();for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}},
      {etich:'Riscatto',testo:'Rinchiudeteli. La Marina pagherà.',colore:'rosso',
        esito:'La Marina pagherà bene. Il pasticcere piange in prigione. La ciurma lo sente. Si sente male per questo.',
        tipo:'male', fn:()=>{const n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++)catturaPrigioniero('Marina Reale');G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-15);}},
    ]
  },

  {
    id:'tesoro_nascosto', tag:'Isola', peso:2,
    icona:'💰', sfondo:'#1a1200',
    titolo:'La Mappa del Tesoro',
    testo:'Un vecchio pirata moribondo vi consegna con mano tremante un frammento di pergamena. "Sull\'isolotto a nord... scavate dove il corallo forma una croce." Sorride e chiude gli occhi. Poi li riapre. "E ricordate: la seconda croce non conta." Chiude di nuovo. Questa volta per davvero.',
    scelte:[
      {etich:'Spedizione',testo:'Mandate subito una nave. Prima croce.',colore:'verde',
        esito:()=>{const g=200+Math.floor(Math.random()*300);return 'La nave torna carica. '+g+' oro in monete antiche e gemme. Il vecchio diceva la verità. Sulla seconda croce non indagano.';},
        tipo:'bene', fn:()=>{const nave=G.navi.find(n=>!n.inMare);if(nave){const g=200+Math.floor(Math.random()*300);G.oro+=g;G.ricerca.punti+=25;}else{G.oro+=150+Math.floor(Math.random()*200);}}},
      {etich:'Prudenza',testo:'Decifrare la mappa. Quale croce è quale.',colore:'',
        esito:'Gli studiosi passano giorni a discutere della seconda croce. Alla fine scelgono la prima. Era quella giusta. Avrebbero potuto indovinare.',
        tipo:'bene', fn:()=>{G.oro+=180;G.ricerca.punti+=35;}},
      {etich:'Scetticismo',testo:'Un vecchio pazzo. Lasciate perdere.',colore:'rosso',
        esito:'Settimane dopo, una nave straniera torna da quell\'isolotto con bandiere festose e molto oro. La seconda croce non l\'hanno trovata nemmeno loro.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'spia_marina', tag:'Isola', peso:1,
    icona:'🕵', sfondo:'#0e0e1a',
    titolo:'La Spia della Corona',
    testo:'Il vostro capobanda vi porta in disparte. "Abbiamo pescato questo tizio che disegnava mappe del porto." L\'uomo ha l\'uniforme reale nascosta sotto stracci di pescatore. Porta anche un taccuino che descrive meticolosamente ogni edificio. Inclusa la taverna, con una stellina di apprezzamento.',
    scelte:[
      {etich:'Interrogatorio',testo:'Fate cantare la spia',colore:'rosso',
        esito:'"C\'è una spedizione punitiva in arrivo. Venti giorni." Aggiunge, non richiesto: "La taverna è davvero buona, però." Gli credete su entrambe le cose.',
        tipo:'bene', fn:()=>{G.oro+=50;G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Scambio',testo:'Usatela come pedina diplomatica',colore:'verde',
        esito:'"Noi rendiamo i vostri, voi fate finta di non vederci." Un accordo tacito. La spia, libera, torna con la stellina sul taccuino ancora intatta.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+20);G.oro+=40;}},
      {etich:'Esempio',testo:'Un esempio pubblico. La stellina non la salva.',colore:'rosso',
        esito:'La ciurma batte i piedi soddisfatta. La Marina non dimenticherà. La stellina sulla taverna, invece, era meritata.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-25);}},
    ]
  },

  {
    id:'pirata_inventore', tag:'Ciurma', peso:2,
    icona:'⚙', sfondo:'#0a1520',
    titolo:'L\'Inventore della Ciurma',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un pirata';
      return nome+' si presenta con un disegno arrotolato. "Capitano, ho inventato un cannone che spara tre palle alla volta." Il disegno mostra qualcosa che assomiglia principalmente a una catapulta con ambizioni. "Ho solo bisogno di un po\' di materiali e di non essere interrotto per tre settimane."';
    },
    scelte:[
      {etich:'Finanziamento',testo:'Investite. L\'innovazione è il futuro.',colore:'verde',
        esito:()=>{if(Math.random()<.55)return 'Funziona! Quasi. Spara due palle e mezza, in senso molto stretto. Ma i nemici si confondono lo stesso.';return 'Non funziona. Ma il tentativo era così spettacolare che la ciurma lo rispetta di più. Il cannone ora è un ornamento.';},
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-60);G.legno=Math.max(0,G.legno-20);if(Math.random()<.55){G.ricerca.punti+=40;for(const n of G.navi)n.hp=Math.min(n.hpMax,n.hp+15);}else G.ricerca.punti+=20;}},
      {etich:'Scetticismo',testo:'"Molto bello. Torna alla tua postazione."',colore:'rosso',
        esito:'Il pirata arrotola il disegno con dignità. Lo trovate sotto il suo cuscino due settimane dopo, ancora fresco di correzioni.',
        tipo:'male', fn:()=>{const p=G.pirati[0];if(p)p.umore=Math.max(10,p.umore-15);}},
      {etich:'Compromesso',testo:'Dategli legno e una settimana. Poi basta.',colore:'',
        esito:'Produce qualcosa. Non è un cannone. Non è una catapulta. È unico. E stranamente, funziona.',
        tipo:'bene', fn:()=>{G.legno=Math.max(0,G.legno-30);G.ricerca.punti+=25;for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
    ]
  },

  {
    id:'cuoco_minaccia', tag:'Ciurma', peso:2,
    icona:'🍳', sfondo:'#1a0a00',
    titolo:'Il Cuoco si Dimette',
    testo:'Il cuoco — l\'unico a bordo che sa fare qualcosa di commestibile — entra nella vostra capanna con il grembiule piegato sul braccio. "Capitano, me ne vado. Voglio rispetto. Voglio spezie migliori. E voglio che smettano di chiamarmi Zuppa-di-Stivale." La ciurma fuori aspetta in silenzio. Sanno cosa si perde se parte.',
    scelte:[
      {etich:'Trattativa',testo:'Promettete spezie, rispetto e un soprannome migliore.',colore:'verde',
        esito:'"Don Pepito" resta. Quella sera serve una zuppa che fa piangere dalla bontà. Qualcuno piange davvero. Probabilmente per il sale.',
        tipo:'bene', fn:()=>{G.cibo+=40;for(const p of G.pirati)p.umore=Math.min(100,p.umore+18);}},
      {etich:'Capitolazione',testo:'Cedete su tutto. È il cuoco.',colore:'',
        esito:'Spendete oro per spezie pregiate. Vale ogni spicciolo. La ciurma mangia come re. Re pirati, ma comunque.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-50);G.cibo+=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+25);}},
      {etich:'Orgoglio',testo:'"Chiunque può cucinare. Vattene."',colore:'rosso',
        esito:'Il cuoco parte. Per tre giorni la ciurma tenta di cucinarsi da sola. Perdite nelle riserve di cibo inspiegabilmente alte. Il morale crolla. Qualcuno mangia il cappello.',
        tipo:'male', fn:()=>{G.cibo=Math.max(0,G.cibo-40);for(const p of G.pirati)p.umore=Math.max(5,p.umore-20);}},
    ]
  },

  {
    id:'ambasciatore_ridicolo', tag:'Politica', peso:2,
    icona:'📜', sfondo:'#101828',
    titolo:'L\'Ambasciatore della Corona',
    testo:'Arriva un\'imbarcazione con bandiera bianca e un uomo in parrucca imponente che si qualifica come "Ambasciatore Straordinario e Plenipotenziario di Sua Maestà per le Questioni di Pirateria Minore". Vi porta un documento di quarantasette pagine. La pagina uno è la copertina. La pagina due è un indice. La pagina quarantasette è la firma.',
    scelte:[
      {etich:'Diplomazia',testo:'Leggete (almeno) la prima e l\'ultima pagina.',colore:'verde',
        esito:'La Corona offre amnistia parziale in cambio di un tributo annuo. La parrucca dell\'ambasciatore si inclina di tre gradi durante la stretta di mano. Accordo.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+30);G.oro=Math.max(0,G.oro-80);}},
      {etich:'Teatralità',testo:'Bruciate il documento. Tenete l\'ambasciatore a cena.',colore:'',
        esito:'L\'ambasciatore, inspiegabilmente, si diverte moltissimo. Riparte con storie da raccontare. La parrucca resta leggermente storta per tutta la sera.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Arroganza',testo:'Rispedite tutto indietro. Con una nota ironica.',colore:'rosso',
        esito:'La nota ironica viene letta ad alta voce a corte. Non viene apprezzata. La spedizione punitiva è ora schedulata con priorità alta.',
        tipo:'male', fn:()=>{G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-30);}},
    ]
  },

  {
    id:'profeta_isola', tag:'Mistero', peso:1,
    icona:'🔮', sfondo:'#100818',
    titolo:'Il Profeta dell\'Isola',
    testo:'Un vecchio vive da solo nelle colline. I pirati lo chiamano "Il Pazzo di Su". Oggi scende al porto per la prima volta in vent\'anni. "Il mare parlerà domani," dice. "Ascoltate il terzo gabbiano da sinistra." Poi torna su. Il terzo gabbiano da sinistra vi fissa.',
    scelte:[
      {etich:'Fede',testo:'Ascoltate il terzo gabbiano da sinistra.',colore:'verde',
        esito:()=>{if(Math.random()<.6)return 'Il gabbiano vola verso nordest. Mandate una nave. Tornano con oro e storie incredibili.';return 'Il gabbiano vola in cerchio per venti minuti e poi si addormenta su una roccia. Ma quella notte trovate 40 oro sul molo. Connessione poco chiara.';},
        tipo:'bene', fn:()=>{if(Math.random()<.6){G.oro+=120;G.ricerca.punti+=20;}else G.oro+=40;}},
      {etich:'Razionalità',testo:'"È un gabbiano. Andate a lavorare."',colore:'rosso',
        esito:'Il giorno dopo, il vecchio scende di nuovo. "L\'avevo detto." Poi risale. Non scende per altri vent\'anni.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'tartaruga_sacra', tag:'Mistero', peso:1,
    icona:'🐢', sfondo:'#061810',
    titolo:'La Tartaruga Sacra',
    testo:'Una tartaruga enorme — grande quanto una tavola da pranzo — si è installata all\'ingresso della vostra capanna. Non si muove. Tre pirati hanno già inciampato su di lei. La ciurma è divisa: metà la considera sacra, metà la considera cena. Voi siete l\'arbitro.',
    scelte:[
      {etich:'Sacralità',testo:'È un segno. La tartaruga resta e va rispettata.',colore:'verde',
        esito:'La tartaruga diventa la mascotte dell\'isola. La chiama Generale. I pirati sviluppano un affetto imbarazzante per lei. Il morale è alto, le caviglie meno.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);}},
      {etich:'Pragmatismo',testo:'Spostatela delicatamente lontano dalla porta.',colore:'',
        esito:'La tartaruga torna il giorno dopo. E quello dopo. La chiamate Generale per rassegnarvi. La situazione è invariata ma almeno ha un nome.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Gastronomia',testo:'La metà pragmatica aveva ragione.',colore:'rosso',
        esito:'Era effettivamente buona. La metà sacra non dimentica. Una tensione sottile avvelena l\'isola per settimane.',
        tipo:'male', fn:()=>{G.cibo+=30;for(const p of G.pirati)p.umore=Math.max(10,p.umore-15);}},
    ]
  }
);
// ═══════════════════════════════════════
// MODULO: EVENTS_POLITICA
// ═══════════════════════════════════════
// ── EVENTI COMMERCIO, NATURA & MISTERO ──
EVENTI_NARRATIVI.push(
  // ── COMMERCIO ──
  {
    id:'carico_misterioso', tag:'Commercio', peso:2,
    icona:'📦', sfondo:'#101020',
    titolo:'Il Carico Senza Mittente',
    testo:'Al molo arriva una barca con tre casse sigillate. Il barcaiolo consegna un biglietto: "Per il Capitano dell\'Isla del Diablo. In anticipo." Nessun mittente, nessuna firma. Il barcaiolo, interrogato, dice di essere stato pagato da "un tipo". Descrizione: "normale".',
    scelte:[
      {etich:'Accettate',testo:'Aprite le casse. Il tipo normale è generoso.',colore:'verde',
        esito:()=>{if(Math.random()<0.6)return 'Oro, spezie pregiate e una bottiglia di rum invecchiato. Dono anonimo, qualità non anonima.';return 'Dentro: mappe di rotte commerciali riservate. Vale più dell\'oro. Il tipo normale era un contatto interessante.';},
        tipo:'bene', fn:()=>{if(Math.random()<0.6){G.oro+=130;G.rum+=20;}else{G.ricerca.punti+=40;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+10);}}},
      {etich:'Sospetto',testo:'Rispedite tutto. I regali senza firma puzzano.',colore:'rosso',
        esito:'Il barcaiolo riprende le casse con aria offesa. Forse era una trappola. Forse no. Non lo saprete mai. Il barcaiolo nemmeno.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'contrabbando', tag:'Commercio', peso:2,
    icona:'🧪', sfondo:'#0a1810',
    titolo:'L\'Offerta del Contrabbandiere',
    testo:'Un individuo dall\'aria losca — cappello calato sugli occhi, mantello per tre stagioni di troppo — vi avvicina. "Cinquanta barili di rum delle Indie. Non dichiarati. Metà prezzo." Vi mostra un campione. È il migliore rum che abbiate mai assaggiato in vita vostra, il che è molto preoccupante.',
    scelte:[
      {etich:'Affare',testo:'Comprate il lotto. Tutte le domande sono sospese.',colore:'verde',
        esito:'Il rum è straordinario. Per una settimana l\'isola è avvolta in un alone di felicità diffusa. Il navigatore traccia rotte migliori. Il cuoco cucina meglio. Nessuno capisce perché.',
        tipo:'bene', fn:()=>{if(G.oro>=80){G.oro-=80;G.rum+=80;for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}else aggMsg('Oro insufficiente. Il contrabbandiere scuote la testa deluso.','male');}},
      {etich:'Trattativa',testo:'50 oro e delle scorte. È pirateria, non carità.',colore:'',
        esito:'L\'uomo borbotta ma accetta. Stretta di mano sotto il cappello. Non vedete la sua faccia. Meglio così, probabilmente.',
        tipo:'bene', fn:()=>{if(G.oro>=50){G.oro-=50;G.cibo=Math.max(0,G.cibo-20);G.rum+=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}}},
      {etich:'Delazione',testo:'Denunciate l\'uomo alla Marina. Buona cittadinanza.',colore:'rosso',
        esito:'La Marina vi ringrazia con un lasciapassare. I corsari vengono a sapere che avete denunciato un contrabbandiere. Si chiedono se siete ancora pirati o qualcos\'altro.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+15);G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-12);}},
    ]
  },

  {
    id:'mercante_falso', tag:'Commercio', peso:2,
    icona:'🤥', sfondo:'#181008',
    titolo:'Il Mercante Troppo Gentile',
    testo:'Un mercante si presenta con prezzi straordinariamente bassi. Spezie a un terzo del valore, seta quasi gratis, cannoni a prezzo di costo. Sorride molto. Troppo. Il vostro secondo ufficiale vi sussurra: "Capitano, quest\'uomo sorride come chi sta per venderci qualcosa che non esiste."',
    scelte:[
      {etich:'Ottimismo',testo:'Comprate tutto. Gli affari sono affari.',colore:'rosso',
        esito:()=>{if(Math.random()<.4)return 'Era tutto vero! Un mercante rovinato che liquidava tutto. Affare della vita.';return 'Le spezie erano segatura profumata. La seta era lino umido. I cannoni erano di legno dipinto. Il sorriso era reale, però.';},
        tipo:'', fn:()=>{if(Math.random()<.4){G.oro+=100;G.cibo+=40;G.rum+=20;}else{G.oro=Math.max(0,G.oro-90);aggMsg('Truffati dal mercante sorridente!','male');}}},
      {etich:'Prudenza',testo:'Fate ispezionare la merce prima di pagare.',colore:'verde',
        esito:'Il mercante sparisce durante l\'ispezione. Il che risponde alla domanda. La ciurma trova la sua barca nascosta tra le rocce.',
        tipo:'bene', fn:()=>{G.oro+=30;for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Contrattacco',testo:'Lo ingannate a vostra volta. Pirata contro pirata.',colore:'',
        esito:'Una trattativa elaborata in cui nessuno dei due dice la verità. Alla fine entrambi pareggiate le perdite e vi rispettate professionalmente.',
        tipo:'bene', fn:()=>{G.oro+=20;G.rum+=15;G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+8);}},
    ]
  },

  // ── NATURA ──
  {
    id:'tempesta_imminente', tag:'Natura', peso:2,
    icona:'⛈', sfondo:'#0a0a18',
    titolo:'La Tempesta in Arrivo',
    testo:'Il cielo a ovest è verde. I gabbiani fuggono. Il navigatore anziano annuisce grave: "Capitano, quella non è una burrasca normale." Pausa drammatica. "Quella è una burrasca molto molto normale, ma enorme." La distinzione è importante.',
    scelte:[
      {etich:'Preparazione',testo:'Mettete tutto al sicuro. Aspettate.',colore:'verde',
        esito:'La tempesta è violenta ma breve. L\'isola regge. Qualche albero caduto. Il cuoco ha usato il tempo per preparare una zuppa. La chiama "Zuppa della Tempesta". È la migliore di sempre.',
        tipo:'bene', fn:()=>{G.cibo=Math.max(0,G.cibo-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}},
      {etich:'Avventura',testo:'Mandate una nave. I relitti valgono oro.',colore:'rosso',
        esito:()=>{if(Math.random()<.45)return 'La nave torna con un carico di relitti preziosi. Rischio calcolato, risultato ottimo.';return 'La nave torna quasi affondata. Il capitano giura che ne è valsa la pena. Nessuno gli crede. La nave nemmeno.';},
        tipo:'', fn:()=>{const nave=G.navi.find(n=>!n.inMare);if(nave){if(Math.random()<.45){G.oro+=180;G.rum+=30;}else nave.hp=Math.max(10,Math.floor(nave.hpMax*.2));}}},
      {etich:'Rassegnazione',testo:'Portate le navi al riparo. Il resto si vede.',colore:'',
        esito:'La flotta è salva. Qualche struttura in meno. Il magazzino della legna è esploso in maniera spettacolare. Nessuno era dentro. Fortuna.',
        tipo:'bene', fn:()=>{G.legno=Math.max(0,G.legno-40);for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}},
    ]
  },

  {
    id:'vulcano_minore', tag:'Natura', peso:1,
    icona:'🌋', sfondo:'#1a0500',
    titolo:'Il Vulcano si Sveglia',
    testo:'Il piccolo vulcano al centro dell\'isola — che tutti chiamavano "quella collina calda" — ha iniziato a fumare. Non in modo preoccupante, dice il geologo che non avete (quindi nessuno lo dice). I pirati sono divisi tra "è normale" e "non è normale". Il vulcano non partecipa al dibattito.',
    scelte:[
      {etich:'Indifferenza',testo:'"È fumo. I vulcani fumano. Avanti."',colore:'',
        esito:'Il vulcano sbuffa per tre giorni poi si calma. Era normale. I pirati un po\' delusi dall\'esito banale della faccenda.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+5);}},
      {etich:'Evacuazione',testo:'Portate tutto a bordo. Per precauzione.',colore:'verde',
        esito:'L\'operazione dura dodici ore caotiche. Il vulcano non fa niente. Ma trovate delle gemme vulcaniche nella lava raffreddata. Un rimborso.',
        tipo:'bene', fn:()=>{G.oro+=60;G.ricerca.punti+=15;for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);}},
      {etich:'Opportunismo',testo:'Scalate il vulcano. Ci sono minerali preziosi.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'Trovate gemme e minerali rari. Il vulcano collabora. Buon vulcano.';return 'Il vulcano emette un singolo sbuffo di gas sulfureo proprio mentre salite. Tutti tornano con le sopracciglia ridotte.';},
        tipo:'', fn:()=>{if(Math.random()<.5){G.oro+=80;G.ricerca.punti+=25;}else{for(const p of G.pirati)p.umore=Math.max(5,p.umore-15);aggMsg('Sopracciglia perse sull\'avventura vulcanica.','male');}}},
    ]
  },

  // ── MAGIA/MISTERO ──
  {
    id:'fantasma', tag:'Mistero', peso:1,
    icona:'👻', sfondo:'#080818',
    titolo:'Il Fantasma del Porto',
    testo:'Da tre notti, le guardie vedono una figura luminosa camminare sulle acque. Stamane, sul molo, le lettere incise: "CERCATE IL BAULE ROSSO". Sotto, in grafia più piccola e meno decisa: "per favore".',
    scelte:[
      {etich:'Cercate',testo:'Dragate il fondale. Il fantasma è educato.',colore:'verde',
        esito:()=>{const g=80+Math.floor(Math.random()*150);return 'Sul fondo emerge un baule rosso marcio. '+g+' monete d\'oro antico e un orologio che non si è fermato. Il fantasma non si vede più. Sembra soddisfatto.';},
        tipo:'bene', fn:()=>{G.oro+=80+Math.floor(Math.random()*150);G.ricerca.punti+=20;}},
      {etich:'Ignorate',testo:'"Marinaio ubriaco che incide cose." ',colore:'rosso',
        esito:'La figura smette di apparire. Ma qualcuno giura di averla vista scuotere la testa. Triste. La ciurma si sente vagamente in colpa.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);}},
    ]
  },

  {
    id:'straniero_sapiente', tag:'Mistero', peso:2,
    icona:'🧙', sfondo:'#0a1020',
    titolo:'Il Cartografo Misterioso',
    testo:'Un vecchio dall\'aspetto stanco si presenta al molo con una mappa enorme sotto il braccio. "Ho mappato ogni rotta commerciale del Mediterraneo per trent\'anni," dice. "Ora voglio un posto dove stare e rum a volontà." Non chiede altro. È o un genio o un pazzo. Probabilmente entrambi.',
    scelte:[
      {etich:'Ospitalità',testo:'Ha una casa e rum illimitato. Le mappe sono vostre.',colore:'verde',
        esito:'Le mappe sono straordinarie. Ogni rotta commerciale, ogni pattuglia reale, ogni corrente. Il vecchio beve il vostro rum con la serena dignità di chi sa di valere ogni goccia.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-20);G.ricerca.punti+=50;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+15);}},
      {etich:'Trattativa',testo:'Una casa e rum ragionevole. Le mappe vanno copiate.',colore:'',
        esito:'Accetta. Beve con moderazione ostentata. Le copie delle mappe sono quasi altrettanto buone degli originali.',
        tipo:'bene', fn:()=>{G.ricerca.punti+=30;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+8);}},
      {etich:'Scetticismo',testo:'Chiunque può disegnare una mappa e chiamarla rara.',colore:'rosso',
        esito:'Il vecchio annuisce, arrotola le mappe e se ne va. Una settimana dopo, un vostro rivale lo trova. Le mappe erano reali.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'maledizione_rum', tag:'Mistero', peso:1,
    icona:'🍺', sfondo:'#180808',
    titolo:'Il Rum Maledetto',
    testo:'Il cuoco riferisce che tre barili di rum hanno cambiato colore da ieri sera: da ambrato a viola. Odore normale, sapore identico. Il primo pirata che ha assaggiato giura di aver visto i pesci parlare per un\'ora. Li ha descritti come "interessanti conversatori". Non ricorda i dettagli.',
    scelte:[
      {etich:'Consumo',testo:'Rum viola è ancora rum. Distribuitelo.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'La ciurma passa una notte molto strana. Nessuno si fa male. Al mattino il rum è tornato ambrato. I pesci non commentano.';return 'Effetti collaterali: tre pirati si rifiutano di dormire, uno costruisce qualcosa di inspiegabile con del legno, il navigatore tracia le rotte migliori della sua vita. Un successo.';},
        tipo:'', fn:()=>{if(Math.random()<.5){for(const p of G.pirati)p.umore=Math.max(15,p.umore-10);}else{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.ricerca.punti+=20;}}},
      {etich:'Prudenza',testo:'Gettate i barili. Viola non è un colore del rum.',colore:'verde',
        esito:'I barili finiscono in mare. I pesci nei paraggi si comportano in modo insolito per tre giorni. Nessuno ne parla apertamente.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Scienza',testo:'Studiatelo. Potrebbero esserci applicazioni pratiche.',colore:'',
        esito:'Tre settimane di esperimenti. Scoperta: il rum viola è rum normale con alghe violacee cadute accidentalmente. Risultato scientifico: deludente. Rum recuperato: moderatamente.',
        tipo:'bene', fn:()=>{G.rum+=15;G.ricerca.punti+=18;}},
    ]
  },

  {
    id:'diplomatico_corsaro', tag:'Politica', peso:2,
    icona:'☠', sfondo:'#1a0808',
    titolo:'Il Consiglio dei Corsari',
    testo:'Un messaggero corsaro porta un invito al "Gran Consiglio dei Liberi Mari", raduno annuale di capitani pirati. Si tiene su un\'isola neutrale. Ogni capitano porta rum, oro e una storia da raccontare. Niente armi. Niente tradimenti. Per tradizione.',
    scelte:[
      {etich:'Partecipazione',testo:'Andate. Con rum, oro e la storia migliore.',colore:'verde',
        esito:'Tre giorni di accordi, alleanze e storie sempre più improbabili. Tornate con contatti preziosi, una reputazione migliore e i postumi di una festa epica.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-60);G.rum=Math.max(0,G.rum-30);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+35);for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}},
      {etich:'Prudenza',testo:'Non vi fidate dei tradimenti "per tradizione".',colore:'',
        esito:'Non andate. Il consiglio va bene per gli altri. Vi perdete un accordo vantaggioso ma anche un potenziale tranello.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);}},
      {etich:'Ambizione',testo:'Andate. Portate armi. Non per la tradizione.',colore:'rosso',
        esito:'Venite scoperti all\'ingresso. La guardia corsara vi fissa. "Tutti portano armi. La regola è non parlarne." Enorme disagio. Superato con rum supplementare.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-40);G.rum=Math.max(0,G.rum-20);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+18);for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}},
    ]
  },

  {
    id:'burocrazia_marina', tag:'Politica', peso:2,
    icona:'📋', sfondo:'#0a0e1a',
    titolo:'Il Funzionario della Corona',
    testo:'Un funzionario reale — magro, inchiostro sulle dita, espressione di chi non ha dormito bene dal 1689 — vi porta una notifica ufficiale. La pirateria nella vostra zona è "non autorizzata". Dovete compilare il "Modulo di Richiesta di Licenza per Attività Maritime Non Convenzionali". È in triplice copia.',
    scelte:[
      {etich:'Conformità',testo:'Compilate il modulo. Triplice copia inclusa.',colore:'verde',
        esito:'Il funzionario esamina i moduli per quarantadue minuti. "Manca il timbro nella casella D." Trenta minuti dopo: "Approvato provvisoriamente." Non capite cosa voglia dire. Lui nemmeno.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+20);G.oro=Math.max(0,G.oro-30);}},
      {etich:'Corruzione',testo:'Il modulo vale meno di 50 oro. Diretti.',colore:'',
        esito:'Il funzionario guarda l\'oro. Guarda il modulo. Guarda l\'oro. Piega il modulo. "Consideratevi autorizzati." Parte soddisfatto di entrambi.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-50);G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);}},
      {etich:'Rifiuto',testo:'"Non siamo il tipo di pirati che compila moduli."',colore:'rosso',
        esito:'Il funzionario annota qualcosa su un altro modulo. Salpa. Le conseguenze arriveranno via posta ufficiale, probabilmente in triplice copia.',
        tipo:'male', fn:()=>{G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-20);}},
    ]
  },

  {
    id:'concorrente_pirata', tag:'Politica', peso:2,
    icona:'🏴', sfondo:'#1a0a00',
    titolo:'Il Capitano Rivale',
    testo:()=>{
      const nomi=['Ferro Gonzalez','La Vedova Nera','Capitan Zampone','Il Magnifico Errore','Dente d\'Arrugine'];
      const nome=nomi[Math.floor(Math.random()*nomi.length)];
      return nome+' ha stabilito una base sull\'isolotto vicino. Vi manda un messaggio: "Questo mare è abbastanza grande per due capitani." Poi ne manda un secondo: "Ma sarebbe più comodo per uno solo." Poi un terzo: "Pace?"';
    },
    scelte:[
      {etich:'Alleanza',testo:'Pace. Il mare è grande per tutti.',colore:'verde',
        esito:'Strette di mano, rum condiviso, accordo di non interferenza. Il rivale è affidabile quanto può esserlo un pirata. Cioè abbastanza.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+20);G.oro+=50;}},
      {etich:'Pressione',testo:'Il mare è grande, ma l\'isolotto vicino è vostro.',colore:'rosso',
        esito:'Il rivale se ne va dopo una settimana di tensione. Lascia una nota: "La prossima volta mando tre messaggi meno educati." Minaccia, probabilmente.',
        tipo:'male', fn:()=>{G.oro+=30;G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-10);}},
      {etich:'Curiosità',testo:'Invitatelo a cena prima di decidere.',colore:'',
        esito:'È simpatico. Storie straordinarie. Ordina rum come se fosse la sua ultima notte. Accordo raggiunto a metà cena, tra risate e qualcosa che sembrava una promessa.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-20);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
    ]
  }
);
// ═══════════════════════════════════════
// MODULO: EVENTS_LOGIC
// ═══════════════════════════════════════
function eventoRandom(){
  // ogni 7 tick: 55% narrativo, 45% silenzioso
  if(G.cooldownEvento>0){ G.cooldownEvento--; eventoSilenzioso(); return; }
  if(Math.random()<0.55 && !G.eventoAttivo){
    const disponibili=EVENTI_NARRATIVI.filter(e=>e.peso>0);
    const tot=disponibili.reduce((a,e)=>a+e.peso,0);
    let r=Math.random()*tot;
    for(const ev of disponibili){ r-=ev.peso; if(r<=0){ mostraEvento(ev); return; } }
  }
  eventoSilenzioso();
}

function eventoSilenzioso(){
  const eventi=[
    {p:2,fn:()=>{const g=20+Math.floor(Math.random()*40);G.oro+=g;aggMsg('💰 Un tributo anonimo arriva al porto. Nessuno firma. +'+g+' oro','bene');}},
    {p:2,fn:()=>{const f=15+Math.floor(Math.random()*30);G.cibo+=f;const frasi=['Pesca miracolosa. Il cuoco è sospettosamente soddisfatto.','Qualcuno ha pescato qualcosa di enorme. Non chiedete cosa fosse.','Rete piena. Persino il navigatore ha aiutato. Malvolentieri.'];aggMsg('🐟 '+frasi[Math.floor(Math.random()*frasi.length)]+' +'+f+' cibo','bene');}},
    {p:2,fn:()=>{G.rum+=20+Math.floor(Math.random()*15);const frasi=['Un barilotto di rum galleggia verso riva. Qualcuno lo ha perso. Loro: perdita. Voi: guadagno.','Ritrovato rum nascosto da un pirata che non ricorda di averlo nascosto.','Il cuoco aveva rum "di riserva personale". Non più.'];aggMsg('🍺 '+frasi[Math.floor(Math.random()*frasi.length)]+' +rum','bene');}},
    {p:1,fn:()=>{G.ricerca.punti+=12;const frasi=['Trovato un libro di navigazione tra i rottami. Qualcuno lo aveva letto e sottolineato tutto.','Un vecchio marinaio lascia i suoi appunti prima di andarsene. Scrittura illeggibile ma illuminante.','I rottami dell\'ultima tempesta contenevano schizzi tecnici. Rarissimi.'];aggMsg('📚 '+frasi[Math.floor(Math.random()*frasi.length)],'info');}},
    {p:2,fn:()=>{const g=15+Math.floor(Math.random()*35);G.oro=Math.max(0,G.oro-g);const frasi=['Furto notturno nei magazzini. Professionista. Non ha lasciato tracce.','Qualcuno ha "prestato" oro dalla cassa comune. Non ha lasciato nota.','Il tesoriere giura di aver contato bene ieri. I numeri dissentono.'];aggMsg('🔓 '+frasi[Math.floor(Math.random()*frasi.length)]+' -'+g+' oro','male');}},
    {p:1,fn:()=>{const f=10+Math.floor(Math.random()*20);G.cibo=Math.max(0,G.cibo-f);const frasi=['I topi hanno razziato le dispense. Organizzati, efficienti, impuniti.','Il cuoco giura di non aver lasciato il magazzino aperto. Il cibo la pensa diversamente.','Un nido di topi scoperto nelle scorte. Il cuoco li ha descritti come "grossi come gatti". Nessuno lo contraddice.'];aggMsg('🐀 '+frasi[Math.floor(Math.random()*frasi.length)]+' -'+f+' cibo','male');}},
    {p:2,fn:()=>{const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];if(p){p.combattimento=Math.min(100,p.combattimento+6);const frasi=['si allena all\'alba con serietà inquietante.','ha sfidato a duello un albero. Ha vinto.','ha trascorso la notte ad affilare la spada. Per precauzione, dice.'];aggMsg('⚔ '+p.nome+' '+frasi[Math.floor(Math.random()*frasi.length)]+' +6 combattimento','bene');}}},
    {p:1,fn:()=>{const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];if(p){p.navigazione=Math.min(100,p.navigazione+5);aggMsg('🧭 '+p.nome+' ha studiato le stelle tutta la notte. Le stelle lo ignorano ma lui sa navigare meglio. +5 navigazione','bene');}}},
    {p:1,fn:()=>{const k=['reale','mercante','corsaro'][Math.floor(Math.random()*3)];const v=(Math.random()<.5?1:-1)*(4+Math.floor(Math.random()*8));G.fazioni[k].rep=Math.max(-100,Math.min(100,G.fazioni[k].rep+v));const nome=G.fazioni[k].nome;aggMsg('🌐 '+nome+': qualcuno ha detto qualcosa da qualche parte. Rep '+(v>0?'+':'')+v,'info');}},
    {p:1,fn:()=>{G.legno+=20+Math.floor(Math.random()*20);aggMsg('🪵 Trovato un relitto ricco di legname sulla spiaggia nord. Il mare è generoso quando vuole.','bene');}},
    {p:1,fn:()=>{G.legno=Math.max(0,G.legno-15);aggMsg('🔥 Il falegname ha bruciato del legname per sbaglio. Stava "testando la resistenza al fuoco". Risultato: basso.','male');}},
    {p:1,fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);aggMsg('🌅 Alba insolitamente bella. Persino i pirati più cinici si fermano a guardarla. Un momento di pace.','bene');}},
    {p:1,fn:()=>{const g=10+Math.floor(Math.random()*25);G.oro+=g;aggMsg('💸 Un debitore di vecchia data ha pagato. Nessuno ricordava il debito. Lui sì.','bene');}},
    {p:1,fn:()=>{for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);aggMsg('😡 La ciurma ha litigato sul chi prende il letto migliore nella nuova capanna. Nessun ferito, ma l\'atmosfera è pesante.','male');}},
  ];
  const tot=eventi.reduce((a,e)=>a+e.p,0);
  let r=Math.random()*tot;
  for(const e of eventi){r-=e.p;if(r<=0){e.fn();break;}}
}

function mostraEvento(ev){
  G.eventoAttivo=true;
  G.cooldownEvento=COOLDOWN_EVENTO_MIN;

  const banner=document.getElementById('ev-banner');
  banner.style.background=ev.sfondo||'#0a1a2a';
  // icona nel banner (prima del ::after quindi z-index 0)
  banner.innerHTML='<span class="evento-tag" id="ev-tag">'+ev.tag+'</span><span style="position:relative;z-index:2;filter:drop-shadow(0 2px 8px rgba(0,0,0,.8))">'+ev.icona+'</span>';

  document.getElementById('ev-titolo').textContent=ev.titolo;
  const testo=typeof ev.testo==='function'?ev.testo():ev.testo;
  document.getElementById('ev-testo').textContent=testo;

  const contenitoreScelte=document.getElementById('ev-scelte');
  contenitoreScelte.innerHTML='';
  const esito=document.getElementById('ev-esito');
  esito.className='esito-evento';
  esito.style.display='none';
  const btnChiudi=document.getElementById('btn-chiudi-evento');
  btnChiudi.className='';
  btnChiudi.style.display='none';

  ev.scelte.forEach((sc,i)=>{
    const btn=document.createElement('button');
    btn.className='btn-scelta'+(sc.colore?' '+sc.colore:'');
    btn.innerHTML='<span class="scelta-etich">'+sc.etich+'</span>'+sc.testo;
    btn.onclick=()=>eseguiScelta(ev,sc,contenitoreScelte,esito,btnChiudi);
    contenitoreScelte.appendChild(btn);
  });

  document.getElementById('overlay-evento').classList.add('aperto');
}

function eseguiScelta(ev,sc,contenitoreScelte,esitoEl,btnChiudi){
  // esegui conseguenza
  if(sc.fn) sc.fn();
  aggiornaUI();

  // mostra esito
  const testoEsito=typeof sc.esito==='function'?sc.esito():sc.esito;
  esitoEl.textContent=testoEsito;
  esitoEl.className='esito-evento mostra'+(sc.tipo==='male'?' male':sc.tipo==='bene'?' bene':'');
  esitoEl.style.display='block';

  // nascondi scelte
  contenitoreScelte.style.display='none';

  // mostra tasto chiudi
  btnChiudi.className='mostra';
  btnChiudi.style.display='block';
}

function chiudiEvento(){
  G.eventoAttivo=false;
  document.getElementById('overlay-evento').classList.remove('aperto');
  document.getElementById('ev-scelte').style.display='flex';
}

function reclutaPirata(){
  if(G.oro<50){aggMsg('Servono 50 oro!','male');return;}
  G.oro-=50; creaaPirata();
  aggMsg('Nuovo pirata reclutato!','bene');aggiornaUI();
}

// ── MISSIONI ──
function assegnaMissioni(){
  G.missioniAttive=POOL_MISSIONI.slice(0,3).map(q=>({...q,progresso:0,completata:false}));
}
function controllaMissione(tipo,val){
  for(const m of G.missioniAttive){
    if(m.completata) continue;
    if(m.tipo===tipo){
      if(tipo==='raid'||tipo==='riscatti'||tipo==='ricerca') m.progresso+=val;
      else m.progresso=Math.max(m.progresso,val);
      if(m.progresso>=m.obiettivo){
        m.completata=true;
        for(const[k,v] of Object.entries(m.ricompensa)){
          if(k==='oro') G.oro+=v;
          else if(k==='legno') G.legno+=v;
          else if(k==='rum') G.rum+=v;
          else if(k==='ricerca') G.ricerca.punti+=v;
        }
        const rs=Object.entries(m.ricompensa).map(([k,v])=>`${v} ${k}`).join(', ');
        notifica('📜 Missione Completata!',`"${m.titolo}" — Ricompensa: ${rs}`,'missione');
        const nuove=POOL_MISSIONI.filter(q2=>!G.missioniAttive.find(a=>a.id===q2.id));
        if(nuove.length>0){
          const nm={...nuove[Math.floor(Math.random()*nuove.length)],progresso:0,completata:false};
          G.missioniAttive=G.missioniAttive.map(x=>x.id===m.id?nm:x);
        }
        aggiornaUI();
      }
    }
    if(m.tipo==='oro'&&G.oro>=m.obiettivo&&!m.completata){
      m.progresso=G.oro;
      if(m.progresso>=m.obiettivo){
        m.completata=true; G.ricerca.punti+=m.ricompensa.ricerca||0;
        notifica('📜 Missione Completata!',`"${m.titolo}"!`,'missione');
        aggiornaUI();
      }
    }
  }
}

// ═══════════════════════════════════════════════════
// RENDER PANNELLO
// ═══════════════════════════════════════════════════
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
// ═══════════════════════════════════════
// MODULO: INPUT
// ═══════════════════════════════════════
const pan={attivo:false,startX:0,startY:0,camStartX:0,camStartY:0,mosso:false};

// ── MOBILE DRAWER ──
function isMobile(){ return window.innerWidth<=600; }
function isLandscapeMobile(){ return window.innerHeight<=500 && window.innerWidth>window.innerHeight; }

function togglePannelloMobile(){
  const aperto=document.body.classList.toggle('pannello-aperto');
  document.getElementById('pannello-dx').classList.toggle('aperto',aperto);
  document.getElementById('btn-toggle-pannello').textContent=aperto?'✕':'☰';
}
function chiudiPannelloMobile(){
  document.body.classList.remove('pannello-aperto');
  document.getElementById('pannello-dx').classList.remove('aperto');
  const btn=document.getElementById('btn-toggle-pannello');
  if(btn) btn.textContent='☰';
}
function impostaMobile(){
  const btn=document.getElementById('btn-toggle-pannello');
  const pannello=document.getElementById('pannello-dx');
  if(isLandscapeMobile()){
    // Landscape mobile: pannello laterale sempre visibile, drawer disabilitato
    btn.style.display='none';
    document.body.classList.remove('pannello-aperto');
    pannello.classList.remove('aperto');
  } else if(isMobile()){
    // Portrait mobile: drawer attivo
    btn.style.display='flex';
    pannello.classList.remove('aperto');
    document.body.classList.remove('pannello-aperto');
  } else {
    // Desktop: nasconde toggle
    btn.style.display='none';
    document.body.classList.remove('pannello-aperto');
  }
}

// ═══════════════════════════════════════════════════
// PATHFINDING A* — movimento pirati verso edifici
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════
// MODULO: PATHFINDING
// ═══════════════════════════════════════
function heuristica(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2); }

function costoTile(r,c){
  const t=G.mappa[r]&&G.mappa[r][c];
  if(t===undefined) return Infinity;
  // FASE 2C: i sentieri diventano la vera rete dell'isola.
  // Molto più convenienti rispetto al terreno naturale, così pirati e schiavi
  // preferiscono le strade invece di tagliare per spiagge/foreste.
  if(t===T.SENTIERO) return 0.45;
  if(t===T.SABBIA||t===T.ERBA) return 6;
  if(t===T.PALUDE) return 9;
  if(t===T.COLLINA) return 10;
  if(t===T.FORESTA) return 14;
  if(t===T.OCEANO||t===T.BASSO||t===T.FIUME||t===T.ROCCIA) return Infinity;
  return 8;
}

function tileCamminabile(r,c){
  return costoTile(Math.floor(r),Math.floor(c))<Infinity;
}

function trovaTileCamminabileVicino(r,c,raggio=6){
  r=Math.round(r); c=Math.round(c);
  if(tileCamminabile(r,c)) return {r,c};
  for(let rad=1;rad<=raggio;rad++){
    for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){
      if(Math.abs(dr)!==rad && Math.abs(dc)!==rad) continue;
      const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=G.RIGHE||nc>=G.COLS) continue;
      if(tileCamminabile(nr,nc)) return {r:nr,c:nc};
    }
  }
  return {r:Math.floor(G.RIGHE/2),c:Math.floor(G.COLS/2)};
}

function bonusSentieroPer(r,c){
  const rr=Math.floor(r), cc=Math.floor(c);
  const t=G.mappa[rr]&&G.mappa[rr][cc];
  return t===T.SENTIERO ? 1.45 : 0.72;
}

function astar(sr,sc,er,ec){
  if(sr===er&&sc===ec) return [];
  const key=(r,c)=>r*1000+c;
  const open=new Map();
  const g=new Map(); const f=new Map(); const parent=new Map();
  g.set(key(sr,sc),0);
  f.set(key(sr,sc),heuristica(sr,sc,er,ec));
  open.set(key(sr,sc),{r:sr,c:sc});
  const closed=new Set();
  let iter=0;
  while(open.size>0&&iter++<800){
    let bestK=null,bestF=Infinity;
    for(const[k,_] of open){ const fv=f.get(k)||Infinity; if(fv<bestF){bestF=fv;bestK=k;} }
    const cur=open.get(bestK);
    open.delete(bestK); closed.add(bestK);
    if(cur.r===er&&cur.c===ec){
      const path=[];
      let k=key(er,ec);
      while(parent.has(k)){ const n=parent.get(k); path.unshift({r:n.r,c:n.c}); k=key(n.r,n.c); }
      path.push({r:er,c:ec});
      return path;
    }
    const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for(const[dr,dc] of dirs){
      const nr=cur.r+dr,nc=cur.c+dc;
      const nk=key(nr,nc);
      if(closed.has(nk)) continue;
      const cost=costoTile(nr,nc); if(cost===Infinity) continue;
      const diag=dr!==0&&dc!==0;
      const ng=(g.get(bestK)||0)+cost*(diag?1.4:1);
      if(!open.has(nk)||ng<(g.get(nk)||Infinity)){
        g.set(nk,ng);
        f.set(nk,ng+heuristica(nr,nc,er,ec));
        parent.set(nk,{r:cur.r,c:cur.c});
        open.set(nk,{r:nr,c:nc});
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════
// MOVIMENTO PIRATI — stile Tropico 2
//
// Velocità di camminata: ~1.5 tile/secondo alla velocità normale.
// muoviPirata(p, dt) riceve il delta time in secondi dall'ultimo frame,
// già moltiplicato per G.velocita → se G.velocita=0 i pirati si fermano.
//
// aggiornaPirata(p) è chiamato dal tick (ogni ~8 secondi reali / velocita)
// e decide il prossimo obiettivo. I timer interni sono in secondi reali
// per essere indipendenti dall'fps.
// ═══════════════════════════════════════════════════

// Velocità di camminata base in tile/secondo
const PIRATA_SPEED = 1.4;

function aggiornaPirata(p){
  // Pausa all'edificio: decrementa timer in secondi
  if(p._stato==='pausa'){
    // la pausa viene gestita in muoviPirata con _pausaSec
    return;
  }

  // Se sta camminando e ha finito il percorso → pausa
  if(p._stato==='cammina' && p.percorso && p.percorsoIdx>=(p.percorso.length||0)){
    p._stato='pausa';
    p._pausaSec = 3 + Math.random()*5; // 3-8 secondi reali di pausa
    return;
  }

  // Se vaga, ogni tanto cerca una nuova destinazione
  if(p._stato!=='cammina'){
    p._vagaSec = (p._vagaSec||0) - (G.tickMs/1000/G.velocita||8);
    if(p._vagaSec > 0) return;
    p._vagaSec = 6 + Math.random()*10; // nuova scelta ogni 6-16 secondi reali

    if(G.edifici.length>0 && Math.random()<0.7){
      const candidati=G.edifici.filter(b=>!p.dest||(b.r!==p.dest.r||b.c!==p.dest.c));
      const pool=candidati.length>0 ? candidati : G.edifici;
      const target=pool[Math.floor(Math.random()*pool.length)];
      const sr=Math.max(0,Math.min(G.RIGHE-1,Math.round(p.mr)));
      const sc=Math.max(0,Math.min(G.COLS-1,Math.round(p.mc)));
      const path=astar(sr,sc,target.r,target.c);
      if(path && path.length>0){
        p.dest={r:target.r,c:target.c};
        p.percorso=path;
        p.percorsoIdx=0;
        p._stato='cammina';
      }
    }
  }
}

// dt = delta time in secondi, già scalato per velocita (=0 se in pausa)
function muoviPirata(p, dt){
  // In pausa: decrementa timer, poi torna a vagare
  if(p._stato==='pausa'){
    if(dt>0){
      p._pausaSec=(p._pausaSec||0)-dt;
      if(p._pausaSec<=0){
        p._stato='vaga';
        p._vagaSec=0; // riparte subito a cercare dest
        p.dest=null; p.percorso=null; p.percorsoIdx=0;
      }
    }
    return;
  }

  if(dt===0) return; // gioco in pausa

  // NaN guard: resetta coordinate se corrotte
  if(!isFinite(p.mc)||!isFinite(p.mr)){
    p.mc=G.COLS/2; p.mr=G.RIGHE/2;
    p._stato='vaga'; p.percorso=null; p.percorsoIdx=0;
    return;
  }

  if(p._stato==='cammina' && p.percorso && p.percorsoIdx<p.percorso.length){
    const target=p.percorso[p.percorsoIdx];
    const tx=target.c+.5, ty=target.r+.5;
    const dx=tx-p.mc, dy=ty-p.mr;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const step=PIRATA_SPEED*dt*bonusSentieroPer(p.mr,p.mc);
    if(dist<step+0.01 || dist===0){  // dist===0 evita NaN da 0/0
      p.mc=tx; p.mr=ty;
      p.percorsoIdx++;
    } else {
      p.mc+=dx/dist*step;
      p.mr+=dy/dist*step;
    }
  } else {
    // Vaga: piccolo movimento casuale nel tile corrente
    if(!p._vagaDx || Math.random()<0.01){
      const a=Math.random()*Math.PI*2;
      const v=0.15+Math.random()*0.2; // 0.15-0.35 tile/sec quando vaga
      p._vagaDx=Math.cos(a)*v;
      p._vagaDy=Math.sin(a)*v;
    }
    const dvx = isFinite(p._vagaDx) ? p._vagaDx : 0;
    const dvy = isFinite(p._vagaDy) ? p._vagaDy : 0;
    const oldC=p.mc, oldR=p.mr;
    p.mc+=dvx*dt;
    p.mr+=dvy*dt;
    // Bug visivo: mai far vagare i pirati su mare/fiume. Se la deriva casuale
    // li porta fuori dai tile camminabili, annulla il passo e scegli nuova direzione.
    if(!tileCamminabile(p.mr,p.mc)){
      p.mc=oldC; p.mr=oldR;
      p._vagaDx=0; p._vagaDy=0;
    }
  }

  // Bounds + sicurezza terreno
  const margin=1.5;
  p.mc=Math.max(margin,Math.min(G.COLS-margin,p.mc));
  p.mr=Math.max(margin,Math.min(G.RIGHE-margin,p.mr));
  if(!tileCamminabile(p.mr,p.mc)){
    const safe=trovaTileCamminabileVicino(p.mr,p.mc,8);
    p.mr=safe.r+.5; p.mc=safe.c+.5;
    p._stato='vaga'; p.percorso=null; p.percorsoIdx=0;
  }
}

// ── COSTRUZIONE SENTIERO ──
let sentieroDrag=false;
function iniziaSentieroDrag(r,c){ sentieroDrag=true; piazzaSentiero(r,c); }
function fineSentieroDrag(){ sentieroDrag=false; }
function piazzaSentiero(r,c){
  if(r<0||r>=G.RIGHE||c<0||c>=G.COLS) return;
  const t=G.mappa[r][c];
  if(t===T.OCEANO||t===T.BASSO||t===T.ROCCIA) return;
  if(G.edifici.find(b=>b.r===r&&b.c===c)) return;
  if(t!==T.SENTIERO){
    if(G.oro<2){ aggMsg('Servono 2 oro per ogni tile sentiero','male'); return; }
    G.oro-=2;
    G.mappa[r][c]=T.SENTIERO;
    _tileCache=null;
    for(const p of G.pirati){ p.percorso=null; p.percorsoIdx=0; }
    aggiornaUI();
  }
}
function rimuoviSentiero(r,c){
  if(G.mappa[r]&&G.mappa[r][c]===T.SENTIERO){
    G.mappa[r][c]=T.ERBA;
    _tileCache=null;
    for(const p of G.pirati){ p.percorso=null; p.percorsoIdx=0; }
  }
}
// ═══════════════════════════════════════
// MODULO: PORTRAIT
// ═══════════════════════════════════════
let _portraitPirataId=null;
const pCtx=()=>document.getElementById('portrait-canvas').getContext('2d');

function apriPortrait(p){
  _portraitPirataId=p.id;
  const hud=document.getElementById('portrait-hud');
  hud.classList.add('visibile');
  aggiornaPortrait();
}

function chiudiPortrait(){
  document.getElementById('portrait-hud').classList.remove('visibile');
  G.pirataSelezionato=null;
  _portraitPirataId=null;
}

function aggiornaPortrait(){
  const p=G.pirati.find(x=>x.id===_portraitPirataId);
  if(!p){ chiudiPortrait(); return; }

  // Testo
  const nome=p.capitano?p.nome+' ★':p.nome;
  document.getElementById('ph-nome').textContent=nome;
  document.getElementById('ph-ruolo').textContent=p.ruolo+(p.titolo?' · '+p.titolo:'');

  const cEff=statEffettiva(p,'combattimento');
  const nEff=statEffettiva(p,'navigazione');
  const umore=Math.floor(p.umore);

  document.getElementById('ph-bar-comb').style.width=cEff+'%';
  document.getElementById('ph-val-comb').textContent=cEff;
  document.getElementById('ph-bar-nav').style.width=nEff+'%';
  document.getElementById('ph-val-nav').textContent=nEff;
  document.getElementById('ph-bar-umore').style.width=umore+'%';
  document.getElementById('ph-bar-umore').style.background=coloreUmore(umore);
  document.getElementById('ph-val-umore').textContent=umore;

  const frasi={
    felice:['Alla grande, Capitano!','Pronto per l\'avventura!','La vita è bella!'],
    neutro:['Potrebbe andare meglio.','Si tira avanti.','Né bene né male.'],
    triste:['Non sono contento.','Questo non va bene.','Voglio andarmene.']
  };
  const cat=umore>65?'felice':umore>35?'neutro':'triste';
  const arr=frasi[cat];
  document.getElementById('ph-umore-text').textContent='"'+arr[p.id%arr.length]+'"';

  // Destinazione
  const dest=p.dest?G.edifici.find(b=>b.r===p.dest.r&&b.c===p.dest.c):null;
  document.getElementById('ph-dest').textContent=dest
    ?(ED[dest.tipo].icona+' → '+ED[dest.tipo].nome)
    :'· in giro per l\'isola';

  // Disegna ritratto sul canvas
  disegnaPortraitCanvas(p, cEff, nEff, umore);
}

function disegnaPortraitCanvas(p, cEff, nEff, umore){
  const pc=document.getElementById('portrait-canvas');
  if(!pc) return;
  const px=pc.getContext('2d');
  if(!px) return;
  const W=pc.width||210, H=pc.height||120;
  if(W===0||H===0) return;

  // Normalizza ruolo per lookup sicuro
  const ruolo=p.ruolo||'Bucaniere';

  // Sfondo
  const bgColors={
    'Bucaniere':'#1a0808','Navigatore':'#040e1a','Cannoniere':'#0e0e0e',
    'Chirurgo':'#0a1008','Cuoco':'#120e04','Nostromo':'#081208',
    'Spia':'#080808','Quartier Mastro':'#100c02'
  };
  px.fillStyle=bgColors[ruolo]||'#0a0808';
  px.fillRect(0,0,W,H);

  // Alone colorato per ruolo
  const glowColors={
    'Bucaniere':'rgba(160,30,20,.25)','Navigatore':'rgba(20,80,200,.2)',
    'Cannoniere':'rgba(60,60,50,.3)','Chirurgo':'rgba(200,200,190,.15)',
    'Cuoco':'rgba(180,140,40,.2)','Nostromo':'rgba(30,120,30,.2)',
    'Spia':'rgba(40,40,40,.35)','Quartier Mastro':'rgba(160,140,20,.2)'
  };
  const glow=px.createRadialGradient(W*.5,H*.7,0,W*.5,H*.7,W*.7);
  glow.addColorStop(0,glowColors[ruolo]||'rgba(240,192,64,.1)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  px.fillStyle=glow; px.fillRect(0,0,W,H);

  // Vignette
  const vig=px.createRadialGradient(W*.5,H*.5,H*.2,W*.5,H*.5,H*.8);
  vig.addColorStop(0,'rgba(0,0,0,0)');
  vig.addColorStop(1,'rgba(0,0,0,.55)');
  px.fillStyle=vig; px.fillRect(0,0,W,H);

  const sc=W/52*1.8;
  const cx=W*.42, cy=H*.88;

  // Colori per ruolo — fallback esplicito su ogni proprietà
  const bodyColors={
    'Bucaniere':     {top:'#9a2818',bot:'#6a1208',trim:'#c84030'},
    'Navigatore':    {top:'#1a4a8a',bot:'#0e2a5a',trim:'#4a8adc'},
    'Cannoniere':    {top:'#3a3028',bot:'#1a1818',trim:'#7a6858'},
    'Chirurgo':      {top:'#e0e0d8',bot:'#b0b0a8',trim:'#c0302a'},
    'Cuoco':         {top:'#e0c898',bot:'#b09870',trim:'#c8a050'},
    'Nostromo':      {top:'#2a6a28',bot:'#1a4a18',trim:'#5aaa58'},
    'Spia':          {top:'#1e1e18',bot:'#101010',trim:'#4a4040'},
    'Quartier Mastro':{top:'#8a7828',bot:'#5a5010',trim:'#c8b040'},
  };
  const _bc=bodyColors[ruolo]||{};
  const bcTop  =_bc.top  ||'#6a4a28';
  const bcBot  =_bc.bot  ||'#3a2810';
  const bcTrim =_bc.trim ||'#a07040';

  const skinTones=['#d4a574','#c8916a','#8b5e3c','#e8c49a','#a0714f'];
  const skinCol=skinTones[(p.id||0)%skinTones.length]||'#c8916a';

  // OMBRA
  px.save();
  px.globalAlpha=.3; px.fillStyle='#000';
  px.beginPath();px.ellipse(cx+sc*6,cy+sc*2,sc*14,sc*4,.18,0,Math.PI*2);px.fill();
  px.restore();

  // STIVALI
  px.fillStyle='#2a1a08';
  px.fillRect(cx-sc*3.5,cy-sc*1,sc*3.5,sc*7);
  px.fillRect(cx+sc*.5,cy-sc*1,sc*3.5,sc*7);
  px.fillStyle='#3a2510';
  px.fillRect(cx-sc*5,cy+sc*5.5,sc*4,sc*2);
  px.fillRect(cx+sc*.2,cy+sc*5.5,sc*4,sc*2);

  // CORPO
  const bodyG=px.createLinearGradient(cx-sc*6,cy-sc*15,cx+sc*6,cy-sc*1);
  bodyG.addColorStop(0,bcTop); bodyG.addColorStop(1,bcBot);
  px.fillStyle=bodyG;
  px.beginPath();
  px.moveTo(cx-sc*5,cy-sc*1);
  px.bezierCurveTo(cx-sc*7,cy-sc*5,cx-sc*6,cy-sc*10,cx-sc*4,cy-sc*13);
  px.lineTo(cx+sc*4,cy-sc*13);
  px.bezierCurveTo(cx+sc*6,cy-sc*10,cx+sc*7,cy-sc*5,cx+sc*5,cy-sc*1);
  px.closePath(); px.fill();
  px.strokeStyle='rgba(0,0,0,.2)'; px.lineWidth=.6; px.stroke();

  // COLLETTO
  px.strokeStyle=bcTrim; px.lineWidth=1.2;
  px.beginPath();px.moveTo(cx-sc*2,cy-sc*12.5);px.lineTo(cx,cy-sc*10);px.lineTo(cx+sc*2,cy-sc*12.5);px.stroke();

  // CINTURA
  px.fillStyle='#5a3818'; px.fillRect(cx-sc*5.5,cy-sc*3.8,sc*11,sc*2.8);
  px.fillStyle='#d4a020'; px.fillRect(cx-sc*1.8,cy-sc*3.6,sc*3.6,sc*2.4);

  // BRACCIO DX
  const armG=px.createLinearGradient(cx+sc*5,cy-sc*12,cx+sc*10,cy-sc*3);
  armG.addColorStop(0,bcTop); armG.addColorStop(1,bcBot);
  px.fillStyle=armG;
  px.beginPath();
  px.moveTo(cx+sc*4.5,cy-sc*12);
  px.bezierCurveTo(cx+sc*9,cy-sc*8,cx+sc*11,cy-sc*4,cx+sc*10,cy-sc*2);
  px.lineTo(cx+sc*7.5,cy-sc*2);
  px.bezierCurveTo(cx+sc*7.5,cy-sc*5,cx+sc*5.5,cy-sc*10,cx+sc*3.5,cy-sc*12);
  px.closePath(); px.fill();
  // Spada
  px.strokeStyle='#c8c8d0'; px.lineWidth=sc*1.5;
  px.beginPath();px.moveTo(cx+sc*9,cy-sc*1.5);px.lineTo(cx+sc*15,cy+sc*7);px.stroke();
  px.fillStyle='#c4940c';
  px.beginPath();px.ellipse(cx+sc*9,cy-sc*1.5,sc*2.5,sc*1,-.3,0,Math.PI*2);px.fill();

  // BRACCIO SX
  const armG2=px.createLinearGradient(cx-sc*5,cy-sc*12,cx-sc*10,cy-sc*3);
  armG2.addColorStop(0,bcTop); armG2.addColorStop(1,bcBot);
  px.fillStyle=armG2;
  px.beginPath();
  px.moveTo(cx-sc*4.5,cy-sc*12);
  px.bezierCurveTo(cx-sc*9,cy-sc*8,cx-sc*10,cy-sc*4,cx-sc*9,cy-sc*2);
  px.lineTo(cx-sc*7,cy-sc*2);
  px.bezierCurveTo(cx-sc*6,cy-sc*5,cx-sc*4,cy-sc*10,cx-sc*3,cy-sc*12);
  px.closePath(); px.fill();
  px.fillStyle=skinCol;
  px.beginPath();px.arc(cx-sc*9,cy-sc*1.5,sc*2.2,0,Math.PI*2);px.fill();

  // COLLO + TESTA
  px.fillStyle=skinCol;
  px.beginPath();px.ellipse(cx,cy-sc*14,sc*2.8,sc*1.6,0,0,Math.PI*2);px.fill();
  const headG=px.createRadialGradient(cx-sc*1,cy-sc*18,0,cx,cy-sc*17,sc*6.5);
  headG.addColorStop(0,skinCol);
  headG.addColorStop(0.75,skinCol);
  headG.addColorStop(1,'rgba(0,0,0,.3)');
  px.fillStyle=headG;
  px.beginPath();px.ellipse(cx,cy-sc*17,sc*5.8,sc*6.5,0,0,Math.PI*2);px.fill();

  // OCCHI
  px.fillStyle='#1a0a00';
  px.beginPath();px.ellipse(cx-sc*1.8,cy-sc*17.5,sc*1.2,sc*1.3,0,0,Math.PI*2);px.fill();
  px.beginPath();px.ellipse(cx+sc*1.8,cy-sc*17.5,sc*1.2,sc*1.3,0,0,Math.PI*2);px.fill();
  px.fillStyle='rgba(255,255,255,.5)';
  px.beginPath();px.arc(cx-sc*1.2,cy-sc*17.9,sc*.45,0,Math.PI*2);px.fill();
  px.beginPath();px.arc(cx+sc*2.4,cy-sc*17.9,sc*.45,0,Math.PI*2);px.fill();

  // SOPRACCIGLIA
  const browsA=umore>60?-.1:umore>30?0:.28;
  px.strokeStyle='rgba(80,40,10,.7)'; px.lineWidth=sc*1;
  px.beginPath();px.moveTo(cx-sc*3.2,cy-sc*20-browsA*sc*2);px.lineTo(cx-sc*.8,cy-sc*19.5+browsA*sc*2);px.stroke();
  px.beginPath();px.moveTo(cx+sc*3.2,cy-sc*20-browsA*sc*2);px.lineTo(cx+sc*.8,cy-sc*19.5+browsA*sc*2);px.stroke();

  // BOCCA
  px.strokeStyle='rgba(100,40,20,.8)'; px.lineWidth=sc*1;
  px.beginPath();
  if(umore>65) px.arc(cx,cy-sc*15.5,sc*2,0.15,Math.PI-.15,false);
  else if(umore>35){px.moveTo(cx-sc*2,cy-sc*15.5);px.lineTo(cx+sc*2,cy-sc*15.5);}
  else px.arc(cx,cy-sc*14.2,sc*2,Math.PI+.15,-.15,false);
  px.stroke();

  // CAPPELLO
  if(ruolo!=='Cuoco'){
    px.fillStyle='#1a1a1a';
    px.beginPath();px.ellipse(cx,cy-sc*22,sc*11,sc*4.2,0,0,Math.PI*2);px.fill();
    px.fillStyle='#282828';
    px.beginPath();
    px.moveTo(cx-sc*7,cy-sc*22);
    px.bezierCurveTo(cx-sc*6,cy-sc*28,cx-sc*3,cy-sc*31,cx,cy-sc*31);
    px.bezierCurveTo(cx+sc*3,cy-sc*31,cx+sc*6,cy-sc*28,cx+sc*7,cy-sc*22);
    px.closePath();px.fill();
    px.fillStyle=bcTrim;
    px.fillRect(cx-sc*7,cy-sc*24.5,sc*14,sc*2.2);
    px.fillStyle='#d4a020';
    px.fillRect(cx-sc*1.8,cy-sc*24.5,sc*3.6,sc*2.2);
    if(ruolo==='Bucaniere'||ruolo==='Quartier Mastro'){
      px.strokeStyle='rgba(220,50,20,.85)'; px.lineWidth=sc*.9;
      px.beginPath();
      px.moveTo(cx-sc*5,cy-sc*23.5);
      px.bezierCurveTo(cx-sc*9,cy-sc*28,cx-sc*7,cy-sc*34,cx-sc*4,cy-sc*32);
      px.stroke();
    }
  } else {
    px.fillStyle='#f0ece0';
    px.beginPath();px.ellipse(cx,cy-sc*22,sc*8,sc*3,0,0,Math.PI*2);px.fill();
    px.fillRect(cx-sc*5.5,cy-sc*28,sc*11,sc*7);
    px.beginPath();px.ellipse(cx,cy-sc*28,sc*5.5,sc*2.8,0,0,Math.PI*2);px.fill();
  }

  // Pannello info in basso
  px.fillStyle='rgba(0,0,0,.55)';
  px.fillRect(0,H-22,W,22);
  px.textAlign='center'; px.textBaseline='middle';
  px.fillStyle='rgba(255,235,180,.88)';
  px.font=`${Math.round(sc*3.8)}px 'Cinzel',serif`;
  px.fillText('Lv'+(p.livello||1)+' · '+(p.xp||0)+' xp', W*.5, H-11);
}


// Aggiorna il portrait ogni frame se visibile
function tickPortrait(){
  if(!_portraitPirataId) return;
  const p=G.pirati.find(x=>x.id===_portraitPirataId);
  if(!p){ chiudiPortrait(); return; }
  aggiornaPortrait();
}
// ═══════════════════════════════════════
// MODULO: CORE
// ═══════════════════════════════════════
function limiteCamera(){
  // Limiti per proiezione isometrica
  const s   = G.ISO_SCALE;
  const IW  = G.ISO_W * s, IH = G.ISO_H * s;
  // Estensione della mappa iso in coordinate schermo
  const mapW = (G.COLS + G.RIGHE) * IW / 2;
  const mapH = (G.COLS + G.RIGHE) * IH / 2;
  const pad  = 80;
  G.camX = Math.max(-mapW + pad, Math.min(canvas.width - pad, G.camX));
  G.camY = Math.max(-mapH + pad, Math.min(canvas.height - pad, G.camY));
}

function impostaInput(){
  // Mouse pan
  canvas.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    pan.attivo=true; pan.mosso=false;
    pan.startX=e.clientX; pan.startY=e.clientY;
    pan.camStartX=G.camX; pan.camStartY=G.camY;
    canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
    const lx=mx-G.camX, ly=my-G.camY;
    G.hoverC=Math.floor((lx/IW*2+ly/IH*2)/2-.5);
    G.hoverR=Math.floor((ly/IH*2-lx/IW*2)/2+.5);
    // Sentiero drag-paint
    if(pan.attivo && G.modalitaCostruzione==='sentiero'){
      piazzaSentiero(G.hoverR,G.hoverC); return;
    }
    if(!pan.attivo) return;
    const dx=e.clientX-pan.startX, dy=e.clientY-pan.startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4) pan.mosso=true;
    if(pan.mosso){ G.camX=pan.camStartX+dx; G.camY=pan.camStartY+dy; limiteCamera(); }
  });
  window.addEventListener('mouseup',e=>{
    if(pan.attivo){ pan.attivo=false; canvas.style.cursor=''; sentieroDrag=false; }
  });
  canvas.addEventListener('click',e=>{
    if(pan.mosso) return;
    cliccaMappa(e);
  });
  // Scroll wheel zoom (desktop)
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const zoomDelta=e.deltaY<0?1.1:0.91;
    applicaZoom(zoomDelta, mx, my);
  },{passive:false});

  // ── TOUCH: pan + pinch-to-zoom ──
  let pinch={attivo:false, dist0:0, zoom0:1, midX:0, midY:0, camX0:0, camY0:0};

  function distTocchi(t){ return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }
  function midTocchi(t,rect){ return {x:(t[0].clientX+t[1].clientX)/2-rect.left, y:(t[0].clientY+t[1].clientY)/2-rect.top}; }

  canvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    if(e.touches.length===2){
      // avvia pinch
      pan.attivo=false;
      const rect=canvas.getBoundingClientRect();
      pinch.attivo=true;
      pinch.dist0=distTocchi(e.touches);
      pinch.zoom0=G.zoom;
      const mid=midTocchi(e.touches,rect);
      pinch.midX=mid.x; pinch.midY=mid.y;
      pinch.camX0=G.camX; pinch.camY0=G.camY;
    } else {
      pinch.attivo=false;
      const t=e.touches[0];

      // In modalità costruzione su mobile privilegia il tap
      // evitando che piccoli movimenti blocchino il piazzamento.
      if(G.modalitaCostruzione){
        pan.attivo=false;
        pan.mosso=false;
      }else{
        pan.attivo=true;
        pan.mosso=false;
        pan.startX=t.clientX;
        pan.startY=t.clientY;
        pan.camStartX=G.camX;
        pan.camStartY=G.camY;
      }
    }
  },{passive:false});

  canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(pinch.attivo && e.touches.length===2){
      const rect=canvas.getBoundingClientRect();
      const dist=distTocchi(e.touches);
      const scale=dist/pinch.dist0;
      const newZoom=Math.max(G.ZOOM_MIN, Math.min(G.ZOOM_MAX, pinch.zoom0*scale));
      // zoom centrato sul punto di pinch
      const ratio=newZoom/G.zoom;
      G.camX=pinch.midX-(pinch.midX-pinch.camX0)*ratio;
      G.camY=pinch.midY-(pinch.midY-pinch.camY0)*ratio;
      G.zoom=newZoom;
      limiteCamera();
      // aggiorna punto di partenza continuo per pan durante pinch
      const mid=midTocchi(e.touches,rect);
      const dxPan=mid.x-pinch.midX, dyPan=mid.y-pinch.midY;
      G.camX+=dxPan; G.camY+=dyPan;
      pinch.midX=mid.x; pinch.midY=mid.y;
      pinch.camX0=G.camX; pinch.camY0=G.camY;
      pinch.dist0=dist;
    } else if(pan.attivo && e.touches.length===1){
      const t=e.touches[0];
      const dx=t.clientX-pan.startX, dy=t.clientY-pan.startY;
      const rect=canvas.getBoundingClientRect();
      const _s=G.ISO_SCALE, _IW=G.ISO_W*_s, _IH=G.ISO_H*_s;
      const _lx=(t.clientX-rect.left)-G.camX, _ly=(t.clientY-rect.top)-G.camY;
      G.hoverC=Math.floor((_lx/_IW*2+_ly/_IH*2)/2-.5);
      G.hoverR=Math.floor((_ly/_IH*2-_lx/_IW*2)/2+.5);
      // Sentiero drag-paint su touch
      if(G.modalitaCostruzione==='sentiero'){
        piazzaSentiero(G.hoverR,G.hoverC); return;
      }
      if(Math.abs(dx)>12||Math.abs(dy)>12) pan.mosso=true;
      if(pan.mosso){ G.camX=pan.camStartX+dx; G.camY=pan.camStartY+dy; limiteCamera(); }
    }
  },{passive:false});

  canvas.addEventListener('touchend',e=>{
    if(pinch.attivo && e.touches.length<2){ pinch.attivo=false; }
    if(!pinch.attivo && !pan.mosso && e.changedTouches.length>0){
      const t=e.changedTouches[0];
      const rect=canvas.getBoundingClientRect();
      const _s2=G.ISO_SCALE,_IW2=G.ISO_W*_s2,_IH2=G.ISO_H*_s2;
      const _lx2=(t.clientX-rect.left)-G.camX, _ly2=(t.clientY-rect.top)-G.camY;
      const r=Math.floor((_ly2/_IH2*2-_lx2/_IW2*2)/2+.5);
      const c=Math.floor((_lx2/_IW2*2+_ly2/_IH2*2)/2-.5);
      G.hoverR=r; G.hoverC=c;
      if(G.modalitaCostruzione==='sentiero') piazzaSentiero(r,c);
      else if(G.modalitaCostruzione){ piazzaEdificio(r,c); }
      else{
        // Controlla edificio sul tile
        const b=G.edifici.find(x=>x.r===r&&x.c===c);
        if(b){ if(typeof apriPopupEdificio==='function') apriPopupEdificio(b); return; }
        const tt=(G.mappa[r]!==undefined)?G.mappa[r][c]:undefined;
        if(tt===undefined) return;
        const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
        aggMsg('📍 '+(nomi[tt]||'?'));
      }
    }
    if(e.touches.length===0){ pan.attivo=false; pinch.attivo=false; }
  },{passive:false});

  window.addEventListener('resize', ()=>{ ridimensionaCanvas(); impostaMobile(); });
}

function getTile(e){
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left - G.camX;
  const my = e.clientY - rect.top  - G.camY;
  const s  = G.ISO_SCALE;
  const IW = G.ISO_W * s, IH = G.ISO_H * s;
  // Inverso proiezione iso: (mx,my) → (col,row)
  const col = Math.floor((mx/IW*2 + my/IH*2) / 2 - .5);
  const row = Math.floor((my/IH*2 - mx/IW*2) / 2 + .5);
  return { r:row, c:col };
}
function cliccaMappa(e){
  const{r,c}=getTile(e);
  if(G.modalitaCostruzione==='sentiero'){piazzaSentiero(r,c);return;}
  if(G.modalitaCostruzione){piazzaEdificio(r,c);return;}

  // 1. Edificio sul tile cliccato — priorità massima
  const b=G.edifici.find(x=>x.r===r&&x.c===c);
  if(b){
    if(typeof apriPopupEdificio==='function') apriPopupEdificio(b);
    return;
  }

  // 2. Pirata vicino al punto cliccato (coordinate schermo iso)
  const rect=canvas.getBoundingClientRect();
  const clickX=e.clientX-rect.left;
  const clickY=e.clientY-rect.top;
  const s=G.ISO_SCALE, IW=G.ISO_W*s, IH=G.ISO_H*s;
  for(const p of G.pirati){
    const proj=isoProj(p.mc,p.mr);
    const px=proj.x, py=proj.y+IH/2;
    if(Math.abs(clickX-px)<IW*0.5&&Math.abs(clickY-py)<IH*1.5){
      apriProfiloPirata(p.id);
      return;
    }
  }

  // 3. Info tile
  const t=(G.mappa[r]!==undefined)?G.mappa[r][c]:undefined;
  if(t===undefined) return;
  const nomi={[T.OCEANO]:'Oceano',[T.BASSO]:'Acque Basse',[T.SABBIA]:'Spiaggia',[T.ERBA]:'Prato',[T.FORESTA]:'Foresta',[T.ROCCIA]:'Roccia',[T.COLLINA]:'Collina',[T.FIUME]:'Fiume',[T.SENTIERO]:'Sentiero',[T.PALUDE]:'Palude'};
  aggMsg('📍 '+(nomi[t]||'?'));
}

// ── MODALE ──
function apriModale(titolo,html){
  document.getElementById('titolo-modale').textContent=titolo;
  document.getElementById('corpo-modale').innerHTML=html;
  document.getElementById('overlay-modale').classList.add('aperto');
}
function chiudiModale(){document.getElementById('overlay-modale').classList.remove('aperto');}
document.getElementById('overlay-modale').addEventListener('click',e=>{
  if(e.target===document.getElementById('overlay-modale')) chiudiModale();
});

// ── MESSAGGI & NOTIFICHE ──
function aggMsg(testo,tipo=''){
  const log=document.getElementById('log-msg');
  const d=document.createElement('div');
  d.className='msg'+(tipo?' '+tipo:'');
  d.textContent=testo;
  log.appendChild(d);
  while(log.children.length>4) log.removeChild(log.firstChild);
}
function notifica(titolo,corpo,tipo=''){
  const a=document.getElementById('area-notifiche');
  const d=document.createElement('div');
  d.className='notifica'+(tipo?' '+tipo:'');
  d.innerHTML=`<div class="titolo-notifica">${titolo}</div><div>${corpo}</div>`;
  a.appendChild(d);
  setTimeout(()=>{if(d.parentNode)d.remove();},5000);
}

// ── VELOCITÀ ──
// ── VELOCITÀ — stile Tropico 2: ⏸ Pausa / ▶ Normale / ▶▶ Veloce / ▶▶▶ Max ──
const VELOCITA_LIVELLI = [
  { val:0,   label:'⏸',       title:'Pausa'  },
  { val:1,   label:'▶',       title:'Normale' },
  { val:2.5, label:'▶▶',      title:'Veloce'  },
  { val:6,   label:'▶▶▶',     title:'Max'     },
];
let _velIdx = 1; // parte in Normale

function cambiaVelocita(){
  _velIdx = (_velIdx + 1) % VELOCITA_LIVELLI.length;
  const lv = VELOCITA_LIVELLI[_velIdx];
  G.velocita = lv.val;
  const btn = document.getElementById('btn-velocita');
  if(btn){ btn.textContent = lv.label; btn.title = lv.title; }
  // Musica: mantieni ritmo costante indipendentemente dalla velocità
  if(typeof MUSIC !== 'undefined'){
    if(G.velocita === 0) { /* pausa: musica continua ma il tick si ferma */ }
  }
}

function impostaVelocitaUI(){
  const lv = VELOCITA_LIVELLI[_velIdx];
  const btn = document.getElementById('btn-velocita');
  if(btn){ btn.textContent = lv.label; btn.title = lv.title; }
}

// ── CICLO GIOCO ──
// ═══════════════════════════════════════════════════
// CONDIZIONI VITTORIA / SCONFITTA
// ═══════════════════════════════════════════════════

// Obiettivi vittoria — tutti devono essere soddisfatti

// ── MUSICA ──
function toggleMusica(){
  const on = MUSIC.toggle();
  const btn = document.getElementById('btn-musica');
  if(btn) btn.textContent = on ? '🔊' : '🎵';
}

// Avvia musica al primo click utente (policy browser)
function avviaMusicaAlPrimoClick(){
  if(MUSIC.isRunning()) return;
  MUSIC.start();
  const btn = document.getElementById('btn-musica');
  if(btn) btn.textContent = '🔊';
  document.removeEventListener('click', avviaMusicaAlPrimoClick);
}
// ═══════════════════════════════════════
// MODULO: MAIN
// ═══════════════════════════════════════
const OBIETTIVI_VITTORIA=[
  {
    id:'flotta',
    desc:'Flotta da 4 navi',
    check:()=>G.navi.length>=4,
    progresso:()=>Math.min(G.navi.length,4),
    totale:4,
    fmt:v=>v+'/4 navi',
  },
  {
    id:'oro',
    desc:'1500 oro in cassa',
    check:()=>G.oro>=1500,
    progresso:()=>Math.min(G.oro,1500),
    totale:1500,
    fmt:v=>v+'/1500 oro',
  },
  {
    id:'pirati',
    desc:'Ciurma di 10 pirati',
    check:()=>G.pirati.length>=10,
    progresso:()=>Math.min(G.pirati.length,10),
    totale:10,
    fmt:v=>v+'/10 pirati',
  },
  {
    id:'ricerca',
    desc:'5 tecnologie studiate',
    check:()=>G.ricerca.completate.size>=5,
    progresso:()=>Math.min(G.ricerca.completate.size,5),
    totale:5,
    fmt:v=>v+'/5 tecnologie',
  },
  {
    id:'corsari',
    desc:'Alleanza con i Corsari (rep 60+)',
    check:()=>G.fazioni.corsaro.rep>=60,
    progresso:()=>Math.min(Math.max(0,G.fazioni.corsaro.rep+100),160),
    totale:160,
    fmt:()=>Math.floor(G.fazioni.corsaro.rep)+'/60 rep',
  },
];

// Condizioni sconfitta
const CONDIZIONI_SCONFITTA=[
  {
    id:'bancarotta',
    check:()=>G.oro<=0&&G.pirati.length<=1,
    desc:'Senza oro e senza ciurma',
  },
  {
    id:'deserto',
    check:()=>G.pirati.length===0,
    desc:'Tutta la ciurma ha abbandonato l\'isola',
  },
  {
    id:'fame',
    desc:'Tre giorni di fame e miseria totale',
    check:()=>G.giorniSenzaRisorse>=3,
  },
];

function controllaFineGioco(){
  // aggiorna counter miseria
  if(G.oro<=0&&G.cibo<=0&&G.pirati.length<=2) G.giorniSenzaRisorse++;
  else G.giorniSenzaRisorse=0;

  // check sconfitta
  for(const cond of CONDIZIONI_SCONFITTA){
    if(cond.check()){
      mostraFineGioco(false, cond.desc);
      return;
    }
  }

  // check vittoria — tutti gli obiettivi
  if(OBIETTIVI_VITTORIA.every(ob=>ob.check())){
    mostraFineGioco(true, '');
  }
}

function mostraFineGioco(vittoria, motivoSconfitta){
  G.fineGioco=true;

  const overlay=document.getElementById('overlay-fine');
  const box=document.getElementById('box-fine');
  box.className=vittoria?'vittoria':'sconfitta';

  document.getElementById('fine-banner').textContent=vittoria?'🏆':'💀';
  document.getElementById('fine-titolo').textContent=vittoria
    ?`La Leggenda è Compiuta!`
    :`L'Isola è Perduta`;
  document.getElementById('fine-sottotitolo').textContent=vittoria
    ?"Capitano dei Mari — Giorno "+G.giorno
    :motivoSconfitta+" — Giorno "+G.giorno;

  document.getElementById('fine-testo').textContent=vittoria
    ?`La vostra fama risuona da un capo all'altro dei Caraibi. Mercanti, corsari e persino la Marina mormorano il vostro nome con rispetto e terrore. L'Isla del Diablo è diventata la più temuta fortezza pirata dei sette mari.`
    :"Le fiamme divorano le ultime capanne. La ciurma si è dispersa, l'oro è finito, il rum è secco. L'Isla del Diablo torna al silenzio del mare, aspettando un nuovo capitano abbastanza pazzo da tentare di nuovo.";

  // statistiche
  document.getElementById('fine-statistiche').innerHTML=`
    <div class="stat-fine"><div class="sv">${G.giorno}</div><div class="sk">Giorni Regnati</div></div>
    <div class="stat-fine"><div class="sv">${Math.floor(G.oro)}</div><div class="sk">Oro in Cassa</div></div>
    <div class="stat-fine"><div class="sv">${G.contatori.raid}</div><div class="sk">Raid Effettuati</div></div>
    <div class="stat-fine"><div class="sv">${G.edifici.length}</div><div class="sk">Edifici Costruiti</div></div>
    <div class="stat-fine"><div class="sv">${G.navi.length}</div><div class="sk">Navi in Flotta</div></div>
    <div class="stat-fine"><div class="sv">${G.ricerca.completate.size}</div><div class="sk">Tecnologie</div></div>
  `;

  // obiettivi con progress bar
  let obHtml='<div class="ob-titolo">Obiettivi Vittoria</div>';
  for(const ob of OBIETTIVI_VITTORIA){
    const done=ob.check();
    const pct=Math.min(100,Math.round(ob.progresso()/ob.totale*100));
    obHtml+=`<div class="ob-riga">
      <span class="ob-check">${done?'✅':'⬜'}</span>
      <span style="flex:1;font-size:.78rem">${ob.desc}</span>
      <span style="font-size:.7rem;color:#8a7a60;min-width:70px;text-align:right">${ob.fmt(ob.progresso())}</span>
    </div>
    <div style="padding:0 0 6px 28px"><div class="ob-barra"><div class="ob-riempi" style="width:${pct}%"></div></div></div>`;
  }
  document.getElementById('fine-obiettivi').innerHTML=obHtml;

  document.getElementById('fine-btn').textContent=vittoria?'⚓ Nuova Partita':'🔄 Riprova';
  overlay.classList.add('aperto');
}

function riavviaGioco(){
  location.reload();
}

let ultimoTick=0;
let ultimoFrame=0;

function cicloGioco(ts=0){
  requestAnimationFrame(cicloGioco);

  // Delta time in secondi (cappato a 100ms per evitare salti dopo tab inattiva)
  const dt = Math.min((ts - ultimoFrame) / 1000, 0.1);
  ultimoFrame = ts;

  // Render sempre (anche in pausa, per UI reattiva)
  try{ disegnaScena(dt); }catch(e){ console.error('disegnaScena:',e); }
  try{ tickPortrait();   }catch(e){ console.error('tickPortrait:',e); }

  // Tick giornaliero: si ferma se velocita=0 (pausa)
  if(G.velocita > 0){
    const intervallo = G.tickMs / G.velocita;
    if(ts - ultimoTick >= intervallo){
      ultimoTick = ts;
      try{ tick(); }catch(e){ console.error('tick:',e); }
    }
  }
}
