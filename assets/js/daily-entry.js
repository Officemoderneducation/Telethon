// ======================================
// Telethon - Daily Entry JS
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
    query,
    where,
    getDocs,
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
// PERFORMANCE SUMMARY ELEMENTS
// ======================================

const totalCollectionElement =
    document.getElementById("totalCollection");

const targetAmountElement =
    document.getElementById("targetAmount");

const remainingTargetElement =
    document.getElementById("remainingTarget");

const collectionPercentageElement =
    document.getElementById("collectionPercentage");

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

onAuthStateChanged(auth, async () => {

    try {

        const empCode =
            localStorage.getItem(
                "loggedInEmpCode"
            );

        if (!empCode) {

            window.location.href =
                "login.html";

            return;
        }

        await loadEmployee(empCode);

        // ==================================
        // Load Performance
        // ==================================

        await loadPerformance(empCode);

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

});

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
            await getDoc(
                employeeRef
            );

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
                data.teacherName ||
                data.teacher_name ||
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
                    data.teacherName ||
                    data.teacher_name ||
                    "-"
                );

        }

        // ==================================
        // Jamiatul Madina
        // ==================================

        if (badgeMadina) {

            const madinaName =
                data.jamiatuMadina ||
                data.jamiatulMadina ||
                data.jamiatul_madina ||
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
// LOAD PERFORMANCE
// ======================================

async function loadPerformance(empCode) {

    try {

        console.log(
            "Loading performance for:",
            empCode
        );

        // ==================================
        // GET EMPLOYEE TARGET
        // ==================================

        const employeeRef =
            doc(
                db,
                "employees",
                empCode
            );

        const employeeSnap =
            await getDoc(
                employeeRef
            );

        let target = 0;

        if (employeeSnap.exists()) {

            const employeeData =
                employeeSnap.data();

            target =
                Number(
                    employeeData.targetAmount ??
                    employeeData.target ??
                    employeeData.target_amount ??
                    employeeData.Target ??
                    0
                );

            console.log(
                "Employee Target:",
                target
            );

        }

        // ==================================
        // GET DAILY COLLECTION ENTRIES
        // ==================================

        const dailyEntryQuery =
            query(
                collection(
                    db,
                    "daily_entry"
                ),
                where(
                    "employeeCode",
                    "==",
                    empCode
                )
            );

        const dailyEntrySnapshot =
            await getDocs(
                dailyEntryQuery
            );

        // ==================================
        // IMPORTANT
        // Same Employee + Same Date
        // Sirf LAST entry count hogi
        // ==================================

        const latestEntriesByDate = {};

        dailyEntrySnapshot.forEach(
            (entryDoc) => {

                const data =
                    entryDoc.data();

                const entryDate =
                    data.date;

                if (!entryDate) {
                    return;
                }

                // ----------------------------------
                // CreatedAt ko compare karne ke liye
                // ----------------------------------

                let createdTime = 0;

                if (
                    data.createdAt &&
                    typeof data.createdAt.toMillis ===
                        "function"
                ) {

                    createdTime =
                        data.createdAt.toMillis();

                }

                // ----------------------------------
                // Agar same date ki entry pehle se hai
                // to latest entry rakhenge
                // ----------------------------------

                if (
                    !latestEntriesByDate[entryDate]
                ) {

                    latestEntriesByDate[entryDate] = {

                        amount:
                            Number(
                                data.amount || 0
                            ),

                        createdTime:
                            createdTime

                    };

                } else {

                    const existing =
                        latestEntriesByDate[
                            entryDate
                        ];

                    if (
                        createdTime >=
                        existing.createdTime
                    ) {

                        latestEntriesByDate[
                            entryDate
                        ] = {

                            amount:
                                Number(
                                    data.amount || 0
                                ),

                            createdTime:
                                createdTime

                        };

                    }

                }

            }
        );

        // ==================================
        // TOTAL COLLECTION
        // ==================================

        let totalCollection = 0;

        Object.keys(
            latestEntriesByDate
        ).forEach(
            (date) => {

                totalCollection +=
                    Number(
                        latestEntriesByDate[
                            date
                        ].amount || 0
                    );

            }
        );

        console.log(
            "Latest Entry Per Date:",
            latestEntriesByDate
        );

        console.log(
            "Total Collection:",
            totalCollection
        );

        // ==================================
        // REMAINING TARGET
        // ==================================

        let remainingTarget =
            target -
            totalCollection;

        if (remainingTarget < 0) {

            remainingTarget = 0;

        }

        // ==================================
        // PERCENTAGE
        // ==================================

        let percentage = 0;

        if (target > 0) {

            percentage =
                (
                    totalCollection /
                    target
                ) * 100;

        }

        // Maximum 100% display

        if (percentage > 100) {

            percentage = 100;

        }

        // ==================================
        // SHOW VALUES
        // ==================================

        if (totalCollectionElement) {

            totalCollectionElement.textContent =
                "₹ " +
                formatNumber(
                    totalCollection
                );

        }

        if (targetAmountElement) {

            targetAmountElement.textContent =
                "₹ " +
                formatNumber(
                    target
                );

        }

        if (remainingTargetElement) {

            remainingTargetElement.textContent =
                "₹ " +
                formatNumber(
                    remainingTarget
                );

        }

        if (collectionPercentageElement) {

            collectionPercentageElement.textContent =
                percentage.toFixed(2) +
                "%";

        }

    } catch (error) {

        console.error(
            "Performance Loading Error:",
            error
        );

        if (totalCollectionElement) {

            totalCollectionElement.textContent =
                "₹ 0";

        }

        if (targetAmountElement) {

            targetAmountElement.textContent =
                "₹ 0";

        }

        if (remainingTargetElement) {

            remainingTargetElement.textContent =
                "₹ 0";

        }

        if (collectionPercentageElement) {

            collectionPercentageElement.textContent =
                "0%";

        }

    }

}

// ======================================
// Number Formatting
// ======================================

function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString("en-IN");

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

            submitBtn.disabled =
                true;

            submitBtn.textContent =
                "Saving...";

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

                        employeeCode:
                            currentEmployee.employeeCode,

                        teacherName:
                            currentEmployee.teacherName ||
                            currentEmployee.teacher_name ||
                            "",

                        jamiatuMadina:
                            currentEmployee.jamiatuMadina ||
                            currentEmployee.jamiatulMadina ||
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
                // Success Message
                // ==================================

                showMessage(
                    "Collection submitted successfully!",
                    "success"
                );

                // Clear Amount

                amount.value = "";

                // ==================================
                // REFRESH PERFORMANCE
                // ==================================

                await loadPerformance(
                    currentEmployee.employeeCode
                );

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

                submitBtn.disabled =
                    false;

                submitBtn.textContent =
                    "Submit Collection";

            }

        }
    );

}

// ======================================
// Logout Function
// ======================================

async function logoutUser() {

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
            "index.html";

    }

}

// ======================================
// Sidebar Logout
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();

            await logoutUser();

        }
    );

}

// ======================================
// Top Logout
// ======================================

if (logoutBtnTop) {

    logoutBtnTop.addEventListener(
        "click",
        async () => {

            await logoutUser();

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
