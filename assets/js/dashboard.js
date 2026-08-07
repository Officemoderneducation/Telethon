// ======================================
// Dashboard JS - Admin Dashboard
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

        const entriesQuery = query(
            collection(db, "daily_entry"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot =
            await getDocs(entriesQuery);


        let totalCollection = 0;
        let todayCollection = 0;
        let totalCount = 0;


        // Today's date
        const todayStr =
            new Date().toISOString().split("T")[0];


        let tableRowsHTML = "";


        // ==================================
        // No Entries
        // ==================================

        if (querySnapshot.empty) {

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
        // Process Entries
        // ==================================

        querySnapshot.forEach((docSnapshot) => {

            const data = docSnapshot.data();


            // Amount
            const amount =
                Number(data.amount) || 0;


            totalCollection += amount;

            totalCount++;


            // Today's Collection
            if (data.date === todayStr) {
                todayCollection += amount;
            }


            // Employee Code
            const employeeCode =
                data.employeeCode ||
                data.empCode ||
                "-";


            // Teacher Name
            const teacherName =
                data.teacherName ||
                "-";


            // Jamiatul Madina
            const jamiatuMadina =
                data.jamiatuMadina ||
                data.jamiatulMadina ||
                "-";


            // City
            const city =
                data.city ||
                "-";


            // State
            const state =
                data.state ||
                "-";


            // Region
            const region =
                data.region ||
                "-";


            // Date
            const date =
                data.date ||
                "-";


            // ==================================
            // Table Row
            // ==================================

            tableRowsHTML += `
                <tr>

                    <td>
                        ${date}
                    </td>

                    <td>
                        <b>
                            ${employeeCode}
                        </b>
                    </td>

                    <td>
                        ${teacherName}
                    </td>

                    <td>
                        ${jamiatuMadina}
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
        // Update Total Collection
        // ==================================

        if (totalAmountEl) {

            totalAmountEl.textContent =
                `₹ ${totalCollection.toLocaleString("en-IN")}`;
        }


        // ==================================
        // Update Today's Collection
        // ==================================

        if (todayAmountEl) {

            todayAmountEl.textContent =
                `₹ ${todayCollection.toLocaleString("en-IN")}`;
        }


        // ==================================
        // Update Total Entries
        // ==================================

        if (totalEntriesCountEl) {

            totalEntriesCountEl.textContent =
                totalCount;
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
// Start Dashboard
// ======================================

loadDashboardData();
