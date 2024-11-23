import {
  deleteField,
  doc,
  DocumentReference,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/init';
import { TGender } from '../../types/baseTypes';
import {
  TFreelancerFormData,
  TFreelancerStatus,
  TFreelancerUnapprovedTags,
  TFreelancerWrite,
  TUserWrite,
} from '../../types/userTypes';
import { updateDoc } from '../updateDoc';

export function convertFreelancerFormToFreelancerWrite(
  uid: string,
  freelancerFormData: TFreelancerFormData
): TFreelancerWrite {
  const {
    name,
    phone,
    ssn,
    experienceForm,
    educationForm,
    hasBusiness,
    oldPhoto,
    gender,
    hiddenReviews,
    selectedReviews,
    ...freelancerData
  } = freelancerFormData;

  // Fix gender type and get address and company (if provided)
  const freelancerAddress = !hasBusiness ? freelancerFormData.address : null;
  const freelancerCompany = hasBusiness ? freelancerFormData.company : null;

  // Get unapproved tags list
  let unapprovedTags: TFreelancerUnapprovedTags | null = null;
  if (freelancerFormData.unapprovedTags) {
    const { jobTitles, skills, languages } = freelancerFormData.unapprovedTags;
    if (
      (jobTitles && jobTitles.length > 0) ||
      (skills && skills.length > 0) ||
      (languages && languages.length > 0)
    ) {
      unapprovedTags = {
        jobTitles: freelancerFormData.unapprovedTags?.jobTitles || [],
        skills: freelancerFormData.unapprovedTags?.skills || [],
        languages: freelancerFormData.unapprovedTags?.languages || [],
      };
    }
  }

  // Create freelancerWrite object
  const freelancerWrite = {
    ...freelancerData,
    gender: gender as TGender,
    address: freelancerAddress,
    company: freelancerCompany,
    jobs: [],
    status: 'inReview' as TFreelancerStatus,
    photo: {
      originalUrl: oldPhoto?.originalUrl || '',
      url: oldPhoto?.url || '',
    },
    unapprovedTags,
    selectedReviews: [],
  };

  return freelancerWrite;
}

export async function createUser(uid: string, email: string) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    general: {
      email,
      lang: 'is',
      createdAt: new Date(),
    },
  })
    .then(() => {
      return true;
    })
    .catch(error => {
      console.log(error);
      return false;
    });
}

export async function createFreelancer(
  freelancerFormData: TFreelancerFormData,
  uid: string
) {
  const { name, phone, ssn } = freelancerFormData;
  const freelancerWrite = convertFreelancerFormToFreelancerWrite(
    uid,
    freelancerFormData
  );

  return await updateDoc(
    doc(db, 'users', uid) as DocumentReference<TUserWrite>,
    {
      freelancerForm: deleteField(),
      'general.name': name,
      'general.phone.number': phone.number,
      'general.phone.countryCode': phone.countryCode,
      'general.ssn': ssn,
      'general.updatedAt': new Date(),

      freelancer: freelancerWrite,
    }
  )
    .then(() => true)
    .catch(error => {
      console.log(error);
      return false;
    });
}
