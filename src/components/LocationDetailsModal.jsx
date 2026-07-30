import { useEffect, useState } from "react";
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline
} from "ionicons/icons";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";

const emptyTransmitter = {
  name: "",
  frequency: ""
};

function LocationDetailsModal({
  location,
  transmitters,
  onDismiss,
  onCalculate,
  onEditLocation,
  onDeleteLocation,
  onSaveTransmitter,
  onDeleteTransmitter
}) {
  const { t } = useI18n();
  const [editingTransmitter, setEditingTransmitter] = useState(null);
  const [form, setForm] = useState(emptyTransmitter);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setEditingTransmitter(null);
    setForm(emptyTransmitter);
    setError("");
    setDeleteTarget(null);
  }, [location?.id]);

  if (!location) {
    return null;
  }

  function beginTransmitterEdit(transmitter = null) {
    setEditingTransmitter(transmitter ?? { locationId: location.id });
    setForm(
      transmitter
        ? {
            name: transmitter.name,
            frequency: transmitter.frequency
          }
        : emptyTransmitter
    );
    setError("");
  }

  async function saveTransmitter(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSaveTransmitter(
        {
          ...form,
          locationId: location.id
        },
        editingTransmitter?.id ? editingTransmitter : undefined
      );
      setEditingTransmitter(null);
      setForm(emptyTransmitter);
    } catch (saveError) {
      setError(translateError(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      setError("");
      if (deleteTarget?.type === "location") {
        await onDeleteLocation(location.id);
        onDismiss();
      } else if (deleteTarget?.type === "transmitter") {
        await onDeleteTransmitter(deleteTarget.id);
      }
    } catch (deleteError) {
      setError(translateError(deleteError, t));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <IonModal
        isOpen={Boolean(location)}
        initialBreakpoint={0.55}
        breakpoints={[0, 0.55, 0.95]}
        handle={true}
        className="sheet-modal"
        onDidDismiss={onDismiss}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{location.name}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDismiss}>
                {t("common.close")}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="location-summary">
            <p>
              {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </p>
            <div className="location-actions">
              <IonButton
                size="small"
                onClick={() => onCalculate(location.id)}
              >
                {t("location.calculate")}
              </IonButton>
              <IonButton
                size="small"
                fill="clear"
                onClick={() => onEditLocation(location)}
              >
                <IonIcon slot="start" icon={createOutline} />
                {t("location.edit")}
              </IonButton>
              <IonButton
                size="small"
                fill="clear"
                color="danger"
                onClick={() =>
                  setDeleteTarget({ type: "location", id: location.id })
                }
              >
                <IonIcon slot="start" icon={trashOutline} />
                {t("location.delete")}
              </IonButton>
            </div>
          </div>
          {error && !editingTransmitter ? (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          ) : null}

          {editingTransmitter ? (
            <form
              className="modal-form transmitter-form"
              onSubmit={saveTransmitter}
            >
              <h2>
                {editingTransmitter.id
                  ? t("transmitter.edit")
                  : t("transmitter.add")}
              </h2>
              <IonInput
                label={t("transmitter.name")}
                labelPlacement="stacked"
                value={form.name}
                autofocus
                onIonInput={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.detail.value ?? ""
                  }))
                }
              />
              <IonInput
                label={t("transmitter.frequency")}
                labelPlacement="stacked"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.frequency}
                onIonInput={(event) =>
                  setForm((current) => ({
                    ...current,
                    frequency: event.detail.value ?? ""
                  }))
                }
              />
              {error ? (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              ) : null}
              <div className="form-actions">
                <IonButton
                  fill="clear"
                  type="button"
                  onClick={() => setEditingTransmitter(null)}
                >
                  {t("common.cancel")}
                </IonButton>
                <IonButton type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </IonButton>
              </div>
            </form>
          ) : (
            <>
              <div className="section-heading">
                <h2>
                  {t("transmitter.list", {
                    count: transmitters.length
                  })}
                </h2>
                <IonButton
                  size="small"
                  onClick={() => beginTransmitterEdit()}
                >
                  <IonIcon slot="start" icon={addOutline} />
                  {t("common.add")}
                </IonButton>
              </div>
              {transmitters.length === 0 ? (
                <p className="station-list-empty">
                  {t("transmitter.empty")}
                </p>
              ) : (
                <IonList>
                  {transmitters.map((transmitter) => (
                    <IonItem key={transmitter.id}>
                      <IonLabel>{transmitter.name}</IonLabel>
                      <IonNote slot="end">
                        {transmitter.frequency}
                      </IonNote>
                      <IonButton
                        slot="end"
                        fill="clear"
                        onClick={() =>
                          beginTransmitterEdit(transmitter)
                        }
                        aria-label={t("transmitter.editAria", {
                          name: transmitter.name
                        })}
                      >
                        <IonIcon
                          slot="icon-only"
                          icon={createOutline}
                        />
                      </IonButton>
                      <IonButton
                        slot="end"
                        fill="clear"
                        color="danger"
                        onClick={() =>
                          setDeleteTarget({
                            type: "transmitter",
                            id: transmitter.id,
                            name: transmitter.name
                          })
                        }
                        aria-label={t("transmitter.deleteAria", {
                          name: transmitter.name
                        })}
                      >
                        <IonIcon
                          slot="icon-only"
                          icon={trashOutline}
                        />
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </>
          )}
        </IonContent>
      </IonModal>
      <IonAlert
        isOpen={Boolean(deleteTarget)}
        header={
          deleteTarget?.type === "location"
            ? t("location.deleteTitle")
            : t("transmitter.deleteTitle")
        }
        message={
          deleteTarget?.type === "location"
            ? t("location.deleteMessage")
            : t("transmitter.deleteMessage", {
                name: deleteTarget?.name ?? ""
              })
        }
        buttons={[
          {
            text: t("common.cancel"),
            role: "cancel",
            handler: () => setDeleteTarget(null)
          },
          {
            text: t("common.delete"),
            role: "destructive",
            handler: confirmDelete
          }
        ]}
        onDidDismiss={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default LocationDetailsModal;
