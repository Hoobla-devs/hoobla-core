import { updateDoc } from 'firebase/firestore';

import { doc } from 'firebase/firestore';

import {
  collection,
  addDoc,
  where,
  query,
  getDocs,
  CollectionReference,
} from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import {
  TNotification,
  TNotificationRead,
  TNotificationWrite,
} from '../../types/notification';
import { getJob } from '../jobs/get';
import { getUserById } from '../users/get';

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true })
    .then(() => true)
    .catch(() => false);
};
