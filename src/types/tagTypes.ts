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

export type TSkill = {
  id: string;
  is: string;
  en: string;
  relatedSkills: {
    id: string;
    score: number;
  }[];
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
