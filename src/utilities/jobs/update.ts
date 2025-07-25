import {
  doc,
  DocumentReference,
  arrayUnion,
  Timestamp,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { jobConverter } from '../../converters/job';
import { db } from '../../firebase/init';
import {
  TFreelancerApplicant,
  TJob,
  TJobEmployee,
  TJobEmployeeWrite,
  TJobRead,
  TJobStatus,
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
  job: TJob,
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
  jobId: string,
  jobName: string,
  jobStatus: TJobStatus,
  employerUser: TEmployerUser,
  jobData: Partial<TJobWrite>
) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const company = employerUser.activeCompany.company;

  const log: TLogWrite = {
    date: Timestamp.fromDate(new Date()),
    status: jobStatus,
    description: `${company.name} hefur skrifað undir samning fyrir verkefnið ${jobName}`,
    title: 'Fyrirtæki skrifar undir',
  };

  try {
    await updateDoc(jobRef, {
      'signatures.employer': {
        date: new Date(),
        id: employerUser.general.uid,
      },
      logs: arrayUnion(log),
      status: jobStatus,
      ...jobData,
    });

    return true;
  } catch (err) {
    console.log(`Error adding company signature: ${err}`);
    return false;
  }
}

export async function addFreelancerSignature(
  jobId: string,
  jobName: string,
  jobStatus: TJobStatus,
  freelancerUser: TFreelancerUser,
  jobData: Partial<TJobWrite>
) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const log: TLogWrite = {
    date: Timestamp.fromDate(new Date()),
    status: jobStatus,
    description: `${freelancerUser.general.name} skrifar undir samning fyrir verkefnið ${jobName}.`,
    title: 'Giggari skrifar undir',
  };

  return await updateDoc(jobRef, {
    'signatures.freelancer': {
      date: new Date(),
      id: freelancerUser.general.uid,
    },
    logs: arrayUnion(log),
    status: jobStatus,
    ...jobData,
  })
    .then(() => {
      return true;
    })
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

export async function addEmployeeToJob(jobId: string, employeeId: string) {
  try {
    const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;
    const employeesCollectionRef = collection(jobRef, 'employees');
    const employeeRef = doc(employeesCollectionRef, employeeId);
    await setDoc(employeeRef, { permission: 'edit' });
    return true;
  } catch (err) {
    console.error(err);
    throw new Error(`Error adding employee to job: ${err}`);
  }
}

export async function updateJobEmployeeList(
  jobId: string,
  employees: TJobEmployee[]
) {
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;
  const employeesCollectionRef = collection(jobRef, 'employees');

  try {
    // Fetch existing employee documents
    const existingDocsSnapshot = await getDocs(employeesCollectionRef);
    const existingDocs = existingDocsSnapshot.docs.map(doc => doc.id);

    // Determine which documents need to be deleted
    const newEmployeeIds = employees.map(employee => employee.id);
    const toDelete = existingDocs.filter(id => !newEmployeeIds.includes(id));

    // Delete unwanted employee documents
    await Promise.all(
      toDelete.map(async id => {
        const employeeRef = doc(employeesCollectionRef, id);
        await deleteDoc(employeeRef);
      })
    );

    // Add/update new employee documents
    await Promise.all(
      employees.map(async employee => {
        const employeeRef = doc(
          employeesCollectionRef,
          employee.id
        ) as DocumentReference<TJobEmployeeWrite>;
        await setDoc(employeeRef, { permission: 'edit' }); // TODO: Remove this? Unused atm
      })
    );

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function updateJobSigner(jobId: string, employeeId: string) {
  try {
    const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;
    const employeesCollectionRef = collection(jobRef, 'employees');
    const employeesSnapshot = await getDocs(employeesCollectionRef);
    const updatePromises = employeesSnapshot.docs.map(async docSnap => {
      const isSigner = docSnap.id === employeeId;
      await setDoc(
        docSnap.ref,
        {
          ...docSnap.data(),
          signer: isSigner,
        },
        { merge: true }
      );
    });
    await Promise.all(updatePromises);
    return true;
  } catch (err) {
    console.error('Error setting job signer:', err);
    throw err;
  }
}
