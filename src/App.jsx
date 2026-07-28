import { useState } from "react";
import { IonApp } from "@ionic/react";
import HomePage from "./pages/HomePage";
import LocationResultsPage from "./pages/LocationResultsPage";
import SettingsPage from "./pages/SettingsPage";
import Calculation from "./components/Calculation";
import { I18nProvider } from "./i18n/I18nProvider";
import {
  matchLocationResults,
  useHashPath
} from "./routing/hashRouter";

function App() {
  const [manualStations, setManualStations] = useState([]);
  const path = useHashPath();
  const locationId = matchLocationResults(path);

  let page = <HomePage />;

  if (path === "/calculate") {
    page = (
      <Calculation
        stationList={manualStations}
        onStationListChange={setManualStations}
      />
    );
  } else if (path === "/settings") {
    page = <SettingsPage />;
  } else if (locationId) {
    page = <LocationResultsPage locationId={locationId} />;
  }

  return (
    <I18nProvider>
      <IonApp>{page}</IonApp>
    </I18nProvider>
  );
}

export default App;
