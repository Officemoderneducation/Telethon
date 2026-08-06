// ======================================
// Dashboard JS - Firebase Firestore
// ======================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Helper: Get Today's Date (YYYY-MM-DD)
// ======================================
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// ======================================
// Check Login Status
// ======================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    loadDashboard();
});


// ======================================
// Load Dashboard Data
// ======================================
async function loadDashboard() {
    try {
        // ---------------------------------
        // 1. Employees Data
        // ---------------------------------
        const employeeSnapshot = await getDocs(collection(db, "employees"));
        let totalTarget = 0;

        employeeSnapshot.forEach((doc) => {
            const data = doc.data();
            totalTarget += Number(data.target || 0);
        });

        // Set UI for Employees
        const totalUsersEl = document.getElementById("totalUsers");
        const totalTargetEl = document.getElementById("totalTarget");

        if (totalUsersEl) totalUsersEl.textContent = employeeSnapshot.size;
        if (totalTargetEl) totalTargetEl.textContent = "₹ " + totalTarget.toLocaleString("en-IN");


        // ---------------------------------
        // 2. Daily Collection Data & Today Filter
        // ---------------------------------
        const collectionRef = collection(db, "daily_entry");
        const q = query(collectionRef, orderBy("date", "desc"));
        
        let entrySnapshot;
        try {
            entrySnapshot = await getDocs(q);
        } catch (e) {
            console.warn("Sorting failed, fetching un-ordered data:", e);
            entrySnapshot = await getDocs(collectionRef);
        }

        let totalCollection = 0;
        let todayCollection = 0;
        const todayDateStr = getTodayDateString();

        const recentTable = document.getElementById("recentTable");
        let tableRowsHTML = "";

        entrySnapshot.forEach((doc) => {
            const data = doc.data();
            const amount = Number(data.amount || 0);
            
            // Total Lifetime
            totalCollection += amount;

            // Today's Collection
            if (data.date === todayDateStr) {
                todayCollection += amount;
            }

            // Build HTML Rows
            tableRowsHTML += `
                <tr>
                    <td>${data.date || "-"}</td>
                    <td>${data.teacherName || "-"}</td>
                    <td>${data.region || "-"}</td>
                    <td>₹ ${amount.toLocaleString("en-IN")}</td>
                    <td>${data.status || "Success"}</td>
                </tr>
            `;
        });

        // Set Collection UI
        const totalCollectionEl = document.getElementById("totalCollection");
        if (totalCollectionEl) {
            totalCollectionEl.textContent = "₹ " + totalCollection.toLocaleString("en-IN");
        }

        const todayCollectionEl = document.getElementById("todayCollection");
        if (todayCollectionEl) {
            todayCollectionEl.textContent = "₹ " + todayCollection.toLocaleString("en-IN");
        }

        // Render Table Rows
        if (recentTable) {
            if (entrySnapshot.empty) {
                recentTable.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;">No Records Found</td>
                    </tr>
                `;
            } else {
                recentTable.innerHTML = tableRowsHTML;
            }
        }

        console.log("Dashboard Metrics Loaded Successfully.");

    } catch (error) {
        console.error("Dashboard Loading Error:", error);
    }
}


// ======================================
// Logout Action
// ======================================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}

console.log("Dashboard Loaded Successfully");
