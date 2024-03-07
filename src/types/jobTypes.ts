import { DocumentReference, Timestamp } from "firebase/firestore";
import { TCompany, TCompanyWrite } from "./companyTypes";
import { TTagsId } from "./refrencesTypes";
import { TJobTitle } from "./tagTypes";
import { TEmployerUser, TFreelancerUser } from "./userTypes";

export type TJobBase = {
  name: string;
  description: string;
  unapprovedTags?: TUnapprovedTags | null;
  type: "notSure" | "partTime" | "timeframe";
  status: TJobStatus;
  documentId: string | null;
  documentStorageUrl?: string;
  signatures: TSignatures | null;
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
};

export type TLogWrite = {
  date: Timestamp;
  status: TJobStatus;
  title?: string;
  description?: string;
};

export type TJobRead = TJobBase & {
  id: string;
  terms: Date | null;
  logs: TLog[];
  jobInfo: TJobInfoRead;
};

export type TJob = TJobRead & {
  // Það sem er ekki í write:
  applicants?: TApplicant[]; // TODO: breyta í map?   // Allir sem hafa sent inn umsókn
};

export type TJobWithApplicants = Omit<TJob, "applicants"> & {
  applicants: TFreelancerApplicant[];
  // selectedApplicants: (TFreelancerApplicant)[];
  // freelancers: (TFreelancerApplicant)[];
};

export type TJobWithCompany = Omit<TJob, "company"> & {
  company: TCompany;
  acceptedOffer?: TOffer;
};

export type TJobStatus =
  | "inReview"
  | "approved"
  | "denied"
  | "chooseFreelancers"
  | "requiresSignature"
  | "inProgress"
  | "readyForReview"
  | "completed"
  | "cancelled";

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
    acceptedRate?: TOfferType | "";
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

export type TContactStatus = "requested" | "approved" | "denied";

export type TOffer = {
  date: Date;
  hourlyRate: string;
  fixedRate: string;
  message: string;
  acceptedRate?: TOfferType | "";
};

export type TReasonId =
  | "price"
  | "experience"
  | "skills"
  | "similarProject"
  | "knowsFreelancer";

export type TOfferType = "hourly" | "fixed";

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
  type: "notSure" | "partTime" | "timeframe" | "";
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
  jobTitles?: Omit<TJobTitle, "relatedJobs" | "relatedSkills">[];
};
