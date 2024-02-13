import { arrayUnion, doc, DocumentReference, setDoc } from "firebase/firestore";
import { applicantConverter } from "../../converters/job";
import { db } from "../../firebase/init";
import { TJobWrite, TOffer } from "../../types/jobTypes";
import { TUserWrite } from "../../types/userTypes";
import { updateDoc } from "../updateDoc";

export async function applyForJob(uid: string, jobId: string, offer: TOffer) {
  // create the job reference
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  // add the job to the user's applied jobs
  await updateDoc(doc(db, "users", uid) as DocumentReference<TUserWrite>, {
    "freelancer.jobs": arrayUnion(jobRef),
  }).catch((err) => {
    throw new Error(`Error adding job to user: ${err}`);
  });

  // take out all non numbers from offer
  offer = {
    ...offer,
    hourlyRate: offer.hourlyRate.replaceAll(/[^0-9]/g, "") || "",
    fixedRate: offer.fixedRate.replaceAll(/[^0-9]/g, "") || "",
  };

  const applicationRef = doc(jobRef, "applicants", uid).withConverter(
    applicantConverter
  );

  await setDoc(applicationRef, { offer }).catch((err) => {
    throw new Error(`Error adding application to job: ${err}`);
  });

  return jobRef;
}
