// ======================================
// Daily Entry JS - Firebase Firestore
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// 1. Set Default Date to Today (YYYY-MM-DD)
const dateInput = document.getElementById("entryDate");
if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}


// 2. Check Auth Status (Protected Page)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Agar employee logged in nahi hai toh login page par bhejo
        window.location.href = "index.html";
    }
});


// 3. Handle Form Submission
const entryForm = document.getElementById("dailyEntryForm");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

if (entryForm) {
    entryForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Loading state
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        messageEl.textContent = "";

        // Form Inputs Values
        const dateVal = document.getElementById("entryDate").value;
        const teacherNameVal = document.getElementById("teacherName").value;
        const regionVal = document.getElementById("region").value;
        const amountVal = Number(document.getElementById("amount").value);
        const statusVal = document.getElementById("status").value;

        try {
            // Save data to Firestore "daily_entry" collection
            await addDoc(collection(db, "daily_entry"), {
                date: dateVal,
                teacherName: teacherNameVal,
                region: regionVal,
                amount: amountVal,
                status: statusVal,
                createdAt: serverTimestamp(),
                submittedBy: auth.currentUser ? auth.currentUser.uid : "unknown"
            });

            // Success Message
            messageEl.style.color = "green";
            messageEl.textContent = "Data Submitted Successfully!";

            // Reset form fields (except date)
            document.getElementById("teacherName").value = "";
            document.getElementById("region").value = "";
            document.getElementById("amount").value = "";

        } catch (error) {
            console.error("Error adding entry: ", error);
            messageEl.style.color = "red";
            messageEl.textContent = "Failed to submit data. Try again.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Entry";
        }
    });
}


// 4. Logout Functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}
