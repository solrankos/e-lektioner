# e-lektioner

Små interaktiva verktyg att visa i klassrummet, sorterade efter ämne.

**Sajten:** https://solrankos.github.io/e-lektioner/

## Verktyg

### Geografi
- [Globen och gradnätet](https://solrankos.github.io/e-lektioner/geografi/globen-och-gradnatet/)
- [Placera koordinaten](https://solrankos.github.io/e-lektioner/geografi/placera-koordinaten/)
- [Huvudstäder](https://solrankos.github.io/e-lektioner/geografi/huvudstader/)
- [Länder på kartan](https://solrankos.github.io/e-lektioner/geografi/lander-pa-kartan/)

### Pedagogik
- [Blooms taxonomi](https://solrankos.github.io/e-lektioner/pedagogik/blooms-taxonomi/)

## Struktur

Ren HTML, CSS och JavaScript utan byggsteg. GitHub Pages serverar `main`-grenen direkt.

```
index.html                     startsida
assets/css/site.css            gemensamma färger, typsnitt och sidhuvud
assets/js/theme.js             ljust/mörkt läge
assets/js/forhor.js            förhör i omgångar (skriva själv med förslag, statistik)
assets/css/forhor.css          utseende för förhören
assets/js/lander.js            världens länder med huvudstad och världsdel
assets/fonts/                  Atkinson Hyperlegible (SIL OFL 1.1)
assets/vendor/                 d3 v7.8.5 (ISC), echarts 4.9.0 världskarta (Apache-2.0)
<ämne>/<verktyg>/index.html    ett verktyg
```

Allt laddas från repot, inga externa tjänster.

### Lägga till ett verktyg
1. Skapa `<ämne>/<verktyg>/index.html` med sidhuvudet från ett befintligt verktyg.
2. Lägg till ett kort under rätt ämne i `index.html` (skapa ämnet om det saknas).

### Återanvända förhöret
`Forhor.start({...})` i `assets/js/forhor.js` sköter omgångar, skrivsvar med förslag, stavningstolerans, statistik och sparning. Sidan ger:
- `el`, `storeKey`, `title`, `parentNote`, `noun` (`["fråga", "frågor"]`)
- `groups`: `[{id, name}]`, val överst; framsteg sparas per grupp
- `items(groupId)`: frågeobjekt med unikt `id`
- `intro(antal)`, `name(item)`, valfritt `statLabel(item)` och `settings` (egna val)
- `question(item, settings)`: `{ask, subject}` eller `render(slot)`, samt `correct` (facit), `key` och `pool` (`[{key, names}]`) som används både för rättning och för förslagen när man skriver
- valfritt `onAnswer(item, ok)`

Se `geografi/huvudstader/` för en textfråga och `geografi/lander-pa-kartan/` för en egen frågevy.

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
- echarts världskarta: Apache-2.0
