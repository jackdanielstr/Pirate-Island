// Isla del Diablo — events/crew_events.js
// Estratto da 18_events_ciurma.js nella modularizzazione v20.18.

// ═══════════════════════════════════════
// MODULO: EVENTS_CIURMA
// ═══════════════════════════════════════
// ── EVENTI CIURMA & ISOLA ──
EVENTI_NARRATIVI.push(
  // ── CIURMA ──
  {
    id:'rivolta_ciurma', tag:'Ciurma', peso:2,
    icona:'⚔', sfondo:'#1a0808',
    titolo:'La Rivolta della Ciurma',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un vecchio bucaniere';
      return nome+' si fa avanti con un\'espressione che non promette niente di buono. "Capitano, tre settimane senza bottino. Gli uomini parlano. Alcuni parlano anche di voi. Non è gentile."';
    },
    scelte:[
      {etich:'Autorità',testo:'"Chi comanda qui lo decido io. Chiunque non sia d\'accordo può nuotare."',colore:'rosso',
        esito:'Silenzio assoluto. Poi qualcuno tossisce. Poi tutti fingono di dover fare qualcosa di molto urgente altrove. Funziona.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(15,p.umore-10);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);}},
      {etich:'Diplomazia',testo:'Promettete una razzia entro tre giorni',colore:'verde',
        esito:'Le facce si distendono. "Tre giorni, Capitano." Qualcuno al fondo mormora: "Lo diceva anche il capitano precedente." Ignorate.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.cooldownRaid=0;}},
      {etich:'Generosità',testo:'Distribuite 100 oro. Comprate l\'amore.',colore:'',
        esito:'Occhi che brillano. Per questa notte la taverna risuona di canti in vostro onore. Domani torneranno a lamentarsi, ma oggi va bene.',
        tipo:'bene', fn:()=>{if(G.oro>=100){G.oro-=100;for(const p of G.pirati)p.umore=Math.min(100,p.umore+30);}else{for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}}},
    ]
  },

  {
    id:'pirata_ferito', tag:'Ciurma', peso:2,
    icona:'🩹', sfondo:'#1a1000',
    titolo:'Il Compagno Ferito',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un pirata';
      return nome+' è stato trovato a terra, febbricitante. Morso di serpente, dicono. Il chirurgo scuote la testa, poi aggiunge: "O forse è il cibo di ieri sera." Il cuoco protesta. Nessuno gli crede.';
    },
    scelte:[
      {etich:'Sacrificio',testo:'Spendete 60 oro per medicine rare',colore:'verde',
        esito:()=>{const p=G.pirati[0];return (p?p.nome:'Il pirata')+' si riprende lentamente. "Grazie, Capitano." Vi tende la mano. Ha ancora la febbre alta ma il gesto è commovente.';},
        tipo:'bene', fn:()=>{if(G.oro>=60){G.oro-=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}else aggMsg('Oro insufficiente. Il pirata aspetta con rassegnazione.','male');}},
      {etich:'Medicina alternativa',testo:'Il cuoco ha una ricetta della nonna: rum e aglio.',colore:'',
        esito:()=>{if(Math.random()<.5)return 'Miracolosamente, funziona. O forse era solo un\'indigestione. Comunque, il pirata è in piedi.';return 'Non funziona. Ma il pirata sopravvive lo stesso, con grande disappunto del cuoco che ci teneva alla sua reputazione.';},
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Fatalismo',testo:'"Il mare dà, il mare toglie. Il cuoco dà, il cuoco toglie."',colore:'rosso',
        esito:'Il pirata si riprende da solo, per dispetto. Però non dimentica. Non dimentica mai.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(5,p.umore-12);}},
    ]
  },

  {
    id:'duello', tag:'Ciurma', peso:2,
    icona:'🗡', sfondo:'#0a1020',
    titolo:'Il Duello all\'Alba',
    testo:()=>{
      const a=G.pirati[0], b=G.pirati[1];
      const n1=a?a.nome:'Due pirati', n2=b?b.nome:'litigano';
      return n1+' e '+n2+' si sono sfidati a duello. Motivo ufficiale: una questione d\'onore. Motivo reale, che tutti sanno: una scommessa su chi bevesse più rum. Entrambi ricordano a malapena di aver scommesso.';
    },
    scelte:[
      {etich:'Lascia fare',testo:'Il duello faccia il suo corso',colore:'',
        esito:'Lame che tintinnano nell\'alba. È più commedia che tragedia. Il vincitore non ricorda nemmeno cosa stesse difendendo. La ciurma applaude uguale.',
        tipo:'bene', fn:()=>{if(G.pirati.length>2)G.pirati.splice(Math.floor(Math.random()*Math.min(2,G.pirati.length)),1);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Autorità',testo:'Vietate il duello. Li fate abbracciare.',colore:'rosso',
        esito:'Brontolio nella folla. I due si stringono la mano con evidente disagio. La pace regna. Brevemente.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(5,p.umore-8);}},
      {etich:'Spettacolo',testo:'Organizzatelo ufficialmente. Scommesse aperte.',colore:'verde',
        esito:'Tifo, rum, lacrime di gioia e di dolore. Qualcuno vince una fortuna. Qualcuno perde i pantaloni letteralmente. La tensione sparisce in una nuvola di festa.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+22);}},
    ]
  },

  // ── ISOLA ──
  {
    id:'naufraghi', tag:'Isola', peso:2,
    icona:'🏝', sfondo:'#0a1a10',
    titolo:'I Naufraghi sulla Riva',
    testo:'Una decina di uomini e donne stremati raggiungono la spiaggia su una zattera. Sono i sopravvissuti di un galeone reale. Guardano la vostra bandiera con terrore. Il più alto di loro tira fuori un foglietto e dice: "Abbiamo preparato un discorso."',
    scelte:[
      {etich:'Clemenza',testo:'Accoglieteli come uomini liberi. Saltate il discorso.',colore:'verde',
        esito:'Alcuni restano, diventando lavoratori preziosi. Uno di loro, si scopre, era pasticcere di corte. Il morale raggiunge vette storiche.',
        tipo:'bene', fn:()=>{creaaPirata();creaaPirata();G.cibo=Math.max(0,G.cibo-20);G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);}},
      {etich:'Leva forzata',testo:'Arruolateli. Il discorso è vietato.',colore:'',
        esito:'Protestano, poi cedono. Nuove braccia, spiriti poco convinti, ma il pasticcere sforna comunque delle crostate eccellenti.',
        tipo:'bene', fn:()=>{creaaPirata();for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}},
      {etich:'Riscatto',testo:'Rinchiudeteli. La Marina pagherà.',colore:'rosso',
        esito:'La Marina pagherà bene. Il pasticcere piange in prigione. La ciurma lo sente. Si sente male per questo.',
        tipo:'male', fn:()=>{const n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++)catturaPrigioniero('Marina Reale');G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-15);}},
    ]
  },

  {
    id:'tesoro_nascosto', tag:'Isola', peso:2,
    icona:'💰', sfondo:'#1a1200',
    titolo:'La Mappa del Tesoro',
    testo:'Un vecchio pirata moribondo vi consegna con mano tremante un frammento di pergamena. "Sull\'isolotto a nord... scavate dove il corallo forma una croce." Sorride e chiude gli occhi. Poi li riapre. "E ricordate: la seconda croce non conta." Chiude di nuovo. Questa volta per davvero.',
    scelte:[
      {etich:'Spedizione',testo:'Mandate subito una nave. Prima croce.',colore:'verde',
        esito:()=>{const g=200+Math.floor(Math.random()*300);return 'La nave torna carica. '+g+' oro in monete antiche e gemme. Il vecchio diceva la verità. Sulla seconda croce non indagano.';},
        tipo:'bene', fn:()=>{const nave=G.navi.find(n=>!n.inMare);if(nave){const g=200+Math.floor(Math.random()*300);G.oro+=g;G.ricerca.punti+=25;}else{G.oro+=150+Math.floor(Math.random()*200);}}},
      {etich:'Prudenza',testo:'Decifrare la mappa. Quale croce è quale.',colore:'',
        esito:'Gli studiosi passano giorni a discutere della seconda croce. Alla fine scelgono la prima. Era quella giusta. Avrebbero potuto indovinare.',
        tipo:'bene', fn:()=>{G.oro+=180;G.ricerca.punti+=35;}},
      {etich:'Scetticismo',testo:'Un vecchio pazzo. Lasciate perdere.',colore:'rosso',
        esito:'Settimane dopo, una nave straniera torna da quell\'isolotto con bandiere festose e molto oro. La seconda croce non l\'hanno trovata nemmeno loro.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'spia_marina', tag:'Isola', peso:1,
    icona:'🕵', sfondo:'#0e0e1a',
    titolo:'La Spia della Corona',
    testo:'Il vostro capobanda vi porta in disparte. "Abbiamo pescato questo tizio che disegnava mappe del porto." L\'uomo ha l\'uniforme reale nascosta sotto stracci di pescatore. Porta anche un taccuino che descrive meticolosamente ogni edificio. Inclusa la taverna, con una stellina di apprezzamento.',
    scelte:[
      {etich:'Interrogatorio',testo:'Fate cantare la spia',colore:'rosso',
        esito:'"C\'è una spedizione punitiva in arrivo. Venti giorni." Aggiunge, non richiesto: "La taverna è davvero buona, però." Gli credete su entrambe le cose.',
        tipo:'bene', fn:()=>{G.oro+=50;G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Scambio',testo:'Usatela come pedina diplomatica',colore:'verde',
        esito:'"Noi rendiamo i vostri, voi fate finta di non vederci." Un accordo tacito. La spia, libera, torna con la stellina sul taccuino ancora intatta.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+20);G.oro+=40;}},
      {etich:'Esempio',testo:'Un esempio pubblico. La stellina non la salva.',colore:'rosso',
        esito:'La ciurma batte i piedi soddisfatta. La Marina non dimenticherà. La stellina sulla taverna, invece, era meritata.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-25);}},
    ]
  },

  {
    id:'pirata_inventore', tag:'Ciurma', peso:2,
    icona:'⚙', sfondo:'#0a1520',
    titolo:'L\'Inventore della Ciurma',
    testo:()=>{
      const p=G.pirati[Math.floor(Math.random()*G.pirati.length)];
      const nome=p?p.nome:'Un pirata';
      return nome+' si presenta con un disegno arrotolato. "Capitano, ho inventato un cannone che spara tre palle alla volta." Il disegno mostra qualcosa che assomiglia principalmente a una catapulta con ambizioni. "Ho solo bisogno di un po\' di materiali e di non essere interrotto per tre settimane."';
    },
    scelte:[
      {etich:'Finanziamento',testo:'Investite. L\'innovazione è il futuro.',colore:'verde',
        esito:()=>{if(Math.random()<.55)return 'Funziona! Quasi. Spara due palle e mezza, in senso molto stretto. Ma i nemici si confondono lo stesso.';return 'Non funziona. Ma il tentativo era così spettacolare che la ciurma lo rispetta di più. Il cannone ora è un ornamento.';},
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-60);G.legno=Math.max(0,G.legno-20);if(Math.random()<.55){G.ricerca.punti+=40;for(const n of G.navi)n.hp=Math.min(n.hpMax,n.hp+15);}else G.ricerca.punti+=20;}},
      {etich:'Scetticismo',testo:'"Molto bello. Torna alla tua postazione."',colore:'rosso',
        esito:'Il pirata arrotola il disegno con dignità. Lo trovate sotto il suo cuscino due settimane dopo, ancora fresco di correzioni.',
        tipo:'male', fn:()=>{const p=G.pirati[0];if(p)p.umore=Math.max(10,p.umore-15);}},
      {etich:'Compromesso',testo:'Dategli legno e una settimana. Poi basta.',colore:'',
        esito:'Produce qualcosa. Non è un cannone. Non è una catapulta. È unico. E stranamente, funziona.',
        tipo:'bene', fn:()=>{G.legno=Math.max(0,G.legno-30);G.ricerca.punti+=25;for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
    ]
  },

  {
    id:'cuoco_minaccia', tag:'Ciurma', peso:2,
    icona:'🍳', sfondo:'#1a0a00',
    titolo:'Il Cuoco si Dimette',
    testo:'Il cuoco — l\'unico a bordo che sa fare qualcosa di commestibile — entra nella vostra capanna con il grembiule piegato sul braccio. "Capitano, me ne vado. Voglio rispetto. Voglio spezie migliori. E voglio che smettano di chiamarmi Zuppa-di-Stivale." La ciurma fuori aspetta in silenzio. Sanno cosa si perde se parte.',
    scelte:[
      {etich:'Trattativa',testo:'Promettete spezie, rispetto e un soprannome migliore.',colore:'verde',
        esito:'"Don Pepito" resta. Quella sera serve una zuppa che fa piangere dalla bontà. Qualcuno piange davvero. Probabilmente per il sale.',
        tipo:'bene', fn:()=>{G.cibo+=40;for(const p of G.pirati)p.umore=Math.min(100,p.umore+18);}},
      {etich:'Capitolazione',testo:'Cedete su tutto. È il cuoco.',colore:'',
        esito:'Spendete oro per spezie pregiate. Vale ogni spicciolo. La ciurma mangia come re. Re pirati, ma comunque.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-50);G.cibo+=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+25);}},
      {etich:'Orgoglio',testo:'"Chiunque può cucinare. Vattene."',colore:'rosso',
        esito:'Il cuoco parte. Per tre giorni la ciurma tenta di cucinarsi da sola. Perdite nelle riserve di cibo inspiegabilmente alte. Il morale crolla. Qualcuno mangia il cappello.',
        tipo:'male', fn:()=>{G.cibo=Math.max(0,G.cibo-40);for(const p of G.pirati)p.umore=Math.max(5,p.umore-20);}},
    ]
  },

  {
    id:'ambasciatore_ridicolo', tag:'Politica', peso:2,
    icona:'📜', sfondo:'#101828',
    titolo:'L\'Ambasciatore della Corona',
    testo:'Arriva un\'imbarcazione con bandiera bianca e un uomo in parrucca imponente che si qualifica come "Ambasciatore Straordinario e Plenipotenziario di Sua Maestà per le Questioni di Pirateria Minore". Vi porta un documento di quarantasette pagine. La pagina uno è la copertina. La pagina due è un indice. La pagina quarantasette è la firma.',
    scelte:[
      {etich:'Diplomazia',testo:'Leggete (almeno) la prima e l\'ultima pagina.',colore:'verde',
        esito:'La Corona offre amnistia parziale in cambio di un tributo annuo. La parrucca dell\'ambasciatore si inclina di tre gradi durante la stretta di mano. Accordo.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+30);G.oro=Math.max(0,G.oro-80);}},
      {etich:'Teatralità',testo:'Bruciate il documento. Tenete l\'ambasciatore a cena.',colore:'',
        esito:'L\'ambasciatore, inspiegabilmente, si diverte moltissimo. Riparte con storie da raccontare. La parrucca resta leggermente storta per tutta la sera.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
      {etich:'Arroganza',testo:'Rispedite tutto indietro. Con una nota ironica.',colore:'rosso',
        esito:'La nota ironica viene letta ad alta voce a corte. Non viene apprezzata. La spedizione punitiva è ora schedulata con priorità alta.',
        tipo:'male', fn:()=>{G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-30);}},
    ]
  },

  {
    id:'profeta_isola', tag:'Mistero', peso:1,
    icona:'🔮', sfondo:'#100818',
    titolo:'Il Profeta dell\'Isola',
    testo:'Un vecchio vive da solo nelle colline. I pirati lo chiamano "Il Pazzo di Su". Oggi scende al porto per la prima volta in vent\'anni. "Il mare parlerà domani," dice. "Ascoltate il terzo gabbiano da sinistra." Poi torna su. Il terzo gabbiano da sinistra vi fissa.',
    scelte:[
      {etich:'Fede',testo:'Ascoltate il terzo gabbiano da sinistra.',colore:'verde',
        esito:()=>{if(Math.random()<.6)return 'Il gabbiano vola verso nordest. Mandate una nave. Tornano con oro e storie incredibili.';return 'Il gabbiano vola in cerchio per venti minuti e poi si addormenta su una roccia. Ma quella notte trovate 40 oro sul molo. Connessione poco chiara.';},
        tipo:'bene', fn:()=>{if(Math.random()<.6){G.oro+=120;G.ricerca.punti+=20;}else G.oro+=40;}},
      {etich:'Razionalità',testo:'"È un gabbiano. Andate a lavorare."',colore:'rosso',
        esito:'Il giorno dopo, il vecchio scende di nuovo. "L\'avevo detto." Poi risale. Non scende per altri vent\'anni.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'tartaruga_sacra', tag:'Mistero', peso:1,
    icona:'🐢', sfondo:'#061810',
    titolo:'La Tartaruga Sacra',
    testo:'Una tartaruga enorme — grande quanto una tavola da pranzo — si è installata all\'ingresso della vostra capanna. Non si muove. Tre pirati hanno già inciampato su di lei. La ciurma è divisa: metà la considera sacra, metà la considera cena. Voi siete l\'arbitro.',
    scelte:[
      {etich:'Sacralità',testo:'È un segno. La tartaruga resta e va rispettata.',colore:'verde',
        esito:'La tartaruga diventa la mascotte dell\'isola. La chiama Generale. I pirati sviluppano un affetto imbarazzante per lei. Il morale è alto, le caviglie meno.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);}},
      {etich:'Pragmatismo',testo:'Spostatela delicatamente lontano dalla porta.',colore:'',
        esito:'La tartaruga torna il giorno dopo. E quello dopo. La chiamate Generale per rassegnarvi. La situazione è invariata ma almeno ha un nome.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Gastronomia',testo:'La metà pragmatica aveva ragione.',colore:'rosso',
        esito:'Era effettivamente buona. La metà sacra non dimentica. Una tensione sottile avvelena l\'isola per settimane.',
        tipo:'male', fn:()=>{G.cibo+=30;for(const p of G.pirati)p.umore=Math.max(10,p.umore-15);}},
    ]
  }
);
