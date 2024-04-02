import { Timestamp } from "firebase/firestore";
import { TInvite, TInviteWrite } from "./companyTypes";

export type TAdminBase = {
  name: string;
  email: string;
  isAdmin: boolean;
  inviter: string;
};

export type TAdminRead = TAdminBase & {
  uid: string;
  invites: TInvite[];
  createdAt: Date;
};

export type TAdmin = TAdminRead;

export type TAdminWrite = TAdminBase & {
  invites: TInviteWrite[];
  createdAt: Timestamp;
};
