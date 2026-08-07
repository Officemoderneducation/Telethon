// ======================================
// Firebase Configuration
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCj3BBjywNWl4ScDJUyrmslg4bHrlMiu_Q",
    authDomain: "telethoon.firebaseapp.com",
    projectId: "telethoon",
    storageBucket: "telethoon.firebasestorage.app",
    messagingSenderId: "853450341855",
    appId: "1:853450341855:web:356f9ec0e9a6f88c75d86a",
    measurementId: "G-EWP905EGQ1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
