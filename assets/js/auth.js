// ======================================
// Telethon - Admin & Teacher Login
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

        const employeeCodeEl = document.getElementById("employeeCode");
        const passwordEl = document.getElementById("password");

        if (!employeeCodeEl || !passwordEl) {
            alert("Login fields not found!");
            return;
        }

        const loginId = employeeCodeEl.value.trim();
        const password = passwordEl.value.trim();

        // ======================================
        // ADMIN LOGIN
        // ======================================

        if (
            loginId.toLowerCase() === "office.moderneducation@gmail.com" &&
            password === "admin123"
        ) {

            localStorage.setItem(
                "loggedInEmpCode",
                "admin"
            );

            localStorage.setItem(
                "userRole",
                "admin"
            );

            window.location.href = "dashboard.html";

            return;
        }


        // ======================================
        // TEACHER LOGIN
        // ======================================

        try {

            const employeeRef = doc(
                db,
                "employees",
                loginId
            );

            const employeeSnap = await getDoc(employeeRef);

            if (!employeeSnap.exists()) {

                alert("Employee Code not found!");
                return;
            }

            const data = employeeSnap.data();

            // Password check
            if (
                String(data.password).trim() !== password
            ) {

                alert("Wrong Password!");
                return;
            }

            // Pending account
            if (data.status === "Pending") {

                alert(
                    "Aapka account Admin Approval ke liye pending hai!"
                );

                return;
            }

            // Teacher Login
            localStorage.setItem(
                "loggedInEmpCode",
                loginId
            );

            localStorage.setItem(
                "userRole",
                "teacher"
            );

            window.location.href = "daily-entry.html";

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            alert(
                "Login Error: " +
                error.message
            );
        }

    });

}
