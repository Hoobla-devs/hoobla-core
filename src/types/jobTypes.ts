import { DocumentReference, Timestamp } from 'firebase/firestore';
import {
  TCompany,
  TCompanyEmployee,
  TCompanyWithEmployees,
  TCompanyWrite,
} from './companyTypes';
import { TTagsId } from './refrencesTypes';
import { TJobTitle } from './tagTypes';
import { TEmployerUser, TFreelancerUser, TUser } from './userTypes';

export type TJobBase = {
  name: string;
  description: string;
  generatedDescription?: string;
  wasTiptapUsed?: boolean;
  unapprovedTags?: TUnapprovedTags | null;
  type: 'notSure' | 'partTime' | 'timeframe';
  status: TJobStatus;
  documentId: string | null;
  documentStorageUrl?: string;
  company: DocumentReference<TCompanyWrite>;
  creator: DocumentReference<TEmployerUser>;
  freelancers: DocumentReference<TApplicant>[]; // Þau sem taka verkið að sér
  selectedApplicants: DocumentReference<TApplicant>[]; // Þau sem Hoobla 3-5 velja
  employees?: DocumentReference<TJobEmployee>[];
  notSelectedReason?: TReasonId;
  hidden?: boolean; // Hide job from public view
} & TTagsId;

export type TJobWrite = TJobBase & {
  terms: Timestamp | null;
  logs: TLogWrite[];
  jobInfo: TJobInfoWrite;
  signatures: TSignaturesWrite | null;
};

export type TJobRead = TJobBase & {
  id: string;
  terms: Date | null;
  logs: TLog[];
  jobInfo: TJobInfoRead;
  signatures: TSignatures | null;
};

export type TLogWrite = {
  date: Timestamp;
  status: TJobStatus;
  title?: string;
  description?: string;
};

export type TJobEmployeePermission = 'edit' | 'view';

export type TJobEmployeeWrite = {
  permission: TJobEmployeePermission;
};

export type TJobEmployeeRead = {
  permission: TJobEmployeePermission;
  id: string;
};

export type TJobEmployee = {
  id: string;
  name: string;
  photo?: string;
  email: string;
};

export type TJob = TJobRead & {
  // Það sem er ekki í write:
  applicants?: TApplicant[]; // TODO: breyta í map?   // Allir sem hafa sent inn umsókn
};

export type TJobWithEmployees = Omit<TJob, 'employees'> & {
  employees: TJobEmployee[];
};

export type TJobWithEmployeesAndApplicants = Omit<
  TJob,
  'employees' | 'applicants'
> & {
  employees: TJobEmployee[];
  applicants: TFreelancerApplicant[];
};

export type TJobWithApplicants = Omit<TJob, 'applicants'> & {
  applicants: TFreelancerApplicant[];
};

export type TJobWithCompany = Omit<TJob, 'company'> & {
  company: TCompany;
  acceptedOffer?: TOffer;
};

export type TJobWithAllData = Omit<
  TJob,
  'applicants' | 'selectedApplicants' | 'freelancers' | 'company' | 'creator'
> & {
  company: TCompanyWithEmployees;
  creator: TEmployerUser;
  applicants: TFreelancerApplicant[];
  selectedApplicants: TFreelancerApplicant[];
  freelancers: TFreelancerApplicant[];
};

export type TJobStatus =
  | 'inReview' // Job has been created and admin needs to approve it for it to be visible
  | 'approved' // Job has been approved by admin and is visible in job list
  | 'denied' // Job has been denied by admin and is not visible in job list
  | 'chooseFreelancers' // Admin has selected applicants and the company now needs to choose freelancers
  | 'requiresSignature' // Company has chosen freelancers and now freelancer needs to sign a contract. Company has already signed
  | 'inProgress' // Both parties have signed the contract and the job is in progress
  | 'readyForReview' // Freelancer has completed the job and is now awaiting a review from the company
  | 'completed' // Job has been completed
  | 'cancelled' // Job has been cancelled
  | 'postponed'; // Job has been postponed

export type TLog = {
  date: Date;
  status: TJobStatus;
  title?: string;
  description?: string;
};

export type TUnapprovedTags = {
  jobTitles: string[];
  skills: string[];
  languages: string[];
};

export type TSignatures = {
  employer: {
    id: string;
    date: Date;
  };
  freelancer: {
    id: string;
    date: Date;
  };
};

export type TSignaturesWrite = {
  employer: {
    id: string;
    date: Timestamp;
  };
  freelancer: {
    id: string;
    date: Timestamp;
  };
};

export type TJobInfoRead = {
  start: string;
  end: string;
  percentage: number | null;
  numOfHours: number | null;
  deadline?: Date;
};

export type TJobInfoWrite = {
  start: string;
  end: string;
  percentage: number | null;
  numOfHours: number | null;
  deadline?: Timestamp;
};

export type TApplicantWrite = {
  offer: {
    date: Timestamp;
    hourlyRate: string;
    fixedRate: string;
    message: string;
    acceptedRate?: TOfferType | '';
  };
  contactApproval?: TContactStatus;
};

export type TApplicantRead = {
  offer: TOffer;
  contactApproval?: TContactStatus;
  id: string;
};

export type TApplicant = TApplicantRead;

export type TFreelancerApplicant = TApplicant & TFreelancerUser;

export type TContactStatus = 'requested' | 'approved' | 'denied';

export type TOffer = {
  date: Date;
  hourlyRate: string;
  fixedRate: string;
  message: string;
  acceptedRate?: TOfferType | '';
};

export type TReasonId =
  | 'price'
  | 'experience'
  | 'skills'
  | 'similarProject'
  | 'knowsFreelancer';

export type TOfferType = 'hourly' | 'fixed';

// * Job Form Types
export type TJobFormData = {
  name: string;
  description: string;
  wasTiptapUsed?: boolean;
  generatedDescription?: string;
  selectedState: 'original' | 'generated';
  preferGeneratedDescription?: boolean;
  jobTitles: string[];
  skills: string[];
  languages: string[];
  unapprovedTags?: {
    jobTitles?: string[] | null;
    skills?: string[] | null;
    languages?: string[] | null;
  } | null;
  type: 'notSure' | 'partTime' | 'timeframe' | '';
  jobInfo: {
    start: string;
    end: string;
    percentage: number | null;
    numOfHours: string | null;
    deadline: number | null;
  };
  logs?: TLog[];
  status: TJobStatus;
};

export type TJobOfferFormData = {
  hourlyRate: string;
  fixedRate: string;
  message: string;
};

export type TEmailJobData = {
  id: string;
  name: string;
  description: string;
  jobTitles?: Omit<TJobTitle, 'relatedJobs' | 'relatedSkills'>[];
  hidden: boolean;
};

export type TSendAlertResult = {
  recipient: {
    name: string;
    email: string;
    phone: string;
    smsEnabled: boolean;
    emailEnabled: boolean;
  };
  emailSent: boolean;
  smsSent: boolean;
  emailNotificationDisabled: boolean;
  smsNotificationDisabled: boolean;
};

export type TJobRelation =
  | 'company'
  | 'creator'
  | 'employees'
  | 'freelancers'
  | 'applicants'
  | 'selectedApplicants';

// Define a helper type for optional relations
type OptionalRelations = {
  company?: TCompany;
  creator?: TEmployerUser;
  applicants?: TFreelancerApplicant[];
  selectedApplicants?: TFreelancerApplicant[];
  freelancers?: TFreelancerApplicant[];
  employees?: TCompanyEmployee[];
};

// Modify TJobWithRelations to make all relations optional
export type TJobWithRelations = Omit<
  TJob,
  | 'employees'
  | 'company'
  | 'applicants'
  | 'selectedApplicants'
  | 'freelancers'
  | 'creator'
> &
  OptionalRelations;
