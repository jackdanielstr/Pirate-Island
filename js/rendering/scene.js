// Isla del Diablo — rendering/scene.js
// Estratto da 08_renderer_scene.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_SCENE

function disegnaPerimetriEdificiOccupati(s){
  if(!G.edifici||!G.edifici.length||typeof celleEdificio!=='function'||typeof isoProj!=='function') return;
  const IW=G.ISO_W*s, IH=G.ISO_H*s, hw=IW/2, hh=IH/2;
  ctx.save();
  for(const ed of G.edifici){
    const celle=celleEdificio(ed.tipo,ed.r,ed.c);
    const selected = G.edificioSelezionato===ed || G.edificioSelezionato===ed.id || G.hoverEdificio===ed;

    // Tropico 2 style: niente cornici tecniche attorno agli edifici.
    // L'ingombro deve leggersi tramite prato consumato, terra battuta e ombra naturale.
    // Prima stesura morbida sull'intero footprint.
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const cell of celle){
      if(cell.r<0||cell.c<0||cell.r>=G.RIGHE||cell.c>=G.COLS) continue;
      const p=isoProj(cell.c,cell.r);
      minX=Math.min(minX,p.x-hw); maxX=Math.max(maxX,p.x+hw);
      minY=Math.min(minY,p.y);    maxY=Math.max(maxY,p.y+IH);
    }
    if(!isFinite(minX)) continue;
    const cx=(minX+maxX)/2;
    const cy=(minY+maxY)/2;
    const rx=(maxX-minX)*.52;
    const ry=(maxY-minY)*.36;

    // Ombra/terra battuta sotto l'edificio, molto trasparente.
    const base=ctx.createRadialGradient(cx,cy,Math.max(2,ry*.12),cx,cy,Math.max(rx,ry));
    base.addColorStop(0, selected ? 'rgba(112,92,48,.26)' : 'rgba(90,72,38,.18)');
    base.addColorStop(.62, selected ? 'rgba(82,92,46,.18)' : 'rgba(54,84,42,.12)');
    base.addColorStop(1,'rgba(36,70,36,0)');
    ctx.fillStyle=base;
    ctx.beginPath();
    ctx.ellipse(cx,cy+IH*.08,rx,ry,0,0,Math.PI*2);
    ctx.fill();

    // Ogni tile occupato riceve una velatura naturale, ma senza linee nere/gialle.
    for(const cell of celle){
      if(cell.r<0||cell.c<0||cell.r>=G.RIGHE||cell.c>=G.COLS) continue;
      const p=isoProj(cell.c,cell.r);
      const seed=((cell.r*928371+cell.c*689287+(ed.tipo||'').length*97)>>>0);
      const worn=(seed%100)/100;
      ctx.beginPath();
      ctx.moveTo(p.x,p.y+IH*.04);
      ctx.lineTo(p.x+hw*.94,p.y+hh);
      ctx.lineTo(p.x,p.y+IH*.96);
      ctx.lineTo(p.x-hw*.94,p.y+hh);
      ctx.closePath();
      ctx.fillStyle = worn>.55 ? 'rgba(103,83,43,.105)' : 'rgba(58,96,45,.085)';
      ctx.fill();

      // Piccole macchie d'erba ai bordi: più prato, meno griglia.
      for(let i=0;i<3;i++){
        const a=((seed+i*137)%360)*Math.PI/180;
        const ox=Math.cos(a)*hw*(.42+((seed>>i)&3)*.05);
        const oy=Math.sin(a)*hh*(.40+((seed>>(i+3))&3)*.04)+hh;
        ctx.fillStyle=i%2?'rgba(42,96,38,.28)':'rgba(86,96,42,.18)';
        ctx.beginPath();
        ctx.ellipse(p.x+ox,p.y+oy,Math.max(1.5,hw*.055),Math.max(1,hh*.045),a*.4,0,Math.PI*2);
        ctx.fill();
      }
    }

    // Selezione: nessun contorno nero. Solo una lieve schiarita del prato sotto l'edificio.
    if(selected){
      ctx.fillStyle='rgba(238,214,140,.10)';
      ctx.beginPath();
      ctx.ellipse(cx,cy+IH*.08,rx*.96,ry*.88,0,0,Math.PI*2);
      ctx.fill();
    }
  }
  ctx.restore();
}


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
  const dtMovimento = dt * (typeof scalaMovimentoMondo==='function' ? scalaMovimentoMondo() : (G.velocita||0));

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
  if(typeof disegnaVelatureTerreno==='function') disegnaVelatureTerreno();
  disegnaTransizioni();

  // ── 2b. Perimetro e footprint tile occupati dagli edifici ──
  // Sempre visibile, così si distingue l'ingombro reale dal disegno alto dell'edificio.
  if(typeof disegnaPerimetriEdificiOccupati==='function') disegnaPerimetriEdificiOccupati(s);

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
  // Props ambiente vivo: coste, sentieri, vegetazione bassa e clutter vicino agli edifici
  if(typeof assicuraAmbienteVivo==='function') assicuraAmbienteVivo();
  for (const ap of (G.ambienteProps||[])){
    const p = isoProj(ap.c, ap.r);
    oggetti.push({ depth: ap.r*2+ap.c*2+(ap.z||0.2), tipo:'ambienteProp', data:ap, px:p.x, py:p.y });
  }

  // Props porto vivo / clutter scenico
  if(typeof assicuraPortoVivo==='function') assicuraPortoVivo();
  for (const pr of (G.portoProps||[])){
    const p = isoProj(pr.c, pr.r);
    oggetti.push({ depth: pr.r*2+pr.c*2+0.85, tipo:'portoProp', data:pr, px:p.x, py:p.y });
  }

  // Edifici (depth +1 per stare sopra alberi dello stesso tile)
  for (const b of G.edifici){
    const fp=(typeof ingombroEdificio==='function') ? ingombroEdificio(b.tipo) : {w:1,h:1};
    const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(b) : {r:b.r,c:b.c};
    const p = isoProj(centro.c, centro.r);
    oggetti.push({ depth: (b.r+fp.h-1)*2+(b.c+fp.w-1)*2+1, tipo:'edificio', data:b, px:p.x, py:p.y, fp });
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
      case 'ambienteProp':
        if(typeof disegnaPropAmbiente==='function') disegnaPropAmbiente(data, cx, cy, s); break;
      case 'portoProp':
        if(typeof disegnaPropPorto==='function') disegnaPropPorto(data, cx, cy, s); break;
      case 'edificio':
        // In modalità sentiero gli edifici alti possono coprire il tile dietro.
        // Li rendiamo semi-trasparenti solo durante la costruzione strade per rendere visibile
        // anteprima e piazzamento senza cambiare il gameplay normale.
        if(G.modalitaCostruzione==='sentiero'){
          ctx.save();
          ctx.globalAlpha = 0.58;
          disegnaEdificio(data.tipo, cx, cy, s, obj.fp);
          ctx.restore();
        }else{
          disegnaEdificio(data.tipo, cx, cy, s, obj.fp);
        }
        break;
      case 'pirata':
        disegnaPirataIso(cx,cy,G.pirataSelezionato===data.id,data.umore,data.ruolo,s);
        if(!G.battagliaAttiva) muoviPirata(data,dtMovimento);
        break;
      case 'schiavo':
        if(typeof disegnaSchiavoIso==='function') disegnaSchiavoIso(cx,cy,data.felicita,s,data,G.schiavoSelezionato===data.id);
        break;
      case 'poi':
        disegnaPOI(data, cx, cy, s); break;
    }
  }

  // ── 6. Navi: vedi disegnaNaviMare() ──

  // ── 7. Hover / anteprima costruzione ──
  if (G.modalitaCostruzione && G.hoverC>=0 && G.hoverR>=0){
    const p = isoProj(G.hoverC, G.hoverR);
    const cx = p.x, cy = p.y;
    const hw = IW/2, hh = IH/2;
    const isRoad = G.modalitaCostruzione === 'sentiero';
    let ok = false;
    let cellePreview=[{r:G.hoverR,c:G.hoverC}];
    let originePreview={r:G.hoverR,c:G.hoverC};
    if(isRoad){
      const rr=G.hoverR, cc=G.hoverC;
      ok = (typeof tileValidoPerSentiero==='function' ? tileValidoPerSentiero(rr,cc) : false) && G.oro>=2;
    }else{
      const statoPreview=(typeof statoCostruzioneEdificio==='function')
        ? statoCostruzioneEdificio(G.hoverR, G.hoverC, G.modalitaCostruzione)
        : {ok:puoCostruire(G.hoverR, G.hoverC),motivo:'ok'};
      ok = !!statoPreview.ok;
      originePreview=statoPreview.origine || ((typeof origineEdificioDaCentro==='function')
        ? origineEdificioDaCentro(G.modalitaCostruzione,G.hoverR,G.hoverC)
        : {r:G.hoverR,c:G.hoverC});
      cellePreview=statoPreview.celle || ((typeof celleEdificio==='function')
        ? celleEdificio(G.modalitaCostruzione,originePreview.r,originePreview.c)
        : [{r:G.hoverR,c:G.hoverC}]);
      G.previewCostruzioneMotivo = statoPreview.motivo || 'ok';
    }
    const mancaSentiero=!isRoad && G.previewCostruzioneMotivo==='manca-sentiero';
    const sopraSentiero=!isRoad && G.previewCostruzioneMotivo==='sopra-sentiero';
    ctx.fillStyle   = ok ? 'rgba(80,220,80,.28)' : (mancaSentiero ? 'rgba(255,170,40,.30)' : (sopraSentiero ? 'rgba(220,60,60,.34)' : 'rgba(220,60,60,.28)'));
    ctx.strokeStyle = ok ? '#4f4' : (mancaSentiero ? '#ffaa28' : (sopraSentiero ? '#ff3030' : '#f44'));
    ctx.lineWidth   = 1.5;
    for(const cell of cellePreview){
      if(cell.r<0||cell.c<0||cell.r>=G.RIGHE||cell.c>=G.COLS) continue;
      const pp=isoProj(cell.c,cell.r);
      const pcx=pp.x, pcy=pp.y;
      ctx.beginPath();
      ctx.moveTo(pcx, pcy); ctx.lineTo(pcx+hw, pcy+hh);
      ctx.lineTo(pcx, pcy+IH); ctx.lineTo(pcx-hw, pcy+hh);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (mancaSentiero || sopraSentiero){
      const pp=isoProj(G.hoverC,G.hoverR);
      const label=mancaSentiero ? 'Serve sentiero' : 'Non sopra sentiero';
      ctx.save();
      ctx.font=Math.max(10,12*s)+'px Georgia, serif';
      ctx.textAlign='center';
      ctx.lineWidth=3;
      ctx.strokeStyle='rgba(55,32,12,.85)';
      ctx.fillStyle=mancaSentiero ? '#ffd37a' : '#ffb0a0';
      ctx.strokeText(label,pp.x,pp.y-IH*s*.35);
      ctx.fillText(label,pp.x,pp.y-IH*s*.35);
      ctx.restore();
    }
    if (ok && !isRoad){
      ctx.globalAlpha = .45;
      const preview={tipo:G.modalitaCostruzione,r:originePreview.r,c:originePreview.c};
      const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(preview) : preview;
      const pp=isoProj(centro.c,centro.r);
      const fp=(typeof ingombroEdificio==='function') ? ingombroEdificio(G.modalitaCostruzione) : {w:1,h:1};
      disegnaEdificio(G.modalitaCostruzione, pp.x, pp.y+hh, s, fp);
      ctx.globalAlpha = 1;
    }
    if(ok && isRoad){
      ctx.strokeStyle='rgba(240,192,64,.9)';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(cx-hw*.35, cy+hh);
      ctx.lineTo(cx+hw*.35, cy+hh);
      ctx.stroke();
    }
  }


  // ── 7a. Movimento schiavi (una volta per frame) ──
  if(typeof muoviSchiavi==="function") muoviSchiavi(dtMovimento);
  // ── 7b. Indicatori edifici ──
  if(typeof disegnaIndicatoriEdifici==="function") disegnaIndicatoriEdifici(s);
  // ── 7c. Navi animate ──
  if(typeof disegnaNaviMare==="function") disegnaNaviMare(s);
  // ── 7d. Atmosfera Tropico 2: fumo, luci, gabbiani, schiuma portuale ──
  if(typeof disegnaAtmosferaTropico==="function") disegnaAtmosferaTropico(s);

  // ── 8. Ombra globale drammatica (sole NW a ~45°) ──
  // Disegnata come ellisse allungata verso SE per ogni oggetto alto
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#506040';
  const shadowAlts = {fortezza:.55,guardia:.65,osservatorio:.6,cantiere:.3,cappella:.5,caserma:.38,taverna:.42,cantastorie:.48};
  ctx.globalAlpha = .12;
  for (const b of G.edifici){
    const fp=(typeof ingombroEdificio==='function') ? ingombroEdificio(b.tipo) : {w:1,h:1};
    const centro=(typeof centroEdificioGriglia==='function') ? centroEdificioGriglia(b) : {r:b.r,c:b.c};
    const p = isoProj(centro.c, centro.r);
    const bx = p.x, by = p.y + IH/2;
    const scalaIngombro=Math.min(1.24,1+(Math.max(fp.w||1,fp.h||1)-1)*0.13);
    const altH = (shadowAlts[b.tipo]||.28) * G.ISO_H * s * 1.55 * scalaIngombro;
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

  // ── 9. Vignetta caraibica + lieve calore tropicale ──
  const sunWash = ctx.createLinearGradient(0,0,0,canvas.height);
  sunWash.addColorStop(0,'rgba(255,224,156,.06)');
  sunWash.addColorStop(.38,'rgba(255,208,128,.018)');
  sunWash.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = sunWash;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const vign = ctx.createRadialGradient(canvas.width*.5,canvas.height*.35,canvas.width*.22,canvas.width*.5,canvas.height*.5,canvas.width*.75);
  vign.addColorStop(0,'rgba(255,220,120,0)');
  vign.addColorStop(.6,'rgba(255,180,60,.03)');
  vign.addColorStop(1,'rgba(20,5,0,.24)');
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


// PORTO_VIVO_FASE4A
(function(){
 const oldDrawBuilding = window.drawBuilding || window.disegnaEdificio;
})();
