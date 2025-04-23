import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/init';
import { TErrorRead } from '../../types/errorTypes';
import { errorConverter } from '../../converters/error';

export async function createErrorLog(
  errorData: TErrorRead
): Promise<string | null> {
  try {
    const errorsRef = collection(db, 'errors').withConverter(errorConverter);

    const errorDoc = await addDoc(errorsRef, errorData);

    return errorDoc.id;
  } catch (error) {
    console.error('Failed to create error log:', error);
    return null;
  }
}
