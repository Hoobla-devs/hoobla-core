import { collection, addDoc } from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import { TNotificationRead } from '../../types/notification';

export const createNotification = async (notification: TNotificationRead) => {
  const notificationsRef = collection(db, 'notifications');

  const notificationData = notificationConverter.toFirestore(notification);

  await addDoc(notificationsRef, notificationData)
    .then(() => true)
    .catch(() => false);
};
