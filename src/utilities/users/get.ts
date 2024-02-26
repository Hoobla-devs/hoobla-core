import { doc, DocumentReference, getDoc, onSnapshot } from "firebase/firestore";
import { userConverter } from "../../converters/user";
import { db } from "../../firebase/init";
import { TCompany } from "../../types/companyTypes";
import {
  TEmployer,
  TFreelancer,
  TFreelancerUser,
  TGeneral,
  TUser,
  TUserRead,
  TUserWrite,
} from "../../types/userTypes";
import { getCompany } from "../companies/get";
import { getAllReviews, getSelectedReviews } from "./reviews/get";

async function _getUserFromRef(
  userRef: DocumentReference<TUserWrite>
): Promise<TUser> {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error("User does not exist.");
  }
  const userData = userSnap.data();
  const { employer, freelancer, ...rest } = userData;

  let newEmployer: TEmployer | undefined;
  let company: TCompany | undefined;

  if (employer) {
    // get the company
    company = await getCompany(employer.company);
    newEmployer = {
      ...employer,
      ...(company && { company }),
    };
  }

  let newFreelancer: TFreelancer | undefined;
  if (freelancer) {
    const selectedReviews = await getSelectedReviews(
      userRef.id,
      freelancer.selectedReviews || []
    );
    newFreelancer = {
      ...freelancer,
      selectedReviews,
    };
  }

  return {
    ...rest,
    ...(employer && {
      employer: newEmployer,
    }),
    ...(freelancer && {
      freelancer: newFreelancer,
    }),
  };
}

export async function checkIfUserExists(uid: string) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  const userDoc = await getDoc(userRef);
  return userDoc.exists();
}

export async function getUserById(id: string): Promise<TUser> {
  const userRef = doc(db, "users", id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);

  return user;
}

export async function getFreelancer(id: string): Promise<TFreelancerUser> {
  const userRef = doc(db, "users", id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);

  if (user && user.freelancer) {
    return { ...user, freelancer: user.freelancer }; // Ensure freelancer property is present
  } else {
    throw new Error("User is not a freelancer.");
  }
}

export async function getUserGeneralInfo(uid: string): Promise<TGeneral> {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error("User does not exist.");
  }
  const userData = userSnap.data();
  const { general, ...rest } = userData;

  return general;
}

export async function onUserChange(
  id: string,
  callback: (user: TUser | null) => void
) {
  const userRef = doc(db, "users", id).withConverter(
    userConverter
  ) as DocumentReference<TUserRead>;

  const unsubscribe = onSnapshot(userRef, async (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      const { employer, freelancer, ...rest } = userData;

      let newEmployer: TEmployer | undefined;
      let company: TCompany | undefined;

      if (employer) {
        console.log("employer subscription", employer);

        // get the company
        company = await getCompany(employer.company);
        newEmployer = {
          ...employer,
          ...(company && { company }),
        };
      }

      let newFreelancer: TFreelancer | undefined;
      if (freelancer) {
        const selectedReviews = await getSelectedReviews(
          userRef.id,
          freelancer.selectedReviews || []
        );
        newFreelancer = {
          ...freelancer,
          selectedReviews,
        };
      }

      callback({
        ...rest,
        ...(employer && {
          employer: newEmployer,
        }),
        ...(freelancer && {
          freelancer: newFreelancer,
        }),
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}
