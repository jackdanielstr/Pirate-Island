# Isla del Diablo — versione modulare v20.11

Refactor modulare del file monolitico `pirate_v20_10_bugfix_sentieri.html`.

## Avvio rapido

Apri `index.html` nel browser.

Se il browser blocca script locali, avvia un piccolo server nella cartella:

```bash
python -m http.server 8000
```

poi apri `http://localhost:8000`.

## Struttura

- `index.html` — markup principale e import degli script.
- `css/style.css` — tutto lo stile estratto dal file originale.
- `js/` — logica divisa in moduli caricati in ordine.
- `legacy/` — copia monolitica di sicurezza della versione di partenza.

## Moduli JS

- `js/00_music.js`
- `js/01_state.js`
- `js/02_map.js`
- `js/03_renderer_tiles.js`
- `js/04_renderer_nature.js`
- `js/05_renderer_iso.js`
- `js/06_renderer_buildings.js`
- `js/07_renderer_units.js`
- `js/08_renderer_scene.js`
- `js/09_schiavi.js`
- `js/10_edifici_hud.js`
- `js/11_avvio_gioco.js`
- `js/12_costruzione.js`
- `js/13_navi_raid.js`
- `js/14_raid_sequence.js`
- `js/15_prigione_commercio.js`
- `js/16_tick.js`
- `js/17_events_mare.js`
- `js/18_events_ciurma.js`
- `js/19_events_politica.js`
- `js/20_events_logic.js`
- `js/21_ui_panel.js`
- `js/22_ui_pirate.js`
- `js/23_ui_views.js`
- `js/24_ui_manage.js`
- `js/25_input.js`
- `js/26_pathfinding.js`
- `js/27_portrait.js`
- `js/28_core.js`
- `js/29_main.js`

## Nota tecnica

Per ridurre il rischio di regressioni, questa prima modularizzazione usa script classici caricati in ordine con `defer`, non ES modules.
Così le funzioni globali richiamate dall'HTML restano compatibili.

## v20.12 - Rete sentieri centrale
- Gli edifici isolati producono meno: 100% se collegati a porto/palazzo, 70% con sentiero vicino, 40% se isolati.
- Anche la produzione degli schiavi usa l'efficienza della rete stradale.
- Gli schiavi trasportatori seguono percorsi A* e preferiscono i sentieri invece di tagliare in linea retta.
- Popup e indicatori edificio mostrano lo stato della rete sentieri.
