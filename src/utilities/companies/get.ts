import { DocumentReference, getDoc } from "firebase/firestore";
import { companyConverter } from "../../converters/company";
import { TCompany, TCompanyRead } from "../../types/companyTypes";

async function _getCompanyFromRef(
  companyRef: DocumentReference<TCompany>
): Promise<TCompanyRead> {
  const companySnap = await getDoc(companyRef.withConverter(companyConverter));
  if (!companySnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const companyData = companySnap.data();
  return companyData;
}

export async function getCompany(companyRef: DocumentReference<TCompany>) {
  const company = await _getCompanyFromRef(companyRef);
  return company;
}
