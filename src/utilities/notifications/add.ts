import { collection, addDoc } from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import { TContactStatus } from '../../types/jobTypes';
import { TNotificationRead } from '../../types/notification';

type TNotificationReadRequired = Omit<TNotificationRead, 'date' | 'read'>;

export const createNotification = async (
  notification: TNotificationReadRequired
): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'notifications');

    const fullNotification: TNotificationRead = {
      ...notification,
      date: new Date(),
      read: false,
      isSystem: notification.isSystem || false,
    };

    const notificationData =
      notificationConverter.toFirestore(fullNotification);

    await addDoc(notificationsRef, notificationData);
    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
};

// Employer signs the job contract
export const createEmployerSignatureNoti = async (
  employerId: string,
  freelancerId: string,
  jobId: string
): Promise<boolean> => {
  try {
    return await createNotification({
      accountType: 'freelancer',
      jobId: jobId,
      recipientId: freelancerId,
      senderId: employerId,
      type: 'employerSignature',
    });
  } catch (error) {
    console.error('Failed to create employer signature notification:', error);
    return false;
  }
};

// Freelancer signs the job contract
export const createFreelancerSignatureNoti = async (
  freelancerId: string,
  employerId: string,
  jobId: string
): Promise<boolean> => {
  try {
    return await createNotification({
      accountType: 'employer',
      jobId: jobId,
      recipientId: employerId,
      senderId: freelancerId,
      type: 'freelancerSignature',
    });
  } catch (error) {
    console.error('Failed to create freelancer signature notification:', error);
    return false;
  }
};

// Company sends a contact info request to the freelancer
export const createContactInfoRequestedNoti = async (
  freelancerId: string,
  employerId: string,
  jobId: string
): Promise<boolean> => {
  try {
    return await createNotification({
      accountType: 'freelancer',
      jobId: jobId,
      recipientId: freelancerId,
      senderId: employerId,
      type: 'contactInfoRequested',
    });
  } catch (error) {
    console.error('Failed to create contact info request notification:', error);
    return false;
  }
};

export const createContactInfoResponseNoti = async (
  freelancerId: string,
  employerId: string,
  jobId: string,
  status: TContactStatus
): Promise<boolean> => {
  try {
    return await createNotification({
      accountType: 'employer',
      jobId: jobId,
      recipientId: employerId,
      senderId: freelancerId,
      type: status === 'approved' ? 'contactInfoApproved' : 'contactInfoDenied',
    });
  } catch (error) {
    console.error(
      'Failed to create contact info response notification:',
      error
    );
    return false;
  }
};
