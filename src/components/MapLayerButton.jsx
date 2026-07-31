import { useEffect, useState } from "react";
import {
  IonActionSheet,
  IonButton,
  IonIcon
} from "@ionic/react";
import {
  checkmarkOutline,
  earthOutline,
  layersOutline,
  mapOutline
} from "ionicons/icons";
import {
  readMapLayerPreference,
  storeMapLayerPreference
} from "../theme/themePreference";
import { useI18n } from "../i18n/I18nProvider";

const layerOptions = [
  {
    value: "standard",
    labelKey: "theme.layerStandard",
    icon: mapOutline
  },
  {
    value: "satellite",
    labelKey: "theme.layerSatellite",
    icon: earthOutline
  },
  {
    value: "topographic",
    labelKey: "theme.layerTopographic",
    icon: layersOutline
  }
];

function MapLayerButton({
  shape = "default",
  size,
  className,
  color = "primary",
  fill
}) {
  const { t } = useI18n();
  const [layer, setLayer] = useState(readMapLayerPreference);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleExternalChange() {
      setLayer(readMapLayerPreference());
    }

    window.addEventListener("toic-map-layer-change", handleExternalChange);
    return () =>
      window.removeEventListener("toic-map-layer-change", handleExternalChange);
  }, []);

  function selectLayer(nextLayer) {
    const stored = storeMapLayerPreference(nextLayer);
    setLayer(stored);
  }

  const activeOption =
    layerOptions.find((option) => option.value === layer) ??
    layerOptions[0];

  return (
    <>
      <IonButton
        size={size}
        shape={shape}
        className={className}
        color={color}
        fill={fill}
        onClick={() => setIsOpen(true)}
        aria-label={t("theme.mapLayer")}
      >
        <IonIcon slot="icon-only" icon={layersOutline} />
      </IonButton>
      <IonActionSheet
        isOpen={isOpen}
        header={t("theme.mapLayer")}
        subHeader={t("theme.mapLayerDescription")}
        onDidDismiss={() => setIsOpen(false)}
        buttons={[
          ...layerOptions.map((option) => ({
            text: t(option.labelKey),
            icon:
              option.value === layer
                ? checkmarkOutline
                : option.icon,
            handler: () => selectLayer(option.value)
          })),
          {
            text: t("common.cancel"),
            role: "cancel"
          }
        ]}
      />
    </>
  );
}

export default MapLayerButton;
