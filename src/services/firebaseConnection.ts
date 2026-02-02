import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBqBudcrupAFXcRaCUoWzJmsaQyp9TP8jI",
  authDomain: "tarefasplus-9f769.firebaseapp.com",
  projectId: "tarefasplus-9f769",
  storageBucket: "tarefasplus-9f769.firebasestorage.app",
  messagingSenderId: "175821404724",
  appId: "1:175821404724:web:0155d01777dfc5de25e861"
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp)

export { db };