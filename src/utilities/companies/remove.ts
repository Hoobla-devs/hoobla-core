import { doc, updateDoc } from 'firebase/firestore';
import { TInvite } from '../../types/companyTypes';
import { db } from '../../firebase/init';
import { getCompany, getCompanyWithEmployees } from './get';

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

export async function removeCompanyEmployee(companyId: string, email: string) {
  const company = await getCompanyWithEmployees(companyId);

  const updatedEmployees = company.employees.filter(
    employee => employee.general.email !== email
  );

  const companyRef = doc(db, 'companies', companyId);

  // TODO: remove this employee from all jobs as well

  return await updateDoc(companyRef, { employees: updatedEmployees })
    .then(() => true)
    .catch(() => false);
}
