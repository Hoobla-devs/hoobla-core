import { doc, DocumentReference, getDoc, onSnapshot } from "firebase/firestore";
import { userConverter } from "../../converters/user";
import { db } from "../../firebase/init";
import { TCompany } from "../../types/companyTypes";
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

async function _getUserFromRef(
  userRef: DocumentReference<TUserWrite>
): Promise<TUser> {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error("User does not exist.");
  }
  const userData = userSnap.data();
  const { employer, employers, freelancer, ...rest } = userData;

  let newEmployer: TEmployer | undefined;
  let newEmployers: TEmployer[] = [];
  let company: TCompany | undefined;

  if (employer) {
    // get the company
    company = await getCompany(employer.company);
    newEmployer = {
      ...employer,
      ...(company && { company }),
    };
  }

  if (employers) {
    newEmployers = await Promise.all(
      employers.map(async (employer) => {
        const company = await getCompany(employer.company);
        return {
          ...employer,
          ...(company && { company }),
        };
      })
    );
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
    ...(newEmployers && {
      employers: newEmployers,
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
      const { employer, employers, freelancer, ...rest } = userData;

      let newEmployer: TEmployer | undefined;
      let newEmployers: TEmployer[] = [];
      let company: TCompany | undefined;

      if (employer) {
        // get the company
        company = await getCompany(employer.company);
        newEmployer = {
          ...employer,
          ...(company && { company }),
        };
      }

      if (employers) {
        newEmployers = await Promise.all(
          employers.map(async (employer) => {
            const company = await getCompany(employer.company);
            return {
              ...employer,
              ...(company && { company }),
            };
          })
        );
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
        ...(newEmployers && {
          employers: newEmployers,
        }),
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}
