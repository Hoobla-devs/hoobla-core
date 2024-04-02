import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/init";
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
      const { contract, selectedReviews, inactiveSince, ...freelancerProps } =
        freelancer;

      freelancerWrite = {
        ...freelancerProps,
      };

      if (contract) {
        const { date, ...contractProps } = contract;
        freelancerWrite.contract = {
          ...contractProps,
          ...(date && {
            date: Timestamp.fromDate(date),
          }),
        };
      }
      if (selectedReviews) {
        freelancerWrite.selectedReviews = selectedReviews.map(
          (reviewId) =>
            doc(
              db,
              "users",
              general.uid,
              "reviews",
              reviewId
            ) as DocumentReference<TReviewWrite>
        );
      }
      if (inactiveSince) {
        freelancerWrite.inactiveSince = Timestamp.fromDate(inactiveSince);
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
    try {
      const snapData = snapshot.data(options);
      const { general, freelancer, ...props } = snapData;
  
      const { createdAt, updatedAt, ...generalProps } = general;
  
      let freelancerRead: TFreelancerRead | undefined = undefined;
  
      if (freelancer) {
        const { contract, selectedReviews, inactiveSince, ...freelancerProps } =
          freelancer;
  
        freelancerRead = {
          ...freelancerProps,
        };
        if (contract) {
          const { date, ...contractProps } = contract;
          freelancerRead.contract = {
            ...contractProps,
            ...(date && { date: date.toDate() }),
          };
        }
        if (selectedReviews) {
          freelancerRead.selectedReviews = selectedReviews.map(
            (reviewRef) => reviewRef.id
          );
        }
        if (inactiveSince) {
          freelancerRead.inactiveSince = inactiveSince.toDate();
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
    } catch (error) {
      console.log("Error on: ", snapshot.id);
      throw new Error("converter error!")
    }
      
  },
};

export const reviewConverter = {
  toFirestore(review: TReviewRead): TReviewWrite {
    const { id, date, ...props } = review;

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
      id: snapshot.id,
      date: date.toDate(),
    };
  },
};
