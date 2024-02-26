import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TUserWrite } from "../../types/userTypes";
import { updateDoc } from "../updateDoc";

export async function markUserDeleted(uid: string) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  await updateDoc(userRef, {
    deleted: true,
  }).catch((error) => {
    console.log(error);
  });
}
