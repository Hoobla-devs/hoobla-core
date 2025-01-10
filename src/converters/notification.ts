import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/init';
import { TJobWrite } from '../types/jobTypes';
import { TNotificationRead, TNotificationWrite } from '../types/notification';
import { TUserWrite } from '../types/userTypes';

export const notificationConverter = {
  toFirestore(notification: TNotificationRead): TNotificationWrite {
    const { date, ...rest } = notification;
    return {
      date: Timestamp.fromDate(date),
      job: doc(db, 'jobs', notification.jobId) as DocumentReference<TJobWrite>,
      recipient: doc(
        db,
        'users',
        notification.recipientId
      ) as DocumentReference<TUserWrite>,
      sender: doc(
        db,
        'users',
        notification.senderId
      ) as DocumentReference<TUserWrite>,
      accountType: notification.accountType,
      type: notification.type,
      read: notification.read,
      isSystem: notification.isSystem,
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
      recipientId: snapData.recipient.id,
      senderId: snapData.sender.id,
      jobId: snapData.job.id,
      isSystem: snapData.isSystem,
    };
  },
};
