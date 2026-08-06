// ======================================
// Daily Entry JS - Auto Fetch Profile & Submit
// ======================================
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

let currentEmployeeData = null;

// Get Logged In Emp Code from LocalStorage
const empCode = localStorage.getItem("loggedInEmpCode");

if (!empCode) {
    window.location.href = "index.html";
} else {
    loadTeacherProfile(empCode);
}

// 1. Set Today's Date
const dateInput = document.getElementById("entryDate");
if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// 2. Fetch Profile from Firestore
async function loadTeacherProfile(empCode) {
    try {
        const empDocRef = doc(db, "employees", empCode);
        const empDocSnap = await getDoc(empDocRef);

        if (empDocSnap.exists()) {
            currentEmployeeData = empDocSnap.data();

            // Render Header & Profile Badge
            const userInfo = document.getElementById("userInfo");
            if (userInfo) userInfo.textContent = currentEmployeeData.teacherName || "Teacher";

            const badgeTeacher = document.getElementById("badgeTeacher");
            if (badgeTeacher) badgeTeacher.textContent = "Teacher: " + (currentEmployeeData.teacherName || "-");

            const badgeMadina = document.getElementById("badgeMadina");
            if (badgeMadina) badgeMadina.textContent = "Jamiatul Madina: " + (currentEmployeeData.jamiatulMadina || "-");

            const badgeLocation = document.getElementById("badgeLocation");
            if (badgeLocation) badgeLocation.textContent = `Location: ${currentEmployeeData.city || "-"}, ${currentEmployeeData.state || "-"}`;

            const badge = document.getElementById("employeeBadge");
            if (badge) badge.style.display = "block";
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err);
    }
}

// 3. Form Submit Action
const entryForm = document.getElementById("dailyEntryForm");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

if (entryForm) {
    entryForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        if (messageEl) messageEl.textContent = "";

        const dateVal = document.getElementById("entryDate").value;
        const amountVal = Number(document.getElementById("amount").value);

        try {
            await addDoc(collection(db, "daily_entry"), {
                date: dateVal,
                amount: amountVal,
                status: "Success",
                createdAt: serverTimestamp(),
                empCode: empCode,
                teacherName: currentEmployeeData?.teacherName || "",
                region: currentEmployeeData?.region || "",
                state: currentEmployeeData?.state || "",
                city: currentEmployeeData?.city || "",
                jamiatulMadina: currentEmployeeData?.jamiatulMadina || ""
            });

            if (messageEl) {
                messageEl.style.color = "green";
                messageEl.textContent = "Collection Entry Submitted Successfully!";
            }
            document.getElementById("amount").value = "";

        } catch (error) {
            console.error("Entry Error:", error);
            if (messageEl) {
                messageEl.style.color = "red";
                messageEl.textContent = "Submission Failed. Try again.";
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Collection";
        }
    });
}

// 4. Logout Action
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInEmpCode");
        window.location.href = "index.html";
    });
}
