import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { adminConverter } from "../../../converters/admin";
import { db } from "../../../firebase/init";
import { TAdmin, TAdminRead } from "../../../types/adminTypes";

export async function getAdminUser(uid: string): Promise<TAdmin | null> {
  const adminRef = doc(db, "admins", uid).withConverter(
    adminConverter
  ) as DocumentReference<TAdminRead>;
  const adminDoc = await getDoc(adminRef);

  if (adminDoc.exists()) {
    const adminData = adminDoc.data();
    return adminData;
  }

  return null;
}

export async function getAllAdmins(): Promise<TAdmin[]> {
  const adminsRef = collection(db, "admins").withConverter(adminConverter);
  const adminsSnap = await getDocs(adminsRef);

  if (!adminsSnap.empty) {
    const admins = adminsSnap.docs.map((doc) => doc.data());
    return admins;
  }

  return [];
}
