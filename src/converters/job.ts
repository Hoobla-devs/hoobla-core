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
    const { terms, logs, jobInfo, id, signatures, ...data } = job;

    // convert the terms to a firestore timestamp
    const newLogs = logs.map((log) => {
      return {
        ...log,
        date: Timestamp.fromDate(log.date),
      };
    });

    const signaturesWrite = signatures
      ? {
          ...signatures,
          ...(signatures.employer && {
            employer: {
              ...signatures.employer,
              date: Timestamp.fromDate(signatures.employer.date),
            },
          }),
          ...(signatures.freelancer && {
            freelancer: {
              ...signatures.freelancer,
              date: Timestamp.fromDate(signatures.freelancer.date),
            },
          }),
        }
      : null;

    const { deadline, ...jobInfoData } = jobInfo;

    // return that data
    return {
      ...data,
      terms: terms ? Timestamp.fromDate(terms) : null,
      logs: newLogs,
      signatures: signaturesWrite,
      jobInfo: {
        ...jobInfoData,
        ...(deadline && { deadline: Timestamp.fromDate(deadline) }),
      },
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TJobWrite>,
    options: SnapshotOptions
  ): TJobRead {
    const snapData = snapshot.data(options);
    const { terms, logs, jobInfo, signatures, ...data } = snapData;

    const newLogs = logs.map((log) => {
      return {
        ...log,
        date: log.date.toDate(),
      };
    });

    const signaturesRead = signatures
      ? {
          ...signatures,
          ...(signatures.employer && {
            employer: {
              ...signatures.employer,
              date: signatures.employer.date.toDate(),
            },
          }),
          ...(signatures.freelancer && {
            freelancer: {
              ...signatures.freelancer,
              date: signatures.freelancer.date.toDate(),
            },
          }),
        }
      : null;

    const { deadline, ...jobInfoData } = jobInfo;

    return {
      ...data,
      id: snapshot.id,
      terms: terms ? terms.toDate() : null,
      logs: newLogs,
      signatures: signaturesRead,
      jobInfo: {
        ...jobInfoData,
        ...(deadline && { deadline: deadline.toDate() }),
      },
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
