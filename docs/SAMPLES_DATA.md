# Sample Test Data and External Databases (Testni podaci i vanjski izvori)

This document provides a sample transmitter file for testing the TOIC importer, along with recommended public online databases for RF transmitters.

Ovaj dokument sadrži upute za korištenje testne datoteke odašiljača te popis preporučenih javnih izvora s podacima o odašiljačima i repetitorima.

> The importer accepts only the `toic-sites` GeoJSON profile. Its full
> specification is in [IMPORT_FORMAT.md](IMPORT_FORMAT.md); every dataset below
> must be converted to it first.

---

## 📁 Ready-to-Use Local Sample File (Priložena testna datoteka)

The repository includes a ready-to-use sample located in `public/samples/`:

- **GeoJSON Sample**: [public/samples/sample_transmitters.geojson](../public/samples/sample_transmitters.geojson)
  - Three sites: collocated FM broadcast transmitters (Sljeme Zagreb, Učka Istra) and amateur repeaters (Marjan Split).

### How to Import (Kako uvesti):
1. Open TOIC application -> Go to **Settings** (`#/settings`).
2. Under **Backup & Data**, tap **Import GeoJSON File** (or *Uvezi GeoJSON datoteku*).
3. Select `sample_transmitters.geojson`.
4. Review the detected locations and transmitters in the preview modal, then tap **Import into Database**.

If the file does not match the profile, the modal lists every problem found and imports nothing.

---

## 🌐 Public Online Databases (Javni izvori podataka o odašiljačima)

None of these publish the `toic-sites` profile directly — they are raw sources to
convert. For flat, one-row-per-transmitter exports, use
`scripts/convert-regulator-export.mjs` as a starting point.

### 1. RepeaterBook (Amateur & PMR Repeaters)
- **Website**: [repeaterbook.com](https://www.repeaterbook.com/)
- **Description**: The largest worldwide directory of VHF/UHF radio repeaters (2m, 70cm bands).
- **Export format**: Free **Export to CSV** for any country or state.

### 2. FMLIST / FMSCAN (FM & DAB+ Broadcast Transmitters)
- **Website**: [fmlist.org](https://www.fmlist.org/) / [fmscan.org](https://fmscan.org/)
- **Description**: Comprehensive European and worldwide database of FM radio and DAB+ broadcast towers with frequencies (MHz), power (kW), and coordinates.

### 3. HAKOM Open Data / Registar dozvola (Croatia)
- **Website**: [hakom.hr](https://www.hakom.hr/)
- **Description**: Croatian Regulatory Authority for Network Industries public register of issued radio licenses and FM/TV transmitter sites.
- **Export format**: Public CSV/XLS data files.

### 4. OpenCellID (Cellular Base Stations)
- **Website**: [opencellid.org](https://opencellid.org/)
- **Description**: Open database of cell towers (GSM, UMTS, LTE, 5G) worldwide.
- **Export format**: Full weekly CSV downloads by country or API queries.
