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
  TJobWithEmployeesAndApplicants,
  TJobWithEmployees,
  TJobWithSelectedApplicants,
} from '../../types/jobTypes';
import { TFreelancerUser } from '../../types/userTypes';
import { getCompany, getCompanyEmployee } from '../companies/get';
import { getFreelancer, getUserById } from '../users/get';
import { getAllApplicants, getApplicant } from './applicants/get';
import { getAllEmployees } from './employees/get';

async function _getJobFromRef(jobRef: DocumentReference<TJobWrite>) {
  const jobSnap = await getDoc(jobRef.withConverter(jobConverter));
  if (!jobSnap.exists()) {
    throw new Error('Job does not exist.');
  }
  const jobData = jobSnap.data();
  return jobData;
}

// Temporary function to get job data on admin side
export async function getAdminJob(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJob> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }
  const job = await _getJobFromRef(ref);

  return job;
}

export async function getJob(
  ref: string | DocumentReference<TJobWrite>,
  userId: string
): Promise<TJob | undefined> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }
  const job = await _getJobFromRef(ref);

  const employeesCollectionRef = collection(ref, 'employees');
  const employeesSnapshot = await getDocs(employeesCollectionRef);
  const employees = employeesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  const userHasAccess = employees.some(e => e.id === userId);

  if (!userHasAccess) {
    return undefined;
  }

  return job;
}

export async function getJobWithSelectedApplicants(
  ref: string | DocumentReference<TJobWrite>,
  userId: string
): Promise<TJobWithSelectedApplicants | null> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const [job, employeesSnapshot] = await Promise.all([
    _getJobFromRef(ref),
    getDocs(collection(ref, 'employees')),
  ]);

  const isUserAnEmployee = employeesSnapshot.docs.some(
    doc => doc.id === userId
  );

  // If the user is not an employee of the job, return null
  if (!isUserAnEmployee) {
    return null;
  }

  let selectedApplicants: TFreelancerUser[] = [];

  try {
    const selectedApplicantIds = job.selectedApplicants.map(a => a.id);
    selectedApplicants = await Promise.all(
      selectedApplicantIds.map(async a => {
        const freelancer = await getFreelancer(a);
        return freelancer;
      })
    );
  } catch (error) {
    console.error(error);
  }

  return { ...job, selectedApplicants };
}

export async function getJobWithCompanyAndApplicant(
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

export async function getJobEmployees(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJobEmployee[]> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const employeeDocs = await getAllEmployees(
    collection(
      db,
      'jobs',
      ref.id,
      'employees'
    ) as CollectionReference<TJobEmployeeWrite>
  );

  const employees: TJobEmployee[] = await Promise.all(
    employeeDocs.map(async e => {
      const employee = await getUserById(e.id);
      return {
        id: e.id,
        name: employee.general.name,
        email: employee.general.email,
        photo: employee.general.photo?.url,
      };
    })
  );

  return employees;
}

export async function getJobWithEmployees(
  ref: string | DocumentReference<TJobWrite>
): Promise<TJobWithEmployees> {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const job = await _getJobFromRef(ref);

  const employeeDocs = await getAllEmployees(
    collection(
      db,
      'jobs',
      ref.id,
      'employees'
    ) as CollectionReference<TJobEmployeeWrite>
  );

  const employees: TJobEmployee[] = await Promise.all(
    employeeDocs.map(async e => {
      const employee = await getCompanyEmployee(job.company.id, e.id);
      return {
        id: e.id,
        name: employee.name,
        email: employee.email,
        photo: employee.photo,
      };
    })
  );

  return { ...job, employees };
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

// Get job with applicants, employees
export async function getJobWithApplicantsAndEmployees(
  ref: string | DocumentReference<TJobWrite>
) {
  if (typeof ref === 'string') {
    ref = doc(db, 'jobs', ref) as DocumentReference<TJobWrite>;
  }

  const [job, applicantDocs, employeeDocs] = await Promise.all([
    _getJobFromRef(ref),
    getAllApplicants(
      collection(
        db,
        'jobs',
        ref.id,
        'applicants'
      ) as CollectionReference<TApplicantWrite>
    ),
    getAllEmployees(
      collection(
        db,
        'jobs',
        ref.id,
        'employees'
      ) as CollectionReference<TJobEmployeeWrite>
    ),
  ]);

  const applicants: TFreelancerApplicant[] = await Promise.all(
    applicantDocs.map(async a => {
      const freelancer = await getFreelancer(a.id);
      return { ...a, ...freelancer };
    })
  );

  const employees: TJobEmployee[] = await Promise.all(
    employeeDocs.map(async e => {
      const user = await getUserById(e.id);
      return {
        id: e.id,
        name: user.general.name,
        email: user.general.email,
        permission: e.permission,
        photo: user.general.photo?.url,
        signer: e.signer || false,
      };
    })
  );

  return { ...job, applicants, employees };
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

  const approvedJobs: TJobWithCompany[] = await Promise.all(
    querySnapshot.docs.map(async doc => {
      const job = await _getJobFromRef(doc.ref as DocumentReference<TJobWrite>);
      const company: TCompany = await getCompany(job.company);

      return { ...job, applicants: [], company };
    })
  );

  return approvedJobs.filter(job => !job.hidden);
}
