import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import { TCompanyCreatorData, TCompanyWrite } from "../../types/companyTypes";
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

export async function addEmployerDataAndCompanyToUser(
  uid: string,
  employerData: TCompanyCreatorData,
  companyRef: DocumentReference<TCompanyWrite>
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TUserWrite>;
  return updateDoc(userRef, {
    "general.name": employerData.name,
    "general.ssn": employerData.ssn,
    "general.phone": employerData.phone,
    "employer.position": employerData.position,
    "employer.company": companyRef,
  })
    .catch((error) => {
      throw new Error("Error adding employer data to user: " + error);
    })
    .then(() => true);
}
