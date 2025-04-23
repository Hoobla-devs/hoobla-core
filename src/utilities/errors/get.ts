import { CollectionReference, collection } from 'firebase/firestore';

import { getDocs } from 'firebase/firestore';
import { db } from '../../firebase/init';
import { TErrorWrite } from '../../types/errorTypes';
import { errorConverter } from '../../converters/error';

export const getErrors = async () => {
  const collectionRef = collection(
    db,
    'errors'
  ) as CollectionReference<TErrorWrite>;
  const errors = await getDocs(collectionRef.withConverter(errorConverter));
  return errors.docs.map(doc => doc.data());
};
