import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0SzavswEpxG3TnvCNDRTmEF6OnLrK5bM",
  authDomain: "companysocialplatform.firebaseapp.com",
  projectId: "companysocialplatform",
  storageBucket: "companysocialplatform.firebasestorage.app",
  messagingSenderId: "172631263586",
  appId: "1:172631263586:web:5e90cfc1a9a6e3ce5b443b",
  measurementId: "G-V0MDZZR8JJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);