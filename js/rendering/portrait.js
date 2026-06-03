// Isla del Diablo — rendering/portrait.js
// Estratto da 27_portrait.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: PORTRAIT
// ═══════════════════════════════════════
let _portraitPirataId=null;
const pCtx=()=>document.getElementById('portrait-canvas').getContext('2d');

function descriviStatoPirata(p){
  if(!p) return 'In attesa';
  if(p.inRaid || p._stato==='in_raid') return 'In mare per un raid';
  if(p._stato==='raduno_raid') return 'Si sta radunando al molo';
  if(p._stato==='cammina'){
    const ed=p._destEdificio || (p.dest?G.edifici.find(b=>b.r===p.dest.r&&b.c===p.dest.c):null);
    if(ed && ED[ed.tipo]) return 'Sta andando a '+ED[ed.tipo].nome;
    return 'Sta percorrendo i sentieri';
  }
  if(p._stato==='pausa'){
    const ed=p._destEdificio || (p.dest?G.edifici.find(b=>b.r===p.dest.r&&b.c===p.dest.c):null);
    if(ed && ED[ed.tipo]) return 'Si ferma presso '+ED[ed.tipo].nome;
    return 'Sta riposando';
  }
  if(p.naveId!=null){
    const nave=(G.navi||[]).find(n=>String(n.id)===String(p.naveId));
    if(nave) return 'Assegnato alla nave '+nave.nome;
  }
  return 'In giro per la cala';
}

function riassuntoBisogniPirata(p){
  const labels={cibo:'Grub',grog:'Grog',gioco:'Scommesse',compagnia:'Compagnia',riposo:'Riposo',bottino:'Bottino',difesa:'Difesa',anarchia:'Anarchia'};
  const b=p&&p.bisogni?p.bisogni:{};
  const arr=Object.keys(labels).map(k=>({k,v:Math.round(b[k]??50),label:labels[k]})).sort((a,b)=>a.v-b.v);
  return arr.slice(0,3).map(x=>`${x.label} ${x.v}%`).join(' · ');
}

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
  document.getElementById('ph-ruolo').textContent=p.ruolo+(p.titolo?' · '+p.titolo:'')+(p.eta?' · '+p.eta+' anni':'');

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
  document.getElementById('ph-umore-text').textContent='"'+arr[p.id%arr.length]+'" · '+riassuntoBisogniPirata(p);

  // Destinazione
  const dest=p.dest?G.edifici.find(b=>b.r===p.dest.r&&b.c===p.dest.c):null;
  document.getElementById('ph-dest').textContent='📍 '+descriviStatoPirata(p);

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
