// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-w39Ll4vNuTKL8FH5qbUzNkZdNKlsEjE",
  authDomain: "swe-fin-proj-spr24-311.firebaseapp.com",
  projectId: "swe-fin-proj-spr24-311",
  storageBucket: "swe-fin-proj-spr24-311.appspot.com",
  messagingSenderId: "286640725822",
  appId: "1:286640725822:web:353a50eb6191053440d66f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;