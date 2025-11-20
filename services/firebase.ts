import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBRo2obm7A4Bd4lwReB165IzeMCOmdxfrQ",
  authDomain: "firstfly-ea93b.firebaseapp.com",
  projectId: "firstfly-ea93b",
  storageBucket: "firstfly-ea93b.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "1:994056761685:web:ca979db9fd4b4b6febbfdc",
  measurementId: "G-5JRFM7YLD3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
