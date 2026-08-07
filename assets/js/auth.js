// ======================================
// Login JS - Admin & Teacher Login
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const empCode = document.getElementById("employeeCode").value.trim();
        const password = document.getElementById("password").value.trim();

        try {

            // ==========================
            // Default Admin Login
            // ==========================

            if (empCode === "admin" && password === "admin123") {

                localStorage.setItem("loggedInEmpCode", "admin");
                localStorage.setItem("userRole", "admin");

                window.location.href = "dashboard.html";
                return;
            }

            // ==========================
            // Firestore Employee Login
            // ==========================

            const docRef = doc(db, "employees", empCode);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                alert("Employee Code not found!");
                return;
            }

            const user = docSnap.data();

            if (String(user.password) !== password) {
                alert("Incorrect Password!");
                return;
            }

            if (user.status === "Pending") {
                alert("Your account is waiting for Admin Approval.");
                return;
            }

            localStorage.setItem("loggedInEmpCode", empCode);
            localStorage.setItem("userRole", user.role || "teacher");

            if (user.role === "admin") {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "daily-entry.html";
            }

        } catch (err) {

            console.error(err);
            alert(err.message);

        }

    });

}
