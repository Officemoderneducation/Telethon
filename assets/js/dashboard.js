// ======================================
// Dashboard JS - Part 1
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Check Login
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    loadDashboard();

});


// ======================================
// Load Dashboard
// ======================================

async function loadDashboard() {

    try {

        // ============================
        // Employees
        // ============================

        const employeeSnapshot = await getDocs(
            collection(db, "employees")
        );

        document.getElementById("totalUsers").textContent =
            employeeSnapshot.size;


        // ============================
        // Approved Employees
        // ============================

        let approved = 0;

        employeeSnapshot.forEach((doc) => {

            const data = doc.data();

            if (data.status === "Approved") {

                approved++;

            }

        });

        document.getElementById("totalStudents").textContent =
            approved;


        // ============================
        // Total Branches
        // ============================

        const branchSet = new Set();

        employeeSnapshot.forEach((doc) => {

            const data = doc.data();

            if (data.jamiatulMadina) {

                branchSet.add(data.jamiatulMadina);

            }

        });

        document.getElementById("totalBranches").textContent =
            branchSet.size;
                // ============================
        // Daily Entry
        // ============================

        const entrySnapshot = await getDocs(
            collection(db, "daily_entry")
        );


        // ============================
        // Total Collection
        // ============================

        let total = 0;

        const recentTable =
            document.getElementById("recentTable");

        recentTable.innerHTML = "";

        let hasData = false;


        entrySnapshot.forEach((doc) => {

            const data = doc.data();

            total += Number(data.amount || 0);

            if (!hasData) {

                recentTable.innerHTML = "";

                hasData = true;

            }

            recentTable.innerHTML += `

                <tr>

                    <td>${data.date || "-"}</td>

                    <td>${data.teacherName || "-"}</td>

                    <td>${data.region || "-"}</td>

                    <td>₹ ${Number(data.amount || 0).toLocaleString("en-IN")}</td>

                    <td>${data.status || "Success"}</td>

                </tr>

            `;

        });


        document.getElementById("totalCollection").textContent =
            "₹ " + total.toLocaleString("en-IN");


        if (!hasData) {

            recentTable.innerHTML = `

                <tr>

                    <td colspan="5" style="text-align:center;">
                        No Records Found
                    </td>

                </tr>

            `;

        }

    } catch (error) {

        console.error("Dashboard Error:", error);

    }

}
// ======================================
// Logout
// ======================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await auth.signOut();

            window.location.href = "index.html";

        } catch (error) {

            console.error("Logout Error:", error);

            alert("Logout Failed!");

        }

    });

}


// ======================================
// Dashboard Loaded
// ======================================

console.log("Dashboard Loaded Successfully");
