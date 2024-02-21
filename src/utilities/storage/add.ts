import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/init";

export async function uploadPhoto(file: File, name: string) {
  // Create a reference to 'uid'
  const photoRef = ref(storage, name);

  await uploadBytes(photoRef, file).then((snapshot) => {
    console.log("Uploaded a blob or file!");
  });

  return getDownloadURL(photoRef).then((url) => {
    return url;
  });
}
