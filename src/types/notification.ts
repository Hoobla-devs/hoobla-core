import { DocumentReference, Timestamp } from 'firebase/firestore';
import { TJobWrite } from './jobTypes';
import { TUserWrite } from './userTypes';

export type EmployerNotification =
  | 'applicantsSelected' // Admin has selected a list of applicants. This is done on the admin side.
  | 'contactInfoApproved' // Freelancer has approved sharing contact information
  | 'contactInfoDenied' // Freelancer has denied sharing contact information
  | 'reviewRequested' // Admin has requested the employer to review the freelancer
  | 'freelancerSignature'; // Freelancer has signed the contract

export type FreelancerNotification =
  | 'contactInfoRequested' // Employer has requested the freelancer to share contact information
  | 'reviewReceived' // Employer has given the freelancer a review
  | 'employerSignature'; // Employer has signed the contract

export type TNotificationWrite = {
  job: DocumentReference<TJobWrite>;
  recipient: DocumentReference<TUserWrite>;
  sender: DocumentReference<TUserWrite>;
  accountType: 'freelancer' | 'employer';
  type: EmployerNotification | FreelancerNotification;
  date: Timestamp;
  read: boolean;
  isSystem?: boolean;
};

export type TNotificationRead = {
  jobId: string;
  recipientId: string;
  senderId: string;
  date: Date;
  accountType: 'freelancer' | 'employer';
  type: EmployerNotification | FreelancerNotification;
  read: boolean;
  isSystem?: boolean;
};

export type TNotification = {
  id: string;
  date: Date;
  type: EmployerNotification | FreelancerNotification;
  accountType: 'freelancer' | 'employer';
  read: boolean;
  job: {
    id: string;
    name: string;
  };
  sender: {
    id: string;
    name: string;
    photo: string;
  };
  recipient: {
    id: string;
    name: string;
    photo: string;
  };
  isSystem?: boolean;
};
