import {
  collection,
  DocumentReference,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { languageConverter } from "../../converters/tags";
import { db } from "../../firebase/init";
import { TLanguage } from "../../types/tagTypes";

async function _getLanguageFromRef(languageRef: DocumentReference<TLanguage>) {
  const languageSnap = await getDoc(
    languageRef.withConverter(languageConverter)
  );
  if (!languageSnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const languageData = languageSnap.data();
  return languageData;
}

export async function getLanguage(languageRef: DocumentReference<TLanguage>) {
  const language = await _getLanguageFromRef(languageRef);
  return language;
}

export async function getLanguages(): Promise<TLanguage[]> {
  const querySnapshot = await getDocs(query(collection(db, "languages")));

  const languagesPromise = querySnapshot.docs.map(async (doc) => {
    const language = await _getLanguageFromRef(
      doc.ref as DocumentReference<TLanguage>
    );

    return language;
  });

  return Promise.all(languagesPromise);
}
