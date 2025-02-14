import { updateDoc } from 'firebase/firestore';

import { doc } from 'firebase/firestore';

import { db } from '../../firebase/init';

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true })
    .then(() => true)
    .catch(() => false);
};
