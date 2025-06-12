import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  collectionGroup,
  query,
  orderBy,
  limit,
  startAfter,
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
  TJobInfoRead,
  TJobRead,
  TJobRelation,
  TJobStatus,
  TJobWithAllData,
  TJobWithCompany,
  TLog,
} from '../../../types/jobTypes';
import { TEmployerUser, TUserRead } from '../../../types/userTypes';
import {
  getCompany,
  getCompanyById,
  getCompanyWithEmployees,
} from '../../companies/get';
import { getAllApplicants } from '../../jobs/applicants/get';
import { getEmployer, getFreelancer, getUserById } from '../../users/get';
import { userConverter } from '../../../converters/user';
import { companyConverter } from '../../../converters/company';
import { getJobEmployees } from '../../jobs/get';

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

// Define a helper type for optional relations
type OptionalRelations = {
  company?: TCompany;
  creator?: TEmployerUser;
  applicants?: TFreelancerApplicant[];
  selectedApplicants?: TFreelancerApplicant[];
  freelancers?: TFreelancerApplicant[];
  employees?: TJobEmployee[];
};

// Modify TJobWithRelations to make all relations optional
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
  relations: TJobRelation[] = []
): Promise<TJobWithRelations> {
  const jobRef = doc(db, 'jobs', jid).withConverter(jobConverter);
  const jobSnap = await getDoc(jobRef);
  const job = jobSnap.data();
  if (!job) throw new Error('Job not found');

  const jobApplicants = await getAllApplicants(
    collection(jobRef, 'applicants') as CollectionReference<TApplicantWrite>
  );

  const applicantsWithFreelancerProps: TFreelancerApplicant[] =
    await Promise.all(
      jobApplicants.map(async applicant => {
        const freelancer = await getFreelancer(applicant.id);
        return {
          ...applicant,
          ...freelancer,
        };
      })
    );

  const result: TJobWithRelations = {
    ...job,
    employees: undefined,
    company: undefined,
    applicants: undefined,
    selectedApplicants: undefined,
    creator: undefined,
    freelancers: undefined,
  };

  const promises: Promise<void>[] = [];

  if (relations.includes('creator')) {
    promises.push(
      getEmployer(job.creator.id)
        .then(creator => {
          result.creator = creator;
        })
        .catch(err => {
          console.log('Error getting creator', err);
        })
    );
  }

  if (relations.includes('company')) {
    promises.push(
      getCompany(job.company)
        .then(company => {
          result.company = company;
        })
        .catch(err => {
          console.log('Error getting company', err);
        })
    );
  }

  if (relations.includes('employees')) {
    promises.push(
      getJobEmployees(job.id)
        .then(employees => {
          result.employees = employees;
        })
        .catch(err => {
          console.log('Error getting employees', err);
          result.employees = [];
        })
    );
  }

  if (relations.includes('applicants')) {
    result.applicants = applicantsWithFreelancerProps;
  }

  if (relations.includes('freelancers')) {
    result.freelancers = applicantsWithFreelancerProps.filter(applicant =>
      job.freelancers.some(freelancerRef => freelancerRef.id === applicant.id)
    );
  }

  // Execute all promises in parallel
  await Promise.all(promises);

  // TODO: This doesn't work if applicants are not present
  if (relations.includes('selectedApplicants') && result.applicants) {
    result.selectedApplicants = result.applicants.filter(applicant =>
      job.selectedApplicants.some(
        selected => selected.id === applicant.general.uid
      )
    );
  }

  return result;
}

export type TJobWithAllRelations = {
  job: {
    title: string;
    id: string;
    status: TJobStatus;
    deadline: Date | undefined;
    info: TJobInfoRead;
  };
  logs: TLog[];
  company: {
    name: string;
    logo: string;
    id: string;
    phone: string;
  };
  applicantsCount: number;
  creator: TUserRead;
  employees: TJobEmployee[];
  freelancers: TFreelancerApplicant[];
  selectedApplicants: TFreelancerApplicant[];
};

export async function getJobsWithRelations(
  pageSize: number = 10,
  lastDoc?: any
): Promise<{
  jobs: TJobWithAllRelations[];
  lastDoc: any;
  hasMore: boolean;
}> {
  const jobsQuery = query(
    collection(db, 'jobs').withConverter(jobConverter),
    limit(pageSize),
    ...(lastDoc ? [startAfter(lastDoc)] : [])
  );

  const [jobsSnapshot, applicantDocs, companies, users] = await Promise.all([
    getDocs(jobsQuery),
    getDocs(collectionGroup(db, 'applicants')).then(docs =>
      docs.docs.map(doc => ({
        applicant: doc.data(),
        jobId: doc.ref.parent.parent?.id,
      }))
    ) as Promise<{ applicant: TApplicantRead; jobId: string }[]>,
    getDocs(collection(db, 'companies').withConverter(companyConverter)).then(
      docs => docs.docs.map(doc => doc.data())
    ),
    getDocs(collection(db, 'users').withConverter(userConverter)).then(docs =>
      docs.docs.map(doc => doc.data())
    ),
  ]);

  const jobs = jobsSnapshot.docs.map(doc => doc.data());
  const lastVisible = jobsSnapshot.docs[jobsSnapshot.docs.length - 1];
  const hasMore = jobsSnapshot.docs.length === pageSize;

  // Gather all related document IDs
  const applicantsByJob: Record<string, TApplicantRead[]> = {};
  const companiesMap: Record<string, TCompanyRead> = {};
  const usersMap: Record<string, TUserRead> = {};

  applicantDocs.forEach(applicant => {
    if (!applicant.jobId) return;
    if (!applicantsByJob[applicant.jobId]) {
      applicantsByJob[applicant.jobId] = [];
    }
    applicantsByJob[applicant.jobId]?.push(applicant.applicant);
  });

  companies.forEach(company => {
    companiesMap[company.id] = company;
  });

  users.forEach(user => {
    usersMap[user.general.uid] = user;
  });

  // Process each job with its relations
  const mappedJobs = jobs.map(job => {
    return {
      job: {
        title: job.name,
        id: job.id,
        status: job.status,
        deadline: job.jobInfo.deadline,
        info: job.jobInfo,
      },
      logs: job.logs,
      company: {
        name: companiesMap[job.company.id].name,
        logo: companiesMap[job.company.id].logo.url,
        id: companiesMap[job.company.id].id,
        phone: companiesMap[job.company.id].phone.number,
      },
      applicantsCount: applicantsByJob[job.id]
        ? applicantsByJob[job.id].length
        : 0,
      creator: usersMap[job.creator.id],
      employees: [],
      freelancers: [],
      selectedApplicants: [],
    };
  });

  return {
    jobs: mappedJobs,
    lastDoc: lastVisible,
    hasMore,
  };
}

// Keep the original function for backward compatibility
export async function getAllJobsWithRelations(): Promise<
  TJobWithAllRelations[]
> {
  const { jobs } = await getJobsWithRelations(1000); // Use a large number to get all jobs
  return jobs;
}
