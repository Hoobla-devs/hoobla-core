import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { notificationConverter } from "../../../converters/notification";
import { db } from "../../../firebase/init";
import { TNotification } from "../../../types/baseTypes";

export async function getNotifications(): Promise<TNotification[]> {
  const notifications = await getDocs(
    collection(db, "notifications").withConverter(notificationConverter)
  );
  return notifications.docs.map((notification) => notification.data());
}

// notifcations listener
export async function getNotificationsListener(
  callback: (notifications: TNotification[]) => void
) {
  // where !checked
  const ref = collection(db, "notifications").withConverter(
    notificationConverter
  );
  const notificationQuery = query(ref, where("checked", "==", false));

  const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
    const notifications = snapshot.docs.map((notification) =>
      notification.data()
    );
    // sort by date descending
    notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
    console.log("notifications", notifications);

    callback(notifications);
  });

  return unsubscribe;
}
