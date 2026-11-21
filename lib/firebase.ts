import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAIWa7lrnmhmh0prZc4v584CTF_yBsO34",
  authDomain: "sri-amirthaa-id-core.firebaseapp.com",
  projectId: "sri-amirthaa-id-core",
  storageBucket: "sri-amirthaa-id-core.firebasestorage.app",
  messagingSenderId: "242648924674",
  appId: "1:242648924674:web:fbad2e2f393c92e7ff1d1b",
  measurementId: "G-N1PZCSZ5F0",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
