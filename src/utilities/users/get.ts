import { doc, DocumentReference, getDoc, onSnapshot } from "firebase/firestore";
import { userConverter } from "../../converters/user";
import { db } from "../../firebase/init";
import {
  TFreelancerUser,
  TUserBase,
  TUserRead,
  TUserWrite,
} from "../../types/userTypes";

async function _getUserFromRef(userRef: DocumentReference<TUserWrite>) {
  const userSnap = await getDoc(userRef.withConverter(userConverter));

  if (!userSnap.exists()) {
    throw new Error("User does not exist.");
  }
  const userData = userSnap.data();
  return userData;
}

export async function getUserById(id: string): Promise<TUserRead> {
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

export function onUserChange(
  id: string,
  callback: (user: TUserRead | null) => void
) {
  const userRef = doc(db, "users", id).withConverter(
    userConverter
  ) as DocumentReference<TUserBase>;

  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}
