import { Timestamp } from "firebase/firestore";
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

export type TNotificationBase = {
  title: string;
  description: string;
  status?: TJobStatus;
  type: "job" | "freelancer" | "company";
  checked: boolean;
};

export type TNotificationRead = TNotificationBase & {
  id: string;
  date: Date;
};

export type TNotification = TNotificationRead;

export type TNotificationWrite = TNotificationBase & {
  date: Timestamp;
};
