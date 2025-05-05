import { collection, getDocs } from 'firebase/firestore';
import { companyConverter } from '../../../converters/company';
import { db } from '../../../firebase/init';
import { TCompanyWithCreator } from '../../../types/companyTypes';
import { getEmployer } from '../../users/get';

export async function getCompanies(): Promise<{
  companies: TCompanyWithCreator[];
  failedCompanies: { id: string; name?: string }[];
}> {
  try {
    const companiesCollectionRef = collection(db, 'companies').withConverter(
      companyConverter
    );
    const companiesSnap = await getDocs(companiesCollectionRef);
    const failedCompanies: { id: string; name?: string }[] = [];

    const companiesPromise = companiesSnap.docs.map(async doc => {
      try {
        const company = doc.data();
        const employeesCollection = collection(doc.ref, 'employees');

        const [creator, employeesSnap] = await Promise.all([
          getEmployer(company.creator.id),
          getDocs(employeesCollection),
        ]).catch(error => {
          console.error(`Failed to fetch data for company ${doc.id}:`, error);
          failedCompanies.push({ id: doc.id, name: company?.name });
          return [null, null];
        });

        if (!creator || !employeesSnap) {
          return null;
        }

        return {
          ...company,
          creator,
          employeesCount: employeesSnap.docs.length || 0,
        } as TCompanyWithCreator;
      } catch (error) {
        console.error(`Error processing company ${doc.id}:`, {
          error,
          companyData: doc.data(),
          creatorId: doc.data()?.creator?.id,
        });
        failedCompanies.push({ id: doc.id, name: doc.data()?.name });
        return null;
      }
    });

    const companiesWithNulls = await Promise.all(companiesPromise).catch(
      error => {
        console.error('Failed to process all companies:', error);
        throw error;
      }
    );

    const companies = companiesWithNulls.filter(
      (company): company is TCompanyWithCreator => company !== null
    );

    return { companies, failedCompanies };
  } catch (error) {
    console.error('Fatal error in getCompanies:', error);
    throw new Error(`Failed to fetch companies: ${error}`);
  }
}
