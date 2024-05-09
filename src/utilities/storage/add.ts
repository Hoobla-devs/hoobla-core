import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadString,
  UploadMetadata,
} from "firebase/storage";
import { storage } from "../../firebase/init";

const _createBase64FromBlob = async (blob: Blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

export async function uploadPhoto(file: File, path: string) {
  // Create a reference to 'uid'
  const photoRef = ref(storage, path);

  await uploadBytes(photoRef, file).then((snapshot) => {
    console.log("Uploaded a blob or file!");
  });

  return getDownloadURL(photoRef).then((url) => {
    return url;
  });
}

export async function uploadBase64(base64: string, path: string) {
  // Create a reference to 'uid'
  const base64Ref = ref(storage, path);

  await uploadString(base64Ref, base64, "data_url").then((snapshot) => {
    console.log("Uploaded a blob or file!");
  });

  return getDownloadURL(base64Ref)
    .then((url) => {
      return url;
    })
    .catch((err) => null);
}

export async function uploadFile(
  file: File,
  path: string,
  metaData?: UploadMetadata
) {
  // Create a reference to 'uid'
  const photoRef = ref(storage, path);

  await uploadBytes(photoRef, file, metaData)
    .then(() => {
      console.log("Uploaded file!");
    })
    .catch((error) => {
      console.log("Upload failed!", error);
      throw new Error("Upload failed!");
    });

  return getDownloadURL(photoRef)
    .then((url) => {
      return url;
    })
    .catch((error) => {
      console.log("Download URL failed!");
      return null;
    });
}

export const storeSignetContract = async (documentId: string, path: string) => {
  // 1. Fetch the contract document using our API
  const res = await fetch(
    process.env.NEXT_PUBLIC_HOOBLA_API_URL + "download/" + documentId,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    return null;
  }
  // 2. Create base64 string from the response
  const blob = await res.blob();
  const base64String = (await _createBase64FromBlob(blob)) as string;

  // 3. Upload the base64 representation of the contract to Firebase Storage and return download URL
  return await uploadBase64(base64String, path);
};
