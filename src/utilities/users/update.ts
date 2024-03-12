import { doc, DocumentReference, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TGender } from "../../types/baseTypes";
import { TCompanyCreatorData, TCompanyWrite } from "../../types/companyTypes";
import {
  TEmployerFormData,
  TFreelancerContractWrite,
  TFreelancerFormData,
  TFreelancerUnapprovedTags,
  TFreelancerUser,
  TFreelancerWrite,
  TReviewWrite,
  TSavedFreelancerFormData,
  TUser,
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

  const freelancerContract = freelancerUser.freelancer.contract;

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
    ...(freelancerContract && {
      contract: {
        ...freelancerContract,
        ...(freelancerContract.date && {
          date: Timestamp.fromDate(freelancerContract.date),
        }),
      } as TFreelancerContractWrite,
    }),
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

export function updateNotificationField(
  uid: string,
  notificationField:
    | "SMSNotifications"
    | "deniedOfferMails"
    | "cancelledJobMails",
  value: boolean
) {
  console.log("updateSMSNotifications", uid, value);

  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { [`settings.${notificationField}`]: value });
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
    "employer.companies": [companyRef],
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

export async function updateEmployerInfo(
  uid: string,
  employerFormData: TEmployerFormData
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  return await updateDoc(userRef, {
    "general.name": employerFormData.name,
    "general.phone": employerFormData.phone,
    "employer.position": employerFormData.position,
    "general.updatedAt": new Date(),
  })
    .then(() => true)
    .catch(() => false);
}

export async function saveFreelancerForm(
  user: TUser,
  data: TSavedFreelancerFormData,
  callback: Function
) {
  const { uid } = user.general;
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  await updateDoc(userRef, {
    freelancerForm: {
      ...data,
      jobTitles: data.jobTitles,
      skills: data.skills,
      languages: data.languages,
      photo: null,
      oldPhoto: data.oldPhoto
        ? {
            url: data.oldPhoto.url,
            originalUrl: data.oldPhoto.originalUrl,
          }
        : null,
    },
  }).catch((err) => {
    alert("Could not save!!!");
  });

  callback();
}

/**
 * Adds a pre-signed contract link to user and sets signed to true.
 * @param freelancerUser
 * @param documentStorageUrl
 * @returns
 */
export async function addContractToFreelancer(
  freelancerUser: TFreelancerUser,
  documentStorageUrl: string
) {
  const userRef = doc(
    db,
    "users",
    freelancerUser.general.uid
  ) as DocumentReference<TUserWrite>;

  const documentId = freelancerUser.freelancer.contract?.documentId || "";

  const newContractData = {
    documentId,
    link: documentStorageUrl,
    signed: true,
    date: new Date(),
  };

  const newStatus =
    freelancerUser.freelancer.status === "requiresSignature"
      ? "inReview"
      : freelancerUser.freelancer.status;

  return await updateDoc(userRef, {
    "freelancer.contract": newContractData,
    "freelancer.status": newStatus,
  })
    .then(() => {
      return true;
    })
    .catch(() => false);
}
