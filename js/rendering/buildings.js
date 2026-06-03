// Isla del Diablo — rendering/buildings.js
// Estratto da 06_renderer_buildings.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_BUILDINGS
// ═══════════════════════════════════════
// ── disegna edificio — isometrico stile Tropico 2 ──
// cx,cy = centro dell'impronta iso (da isoProj), s = ISO_SCALE
function isoFootprintEdificio(cx,cy,fp,s,tipo){
  const iw=G.ISO_W*s, ih=G.ISO_H*s;
  const w=Math.max(1,fp?.w||1), h=Math.max(1,fp?.h||1);
  const nautica=tipo==='porto'||tipo==='cantiere'||tipo==='shipyard';
  const pietra=['governatore','fortezza','prigione','cappella','infermeria','guardia','caserma','osservatorio'].includes(tipo);
  ctx.save();
  ctx.globalAlpha=nautica ? .55 : (pietra ? .26 : .18);
  ctx.fillStyle=nautica?'rgba(86,58,28,.75)':pietra?'rgba(130,112,82,.58)':'rgba(92,76,42,.52)';
  ctx.beginPath();
  ctx.ellipse(cx,cy+ih*.1,iw*(.26+.18*w),ih*(.18+.1*h),0,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha=nautica ? .38 : .16;
  for(let i=0;i<6;i++){
    const a=((i*97)%360)*Math.PI/180;
    const rx=iw*(.11+((i*13)%7)*.018);
    const ry=ih*(.06+((i*17)%5)*.012);
    ctx.fillStyle=nautica?'rgba(60,38,18,.45)':'rgba(48,70,28,.42)';
    ctx.beginPath();
    ctx.ellipse(cx+Math.cos(a)*iw*.22,cy+ih*.1+Math.sin(a)*ih*.12,rx,ry,a*.3,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function disegnaTendaPirata(bx,by,S,colore='#9a3018',accento='#f0c040'){
  const lw=Math.max(.8,S/52);
  ctx.fillStyle='rgba(80,45,18,.65)';
  ctx.beginPath();ctx.ellipse(bx,by-S*.02,S*.34,S*.13,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=colore;
  ctx.beginPath();
  ctx.moveTo(bx-S*.34,by-S*.02);
  ctx.lineTo(bx,by-S*.42);
  ctx.lineTo(bx+S*.34,by-S*.02);
  ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.25)';
  ctx.beginPath();ctx.moveTo(bx-S*.34,by-S*.02);ctx.lineTo(bx,by-S*.42);ctx.lineTo(bx,by-S*.02);ctx.closePath();ctx.fill();
  ctx.strokeStyle=accento;ctx.lineWidth=1.2*lw;
  ctx.beginPath();ctx.moveTo(bx-S*.25,by-S*.13);ctx.lineTo(bx+S*.25,by-S*.13);ctx.stroke();
  ctx.fillStyle='#241008';
  ctx.beginPath();ctx.moveTo(bx-S*.07,by-S*.02);ctx.lineTo(bx,by-S*.2);ctx.lineTo(bx+S*.07,by-S*.02);ctx.closePath();ctx.fill();
}

function disegnaBaraccone(bx,by,S,parete='#9a7040',tetto='#7a2818'){
  isoBox(bx,by,S*.42,S*.26,S*.24,'#7a5a30',parete,'#6a4820');
  isoRoof(bx,by-S*.24,S*.46,S*.28,0,S*.18,tetto,'#552010','#9a3a1a');
  isoWindow(bx-S*.12,by-S*.2,true,S*.08);
  isoWindow(bx+S*.12,by-S*.18,false,S*.07);
  ctx.fillStyle='#2a1608';
  ctx.fillRect(bx-S*.055,by-S*.12,S*.11,S*.12);
}

function dettagliBaseEdificio(tipo,bx,by,S,s){
  const nautica=tipo==='porto'||tipo==='cantiere'||tipo==='shipyard';
  ctx.save();
  if(!nautica){
    for(let i=0;i<5;i++){
      const x=bx+S*(-.42+i*.2);
      const y=by+S*(.02+(i%2)*.045);
      const hue=95+(i*17)%28;
      ctx.fillStyle=`hsla(${hue},45%,${24+(i%3)*5}%,.72)`;
      ctx.beginPath();
      ctx.ellipse(x,y,S*(.055+(i%2)*.018),S*(.032+(i%3)*.008),-.25+i*.12,0,Math.PI*2);
      ctx.fill();
    }
  }
  if(['casapirata','taverna','locanda','bettola_contrabbandieri','bordello','dormitorio','mensa','mensa_economica'].includes(tipo)){
    ctx.strokeStyle='rgba(95,58,24,.72)';
    ctx.lineWidth=Math.max(.8,1.1*s);
    ctx.beginPath();
    ctx.moveTo(bx-S*.42,by+S*.06);
    ctx.lineTo(bx-S*.22,by+S*.12);
    ctx.lineTo(bx+S*.05,by+S*.07);
    ctx.stroke();
    for(let i=0;i<4;i++){
      const px=bx-S*.42+i*S*.16;
      ctx.beginPath();ctx.moveTo(px,by+S*.035);ctx.lineTo(px,by+S*.135);ctx.stroke();
    }
    if(['taverna','locanda','bettola_contrabbandieri','bordello'].includes(tipo)){
      lanternaRossa(bx-S*.34,by-S*.02,S*.72);
      barileMolo(bx+S*.34,by+S*.09,S,.042);
    }
  }
  if(nautica||['segheria','sawmill','campo_costruzione','fabbro','carpentiere','forno','birrificio','razioni_mare','covo_contrabbandieri','distilleria'].includes(tipo)){
    for(let i=0;i<3;i++){
      isoBox(bx+S*(-.32+i*.18),by+S*(.08+i*.015),S*.11,S*.07,S*.08,'#7a4f22','#9b6a2f','#593516');
    }
  }
  ctx.restore();
}

function ponteLegnoIso(bx,by,S,w,d,assi=6){
  isoBox(bx,by,w,d,S*.045,'#6b4a28','#8d6234','#51351f');
  ctx.save();
  ctx.strokeStyle='rgba(32,20,10,.42)';
  ctx.lineWidth=Math.max(.7,S*.012);
  for(let i=1;i<assi;i++){
    const t=i/assi-.5;
    ctx.beginPath();
    ctx.moveTo(bx+t*w,by-S*.055-d*.22);
    ctx.lineTo(bx+t*w+d*.22,by-S*.012+d*.16);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(210,160,88,.22)';
  for(let i=0;i<3;i++){
    const yy=by-d*.18+i*d*.18;
    ctx.beginPath();
    ctx.moveTo(bx-w*.46,yy);
    ctx.lineTo(bx+w*.46,yy+d*.14);
    ctx.stroke();
  }
  ctx.restore();
}

function paloMolo(x,y,S,h=.42){
  ctx.save();
  ctx.strokeStyle='#3d2414';
  ctx.lineWidth=Math.max(2,S*.035);
  ctx.beginPath();
  ctx.moveTo(x,y-S*h);
  ctx.lineTo(x+S*.02,y+S*.14);
  ctx.stroke();
  ctx.strokeStyle='rgba(210,150,76,.45)';
  ctx.lineWidth=Math.max(.7,S*.01);
  ctx.beginPath();
  ctx.moveTo(x-S*.012,y-S*h*.94);
  ctx.lineTo(x+S*.008,y+S*.1);
  ctx.stroke();
  ctx.restore();
}

function barileMolo(x,y,S,scala=.06){
  const w=S*scala, h=S*scala*1.35;
  ctx.save();
  ctx.fillStyle='#8a5524';
  ctx.fillRect(x-w*.5,y-h,w,h);
  ctx.fillStyle='#b77a32';
  ctx.beginPath();ctx.ellipse(x,y-h,w*.5,w*.24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#5d3518';
  ctx.beginPath();ctx.ellipse(x,y,w*.5,w*.22,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(35,20,8,.65)';
  ctx.lineWidth=Math.max(.7,S*.008);
  ctx.beginPath();ctx.moveTo(x-w*.48,y-h*.68);ctx.lineTo(x+w*.48,y-h*.68);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-w*.48,y-h*.34);ctx.lineTo(x+w*.48,y-h*.34);ctx.stroke();
  ctx.restore();
}

function disegnaAssiParete(bx,by,S,w=.36,h=.22){
  ctx.save();
  ctx.strokeStyle='rgba(55,28,10,.32)';
  ctx.lineWidth=Math.max(.6,S*.009);
  for(let i=-2;i<=2;i++){
    const x=bx+i*w*S*.19;
    ctx.beginPath();
    ctx.moveTo(x,by-h*S*.92);
    ctx.lineTo(x+S*.015,by-S*.02);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(230,170,86,.16)';
  ctx.beginPath();
  ctx.moveTo(bx-w*S*.45,by-h*S*.54);
  ctx.lineTo(bx+w*S*.43,by-h*S*.48);
  ctx.stroke();
  ctx.restore();
}

function lanternaRossa(x,y,S){
  ctx.save();
  ctx.strokeStyle='rgba(50,22,8,.65)';
  ctx.lineWidth=Math.max(.6,S*.008);
  ctx.beginPath();ctx.moveTo(x,y-S*.08);ctx.lineTo(x,y-S*.035);ctx.stroke();
  ctx.fillStyle='rgba(190,30,20,.86)';
  ctx.beginPath();ctx.ellipse(x,y,S*.035,S*.045,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(245,155,50,.72)';
  ctx.lineWidth=Math.max(.5,S*.006);
  ctx.beginPath();ctx.moveTo(x-S*.026,y);ctx.lineTo(x+S*.026,y);ctx.stroke();
  ctx.restore();
}

function teloTropico(x,y,S,colore='#b52b1d'){
  ctx.save();
  ctx.fillStyle=colore;
  ctx.beginPath();
  ctx.moveTo(x-S*.14,y-S*.1);
  ctx.lineTo(x+S*.14,y-S*.08);
  ctx.lineTo(x+S*.1,y+S*.02);
  ctx.lineTo(x-S*.12,y+S*.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle='rgba(45,18,8,.45)';
  ctx.lineWidth=Math.max(.7,S*.008);
  ctx.stroke();
  ctx.restore();
}


function campoColtivatoTropico(bx,by,S,tipo){
  const palette={
    fattoria:['#6f8e2d','#547124','#8a6b30'],
    banane:['#4f8e32','#2f6827','#e0c84a'],
    papaia:['#5e9a38','#3f7c2b','#e08436'],
    canna_zucchero:['#82a84c','#5f8732','#d8d090'],
    tabacco:['#7f7a38','#5a5f27','#b18a44'],
  }[tipo]||['#5a8a28','#4a7a1e','#b18a44'];
  ctx.save();
  // base irregolare di terra, meno “griglia” e più campo tropicale lavorato
  ctx.fillStyle='rgba(98,72,35,.42)';
  ctx.beginPath();
  ctx.ellipse(bx+S*.05,by-S*.05,S*.56,S*.23,-.12,0,Math.PI*2);
  ctx.fill();
  for(let r=0;r<5;r++){
    const y=by-S*(.19-r*.07);
    const x0=bx-S*(.44-r*.025);
    const x1=bx+S*(.42-r*.01);
    ctx.strokeStyle=r%2?palette[0]:palette[1];
    ctx.lineWidth=Math.max(2,S*.025);
    ctx.beginPath();
    ctx.moveTo(x0,y);
    ctx.bezierCurveTo(bx-S*.18,y+S*(.035+Math.sin(r)*.012),bx+S*.14,y-S*(.026+Math.cos(r)*.01),x1,y+S*(.025-r*.002));
    ctx.stroke();
    ctx.strokeStyle='rgba(45,32,16,.25)';
    ctx.lineWidth=Math.max(.7,S*.008);
    ctx.beginPath();ctx.moveTo(x0,y+S*.018);ctx.bezierCurveTo(bx-S*.15,y+S*.045,bx+S*.14,y-S*.005,x1,y+S*.045);ctx.stroke();
  }
  // colture specifiche
  if(tipo!=='fattoria'){
    for(let i=0;i<9;i++){
      const x=bx+S*(-.34+i*.085);
      const y=by-S*(.14+((i*7)%5)*.025);
      ctx.strokeStyle=tipo==='canna_zucchero'?palette[2]:'#2d5a25';
      ctx.lineWidth=Math.max(.8,S*.012);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+S*.02,y-S*(.13+((i*3)%4)*.018));ctx.stroke();
      if(tipo==='banane'||tipo==='papaia'){
        ctx.fillStyle=palette[2];
        ctx.beginPath();ctx.ellipse(x+S*.028,y-S*.1,S*.024,S*.018,.3,0,Math.PI*2);ctx.fill();
      }
    }
  }
  // staccionata rotta e dettagli rurali
  ctx.strokeStyle='rgba(95,58,24,.72)';
  ctx.lineWidth=Math.max(.8,S*.011);
  for(let i=0;i<5;i++){
    const x=bx-S*.49+i*S*.14;
    ctx.beginPath();ctx.moveTo(x,by+S*.045);ctx.lineTo(x+S*.015,by-S*.04);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(bx-S*.5,by+S*.01);ctx.lineTo(bx+S*.08,by-S*.035);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx-S*.49,by+S*.045);ctx.lineTo(bx+S*.04,by+S*.005);ctx.stroke();
  // sacchi e cesta
  ctx.fillStyle='#b79a68';ctx.beginPath();ctx.ellipse(bx+S*.34,by+S*.035,S*.045,S*.032,.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8a6230';ctx.beginPath();ctx.ellipse(bx+S*.42,by+S*.02,S*.042,S*.025,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function capannaFattoriaTropico(bx,by,S,tipo){
  const roof=tipo==='tabacco'?'#6a4a22':tipo==='canna_zucchero'?'#8d6228':'#9d521d';
  isoBox(bx-S*.18,by-S*.26,S*.34,S*.21,S*.2,'#7b5728','#a77c3c','#5a3718');
  disegnaAssiParete(bx-S*.18,by-S*.26,S,.31,.19);
  isoRoof(bx-S*.18,by-S*.46,S*.39,S*.24,0,S*.14,roof,'#5a2f12','#bd6d2c');
  ctx.fillStyle='#2b1608';ctx.fillRect(bx-S*.225,by-S*.36,S*.085,S*.1);
  isoWindow(bx-S*.06,by-S*.39,true,S*.05);
}

function spaventapasseriTropico(bx,by,S){
  ctx.save();
  ctx.strokeStyle='#7a5020';ctx.lineWidth=Math.max(1,S*.016);
  ctx.beginPath();ctx.moveTo(bx+S*.2,by-S*.1);ctx.lineTo(bx+S*.2,by-S*.36);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+S*.08,by-S*.27);ctx.lineTo(bx+S*.32,by-S*.31);ctx.stroke();
  ctx.fillStyle='#c8a060';ctx.beginPath();ctx.arc(bx+S*.2,by-S*.405,S*.046,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8b2e1b';ctx.beginPath();ctx.moveTo(bx+S*.12,by-S*.25);ctx.lineTo(bx+S*.28,by-S*.25);ctx.lineTo(bx+S*.24,by-S*.11);ctx.lineTo(bx+S*.16,by-S*.11);ctx.closePath();ctx.fill();
  ctx.fillStyle='#caa64a';ctx.beginPath();ctx.ellipse(bx+S*.2,by-S*.45,S*.075,S*.026,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function edificioGenericoTropico(bx,by,S,tipo){
  // fallback più curato per edifici non ancora personalizzati
  ponteLegnoIso(bx,by+S*.05,S,S*.48,S*.13,6);
  isoBox(bx,by-S*.02,S*.4,S*.25,S*.25,'#6b4a24','#9b7240','#53351a');
  disegnaAssiParete(bx,by-S*.02,S,.37,.22);
  isoRoof(bx,by-S*.28,S*.44,S*.28,0,S*.16,'#5a381b','#382313','#75502a');
  isoWindow(bx-S*.12,by-S*.2,true,S*.055);
  ctx.fillStyle='#241008';ctx.fillRect(bx+S*.035,by-S*.13,S*.095,S*.13);
  ctx.fillStyle='rgba(240,192,64,.72)';ctx.font=`${Math.max(9,S*.12)}px serif`;
  ctx.textAlign='center';ctx.fillText(ED[tipo]?.icona||'✦',bx-S*.02,by-S*.42);
  isoBox(bx-S*.28,by+S*.035,S*.12,S*.075,S*.065,'#735027','#a67336','#4f3218');
  barileMolo(bx+S*.28,by+S*.04,S,.042);
}


function cassaTropico2(x,y,S,scale=.08){
  const w=S*scale, d=S*scale*.72, h=S*scale*.62;
  isoBox(x,y,w,d,h,'#6a431f','#a87434','#523116');
  ctx.save();
  ctx.strokeStyle='rgba(50,28,10,.72)';
  ctx.lineWidth=Math.max(.6,S*.006);
  ctx.beginPath();ctx.moveTo(x-w*.45,y-h*.55);ctx.lineTo(x+w*.45,y-h*.15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-w*.22,y-h*.72);ctx.lineTo(x-w*.22,y+h*.02);ctx.stroke();
  ctx.restore();
}

function saccoTropico2(x,y,S,scale=.06,col='#b99a62'){
  ctx.save();
  ctx.fillStyle=col;
  ctx.strokeStyle='rgba(75,46,20,.65)';
  ctx.lineWidth=Math.max(.6,S*.006);
  ctx.beginPath();
  ctx.ellipse(x,y-S*scale*.35,S*scale*.72,S*scale*.48,-.2,0,Math.PI*2);
  ctx.fill();ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x-S*scale*.25,y-S*scale*.72);
  ctx.quadraticCurveTo(x,y-S*scale*1.0,x+S*scale*.25,y-S*scale*.72);
  ctx.stroke();
  ctx.restore();
}

function insegnaLegnoTropico2(x,y,S,label='RUM'){
  ctx.save();
  const w=S*.24,h=S*.075;
  ctx.strokeStyle='#4b2b12';
  ctx.lineWidth=Math.max(1,S*.01);
  ctx.beginPath();ctx.moveTo(x,y-S*.03);ctx.lineTo(x,y+h*.72);ctx.stroke();
  ctx.fillStyle='#b7792e';
  ctx.fillRect(x-w*.5,y,w,h);
  ctx.strokeStyle='#5a3212';ctx.strokeRect(x-w*.5,y,w,h);
  ctx.fillStyle='#f3d47a';
  ctx.font=`bold ${Math.max(8,S*.075)}px serif`;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(label,x,y+h*.52);
  ctx.restore();
}

function tavoloTavernaTropico2(x,y,S){
  ctx.save();
  isoBox(x,y,S*.16,S*.10,S*.035,'#5b3518','#8d5727','#3f2410');
  ctx.strokeStyle='#4b2a10';
  ctx.lineWidth=Math.max(1,S*.01);
  for(const dx of [-.065,.065]){
    ctx.beginPath();ctx.moveTo(x+S*dx,y-S*.005);ctx.lineTo(x+S*(dx*.75),y+S*.07);ctx.stroke();
  }
  ctx.fillStyle='rgba(230,190,95,.85)';
  ctx.beginPath();ctx.arc(x-S*.035,y-S*.045,S*.015,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+S*.042,y-S*.028,S*.012,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function reteMoloTropico2(x,y,S){
  ctx.save();
  ctx.strokeStyle='rgba(214,196,140,.65)';
  ctx.lineWidth=Math.max(.7,S*.007);
  for(let i=0;i<4;i++){
    ctx.beginPath();ctx.moveTo(x-S*.1+i*S*.055,y-S*.055);ctx.lineTo(x-S*.05+i*S*.035,y+S*.06);ctx.stroke();
  }
  for(let j=0;j<3;j++){
    ctx.beginPath();ctx.moveTo(x-S*.12,y-S*.04+j*S*.045);ctx.lineTo(x+S*.13,y-S*.055+j*S*.04);ctx.stroke();
  }
  ctx.restore();
}

function basamentoTropico2(bx,by,S,tipo){
  ctx.save();
  const pietra=['governatore','fortezza','prigione','cappella','infermeria','guardia','caserma','osservatorio'].includes(tipo);
  const nautica=['porto','cantiere','shipyard'].includes(tipo);
  // Basamento più netto: in Tropico 2 ogni edificio si legge bene dal terreno,
  // ma senza sembrare una griglia tecnica.
  ctx.globalAlpha=.34;
  ctx.fillStyle=nautica?'#5a3218':pietra?'#b79c68':'#6b421c';
  ctx.beginPath();
  ctx.ellipse(bx,by+S*.066,S*.50,S*.18,0,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha=.86;
  ctx.strokeStyle=nautica?'rgba(43,25,10,.72)':pietra?'rgba(66,54,36,.70)':'rgba(48,28,10,.70)';
  ctx.lineWidth=Math.max(1.4,S*.014);
  ctx.beginPath();
  ctx.ellipse(bx,by+S*.055,S*.47,S*.165,0,0,Math.PI*2);
  ctx.stroke();
  ctx.globalAlpha=.18;
  ctx.strokeStyle='rgba(230,185,120,.22)';
  ctx.lineWidth=Math.max(.6,S*.005);
  ctx.beginPath();
  ctx.ellipse(bx-S*.02,by+S*.038,S*.38,S*.105,0,0,Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

function insegnaTavernaLargaTropico2(x,y,S,label='TAVERN'){
  ctx.save();
  const w=S*.36,h=S*.085;
  ctx.strokeStyle='#3d210d';
  ctx.lineWidth=Math.max(1,S*.011);
  ctx.beginPath();ctx.moveTo(x-S*.18,y-S*.05);ctx.lineTo(x-S*.18,y+S*.08);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+S*.18,y-S*.05);ctx.lineTo(x+S*.18,y+S*.08);ctx.stroke();
  ctx.fillStyle='#9b6428';ctx.fillRect(x-w*.5,y,w,h);
  ctx.strokeStyle='#4f2d12';ctx.strokeRect(x-w*.5,y,w,h);
  ctx.fillStyle='#f2d37b';ctx.font=`bold ${Math.max(8,S*.06)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(label,x,y+h*.55);
  ctx.restore();
}

function pilaMerciTropico2(x,y,S){
  cassaTropico2(x-S*.08,y,S,.075);
  cassaTropico2(x+S*.025,y-S*.015,S,.07);
  saccoTropico2(x+S*.13,y+S*.012,S,.055,'#b99762');
  barileMolo(x+S*.21,y+S*.02,S,.046);
}

function lanternaCaldaTropico2(x,y,S){
  ctx.save();
  ctx.globalAlpha=.45;
  ctx.fillStyle='rgba(255,166,62,.55)';
  ctx.beginPath();ctx.ellipse(x,y,S*.09,S*.055,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle='#f0a23e';
  ctx.beginPath();ctx.arc(x,y,S*.018,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function disegnaEdificio(tipo,cx,cy,s,footprint){
  s = s || G.ISO_SCALE;
  const fp=footprint || (typeof ingombroEdificio==='function' ? ingombroEdificio(tipo) : {w:1,h:1});
  const scalaIngombro=Math.min(1.24,1+(Math.max(fp.w||1,fp.h||1)-1)*0.13);
  const S = G.ISO_H * s * 1.55 * scalaIngombro;  // unita di scala edificio
  // Punto di ancoraggio: centro-basso del tile iso
  const bx = cx;
  const by = cy + G.ISO_H * s * .04;
  ctx.save();
  isoFootprintEdificio(cx,cy+G.ISO_H*s*.06,fp,s,tipo);
  isoShadow(bx,by+S*.05,S*.58,S*.26);

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

    case 'dormitorio':{
      basamentoTropico2(bx,by,S,tipo);
      ponteLegnoIso(bx-S*.02,by+S*.045,S,S*.64,S*.17,8);
      isoBox(bx-S*.04,by-S*.03,S*.56,S*.27,S*.22,'#66451f','#8f6b3e','#55351b');
      disegnaAssiParete(bx-S*.04,by-S*.03,S,.54,.22);
      isoRoof(bx-S*.04,by-S*.255,S*.62,S*.32,0,S*.13,'#4d351d','#2d1e12','#684726');
      for(let i=0;i<3;i++) isoWindow(bx-S*(.18-i*.16),by-S*.185,i!==1,S*.055);
      ctx.fillStyle='#1d120a';
      ctx.fillRect(bx+S*.16,by-S*.12,S*.1,S*.12);
      // Panni e staccionata: chiaro edificio abitativo, non produttivo.
      ctx.strokeStyle='rgba(232,210,150,.72)';
      ctx.lineWidth=Math.max(.8,S*.01);
      ctx.beginPath();ctx.moveTo(bx-S*.35,by-S*.235);ctx.lineTo(bx+S*.32,by-S*.29);ctx.stroke();
      for(let i=0;i<5;i++) teloTropico(bx-S*.28+i*S*.14,by-S*.225-(i%2)*S*.012,S*.38,i%2?'#d8b35a':'#88402a');
      ctx.strokeStyle='rgba(95,58,24,.75)';
      ctx.lineWidth=Math.max(1,S*.01);
      for(let i=0;i<5;i++){
        const px=bx-S*.34+i*S*.17;
        ctx.beginPath();ctx.moveTo(px,by+S*.025);ctx.lineTo(px,by+S*.125);ctx.stroke();
      }
      ctx.beginPath();ctx.moveTo(bx-S*.37,by+S*.075);ctx.lineTo(bx+S*.36,by+S*.06);ctx.stroke();
      barileMolo(bx-S*.35,by+S*.04,S,.045);
      saccoTropico2(bx+S*.33,by+S*.065,S,.052);
      break;
    }

        case 'mensa':
    case 'mensa_economica':{
      disegnaTendaPirata(bx,by,S,'#b87424','#e8c56a');
      isoBox(bx-S*.25,by+S*.02,S*.18,S*.11,S*.08,'#7a4a1a','#a06b28','#5a3210');
      isoBox(bx+S*.25,by+S*.02,S*.18,S*.11,S*.08,'#7a4a1a','#a06b28','#5a3210');
      ctx.fillStyle='rgba(255,160,60,.75)';
      ctx.beginPath();ctx.arc(bx,by-S*.06,S*.045,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(120,55,12,.8)';ctx.lineWidth=1.2*s;
      ctx.beginPath();ctx.moveTo(bx-S*.08,by-S*.01);ctx.lineTo(bx+S*.08,by-S*.01);ctx.stroke();
      break;
    }

    case 'campo_costruzione':{
      disegnaTendaPirata(bx-S*.14,by,S*.9,'#8a5a28','#d8b45c');
      ctx.strokeStyle='#7a4a1a';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(bx+S*.08,by-S*.03);ctx.lineTo(bx+S*.28,by-S*.42);ctx.lineTo(bx+S*.43,by-S*.04);ctx.stroke();
      ctx.strokeStyle='#c09048';ctx.lineWidth=1.2*s;
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.moveTo(bx+S*(.12+i*.09),by-S*.12);ctx.lineTo(bx+S*(.2+i*.07),by-S*.25);ctx.stroke();
      }
      isoBox(bx+S*.25,by+S*.04,S*.22,S*.13,S*.08,'#8a5a22','#a87532','#5f3b16');
      break;
    }

    case 'grotta_pirati':{
      ctx.fillStyle='#5f5540';
      ctx.beginPath();ctx.ellipse(bx,by-S*.12,S*.42,S*.26,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.fillStyle='#40382c';
      ctx.beginPath();ctx.ellipse(bx,by-S*.1,S*.28,S*.18,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.fillStyle='#130d09';
      ctx.beginPath();ctx.ellipse(bx,by-S*.04,S*.16,S*.17,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#8a7048';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(bx-S*.22,by-S*.05);ctx.lineTo(bx-S*.34,by+S*.05);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx+S*.22,by-S*.05);ctx.lineTo(bx+S*.34,by+S*.05);ctx.stroke();
      break;
    }

    case 'locanda':
    case 'bettola_contrabbandieri':
    case 'taverna':{
      const contr=tipo==='bettola_contrabbandieri';
      const loc=tipo==='locanda';
      ponteLegnoIso(bx,by+S*.055,S,S*.70,S*.18,8);
      basamentoTropico2(bx,by,S,tipo);
      const wall=contr?'#6e4b31':loc?'#c48b58':'#b66d31';
      const trim=contr?'#4b3020':'#6f3b18';
      isoBox(bx,by-S*.02,S*.60,S*.34,S*.29,'#6d431d',wall,trim);
      disegnaAssiParete(bx,by-S*.02,S,.56,.26);
      // Tetto grande, basso e caraibico: più simile alla taverna di Tropico 2 che a una locanda fantasy.
      isoRoof(bx,by-S*.31,S*.78,S*.44,0,S*.24,contr?'#2e251c':'#7a3a1a',contr?'#1d1712':'#552512',contr?'#5a3f26':'#a04a22');
      // Veranda laterale e tettoia: silhouette subito leggibile come edificio sociale.
      isoBox(bx-S*.35,by-S*.045,S*.24,S*.16,S*.18,'#61411e',contr?'#5a402b':'#986132','#4a2a14');
      isoRoof(bx-S*.35,by-S*.23,S*.28,S*.18,0,S*.09,contr?'#2a2018':'#6b3117','#24160e',contr?'#50361f':'#8c3c1b');
      isoBox(bx+S*.35,by-S*.035,S*.18,S*.13,S*.13,'#5b381b',contr?'#4a3528':'#8f5728','#402411');
      // Facciata sociale: porta scura, finestre calde, insegna semplice.
      isoWindow(bx-S*.15,by-S*.22,true,S*.075);
      isoWindow(bx+S*.16,by-S*.215,true,S*.07);
      ctx.fillStyle='#241008';
      ctx.fillRect(bx-S*.058,by-S*.15,S*.125,S*.16);
      ctx.beginPath();ctx.arc(bx+S*.004,by-S*.15,S*.063,Math.PI,0,false);ctx.fill();
      insegnaTavernaLargaTropico2(bx,by-S*.56,S,contr?'SMUGGLER':loc?'INN':'TAVERN');
      teloTropico(bx+S*.21,by-S*.18,S,contr?'#17120e':'#a92318');
      lanternaRossa(bx-S*.24,by-S*.18,S*.95);
      lanternaRossa(bx+S*.32,by-S*.12,S*.82);
      // Zona esterna da taverna: botti, tavolo e piccoli carichi.
      barileMolo(bx+S*.33,by+S*.035,S,.055);
      barileMolo(bx+S*.42,by+S*.055,S,.048);
      barileMolo(bx-S*.39,by+S*.06,S,.044);
      tavoloTavernaTropico2(bx-S*.19,by+S*.075,S);
      tavoloTavernaTropico2(bx+S*.03,by+S*.105,S*.85);
      saccoTropico2(bx+S*.18,by+S*.105,S,.052);
      lanternaCaldaTropico2(bx-S*.03,by-S*.13,S);
      break;
    }

        case 'porto':
    case 'cantiere':
    case 'shipyard':{
      const grande=tipo==='shipyard'||tipo==='cantiere';
      ctx.save();
      ctx.fillStyle='rgba(20,95,108,.38)';
      ctx.beginPath();
      ctx.ellipse(bx+S*.06,by-S*.12,S*.75,S*.36,-.12,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(150,220,210,.18)';
      ctx.lineWidth=Math.max(1,S*.015);
      for(let i=0;i<3;i++){
        ctx.beginPath();
        ctx.moveTo(bx-S*(.58-i*.08),by-S*(.08+i*.05));
        ctx.bezierCurveTo(bx-S*.2,by-S*(.16+i*.02),bx+S*.18,by-S*(.02+i*.08),bx+S*(.58-i*.06),by-S*(.12+i*.03));
        ctx.stroke();
      }
      ctx.restore();

      ponteLegnoIso(bx-S*.38,by-S*.22,S,S*.44,S*.18,5);
      ponteLegnoIso(bx+S*.03,by+S*.02,S,S*.98,S*.38,10);
      ponteLegnoIso(bx+S*.44,by-S*.17,S,S*.34,S*.18,4);

      for(const p of [
        [-.56,.08,.52],[-.36,.13,.44],[-.12,.15,.39],[.13,.13,.42],[.38,.08,.47],[.58,-.04,.55],
        [-.46,-.25,.38],[-.18,-.29,.34],[.26,-.31,.36],[.52,-.22,.42]
      ]) paloMolo(bx+S*p[0],by+S*p[1],S,p[2]);

      isoBox(bx+S*.06,by-S*.17,S*.58,S*.36,S*.42,'#8c5c2d','#bc6d2d','#77421c');
      ctx.save();
      ctx.strokeStyle='rgba(72,35,12,.38)';
      ctx.lineWidth=Math.max(.7,S*.012);
      for(let i=-3;i<=3;i++){
        const x=bx+S*(.06+i*.075);
        ctx.beginPath();ctx.moveTo(x,by-S*.57);ctx.lineTo(x+S*.015,by-S*.18);ctx.stroke();
      }
      ctx.restore();

      isoBox(bx+S*.06,by-S*.59,S*.64,S*.4,S*.08,'#704421','#966431','#4f2f19');
      ctx.strokeStyle='#2f1c0e';
      ctx.lineWidth=Math.max(1,S*.018);
      for(let i=-3;i<=3;i++){
        const x=bx+S*(.06+i*.095);
        ctx.beginPath();ctx.moveTo(x,by-S*.72);ctx.lineTo(x,by-S*.6);ctx.stroke();
      }
      ctx.beginPath();ctx.moveTo(bx-S*.24,by-S*.7);ctx.lineTo(bx+S*.38,by-S*.69);ctx.stroke();

      ctx.fillStyle='#261208';
      ctx.fillRect(bx-S*.02,by-S*.36,S*.12,S*.2);
      isoWindow(bx-S*.17,by-S*.37,true,S*.07);
      isoWindow(bx+S*.25,by-S*.36,false,S*.07);
      ctx.strokeStyle='rgba(255,205,110,.28)';
      ctx.lineWidth=Math.max(.8,S*.01);
      for(let i=0;i<4;i++){
        const x=bx+S*(.2+i*.035);
        ctx.beginPath();ctx.moveTo(x,by-S*.48);ctx.lineTo(x,by-S*.23);ctx.stroke();
      }

      barileMolo(bx-S*.21,by-S*.08,S,.065);
      barileMolo(bx-S*.12,by-S*.05,S,.058);
      barileMolo(bx+S*.28,by-S*.02,S,.06);
      isoBox(bx+S*.37,by+S*.03,S*.14,S*.09,S*.08,'#735027','#a67336','#4f3218');

      ctx.save();
      ctx.strokeStyle='#6f431c';
      ctx.lineWidth=Math.max(2,S*.026);
      ctx.beginPath();ctx.moveTo(bx+S*.07,by-S*.62);ctx.lineTo(bx+S*.07,by-S*1.12);ctx.stroke();
      ctx.lineWidth=Math.max(1,S*.012);
      ctx.beginPath();ctx.moveTo(bx+S*.07,by-S*1.02);ctx.lineTo(bx-S*.22,by-S*.66);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx+S*.07,by-S*1.02);ctx.lineTo(bx+S*.35,by-S*.66);ctx.stroke();
      ctx.fillStyle='#0b0b0b';
      ctx.beginPath();
      ctx.moveTo(bx+S*.07,by-S*1.1);
      ctx.lineTo(bx+S*.22,by-S*1.05+Math.sin(frame*.08)*S*.015);
      ctx.lineTo(bx+S*.07,by-S*.99);
      ctx.closePath();ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(bx-S*.48,by-S*.18);
      ctx.rotate(-.18);
      ctx.fillStyle='#573019';
      ctx.beginPath();ctx.ellipse(0,0,S*.17,S*.055,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#8d6234';
      ctx.beginPath();ctx.ellipse(0,-S*.012,S*.12,S*.032,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#2a1609';ctx.lineWidth=Math.max(.8,S*.01);ctx.stroke();
      ctx.restore();

      if(grande){
        ctx.strokeStyle='#7a4b1f';
        ctx.lineWidth=Math.max(2,S*.03);
        ctx.beginPath();
        ctx.moveTo(bx+S*.55,by-S*.05);
        ctx.lineTo(bx+S*.68,by-S*.52);
        ctx.lineTo(bx+S*.82,by-S*.07);
        ctx.stroke();
        ctx.strokeStyle='rgba(30,18,8,.55)';
        ctx.lineWidth=Math.max(1,S*.012);
        ctx.beginPath();ctx.moveTo(bx+S*.68,by-S*.52);ctx.lineTo(bx+S*.43,by-S*.26);ctx.stroke();
      }

      // Dettagli portuali extra in stile Tropico 2: merci pratiche, reti e carico sul molo.
      reteMoloTropico2(bx-S*.34,by-S*.03,S);
      reteMoloTropico2(bx+S*.50,by-S*.03,S*.85);
      pilaMerciTropico2(bx+S*.02,by+S*.12,S);
      pilaMerciTropico2(bx+S*.36,by+S*.08,S*.86);
      saccoTropico2(bx+S*.18,by+S*.135,S,.055,'#b69b62');
      saccoTropico2(bx+S*.26,by+S*.12,S,.048,'#a7824a');
      ctx.fillStyle='rgba(242,210,120,.84)';
      ctx.font=`bold ${Math.max(8,S*.065)}px serif`;
      ctx.textAlign='center';
      ctx.fillText(grande?'SHIPYARD':'DOCK',bx+S*.06,by-S*.66);
      ctx.save();
      ctx.strokeStyle='rgba(48,28,12,.65)';
      ctx.lineWidth=Math.max(1.2,S*.012);
      ctx.beginPath();ctx.arc(bx-S*.04,by+S*.14,S*.06,0,Math.PI*1.65);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx-S*.12,by+S*.14);ctx.lineTo(bx-S*.20,by+S*.10);ctx.stroke();
      ctx.restore();

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

    case 'banane':
    case 'papaia':
    case 'canna_zucchero':
    case 'tabacco':
    case 'fattoria':{
      campoColtivatoTropico(bx,by,S,tipo);
      capannaFattoriaTropico(bx,by,S,tipo);
      spaventapasseriTropico(bx,by,S);
      break;
    }

    case 'forno':{
      isoBox(bx-S*.06,by,S*.34,S*.22,S*.18,'#9a8060','#b89468','#765a3d');
      ctx.fillStyle='#5b4230';
      ctx.beginPath();ctx.ellipse(bx-S*.04,by-S*.17,S*.2,S*.16,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,130,45,.72)';
      ctx.beginPath();ctx.arc(bx-S*.04,by-S*.12,S*.055,0,Math.PI*2);ctx.fill();
      isoBox(bx+S*.2,by-S*.14,S*.09,S*.07,S*.26,'#4a3428','#5a4232','#30241d');
      ctx.fillStyle='rgba(210,210,190,.28)';
      ctx.beginPath();ctx.arc(bx+S*.2,by-S*.46,S*.05,0,Math.PI*2);ctx.fill();
      break;
    }

    case 'fabbro':
    case 'carpentiere':{
      {
        const wood=tipo==='carpentiere';
        ponteLegnoIso(bx,by+S*.045,S,S*.56,S*.16,7);
        isoBox(bx-S*.07,by-S*.03,S*.38,S*.24,S*.2,'#765229',wood?'#aa793d':'#8a6a38','#5b3a1d');
        disegnaAssiParete(bx-S*.07,by-S*.03,S,.36,.2);
        isoRoof(bx-S*.07,by-S*.23,S*.43,S*.26,0,S*.13,wood?'#62431f':'#4a3a24',wood?'#3c2916':'#30281e',wood?'#7a5528':'#665034');
        isoBox(bx+S*.22,by-S*.01,S*.2,S*.13,S*.1,wood?'#7a5224':'#34302c',wood?'#a26c30':'#514b43',wood?'#553418':'#26231f');
        if(wood){
          ctx.strokeStyle='#c79a55';ctx.lineWidth=Math.max(2,S*.026);
          for(let i=0;i<3;i++){
            ctx.beginPath();ctx.moveTo(bx+S*(.1+i*.06),by-S*(.02+i*.01));ctx.lineTo(bx+S*(.34+i*.04),by-S*(.16+i*.015));ctx.stroke();
          }
          isoBox(bx-S*.31,by+S*.035,S*.16,S*.08,S*.08,'#8a5b26','#ad7432','#633b18');
        }else{
          ctx.fillStyle='#ff8a35';
          ctx.beginPath();ctx.arc(bx+S*.2,by-S*.14,S*.05,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='rgba(210,210,190,.24)';
          ctx.beginPath();ctx.arc(bx+S*.2,by-S*.31,S*.055+Math.sin(frame*.07)*S*.01,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle='#2a241c';ctx.lineWidth=Math.max(1.4,S*.02);
          ctx.beginPath();ctx.moveTo(bx+S*.02,by-S*.08);ctx.lineTo(bx+S*.14,by-S*.22);ctx.stroke();
        }
        break;
      }
      disegnaBaraccone(bx-S*.06,by,S,tipo==='fabbro'?'#8a6a38':'#a7783f','#56351b');
      isoBox(bx+S*.22,by-S*.02,S*.18,S*.12,S*.12,'#3a3a38','#56524a','#2c2a28');
      ctx.fillStyle=tipo==='fabbro'?'#ff8a35':'#c08a3a';
      ctx.beginPath();ctx.arc(bx+S*.2,by-S*.16,S*.045,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#2a241c';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(bx+S*.02,by-S*.08);ctx.lineTo(bx+S*.12,by-S*.22);ctx.stroke();
      break;
    }

    case 'fonderia':
    case 'fonderia_cannoni':
    case 'fabbrica_armi':{
      isoBox(bx,by,S*.48,S*.3,S*.3,'#4a4038','#6e5b48','#3b332d');
      isoRoof(bx,by-S*.3,S*.5,S*.3,0,S*.13,'#2e2b28','#211f1d','#51463c');
      isoBox(bx+S*.18,by-S*.3,S*.11,S*.08,S*.34,'#36302d','#4a4038','#292522');
      ctx.fillStyle='rgba(210,210,200,.3)';
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.arc(bx+S*(.18+i*.03),by-S*(.67+i*.05),S*(.045+i*.015),0,Math.PI*2);ctx.fill();
      }
      if(tipo==='fonderia_cannoni'){
        ctx.strokeStyle='#1c1a18';ctx.lineWidth=4*s;
        ctx.beginPath();ctx.moveTo(bx-S*.25,by-S*.06);ctx.lineTo(bx+S*.08,by-S*.12);ctx.stroke();
      }
      break;
    }

    case 'birrificio':
    case 'razioni_mare':
    case 'covo_contrabbandieri':{
      disegnaBaraccone(bx,by,S,tipo==='covo_contrabbandieri'?'#6b5132':'#9a7040',tipo==='covo_contrabbandieri'?'#262018':'#73401c');
      for(let i=0;i<3;i++){
        isoBox(bx-S*.24+i*S*.2,by+S*.04,S*.13,S*.09,S*.13,'#7a4a18','#9a6424','#5b3510');
      }
      if(tipo==='covo_contrabbandieri'){
        ctx.fillStyle='#16100c';
        ctx.beginPath();ctx.moveTo(bx-S*.04,by-S*.48);ctx.lineTo(bx+S*.12,by-S*.42);ctx.lineTo(bx-S*.04,by-S*.36);ctx.fill();
      }
      break;
    }

    case 'distilleria':{
      // Distilleria più leggibile: edificio di lavorazione, camino alto e botti di rum esterne.
      basamentoTropico2(bx,by,S,tipo);
      ponteLegnoIso(bx+S*.02,by+S*.055,S,S*.58,S*.16,7);
      isoBox(bx-S*.04,by-S*.02,S*.48,S*.30,S*.33,'#5f4b2e','#8f7447','#564122');
      disegnaAssiParete(bx-S*.04,by-S*.02,S,.46,.28);
      isoRoof(bx-S*.04,by-S*.35,S*.54,S*.34,0,S*.16,'#4d3820','#322111','#654829');

      // Ciminiera alta e fumante, fondamentale per distinguerla dagli alloggi.
      isoBox(bx+S*.22,by-S*.35,S*.12,S*.09,S*.38,'#3b3128','#5a4a38','#2a241e');
      ctx.fillStyle='rgba(35,25,18,.65)';
      ctx.fillRect(bx+S*.17,by-S*.74,S*.10,S*.035);
      for(let i=0;i<5;i++){
        const fy=by-S*.78-i*S*.07-Math.sin(frame*.045+i*1.1)*S*.025;
        ctx.globalAlpha=.34-i*.045;
        ctx.fillStyle='#d6cec0';
        ctx.beginPath();ctx.arc(bx+S*(.22+i*.022),fy,S*(.035+i*.018),0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;

      // Botti e zona carico rum: deve essere riconoscibile subito come Rum Distillery.
      for(let i=0;i<5;i++) barileMolo(bx-S*(.36-i*.115),by+S*(.055+(i%2)*.018),S,.048);
      cassaTropico2(bx+S*.34,by+S*.065,S,.085);
      saccoTropico2(bx+S*.21,by+S*.09,S,.052,'#b48750');
      insegnaLegnoTropico2(bx-S*.08,by-S*.53,S*.86,'RUM');

      // Tubo/condensatore semplice.
      ctx.strokeStyle='rgba(210,170,80,.78)';
      ctx.lineWidth=Math.max(1.2,S*.012);
      ctx.beginPath();
      ctx.moveTo(bx+S*.08,by-S*.31);
      ctx.bezierCurveTo(bx+S*.17,by-S*.25,bx+S*.24,by-S*.17,bx+S*.2,by-S*.05);
      ctx.stroke();
      break;
    }

        case 'sawmill':
    case 'segheria':{
      {
        ponteLegnoIso(bx+S*.04,by+S*.045,S,S*.66,S*.18,8);
        for(let i=0;i<4;i++){
          const logX=bx-S*.32+i*S*.14;
          isoBox(logX,by+S*(.02-i*.018),S*.14,S*.1,S*.08,'#8a5724','#b06f2e','#6d4118');
          ctx.strokeStyle='#4d2810';ctx.lineWidth=Math.max(.6,S*.008);
          ctx.beginPath();ctx.ellipse(logX-S*.07,by+S*(.02-i*.018)-S*.04,S*.034,S*.018,0,0,Math.PI*2);ctx.stroke();
        }
        isoBox(bx+S*.17,by-S*.04,S*.34,S*.22,S*.24,'#8b612e','#bd8440','#6c4521');
        disegnaAssiParete(bx+S*.17,by-S*.04,S,.32,.22);
        isoRoof(bx+S*.17,by-S*.28,S*.38,S*.24,0,S*.12,'#51371e','#332315','#704a26');
        ctx.fillStyle='#d5d7d0';
        ctx.beginPath();
        ctx.moveTo(bx-S*.05,by-S*.18);
        ctx.lineTo(bx+S*.17,by-S*.2);
        ctx.lineTo(bx+S*.2,by-S*.16);
        ctx.lineTo(bx-S*.02,by-S*.13);
        ctx.closePath();ctx.fill();
        ctx.strokeStyle='#5a5a55';ctx.lineWidth=Math.max(.8,S*.01);ctx.stroke();
        ctx.strokeStyle='#6f431d';ctx.lineWidth=Math.max(1,S*.018);
        ctx.beginPath();ctx.moveTo(bx+S*.36,by-S*.03);ctx.lineTo(bx+S*.47,by-S*.28);ctx.lineTo(bx+S*.55,by-S*.05);ctx.stroke();
        break;
      }
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
      // Mercato nero: tenda dei contrabbandieri, casse e merci rubate.
      ponteLegnoIso(bx,by+S*.055,S,S*.58,S*.15,7);
      isoBox(bx-S*.2,by+S*.02,S*.22,S*.14,S*.12,'#6b451f','#9b6a30','#4b2d14');
      isoBox(bx+S*.22,by+S*.025,S*.24,S*.15,S*.11,'#594020','#805c2b','#3d2814');
      disegnaTendaPirata(bx,by+S*.01,S*.92,'#7f1b18','#e0b44c');
      // telo laterale colorato e bancarella coperta
      teloTropico(bx-S*.23,by-S*.08,S,'#c8a044');
      ctx.fillStyle='rgba(18,10,5,.42)';
      ctx.beginPath();ctx.ellipse(bx,by+S*.025,S*.3,S*.09,0,0,Math.PI*2);ctx.fill();
      // merci di contrabbando
      for(let i=0;i<4;i++){
        isoBox(bx+S*(-.34+i*.16),by+S*(.095+(i%2)*.02),S*.1,S*.065,S*.065,'#6d4921','#9a6a32','#4e3017');
      }
      barileMolo(bx+S*.31,by+S*.06,S,.052);
      barileMolo(bx+S*.38,by+S*.09,S,.043);
      // monete e bottino
      ctx.fillStyle='#e8bd42';
      for(let i=0;i<5;i++){ ctx.beginPath();ctx.arc(bx-S*.19+i*S*.025,by-S*.055+(i%2)*S*.01,S*.018,0,Math.PI*2);ctx.fill(); }
      ctx.strokeStyle='rgba(35,18,8,.72)';ctx.lineWidth=Math.max(.8,S*.012);
      ctx.beginPath();ctx.moveTo(bx-S*.09,by-S*.015);ctx.lineTo(bx+S*.1,by-S*.015);ctx.stroke();
      ctx.fillStyle='#f3d071';ctx.font=`bold ${Math.max(8,S*.08)}px serif`;
      ctx.textAlign='center';ctx.fillText('$',bx+S*.18,by-S*.19);
      break;
    }


    case 'casapirata':{
      // Alloggio pirata spartano: meno "servizio", più baracca abitata.
      basamentoTropico2(bx,by,S,tipo);
      ponteLegnoIso(bx+S*.02,by+S*.045,S,S*.52,S*.16,6);
      isoBox(bx-S*.04,by-S*.04,S*.42,S*.25,S*.22,'#755027','#a06a34','#68401f');
      disegnaAssiParete(bx-S*.04,by-S*.04,S,.4,.22);
      isoRoof(bx-S*.04,by-S*.26,S*.50,S*.31,0,S*.16,'#5c4325','#3b2a1a','#76552e');
      isoBox(bx+S*.24,by-S*.02,S*.16,S*.13,S*.14,'#5b3e21','#82572b','#4b3019');
      isoRoof(bx+S*.24,by-S*.16,S*.18,S*.15,0,S*.07,'#3d2d1c','#2a2016','#5a3f24');
      ctx.fillStyle='#241008';
      ctx.fillRect(bx-S*.09,by-S*.13,S*.1,S*.13);
      ctx.beginPath();ctx.arc(bx-S*.04,by-S*.13,S*.05,Math.PI,0,false);ctx.fill();
      isoWindow(bx+S*.08,by-S*.17,true,S*.055);
      // Piccola bandiera nera e roba personale per distinguerla dagli edifici produttivi.
      ctx.strokeStyle='#6a3a14';ctx.lineWidth=Math.max(1.2,S*.018);
      ctx.beginPath();ctx.moveTo(bx-S*.29,by-S*.06);ctx.lineTo(bx-S*.36,by-S*.29);ctx.stroke();
      ctx.fillStyle='#0b0b0b';
      ctx.beginPath();ctx.moveTo(bx-S*.36,by-S*.29);ctx.lineTo(bx-S*.22,by-S*.255+Math.sin(frame*.08)*S*.01);ctx.lineTo(bx-S*.36,by-S*.205);ctx.fill();
      ctx.strokeStyle='rgba(218,185,120,.7)';
      ctx.lineWidth=Math.max(.8,S*.008);
      ctx.beginPath();
      ctx.moveTo(bx+S*.08,by-S*.09);
      ctx.quadraticCurveTo(bx+S*.19,by-S*.015,bx+S*.31,by-S*.09);
      ctx.stroke();
      barileMolo(bx+S*.30,by+S*.04,S,.045);
      cassaTropico2(bx-S*.26,by+S*.045,S,.07);
      // Dettagli abitativi spartani: amaca/corde e panni, per differenziarlo da magazzini e produzione.
      ctx.strokeStyle='rgba(218,190,132,.75)';
      ctx.lineWidth=Math.max(.8,S*.009);
      ctx.beginPath();ctx.moveTo(bx-S*.18,by-S*.22);ctx.quadraticCurveTo(bx+S*.02,by-S*.16,bx+S*.22,by-S*.22);ctx.stroke();
      teloTropico(bx+S*.02,by-S*.18,S*.38,'#9f5b32');
      break;
    }

        case 'bordello':{
      {
        ponteLegnoIso(bx+S*.03,by+S*.045,S,S*.54,S*.14,7);
        isoBox(bx,by-S*.03,S*.48,S*.3,S*.31,'#b67758','#d78f74','#a65f4a');
        isoRoof(bx,by-S*.34,S*.52,S*.32,0,S*.18,'#9b5b24','#713817','#bd7430');
        isoBox(bx+S*.17,by-S*.49,S*.12,S*.08,S*.12,'#c68b74','#e2a28a','#a96855');
        isoRoof(bx+S*.17,by-S*.61,S*.13,S*.09,0,S*.06,'#9b5b24','#713817','#bd7430');
        isoWindow(bx-S*.13,by-S*.25,true,S*.07);
        isoWindow(bx+S*.14,by-S*.25,true,S*.07);
        ctx.fillStyle='#34120c';
        ctx.fillRect(bx-S*.055,by-S*.15,S*.11,S*.15);
        teloTropico(bx-S*.12,by-S*.24,S,'#be1f24');
        teloTropico(bx+S*.14,by-S*.23,S,'#1776a7');
        lanternaRossa(bx-S*.25,by-S*.18,S);
        lanternaRossa(bx+S*.27,by-S*.16,S);
        ctx.fillStyle='#f4d172';ctx.font=`bold ${Math.max(8,S*.09)}px serif`;
        ctx.textAlign='center';ctx.fillText('L',bx,by-S*.47);
        barileMolo(bx+S*.31,by+S*.03,S,.045);
        break;
      }
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
      // Cantastorie: piccolo teatro da porto, più legno e meno placeholder.
      ponteLegnoIso(bx,by+S*.055,S,S*.56,S*.16,7);
      isoBox(bx,by+S*.01,S*.5,S*.3,S*.13,'#6f4b21','#a07034','#4c2f13');
      isoBox(bx-S*.25,by-S*.1,S*.07,S*.055,S*.36,'#4f3113','#7a4b20','#321b0a');
      isoBox(bx+S*.25,by-S*.1,S*.07,S*.055,S*.36,'#4f3113','#7a4b20','#321b0a');
      isoRoof(bx,by-S*.43,S*.54,S*.14,0,S*.08,'#704018','#4f2b10','#95602a');
      // sipario rosso diviso e drappi dorati
      ctx.fillStyle='#8b1e18';
      ctx.beginPath();ctx.moveTo(bx-S*.26,by-S*.43);ctx.lineTo(bx-S*.02,by-S*.42);ctx.lineTo(bx-S*.08,by-S*.11);ctx.lineTo(bx-S*.26,by-S*.09);ctx.closePath();ctx.fill();
      ctx.fillStyle='#a32920';
      ctx.beginPath();ctx.moveTo(bx+S*.26,by-S*.43);ctx.lineTo(bx+S*.02,by-S*.42);ctx.lineTo(bx+S*.08,by-S*.11);ctx.lineTo(bx+S*.26,by-S*.09);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#e0b44c';ctx.lineWidth=Math.max(1,S*.014);
      ctx.beginPath();ctx.moveTo(bx-S*.28,by-S*.43);ctx.lineTo(bx+S*.28,by-S*.43);ctx.stroke();
      for(let i=0;i<6;i++){
        ctx.beginPath();ctx.moveTo(bx-S*.24+i*S*.096,by-S*.42);ctx.lineTo(bx-S*.21+i*S*.096,by-S*.37);ctx.stroke();
      }
      // narratore con pergamena
      ctx.fillStyle='#c99a62';ctx.beginPath();ctx.arc(bx,by-S*.245,S*.055,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2b1b0b';ctx.beginPath();ctx.ellipse(bx,by-S*.15,S*.055,S*.09,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e8d3a0';ctx.fillRect(bx+S*.045,by-S*.205,S*.105,S*.07);
      ctx.strokeStyle='rgba(75,45,18,.55)';ctx.strokeRect(bx+S*.045,by-S*.205,S*.105,S*.07);
      // note/stelle leggere
      ctx.fillStyle='rgba(240,192,64,.76)';ctx.font=`${Math.max(10,S*.14)}px serif`;
      ctx.textAlign='center';
      ctx.fillText('♪',bx-S*.18,by-S*.30+Math.sin(frame*.06)*3);
      ctx.fillText('✦',bx+S*.18,by-S*.34+Math.sin(frame*.06+1)*3);
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
      // Infermeria coloniale: calce chiara, tetto in tegole e dettagli medici.
      ponteLegnoIso(bx,by+S*.055,S,S*.5,S*.14,6);
      isoBox(bx,by-S*.02,S*.46,S*.28,S*.3,'#d9d1bd','#f0e6cf','#b9ad93');
      disegnaAssiParete(bx,by-S*.02,S,.42,.24);
      isoRoof(bx,by-S*.32,S*.5,S*.3,0,S*.18,'#9a4a24','#6e2e16','#bd6630');
      isoBox(bx+S*.18,by-S*.45,S*.11,S*.08,S*.12,'#d9d1bd','#f0e6cf','#b9ad93');
      isoRoof(bx+S*.18,by-S*.57,S*.12,S*.09,0,S*.055,'#9a4a24','#6e2e16','#bd6630');
      // croce rossa su insegna lignea, meno piatta sul muro
      isoBox(bx-S*.18,by-S*.22,S*.13,S*.035,S*.09,'#70451f','#9b6830','#4b2b12');
      ctx.fillStyle='#c82424';
      ctx.fillRect(bx-S*.205,by-S*.285,S*.052,S*.115);
      ctx.fillRect(bx-S*.236,by-S*.252,S*.114,S*.045);
      isoWindow(bx+S*.06,by-S*.23,true,S*.065);
      isoWindow(bx+S*.19,by-S*.22,true,S*.055);
      ctx.fillStyle='#4a2c16';ctx.fillRect(bx-S*.055,by-S*.15,S*.11,S*.15);
      ctx.beginPath();ctx.arc(bx,by-S*.15,S*.055,Math.PI,0,false);ctx.fill();
      // barella e secchio fuori
      ctx.strokeStyle='#8a6a36';ctx.lineWidth=Math.max(1,S*.012);
      ctx.beginPath();ctx.moveTo(bx-S*.34,by-S*.045);ctx.lineTo(bx-S*.13,by-S*.025);ctx.stroke();
      ctx.fillStyle='#e5d5ad';ctx.fillRect(bx-S*.32,by-S*.09,S*.17,S*.06);
      barileMolo(bx+S*.31,by+S*.06,S,.04);
      break;
    }


    case 'bagni':{
      // Bagni: edificio termale caraibico con vasca esterna e vapore.
      ponteLegnoIso(bx,by+S*.06,S,S*.52,S*.16,7);
      isoBox(bx,by-S*.02,S*.43,S*.27,S*.25,'#6b7d79','#8fa09a','#4e615d');
      isoRoof(bx,by-S*.27,S*.45,S*.28,0,S*.14,'#4d3b25','#342719','#6a5031');
      isoWindow(bx-S*.15,by-S*.19,true,S*.055);
      isoWindow(bx+S*.14,by-S*.19,true,S*.055);
      ctx.fillStyle='#352014';ctx.fillRect(bx-S*.055,by-S*.13,S*.11,S*.13);
      // grande vasca davanti in pietra
      ctx.fillStyle='#786b55';ctx.beginPath();ctx.ellipse(bx,by+S*.02,S*.28,S*.11,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(78,178,204,${.72+Math.sin(frame*.04)*.06})`;
      ctx.beginPath();ctx.ellipse(bx,by+S*.005,S*.22,S*.075,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(220,245,255,.72)';ctx.lineWidth=Math.max(.8,S*.01);
      ctx.beginPath();ctx.ellipse(bx,by+S*.005,S*.16,S*.048,0,0,Math.PI*2);ctx.stroke();
      // tinozze laterali e panni
      barileMolo(bx-S*.3,by+S*.055,S,.055);
      teloTropico(bx+S*.27,by-S*.08,S,'#d8c07a');
      for(let i=0;i<4;i++){
        const vx=bx-S*.14+i*S*.09;
        const vy=by-S*.08-Math.sin(frame*.045+i)*S*.035;
        ctx.fillStyle=`rgba(225,245,250,${.14+Math.sin(frame*.04+i)*.05})`;
        ctx.beginPath();ctx.arc(vx,vy,S*(.032+i*.002),0,Math.PI*2);ctx.fill();
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
      // Sarto: bottega di tessuti con vetrina, stendardi e forbici.
      ponteLegnoIso(bx,by+S*.055,S,S*.5,S*.14,6);
      isoBox(bx,by-S*.02,S*.42,S*.26,S*.28,'#8d6838','#bd8b4c','#68451f');
      disegnaAssiParete(bx,by-S*.02,S,.39,.23);
      isoRoof(bx,by-S*.30,S*.46,S*.28,0,S*.17,'#4b2f18','#2d1c10','#6a4524');
      isoBox(bx-S*.16,by-S*.22,S*.13,S*.035,S*.16,'#6a461f','#9a6b32','#4a2c14');
      ctx.fillStyle='rgba(195,220,235,.38)';ctx.fillRect(bx-S*.21,by-S*.31,S*.12,S*.16);
      ctx.strokeStyle='#8a6a30';ctx.lineWidth=Math.max(.8,S*.01);ctx.strokeRect(bx-S*.21,by-S*.31,S*.12,S*.16);
      // manichino e abito
      ctx.fillStyle='#c99a62';ctx.beginPath();ctx.arc(bx-S*.15,by-S*.29,S*.032,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#244c87';ctx.beginPath();ctx.ellipse(bx-S*.15,by-S*.22,S*.046,S*.065,0,0,Math.PI*2);ctx.fill();
      // rotoli di stoffa e teli appesi
      teloTropico(bx+S*.1,by-S*.22,S,'#be2e3f');
      teloTropico(bx+S*.22,by-S*.20,S,'#1f6f91');
      isoBox(bx+S*.25,by+S*.035,S*.12,S*.07,S*.07,'#705020','#9b7432','#513313');
      ctx.fillStyle='#2a1a08';ctx.fillRect(bx-S*.035,by-S*.14,S*.1,S*.14);
      ctx.beginPath();ctx.arc(bx+S*.015,by-S*.14,S*.05,Math.PI,0,false);ctx.fill();
      ctx.fillStyle='#f0c040';ctx.font=`${Math.max(10,S*.14)}px serif`;
      ctx.textAlign='center';ctx.fillText('✂',bx+S*.02,by-S*.43);
      break;
    }


    default:{
      edificioGenericoTropico(bx,by,S,tipo);
    }
  }
  dettagliBaseEdificio(tipo,bx,by,S,s);
  ctx.restore();
}


// === FASE 4A PORTO VIVO ===
function disegnaPortoVivoDecor(bx,by,S){
  ctx.save();
  // scialuppa
  ctx.fillStyle='#6b4322';
  ctx.beginPath();
  ctx.ellipse(bx+S*.55,by+S*.05,S*.16,S*.05,-0.3,0,Math.PI*2);
  ctx.fill();
  // albero
  ctx.strokeStyle='#4a2d12';
  ctx.lineWidth=Math.max(1,S*.015);
  ctx.beginPath(); ctx.moveTo(bx+S*.55,by+S*.02); ctx.lineTo(bx+S*.55,by-S*.22); ctx.stroke();
  // vela
  ctx.fillStyle='rgba(235,228,205,.9)';
  ctx.beginPath();
  ctx.moveTo(bx+S*.55,by-S*.2);
  ctx.lineTo(bx+S*.67,by-S*.12);
  ctx.lineTo(bx+S*.55,by-S*.05);
  ctx.closePath(); ctx.fill();
  // merci
  for(let i=0;i<3;i++){
    ctx.fillStyle=i%2?'#8b5a2b':'#a0703c';
    ctx.fillRect(bx-S*.45+i*S*.08,by+S*.12,S*.06,S*.06);
  }
  // palo e corda
  ctx.strokeStyle='#5a3818';
  ctx.beginPath();
  ctx.moveTo(bx-S*.38,by); ctx.lineTo(bx-S*.38,by-S*.15);
  ctx.moveTo(bx-S*.18,by); ctx.lineTo(bx-S*.18,by-S*.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx-S*.38,by-S*.12); ctx.lineTo(bx-S*.18,by-S*.12);
  ctx.stroke();
  ctx.restore();
}
