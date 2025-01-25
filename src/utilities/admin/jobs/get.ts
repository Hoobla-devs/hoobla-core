import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { jobConverter } from '../../../converters/job';
import { db } from '../../../firebase/init';
import { TCompany } from '../../../types/companyTypes';
import {
  TApplicantWrite,
  TFreelancerApplicant,
  TJob,
  TJobEmployee,
  TJobRead,
  TJobRelation,
  TJobWithAllData,
  TJobWithCompany,
} from '../../../types/jobTypes';
import { TEmployerUser, TUserRead } from '../../../types/userTypes';
import {
  getCompany,
  getCompanyById,
  getCompanyWithEmployees,
} from '../../companies/get';
import { getAllApplicants } from '../../jobs/applicants/get';
import { getFreelancer, getUserById } from '../../users/get';
import { userConverter } from '../../../converters/user';
import { companyConverter } from '../../../converters/company';

export async function getAllJobs(): Promise<TJobWithCompany[]> {
  const jobsRef = collection(db, 'jobs').withConverter(
    jobConverter
  ) as CollectionReference<TJobRead>;
  const jobsSnap = await getDocs(jobsRef);

  const jobsPromise = jobsSnap.docs.map(async doc => {
    const job = doc.data();
    const jobCompany = job.company;
    const company: TCompany = await getCompany(jobCompany);
    const applicants = await getAllApplicants(
      collection(
        db,
        'jobs',
        job.id,
        'applicants'
      ) as CollectionReference<TApplicantWrite>
    );
    return { ...job, company, applicants };
  });

  const jobsWithCompany: TJobWithCompany[] = await Promise.all(jobsPromise);

  return jobsWithCompany;
}

type OptionalRelations = {
  company?: TCompany;
  creator?: TEmployerUser;
  applicants?: TFreelancerApplicant[];
  selectedApplicants?: TFreelancerApplicant[];
  freelancers?: TFreelancerApplicant[];
  employees?: TJobEmployee[];
};

export type TJobWithRelations = Omit<
  TJob,
  | 'employees'
  | 'company'
  | 'applicants'
  | 'selectedApplicants'
  | 'freelancers'
  | 'creator'
> &
  OptionalRelations;

export async function getJobWithRelations(
  jid: string,
  relations: TJobRelation[]
): Promise<TJobWithRelations> {
  const jobRef = doc(db, 'jobs', jid).withConverter(jobConverter);
  const jobSnap = await getDoc(jobRef);
  const job = jobSnap.data();
  if (!job) throw new Error('Job not found');

  const applicantsCollection = collection(
    jobRef,
    'applicants'
  ) as CollectionReference<TApplicantWrite>;
  const employeesCollection = collection(
    jobRef,
    'employees'
  ) as CollectionReference<TJobEmployee>;

  console.time('getCollections');
  const [applicantIds, employeeIds] = await Promise.all([
    getDocs(applicantsCollection).then(applicants =>
      applicants.docs.map(doc => doc.id)
    ),
    getDocs(employeesCollection).then(employees =>
      employees.docs.map(doc => doc.id)
    ),
  ]);
  console.timeEnd('getCollections');

  console.time('getUsers');
  const users = await Promise.all(
    [...applicantIds, ...employeeIds].map(async id => {
      const userRef = doc(db, 'users', id).withConverter(userConverter);
      const userSnap = await getDoc(userRef);
      const user = userSnap.data();
      return user!;
    })
  );
  console.timeEnd('getUsers');

  const jobWithRelations = await processJobRelations(
    relations,
    job,
    users,
    applicantIds
  );
  return jobWithRelations;
}

export async function getAllJobsWithRelations(
  relations: TJobRelation[]
): Promise<TJobWithRelations[]> {
  // Fetch everything
  const [users, jobs] = await Promise.all([
    getDocs(collection(db, 'users').withConverter(userConverter)).then(users =>
      users.docs.map(doc => doc.data())
    ),
    getDocs(collection(db, 'jobs').withConverter(jobConverter)).then(jobs =>
      jobs.docs.map(doc => doc.data())
    ),
    getDocs(collection(db, 'companies').withConverter(companyConverter)).then(
      companies => companies.docs.map(doc => doc.data())
    ),
  ]);

  const jobsWithRelations = await Promise.all(
    jobs.map(job => processJobRelations(relations, job, users))
  );

  return jobsWithRelations;
}

async function processJobRelations(
  relations: TJobRelation[],
  job: TJob,
  users: TUserRead[],
  applicantIds: string[]
) {
  let result: TJobWithRelations = {
    ...job,
    employees: [],
    company: undefined,
    applicants: [],
    selectedApplicants: [],
    creator: undefined,
    freelancers: [],
  };

  console.time('getCompany');
  if (relations.includes('company')) {
    result.company = await getCompanyById(job.company.id);
  }
  console.timeEnd('getCompany');

  if (relations.includes('applicants')) {
    const applicants = users.filter(u => applicantIds?.includes(u.general.uid));
    result.applicants = applicants as unknown as TFreelancerApplicant[];
  }

  if (relations.includes('freelancers')) {
    result.freelancers = result.applicants?.filter(applicant =>
      job.freelancers.some(f => f.id === applicant.general.uid)
    );
  }

  if (relations.includes('selectedApplicants')) {
    result.selectedApplicants = result.applicants?.filter(applicant =>
      job.selectedApplicants.some(s => s.id === applicant.general.uid)
    );
  }

  if (relations.includes('employees')) {
    const employeeIds = job.employees?.map(e => e.id);
    const employees = users.filter(u => employeeIds?.includes(u.general.uid));
    result.employees = employees as unknown as TJobEmployee[];
  }

  if (relations.includes('creator')) {
    const creatorUser = users.find(u => u.general.uid === job.creator.id);
    if (creatorUser) {
      result.creator = creatorUser as unknown as TEmployerUser;
    }
  }

  if (relations.includes('company')) {
    result.company = await getCompanyById(job.company.id);
  }

  return result;
}
