import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { companyConverter } from "../../converters/company";
import { db } from "../../firebase/init";
import {
  TCompanyRead,
  TCompanyWithCreator,
  TCompanyWithEmployees,
  TCompanyWrite,
  TInvite,
} from "../../types/companyTypes";
import { TEmployerUser } from "../../types/userTypes";
import { getEmployer, getUserGeneralInfo } from "../users/get";

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

export async function checkIfEmailsInUse(
  emails: string[],
  empRefList: DocumentReference<TEmployerUser>[]
) {
  // Check if employer is already an employee
  const currEmployerMails = await Promise.all(
    empRefList.map(async (empRef) => {
      const employerInfo = await getUserGeneralInfo(empRef.id);

      return employerInfo.email;
    })
  );

  const invalidEmails = emails.filter((email) =>
    currEmployerMails.includes(email)
  );
  if (invalidEmails.length > 0) {
    return { valid: false, invalidEmails };
  }
  return { valid: true, invalidEmails: [] };
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

export async function getCompany(
  companyRef: string | DocumentReference<TCompanyWrite>
) {
  if (typeof companyRef === "string") {
    companyRef = doc(
      db,
      "companies",
      companyRef
    ) as DocumentReference<TCompanyWrite>;
  }
  const company = await _getCompanyFromRef(companyRef);
  return company;
}

export async function getCompanyWithEmployees(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyWithEmployees> {
  const company = await _getCompanyFromRef(companyRef);

  const employees = await Promise.all(
    company.employees.map(async (empRef) => {
      const employer = await getEmployer(empRef.id);
      return employer;
    })
  );

  return { ...company, employees: employees };
}

export async function getCompanyWithCreator(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyWithCreator> {
  const company = await _getCompanyFromRef(companyRef);

  const creator = await getEmployer(company.creator.id);

  return { ...company, creator };
}
