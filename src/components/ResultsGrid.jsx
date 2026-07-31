import { useMemo, useState } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonSegment,
  IonSegmentButton
} from "@ionic/react";
import {
  gridOutline,
  listOutline,
  searchOutline
} from "ionicons/icons";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine } from "ag-grid-community";
import ExportCSV from "./ExportCSV";
import { useI18n } from "../i18n/I18nProvider";

export function parseNumberFilterInput(text) {
  if (text == null) return null;
  const cleaned = String(text).trim().replace(",", ".");
  if (cleaned === "") return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function ResultsGrid({ rows }) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "table" | "cards"
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return rows;
    }
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => {
      const descMatch = String(r.description ?? "").toLowerCase().includes(q);
      const freqMatch = String(r.frequency ?? "").toLowerCase().includes(q);
      return descMatch || freqMatch;
    });
  }, [rows, searchQuery]);

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
        filter: "agNumberColumnFilter",
        filterParams: {
          numberParser: parseNumberFilterInput
        },
        valueGetter: (params) =>
          params.data?.frequency != null
            ? Number(params.data.frequency)
            : null,
        valueFormatter: ({ value }) =>
          value === null || value === undefined || value === ""
            ? ""
            : Number(value).toFixed(2),
        width: 160
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
      greaterThan: t("grid.greaterThan"),
      greaterThanOrEqual: t("grid.greaterThanOrEqual"),
      lessThan: t("grid.lessThan"),
      lessThanOrEqual: t("grid.lessThanOrEqual"),
      inRange: t("grid.inRange"),
      inRangeStart: t("grid.inRangeStart"),
      inRangeEnd: t("grid.inRangeEnd"),
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
            {t("results.products", { count: filteredRows.length })}
          </IonCardTitle>
          <div className="results-controls">
            <IonSegment
              value={viewMode}
              onIonChange={(e) => setViewMode(e.detail.value)}
              style={{ width: "auto" }}
            >
              <IonSegmentButton value="auto">
                <IonIcon icon={gridOutline} />
              </IonSegmentButton>
              <IonSegmentButton value="cards">
                <IonIcon icon={listOutline} />
              </IonSegmentButton>
            </IonSegment>
            <ExportCSV rows={filteredRows} />
          </div>
        </div>
      </IonCardHeader>
      <IonCardContent>
        {viewMode === "cards" ? (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <IonInput
                placeholder={t("grid.filter")}
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value ?? "")}
                style={{
                  "--background": "var(--app-muted-surface)",
                  "--border-radius": "10px",
                  paddingLeft: "8px"
                }}
              >
                <IonIcon slot="start" icon={searchOutline} style={{ margin: "0 8px" }} />
              </IonInput>
            </div>
            <div className="results-card-list">
              {filteredRows.length === 0 ? (
                <p className="station-list-empty" style={{ textAlign: "center", padding: "20px 0" }}>
                  {t("grid.noRows")}
                </p>
              ) : (
                filteredRows.map((row, index) => (
                  <div key={row.id || index} className="result-card-item">
                    <div className="result-card-desc">
                      <span className="result-card-formula">{row.description}</span>
                    </div>
                    <span className="result-card-freq">
                      {row.frequency !== null && row.frequency !== undefined
                        ? `${Number(row.frequency).toFixed(2)} MHz`
                        : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="results-grid">
            <AgGridReact
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              localeText={localeText}
              rowData={filteredRows}
              theme={themeAlpine}
            />
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
}

export default ResultsGrid;
