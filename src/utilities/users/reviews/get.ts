import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { reviewConverter } from "../../../converters/user";
import { db } from "../../../firebase/init";
import { TReviewWrite, TReview } from "../../../types/userTypes";

async function _getReviewFromRef(
  reviewRef: DocumentReference<TReviewWrite>
): Promise<TReview> {
  const reviewSnap = await getDoc(reviewRef.withConverter(reviewConverter));

  if (!reviewSnap.exists()) {
    throw new Error("Review does not exist.");
  }

  return reviewSnap.data();
}

export async function getReview(id: string): Promise<TReview | []> {
  const reviewRef = doc(db, "reviews", id) as DocumentReference<TReviewWrite>;
  const review = await _getReviewFromRef(reviewRef);

  return review;
}

export async function getAllReviews(uid: string): Promise<TReview[] | []> {
  const querySnapshot = await getDocs(collection(db, "users", uid, "reviews"));

  const reviewsAsync = querySnapshot.docs.map(async (doc) => {
    const review = await _getReviewFromRef(
      doc.ref as DocumentReference<TReviewWrite>
    );
    return review;
  });

  const reviews = await Promise.all(reviewsAsync);

  return reviews;
}
