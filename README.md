## 🏝️ PIRATE ISLAND - Tropico 2 Style 🏴‍☠️

Un'affascinante simulazione di gestione isola nello stile di **Tropico 2**, dove puoi governare la tua isola paradisiaca come El Presidente!

### 📋 Caratteristiche Principali

- **Dashboard Completa**: Monitora economia, popolazione, risorse e stabilità politica
- **Costruzione di Edifici**: Erige fabbriche, resort, ospedali e fortezze
- **Gestione Risorse**: Zucchero, tabacco, rum e turismo
- **Sistema di Popolazione**: La felicità dei cittadini influenza la crescita
- **Missioni**: Obiettivi progressivi per conquistare il titolo di eroe dell'isola
- **Eventi Casuali**: Sorprese positive e negative che cambiano il corso del gioco
- **Salvataggio Automatico**: Il tuo progresso viene salvato automaticamente

### 🎮 Come Giocare

1. **Accedi al Dashboard**: Visualizza lo stato attuale della tua isola
2. **Costruisci Edifici**: Investi denaro per costruire strutture che producono reddito
3. **Gestisci Risorse**: Controlla la produzione di zucchero, tabacco e rum
4. **Mantieni Felicità**: Una popolazione felice = isola prospera
5. **Completa Missioni**: Raggiungi gli obiettivi per diventare un eroe

### 🏗️ Struttura del Progetto

```
Pirate-Island/
├── index.html          # Pagina principale con layout HTML
├── css/
│   └── styles.css      # Stili CSS tema tropicale
├── js/
│   └── game.js         # Logica di gioco e simulazione
└── README.md           # Questo file
```

### 📊 Sistema di Gioco

#### Economia
- **Tesoro**: Le tue finanze personali
- **Reddito Giornaliero**: Proventi da edifici e turismo
- **Spese Giornaliere**: Costi per mantenere l'isola

#### Popolazione
- **Felicità**: Percentuale di cittadini contenti (0-100%)
- **Lealtà**: Quanto i cittadini ti sostengono
- **Salute**: Qualità della vita sull'isola
- **Educazione**: Livello di istruzione della popolazione

#### Risorse
- **Zucchero**: Coltura principale, alta domanda
- **Tabacco**: Lusso, buon profitto
- **Rum**: Specialità locale, alta qualità

#### Stabilità Politica
- Mantieni alta la stabilità per evitare rivolte
- Costruisci fortezze per la difesa
- Mantieni i cittadini felici

### 🎯 Missioni Principali

1. **Stabilizza l'Economia**: Accumula $100.000 nel tesoro
2. **Espandi il Regno**: Costruisci 10 edifici
3. **Felicità Popolare**: Mantieni felicità > 80%
4. **Eroe dell'Isola**: Completa tutte le altre missioni

### 🛠️ Edifici Disponibili

| Edificio | Costo | Funzione |
|----------|-------|----------|
| Casa | $100 | Alloggi per cittadini |
| Fabbrica Zucchero | $500 | Produzione zucchero |
| Fabbrica Tabacco | $600 | Produzione tabacco |
| Distilleria Rum | $800 | Produzione rum |
| Resort Turistico | $1000 | Attrae turisti |
| Fortezza | $1200 | Difesa militare |
| Ospedale | $900 | Cura cittadini |
| Università | $1100 | Educazione |

### 💾 Salvataggio del Gioco

Il gioco salva automaticamente il tuo progresso usando il browser's **localStorage**.
Per resettare completamente: apri la console (F12) e digita `resetGame()`

### 🚀 Funzionalità Future

- [ ] Sistema di commercio con altre isole
- [ ] Diplomazia e negoziazioni
- [ ] Ricerca tecnologica
- [ ] Personaggi notabili con personalità
- [ ] Cortometraggi satirici nello stile Tropico
- [ ] Modalità sfida con obiettivi specifici
- [ ] Multiplayer locale

### 🎨 Tema Visivo

Il design è ispirato al celebre Tropico 2 con:
- Colori tropicali (azzurro cielo, arancione, oro)
- Interfaccia intuitiva e colorata
- Emoji per un tocco moderno e divertente
- Design responsivo per tutti i dispositivi

### 📱 Compatibilità

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet
- ✅ Mobile

### 🧪 Modalità Debug (Console)

Nel browser, puoi testare usando la console:
```javascript
gameState              // Visualizza lo stato del gioco
saveGame()             // Salva manualmente
resetGame()            // Resetta il gioco
gameState.treasury += 10000  // Aggiungimi soldi! (solo test)
```

### 🤝 Contributi

Vuoi aggiungere nuove feature? Crea una pull request!

### 📜 Licenza

Questo progetto è ispirato a Tropico 2 ed è creato per scopi educativi.

---

**Viva la Dittatura Benevolente!** 👑🏴‍☠️

*Ultima modifica: Aprile 2026*
