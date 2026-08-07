// ======================================
// Telethon Admin Dashboard
// Live Firebase Collection Data
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Dashboard Elements
// ======================================

const totalAmountEl = document.getElementById("totalAmount");
const todayAmountEl = document.getElementById("todayAmount");
const totalEntriesCountEl = document.getElementById("totalEntriesCount");
const entriesTableBody = document.getElementById("entriesTableBody");


// ======================================
// Get Today's Date
// India Local Date
// ======================================

function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ======================================
// Load Dashboard Data
// ======================================

async function loadDashboardData() {

    try {

        // ----------------------------------
        // Load Employees
        // ----------------------------------

        const employeesSnapshot =
            await getDocs(
                collection(db, "employees")
            );


        // ----------------------------------
        // Create Employee Map
        // ----------------------------------

        const employeesMap = {};


        employeesSnapshot.forEach((docSnap) => {

            const employee = docSnap.data();

            const code =
                String(
                    employee.employeeCode ||
                    employee.employee_code ||
                    docSnap.id
                ).trim();


            if (code) {

                employeesMap[code] = employee;

            }

        });


        // ----------------------------------
        // Load Daily Entries
        // ----------------------------------

        const entriesSnapshot =
            await getDocs(
                collection(db, "daily_entry")
            );


        let entries = [];


        entriesSnapshot.forEach((docSnap) => {

            const data = docSnap.data();

            entries.push({
                id: docSnap.id,
                ...data
            });

        });


        // ----------------------------------
        // Sort Newest First
        // ----------------------------------

        entries.sort((a, b) => {

            const dateA =
                a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : new Date(a.date || 0).getTime();

            const dateB =
                b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : new Date(b.date || 0).getTime();

            return dateB - dateA;

        });


        // ----------------------------------
        // Empty Check
        // ----------------------------------

        if (entries.length === 0) {

            if (totalAmountEl) {
                totalAmountEl.textContent = "₹ 0";
            }

            if (todayAmountEl) {
                todayAmountEl.textContent = "₹ 0";
            }

            if (totalEntriesCountEl) {
                totalEntriesCountEl.textContent = "0";
            }

            if (entriesTableBody) {

                entriesTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-data">
                            Koi collection entry nahi mili.
                        </td>
                    </tr>
                `;

            }

            return;

        }


        // ==================================
        // Calculate Totals
        // ==================================

        let totalCollection = 0;
        let todayCollection = 0;

        const todayStr = getTodayDate();


        // ==================================
        // Create Table
        // ==================================

        let tableRowsHTML = "";


        entries.forEach((data) => {


            // ----------------------------------
            // Amount
            // ----------------------------------

            const amount =
                Number(data.amount) || 0;


            totalCollection += amount;


            // ----------------------------------
            // Today's Collection
            // ----------------------------------

            if (data.date === todayStr) {

                todayCollection += amount;

            }


            // ----------------------------------
            // Employee Code
            // Firebase field:
            // employee_code
            // ----------------------------------

            const employeeCode =
                String(
                    data.employee_code ||
                    data.employeeCode ||
                    ""
                ).trim();


            // ----------------------------------
            // Find Employee
            // ----------------------------------

            const employee =
                employeesMap[employeeCode] || {};


            // ----------------------------------
            // Teacher Name
            // First daily_entry
            // Then employees collection
            // ----------------------------------

            const teacherName =
                data.teacher_name ||
                data.teacherName ||
                employee.teacherName ||
                employee.teacher_name ||
                "-";


            // ----------------------------------
            // Jamiatul Madina
            // ----------------------------------

            const jamiatulMadina =
                data.jamiatul_madina ||
                data.jamiatulMadina ||
                employee.jamiatulMadina ||
                employee.jamiatul_madina ||
                "-";


            // ----------------------------------
            // City
            // ----------------------------------

            const city =
                data.city ||
                employee.city ||
                "-";


            // ----------------------------------
            // State
            // ----------------------------------

            const state =
                data.state ||
                employee.state ||
                "-";


            // ----------------------------------
            // Region
            // ----------------------------------

            const region =
                data.region ||
                employee.region ||
                "-";


            // ----------------------------------
            // Date
            // ----------------------------------

            const entryDate =
                data.date || "-";


            // ----------------------------------
            // Table Row
            // ----------------------------------

            tableRowsHTML += `
                <tr>

                    <td>
                        ${entryDate}
                    </td>

                    <td>
                        <b>
                            ${employeeCode || "-"}
                        </b>
                    </td>

                    <td>
                        ${teacherName}
                    </td>

                    <td>
                        ${jamiatulMadina}
                    </td>

                    <td>
                        ${city}, ${state}
                    </td>

                    <td>
                        ${region}
                    </td>

                    <td
                        style="
                            color:#10b981;
                            font-weight:bold;
                        "
                    >
                        ₹ ${amount.toLocaleString("en-IN")}
                    </td>

                </tr>
            `;

        });


        // ==================================
        // Update Summary Cards
        // ==================================

        if (totalAmountEl) {

            totalAmountEl.textContent =
                `₹ ${totalCollection.toLocaleString("en-IN")}`;

        }


        if (todayAmountEl) {

            todayAmountEl.textContent =
                `₹ ${todayCollection.toLocaleString("en-IN")}`;

        }


        if (totalEntriesCountEl) {

            totalEntriesCountEl.textContent =
                entries.length;

        }


        // ==================================
        // Update Table
        // ==================================

        if (entriesTableBody) {

            entriesTableBody.innerHTML =
                tableRowsHTML;

        }


    } catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );


        if (entriesTableBody) {

            entriesTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="no-data"
                        style="color:red;"
                    >
                        Dashboard data load karne me error aaya.
                        <br>
                        ${error.message}
                    </td>
                </tr>
            `;

        }

    }

}


// ======================================
// Admin Logout
// ======================================

const logoutBtn =
    document.getElementById("adminLogoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "loggedInEmpCode"
            );

            localStorage.removeItem(
                "userRole"
            );

            window.location.href =
                "index.html";

        }
    );

}


// ======================================
// Load Dashboard
// ======================================

loadDashboardData();
