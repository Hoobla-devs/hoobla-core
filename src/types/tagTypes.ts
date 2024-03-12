export type TJobTitle = {
  id: string;
  is: string;
  en: string;
  relatedJobs: {
    id: string;
    score: number;
  }[];
  relatedSkills: {
    id: string;
    score: number;
  }[];
};

export type TAlgoliaJobTitle = TJobTitle & {
  objectID: string;
};

export type TSkill = {
  id: string;
  is: string;
  en: string;
  relatedSkills: {
    id: string;
    score: number;
  }[];
};

export type TAlgoliaSkill = TSkill & {
  objectID: string;
};

export type TLanguage = {
  id: string;
  is: string;
  en: string;
  relatedLanguages: {
    id: string;
    score: number;
  }[];
};

export type TAlgoliaLanguage = TLanguage & {
  objectID: string;
};
