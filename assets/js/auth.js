// ======================================
// Telethon - Admin / Teacher / Region User Login
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
        // Message
        // ======================================

        function showMessage(message) {

            if (errorMsg) {
                errorMsg.textContent = message;
            } else {
                alert(message);
            }

        }


        // ======================================
        // Empty Validation
        // ======================================

        if (!loginId || !password) {

            showMessage(
                "Employee Code / User Code / Admin Email aur Password enter karein."
            );

            return;
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

                // Admin Dashboard
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
        // CHECK REGION USER
        // ======================================

        showMessage(
            "Checking User..."
        );


        try {

            const regionUserRef =
                doc(
                    db,
                    "region_users",
                    loginId
                );


            const regionUserSnap =
                await getDoc(
                    regionUserRef
                );


            // ======================================
            // REGION USER FOUND
            // ======================================

            if (regionUserSnap.exists()) {

                const data =
                    regionUserSnap.data();


                // ==================================
                // Password Check
                // ==================================

                if (
                    String(data.password || "").trim()
                    !== password
                ) {

                    showMessage(
                        "Wrong Password!"
                    );

                    return;
                }


                // ==================================
                // Status Check
                // ==================================

                if (
                    String(data.status || "").toLowerCase()
                    !== "active"
                ) {

                    showMessage(
                        "Aapka Region User Account Active nahi hai."
                    );

                    return;
                }


                // ==================================
                // REGION USER LOGIN SUCCESS
                // ==================================

                localStorage.setItem(
                    "loggedInEmpCode",
                    loginId
                );

                localStorage.setItem(
                    "userRole",
                    "regionUser"
                );


                // Region User Information
                localStorage.setItem(
                    "regionUserName",
                    data.userName || ""
                );


                localStorage.setItem(
                    "regionUserAccess",
                    JSON.stringify(
                        data.access || {}
                    )
                );


                // ==================================
                // REGION USER PANEL
                // ==================================

                window.location.href =
                    "region-user.html";

                return;
            }


            // ======================================
            // TEACHER LOGIN
            // ======================================

            showMessage(
                "Checking Employee Code..."
            );


            const employeeRef =
                doc(
                    db,
                    "employees",
                    loginId
                );


            const employeeSnap =
                await getDoc(
                    employeeRef
                );


            // ======================================
            // Employee Not Found
            // ======================================

            if (!employeeSnap.exists()) {

                showMessage(
                    "User / Employee Code not found!"
                );

                return;
            }


            const data =
                employeeSnap.data();


            // ======================================
            // Teacher Password Check
            // ======================================

            if (
                String(data.password || "").trim()
                !== password
            ) {

                showMessage(
                    "Wrong Password!"
                );

                return;
            }


            // ======================================
            // Teacher Approval Check
            // ======================================

            if (
                String(data.status || "").toLowerCase()
                !== "approved"
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


            // Teacher → Daily Collection
            window.location.href =
                "daily-entry.html";

        }

        catch (error) {

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
