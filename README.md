# e-lektioner

Små interaktiva verktyg att visa i klassrummet, sorterade efter ämne.

**Sajten:** https://solrankos.github.io/e-lektioner/

## Verktyg

### Geografi
- [Globen och gradnätet](https://solrankos.github.io/e-lektioner/geografi/globen-och-gradnatet/)

## Struktur

Ren HTML, CSS och JavaScript utan byggsteg. GitHub Pages serverar `main`-grenen direkt.

```
index.html                     startsida
assets/css/site.css            gemensamma färger, typsnitt och sidhuvud
assets/js/theme.js             ljust/mörkt läge
assets/fonts/                  Atkinson Hyperlegible (SIL OFL 1.1)
assets/vendor/                 d3 v7.8.5 (ISC)
<ämne>/<verktyg>/index.html    ett verktyg
```

Allt laddas från repot, inga externa tjänster.

### Lägga till ett verktyg
1. Skapa `<ämne>/<verktyg>/index.html` med sidhuvudet från ett befintligt verktyg.
2. Lägg till ett kort under rätt ämne i `index.html` (skapa ämnet om det saknas).

### Köra lokalt

```bash
python3 -m http.server 8000
```

Öppna http://localhost:8000/.

## Licens

- Kod: [MIT](LICENSE)
- Innehåll (texter och pedagogiskt material): [CC BY 4.0](LICENSE-CONTENT)
- Typsnittet Atkinson Hyperlegible: [SIL OFL 1.1](assets/fonts/OFL.txt)
- d3: ISC
