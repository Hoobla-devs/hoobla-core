import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { companyConverter } from '../../../converters/company';
import { jobConverter } from '../../../converters/job';
import { db } from '../../../firebase/init';
import { TCompanyWithCreator, TCompanyRead } from '../../../types/companyTypes';
import { TJobRead, TJobWithEmployees } from '../../../types/jobTypes';
import { getEmployer } from '../../users/get';

export type TCompanyWithJobs = Omit<TCompanyRead, 'jobs'> & {
  jobs: TJobWithEmployees[];
};

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

export async function getCompanyWithJobs(
  companyId: string
): Promise<TCompanyWithJobs> {
  // Get company data directly from database
  const companyRef = doc(db, 'companies', companyId).withConverter(
    companyConverter
  );
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) {
    throw new Error('Company does not exist');
  }

  const company = companySnap.data();

  // Get jobs directly from database using the job IDs from company
  const jobIds = company.jobs.map((jobRef: any) => jobRef.id);

  const jobsResults = await Promise.allSettled(
    jobIds.map(async (jobId: string) => {
      const jobRef = doc(db, 'jobs', jobId).withConverter(jobConverter);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error(`Job ${jobId} does not exist`);
      }

      const job = jobSnap.data();

      // Get job employees directly from database
      const employeesRef = collection(db, 'jobs', jobId, 'employees');
      const employeesSnap = await getDocs(employeesRef);

      const employees = employeesSnap.docs.map(empDoc => ({
        id: empDoc.id,
        ...empDoc.data(),
      })) as TJobWithEmployees['employees'];

      return {
        ...job,
        employees,
      } as TJobWithEmployees;
    })
  );

  // Filter out failed job fetches and extract successful results
  const jobs = jobsResults
    .filter(
      (result): result is PromiseFulfilledResult<TJobWithEmployees> =>
        result.status === 'fulfilled'
    )
    .map(result => result.value);

  return { ...company, jobs };
}
