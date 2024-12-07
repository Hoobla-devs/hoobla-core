import {
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { jobConverter } from '../../../converters/job';
import { db } from '../../../firebase/init';
import { TCompany, TCompanyEmployee } from '../../../types/companyTypes';
import {
  TApplicantWrite,
  TFreelancerApplicant,
  TJob,
  TJobBase,
  TJobEmployee,
  TJobRead,
  TJobRelation,
  TJobWithAllData,
  TJobWithCompany,
} from '../../../types/jobTypes';
import { TEmployerUser, TUser } from '../../../types/userTypes';
import {
  getCompany,
  getCompanyById,
  getCompanyEmployee,
  getCompanyWithEmployees,
} from '../../companies/get';
import { getAllApplicants } from '../../jobs/applicants/get';
import { getJobEmployees } from '../../jobs/get';
import { getEmployer, getFreelancer, getUserById } from '../../users/get';

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

export async function getJobWithAllData(jid: string): Promise<TJobWithAllData> {
  const jobRef = doc(db, 'jobs', jid).withConverter(jobConverter);
  const jobSnap = await getDoc(jobRef);
  const job = jobSnap.data();
  if (!job) throw new Error('Job not found');

  const [company, applicants, creator] = await Promise.all([
    getCompanyWithEmployees(job.company),
    getAllApplicants(
      collection(jobRef, 'applicants') as CollectionReference<TApplicantWrite>
    ),
    getUserById(job.creator.id),
  ]);

  const freelancerApplicants: TFreelancerApplicant[] = await Promise.all(
    applicants.map(async a => {
      const freelancer = await getFreelancer(a.id);
      return { ...a, ...freelancer };
    })
  );

  // Freelancers selected for the job
  const freelancers = freelancerApplicants.filter(a => {
    return job.freelancers.find(
      freelancerRef => freelancerRef.id === a.general.uid
    );
  });

  // Freelancers picked by Hoobla for the job
  const selectedApplicants = freelancerApplicants.filter(a => {
    return job.selectedApplicants.find(
      freelancerRef => freelancerRef.id === a.general.uid
    );
  });

  return {
    ...job,
    company,
    applicants: freelancerApplicants,
    selectedApplicants,
    freelancers,
    creator: creator as unknown as TEmployerUser,
  };
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

export async function getAllJobsWithRelations(
  relations: TJobRelation[]
): Promise<TJobWithRelations[]> {
  const jobsRef = collection(db, 'jobs').withConverter(
    jobConverter
  ) as CollectionReference<TJobRead>;
  const jobsSnap = await getDocs(jobsRef);
  const jobsWithRelations = await Promise.all(
    jobsSnap.docs.map(job => getJobWithRelations(job.id, relations))
  );
  return jobsWithRelations;
}
