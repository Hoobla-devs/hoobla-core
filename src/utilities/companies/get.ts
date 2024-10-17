import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from 'firebase/firestore';
import { companyConverter } from '../../converters/company';
import { db } from '../../firebase/init';
import {
  TCompanyEmployee,
  TCompanyRead,
  TCompanyWithCreator,
  TCompanyWithEmployees,
  TCompanyWrite,
  TInvite,
} from '../../types/companyTypes';
import { TEmployerUser } from '../../types/userTypes';
import { getEmployer, getUserGeneralInfo } from '../users/get';

export async function getCompanyById(companyId: string) {
  const companyRef = doc(
    db,
    'companies',
    companyId
  ) as DocumentReference<TCompanyWrite>;
  const company = await _getCompanyFromRef(companyRef);

  return company;
}

async function _getCompanyFromRef(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyRead> {
  const companySnap = await getDoc(companyRef.withConverter(companyConverter));
  if (!companySnap.exists()) {
    throw new Error('Company does not exist.');
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
    empRefList.map(async empRef => {
      const employerInfo = await getUserGeneralInfo(empRef.id);

      return employerInfo.email;
    })
  );

  const invalidEmails = emails.filter(email =>
    currEmployerMails.includes(email)
  );
  if (invalidEmails.length > 0) {
    return { valid: false, invalidEmails };
  }
  return { valid: true, invalidEmails: [] };
}

export async function checkIfCompanyExists(ssn: string) {
  try {
    const companyRef = collection(db, 'company');
    const companyQuery = query(companyRef, where('ssn', '==', ssn));
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
  if (typeof companyRef === 'string') {
    companyRef = doc(
      db,
      'companies',
      companyRef
    ) as DocumentReference<TCompanyWrite>;
  }
  const company = await _getCompanyFromRef(companyRef);
  return company;
}

export async function getCompanyEmployee(
  companyRef: string | DocumentReference<TCompanyWrite>,
  employeeId: string
): Promise<TCompanyEmployee> {
  if (typeof companyRef === 'string') {
    companyRef = doc(
      db,
      'companies',
      companyRef
    ) as DocumentReference<TCompanyWrite>;
  }

  const employeeRef = doc(companyRef, 'employees', employeeId);
  const [employeeSnap, userGeneralInfo] = await Promise.all([
    getDoc(employeeRef),
    getUserGeneralInfo(employeeId),
  ]);

  if (!employeeSnap.exists()) {
    throw new Error('Employee does not exist.');
  }

  const employeeData = employeeSnap.data();

  return {
    id: employeeSnap.id,
    name: userGeneralInfo.name,
    email: userGeneralInfo.email,
    phone: userGeneralInfo.phone,
    photo: userGeneralInfo.photo?.url || '',
    position: employeeData.position,
    role: employeeData.role,
  };
}

export async function getCompanyWithEmployees(
  companyRef: string | DocumentReference<TCompanyWrite>
): Promise<TCompanyWithEmployees> {
  if (typeof companyRef === 'string') {
    companyRef = doc(
      db,
      'companies',
      companyRef
    ) as DocumentReference<TCompanyWrite>;
  }

  const company = await _getCompanyFromRef(companyRef);
  const employeesRef = collection(companyRef, 'employees');
  const employeesSnap = await getDocs(employeesRef).catch(e => {
    console.log('Error fetching employeesSnap: ', e);
    return null;
  });
  if (!employeesSnap) {
    throw new Error('Failed to fetch employees');
  }

  const employees: Array<TCompanyEmployee | undefined> = await Promise.all(
    employeesSnap.docs.map(async empRef => {
      try {
        const employer = await getCompanyEmployee(companyRef, empRef.id);
        return employer;
      } catch (err) {
        console.error(`Failed to fetch employer with id ${empRef.id}:`, err);
        return undefined;
      }
    })
  );

  // Filter out undefined values from the employees array
  const validEmployees = employees.filter(
    emp => emp !== undefined
  ) as TCompanyEmployee[];

  return { ...company, employees: validEmployees };
}

export async function getCompanyWithCreator(
  companyRef: DocumentReference<TCompanyWrite>
): Promise<TCompanyWithCreator> {
  const company = await _getCompanyFromRef(companyRef);

  const creator = await getEmployer(company.creator.id);

  return { ...company, creator, employeesCount: 0 };
}

export async function getEmployerCompanies(
  companiesRef: DocumentReference<TCompanyWrite>[]
): Promise<TCompanyRead[]> {
  const companies = await Promise.all(
    companiesRef.map(async ref => {
      const company = await _getCompanyFromRef(ref);
      return company;
    })
  );

  return companies;
}
