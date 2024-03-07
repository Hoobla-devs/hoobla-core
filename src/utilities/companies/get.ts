import {
  collection,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { companyConverter } from "../../converters/company";
import { db } from "../../firebase/init";
import { TCompanyRead, TCompanyWrite } from "../../types/companyTypes";

async function _getCompanyFromRef(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyRead> {
  const companySnap = await getDoc(companyRef.withConverter(companyConverter));
  if (!companySnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const companyData = companySnap.data();
  return companyData;
}

export async function checkIfCompanyExists(ssn: string) {
  try {
    const companyRef = collection(db, "company");
    const companyQuery = query(companyRef, where("ssn", "==", ssn));
    const companyQuerySnapshot = (await getDocs(
      companyQuery
    )) as QuerySnapshot<TCompanyWrite>;
    return companyQuerySnapshot.docs.length > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getCompany(companyRef: DocumentReference<TCompanyWrite>) {
  const company = await _getCompanyFromRef(companyRef);
  return company;
}
