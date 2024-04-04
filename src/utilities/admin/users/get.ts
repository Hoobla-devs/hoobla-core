import {
  collection,
  CollectionReference,
  query,
  where,
  Query,
  getDocs,
  DocumentReference,
  doc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { userConverter } from "../../../converters/user";
import { db } from "../../../firebase/init";
import {
  TFreelancerRead,
  TFreelancerUser,
  TReview,
  TUserRead,
  TUserWrite,
} from "../../../types/userTypes";
import { getSelectedReviews } from "../../users/reviews/get";

export async function getAllFreelancers(): Promise<TFreelancerUser[]> {
  const usersRef = collection(db, "users").withConverter(
    userConverter
  ) as CollectionReference<TUserRead>;
  const usersQuery = query(
    usersRef,
    where("freelancer", "!=", null)
  ) as Query<TFreelancerUser>;
  const freelancersSnap = await getDocs(usersQuery);

  const freelancers = freelancersSnap.docs.map((doc) => {
    return doc.data();
  });

  const notDeletedFreelancers = freelancers.filter(
    (user) => user.deleted !== true
  );

  return notDeletedFreelancers;
}

export async function getFreelancersWithUnapprovedTags(): Promise<
  TFreelancerUser[]
> {
  try {
    const usersRef = collection(db, "users").withConverter(
      userConverter
    ) as CollectionReference<TUserRead>;
    const usersQuery = query(
      usersRef,
      where("freelancer.unapprovedTags", "!=", null),
      where("freelancer.status", "==", "approved")
    ) as Query<TFreelancerUser>;
    const freelancersSnap = await getDocs(usersQuery);

    const freelancers = freelancersSnap.docs.map((doc) => {
      return doc.data();
    });

    return freelancers;
  } catch (error) {
    return [];
  }
}

export async function getUserByEmail(email: string): Promise<TUserRead | null> {
  const usersRef = collection(db, "users").withConverter(
    userConverter
  ) as CollectionReference<TUserRead>;

  const q = query(usersRef, where("general.email", "==", email));

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const usersData = querySnapshot.docs.map((doc) => doc.data());
    return usersData[0];
  } else {
    return null;
  }
}

export function freelancerListener(
  uid: string,
  callback: (freelancer: TFreelancerUser) => void
) {
  const freelancerRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  const unsubscribe = onSnapshot(freelancerRef, async (doc) => {
    const userSnapshot = await getDoc(
      freelancerRef.withConverter(userConverter)
    );
    if (userSnapshot.exists()) {
      const freelancer = userSnapshot.data().freelancer as TFreelancerRead;
      let reviews: TReview[] = [];
      if (freelancer.selectedReviews) {
        reviews = await getSelectedReviews(uid, freelancer.selectedReviews);
      }
      const freelancerUser = {
        ...userSnapshot.data(),
        freelancer: {
          ...freelancer,
          selectedReviews: reviews,
        },
      } as TFreelancerUser;
      callback(freelancerUser);
    }
  });

  return unsubscribe;
}
