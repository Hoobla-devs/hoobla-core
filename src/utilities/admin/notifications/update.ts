import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../../firebase/init";
import { TNotification, TNotificationWrite } from "../../../types/baseTypes";
import { updateDoc } from "../../updateDoc";

export async function updateNotification(n: TNotification) {
  const notificationRef = doc(
    db,
    "notifications",
    n.nid
  ) as DocumentReference<TNotificationWrite>;

  // update notification
  return await updateDoc(notificationRef, {
    checked: !n.checked,
  })
    .then(() => true)
    .catch((e) => false);
}
