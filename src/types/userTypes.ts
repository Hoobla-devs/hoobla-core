import {
  TJobTitle,
  TSkill,
  TLanguage,
  TEducation,
  TExperience,
} from "./baseTypes";
import { TCompany } from "./companyTypes";

export type TUser = {
  general: TGeneral;
  //   freelancer?: TFreelancer;
  //   employer?: TEmployer;
  settings?: {
    SMSNotifications?: boolean;
    excludedJobTitleNotifications?: string[];
  };
};

export type TFreelancerUser = TUser & {
  freelancer: TFreelancer; // required
  freelancerForm?: TSavedFreelancerFormData;
};

export type TEmployerUser = TUser & {
  employer: TEmployer; // required
};

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
  unapprovedTags?: {
    jobTitles: string[];
    skills: string[];
    languages: string[];
  } | null;
  jobs: DocumentReference<Job>[]; // TODO
  status: "inReview" | "approved" | "denied";
  social?: {
    linkedIn: string;
    website: string;
  };
  address: {
    address: string;
    postcode: string;
    city: string;
  } | null;
  company: {
    name: string;
    ssn: string;
    address: {
      address: string;
      postcode: string;
      city: string;
    };
  } | null;
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
