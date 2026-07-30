# Sample Test Data and External Databases (Testni podaci i vanjski izvori)

This document provides sample transmitter files for testing the TOIC GeoJSON/CSV importer, along with recommended public online databases for RF transmitters.

Ovaj dokument sadrži upute za korištenje testnih datoteka odašiljača te popis preporučenih javnih izvora s podacima o odašiljačima i repetitorima.

---

## 📁 Ready-to-Use Local Sample Files (Priložene testne datoteke)

The repository includes ready-to-use sample files located in `public/samples/`:

1. **CSV Sample**: [public/samples/sample_transmitters.csv](file:///home/slaven/Workspace/github/third-order-im-calculator/public/samples/sample_transmitters.csv)
   - Contains collocated FM broadcast transmitters (Sljeme Zagreb, Učka Istra) and PMR/amateur repeaters (Marjan Split).
2. **GeoJSON Sample**: [public/samples/sample_transmitters.geojson](file:///home/slaven/Workspace/github/third-order-im-calculator/public/samples/sample_transmitters.geojson)
   - Contains spatial `FeatureCollection` points with frequencies and location names.

### How to Import (Kako uvesti):
1. Open TOIC application -> Go to **Settings** (`#/settings`).
2. Under **Backup & Data**, tap **Import GeoJSON / CSV File** (or *Uvezi GeoJSON / CSV datoteku*).
3. Select `sample_transmitters.csv` or `sample_transmitters.geojson`.
4. Review the detected locations and transmitters in the preview modal, then tap **Import into Database**.

---

## 🌐 Public Online Databases (Javni izvori podataka o odašiljačima)

For testing with real-world broad-scale datasets, the following public databases offer free CSV or GeoJSON downloads:

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
