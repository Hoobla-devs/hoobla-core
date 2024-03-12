import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TNotificationRead } from "../../types/baseTypes";

export async function addNotification(
  notification: Omit<TNotificationRead, "nid">
) {
  const notificationsRef = collection(db, "notifications");

  return await addDoc(notificationsRef, notification)
    .then(() => true)
    .catch(() => false);
}
