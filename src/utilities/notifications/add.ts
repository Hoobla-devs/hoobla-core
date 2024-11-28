import { collection, addDoc, where, query, getDocs } from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import {
  TNotificationRead,
  TNotificationWrite,
} from '../../types/notification';

export const createNotification = async (notification: TNotificationRead) => {
  const notificationsRef = collection(db, 'notifications');

  const notificationData = notificationConverter.toFirestore(notification);

  await addDoc(notificationsRef, notificationData)
    .then(() => true)
    .catch(() => false);
};

export const getUserNotifications = async (
  userId: string,
  accountType: 'freelancer' | 'employer'
) => {
  const notificationsRef = collection(db, 'notifications');

  const userNotifications = query(notificationsRef, where('id', '==', userId));

  // Only get notifications related to the current account type

  const notifications = await getDocs(userNotifications);
};
