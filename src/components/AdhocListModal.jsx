import { useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import {
  calculatorOutline,
  createOutline,
  folderOpenOutline,
  trashOutline
} from "ionicons/icons";
import { useI18n } from "../i18n/I18nProvider";

function AdhocListModal({
  isOpen,
  adhocList,
  onDismiss,
  onLoad,
  onEditName,
  onDelete
}) {
  const { language, t } = useI18n();
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
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
            <IonTitle>{t("adhoc.savedPresets")}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDismiss}>{t("common.close")}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {adhocList.length === 0 ? (
            <p className="station-list-empty" style={{ textAlign: "center", padding: "24px 0" }}>
              {t("adhoc.empty")}
            </p>
          ) : (
            <IonList lines="full">
              {adhocList.map((item) => (
                <IonItemSliding key={item.id}>
                  <IonItem button detail={false} onClick={() => onLoad(item)}>
                    <IonIcon slot="start" icon={folderOpenOutline} color="primary" />
                    <IonLabel className="ion-text-wrap">
                      <h2>{item.name}</h2>
                      <p>
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleString(language)
                          : ""}
                      </p>
                    </IonLabel>
                    <IonBadge slot="end" color="light" style={{ fontSize: "0.8rem" }}>
                      {item.stations?.length || 0} {t("manual.stations").toLowerCase()}
                    </IonBadge>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoad(item);
                      }}
                      title={t("adhoc.load")}
                    >
                      <IonIcon slot="icon-only" icon={calculatorOutline} />
                    </IonButton>
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption
                      color="primary"
                      onClick={() => onEditName(item)}
                    >
                      <IonIcon slot="icon-only" icon={createOutline} />
                    </IonItemOption>
                    <IonItemOption
                      color="danger"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={Boolean(deleteTarget)}
        header={t("adhoc.confirmDelete")}
        message={deleteTarget?.name}
        buttons={[
          {
            text: t("common.cancel"),
            role: "cancel",
            handler: () => setDeleteTarget(null)
          },
          {
            text: t("common.delete"),
            role: "destructive",
            handler: async () => {
              if (deleteTarget) {
                await onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }
            }
          }
        ]}
        onDidDismiss={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default AdhocListModal;
