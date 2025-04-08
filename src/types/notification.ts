import { DocumentReference, Timestamp } from 'firebase/firestore';
import { TCompanyWrite } from './companyTypes';
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
  | 'employerSignature' // Employer has signed the contract
  | 'newFreelancerContract'; // A new freelancer contract has been created

export type TNotificationWrite = {
  job: {
    id: string;
    name: string;
  } | null;
  recipient: {
    id: string;
    name: string;
    photo: string;
  };
  sender: {
    id: string;
    name: string;
    photo: string;
  };
  accountType: 'freelancer' | 'employer';
  type: EmployerNotification | FreelancerNotification;
  date: Timestamp;
  read: boolean;
  isSystem?: boolean;
  company: {
    id: string;
    name: string;
    photo: string;
  } | null;
};

export type TNotificationRead = {
  job: {
    id: string;
    name: string;
  } | null;
  recipient: {
    id: string;
    name: string;
    photo: string;
  };
  sender: {
    id: string;
    name: string;
    photo: string;
  };
  date: Date;
  accountType: 'freelancer' | 'employer';
  type: EmployerNotification | FreelancerNotification;
  read: boolean;
  isSystem?: boolean;
  company: {
    id: string;
    name: string;
    photo: string;
  } | null;
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
  } | null;
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
  isSystem: boolean;
};
