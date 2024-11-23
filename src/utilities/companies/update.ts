import { doc, DocumentReference, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/init';
import {
  TCompany,
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

export async function updateEmployeeRole(
  cid: string,
  uid: string,
  role: TEmployerRole
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

  // Use setDoc with merge option to create or update the role field
  await setDoc(employeeRef, { role: role }, { merge: true })
    .then(() => true)
    .catch(() => false);
}
