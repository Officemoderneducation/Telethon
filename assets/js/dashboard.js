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

        // Set Employees UI
        const totalUsersEl = document.getElementById("totalUsers");
        const totalTargetEl = document.getElementById("totalTarget");

        if (totalUsersEl) totalUsersEl.textContent = employeeSnapshot.size;
        if (totalTargetEl) totalTargetEl.textContent = "₹ " + totalTarget.toLocaleString("en-IN");


        // ---------------------------------
        // 2. Daily Collection Data
        // ---------------------------------
        // Latest Date entries pehle aayengi
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
        const recentTable = document.getElementById("recentTable");
        let tableRowsHTML = "";

        entrySnapshot.forEach((doc) => {
            const data = doc.data();
            const amount = Number(data.amount || 0);
            
            totalCollection += amount;

            // Performance optimization ke liye HTML string
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

        // Render Table Once
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

        // Console Check
        console.log("Dashboard Metrics Loaded:", {
            users: employeeSnapshot.size,
            target: totalTarget,
            collection: totalCollection
        });

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
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}

console.log("Dashboard Loaded Successfully");
