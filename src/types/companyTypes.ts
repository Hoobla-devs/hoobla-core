import { DocumentReference, Timestamp } from "@firebase/firestore";
import { TJob, TJobWrite } from "./jobTypes";
import { TEmployerUser } from "./userTypes";

export type TCompanyBase = {
  name: string;
  ssn: string;
  phone: string;
  address: {
    address: string;
    postcode: string;
    city: string;
  };
  website: string;
  size: number;
  logo: { url: string };
};

export type TCompanyRead = TCompanyBase & {
  invites: TInvite[];
  employees: DocumentReference<TEmployerUser>[]; // TODO:   DocumentReference<TProgramWrite, DocumentData>;
  jobs: DocumentReference<TJobWrite>[];
  creator: DocumentReference<TEmployerUser>;
  id: string;
};
export type TInvite = {
  token: string;
  email: string;
  date: Date;
};

export type TCompany = TCompanyRead;

export type TCompanyWrite = TCompanyBase & {
  employees: DocumentReference<TEmployerUser>[];
  jobs: DocumentReference<TJobWrite>[];
  creator: DocumentReference<TEmployerUser>;
  invites: TInviteWrite[];
};

export type TInviteWrite = {
  token: string;
  email: string;
  date: Timestamp;
};

// * Form Types

export type TCompanyCreatorData = {
  ssn: string;
  name: string;
  phone: string;
  position: string;
};

export type TCompanyFormData = Omit<TCompanyBase, "logo"> & {
  invites: string[];
  logo: { originalFile: File; file: File; url: string } | null;
  oldLogo?: { url: string };
  creator?: TCompanyCreatorData;
};
