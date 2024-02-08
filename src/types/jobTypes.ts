import { DocumentReference } from "firebase/firestore";
import { TJobTitle, TLanguage, TSkill } from "./baseTypes";
import { TCompany } from "./companyTypes";
import { TFreelancerUser } from "./userTypes";

export type TJob = {
  id: string;
  name: string;
  description: string;
  jobTitles: TJobTitle[];
  skills: TSkill[];
  languages: TLanguage[];
  unapprovedTags?: TUnapprovedTags | null;
  type: "notSure" | "partTime" | "timeframe";
  jobInfo: TJobInfo;
  terms: Date | null;
  company: DocumentReference<TCompany> | TCompany;
  logs: [{ date: Date; status: JobStatus }];
  status: JobStatus;
  selectedApplicants: DocumentReference<Applicant>[]; // Þau sem Hoobla 3-5 velja
  freelancers: DocumentReference<Applicant>[]; // Þau sem taka verkið að sér
  creator: DocumentReference<UserContext>;
  documentId: string;
  applicants: TApplicant[]; // Allir sem hafa sent inn umsókn
  signatures: TSignatures;
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

export type TApplicant = TFreelancerUser & {
  offer: TOffer;
};

export type TOffer = {
  date?: string;
  hourlyRate: string;
  fixedRate: string;
  message: string;
  acceptedRate?: "hourly" | "fixed";
};
