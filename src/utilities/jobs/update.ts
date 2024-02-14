import {
  updateDoc,
  doc,
  DocumentReference,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { TJobWrite } from "../../types/jobTypes";

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
