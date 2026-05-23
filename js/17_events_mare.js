// ═══════════════════════════════════════
// MODULO: EVENTS_MARE
// ═══════════════════════════════════════
G.eventoAttivo=false;
G.cooldownEvento=0;

const EVENTI_NARRATIVI=[

  // ── MARE ──
  {
    id:'mercante_rifugio', tag:'Mare', peso:3,
    icona:'🚢', sfondo:'#0a2540',
    titolo:'Il Mercante in Difficoltà',
    testo:'Una nave mercantile batte bandiera di soccorso al largo. Il capitano — un ometto sudaticcio con una parrucca storta — chiede rifugio, promettendo compenso. Aggiunge, sottovoce, che ha anche un\'ottima ricetta per la torta di rum. Come se questo cambiasse qualcosa.',
    scelte:[
      {etich:'Generosità',testo:'Accordate rifugio e rifornimenti',colore:'verde',
        esito:'Il mercante, commosso fino alle lacrime, vi abbraccia. Vi lasciate abbracciare per cortesia. Vi lascia oro e spezie. La torta di rum, per fortuna, se la tiene.',
        tipo:'bene', fn:()=>{G.oro+=80;G.cibo+=30;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+18);}},
      {etich:'Opportunismo',testo:'Rifugio sì... ma ad un prezzo',colore:'',
        esito:'Il capitano stringe i denti e paga. Mentre salpa, vi urla qualcosa. Probabilmente non era un complimento.',
        tipo:'bene', fn:()=>{G.oro+=150;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+5);}},
      {etich:'Pirateria',testo:'Catturate nave e equipaggio',colore:'rosso',
        esito:'La nave è vostra! Il parrucchino del capitano galleggia ancora sul mare. Poetico. Un superstite però è fuggito a nuoto. La Marina saprà.',
        tipo:'male', fn:()=>{G.oro+=220;G.legno+=40;G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-20);G.fazioni.mercante.rep=Math.max(-100,G.fazioni.mercante.rep-25);if(Math.random()<.5)catturaPrigioniero('Mercante');}},
    ]
  },

  {
    id:'relitto', tag:'Mare', peso:2,
    icona:'⚓', sfondo:'#0c2030',
    titolo:'Il Relitto della Tempesta',
    testo:'I vostri uomini avvistano un relitto che deriva verso la riva. Tra le tavole rotte si scorgono casse, un baule chiuso a chiave e... una gallina. Viva. Che vi fissa con assoluta calma, come se stesse aspettando.',
    scelte:[
      {etich:'Salvataggio',testo:'Mettete a mare una scialuppa',colore:'verde',
        esito:'Recuperate un sopravvissuto mezzo morto di sete. E la gallina. Il sopravvissuto vi rivela una rotta commerciale segreta. La gallina non dice niente, ma sembra approvare.',
        tipo:'bene', fn:()=>{creaaPirata();G.ricerca.punti+=20;G.cibo+=15;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+12);}},
      {etich:'Razzia',testo:'Portate a riva solo le casse',colore:'',
        esito:'Nelle casse trovate oro, spezie e una lettera d\'amore destinata a qualcuno che probabilmente non la riceverà mai. La lasciate lì. Siete pirati, non mostri.',
        tipo:'bene', fn:()=>{G.oro+=120;G.rum+=30;G.ricerca.punti+=15;}},
    ]
  },

  {
    id:'corsaro_alleato', tag:'Mare', peso:2,
    icona:'🏴‍☠️', sfondo:'#1a0a0a',
    titolo:'Lupa di Mare',
    testo:'Un brigantino senza insegne affianca l\'isola. Il capitano — una donna con una cicatrice sul mento e un pappagallo che insulta in tre lingue — chiede di parlare. Il pappagallo urla qualcosa di imbarazzante sulla vostra madre.',
    scelte:[
      {etich:'Alleanza',testo:'Patto di mutua difesa. Il pappagallo può restare.',colore:'verde',
        esito:'"Capitano contro capitano." Lupa sorride. Il pappagallo smette di insultare. Quasi un rispetto.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+25);G.oro+=60;}},
      {etich:'Commercio',testo:'Rum contro bottino. Affari senza sentimenti.',colore:'',
        esito:'Scambio equo. Il pappagallo commenta "affare onesto" in olandese. Incredibilmente, qualcuno capisce.',
        tipo:'bene', fn:()=>{G.oro+=100;G.rum+=20;G.cibo=Math.max(0,G.cibo-30);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+10);}},
      {etich:'Diffidenza',testo:'Rifiutate. Cannoni puntati.',colore:'rosso',
        esito:'"Come volete." Lupa salpa. Il pappagallo vi dedica una parola finale. Non la ripetono nemmeno i pirati più sboccati.',
        tipo:'male', fn:()=>{G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-8);}},
    ]
  },

  {
    id:'nave_fantasma', tag:'Mare', peso:1,
    icona:'👻', sfondo:'#080820',
    titolo:'La Nave Senza Equipaggio',
    testo:'Una brigantino alla deriva entra in porto da solo, vele ammainate, timone libero. A bordo: nessuno. Solo un tavolo apparecchiato per sei, cibo ancora caldo, e un biglietto che dice "Torneremo presto". Nessuno firma.',
    scelte:[
      {etich:'Razzia',testo:'È abbandonata. Prendete tutto.',colore:'verde',
        esito:'Carica di rum e spezie pregiate. Mentre portate via l\'ultimo barile, sentite ridere qualcuno. Probabilmente il vento.',
        tipo:'bene', fn:()=>{G.oro+=90;G.rum+=50;G.ricerca.punti+=10;}},
      {etich:'Prudenza',testo:'Lasciatela andare. Certe cose non si toccano.',colore:'',
        esito:'La nave riparte da sola con la marea. La ciurma la guarda andare in silenzio. Per tre giorni nessuno parla di fantasmi. Poi ci pensano tutto il tempo.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Abitatela',testo:'Fate salire la ciurma. È una nave gratis.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'Tutto bene. Era solo abbandonata. Siete i nuovi proprietari. Qualcuno trova ancora caldo il minestrone sul fuoco.';return 'La nave riparte da sola alle tre di notte, con metà ciurma ancora a bordo. Li rivedrete fra una settimana, stranamente silenziosi.';},
        tipo:'', fn:()=>{if(Math.random()<.5){const n=G.navi[0];if(n){n.hp=Math.min(n.hpMax,n.hp+30);G.oro+=60;}}else{if(G.pirati.length>2)G.pirati.splice(0,Math.min(2,G.pirati.length-1));for(const p of G.pirati)p.umore=Math.max(10,p.umore-20);}}},
    ]
  },

  {
    id:'gabbiano_oracolo', tag:'Mare', peso:1,
    icona:'🕊', sfondo:'#0a1a30',
    titolo:'Il Gabbiano Profeta',
    testo:'Un gabbiano si posa sulla prua e non se ne va. Da tre giorni. I marinai giurano che predica sventure. Il cuoco vuole cucinarlo. Il navigatore dice che porta fortuna. Il gabbiano non esprime opinioni, ma ha mangiato le mappe della settimana scorsa.',
    scelte:[
      {etich:'Oracolo',testo:'Assecondate la superstizione: il gabbiano resta.',colore:'verde',
        esito:'Il gabbiano gracchia, torna in mare e ritorna con un pesce. Inspiegabilmente, i pirati trovano questo profetico. Il morale sale.',
        tipo:'bene', fn:()=>{G.cibo+=25;for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);}},
      {etich:'Pragmatismo',testo:'Cacciatelo. Le mappe non si mangiano.',colore:'rosso',
        esito:'Il gabbiano parte offeso. Quella notte, una tempestina modesta danneggia il tetto del magazzino. Coincidenza, sicuramente.',
        tipo:'male', fn:()=>{G.legno=Math.max(0,G.legno-20);for(const p of G.pirati)p.umore=Math.max(10,p.umore-10);}},
      {etich:'Gastronomia',testo:'Il cuoco aveva ragione. È la cena di stasera.',colore:'',
        esito:'Era sorprendentemente buono. Nessuno lo ammetterà mai. La ciurma è stranamente a disagio per una settimana.',
        tipo:'bene', fn:()=>{G.cibo+=15;for(const p of G.pirati)p.umore=Math.max(15,p.umore-5);}},
    ]
  },

];
const COOLDOWN_EVENTO_MIN=8;
