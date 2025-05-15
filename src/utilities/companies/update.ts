import { doc, DocumentReference, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/init';
import {
  TCompany,
  TCompanyEmployee,
  TCompanyFormData,
  TCompanyRead,
  TCompanyWrite,
  TInvite,
} from '../../types/companyTypes';
import { TEmployerRole, TEmployerWrite } from '../../types/userTypes';
import { generateCompanyInviteToken } from '../basicHelpers';
import { uploadPhoto } from '../storage/add';
import { deletePhoto } from '../storage/delete';
import { updateDoc } from '../updateDoc';
import { getCompany } from './get';
import { getJobWithEmployees } from '../jobs/get';
import { addEmployeeToJob } from '../jobs/update';
import { updateJobEmployeeList } from '../jobs/update';

export function convertEditCompanyFormToCompanyRead(
  company: TCompany,
  companyForm: TCompanyFormData,
  newLogo: string
) {
  const { name, ssn, phone, address, size, website } = companyForm;
  const companyRead: TCompanyRead = {
    ...company,
    name,
    ssn,
    phone,
    address,
    size,
    website,
    logo: { url: newLogo },
  };
  return companyRead;
}

export async function updateCompany(
  company: TCompany,
  companyFormData: TCompanyFormData
) {
  const { oldLogo, ...companyData } = companyFormData;
  // Step 1: If new logo was added, remove old and add new to storage
  let companyLogo: string = oldLogo?.url || '';
  if (companyData.logo) {
    await deletePhoto(oldLogo!.url);

    // upload logo and get storage url
    const file = companyData.logo.file;
    companyLogo = await uploadPhoto(file!, 'companies/' + company.id + '/logo');
  }
  // Create the data to write to firebase
  const { id, ...companyRead } = convertEditCompanyFormToCompanyRead(
    company,
    companyFormData,
    companyLogo
  );

  const companyRef = doc(
    db,
    'companies',
    id
  ) as DocumentReference<TCompanyWrite>;
  // Step 3: Update the company with the photo url
  return await updateDoc(companyRef, {
    name: companyRead.name,
    phone: companyRead.phone,
    ssn: companyRead.ssn,
    address: companyRead.address,
    size: companyRead.size,
    website: companyRead.website,
    logo: companyRead.logo,
  })
    .then(() => {
      console.log('success');
      return true;
    })
    .catch(e => {
      console.log('arghhhh errror: ', e);
      return false;
    });
}

export async function inviteEmployee(cid: string, invite: TInvite) {
  const companyRef = doc(
    db,
    'companies',
    cid
  ) as DocumentReference<TCompanyWrite>;

  const company = await getCompany(companyRef);
  const invites = company.invites;

  invites.push(invite);

  return await updateDoc(companyRef, { invites })
    .then(() => invite)
    .catch(() => null);
}

export async function updateInvitationList(
  cid: string,
  emails: string[],
  oldInvites: TInvite[]
) {
  const companyRef = doc(
    db,
    'companies',
    cid
  ) as DocumentReference<TCompanyWrite>;

  const invites = [...oldInvites];

  emails.forEach((email, i) => {
    const inviteIndex = invites.findIndex(invite => invite.email === email);
    if (inviteIndex >= 0) {
      invites[inviteIndex].token = generateCompanyInviteToken();
      invites[inviteIndex].date = new Date();
    }
  });

  return await updateDoc(companyRef, { invites })
    .then(() => invites)
    .catch(() => null);
}

export async function updateEmployee(
  cid: string,
  uid: string,
  employeeData: TCompanyEmployee,
  selectedJobs: string[]
) {
  const companyRef = doc(
    db,
    'companies',
    cid
  ) as DocumentReference<TCompanyWrite>;

  const employeeRef = doc(
    companyRef,
    'employees',
    uid
  ) as DocumentReference<TEmployerWrite>;

  // First update the employee data
  const updateSuccess = await updateDoc(employeeRef, employeeData)
    .then(() => employeeData)
    .catch(() => null);

  if (!updateSuccess) {
    return null;
  }

  // Get all jobs for the company to check current access
  const company = await getCompany(companyRef);
  const jobs = company.jobs;

  // For each job, check if we need to add or remove the employee
  const updatePromises = jobs.map(async jobRef => {
    const job = await getJobWithEmployees(jobRef.id).catch(() => null);
    if (!job) {
      return null;
    }
    const currentEmployeeIds = job.employees.map(e => e.id);
    const shouldHaveAccess = selectedJobs.includes(job.id);

    // If employee should have access but doesn't, add them
    if (shouldHaveAccess && !currentEmployeeIds.includes(uid)) {
      return addEmployeeToJob(job.id, uid);
    }
    // If employee shouldn't have access but does, remove them
    else if (!shouldHaveAccess && currentEmployeeIds.includes(uid)) {
      const updatedEmployees = job.employees.filter(e => e.id !== uid);
      return updateJobEmployeeList(job.id, updatedEmployees);
    }
    return true;
  });

  try {
    await Promise.all(updatePromises);
    return updateSuccess;
  } catch (error) {
    console.error('Error updating job access:', error);
    return null;
  }
}
