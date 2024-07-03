import { CollectionReference, getDocs } from 'firebase/firestore';
import { employeeConverter } from '../../../converters/job';
import { TJobEmployeeWrite } from '../../../types/jobTypes';

export async function getAllEmployees(
  ref: CollectionReference<TJobEmployeeWrite>
) {
  const employeesSnap = await getDocs(ref.withConverter(employeeConverter));
  const employees = employeesSnap.docs.map(doc => doc.data());
  return employees;
}
