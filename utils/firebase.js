// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import {getAuth} from "firebase/auth";  //this is users data getting system
import {getFirestore} from "firebase/firestore";  //this is for database 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

// Initialize Firebase
//with my project location to store data
const app = firebase.initializeApp(firebaseConfig);


// EXPORTING DATA TO USE IN ALL FILES
export const auth = getAuth(); //exporting userinfo to use throughout app
export const db = getFirestore(app); //database to export