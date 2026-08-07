// ======================================
// Telethon Admin Dashboard
// Latest Entry Per Employee + Date
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// HTML Elements
// ======================================

const totalAmountEl = document.getElementById("totalAmount");
const todayAmountEl = document.getElementById("todayAmount");
const totalEntriesCountEl = document.getElementById("totalEntriesCount");
const entriesTableBody = document.getElementById("entriesTableBody");


// ======================================
// Get Today's Date
// ======================================

function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ======================================
// Load Dashboard Data
// ======================================

async function loadDashboardData() {

    try {

        const entriesQuery = query(
            collection(db, "daily_entry"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot =
            await getDocs(entriesQuery);


        // ======================================
        // Store Latest Entry
        // Employee Code + Date
        // ======================================

        const latestEntries = new Map();


        querySnapshot.forEach((docSnap) => {

            const data = docSnap.data();


            // Employee Code
            const empCode =
                String(
                    data.employee_code ||
                    data.empCode ||
                    ""
                ).trim();


            // Date
            const date =
                String(
                    data.date || ""
                ).trim();


            // ======================================
            // Unique Key
            // ======================================

            const uniqueKey =
                `${empCode}_${date}`;


            /*
                Query createdAt DESC hai.

                Isliye sabse pehle jo entry milegi
                woh sabse latest entry hogi.

                Map me agar already entry hai,
                to usko dobara add nahi karenge.
            */

            if (!latestEntries.has(uniqueKey)) {

                latestEntries.set(
                    uniqueKey,
                    data
                );

            }

        });


        // ======================================
        // Calculate Totals
        // ======================================

        let totalCollection = 0;

        let todayCollection = 0;

        let totalCount = 0;

        const todayStr =
            getTodayDate();


        let tableRowsHTML = "";


        // ======================================
        // No Data
        // ======================================

        if (latestEntries.size === 0) {

            if (entriesTableBody) {

                entriesTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="no-data"
                        >
                            Koi collection entry nahi mili.
                        </td>
                    </tr>
                `;

            }

            if (totalAmountEl) {
                totalAmountEl.textContent = "₹ 0";
            }

            if (todayAmountEl) {
                todayAmountEl.textContent = "₹ 0";
            }

            if (totalEntriesCountEl) {
                totalEntriesCountEl.textContent = "0";
            }

            return;
        }


        // ======================================
        // Create Table
        // ======================================

        latestEntries.forEach((data) => {


            // ======================================
            // Amount
            // ======================================

            const amount =
                Number(data.amount) || 0;


            totalCollection += amount;

            totalCount++;


            // ======================================
            // Today's Collection
            // ======================================

            if (data.date === todayStr) {

                todayCollection += amount;

            }


            // ======================================
            // Employee Code
            // ======================================

            const empCode =
                data.employee_code ||
                data.empCode ||
                "-";


            // ======================================
            // Teacher Name
            // ======================================

            const teacherName =
                data.teacher_name ||
                data.teacherName ||
                "-";


            // ======================================
            // Jamiatul Madina
            // ======================================

            const jamiatulMadina =
                data.jamiatul_madina ||
                data.jamiatulMadina ||
                "-";


            // ======================================
            // City
            // ======================================

            const city =
                data.city || "-";


            // ======================================
            // State
            // ======================================

            const state =
                data.state || "-";


            // ======================================
            // Region
            // ======================================

            const region =
                data.region || "-";


            // ======================================
            // Table Row
            // ======================================

            tableRowsHTML += `
                <tr>

                    <td>
                        ${data.date || "-"}
                    </td>

                    <td>
                        <b>${empCode}</b>
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


        // ======================================
        // Update Summary Cards
        // ======================================

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
                totalCount;

        }


        // ======================================
        // Update Table
        // ======================================

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
                        Data load karne me error aaya.
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
