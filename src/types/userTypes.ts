import { DocumentReference, Timestamp } from "firebase/firestore";
import { TEducation, TExperience } from "./baseTypes";
import { TCompany } from "./companyTypes";
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
  freelancer?: TFreelancer;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployer;
  settings?: {
    SMSNotifications?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TUser = TUserRead;

export type TUserWrite = {
  general: TGeneralWrite;
  freelancer?: TFreelancer;
  freelancerForm?: TSavedFreelancerFormData;
  employer?: TEmployer;
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

export type TFreelancer = {
  gender: "female" | "male" | "other";
  photo: { url: string; originalUrl: string };
  jobTitles: TJobTitle[];
  skills: TSkill[];
  languages: TLanguage[];
  experience: TExperience[];
  education: TEducation[];
  unapprovedTags?: TFreelancerUnapprovedTags | null;
  jobs: DocumentReference<TJobWrite>[]; // TODO
  status: "inReview" | "approved" | "denied";
  social?: TFreelancerSocial;
  address: TFreelancerAddress | null;
  company: TFreelancerCompany | null;
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

export type TEmployer = {
  position: string;
  company: TCompany;
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
  jobTitles: TJobTitle[];
  skills: TSkill[];
  languages: TLanguage[];
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
