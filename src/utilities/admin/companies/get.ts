import { collection, getDocs } from 'firebase/firestore';
import { companyConverter } from '../../../converters/company';
import { db } from '../../../firebase/init';
import { TCompanyWithCreator } from '../../../types/companyTypes';
import { getEmployer } from '../../users/get';

export async function getCompanies(): Promise<TCompanyWithCreator[]> {
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
      ]);

      return {
        ...company,
        creator,
        employeesCount: employeesSnap.docs.length || 0,
      };
    } catch (error) {
      console.log('Error getting company:', doc.id);
      throw new Error('Errror getting company!');
    }
  });

  const companies: TCompanyWithCreator[] = await Promise.all(companiesPromise);

  return companies;
}
