// ======================================
// Telethon Admin Dashboard
// Latest Entry Per Employee + Date
// Missing Employee Code = Ignore
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

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// ======================================
// Today's Date
// ======================================

function getTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

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
        // Latest Entry Per Employee + Date
        // ======================================

        const latestEntries = new Map();


        querySnapshot.forEach((docSnap) => {

            const data = docSnap.data();


            // ======================================
            // Employee Code
            // ======================================

            const empCode =
                String(
                    data.employee_code ||
                    data.empCode ||
                    ""
                ).trim();


            // ======================================
            // IMPORTANT:
            // Employee Code missing = Ignore
            // ======================================

            if (!empCode) {
                return;
            }


            // ======================================
            // Date
            // ======================================

            const date =
                String(
                    data.date || ""
                ).trim();


            // Date missing = Ignore
            if (!date) {
                return;
            }


            // ======================================
            // Unique Key
            // Employee Code + Date
            // ======================================

            const uniqueKey =
                `${empCode}_${date}`;


            /*
                createdAt DESC hai.

                Isliye sabse pehle latest entry
                milegi.

                Agar same Employee Code + Date
                ki entry already Map me hai,
                to purani/latest ke baad wali
                entry ko ignore karenge.
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
        // No Valid Data
        // ======================================

        if (latestEntries.size === 0) {

            if (totalAmountEl) {

                totalAmountEl.textContent =
                    "₹ 0";

            }

            if (todayAmountEl) {

                todayAmountEl.textContent =
                    "₹ 0";

            }

            if (totalEntriesCountEl) {

                totalEntriesCountEl.textContent =
                    "0";

            }

            if (entriesTableBody) {

                entriesTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="no-data"
                        >
                            Koi valid collection entry nahi mili.
                        </td>
                    </tr>
                `;

            }

            return;
        }


        // ======================================
        // Create Table Rows
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
                data.empCode;


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
                        ${data.date}
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
        // Update Total Collection
        // ======================================

        if (totalAmountEl) {

            totalAmountEl.textContent =
                `₹ ${totalCollection.toLocaleString("en-IN")}`;

        }


        // ======================================
        // Update Today's Collection
        // ======================================

        if (todayAmountEl) {

            todayAmountEl.textContent =
                `₹ ${todayCollection.toLocaleString("en-IN")}`;

        }


        // ======================================
        // Update Total Entries
        // ======================================

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
// Start Dashboard
// ======================================

loadDashboardData();
