import { arrayUnion, doc, DocumentReference } from 'firebase/firestore';
import { applicantConverter } from '../../../converters/job';
import { db } from '../../../firebase/init';
import {
  TOffer,
  TJobWrite,
  TApplicantWrite,
  TContactStatus,
  TJobStatus,
  TOfferType,
} from '../../../types/jobTypes';
import { TGeneral, TUserWrite } from '../../../types/userTypes';
import { createNotification } from '../../notifications/add';
import { updateDoc } from '../../updateDoc';

const contactLogs = {
  approved: {
    title: 'Tengiliðaupplýsingar samþykktar',
    description: (name: string) =>
      `${name} hefur samþykkt birtingu tengiliðaupplýsinga`,
  },
  denied: {
    title: 'Tengiliðaupplýsingum hafnað',
    description: (name: string) =>
      `${name} hefur hafnað birtingu tengiliðaupplýsinga og þar með dregið tilboðið sitt til baka`,
  },
  requested: {
    title: 'Beiðni um tengiliðaupplýsingar',
    description: (name: string) =>
      `Beiðni send á ${name} um að fá tengiliðaupplýsingar`,
  },
};

export async function changeJobOffer(
  uid: string,
  jobId: string,
  offer: TOffer
) {
  // create the job reference
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  // take out all non numbers from offer
  offer = {
    ...offer,
    hourlyRate: offer.hourlyRate.replaceAll(/[^0-9]/g, '') || '',
    fixedRate: offer.fixedRate.replaceAll(/[^0-9]/g, '') || '',
  };

  const applicationRef = doc(jobRef, 'applicants', uid).withConverter(
    applicantConverter
  ) as DocumentReference<TApplicantWrite>;

  await updateDoc(applicationRef, { offer }).catch(err => {
    throw new Error(`Error adding application to job: ${err}`);
  });

  return jobRef;
}

export async function addAcceptedRate(
  applicantId: string,
  jobId: string,
  offerType: TOfferType
): Promise<boolean> {
  // create the job reference
  const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;

  const applicationRef = doc(
    jobRef,
    'applicants',
    applicantId
  ) as DocumentReference<TApplicantWrite>;

  return await updateDoc(applicationRef, {
    'offer.acceptedRate': offerType,
  })
    .catch(err => {
      console.log(`Error adding application to job: ${err}`);
      return false;
    })
    .then(() => true);
}

export async function updateContactApproval(
  jobId: string,
  creatorId: string,
  jobStatus: TJobStatus,
  freelancerInfo: TGeneral,
  status: TContactStatus
) {
  try {
    const jobRef = doc(db, 'jobs', jobId) as DocumentReference<TJobWrite>;
    const applicantRef = doc(
      db,
      `jobs/${jobId}/applicants`,
      freelancerInfo.uid
    ) as DocumentReference<TApplicantWrite>;

    await updateDoc(applicantRef, {
      contactApproval: status,
    })
      .then(() => {
        updateDoc(jobRef, {
          logs: arrayUnion({
            date: new Date(),
            status: jobStatus,
            title: contactLogs[status].title,
            description: contactLogs[status].description(freelancerInfo.name),
          }),
        });

        console.log('Creating notification');
        // Add notification to job creator that contact approval was changed
        // If status is approved, add notification to employer, if denied add notification to freelancer
        createNotification({
          accountType: status === 'requested' ? 'freelancer' : 'employer', // The receiving account type
          jobId: jobId,
          recipientId: status === 'requested' ? freelancerInfo.uid : creatorId,
          senderId: status === 'requested' ? creatorId : freelancerInfo.uid,
          type:
            status === 'requested'
              ? 'contactInfoRequested'
              : status === 'denied'
                ? 'contactInfoDenied'
                : 'contactInfoApproved',
        }).catch(error => {
          console.error('Error creating notification:', error);
        });
      })
      .catch(error => {
        throw new Error('Could not update freelancer contact status: ', error);
      });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
