import { DocumentReference, Timestamp } from "firebase/firestore";
import { TEducation, TExperience, TGender } from "./baseTypes";
import { TCompany, TCompanyWrite } from "./companyTypes";
import { TApplicant, TJobWrite } from "./jobTypes";

export type TFreelancerStatus =
  | "inReview"
  | "approved"
  | "denied"
  | "requiresSignature";

export type TUserBase = {
  deleted?: boolean;
  general: TGeneral;
  settings?: {
    SMSNotifications?: boolean;
    deniedOfferMails?: boolean;
    cancelledJobMails?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TFreelancerUser = TUserBase & {
  freelancer: TFreelancer; // required
  freelancerForm?: TSavedFreelancerFormData;
};

export type TEmployerUser = TUserBase & {
  employer: TEmployer; // required
};

export type TUserRead = {
  deleted?: boolean;
  general: TGeneral;
  freelancer?: TFreelancerRead;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployerRead;
  settings?: {
    SMSNotifications?: boolean;
    deniedOfferMails?: boolean;
    cancelledJobMails?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TUser = Omit<TUserRead, "employer" | "freelancer"> & {
  employer?: TEmployer;
  freelancer?: TFreelancer;
};

export type TUserWrite = {
  deleted?: boolean;
  general: TGeneralWrite;
  freelancer?: TFreelancerWrite;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployerWrite;
  settings?: {
    SMSNotifications?: boolean;
    deniedOfferMails?: boolean;
    cancelledJobMails?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TGeneralWrite = {
  name: string;
  phone: string;
  ssn: string;
  email: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lang: "is" | "en";
};

export type TApplicantUser = TUserBase & TApplicant;

export type TGeneral = {
  uid: string;
  name: string;
  phone: string;
  ssn: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
  lang: "is" | "en";
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
  jobs: DocumentReference<TJobWrite>[]; // TODO
  status: TFreelancerStatus;
  social?: TFreelancerSocial;
  address: TFreelancerAddress | null;
  company: TFreelancerCompany | null;
};

export type TFreelancerRead = TFreelancerBase & {
  contract?: TFreelancerContractRead;
  selectedReviews?: string[]; // List of review id's
};

export type TFreelancer = Omit<TFreelancerRead, "selectedReviews"> & {
  selectedReviews?: TReview[];
};

export type TFreelancerWrite = TFreelancerBase & {
  contract?: TFreelancerContractWrite;
  selectedReviews?: DocumentReference<TReviewWrite>[];
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

export type TEmployerRead = {
  position: string;
  company: DocumentReference<TCompanyWrite>;
};

export type TEmployer = {
  position: string;
  company: TCompany;
};

export type TEmployerWrite = {
  position: string;
  company: DocumentReference<TCompanyWrite>;
};

// * Freelancer Form

export type TSavedFreelancerFormData = Omit<
  TFreelancerFormData,
  "jobTitles" | "skills" | "languages"
> & {
  jobTitles: string[];
  skills: string[];
  languages: string[];
};

export type TFreelancerFormData = {
  name: string;
  phone: string;
  ssn: string;
  gender: TGender | "";
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
  phone: string;
  position: string;
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
