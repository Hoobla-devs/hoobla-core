import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import {
  TFreelancerRead,
  TFreelancerWrite,
  TReviewRead,
  TReviewWrite,
  TUserRead,
  TUserWrite,
} from "../types/userTypes";

export const userConverter = {
  toFirestore(user: TUserRead): TUserWrite {
    const { general, freelancer, ...props } = user;

    const { createdAt, updatedAt, ...generalProps } = general;

    let freelancerWrite: TFreelancerWrite | undefined = undefined;

    if (freelancer) {
      const { contract, ...freelancerProps } = freelancer;

      freelancerWrite = {
        ...freelancerProps,
      };

      if (contract) {
        const { date, ...contractProps } = contract;
        freelancerWrite.contract = {
          ...contractProps,
          ...(contract && {
            date: date && Timestamp.fromDate(date),
          }),
        };
      }
    }

    return {
      ...props,
      general: {
        ...generalProps,
        createdAt: Timestamp.fromDate(createdAt),
        ...(updatedAt && { updatedAt: Timestamp.fromDate(updatedAt) }),
      },
      ...(freelancerWrite && { freelancer: freelancerWrite }),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TUserWrite>,
    options: SnapshotOptions
  ): TUserRead {
    const snapData = snapshot.data(options);
    const { general, freelancer, ...props } = snapData;

    const { createdAt, updatedAt, ...generalProps } = general;

    let freelancerRead: TFreelancerRead | undefined = undefined;

    if (freelancer) {
      const { contract, ...freelancerProps } = freelancer;

      freelancerRead = {
        ...freelancerProps,
      };
      if (contract && contract.date) {
        const { date, ...contractProps } = contract;
        freelancerRead.contract = {
          ...contractProps,
          date: date.toDate(),
        };
      }
    }

    return {
      ...props,
      general: {
        uid: snapshot.id,
        ...generalProps,
        createdAt: createdAt.toDate(),
        ...(updatedAt && { updatedAt: updatedAt.toDate() }),
      },
      ...(freelancerRead && { freelancer: freelancerRead }),
    };
  },
};

export const reviewConverter = {
  toFirestore(review: TReviewRead): TReviewWrite {
    const { date, ...props } = review;

    return {
      ...props,
      date: Timestamp.fromDate(date),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TReviewWrite>,
    options: SnapshotOptions
  ): TReviewRead {
    const snapData = snapshot.data(options);
    const { date, ...props } = snapData;

    return {
      ...props,
      date: date.toDate(),
    };
  },
};
