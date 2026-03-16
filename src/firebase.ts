// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCIpRckde-TSKkOSOepD2fwuTAx8Msa_w",
  authDomain: "ratemyroommates-4dcb0.firebaseapp.com",
  projectId: "ratemyroommates-4dcb0",
  storageBucket: "ratemyroommates-4dcb0.firebasestorage.app",
  messagingSenderId: "921819748213",
  appId: "1:921819748213:web:90bccf122cf960de6e253c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db }