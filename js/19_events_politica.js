// ═══════════════════════════════════════
// MODULO: EVENTS_POLITICA
// ═══════════════════════════════════════
// ── EVENTI COMMERCIO, NATURA & MISTERO ──
EVENTI_NARRATIVI.push(
  // ── COMMERCIO ──
  {
    id:'carico_misterioso', tag:'Commercio', peso:2,
    icona:'📦', sfondo:'#101020',
    titolo:'Il Carico Senza Mittente',
    testo:'Al molo arriva una barca con tre casse sigillate. Il barcaiolo consegna un biglietto: "Per il Capitano dell\'Isla del Diablo. In anticipo." Nessun mittente, nessuna firma. Il barcaiolo, interrogato, dice di essere stato pagato da "un tipo". Descrizione: "normale".',
    scelte:[
      {etich:'Accettate',testo:'Aprite le casse. Il tipo normale è generoso.',colore:'verde',
        esito:()=>{if(Math.random()<0.6)return 'Oro, spezie pregiate e una bottiglia di rum invecchiato. Dono anonimo, qualità non anonima.';return 'Dentro: mappe di rotte commerciali riservate. Vale più dell\'oro. Il tipo normale era un contatto interessante.';},
        tipo:'bene', fn:()=>{if(Math.random()<0.6){G.oro+=130;G.rum+=20;}else{G.ricerca.punti+=40;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+10);}}},
      {etich:'Sospetto',testo:'Rispedite tutto. I regali senza firma puzzano.',colore:'rosso',
        esito:'Il barcaiolo riprende le casse con aria offesa. Forse era una trappola. Forse no. Non lo saprete mai. Il barcaiolo nemmeno.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'contrabbando', tag:'Commercio', peso:2,
    icona:'🧪', sfondo:'#0a1810',
    titolo:'L\'Offerta del Contrabbandiere',
    testo:'Un individuo dall\'aria losca — cappello calato sugli occhi, mantello per tre stagioni di troppo — vi avvicina. "Cinquanta barili di rum delle Indie. Non dichiarati. Metà prezzo." Vi mostra un campione. È il migliore rum che abbiate mai assaggiato in vita vostra, il che è molto preoccupante.',
    scelte:[
      {etich:'Affare',testo:'Comprate il lotto. Tutte le domande sono sospese.',colore:'verde',
        esito:'Il rum è straordinario. Per una settimana l\'isola è avvolta in un alone di felicità diffusa. Il navigatore traccia rotte migliori. Il cuoco cucina meglio. Nessuno capisce perché.',
        tipo:'bene', fn:()=>{if(G.oro>=80){G.oro-=80;G.rum+=80;for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}else aggMsg('Oro insufficiente. Il contrabbandiere scuote la testa deluso.','male');}},
      {etich:'Trattativa',testo:'50 oro e delle scorte. È pirateria, non carità.',colore:'',
        esito:'L\'uomo borbotta ma accetta. Stretta di mano sotto il cappello. Non vedete la sua faccia. Meglio così, probabilmente.',
        tipo:'bene', fn:()=>{if(G.oro>=50){G.oro-=50;G.cibo=Math.max(0,G.cibo-20);G.rum+=60;for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}}},
      {etich:'Delazione',testo:'Denunciate l\'uomo alla Marina. Buona cittadinanza.',colore:'rosso',
        esito:'La Marina vi ringrazia con un lasciapassare. I corsari vengono a sapere che avete denunciato un contrabbandiere. Si chiedono se siete ancora pirati o qualcos\'altro.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+15);G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-12);}},
    ]
  },

  {
    id:'mercante_falso', tag:'Commercio', peso:2,
    icona:'🤥', sfondo:'#181008',
    titolo:'Il Mercante Troppo Gentile',
    testo:'Un mercante si presenta con prezzi straordinariamente bassi. Spezie a un terzo del valore, seta quasi gratis, cannoni a prezzo di costo. Sorride molto. Troppo. Il vostro secondo ufficiale vi sussurra: "Capitano, quest\'uomo sorride come chi sta per venderci qualcosa che non esiste."',
    scelte:[
      {etich:'Ottimismo',testo:'Comprate tutto. Gli affari sono affari.',colore:'rosso',
        esito:()=>{if(Math.random()<.4)return 'Era tutto vero! Un mercante rovinato che liquidava tutto. Affare della vita.';return 'Le spezie erano segatura profumata. La seta era lino umido. I cannoni erano di legno dipinto. Il sorriso era reale, però.';},
        tipo:'', fn:()=>{if(Math.random()<.4){G.oro+=100;G.cibo+=40;G.rum+=20;}else{G.oro=Math.max(0,G.oro-90);aggMsg('Truffati dal mercante sorridente!','male');}}},
      {etich:'Prudenza',testo:'Fate ispezionare la merce prima di pagare.',colore:'verde',
        esito:'Il mercante sparisce durante l\'ispezione. Il che risponde alla domanda. La ciurma trova la sua barca nascosta tra le rocce.',
        tipo:'bene', fn:()=>{G.oro+=30;for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Contrattacco',testo:'Lo ingannate a vostra volta. Pirata contro pirata.',colore:'',
        esito:'Una trattativa elaborata in cui nessuno dei due dice la verità. Alla fine entrambi pareggiate le perdite e vi rispettate professionalmente.',
        tipo:'bene', fn:()=>{G.oro+=20;G.rum+=15;G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+8);}},
    ]
  },

  // ── NATURA ──
  {
    id:'tempesta_imminente', tag:'Natura', peso:2,
    icona:'⛈', sfondo:'#0a0a18',
    titolo:'La Tempesta in Arrivo',
    testo:'Il cielo a ovest è verde. I gabbiani fuggono. Il navigatore anziano annuisce grave: "Capitano, quella non è una burrasca normale." Pausa drammatica. "Quella è una burrasca molto molto normale, ma enorme." La distinzione è importante.',
    scelte:[
      {etich:'Preparazione',testo:'Mettete tutto al sicuro. Aspettate.',colore:'verde',
        esito:'La tempesta è violenta ma breve. L\'isola regge. Qualche albero caduto. Il cuoco ha usato il tempo per preparare una zuppa. La chiama "Zuppa della Tempesta". È la migliore di sempre.',
        tipo:'bene', fn:()=>{G.cibo=Math.max(0,G.cibo-10);for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}},
      {etich:'Avventura',testo:'Mandate una nave. I relitti valgono oro.',colore:'rosso',
        esito:()=>{if(Math.random()<.45)return 'La nave torna con un carico di relitti preziosi. Rischio calcolato, risultato ottimo.';return 'La nave torna quasi affondata. Il capitano giura che ne è valsa la pena. Nessuno gli crede. La nave nemmeno.';},
        tipo:'', fn:()=>{const nave=G.navi.find(n=>!n.inMare);if(nave){if(Math.random()<.45){G.oro+=180;G.rum+=30;}else nave.hp=Math.max(10,Math.floor(nave.hpMax*.2));}}},
      {etich:'Rassegnazione',testo:'Portate le navi al riparo. Il resto si vede.',colore:'',
        esito:'La flotta è salva. Qualche struttura in meno. Il magazzino della legna è esploso in maniera spettacolare. Nessuno era dentro. Fortuna.',
        tipo:'bene', fn:()=>{G.legno=Math.max(0,G.legno-40);for(const p of G.pirati)p.umore=Math.max(10,p.umore-5);}},
    ]
  },

  {
    id:'vulcano_minore', tag:'Natura', peso:1,
    icona:'🌋', sfondo:'#1a0500',
    titolo:'Il Vulcano si Sveglia',
    testo:'Il piccolo vulcano al centro dell\'isola — che tutti chiamavano "quella collina calda" — ha iniziato a fumare. Non in modo preoccupante, dice il geologo che non avete (quindi nessuno lo dice). I pirati sono divisi tra "è normale" e "non è normale". Il vulcano non partecipa al dibattito.',
    scelte:[
      {etich:'Indifferenza',testo:'"È fumo. I vulcani fumano. Avanti."',colore:'',
        esito:'Il vulcano sbuffa per tre giorni poi si calma. Era normale. I pirati un po\' delusi dall\'esito banale della faccenda.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+5);}},
      {etich:'Evacuazione',testo:'Portate tutto a bordo. Per precauzione.',colore:'verde',
        esito:'L\'operazione dura dodici ore caotiche. Il vulcano non fa niente. Ma trovate delle gemme vulcaniche nella lava raffreddata. Un rimborso.',
        tipo:'bene', fn:()=>{G.oro+=60;G.ricerca.punti+=15;for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);}},
      {etich:'Opportunismo',testo:'Scalate il vulcano. Ci sono minerali preziosi.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'Trovate gemme e minerali rari. Il vulcano collabora. Buon vulcano.';return 'Il vulcano emette un singolo sbuffo di gas sulfureo proprio mentre salite. Tutti tornano con le sopracciglia ridotte.';},
        tipo:'', fn:()=>{if(Math.random()<.5){G.oro+=80;G.ricerca.punti+=25;}else{for(const p of G.pirati)p.umore=Math.max(5,p.umore-15);aggMsg('Sopracciglia perse sull\'avventura vulcanica.','male');}}},
    ]
  },

  // ── MAGIA/MISTERO ──
  {
    id:'fantasma', tag:'Mistero', peso:1,
    icona:'👻', sfondo:'#080818',
    titolo:'Il Fantasma del Porto',
    testo:'Da tre notti, le guardie vedono una figura luminosa camminare sulle acque. Stamane, sul molo, le lettere incise: "CERCATE IL BAULE ROSSO". Sotto, in grafia più piccola e meno decisa: "per favore".',
    scelte:[
      {etich:'Cercate',testo:'Dragate il fondale. Il fantasma è educato.',colore:'verde',
        esito:()=>{const g=80+Math.floor(Math.random()*150);return 'Sul fondo emerge un baule rosso marcio. '+g+' monete d\'oro antico e un orologio che non si è fermato. Il fantasma non si vede più. Sembra soddisfatto.';},
        tipo:'bene', fn:()=>{G.oro+=80+Math.floor(Math.random()*150);G.ricerca.punti+=20;}},
      {etich:'Ignorate',testo:'"Marinaio ubriaco che incide cose." ',colore:'rosso',
        esito:'La figura smette di apparire. Ma qualcuno giura di averla vista scuotere la testa. Triste. La ciurma si sente vagamente in colpa.',
        tipo:'male', fn:()=>{for(const p of G.pirati)p.umore=Math.max(10,p.umore-8);}},
    ]
  },

  {
    id:'straniero_sapiente', tag:'Mistero', peso:2,
    icona:'🧙', sfondo:'#0a1020',
    titolo:'Il Cartografo Misterioso',
    testo:'Un vecchio dall\'aspetto stanco si presenta al molo con una mappa enorme sotto il braccio. "Ho mappato ogni rotta commerciale del Mediterraneo per trent\'anni," dice. "Ora voglio un posto dove stare e rum a volontà." Non chiede altro. È o un genio o un pazzo. Probabilmente entrambi.',
    scelte:[
      {etich:'Ospitalità',testo:'Ha una casa e rum illimitato. Le mappe sono vostre.',colore:'verde',
        esito:'Le mappe sono straordinarie. Ogni rotta commerciale, ogni pattuglia reale, ogni corrente. Il vecchio beve il vostro rum con la serena dignità di chi sa di valere ogni goccia.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-20);G.ricerca.punti+=50;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+15);}},
      {etich:'Trattativa',testo:'Una casa e rum ragionevole. Le mappe vanno copiate.',colore:'',
        esito:'Accetta. Beve con moderazione ostentata. Le copie delle mappe sono quasi altrettanto buone degli originali.',
        tipo:'bene', fn:()=>{G.ricerca.punti+=30;G.fazioni.mercante.rep=Math.min(100,G.fazioni.mercante.rep+8);}},
      {etich:'Scetticismo',testo:'Chiunque può disegnare una mappa e chiamarla rara.',colore:'rosso',
        esito:'Il vecchio annuisce, arrotola le mappe e se ne va. Una settimana dopo, un vostro rivale lo trova. Le mappe erano reali.',
        tipo:'male', fn:()=>{}},
    ]
  },

  {
    id:'maledizione_rum', tag:'Mistero', peso:1,
    icona:'🍺', sfondo:'#180808',
    titolo:'Il Rum Maledetto',
    testo:'Il cuoco riferisce che tre barili di rum hanno cambiato colore da ieri sera: da ambrato a viola. Odore normale, sapore identico. Il primo pirata che ha assaggiato giura di aver visto i pesci parlare per un\'ora. Li ha descritti come "interessanti conversatori". Non ricorda i dettagli.',
    scelte:[
      {etich:'Consumo',testo:'Rum viola è ancora rum. Distribuitelo.',colore:'rosso',
        esito:()=>{if(Math.random()<.5)return 'La ciurma passa una notte molto strana. Nessuno si fa male. Al mattino il rum è tornato ambrato. I pesci non commentano.';return 'Effetti collaterali: tre pirati si rifiutano di dormire, uno costruisce qualcosa di inspiegabile con del legno, il navigatore tracia le rotte migliori della sua vita. Un successo.';},
        tipo:'', fn:()=>{if(Math.random()<.5){for(const p of G.pirati)p.umore=Math.max(15,p.umore-10);}else{for(const p of G.pirati)p.umore=Math.min(100,p.umore+15);G.ricerca.punti+=20;}}},
      {etich:'Prudenza',testo:'Gettate i barili. Viola non è un colore del rum.',colore:'verde',
        esito:'I barili finiscono in mare. I pesci nei paraggi si comportano in modo insolito per tre giorni. Nessuno ne parla apertamente.',
        tipo:'bene', fn:()=>{for(const p of G.pirati)p.umore=Math.min(100,p.umore+8);}},
      {etich:'Scienza',testo:'Studiatelo. Potrebbero esserci applicazioni pratiche.',colore:'',
        esito:'Tre settimane di esperimenti. Scoperta: il rum viola è rum normale con alghe violacee cadute accidentalmente. Risultato scientifico: deludente. Rum recuperato: moderatamente.',
        tipo:'bene', fn:()=>{G.rum+=15;G.ricerca.punti+=18;}},
    ]
  },

  {
    id:'diplomatico_corsaro', tag:'Politica', peso:2,
    icona:'☠', sfondo:'#1a0808',
    titolo:'Il Consiglio dei Corsari',
    testo:'Un messaggero corsaro porta un invito al "Gran Consiglio dei Liberi Mari", raduno annuale di capitani pirati. Si tiene su un\'isola neutrale. Ogni capitano porta rum, oro e una storia da raccontare. Niente armi. Niente tradimenti. Per tradizione.',
    scelte:[
      {etich:'Partecipazione',testo:'Andate. Con rum, oro e la storia migliore.',colore:'verde',
        esito:'Tre giorni di accordi, alleanze e storie sempre più improbabili. Tornate con contatti preziosi, una reputazione migliore e i postumi di una festa epica.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-60);G.rum=Math.max(0,G.rum-30);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+35);for(const p of G.pirati)p.umore=Math.min(100,p.umore+20);}},
      {etich:'Prudenza',testo:'Non vi fidate dei tradimenti "per tradizione".',colore:'',
        esito:'Non andate. Il consiglio va bene per gli altri. Vi perdete un accordo vantaggioso ma anche un potenziale tranello.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+5);}},
      {etich:'Ambizione',testo:'Andate. Portate armi. Non per la tradizione.',colore:'rosso',
        esito:'Venite scoperti all\'ingresso. La guardia corsara vi fissa. "Tutti portano armi. La regola è non parlarne." Enorme disagio. Superato con rum supplementare.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-40);G.rum=Math.max(0,G.rum-20);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+18);for(const p of G.pirati)p.umore=Math.min(100,p.umore+12);}},
    ]
  },

  {
    id:'burocrazia_marina', tag:'Politica', peso:2,
    icona:'📋', sfondo:'#0a0e1a',
    titolo:'Il Funzionario della Corona',
    testo:'Un funzionario reale — magro, inchiostro sulle dita, espressione di chi non ha dormito bene dal 1689 — vi porta una notifica ufficiale. La pirateria nella vostra zona è "non autorizzata". Dovete compilare il "Modulo di Richiesta di Licenza per Attività Maritime Non Convenzionali". È in triplice copia.',
    scelte:[
      {etich:'Conformità',testo:'Compilate il modulo. Triplice copia inclusa.',colore:'verde',
        esito:'Il funzionario esamina i moduli per quarantadue minuti. "Manca il timbro nella casella D." Trenta minuti dopo: "Approvato provvisoriamente." Non capite cosa voglia dire. Lui nemmeno.',
        tipo:'bene', fn:()=>{G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+20);G.oro=Math.max(0,G.oro-30);}},
      {etich:'Corruzione',testo:'Il modulo vale meno di 50 oro. Diretti.',colore:'',
        esito:'Il funzionario guarda l\'oro. Guarda il modulo. Guarda l\'oro. Piega il modulo. "Consideratevi autorizzati." Parte soddisfatto di entrambi.',
        tipo:'bene', fn:()=>{G.oro=Math.max(0,G.oro-50);G.fazioni.reale.rep=Math.min(100,G.fazioni.reale.rep+10);}},
      {etich:'Rifiuto',testo:'"Non siamo il tipo di pirati che compila moduli."',colore:'rosso',
        esito:'Il funzionario annota qualcosa su un altro modulo. Salpa. Le conseguenze arriveranno via posta ufficiale, probabilmente in triplice copia.',
        tipo:'male', fn:()=>{G.fazioni.reale.rep=Math.max(-100,G.fazioni.reale.rep-20);}},
    ]
  },

  {
    id:'concorrente_pirata', tag:'Politica', peso:2,
    icona:'🏴', sfondo:'#1a0a00',
    titolo:'Il Capitano Rivale',
    testo:()=>{
      const nomi=['Ferro Gonzalez','La Vedova Nera','Capitan Zampone','Il Magnifico Errore','Dente d\'Arrugine'];
      const nome=nomi[Math.floor(Math.random()*nomi.length)];
      return nome+' ha stabilito una base sull\'isolotto vicino. Vi manda un messaggio: "Questo mare è abbastanza grande per due capitani." Poi ne manda un secondo: "Ma sarebbe più comodo per uno solo." Poi un terzo: "Pace?"';
    },
    scelte:[
      {etich:'Alleanza',testo:'Pace. Il mare è grande per tutti.',colore:'verde',
        esito:'Strette di mano, rum condiviso, accordo di non interferenza. Il rivale è affidabile quanto può esserlo un pirata. Cioè abbastanza.',
        tipo:'bene', fn:()=>{G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+20);G.oro+=50;}},
      {etich:'Pressione',testo:'Il mare è grande, ma l\'isolotto vicino è vostro.',colore:'rosso',
        esito:'Il rivale se ne va dopo una settimana di tensione. Lascia una nota: "La prossima volta mando tre messaggi meno educati." Minaccia, probabilmente.',
        tipo:'male', fn:()=>{G.oro+=30;G.fazioni.corsaro.rep=Math.max(-100,G.fazioni.corsaro.rep-10);}},
      {etich:'Curiosità',testo:'Invitatelo a cena prima di decidere.',colore:'',
        esito:'È simpatico. Storie straordinarie. Ordina rum come se fosse la sua ultima notte. Accordo raggiunto a metà cena, tra risate e qualcosa che sembrava una promessa.',
        tipo:'bene', fn:()=>{G.rum=Math.max(0,G.rum-20);G.fazioni.corsaro.rep=Math.min(100,G.fazioni.corsaro.rep+15);for(const p of G.pirati)p.umore=Math.min(100,p.umore+10);}},
    ]
  }
);
