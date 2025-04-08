import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/init';
import { TCompanyWrite } from '../types/companyTypes';
import { TJobWrite } from '../types/jobTypes';
import { TNotificationRead, TNotificationWrite } from '../types/notification';
import { TUserWrite } from '../types/userTypes';

export const notificationConverter = {
  toFirestore(notification: TNotificationRead): TNotificationWrite {
    const { date, ...rest } = notification;
    return {
      date: Timestamp.fromDate(date),
      job: notification.job || null,
      recipient: notification.recipient,
      sender: notification.sender,
      accountType: notification.accountType,
      type: notification.type,
      read: notification.read,
      isSystem: notification.isSystem,
      company: notification.company || null,
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
      recipient: snapData.recipient,
      sender: snapData.sender,
      job: snapData.job,
      isSystem: snapData.isSystem,
      company: snapData.company,
    };
  },
};
