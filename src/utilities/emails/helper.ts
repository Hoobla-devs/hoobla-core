import { TAlertLinkType, TEmail, TEmailContent } from '../../types/emailTypes';
import { getCompany } from '../companies/get';
import { getJobWithApplicants } from '../jobs/get';
import { getUserGeneralInfo } from '../users/get';

export const LinkTypeTranslations: Record<
  TAlertLinkType,
  { is: string; en: string }
> = {
  job: { is: 'Skoða starf', en: 'View job' },
  account: { is: 'Mitt svæði', en: 'My page' },
  settings: { is: 'Stillingar', en: 'Settings' },
  jobs: { is: 'Sjá verkefni í boði', en: 'See available jobs' },
  jobApplicants: { is: 'Skoða umsækjendur', en: 'View applicants' },
  jobSignature: { is: 'Undirrita', en: 'Sign' },
  freelancerSignature: { is: 'Undirrita', en: 'Sign' },
};

// Converts link type to link and label
export function convertLinkTypeToLink(
  lang: 'is' | 'en',
  jobID?: string,
  linkType?: TAlertLinkType
): { label: string; link: string } {
  if (linkType === 'job') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/jobs/${jobID}`,
    };
  }

  if (linkType === 'account') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/account`,
    };
  }

  if (linkType === 'settings') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/settings`,
    };
  }

  if (linkType === 'jobs') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/jobs`,
    };
  }

  if (linkType === 'jobSignature') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/jobs/${jobID}/signature`,
    };
  }

  if (linkType === 'freelancerSignature') {
    return {
      label: LinkTypeTranslations[linkType][lang],
      link: `https://hoobla.is/account/freelancers/signature`,
    };
  }

  return {
    label: lang === 'is' ? 'Sjá meira' : 'View more',
    link: `https://hoobla.is/account`,
  };
}

export async function convertDynamicDataToText(
  paragraphs: string[],
  data?: {
    userName?: string;
    companyName?: string;
    jobName?: string;
  }
) {
  const modifiedParagraphs = await Promise.all(
    paragraphs.map(async paragraph => {
      let modifiedText = paragraph;

      // Match all dynamic data patterns {property}
      const matches = paragraph.match(/\{([^}]+)\}/g);

      if (matches) {
        for (const match of matches) {
          const property = match.slice(1, -1); // Remove { and }
          let replacement = '';

          switch (property) {
            case 'userName':
              replacement = data?.userName || '';
              break;
            case 'companyName':
              replacement = data?.companyName || '';
              break;
            case 'jobName':
              replacement = data?.jobName || '';
              break;
            // Add more cases as needed
          }

          modifiedText = modifiedText.replace(match, replacement);
        }
      }

      return modifiedText;
    })
  );

  return modifiedParagraphs;
}

export async function getUsername(id: string) {
  const user = await getUserGeneralInfo(id);
  return user?.name;
}

export async function getCompanyName(id: string) {
  const company = await getCompany(id);
  return company?.name;
}

export async function getJobName(id: string) {
  const job = await getJobWithApplicants(id);
  return job?.name;
}

export async function getFreelancerName(jobId: string, freelancerId: string) {
  const job = await getJobWithApplicants(jobId);
  const freelancer = job.applicants.find(
    applicant => applicant.id === freelancerId
  );
  return freelancer?.general.name;
}

export const getEmailWithDynamicData = async (
  email: TEmail,
  lang: 'is' | 'en',
  data: {
    userName?: string;
    companyName?: string;
    jobName?: string;
    jobID?: string;
  }
): Promise<{
  title: string;
  paragraphs: string[];
  primaryButton: { label: string; link: string };
}> => {
  const emailContent = email.content[lang];

  const updatedEmailContent = {
    title: emailContent.title,
    paragraphs: await convertDynamicDataToText(emailContent.paragraphs, data),
    primaryButton: convertLinkTypeToLink(
      lang,
      data.jobID,
      emailContent.primaryButton?.linkType
    ), // Defaults to see more that links to account page
  };

  return updatedEmailContent;
};
