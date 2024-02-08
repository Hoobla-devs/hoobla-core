export type TSkill = {
  objectID?: string;
  id: string;
  is: string;
  en: string;
  score?: number;
  relatedSkills: {
    id: string;
    score: number;
  }[];
};

export type TJobTitle = {
  objectID?: string;
  id: string;
  is: string;
  en: string;
  score?: number;
  relatedJobs: {
    id: string;
    score: number;
  }[];
  relatedSkills: {
    id: string;
    score: number;
  }[];
};

export type TLanguage = {
  objectID?: string;
  id: string;
  is: string;
  en: string;
  score?: number;
  relatedLanguages: {
    id: string;
    score: number;
  }[];
};

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
