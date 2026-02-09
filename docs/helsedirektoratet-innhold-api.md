# Helsedirektoratet Innhold-API (for KI-agenter)

Oppdatert: 2026-02-09

Dette dokumentet er en praktisk oversikt for prosjektet deres: etterligne helsedirektoratet.no med bedre sok/navigasjon.

## 1. Base URL og autentisering

- Prod base: `https://api.helsedirektoratet.no/innhold`
- QA base: `https://api-qa.helsedirektoratet.no/innhold`
- Header: `Ocp-Apim-Subscription-Key: <subscription-key>`
- Format: `Accept: application/json`

Viktig:

- Ikke legg API-nokler i repo/dokumentasjon.
- Bruk `.env.local` og miljo-variabler.

## 2. Viktigste prinsipp: bruk innholdsendepunktet som inngang

Helsedirektoratets side "Hvordan finne frem i innholdet" beskriver `GET /innhold/innhold` som hovedendepunkt.

Bruk dette som standard inngang for utforsking og filtrering.

Eksempler:

- `GET /innhold/innhold?infoTyper=rundskriv`
- `GET /innhold/innhold?infoTyper=nasjonal-veileder`
- `GET /innhold/innhold?kodeverk=ICPC-2&kode=X76`

Relaterte kall:

- `GET /innhold/innhold/{id}`
- `GET /innhold/innhold/rot` (testet 2026-02-09: `204 No Content` i prod)

## 3. Modell for navigasjon (fra offisiell oversikt)

Normerende innhold er bygd hierarkisk:

- Produkt (toppnode)
- Kapittel
- Normerende enhet
- Referanse og ev. PICO

Vanlig traversering i API:

- hent toppnode(r)
- folg `links` med `rel = barn`
- bruk `rel = forelder`/`root` for oppover-navigation

## 4. Mest relevante endepunkter for deres prosjekt

Dette er de viktigste for hovedinnhold pa helsedirektoratet.no:

- `GET /innhold/innhold`
- `GET /innhold/innhold/{id}`
- `GET /innhold/retningslinjer`
- `GET /innhold/retningslinjer/{id}`
- `GET /innhold/nasjonalt-forlop`
- `GET /innhold/nasjonalt-forlop/{id}`
- `GET /innhold/pakkeforlop-anbefalinger/{id}`
- `GET /innhold/nasjonal-veileder`
- `GET /innhold/nasjonal-veileder/{id}`
- `GET /innhold/prioriteringsveiledere`
- `GET /innhold/prioriteringsveiledere/{id}`
- `GET /innhold/anbefalinger`
- `GET /innhold/anbefalinger/{id}`
- `GET /innhold/rad`
- `GET /innhold/rad/{id}`
- `GET /innhold/faglig-rad`
- `GET /innhold/faglig-rad/{id}`
- `GET /innhold/picoer`
- `GET /innhold/picoer/{id}`
- `GET /innhold/takst-med-merknad`
- `GET /innhold/takst-med-merknad/{id}`
- `GET /innhold/rundskriv`
- `GET /innhold/rundskriv/{id}`
- `GET /innhold/lov-eller-forskriftstekst-med-kommentar`
- `GET /innhold/lov-eller-forskriftstekst-med-kommentar/{id}`
- `GET /innhold/paragraf-med-kommentar`
- `GET /innhold/paragraf-med-kommentar/{id}`
- `GET /innhold/regelverk-lov-eller-forskrift`
- `GET /innhold/regelverk-lov-eller-forskrift/{id}`
- `GET /innhold/veileder-lov-forskrift`
- `GET /innhold/veileder-lov-forskrift/{id}`
- `GET /innhold/rapporter`
- `GET /innhold/rapporter/{id}`
- `GET /innhold/statistikkelementer`
- `GET /innhold/statistikkelementer/{id}`
- `GET /innhold/tilskudd`
- `GET /innhold/tilskudd/{id}`
- `GET /innhold/veiledere`
- `GET /innhold/veiledere/{id}`
- `GET /innhold/veiledninger`
- `GET /innhold/veiledninger/{id}`

## 5. Andre eksponerte endepunkter (ofte mindre relevante for hovedinnhold)

Eksempler:

- `aktiviteter`, `artikler`, `filer`, `informasjoner`, `kapitler`, `seksjoner`, `publikasjoner`, `referanser`, `nyheter`, `konferanser`
- LIS-serien (`lis-laeringsmal`, `lis-spesialiteter`, osv.)
- legemiddel/utstyr/kvalitetsindikatorer (`legemidler`, `legemiddelvirkestoff`, `medisinskutstyr`, `kvalitetsindikatorer`)
- sok-endepunkt: `GET /innhold/sok/infobit`

Ta disse inn bare hvis dere faktisk trenger dem i produktet.

## 6. Parametere for `GET /innhold/innhold`

Fra offisiell side:

- `infoTyper` (teknisk navn pa innholdstype)
- `kodeverk`
- `kode`
- kombinasjoner av disse

Merk:

- Offisiell side bruker parameternavnet `infoTyper` (flertall).
- Eldre beskrivelser/eksempler kan bruke andre varianter (`infoType`). Bruk `infoTyper` som standard.

## 7. Tekniske navn (infoTyper) som er sentrale for dere

Direkte relevante tekniske navn:

- `retningslinje`
- `nasjonalt-forlop`
- `pakkeforlop-anbefaling`
- `nasjonal-veileder`
- `prioriteringsveileder`
- `anbefaling`
- `rad`
- `faglig-rad`
- `pico`
- `takst-med-merknad`
- `rundskriv`
- `lov-eller-forskriftstekst-med-kommentar`
- `paragraf-med-kommentar`
- `regelverk-lov-eller-forskrift`
- `veileder-lov-forskrift`
- `rapport`
- `statistikkelement`
- `tilskudd`
- `veileder`
- `veiledning`

Ogsa tilgjengelig i oversikten (kan bli relevante):

- `artikkel`, `nyhet`, `kapittel`, `referanse`, `fil`, `statistikk`, `generisk-produkt`, `generisk-normerende-enhet`

## 8. Responsstruktur dere bor forvente

Et typisk objekt (forkortet) fra `GET /innhold/innhold?infoTyper=...`:

```json
{
  "id": "0006-0011-...",
  "tittel": "...",
  "kortTittel": "...",
  "tekst": "<p>...</p>",
  "intro": "...",
  "sistOppdatert": "2026-01-21T11:33",
  "sistFagligOppdatert": "2024-12-30T00:00",
  "status": "Gjeldende",
  "tekniskeData": {
    "infoType": "rundskriv",
    "subtype": ""
  },
  "links": [
    {
      "rel": "barn",
      "type": "kapittel",
      "tittel": "Kapittel 1",
      "href": "https://api.helsedirektoratet.no/innhold/kapitler/..."
    }
  ],
  "url": "https://www.helsedirektoratet.no/..."
}
```

Praktisk:

- `tekst` inneholder ofte HTML.
- Bruk `links` + `rel` til tre/navigasjon.
- `id`-formatet er normalt: `kildekode-innholdstypekode-guid`.

## 9. Teststatus (snapshot 2026-02-09)

Verifisert med subscription key:

- `GET /innhold/retningslinjer`: `200`
- `GET /innhold/anbefalinger`: `200`
- `GET /innhold/rundskriv`: `200`
- `GET /innhold/innhold?infoTyper=rundskriv`: `200`
- `GET /innhold/innhold/rot`: `204`

Noen kall ga periodisk `503`/timeout i testvinduet:

- `GET /innhold/kapitler`
- `GET /innhold/informasjoner`
- `GET /innhold/sok/infobit`

Tolking:

- Endepunktene finnes, men stabiliteten varierer.
- Legg inn retry/backoff i klienten.

## 10. Anbefalt strategi i deres frontend/backend

1. Start med `GET /innhold/innhold?infoTyper=<produkttype>`.
2. Bruk `links(rel=barn)` for a bygge strukturtre.
3. Hent detaljer med `{id}`-endepunkter ved behov.
4. Behold originale API-felter i lagring (unnga tidlig hard normalisering).
5. Legg cache + retry + timeout policy rundt eksterne kall.

## 11. Kilder

- Utviklerportal: `https://utvikler.helsedirektoratet.no/`
- Hovedoversikt (brukt i dette dokumentet):
  `https://www.helsedirektoratet.no/om-oss/apne-data-api/hvordan-finne-frem-i-innholdet`
- Lokal bruk i kode:
  - `src/api/helsedir.ts`
  - `src/types/content/index.ts`
  - `src/components/content/RetningslinjeContentDisplay.tsx`

## 12. Endpoint-inventar (rapportert API-flate)

Dette er samlet endpoint-flate dere oppga. Ikke alle er like relevante for hovedinnhold/navigasjon.

- `/aktiviteter`, `/aktiviteter/{id}`
- `/anbefalinger`, `/anbefalinger/{id}`
- `/artikler`, `/artikler/{id}`
- `/data/{id}`
- `/faglig-rad`, `/faglig-rad/{id}`
- `/filer`, `/filer/{id}`
- `/generisk-normerende-enheter`, `/generisk-normerende-enheter/{id}`
- `/generisk-produkt`, `/generisk-produkt/{id}`
- `/get-changes`
- `/informasjoner`, `/informasjoner/{id}`
- `/innhold`, `/innhold/{id}`
- `/kapitler`, `/kapitler/{id}`
- `/konferanser`, `/konferanser/{id}`
- `/kvalitetsindikatorer`, `/kvalitetsindikatorer/{id}`, `/kvalitetsindikatorer/{id}/data`
- `/legemiddelvirkestoff`, `/legemiddelvirkestoff/{id}`, `/legemiddelvirkestoff/autofullfor`, `/legemiddelvirkestoff/sok`
- `/legemidler`, `/legemidler/{id}`, `/legemidler/autofullfor`, `/legemidler/EtterPakningsDato`, `/legemidler/pakningerEtter`, `/legemidler/refusjonsinformasjon/{id}`
- `/lis-forsider`, `/lis-forsider/{id}`
- `/lis-laeringsaktiviteter`, `/lis-laeringsaktiviteter/{id}`
- `/lis-laeringsmal`, `/lis-laeringsmal/{id}`
- `/lis-laeringsmalkategorier`, `/lis-laeringsmalkategorier/{id}`
- `/lis-spesialiteter`, `/lis-spesialiteter/{id}`
- `/lis-spesialitetsmapper`, `/lis-spesialitetsmapper/{id}`
- `/lov-eller-forskriftstekst-med-kommentar`, `/lov-eller-forskriftstekst-med-kommentar/{id}`
- `/lovtekst-med-merknad`, `/lovtekst-med-merknad/{id}`
- `/malsider`, `/malsider/{id}`
- `/medisinskutstyr`, `/medisinskutstyr/{id}`, `/medisinskutstyr/autofullfor`, `/medisinskutstyr/RegistrertEtter`, `/medisinskutstyr/sok`
- `/nasjonalt-forlop`, `/nasjonalt-forlop/{id}`
- `/nasjonal-veileder`, `/nasjonal-veileder/{id}`
- `/nyheter`, `/nyheter/{id}`
- `/pakkeforlop`, `/pakkeforlop/{id}`
- `/pakkeforlop-anbefalinger`, `/pakkeforlop-anbefalinger/{id}`
- `/paragraf-med-kommentar`, `/paragraf-med-kommentar/{id}`
- `/picoer`, `/picoer/{id}`
- `/prioriteringsveiledere`, `/prioriteringsveiledere/{id}`
- `/publikasjoner`, `/publikasjoner/{id}`
- `/rad`, `/rad/{id}`
- `/rapporter`, `/rapporter/{id}`
- `/referanser`, `/referanser/{id}`
- `/regelverk-lov-eller-forskrift`, `/regelverk-lov-eller-forskrift/{id}`
- `/retningslinjer`, `/retningslinjer/{id}`
- `/rundskriv`, `/rundskriv/{id}`
- `/seksjoner`, `/seksjoner/{id}`
- `/sok/infobit`
- `/statistikkelementer`, `/statistikkelementer/{id}`
- `/tilskudd`, `/tilskudd/{id}`
- `/veiledere`, `/veiledere/{id}`
- `/veileder-lov-forskrift`, `/veileder-lov-forskrift/{id}`
- `/veiledninger`, `/veiledninger/{id}`

## 13. Fulle responseksempler (JSON-filer)

Komplette responser er lagret som egne JSON-filer i `docs/api-response-examples/`.
Disse er tatt direkte fra API-et 2026-02-09 med `200 OK` og uten manuell forkorting.

- Rundskriv via generisk innholdsendepunkt:
  - kall: `GET /innhold/innhold/0006-0011-432ddeaa-7ea4-4632-be25-b7e2a8de7c76`
  - fil: `docs/api-response-examples/innhold-by-id-rundskriv.json`
- Retningslinje:
  - kall: `GET /innhold/retningslinjer/0006-0001-369db1c8-d564-4de9-9087-61812627e770`
  - fil: `docs/api-response-examples/retningslinje-by-id.json`
- Anbefaling:
  - kall: `GET /innhold/anbefalinger/0006-0002-2422fdad-c242-4175-921d-a7218670bbb4`
  - fil: `docs/api-response-examples/anbefaling-by-id.json`
- Kapittel:
  - kall: `GET /innhold/kapitler/0006-0041-5ba4c6d0-3a10-450e-946d-19e6da8202b3`
  - fil: `docs/api-response-examples/kapittel-by-id.json`
- Råd:
  - kall: `GET /innhold/rad/0006-0023-8ed73637-ebdb-4125-9d49-6a4b4b300050`
  - fil: `docs/api-response-examples/rad-by-id.json`
- Veileder til lov/forskrift:
  - kall: `GET /innhold/veileder-lov-forskrift/0006-0021-f3a4e42b-e872-4b68-a111-6b96faf0cd42`
  - fil: `docs/api-response-examples/veileder-lov-forskrift-by-id.json`
- Regelverk (lov eller forskrift):
  - kall: `GET /innhold/regelverk-lov-eller-forskrift/0006-0027-e3339811-521a-4dac-a3a8-b1fe2ae9ce4f`
  - fil: `docs/api-response-examples/regelverk-lov-eller-forskrift-by-id.json`

Oversiktsfil med endpoint + status + storrelse:

- `docs/api-response-examples/index.json`
