// ======================================
// Auth JS - Admin & Teacher Login
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const empCodeEl = document.getElementById("employeeCode");
        const passwordEl = document.getElementById("password");

        if (!empCodeEl || !passwordEl) {
            alert("Login fields not found!");
            return;
        }

        const empCode = empCodeEl.value.trim();
        const password = passwordEl.value.trim();

        // ======================================
        // 1. ADMIN LOGIN
        // ======================================

        if (empCode === "admin" && password === "admin123") {

            localStorage.setItem("loggedInEmpCode", "admin");
            localStorage.setItem("userRole", "admin");

            window.location.href = "dashboard.html";

            return;
        }

        // ======================================
        // 2. TEACHER LOGIN
        // ======================================

        try {

            const employeeRef = doc(db, "employees", empCode);
            const employeeSnap = await getDoc(employeeRef);

            if (!employeeSnap.exists()) {

                alert("Employee Code not found!");
                return;
            }

            const data = employeeSnap.data();

            // Password check
            if (String(data.password).trim() !== password) {

                alert("Wrong Password!");
                return;
            }

            // Pending account
            if (data.status === "Pending") {

                alert("Aapka account Admin Approval ke liye pending hai!");
                return;
            }

            // Approved teacher
            localStorage.setItem("loggedInEmpCode", empCode);
            localStorage.setItem("userRole", "teacher");

            window.location.href = "daily-entry.html";

        } catch (error) {

            console.error("Login Error:", error);

            alert("Login Error: " + error.message);
        }

    });

}
