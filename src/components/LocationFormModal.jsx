import { useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";

function LocationFormModal({
  isOpen,
  location,
  coordinates,
  onDismiss,
  onSave
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      name: location?.name ?? "",
      latitude: location?.latitude ?? coordinates?.latitude ?? "",
      longitude: location?.longitude ?? coordinates?.longitude ?? ""
    });
    setError("");
  }, [coordinates, isOpen, location]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave(form, location);
    } catch (saveError) {
      setError(translateError(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value ?? "" }));
    setError("");
  }

  // A tap on the map already fixed the position, so it is shown rather than
  // asked for. Every other way in — editing, or adding straight from the list
  // — has to let the coordinates be typed.
  const pinnedOnMap =
    !location &&
    coordinates?.latitude !== undefined &&
    coordinates?.latitude !== null &&
    coordinates?.latitude !== "" &&
    coordinates?.longitude !== undefined &&
    coordinates?.longitude !== null &&
    coordinates?.longitude !== "";

  return (
    <IonModal
      isOpen={isOpen}
      initialBreakpoint={0.65}
      breakpoints={[0, 0.65, 0.95]}
      handle={true}
      className="sheet-modal"
      onDidDismiss={onDismiss}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {location ? t("location.edit") : t("location.new")}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              {t("common.cancel")}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form
          id="location-form"
          className="modal-form"
          onSubmit={handleSubmit}
        >
          <IonInput
            label={t("location.name")}
            labelPlacement="stacked"
            value={form.name}
            autofocus
            onIonInput={(event) =>
              update("name", event.detail.value)
            }
          />
          {pinnedOnMap ? (
            <p className="coordinate-note">
              {Number(form.latitude).toFixed(6)},{" "}
              {Number(form.longitude).toFixed(6)}
            </p>
          ) : (
            <div className="coordinate-fields">
              <IonInput
                label={t("location.latitude")}
                labelPlacement="stacked"
                type="number"
                step="any"
                value={form.latitude}
                onIonInput={(event) =>
                  update("latitude", event.detail.value)
                }
              />
              <IonInput
                label={t("location.longitude")}
                labelPlacement="stacked"
                type="number"
                step="any"
                value={form.longitude}
                onIonInput={(event) =>
                  update("longitude", event.detail.value)
                }
              />
            </div>
          )}
          {error ? (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          ) : null}
          {/* Actions stay inside the scrollable content: an ion-footer is laid
              out against the full sheet height, which puts it below the
              viewport at every breakpoint. */}
          <div className="form-actions">
            <IonButton fill="clear" type="button" onClick={onDismiss}>
              {t("common.cancel")}
            </IonButton>
            <IonButton type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </IonButton>
          </div>
        </form>
      </IonContent>
    </IonModal>
  );
}

export default LocationFormModal;
