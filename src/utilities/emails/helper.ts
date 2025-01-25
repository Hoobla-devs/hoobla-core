import { DynamicDataEmailOption } from '../../types/emailTypes';
import { TJob } from '../../types/jobTypes';
import { TUser } from '../../types/userTypes';
import { getCompany } from '../companies/get';
import { getJob, getJobWithApplicants } from '../jobs/get';
import { getFreelancer, getUserGeneralInfo } from '../users/get';

export async function convertDynamicDataToText(
  paragraphs: string[],
  job?: TJob,
  user?: TUser
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
              replacement = 'Test user name';
              break;
            case 'companyName':
              replacement = 'Test company name';
              break;
            case 'jobName':
              replacement = 'Test job name';
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
