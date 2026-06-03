// Isla del Diablo — core/startup.js
// Estratto da 11_avvio_gioco.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: AVVIO_GIOCO
// ═══════════════════════════════════════
// ── AVVIO GIOCO, PIRATI, CAPITANI ──
function avviaGioco(){
  // La partita parte già con la plancia costruzione in basso, stile Tropico 2.
  // Evita il flash iniziale del vecchio pannello laterale destro.
  document.body.classList.add('tab-costruisci');
  if(window.G) G.tabCorrente='costruisci';
  document.getElementById('schermata-titolo').style.display='none';
  if(window.startHarborLedger) window.startHarborLedger();
  document.getElementById('barra-sup').style.display='flex';
  document.getElementById('principale').style.display='flex';
  document.getElementById('barra-inf').style.display='flex';
  canvas = document.getElementById('mappa-canvas');
  ctx = canvas.getContext('2d');
  generaMappa();
  inizializzaScenarioTropico2();
  ridimensionaCanvas();
  window.addEventListener('orientationchange',()=>setTimeout(()=>{ridimensionaCanvas();impostaMobile();},100));
  const ruoliIniziali=['Nostromo','Cannoniere','Navigatore','Bucaniere','Cuoco','Spia','Quartier Mastro','Bucaniere'];
  const totIniziale=G.bilanciamento?.piratiIniziali||8;
  for(let i=0;i<totIniziale;i++){
    const p=creaaPirata({
      ruolo:ruoliIniziali[i%ruoliIniziali.length],
      umore:58+Math.floor(Math.random()*24),
      paga:i<2?3:4,
    });
    if(i===0){
      p.nome='Mateo il Vecchio';
      p.ruolo='Nostromo';
      p.combattimento=Math.max(p.combattimento,62);
      p.navigazione=Math.max(p.navigazione,66);
      p.tratto={id:'veterano_cala',label:'Veterano della Cala',icona:'⚓'};
    }
    if(G._spawnScenario){
      const ang=(Math.PI*2/totIniziale)*i + Math.random()*.45;
      const rad=.7+Math.random()*1.4;
      p.mr=G._spawnScenario.r+Math.sin(ang)*rad*.8;
      p.mc=G._spawnScenario.c+Math.cos(ang)*rad;
    }
  }
  G.navi.push(creaNave(0,'La Marea Maledetta'));
  if(typeof assicuraCapitaniFlotta==='function') assicuraCapitaniFlotta();
  if(typeof rigeneraPortoVivo==='function') rigeneraPortoVivo();
  assegnaMissioni();
  impostaInput();
  impostaMobile();
  notifica('⚓ Benvenuto, Governatore Pirata!','La cala parte con una vera ciurma, scorte iniziali e una nave pronta a salpare.');
  aggiornaUI();
  // Secondo resize dopo il primo render della UI: la mappa calcola subito
  // lo spazio sopra la barra costruzione, senza scatti visivi.
  requestAnimationFrame(()=>{ridimensionaCanvas(); if(typeof disegna==='function') disegna();});
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
    eta: override.eta || (24+Math.floor(Math.random()*23)),
    combattimento:override.combattimento||(20+Math.floor(Math.random()*60)),
    navigazione:override.navigazione||(20+Math.floor(Math.random()*60)),
    umore:override.umore||(40+Math.floor(Math.random()*40)),
    mc:override.mc ?? (cx-2+Math.random()*4),
    mr:override.mr ?? (cy-2+Math.random()*4),
    naveId:null, paga:override.paga||4,
    tratto:override.tratto||tratto,
    oggetto:override.oggetto||null,  // {id, nome, icona, bonus}
    bisogni:override.bisogni||{
      cibo:60+Math.random()*25,
      grog:55+Math.random()*25,
      gioco:45+Math.random()*25,
      compagnia:40+Math.random()*25,
      riposo:50+Math.random()*25,
      bottino:35+Math.random()*25,
      difesa:45+Math.random()*25,
      anarchia:45+Math.random()*25,
    },
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
  const adiacenti=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dr,dc])=>({r:ed.r+dr,c:ed.c+dc}));
  for(const cell of adiacenti){
    const r=cell.r,c=cell.c;
    if(r<0||c<0||r>=G.RIGHE||c>=G.COLS) continue;
    const occupato=(typeof edificioInTile==='function') ? edificioInTile(r,c) : G.edifici.some(b=>b.r===r&&b.c===c);
    if(occupato) continue;
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
  const celle=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dr,dc])=>({r:ed.r+dr,c:ed.c+dc}));
  for(const cell of celle){
    const r=cell.r,c=cell.c;
    if(isTileSentiero(r,c)) return {r,c};
  }
  return null;
}
function accessiSentieroEdificio(ed){
  const out=[];
  const celle=(typeof anelloEdificio==='function')
    ? anelloEdificio(ed)
    : [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dr,dc])=>({r:ed.r+dr,c:ed.c+dc}));
  for(const cell of celle){
    const r=cell.r,c=cell.c;
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
    const next=poss.find(p=>isTileTerraStrada(p.r,p.c) && !(typeof edificioInTile==='function' ? edificioInTile(p.r,p.c) : G.edifici.some(e=>e.r===p.r&&e.c===p.c)));
    if(!next) break;
    r=next.r; c=next.c;
  }
}

// ═══════════════════════════════════════════════════
// COSTRUZIONE
// ═══════════════════════════════════════════════════
