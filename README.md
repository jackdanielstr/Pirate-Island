# Isla del Diablo — v20.18 struttura reale

Questa versione mantiene il gameplay della v20.17 ma sposta i file JavaScript in cartelle reali, visibili su GitHub.

## Avvio
Apri `index.html` da un server locale o da GitHub Pages.

## Struttura

```txt
index.html
css/style.css
js/
  audio/music.js
  core/
  world/
  rendering/
  simulation/
  raid/
  events/
  ui/
  input/
  data/
legacy/
docs/
```

## Nota importante
I file non usano ancora `import/export` ES Modules: sono script globali caricati in ordine da `index.html`.
Questo evita rotture e mantiene compatibilità con il codice esistente. Il prossimo passo potrà essere convertire gradualmente i moduli a ES Modules veri.

## Mappa file
Vedi `docs/FILE_MAP.md`.
