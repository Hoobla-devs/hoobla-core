import { doc, DocumentReference, getDoc, onSnapshot } from "firebase/firestore";
import { userConverter } from "../../converters/user";
import { db } from "../../firebase/init";
import { TCompany } from "../../types/companyTypes";
import {
  TEmployer,
  TFreelancerUser,
  TUser,
  TUserBase,
  TUserRead,
  TUserWrite,
} from "../../types/userTypes";
import { getCompany } from "../companies/get";

async function _getUserFromRef(
  userRef: DocumentReference<TUserWrite>
): Promise<TUser> {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error("User does not exist.");
  }
  const userData = userSnap.data();
  const { employer, ...rest } = userData;

  let newEmployer: TEmployer | undefined;
  let company: TCompany | undefined;

  if (employer) {
    console.log("employer", employer);

    // get the company
    company = await getCompany(employer.company);
    newEmployer = {
      ...employer,
      ...(company && { company }),
    };
  }

  return {
    ...rest,
    ...(employer && {
      employer: newEmployer,
    }),
  };
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
      const { employer, ...rest } = userData;

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

      callback({
        ...rest,
        ...(employer && {
          employer: newEmployer,
        }),
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}
