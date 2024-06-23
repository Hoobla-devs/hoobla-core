import {
  getDocs,
  query,
  collection,
  where,
  DocumentReference,
  getDoc,
  doc,
  CollectionReference,
} from 'firebase/firestore';
import { jobConverter } from '../../converters/job';
import { db } from '../../firebase/init';
import { TCompany } from '../../types/companyTypes';
import {
  TApplicant,
  TApplicantWrite,
  TFreelancerApplicant,
  TJob,
  TJobWithApplicants,
  TJobWithCompany,
  TJobWrite,
  TOffer,
  TJobEmployeeWrite,
  TJobEmployee,
} from '../../types/jobTypes';
import { getCompany } from '../companies/get';
import { getFreelancer, getUserById, getUserGeneralInfo } from '../users/get';
import { getAllApplicants, getApplicant } from './applicants/get';

async function _getJobFromRef(jobRef: DocumentReference<TJobWrite>) {
  const jobSnap = await getDoc(jobRef.withConverter(jobConverter));
  if (!jobSnap.exists()) {
    throw new Error('Job does not exist.');
  }
  const jobData = jobSnap.data();
  return jobData;
}

// Get job with applicants, employees, and company
export async function getJobWithApplicantsAndEmployees(
  ref: string | DocumentReference<TJobWrite>
) {
  const job = await getJobWithApplicants(ref);

  const employees: TJobEmployee[] = await Promise.all(
    job.employees?.map(async (employee: TJobEmployeeWrite) => {
      const user = await getUserGeneralInfo(employee.user.id);
      return {
        id: employee.user.id,
        name: user.name,
        email: user.email,
        position: employee.position,
        permission: employee.permission,
      };
    }) || []
  );

  return { ...job, employees };
}

export async function getJob(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJob> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);

  let applicants: TApplicant[] = [];

  return { ...job, applicants: applicants };
}

export async function getJobWithCompany(
  ref: string | DocumentReference<TJobWrite>,
  applicantId?: string
): Promise<TJobWithCompany> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);
  const company: TCompany = await getCompany(job.company);

  let applicants: TApplicant[] = [];

  if (applicantId) {
    // get applicants
    const applicant = await getApplicant(
      doc(ref, 'applicants', applicantId) as DocumentReference<TApplicantWrite>
    ).catch(() => null);

    if (applicant) {
      applicants = [applicant];
    }
  }

  let acceptedOffer: TOffer | null = null;

  if (job.freelancers.length > 0) {
    // get selected applicant
    const selectedApplicantRef = job.freelancers[0];
    const applicant = await getApplicant(
      doc(
        ref,
        'applicants',
        selectedApplicantRef.id
      ) as DocumentReference<TApplicantWrite>
    ).catch(() => null);

    if (applicant) {
      acceptedOffer = applicant.offer;
    }
  }

  return {
    ...job,
    ...(acceptedOffer && { acceptedOffer }),
    applicants: applicants,
    company,
  };
}

export async function getJobWithApplicants(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJobWithApplicants> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);

  const applicants = await getAllApplicants(
    collection(
      db,
      'jobs',
      ref.id,
      'applicants'
    ) as CollectionReference<TApplicantWrite>
  );

  const freelancerApplicants: TFreelancerApplicant[] = await Promise.all(
    applicants.map(async a => {
      const freelancer = await getFreelancer(a.id);
      return { ...a, ...freelancer };
    })
  );

  return { ...job, applicants: freelancerApplicants };
}

export async function getJobWithSelectedApplicant(
  ref: string | DocumentReference<TJobWrite>,
  applicantId: string
): Promise<TJobWithApplicants> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const applicantRef = doc(
    db,
    'jobs',
    ref.id,
    'applicants',
    applicantId
  ) as DocumentReference<TApplicantWrite>;

  const [job, applicant, freelancer] = await Promise.all([
    _getJobFromRef(ref),
    getApplicant(applicantRef),
    getFreelancer(applicantId),
  ]);

  const freelancerApplicant: TFreelancerApplicant = {
    ...applicant,
    ...freelancer,
  };

  return { ...job, applicants: [freelancerApplicant] };
}

export async function getApprovedJobs(): Promise<TJobWithCompany[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'jobs'),
      where('status', '==', 'approved'),
      where('documentId', '==', null)
    )
  );

  const approvedJobsPromise = querySnapshot.docs.map(async doc => {
    const job = await _getJobFromRef(doc.ref as DocumentReference<TJobWrite>);
    const company: TCompany = await getCompany(job.company);

    return { ...job, applicants: [], company };
  });

  const approvedJobs: TJobWithCompany[] =
    await Promise.all(approvedJobsPromise);

  return approvedJobs;
}
