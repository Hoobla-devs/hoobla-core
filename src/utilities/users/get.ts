import { doc, DocumentReference, getDoc, onSnapshot } from "firebase/firestore";
import { userConverter } from "../../converters/user";
import { db } from "../../firebase/init";
import {
  TEmployer,
  TEmployerRead,
  TEmployerUser,
  TFreelancer,
  TFreelancerUser,
  TGeneral,
  TUser,
  TUserRead,
  TUserWrite,
} from "../../types/userTypes";
import { getCompany, getEmployerCompanies } from "../companies/get";
import { getSelectedReviews } from "./reviews/get";

async function getEmployerWithCompanies(employer: TEmployerRead | undefined) {
  if (employer) {
    const [company, companies] = await Promise.all([
      getCompany(employer.company),
      getEmployerCompanies(employer.companies || []),
    ]);

    const companiesIncludesCompany = companies.some((c) => c.id === company.id);
    const newEmployer: TEmployer = {
      ...employer,
      company,
      companies: companiesIncludesCompany ? companies : [...companies, company],
    };

    return newEmployer;
  }
}

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

  if (employer) {
    newEmployer = await getEmployerWithCompanies(employer);
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

export async function getEmployer(id: string): Promise<TEmployerUser> {
  const userRef = doc(db, "users", id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);

  if (user && user.employer) {
    return { ...user, employer: user.employer }; // Ensure employer property is present
  } else {
    throw new Error("User is not an employer.");
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
      if (employer) {
        newEmployer = await getEmployerWithCompanies(employer);
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
