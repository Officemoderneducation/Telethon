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


        const employeeCodeEl =
            document.getElementById("employeeCode");

        const passwordEl =
            document.getElementById("password");

        const errorMsg =
            document.getElementById("errorMsg");


        const loginId =
            employeeCodeEl.value.trim();

        const password =
            passwordEl.value.trim();


        if (errorMsg) {
            errorMsg.textContent = "Checking login...";
        }


        // ======================================
        // ADMIN LOGIN
        // ======================================

        if (
            loginId.toLowerCase() ===
            "office.moderneducation@gmail.com"
            &&
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


            window.location.href =
                "dashboard.html";

            return;
        }


        // ======================================
        // TEACHER LOGIN
        // ======================================

        try {

            const employeeRef =
                doc(
                    db,
                    "employees",
                    loginId
                );


            const employeeSnap =
                await getDoc(employeeRef);


            if (!employeeSnap.exists()) {

                if (errorMsg) {

                    errorMsg.textContent =
                        "Employee Code not found!";
                }

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

                if (errorMsg) {

                    errorMsg.textContent =
                        "Wrong Password!";
                }

                return;
            }


            // ======================================
            // Pending Account
            // ======================================

            if (
                data.status === "Pending"
            ) {

                if (errorMsg) {

                    errorMsg.textContent =
                        "Aapka account Admin Approval ke liye pending hai!";
                }

                return;
            }


            // ======================================
            // Teacher Login Successful
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

        }


        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            if (errorMsg) {

                errorMsg.textContent =
                    "Login Error: " +
                    error.message;
            }

        }

    });

}
