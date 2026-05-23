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
