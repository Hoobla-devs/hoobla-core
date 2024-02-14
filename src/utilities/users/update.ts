import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TUserWrite } from "../../types/userTypes";
import { updateDoc } from "../updateDoc";

export function switchLocale(uid: string, lang: "is" | "en") {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "general.lang": lang });
}

export function updateSMSNotifications(uid: string, value: boolean) {
  console.log("updateSMSNotifications", uid, value);

  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "settings.SMSNotifications": value });
}

export function updateJobTitlesNotificationSettings(
  uid: string,
  jobTitles: string[]
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  updateDoc(userRef, { "settings.excludedJobTitleNotifications": jobTitles });
}
