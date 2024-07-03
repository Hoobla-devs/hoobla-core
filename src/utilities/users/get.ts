import { doc, DocumentReference, getDoc, onSnapshot } from 'firebase/firestore';
import { userConverter } from '../../converters/user';
import { db } from '../../firebase/init';
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
import { getCompany } from '../companies/get';
import { getSelectedReviews } from './reviews/get';

async function getUserEmployerProps(user: TUserRead) {
  let newActiveCompany: TEmployer | undefined;
  let newCompanies: TEmployer[] = [];

  try {
    if (user.activeCompany) {
      const company = await getCompany(user.activeCompany.company);
      newActiveCompany = {
        ...user.activeCompany,
        ...(company && { company }),
      };
    }
  } catch (error) {
    console.log('failed to fetch company for user.employer', error);
  }

  try {
    if (user.companies) {
      newCompanies = await Promise.all(
        user.companies.map(async employer => {
          const company = await getCompany(employer.company);
          return {
            ...employer,
            ...(company && { company }),
          };
        })
      );
    }
  } catch (error) {
    console.log('failed to fetch company for user.employers', error);
  }

  const shouldConcat = !newCompanies.some(
    employer => employer.company.id === newActiveCompany?.company.id
  );

  if (newActiveCompany && shouldConcat) {
    newCompanies = newCompanies.concat(newActiveCompany);
  }

  return { activeCompany: newActiveCompany, companies: newCompanies };
}

async function _getUserFromRef(
  userRef: DocumentReference<TUserWrite>
): Promise<TUser> {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error('User does not exist.');
  }
  const userData = userSnap.data();
  const {
    activeCompany: employer,
    companies: employers,
    freelancer,
    ...rest
  } = userData;
  const { activeCompany, companies } = await getUserEmployerProps(userData);
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
      activeCompany: activeCompany,
    }),
    ...(freelancer && {
      freelancer: newFreelancer,
    }),
    ...(companies && {
      companies: companies,
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
      const {
        activeCompany: employer,
        companies: employers,
        freelancer,
        ...rest
      } = userData;

      const { activeCompany, companies } = await getUserEmployerProps(userData);

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
        ...(companies && {
          companies: companies,
        }),
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}
