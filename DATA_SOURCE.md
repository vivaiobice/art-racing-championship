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

## Risultati, stati e scarto 9/10

Nel foglio `RISULTATI` la colonna opzionale `STATO` può contenere `FINISH`, `DNF`, `DNS` o `DSQ`. Se `STATO` è vuoto, una riga normale viene interpretata come `FINISH`; una riga con `PRESENTE=FALSE` viene interpretata come `DNS`. Il punteggio del round usa `PUNTI_TOTALI` quando valorizzato, altrimenti somma `PUNTI_BASE`, `BONUS_POLE` e `BONUS_GV`.

Fino a nove round registrati punti lordi e validi coincidono. Al decimo round il sito conteggia i migliori 9 risultati su 10: `FINISH`, `DNF` e `DNS` possono essere scartati, mentre un `DSQ` non è mai scartabile, anche quando vale zero punti. Lo stesso scarto viene riflesso nella classifica generale, nelle categorie MASTER/JUNIOR, nelle classifiche GR.3/GR.4 e nelle statistiche pilota. Non occorre cambiare il codice dopo una gara: è sufficiente aggiornare le righe del Google Sheet.

## Immagini panoramiche circuiti

La colonna opzionale `HERO_IMAGE` del foglio `GARE` è supportata. Per sicurezza sono accettati soltanto asset locali registrati nell'elenco applicativo e presenti nel progetto. Un valore registrato può sostituire l'immagine predefinita; se il campo è vuoto, esterno, non registrato o non valido, il sito associa automaticamente la fotografia locale del circuito. Se anche il circuito non è riconosciuto, resta attivo lo sfondo ART senza richieste verso file inesistenti.

Fotografie panoramiche predefinite:

- `assets/circuits/monza.webp`
- `assets/circuits/spa.webp`
- `assets/circuits/nurburgring.webp`
- `assets/circuits/redbull.webp`
- `assets/circuits/suzuka.webp`

Le gare 6-10 riutilizzano, nello stesso ordine, le fotografie delle gare 1-5. Autori, fonti e licenze sono documentati in `assets/circuits/CREDITS.md`.
