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

        const loginInput =
            document.getElementById("employeeCode");

        const passwordInput =
            document.getElementById("password");

        const errorMsg =
            document.getElementById("errorMsg");

        const loginId =
            loginInput.value.trim();

        const password =
            passwordInput.value.trim();


        // ======================================
        // MESSAGE FUNCTION
        // ======================================

        function showMessage(message) {

            if (errorMsg) {
                errorMsg.textContent = message;
            } else {
                alert(message);
            }

        }


        // ======================================
        // ADMIN LOGIN
        // ======================================

        if (
            loginId.toLowerCase() ===
            "office.moderneducation@gmail.com"
        ) {

            if (password === "123789") {

                localStorage.setItem(
                    "loggedInEmpCode",
                    "admin"
                );

                localStorage.setItem(
                    "userRole",
                    "admin"
                );

                window.location.href =
                    "dashboard.html";

                return;

            } else {

                showMessage(
                    "Admin Password Galat Hai!"
                );

                return;
            }
        }


        // ======================================
        // TEACHER LOGIN
        // ======================================

        showMessage(
            "Checking Employee Code..."
        );


        try {

            const employeeRef =
                doc(
                    db,
                    "employees",
                    loginId
                );

            const employeeSnap =
                await getDoc(employeeRef);


            // ======================================
            // Employee Not Found
            // ======================================

            if (!employeeSnap.exists()) {

                showMessage(
                    "Employee Code not found!"
                );

                return;
            }


            const data =
                employeeSnap.data();


            // ======================================
            // Password Check
            // ======================================

            if (
                String(data.password).trim()
                !== password
            ) {

                showMessage(
                    "Wrong Password!"
                );

                return;
            }


            // ======================================
            // Pending Account
            // ======================================

            if (
                data.status === "Pending"
            ) {

                showMessage(
                    "Aapka account Admin Approval ke liye pending hai!"
                );

                return;
            }


            // ======================================
            // TEACHER LOGIN SUCCESS
            // ======================================

            localStorage.setItem(
                "loggedInEmpCode",
                loginId
            );

            localStorage.setItem(
                "userRole",
                "teacher"
            );


            window.location.href =
                "daily-entry.html";


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            showMessage(
                "Login Error: " +
                error.message
            );

        }

    });

}
