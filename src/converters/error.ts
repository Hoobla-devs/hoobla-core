import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import { TErrorRead, TErrorWrite } from '../types/errorTypes';

export const errorConverter = {
  toFirestore(error: TErrorRead): TErrorWrite {
    const { timestamp, ...rest } = error;
    return {
      ...rest,
      timestamp: Timestamp.fromDate(timestamp),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TErrorWrite>,
    options: SnapshotOptions
  ): TErrorRead {
    const data = snapshot.data(options);
    return {
      ...data,
      timestamp: data.timestamp.toDate(),
    };
  },
};
