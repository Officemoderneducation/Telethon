// ======================================
// Telethon Admin Dashboard
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Elements
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
// Today Date
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
// Load Dashboard
// ======================================

async function loadDashboardData() {

    try {

        const q = query(
            collection(db, "daily_entry"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);


        // ======================================
        // Latest entry for Employee + Date
        // ======================================

        const latestEntries = new Map();


        snapshot.forEach((docSnap) => {

            const data = docSnap.data();


            // ======================================
            // Employee Code
            // ======================================

            const empCode = String(
                data.employee_code ??
                data.empCode ??
                data.employeeCode ??
                ""
            ).trim();


            // ======================================
            // IMPORTANT
            // Employee Code missing / invalid
            // entry will NOT be displayed
            // ======================================

            if (
                empCode === "" ||
                empCode === "-" ||
                empCode.toLowerCase() === "null" ||
                empCode.toLowerCase() === "undefined"
            ) {
                return;
            }


            // ======================================
            // Date
            // ======================================

            const date = String(
                data.date ?? ""
            ).trim();


            if (!date) {
                return;
            }


            // ======================================
            // Employee + Date Unique Key
            // ======================================

            const key =
                `${empCode}_${date}`;


            /*
                createdAt DESC hai.

                Isliye first entry = latest entry.

                Same Employee + Same Date ki
                purani entries ignore hongi.
            */

            if (!latestEntries.has(key)) {

                latestEntries.set(
                    key,
                    {
                        ...data,
                        empCode: empCode
                    }
                );

            }

        });


        // ======================================
        // Totals
        // ======================================

        let totalCollection = 0;

        let todayCollection = 0;

        let totalCount = 0;

        const today = getTodayDate();

        let rows = "";


        // ======================================
        // No Valid Entries
        // ======================================

        if (latestEntries.size === 0) {

            totalAmountEl.textContent = "₹ 0";

            todayAmountEl.textContent = "₹ 0";

            totalEntriesCountEl.textContent = "0";

            entriesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        Koi valid collection entry nahi mili.
                    </td>
                </tr>
            `;

            return;
        }


        // ======================================
        // Build Table
        // ======================================

        latestEntries.forEach((data) => {

            const amount =
                Number(data.amount) || 0;


            totalCollection += amount;

            totalCount++;


            // Today's collection

            if (data.date === today) {

                todayCollection += amount;

            }


            // ======================================
            // Teacher Information
            // ======================================

            const teacherName =
                data.teacher_name ||
                data.teacherName ||
                "-";


            const jamiatulMadina =
                data.jamiatul_madina ||
                data.jamiatulMadina ||
                "-";


            const city =
                data.city || "-";


            const state =
                data.state || "-";


            const region =
                data.region || "-";


            // ======================================
            // Table Row
            // ======================================

            rows += `
                <tr>

                    <td>
                        ${data.date}
                    </td>

                    <td>
                        <b>${data.empCode}</b>
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

        totalAmountEl.textContent =
            `₹ ${totalCollection.toLocaleString("en-IN")}`;


        todayAmountEl.textContent =
            `₹ ${todayCollection.toLocaleString("en-IN")}`;


        totalEntriesCountEl.textContent =
            totalCount;


        // ======================================
        // Update Table
        // ======================================

        entriesTableBody.innerHTML = rows;


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        entriesTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="no-data"
                    style="color:red;"
                >
                    Dashboard data load nahi ho saka.
                </td>
            </tr>
        `;

    }

}


// ======================================
// Logout
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
// Start
// ======================================

loadDashboardData();
