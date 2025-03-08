import {
  collection,
  where,
  query,
  getDocs,
  CollectionReference,
} from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import { TNotification, TNotificationRead } from '../../types/notification';

export const getUserNotifications = async (
  userId: string
): Promise<TNotification[]> => {
  const notificationsRef = collection(db, 'notifications').withConverter(
    notificationConverter
  ) as CollectionReference<TNotificationRead>;

  const userNotifications = query(
    notificationsRef,
    where('recipient.id', '==', userId)
  );

  const notificationsSnap = await getDocs(userNotifications);

  const notifications = notificationsSnap.docs.map(async doc => {
    const notification = doc.data();

    // If accountType is freelancer, then recipient is the freelancer and sender is the employer
    // If accountType is employer, then recipient is the employer and sender is the freelancer
    const noti: TNotification = {
      accountType: notification.accountType,
      date: notification.date,
      read: notification.read,
      type: notification.type,
      id: doc.id,
      job: notification.job || null,
      recipient: notification.recipient,
      sender: notification.isSystem
        ? {
            id: '',
            name: 'Hoobla',
            photo: '',
          }
        : notification.company
          ? notification.company
          : notification.sender,
    };
    return noti;
  });

  // Resolve all promises and filter out null values
  // TODO: Only get notifications related to the current account type
  const resolvedNotifications = await Promise.all(notifications);
  return resolvedNotifications.filter(
    (notification): notification is TNotification => notification !== null
  );
};
