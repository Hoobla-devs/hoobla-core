import { doc, DocumentReference, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TJobWrite } from "../../types/jobTypes";
import { updateDoc } from "../updateDoc";

export async function agreeTerms(jobId: string) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  const mission = await updateDoc(jobRef, {
    terms: new Date(),
    logs: arrayUnion({
      date: new Date(),
      status: "termsAccepted",
      title: "Skilmálar samþykktir",
      description: "Fyrirtæki hefur samþykkt skilmála Hoobla.",
    }),
  })
    .catch((err) => {
      throw new Error(`Error agreeing to terms: ${err}`);
    })
    .then(() => true);

  return mission;
}

export async function finishJob(jobId: string) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    status: "completed",
    logs: arrayUnion({
      date: new Date(),
      status: "completed",
    }),
  })
    .then(() => true)
    .catch(() => false);
}

export async function updateJob(jobId: string) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    status: "completed",
    logs: arrayUnion({
      date: new Date(),
      status: "completed",
    }),
  })
    .then(() => true)
    .catch(() => false);
}
