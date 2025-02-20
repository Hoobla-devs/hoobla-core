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
    isSystem: notification.isSystem || false,
  };

  const notificationData = notificationConverter.toFirestore(fullNotification);

  await addDoc(notificationsRef, notificationData)
    .then(() => true)
    .catch(() => false);
};

// Create noti for employer that freelancers have been chosen
export const createFreelancersChosenNoti = async (
  employerId: string,
  jobId: string
) => {
  createNotification({
    accountType: 'employer',
    jobId: jobId,
    recipientId: employerId,
    senderId: employerId,
    isSystem: true,
    type: 'applicantsSelected',
  });
};

// Employer signs the job contract
export const createEmployerSignatureNoti = async (
  employerId: string,
  freelancerId: string,
  jobId: string
) => {
  createNotification({
    accountType: 'freelancer',
    jobId: jobId,
    recipientId: freelancerId,
    senderId: employerId,
    type: 'employerSignature',
  });
};

// Freelancer signs the job contract
export const createFreelancerSignatureNoti = async (
  freelancerId: string,
  employerId: string,
  jobId: string
) => {
  createNotification({
    accountType: 'employer',
    jobId: jobId,
    recipientId: employerId,
    senderId: freelancerId,
    type: 'freelancerSignature',
  });
};

// Company sends a contact info request to the freelancer
export const createContactInfoRequestedNoti = async (
  freelancerId: string,
  employerId: string,
  jobId: string
) => {
  createNotification({
    accountType: 'freelancer',
    jobId: jobId,
    recipientId: freelancerId,
    senderId: employerId,
    type: 'contactInfoRequested',
  });
};
