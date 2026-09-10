import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth: Auth | any = null;
let googleProvider: GoogleAuthProvider | any = null;

if (firebaseConfig.apiKey) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    hd: "vitstudent.ac.in",
    prompt: "select_account",
  });
} else {
  console.warn("Firebase config is missing. Please add it to .env.local");
}

export { app, auth, googleProvider };
