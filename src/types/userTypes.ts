import { DocumentReference, Timestamp } from 'firebase/firestore';
import { TEducation, TExperience, TGender } from './baseTypes';
import { TCompany, TCompanyWrite } from './companyTypes';
import { TApplicant, TJobWrite } from './jobTypes';

export type TFreelancerStatus =
  | 'inReview'
  | 'approved'
  | 'denied'
  | 'requiresSignature'
  | 'inactive';

export type TUserBase = {
  deleted?: boolean;
  general: TGeneral;
  settings?: {
    SMSNotifications?: boolean;
    deniedOfferMails?: boolean;
    cancelledJobMails?: boolean;
    excludedJobTitleNotifications?: string[];
  };
  isAdmin?: boolean; // For testing purposes, admins can see hidden jobs
};

export type TFreelancerUser = TUserBase & {
  freelancer: TFreelancer; // required
  freelancerForm?: TSavedFreelancerFormData;
};

export type TEmployerUser = TUserBase & {
  activeCompany: TEmployer;
  companies: TEmployer[];
};

export type TUserNotificationSettings = {
  SMSNotifications?: boolean;
  deniedOfferMails?: boolean;
  cancelledJobMails?: boolean;
  excludedJobTitleNotifications?: string[];
};

export type TUserRead = {
  deleted?: boolean;
  general: TGeneral;
  freelancer?: TFreelancerRead;
  freelancerForm?: TSavedFreelancerFormData;
  activeCompany?: DocumentReference<TCompanyWrite>;
  companies?: TEmployerRead[];
  settings?: TUserNotificationSettings;
};

export type TUser = Omit<TUserRead, 'activeCompany' | 'freelancer'> & {
  activeCompany?: TEmployer;
  freelancer?: TFreelancer;
};

export type TUserWrite = {
  deleted?: boolean;
  general: TGeneralWrite;
  freelancer?: TFreelancerWrite;
  freelancerForm?: TSavedFreelancerFormData;
  activeCompany?: DocumentReference<TCompanyWrite>;
  companies?: DocumentReference<TCompanyWrite>[];
  settings?: {
    SMSNotifications?: boolean;
    deniedOfferMails?: boolean;
    cancelledJobMails?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TGeneralWrite = {
  name: string;
  phone: {
    number: string;
    countryCode: string;
  };
  ssn: string;
  email: string;
  photo?: { url: string; originalUrl: string };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lang: 'is' | 'en';
};

export type TApplicantUser = TUserBase & TApplicant;

export type TGeneral = {
  uid: string;
  name: string;
  phone: {
    number: string;
    countryCode: string;
  };
  ssn: string;
  photo?: { url: string; originalUrl: string };
  email: string;
  createdAt: Date;
  updatedAt?: Date;
  lang: 'is' | 'en';
};

export type TFreelancerBase = {
  gender: TGender;
  photo: { url: string; originalUrl: string };
  jobTitles: string[];
  skills: string[];
  languages: string[];
  experience: TExperience[];
  education: TEducation[];
  unapprovedTags?: TFreelancerUnapprovedTags | null;
  jobs: DocumentReference<TJobWrite>[];
  status: TFreelancerStatus;
  social?: TFreelancerSocial;
  address: TFreelancerAddress | null;
  company: TFreelancerCompany | null;
};

export type TFreelancerRead = TFreelancerBase & {
  contract?: TFreelancerContractRead;
  selectedReviews?: string[]; // List of review id's
  inactiveSince?: Date;
};

export type TFreelancer = Omit<TFreelancerRead, 'selectedReviews'> & {
  selectedReviews?: TReview[];
};

export type TFreelancerWrite = TFreelancerBase & {
  contract?: TFreelancerContractWrite;
  selectedReviews?: DocumentReference<TReviewWrite>[];
  inactiveSince?: Timestamp;
};

export type TFreelancerContractRead = {
  signed: boolean;
  date?: Date;
  link?: string;
  documentId?: string;
};

export type TFreelancerContractWrite = {
  signed: boolean;
  date?: Timestamp;
  link?: string;
  documentId?: string;
};

export type TFreelancerCompany = {
  name: string;
  ssn: string;
  address: {
    address: string;
    postcode: string;
    city: string;
  };
};

export type TFreelancerAddress = {
  address: string;
  postcode: string;
  city: string;
};

export type TFreelancerUnapprovedTags = {
  jobTitles: string[];
  skills: string[];
  languages: string[];
};

export type TFreelancerSocial = {
  linkedIn: string;
  website: string;
};

export type TEmployerRole = 'employee' | 'admin';

export type TEmployerRead = {
  position: string;
  role: TEmployerRole;
  company: DocumentReference<TCompanyWrite>;
};

export type TEmployer = {
  role: TEmployerRole;
  position: string;
  company: TCompany;
};

export type TEmployerWrite = {
  role: TEmployerRole;
  position: string;
  company: DocumentReference<TCompanyWrite>;
};

// * Freelancer Form

export type TSavedFreelancerFormData = Omit<
  TFreelancerFormData,
  'jobTitles' | 'skills' | 'languages'
> & {
  jobTitles: string[];
  skills: string[];
  languages: string[];
};

export type TFreelancerFormData = {
  name: string;
  phone: {
    number: string;
    countryCode: string;
  };
  ssn: string;
  gender: TGender | '';
  oldPhoto?: { url: string; originalUrl: string } | null;
  photo?: { originalFile: File; file: File; url: string } | null;
  company: {
    name: string;
    ssn: string;
    address: {
      address: string;
      postcode: string;
      city: string;
    };
  };
  address: {
    address: string;
    postcode: string;
    city: string;
  };
  jobTitles: string[];
  skills: string[];
  languages: string[];
  unapprovedTags?: {
    jobTitles?: string[] | null;
    skills?: string[] | null;
    languages?: string[] | null;
  } | null;
  experience: TExperience[];
  education: TEducation[];
  experienceForm?: TExperience;
  educationForm?: TEducation;
  social?: {
    linkedIn: string;
    website: string;
  };
  hasBusiness?: boolean;
  selectedReviews: TReview[];
  hiddenReviews: TReview[];
};

// * Employer Form

export type TEmployerFormData = {
  name: string;
  ssn?: string;
  phone: {
    number: string;
    countryCode: string;
  };
  position: string;
  oldPhoto?: { url: string; originalUrl: string } | null;
  photo?: { originalFile: File; file: File; url: string } | null;
};

// * Review

export type TReviewBase = {
  jobTitle: string;
  jobDescription: string;
  jobInfo: {
    start: string;
    end: string;
    percentage: number | null;
    numOfHours: number | null;
  };
  companyInfo: {
    name: string;
    employerName: string;
    logo: string;
  };
  show: boolean;
  stars: number;
  text: string;
};

export type TReviewWrite = TReviewBase & {
  date: Timestamp;
};

export type TReviewRead = TReviewBase & {
  id: string;
  date: Date;
};

export type TReview = TReviewRead;
