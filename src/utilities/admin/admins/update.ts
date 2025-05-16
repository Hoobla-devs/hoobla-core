import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/init';
import { TAdmin } from '../../../types/adminTypes';
import { TInvite } from '../../../types/companyTypes';

const rand = function () {
  return Math.random().toString(36).slice(2); // remove `0.`
};

const token = function () {
  return rand() + rand() + rand(); // to make it longer
};

export async function addAdminInvites(user: TAdmin, emails: string[]) {
  // const invites: TInvite[] = emails.map((email, i) => ({
  //   name: '', // TODO: Implement this
  //   position: '',
  //   role: 'admin',
  //   email: email,
  //   token: token(),
  //   date: new Date(),
  // }));
  // const adminRef = doc(db, 'admins', user.uid);
  // const success = await updateDoc(adminRef, {
  //   invites: [...user.invites, ...invites],
  // })
  //   .then(() => true)
  //   .catch(err => false);
  // if (success) return { success: true, invites };
  // return { success: false, invites: [] };
}
