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

const emptyStation = {
  name: "",
  frequency: ""
};

function AddStation({ onAddStation }) {
  const [station, setStation] = useState(emptyStation);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const frequency = Number(station.frequency);
    if (
      String(station.frequency).trim() === "" ||
      !Number.isFinite(frequency) ||
      frequency < 0
    ) {
      setError("Enter a valid non-negative transmitting frequency.");
      return;
    }

    onAddStation({
      name: station.name.trim(),
      frequency
    });
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
            label="Station name"
            labelPlacement="stacked"
            placeholder="Optional"
            value={station.name}
            onIonInput={(event) =>
              updateStation("name", event.detail.value)
            }
          />
          <IonInput
            label="Transmitting frequency"
            labelPlacement="stacked"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="For example, 100.50"
            value={station.frequency}
            onIonInput={(event) =>
              updateStation("frequency", event.detail.value)
            }
          />
          <IonButton type="submit" aria-label="Add station">
            <IonIcon slot="start" icon={addOutline} />
            Add
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
