// Isla del Diablo — audio/music_integration.js
// Fix musica asset: usa il file reale "Harbor Ledger.mp3" e disattiva
// l'avvio automatico della musica procedurale quando esiste la soundtrack asset.

(function(){
  const TRACKS = [
    'assets/audio/music/Harbor Ledger.mp3',
    'assets/audio/music/Harbor%20Ledger.mp3',
    'assets/audio/music/HarborLedger.mp3'
  ];

  function setMusicButton(on){
    const btn=document.getElementById('btn-musica');
    if(btn) btn.textContent = on ? '🔊' : '🔇';
  }

  function stopProceduralMusic(){
    try{
      if(window.MUSIC && typeof MUSIC.isRunning==='function' && MUSIC.isRunning()){
        MUSIC.stop();
      }
    }catch(e){}
  }

  function createAssetAudio(){
    const a=new Audio();
    a.loop=true;
    a.volume=0.40;
    a.preload='auto';
    a.dataset.trackIndex='0';
    a.src=TRACKS[0];

    a.addEventListener('error',()=>{
      const idx=parseInt(a.dataset.trackIndex||'0',10);
      const next=idx+1;
      if(next<TRACKS.length){
        a.dataset.trackIndex=String(next);
        a.src=TRACKS[next];
        a.load();
        if(window._harborLedgerWanted) a.play().catch(()=>{});
      }else{
        console.warn('[Isla del Diablo] Musica non trovata. Controlla assets/audio/music/Harbor Ledger.mp3');
      }
    });

    return a;
  }

  window.startHarborLedger=function(){
    window._harborLedgerWanted=true;
    stopProceduralMusic();

    if(!window.HarborLedger){
      window.HarborLedger=createAssetAudio();
    }

    const a=window.HarborLedger;
    a.volume = typeof window._harborLedgerVolume==='number' ? window._harborLedgerVolume : 0.40;

    // Avvio dopo click "Salpa": consentito dalla policy browser.
    return a.play()
      .then(()=>{ window._harborLedgerStarted=true; setMusicButton(true); })
      .catch(err=>{
        console.warn('[Isla del Diablo] Musica bloccata o non caricata:', err);
        setMusicButton(false);
      });
  };

  window.stopHarborLedger=function(){
    window._harborLedgerWanted=false;
    if(window.HarborLedger){
      window.HarborLedger.pause();
      window.HarborLedger.currentTime=0;
    }
    window._harborLedgerStarted=false;
    setMusicButton(false);
  };

  // Sovrascrive il vecchio toggle procedurale: il pulsante ora controlla Harbor Ledger.
  window.toggleMusica=function(){
    stopProceduralMusic();

    if(!window.HarborLedger){
      window.HarborLedger=createAssetAudio();
    }

    const a=window.HarborLedger;
    if(!a.paused){
      a.pause();
      window._harborLedgerWanted=false;
      window._harborLedgerStarted=false;
      setMusicButton(false);
      return false;
    }

    window._harborLedgerWanted=true;
    a.play()
      .then(()=>{ window._harborLedgerStarted=true; setMusicButton(true); })
      .catch(err=>{
        console.warn('[Isla del Diablo] Impossibile avviare la musica:', err);
        setMusicButton(false);
      });
    return true;
  };

  // Evita che il primo click successivo faccia partire la musica procedurale.
  window.avviaMusicaAlPrimoClick=function(){
    if(window.startHarborLedger) window.startHarborLedger();
  };
})();
