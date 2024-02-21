import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { TCompanyRead, TCompanyWrite } from "../types/companyTypes";

export const companyConverter = {
  toFirestore(company: TCompanyRead): TCompanyWrite {
    const { invites, id, ...props } = company;

    const newInvites = invites.map((i) => ({
      ...i,
      date: Timestamp.fromDate(i.date),
    }));

    return {
      ...props,
      invites: newInvites,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TCompanyWrite>,
    options: SnapshotOptions
  ): TCompanyRead {
    const snapData = snapshot.data(options);
    const { invites, ...props } = snapData;
    return {
      ...props,
      id: snapshot.id,
      invites: invites.map((i) => ({ ...i, date: i.date.toDate() })),
    };
  },
};
