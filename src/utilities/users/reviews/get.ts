import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
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

export async function getSelectedReviews(
  id: string,
  reviewIdList: string[]
): Promise<TReview[] | []> {
  const reviewsAsync = reviewIdList.map(async (reviewId) => {
    const ref = doc(
      db,
      "users",
      id,
      "reviews",
      reviewId
    ) as DocumentReference<TReviewWrite>;
    const review = await _getReviewFromRef(ref);
    return review;
  });

  const reviews = await Promise.all(reviewsAsync);

  return reviews;
}

export async function getHiddenReviews(uid: string): Promise<TReview[] | []> {
  try {
    const userRef = doc(db, "users", uid);
    const reviewsRef = collection(
      userRef,
      "reviews"
    ) as CollectionReference<TReview>;

    const q = query(reviewsRef, where("show", "==", false));

    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      date: (doc.data()!.date as unknown as Timestamp).toDate(),
    }));

    return reviews as TReview[];
  } catch (error) {
    return [];
  }
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
