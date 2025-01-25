import {
  collection,
  doc,
  getDoc,
  getDocs,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../../firebase/init';
import { TEmail, TEmailTemplate } from '../../types/emailTypes';

export async function getEmailTemplateByType(
  type: TEmailTemplate
): Promise<TEmail | null> {
  try {
    const emailsRef = collection(db, 'emails');
    const emailsSnap = await getDocs(emailsRef);

    const emailDoc = emailsSnap.docs.find(doc => doc.data().type === type);

    if (emailDoc) {
      return {
        id: emailDoc.id,
        ...emailDoc.data(),
      } as TEmail;
    }

    return null;
  } catch (error) {
    console.error('Error fetching email template:', error);
    return null;
  }
}

export async function getAllEmailTemplates(): Promise<TEmail[]> {
  try {
    const emailsRef = collection(db, 'emails');
    const emailsSnap = await getDocs(emailsRef);

    return emailsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TEmail[];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
}
