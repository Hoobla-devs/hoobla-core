import { collection, addDoc } from 'firebase/firestore';
import { notificationConverter } from '../../converters/notification';
import { db } from '../../firebase/init';
import { TContactStatus } from '../../types/jobTypes';
import { TNotificationRead } from '../../types/notification';
import { getCompanyById } from '../companies/get';
import { getJobWithApplicants } from '../jobs/get';
import { getUserById } from '../users/get';

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

const getNotificationsEntityData = async (
  jobId: string,
  recipientId: string,
  senderId: string,
  companyId?: string
) => {
  const [job, recipient, sender, company] = await Promise.all([
    getJobWithApplicants(jobId),
    getUserById(recipientId),
    getUserById(senderId),
    companyId ? getCompanyById(companyId) : undefined,
  ]);

  return {
    job: {
      id: job.id,
      name: job.name,
    },
    recipient: {
      id: recipient.general.uid,
      name: recipient.general.name,
      photo: recipient.general.photo?.url || '',
    },
    sender: company
      ? {
          id: company.id,
          name: company.name,
          photo: company.logo?.url || '',
        }
      : {
          id: sender.general.uid,
          name: sender.general.name,
          photo: sender.general.photo?.url || '',
        },
    company: company
      ? {
          id: company.id,
          name: company.name,
          photo: company.logo?.url || '',
        }
      : undefined,
  };
};

// Create noti for employer that freelancers have been chosen
export const createFreelancersChosenNoti = async (
  employerId: string,
  jobId: string
) => {
  const { job, recipient, sender } = await getNotificationsEntityData(
    jobId,
    employerId,
    employerId
  );

  createNotification({
    accountType: 'employer',
    job,
    recipient,
    sender,
    isSystem: true,
    type: 'applicantsSelected',
    company: null,
  });
};

// Employer signs the job contract
export const createEmployerSignatureNoti = async (
  employerId: string,
  freelancerId: string,
  jobId: string,
  companyId: string
): Promise<boolean> => {
  const { job, recipient, sender, company } = await getNotificationsEntityData(
    jobId,
    freelancerId,
    employerId,
    companyId
  );
  try {
    return await createNotification({
      accountType: 'freelancer',
      job,
      recipient,
      sender,
      type: 'employerSignature',
      company: company || null,
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
  const { job, recipient, sender } = await getNotificationsEntityData(
    jobId,
    freelancerId,
    employerId
  );

  try {
    return await createNotification({
      accountType: 'employer',
      job,
      recipient,
      sender,
      type: 'freelancerSignature',
      company: null,
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
  jobId: string,
  companyId: string
): Promise<boolean> => {
  const { job, recipient, sender, company } = await getNotificationsEntityData(
    jobId,
    freelancerId,
    employerId,
    companyId
  );

  try {
    return await createNotification({
      accountType: 'freelancer',
      job,
      recipient,
      sender,
      type: 'contactInfoRequested',
      company: company || null,
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
  const { job, recipient, sender } = await getNotificationsEntityData(
    jobId,
    freelancerId,
    employerId
  );

  try {
    return await createNotification({
      accountType: 'employer',
      job,
      recipient,
      sender,
      type: status === 'approved' ? 'contactInfoApproved' : 'contactInfoDenied',
      company: null,
    });
  } catch (error) {
    console.error(
      'Failed to create contact info response notification:',
      error
    );
    return false;
  }
};
