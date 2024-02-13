import { DocumentReference, Timestamp } from "@firebase/firestore";
import { TJob } from "./jobTypes";
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
  id: string;
  invites: TInvite[];
  employees: string[]; // TODO:   DocumentReference<TProgramWrite, DocumentData>;
  jobs: string[];
  creator: string;
};
export type TInvite = {
  token: string;
  email: string;
  date: Date;
};

export type TCompany = TCompanyRead;

export type TCompanyWrite = TCompanyBase & {
  employees: DocumentReference<TEmployerUser>[];
  jobs: DocumentReference<TJob>[];
  creator: DocumentReference<TEmployerUser>;
  invites: TInviteWrite[];
};

export type TInviteWrite = {
  token: string;
  email: string;
  date: Timestamp;
};
