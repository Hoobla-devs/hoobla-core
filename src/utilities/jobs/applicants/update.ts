import { doc, DocumentReference } from "firebase/firestore";
import { applicantConverter } from "../../../converters/job";
import { db } from "../../../firebase/init";
import { TOffer, TJobWrite, TApplicantWrite } from "../../../types/jobTypes";
import { updateDoc } from "../../updateDoc";

export async function changeJobOffer(
  uid: string,
  jobId: string,
  offer: TOffer
) {
  // create the job reference
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  // take out all non numbers from offer
  offer = {
    ...offer,
    hourlyRate: offer.hourlyRate.replaceAll(/[^0-9]/g, "") || "",
    fixedRate: offer.fixedRate.replaceAll(/[^0-9]/g, "") || "",
  };

  const applicationRef = doc(jobRef, "applicants", uid).withConverter(
    applicantConverter
  ) as DocumentReference<TApplicantWrite>;

  await updateDoc(applicationRef, { offer }).catch((err) => {
    throw new Error(`Error adding application to job: ${err}`);
  });

  return jobRef;
}
