import { useRef, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { documentTextOutline, mapOutline } from "ionicons/icons";
import {
  IMPORT_PROFILE,
  IMPORT_PROFILE_VERSION,
  parseGeoImport
} from "../domain/geoImport";
import { useI18n } from "../i18n/I18nProvider";

const MAX_VISIBLE_ERRORS = 12;

function GeoImportModal({ isOpen, onDismiss, onImport }) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState([]);
  const [importing, setImporting] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setFileName(file.name);
    setError("");
    setErrorDetails([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result ?? "";
        setParsedData(parseGeoImport(String(text)));
      } catch (parseErr) {
        setError(
          parseErr.message ? t(parseErr.message) : t("errors.geoImportFailed")
        );
        setErrorDetails(parseErr.details ?? []);
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  }

  async function handleConfirmImport() {
    if (!parsedData) {
      return;
    }

    setImporting(true);
    try {
      await onImport(parsedData);
      setParsedData(null);
      setFileName("");
      onDismiss();
    } catch (err) {
      setError(err.message ? t(err.message) : t("errors.unknown"));
      setErrorDetails([]);
    } finally {
      setImporting(false);
    }
  }

  return (
    <IonModal
      isOpen={isOpen}
      initialBreakpoint={0.7}
      breakpoints={[0, 0.7, 0.95]}
      handle={true}
      className="sheet-modal"
      onDidDismiss={() => {
        setParsedData(null);
        setError("");
        setErrorDetails([]);
        setFileName("");
        onDismiss();
      }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("geo.importTitle")}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>{t("common.close")}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--ion-color-medium-shade)" }}>
            {t("geo.importHelp")}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--ion-color-medium-shade)" }}>
            <code>
              {t("geo.formatRequired", {
                profile: IMPORT_PROFILE,
                version: IMPORT_PROFILE_VERSION
              })}
            </code>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json"
            id="geo-file-input"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <IonButton
            expand="block"
            shape="round"
            color="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <IonIcon slot="start" icon={documentTextOutline} />
            {t("geo.chooseFile")}
          </IonButton>
          {fileName ? (
            <p style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: "8px" }}>
              {fileName}
            </p>
          ) : null}
        </div>

        {error ? (
          <IonText color="danger" style={{ display: "block" }}>
            <p style={{ textAlign: "center" }}>{error}</p>
            {errorDetails.length > 0 ? (
              <>
                <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {t("geo.errorDetails", { count: errorDetails.length })}
                </p>
                <ul style={{ fontSize: "0.8rem", paddingInlineStart: "1.2rem" }}>
                  {errorDetails
                    .slice(0, MAX_VISIBLE_ERRORS)
                    .map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                </ul>
                {errorDetails.length > MAX_VISIBLE_ERRORS ? (
                  <p style={{ fontSize: "0.8rem" }}>
                    {t("geo.errorDetailsTruncated", {
                      count: errorDetails.length - MAX_VISIBLE_ERRORS
                    })}
                  </p>
                ) : null}
              </>
            ) : null}
          </IonText>
        ) : null}

        {parsedData ? (
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>
              {t("geo.previewTitle")}
            </h3>
            <IonList lines="full">
              <IonItem>
                <IonIcon slot="start" icon={mapOutline} color="primary" />
                <IonLabel>
                  <h2>{t("home.title")}</h2>
                  <p>{t("geo.locationsFound")}</p>
                </IonLabel>
                <IonBadge slot="end" color="primary">
                  {parsedData.locations.length}
                </IonBadge>
              </IonItem>
              <IonItem>
                <IonIcon slot="start" icon={documentTextOutline} color="secondary" />
                <IonLabel>
                  <h2>{t("manual.stations")}</h2>
                  <p>{t("geo.transmittersFound")}</p>
                </IonLabel>
                <IonBadge slot="end" color="secondary">
                  {parsedData.transmitters.length}
                </IonBadge>
              </IonItem>
            </IonList>
          </div>
        ) : null}

        {/* Action stays inside the scrollable content: an ion-footer is laid
            out against the full sheet height, which puts it below the viewport
            at every breakpoint. */}
        <div className="form-actions">
          <IonButton
            disabled={!parsedData || importing}
            onClick={handleConfirmImport}
          >
            {importing ? t("common.saving") : t("geo.confirmImport")}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
}

export default GeoImportModal;
