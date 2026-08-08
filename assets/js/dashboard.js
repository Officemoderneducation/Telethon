// ======================================
// ADMIN ONLY ACCESS
// ======================================

const userRole = localStorage.getItem("userRole");

if (userRole !== "admin") {

    localStorage.removeItem("loggedInEmpCode");
    localStorage.removeItem("userRole");

    window.location.href = "index.html";
}
// ======================================
// Telethon Dashboard
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

const totalAmountEl =
    document.getElementById("totalAmount");

const todayAmountEl =
    document.getElementById("todayAmount");

const totalEntriesCountEl =
    document.getElementById("totalEntriesCount");

const entriesTableBody =
    document.getElementById("entriesTableBody");


// ======================================
// Load Dashboard Data
// ======================================

async function loadDashboardData() {

    try {

        // --------------------------------------
        // Get Daily Entries
        // --------------------------------------

        const entriesQuery = query(
            collection(db, "daily_entry"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot =
            await getDocs(entriesQuery);


        // --------------------------------------
        // Store Latest Entry
        // --------------------------------------
        //
        // Key:
        // Employee Code + Date
        //
        // Example:
        // 63147_2026-08-07
        //
        // Only latest entry will remain.
        // --------------------------------------

        const latestEntries = new Map();


        querySnapshot.forEach((docSnapshot) => {

            const data = docSnapshot.data();


            // ----------------------------------
            // Actual Firestore Field Names
            // ----------------------------------

            const employeeCode =
                String(data.employee_code || "").trim();

            const date =
                String(data.date || "").trim();


            // ----------------------------------
            // Employee Code MUST exist
            // ----------------------------------

            if (!employeeCode) {
                return;
            }


            // ----------------------------------
            // Date MUST exist
            // ----------------------------------

            if (!date) {
                return;
            }


            // ----------------------------------
            // Unique Key
            // ----------------------------------

            const uniqueKey =
                `${employeeCode}_${date}`;


            // ----------------------------------
            // Because query is createdAt DESC,
            // first entry is the latest one.
            // ----------------------------------

            if (!latestEntries.has(uniqueKey)) {

                latestEntries.set(
                    uniqueKey,
                    {
                        id: docSnapshot.id,
                        data: data
                    }
                );

            }

        });


        // ======================================
        // Convert Map to Array
        // ======================================

        const entries =
            Array.from(latestEntries.values());


        // ======================================
        // Sort Latest Entries by Date
        // ======================================

        entries.sort((a, b) => {

            const dateA =
                new Date(a.data.date);

            const dateB =
                new Date(b.data.date);

            return dateB - dateA;

        });


        // ======================================
        // No Data
        // ======================================

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


        // ======================================
        // Calculate Totals
        // ======================================

        let totalCollection = 0;

        let todayCollection = 0;


        // ======================================
        // Today's Date
        // ======================================

        const todayStr =
            new Date().toISOString().split("T")[0];


        // ======================================
        // Table HTML
        // ======================================

        let tableRowsHTML = "";


        // ======================================
        // Create Table
        // ======================================

        entries.forEach((entry) => {

            const data = entry.data;


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
            // Actual Firestore Fields
            // ----------------------------------

            const employeeCode =
                data.employee_code || "-";

            const teacherName =
                data.teacher_name || "-";

            const jamiatulMadina =
                data.jamiatul_madina || "-";

            const city =
                data.city || "-";

            const state =
                data.state || "-";

            const region =
                data.region || "-";

            const date =
                data.date || "-";


            // ==================================
            // Table Row
            // ==================================

            tableRowsHTML += `

                <tr>

                    <td>
                        ${date}
                    </td>

                    <td>
                        <b>${employeeCode}</b>
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
        // Update Cards
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
                entries.length;

        }


        // ======================================
        // Update Table
        // ======================================

        if (entriesTableBody) {

            entriesTableBody.innerHTML =
                tableRowsHTML;

        }


    }

    catch (error) {

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
