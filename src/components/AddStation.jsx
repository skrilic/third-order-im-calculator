import { useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonText
} from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { normalizeStation } from "../domain/normalizeStation";
import { useI18n } from "../i18n/I18nProvider";

const emptyStation = {
  name: "",
  frequency: ""
};

function AddStation({ onAddStation }) {
  const { t } = useI18n();
  const [station, setStation] = useState(emptyStation);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const normalized = normalizeStation(station);
    if (normalized.error) {
      setError(t(normalized.error));
      return;
    }

    onAddStation(normalized.station);
    setStation(emptyStation);
    setError("");
  }

  function updateStation(field, value) {
    setStation((current) => ({
      ...current,
      [field]: value ?? ""
    }));
    setError("");
  }

  return (
    <IonCard className="calculator-card">
      <IonCardContent>
        <form className="station-form" onSubmit={handleSubmit}>
          <IonInput
            label={t("station.name")}
            labelPlacement="stacked"
            placeholder={t("station.optional")}
            value={station.name}
            onIonInput={(event) =>
              updateStation("name", event.detail.value)
            }
          />
          <IonInput
            label={t("station.frequency")}
            labelPlacement="stacked"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder={t("station.frequencyExample")}
            value={station.frequency}
            onIonInput={(event) =>
              updateStation("frequency", event.detail.value)
            }
          />
          <IonButton
            type="submit"
            aria-label={t("station.addAria")}
          >
            <IonIcon slot="start" icon={addOutline} />
            {t("common.add")}
          </IonButton>
          {error ? (
            <IonText color="danger" className="station-form__error">
              <p>{error}</p>
            </IonText>
          ) : null}
        </form>
      </IonCardContent>
    </IonCard>
  );
}

export default AddStation;
