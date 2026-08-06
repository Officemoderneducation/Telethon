// ======================================
// Daily Entry JS - Firebase Firestore
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


let currentEmployeeData = null;

// 1. Set Today Date
const dateInput = document.getElementById("entryDate");
if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}


// 2. Check Login & Fetch Employee Profile
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {
        // Fetch Employee data from Firestore "employees" collection using user.uid
        const empDocRef = doc(db, "employees", user.uid);
        const empDocSnap = await getDoc(empDocRef);

        if (empDocSnap.exists()) {
            currentEmployeeData = empDocSnap.data();

            // Display Info on Screen
            document.getElementById("userInfo").textContent = currentEmployeeData.teacherName || "Teacher";
            document.getElementById("badgeTeacher").textContent = "Teacher: " + (currentEmployeeData.teacherName || "-");
            document.getElementById("badgeMadina").textContent = "Jamiatul Madina: " + (currentEmployeeData.jamiatulMadina || "-");
            document.getElementById("badgeLocation").textContent = `Location: ${currentEmployeeData.city || "-"}, ${currentEmployeeData.state || "-"}`;
            
            document.getElementById("employeeBadge").style.display = "block";
        } else {
            console.warn("Employee profile record not found in Firestore.");
            document.getElementById("userInfo").textContent = user.email || "Employee";
        }
    } catch (err) {
        console.error("Error fetching employee profile:", err);
    }
});


// 3. Submit Daily Entry
const entryForm = document.getElementById("dailyEntryForm");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

if (entryForm) {
    entryForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        messageEl.textContent = "";

        const dateVal = document.getElementById("entryDate").value;
        const amountVal = Number(document.getElementById("amount").value);

        try {
            // Prepare complete entry with profile details
            const entryData = {
                date: dateVal,
                amount: amountVal,
                status: "Success",
                createdAt: serverTimestamp(),
                submittedByUid: auth.currentUser ? auth.currentUser.uid : "",
                
                // Auto attached from Employee Profile
                teacherName: currentEmployeeData?.teacherName || "Unknown Teacher",
                empCode: currentEmployeeData?.empCode || "",
                region: currentEmployeeData?.region || "-",
                state: currentEmployeeData?.state || "-",
                city: currentEmployeeData?.city || "-",
                jamiatulMadina: currentEmployeeData?.jamiatulMadina || "-"
            };

            // Save to daily_entry collection
            await addDoc(collection(db, "daily_entry"), entryData);

            messageEl.style.color = "green";
            messageEl.textContent = "Entry Submitted Successfully!";

            // Reset Amount field
            document.getElementById("amount").value = "";

        } catch (error) {
            console.error("Error submitting entry:", error);
            messageEl.style.color = "red";
            messageEl.textContent = "Failed to submit. Try again.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Collection";
        }
    });
}


// 4. Logout
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
