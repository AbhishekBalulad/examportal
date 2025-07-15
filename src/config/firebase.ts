
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from "firebase/functions"

// Firebase configuration - replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyAq6lw2IIMotOyTIJpkyJoA30EwcE4E9BQ",
  authDomain: "examportal-d49232.firebaseapp.com",
  databaseURL: "https://examportal-d49232-default-rtdb.firebaseio.com/",
  projectId: "examportal-d49232",
  storageBucket: "examportal-d49232.firebasestorage.app",
  messagingSenderId: "841571183454",
  appId: "1:841571183454:web:55b92c027403c926193dcf",
  measurementId: "G-RTKR147JGM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app); 