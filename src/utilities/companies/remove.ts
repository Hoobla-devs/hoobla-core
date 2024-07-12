import {
  arrayRemove,
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { TCompanyWrite } from '../../types/companyTypes';
import { db } from '../../firebase/init';
import { getCompany, getCompanyWithEmployees } from './get';
import { TUser } from '../../types/userTypes';
import { getEmployer } from '../users/get';

export async function removeCompanyInvite(companyId: string, token: string) {
  const company = await getCompany(companyId);
  const updatedInvites = company.invites.filter(
    invite => invite.token !== token
  );

  const companyRef = doc(db, 'companies', companyId);

  return await updateDoc(companyRef, { invites: updatedInvites })
    .then(() => true)
    .catch(() => false);
}

export async function removeCompanyEmployee(companyId: string, userId: string) {
  const companyRef = doc(
    db,
    'companies',
    companyId
  ) as DocumentReference<TCompanyWrite>;
  const employeesCollectionRef = collection(companyRef, 'employees');

  const userEmployeeToRemoveRef = doc(
    db,
    'users',
    userId
  ) as DocumentReference<TUser>;

  const [company, employeeData] = await Promise.all([
    getCompanyWithEmployees(companyId),
    getEmployer(userEmployeeToRemoveRef.id),
  ]);

  try {
    await runTransaction(db, async transaction => {
      // Remove the employee from the company's employee subcollection
      const employeeRef = doc(employeesCollectionRef, userId);
      transaction.delete(employeeRef);

      // Remove the employee from all jobs related to the company
      company.jobs.forEach(job => {
        const jobRef = doc(db, 'jobs', job.id);
        const employeesCollectionRef = collection(jobRef, 'employees');
        const employeeRef = doc(employeesCollectionRef, userId);
        transaction.delete(employeeRef);
      });

      // Determine new value for 'activeCompany' field
      const newActiveCompany =
        employeeData.activeCompany &&
        employeeData.activeCompany.company.id === companyId
          ? deleteField()
          : employeeData.activeCompany;

      // Update the employee's document
      transaction.update(userEmployeeToRemoveRef, {
        activeCompany: newActiveCompany,
        companies: arrayRemove(companyRef),
      });
    });

    console.log(
      'Employee removed from company and company reference removed from employee successfully'
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
