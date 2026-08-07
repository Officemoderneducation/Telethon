// ======================================
// Daily Entry JS
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

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

const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

const employeeBadge = document.getElementById("employeeBadge");
const badgeTeacher = document.getElementById("badgeTeacher");
const badgeMadina = document.getElementById("badgeMadina");
const badgeLocation = document.getElementById("badgeLocation");

const dailyEntryForm = document.getElementById("dailyEntryForm");
const entryDate = document.getElementById("entryDate");
const amount = document.getElementById("amount");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");


// ======================================
// Set Today's Date
// ======================================

const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

if (entryDate) {
    entryDate.value = `${year}-${month}-${day}`;
}


// ======================================
// Employee Data
// ======================================

let currentEmployee = null;


// ======================================
// Check Login
// ======================================

onAuthStateChanged(auth, async (user) => {

    try {

        // Firebase Authentication user
        if (user) {

            const empCode =
                localStorage.getItem("loggedInEmpCode");

            if (!empCode) {
                window.location.href = "login.html";
                return;
            }

            await loadEmployee(empCode);

        } else {

            // Your current login system also uses localStorage
            const empCode =
                localStorage.getItem("loggedInEmpCode");

            if (!empCode) {
                window.location.href = "login.html";
                return;
            }

            await loadEmployee(empCode);
        }

    } catch (error) {

        console.error("Authentication Error:", error);

        if (userInfo) {
            userInfo.textContent = "Error loading user";
        }
    }

});


// ======================================
// Load Employee Details
// ======================================

async function loadEmployee(empCode) {

    try {

        const employeeRef = doc(
            db,
            "employees",
            empCode
        );

        const employeeSnap = await getDoc(employeeRef);

        if (!employeeSnap.exists()) {

            if (userInfo) {
                userInfo.textContent = "Employee not found";
            }

            console.error(
                "Employee not found:",
                empCode
            );

            return;
        }

        const data = employeeSnap.data();

        currentEmployee = {
            employeeCode: empCode,
            ...data
        };


        // ==================================
        // Header
        // ==================================

        if (userInfo) {

            userInfo.textContent =
                data.teacher_name ||
                data.name ||
                empCode;
        }


        // ==================================
        // Employee Badge
        // ==================================

        if (employeeBadge) {
            employeeBadge.style.display = "block";
        }


        if (badgeTeacher) {

            badgeTeacher.textContent =
                "Teacher: " +
                (
                    data.teacher_name ||
                    data.name ||
                    "-"
                );
        }


        if (badgeMadina) {

            badgeMadina.textContent =
                "Jamiatul Madina: " +
                (
                    data.jamiatul_madina ||
                    "-"
                );
        }


        if (badgeLocation) {

            const locationParts = [];

            if (data.city) {
                locationParts.push(data.city);
            }

            if (data.state) {
                locationParts.push(data.state);
            }

            if (data.region) {
                locationParts.push(data.region);
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
        async (e) => {

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
                Number(amount.value);


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

            submitBtn.disabled = true;

            submitBtn.textContent =
                "Saving...";


            try {

                // ==================================
                // Save to Firestore
                // ==================================

                await addDoc(
                    collection(db, "daily_entry"),
                    {

                        employee_code:
                            currentEmployee.employeeCode,

                        teacher_name:
                            currentEmployee.teacher_name ||
                            currentEmployee.name ||
                            "",

                        jamiatul_madina:
                            currentEmployee.jamiatul_madina ||
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


                // Clear amount
                amount.value = "";


                // Keep today's date
                entryDate.value =
                    selectedDate;


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

                submitBtn.disabled = false;

                submitBtn.textContent =
                    "Submit Collection";
            }

        }
    );
}


// ======================================
// Logout
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "Firebase Logout Error:",
                    error
                );

            } finally {

                localStorage.removeItem(
                    "loggedInEmpCode"
                );

                localStorage.removeItem(
                    "userRole"
                );

                window.location.href =
                    "login.html";
            }

        }
    );
}


// ======================================
// Show Message
// ======================================

function showMessage(text, type) {

    if (!message) {
        return;
    }

    message.textContent = text;

    if (type === "success") {

        message.style.color = "green";

    } else {

        message.style.color = "red";
    }
}
