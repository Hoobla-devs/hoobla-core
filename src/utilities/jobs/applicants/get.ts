import {
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { applicantConverter } from "../../../converters/job";
import { db } from "../../../firebase/init";
import { TApplicantWrite } from "../../../types/jobTypes";

async function _getApplicantFromRef(
  applicantRef: DocumentReference<TApplicantWrite>
) {
  const applicantSnap = await getDoc(
    applicantRef.withConverter(applicantConverter)
  );
  if (!applicantSnap.exists()) {
    throw new Error("Applicant does not exist.");
  }
  const applicantData = applicantSnap.data();
  return applicantData;
}

export async function getAllApplicants(
  ref: CollectionReference<TApplicantWrite>
) {
  const applicantsSnap = await getDocs(ref.withConverter(applicantConverter));
  const applicants = applicantsSnap.docs.map((doc) => doc.data());
  return applicants;
}

export async function getApplicant(ref: DocumentReference<TApplicantWrite>) {
  const applicant = await _getApplicantFromRef(ref);
  return applicant;
}
