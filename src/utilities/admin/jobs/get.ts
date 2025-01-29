import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  collectionGroup,
} from 'firebase/firestore';
import { applicantConverter, jobConverter } from '../../../converters/job';
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

  const test = collectionGroup(db, 'applicants');

  console.time('getRelations');
  // Get all applicants at once using collectionGroup
  const allApplicants = (
    await getDocs(collectionGroup(db, 'applicants'))
  ).docs.reduce(
    (acc, doc) => {
      const jobId = doc.ref.parent.parent?.id;
      if (!jobId) return acc;

      // Initialize array only if needed
      acc[jobId] = acc[jobId] || [];
      acc[jobId].push(doc.id);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Process all other relations without awaiting
  jobs.forEach(job => {
    if (relations.includes('company') && job.company?.id) {
      companyIds.add(job.company.id);
    }
    if (relations.includes('creator') && job.creator?.id) {
      userIds.add(job.creator.id);
    }
    if (relations.includes('employees') && job.employees) {
      job.employees.forEach(e => userIds.add(e.id));
    }
    // Add applicants for this job
    if (allApplicants[job.id]) {
      allApplicants[job.id].forEach(applicantId => userIds.add(applicantId));
    }
  });
  console.timeEnd('getRelations');

  // Batch fetch users, companies, and applicants in parallel
  console.time('getUsersAndCompanies');
  const [users, companies, applicants] = await Promise.all([
    Promise.all(
      Array.from(userIds).map(id =>
        getDoc(doc(db, 'users', id).withConverter(userConverter)).then(doc =>
          doc.data()
        )
      )
    ).then(results =>
      results.filter((user): user is TUserRead => user !== undefined)
    ),
    Promise.all(
      Array.from(companyIds).map(id =>
        getDoc(doc(db, 'companies', id).withConverter(companyConverter)).then(
          doc => doc.data()
        )
      )
    ).then(results =>
      results.filter(
        (company): company is TCompanyRead => company !== undefined
      )
    ),
    getDocs(
      collectionGroup(db, 'applicants').withConverter(applicantConverter)
    ).then(docs => docs.docs.map(doc => doc.data()) as TApplicantRead[]),
  ]);

  console.timeEnd('getUsersAndCompanies');

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

  if (relations.includes('company')) {
    result.company = companies.find(c => c.id === job.company.id);
  }

  if (relations.includes('applicants')) {
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
