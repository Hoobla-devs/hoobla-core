import { collection, getDocs } from "firebase/firestore";
import { companyConverter } from "../../../converters/company";
import { db } from "../../../firebase/init";
import { TCompanyWithCreator } from "../../../types/companyTypes";
import { getEmployer } from "../../users/get";

export async function getCompanies(): Promise<TCompanyWithCreator[]> {
  const companiesRef = collection(db, "companies").withConverter(
    companyConverter
  );
  const companiesSnap = await getDocs(companiesRef);

  const companiesPromise = companiesSnap.docs.map(async (doc) => {
    const company = doc.data();
    const creator = await getEmployer(company.creator.id);
    return { ...company, creator };
  });

  const companies: TCompanyWithCreator[] = await Promise.all(companiesPromise);

  return companies;
}
