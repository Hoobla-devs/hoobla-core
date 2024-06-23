import {
  doc,
  DocumentReference,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { jobConverter } from '../../converters/job';
import { db } from '../../firebase/init';
import {
  TFreelancerApplicant,
  TJobEmployee,
  TJobEmployeeWrite,
  TJobRead,
  TJobWithApplicants,
  TJobWrite,
  TLogWrite,
} from '../../types/jobTypes';
import { TEmployerUser, TFreelancerUser } from '../../types/userTypes';
import { updateDoc } from '../updateDoc';

export async function agreeTerms(jobId: string) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const mission = await updateDoc(jobRef, {
    terms: new Date(),
    logs: arrayUnion({
      date: new Date(),
      status: 'termsAccepted',
      title: 'Skilmálar samþykktir',
      description: 'Fyrirtæki hefur samþykkt skilmála Hoobla.',
    }),
  })
    .catch(err => {
      throw new Error(`Error agreeing to terms: ${err}`);
    })
    .then(() => true);

  return mission;
}

export async function selectFreelancer(
  job: TJobWithApplicants,
  selectedFreelancer: TFreelancerApplicant,
  jobData: Partial<TJobWrite>
) {
  const jobRef = doc(db, 'jobs', job.id) as DocumentReference<TJobWrite>;

  const freelancerRef = doc(jobRef, 'applicants', selectedFreelancer.id);

  const log: TLogWrite = {
    date: Timestamp.fromDate(new Date()),
    status: job.status,
    description: `${selectedFreelancer.general.name} valinn fyrir verkefnið og samningur búinn til`,
    title: 'Giggari valinn',
  };

  return await updateDoc(jobRef, {
    freelancers: [freelancerRef],
    logs: arrayUnion(log),
    ...jobData,
  })
    .catch(err => {
      console.log(`Error selecting freelancer: ${err}`);
      return false;
    })
    .then(() => true);
}

export async function addCompanySignature(
  job: TJobRead,
  employerUser: TEmployerUser,
  jobData: Partial<TJobWrite>
) {
  const jobRef = doc(db, 'jobs', job.id) as DocumentReference<TJobWrite>;

  const company = employerUser.employer.company;

  const log: TLogWrite = {
    date: Timestamp.fromDate(new Date()),
    status: 'requiresSignature',
    description: `${company.name} hefur skrifað undir samning fyrir verkefnið ${job.name}`,
    title: 'Fyrirtæki skrifar undir',
  };

  return await updateDoc(jobRef, {
    'signatures.employer': {
      date: new Date(),
      id: employerUser.general.uid,
    },
    logs: arrayUnion(log),
    status: 'requiresSignature',
    ...jobData,
  })
    .then(() => true)
    .catch(() => false);
}

export async function addFreelancerSignature(
  job: TJobRead,
  freelancerUser: TFreelancerUser,
  jobData: Partial<TJobWrite>
) {
  const jobRef = doc(db, 'jobs', job.id) as DocumentReference<TJobWrite>;

  const log: TLogWrite = {
    date: Timestamp.fromDate(new Date()),
    status: 'inProgress',
    description: `${freelancerUser.general.name} skrifar undir samning fyrir verkefnið ${job.name}.`,
    title: 'Giggari skrifar undir',
  };

  return await updateDoc(jobRef, {
    'signatures.freelancer': {
      date: new Date(),
      id: freelancerUser.general.uid,
    },
    logs: arrayUnion(log),
    status: 'inProgress',
    ...jobData,
  })
    .then(() => true)
    .catch(() => false);
}

export async function finishJob(jobId: string) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    status: 'completed',
    logs: arrayUnion({
      date: new Date(),
      status: 'completed',
      title: 'Verkefni lokið',
      description:
        'Fyrirtæki hefur veitt endurgjöf og verkefni því formlega lokið',
    }),
  })
    .then(() => true)
    .catch(() => false);
}

export async function updateJob(jobId: string) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  return await updateDoc(jobRef, {
    status: 'completed',
    logs: arrayUnion({
      date: new Date(),
      status: 'completed',
    }),
  })
    .then(() => true)
    .catch(() => false);
}

export async function editJob(jobId: string, jobData: TJobRead) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const jobDataWrite = jobConverter.toFirestore(jobData);
  return await updateDoc(jobRef, jobDataWrite)
    .then(() => true)
    .catch(() => false);
}

export async function updateJobEmployeeList(
  jobId: string,
  employees: TJobEmployee[]
) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const updatedEmployess = employees.map(employee => {
    return {
      user: doc(db, 'users', employee.id),
      position: employee.position,
      permission: employee.permission,
    } as TJobEmployeeWrite;
  });

  return await updateDoc(jobRef, {
    employees: updatedEmployess,
  })
    .then(() => true)
    .catch(() => false);
}
