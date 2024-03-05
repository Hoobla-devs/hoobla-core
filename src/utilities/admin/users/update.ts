import {
  arrayRemove,
  arrayUnion,
  doc,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/init";
import {
  TFreelancerStatus,
  TFreelancerUnapprovedTags,
  TFreelancerUser,
  TUserWrite,
} from "../../../types/userTypes";
import { updateDoc } from "../../updateDoc";

/**
 * Update status of freelancer application.
 * Base usage is when approving or denying user from becoming a verified freelancer
 * @param uid
 * @param status
 * @returns
 */
export async function processFreelancerApplication(
  uid: string,
  status: TFreelancerStatus
) {
  const freelancerRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;

  return await updateDoc(freelancerRef, {
    "freelancer.status": status,
    "general.updatedAt": Timestamp.fromDate(new Date()),
  })
    .then(() => true)
    .catch((err) => false);
}

/**
 * Add a new contract id to freelancer to sign.
 * @param freelancerUser
 * @param documentId id of Signet Api document
 * @returns
 */
export async function addFreelancerContract(
  freelancerUser: TFreelancerUser,
  documentId: string
) {
  const userRef = doc(
    db,
    "users",
    freelancerUser.general.uid
  ) as DocumentReference<TUserWrite>;

  const newStatus =
    freelancerUser.freelancer.status === "inReview"
      ? "requiresSignature"
      : freelancerUser.freelancer.status;

  return await updateDoc(userRef, {
    "freelancer.contract": {
      documentId,
      signed: false,
    },
    "freelancer.status": newStatus,
  })
    .then(() => {
      return true;
    })
    .catch(() => false);
}

export async function addTagToFreelancer(
  uid: string,
  tagId: string,
  type: "jobTitles" | "skills" | "languages",
  updatedUnapprovedTags: TFreelancerUnapprovedTags | null
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  const tagField = `freelancer.${type}`;

  return await updateDoc(userRef, {
    [tagField]: arrayUnion(tagId),
    "freelancer.unapprovedTags": updatedUnapprovedTags,
  })
    .then(() => true)
    .catch(() => false);
}
