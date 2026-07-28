import { useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import AppHeader from "../components/AppHeader";
import AppTabBar from "../components/AppTabBar";
import ResultsGrid from "../components/ResultsGrid";
import StationList from "../components/StationList";
import { getSnapshot } from "../data/database";
import { calculateIm3 } from "../domain/calculateIm3";
import { navigateTo } from "../routing/hashRouter";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";

function LocationResultsPage({ locationId }) {
  const { t } = useI18n();
  const [location, setLocation] = useState(null);
  const [transmitters, setTransmitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      setLoading(true);
      setError("");

      try {
        const snapshot = await getSnapshot();
        const nextLocation = snapshot.locations.find(
          (candidate) => candidate.id === locationId
        );

        if (!nextLocation) {
          throw new Error("errors.locationMissing");
        }

        if (active) {
          setLocation(nextLocation);
          setTransmitters(
            snapshot.transmitters.filter(
              (transmitter) =>
                transmitter.locationId === locationId
            )
          );
        }
      } catch (loadError) {
        if (active) {
          setError(translateError(loadError, t));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLocation();
    return () => {
      active = false;
    };
  }, [locationId, t]);

  const rows = useMemo(
    () => calculateIm3(transmitters),
    [transmitters]
  );

  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <IonButton
            fill="clear"
            className="back-button"
            onClick={() => navigateTo("/")}
          >
            <IonIcon slot="start" icon={arrowBackOutline} />
            {t("locationResults.back")}
          </IonButton>

          {loading ? (
            <div className="page-loading">
              <IonSpinner />
              {t("locationResults.loading")}
            </div>
          ) : null}

          {error ? (
            <IonText color="danger">
              <h1 className="page-heading">
                {t("locationResults.unavailable")}
              </h1>
              <p>{error}</p>
            </IonText>
          ) : null}

          {location ? (
            <>
              <h1 className="page-heading">{location.name}</h1>
              <p className="calculator-intro">
                {t("locationResults.intro", {
                  latitude: location.latitude.toFixed(6),
                  longitude: location.longitude.toFixed(6)
                })}
              </p>
              <StationList
                stationList={transmitters}
                title={t("locationResults.transmitters")}
              />
              <ResultsGrid rows={rows} />
            </>
          ) : null}
        </main>
      </IonContent>
      <AppTabBar activeTab="home" />
    </IonPage>
  );
}

export default LocationResultsPage;
