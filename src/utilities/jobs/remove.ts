import {
  doc,
  DocumentReference,
  updateDoc,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { TJobWrite } from "../../types/jobTypes";

export async function removeJob(companyId: string, jobId: string) {
  // create the job reference
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  const mission1 = await updateDoc(doc(db, "companies", companyId), {
    jobs: arrayRemove(jobRef),
  })
    .catch((err) => {
      throw new Error(`Error adding job to company: ${err}`);
    })
    .then(() => true);

  const mission2 = await deleteDoc(jobRef)
    .catch((err) => {
      throw new Error(`Error removing application from job: ${err}`);
    })
    .then(() => true);

  return mission1 && mission2;
}
