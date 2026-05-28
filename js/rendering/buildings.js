// Isla del Diablo — rendering/buildings.js
// Estratto da 06_renderer_buildings.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: RENDERER_BUILDINGS
// ═══════════════════════════════════════
// ── disegna edificio — isometrico stile Tropico 2 ──
// cx,cy = centro dell'impronta iso (da isoProj), s = ISO_SCALE
function disegnaEdificio(tipo,cx,cy,s,footprint){
  s = s || G.ISO_SCALE;
  const fp=footprint || (typeof ingombroEdificio==='function' ? ingombroEdificio(tipo) : {w:1,h:1});
  const scalaIngombro=Math.min(1.36,1+(Math.max(fp.w||1,fp.h||1)-1)*0.18);
  const S = G.ISO_H * s * 1.8 * scalaIngombro;  // unita di scala edificio
  // Punto di ancoraggio: centro-basso del tile iso
  const bx = cx;
  const by = cy + G.ISO_H * s * .18;
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
