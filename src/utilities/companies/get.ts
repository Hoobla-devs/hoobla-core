import { DocumentReference, getDoc } from "firebase/firestore";
import { companyConverter } from "../../converters/company";
import {
  TCompany,
  TCompanyRead,
  TCompanyWrite,
} from "../../types/companyTypes";

async function _getCompanyFromRef(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyRead> {
  console.log("companyRef", companyRef);

  const companySnap = await getDoc(companyRef.withConverter(companyConverter));
  if (!companySnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const companyData = companySnap.data();
  return companyData;
}

export async function getCompany(companyRef: DocumentReference<TCompanyWrite>) {
  const company = await _getCompanyFromRef(companyRef);
  return company;
}
