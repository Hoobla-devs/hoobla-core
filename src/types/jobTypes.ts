import { DocumentReference, Timestamp } from "firebase/firestore";
import { TCompany, TCompanyWrite } from "./companyTypes";
import { TTagsId } from "./refrencesTypes";
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
  freelancers: DocumentReference<TFreelancerUser>[]; // Þau sem taka verkið að sér
  selectedApplicants: DocumentReference<TFreelancerUser>[]; // Þau sem Hoobla 3-5 velja
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

// export type TJobWithApplicants = TJob & {
//   applicants: (TApplicant & TFreelancerUser)[];
// };

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

export type TReasonId =
  | "price"
  | "experience"
  | "skills"
  | "similarProject"
  | "knowsFreelancer";

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
  type: "notSure" | "partTime" | "timeframe";
  jobInfo: {
    start: string;
    end: string;
    percentage: number | null;
    numOfHours: string | null;
    deadline: number;
  };
  logs?: TLog[];
  status: TJobStatus;
};
