import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { TAdminRead, TAdminWrite } from "../types/adminTypes";

export const adminConverter = {
  toFirestore(admin: TAdminRead): TAdminWrite {
    const { createdAt, invites, ...adminProps } = admin;

    return {
      ...adminProps,
      invites: invites.map((invite) => ({
        ...invite,
        date: Timestamp.fromDate(invite.date),
      })),
      createdAt: Timestamp.fromDate(createdAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TAdminWrite>,
    options: SnapshotOptions
  ): TAdminRead {
    const snapData = snapshot.data(options);
    const { createdAt, invites, ...props } = snapData;

    return {
      ...props,
      uid: snapshot.id,
      invites: invites.map((invite) => ({
        ...invite,
        date: invite.date.toDate(),
      })),
      createdAt: createdAt.toDate(),
    };
  },
};
