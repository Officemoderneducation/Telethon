// ======================================
// Telethon
// Admin / Teacher / Region User Login
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// LOGIN FORM
// ======================================

const loginForm =
    document.getElementById("loginForm");


// ======================================
// LOGIN
// ======================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            // ==================================
            // HTML ELEMENTS
            // ==================================

            const loginInput =
                document.getElementById("employeeCode");

            const passwordInput =
                document.getElementById("password");

            const errorMsg =
                document.getElementById("errorMsg");


            // ==================================
            // VALUES
            // ==================================

            const loginId =
                String(
                    loginInput?.value || ""
                ).trim();

            const password =
                String(
                    passwordInput?.value || ""
                ).trim();


            // ==================================
            // MESSAGE FUNCTION
            // ==================================

            function showMessage(message) {

                if (errorMsg) {

                    errorMsg.textContent =
                        message;

                }

                else {

                    alert(message);

                }

            }


            // ==================================
            // CLEAR OLD MESSAGE
            // ==================================

            if (errorMsg) {

                errorMsg.textContent =
                    "";

            }


            // ==================================
            // EMPTY VALIDATION
            // ==================================

            if (
                !loginId ||
                !password
            ) {

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

                // ----------------------------------
                // ADMIN PASSWORD
                // ----------------------------------

                if (
                    password ===
                    "123789"
                ) {

                    // --------------------------------
                    // LOGIN INFORMATION
                    // --------------------------------

                    localStorage.setItem(
                        "loggedInEmpCode",
                        "admin"
                    );

                    localStorage.setItem(
                        "userRole",
                        "admin"
                    );

                    localStorage.setItem(
                        "userName",
                        "Administrator"
                    );


                    // --------------------------------
                    // ADMIN ACCESS
                    // --------------------------------

                    localStorage.removeItem(
                        "regionUserName"
                    );

                    localStorage.removeItem(
                        "regionUserAccess"
                    );


                    // --------------------------------
                    // ADMIN DASHBOARD
                    // --------------------------------

                    window.location.href =
                        "dashboard.html";

                    return;

                }


                // ----------------------------------
                // WRONG ADMIN PASSWORD
                // ----------------------------------

                showMessage(
                    "Admin Password Galat Hai!"
                );

                return;

            }


            // ======================================
            // CHECK REGION USER
            // ======================================

            showMessage(
                "Checking User..."
            );


            try {

                // ==================================
                // REGION USER DOCUMENT
                //
                // IMPORTANT:
                // Collection = regionUsers
                // Document ID = User Code
                // ==================================

                const regionUserRef =
                    doc(
                        db,
                        "regionUsers",
                        loginId
                    );


                const regionUserSnap =
                    await getDoc(
                        regionUserRef
                    );


                // ==================================
                // REGION USER FOUND
                // ==================================

                if (
                    regionUserSnap.exists()
                ) {

                    const regionUserData =
                        regionUserSnap.data();


                    console.log(
                        "Region User Found:",
                        regionUserData
                    );


                    // ==================================
                    // REGION USER PASSWORD
                    // ==================================

                    const savedPassword =
                        String(
                            regionUserData.password ||
                            ""
                        ).trim();


                    if (
                        savedPassword !==
                        password
                    ) {

                        showMessage(
                            "Wrong Password!"
                        );

                        return;

                    }


                    // ==================================
                    // REGION USER STATUS
                    // ==================================

                    const regionUserStatus =
                        String(
                            regionUserData.status ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        regionUserStatus !==
                        "active"
                    ) {

                        showMessage(
                            "Aapka Region User Account Active nahi hai."
                        );

                        return;

                    }


                    // ==================================
                    // REGION USER NAME
                    // ==================================

                    const regionUserName =

                        regionUserData.userName ||

                        regionUserData.name ||

                        loginId;


                    // ==================================
                    // REGION USER ACCESS
                    // ==================================

                    const regionUserAccess =

                        Array.isArray(
                            regionUserData.access
                        )

                            ? regionUserData.access

                            : [];


                    // ==================================
                    // SAVE LOGIN SESSION
                    // ==================================

                    localStorage.setItem(
                        "loggedInEmpCode",
                        loginId
                    );


                    // IMPORTANT:
                    // Region User pages check
                    // "regionuser"
                    localStorage.setItem(
                        "userRole",
                        "regionuser"
                    );


                    localStorage.setItem(
                        "regionUserName",
                        regionUserName
                    );


                    localStorage.setItem(
                        "regionUserAccess",
                        JSON.stringify(
                            regionUserAccess
                        )
                    );


                    // ==================================
                    // REMOVE OTHER USER DATA
                    // ==================================

                    localStorage.removeItem(
                        "userName"
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


                // ==================================
                // TEACHER DOCUMENT
                //
                // Collection = employees
                // Document ID = Employee Code
                // ==================================

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


                // ==================================
                // EMPLOYEE NOT FOUND
                // ==================================

                if (
                    !employeeSnap.exists()
                ) {

                    showMessage(
                        "User / Employee Code not found!"
                    );

                    return;

                }


                const employeeData =
                    employeeSnap.data();


                console.log(
                    "Teacher Found:",
                    employeeData
                );


                // ==================================
                // TEACHER PASSWORD
                // ==================================

                const teacherPassword =
                    String(
                        employeeData.password ||
                        ""
                    ).trim();


                if (
                    teacherPassword !==
                    password
                ) {

                    showMessage(
                        "Wrong Password!"
                    );

                    return;

                }


                // ==================================
                // TEACHER APPROVAL
                // ==================================

                const teacherStatus =
                    String(
                        employeeData.status ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    teacherStatus !==
                    "approved"
                ) {

                    showMessage(
                        "Aapka account Admin Approval ke liye pending hai!"
                    );

                    return;

                }


                // ==================================
                // TEACHER LOGIN SUCCESS
                // ==================================

                localStorage.setItem(
                    "loggedInEmpCode",
                    loginId
                );


                localStorage.setItem(
                    "userRole",
                    "teacher"
                );


                // ==================================
                // TEACHER NAME
                // ==================================

                const teacherName =

                    employeeData.teacherName ||

                    employeeData.teacher_name ||

                    employeeData.name ||

                    "";


                localStorage.setItem(
                    "userName",
                    teacherName
                );


                // ==================================
                // REMOVE REGION USER DATA
                // ==================================

                localStorage.removeItem(
                    "regionUserName"
                );

                localStorage.removeItem(
                    "regionUserAccess"
                );


                // ==================================
                // TEACHER → DAILY COLLECTION
                // ==================================

                window.location.href =
                    "daily-entry.html";

            }

            catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                // ==================================
                // FIREBASE ERROR
                // ==================================

                showMessage(
                    "Login Error: " +
                    error.message
                );

            }

        }
    );

}
