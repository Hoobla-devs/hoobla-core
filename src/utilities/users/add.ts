import { deleteField, doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TGender } from "../../types/baseTypes";
import {
  TFreelancerFormData,
  TFreelancerRead,
  TFreelancerStatus,
  TFreelancerUnapprovedTags,
  TUserWrite,
} from "../../types/userTypes";
import { updateDoc } from "../updateDoc";

export function convertFreelancerFormToFreelancerRead(
  freelancerFormData: TFreelancerFormData
): TFreelancerRead {
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

  // Create freelancerRead object
  const freelancerRead = {
    ...freelancerData,
    gender: gender as TGender,
    address: freelancerAddress,
    company: freelancerCompany,
    jobs: [],
    status: "inReview" as TFreelancerStatus,
    photo: {
      originalUrl: oldPhoto?.originalUrl || "",
      url: oldPhoto?.url || "",
    },
    unapprovedTags,
  };

  return freelancerRead;
}

export async function createFreelancer(
  freelancerFormData: TFreelancerFormData,
  uid: string
) {
  const { name, phone, ssn } = freelancerFormData;
  const freelancerRead =
    convertFreelancerFormToFreelancerRead(freelancerFormData);

  return await updateDoc(
    doc(db, "users", uid) as DocumentReference<TUserWrite>,
    {
      freelancerForm: deleteField(),
      "general.name": name,
      "general.phone": phone,
      "general.ssn": ssn,
      "general.updatedAt": new Date(),

      freelancer: freelancerRead,
    }
  )
    .then(() => true)
    .catch((error) => {
      console.log(error);
      return false;
    });
}
