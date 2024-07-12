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
  TJobRead,
  TJobWithAllData,
  TJobWithCompany,
} from '../../../types/jobTypes';
import { TEmployerUser } from '../../../types/userTypes';
import { getCompany, getCompanyWithEmployees } from '../../companies/get';
import { getAllApplicants } from '../../jobs/applicants/get';
import { getFreelancer, getUserById } from '../../users/get';

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
