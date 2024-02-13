import {
  collection,
  DocumentReference,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { jobTitleConverter } from "../../converters/tags";
import { db } from "../../firebase/init";
import { TJobTitle } from "../../types/tagTypes";

async function _getJobTitleFromRef(jobTitleRef: DocumentReference<TJobTitle>) {
  const jobTitleSnap = await getDoc(
    jobTitleRef.withConverter(jobTitleConverter)
  );
  if (!jobTitleSnap.exists()) {
    throw new Error("Job does not exist.");
  }
  const jobTitleData = jobTitleSnap.data();
  return jobTitleData;
}

export async function getJobTitle(jobTitleRef: DocumentReference<TJobTitle>) {
  const jobTitle = await _getJobTitleFromRef(jobTitleRef);
  return jobTitle;
}

export async function getJobTitles(): Promise<TJobTitle[]> {
  const querySnapshot = await getDocs(query(collection(db, "jobTitles")));

  const jobTitlesPromise = querySnapshot.docs.map(async (doc) => {
    const jobTitle = await _getJobTitleFromRef(
      doc.ref as DocumentReference<TJobTitle>
    );

    return jobTitle;
  });

  return Promise.all(jobTitlesPromise);
}
