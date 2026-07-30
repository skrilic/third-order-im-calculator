import { useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  cloudDownloadOutline,
  cloudUploadOutline,
  documentTextOutline,
  serverOutline,
  shieldCheckmarkOutline
} from "ionicons/icons";
import packageInfo from "../../package.json";
import GeoImportModal from "./GeoImportModal";
import {
  analyzeImport,
  createBackup,
  MAX_BACKUP_BYTES,
  parseBackupJson
} from "../domain/backup";
import {
  getSnapshot,
  importGeoData,
  importSnapshot,
  saveLocation,
  saveTransmitter
} from "../data/database";
import { downloadBlob } from "../utils/download";
import { useI18n } from "../i18n/I18nProvider";

function backupFilename(date) {
  return `toic-backup-${date
    .toISOString()
    .replaceAll(":", "-")
    .replace(/\u002e\d{3}Z$/, "Z")}.json`;
}

function BackupManager({ locationCount, transmitterCount, onImported }) {
  const { language, t } = useI18n();
  const fileInput = useRef(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [importing, setImporting] = useState(false);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

  async function exportBackup() {
    setError("");

    try {
      const now = new Date();
      const backup = createBackup(await getSnapshot(), {
        appVersion: packageInfo.version,
        exportedAt: now.toISOString()
      });
      downloadBlob(
        new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json;charset=utf-8"
        }),
        backupFilename(now)
      );
      setStatus("backup.downloaded");
    } catch (exportError) {
      setError(
        exportError.message?.startsWith("errors.")
          ? exportError.message
          : "errors.unknown"
      );
    }
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setStatus("");

    try {
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error("errors.backupTooLarge");
      }

      const incoming = parseBackupJson(await file.text());
      const current = await getSnapshot();
      setCandidate(incoming);
      setAnalysis(analyzeImport(current, incoming));
    } catch (importError) {
      setError(
        importError.message?.startsWith("errors.")
          ? importError.message
          : "errors.unknown"
      );
    }
  }

  async function performImport(mode) {
    setImporting(true);
    setError("");

    try {
      await importSnapshot(candidate, mode);
      setCandidate(null);
      setAnalysis(null);
      setStatus(
        mode === "merge"
          ? "backup.merged"
          : "backup.replaced"
      );
      await onImported();
    } catch (importError) {
      setError(
        importError.message?.startsWith("errors.")
          ? importError.message
          : "errors.unknown"
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleGeoImport(geoData) {
    setError("");
    try {
      await importGeoData(geoData);
      setStatus("backup.merged");
      await onImported();
    } catch (geoErr) {
      setError(geoErr.message ? geoErr.message : "errors.unknown");
    }
  }

  return (
    <>
      <IonList inset={true}>
        <IonListHeader>
          <IonLabel>{t("settings.backup")}</IonLabel>
        </IonListHeader>
        <IonItem>
          <IonIcon slot="start" icon={serverOutline} color="secondary" />
          <IonLabel>{t("backup.database")}</IonLabel>
          <IonNote slot="end">
            {t("backup.counts", {
              locations: locationCount,
              transmitters: transmitterCount
            })}
          </IonNote>
        </IonItem>
        <IonItem button onClick={exportBackup}>
          <IonIcon slot="start" icon={cloudDownloadOutline} color="primary" />
          <IonLabel>{t("backup.export")}</IonLabel>
        </IonItem>
        <IonItem button onClick={() => fileInput.current?.click()}>
          <IonIcon slot="start" icon={cloudUploadOutline} color="primary" />
          <IonLabel>{t("backup.import")}</IonLabel>
        </IonItem>
        <IonItem button onClick={() => setIsGeoModalOpen(true)}>
          <IonIcon slot="start" icon={documentTextOutline} color="tertiary" />
          <IonLabel>{t("geo.importButton")}</IonLabel>
        </IonItem>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={chooseFile}
        />
        {status ? (
          <IonItem lines="none">
            <IonText color="success" className="backup-message">
              <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: "6px" }} />
              {t(status)}
            </IonText>
          </IonItem>
        ) : null}
        {error ? (
          <IonItem lines="none">
            <IonText color="danger" className="backup-message">
              {t(error)}
            </IonText>
          </IonItem>
        ) : null}

        <IonModal
          isOpen={Boolean(candidate)}
          onDidDismiss={() => {
            setCandidate(null);
            setAnalysis(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t("backup.importTitle")}</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setCandidate(null);
                    setAnalysis(null);
                  }}
                >
                  {t("common.cancel")}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p>
              {t("backup.from", {
                date: candidate?.exportedAt
                  ? new Date(candidate.exportedAt).toLocaleString(language)
                  : ""
              })}
            </p>
            <dl className="import-summary">
              <div>
                <dt>{t("backup.locations")}</dt>
                <dd>{analysis?.locations ?? 0}</dd>
              </div>
              <div>
                <dt>{t("backup.transmitters")}</dt>
                <dd>{analysis?.transmitters ?? 0}</dd>
              </div>
              <div>
                <dt>{t("backup.conflicts")}</dt>
                <dd>
                  {(analysis?.locationConflicts ?? 0) +
                    (analysis?.transmitterConflicts ?? 0)}
                </dd>
              </div>
            </dl>
            <p>{t("backup.explanation")}</p>
            {error ? (
              <IonText color="danger">
                <p>{t(error)}</p>
              </IonText>
            ) : null}
            <IonButton fill="outline" onClick={exportBackup}>
              <IonIcon slot="start" icon={cloudDownloadOutline} />
              {t("backup.exportFirst")}
            </IonButton>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton
                  disabled={importing}
                  onClick={() => performImport("merge")}
                >
                  {t("backup.merge")}
                </IonButton>
                <IonButton
                  color="danger"
                  disabled={importing}
                  onClick={() => performImport("replace")}
                >
                  {t("backup.replace")}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonList>

      <GeoImportModal
        isOpen={isGeoModalOpen}
        onDismiss={() => setIsGeoModalOpen(false)}
        onImport={handleGeoImport}
      />
    </>
  );
}

export default BackupManager;
