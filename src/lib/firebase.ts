// /home/user/opengen/src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDSkxCvcizgn6k6bLSCaSFbhnx8u-98xu4", // Ganti dengan kunci API Anda
  authDomain: "opengen-9dec8.firebaseapp.com", // Ganti dengan domain auth Anda
  projectId: "opengen-9dec8", // Ganti dengan ID proyek Anda
  storageBucket: "opengen-9dec8.firebasestorage.app", // Ganti dengan storage bucket Anda
  messagingSenderId: "772581486247", // Ganti dengan sender ID Anda
  appId: "1:772581486247:web:f8abb26149405c565a7582", // Ganti dengan App ID Anda
  measurementId: "G-HR6ZLVW3HR"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

export { auth, app };
