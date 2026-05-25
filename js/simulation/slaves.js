// Isla del Diablo — simulation/slaves.js
// Estratto da 09_schiavi.js nella modularizzazione v20.18.

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
