import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  collectionGroup,
} from 'firebase/firestore';
import { jobConverter } from '../../../converters/job';
import { db } from '../../../firebase/init';
import { TCompany, TCompanyRead } from '../../../types/companyTypes';
import {
  TApplicantRead,
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
  const [applicants, employeeIds, companies] = await Promise.all([
    getAllApplicants(applicantsCollection),
    getDocs(employeesCollection).then(employees =>
      employees.docs.map(doc => doc.id)
    ),
    getDocs(collection(db, 'companies').withConverter(companyConverter)).then(
      companies => companies.docs.map(doc => doc.data())
    ),
  ]);
  console.timeEnd('getCollections');

  console.time('getUsers');
  const users = await Promise.all(
    [...applicants.map(a => a.id), ...employeeIds].map(async id => {
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
    applicants,
    companies
  );
  return jobWithRelations;
}

// Fetch all jobs and their relations efficiently
export async function getAllJobsWithRelations(
  relations: TJobRelation[]
): Promise<TJobWithRelations[]> {
  // Fetch all jobs first
  const jobDocs = await getDocs(
    collection(db, 'jobs').withConverter(jobConverter)
  );
  const jobs = jobDocs.docs.map(doc => doc.data());

  // Gather all related document IDs
  const userIds = new Set<string>();
  const companyIds = new Set<string>();

  console.time('getRelations');
  jobs.forEach(async job => {
    if (relations.includes('company') && job.company?.id) {
      companyIds.add(job.company.id);
    }
    if (relations.includes('creator') && job.creator?.id) {
      userIds.add(job.creator.id);
    }
    if (relations.includes('employees') && job.employees) {
      job.employees.forEach(e => userIds.add(e.id));
    }
    if (relations.includes('selectedApplicants') && job.selectedApplicants) {
      job.selectedApplicants.forEach(a => userIds.add(a.id));
    }
    if (relations.includes('applicants')) {
      const applicantsCollection = collection(db, 'jobs', job.id, 'applicants');
      const applicants = await getDocs(applicantsCollection);
      console.log('applicants size', applicants.docs.length);
      applicants.docs.forEach(doc => userIds.add(doc.id));
    }
  });
  console.timeEnd('getRelations');

  console.log('userIds', userIds.size);
  console.log('companyIds', companyIds.size);

  // Batch fetch users and companies in parallel
  const [users, companies] = await Promise.all([
    Promise.all(
      [...userIds].map(id =>
        getDoc(doc(db, 'users', id).withConverter(userConverter)).then(doc =>
          doc.data()
        )
      )
    ).then(results =>
      results.filter((user): user is TUserRead => user !== undefined)
    ),
    Promise.all(
      [...companyIds].map(id =>
        getDoc(doc(db, 'companies', id).withConverter(companyConverter)).then(
          doc => doc.data()
        )
      )
    ).then(results =>
      results.filter(
        (company): company is TCompanyRead => company !== undefined
      )
    ),
  ]);

  // fetch all applicants
  const applicantDocs = await getDocs(collectionGroup(db, 'applicants'));
  const applicants = applicantDocs.docs.map(doc =>
    doc.data()
  ) as TApplicantRead[];

  // Process each job with its relations
  return jobs.map(job =>
    processJobRelations(relations, job, users, applicants, companies)
  );
}

function processJobRelations(
  relations: TJobRelation[],
  job: TJob,
  users: TUserRead[],
  applicants: TApplicantRead[],
  companies: TCompanyRead[]
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
    result.company = companies.find(c => c.id === job.company.id);
  }
  console.timeEnd('getCompany');

  // TODO: Put applicant details such as offer and contactApproval in the applicant object
  if (relations.includes('applicants')) {
    // Each entry here should have the user info as well as the applicant info
    const applicantsWithUser = applicants
      .map(applicant => {
        const user = users.find(u => u.general.uid === applicant.id);
        return user ? { ...applicant, ...user } : null;
      })
      .filter(Boolean);
    result.applicants = applicantsWithUser as unknown as TFreelancerApplicant[];
  }

  if (relations.includes('freelancers')) {
    result.freelancers = result.applicants?.filter(applicant =>
      job.freelancers.some(f => f.id === applicant.general.uid)
    );
  }

  if (relations.includes('selectedApplicants')) {
    result.selectedApplicants = result.applicants?.filter(applicant =>
      job.selectedApplicants.some(s => s.id === applicant.id)
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

  return result;
}
