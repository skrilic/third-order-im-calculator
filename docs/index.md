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

1. Enter an optional station name.
2. Enter a non-negative transmitting frequency.
3. Select **Add**.
4. Repeat for every transmitter in the calculation.
5. Sort or filter the generated products through the table headers.
6. Select **Export CSV** to download the current result set.

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

## Important behavior

- Data is not persisted to local storage or a server.
- Duplicate names, input frequencies, and output frequencies are allowed.
- Zero may be entered, but only calculated products greater than zero appear.
- The application performs no RF-domain checks beyond the two formulas and the
  positive-result condition.

## Further documentation

- [Development and distribution guide](DEVELOPMENT.md)
- [Architecture and project analysis](PROJECT_ANALYSIS.md)
- [Vite and Ionic migration record](MIGRATION_VITE_IONIC.md)
- [Repository README](../README.md)
