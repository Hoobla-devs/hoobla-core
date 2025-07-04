import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  DocumentReference,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { jobConverter } from '../../converters/job';
import { db } from '../../firebase/init';
import { TCompanyWrite } from '../../types/companyTypes';
import {
  TJob,
  TJobEmployeeWrite,
  TJobFormData,
  TJobRead,
  TJobWrite,
  TLog,
  TLogWrite,
} from '../../types/jobTypes';
import { TEmployerUser } from '../../types/userTypes';
import { updateDoc } from '../updateDoc';
import { updateJobEmployeeList } from './update';

function _getOfferDeadlineDate(date: Date, daysToAdd: number) {
  let workingDaysToAdd = daysToAdd;
  const resultDate = new Date(date);
  resultDate.setHours(23, 59, 59, 59);

  while (workingDaysToAdd > 0) {
    resultDate.setDate(resultDate.getDate() + 1); // Move to the next day

    // Check if the current day is a working day (Monday to Friday)
    if (resultDate.getDay() !== 0 && resultDate.getDay() !== 6) {
      workingDaysToAdd--; // If it's a working day, decrement the working days to add
    }
  }

  return resultDate;
}

export function convertFormJobToJobRead(
  formJob: TJobFormData,
  company: string,
  creator: string
) {
  let unapprovedTags = null;
  if (formJob.unapprovedTags) {
    const { jobTitles, skills, languages } = formJob.unapprovedTags;
    if (
      (!jobTitles || jobTitles.length === 0) &&
      (!skills || skills.length === 0) &&
      (!languages || languages.length === 0)
    ) {
      unapprovedTags = null;
    } else {
      unapprovedTags = {
        jobTitles: formJob.unapprovedTags?.jobTitles || [],
        skills: formJob.unapprovedTags?.skills || [],
        languages: formJob.unapprovedTags?.languages || [],
      };
    }
  }

  const job: TJobRead = {
    id: '',
    name: formJob.name,
    description: formJob.description,
    originalDescription: formJob.originalDescription || '',
    generatedDescription: formJob.generatedDescription || '',
    generationCount: formJob.generationCount || 0,
    type: formJob.type ? formJob.type : 'notSure',
    status: formJob.status,
    company: doc(db, 'companies', company) as DocumentReference<TCompanyWrite>,
    creator: doc(db, 'users', creator) as DocumentReference<TEmployerUser>,
    employees: [],
    selectedApplicants: [],
    documentId: null,
    freelancers: [],
    unapprovedTags: unapprovedTags || null,
    skills: formJob.skills,
    languages: formJob.languages,
    jobTitles: formJob.jobTitles,
    signatures: null,
    terms: null,
    logs: formJob.logs || [],
    jobInfo: {
      start: formJob.jobInfo.start || '',
      end: formJob.jobInfo.end || '',
      percentage:
        formJob.type === 'partTime' ? formJob.jobInfo.percentage : null,
      numOfHours:
        formJob.type === 'timeframe'
          ? parseInt(formJob.jobInfo.numOfHours!) || null
          : null,
      deadline: _getOfferDeadlineDate(
        new Date(),
        formJob.jobInfo.deadline || 2
      ),
    },
  };

  return job;
}

export async function createJob(data: TJobRead) {
  const log: TLog = {
    status: 'inReview',
    date: new Date(),
    title: 'Verkefni stofnað',
    description: 'Verkefni stofnað og bíður samþykkis',
  };

  data.logs.push(log);

  const jobRef = await addDoc(
    collection(db, 'jobs').withConverter(jobConverter),
    data
  )
    .catch(err => {
      throw new Error(`Error adding job to user: ${err}`);
    })
    .then(ref => {
      return ref as DocumentReference<TJobWrite>;
    });

  // Add creator to job employees
  const companyRef = data.company;
  const employeesCollectionRef = collection(jobRef, 'employees');
  const employeeRef = doc(
    employeesCollectionRef,
    data.creator.id
  ) as DocumentReference<TJobEmployeeWrite>;

  await setDoc(employeeRef, { permission: 'edit', signer: true }); // Default job creator to signer

  // Add job to company
  await updateDoc(companyRef, {
    jobs: arrayUnion(jobRef),
  }).catch(err => {
    throw new Error(`Error adding job to company: ${err}`);
  });

  return jobRef;
}
