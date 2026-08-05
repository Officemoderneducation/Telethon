// Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
  authDomain: "telethoon.firebaseapp.com",
  projectId: "telethoon",
  storageBucket: "telethoon.firebasestorage.app",
  messagingSenderId: "853450341855",
  appId: "1:853450341855:web:2afb0a5f4df7deee75d86a",
  measurementId: "G-98DJPZZX5F"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
