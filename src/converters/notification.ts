import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import { TNotificationRead, TNotificationWrite } from '../types/notification';

export const notificationConverter = {
  toFirestore(notification: TNotificationRead): TNotificationWrite {
    const { date, ...rest } = notification;
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
      date: snapData.date.toDate(),
      id: snapshot.id,
    };
  },
};
