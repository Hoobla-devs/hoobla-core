import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import {
  TApplicantRead,
  TApplicantWrite,
  TJobRead,
  TJobWrite,
} from "../types/jobTypes";

export const jobConverter = {
  toFirestore(job: TJobRead): TJobWrite {
    // remove id and applicants from job
    const {
      id,
      terms,
      logs,

      ...data
    } = job;

    // convert the terms to a firestore timestamp
    const newLogs = logs.map((log) => {
      return {
        ...log,
        date: Timestamp.fromDate(log.date),
      };
    });

    // return that data
    return {
      ...data,
      terms: terms ? Timestamp.fromDate(terms) : null,
      logs: newLogs,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TJobWrite>,
    options: SnapshotOptions
  ): TJobRead {
    const snapData = snapshot.data(options);
    const { terms, logs, ...data } = snapData;

    const newLogs = logs.map((log) => {
      return {
        ...log,
        date: log.date.toDate(),
      };
    });

    return {
      ...data,
      terms: terms ? terms.toDate() : null,
      logs: newLogs,
      id: snapshot.id,
    };
  },
};

export const applicantConverter = {
  toFirestore(applicant: TApplicantRead): TApplicantWrite {
    return {
      ...applicant,
      offer: {
        ...applicant.offer,
        date: Timestamp.fromDate(applicant.offer.date),
        acceptedRate: "",
      },
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TApplicantWrite>,
    options: SnapshotOptions
  ): TApplicantRead {
    const snapData = snapshot.data(options);
    return {
      ...snapData,
      id: snapshot.id,
      offer: {
        ...snapData.offer,
        ...(snapData.offer.date && { date: snapData.offer.date.toDate() }),
      },
    };
  },
};
