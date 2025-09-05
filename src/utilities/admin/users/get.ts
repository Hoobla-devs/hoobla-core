import {
  collection,
  CollectionReference,
  query,
  where,
  Query,
  getDocs,
  DocumentReference,
  doc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { userConverter } from '../../../converters/user';
import { db } from '../../../firebase/init';
import {
  TFreelancerRead,
  TFreelancerUser,
  TReview,
  TUserRead,
  TUserWrite,
} from '../../../types/userTypes';
import { getSelectedReviews } from '../../users/reviews/get';
import { TFreelancerOffer } from '../../../types/adminTypes';
import { getJob, getJobWithApplicants } from '../../jobs/get';
import { TJobWithApplicants } from '../../../types/jobTypes';

export async function getAllFreelancers(): Promise<TFreelancerUser[]> {
  const usersRef = collection(db, 'users').withConverter(
    userConverter
  ) as CollectionReference<TUserRead>;
  const usersQuery = query(
    usersRef,
    where('freelancer', '!=', null)
  ) as Query<TFreelancerUser>;
  const freelancersSnap = await getDocs(usersQuery);

  const freelancers = freelancersSnap.docs.map(doc => {
    return doc.data();
  });

  const notDeletedFreelancers = freelancers.filter(
    user => user.deleted !== true
  );

  return notDeletedFreelancers;
}

export async function getFreelancersWithUnapprovedTags(): Promise<
  TFreelancerUser[]
> {
  try {
    const usersRef = collection(db, 'users').withConverter(
      userConverter
    ) as CollectionReference<TUserRead>;
    const usersQuery = query(
      usersRef,
      where('freelancer.unapprovedTags', '!=', null),
      where('freelancer.status', '==', 'approved')
    ) as Query<TFreelancerUser>;
    const freelancersSnap = await getDocs(usersQuery);

    const freelancers = freelancersSnap.docs.map(doc => {
      return doc.data();
    });

    return freelancers;
  } catch (error) {
    return [];
  }
}

export async function getUserByEmail(email: string): Promise<TUserRead | null> {
  const usersRef = collection(db, 'users').withConverter(
    userConverter
  ) as CollectionReference<TUserRead>;

  const q = query(usersRef, where('general.email', '==', email));

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const usersData = querySnapshot.docs.map(doc => doc.data());
    return usersData[0];
  } else {
    return null;
  }
}

export const getFreelancerOffers = async (
  freelancerId: string
): Promise<TFreelancerOffer[]> => {
  const freelancerRef = doc(db, 'users', freelancerId).withConverter(
    userConverter
  ) as DocumentReference<TFreelancerUser>;
  const freelancerSnap = await getDoc(freelancerRef);
  const freelancer = freelancerSnap.data();
  if (!freelancer) throw new Error('Freelancer not found');

  const freelancerJobs = await Promise.all(
    freelancer.freelancer.jobs.map(async jobId => {
      return getJobWithApplicants(jobId).catch(() => null);
    })
  );

  const freelancerJobsData = freelancerJobs.filter(
    job => job !== null
  ) as TJobWithApplicants[];

  const freelancerOffers = freelancerJobsData.map(job => {
    const freelancerOffer = job.applicants.find(
      applicant => applicant.id === freelancerId
    );
    return {
      jobId: job.id,
      jobTitle: job.name,
      offer: freelancerOffer!.offer,
    };
  });

  return freelancerOffers;
};
