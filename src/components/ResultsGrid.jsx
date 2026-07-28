import { useMemo } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle
} from "@ionic/react";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine } from "ag-grid-community";
import ExportCSV from "./ExportCSV";
import { useI18n } from "../i18n/I18nProvider";

function ResultsGrid({ rows }) {
  const { t } = useI18n();
  const columnDefs = useMemo(
    () => [
      {
        headerName: t("results.description"),
        field: "description",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 280,
        cellStyle: { textAlign: "left" }
      },
      {
        headerName: t("results.frequency"),
        field: "frequency",
        filter: "agTextColumnFilter",
        width: 150,
        valueFormatter: ({ value }) =>
          value === null || value === undefined || value === ""
            ? ""
            : Number(value).toFixed(2),
        comparator: (valueA, valueB) => Number(valueA) - Number(valueB)
      }
    ],
    [t]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      cellStyle: { color: "#4f5154" }
    }),
    []
  );

  const localeText = useMemo(
    () => ({
      noRowsToShow: t("grid.noRows"),
      filterOoo: t("grid.filter"),
      equals: t("grid.equals"),
      notEqual: t("grid.notEqual"),
      blank: t("grid.blank"),
      notBlank: t("grid.notBlank"),
      contains: t("grid.contains"),
      notContains: t("grid.notContains"),
      startsWith: t("grid.startsWith"),
      endsWith: t("grid.endsWith"),
      andCondition: t("grid.and"),
      orCondition: t("grid.or"),
      applyFilter: t("grid.apply"),
      resetFilter: t("grid.reset"),
      clearFilter: t("grid.clear"),
      cancelFilter: t("grid.cancel"),
      sortAscending: t("grid.sortAscending"),
      sortDescending: t("grid.sortDescending"),
      sortUnSort: t("grid.clearSort")
    }),
    [t]
  );

  return (
    <IonCard className="calculator-card">
      <IonCardHeader>
        <div className="results-heading">
          <IonCardTitle>
            {t("results.products", { count: rows.length })}
          </IonCardTitle>
          <ExportCSV rows={rows} />
        </div>
      </IonCardHeader>
      <IonCardContent>
        <div className="results-grid">
          <AgGridReact
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            localeText={localeText}
            rowData={rows}
            theme={themeAlpine}
          />
        </div>
      </IonCardContent>
    </IonCard>
  );
}

export default ResultsGrid;
