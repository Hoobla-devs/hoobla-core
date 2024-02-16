import { DocumentReference, Timestamp } from "firebase/firestore";
import { TEducation, TExperience } from "./baseTypes";
import { TCompany, TCompanyRead, TCompanyWrite } from "./companyTypes";
import { TApplicant, TJob, TJobWrite } from "./jobTypes";
import { TJobTitle, TSkill, TLanguage } from "./tagTypes";

export type TUserBase = {
  general: TGeneral;
  settings?: {
    SMSNotifications?: boolean;
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
  general: TGeneral;
  freelancer?: TFreelancerRead;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployerRead;
  settings?: {
    SMSNotifications?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TUser = Omit<TUserRead, "employer"> & {
  employer?: TEmployer;
};

export type TUserWrite = {
  general: TGeneralWrite;
  freelancer?: TFreelancerWrite;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployerWrite;
  settings?: {
    SMSNotifications?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TGeneralWrite = {
  uid: string;
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
  gender: "female" | "male" | "other";
  photo: { url: string; originalUrl: string };
  jobTitles: string[];
  skills: string[];
  languages: string[];
  experience: TExperience[];
  education: TEducation[];
  unapprovedTags?: TFreelancerUnapprovedTags | null;
  jobs: DocumentReference<TJobWrite>[]; // TODO
  status: "inReview" | "approved" | "denied" | "requiresSignature";
  social?: TFreelancerSocial;
  address: TFreelancerAddress | null;
  company: TFreelancerCompany | null;
};

export type TFreelancerRead = TFreelancerBase & {
  contract?: TFreelancerContractRead;
};

export type TFreelancer = TFreelancerRead;

export type TFreelancerWrite = TFreelancerBase & {
  contract?: TFreelancerContractWrite;
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
  gender: "female" | "male" | "other" | "";
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
};
