import {
  doc,
  setDoc,
  collection,
  addDoc,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../../../firebase/init';
import { TEmail } from '../../../types/emailTypes';

export async function createEmailTemplate(emailTemplate: Omit<TEmail, 'id'>) {
  try {
    const emailsRef = collection(db, 'emails');
    const docRef = await addDoc(emailsRef, emailTemplate);

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating email template:', error);
    return {
      success: false,
      error: 'Failed to create email template',
    };
  }
}
