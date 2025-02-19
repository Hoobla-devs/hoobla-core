import {
  doc,
  setDoc,
  collection,
  addDoc,
  DocumentReference,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../firebase/init';
import { TEmail, TEmailTemplate } from '../../../types/emailTypes';

export async function updateEmailTemplate(
  type: TEmailTemplate,
  updates: Partial<TEmail>
): Promise<boolean> {
  try {
    const emailsRef = collection(db, 'emails');
    const emailQuery = query(emailsRef, where('type', '==', type));
    const querySnapshot = await getDocs(emailQuery);

    if (querySnapshot.empty) {
      // Create new template if none exists
      const newTemplate = {
        type,
        ...updates,
      };
      await addDoc(emailsRef, newTemplate);
      return true;
    }

    const emailDoc = querySnapshot.docs[0];
    await updateDoc(emailDoc.ref, updates);
    return true;
  } catch (error) {
    console.error('Error updating email template:', error);
    return false;
  }
}
