import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/init";
import { TJobTitle, TLanguage, TSkill } from "../../../types/tagTypes";

export async function addTagToDB(
  tag: TJobTitle | TSkill | TLanguage,
  type: "jobTitles" | "skills" | "languages"
) {
  const tagRef = doc(db, type, tag.id);

  return await setDoc(tagRef, tag)
    .then(() => true)
    .catch(() => false);
}
