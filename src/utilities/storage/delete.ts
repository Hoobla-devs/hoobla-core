import { deleteObject, ref } from "firebase/storage";
import { storage } from "../../firebase/init";

export const deletePhoto = async (url: string) => {
  let photoRef = ref(storage, url);
  return await deleteObject(photoRef)
    .then(() => true)
    .catch(() => false);
};
