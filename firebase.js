// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANnDxikLdbDLygzVgOle_AYY3PLzmPgA8",
  authDomain: "bt-iot-7af8a.firebaseapp.com",
  databaseURL: "https://bt-iot-7af8a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bt-iot-7af8a",
  storageBucket: "bt-iot-7af8a.appspot.com",
  messagingSenderId: "121771695080",
  appId: "1:121771695080:web:f846c6d46def80cd00225d",
  measurementId: "G-0MHC1VME9H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, set };
