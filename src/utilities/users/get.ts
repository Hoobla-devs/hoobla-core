import { doc, DocumentReference, getDoc, onSnapshot } from 'firebase/firestore';
import { userConverter } from '../../converters/user';
import { db } from '../../firebase/init';
import { TCompanyWithEmployees } from '../../types/companyTypes';
import {
  TEmployer,
  TEmployerUser,
  TFreelancer,
  TFreelancerUser,
  TGeneral,
  TUser,
  TUserRead,
  TUserWrite,
} from '../../types/userTypes';
import { getCompany, getCompanyWithEmployees } from '../companies/get';
import { getSelectedReviews } from './reviews/get';

async function getEmployerActiveCompany(user: TUserRead) {
  let newActiveCompany: TEmployer | undefined;
  let userCompany: TCompanyWithEmployees | undefined;

  if (user.activeCompany) {
    try {
      // Attempt to fetch the company
      userCompany = await getCompanyWithEmployees(user.activeCompany);
    } catch (error) {
      console.log('Failed to fetch company for user.employer', error);
      return undefined; // Early return if fetch fails
    }

    try {
      // Proceed with mapping if fetching was successful
      const userEmployee = userCompany.employees.find(
        employee => employee.id === user.general.uid
      );

      if (!userEmployee) {
        throw new Error('User is not an employee of the active company.');
      }

      newActiveCompany = {
        company: {
          ...userCompany,
          employees: [], // Clearing employees array here, ensure this is intended
        },
        position: userEmployee.position,
        role: userEmployee.role,
      };
    } catch (error) {
      console.log('Mapping error in getEmployerActiveCompany', error);
    }
  }

  return newActiveCompany;
}

async function _getUserFromRef(
  userRef: DocumentReference<TUserWrite>
): Promise<TUser> {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error('User does not exist.');
  }

  const userData = userSnap.data();
  const { activeCompany, freelancer, ...rest } = userData;

  let newActiveCompany: TEmployer | undefined;
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

  if (activeCompany) {
    newActiveCompany = await getEmployerActiveCompany(userData);
  }

  return {
    ...rest,
    ...(activeCompany && {
      activeCompany: newActiveCompany,
    }),
    ...(freelancer && {
      freelancer: newFreelancer,
    }),
  };
}

export async function checkIfUserExists(uid: string) {
  const userRef = doc(db, 'users', uid) as DocumentReference<TUserWrite>;
  const userDoc = await getDoc(userRef);
  return userDoc.exists();
}

export async function getUserById(id: string): Promise<TUser> {
  const userRef = doc(db, 'users', id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);

  return user;
}

export async function getFreelancer(id: string): Promise<TFreelancerUser> {
  const userRef = doc(db, 'users', id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);

  if (user && user.freelancer) {
    return { ...user, freelancer: user.freelancer }; // Ensure freelancer property is present
  } else {
    throw new Error('User is not a freelancer.');
  }
}

export async function getEmployer(id: string): Promise<TEmployerUser> {
  const userRef = doc(db, 'users', id) as DocumentReference<TUserWrite>;
  const user = await _getUserFromRef(userRef);
  if (user && user.activeCompany) {
    return { ...user, activeCompany: user.activeCompany }; // Ensure employer property is present
  } else {
    throw new Error('User is not an employer.');
  }
}

export async function getUserGeneralInfo(uid: string): Promise<TGeneral> {
  const userRef = doc(db, 'users', uid) as DocumentReference<TUserWrite>;
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error('User does not exist.');
  }
  const userData = userSnap.data();
  const { general, ...rest } = userData;

  return general;
}

export async function onUserChange(
  id: string,
  callback: (user: TUser | null) => void
) {
  const userRef = doc(db, 'users', id).withConverter(
    userConverter
  ) as DocumentReference<TUserRead>;

  const unsubscribe = onSnapshot(userRef, async doc => {
    if (doc.exists()) {
      const userData = doc.data();
      const { activeCompany: employer, freelancer, ...rest } = userData;

      const activeCompany = await getEmployerActiveCompany(userData);

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
          activeCompany: activeCompany,
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
