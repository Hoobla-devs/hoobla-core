export type DynamicDataEmailOption =
  | 'userName'
  | 'companyName'
  | 'jobName'
  | 'creatorName'
  | 'freelancerName';

export type TEmailContent = {
  title: string;
  paragraphs: string[];
  primaryButton: {
    label: string;
    link: string;
  } | null;
  secondaryButton?: {
    label: string;
    link: string;
  } | null;
};

export type TEmailTemplate =
  | 'applicantsSelected'
  | 'emailReset'
  | 'freelancerApplicationAccepted'
  | 'freelancerApplicationDenied'
  | 'freelancerContractAdded'
  | 'giveReviewReminder'
  | 'jobDenied'
  | 'jobCancelled'
  | 'jobPostponed'
  | 'newJobAdded'
  | 'signatureReminder';

export type TEmail = {
  name: string;
  description: string;
  updatedAt: string;
  type: TEmailTemplate;
  content: {
    is: TEmailContent;
    en: TEmailContent;
  };
};
