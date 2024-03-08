import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { TNotificationRead, TNotificationWrite } from "../types/baseTypes";

export const notificationConverter = {
  toFirestore(notification: TNotificationRead): TNotificationWrite {
    const { date, nid, ...rest } = notification;
    return {
      ...rest,
      date: Timestamp.fromDate(date),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TNotificationWrite>,
    options: SnapshotOptions
  ): TNotificationRead {
    const snapData = snapshot.data(options);

    return {
      ...snapData,
      nid: snapshot.id,
      date: snapData.date.toDate(),
    };
  },
};
