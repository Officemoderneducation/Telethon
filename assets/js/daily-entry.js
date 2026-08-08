// ======================================
// Telethon - Daily Entry JS
// ======================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const userInfo =
    document.getElementById("userInfo");

const logoutBtn =
    document.getElementById("logoutBtn");

const logoutBtnTop =
    document.getElementById("logoutBtnTop");

const employeeBadge =
    document.getElementById("employeeBadge");

const badgeTeacher =
    document.getElementById("badgeTeacher");

const badgeMadina =
    document.getElementById("badgeMadina");

const badgeLocation =
    document.getElementById("badgeLocation");

const dailyEntryForm =
    document.getElementById("dailyEntryForm");

const entryDate =
    document.getElementById("entryDate");

const amount =
    document.getElementById("amount");

const submitBtn =
    document.getElementById("submitBtn");

const message =
    document.getElementById("message");


// ======================================
// Set Today's Date
// ======================================

const today = new Date();

const year =
    today.getFullYear();

const month =
    String(today.getMonth() + 1)
        .padStart(2, "0");

const day =
    String(today.getDate())
        .padStart(2, "0");

if (entryDate) {

    entryDate.value =
        `${year}-${month}-${day}`;

}


// ======================================
// Current Employee
// ======================================

let currentEmployee = null;


// ======================================
// Check Login
// ======================================

async function checkLogin() {

    try {

        const empCode =
            localStorage.getItem(
                "loggedInEmpCode"
            );

        const userRole =
            localStorage.getItem(
                "userRole"
            );


        // ==================================
        // No Login
        // ==================================

        if (!empCode || !userRole) {

            window.location.href =
                "index.html";

            return;

        }


        // ==================================
        // Admin ko Daily Entry par allow nahi
        // ==================================

        if (userRole === "admin") {

            window.location.href =
                "dashboard.html";

            return;

        }


        // ==================================
        // Sirf Teacher allowed
        // ==================================

        if (userRole !== "teacher") {

            localStorage.clear();

            window.location.href =
                "index.html";

            return;

        }


        // ==================================
        // Load Teacher
        // ==================================

        await loadEmployee(empCode);


    } catch (error) {

        console.error(
            "Authentication Error:",
            error
        );

        if (userInfo) {

            userInfo.textContent =
                "Error loading user";

        }

    }

}


// ======================================
// Load Employee Details
// ======================================

async function loadEmployee(empCode) {

    try {

        const employeeRef =
            doc(
                db,
                "employees",
                empCode
            );


        const employeeSnap =
            await getDoc(employeeRef);


        if (!employeeSnap.exists()) {

            if (userInfo) {

                userInfo.textContent =
                    "Employee not found";

            }

            console.error(
                "Employee not found:",
                empCode
            );

            return;

        }


        const data =
            employeeSnap.data();


        currentEmployee = {

            employeeCode:
                empCode,

            ...data

        };


        // ==================================
        // Header - Teacher Name
        // ==================================

        if (userInfo) {

            userInfo.textContent =
                data.teacher_name ||
                data.teacherName ||
                data.employee_code ||
                data.employeeCode ||
                empCode;

        }


        // ==================================
        // Employee Badge
        // ==================================

        if (employeeBadge) {

            employeeBadge.style.display =
                "block";

        }


        // ==================================
        // Teacher Name
        // ==================================

        if (badgeTeacher) {

            badgeTeacher.textContent =
                "Teacher: " +
                (
                    data.teacher_name ||
                    data.teacherName ||
                    "-"
                );

        }


        // ==================================
        // Jamiatul Madina
        // ==================================

        if (badgeMadina) {

            const madinaName =
                data.jamiatul_madina ||
                data.jamiatuMadina ||
                data.jamiatulMadina ||
                data.jamiatulMadinah ||
                "";

            badgeMadina.textContent =
                "Jamiatul Madina: " +
                (
                    madinaName ||
                    "-"
                );

        }


        // ==================================
        // Location
        // ==================================

        if (badgeLocation) {

            const locationParts = [];


            if (data.city) {

                locationParts.push(
                    data.city
                );

            }


            if (data.state) {

                locationParts.push(
                    data.state
                );

            }


            if (data.region) {

                locationParts.push(
                    data.region
                );

            }


            badgeLocation.textContent =
                "Location: " +
                (
                    locationParts.length
                        ? locationParts.join(", ")
                        : "-"
                );

        }


    } catch (error) {

        console.error(
            "Load Employee Error:",
            error
        );


        if (userInfo) {

            userInfo.textContent =
                "Unable to load employee";

        }

    }

}


// ======================================
// Submit Daily Collection
// ======================================

if (dailyEntryForm) {

    dailyEntryForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            // ==================================
            // Check Employee
            // ==================================

            if (!currentEmployee) {

                showMessage(
                    "Employee details not loaded!",
                    "error"
                );

                return;

            }


            // ==================================
            // Get Values
            // ==================================

            const selectedDate =
                entryDate.value;


            const collectionAmount =
                Number(
                    amount.value
                );


            // ==================================
            // Validation
            // ==================================

            if (!selectedDate) {

                showMessage(
                    "Please select date.",
                    "error"
                );

                return;

            }


            if (
                !collectionAmount ||
                collectionAmount <= 0
            ) {

                showMessage(
                    "Please enter a valid amount.",
                    "error"
                );

                return;

            }


            // ==================================
            // Disable Button
            // ==================================

            if (submitBtn) {

                submitBtn.disabled =
                    true;

                submitBtn.textContent =
                    "Saving...";

            }


            try {

                // ==================================
                // Save Daily Entry
                // ==================================

                await addDoc(
                    collection(
                        db,
                        "daily_entry"
                    ),
                    {

                        // IMPORTANT:
                        // Dashboard / Target code ke saath
                        // same field names rakhe gaye hain.

                        employee_code:
                            currentEmployee.employeeCode,

                        teacher_name:
                            currentEmployee.teacher_name ||
                            currentEmployee.teacherName ||
                            "",

                        jamiatul_madina:
                            currentEmployee.jamiatul_madina ||
                            currentEmployee.jamiatuMadina ||
                            currentEmployee.jamiatulMadina ||
                            "",

                        city:
                            currentEmployee.city ||
                            "",

                        state:
                            currentEmployee.state ||
                            "",

                        region:
                            currentEmployee.region ||
                            "",

                        date:
                            selectedDate,

                        amount:
                            collectionAmount,

                        createdAt:
                            serverTimestamp()

                    }
                );


                // ==================================
                // Success
                // ==================================

                showMessage(
                    "Collection submitted successfully!",
                    "success"
                );


                // Clear Amount

                if (amount) {

                    amount.value =
                        "";

                }


            } catch (error) {

                console.error(
                    "Daily Entry Error:",
                    error
                );


                showMessage(
                    "Failed to save: " +
                    error.message,
                    "error"
                );


            } finally {

                if (submitBtn) {

                    submitBtn.disabled =
                        false;

                    submitBtn.textContent =
                        "Submit Collection";

                }

            }

        }
    );

}


// ======================================
// LOGOUT FUNCTION
// ======================================

function logoutTeacher() {

    // Remove login information

    localStorage.removeItem(
        "loggedInEmpCode"
    );

    localStorage.removeItem(
        "userRole"
    );


    // Extra safety:
    // Remove any old login values

    localStorage.removeItem(
        "adminLoggedIn"
    );

    localStorage.removeItem(
        "teacherLoggedIn"
    );


    // ==================================
    // IMPORTANT
    // Logout ke baad MAIN login page
    // open hoga
    // ==================================

    window.location.replace(
        "index.html"
    );

}


// ======================================
// Sidebar Logout
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            logoutTeacher();

        }
    );

}


// ======================================
// Top Logout
// ======================================

if (logoutBtnTop) {

    logoutBtnTop.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            logoutTeacher();

        }
    );

}


// ======================================
// Show Message
// ======================================

function showMessage(
    text,
    type
) {

    if (!message) {

        return;

    }


    message.textContent =
        text;


    if (type === "success") {

        message.style.color =
            "green";

    } else {

        message.style.color =
            "red";

    }

}


// ======================================
// START
// ======================================

checkLogin();
