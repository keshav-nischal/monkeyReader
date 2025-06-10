// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYsUjPU0XVRJvGjhiZNQpKzp2dhvPYW6E",
  authDomain: "monkey-read.firebaseapp.com",
  projectId: "monkey-read",
  storageBucket: "monkey-read.firebasestorage.app",
  messagingSenderId: "1038424716127",
  appId: "1:1038424716127:web:dba24f187d7ec2a8923cea",
  measurementId: "G-6W7ZNGJB3X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const analytics = getAnalytics(app);