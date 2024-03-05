import {
  arrayUnion,
  doc,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/init";
import {
  TFreelancerApplicant,
  TJobStatus,
  TJobWrite,
  TLog,
  TLogWrite,
} from "../../../types/jobTypes";
import { updateDoc } from "../../updateDoc";

export async function updateJobStatus(
  jobId: string,
  status: TJobStatus,
  log: TLog
) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    status: status,
    logs: arrayUnion(log),
  })
    .then(() => true)
    .catch(() => false);
}

// Adds new documentId and documentStorageUrl to job and removes all existing signatures
export const resetJobContractProcess = async (
  jobId: string,
  documentId: string,
  documentStorageUrl: string,
  log: TLog
) => {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    documentId,
    documentStorageUrl,
    signatures: null,
    logs: arrayUnion(log),
  })
    .then(() => true)
    .catch((err) => {
      console.error(err);
      return false;
    });
};

// Update selected applicants list with the list provided
export async function updateSelectedApplicants(
  jobId: string,
  updatedApplicants: TFreelancerApplicant[]
) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  const applicantsRefList = updatedApplicants.map((a) => {
    return doc(jobRef, "applicants", a.id);
  });

  return await updateDoc(jobRef, {
    selectedApplicants: applicantsRefList,
  })
    .then(() => true)
    .catch(() => false);
}

// Submit the list of selectedApplicants so company can view and select them
export async function submitSelectedApplicants(jobId: string) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  const log: TLogWrite = {
    status: "chooseFreelancers",
    date: Timestamp.fromDate(new Date()),
    title: "Giggarar valdir",
    description: "Giggarar valdir og tilkynning send á stofnanda verkefnis",
  };

  return await updateDoc(jobRef, {
    status: "chooseFreelancers",
    logs: arrayUnion(log),
  })
    .then(() => true)
    .catch(() => false);
}
