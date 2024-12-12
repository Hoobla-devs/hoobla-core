import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from 'firebase/firestore';

import { TApplicantWrite, TJobWrite } from '../types/jobTypes';
import {
  TEmployerWrite,
  TFreelancerWrite,
  TReviewWrite,
  TUserWrite,
} from '../types/userTypes';
import { TCompanyEmployeeWrite, TCompanyWrite } from '../types/companyTypes';

type AllWrites =
  | TJobWrite
  | TUserWrite
  | TEmployerWrite
  | TCompanyEmployeeWrite
  | TCompanyWrite
  | TApplicantWrite
  | TFreelancerWrite
  | TReviewWrite;

export function updateDoc<T extends AllWrites>(
  ref: DocumentReference<T>,
  data: UpdateData<Partial<T>>
) {
  return firestoreUpdateDoc(ref, data);
}
