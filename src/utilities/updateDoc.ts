import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";

import { TApplicantWrite, TJobWrite } from "../types/jobTypes";
import { TFreelancerWrite, TReviewWrite, TUserWrite } from "../types/userTypes";
import { TCompanyWrite } from "../types/companyTypes";
import { TNotificationWrite } from "../types/baseTypes";

type AllWrites =
  | TJobWrite
  | TUserWrite
  | TCompanyWrite
  | TApplicantWrite
  | TFreelancerWrite
  | TReviewWrite
  | TNotificationWrite;

export function updateDoc<T extends AllWrites>(
  ref: DocumentReference<T>,
  data: UpdateData<Partial<T>>
) {
  return firestoreUpdateDoc(ref, data);
}

// updateDoc(doc(db, "users", "uid") as DocumentReference<TJobWrite>, {
//   "jobInfo.numOfHours": 10,
//   "company.address.city": "Reykjavik",
//   jobInfo: { numOfHours: 10 },
// });

// DEMO
// const clientRef = doc(
//   db,
//   "clients",
//   "jfdkljal"
// ) as DocumentReference<ClientWrite>;

// // Type-safe for ClientProgramWrite
// updateDoc(clientRef, {
//   currentProgramId: "hdjskafhakjf",
// });

// const clientRe = doc(db, "clients", "jfdkljal") as DocumentReference<ClientProgramDayWrite>;

// // Type-safe for ClientProgramWrite
// updateDoc(clientRe, {  dayId: "jfkldsaj" });
