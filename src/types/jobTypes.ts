import { DocumentReference, Timestamp } from 'firebase/firestore';
import { TCompany, TCompanyWithEmployees, TCompanyWrite } from './companyTypes';
import { TTagsId } from './refrencesTypes';
import { TJobTitle } from './tagTypes';
import { TEmployerUser, TFreelancerUser, TUser } from './userTypes';

export type TJobBase = {
  name: string;
  description: string;
  unapprovedTags?: TUnapprovedTags | null;
  type: 'notSure' | 'partTime' | 'timeframe';
  status: TJobStatus;
  documentId: string | null;
  documentStorageUrl?: string;
  company: DocumentReference<TCompanyWrite>;
  creator: DocumentReference<TEmployerUser>;
  freelancers: DocumentReference<TApplicant>[]; // Þau sem taka verkið að sér
  selectedApplicants: DocumentReference<TApplicant>[]; // Þau sem Hoobla 3-5 velja
  notSelectedReason?: TReasonId;
} & TTagsId;

export type TJobWrite = TJobBase & {
  terms: Timestamp | null;
  logs: TLogWrite[];
  jobInfo: TJobInfoWrite;
  signatures: TSignaturesWrite | null;
  employees?: TJobEmployeeWrite[];
};

export type TLogWrite = {
  date: Timestamp;
  status: TJobStatus;
  title?: string;
  description?: string;
};

export type TJobEmployeePermission = 'edit' | 'view';

export type TJobEmployeeWrite = {
  user: DocumentReference<TUser>;
  position: string;
  permission: TJobEmployeePermission;
};

export type TJobEmployee = {
  id: string;
  name: string;
  email: string;
  position: string;
  permission: TJobEmployeePermission;
};

export type TJobRead = TJobBase & {
  id: string;
  terms: Date | null;
  logs: TLog[];
  jobInfo: TJobInfoRead;
  signatures: TSignatures | null;
  employees?: TJobEmployee[];
};

export type TJob = TJobRead & {
  // Það sem er ekki í write:
  applicants?: TApplicant[]; // TODO: breyta í map?   // Allir sem hafa sent inn umsókn
};

export type TJobWithApplicants = Omit<TJob, 'applicants'> & {
  applicants: TFreelancerApplicant[];
  // selectedApplicants: (TFreelancerApplicant)[];
  // freelancers: (TFreelancerApplicant)[];
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
  | 'cancelled'; // Job has been cancelled

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
};
