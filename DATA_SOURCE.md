# Sorgente dati ART Racing

Il sito legge i dati pubblici del campionato dal [Google Sheet ufficiale](https://docs.google.com/spreadsheets/d/e/2PACX-1vQA-2SDO_zKG6HIBYF5assTudawdI02Bf46HDmheh7_uz3o35QCFlbul6yJR-FkXtIxKnIL9ApFYy6R/pubhtml). Il codice non analizza la pagina HTML: usa esclusivamente i CSV pubblicati con questo schema:

`https://docs.google.com/spreadsheets/d/e/2PACX-1vQA-2SDO_zKG6HIBYF5assTudawdI02Bf46HDmheh7_uz3o35QCFlbul6yJR-FkXtIxKnIL9ApFYy6R/pub?gid=GID&single=true&output=csv`

| Tab | GID |
| --- | --- |
| PILOTI | 1295515495 |
| GARE | 994282550 |
| QUALIFICHE | 424528801 |
| RISULTATI | 1776540083 |
| CLASSIFICHE | 1147332322 |
| CONFIG | 1843954475 |

`js/live-data.js` centralizza URL, parsing, normalizzazione, cache in memoria e fallback. `index.html` usa piloti, scuderie, calendario e classifiche; `driver.html` usa anagrafica e statistiche; `race.html` usa gare, qualifiche e risultati; `lobby.html` usa le gare. Ogni pagina mostra subito `LOCAL_DATA` da `data.js`; se la rete o un CSV non sono disponibili, il sito resta navigabile con il roster ufficiale e il calendario locale.

Per verificare rapidamente un endpoint, aprire l’URL CSV sostituendo `GID` con il valore della tabella oppure eseguire `curl -fsSL "URL_CSV"`. Per aggiornare piloti, gare, qualifiche, risultati o classifiche basta pubblicare i nuovi valori nel Google Sheet: non occorre modificare `data.js`, il codice o creare un nuovo commit. Il service worker esclude i domini Google dalla propria cache, quindi un nuovo caricamento pagina legge i dati aggiornati.

## Immagini panoramiche circuiti

La colonna opzionale `HERO_IMAGE` del foglio `GARE` è supportata. Per sicurezza sono accettati soltanto percorsi locali nella forma `assets/circuits/nome-file.webp` (anche AVIF, JPG o PNG). Se il campo è vuoto o non valido, la card e la scheda gara mantengono lo sfondo ART attuale e non effettuano alcuna richiesta immagine.

File panoramici ancora da fornire, volutamente non sostituiti con loghi o sagome:

- `assets/circuits/monza.webp`
- `assets/circuits/spa.webp`
- `assets/circuits/nurburgring.webp`
- `assets/circuits/redbull.webp`
- `assets/circuits/suzuka.webp`

Quando i file saranno disponibili, aggiungere il percorso corrispondente nella colonna `HERO_IMAGE` delle gare interessate.
