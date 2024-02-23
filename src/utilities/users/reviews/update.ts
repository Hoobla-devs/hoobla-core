import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../../firebase/init";
import { TReview, TReviewWrite } from "../../../types/userTypes";
import { updateDoc } from "../../updateDoc";

export async function updateReview(
  uid: string,
  reviewId: string,
  newData: Partial<TReview>
) {
  const reviewRef = doc(
    db,
    "users",
    uid,
    "reviews",
    reviewId
  ) as DocumentReference<TReviewWrite>;
  return await updateDoc(reviewRef, { ...newData })
    .then(() => true)
    .catch(() => false);
}
