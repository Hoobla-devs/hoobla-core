import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { TUserRead, TUserWrite } from "../types/userTypes";

export const userConverter = {
  toFirestore(user: TUserRead): TUserWrite {
    const { general, ...props } = user;

    const { createdAt, updatedAt, ...generalProps } = general;

    return {
      ...props,
      general: {
        ...generalProps,
        createdAt: Timestamp.fromDate(createdAt),
        ...(updatedAt && { updatedAt: Timestamp.fromDate(updatedAt) }),
      },
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TUserWrite>,
    options: SnapshotOptions
  ): TUserRead {
    const snapData = snapshot.data(options);
    const { general, ...props } = snapData;

    const { createdAt, updatedAt, ...generalProps } = general;
    return {
      ...props,
      general: {
        ...generalProps,
        createdAt: createdAt.toDate(),
        ...(updatedAt && { updatedAt: updatedAt.toDate() }),
      },
    };
  },
};
