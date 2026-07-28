import { useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
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

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
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
          {location ? (
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
          ) : (
            <p className="coordinate-note">
              {Number(form.latitude).toFixed(6)},{" "}
              {Number(form.longitude).toFixed(6)}
            </p>
          )}
          {error ? (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          ) : null}
        </form>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton
            slot="end"
            type="submit"
            form="location-form"
            disabled={saving}
          >
            {saving ? t("common.saving") : t("common.save")}
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
}

export default LocationFormModal;
