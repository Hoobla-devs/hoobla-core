import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TGender } from "../../types/baseTypes";
import { TCompanyCreatorData, TCompanyWrite } from "../../types/companyTypes";
import {
  TFreelancerFormData,
  TFreelancerStatus,
  TFreelancerUnapprovedTags,
  TFreelancerUser,
  TFreelancerWrite,
  TReviewWrite,
  TUserWrite,
} from "../../types/userTypes";
import { uploadPhoto } from "../storage/add";
import { deletePhoto } from "../storage/delete";
import { updateDoc } from "../updateDoc";
import { updateReview } from "./reviews/update";

export function convertEditFreelancerFormToFreelancerWrite(
  freelancerUser: TFreelancerUser,
  freelancerFormData: TFreelancerFormData
): TFreelancerWrite {
  const { uid } = freelancerUser.general;
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

  const selectedReviewsWrite =
    selectedReviews?.map((review) => {
      const reviewRef = doc(
        db,
        "users",
        uid,
        "reviews",
        review.id
      ) as DocumentReference<TReviewWrite>;
      return reviewRef;
    }) || [];
  // Create freelancerWrite object
  const freelancerWrite = {
    ...freelancerData,
    gender: gender as TGender,
    address: freelancerAddress,
    company: freelancerCompany,
    jobs: freelancerUser.freelancer.jobs,
    status: freelancerUser.freelancer.status,
    photo: freelancerUser.freelancer.photo,
    unapprovedTags,
    selectedReviews: selectedReviewsWrite,
  };

  return freelancerWrite;
}

export function switchLocale(uid: string, lang: "is" | "en") {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "general.lang": lang });
}

export function updateSMSNotifications(uid: string, value: boolean) {
  console.log("updateSMSNotifications", uid, value);

  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "settings.SMSNotifications": value });
}

export function updateJobTitlesNotificationSettings(
  uid: string,
  jobTitles: string[]
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "settings.excludedJobTitleNotifications": jobTitles });
}

export async function addEmployerDataAndCompanyToUser(
  uid: string,
  employerData: TCompanyCreatorData,
  companyRef: DocumentReference<TCompanyWrite>
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  return updateDoc(userRef, {
    "general.name": employerData.name,
    "general.ssn": employerData.ssn,
    "general.phone": employerData.phone,
    "employer.position": employerData.position,
    "employer.company": companyRef,
  })
    .catch((error) => {
      throw new Error("Error adding employer data to user: " + error);
    })
    .then(() => true);
}

export async function updateFreelancerResume(
  freelancerUser: TFreelancerUser,
  freelancerFormData: TFreelancerFormData
) {
  const { uid } = freelancerUser.general;
  const { name, phone, ssn, photo, selectedReviews, hiddenReviews } =
    freelancerFormData;

  const freelancerWrite = convertEditFreelancerFormToFreelancerWrite(
    freelancerUser,
    freelancerFormData
  );

  // If new photo was added, remove old and add new to storage
  if (photo) {
    // Delete old photos
    await Promise.all([
      await deletePhoto(freelancerFormData.oldPhoto!.url),
      await deletePhoto(freelancerFormData.oldPhoto!.originalUrl),
    ]);
    // upload logo and add url to company
    const originalFile = freelancerFormData.photo?.originalFile;
    const file = freelancerFormData.photo?.file;
    // upload
    const [originalUrl, url] = await Promise.all([
      await uploadPhoto(originalFile!, "users/" + uid + "/original"),
      await uploadPhoto(file!, "users/" + uid + "/cropped"),
    ]);

    freelancerWrite.photo = {
      originalUrl,
      url,
    };
  }

  const allReviews = [...selectedReviews, ...(hiddenReviews || [])];

  // Update all reviews visability
  await Promise.all(
    allReviews.map(async (review) => {
      await updateReview(uid, review.id, { show: review.show });
    })
  );

  return await updateDoc(
    doc(db, "users", uid) as DocumentReference<TUserWrite>,
    {
      "general.name": name,
      "general.phone": phone,
      "general.ssn": ssn,
      "general.updatedAt": new Date(),

      freelancer: freelancerWrite,
    }
  )
    .then(() => true)
    .catch((error) => {
      console.log(error);
      return false;
    });
}
