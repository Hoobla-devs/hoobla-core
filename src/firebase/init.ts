import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export let app: any;
export let db: any;
export let auth: any;
export let storage: any;

// Only initialize if no Firebase apps exist
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    const env = process.env.NODE_ENV;
    if (env === 'development') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 4001);
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  // If Firebase is already initialized, get existing instances
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}
