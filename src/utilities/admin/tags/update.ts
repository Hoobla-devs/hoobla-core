import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/init";
import { TJobTitle, TLanguage, TSkill } from "../../../types/tagTypes";

export const updateRelations = async (
  skills: TSkill[],
  jobTitles: TJobTitle[],
  languages: TLanguage[] | null = null
) => {
  // Skills related skills
  skills.forEach((skill) => {
    // for each skill that is not this skill
    // if the skill is in the skill.relatedSkills array add 1 to the score
    if (!skill.relatedSkills) skill.relatedSkills = [];
    const relatedSkills = skill.relatedSkills;

    skills.forEach((s) => {
      if (s.id !== skill.id) {
        // search for tag in relatedSkills if it is there add 1 to score else add it with score 1 to the list
        const skillIndex = relatedSkills.findIndex((r) => r.id === s.id);
        if (skillIndex > -1) {
          // if skill is in relatedSkills array
          relatedSkills[skillIndex].score += 1;
        } else {
          // if skill is not in relatedSkills array
          relatedSkills.push({ id: s.id, score: 1 });
        }
      }
    });
  });

  // jobTitles related jobTitles
  jobTitles.forEach((jobTitle) => {
    if (!jobTitle.relatedJobs) jobTitle.relatedJobs = [];
    const relatedJobs = jobTitle.relatedJobs;
    jobTitles.forEach((j) => {
      if (j.id !== jobTitle.id) {
        const jobIndex = relatedJobs.findIndex((r) => r.id === j.id);
        if (jobIndex > -1) {
          relatedJobs[jobIndex].score += 1;
        } else {
          relatedJobs.push({ id: j.id, score: 1 });
        }
      }
    });
  });

  // jobTitles related skills
  jobTitles.forEach((jobTitle) => {
    if (!jobTitle.relatedSkills) jobTitle.relatedSkills = [];
    const relatedSkills = jobTitle.relatedSkills;
    skills.forEach((s) => {
      const skillIndex = relatedSkills.findIndex((r) => r.id === s.id);
      if (skillIndex > -1) {
        relatedSkills[skillIndex].score += 1;
      } else {
        relatedSkills.push({ id: s.id, score: 1 });
      }
    });
  });

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    // sort related skills by score
    skill.relatedSkills = skill.relatedSkills.sort((a, b) => b.score - a.score);

    updateDoc(doc(db, "skills", skill.id), {
      id: skill.id,
      en: skill.en,
      is: skill.is,
      relatedSkills: skill.relatedSkills,
    }).catch((error) => {
      console.log(error);
    });
  }

  for (let i = 0; i < jobTitles.length; i++) {
    const jobTitle = jobTitles[i];
    jobTitle.relatedJobs = jobTitle.relatedJobs.sort(
      (a, b) => b.score - a.score
    );
    jobTitle.relatedSkills = jobTitle.relatedSkills.sort(
      (a, b) => b.score - a.score
    );

    updateDoc(doc(db, "jobTitles", jobTitle.id), {
      id: jobTitle.id,
      en: jobTitle.en,
      is: jobTitle.is,
      relatedJobs: jobTitle.relatedJobs,
      relatedSkills: jobTitle.relatedSkills,
    }).catch((error) => {
      console.log(error);
    });
  }

  if (languages) {
    // languages related languages
    languages.forEach((language) => {
      // if language has no related languages create an empty array
      if (!language.relatedLanguages) language.relatedLanguages = [];
      const relatedLanguages = language.relatedLanguages;
      languages.forEach((l) => {
        if (l.id !== language.id) {
          const languageIndex = relatedLanguages.findIndex(
            (r) => r.id === l.id
          );
          if (languageIndex > -1) {
            relatedLanguages[languageIndex].score += 1;
          } else {
            relatedLanguages.push({ id: l.id, score: 1 });
          }
        }
      });
    });

    for (let i = 0; i < languages.length; i++) {
      const language = languages[i];
      language.relatedLanguages = language.relatedLanguages.sort(
        (a, b) => b.score - a.score
      );
      updateDoc(doc(db, "languages", language.id), {
        id: language.id,
        en: language.en,
        is: language.is,
        relatedLanguages: language.relatedLanguages,
      }).catch((error) => {
        console.log(error);
      });
    }
  }
};
