import {
  arrayUnion,
  doc,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/init";
import {
  TFreelancerApplicant,
  TJob,
  TJobBase,
  TJobFormData,
  TJobStatus,
  TJobWithAllData,
  TJobWrite,
  TLog,
  TLogWrite,
  TReasonId,
  TSignatures,
  TUnapprovedTags,
} from "../../../types/jobTypes";
import { updateDoc } from "../../updateDoc";

// TODO: This function can be used to update more info from the jobPage. Update as needed
export async function updateJobInfo(jobId: string, jobInfo: TJobWithAllData) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    description: jobInfo.description,
    "jobInfo.deadline": jobInfo.jobInfo.deadline,
  })
    .then(() => true)
    .catch(() => false);
}

export async function updateJobSignatures(
  jobId: string,
  signatures: TSignatures
) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    signatures: signatures,
  })
    .then(() => true)
    .catch(() => false);
}

export async function updateJobFreelancer(
  jobId: string,
  freelancerId: string,
  notSelectedReason: TReasonId
) {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;
  const freelancerRef = doc(
    jobRef,
    "freelancers",
    freelancerId
  ) as DocumentReference<TFreelancerApplicant>;

  const success = await updateDoc(jobRef, {
    notSelectedReason: notSelectedReason,
    freelancers: [freelancerRef],
  })
    .then(() => true)
    .catch(() => false);

  return success;
}

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

export const addSignedContractToJob = async (
  jobId: string,
  documentStorageUrl: string,
  log: TLog
) => {
  const jobRef = doc(db, "jobs", jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    documentStorageUrl,
    logs: arrayUnion(log),
  })
    .then(() => true)
    .catch(() => false);
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

export async function addTagToJob(
  id: string,
  tagId: string,
  type: "jobTitles" | "skills" | "languages",
  updatedUnapprovedTags: TJobBase["unapprovedTags"]
) {
  const userRef = doc(db, "jobs", id) as DocumentReference<TJobWrite>;

  return await updateDoc(userRef, {
    [type]: arrayUnion(tagId),
    unapprovedTags: updatedUnapprovedTags ? updatedUnapprovedTags : null,
  })
    .then(() => true)
    .catch(() => false);
}

export async function updateJobApplication(
  job: TJob,
  jobFormData: TJobFormData
) {
  const jobRef = doc(db, "jobs", job.id) as DocumentReference<TJobWrite>;

  const { unapprovedTags, type } = jobFormData;
  const jobType = type as "notSure" | "partTime" | "timeframe";

  const noUnapprovedTags =
    !unapprovedTags ||
    Object.values(unapprovedTags).every((tag) => tag?.length === 0);

  return await updateDoc(jobRef, {
    name: jobFormData.name,
    description: jobFormData.description,
    "jobInfo.start": jobFormData.jobInfo.start || "",
    "jobInfo.end": jobFormData.jobInfo.end || "",
    "jobInfo.percentage":
      jobType === "partTime" ? jobFormData.jobInfo.percentage : null,
    "jobInfo.numOfHours":
      jobType === "timeframe"
        ? parseInt(jobFormData.jobInfo.numOfHours!) || null
        : null,
    unapprovedTags: noUnapprovedTags
      ? null
      : (unapprovedTags as TUnapprovedTags),
    type: jobType,
    jobTitles: jobFormData.jobTitles,
    skills: jobFormData.skills,
    languages: jobFormData.languages,
  })
    .then(() => true)
    .catch((err) => false);
}
