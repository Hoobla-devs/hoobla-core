import { QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import { TJobTitle, TSkill, TLanguage } from "../types/tagTypes";

export const jobTitleConverter = {
  toFirestore(jobTitle: TJobTitle): TJobTitle {
    return jobTitle;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TJobTitle>,
    options: SnapshotOptions
  ): TJobTitle {
    const snapData = snapshot.data(options);
    return snapData;
  },
};

export const skillConverter = {
  toFirestore(skill: TSkill): TSkill {
    return skill;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TSkill>,
    options: SnapshotOptions
  ): TSkill {
    const snapData = snapshot.data(options);
    return snapData;
  },
};

export const languageConverter = {
  toFirestore(language: TLanguage): TLanguage {
    return language;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TLanguage>,
    options: SnapshotOptions
  ): TLanguage {
    const snapData = snapshot.data(options);
    return snapData;
  },
};
