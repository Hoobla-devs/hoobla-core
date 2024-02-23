import {
  getDocs,
  query,
  collection,
  where,
  DocumentReference,
  getDoc,
  doc,
  CollectionReference,
} from "firebase/firestore";
import { jobConverter } from "../../converters/job";
import { db } from "../../firebase/init";
import { TCompany } from "../../types/companyTypes";
import {
  TApplicant,
  TApplicantWrite,
  TFreelancerApplicant,
  TJob,
  TJobWithApplicants,
  TJobWithCompany,
  TJobWrite,
} from "../../types/jobTypes";
import { TFreelancerUser } from "../../types/userTypes";
import { getCompany } from "../companies/get";
import { getFreelancer } from "../users/get";
import { getAllApplicants, getApplicant } from "./applicants/get";

async function _getJobFromRef(jobRef: DocumentReference<TJobWrite>) {
  const jobSnap = await getDoc(jobRef.withConverter(jobConverter));
  if (!jobSnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const jobData = jobSnap.data();
  return jobData;
}

export async function getJob(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJob> {
  if (typeof ref === "string") {
    ref = doc(db, "jobs", ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);

  let applicants: TApplicant[] = [];

  return { ...job, applicants: applicants };
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
    ).catch(() => null);

    if (applicant) {
      applicants = [applicant];
    }
  }

  return { ...job, applicants: applicants, company };
}

export async function getJobWithApplicants(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJobWithApplicants> {
  if (typeof ref === "string") {
    ref = doc(db, "jobs", ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);

  const applicants = await getAllApplicants(
    collection(
      db,
      "jobs",
      ref.id,
      "applicants"
    ) as CollectionReference<TApplicantWrite>
  );

  const freelancerApplicants: TFreelancerApplicant[] = await Promise.all(
    applicants.map(async (a) => {
      const freelancer = await getFreelancer(a.id);
      return { ...a, ...freelancer };
    })
  );

  return { ...job, applicants: freelancerApplicants };
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
