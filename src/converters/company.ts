import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/init";
import { TCompanyRead, TCompanyWrite } from "../types/companyTypes";
import { TJob } from "../types/jobTypes";
import { TEmployerUser } from "../types/userTypes";

export const companyConverter = {
  toFirestore(company: TCompanyRead): TCompanyWrite {
    const { id, invites, employees, jobs, creator, ...props } = company;

    const newInvites = invites.map((i) => ({
      ...i,
      date: Timestamp.fromDate(i.date),
    }));

    return {
      ...props,
      invites: newInvites,
      employees: employees.map(
        (employer) =>
          doc(db, "users", employer) as DocumentReference<TEmployerUser>
      ),
      jobs: jobs.map((job) => doc(db, "jobs", job) as DocumentReference<TJob>),
      creator: doc(db, "users, creator") as DocumentReference<TEmployerUser>,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TCompanyWrite>,
    options: SnapshotOptions
  ): TCompanyRead {
    const snapData = snapshot.data(options);
    const { invites, employees, jobs, creator, ...props } = snapData;
    return {
      ...props,
      id: snapshot.id,
      invites: invites.map((i) => ({ ...i, date: i.date.toDate() })),
      jobs: jobs.map((j) => j.id),
      creator: creator.id,
      employees: employees.map((e) => e.id),
    };
  },
};
