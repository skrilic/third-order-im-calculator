import { useState } from "react";
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
import { useI18n } from "../i18n/I18nProvider";

function AdhocSaveModal({ isOpen, onDismiss, onSave }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("errors.adhocNameRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(name.trim());
      setName("");
      onDismiss();
    } catch (saveError) {
      setError(saveError.message ? t(saveError.message) : t("errors.unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal
      isOpen={isOpen}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.85]}
      handle={true}
      className="sheet-modal"
      onDidDismiss={onDismiss}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("adhoc.saveTitle")}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>{t("common.cancel")}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form id="adhoc-save-form" className="modal-form" onSubmit={handleSubmit}>
          <IonInput
            label={t("adhoc.nameLabel")}
            labelPlacement="stacked"
            placeholder="npr. Ad-hoc mjerenje 900 MHz"
            value={name}
            autofocus
            onIonInput={(e) => {
              setName(e.detail.value ?? "");
              setError("");
            }}
          />
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
            form="adhoc-save-form"
            disabled={saving}
          >
            {saving ? t("common.saving") : t("common.save")}
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
}

export default AdhocSaveModal;
