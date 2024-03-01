import { TJobStatus } from "./jobTypes";

export type TGender = "male" | "female" | "other";

export type TExperience = {
  title: string;
  company: string;
  description: string;
  from: string;
  to: string;
};

export type TEducation = {
  school: string;
  degree: string;
  description: string;
  from: string;
  to: string;
};

export type TNotificationRead = {
  id: string;
  title: string;
  description: string;
  date: Date;
  status?: TJobStatus;
  type: "job" | "freelancer" | "company";
  checked: boolean;
};
