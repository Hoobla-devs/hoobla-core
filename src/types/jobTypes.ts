import { DocumentReference, Timestamp } from "firebase/firestore";
import { TCompany } from "./companyTypes";
import { TTagsId } from "./refrencesTypes";
import { TEmployerUser, TFreelancerUser } from "./userTypes";

export type TJobBase = {
  name: string;
  description: string;
  unapprovedTags?: TUnapprovedTags | null;
  type: "notSure" | "partTime" | "timeframe";
  jobInfo: TJobInfo;
  status: TJobStatus;
  documentId: string;
  signatures: TSignatures;
  company: DocumentReference<TCompany>;
  creator: DocumentReference<TEmployerUser>;
  freelancers: DocumentReference<TFreelancerUser>[]; // Þau sem taka verkið að sér
  selectedApplicants: DocumentReference<TFreelancerUser>[]; // Þau sem Hoobla 3-5 velja
} & TTagsId;

export type TJobWrite = TJobBase & {
  terms: Timestamp | null;
  logs: TLogWrite[];
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
};

export type TJob = TJobRead & {
  // Það sem er ekki í write:
  applicants?: TApplicant[]; // TODO: breyta í map?   // Allir sem hafa sent inn umsókn
};

export type TJobWithCompany = Omit<TJob, "company"> & {
  company: TCompany;
};

export type TJobStatus =
  | "inReview"
  | "approved"
  | "denied"
  | "chooseFreelancers"
  | "requiresSignature"
  | "inProgress"
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

export type TJobInfo = {
  start: string;
  end: string;
  percentage: number | null;
  numOfHours: number | null;
};

export type TApplicantWrite = {
  offer: {
    date: Timestamp;
    hourlyRate: string;
    fixedRate: string;
    message: string;
    acceptedRate?: "hourly" | "fixed" | "";
  };
};

export type TApplicantRead = {
  offer: TOffer;
  id: string;
};

export type TApplicant = TApplicantRead;

export type TOffer = {
  date: Date;
  hourlyRate: string;
  fixedRate: string;
  message: string;
  acceptedRate?: "hourly" | "fixed" | "";
};
