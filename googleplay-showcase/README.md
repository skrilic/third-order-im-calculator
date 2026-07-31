# Google Play Showcase Kit - Intermod RF Sites

Ova mapa sadrži sve potrebne materijale za objavu aplikacije na **Google Play Console**:

## Datoteke s opisom aplikacije

1. **`STORE_LISTING_HR.md`** – Kompletan tekstualni sadržaj za Google Play na **hrvatskom jeziku**:
   - Naslov aplikacije (Intermod RF Sites)
   - Kratki opis (do 80 znakova)
   - Cjeloviti opis s grafičkim oznakama i značajkama
   - Oznake i ključne riječi (Keywords)
   - Kategorizacija (Tools / Productivity, PEGI 3)

2. **`STORE_LISTING_EN.md`** – Kompletan tekstualni sadržaj za Google Play na **engleskom jeziku**:
   - App Title
   - Short Description (max 80 chars)
   - Full Description
   - Keywords & Tags
   - Categorization

---

## Smjernice za snimke zaslona (Screenshots Guidelines for Google Play)

Google Play Console zahtijeva minimalno **2 do 8 snimki zaslona** po vrsti uređaja (Mobitel, 7" Tablet, 10" Tablet).

### Preporučene dimenzije:
- **Mobitel (Phone)**: `1080 x 1920` px (16:9) ili `1080 x 2400` px (20:9)
- **Tablet (7-inch / 10-inch)**: `1200 x 1920` px ili `1600 x 2560` px

### Preporučeni redoslijed snimki zaslona:

1. **`01_locations_map.png`** – **Karta radijskih lokacija s popisem lokacija**
   - Prikaz početne stranice s pribadačama lokacija na karti i spremljenim lokacijama ispod.
2. **`02_satellite_view.png`** – **Satelitska karta visoke rezolucije (Esri)**
   - Prikaz satelitskog sloja karte koji prikazuje teren i objekte.
3. **`03_manual_calculation.png`** – **Kalkulator odašiljača i frekvencija**
   - Prikaz ručnog unosa odašiljača i frekvencija za izračun produkata.
4. **`04_intermod_results.png`** – **Tabela rezultata s numeričkim filtriranjem (AG-Grid)**
   - Prikaz izračunatih IM3 produkata s otvorenim numeričkim filterom (npr. 108.00 <= f <= 135.50 MHz).
5. **`05_app_settings.png`** – **Postavke, jezici i sigurnosna kopija**
   - Prikaz izbornika postavki s odabirom jezika, temama i upravljanjem bazom podataka.

---

## Kako sami jednostavno izvozite snimke iz preglednika:

1. Otvorite aplikaciju u Chrome pregledniku (`http://localhost:5173`).
2. Otvorite Developer Tools (Pritisnite `F12` ili `Cmd + Option + I`).
3. Kliknite na ikonu mobitela (**Toggle Device Toolbar** - `Cmd + Shift + M`).
4. Odaberite uređaj npr. **Pixel 7** ili unesite dimenzije `1080 x 1920`.
5. Pritisnite `Cmd + Shift + P` i upišite **"Capture screenshot"**.
6. Spremite sliku u ovu mapu (`googleplay-showcase/`).
