import { DocumentReference, Timestamp } from 'firebase/firestore';
import { TJobWrite } from './jobTypes';
import { TUserWrite } from './userTypes';

export type EmployerNotification =
  | 'applicantsSelected' // Admin has selected a list of applicants
  | 'contactInfoApproved' // Freelancer has approved sharing contact information
  | 'reviewRequested' // Admin has requested the employer to review the freelancer
  | 'freelancerSignature'; // Freelancer has signed the contract

export type FreelancerNotification =
  | 'contactInfoRequested' // Employer has requested the freelancer to share contact information
  | 'reviewReceived' // Employer has given the freelancer a review
  | 'employerSignature'; // Employer has signed the contract

export type TNotificationWrite = {
  jobId?: DocumentReference<TJobWrite>;
  freelancerId?: DocumentReference<TUserWrite>;
  employerId?: DocumentReference<TUserWrite>;
  type: EmployerNotification | FreelancerNotification;
  title: string;
  description: string;
  date: Timestamp;
  read: boolean;
};

export type TNotificationRead = Omit<TNotificationWrite, 'date'> & {
  id: string;
  date: Date;
};

export type TNotification = TNotificationRead & {
  job: {
    id: string;
    name: string;
  };
  freelancer: {
    id: string;
    name: string;
    photo: string;
  };
  employer: {
    id: string;
    name: string;
  };
};
