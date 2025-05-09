import { Timestamp } from 'firebase/firestore';

export type TErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type TErrorAction =
  | 'uploadPhoto'
  | 'createJob'
  | 'updateJob'
  | 'inviteEmployee'
  | 'createOffer'
  | 'updateOffer'
  | 'selectFreelancer'
  | 'approveContactRequest'
  | 'signContract'
  | 'createCompany'
  | 'addEmployeeToJobs'
  | 'updateCompany'
  | 'deleteCompany'
  | 'authentication'
  | 'other'
  | 'email';

export type TErrorBase = {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  job: {
    id: string;
    name: string;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
  action: TErrorAction;
  path: string;
  description: string;
  message: string;
  severity: TErrorSeverity;
};

export type TErrorWrite = TErrorBase & {
  timestamp: Timestamp;
};

export type TErrorRead = TErrorBase & {
  timestamp: Date;
};
