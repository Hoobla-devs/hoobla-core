import {
  addDoc,
  collection,
  DocumentReference,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { companyConverter } from "../../converters/company";
import { db } from "../../firebase/init";
import {
  TCompanyFormData,
  TCompanyRead,
  TCompanyWrite,
} from "../../types/companyTypes";
import { TEmployerUser } from "../../types/userTypes";
import { uploadPhoto } from "../storage/add";
import { updateDoc } from "../updateDoc";
import { addEmployerDataAndCompanyToUser } from "../users/update";

export function convertCompanyFormToCompanyRead(
  companyForm: TCompanyFormData,
  uid: string
) {
  const userRef = doc(db, "users", uid) as DocumentReference<TEmployerUser>;

  const companyRead: TCompanyRead = {
    ...companyForm,
    id: "",
    creator: userRef,
    employees: [userRef],
    jobs: [],
    logo: { url: "" },
    invites: [], // This is done via api
  };
  return companyRead;
}

export async function createCompany(
  companyFormData: TCompanyFormData,
  uid: string
) {
  const companyRead = convertCompanyFormToCompanyRead(companyFormData, uid);

  // Step 1: Add company to companies collection

  const companyRef = await addDoc(
    collection(db, "companies").withConverter(companyConverter),
    companyRead
  )
    .catch((err) => {
      throw new Error(`Error adding company: ${err}`);
    })
    .then((ref) => {
      return ref as DocumentReference<TCompanyWrite>;
    });

  // Step 2: Upload the photo to storage

  const { id } = companyRef;
  const { logo } = companyFormData;
  const file = logo?.file!; // it is guarenteed to be there;

  const url = await uploadPhoto(file, "companies/" + id + "/logo");

  // Step 3: Update the company with the photo url
  await updateDoc(
    doc(db, "companies", id) as DocumentReference<TCompanyWrite>,
    {
      logo: { url },
    }
  );

  // Step 4: Update the user with the company reference
  const creator = companyFormData.creator!;
  await addEmployerDataAndCompanyToUser(uid, creator, companyRef);

  return companyRef;
}
