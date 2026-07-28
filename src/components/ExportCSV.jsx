import { IonButton, IonIcon } from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { createCsv } from "../domain/createCsv";

function ExportCSV({ rows }) {
  function downloadCsv() {
    const blob = new Blob([createCsv(rows)], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "intermodulations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <IonButton
      fill="outline"
      size="small"
      disabled={rows.length === 0}
      onClick={downloadCsv}
      aria-label="Download intermodulation products as CSV"
    >
      <IonIcon slot="start" icon={downloadOutline} />
      Export CSV
    </IonButton>
  );
}

export default ExportCSV;
