import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../firebase/init";

export async function getDownloadUrlFromStorage(path: string) {
  const fileRef = ref(storage, path);

  return getDownloadURL(fileRef)
    .then((url) => {
      return url;
    })
    .catch((error) => {
      console.log(error);
      return "";
    });
}
