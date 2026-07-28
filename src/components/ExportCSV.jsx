import { IonButton, IonIcon } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { createCsv } from "../domain/createCsv";
import { downloadBlob } from "../utils/download";
import { useI18n } from "../i18n/I18nProvider";

function ExportCSV({ rows }) {
  const { t } = useI18n();
  function downloadCsv() {
    const blob = new Blob([
      createCsv(rows, [
        t("results.description"),
        t("results.frequency")
      ])
    ], {
      type: "text/csv;charset=utf-8"
    });
    downloadBlob(blob, "intermodulations.csv");
  }

  return (
    <IonButton
      fill="outline"
      size="small"
      disabled={rows.length === 0}
      onClick={downloadCsv}
      aria-label={t("results.exportCsvAria")}
    >
      <IonIcon slot="start" icon={downloadOutline} />
      {t("results.exportCsv")}
    </IonButton>
  );
}

export default ExportCSV;
