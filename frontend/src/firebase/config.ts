import { getAuth } from "firebase/auth"

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCd3jgyFgG1N2vOddLB3a65qT16OZJHi4g",
  authDomain: "monkey-read-8041f.firebaseapp.com",
  projectId: "monkey-read-8041f",
  storageBucket: "monkey-read-8041f.firebasestorage.app",
  messagingSenderId: "31983912065",
  appId: "1:31983912065:web:544744228a590e2ab53980",
  measurementId: "G-QMTFCZ498W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
