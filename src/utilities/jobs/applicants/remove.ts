import {
  doc,
  DocumentReference,
  updateDoc,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/init";
import { TJobWrite } from "../../../types/jobTypes";
import { TUserWrite } from "../../../types/userTypes";

export async function removeApplication(uid: string, jobId: string) {
  // create the job reference
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  // add the job to the user's applied jobs
  await updateDoc(doc(db, "users", uid) as DocumentReference<TUserWrite>, {
    "freelancer.jobs": arrayRemove(jobRef),
  }).catch((err) => {
    throw new Error(`Error adding job to user: ${err}`);
  });

  const applicationRef = doc(jobRef, "applicants", uid);

  return deleteDoc(applicationRef)
    .catch((err) => {
      throw new Error(`Error removing application from job: ${err}`);
    })
    .then(() => true);
}
