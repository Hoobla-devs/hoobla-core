import {
  getDocs,
  query,
  collection,
  where,
  DocumentReference,
  getDoc,
  doc,
} from "firebase/firestore";
import { jobConverter } from "../../converters/job";
import { db } from "../../firebase/init";
import { TCompany } from "../../types/companyTypes";
import {
  TApplicant,
  TApplicantRead,
  TApplicantWrite,
  TJobWithCompany,
  TJobWrite,
} from "../../types/jobTypes";
import { getCompany } from "../companies/get";
import { getApplicant } from "./applicants/get";

async function _getJobFromRef(jobRef: DocumentReference<TJobWrite>) {
  const jobSnap = await getDoc(jobRef.withConverter(jobConverter));
  if (!jobSnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const jobData = jobSnap.data();
  return jobData;
}

export async function getJobWithCompany(
  ref: string | DocumentReference<TJobWrite>,
  applicantId?: string
): Promise<TJobWithCompany> {
  if (typeof ref === "string") {
    ref = doc(db, "jobs", ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);
  const company: TCompany = await getCompany(job.company);

  let applicants: TApplicant[] = [];

  if (applicantId) {
    // get applicants
    const applicant = await getApplicant(
      doc(ref, "applicants", applicantId) as DocumentReference<TApplicantWrite>
    );
    applicants = [applicant];
  }

  return { ...job, applicants: applicants, company };
}

export async function getApprovedJobs(): Promise<TJobWithCompany[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, "jobs"),
      where("status", "==", "approved"),
      where("documentId", "==", null)
    )
  );

  const approvedJobsPromise = querySnapshot.docs.map(async (doc) => {
    const job = await _getJobFromRef(doc.ref as DocumentReference<TJobWrite>);
    const company: TCompany = await getCompany(job.company);

    return { ...job, applicants: [], company };
  });

  const approvedJobs: TJobWithCompany[] = await Promise.all(
    approvedJobsPromise
  );

  return approvedJobs;
}
