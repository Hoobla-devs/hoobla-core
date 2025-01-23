import {
  collection,
  addDoc,
  where,
  query,
  getDocs,
  CollectionReference,
  doc,
  DocumentReference,
} from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import {
  TNotification,
  TNotificationRead,
  TNotificationWrite,
} from '../../types/notification';
import { TUser } from '../../types/userTypes';
import { getJobWithRelations } from '../admin/jobs/get';
import { getJob } from '../jobs/get';
import { getUserById } from '../users/get';

export const getUserNotifications = async (
  userId: string
): Promise<TNotification[]> => {
  const notificationsRef = collection(db, 'notifications').withConverter(
    notificationConverter
  ) as CollectionReference<TNotificationRead>;

  const userRef = doc(db, 'users', userId) as DocumentReference<TUser>;
  const userNotifications = query(
    notificationsRef,
    where('recipient', '==', userRef)
  );

  const notificationsSnap = await getDocs(userNotifications);

  const notifications = notificationsSnap.docs.map(async doc => {
    const notification = doc.data();

    const [job, recipient, sender] = await Promise.all([
      getJobWithRelations(notification.jobId),
      getUserById(notification.recipientId),
      getUserById(notification.senderId).catch(error => {
        console.error('Error fetching sender:', error);
        return null;
      }),
    ]);

    if (!job || !recipient) {
      return null;
    }

    // If accountType is freelancer, then recipient is the freelancer and sender is the employer
    // If accountType is employer, then recipient is the employer and sender is the freelancer
    const noti: TNotification = {
      ...notification,
      id: doc.id,
      job: { id: job.id, name: job.name },
      recipient: {
        id: recipient.general.uid,
        name: recipient.general.name,
        photo: '', // Recipient photo is not needed for the notification
      },
      sender: sender
        ? {
            id: sender.general.uid,
            name: sender.general.name,
            photo:
              sender.freelancer?.photo.url || sender.general.photo?.url || '',
          }
        : {
            id: '',
            name: 'Hoobla',
            photo: '',
          },
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
