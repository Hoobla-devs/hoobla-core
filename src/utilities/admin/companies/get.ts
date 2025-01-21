import { collection, getDocs } from 'firebase/firestore';
import { companyConverter } from '../../../converters/company';
import { db } from '../../../firebase/init';
import { TCompanyWithCreator } from '../../../types/companyTypes';
import { getEmployer } from '../../users/get';

export async function getCompanies(): Promise<TCompanyWithCreator[]> {
  try {
    const companiesCollectionRef = collection(db, 'companies').withConverter(
      companyConverter
    );
    const companiesSnap = await getDocs(companiesCollectionRef);

    const companiesPromise = companiesSnap.docs.map(async doc => {
      try {
        const company = doc.data();
        const employeesCollection = collection(doc.ref, 'employees');

        const [creator, employeesSnap] = await Promise.all([
          getEmployer(company.creator.id),
          getDocs(employeesCollection),
        ]).catch(error => {
          console.error(`Failed to fetch data for company ${doc.id}:`, error);
          throw error;
        });

        return {
          ...company,
          creator,
          employeesCount: employeesSnap.docs.length || 0,
        };
      } catch (error) {
        console.error(`Error processing company ${doc.id}:`, {
          error,
          companyData: doc.data(),
          creatorId: doc.data()?.creator?.id,
        });
        throw new Error(`Failed to process company ${doc.id}: ${error}`);
      }
    });

    const companies = await Promise.all(companiesPromise).catch(error => {
      console.error('Failed to process all companies:', error);
      throw error;
    });

    return companies;
  } catch (error) {
    console.error('Fatal error in getCompanies:', error);
    throw new Error(`Failed to fetch companies: ${error}`);
  }
}
