import {
  collection,
  DocumentReference,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { skillConverter } from "../../converters/tags";
import { db } from "../../firebase/init";
import { TSkill } from "../../types/tagTypes";

async function _getSkillFromRef(skillRef: DocumentReference<TSkill>) {
  const skillSnap = await getDoc(skillRef.withConverter(skillConverter));
  if (!skillSnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const skillData = skillSnap.data();
  return skillData;
}

export async function getSkill(skillRef: DocumentReference<TSkill>) {
  const skill = await _getSkillFromRef(skillRef);
  return skill;
}

export async function getSkills(): Promise<TSkill[]> {
  const querySnapshot = await getDocs(query(collection(db, "skills")));

  const skillsPromise = querySnapshot.docs.map(async (doc) => {
    const skill = await _getSkillFromRef(doc.ref as DocumentReference<TSkill>);

    return skill;
  });

  return Promise.all(skillsPromise);
}
