export type DynamicDataEmailOption =
  | 'userName'
  | 'companyName'
  | 'jobName'
  | 'creatorName'
  | 'freelancerName';

export type TAlertLinkType =
  | 'job'
  | 'account'
  | 'settings'
  | 'jobs'
  | 'jobSignature'
  | 'jobApplicants'
  | 'freelancerSignature';

export type TEmailContent = {
  title: string;
  paragraphs: string[];
  primaryButton: {
    label: string;
    linkType: TAlertLinkType;
  } | null;
  secondaryButton?: {
    label: string;
    linkType: TAlertLinkType;
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
  | 'signatureReminder'
  | 'applicantsSelectedReminder';

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

export type AlertDeliveryResult = {
  type: 'email' | 'sms';
  success: boolean;
  recipient: string;
  error?: string;
};

export type AlertBatchResult = {
  totalCount: number;
  successCount: number;
  failureCount: number;
  results: AlertDeliveryResult[];
};

export type AlertType = 'chooseFreelancers' | 'jobCancelled' | 'jobPostponed';
