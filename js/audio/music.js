// Isla del Diablo — audio/music.js
// Estratto da 00_music.js nella modularizzazione v20.18.

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
