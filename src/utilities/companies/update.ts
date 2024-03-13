import { doc, DocumentReference } from "firebase/firestore";
import { db } from "../../firebase/init";
import {
  TCompany,
  TCompanyFormData,
  TCompanyRead,
  TCompanyWrite,
  TInvite,
} from "../../types/companyTypes";
import { uploadPhoto } from "../storage/add";
import { deletePhoto } from "../storage/delete";
import { updateDoc } from "../updateDoc";

function rand() {
  return Math.random().toString(36).slice(2); // remove `0.`
}

function token() {
  return rand() + rand() + rand(); // to make it longer
}

export function convertEditCompanyFormToCompanyRead(
  company: TCompany,
  companyForm: TCompanyFormData,
  newLogo: string
) {
  const { name, ssn, phone, address, size, website } = companyForm;
  const companyRead: TCompanyRead = {
    ...company,
    name,
    ssn,
    phone,
    address,
    size,
    website,
    logo: { url: newLogo },
  };
  return companyRead;
}

export async function updateCompany(
  company: TCompany,
  companyFormData: TCompanyFormData
) {
  const { oldLogo, ...companyData } = companyFormData;
  // Step 1: If new logo was added, remove old and add new to storage
  let companyLogo: string = oldLogo?.url || "";
  if (companyData.logo) {
    await deletePhoto(oldLogo!.url);

    // upload logo and get storage url
    const file = companyData.logo.file;
    companyLogo = await uploadPhoto(file!, "companies/" + company.id + "/logo");
  }
  // Create the data to write to firebase
  const { id, ...companyRead } = convertEditCompanyFormToCompanyRead(
    company,
    companyFormData,
    companyLogo
  );

  // Step 3: Update the company with the photo url
  return await updateDoc(
    doc(db, "companies", id) as DocumentReference<TCompanyWrite>,
    companyRead
  )
    .then(() => true)
    .catch(() => false);
}

export async function updateInvitationList(
  cid: string,
  emails: string[],
  oldInvites: TInvite[]
) {
  const companyRef = doc(
    db,
    "companies",
    cid
  ) as DocumentReference<TCompanyWrite>;

  const invites = [...oldInvites];

  emails.forEach((email, i) => {
    const inviteIndex = invites.findIndex((invite) => invite.email === email);
    if (inviteIndex >= 0) {
      invites[inviteIndex].token = token();
      invites[inviteIndex].date = new Date();
    } else {
      invites.push({
        email: email,
        token: token(),
        date: new Date(),
      });
    }
  });

  return await updateDoc(companyRef, { invites })
    .then(() => invites)
    .catch(() => null);
}
