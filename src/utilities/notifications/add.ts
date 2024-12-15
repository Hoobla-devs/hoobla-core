import { collection, addDoc } from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import { TNotificationRead } from '../../types/notification';

type TNotificationReadRequired = Omit<TNotificationRead, 'date' | 'read'>;

export const createNotification = async (
  notification: TNotificationReadRequired
) => {
  const notificationsRef = collection(db, 'notifications');

  const fullNotification: TNotificationRead = {
    ...notification,
    date: new Date(),
    read: false,
  };

  const notificationData = notificationConverter.toFirestore(fullNotification);

  await addDoc(notificationsRef, notificationData)
    .then(() => true)
    .catch(() => false);
};
