import { doc, DocumentReference, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/init';
import { TAdminWrite } from '../../../types/adminTypes';

export async function createAdminUser(
  uid: string,
  name: string,
  email: string,
  inviter: string
) {
  const adminRef = doc(db, 'admins', uid) as DocumentReference<TAdminWrite>;

  console.log('test');
  return await setDoc(adminRef, {
    name,
    email,
    isAdmin: true,
    createdAt: Timestamp.fromDate(new Date()),
    invites: [],
    inviter,
  })
    .then(() => true)
    .catch(error => {
      console.log(error);
      return false;
    });
}
