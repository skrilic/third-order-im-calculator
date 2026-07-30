# Third-order intermodulation calculator

TOIC is an Ionic React calculator for third-order intermodulation products from
a set of collocated transmitters.

## Supported calculations

For the entered frequency set `F`, TOIC evaluates:

<p>
  f<sub>IM</sub> = 2f<sub>x</sub> - f<sub>y</sub>,
  where x &ne; y
</p>

and, when at least three stations exist:

<p>
  f<sub>IM</sub> = f<sub>x</sub> + f<sub>y</sub> - f<sub>z</sub>,
  where x, y, and z identify three different stations.
</p>

Each `fx + fy` pair is evaluated once because addition is commutative. Results
equal to or below zero are omitted and output is rounded to two decimal places.

## Using the calculator

### Starter data

A fresh install seeds three sites — **FORTICA-01**, **GRDONJ-01** and
**SIBOVI-01** — so the map is not empty on first launch. Seeding happens only when the database holds nothing at all; existing
locations, transmitters and saved calculations are never overwritten, and the
starter sites do not come back once deleted. See
[DATA_MANAGEMENT.md](DATA_MANAGEMENT.md#first-run-seeding).

### Saved locations

1. Click an empty point on the OpenStreetMap map.
2. Enter the location name and select **Save**.
3. The new marker opens the location dialog.
4. Select **Add**, enter a transmitter name, a non-negative frequency and an
   optional station class, then save it. Repeat for every transmitter at that
   site.
5. Select **Calculate** in the marker dialog.
6. The location result page loads every transmitter stored at that location
   and calculates its products.
7. Sort or filter the generated products through the table headers.
8. Select **Export CSV** to download the current result set.

Clicking an existing marker opens its current transmitter list. From that
dialog, a transmitter can be added, edited, or deleted, and the location name
or coordinates can be edited. Each transmitter shows its station class when one
is stored. Deleting a location displays a warning because all of its
transmitters are deleted in the same operation.

### Adjusting a location calculation

The location result page is a working list, not a fixed one:

- Every transmitter has a checkbox. Clearing it leaves that transmitter out of
  the calculation without touching the database; **Select all** and **Clear
  selection** switch the whole list at once.
- The form at the top adds an extra transmitter — name, frequency and optional
  station class — for what-if calculations. The name is **required** here,
  unlike on the manual **Calculate** tab, because anything added on this page
  can be written to the location. Added rows can be removed again; stored
  transmitters cannot be deleted from this page.
- **Save Calculation** stores the currently included stations in the
  `adhocCalculations` store, together with the location they came from. They
  then appear under **Saved Presets** on the **Calculate** tab.
- **Save to Location** writes the added transmitters into the `transmitters`
  store alongside the ones already stored at that location. Every transmitter
  being saved must have a name; a nameless one blocks the save with a message
  naming its frequency. The write is otherwise all-or-nothing: if any addition
  repeats a frequency already present at the location, or repeats another one in
  the same batch, nothing is saved and the page reports
  `errors.duplicateFrequency`. Because added rows keep their IDs, saving the
  same list twice updates those rows instead of duplicating them.

Select **Center on my location** to ask for foreground location permission and
move the map to the current device position. The blue position marker and its
accuracy are temporary: they are not saved with locations or backups. Rejecting
the permission does not affect manual map or calculator use.

### Manual calculation

Select **Calculate** in the bottom tab bar, enter an optional station name and
frequency, then select **Add**. Manual entries are kept separately from saved
location data and remain available while switching tabs, until the page
reloads.

**Home** returns to the map and saved-location CRUD. A location result URL has
the form `#/locations/:id/results`; browser back/forward controls work normally.

## Navigation and appearance

The mobile shell uses:

- a compact **TOIC** toolbar at the top;
- a theme button in its upper-right corner;
- persistent **Home**, **Calculate**, and **Settings** tabs with icons at the
  bottom.

The appearance menu offers **System**, **Light**, and **Dark**. The choice is
stored on the device. **System** follows operating-system changes while the
application is running. The selected palette applies to Ionic components,
forms, dialogs, application surfaces, and AG Grid.

The **Settings** tab contains:

- **Data backup** — JSON export, validated import, merge, and atomic replace;
- **Application language** — **English** or **Croatian**.

English is the default and fallback language. The language choice is stored on
the device and immediately updates navigation, forms, dialogs, validation
messages, AG Grid controls, and exported CSV headers.

The form validates the frequency and clears after a successful addition. Results
appear after the second station is added and are recalculated immediately after
any station is removed.

## Reading the results

Each row contains:

- **Description** — the formula with station names and entered frequencies.
- **Frequency** — the calculated product formatted to two decimal places.

An unnamed station receives a consistent fallback label such as `F0`. The
calculator does not assign a unit, so all entered values must use the same unit,
such as MHz; output uses that unit as well.

## CSV export

The export creates `intermodulations.csv` with:

- a UTF-8 byte-order mark for spreadsheet compatibility;
- a semicolon (`;`) delimiter;
- quoted `description` and `frequency` columns;
- CRLF line endings.

Filtering the grid changes its visible rows but does not reduce the source array
used for export.

## JSON data backup

Open **Settings** and use **Export JSON** to download all saved locations and
transmitters in one versioned backup. **Import JSON** validates the file and
previews its location, transmitter, and ID-conflict counts before changing
IndexedDB.

- **Merge** keeps existing records, adds new IDs, and replaces records whose
  stable IDs occur in both datasets.
- **Replace all** atomically replaces all saved data. The import dialog offers
  **Export current data first** before this destructive choice.

The importer rejects malformed JSON, unsupported schemas, duplicate IDs,
invalid coordinates or frequencies, orphaned transmitters, and files larger
than 5 MB. See [Location database and backup guide](DATA_MANAGEMENT.md) for the
complete data contract.

## Important behavior

- Saved location data remains on the current device and application origin; it
  is not uploaded to a server.
- Duplicate names, input frequencies, and output frequencies are allowed.
- Zero may be entered, but only calculated products greater than zero appear.
- The application performs no RF-domain checks beyond the two formulas and the
  positive-result condition.

## Further documentation

- [Development and distribution guide](DEVELOPMENT.md)
- [Location database and backup guide](DATA_MANAGEMENT.md)
- [Geolocation integration and native permissions](GEOLOCATION.md)
- [Architecture and project analysis](PROJECT_ANALYSIS.md)
- [Vite and Ionic migration record](MIGRATION_VITE_IONIC.md)
- [Repository README](../README.md)
