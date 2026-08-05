// assets/js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
  authDomain: "telethoon.firebaseapp.com",
  projectId: "telethoon",
  storageBucket: "telethoon.firebasestorage.app",
  messagingSenderId: "853450341855",
  appId: "1:853450341855:web:2afb0a5f4df7deee75d86a",
  measurementId: "G-98DJPZZX5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
