// Isla del Diablo — audio/music.js
// v20.39 — Musica procedurale più vicina al feeling Tropico 2:
// loop caraibico/piratesco leggero, taverna + porto, meno aggressivo e meno caotico.

window.FASE1 = window.FASE1 || { merci: [], raidAttivi: [] };

const MUSIC = (() => {
  let ctx = null;
  let masterGain = null;
  let musicBus = null;
  let percBus = null;
  let running = false;
  let schedulerTimer = null;
  let startTime = 0;
  let currentBar = 0;
  let volume = 0.38;
  let mood = 'isola'; // isola | raid | quiete

  // Tempo più rilassato: Tropico 2 aveva un feel caraibico leggero, non battaglia continua.
  const BPM = 104;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const LOOKAHEAD = 0.22;
  const SCHEDULE_MS = 70;

  // Scala A minore naturale / C maggiore, più solare della vecchia armonica cupa.
  const N = {
    A2:110, C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196,
    A3:220, B3:246.94, C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392,
    A4:440, B4:493.88, C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99,
    A5:880
  };

  const CH = {
    Am: [N.A3, N.C4, N.E4, N.A4],
    C:  [N.C3, N.E4, N.G4, N.C5],
    G:  [N.G3, N.B3, N.D4, N.G4],
    F:  [N.F3, N.A3, N.C4, N.F4],
    Dm: [N.D3, N.F3, N.A3, N.D4],
    E:  [N.E3, N.B3, N.E4, N.G4]
  };

  const PROGRESSION = ['Am','C','G','Am','F','C','Dm','E'];

  function init(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Bus separati per tenere le percussioni più basse e meno fastidiose.
    musicBus = ctx.createGain();
    percBus = ctx.createGain();
    musicBus.gain.value = 0.82;
    percBus.gain.value = 0.55;
    musicBus.connect(masterGain);
    percBus.connect(masterGain);
  }

  function safeStop(node, t){
    try { node.stop(t); } catch(e) { /* oscillator/buffer già fermo */ }
  }

  function envGain(out, time, dur, peak, attack=0.01, release=0.08){
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + attack);
    g.gain.setValueAtTime(peak * 0.75, Math.max(time + attack, time + dur - release));
    g.gain.linearRampToValueAtTime(0.0001, time + dur);
    g.connect(out);
    return g;
  }

  // Chitarra/tres: pizzicato caldo, non saw aggressivo.
  function playTres(freq, time, dur, gainVal=0.075){
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(musicBus, time, dur, gainVal, 0.006, 0.12);

    osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'sine';     osc2.frequency.setValueAtTime(freq * 2.01, time);
    osc3.type = 'triangle'; osc3.frequency.setValueAtTime(freq * 0.997, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.frequency.exponentialRampToValueAtTime(850, time + dur * 0.75);
    filter.Q.value = 0.45;

    osc1.connect(filter); osc2.connect(filter); osc3.connect(filter);
    filter.connect(gain);
    osc1.start(time); osc2.start(time); osc3.start(time);
    safeStop(osc1, time + dur + 0.05); safeStop(osc2, time + dur + 0.05); safeStop(osc3, time + dur + 0.05);
  }

  // Marimba / steel-pan morbido: dà colore tropicale senza sembrare midi-metallico.
  function playMarimba(freq, time, dur, gainVal=0.085){
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(musicBus, time, dur, gainVal, 0.004, dur * 0.45);

    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, time);
    osc2.type = 'triangle'; osc2.frequency.setValueAtTime(freq * 3.01, time);
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(freq * 2.2, time); filter.Q.value = 1.1;

    osc.connect(gain);
    osc2.connect(filter); filter.connect(gain);
    osc.start(time); osc2.start(time);
    safeStop(osc, time + dur + 0.05); safeStop(osc2, time + dur + 0.05);
  }

  // Fisarmonica discreta: solo frasi brevi, meno invadente.
  function playAccordion(freq, time, dur, gainVal=0.045){
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(musicBus, time, dur, gainVal, 0.05, 0.16);

    osc.type = 'square'; osc.frequency.setValueAtTime(freq, time);
    lfo.type = 'sine'; lfo.frequency.value = 5.2;
    lfoG.gain.value = freq * 0.004;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);

    filter.type = 'lowpass'; filter.frequency.value = 1350; filter.Q.value = 0.7;
    osc.connect(filter); filter.connect(gain);
    lfo.start(time); osc.start(time);
    safeStop(lfo, time + dur + 0.05); safeStop(osc, time + dur + 0.05);
  }

  function playBass(freq, time, dur, gainVal=0.16){
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(musicBus, time, dur, gainVal, 0.012, 0.12);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass'; filter.frequency.value = 260;
    osc.connect(filter); filter.connect(gain);
    osc.start(time); safeStop(osc, time + dur + 0.05);
  }

  function noiseBuffer(seconds){
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.2);
    return buf;
  }

  function playShaker(time, gainVal=0.022){
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(percBus, time, 0.045, gainVal, 0.002, 0.035);
    src.buffer = noiseBuffer(0.05);
    filter.type = 'highpass'; filter.frequency.value = 5200;
    src.connect(filter); filter.connect(gain);
    src.start(time); safeStop(src, time + 0.06);
  }

  function playClaves(time, gainVal=0.04){
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(percBus, time, 0.055, gainVal, 0.001, 0.045);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(1850, time);
    filter.type = 'bandpass'; filter.frequency.value = 1900; filter.Q.value = 5;
    osc.connect(filter); filter.connect(gain);
    osc.start(time); safeStop(osc, time + 0.06);
  }

  function playConga(time, accent=false){
    const osc = ctx.createOscillator();
    const n = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = envGain(percBus, time, 0.15, accent ? 0.085 : 0.055, 0.003, 0.12);
    const ng = envGain(percBus, time, 0.06, accent ? 0.018 : 0.011, 0.002, 0.05);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 165 : 125, time);
    osc.frequency.exponentialRampToValueAtTime(accent ? 80 : 65, time + 0.12);
    n.buffer = noiseBuffer(0.07);
    filter.type = 'bandpass'; filter.frequency.value = 520; filter.Q.value = 2.2;

    osc.connect(gain);
    n.connect(filter); filter.connect(ng);
    osc.start(time); n.start(time);
    safeStop(osc, time + 0.18); safeStop(n, time + 0.08);
  }

  function scheduleRhythm(barTime, barIndex){
    // Shaker più morbido e regolare.
    for(let i=0;i<8;i++) playShaker(barTime + i * BEAT * 0.5, i % 2 ? 0.018 : 0.024);

    // Habanera/son leggero: non marcia da battaglia.
    playConga(barTime + 0 * BEAT, true);
    playConga(barTime + 1.5 * BEAT, false);
    playConga(barTime + 2.25 * BEAT, true);
    playConga(barTime + 3.25 * BEAT, false);

    // Clave 3-2 alternata, molto bassa.
    const claveA = [0, 1.5, 2.75];
    const claveB = [1, 2.5];
    const pattern = barIndex % 2 === 0 ? claveA : claveB;
    pattern.forEach(b => playClaves(barTime + b * BEAT));
  }

  function scheduleGuitar(chord, barTime){
    const pattern = [
      [0.00,0,0.22], [0.50,2,0.16], [1.00,1,0.22], [1.50,3,0.15],
      [2.00,0,0.20], [2.50,2,0.16], [3.00,1,0.24], [3.50,3,0.15],
    ];
    pattern.forEach(([beat, idx, dur]) => playTres(chord[idx % chord.length], barTime + beat * BEAT, dur * BEAT));
  }

  function scheduleBass(chordName, barTime){
    const roots = {Am:N.A2, C:N.C3, G:N.G3, F:N.F3, Dm:N.D3, E:N.E3};
    const fifths = {Am:N.E3, C:N.G3, G:N.D3, F:N.C3, Dm:N.A2, E:N.B3};
    const root = roots[chordName] || N.A2;
    const fifth = fifths[chordName] || N.E3;
    playBass(root,  barTime + 0 * BEAT, 0.82 * BEAT);
    playBass(fifth, barTime + 2 * BEAT, 0.62 * BEAT, 0.125);
    if(mood === 'raid') playBass(root, barTime + 3.25 * BEAT, 0.35 * BEAT, 0.105);
  }

  function scheduleMarimba(chord, barTime, barIndex){
    // Piccole risposte melodiche, non sempre uguali.
    const variants = [
      [[0.75,2],[1.25,3],[2.75,1],[3.25,2]],
      [[0.50,1],[1.75,2],[2.50,3],[3.50,2]],
      [[1.00,3],[1.50,2],[2.25,1],[3.00,0]],
      [[0.75,1],[2.00,2],[2.50,3],[3.25,2]],
    ];
    variants[barIndex % variants.length].forEach(([beat, idx]) => {
      playMarimba(chord[idx % chord.length] * 2, barTime + beat * BEAT, 0.18 * BEAT);
    });
  }

  function scheduleMelody(barTime, barIndex){
    // Frase ogni 4 battute, più memorabile ma non copiata.
    if(barIndex % 4 === 2){
      [[0,N.E5,.5],[.75,N.D5,.25],[1.25,N.C5,.45],[2,N.A4,.5],[3,N.C5,.55]]
        .forEach(([b,f,d]) => playAccordion(f, barTime + b * BEAT, d * BEAT));
    } else if(barIndex % 8 === 7){
      [[0,N.D5,.35],[.5,N.E5,.35],[1,N.C5,.5],[2,N.B4,.35],[2.5,N.A4,.8]]
        .forEach(([b,f,d]) => playAccordion(f, barTime + b * BEAT, d * BEAT, 0.052));
    }
  }

  function scheduleBar(barIndex, barTime){
    const chordName = PROGRESSION[barIndex % PROGRESSION.length];
    const chord = CH[chordName];

    scheduleRhythm(barTime, barIndex);
    scheduleBass(chordName, barTime);
    scheduleGuitar(chord, barTime);
    scheduleMarimba(chord, barTime, barIndex);
    scheduleMelody(barTime, barIndex);
  }

  function scheduler(){
    if(!running || !ctx) return;
    const until = ctx.currentTime + LOOKAHEAD;
    while(startTime + currentBar * BAR < until){
      scheduleBar(currentBar, startTime + currentBar * BAR);
      currentBar++;
    }
    schedulerTimer = setTimeout(scheduler, SCHEDULE_MS);
  }

  function start(){
    if(running) return;
    init();
    if(ctx.state === 'suspended') ctx.resume();
    running = true;
    currentBar = 0;
    startTime = ctx.currentTime + 0.08;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.8);
    scheduler();
  }

  function stop(){
    if(!running) return;
    running = false;
    clearTimeout(schedulerTimer);
    if(masterGain && ctx){
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    }
  }

  function setVolume(v){
    volume = Math.max(0, Math.min(1, v));
    if(masterGain && ctx){
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(running ? volume : 0.0001, ctx.currentTime + 0.25);
    }
  }

  function setMood(nextMood){
    mood = nextMood || 'isola';
    if(percBus && ctx){
      // Raid appena più ritmico, isola più rilassata.
      const target = mood === 'raid' ? 0.72 : mood === 'quiete' ? 0.42 : 0.55;
      percBus.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.5);
    }
  }

  function toggle(){
    running ? stop() : start();
    return running;
  }

  function isRunning(){ return running; }

  return { start, stop, toggle, setVolume, setMood, isRunning };
})();
